import { expect, it } from "vitest";
import { createSession, Runtime } from "../src/runtime/session";
import { commandSchema, snapshotSchema } from "../src/runtime/schema";
import { editedDecoration, tileKey } from "../src/core/tile-edits";
import { fellingSwings } from "../src/content/ecology/vegetation";
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
  expect(engine.toolProblem("chop", "tile:1,0")).toBe(
    "There is nothing here to fell.",
  );
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
