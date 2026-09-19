import { expect, it } from "vitest";
import { createSession } from "../src/runtime/session";
import { snapshotSchema } from "../src/runtime/schema";
import {
  MAX_LEVEL,
  levelOf,
  progress,
  startingSkills,
  xpFor,
} from "../src/core/skills";
import type { Engine } from "../src/core/engine";
import type { FaunaTier } from "../src/core/combat";

function field(seed: string) {
  const engine = createSession("roman", seed);
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
  engine.state.player.skills = {};
  return engine;
}
function quarry(
  engine: Engine,
  species: string,
  at = { x: 1, y: 0 },
  tier: FaunaTier = "ordinary",
) {
  engine.devSpawnFauna(species, 1, tier);
  const g = engine.state.fauna!.at(-1)!;
  Object.assign(g.members[0], at);
  g.pos = { ...at, space: "outside" };
  return g;
}
const wait = (engine: Engine, ticks: number) => {
  for (let i = 0; i < ticks; i++) engine.execute({ type: "wait", seconds: 6 });
};

it("levels rise on a curve and stop at ten", () => {
  expect(levelOf(0)).toBe(0);
  expect(levelOf(xpFor(1))).toBe(1);
  expect(levelOf(xpFor(4) - 1)).toBe(3);
  expect(levelOf(1e9)).toBe(MAX_LEVEL);
  expect(progress(xpFor(2) + 10).into).toBe(10);
  expect(xpFor(10) - xpFor(9)).toBeGreaterThan(xpFor(2) - xpFor(1));
});

it("starts a person off knowing their own trade", () => {
  const hunter = startingSkills("s", { id: "a", role: "Hunter", age: 40 });
  const potter = startingSkills("s", { id: "b", role: "Potter", age: 40 });
  expect(levelOf(hunter.hunting)).toBeGreaterThanOrEqual(4);
  expect(levelOf(potter.hunting)).toBe(0);
  expect(levelOf(potter.speech)).toBeGreaterThan(0);
  const young = startingSkills("s", { id: "c", role: "Hunter", age: 15 });
  expect(levelOf(young.hunting)).toBeLessThan(levelOf(hunter.hunting));
});

it("a kill teaches hunting, and says so when a level comes", () => {
  const engine = field("skills-hunt");
  engine.devArm("axe");
  engine.state.player.skills = { hunting: xpFor(1) - 1 };
  const g = quarry(engine, "red-deer");
  g.members[0].hp = 1;
  engine.execute({ type: "swing" });
  expect(engine.skillLevel("hunting")).toBe(1);
  expect(engine.skillGains.at(-1)?.level).toBe(1);
  expect(
    snapshotSchema.safeParse(JSON.parse(JSON.stringify(engine.state))).success,
  ).toBe(true);
});

it("walking teaches wayfaring without filling the toast", () => {
  const engine = field("skills-walk");
  for (let i = 0; i < 40; i++) engine.execute({ type: "move", dx: 1, dy: 0 });
  expect(engine.state.player.skills!.wayfaring).toBeGreaterThan(3);
  expect(engine.skillGains).toHaveLength(0);
});

it("a wound-up swing hits all round and harder", () => {
  const engine = field("skills-spin");
  engine.devArm("stick");
  const behind = quarry(engine, "sheep", { x: -1, y: 0 });
  const front = quarry(engine, "sheep", { x: 1, y: 0 });
  engine.execute({ type: "swing", power: 2 });
  const hits = engine.lastSwing!.creatures;
  expect(hits).toHaveLength(2);
  // Thrown outward, each its own way.
  expect(behind.members[0]?.x ?? -9).toBeLessThan(-1);
  expect(front.members[0]?.x ?? 9).toBeGreaterThan(1);
});

it("a spear reaches two cells and punishes a charge", () => {
  const engine = field("skills-spear");
  engine.devArm("spear");
  const g = quarry(engine, "wild-boar", { x: 2, y: 0 });
  engine.execute({ type: "swing" });
  expect(engine.lastSwing!.creatures).toHaveLength(1);
  const plain = engine.lastSwing!.creatures[0].damage;
  const m = g.members[0];
  m.x = 2;
  m.hp = 999;
  g.attack = { n: m.n!, phase: "charge", until: 0, dir: { x: -1, y: 0 } };
  let braced = 0;
  for (let i = 0; i < 6 && !braced; i++) {
    m.x = 2;
    g.attack = { n: m.n!, phase: "charge", until: 0, dir: { x: -1, y: 0 } };
    engine.execute({ type: "swing" });
    const hit = engine.lastSwing!.creatures[0];
    if (hit && !hit.crit) braced = hit.damage;
  }
  expect(braced).toBeGreaterThan(plain);
});

it("a thrown spear wounds what it meets", () => {
  const engine = field("skills-throw");
  engine.devArm("spear");
  const g = quarry(engine, "red-deer", { x: 3, y: 0 });
  const before = g.members[0].hp!;
  engine.execute({ type: "throw", dx: 1, dy: 0 });
  expect(engine.lastThrow?.creature).toBeDefined();
  expect(g.members[0].hp).toBeLessThan(before);
});

it("game hears a runner sooner than someone standing still", () => {
  // Red deer notice at 8 cells. Six away, a runner is inside that and someone
  // standing still is well outside it.
  const engine = field("skills-stalk");
  const g = quarry(engine, "red-deer", { x: 6, y: 0 });
  wait(engine, 4);
  expect(g.alarm).toBeUndefined();
  expect(g.state).not.toBe("flee");
  for (let i = 0; i < 4; i++) {
    engine.execute({ type: "move", dx: 0, dy: 1, run: true });
    engine.execute({ type: "move", dx: 0, dy: -1, run: true });
  }
  expect(g.alarm !== undefined || g.state === "flee").toBe(true);
});

it("going down costs the day and leaves a hurt, not a grave", () => {
  const engine = field("skills-collapse");
  engine.devArm("stick");
  engine.state.player.health = 5;
  engine.state.player.inventory.meat = 4;
  quarry(engine, "aurochs");
  const clock = engine.state.clock;
  engine.execute({ type: "swing" });
  wait(engine, 10);
  const p = engine.state.player;
  expect(engine.lastCollapse).toBeDefined();
  expect(p.health).toBeGreaterThan(0);
  expect(p.injury?.until).toBeGreaterThan(engine.state.clock);
  expect(p.inventory.meat).toBe(2);
  expect(engine.state.clock - clock).toBeGreaterThan(4 * 3600);
  expect(
    snapshotSchema.safeParse(JSON.parse(JSON.stringify(engine.state))).success,
  ).toBe(true);
});

it("cooks raw meat at a fire into something worth eating", () => {
  const engine = field("skills-cook");
  engine.state.player.inventory.meat = 2;
  engine.state.objects.push({
    id: "fire-1",
    name: "Hearth",
    kind: "fire",
    prop: "hearth",
    sprite: "study-prop-hearth-0",
    inventory: {},
    pos: { x: 1, y: 0, space: "outside" },
  });
  engine.execute({ type: "interact", target: "fire-1", action: "cook" });
  expect(engine.state.player.inventory["cooked-meat"]).toBe(2);
  expect(engine.state.player.inventory.meat).toBe(0);
});
