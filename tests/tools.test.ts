import { expect, it } from "vitest";
import { createSession, Runtime } from "../src/runtime/session";
import { commandSchema, snapshotSchema } from "../src/runtime/schema";
import { editedDecoration, tileKey } from "../src/core/tile-edits";
import { fellingSwings } from "../src/content/ecology/vegetation";
import { BURN_SECONDS, oreAt, TORCH_SECONDS } from "../src/content/ecology/metals";
import type { Engine } from "../src/core/engine";
import type { Decoration } from "../src/core/types";

/** The session's own world is generated; tests want one plant in a known cell.
 * The wrapper is the same one the engine installs over a real world. */
function plant(engine: Engine, at: Decoration | undefined) {
  const base = (x: number, y: number) =>
    at && x === at.x && y === at.y ? at : undefined;
  engine.world.decoration = (x, y) =>
    editedDecoration(base(x, y), engine.state.tiles?.[tileKey(x, y)], x, y);
}
function holding(engine: Engine, prop: string) {
  engine.state.objects = [
    {
      id: "tool",
      name: prop,
      kind: "container",
      prop,
      carriedBy: "player",
      pos: { ...engine.state.player.pos },
      sprite: `study-prop-${prop}-0`,
      inventory: {},
    },
  ];
  engine.state.player.held = "tool";
}
function ground(engine: Engine) {
  engine.state.actors = [];
  engine.state.objects = [];
  engine.world.blocked = () => false;
  engine.world.terrain = () => "grass";
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  // Facing east: the cell at (1, 0) is what a tool lands on.
  engine.state.player.direction = 1;
}

it("accepts chop, dig and reap as interact actions", () => {
  for (const action of ["chop", "dig", "reap"])
    expect(
      commandSchema.safeParse({ type: "interact", target: "x", action })
        .success,
    ).toBe(true);
});

it("counts swings by the size of the plant", () => {
  expect(fellingSwings("nature-understory-low-leafy-shrub")).toBe(1);
  expect(fellingSwings("nature-broadleaf-sapling")).toBe(3);
  expect(fellingSwings("nature-silver-birch")).toBe(6);
  expect(fellingSwings("nature-broadleaf-giant")).toBe(9);
  expect(fellingSwings("nature-understory-dry-bunchgrass")).toBe(0);
  expect(fellingSwings("rock")).toBe(0);
});

it("fells a tree, leaves logs, and bucks them into firewood", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, {
    id: "decor-1-0",
    x: 1,
    y: 0,
    sprite: "nature-silver-birch",
    solid: true,
  });
  holding(engine, "axe");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  for (let i = 0; i < 6; i++) {
    expect(runtime.propControls().primary).toMatchObject({ action: "chop" });
    runtime.propAction("KeyF");
  }
  // The trunk lies where it fell, and the cell no longer blocks the way.
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-logs");
  expect(engine.world.decoration(1, 0)?.solid).toBe(false);
  expect(engine.state.player.inventory.wood).toBeUndefined();
  expect(runtime.propControls().primaryLabel).toBe("Buck the fallen trunk");
  runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-stump");
  expect(engine.state.player.inventory.wood).toBe(3);
  // A stump is not worth another swing.
  expect(runtime.propControls().primary).toBeUndefined();
});

it("takes a shrub off at the root and clears the stems", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, {
    id: "decor-1-0",
    x: 1,
    y: 0,
    sprite: "nature-dry-thorn-scrub",
    solid: false,
  });
  holding(engine, "axe");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-cut-thorns");
  runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)).toBeUndefined();
  expect(engine.state.player.inventory.wood).toBe(1);
});

it("refuses to chop grass and cuts it with the scythe instead", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, {
    id: "decor-1-0",
    x: 1,
    y: 0,
    sprite: "nature-understory-dry-bunchgrass",
    solid: false,
  });
  holding(engine, "axe");
  expect(engine.toolProblem("chop", "tile:1,0")).toBe(
    "There is nothing here to fell.",
  );
  holding(engine, "sickle");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-stubble");
});

it("digs a furrow in the ground underfoot when nothing faces the player", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, undefined);
  engine.world.terrain = (x) => (x === 1 ? "water" : "grass");
  holding(engine, "spade");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  expect(engine.world.decoration(0, 0)?.sprite).toBe("nature-furrow");
  expect(engine.state.tilesRevision).toBe(1);
  // Turned ground stays turned.
  expect(engine.toolProblem("dig", "tile:0,0")).toBe(
    "This ground is already turned.",
  );
});

it("reaps a standing crop into the player's hands", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, undefined);
  holding(engine, "sickle");
  engine.state.objects.push({
    id: "crop-1-0",
    name: "Cultivated grain",
    kind: "crop",
    pos: { x: 1, y: 0, space: "outside" },
    sprite: "wheat",
    inventory: { grain: 3 },
  });
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.propControls().primaryLabel).toBe("Cut the cultivated grain");
  runtime.propAction("KeyF");
  expect(engine.state.player.inventory.grain).toBe(3);
  expect(engine.state.objects.find((o) => o.id === "crop-1-0")?.depleted).toBe(
    true,
  );
});

