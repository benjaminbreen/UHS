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
import { muster, Skirmish, type FighterSpec, type Setup } from "../src/core/skirmish";
import { battles } from "../src/content/arms/battles";
import { kitById, kits } from "../src/content/arms/kits";
import { armFor, arms } from "../src/content/arms/weapons";
import { fighterOf, resultsOf } from "../src/core/skirmish-bridge";

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

it("a pig runs from the first blow and turns on you at the second", () => {
  const engine = field("combat-pig");
  engine.devArm("stick");
  const g = quarry(engine, "pig");
  swing(engine);
  expect(g.provoked).toBeUndefined();
  expect(g.state).toBe("flee");
  const m = g.members[0];
  m.x = 1;
  m.y = 0;
  m.stun = undefined;
  swing(engine);
  if (g.members.length && m.hp! > 0.3 * maxHp("pig", m.tier ?? "ordinary"))
    expect(g.provoked).toBeGreaterThan(engine.state.clock);
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
  wait(engine, 1);
  expect(g.attack?.phase).toBe("windup");
  expect(engine.signals.some((e) => e.kind === "windup")).toBe(true);
  const before = engine.state.player.health ?? 100;
  wait(engine, 6);
  expect(engine.signals.some((e) => e.kind === "mauled")).toBe(true);
  expect(engine.state.player.health).toBeLessThan(before);
  expect(engine.state.player.pos.x).toBeLessThan(0);
});

it("a venomous bite poisons over hours: a mamba's often kills, an adder's almost never", () => {
  const outcome = (species: string) => Array.from({ length: 12 }, (_, i) => {
    const engine = field(`venom-${species}-${i}`);
    const g = quarry(engine, species);
    (engine as unknown as { mauled(...a: unknown[]): void }).mauled(g, g.members[0], { x: -1, y: 0 }, 4);
    const bitten = !!engine.state.ailments?.some((a) => a.id === "venom" && a.who === engine.state.player.id);
    for (let h = 0; h < 80 && !engine.state.player.dead; h++) engine.execute({ type: "wait", seconds: 3600 });
    return { bitten, dead: engine.state.player.dead };
  });
  const mamba = outcome("black-mamba"), adder = outcome("european-adder");
  expect(mamba.some((o) => o.bitten)).toBe(true);
  expect(adder.some((o) => !o.bitten)).toBe(true);
  expect(mamba.filter((o) => o.dead === "of a snakebite").length).toBeGreaterThan(3);
  expect(adder.some((o) => o.dead)).toBe(false);
});

it("people go round a snake, start at it with a \"!\", and are sometimes bitten", () => {
  const people = createSession("roman", "snake-folk").state.actors;
  const snake = (engine: Engine, species: string) => {
    const g = quarry(engine, species);
    Object.assign(g.members[0], { x: 4, y: 0 });
    g.pos = { x: 4, y: 0, space: "outside" };
  };
  const walker = (engine: Engine, x: number) => {
    const a = { ...people.find((p) => p.kind === "human")!, id: "walker", pos: { x, y: 0, space: "outside" as const } };
    engine.state.actors = [a];
    return a;
  };
  const engine = field("snake-route");
  snake(engine, "indian-cobra");
  const a = walker(engine, 0);
  engine.state.player.pos = { x: 0, y: 20, space: "outside" };
  const path = engine.findRoute(a.pos, { x: 8, y: 0 }, a.id).path;
  expect(path.length).toBeGreaterThan(0);
  expect(path.every((c) => Math.max(Math.abs(c.x - 4), Math.abs(c.y)) > 1)).toBe(true);
  (engine as unknown as { moveActor(a: unknown, p: unknown): void }).moveActor(a, { x: 2, y: 0, space: "outside" });
  expect(engine.signals.some((e) => e.kind === "cue" && e.who === "walker" && e.cue === "alarm")).toBe(true);

  let bitten = 0;
  for (let i = 0; i < 20; i++) {
    const e = field(`snake-bite-${i}`);
    snake(e, "saw-scaled-viper");
    const w = walker(e, 3);
    (e as unknown as { moveActor(a: unknown, p: unknown): void }).moveActor(w, { x: 3, y: 1, space: "outside" });
    if (e.signals.some((x) => x.kind === "say" && x.text === "It bit me!")) bitten++;
  }
  expect(bitten).toBeGreaterThan(1);
  expect(bitten).toBeLessThan(20);
});

