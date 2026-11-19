import { expect, it, vi } from "vitest";
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
  engine.world.topography = undefined;
  engine.world.elevation = () => 0;
  engine.world.terrain = () => "grass";
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
      ? { id: "decor--1-0", x, y, sprite: "nature-broadleaf-sapling", solid: true }
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
  expect(engine.state.player.health).toBe(82);
  expect(engine.state.player.injury?.name).toBe("sprained ankle");

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


it("makes jumping from a tall tree dangerous while climbing down is safe", () => {
  const engine = createSession("roman", "tree-fall");
  engine.state.actors = [];
  engine.state.objects = [];
  engine.state.fauna = [];
  engine.world.fauna = undefined;
  engine.world.topography = undefined;
  engine.world.elevation = () => 0;
  engine.world.terrain = () => "grass";
  engine.world.blocked = () => false;
  engine.world.places = [];
  engine.world.decoration = (x, y) => x === 1 && y === 0
    ? { id: "tree", x, y, sprite: "nature-broadleaf-giant", solid: true } : undefined;
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  engine.state.player.health = 100;
  engine.perch(engine.climbable()!);
  engine.descend();
  expect(engine.state.player.health).toBe(100);
  engine.perch(engine.climbable()!);
  engine.descend({ dx: 1, dy: 0 });
  expect(engine.state.player.health).toBe(0);
  expect(engine.state.player.dead).toBe("a fall");
});

it("sends the watch along the wall to order the player down", () => {
  const engine = createSession("roman", "wall-watch");
  const guard = engine.state.actors.find((a) => a.kind === "human")!;
  engine.state.actors = [guard];
  engine.state.objects = [];
  engine.world.blocked = (x) => x === 2;
  engine.world.places = [];
  engine.world.enclosures = [
    {
      x: 2,
      y: -20,
      w: 1,
      h: 41,
      gate: { x: 2, y: 30 },
      parts: Array.from({ length: 41 }, (_, i) => ({ x: 2, y: i - 20, frame: "wall-masonry-5-0" })),
    },
  ];
  const beat = Array.from({ length: 8 }, (_, i) => ({ x: 2, y: 12 + i }));
  Object.assign(guard, { pos: { x: 2, y: 12, space: "outside" }, watch: { path: beat, loop: false, speed: 0.6, waits: [60, 60], phase: 0 } });
  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  engine.state.player.inventory.coin = 0;
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.climb();
  expect(engine.onWall()).toBe(true);

  runtime.command({ type: "wait", seconds: 30 });
  expect(Math.abs(guard.pos.y) + Math.abs(guard.pos.x - 2)).toBeLessThanOrEqual(1);
  expect(guard.pos.x).toBe(2);
  const card = engine.cards.find((c) => c.kind === "speech" && c.speaker === guard.id)!;
  expect(card.choose?.choices.map((c) => c.label)).toEqual(["Come down", "Explain yourself", "Pay him to look away", "Run along the wall"]);
  expect(card.choose?.choices[2].unavailable).toBeTruthy();

  // Running only buys a few seconds: he runs faster than you walk.
  expect(runtime.command({ type: "choose", card: card.choose!.card, choice: 3 })?.status).toBe("completed");
  runtime.move(0, -1);
  runtime.command({ type: "wait", seconds: 10 });
  expect(engine.onWall()).toBe(false);
  expect(engine.cards.some((c) => c.speaker === guard.id && /Got you/.test(c.text))).toBe(true);
  runtime.command({ type: "wait", seconds: 60 });
  expect(guard.activity).not.toMatch(/off the wall/);
  runtime.dispose();
});

