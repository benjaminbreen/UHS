import { expect, it } from "vitest";
import { createSession } from "../src/runtime/session";
import { snapshotSchema } from "../src/runtime/schema";
import {
  rollTier,
  faunaTiers,
  maxHp,
  type FaunaTier,
} from "../src/core/combat";
import type { Engine } from "../src/core/engine";

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
  return engine;
}
/** One animal on the cell the player faces. */
function quarry(engine: Engine, species: string, tier: FaunaTier = "ordinary") {
  engine.devSpawnFauna(species, 1, tier);
  const g = engine.state.fauna!.at(-1)!;
  g.members[0].x = 1;
  g.members[0].y = 0;
  g.pos = { x: 1, y: 0, space: "outside" };
  return g;
}
const swing = (engine: Engine) => engine.execute({ type: "swing" });

it("rolls tiers in roughly the advertised shares, and the same every time", () => {
  const counts = Object.fromEntries(faunaTiers.map((t) => [t, 0]));
  for (let n = 0; n < 4000; n++) counts[rollTier("seed", "g", n)]++;
  expect(counts.ordinary).toBeGreaterThan(counts.weak);
  expect(counts.weak).toBeGreaterThan(counts.strong);
  expect(counts.strong).toBeGreaterThan(counts["very-strong"]);
  expect(counts.legendary).toBeGreaterThan(0);
  expect(counts.legendary).toBeLessThan(120);
  expect(rollTier("seed", "g", 7)).toBe(rollTier("seed", "g", 7));
  expect(maxHp("rabbit", "legendary")).toBeGreaterThan(maxHp("rabbit", "weak"));
});

it("a stick knocks a rabbit back and sets the rest running", () => {
  const engine = field("combat-rabbit");
  engine.devArm("stick");
  const g = quarry(engine, "rabbit");
  const before = g.members[0].hp!;
  swing(engine);
  const [hit] = engine.lastSwing!.creatures;
  expect(hit.damage).toBeGreaterThan(0);
  expect(hit.to.x).toBeGreaterThan(hit.from.x);
  if (!hit.killed) {
    expect(g.members[0].hp).toBe(before - hit.damage);
    expect(g.members[0].x).toBe(hit.to.x);
    expect(g.state).toBe("flee");
  }
});

it("kills with enough blows and leaves no empty group behind", () => {
  const engine = field("combat-kill");
  engine.devArm("axe");
  const g = quarry(engine, "rabbit", "weak");
  for (let i = 0; i < 6 && g.members.length; i++) {
    g.members[0].x = 1;
    g.members[0].y = 0;
    swing(engine);
  }
  expect(g.members).toHaveLength(0);
  expect(engine.state.fauna!.includes(g)).toBe(false);
});

it("an aurochs does not move for a stick, and turns on you instead", () => {
  const engine = field("combat-aurochs");
  engine.devArm("stick");
  const g = quarry(engine, "aurochs");
  swing(engine);
  const [hit] = engine.lastSwing!.creatures;
  expect(hit.killed).toBe(false);
  if (!hit.crit) expect(hit.to).toEqual(hit.from);
  expect(g.state).not.toBe("flee");
});

it("slams an animal that has nowhere to go", () => {
  const engine = field("combat-slam");
  engine.devArm("stick");
  engine.world.blocked = (x: number) => x >= 2;
  quarry(engine, "sheep");
  swing(engine);
  const [hit] = engine.lastSwing!.creatures;
  expect(hit.slammed).toBe(true);
  expect(hit.to).toEqual(hit.from);
});

it("saves a hurt, numbered animal", () => {
  const engine = field("combat-save");
  engine.devArm("stick");
  quarry(engine, "wild-boar");
  swing(engine);
  const parsed = snapshotSchema.safeParse(
    JSON.parse(JSON.stringify(engine.state)),
  );
  expect(parsed.success).toBe(true);
});

