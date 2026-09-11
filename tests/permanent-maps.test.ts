import { expect, it } from "vitest";
import {
  permanentMap,
  permanentExits,
  mapForCoordinate,
  connectionPath,
} from "../src/world/travel/network";
import { mapEntrances } from "../src/world/travel/entrances";
import type { WorldModel } from "../src/core/types";
import { atlasSample, toAtlas } from "../src/world/geography/atlas";
import { kilometers } from "../src/world/travel/geography";
import { travelLocations } from "../src/content/geography/travel";
import backboneNames from "../src/content/geography/travel/generated/backbone-names.json";
it("keeps identities and reciprocal exits across dates and independent inspections", () => {
  const a = permanentMap("place:london", 1300),
    old = permanentMap("place:london", -5000);
  expect(a.size).toBe(384);
  expect(old.size).toBe(304);
  expect(a.networkId).toBe(old.networkId);
  const exits = permanentExits(a.networkId, 1300);
  expect(exits.length).toBeGreaterThan(0);
  for (const e of exits)
    expect(
      permanentExits(e.to, -5000).some(
        (back) => back.id === e.id && back.to === a.networkId,
      ),
    ).toBe(true);
  permanentExits(mapForCoordinate({ lon: 140, lat: -25 }), 2000);
  expect(permanentExits(a.networkId, 1300)).toEqual(exits);
  expect(permanentMap("place:oxford", 1300).size).toBe(304);
});
it("covers oceans, polar landscapes and arbitrary land without authored corridors", () => {
  for (const [lon, lat] of [
    [-30, 20],
    [160, -20],
    [75, 0],
    [0, -89],
    [-20, 65],
    [115, 0],
  ]) {
    const id = mapForCoordinate({ lon, lat });
    expect(permanentExits(id, 1300).length).toBeGreaterThan(0);
    expect(permanentMap(id, 1300).size).toBe(304);
  }
});
it("retains the same geographic path on a return connection", () => {
  const e = permanentExits("place:london", 1300).find(
    (e) => e.mode === "land",
  )!;
  const back = permanentExits(e.to, 1300).find((x) => x.id === e.id)!;
  expect(connectionPath(e)).toEqual(connectionPath(back).reverse());
});
it("places entrances on reachable boundaries and exposes blocked connections", () => {
  const world = {
    spawn: { x: 0, y: 0 },
    terrain: () => "grass",
    blocked: (x: number, _y: number) => x === 1,
    canCross: () => true,
  } as unknown as WorldModel;
  const exits = [{ id: "a~b", to: "b", bearing: "W", mode: "land" }];
  const [e] = mapEntrances(world, 16, exits);
  expect(e.point?.x).toBe(-8);
  expect(e.path[0]).toEqual({ x: 0, y: 0 });
  expect(e.path.at(-1)).toEqual(e.point);
  expect(e.path.every((p) => p.x < 1)).toBe(true);
  const boxed = {
    ...world,
    blocked: (x: number, y: number) => Math.abs(x) + Math.abs(y) > 0,
  };
  expect(mapEntrances(boxed, 16, exits)[0].point).toBeUndefined();
});

it("bounds the existing generator without changing the underlying Earth terrain", async () => {
  const { settingForTravelStop } = await import(
    "../src/world/travel/environment"
  );
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const { packForSetting } = await import("../src/content/geography/pack");
  const map = permanentMap("place:london", -5000);
  const setting = settingForTravelStop(map, -5000);
  setting.playableMap = { id: map.networkId, size: 384, exits: [] };
  setting.environment!.population = "none";
  setting.environment!.start = "wanderer";
  const world = createSettlementWorld(packForSetting(setting), "bounded-check");
  expect(world.blocked(192, 0, "outside")).toBe(true);
  expect(world.blocked(-193, 0, "outside")).toBe(true);
  expect(world.canCross?.({ x: 191, y: 0 }, { x: 192, y: 0 })).toBe(false);
  expect(Math.abs(world.spawn.x)).toBeLessThan(192);
  expect(Math.abs(world.spawn.y)).toBeLessThan(192);
  expect(world.settlements).toHaveLength(0);
  expect(world.decoration(5000, 5000)).toBeUndefined();
  expect(world.prepare().plans).toHaveLength(0);
}, 30000);
it("routes along the California coast without requiring a boat", () => {
  const exits = permanentExits("place:city-san-diego", -1649);
  const south = exits.find((e) => e.to === "place:city-tijuana")!;
  expect(south.mode).toBe("land");
  expect(connectionPath(south).length).toBeGreaterThan(0);
});

it("gives catalog places directional access to the backbone", () => {
  for (const id of ["city-butembo", "london", "city-san-diego"]) {
    const exits = permanentExits("place:" + id, 1300);
    expect(
      exits.some((e) => e.mode === "land" && e.bearing.includes("N")),
      id,
    ).toBe(true);
    for (const e of exits)
      expect(
        permanentExits(e.to, 1300).some(
          (back) => back.to === "place:" + id && back.id === e.id,
        ),
      ).toBe(true);
  }
});

it("starts inland points on a land map, whatever their routing cell", () => {
  let checked = 0;
  for (let i = 0; checked < 120 && i < 4000; i++) {
    const lon = ((i * 137.508) % 360) - 180,
      lat = ((i * 79.31) % 150) - 75;
    const a = toAtlas(lon, lat);
    if (atlasSample(a.x, a.y).coast < 0) continue;
    checked++;
    expect(
      mapForCoordinate({ lon, lat }).startsWith("sea:"),
      `${lon},${lat}`,
    ).toBe(false);
  }
  expect(checked).toBe(120);
}, 30000);

it("resolves a start whose gazetteer id differs from its travel id", () => {
  // area-edinburgh and city-tunis have no travel-catalog id of the same name.
  for (const place of [
    { lon: -3.1883, lat: 55.9533 },
    { lon: 10.1815, lat: 36.8065 },
  ]) {
    const near = travelLocations
      .filter((p) => kilometers(p, place) < 25)
      .sort((a, b) => kilometers(a, place) - kilometers(b, place))[0];
    expect(near).toBeDefined();
    const map = permanentMap("place:" + near.id, 1400);
    expect(map.water).toBe(false);
    expect(
      permanentExits("place:" + near.id, 1400).some((e) => e.mode === "land"),
    ).toBe(true);
  }
}, 30000);

it("gives backbone maps names that tell them apart", () => {
  const ids = new Set<string>();
  for (let lat = -84; lat <= 84; lat += 3)
    for (let lon = -180; lon < 180; lon += 3) {
      const id = mapForCoordinate({ lon, lat });
      if (!id.startsWith("sea:")) ids.add(id);
    }
  const byName = new Map<string, number>();
  for (const id of ids) {
    const name = permanentMap(id, 1400).name;
    byName.set(name, (byName.get(name) ?? 0) + 1);
  }
  const shared = [...byName.values()].filter((n) => n > 1);
  // Only the featureless polar and shield interiors may still share a name.
  expect(shared.reduce((a, b) => a + b, 0)).toBeLessThan(ids.size * 0.05);
  expect(Math.max(...byName.values())).toBeLessThanOrEqual(3);
}, 60000);

it("never names a map after a country, province or city", () => {
  const political = [
    "West Virginia",
    "Cuba",
    "Scotland",
    "Bavaria",
    "Ontario",
    "Queensland",
    "London",
    "Tunisia",
    "Morocco",
    "Egypt",
    "Texas",
    "Siberia",
  ];
  const names = new Set(Object.values(backboneNames as Record<string, string>));
  for (const bad of political) expect(names.has(bad), bad).toBe(false);
});
