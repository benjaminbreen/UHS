import { expect, it } from "vitest";
import { Engine } from "../src/core/engine";
import { createSession, Runtime } from "../src/runtime/session";
import { MapTravel } from "../src/runtime/map-travel";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { MapExit } from "../src/world/travel/network";
import type { MapEntrance } from "../src/world/travel/entrances";
const a = "place:london",
  b = "place:oxford",
  edge = a + "~" + b;
function fixture() {
  const base = createSession(
    "roman",
    "map-travel-test",
    undefined,
    undefined,
    2,
    1,
  );
  const make = (id: string, reachable = true) => {
    const side = id === a ? -192 : 191;
    const entry: MapEntrance = {
      id: edge,
      to: id === a ? b : a,
      mode: "land",
      bearing: id === a ? "W" : "E",
      shore: false,
      point: reachable ? { x: side, y: 0 } : undefined,
      path: [3, 2, 1, 0].map((n) => ({ x: side + (id === a ? n : -n), y: 0 })),
    };
    const setting = {
      ...settingFor(places.find((p) => p.id === "london")!),
      playableMap: { id, size: 384 as const, exits: [] },
    };
    const world = {
      ...base.world,
      pack: { ...base.world.pack, setting },
      spawn: { x: 0, y: 0, space: "outside" },
      entrances: () => [entry],
    };
    const snapshot = base.snapshot();
    snapshot.manifest.setting = setting;
    snapshot.player.pos = { x: 0, y: 0, space: "outside" };
    return new Engine(world, base.items, snapshot);
  };
  const exits = (id: string): MapExit[] => [
    {
      id: edge,
      from: id,
      to: id === a ? b : a,
      name: "Neighbor",
      bearing: id === a ? "W" : "E",
      mode: "land",
      km: 80,
    },
  ];
  const runtime = new Runtime(make(a), { cacheTerrain: false });
  return { make, exits, runtime };
}
it("preserves the traveler, carried objects and changed maps across a return visit", async () => {
  const { make, exits, runtime } = fixture();
  const journey = new MapTravel(
    runtime,
    a,
    1300,
    async (id) => make(id),
    exits,
    () => [],
  );
  const source = runtime.engine;
  source.state.actors[0].trust = 79;
  const carried = source.state.objects[0];
  const originalId = carried.id;
  carried.carriedBy = "player";
  source.state.player.held = originalId;
  source.state.player.health = 63;
  const playerName = source.state.player.name;
  await journey.cross(journey.entrances[0]);
  expect(journey.id).toBe(b);
  expect(runtime.engine.state.player.name).toBe(playerName);
  expect(runtime.engine.state.player.health).toBe(63);
  expect(runtime.engine.state.player.held).toMatch(/^traveler:/);
  runtime.engine.state.player.health = 61;
  await journey.cross(journey.entrances[0]);
  expect(journey.id).toBe(a);
  expect(runtime.engine.state.actors[0].trust).toBe(79);
  expect(runtime.engine.state.player.health).toBe(61);
  expect(
    runtime.engine.state.objects.filter((o) => o.carriedBy === "player"),
  ).toHaveLength(1);
  expect(runtime.engine.state.objects.some((o) => o.id === originalId)).toBe(
    false,
  );
  expect(journey.visited.size).toBe(1);
  runtime.dispose();
});
it("leaves the source untouched when the paired entrance is unreachable", async () => {
  const { make, exits, runtime } = fixture();
  const journey = new MapTravel(
    runtime,
    a,
    1300,
    async (id) => make(id, false),
    exits,
    () => [],
  );
  const engine = runtime.engine;
  await journey.cross(journey.entrances[0]);
  expect(runtime.engine).toBe(engine);
  expect(journey.id).toBe(a);
  expect(journey.visited.size).toBe(0);
  expect(journey.busy).toBe(false);
  expect(runtime.notice).toContain("no reachable paired entrance");
  runtime.dispose();
});
it("intercepts an outward step and guards the paired entrance after arrival", async () => {
  const { make, exits, runtime } = fixture();
  const journey = new MapTravel(
    runtime,
    a,
    1300,
    async (id) => make(id),
    exits,
    () => [],
  );
  runtime.engine.state.player.pos = { x: -192, y: 0, space: "outside" };
  expect(journey.intercept({ type: "move", dx: -1, dy: 0 })).toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(journey.id).toBe(b);
  runtime.engine.state.player.pos = { x: 191, y: 0, space: "outside" };
  expect(journey.intercept({ type: "move", dx: 1, dy: 0 })).toBe(true);
  expect(runtime.notice).toContain("Step away");
  runtime.dispose();
});
it("shares nearby preparation with crossing and cancels pending work on disposal", async () => {
  const { make, exits, runtime } = fixture();
  let calls = 0;
  const journey = new MapTravel(
    runtime,
    a,
    1300,
    async (id) => {
      calls++;
      return make(id);
    },
    exits,
    () => [],
  );
  runtime.engine.state.player.pos = { x: -190, y: 0, space: "outside" };
  journey.observe();
  journey.observe();
  await journey.cross(journey.entrances[0]);
  expect(calls).toBe(1);
  expect(journey.status().prepared).toBeUndefined();
  runtime.dispose();
  const second = fixture();
  let signal: AbortSignal | undefined;
  const pending = new MapTravel(
    second.runtime,
    a,
    1300,
    (_id, _year, abort) => {
      signal = abort;
      return new Promise<Engine>((_resolve, reject) =>
        abort?.addEventListener("abort", () => reject(Error("cancelled")), {
          once: true,
        }),
      );
    },
    second.exits,
    () => [],
  );
  second.runtime.engine.state.player.pos = { x: -190, y: 0, space: "outside" };
  pending.observe();
  second.runtime.dispose();
  expect(signal?.aborted).toBe(true);
  await Promise.resolve();
});
it("crosses a land border away from the original entrance marker", async () => {
  const { make, exits, runtime } = fixture();
  const journey = new MapTravel(
    runtime,
    a,
    1300,
    async (id) => make(id),
    exits,
    () => [],
  );
  runtime.engine.state.player.pos = { x: -192, y: 35, space: "outside" };
  expect(journey.intercept({ type: "move", dx: -1, dy: 0 })).toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(journey.id).toBe(b);
  runtime.dispose();
});
