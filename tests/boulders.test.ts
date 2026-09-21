import { expect, it } from "vitest";
import { rollPath, settle, energyOf } from "../src/core/settle";
import { boulderFrame, stoneKind } from "../src/content/ecology/rocks";
import type { Habitat } from "../src/world/v3/habitats";

const flat = { elevation: () => 0, clear: () => true };
const east = { dx: 1, dy: 0 };
const STEP = 14;

it("rolls one cell on the level and stops", () => {
  const run = rollPath(flat, { x: 0, y: 0 }, east, STEP);
  expect(run.path).toEqual([{ x: 1, y: 0 }]);
  expect(run.fell).toBe(0);
});

it("runs down a slope and coasts out on the flat below", () => {
  // Three cells of descent, then level ground.
  const run = rollPath(
    { elevation: (x) => -Math.min(x, 3) * STEP, clear: () => true },
    { x: 0, y: 0 },
    east,
    STEP,
  );
  expect(run.fell).toBe(3);
  // Each drop buys another cell, so it outruns the slope itself.
  expect(run.path.length).toBeGreaterThan(3);
  expect(run.against).toBeUndefined();
});

it("will not roll uphill", () => {
  const run = rollPath(
    { elevation: (x) => x * STEP, clear: () => true },
    { x: 0, y: 0 },
    east,
    STEP,
  );
  expect(run.path).toEqual([]);
  expect(run.against).toEqual({ x: 1, y: 0 });
});

it("stops against a wall and reports the cell it hit", () => {
  const run = rollPath(
    { elevation: (x) => -x * STEP, clear: (x) => x < 3 },
    { x: 0, y: 0 },
    east,
    STEP,
  );
  expect(run.path).toEqual([
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ]);
  expect(run.against).toEqual({ x: 3, y: 0 });
  expect(run.fell).toBe(2);
});

it("caps a run so a broken height field cannot loop", () => {
  const run = rollPath(
    { elevation: (x) => -x * STEP, clear: () => true },
    { x: 0, y: 0 },
    east,
    STEP,
  );
  expect(run.path.length).toBe(20);
});

/** A bare field, with whatever the test puts on the cell. */
const world = (over: Partial<Parameters<typeof settle>[0]> = {}) => ({
  depth: () => 0,
  groundHit: () => "soil" as const,
  actorAt: () => undefined,
  fireAt: () => false,
  cropAt: () => false,
  ...over,
});
const cell = { x: 0, y: 0 };

it("reads the landing off the cell, not the thing landing", () => {
  expect(settle(world(), false, cell, "outside", 3).kind).toBe("thud");
  expect(
    settle(world({ depth: () => 0.4 }), false, cell, "outside", 3).kind,
  ).toBe("splash");
  expect(
    settle(world({ depth: () => 2 }), false, cell, "outside", 3).kind,
  ).toBe("sink");
  expect(
    settle(world({ fireAt: () => true }), false, cell, "outside", 3).kind,
  ).toBe("burn");
  expect(
    settle(world({ cropAt: () => true }), false, cell, "outside", 3).kind,
  ).toBe("flatten");
});

it("breaks a pot on stone but not on soil", () => {
  const stone = world({ groundHit: () => "stone" as const });
  expect(settle(stone, true, cell, "outside", 3).kind).toBe("shatter");
  expect(settle(stone, false, cell, "outside", 3).kind).toBe("thud");
  // Set down gently, it survives the same ground.
  expect(settle(stone, true, cell, "outside", 1).kind).toBe("thud");
});

it("catches whoever is standing there, hard enough and no harder", () => {
  const people = world({ actorAt: () => ({ id: "ana", name: "Ana" }) });
  const hit = settle(people, false, cell, "outside", energyOf(2.6, 3));
  expect(hit.kind).toBe("crush");
  expect(hit.victim).toBe("ana");
  expect(hit.damage).toBe(5);
  // A thing set down on someone's foot is not a falling rock.
  expect(settle(people, false, cell, "outside", 1).kind).toBe("thud");
});

