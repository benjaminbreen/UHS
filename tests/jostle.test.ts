import { expect, it } from "vitest";
import { createSession } from "../src/runtime/session";
import type { Engine } from "../src/core/engine";

function field(seed: string) {
  const engine = createSession("roman", seed);
  engine.state.actors = [];
  engine.state.objects = [];
  engine.state.fauna = [];
  engine.world.blocked = () => false;
  engine.world.canCross = undefined;
  engine.world.topography = undefined;
  engine.world.terrain = () => "grass";
  engine.world.decoration = () => undefined;
  engine.world.fauna = undefined;
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  return engine;
}
function beside(engine: Engine, species: string) {
  engine.devSpawnFauna(species, 1, "ordinary");
  const g = engine.state.fauna!.at(-1)!;
  g.members[0].x = 1;
  g.members[0].y = 0;
  g.pos = { x: 1, y: 0, space: "outside" };
  return g.members[0];
}
const east = { type: "move", dx: 1, dy: 0 } as const;

it("scatters a hen from underfoot and lets the player through", () => {
  const engine = field("jostle-hen");
  const hen = beside(engine, "chicken");
  expect(engine.validate(east)).toBeUndefined();
  engine.execute(east);
  expect(engine.state.player.pos).toMatchObject({ x: 1, y: 0 });
  expect([hen.x, hen.y]).not.toEqual([1, 0]);
  expect(engine.lastJostle).toMatchObject({ small: true, yielded: true });
});

it("shoulders a sheep aside: it moves, and the step after goes through", () => {
  const engine = field("jostle-sheep");
  const sheep = beside(engine, "sheep");
  expect(engine.validate(east)).toBeUndefined();
  engine.execute(east);
  expect(engine.state.player.pos).toMatchObject({ x: 0, y: 0 });
  expect([sheep.x, sheep.y]).not.toEqual([1, 0]);
  expect(engine.lastJostle).toMatchObject({ small: false });
  expect(engine.validate(east)).toBeUndefined();
  engine.execute(east);
  expect(engine.state.player.pos).toMatchObject({ x: 1, y: 0 });
});

it("cannot shift a cow, or a sheep with nowhere to go", () => {
  const engine = field("jostle-cow");
  const cow = beside(engine, "cattle");
  expect(engine.validate(east)).toMatch(/does not move/);
  expect([cow.x, cow.y]).toEqual([1, 0]);

  const penned = field("jostle-penned");
  beside(penned, "sheep");
  penned.world.blocked = (x, y) => !(y === 0 && (x === 0 || x === 1));
  expect(penned.validate(east)).toMatch(/does not move/);
});

it("asking whether a step is allowed does not spend the random stream", () => {
  const engine = field("jostle-pure");
  beside(engine, "sheep");
  const before = engine.state.randomCounter;
  engine.validate(east);
  expect(engine.state.randomCounter).toBe(before);
});
