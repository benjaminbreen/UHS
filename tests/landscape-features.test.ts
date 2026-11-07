import { describe, expect, it } from "vitest";
import { streamDistance, streamKind, walkStream } from "../src/world/v3/features";
import { createEnvironment } from "../src/world/v3/environment";
import type { WorldSetting } from "../src/content/geography/types";

const setting = (ecology: WorldSetting["environment"] extends infer E ? (E extends { ecology: infer X } ? X : never) : never, colorway?: any): WorldSetting =>
  ({
    version: 2,
    lon: 30,
    lat: 40,
    year: 1300,
    relief: 0.45,
    water: "river-ns",
    season: "summer",
    terrainRevision: 2,
    vegetationRevision: 6,
    climate: "temperate",
    environment: { ecology, colorway, landform: "rolling", population: "none", start: "wanderer", household: "mixed" },
  }) as unknown as WorldSetting;

describe("landscape features", () => {
  it("walks a stream downhill to water and records tier drops", () => {
    const height = (x: number, y: number) => 0.9 - x * 0.01 + Math.sin(y / 7) * 0.01;
    const s = walkStream("t", "creek", [0, 0], height, (x) => x > 60, (h) => Math.round(h * 5));
    expect(s).toBeDefined();
    expect(s!.pond).toBe(false);
    expect(s!.points.length).toBeGreaterThan(10);
    expect(s!.falls.length).toBeGreaterThan(0);
    const d = streamDistance(s!, s!.points[3][0], s!.points[3][1] + 1);
    expect(d?.distance).toBeLessThan(1.01);
    expect(streamDistance(s!, 500, 500)).toBeUndefined();
  });
  it("gives dry country arroyos and green country creeks", () => {
    expect(streamKind("desert", "sahara")).toBe("arroyo");
    expect(streamKind("savanna", "acacia")).toBe("arroyo");
    expect(streamKind("temperate-woodland")).toBe("creek");
    expect(streamKind("grassland", "steppe")).toBe("arroyo");
    expect(streamKind("tundra")).toBeUndefined();
  });
  it("lays creeks, arroyos and trails into the land sample", () => {
    const count = (eco: any, colorway?: any) => {
      const land = createEnvironment(setting(eco, colorway), "features-check");
      const seen: Record<string, number> = {};
      for (let y = -200; y < 200; y += 2)
        for (let x = -200; x < 200; x += 2) {
          const f = land.sample(x, y);
          if (f.landscape) seen[f.landscape.kind] = (seen[f.landscape.kind] ?? 0) + 1;
          if (f.fall) seen.fall = (seen.fall ?? 0) + 1;
          if (f.water < 0 && f.shoreWidth === 0.9) seen.creek = (seen.creek ?? 0) + 1;
        }
      return seen;
    };
    const savanna = count("savanna", "acacia");
    expect(savanna.arroyo ?? 0).toBeGreaterThan(20);
    expect(savanna.trail ?? 0).toBeGreaterThan(10);
    const woods = count("temperate-woodland");
    expect(woods.creek ?? 0).toBeGreaterThan(20);
    expect(woods.arroyo ?? 0).toBe(0);
  });  it("raises each regional landform in tiers and lays its water", () => {
    const at = (lon: number, lat: number, ecology: any, colorway?: any, season = "summer", relief = 0.3) => {
      const land = createEnvironment({ ...setting(ecology, colorway), lon, lat, season, relief, water: "none" } as WorldSetting, "forms-check");
      const tiers = new Map<number, number>();
      let lake = 0, snow = 0, glacier = 0;
      for (let y = -120; y < 120; y += 2)
        for (let x = -120; x < 120; x += 2) {
          const f = land.sample(x, y);
          tiers.set(f.elevation / 14, (tiers.get(f.elevation / 14) ?? 0) + 1);
          if (f.water < 0 && f.kind === "lake") lake++;
          if (f.snow) snow++;
          if (f.glacier) glacier++;
        }
      return { top: Math.max(...tiers.keys()), floor: tiers.get(0) ?? 0, lake, snow, glacier, n: 120 * 120 };
    };
    // Guilin: towers five or more steps high standing on a level floor.
    const karst = at(110.3, 25.27, "tropical-woodland", "rainforest");
    expect(karst.top).toBeGreaterThanOrEqual(5);
    expect(karst.floor / karst.n).toBeGreaterThan(0.4);
    // Yucatán: a shelf one step up with round pools sunk in it.
    const cenotes = at(-89.6, 20.97, "tropical-woodland", "monsoon", "summer", 0.1);
    expect(cenotes.lake).toBeGreaterThan(10);
    // A sand sea is ridged, not flat.
    expect(at(10, 25, "desert", "sahara").top).toBeGreaterThanOrEqual(1);
    // The loess tableland stands high and its gullies cut to the floor.
    const loess = at(109.5, 36.6, "grassland", "loess");
    expect(loess.top).toBeGreaterThanOrEqual(4);
    expect(loess.floor).toBeGreaterThan(0);
    // Snow keeps to the high ground in a Tibetan summer and comes down in winter.
    const lhasaSummer = at(91.1, 29.65, "grassland", "tibetan", "summer", 0.9);
    const lhasaWinter = at(91.1, 29.65, "grassland", "tibetan", "winter", 0.9);
    expect(lhasaWinter.snow).toBeGreaterThan(lhasaSummer.snow);
    expect(lhasaSummer.snow).toBeLessThan(lhasaSummer.n * 0.5);
    // An ice cap is ice everywhere.
    const cap = at(-40, 72, "tundra", "ice");
    expect(cap.glacier).toBe(cap.n);
    // Lowland England has no snowline at all.
    expect(at(-0.1, 51.5, "temperate-woodland", undefined, "summer").snow).toBe(0);
  });
  it("fills playas in the wet months only and gives desert springs water", () => {
    // The sample is the dry season's; `seasonal` holds the winter playa.
    const land = createEnvironment({ ...setting("desert", "reg"), lon: 46.7, lat: 24.6, season: "summer", relief: 0.15, water: "none" } as WorldSetting, "playa-check");
    let dry = 0,
      wet = 0;
    for (let y = -300; y < 300; y += 3)
      for (let x = -300; x < 300; x += 3) {
        const f = land.sample(x, y);
        if (f.water < 0) dry++;
        if ((f.seasonal?.[3] ?? f.water) < 0) wet++;
      }
    expect(dry).toBeGreaterThan(0);
    expect(wet).toBeGreaterThan(dry);
  });
});

