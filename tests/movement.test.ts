import { expect, it, vi } from "vitest";
import { createSession } from "../src/runtime/session";
import type { PlayerCommand } from "../src/core/types";
import { itineraryAt, type Itinerary } from "../src/core/itinerary";
import type { TopographyCell } from "../src/core/topography";
import { skySeed, weatherAt } from "../src/core/weather";

it("accepts all eight directions, charges longer diagonals and prevents corner cutting", () => {
  const e = createSession("roman", "movement");
  const blocked = vi.spyOn(e, "blocked").mockReturnValue(false);
  let serial = 0;
  const move = (dx: number, dy: number) =>
    e.act({
      actionId: `movement-${serial++}`,
      expectedRevision: e.state.revision,
      command: { type: "move", dx, dy },
    });
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    const before = { ...e.state.player.pos };
    const result = move(dx, dy);
    expect(result.status).toBe("completed");
    expect(result.elapsedSeconds).toBe(dx && dy ? 3 : 2);
    expect(e.state.player.pos).toEqual({
      ...before,
      x: before.x + dx,
      y: before.y + dy,
    });
  }
  const p = { ...e.state.player.pos };
  for (const [x, y] of [
    [p.x + 1, p.y],
    [p.x, p.y + 1],
    [p.x + 1, p.y + 1],
  ]) {
    blocked.mockImplementation((tx, ty) => tx === x && ty === y);
    expect(move(1, 1).status).toBe("rejected");
    expect(e.state.player.pos).toEqual(p);
  }
  for (const [dx, dy] of [
    [0, 0],
    [2, 0],
    [1, 2],
    [0.5, 1],
  ])
    expect(move(dx, dy).status).toBe("rejected");
});

it("keeps routine collision positions current between simulation ticks", () => {
  const e = createSession("roman", "routine-position");
  const actor = e.state.actors.find((a) => a.kind === "human")!;
  const start = { ...actor.pos, x: actor.pos.x + 20 };
  e.state.clock = 0;
  actor.pos = start;
  actor.offRoutine = false;
  actor.hunger = 0;
  const routine: Itinerary = {
    start: 0,
    period: 0.2,
    segments: [{
      from: 0,
      to: 0.2,
      pos: start,
      path: [{ x: start.x + 1, y: start.y }, { x: start.x + 2, y: start.y }],
      activity: "work",
      label: "Walking",
    }],
  };
  e.world.itinerary = (id) => id === actor.id ? routine : undefined;
  e.advance(9);
  expect(actor.pos.x).toBe(Math.round(itineraryAt(routine, e.state.clock).x));
});


it("holds a walking NPC through the talk command and subsequent conversation updates", () => {
  const e = createSession("roman", "talk-routine-position");
  const actor = e.state.actors.find((a) => a.kind === "human")!;
  const start = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
  e.state.actors = [actor];
  e.state.clock = 0;
  Object.assign(actor, { pos: { ...start }, offRoutine: false, hunger: 0 });
  const routine: Itinerary = {
    start: 0,
    period: 10,
    segments: [{ from: 0, to: 10, pos: start,
      path: Array.from({ length: 100 }, (_, i) => ({ x: start.x + i, y: start.y })),
      activity: "work", label: "Walking" }],
  };
  e.world.itinerary = (id) => id === actor.id ? routine : undefined;
  const result = e.act({ actionId: "talk", expectedRevision: e.state.revision,
    command: { type: "interact", target: actor.id, action: "talk" } });
  expect(result.status).toBe("completed");
  expect(actor.pos).toEqual(start);
  e.conversing = actor.id;
  for (const seconds of [1, 6, 90]) {
    e.advance(seconds);
    expect(actor.pos).toEqual(start);
    expect(e.conversing).toBe(actor.id);
    expect(e.brokeOff).toBeUndefined();
  }
  expect(e.state.events.some((event) => event.text.includes("calls after you"))).toBe(false);
  e.conversing = undefined;
  e.advance(1);
  expect(actor.pos.x).toBe(Math.round(itineraryAt(routine, e.state.clock).x));
  expect(actor.pos).not.toEqual(start);
});

function hazardField(seed: string) {
  const e = createSession("roman", seed);
  e.state.actors = [];
  e.state.objects = [];
  e.state.fauna = [];
  e.world.fauna = undefined;
  e.world.canCross = undefined;
  e.world.blocked = () => false;
  e.world.decoration = () => undefined;
  e.world.topography = undefined;
  e.world.elevation = () => 0;
  e.world.terrain = () => "grass";
  e.state.player.pos = { x: 0, y: 0, space: "outside" };
  e.state.player.health = 100;
  return e;
}

