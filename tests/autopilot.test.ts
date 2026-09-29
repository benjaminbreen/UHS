import { describe, expect, it } from "vitest";
import { createSettingSession, Runtime } from "../src/runtime/session";
import { panelSetting } from "../scripts/review/panel";
import { parsePlan, personNamed, planOf } from "../src/runtime/autopilot";
import { planFrom, routeQuestion } from "../src/runtime/router";
import { jevRoute } from "../server/jev";
import type { Evaluation } from "../src/chronicle/jev";

const world = (place: string, year: number) => {
  const engine = createSettingSession(
    { ...panelSetting(place, year), season: "summer" },
    "autopilot",
  );
  engine.state.clock = Math.floor(engine.state.clock / 86400) * 86400 + 8 * 3600;
  return engine;
};
const drive = async (runtime: Runtime, text: string, ticks: number) => {
  await runtime.say(text);
  for (let n = 0; n < ticks && runtime.autopilot; n++) runtime.tick();
  return runtime.engine.state.narration!.at(-1)!.text;
};

describe("typed errands", () => {
  const engine = world("london", 1400);

  it("reads a line as a plan, or leaves it to the narrator", () => {
    expect(parsePlan("wander around looking for berries", engine)).toEqual({
      kind: "forage",
      item: "berries",
    });
    expect(parsePlan("work for the day", engine)).toEqual({ kind: "workday" });
    expect(parsePlan("walk to the edge of the map", engine)?.kind).toBe("go");
    expect(parsePlan("head north", engine)).toMatchObject({
      kind: "go",
      label: "the northern edge of the land",
    });
    expect(parsePlan("run around", engine)).toEqual({ kind: "roam", run: true });
    expect(parsePlan("go for a stroll", engine)).toEqual({ kind: "roam", run: false });
    expect(parsePlan("ask the priest about the harvest", engine)).toBeUndefined();
  });

  it("roams out of town and comes back with berries", async () => {
    const runtime = new Runtime(engine, { cacheTerrain: false });
    const before = engine.state.player.inventory.berries ?? 0;
    const start = { ...engine.state.player.pos };
    await runtime.say("look for berries");
    for (let n = 0; n < 900 && (engine.state.player.inventory.berries ?? 0) <= before; n++)
      runtime.tick();
    expect(engine.state.player.inventory.berries ?? 0).toBeGreaterThan(before);
    const p = engine.state.player.pos;
    expect(Math.hypot(p.x - start.x, p.y - start.y)).toBeGreaterThan(5);
  });

  it("puts in a day's work and stops when it is done", async () => {
    const runtime = new Runtime(world("kyoto", 1000), { cacheTerrain: false });
    expect(await drive(runtime, "work for the day", 400)).toBe("Today's work is done.");
  });

  it("runs about for a while and stops", async () => {
    const runtime = new Runtime(world("kyoto", 1000), { cacheTerrain: false });
    const start = { ...runtime.engine.state.player.pos };
    expect(await drive(runtime, "run around", 200)).toBe("You pull up, out of breath.");
    const p = runtime.engine.state.player.pos;
    expect(p.x !== start.x || p.y !== start.y).toBe(true);
  });

  it("finds kin by relation, through the door of the house they are in", async () => {
    const runtime = new Runtime(world("kyoto", 1000), { cacheTerrain: false });
    const s = runtime.engine.state;
    const home = s.households!.find((h) => h.members.includes("player"))!.residence!;
    const parent = s.actors.find((a) => a.id === s.player.relations!.find((r) => r.kind === "parent")!.other)!;
    // Out of the routine budget, the engine parks a resident indoors and keeps them there.
    const dormant = runtime.engine.world.dormant;
    runtime.engine.world.dormant = (id) => id === parent.id || !!dormant?.(id);
    parent.pos = { x: 3, y: 3, space: home };
    expect(parsePlan("find my mother", runtime.engine)).toMatchObject({ kind: "seek", actor: parent.id });
    expect(await drive(runtime, "find my mother", 300)).toBe(`You find ${parent.name}.`);
    expect(s.player.pos.space).toBe(home);
  });

  it("guesses kin from age and sex when the household records only co-residents", () => {
    const e = world("kyoto", 1000);
    const [a, b] = e.state.actors.filter((x) => x.kind === "human" && x.id !== "player");
    e.state.player.age = 50;
    e.state.player.relations = [
      { other: a.id, kind: "co-resident" },
      { other: b.id, kind: "co-resident" },
    ];
    Object.assign(a, { age: 20, origin: { ...a.origin, sex: "male" } });
    Object.assign(b, { age: 48, origin: { ...b.origin, sex: "female" } });
    expect(personNamed("my son", e)?.id).toBe(a.id);
    expect(personNamed("my wife", e)?.id).toBe(b.id);
    expect(personNamed("my daughter", e)).toBeUndefined();
  });

  it("takes an errand from the narrator only when the world has it", () => {
    const place = engine.world.places[0];
    expect(planOf({ kind: "go", target: place.id }, engine)).toMatchObject({ kind: "go", label: place.name });
    expect(planOf({ kind: "go", target: "nowhere" }, engine)).toBeUndefined();
    expect(planOf({ kind: "forage", item: "unobtainium" }, engine)).toEqual({ kind: "forage", item: undefined });
    expect(planOf({ kind: "roam", run: true }, engine)).toEqual({ kind: "roam", run: true });
  });

  it("stops the moment the player takes a step", async () => {
    const runtime = new Runtime(world("kyoto", 1000), { cacheTerrain: false });
    await runtime.say("head north");
    runtime.tick();
    runtime.move(1, 0);
    expect(runtime.autopilot).toBeUndefined();
  });
});

