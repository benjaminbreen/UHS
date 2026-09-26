import { expect, it } from "vitest";
import { createSession, Runtime } from "../src/runtime/session";
import { commandSchema } from "../src/runtime/schema";
import type { Engine } from "../src/core/engine";
import type { Decoration, WorldObject } from "../src/core/types";

function ground(engine: Engine) {
  engine.state.actors = [];
  engine.state.objects = [];
  engine.world.blocked = () => false;
  engine.world.terrain = () => "grass";
  engine.world.decoration = () => undefined;
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  // Facing east: (1, 0) is the cell the arc lands on.
  engine.state.player.direction = 1;
}
function prop(engine: Engine, key: string, x: number, y: number, carried = false) {
  const o: WorldObject = {
    id: `${key}-${x},${y}`,
    name: key,
    kind: "container",
    prop: key,
    pos: { x, y, space: "outside" },
    sprite: `study-prop-${key}-0`,
    inventory: {},
    ...(carried ? { carriedBy: "player" } : {}),
  };
  engine.state.objects.push(o);
  if (carried) engine.state.player.held = o.id;
  return o;
}
function decorate(engine: Engine, at: Decoration & { x: number; y: number }) {
  engine.world.decoration = (x, y) =>
    x === at.x && y === at.y ? at : undefined;
}

it("accepts a swing as a command of its own", () => {
  expect(commandSchema.safeParse({ type: "swing" }).success).toBe(true);
  expect(
    commandSchema.safeParse({ type: "swing", target: "x" }).success,
  ).toBe(false);
});

it("always swings, and reports what the arc found", () => {
  const engine = createSession("roman", "swing");
  ground(engine);
  // Empty hands over open grass: still a swing, and nothing is hurt.
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  expect(engine.lastSwing?.hits).toHaveLength(3);
  expect(engine.lastSwing?.hits.every((h) => !h.damaged)).toBe(true);
  expect(engine.lastSwing?.hits[0].hit).toBe("grass");
  runtime.dispose();
});

it("rings off rock, thumps a tree and shatters a pot", () => {
  const engine = createSession("roman", "swing-hits");
  ground(engine);
  prop(engine, "stick", 0, 0, true);
  decorate(engine, { id: "d1", x: 1, y: 0, sprite: "rock", solid: true });
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  expect(engine.lastSwing?.hits[0]).toMatchObject({
    hit: "rock",
    kind: "thwock",
    solid: true,
  });

  decorate(engine, {
    id: "d2",
    x: 1,
    y: 0,
    sprite: "nature-broadleaf-large",
    solid: true,
  });
  runtime.propAction("KeyF");
  expect(engine.lastSwing?.hits[0]).toMatchObject({ hit: "tree", kind: "thud" });

  engine.world.decoration = () => undefined;
  const pot = prop(engine, "pot", 1, 0);
  runtime.propAction("KeyF");
  expect(engine.lastSwing?.hits[0]).toMatchObject({
    hit: "pottery",
    damaged: true,
  });
  expect(pot.broken).toBe(true);
  runtime.dispose();
});

it("turns to what you obviously meant", () => {
  const engine = createSession("roman", "swing-aim");
  ground(engine);
  prop(engine, "stick", 0, 0, true);
  // A pot to the south while the player faces east: the swing turns to it.
  const pot = prop(engine, "pot", 0, 1);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.propAction("KeyF");
  expect(engine.state.player.direction).toBe(2);
  expect(pot.broken).toBe(true);
  runtime.dispose();
});

it("water catches a thrown pot instead of breaking it", () => {
  const engine = createSession("roman", "swing-throw");
  ground(engine);
  engine.world.terrain = (x) => (x >= 2 ? "water" : "grass");
  const pot = prop(engine, "pot", 0, 0, true);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.throwHeld(1, 0);
  expect(pot.broken).toBeFalsy();
  expect(engine.lastThrow?.hit).toMatchObject({ hit: "water", kind: "splash" });
  runtime.dispose();
});

