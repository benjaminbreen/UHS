import { describe, it, expect } from "vitest";
import { z } from "zod";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { createSession, createSettingSession as createLocalSession } from "../src/runtime/session";
import { composeIntro, introText } from "../src/core/intro";
import { strictSchema } from "../server/json-schema";
import { findPath } from "../src/core/pathfinding";
import { worldWeaver } from "../server/world-weaver";
import { createAtlasWorld } from "../src/world/v2/generate";
import { packForSetting } from "../src/content/geography/pack";
// Generator v2 fixtures deliberately stay on v2 as new starts advance to v3.
const createSettingSession = (
  setting: import("../src/content/geography/types").WorldSetting,
  seed = "earth-2",
) => createSession("atlas", seed, { setting, generator: 2 });
const get = (text: string) => {
  const r = resolveSetting(text);
  if ("error" in r) throw Error(r.error);
  return r.setting;
};
describe("shared World Weaver / procedural geography", () => {
  it("resolves aliases, periods, explicit BCE dates, centuries, roles and climate treatments locally", () => {
    expect(get("Elizabethan London")).toMatchObject({
      placeId: "london",
      water: "river-ew",
    });
    expect(get("Hellenistic Alexandria")).toMatchObject({
      placeId: "alexandria",
      water: "coast-n",
    });
    expect(get("ancient roman legionary in umbria")).toMatchObject({
      placeId: "umbria",
      role: "Legionary",
      settlement: "camp",
    });
    expect(get("free black farmer in 19th century Haiti")).toMatchObject({
      placeId: "haiti",
      role: "Farmer",
      community: "Free Black household",
    });
    expect(get("paleolithic shaman siberia")).toMatchObject({
      climate: "tundra",
      settlement: "camp",
    });
    expect(get("Normandy 100 BCE").year).toBe(-99);
    expect(get("Beijing 14th century").year).toBeGreaterThanOrEqual(1301);
    expect(get("Beijing 14th century").year).toBeLessThanOrEqual(1400);
    expect(get("medieval").placeId).toBe("normandy");
    expect(resolveSetting("a place not in the catalog")).toHaveProperty(
      "error",
    );
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    for (const place of places) expect(() => settingFor(place)).not.toThrow();
    expect(get("19th-century Haiti").year).toBeGreaterThanOrEqual(1801);
    expect(get("19th-century Haiti").year).toBeLessThanOrEqual(1900);
    expect(get("Roman farmer in Haiti").placeId).toBe("haiti");
  });
  it("keeps north sea and east-west river geometry independent of request order, including negative chunks", () => {
    for (const query of [
      "Elizabethan London",
      "Hellenistic Alexandria",
      "Haiti",
      "Siberia",
    ]) {
      const setting = get(query),
        a = createSettingSession(setting, "seams"),
        b = createSettingSession(setting, "seams");
      const coords = [
        [-1, -1],
        [0, -1],
        [-1, 0],
        [0, 0],
        [1, 1],
      ];
      const chunks = coords.map(([x, y]) => a.world.chunk(x, y));
      for (const [x, y] of [...coords].reverse()) b.world.chunk(x, y);
      coords.forEach(([x, y], i) =>
        expect(b.world.chunk(x, y)).toEqual(chunks[i]),
      );
      expect(a.world.chunk(-1, 0)[63]).toBe(a.world.terrain(-1, 0));
      expect(a.world.blocked(a.world.spawn.x, a.world.spawn.y, "outside")).toBe(
        false,
      );
    }
    const alex = createSettingSession(get("Alexandria"), "sea").world;
    expect(alex.terrain(0, -250)).toBe("water");
    expect(alex.terrain(0, 80)).not.toBe("water");
    const london = createSettingSession(get("London"), "river").world;
    for (const x of [-300, -150, 0, 150, 300])
      expect(
        Array.from({ length: 130 }, (_, y) => london.terrain(x, y)).some(
          (t) => t === "water" || t === "bridge",
        ),
      ).toBe(true);
  }, 20000);
  it("has usable nearby entrances and conserves layout through worker construction", () => {
    for (const query of ["London", "Alexandria", "Haiti", "Siberia"]) {
      const setting = get(query),
        e = createSettingSession(setting, "doors");
      for (const p of e.world.places.filter((p) => Math.hypot(p.x, p.y) < 120))
        expect(
          findPath(
            e.state.player.pos,
            p.entrance,
            (x, y) => e.blocked(x, y),
            5000,
          ).length,
          p.id,
        ).toBeGreaterThan(0);
      const workerWorld = createAtlasWorld(packForSetting(setting), "doors");
      expect(workerWorld.chunk(0, 0)).toEqual(e.world.chunk(0, 0));
    }
  }, 20000);
  it("never calls a provider in free mode; protects and validates the optional World Weaver boundary", async () => {
    let calls = 0;
    const london = places.find((p) => p.id === "london")!;
    const setting = settingFor(london);
    const choice = {
      placeId: london.id,
      placeName: london.name,
      lon: london.lon,
      lat: london.lat,
      year: london.year,
      role: setting.role,
      characterName: setting.characterName,
      community: setting.community,
      climate: london.climate,
      water: london.water,
      relief: london.relief,
      culture: london.culture,
      settlement: london.settlement,
      architecture: london.architecture,
    };
    const provider = (async () => {
      calls++;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(choice) } }],
        }),
      );
    }) as typeof fetch;
    const request = (code = "class") =>
      new Request("http://local/api/world-weaver", {
        method: "POST",
        headers: { "X-World-Weaver-Code": code },
        body: JSON.stringify({ prompt: "Elizabethan London" }),
      });
    const env = {
      UHS_WORLD_WEAVER_ENABLED: "1",
      OPENAI_API_KEY: "test-key",
      UHS_WORLD_WEAVER_ACCESS_CODE: "class",
    };
    expect((await worldWeaver(request(), {}, provider)).status).toBe(503);
    expect(
      (
        await worldWeaver(
          request(),
          { OPENAI_API_KEY: "test-key", UHS_WORLD_WEAVER_ENABLED: "0" },
          provider,
        )
      ).status,
    ).toBe(503);
    expect((await worldWeaver(request("wrong"), env, provider)).status).toBe(
      401,
    );
    expect(calls).toBe(0);
    // No code configured: open to everyone.
    const open = await worldWeaver(
      new Request("http://local/api/world-weaver", {
        method: "POST",
        body: JSON.stringify({ prompt: "Elizabethan London" }),
      }),
      { OPENAI_API_KEY: "test-key" },
      provider,
    );
    expect(open.status).toBe(200);
    calls = 0;
    const response = await worldWeaver(request(), env, provider);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.setting).toEqual(setting);
    expect(calls).toBe(1);
    const named = await worldWeaver(
      new Request("http://local/api/world-weaver", {
        method: "POST",
        headers: { "X-World-Weaver-Code": "class" },
        body: JSON.stringify({ prompt: "I am Ea-Nasir in Mesopotamia, 1750 BCE" }),
      }),
      env,
      provider,
    );
    expect((await named.json()).setting.characterName).toBe("Ea-Nasir");
    const legacyRequest = new Request("http://local/api/world-weaver", {
      method: "POST",
      headers: { "X-Classroom-Code": "class" },
      body: JSON.stringify({ prompt: "Elizabethan London" }),
    });
    expect(
      (
        await worldWeaver(
          legacyRequest,
          {
            UHS_WORLD_WEAVER_ENABLED: "1",
            OPENAI_API_KEY: "test-key",
            UHS_CLASSROOM_CODE: "class",
          },
          provider,
        )
      ).status,
    ).toBe(200);
    const local = createSettingSession(setting, "parity"),
      enhanced = createSettingSession(body.setting, "parity");
    expect(local.hash()).toBe(enhanced.hash());
    const malformed = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"placeId":"london","lat":999}' } }],
        }),
      )) as typeof fetch;
    expect((await worldWeaver(request(), env, malformed)).status).toBe(502);
  });
  it("plays a named figure as themself: their work, people and aim, not a drawn trade", async () => {
    const alexandria = places.find((p) => p.id === "alexandria")!;
    const choice = {
      placeId: "alexandria", placeName: "Alexandria", lon: alexandria.lon, lat: alexandria.lat, year: -330,
      role: "king of Macedon", characterName: "Alexander", community: "the Macedonian court",
      climate: alexandria.climate, water: alexandria.water, relief: alexandria.relief, culture: alexandria.culture,
      settlement: alexandria.settlement, architecture: alexandria.architecture,
      figure: "Alexander III of Macedon", work: "ruler", sex: "male", age: 24, situation: null,
      hook: "Today you mark out the walls of your new city with barley meal.",
      aim: { text: "Conquer the Persian Empire.", reason: "You are heir to Philip's war.", means: "Lead the army east." },
      kin: [], figures: [{ name: "Hephaestion", role: "companion", sex: "male", documented: true, age: 26, tie: "closest friend" }],
      tidings: [{ text: "Darius is gathering a new army in Babylon.", documented: true }],
      moment: { where: "hall", with: ["Hephaestion"], doing: "Planning the new city" },
    };
    const provider = (async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(choice) } }] }))) as typeof fetch;
    const response = await worldWeaver(
      new Request("http://local/api/world-weaver", { method: "POST", body: JSON.stringify({ prompt: "alexander the great" }) }),
      { OPENAI_API_KEY: "test-key" },
      provider,
    );
    expect(response.status).toBe(200);
    const { setting } = await response.json();
    const engine = createLocalSession(setting, "alexander");
    const s = engine.state;
    expect(s.player.role).toBe("king of Macedon");
    expect(s.player.origin?.livelihood).toBe("ruler");
    expect(s.player.age).toBe(24);
    expect(s.lifeAim?.text).toBe("Conquer the Persian Empire.");
    const friend = s.actors.find((a) => a.name === "Hephaestion")!;
    expect(s.player.pos.space).not.toBe("outside");
    expect(friend.pos.space).toBe(s.player.pos.space);
    expect(friend.activity).toBe("Planning the new city");
    expect(friend.age).toBe(26);
    expect(friend.figure).toMatchObject({ real: true, tie: "closest friend" });
    expect(engine.workPlan()).toBeUndefined();
    expect(s.plot).toBeUndefined();
    expect(s.ailments).toEqual([]);
    const text = introText(composeIntro(s, engine.world.pack.setting, "Alexandria"));
    expect(text).toContain("a king of Macedon");
    expect(text).toContain("barley meal");
    expect(text).toContain("Darius");
    expect(text).toContain("Hephaestion is here with you.");
    expect(text).not.toContain("has come to Egypt");
  }, 60000);
  it("gives every nested object in the model's schema the strict-mode shape", () => {
    const visit = (node: Record<string, unknown>): void => {
      if (node.type === "object" || (Array.isArray(node.type) && node.type.includes("object")))
        expect(node.additionalProperties).toBe(false);
      for (const v of Object.values(node)) if (v && typeof v === "object") visit(v as Record<string, unknown>);
    };
    visit(strictSchema(z.object({ kin: z.array(z.object({ name: z.string() })).optional() })));
  });
});