it("draws a boulder in the local stone", () => {
  const habitat = (over: Partial<Habitat>) =>
    ({
      ecology: "temperate-woodland",
      colorway: "temperate",
      kind: "woodland",
      wet: 0.3,
      exposed: 0.2,
      cover: 0.5,
      ...over,
    }) as Habitat;
  expect(
    stoneKind(habitat({ ecology: "desert", colorway: "sonoran" })).kind,
  ).toBe("red");
  expect(boulderFrame(habitat({ ecology: "wetland" }), 0.1)).toBe(
    "nature-boulder-mossy-0",
  );
  expect(boulderFrame(undefined, 0.9)).toBe("nature-boulder-slab-2");
});

import { createSession, Runtime } from "../src/runtime/session";
import { snapshotSchema } from "../src/runtime/schema";

/** A bare slope running east, with a boulder one cell in front of the player. */
function slope(
  over: { water?: number; elevation?: (x: number) => number } = {},
) {
  const engine = createSession("roman", "boulder-roll");
  engine.state.actors = [];
  engine.world.blocked = () => false;
  engine.world.decoration = () => undefined;
  engine.world.places = [];
  engine.world.elevation = (x) =>
    (over.elevation ?? ((n: number) => -Math.min(n, 5) * 14))(x);
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  engine.state.player.stats = {
    ...(engine.state.player.stats ?? ({} as never)),
    strength: 90,
  } as never;
  engine.state.objects = [
    {
      id: "stone",
      name: "Boulder",
      kind: "monument",
      prop: "boulder",
      sprite: "nature-boulder-slab-0",
      inventory: {},
      pos: { x: 1, y: 0, space: "outside" },
    } as never,
  ];
  return { engine, runtime: new Runtime(engine, { cacheTerrain: false }) };
}

it("sets a boulder running down a slope, well past where you stopped pushing", () => {
  const { engine, runtime } = slope();
  expect(runtime.move(1, 0)?.status).toBe("completed");
  expect(engine.state.objects[0].pos.x).toBeGreaterThan(4);
  // The player takes their one step; the stone goes on alone.
  expect(engine.state.player.pos.x).toBe(1);
  expect(runtime.shoveEffect?.path?.length).toBeGreaterThan(3);
});

it("rolls a boulder onto someone and hurts them", () => {
  const { engine, runtime } = slope();
  engine.state.actors = [
    {
      id: "ana",
      name: "Ana",
      kind: "human",
      role: "Farmer",
      pos: { x: 4, y: 0, space: "outside" },
      sprite: "human-0-0",
      inventory: {},
      hunger: 0,
      fatigue: 0,
      activity: "Standing",
      trust: 1,
      memories: [],
      direction: 2,
      health: 100,
    } as never,
  ];
  runtime.move(1, 0);
  const ana = engine.state.actors[0];
  expect(ana.health).toBeLessThan(100);
  expect(ana.memories.some((m) => m.includes("Struck by"))).toBe(true);
  // It stops short of them rather than standing on their cell.
  expect(engine.state.objects[0].pos.x).toBe(3);
});

it("loses a boulder rolled into deep water", () => {
  const { engine, runtime } = slope();
  const deep = {
    waterDepth: "deep" as const,
    height: 0,
    surface: "water" as const,
  };
  engine.world.topography = ((x: number) =>
    x >= 3 ? deep : { height: 0, surface: "grass" }) as never;
  runtime.move(1, 0);
  const stone = engine.state.objects[0];
  expect(stone.submerged).toBe(true);
  // Out of play: it no longer blocks the cell it went down in.
  expect(engine.blocked(stone.pos.x, stone.pos.y, "outside")).toBe(false);
  expect(engine.shovePlan(1, 0)).toBeUndefined();
  // And it is still under water after a save and a reload.
  const saved = snapshotSchema.parse(JSON.parse(JSON.stringify(engine.snapshot())));
  expect(saved.objects.find((o) => o.id === "stone")?.submerged).toBe(true);
});