it("takes an item in hand, swings it, and gives it back on stow", () => {
  const engine = createSession("roman", "swing-hand");
  ground(engine);
  engine.state.player.inventory = { tool: 1 };
  const runtime = new Runtime(engine, { cacheTerrain: false });

  expect(runtime.command({ type: "hold", item: "tool" })!.status).toBe(
    "completed",
  );
  expect(engine.state.player.heldItem).toBe("tool");
  expect(engine.state.player.inventory.tool).toBeUndefined();
  expect(runtime.verbs().primary).toMatchObject({
    kind: "strike",
    label: "Slash with small knife",
  });

  // A blade in hand shears brush rather than thumping it.
  decorate(engine, { id: "d3", x: 1, y: 0, sprite: "bush", solid: false });
  runtime.propAction("KeyF");
  expect(engine.lastSwing!.hits[0]).toMatchObject({ hit: "brush" });

  expect(runtime.command({ type: "stow" })!.status).toBe("completed");
  expect(engine.state.player.heldItem).toBeUndefined();
  expect(engine.state.player.inventory.tool).toBe(1);
  runtime.dispose();
});

it("thrusts immediately at the end of a spear's reach", () => {
  const engine = createSession("roman", "spear-input");
  ground(engine);
  prop(engine, "spear", 0, 0, true);
  const pot = prop(engine, "pot", 2, 0);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.verbs().primary?.label).toBe("Thrust at pot");
  runtime.pressSwing();
  expect(engine.lastSwing?.hits).toHaveLength(2);
  expect(pot.broken).toBe(true);
  expect(runtime.characterAction?.pose).toBe("thrust");
  expect(runtime.swingEffect?.contactMs).toBe(210);
  runtime.releaseCharge();
  runtime.dispose();
});

it("shows a held spear windup over empty ground before release", () => {
  const engine = createSession("roman", "spear-windup");
  ground(engine);
  prop(engine, "spear", 0, 0, true);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.pressSwing();
  expect(runtime.characterAction?.pose).toBe("thrust");
  expect(engine.lastSwing).toBeUndefined();
  runtime.releaseCharge();
  expect(engine.lastSwing?.thrust).toBe(true);
  runtime.dispose();
});

it("gives the pitchfork a jab and the rake a pulling stroke", () => {
  const engine = createSession("roman", "haft-actions");
  ground(engine);
  const fork = prop(engine, "pitchfork", 0, 0, true);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.verbs().primary?.label).toBe("Thrust pitchfork");
  runtime.propAction("KeyF");
  expect(engine.lastSwing?.hits).toHaveLength(2);
  expect(runtime.characterAction?.pose).toBe("thrust");
  fork.prop = "rake";
  fork.name = "rake";
  fork.sprite = "study-prop-rake-0";
  expect(runtime.verbs().primary?.label).toBe("Rake with the rake");
  runtime.propAction("KeyF");
  expect(runtime.characterAction?.pose).toBe("till");
  runtime.dispose();
});

it("casts a thrown spear after its release pose", () => {
  const engine = createSession("roman", "spear-cast");
  ground(engine);
  prop(engine, "spear", 0, 0, true);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.throwHeld(1, 0);
  expect(runtime.characterAction?.pose).toBe("cast");
  expect(runtime.throwEffect?.launchMs).toBe(240);
  runtime.dispose();
});

it("aims spears and sticks between the old eight directions", () => {
  for (const weapon of ["spear", "stick"]) {
    const engine = createSession("roman", `aimed-${weapon}`);
    ground(engine);
    prop(engine, weapon, 0, 0, true);
    const target = weapon === "spear" ? { x: 7, y: 3 } : { x: 5, y: 2 };
    const preview = engine.projectilePath(target, engine.missile().range);
    expect(preview.at(-1)).toEqual(target);
    const runtime = new Runtime(engine, { cacheTerrain: false });
    runtime.throwHeld(1, 1, false, undefined, target);
    expect(engine.lastThrow?.to).toEqual(preview.at(-1));
    expect(engine.state.objects.find((o) => o.id === engine.lastThrow?.id)?.projectile)
      .toMatchObject({ dx: target.x, dy: target.y });
    expect(runtime.characterAction?.pose).toBe("cast");
    runtime.dispose();
  }
});

it("uses the same first obstruction for preview and impact", () => {
  const engine = createSession("roman", "aimed-wall");
  ground(engine);
  prop(engine, "spear", 0, 0, true);
  engine.world.blocked = (x, y) => x === 4 && y === 2;
  const target = { x: 7, y: 3 };
  const preview = engine.projectilePath(target, engine.missile().range);
  expect(preview.at(-1)).toEqual({ x: 3, y: 1 });
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.throwHeld(1, 1, false, undefined, target);
  expect(engine.lastThrow?.to).toEqual(preview.at(-1));
  runtime.dispose();
});

