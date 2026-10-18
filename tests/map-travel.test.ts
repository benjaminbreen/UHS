import { expect, it } from "vitest";
import { Engine } from "../src/core/engine";
import { createSession, Runtime } from "../src/runtime/session";
import { MapTravel, journeyPlan } from "../src/runtime/map-travel";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { MapExit } from "../src/world/travel/network";
import type { MapEntrance } from "../src/world/travel/entrances";
import { worldFacts } from "../src/narrator/prompt";
import { outlookOf } from "../src/core/outlook";
import { standingOf } from "../src/core/standing";
import { beliefOf, beliefsFor } from "../src/content/beliefs";
import { householdLine } from "../src/core/persona";
import { infect, diseaseState } from "../src/core/health";
const a = "place:london",
  b = "place:oxford",
  edge = a + "~" + b;
function fixture() {
  const base = createSession(
    "roman",
    "map-travel-test",
    { content: 2, generator: 1 },
  );
  const make = (id: string, reachable = true) => {
    const side = id === a ? -192 : 191;
    const entry: MapEntrance = {
      id: edge,
      to: id === a ? b : a,
      mode: "land",
      bearing: id === a ? "W" : "E",
      shore: false,
      walkable: true,
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
      ...(reachable ? {} : { blocked: () => true }),
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
    async (id) => {
      const next = make(id);
      if (id === b) {
        next.state.manifest.seed = "foreign-map";
        next.world.pack.setting = settingFor(places.find((p) => p.id === "beijing")!, 1300);
        next.world.pack.concern = "A messenger's day in Beijing.";
        next.state.actors = next.state.actors.map((a) => ({ ...a, name: `Foreign ${a.name}` }));
        next.state.households = [{ id: "foreign-family", members: ["player"], home: next.state.player.home, storeId: "foreign-store" }];
        next.state.player.householdId = "foreign-family";
      }
      return next;
    },
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
  source.state.player.hungerDebt = 3600;
  source.state.player.encounterAfter = source.state.clock + 86400;
  source.state.ailments = [infect(source.state, "cough", source.state.player, source.world.pack.setting, source.state.clock, "home contact", "air")];
  source.state.player.immune = { flux: source.state.clock + 86400 };
  source.state.player.preparedFoodUntil = source.state.clock + 86400;
  diseaseState(source.state).exposures.push({ who: "player", disease: "flux", source: "home provisions", route: "provisions", dose: 0.1, hour: Math.floor(source.state.clock / 3600) });
  source.state.player.householdId = "home-family";
  source.state.player.origin = { revision: 1, profile: "test", community: "local", livelihood: "weaver", notes: [] };
  source.state.player.relations = [{ other: source.state.actors[0].id, kind: "partner" }];
  source.state.households = [{ id: "home-family", members: ["player", source.state.actors[0].id], home: source.state.player.home, storeId: "home-store" }];
  const personal = (engine: Engine) => {
    const { seed, setting } = engine.state.manifest;
    const player = engine.state.player;
    return {
      facts: worldFacts(engine).split("\nPLAYER\n")[1].split("\nItem catalog ids:")[0],
      outlook: outlookOf(seed, player, setting!),
      belief: beliefOf(seed, player, beliefsFor(engine.world.pack.setting!)),
      standing: standingOf(seed, player),
      household: player.householdId,
    };
  };
  const original = personal(source);
  const playerName = source.state.player.name;
  await journey.cross(journey.entrances[0]);
  expect(journey.id).toBe(b);
  expect(runtime.engine.state.player.name).toBe(playerName);
  expect(runtime.engine.state.player.health).toBe(63);
  expect(runtime.engine.state.ailments?.filter((a) => a.who === "player")).toEqual(source.state.ailments);
  expect(runtime.engine.state.player.hungerDebt).toBe(3600);
  expect(runtime.engine.state.manifest.disease).toBe(1);
  expect(runtime.engine.state.player.immune).toEqual(source.state.player.immune);
  expect(runtime.engine.state.player.preparedFoodUntil).toBe(source.state.player.preparedFoodUntil);
  expect(runtime.engine.state.disease?.exposures.filter((e) => e.who === "player")).toEqual(source.state.disease?.exposures);
  runtime.engine.state.ailments![0].tended = true;
  expect(runtime.engine.state.player.held).toMatch(/^traveler:/);
  expect(personal(runtime.engine)).toEqual(original);
  expect(runtime.engine.state.households?.find((h) => h.id === "foreign-family")?.members).not.toContain("player");
  runtime.engine.state.player.health = 61;
  await journey.cross(journey.entrances[0]);
  expect(journey.id).toBe(a);
  expect(runtime.engine.state.actors[0].trust).toBe(79);
  expect(runtime.engine.state.player.health).toBe(61);
  expect(runtime.engine.state.ailments?.find((a) => a.who === "player")?.tended).toBe(true);
  expect(runtime.engine.state.disease?.exposures.filter((e) => e.who === "player")).toHaveLength(1);
  expect(runtime.engine.state.disease?.events.filter((e) => e.kind === "infection" && e.who === "player")).toHaveLength(1);
  expect(personal(runtime.engine)).toEqual(original);
  expect(
    runtime.engine.state.objects.filter((o) => o.carriedBy === "player"),
  ).toHaveLength(1);
  expect(runtime.engine.state.objects.some((o) => o.id === originalId)).toBe(
    false,
  );
  expect(journey.visited.size).toBe(1);
  runtime.engine.state.households![0].members = ["player"];
  runtime.engine.state.actors = [];
  expect(householdLine(runtime.engine.state)).toBe("Household of 1.");
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
  delete runtime.engine.state.manifest.disease;
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
  expect(runtime.engine.state.manifest.disease).toBeUndefined();
  expect(runtime.engine.state.ailments?.every((a) => !a.infection)).toBe(true);
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
  // The far side of the same line of ground, not the entrance marker.
  expect(runtime.engine.state.player.pos).toMatchObject({ x: 190, y: 35 });
  runtime.dispose();
});
it("prices a long journey in days, overland where it can and by sea where it must", () => {
  const isfahan = journeyPlan({ lon: 28.97, lat: 41.0 }, { lon: 51.67, lat: 32.65 });
  // Two to three months by caravan, as the road went.
  expect(isfahan.days).toBeGreaterThan(40);
  expect(isfahan.days).toBeLessThan(120);
  const cebu = journeyPlan({ lon: 120.98, lat: 14.6 }, { lon: 123.9, lat: 10.3 });
  expect(cebu.sea).toBeGreaterThan(cebu.land);
});
