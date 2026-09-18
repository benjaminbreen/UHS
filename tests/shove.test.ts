import { expect, it } from "vitest";
import {
  isRefusal,
  planShove,
  shoveCapacity,
  type ShoveDef,
  type ShoveWorld,
} from "../src/core/shove";
import type { WorldObject } from "../src/core/types";

const object = (id: string, x: number, y: number, name = id): WorldObject =>
  ({
    id,
    name,
    kind: "container",
    prop: id,
    sprite: id,
    inventory: {},
    pos: { x, y, space: "outside" },
  }) as WorldObject;

/** A bare field with whatever objects and walls the test puts in it. */
const world = (
  objects: WorldObject[],
  defs: Record<string, ShoveDef | undefined>,
  walls: string[] = [],
  actors: string[] = [],
): ShoveWorld => ({
  ground: (x, y) => walls.includes(`${x},${y}`),
  propAt: (x, y) => objects.find((o) => o.pos.x === x && o.pos.y === y),
  actorAt: (x, y) => actors.includes(`${x},${y}`),
  crossable: () => true,
  shoveOf: (o) => defs[o.id],
});

const free: ShoveDef = { as: "free", mass: 1 };
const cart: ShoveDef = { as: "axle", axis: "x", mass: 2.4 };
const east = { dx: 1, dy: 0 };
const north = { dx: 0, dy: -1 };

it("slides a crate one cell", () => {
  const crate = object("crate", 5, 5);
  const plan = planShove(world([crate], { crate: free }), crate, east, 50);
  expect(isRefusal(plan)).toBe(false);
  if (isRefusal(plan)) return;
  expect(plan.moves).toEqual([{ id: "crate", to: { x: 6, y: 5 } }]);
});

it("refuses a crate against a wall", () => {
  const crate = object("crate", 5, 5, "Transport crate");
  const plan = planShove(
    world([crate], { crate: free }, ["6,5"]),
    crate,
    east,
    50,
  );
  expect(isRefusal(plan) && plan.refused).toBe("wall");
});

it("refuses to push through someone", () => {
  const crate = object("crate", 5, 5);
  const plan = planShove(
    world([crate], { crate: free }, [], ["6,5"]),
    crate,
    east,
    50,
  );
  expect(isRefusal(plan) && plan.reason).toMatch(/standing/);
});

it("pushes two and stops at three", () => {
  const a = object("a", 5, 5),
    b = object("b", 6, 5),
    c = object("c", 7, 5);
  const defs = { a: free, b: free, c: free };
  const two = planShove(world([a, b], defs), a, east, 90);
  expect(isRefusal(two)).toBe(false);
  // Far end first, so b is out of the way before a arrives.
  if (!isRefusal(two)) expect(two.moves.map((m) => m.id)).toEqual(["b", "a"]);
  const three = planShove(world([a, b, c], defs), a, east, 90);
  expect(isRefusal(three) && three.refused).toBe("heavy");
});

it("will not push what has no give in it", () => {
  const crate = object("crate", 5, 5),
    well = object("well", 6, 5, "Stone well");
  const plan = planShove(
    world([crate, well], { crate: free, well: undefined }),
    crate,
    east,
    90,
  );
  expect(isRefusal(plan) && plan.reason).toMatch(/Stone well will not budge/);
});

it("rolls a cart along its axle and not across it", () => {
  const wagon = object("cart", 5, 5, "Farm cart");
  const w = world([wagon], { cart });
  expect(isRefusal(planShove(w, wagon, east, 90))).toBe(false);
  const across = planShove(w, wagon, north, 90);
  expect(isRefusal(across) && across.refused).toBe("wheels");
});

it("weighs strength against the load", () => {
  const wagon = object("cart", 5, 5, "Farm cart");
  const w = world([wagon], { cart });
  // 2.4 sits between a frail shoulder and a strong one.
  expect(shoveCapacity(30)).toBeLessThan(2.4);
  expect(shoveCapacity(80)).toBeGreaterThan(2.4);
  expect(isRefusal(planShove(w, wagon, east, 30))).toBe(true);
  expect(isRefusal(planShove(w, wagon, east, 80))).toBe(false);
});

it("counts what a container is carrying", () => {
  const barrel = object("barrel", 5, 5, "Wooden barrel");
  barrel.inventory = { water: 8 };
  const w = world([barrel], { barrel: free });
  // Full, it is over a weak shoulder's capacity; empty it is not.
  expect(isRefusal(planShove(w, barrel, east, 10))).toBe(true);
  barrel.inventory = {};
  expect(isRefusal(planShove(w, barrel, east, 10))).toBe(false);
});

it("has no cornerwise shove", () => {
  const crate = object("crate", 5, 5);
  const plan = planShove(
    world([crate], { crate: free }),
    crate,
    { dx: 1, dy: 1 },
    90,
  );
  expect(isRefusal(plan)).toBe(true);
});

import { createSession, Runtime } from "../src/runtime/session";

/** A bare field with one prop on it, and a strong pair of shoulders. */
function field(prop: string, at = { x: 1, y: 0 }) {
  const engine = createSession("roman", `shove-${prop}`);
  engine.state.actors = [];
  engine.world.blocked = () => false;
  engine.world.decoration = () => undefined;
  engine.world.places = [];
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  engine.state.player.stats = {
    ...(engine.state.player.stats ?? ({} as never)),
    strength: 85,
  } as never;
  engine.state.objects = [
    {
      id: "it",
      name: "Transport crate",
      kind: "container",
      prop,
      sprite: "crate",
      inventory: {},
      pos: { x: at.x, y: at.y, space: "outside" },
    } as never,
  ];
  return { engine, runtime: new Runtime(engine, { cacheTerrain: false }) };
}

it("walks into a crate and pushes it along", () => {
  const { engine, runtime } = field("crate");
  expect(runtime.move(1, 0)?.status).toBe("completed");
  expect(engine.state.objects[0].pos).toMatchObject({ x: 2, y: 0 });
  expect(engine.state.player.pos).toMatchObject({ x: 1, y: 0 });
  // The renderer gets one shove to dress, and only once.
  expect(runtime.shoveEffect?.from).toEqual({ x: 1, y: 0 });
});

it("stops the step when the crate has nowhere to go", () => {
  const { engine, runtime } = field("crate");
  engine.world.blocked = (x) => x === 2;
  expect(runtime.move(1, 0)?.status).not.toBe("completed");
  expect(engine.state.objects[0].pos).toMatchObject({ x: 1, y: 0 });
  expect(engine.state.player.pos).toMatchObject({ x: 0, y: 0 });
  // A refusal is still worth showing.
  expect(runtime.shoveEffect?.refused).toBe("wall");
});

it("takes a cart east but not north", () => {
  const { engine, runtime } = field("farmCart");
  expect(runtime.move(1, 0)?.status).toBe("completed");
  expect(engine.state.objects[0].pos).toMatchObject({ x: 2, y: 0 });
  engine.state.player.pos = { x: 2, y: 1, space: "outside" };
  engine.state.objects[0].pos = { x: 2, y: 0, space: "outside" };
  expect(runtime.move(0, -1)?.status).not.toBe("completed");
  expect(runtime.shoveEffect?.refused).toBe("wheels");
});

it("leaves a shoved crate standing to be climbed", () => {
  const { engine, runtime } = field("crate");
  runtime.move(1, 0);
  expect(engine.climbable()?.id).toBe("it");
});