it("draws a bow, spends an arrow, and leaves a missed shot to recover", () => {
  const engine = createSession("roman", "bow-shot");
  ground(engine);
  engine.state.player.heldItem = "bow";
  engine.state.player.inventory = { arrow: 2 };
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.verbs().primary?.label).toBe("Draw bow");
  runtime.shootBow({ x: 6, y: 3 }, 1);
  expect(engine.lastThrow).toMatchObject({ to: { x: 6, y: 3 }, arrow: true });
  expect(runtime.characterAction?.pose).toBe("draw");
  expect(engine.state.player.inventory.arrow).toBe(1);
  expect(engine.state.objects.some((o) => o.item === "arrow" && o.pos.x === 6 && o.pos.y === 3)).toBe(true);
  expect(engine.state.objects.find((o) => o.item === "arrow")?.projectile)
    .toMatchObject({ dx: 6, dy: 3 });
  runtime.shootBow({ x: 6, y: 3 }, 1);
  expect(engine.state.player.inventory.arrow).toBeUndefined();
  expect(runtime.verbs().primary?.label).toBe("No arrows");
  expect(runtime.shootBow({ x: 6, y: 3 }, 1)?.status).toBe("rejected");
  runtime.dispose();
});

it("whirls a sling, spends a stone, and leaves it where it fell", () => {
  const engine = createSession("roman", "sling-shot");
  ground(engine);
  engine.state.player.heldItem = "sling";
  engine.state.player.inventory = { pebble: 1 };
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.verbs().primary?.label).toBe("Whirl sling");
  runtime.shootBow({ x: 5, y: 2 }, 1);
  expect(engine.lastThrow).toMatchObject({ to: { x: 5, y: 2 }, sling: true });
  expect(runtime.characterAction?.pose).toBe("whirl");
  expect(engine.state.player.inventory.pebble).toBeUndefined();
  expect(engine.state.objects.some((o) => o.item === "pebble" && o.pos.x === 5 && o.pos.y === 2)).toBe(true);
  expect(runtime.verbs().primary?.label).toBe("No stones");
  runtime.dispose();
});

it("slashes with a knife in hand", () => {
  const engine = createSession("roman", "knife-slash");
  ground(engine);
  engine.state.player.heldItem = "tool";
  engine.state.player.inventory = { tool: 1 };
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.command({ type: "swing" });
  expect(runtime.characterAction?.pose).toBe("slash");
  runtime.dispose();
});

it("keeps an arrow in a surviving animal and lets it travel with it", () => {
  const engine = createSession("roman", "lodged-arrow");
  ground(engine);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.devSpawnFauna("red-deer", 1, "very-strong");
  const herd = engine.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
  herd.members[0].x = 4;
  herd.members[0].y = 0;
  runtime.devArm("item:bow");
  runtime.shootBow({ x: 8, y: 0 }, 0.35);
  const arrow = engine.state.objects.find((o) => o.item === "arrow")!;
  expect(arrow.projectile?.lodgedIn).toEqual({ group: herd.id, n: herd.members[0].n });
  expect(arrow.pos.x).toBe(herd.members[0].x);
  engine.advance(6);
  expect(arrow.pos).toMatchObject({ x: herd.members[0].x, y: herd.members[0].y });
  runtime.dispose();
});

it("keeps a fatal shot in the falling animal until its body clears", () => {
  const engine = createSession("roman", "fatal-arrow");
  ground(engine);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.devSpawnFauna("red-deer", 1, "ordinary");
  const herd = engine.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
  herd.members[0].x = 4;
  herd.members[0].y = 0;
  herd.members[0].hp = 1;
  runtime.devArm("item:bow");
  runtime.shootBow({ x: 8, y: 0 });
  expect(engine.lastThrow?.creature?.killed).toBe(true);
  expect(engine.state.objects.find((o) => o.item === "arrow")?.projectile?.lodgedIn)
    .toEqual({ group: herd.id, n: 1 });
  runtime.dispose();
});

it("one hand: picking a prop up puts the held item away", () => {
  const engine = createSession("roman", "swing-swap");
  ground(engine);
  engine.state.player.inventory = { tool: 1 };
  const stick = prop(engine, "stick", 1, 0);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.command({ type: "hold", item: "tool" });
  runtime.command({ type: "interact", target: stick.id, action: "pickup" });
  expect(engine.state.player.held).toBe(stick.id);
  expect(engine.state.player.heldItem).toBeUndefined();
  expect(engine.state.player.inventory.tool).toBe(1);
  runtime.dispose();
});