it("hurts a runner on impact once, without hurting walking bumps or repeated wall presses", () => {
  for (const run of [false, true]) {
    const e = hazardField(`impact-${run}`);
    e.world.blocked = (x) => x === 3;
    let n = 0;
    const move = () => e.act({ actionId: `impact-${n++}`, expectedRevision: e.state.revision,
      command: { type: "move", dx: 1, dy: 0, run } });
    move();
    move();
    const command: PlayerCommand = { type: "move", dx: 1, dy: 0, run };
    e.validate(command);
    e.validate(command);
    expect(e.state.player.health).toBe(100);
    expect(move().status).toBe(run ? "completed" : "rejected");
    expect(e.state.player.pos.x).toBe(2);
    const health = run ? 90 : 100;
    expect(e.state.player.health).toBe(health);
    for (let i = 0; i < 5; i++) expect(move().status).toBe("rejected");
    expect(e.state.player.health).toBe(health);
  }
});

it("puts a walker down in a midden, leaves a print and costs a little health", () => {
  const e = hazardField("midden-fall");
  e.state.objects = [{ id: "heap", name: "Midden", kind: "container", prop: "privyMidden", sprite: "study-propb-privy-midden-2",
    inventory: {}, pos: { x: 1, y: 0, space: "outside" } }];
  const result = e.act({ actionId: "midden", expectedRevision: e.state.revision, command: { type: "move", dx: 1, dy: 0 } });
  expect(result.status).toBe("completed");
  expect(e.lastImpact).toBe("muck");
  expect(e.state.player.pos.x).toBe(0);
  expect(e.state.player.health).toBe(98);
  expect(e.state.objects[0].damage).toBe(1);
  e.execute({ type: "move", dx: 1, dy: 0, run: true });
  expect(e.state.player.health).toBe(93);
});

it("does not damage glancing diagonal movement or a runner who has stopped", () => {
  const e = hazardField("glancing-impact");
  e.world.blocked = (x, y) => x === 3 && y === 3;
  e.execute({ type: "move", dx: 1, dy: 1, run: true });
  e.execute({ type: "move", dx: 1, dy: 1, run: true });
  expect(e.validate({ type: "move", dx: 1, dy: 1, run: true })).toBeDefined();
  expect(e.state.player.health).toBe(100);
  e.advance(6);
  expect(e.validate({ type: "move", dx: 1, dy: 1, run: true })).toBeDefined();
  expect(e.state.player.health).toBe(100);
});

it("damages walked, traversed and jumped drops equally and leaves small steps safe", () => {
  for (const drop of [1, 3]) for (const style of [{}, { traverse: true }, { jump: "short" as const }]) {
    const e = hazardField(`fall-${drop}-${JSON.stringify(style)}`);
    e.world.topography = (x) => ({ height: x <= 0 ? drop : 0, surface: "grass" });
    e.execute({ type: "move", dx: 1, dy: 0, ...style });
    expect(e.state.player.health).toBe(drop === 1 ? 100 : 39);
    expect(!!e.state.player.injury).toBe(drop > 1);
  }
});

it("cushions falls onto sand and makes stone landings harder", () => {
  const health: number[] = [];
  for (const surface of ["sand", "grass", "rock"] as const) {
    const e = hazardField(`fall-surface-${surface}`);
    e.world.terrain = () => surface;
    e.world.topography = (x) => ({ height: x <= 0 ? 3 : 0, surface: "grass" });
    e.execute({ type: "move", dx: 1, dy: 0 });
    health.push(e.state.player.health!);
  }
  expect(health[0]).toBeGreaterThan(health[1]);
  expect(health[1]).toBeGreaterThan(health[2]);
});

it("lightning strikes those up a tree far more often than in the open, and never in a car", () => {
  const e = hazardField("lightning");
  (e.world as { pack: unknown }).pack = { ...e.world.pack, setting: { ...e.world.pack.setting, climate: "monsoon", season: "summer", year: 1900 } };
  const stormy: number[] = [];
  for (let h = 0; stormy.length < 300 && h < 24 * 400; h++)
    if (weatherAt(skySeed(e.state.manifest), "monsoon", "summer", h * 3600).storm > 0.6) stormy.push(h * 3600);
  const p = e.state.player;
  const struck = (setup: () => void) => stormy.filter((t) => {
    p.dead = undefined;
    p.health = 100;
    p.perch = undefined;
    setup();
    e.signals.length = 0;
    (e as unknown as { lightningExposure(s: number, t: number): void }).lightningExposure(3600, t);
    return e.signals.some((x) => x.kind === "lightning");
  }).length;
  const tree = struck(() => (p.perch = { on: "tree", label: "the tree", rise: 24, drop: 5, at: { x: 1, y: 0 } }));
  const open = struck(() => {});
  expect(tree).toBeGreaterThan(open);
  expect(tree).toBeGreaterThan(0);
  p.drivingVehicle = "car";
  expect(struck(() => {})).toBe(0);
});