describe("the Jev router", () => {
  const engine = world("london", 1400);
  const answer = (choices: Record<string, [string, number]>): Evaluation => ({
    model: "jev-test",
    usage: { input_tokens: 0, output_tokens: 0 },
    answers: Object.fromEntries(
      Object.entries(choices).map(([k, [choice, p]]) => [
        k,
        { type: "choice", choice, probabilities: { [choice]: p }, confidence: p },
      ]),
    ),
  });

  it("offers only what this world has, within Jev's limits", () => {
    const { state, questions } = routeQuestion(engine, "lol i want some mushrooms");
    for (const q of Object.values(questions))
      if (q.type === "choice") expect(Object.keys(q.criteria).length).toBeLessThanOrEqual(255);
    expect(Object.keys(questions.item.criteria)).toContain("mushroom");
    // Cost is billed on input: keep the whole payload near a thousand tokens.
    expect(JSON.stringify({ state, questions }).length / 4).toBeLessThan(1500);
  });

  it("turns confident answers into plans and doubtful ones into nothing", () => {
    const place = engine.world.places.find((p) => p.access === "public")!;
    expect(planFrom(engine, answer({ errand: ["forage", 0.9], item: ["mushroom", 0.8] }))).toEqual({
      kind: "forage",
      item: "mushroom",
    });
    expect(planFrom(engine, answer({ errand: ["go", 0.9], where: [place.id, 0.7] }))).toMatchObject({
      kind: "go",
    });
    expect(planFrom(engine, answer({ errand: ["go", 0.9], where: ["edge-west", 0.9] }))).toMatchObject({
      label: "the western edge of the land",
    });
    expect(planFrom(engine, answer({ errand: ["workday", 0.4] }))).toBeUndefined();
    expect(planFrom(engine, answer({ errand: ["none", 0.9] }))).toBeUndefined();
  });

  it("keeps the key on the server and refuses without one", async () => {
    const post = (body: unknown) =>
      new Request("http://localhost/api/jev", { method: "POST", body: JSON.stringify(body) });
    const body = routeQuestion(engine, "go gather firewood");
    expect((await jevRoute(post(body), {})).status).toBe(503);
    let sent: RequestInit | undefined;
    const stub = (async (_url: string, init: RequestInit) => {
      sent = init;
      return new Response(JSON.stringify(answer({ errand: ["forage", 0.9] })));
    }) as unknown as typeof fetch;
    const res = await jevRoute(post(body), { TYPESAFE_API_KEY: "test-key" }, stub);
    expect(res.status).toBe(200);
    expect(new Headers(sent!.headers).get("Authorization")).toBe("Bearer test-key");
  });
});
