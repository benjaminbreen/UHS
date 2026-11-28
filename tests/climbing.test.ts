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
  // Whatever the drop did to an ankle, the next climb wants a sound body.
  delete engine.state.player.injury;

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
  expect(engine.state.player.dead).toMatch(/^a fall from /);
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

it("hurts far more jumping off a town wall than hopping a field wall", () => {
  const jump = (frame: string) => {
    const engine = createSession("roman", "wall-jump");
    engine.world.topography = undefined;
    engine.world.elevation = () => 0;
    engine.world.terrain = () => "grass";
    engine.state.actors = [];
    engine.state.objects = [];
    engine.world.blocked = (x) => x === 2;
    engine.world.places = [];
    engine.world.enclosures = [{ x: 2, y: -4, w: 1, h: 9, gate: { x: 2, y: 4 },
      parts: Array.from({ length: 9 }, (_, i) => ({ x: 2, y: i - 4, frame })) }];
    engine.state.player.pos = { x: 1, y: 0, space: "outside" };
    const runtime = new Runtime(engine, { cacheTerrain: false });
    runtime.climb();
    runtime.climb(1, 0);
    runtime.dispose();
    return 100 - (engine.state.player.health ?? 100);
  };
  expect(jump("wall")).toBeLessThan(10);
  expect(jump("wall-masonry-5-0")).toBeGreaterThanOrEqual(30);
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
  // A jump in the middle of a roof is a hop along it, not a way down.
  runtime.climb(1, 0);
  expect(engine.state.player.perch?.at).toEqual({ x: 2, y: -1 });
  runtime.climb(1, 0);
  expect(engine.state.player.perch).toMatchObject({ on: "b", at: { x: 4, y: -1 } });
  // Two cells of air is too far: off that side is a drop to the ground.
  runtime.move(1, 0);
  runtime.move(1, 0);
  runtime.climb(1, 0);
  expect(engine.state.player.perch).toBeUndefined();
  expect(engine.state.player.pos).toMatchObject({ x: 7, y: -1 });
  delete engine.state.player.injury;

  engine.state.player.pos = { x: 12, y: 0, space: "outside" };
  const before = engine.state.clock;
  runtime.climb();
  expect(engine.state.player.perch).toMatchObject({ on: "c", roof: true, by: "ladder" });
  expect(engine.state.clock - before).toBeLessThan(40);
  runtime.dispose();
});

it("a jump off a three-storey roof kills", () => {
  const engine = createSession("roman", "roof-fall");
  engine.state.actors = [];
  engine.state.objects = [];
  engine.world.places = [{ id: "a", name: "a", description: "", x: 0, y: -3, w: 4, h: 3, sprite: "westasian-courtyard-maghrebi-large-0",
    entrance: { x: 1, y: 0 }, access: "household", owner: "", claim: "", entranceLabel: "" }] as never;
  engine.world.blocked = (x, y) => y >= -3 && y < 0 && x >= 0 && x < 4;
  engine.world.decoration = () => undefined;
  engine.world.enclosures = [];
  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  engine.state.player.health = 100;
  engine.perch(engine.climbable()!);
  engine.descend({ dx: 0, dy: 1 });
  expect(engine.state.player.dead).toBe("a fall from a roof");
});

it("a two-level drop often turns an ankle or breaks something, and never kills a well player", () => {
  const hurt: string[] = [];
  for (let i = 0; i < 40; i++) {
    const engine = createSession("roman", `drop-${i}`);
    engine.state.player.health = 100;
    const at = { ...engine.state.player.pos };
    (engine as unknown as { fall(a: unknown, b: unknown, extra: number): void }).fall(at, at, 2);
    expect(engine.state.player.dead).toBeUndefined();
    if (engine.state.player.injury?.id) hurt.push(engine.state.player.injury.id);
  }
  const serious = hurt.filter((id) => /sprained|broken|wrenched/.test(id)).length;
  expect(serious).toBeGreaterThan(8);
  expect(serious).toBeLessThan(30);
});

it("a broken leg stops the world, slows the walk, forbids running and climbing, and comes back as it knits", () => {
  const engine = createSession("roman", "broken-leg");
  engine.state.player.health = 100;
  (engine as unknown as { injure(id: string): void }).injure("broken-leg");
  expect(engine.signals.some((s) => s.kind === "injured" && s.id === "broken-leg")).toBe(true);
  expect(engine.setback).toMatchObject({ kicker: "INJURED", title: "Broken leg", injury: "broken-leg" });
  expect(engine.setback?.lines?.some((l) => /No running/.test(l))).toBe(true);
  expect(engine.gait()).toMatchObject({ pace: 0.4, run: false, climb: false, ride: false, lame: 2 });
  expect(engine.hurtLook()).toBe("crutch");
  expect(engine.validate({ type: "move", dx: 1, dy: 0, jump: "short" })).toBe("Not with a broken leg.");
  expect(engine.validate({ type: "interact", action: "climb" } as never)).toBe("Not with a broken leg.");
  // A sprain after it does not displace the break.
  (engine as unknown as { injure(id: string): void }).injure("sprained-ankle");
  expect(engine.state.player.injury?.id).toBe("broken-leg");

  const i = engine.state.player.injury!, span = i.until - i.since!;
  i.since = engine.state.clock - span * 0.8;
  i.until = i.since + span;
  expect(engine.gait().run).toBe(true);
  expect(engine.gait().pace).toBeGreaterThan(0.8);
  expect(engine.hurtLook()).toBe("splint");
  i.until = engine.state.clock;
  (engine as unknown as { injured(): boolean }).injured();
  expect(engine.state.player.injury).toBeUndefined();
  expect(engine.gait().pace).toBe(engine.state.player.scars?.includes("crooked-leg") ? 0.88 : 1);
});