it("derives entrance wear without changing planted ground or the settlement layout", async () => {
  const { resolveSetting } = await import("../src/content/geography/resolve");
  const { packForSetting } = await import("../src/content/geography/pack");
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const resolved = resolveSetting("medieval Normandy");
  if ("error" in resolved) throw Error(resolved.error);
  const { geographyRevision: _geography, ...local } = resolved.setting;
  const s: WorldSetting = { ...local, terrainRevision: 2,
    environment: { ...local.environment!, ecology: "grassland", landform: "plain",
      population: "sparse", start: "resident", household: "mixed" } };
  const world = createSettlementWorld(packForSetting(s), "ground-use-review", undefined, false);
  const plan = world.planAt(0, 0)!;
  expect(plan.places.length).toBeGreaterThan(0);
  const before = JSON.stringify({ roads: plan.roads, surface: [...plan.surface],
    solid: [...plan.solid], places: plan.places });
  let wornEntrances = 0;
  for (const place of plan.places) {
    const { x, y } = place.entrance;
    if ((world.topography!(x, y).groundWear ?? 0) > 0.8) wornEntrances++;
  }
  expect(wornEntrances).toBeGreaterThan(0);
  for (const [key, field] of plan.fields ?? []) {
    if (field.yard && field.crop === "pasture" && !field.garden) continue;
    const [x, y] = key.split(",").map(Number);
    expect(world.topography!(x, y).groundWear ?? 0).toBe(0);
  }
  expect(JSON.stringify({ roads: plan.roads, surface: [...plan.surface],
    solid: [...plan.solid], places: plan.places })).toBe(before);
}, 30000);