it("lets the player talk, pay or step their way down from the watch", () => {
  const setup = (seed: string) => {
    const engine = createSession("roman", seed);
    const guard = engine.state.actors.find((a) => a.kind === "human")!;
    engine.state.actors = [guard];
    engine.state.objects = [];
    engine.world.blocked = (x) => x === 2;
    engine.world.places = [];
    engine.world.enclosures = [{ x: 2, y: -20, w: 1, h: 41, gate: { x: 2, y: 30 },
      parts: Array.from({ length: 41 }, (_, i) => ({ x: 2, y: i - 20, frame: "wall-masonry-5-0" })) }];
    Object.assign(guard, { pos: { x: 2, y: 4, space: "outside" },
      watch: { path: [{ x: 2, y: 4 }, { x: 2, y: 8 }], loop: false, speed: 0.6, waits: [60, 60], phase: 0 } });
    engine.state.player.pos = { x: 1, y: 0, space: "outside" };
    const runtime = new Runtime(engine, { cacheTerrain: false });
    runtime.climb();
    runtime.command({ type: "wait", seconds: 10 });
    const card = engine.cards.find((c) => c.speaker === guard.id)!.choose!.card;
    return { engine, runtime, guard, card };
  };

  const down = setup("watch-down");
  down.runtime.command({ type: "choose", card: down.card, choice: 0 });
  expect(down.engine.onWall()).toBe(false);
  down.runtime.dispose();

  const paid = setup("watch-pay");
  paid.engine.state.player.inventory.coin = 5;
  paid.runtime.command({ type: "choose", card: paid.card, choice: 2 });
  const took = paid.engine.lastChoice!.won;
  expect(paid.engine.state.player.inventory.coin).toBe(took ? 3 : 5);
  // Paid off, he goes back to his round and leaves you up there.
  paid.runtime.command({ type: "wait", seconds: 30 });
  expect(paid.engine.onWall()).toBe(true);
  if (took) expect(paid.guard.activity).not.toMatch(/off the wall/);
  paid.runtime.dispose();
});

it("takes toll at a town gate by day and shuts it at night", () => {
  const engine = createSession("roman", "town-gate");
  const guard = engine.state.actors.find((a) => a.kind === "human")!;
  engine.state.actors = [guard];
  engine.state.objects = [];
  engine.world.blocked = () => false;
  engine.world.places = [];
  engine.world.enclosures = [{ x: -5, y: 0, w: 15, h: 12, gate: { x: 2, y: 0 }, parts: [], gates: [{ opening: [{ x: 2, y: 0 }, { x: 3, y: 0 }], outward: { x: 0, y: -1 }, jambs: [{ x: 1, y: 0 }, { x: 4, y: 0 }], covered: true }] }];
  const post = { x: 1, y: -1 };
  Object.assign(guard, { pos: { ...post, space: "outside" }, post: { at: post, rest: { x: 1, y: 3 }, face: 0 } });
  delete guard.watch;
  const day = Math.floor(engine.state.clock / 86400) * 86400;
  engine.state.clock = day + 10 * 3600;
  engine.state.player.pos = { x: 2, y: -2, space: "outside" };
  Object.assign(engine.state.player.inventory, { salt: 12, coin: 3 });
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.move(0, 1);
  runtime.move(0, 1);
  expect(engine.state.player.pos.y).toBe(0);
  expect(engine.state.player.inventory.coin).toBe(3);
  expect(runtime.command({ type: "choose", card: `toll:${guard.id}`, choice: 0 })?.status).toBe("completed");
  expect(engine.state.player.inventory.coin).toBe(2);

  engine.state.player.pos = { x: 2, y: -1, space: "outside" };
  engine.state.clock = day + 22 * 3600;
  expect(runtime.command({ type: "move", dx: 0, dy: 1 })?.reason).toMatch(/shut for the night/);
  runtime.dispose();
});

