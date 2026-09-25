import { expect, it } from "vitest";
import {
  permanentMap,
  permanentExits,
  mapForCoordinate,
  parseTile,
  tileId,
  loadTileNames,
} from "../src/world/travel/network";
import { mapEntrances } from "../src/world/travel/entrances";
import type { WorldModel } from "../src/core/types";
import { atlasSample, toAtlas } from "../src/world/geography/atlas";
import { createEnvironment } from "../src/world/v3/environment";
import { createRegionalContext } from "../src/world/regional/context";
import { travelSetting } from "../src/runtime/map-travel";
const london = mapForCoordinate({ lon: -0.12, lat: 51.5 });
it("keeps identities and reciprocal exits across dates", () => {
  const a = permanentMap(london, 1300),
    old = permanentMap(london, -5000);
  expect(a.size).toBe(384);
  expect(a.networkId).toBe(old.networkId);
  const exits = permanentExits(london, 1300);
  expect(exits.map((e) => e.bearing)).toEqual(["N", "E", "S", "W"]);
  for (const e of exits) {
    const back = permanentExits(e.to, -5000).find((x) => x.to === london)!;
    expect(back.id).toBe(e.id);
    // Both sides of a border read the one shared profile.
    expect(back.seam!.water).toEqual(e.seam!.water);
  }
  expect(permanentExits(london, 1300)).toEqual(exits);
});
it("makes the neighbours the squares beside it, across the date line too", () => {
  const { i, j } = parseTile(london);
  const [n, e, s, w] = permanentExits(london, 1300).map((x) => parseTile(x.to));
  expect(n).toEqual({ i, j: j - 1 });
  expect(e).toEqual({ i: i + 1, j });
  expect(s).toEqual({ i, j: j + 1 });
  expect(w).toEqual({ i: i - 1, j });
  const east = parseTile(mapForCoordinate({ lon: 179.99, lat: 0 }));
  const across = permanentExits(tileId(east), 1300).find((x) => x.bearing === "E")!;
  expect(parseTile(across.to).i).toBe(-east.i - 1);
});
it("covers oceans, polar landscapes and arbitrary land", () => {
  for (const [lon, lat] of [[-30, 20], [160, -20], [75, 0], [0, -84], [-20, 65], [115, 0]]) {
    const id = mapForCoordinate({ lon, lat });
    expect(permanentExits(id, 1300).length).toBeGreaterThan(0);
    expect(permanentMap(id, 1300).size).toBe(384);
  }
  expect(permanentMap(mapForCoordinate({ lon: -30, lat: 20 }), 1300).water).toBe(true);
});
it("continues the coast across a border", () => {
  const year = 1300;
  const env = (id: string) => {
    const s = travelSetting(permanentMap(id, year), permanentExits(id, year), year);
    return createEnvironment(s, "travel-review:" + id, createRegionalContext(s));
  };
  // Southeast Luzon, where the old network jumped from coast to open sea.
  const { i, j } = parseTile(mapForCoordinate({ lon: 121.9, lat: 14.2 }));
  const west = env(tileId({ i, j })), east = env(tileId({ i: i + 1, j }));
  const north = env(tileId({ i, j: j - 1 }));
  let wet = 0, mismatch = 0;
  for (let t = -190; t < 190; t += 4) {
    const a = west.sample(191, t).water < 0, b = east.sample(-192, t).water < 0;
    const c = north.sample(t, 191).water < 0, d = west.sample(t, -192).water < 0;
    wet += Number(a) + Number(c);
    mismatch += Number(a !== b) + Number(c !== d);
  }
  expect(wet).toBeGreaterThan(0);
  expect(mismatch).toBeLessThanOrEqual(3);
}, 60000);
it("starts land points on a land map", () => {
  let checked = 0;
  for (let i = 0; checked < 60 && i < 4000; i++) {
    const lon = ((i * 137.508) % 360) - 180,
      lat = ((i * 79.31) % 150) - 75;
    const a = toAtlas(lon, lat);
    if (atlasSample(a.x, a.y).coast < 0) continue;
    checked++;
    expect(permanentMap(mapForCoordinate({ lon, lat }), 1400).water, `${lon},${lat}`).toBe(false);
  }
  expect(checked).toBe(60);
}, 30000);
it("names a map for its town, but never before the town exists", async () => {
  // The catalog point, on the Bosporus.
  const byzantium = mapForCoordinate({ lon: 29.0081, lat: 41.1069 });
  await loadTileNames([byzantium]);
  expect(permanentMap(byzantium, 1400).name).toMatch(/Istanbul|Constantinople/);
  for (let dj = -2; dj <= 2; dj++)
    for (let di = -2; di <= 2; di++) {
      const { i, j } = parseTile(byzantium);
      expect(permanentMap(tileId({ i: i + di, j: j + dj }), -1075).name).not.toMatch(/Istanbul/);
    }
});
it("tells neighbouring maps apart", async () => {
  const patna = mapForCoordinate({ lon: 85.14, lat: 25.61 });
  await loadTileNames([patna]);
  const { i, j } = parseTile(patna);
  const names = new Set<string>();
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++)
      names.add(permanentMap(tileId({ i: i + di, j: j + dj }), 1400).name);
  // Only squares side by side are kept apart; a river may name two a square apart.
  expect(names.size).toBeGreaterThanOrEqual(8);
});
it("names squares for the feature in them, before any town", async () => {
  for (const [lon, lat, name] of [
    [81.88, 25.42, /^Confluence of the (Yamuna and Ganges|Ganges and Yamuna)$/],
    [37.35, -3.07, /^Slopes of Mount Kilimanjaro$/],
    [-69.4, -15.8, /Titicaca/],
  ] as const) {
    const id = mapForCoordinate({ lon, lat });
    await loadTileNames([id]);
    expect(permanentMap(id, -1075).name).toMatch(name);
  }
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
  const map = permanentMap(mapForCoordinate({ lon: -0.12, lat: 51.5 }), -5000);
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
