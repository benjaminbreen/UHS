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