it.each(["east", "south"])("carries the wall walk over the %s gate while the road passes underneath", side => {
  const engine = createSession("roman", "two-gate-levels");
  const at = (road: number, span: number) => side === "east" ? { x: road, y: span } : { x: span, y: road };
  const outside = (road: number, span: number) => ({ ...at(road, span), space: "outside" });
  const opening = [-1, 0, 1].map(v => at(0, v)), jambs: [typeof opening[0], typeof opening[0]] = [at(0, -2), at(0, 2)];
  engine.world.enclosures = [{ x: -5, y: -5, w: 10, h: 10, gate: at(0, 0),
    parts: jambs.map(p => ({ ...p, frame: "wall-none" })), gates: [{ opening, jambs, outward: at(1, 0), covered: true }] }];
  engine.world.blocked = (x, y) => jambs.some(p => p.x === x && p.y === y);
  engine.world.canCross = () => true;
  engine.world.places = [];
  engine.state.objects = [];
  const watch = engine.state.actors.find(a => a.kind === "human")!;
  engine.state.actors = [watch];
  watch.pos = outside(0, 0);
  watch.watch = { path: [at(0, 0), at(0, 0)], loop: false, speed: 1, waits: [1800, 1800], phase: 0 };
  const runtime = new Runtime(engine, { cacheTerrain: false });
  const day = Math.floor(engine.state.clock / 86400) * 86400;
  engine.state.clock = day + 12 * 3600;
  engine.state.player.pos = outside(1, 0);
  expect(engine.findRoute(engine.state.player.pos, at(-1, 0)).path).toEqual([at(0, 0), at(-1, 0)]);
  const inward = at(-1, 0);
  runtime.move(inward.x, inward.y);
  expect(engine.state.player.pos).toEqual(outside(0, 0));
  expect(engine.onWall()).toBe(false);
  engine.state.actors = [];
  engine.state.player.pos = outside(0, -2);
  engine.state.clock = day + 23 * 3600;
  expect(engine.findRoute(engine.state.player.pos, at(0, 2)).path).toEqual([...opening, at(0, 2)]);
  for (const v of [-1, 0, 1, 2]) {
    const along = at(0, 1);
    runtime.move(along.x, along.y);
    expect(engine.state.player.pos).toEqual(outside(0, v));
    expect(engine.onWall()).toBe(true);
    expect(engine.blocked(0, 0, "outside")).toBe(true);
  }
  runtime.dispose();
});

it("retries a failed watch route when the gates open", () => {
  const engine = createSession("roman", "watch-routing");
  engine.state.manifest.simulation = 2;
  engine.state.manifest.watchRouting = 1;
  engine.state.clock = 5 * 3600 - 18;
  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  engine.state.objects = [];
  engine.world.places = [];
  engine.world.blocked = () => false;
  const guard = engine.state.actors.find((a) => a.kind === "human")!;
  engine.state.actors = [guard];
  guard.pos = { x: 0, y: 0, space: "outside" };
  guard.post = { at: { x: 4, y: 0 }, rest: { x: 0, y: 0 }, night: true };
  const route = vi.spyOn(engine, "findRoute").mockReturnValue({ status: "budget", path: [], visited: 5000, cost: Infinity });

  engine.advance(36);

  expect(route).toHaveBeenCalledTimes(2);
  expect(route).toHaveBeenLastCalledWith(guard.pos, { ...guard.post.at, space: "outside" }, guard.id, 5000);
});

it("walks a flat roof and its neighbour's, and sits on a pitched one", () => {
  const engine = createSession("roman", "roofs");
  engine.state.actors = [];
  engine.state.objects = [];
  const house = (id: string, x: number, sprite: string) =>
    ({ id, name: id, description: "", x, y: -3, w: 3, h: 3, sprite, entrance: { x: x + 1, y: 0 },
      access: "household", owner: "", claim: "", entranceLabel: "" }) as never;
  engine.world.places = [house("a", 0, "house-mud-0"), house("b", 3, "house-mud-0"), house("c", 6, "house-cottage-timber-0")];
  engine.world.blocked = (x, y) => x >= 0 && x < 9 && y >= -3 && y < 0;
  engine.world.decoration = () => undefined;
  engine.world.enclosures = [];
  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  const runtime = new Runtime(engine, { cacheTerrain: false });

  runtime.climb();
  expect(engine.state.player.perch).toMatchObject({ on: "a", roof: true, at: { x: 1, y: -1 } });
  expect(runtime.move(0, -1)?.status).toBe("completed");
  for (let i = 0; i < 3; i++) runtime.move(1, 0);
  expect(engine.state.player.perch).toMatchObject({ on: "b", at: { x: 4, y: -2 } });
  // The pitched roof next door is not walked onto.
  runtime.move(1, 0);
  runtime.move(1, 0);
  expect(runtime.move(1, 0)?.status).toBe("rejected");
  // Climbing down comes down beside where you stand, not where you went up.
  runtime.move(0, 1);
  runtime.climb();
  expect(engine.state.player.perch).toBeUndefined();
  expect(engine.state.player.pos).toMatchObject({ x: 5, y: 0 });

  engine.state.player.pos = { x: 7, y: 0, space: "outside" };
  runtime.climb();
  expect(engine.state.player.perch).toMatchObject({ on: "c" });
  expect(engine.state.player.perch?.roof).toBeFalsy();
  expect(runtime.move(0, -1)?.status).toBe("rejected");
  runtime.dispose();
});

