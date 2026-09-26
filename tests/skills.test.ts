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
import { statsOf } from "../src/core/stats";
import { SKILLS, skillIds } from "../src/core/skills";
import { TECHNIQUES, techniqueIds } from "../src/core/techniques";
import { SKILL_CONTEXT, skillContext } from "../src/content/skill-context";
import { cultures } from "../src/content/history/types";
import { eras } from "../src/content/history/dates";

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
  expect(engine.skillGains.filter((g) => g.skill === "hunting").at(-1)?.level).toBe(1);
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

it("throws a stone from the hand, reloads, stuns and skips", () => {
  const engine = field("skills-stone");
  engine.state.player.inventory.pebble = 3;
  engine.execute({ type: "hold", item: "pebble" });
  const g = quarry(engine, "rabbit", { x: 4, y: 0 }, "very-strong");
  engine.execute({ type: "throw", dx: 1, dy: 0, reach: 6 });
  const hit = engine.lastThrow!.creature!;
  expect(hit).toBeDefined();
  if (!hit.killed)
    expect(g.members[0].stun! - engine.state.clock).toBeGreaterThan(6);
  // The next one is already in hand.
  expect(engine.state.player.heldItem).toBe("pebble");
  expect(engine.state.player.inventory.pebble).toBe(1);
  // Nothing in the way: it comes down where aimed and skips one on.
  engine.state.fauna = [];
  engine.execute({ type: "throw", dx: 0, dy: 1, reach: 4 });
  expect(engine.lastThrow!.to).toEqual({ x: 0, y: 4 });
  expect(engine.lastThrow!.bounce).toEqual({ x: 0, y: 5 });
  expect(
    engine.state.objects.some((o) => o.item === "pebble" && o.pos.y === 5),
  ).toBe(true);
});

it("a spear carries further than a crate", () => {
  const engine = field("skills-range");
  engine.devArm("spear");
  expect(engine.throwPath(1, 0, 9)).toHaveLength(9);
  engine.devArm("stick");
  expect(engine.throwPath(1, 0, 9).length).toBeLessThan(9);
});

it("strength extends thrown and shot range without shortening the old minimum", () => {
  const engine = field("strength-range");
  const stats = statsOf(engine.state.manifest.seed, engine.state.player);
  engine.devArm("spear");
  for (const [strength, bonus] of [[20, 0], [55, 1], [80, 2]]) {
    engine.state.player.stats = { ...stats, strength };
    expect(engine.missile().range).toBe(9 + bonus);
    expect(engine.throwPath(1, 0)).toHaveLength(3 + bonus);
    expect(engine.throwPath(1, 0, undefined, true)).toHaveLength(6 + bonus);
    expect(engine.bowRange()).toBe(10 + bonus);
  }
  engine.devArm();
  engine.state.player.heldItem = "bow";
  engine.state.player.inventory.arrow = 1;
  engine.execute({ type: "shoot", target: { x: 20, y: 0 } });
  expect(engine.lastThrow?.to).toEqual({ x: 12, y: 0 });
});

it("holds the first swing back when there is nothing to hit", () => {
  const engine = field("skills-press");
  engine.devArm("stick");
  expect(engine.swingFinds()).toBe(false);
  quarry(engine, "sheep", { x: 0, y: 1 });
  expect(engine.swingFinds()).toBe(true);
});

it("offers a technique at level 2, and only a real choice", () => {
  const engine = field("skills-technique");
  engine.state.player.skills = { foraging: xpFor(2), farming: xpFor(4) };
  const picks = engine.pendingPicks();
  expect(picks.map((p) => [p.skill, p.tier])).toEqual([
    ["foraging", 2],
    ["farming", 2],
  ]);
  expect(engine.validate({ type: "learn", technique: "keen-eye" })).toBeTruthy();
  engine.execute({ type: "learn", technique: "gentle-hands" });
  expect(engine.knows("gentle-hands")).toBe(true);
  expect(engine.pendingPicks().map((p) => p.skill)).toEqual(["farming"]);
  expect(
    engine.validate({ type: "learn", technique: "quick-picker" }),
  ).toBeTruthy();
  expect(
    snapshotSchema.safeParse(JSON.parse(JSON.stringify(engine.state))).success,
  ).toBe(true);
});

it("long arm adds a tile to every throw and shot", () => {
  const engine = field("skills-long-arm");
  engine.devArm("spear");
  const before = engine.missile().range;
  engine.state.player.techniques = ["long-arm"];
  expect(engine.missile().range).toBe(before + 1);
});

it("finds history for every skill, most specific first", () => {
  for (const skill of skillIds) {
    expect(SKILL_CONTEXT[skill].entries.some((e) => !e.cultures && !e.eras)).toBe(true);
    if (SKILLS[skill].hidden) continue;
    for (const id of techniqueIds.filter((t) => TECHNIQUES[t].skill === skill))
      expect(SKILL_CONTEXT[skill].techniques[id]?.note, id).toBeTruthy();
  }
  const here = skillContext("foraging", "north-african-west-asian", "early-holocene");
  expect(here.wiki[0]).toBe("Natufian culture");
  expect(here.matched).toEqual({ culture: true, era: true });
  expect(skillContext("foraging", "andean", "1945-1990").matched.culture).toBe(false);
  expect(skillContext("trade").sources.length).toBeGreaterThan(0);
});

it("covers every era and every culture zone for every visible skill", () => {
  for (const skill of skillIds.filter((id) => !SKILLS[id].hidden))
    for (const [culture] of cultures) {
      expect(SKILL_CONTEXT[skill].entries.some((e) => e.cultures?.includes(culture)), `${skill} ${culture}`).toBe(true);
      for (const era of eras) {
        const { matched, wiki, sources } = skillContext(skill, culture, era.id);
        expect(matched.culture || matched.era, `${skill} ${culture} ${era.id}`).toBe(true);
        expect(wiki.length && sources.length).toBeTruthy();
      }
    }
});