it("a snake lies up hidden in cover by day, and slips away from footsteps into other cover", () => {
  const grass = (engine: Engine, cells: string[]) => {
    engine.world.decoration = (x, y) => cells.includes(`${x},${y}`)
      ? { id: `d${x},${y}`, x, y, sprite: "nature-broadleaf-sapling", solid: false } : undefined;
  };
  const cobra = (engine: Engine, x: number, y: number) => {
    engine.devSpawnFauna("indian-cobra", 1);
    const g = engine.state.fauna!.at(-1)!;
    Object.assign(g.members[0], { x, y });
    g.pos = { x, y, space: "outside" };
    g.nextDecisionAt = 0;
    return g;
  };
  // A night snake at noon, five cells from the nearest growth, nobody about.
  const day = field("snake-lie-up");
  day.state.clock = 3 * 86400 + 12 * 3600;
  day.state.player.pos = { x: 0, y: 30, space: "outside" };
  grass(day, ["5,0"]);
  const g = cobra(day, 0, 0);
  wait(day, 12);
  expect(g.members[0]).toMatchObject({ x: 5, y: 0, hidden: true });

  // Someone coming: most leave for cover on the far side.
  let left = 0;
  for (let i = 0; i < 10; i++) {
    const e = field(`snake-slip-${i}`);
    e.state.clock = 3 * 86400 + 12 * 3600;
    grass(e, ["0,0", "-5,0"]);
    const s = cobra(e, 0, 0);
    e.state.player.pos = { x: 3, y: 0, space: "outside" };
    wait(e, 4);
    if (s.members[0].x <= -3) left++;
  }
  expect(left).toBeGreaterThan(3);
});

