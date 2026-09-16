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
  runtime.climb();
  expect(engine.state.player.perch).toBeUndefined();

  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  expect(engine.climbable()).toMatchObject({ label: "the wall" });
  runtime.climb();
  expect(engine.state.player.perch?.label).toBe("the wall");
  runtime.climb();

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