it("a wheelchair takes slopes but not banks, and no stairs", () => {
  const engine = createSession("roman", "chair");
  engine.state.actors = [];
  engine.state.objects = [];
  engine.world.blocked = () => false;
  engine.world.decoration = () => undefined;
  engine.world.canCross = () => true;
  // A bank up at x = 2, and a slope up at y = 3.
  engine.world.topography = (x, y) => ({ height: x >= 2 ? 1 : 0, surface: "grass", ...(y === 3 && x === 2 ? { ramp: "e" as const } : {}) });
  engine.state.player.pos = { x: 1, y: 0, space: "outside" };
  const body = { look: "wheelchair" as const, name: "paralysis", pace: 0.85, run: false, climb: false, ride: false, lame: 0 as const };
  (engine as unknown as { body(): typeof body }).body = () => body;
  expect(engine.hurtLook()).toBe("wheelchair");
  expect(engine.validate({ type: "move", dx: 1, dy: 0 })).toBe("Too steep for the chair. Find a slope.");
  expect(engine.playerCanCross({ x: 1, y: 0 }, { x: 2, y: 0 })).toBe(false);
  expect(engine.playerCanCross({ x: 1, y: 3 }, { x: 2, y: 3 })).toBe(true);
  expect(engine.validate({ type: "move", dx: 0, dy: 1 })).toBeUndefined();
  expect(engine.validate({ type: "interact", action: "mount-cycle", target: "x" } as never)).toBe("Not with paralysis.");
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

it("names vehicles, furniture, fences and street trees instead of falling back to the wall", () => {
  const engine = createSession("roman", "climb-labels");
  engine.world.topography = undefined;
  engine.world.elevation = () => 0;
  engine.world.terrain = (x, y) => (x === 10 && y === 0 ? "water" : "grass");
  engine.world.decoration = () => undefined;
  engine.world.places = [];
  engine.world.enclosures = [{ x: 20, y: 0, w: 1, h: 1, gate: { x: 20, y: 5 }, parts: [{ x: 20, y: 0, frame: "study-propb-works-fence-0" }] }];
  engine.state.actors = [];
  const solid = new Set(["2,0", "3,0", "4,0", "2,-1", "3,-1", "4,-1", "6,0", "7,0", "8,0", "10,0", "14,0", "16,0", "20,0"]);
  engine.world.blocked = (x, y) => solid.has(`${x},${y}`);
  engine.state.objects = [
    { id: "pickup", name: "Pickup truck", kind: "monument", sprite: "vehicle-pickup-1975-0-e", pos: { x: 3, y: 0, space: "outside" }, inventory: {}, car: { model: "pickup-1975", paint: 0, rect: [2, -1, 4, 0] } },
    { id: "bench", name: "Park bench", kind: "monument", sprite: "study-propb-park-bench-0", pos: { x: 7, y: 0, space: "outside" }, inventory: {} },
    { id: "sign", name: "Stop sign", kind: "monument", sprite: "sign", pos: { x: 14, y: 0, space: "outside" }, inventory: {} },
    { id: "street-tree", name: "Street tree", kind: "tree", sprite: "study-propb-city-plane-0", pos: { x: 16, y: 0, space: "outside" }, inventory: {} },
  ];

  // Parked pickup truck (whose rect is in plan.solid): climbs the truck, not the wall.
  engine.state.player.pos = { x: 3, y: 1, space: "outside" };
  expect(engine.climbable()).toMatchObject({ id: "pickup", label: "the pickup truck" });
  expect(engine.tallAt({ x: 3, y: 0 })).toEqual({ label: "the pickup truck" });

  // Once driven away, its freed parking cells do not report a ghost wall.
  engine.state.objects[0].car!.freed = [2, -1, 4, 0];
  delete engine.state.objects[0].car!.rect;
  engine.state.objects[0].motor = { facing: 2, long: false, taken: true, slim: 1 };
  engine.state.objects[0].pos = { x: 30, y: 0, space: "outside" };
  expect(engine.climbable()).toBeUndefined();
  // Standing next to the moved truck still names the truck.
  engine.state.player.pos = { x: 30, y: 1, space: "outside" };
  expect(engine.climbable()).toMatchObject({ id: "pickup", label: "the pickup truck" });

  // Wide park bench: both centre and side cells name the bench.
  engine.state.player.pos = { x: 6, y: 1, space: "outside" };
  expect(engine.climbable()).toMatchObject({ id: "bench", label: "the park bench" });

  // Deep water and street signs are not climbable walls.
  engine.state.player.pos = { x: 10, y: 1, space: "outside" };
  expect(engine.climbable()).toBeUndefined();
  engine.state.player.pos = { x: 14, y: 1, space: "outside" };
  expect(engine.climbable()).toBeUndefined();

  // Street tree WorldObject names the street tree; fence enclosure names the fence.
  engine.state.player.pos = { x: 16, y: 1, space: "outside" };
  expect(engine.climbable()).toMatchObject({ id: "street-tree", label: "the street tree" });
  engine.state.player.pos = { x: 20, y: 1, space: "outside" };
  expect(engine.climbable()).toMatchObject({ label: "the fence" });
});