it("jumps a one-cell alley between flat roofs, and goes up a house's own ladder", () => {
  const engine = createSession("roman", "roof-leap");
  engine.state.actors = [];
  engine.state.objects = [];
  const house = (id: string, x: number, w: number, sprite: string) =>
    ({ id, name: id, description: "", x, y: -3, w, h: 3, sprite, entrance: { x: x + 1, y: 0 },
      access: "household", owner: "", claim: "", entranceLabel: "" }) as never;
  engine.world.places = [house("a", 0, 3, "house-mud-0"), house("b", 4, 3, "house-mud-0"), house("c", 10, 9, "westasian-courtyard-iranian-small-0")];
  engine.world.blocked = (x, y) => y >= -3 && y < 0 && ((x >= 0 && x < 3) || (x >= 4 && x < 7) || (x >= 10 && x < 19));
  engine.world.decoration = () => undefined;
  engine.world.enclosures = [];
  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  const runtime = new Runtime(engine, { cacheTerrain: false });

  runtime.climb();
  runtime.move(1, 0);
  expect(engine.state.player.perch?.at).toEqual({ x: 2, y: -1 });
  runtime.climb(1, 0);
  expect(engine.state.player.perch).toMatchObject({ on: "b", at: { x: 4, y: -1 } });
  // Two cells of air is too far: off that side is a drop to the ground.
  runtime.move(1, 0);
  runtime.move(1, 0);
  runtime.climb(1, 0);
  expect(engine.state.player.perch).toBeUndefined();
  expect(engine.state.player.pos).toMatchObject({ x: 7, y: -1 });

  engine.state.player.pos = { x: 12, y: 0, space: "outside" };
  const before = engine.state.clock;
  runtime.climb();
  expect(engine.state.player.perch).toMatchObject({ on: "c", roof: true, by: "ladder" });
  expect(engine.state.clock - before).toBeLessThan(40);
  runtime.dispose();
});

it("sprints off a roof edge across a street, and only as far as the run-up carries", () => {
  const engine = createSession("roman", "roof-sprint");
  engine.state.actors = [];
  engine.state.objects = [];
  const house = (id: string, x: number, w: number) =>
    ({ id, name: id, description: "", x, y: -3, w, h: 3, sprite: "house-mud-0", entrance: { x: x + 1, y: 0 },
      access: "household", owner: "", claim: "", entranceLabel: "" }) as never;
  // A five-cell street, then a three-cell lane.
  engine.world.places = [house("a", 0, 6), house("b", 11, 3), house("c", 17, 3)];
  engine.world.blocked = (x, y) => y >= -3 && y < 0 && !!(engine.world.places as { x: number; w: number }[]).some((p) => x >= p.x && x < p.x + p.w);
  engine.world.decoration = () => undefined;
  engine.world.enclosures = [];
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  const runtime = new Runtime(engine, { cacheTerrain: false });
  const sprint = (dx: number) => runtime.command({ type: "move", dx, dy: 0, run: true });

  runtime.climb();
  expect(engine.state.player.perch?.at).toEqual({ x: 0, y: -1 });
  // No run-up: the street is too wide, and walking off the edge is refused.
  for (let i = 0; i < 5; i++) runtime.move(1, 0);
  expect(sprint(1)?.status).toBe("rejected");
  for (let i = 0; i < 5; i++) runtime.move(-1, 0);
  for (let i = 0; i < 5; i++) sprint(1);
  expect(sprint(1)?.status).toBe("completed");
  expect(engine.state.player.perch).toMatchObject({ on: "b", at: { x: 11, y: -1 } });
  expect(engine.lastLeap?.distance).toBe(4);
  // Momentum carries on: two more strides and over the lane.
  sprint(1);
  sprint(1);
  sprint(1);
  expect(engine.state.player.perch).toMatchObject({ on: "c", at: { x: 17, y: -1 } });
  runtime.dispose();
});
