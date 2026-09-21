import { expect, it } from "vitest";
import { terrainJump, type TopographyCell } from "../src/core/topography";
import { createSession, Runtime } from "../src/runtime/session";
import { commandSchema } from "../src/runtime/schema";

const sample =
  (cells: Record<string, Partial<TopographyCell>> = {}) =>
  (x: number, y: number): TopographyCell => ({
    height: 0,
    surface: "grass",
    ...cells[`${x},${y}`],
  });
const from = { x: 0, y: 0 },
  to = { x: 1, y: 0 };
it("reaches two tiles standing and three with a run-up", () => {
  expect(terrainJump(sample(), from, to, "short")).toMatchObject({
    distance: 2,
  });
  expect(terrainJump(sample(), from, to, "long")).toMatchObject({
    distance: 3,
  });
  expect(terrainJump(sample(), from, to, "short", true)).toMatchObject({
    distance: 3,
  });
  expect(terrainJump(sample(), from, to, "long", true)).toMatchObject({
    distance: 4,
  });
});
it("reserves two-tier climbs for a charged jump", () => {
  const ledge = sample({
    "1,0": { height: 2 },
    "2,0": { height: 2 },
    "3,0": { height: 2 },
    "4,0": { height: 2 },
  });
  // A short jump only catches the edge; a charged one lands on it.
  expect(terrainJump(ledge, from, to, "short", true)).toMatchObject({
    kind: "climb",
    caught: true,
  });
  expect(terrainJump(ledge, from, to, "long", true)).toMatchObject({
    kind: "climb",
  });
  // One tier above the climb is a ledge catch; two above is out of reach.
  expect(
    terrainJump(sample({ "1,0": { height: 3 } }), from, to, "long", true),
  ).toMatchObject({ kind: "climb", caught: true });
  expect(
    terrainJump(sample({ "1,0": { height: 4 } }), from, to, "long", true).kind,
  ).toBe("blocked");
});
it("requires dry land and cannot pass through walls or diagonal corners", () => {
  const stream = sample({
    "1,0": { surface: "water" },
    "2,0": { surface: "water" },
  });
  expect(terrainJump(stream, from, to, "short").kind).toBe("blocked");
  expect(terrainJump(stream, from, to, "short", true)).toMatchObject({
    distance: 3,
  });
  expect(
    terrainJump(sample({ "1,0": { solid: true } }), from, to, "long", true).kind,
  ).toBe("blocked");
  expect(
    terrainJump(
      sample({ "1,0": { solid: true } }),
      from,
      { x: 1, y: 1 },
      "long",
    ).kind,
  ).toBe("blocked");
  expect(
    terrainJump(sample({ "2,0": { solid: true } }), from, to, "long", true),
  ).toMatchObject({ distance: 1 });
});
it("keeps legacy moves unchanged, runs faster, and enforces pickup/drop and carrying rules", () => {
  const engine = createSession("roman", "new-controls");
  engine.world.blocked = () => false;
  engine.world.canCross = () => true;
  engine.world.topography = sample();
  engine.world.elevation = () => 0;
  engine.state.actors = [];
  engine.state.objects = [];
  engine.state.player.pos = { ...from, space: "outside" };
  const runtime = new Runtime(engine, { cacheTerrain: false });
  expect(runtime.move(1, 0)?.elapsedSeconds).toBe(2);
  expect(runtime.move(1, 0, false, true)?.elapsedSeconds).toBe(1);
  const start = engine.state.player.pos.x;
  expect(runtime.jump(1, 0, "long", true)).toBe(4);
  expect(engine.state.player.pos.x).toBe(start + 4);
  const prop = {
    id: "controls-pot",
    prop: "pot",
    name: "Pot",
    kind: "container" as const,
    pos: { ...engine.state.player.pos },
    sprite: "pot",
    inventory: {},
    open: false,
  };
  engine.state.objects.push(prop);
  runtime.propAction("KeyF");
  expect(engine.state.player.held).toBe(prop.id);
  const carrying = engine.state.player.pos.x;
  runtime.jump(1, 0, "short", true);
  runtime.jump(1, 0, "long", true);
  expect(engine.state.player.pos.x).toBe(carrying);
  runtime.propAction("KeyE");
  expect(engine.state.player.held).toBeUndefined();
  expect(engine.traversal(engine.state.player.pos, 1, 0).kind).toBe("blocked");
  expect(engine.traversal(engine.state.player.pos, -1, 0)).toMatchObject({
    distance: 1,
  });
  expect(
    commandSchema.parse({ type: "move", dx: 1, dy: 0, jump: "long" }),
  ).toHaveProperty("jump", "long");
  runtime.dispose();
});