it("keeps worked ground through a save", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, undefined);
  holding(engine, "spade");
  new Runtime(engine, { cacheTerrain: false }).propAction("KeyF");
  const saved = snapshotSchema.parse(JSON.parse(JSON.stringify(engine.state)));
  expect(saved.tiles).toEqual({ "1,0": { dug: true } });
  expect(saved.tilesRevision).toBe(1);
});

it("will not take an axe or a spade to ground it has already worked", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, undefined);
  holding(engine, "spade");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-furrow");
  holding(engine, "axe");
  expect(engine.toolProblem("chop", "tile:1,0")).toBe(
    "There is nothing here to fell.",
  );
  holding(engine, "sickle");
  expect(engine.toolProblem("reap", "tile:1,0")).toBe("Nothing here to cut.");
});

it("refuses to dig where something is rooted", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, {
    id: "decor-1-0",
    x: 1,
    y: 0,
    sprite: "nature-dry-thorn-scrub",
    solid: false,
  });
  holding(engine, "spade");
  expect(engine.toolProblem("dig", "tile:1,0")).toBe(
    "The dry thorn scrub is in the way.",
  );
  holding(engine, "axe");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  runtime.propAction("KeyF");
  holding(engine, "spade");
  expect(engine.toolProblem("dig", "tile:1,0")).toBeUndefined();
});

it("still strikes a breakable prop when the tool has nothing to work on", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, undefined);
  engine.world.terrain = () => "paving";
  holding(engine, "axe");
  engine.state.objects.push({
    id: "pot-1-0",
    name: "Earthen pot",
    kind: "container",
    prop: "pot",
    pos: { x: 1, y: 0, space: "outside" },
    sprite: "study-prop-earthen-pot-0",
    inventory: {},
  });
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.propControls().primaryLabel).toBe("Strike earthen pot");
  runtime.propAction("KeyF");
  expect(engine.state.objects.find((o) => o.id === "pot-1-0")?.damage).toBe(1);
});

it("breaks a rock into rubble and clears it away", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, { id: "decor-1-0", x: 1, y: 0, sprite: "rock", solid: true });
  holding(engine, "pick");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.propControls().primaryLabel).toBe("Break the rock");
  for (let i = 0; i < 4; i++) runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-rubble");
  expect(engine.world.decoration(1, 0)?.solid).toBe(false);
  expect(engine.state.player.inventory.stone).toBe(2);
  expect(runtime.propControls().primaryLabel).toBe("Clear the broken rock");
  runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)).toBeUndefined();
  expect(engine.state.player.inventory.stone).toBe(3);
});

it("grubs out a stump the axe left behind", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, {
    id: "decor-1-0",
    x: 1,
    y: 0,
    sprite: "nature-silver-birch",
    solid: true,
  });
  holding(engine, "axe");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  for (let i = 0; i < 7; i++) runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-stump");
  holding(engine, "pick");
  expect(runtime.propControls().primaryLabel).toBe("Grub out the stump");
  for (let i = 0; i < 3; i++) runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)).toBeUndefined();
});

it("keeps each tool to its own work", () => {
  const engine = createSession("roman", "tools");
  ground(engine);
  plant(engine, { id: "decor-1-0", x: 1, y: 0, sprite: "rock", solid: true });
  holding(engine, "axe");
  // An axe on stone is allowed, and costly; asking to mine with it is not the
  // way in — the chop action is.
  expect(engine.toolProblem("chop", "tile:1,0")).toBeUndefined();
  expect(engine.toolProblem("mine", "tile:1,0")).toBe(
    "You need a pick in hand.",
  );
  holding(engine, "pick");
  plant(engine, {
    id: "decor-1-0",
    x: 1,
    y: 0,
    sprite: "nature-silver-birch",
    solid: true,
  });
  expect(engine.toolProblem("mine", "tile:1,0")).toBe(
    "There is no rock here to break.",
  );
});

it("splits a rock with an axe, slower than a pick and at the axe's expense", () => {
  const engine = createSession("roman", "tools-axe-rock");
  ground(engine);
  plant(engine, { id: "decor-1-0", x: 1, y: 0, sprite: "rock", solid: true });
  holding(engine, "axe");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.propControls().primaryLabel).toBe("Split the rock");
  // A pick would have it open in four.
  for (let i = 0; i < 4; i++) runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("rock");
  for (let i = 0; i < 3; i++) runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-rubble");
  expect(engine.state.player.inventory.stone).toBe(2);
  // Seven blows on stone leave a mark on the edge.
  const axe = engine.state.objects.find((o) => o.id === "tool");
  expect(axe?.damage).toBeGreaterThan(0);
  // Clearing the rubble is still the pick's work.
  expect(runtime.propControls().primaryLabel).not.toBe("Clear the broken rock");
});