it("an animal outside never reaches a player who has gone indoors", () => {
  const engine = field("combat-indoors");
  engine.devArm("stick");
  quarry(engine, "wild-boar");
  swing(engine);
  // Same numbers as the field cell, but the grid of a house.
  engine.state.player.pos = { ...engine.state.player.pos, space: "house" };
  const before = engine.state.player.health ?? 100;
  wait(engine, 10);
  expect(engine.signals.some((e) => e.kind === "mauled")).toBe(false);
  expect(engine.state.player.health).toBe(before);
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

it("an elephant is not held off by stabbing it: it turns and is on you", () => {
  const engine = field("combat-elephant");
  engine.devArm("spear");
  const g = quarry(engine, "asian-elephant");
  for (let i = 0; i < 12; i++) swing(engine);
  expect(g.members[0].stun ?? 0).toBeLessThanOrEqual(engine.state.clock);
  expect(engine.signals.some((e) => e.kind === "mauled")).toBe(true);
  expect(engine.state.player.health).toBeLessThan(70);
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
  expect(engine.signals.some((e) => e.kind === "lunge")).toBe(true);
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
  expect(engine.witnessedOffense?.id).toBe(owner.id);
  expect(engine.witnessedOffense?.situation).toContain("my sheep");
});

it("witnesses animal attacks up to fifteen squares from the target, with a clear view", () => {
  const engine = field("combat-witness-range");
  engine.devArm("stick");
  const actors = createSession("roman", "combat-witnesses").state.actors.filter((a) => a.kind === "human").slice(0, 3);
  actors[0].pos = { x: 16, y: 0, space: "outside" };
  actors[1].pos = { x: 17, y: 0, space: "outside" };
  actors[2].pos = { x: 1, y: 0, space: "indoors" };
  engine.state.actors = actors;
  quarry(engine, "sheep");
  swing(engine);
  expect(actors[0].memories.some((m) => m.includes("wild sheep"))).toBe(true);
  expect(actors[1].memories.some((m) => m.includes("wild sheep"))).toBe(false);
  expect(actors[2].memories.some((m) => m.includes("wild sheep"))).toBe(false);
  expect(engine.witnessedOffense?.id).toBe(actors[0].id);
});

it("records an assault for the victim and nearby witnesses outside survival mode", () => {
  const engine = field("combat-assault-witnesses");
  const actors = createSession("roman", "combat-assault-people").state.actors.filter((a) => a.kind === "human").slice(0, 2);
  actors[0].pos = { x: 1, y: 0, space: "outside" };
  actors[1].pos = { x: 12, y: 0, space: "outside" };
  engine.state.actors = actors;
  delete engine.state.manifest.survival;
  swing(engine);
  expect(actors[0].memories).toContain("The player struck me");
  expect(actors[1].memories).toContain(`Saw player strike ${actors[0].name}`);
  expect(engine.witnessedOffense?.id).toBe(actors[0].id);
});

it("recognises a keeper's dog in a world created before dogs had owners", () => {
  const engine = field("combat-existing-sheepdog");
  engine.devArm("stick");
  const keeper = createSession("roman", "combat-dog-keeper").state.actors.find((a) => a.kind === "human")!;
  keeper.id = "flock-herder-0";
  keeper.pos = { x: 0, y: 2, space: "outside" };
  engine.state.actors = [keeper];
  const dog = quarry(engine, "dog");
  dog.id = "flock-dog";
  delete dog.owner;
  swing(engine);
  expect(dog.owner).toBe(keeper.id);
  expect(engine.witnessedOffense?.id).toBe(keeper.id);
  expect(engine.witnessedOffense?.situation).toContain("my dog");
});

const pair = (a: Partial<FighterSpec>, b: Partial<FighterSpec>, seed = "pair") =>
  ({ setup: {
    seed, width: 20, height: 10,
    units: [{ id: "a", side: 0, name: "A", order: "charge" }, { id: "b", side: 1, name: "B", order: "charge" }],
    fighters: [
      { id: "a", side: 0, unit: "a", x: 8, y: 5, main: "sword", armour: "none", shield: "none", skill: 0.6, ...a },
      { id: "b", side: 1, unit: "b", x: 10.5, y: 5, main: "sword", armour: "none", shield: "none", skill: 0.6, ...b },
    ],
  } satisfies Setup });

it("every fighter and battle in the arena names weapons and kits that exist", () => {
  for (const kit of kits) expect([kit.main, kit.side].filter((id) => id && !arms[id]), kit.id).toEqual([]);
  for (const b of battles) for (const u of b.sides.flat()) expect(kitById.has(u.kit), `${b.id}: ${u.kit}`).toBe(true);
});

it("a guard raised as the blow lands is a parry: the attacker reels and the answer hits twice as hard", () => {
  const s = new Skirmish(pair({ player: true }, {}).setup);
  const me = s.get("a")!, foe = s.get("b")!;
  const seen: string[] = [];
  let riposte = 0;
  for (let i = 0; i < 60 * 20 && !seen.includes("parry"); i++) {
    const coming = foe.act === "windup" && foe.move!.windup - foe.t <= 0.1;
    s.step({ mx: 0, my: 0, aim: Math.atan2(foe.y - me.y, foe.x - me.x), attack: false, guard: coming });
    seen.push(...s.events.map((e) => e.kind));
    s.events.length = 0;
  }
  expect(seen).toContain("parry");
  expect(foe.act).toBe("stagger");
  expect(me.riposte?.on).toBe("b");
  for (let i = 0; i < 40; i++) {
    s.step({ mx: 0, my: 0, aim: Math.atan2(foe.y - me.y, foe.x - me.x), attack: i < 2, guard: false });
    for (const e of s.events) if (e.kind === "hit" && e.id === "b") riposte = e.crit ? e.damage : 0;
    s.events.length = 0;
  }
  // An arming sword does 18 at most to an unarmoured man without the opening.
  expect(riposte).toBeGreaterThan(22);
});

it("F kept held after a blow winds up the wide swing: half a circle, then the whole", () => {
  const swing = (held: number) => {
    const s = new Skirmish(pair({ player: true }, { x: 18 }).setup);
    const me = s.get("a")!;
    const press = Math.round(held * 60) + 40;
    for (let i = 0; i < press + 30; i++) s.step({ mx: 0, my: 0, aim: 0, attack: i < press, guard: false });
    return me.move!;
  };
  expect(swing(0.1).kind).toBe("light");
  expect(swing(0.7)).toMatchObject({ kind: "heavy", power: 1, arc: Math.PI / 2 });
  expect(swing(1.2)).toMatchObject({ kind: "heavy", power: 2, arc: Math.PI });
});

it("braced pikes stop a mounted charge that rides down men who are not braced", () => {
  const fight = (kit: string) => {
    const s = new Skirmish(muster({
      id: "t", name: "", when: "", note: "", ground: "grass", size: [40, 16], sideNames: ["", ""], player: [0, 0],
      sides: [[{ name: "Foot", kit, count: 8, ranks: 2, at: [10, 8], order: "hold", gap: 0.9 }], [{ name: "Horse", kit: "knight", count: 5, ranks: 1, at: [32, 8], order: "charge" }]],
    }, "pikes", undefined));
    const kinds = new Set<string>();
    while (s.time < 60 && s.winner() === undefined) {
      s.step();
      for (const e of s.events) kinds.add(e.kind);
      s.events.length = 0;
    }
    return { winner: s.winner(), kinds, horses: s.fighters.filter((f) => f.side === 1 && f.horse > 0).length };
  };
  const pikes = fight("pikeman");
  expect(pikes.kinds).toContain("brace");
  expect(pikes.horses).toBe(0);
  expect(fight("longbowman").winner).toBe(1);
});

it("plays the same battle the same way from the same seed", () => {
  const run = () => {
    const s = new Skirmish(muster(battles.find((b) => b.id === "culloden")!, "same", undefined));
    while (s.time < 20) s.step(), (s.events.length = 0);
    return s.fighters.map((f) => `${f.act}:${f.x.toFixed(3)}:${Math.round(f.hp)}`).join("|");
  };
  expect(run()).toBe(run());
});

it("an attack pressed in the air comes down with the landing, harder than a standing blow", () => {
  const blow = (jump: boolean) => {
    const s = new Skirmish(pair({ player: true }, { x: jump ? 11.6 : 9.4, skill: 0 }, "air").setup);
    const foe = s.get("b")!;
    let dealt = 0, kind = "";
    for (let i = 0; i < 50 && !dealt; i++) {
      s.step({ mx: jump ? 1 : 0, my: 0, aim: 0, attack: i > 2 && i < 8, guard: false, jump: jump && i === 0 });
      foe.act = "ready";
      foe.guard = false;
      for (const e of s.events) if (e.kind === "hit" && e.id === "b") dealt = e.damage;
      for (const e of s.events) if (e.kind === "swing" && e.id === "a") kind = e.move;
      s.events.length = 0;
    }
    return { dealt, kind };
  };
  const air = blow(true), ground = blow(false);
  expect(air.kind).toBe("plunge");
  expect(ground.kind).toBe("light");
  expect(air.dealt).toBeGreaterThan(ground.dealt * 1.3);
});

it("a skirmish takes real people's weapons and armour in, and writes its wounds and dead back to them", () => {
  const engine = createSession("roman", "bridge");
  const p = engine.state.player, foe = engine.state.actors.find((a) => a.kind === "human" && (a.age ?? 30) > 18)!;
  foe.heldItem = "spear";
  const me = fighterOf(p, { side: 0, unit: "a", x: 8, y: 5 }, { prop: "pitchfork", skill: 0.2 });
  const them = fighterOf(foe, { side: 1, unit: "b", x: 10, y: 5 }, { skill: 0.9 });
  expect(me).toMatchObject({ id: p.id, main: "pitchfork" });
  expect(them).toMatchObject({ main: "spear", armour: "none" });
  // A farm tool hits as hard as the hunting table says, in the fight's terms.
  expect(armFor("pitchfork")).toMatchObject({ family: "spear", reach: 2.1 });
  const s = new Skirmish({ seed: "bridge", width: 20, height: 10, fighters: [me, them], units: [{ id: "a", side: 0, name: "A", order: "charge" }, { id: "b", side: 1, name: "B", order: "charge" }] });
  while (s.time < 120 && s.winner() === undefined) s.step(), (s.events.length = 0);
  const results = resultsOf(s), mine = results.find((r) => r.id === p.id)!, theirs = results.find((r) => r.id === foe.id)!;
  expect(mine.dead || mine.down || theirs.dead || theirs.down).toBe(true);
  engine.settleFight(results, foe.name);
  expect(!!foe.dead).toBe(theirs.dead);
  if (!theirs.dead) expect(foe.health).toBe(Math.max(theirs.down ? 0 : 1, Math.round(100 * theirs.left)));
  expect(!!p.dead).toBe(mine.dead);
  if (mine.wounds.length && !mine.dead) expect(p.health).toBeLessThan(100);
});