/** Ticks the world without the player doing anything. */
const wait = (engine: Engine, ticks: number) => {
  for (let i = 0; i < ticks; i++) engine.execute({ type: "wait", seconds: 6 });
};

it("a boar paws the ground, then charges down a fixed line and hurts", () => {
  const engine = field("combat-boar");
  engine.devArm("stick");
  const g = quarry(engine, "wild-boar");
  swing(engine);
  expect(g.provoked).toBeGreaterThan(engine.state.clock);
  wait(engine, 2);
  expect(g.attack?.phase).toBe("windup");
  expect(engine.combatEvents.some((e) => e.kind === "windup")).toBe(true);
  const before = engine.state.player.health ?? 100;
  wait(engine, 6);
  expect(engine.combatEvents.some((e) => e.kind === "mauled")).toBe(true);
  expect(engine.state.player.health).toBeLessThan(before);
  expect(engine.state.player.pos.x).toBeLessThan(0);
});

it("a sidestep after the charge starts is a clean dodge", () => {
  const engine = field("combat-dodge");
  engine.devArm("stick");
  const g = quarry(engine, "aurochs");
  swing(engine);
  for (let i = 0; i < 12 && g.attack?.phase !== "charge"; i++) wait(engine, 1);
  // The line is fixed now. Three cells to the side is out of it.
  engine.state.player.pos = { x: 0, y: 5, space: "outside" };
  const before = engine.state.player.health ?? 100;
  wait(engine, 4);
  expect(engine.state.player.health ?? 100).toBe(before);
});

it("a badly hurt boar gives up and runs", () => {
  const engine = field("combat-boar-flee");
  engine.devArm("axe");
  const g = quarry(engine, "wild-boar");
  g.members[0].hp = 6;
  swing(engine);
  if (g.members.length) {
    expect(g.provoked).toBeUndefined();
    expect(g.state).toBe("flee");
  }
});

it("wolves ring the player and one comes in", () => {
  const engine = field("combat-wolves");
  engine.devArm("stick");
  engine.devSpawnFauna("gray-wolf", 3, "ordinary");
  const g = engine.state.fauna!.at(-1)!;
  g.members[0].x = 1;
  g.members[0].y = 0;
  swing(engine);
  wait(engine, 14);
  expect(engine.combatEvents.some((e) => e.kind === "lunge")).toBe(true);
});

it("a kill yields meat and hide, more from a better animal", () => {
  const engine = field("combat-yield");
  engine.devArm("axe");
  const g = quarry(engine, "sheep", "very-strong");
  g.members[0].hp = 1;
  swing(engine);
  const [hit] = engine.lastSwing!.creatures;
  expect(hit.killed).toBe(true);
  expect(engine.state.player.inventory.meat).toBeGreaterThan(4);
  expect(hit.drops.map((d) => d.item)).toContain("hide");
});

it("names a legend, registers it, and keeps it dead", () => {
  const engine = field("combat-legend");
  engine.devArm("axe");
  const g = quarry(engine, "wild-boar", "legendary");
  const m = g.members[0];
  expect(m.name).toMatch(/^the .+ boar of the /);
  const key = Object.keys(engine.state.legends!)[0];
  expect(engine.state.legends![key].name).toBe(m.name);
  m.hp = 1;
  swing(engine);
  expect(engine.state.legends![key].slain).toBeDefined();
  expect(
    snapshotSchema.safeParse(JSON.parse(JSON.stringify(engine.state))).success,
  ).toBe(true);
});

it("the keeper minds when you hit their sheep", () => {
  const engine = field("combat-theft");
  engine.devArm("stick");
  const owner = createSession("roman", "combat-theft-owner").state.actors.find(
    (a) => a.kind === "human",
  )!;
  owner.pos = { x: 0, y: 2, space: "outside" };
  engine.state.actors = [owner];
  const g = quarry(engine, "sheep");
  g.owner = owner.id;
  const trust = owner.trust;
  swing(engine);
  expect(owner.trust).toBeLessThan(trust);
});