it("still fells a tree with a blunted axe", () => {
  const engine = createSession("roman", "tools-blunt");
  ground(engine);
  plant(engine, {
    id: "decor-1-0",
    x: 1,
    y: 0,
    sprite: "nature-silver-birch",
    solid: true,
  });
  holding(engine, "axe");
  engine.state.objects.find((o) => o.id === "tool")!.damage = 3;
  const runtime = new Runtime(engine, { cacheTerrain: false });
  for (let i = 0; i < 6; i++) runtime.propAction("KeyF");
  expect(engine.world.decoration(1, 0)?.sprite).toBe("nature-logs");
});

it("finds graded ore in a boulder and pockets it when the rock splits", () => {
  const engine = createSession("roman", "tools-ore");
  ground(engine);
  const seed = engine.state.manifest.seed;
  const year = engine.world.pack.setting?.year ?? 0;
  let x = 1;
  while (!oreAt(seed, x, 0, year)) x++;
  const ore = oreAt(seed, x, 0, year)!;
  engine.state.player.pos = { x: x - 1, y: 0, space: "outside" };
  plant(engine, { id: `decor-${x}-0`, x, y: 0, sprite: "rock", solid: true });
  holding(engine, "pick");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  for (let i = 0; i < 4; i++) runtime.propAction("KeyF");
  expect(engine.state.player.inventory[ore.item]).toBe(ore.yield);
  expect(runtime.toolEffect?.ore).toBe(true);
  // Before anyone smelted it, the same vein is only stone.
  expect(oreAt(seed, x, 0, -9000)).toBeUndefined();
});

it("lights a stick at a fire, and the torch sets a tree burning down to a stump", () => {
  const engine = createSession("roman", "tools-torch");
  ground(engine);
  const p = engine.state.player;
  p.inventory.stick = 1;
  p.heldItem = "stick";
  engine.state.objects = [
    {
      id: "hearth",
      name: "Camp fire",
      kind: "fire",
      prop: "hearth",
      pos: { x: 0, y: 1, space: "outside" },
      sprite: "study-prop-hearth-0",
      inventory: {},
    },
  ];
  const light = { type: "interact" as const, target: "hearth", action: "light" as const };
  expect(engine.validate(light)).toBeUndefined();
  engine.execute(light);
  expect(p.heldItem).toBe("torch");
  expect(p.inventory.stick).toBe(0);
  plant(engine, { id: "decor-1-0", x: 1, y: 0, sprite: "nature-silver-birch", solid: true });
  const burn = { type: "interact" as const, target: "tile:1,0", action: "burn" as const };
  expect(engine.validate(burn)).toBeUndefined();
  engine.execute(burn);
  expect(engine.state.fires).toHaveLength(1);
  engine.advance(BURN_SECONDS.large + 12);
  expect(engine.state.tiles?.["1,0"]).toMatchObject({ stage: "stump", burnt: true });
  engine.advance(TORCH_SECONDS);
  expect(p.heldItem).toBeUndefined();
  expect(snapshotSchema.safeParse(engine.snapshot()).success).toBe(true);
});

it("keeps a burnt building burnt through a save", () => {
  const engine = createSession("roman", "tools-building");
  const place = engine.world.places[0];
  engine.state.player.pos = { x: place.x - 1, y: place.y, space: "outside" };
  engine.state.player.inventory.torch = 1;
  engine.state.player.heldItem = "torch";
  expect(engine.ignite(place.x, place.y)).toBeDefined();
  engine.advance(1200);
  const saved = engine.state.places?.[place.id];
  expect(saved?.char).toBeGreaterThan(0);
  expect(saved!.roof).toBeLessThan(1);
  expect(snapshotSchema.safeParse(engine.snapshot()).success).toBe(true);
});

it("empties a burning house, and a household burnt out of it lives there no more", () => {
  const engine = createSession("roman", "tools-evacuate");
  const place = engine.world.places[0];
  const inside = engine.state.actors[0];
  inside.pos = { x: 3, y: 3, space: place.id };
  engine.state.households = [
    { id: "h", members: [inside.id], residence: place.id, home: { x: 3, y: 3, space: place.id }, storeId: "s" },
  ];
  inside.householdId = "h";
  engine.ignite(place.x, place.y);
  expect(inside.pos.space).toBe("outside");
  expect(engine.validate({ type: "interact", target: place.id, action: "enter" })).toBe("It is on fire.");
  engine.advance(3000);
  expect(place.structure!.abandoned).toBeDefined();
  expect(place.name).toMatch(/^Remains of/);
  expect(engine.state.households[0].residence).toBeUndefined();
  expect(engine.state.households[0].history?.at(-1)?.kind).toBe("fire");
});
