import { expect, it } from "vitest";
import { createSession } from "../src/runtime/session";
import type { Engine } from "../src/core/engine";
import type { Actor } from "../src/core/types";

function field(seed: string) {
  const engine = createSession("roman", seed);
  const person = engine.state.actors.find((a) => a.kind === "human")!;
  engine.state.actors = [];
  engine.state.objects = [];
  engine.state.fauna = [];
  engine.world.blocked = () => false;
  engine.world.canCross = undefined;
  engine.world.topography = undefined;
  engine.world.terrain = () => "grass";
  engine.world.decoration = () => undefined;
  engine.world.fauna = undefined;
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  engine.state.player.direction = 1;
  return { engine, person };
}
function bystander(engine: Engine, person: Actor, x: number, y: number) {
  const a = structuredClone(person);
  a.id = `w-${x}-${y}`;
  a.pos = { x, y, space: "outside" };
  a.trust = 0;
  engine.state.actors.push(a);
  return a;
}
const cues = (engine: Engine, who?: string) =>
  engine.signals
    .filter((s) => s.kind === "cue" && (!who || s.who === who))
    .map((s) => (s.kind === "cue" ? s.cue : ""));
const sheep = (engine: Engine, owner?: string) => {
  engine.devArm("stick");
  engine.devSpawnFauna("sheep", 1, "very-strong");
  const g = engine.state.fauna!.at(-1)!;
  Object.assign(g.members[0], { x: 1, y: 0 });
  g.pos = { x: 1, y: 0, space: "outside" };
  g.owner = owner;
  return g;
};

it("says nothing when trust does not move", () => {
  const { engine, person } = field("cue-zero");
  const a = bystander(engine, person, 0, 2);
  engine.regard(a, 0);
  expect(cues(engine)).toEqual([]);
});

it("angers the keeper and startles a neighbour, exactly when trust drops", () => {
  const { engine, person } = field("cue-offend");
  const keeper = bystander(engine, person, 0, 2);
  const neighbour = bystander(engine, person, 0, -2);
  sheep(engine, keeper.id);
  engine.execute({ type: "swing" });
  expect(keeper.trust).toBeLessThan(0);
  expect(cues(engine, keeper.id)).toContain("anger");
  expect(neighbour.trust).toBeLessThan(0);
  expect(cues(engine, neighbour.id)).toContain("alarm");
});

it("costs nothing, and shows nothing, with nobody watching", () => {
  const { engine } = field("cue-unseen");
  sheep(engine, "someone-elsewhere");
  engine.execute({ type: "swing" });
  expect(cues(engine).filter((c) => c === "anger")).toEqual([]);
});

it("turns heads once when a fight breaks out, not on every blow", () => {
  const { engine, person } = field("cue-fight");
  const onlooker = bystander(engine, person, 0, 3);
  const g = sheep(engine);
  g.members[0].hp = 999;
  engine.execute({ type: "swing" });
  Object.assign(g.members[0], { x: 1, y: 0 });
  engine.execute({ type: "swing" });
  expect(cues(engine, onlooker.id).filter((c) => c === "alarm")).toHaveLength(
    1,
  );
  // Wild game is nobody's: watching it hunted costs the hunter nothing.
  expect(onlooker.trust).toBe(0);
});

it("a refusal shows only when an offer is really made", () => {
  const { engine, person } = field("cue-trade");
  const trader = bystander(engine, person, 1, 0);
  engine.state.player.inventory = { grain: 1 };
  trader.inventory = { tool: 1 };
  const command = {
    type: "trade" as const,
    target: trader.id,
    give: "grain",
    giveQuantity: 1,
    take: "tool",
    takeQuantity: 1,
  };
  // The interface asks what is possible all the time. That is not an offer.
  expect(engine.validate(command)).toBeTruthy();
  expect(cues(engine)).toEqual([]);
  const result = engine.act({
    actionId: "offer-1",
    expectedRevision: engine.state.revision,
    command,
  });
  expect(result.status).toBe("rejected");
  expect(cues(engine, trader.id)).toEqual(["refuse"]);
});

it("talk warms or nods with the trust it wins, and angers someone wronged", () => {
  const { engine, person } = field("cue-talk");
  const friend = bystander(engine, person, 1, 0);
  engine.execute({ type: "interact", target: friend.id, action: "talk" });
  expect(friend.trust).toBeGreaterThan(0);
  expect(["nod", "warm"]).toContain(cues(engine, friend.id)[0]);
  // They turned to each other.
  expect(engine.state.player.direction).toBe(1);
  expect(friend.direction).toBe(3);
  const wronged = bystander(engine, person, 0, 1);
  wronged.trust = -3;
  engine.execute({ type: "interact", target: wronged.id, action: "talk" });
  expect(wronged.trust).toBe(-3);
  expect(cues(engine, wronged.id)).toEqual(["anger"]);
});

it("the player starts when a boar squares up", () => {
  const { engine } = field("cue-windup");
  engine.devArm("stick");
  engine.devSpawnFauna("wild-boar", 1, "ordinary");
  const g = engine.state.fauna!.at(-1)!;
  Object.assign(g.members[0], { x: 1, y: 0 });
  g.pos = { x: 1, y: 0, space: "outside" };
  engine.execute({ type: "swing" });
  for (let i = 0; i < 3; i++) engine.execute({ type: "wait", seconds: 6 });
  expect(engine.signals.some((s) => s.kind === "windup")).toBe(true);
  expect(cues(engine, "player")).toContain("alarm");
});
