import { expect, it } from "vitest";
import { createSession, Runtime } from "../src/runtime/session";
import { commandSchema } from "../src/runtime/schema";

/** Every action the engine can interact with has to survive the schema, or the
 * command is rejected before it ever reaches validate(). */
it("accepts climb and descend as interact actions", () => {
  for (const action of ["climb", "descend"])
    expect(
      commandSchema.safeParse({ type: "interact", target: "x", action })
        .success,
    ).toBe(true);
});

it("climbs a tree, a wall and a ledge, and comes back down", () => {
  const engine = createSession("roman", "climbing");
  engine.state.actors = [];
  engine.state.objects = [];
  engine.world.blocked = (x) => x === 2;
  engine.world.enclosures = [
    {
      x: 2,
      y: -4,
      w: 1,
      h: 9,
      gate: { x: 2, y: 4 },
      parts: Array.from({ length: 9 }, (_, i) => ({
        x: 2,
        y: i - 4,
        frame: "wall",
      })),
    },
  ];
  engine.world.decoration = (x, y) =>
    x === -1 && y === 0
      ? { id: "decor--1-0", x, y, sprite: "nature-oak", solid: true }
      : undefined;
  engine.world.places = [];
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  const runtime = new Runtime(engine, { cacheTerrain: false });

  // The tree is nearer in the search order than the wall two cells east.
  expect(engine.climbable()).toMatchObject({ id: "decor--1-0", label: "Oak" });
  runtime.climb();
  expect(engine.state.player.perch?.on).toBe("decor--1-0");
  // The renderer draws the player over the thing, not the ground beside it.
  expect(engine.state.player.perch?.at).toEqual({ x: -1, y: 0 });
  expect(engine.state.player.pos).toMatchObject({ x: 0, y: 0 });
  runtime.climb();
  expect(engine.state.player.perch).toBeUndefined();

  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  expect(engine.climbable()).toMatchObject({ label: "the wall" });
  runtime.climb();
  // A wall is walked on, not perched on: the player stands on the wall cell.
  expect(engine.state.player.pos).toMatchObject({ x: 2, y: 0 });
  expect(engine.state.player.perch).toBeUndefined();
  expect(engine.onWall()).toBe(true);
  // Along the wall is open; off the wall is a climb down.
  expect(runtime.move(0, 1)?.status).toBe("completed");
  expect(engine.state.player.pos).toMatchObject({ x: 2, y: 1 });
  expect(engine.climbable()).toBeUndefined();
  runtime.climb();
  expect(engine.onWall()).toBe(false);

  // A ledge is climbed onto, not perched on: the player ends up standing there.
  engine.world.blocked = () => false;
  engine.world.decoration = () => undefined;
  engine.world.topography = (x) => ({
    height: x >= 2 ? 2 : 0,
    surface: "grass",
  });
  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  expect(engine.climbable()).toMatchObject({ to: { x: 2, y: 0 } });
  runtime.climb();
  expect(engine.state.player.pos.x).toBe(2);
  expect(engine.state.player.perch).toBeUndefined();
  runtime.dispose();
});

it("jumps down the far side of a tree and a wall", () => {
  const engine = createSession("roman", "dismount");
  engine.state.actors = [];
  engine.state.objects = [];
  engine.world.blocked = (x) => x === 2;
  engine.world.enclosures = [
    {
      x: 2,
      y: -4,
      w: 1,
      h: 9,
      gate: { x: 2, y: 4 },
      parts: Array.from({ length: 9 }, (_, i) => ({
        x: 2,
        y: i - 4,
        frame: "wall",
      })),
    },
  ];
  engine.world.decoration = (x, y) =>
    x === -1 && y === 0
      ? { id: "decor--1-0", x, y, sprite: "nature-oak", solid: true }
      : undefined;
  engine.world.places = [];
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  const runtime = new Runtime(engine, { cacheTerrain: false });

  runtime.climb();
  expect(engine.state.player.perch?.on).toBe("decor--1-0");
  // West is the far side of the tree: the way in was from the east.
  runtime.climb(-1, 0);
  expect(engine.state.player.perch).toBeUndefined();
  expect(engine.state.player.pos).toMatchObject({ x: -2, y: 0 });
  expect(engine.lastLeap?.kind).toBe("drop");

  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  runtime.climb();
  expect(engine.onWall()).toBe(true);
  // Over the top: down the side the player did not come up.
  runtime.climb(1, 0);
  expect(engine.onWall()).toBe(false);
  expect(engine.state.player.pos).toMatchObject({ x: 3, y: 0 });

  // A shut side falls back to coming down the way you went up.
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  runtime.climb();
  expect(engine.state.player.perch?.on).toBe("decor--1-0");
  runtime.climb(1, 0);
  expect(engine.state.player.perch).toBeUndefined();
  expect(engine.state.player.pos).toMatchObject({ x: 0, y: 0 });
  runtime.dispose();
});