it("ends a fatal fall without automatic recovery or healing through subsequent commands", () => {
  const e = hazardField("fatal-fall");
  e.world.topography = (x) => ({ height: x <= 0 ? 5 : 0, surface: "grass" });
  e.execute({ type: "move", dx: 1, dy: 0 });
  expect(e.state.player.health).toBe(0);
  expect(e.state.player.dead).toBe("a fall");
  const clock = e.state.clock;
  e.execute({ type: "sleep", seconds: 86400 });
  e.advance(3600);
  expect(e.state.clock).toBe(clock);
  expect(e.state.player.health).toBe(0);
  expect(e.validate({ type: "move", dx: -1, dy: 0 })).toContain("dead");
});

it("retains harmless impacts for worlds recorded before hazards were introduced", () => {
  const e = hazardField("legacy-fall");
  delete e.state.manifest.hazards;
  e.world.topography = (x) => ({ height: x <= 0 ? 5 : 0, surface: "grass" });
  e.execute({ type: "move", dx: 1, dy: 0 });
  expect(e.state.player.health).toBe(100);
});

const ford = (x: number): TopographyCell => x < 1 || x > 2
  ? { height: 0, surface: "grass" }
  : {
    height: 0,
    surface: "water",
    waterVisual: { kind: "river", distance: -1.9, gradient: [0, 0], flow: [0, 1], ecology: "temperate-woodland", shoreWidth: 1, frozenMargin: false },
  };

it("offers a ford choice before moving and resolves the crossing using effective endurance", () => {
  const e = hazardField("ford");
  const p = e.state.player;
  e.world.topography = ford;
  p.stats = { ...e.stats(), endurance: 45 };
  p.canSwim = false;
  p.skills = {};
  const rng = e.rng.bind(e);
  vi.spyOn(e, "rng").mockImplementation((purpose) => purpose === "card:river-ford" ? 0.55 : rng(purpose));
  const move = { type: "move", dx: 1, dy: 0 } as const;
  const cross = { type: "choose", card: "river-ford", choice: 0 } as const;
  const retreat = { ...cross, choice: 1 };
  let serial = 0;
  const act = (command: PlayerCommand) =>
    e.act({ actionId: `ford-${serial++}`, expectedRevision: e.state.revision, command });
  p.fatigue = 10;
  expect(act(move).status).toBe("completed");
  expect(p.pos.x).toBe(0);
  expect(e.cards[0].choose?.choices[0].odds).toBeCloseTo(0.6);
  expect(act(move).status).toBe("rejected");
  expect(act(retreat).status).toBe("completed");
  expect(p.pos.x).toBe(0);
  expect(p.health).toBe(100);

  p.fatigue = 90;
  expect(act({ ...move, traverse: true }).status).toBe("completed");
  expect(e.cards[0].choose?.choices[0].odds).toBeLessThan(0.55);
  expect(act(cross).status).toBe("completed");
  expect(p.pos.x).toBe(1);
  expect(p.health).toBe(80);
  expect(p.injury?.name).toBe("a bruised knee");
  expect(act(move).status).toBe("completed");
  expect(e.state.encounter).toBeUndefined();
  expect(p.pos.x).toBe(2);
  expect(p.health).toBe(80);

  expect(act(move).status).toBe("completed");
  p.fatigue = 10;
  p.stats.endurance = 75;
  expect(act({ ...move, dx: -1 }).status).toBe("completed");
  expect(act(cross).status).toBe("completed");
  expect(p.pos.x).toBe(2);
  expect(p.health).toBe(80);
});

it("does not interrupt a bridge or a world with the original hazard rules", () => {
  for (const bridge of [true, false]) {
    const e = hazardField(`ford-bridge-${bridge}`);
    if (!bridge) e.state.manifest.hazards = 1;
    e.world.topography = (x) => {
      const cell = ford(x);
      return bridge && x === 1 ? { ...cell, bridge: true } : cell;
    };
    e.execute({ type: "move", dx: 1, dy: 0 });
    expect(e.state.encounter).toBeUndefined();
    expect(e.state.player.pos.x).toBe(1);
    expect(e.state.player.health).toBe(100);
  }
});
