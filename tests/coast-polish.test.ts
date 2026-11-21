import { expect, it } from "vitest";
import {
  coastDistance,
  coastBeachWidth,
} from "../src/render/living-water/coast";
import { shorePolishDefaults } from "../src/render/living-water/polish";
import { rasterLivingWater } from "../src/render/living-water/mask";
import { rasterHabitatTile, beachTint } from "../src/render/habitat-raster";
import { puddlesAt } from "../src/render/puddles";
import type { TopographySample } from "../src/core/topography";
it("narrows a beach continuously beside a rise instead of cutting it at a tile boundary", () => {
  const sample: TopographySample = (x) => ({
    height: x >= 4 ? 1 : 0,
    surface: "grass",
    waterVisual: {
      distance: 4, kind: "sea", ecology: "grassland", shoreWidth: 3,
      flow: [0, 1], frozenMargin: false,
    },
  });
  const mask = rasterLivingWater(sample, 4, 4, undefined, {
    ...shorePolishDefaults, enabled: false, blend: 0, coastBeachWidth: 12,
    coastScallop: 0, beachVariation: 0,
  });
  for (let y = 0; y < 64; y++) {
    const left = ((y + 96) * mask.width + 31) * 4;
    const right = left + 4;
    expect(mask.pixels[left + 3]).toBe(255);
    expect(mask.pixels[right + 3]).toBe(255);
    expect(Math.abs(mask.pixels[left] - mask.pixels[right])).toBeLessThanOrEqual(2);
  }
});

it("coastal relief is bounded, tunable and absent offshore", () => {
  const s = shorePolishDefaults;
  const edge = Array.from({ length: 200 }, (_, x) => coastDistance(0, x, 0, s));
  expect(Math.max(...edge) - Math.min(...edge)).toBeGreaterThan(0.8);
  expect(edge.every((x) => Math.abs(x) <= s.coastScallop!)).toBe(true);
  expect(coastDistance(0, 17, 4, { ...s, coastScallop: 0 })).toBe(0);
  expect(coastDistance(-20, 17, 4, s)).toBe(-20);
  expect(coastBeachWidth(4, 17, 4, { ...s, beachVariation: 0 })).toBe(4);
  expect(coastBeachWidth(4, 17, 4, s)).not.toBe(coastBeachWidth(4, 60, 4, s));
});
it("scallops and beach edges match across independently prepared chunks", () => {
  const sample: TopographySample = (_x, y) => ({
    height: 0,
    surface: y < 4 ? "water" : "sand",
    waterVisual: {
      distance: y - 4,
      kind: "sea",
      ecology: "tropical-woodland",
      shoreWidth: 3,
      flow: [0, 1],
      frozenMargin: false,
    },
  });
  const full = rasterLivingWater(
    sample,
    32,
    12,
    undefined,
    shorePolishDefaults,
  );
  for (const offset of [0, 16]) {
    const patch = rasterLivingWater(
      (x, y) => sample(x + offset, y),
      16,
      12,
      { x: offset, y: 0, prefix: "test" },
      shorePolishDefaults,
    );
    for (let y = 0; y < patch.height; y++) {
      const start = (y * full.width + offset * 16) * 4;
      expect(
        patch.pixels.slice(y * patch.width * 4, (y + 1) * patch.width * 4),
      ).toEqual(full.pixels.slice(start, start + patch.width * 4));
    }
  }
});

it("keeps tropical shore sand off pure white and avoids turf lips on sand", () => {
  const sample: TopographySample = (x) => ({
    height: 0,
    surface: x < 0 ? "water" : "sand",
    rock: "laterite",
    habitat: {
      ecology: "tropical-woodland",
      colorway: "rainforest",
      kind: "open",
      wet: 0.3,
      cover: 0,
      exposed: 0.9,
      season: "autumn",
      site: {
        primary: "shore",
        weights: { shore: 1 },
        region: { ecology: "tropical-woodland", colorway: "rainforest" },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
    waterVisual: {
      distance: x + 0.5,
      kind: "sea",
      ecology: "tropical-woodland",
      shoreWidth: 2,
      shelf: 4.6,
      tide: 0.3,
      flow: [0, 1],
      frozenMargin: false,
    },
  });
  const tile = rasterHabitatTile(sample, 2, 0, 0, 0);
  let pureWhite = 0, darkGreen = 0;
  for (let i = 0; i < tile.pixels.length; i += 4) {
    const r = tile.pixels[i], g = tile.pixels[i + 1], b = tile.pixels[i + 2];
    if (r === 255 && g === 255 && b === 255) pureWhite++;
    if (g > r + 15 && g < 130) darkGreen++;
  }
  expect(pureWhite).toBe(0);
  expect(darkGreen).toBe(0);
});

it("starts beach rain rivulets downhill toward the sea on east-west beaches", () => {
  // Cliff on the east (x >= 6), sea on the west (x < 0): downhill is due west (ax < 0).
  const sample: TopographySample = (x) => ({
    height: x >= 6 ? 2 : 0,
    surface: x < 0 ? "water" : x >= 6 ? "grass" : "sand",
    waterVisual: {
      distance: x + 0.5,
      kind: "sea",
      ecology: "tropical-woodland",
      shoreWidth: 5,
      flow: [0, 1],
      frozenMargin: false,
    },
  });
  let spots: ReturnType<typeof puddlesAt> = [];
  for (let y = 0; y < 30 && !spots.length; y++)
    spots = puddlesAt(sample, 5, y, 0, 0, y * 16);
  expect(spots.length).toBeGreaterThan(0);
  expect(spots[0].ax).toBeLessThan(-0.5);
});

it("tints shore-site soil cells like adjacent sand and lets worn earth show through living water", () => {
  const base = {
    height: 0,
    rock: "laterite" as const,
    habitat: {
      ecology: "tropical-woodland" as const,
      colorway: "rainforest" as const,
      kind: "open" as const,
      wet: 0.3,
      cover: 0,
      exposed: 0.9,
      season: "summer",
      site: {
        primary: "shore" as const,
        weights: { shore: 1 },
        region: { ecology: "tropical-woodland" as const, colorway: "rainforest" as const },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
    waterVisual: {
      distance: 3,
      kind: "sea" as const,
      ecology: "tropical-woodland" as const,
      shoreWidth: 6,
      flow: [0, 1] as const,
      frozenMargin: false,
    },
  };
  expect(beachTint({ ...base, surface: "soil" })).toEqual(beachTint({ ...base, surface: "sand" }));
  const sample: TopographySample = (x, y) => ({
    ...base,
    surface: y < 2 ? "water" : "sand",
    groundWear: x === 4 && y === 4 ? 0.9 : 0,
    waterVisual: { ...base.waterVisual, distance: y - 1.5 },
  });
  const mask = rasterLivingWater(sample, 8, 8, undefined, shorePolishDefaults);
  // Center of the heavily worn spot yields to the ground raster; unworn sand nearby stays covered.
  expect(mask.pixels[((4 * 16 + 8 + 96) * mask.width + 4 * 16 + 8) * 4 + 3]).toBe(0);
  expect(mask.pixels[((4 * 16 + 8 + 96) * mask.width + 2 * 16 + 8) * 4 + 3]).toBe(255);
});

it("moves wall-owned flat pixels cleared for living water into an underLiving backdrop", async () => {
  const { handleTerrainRequest, useTerrainWorld } = await import("../src/render/terrain-worker");
  const base = {
    rock: "limestone" as const,
    habitat: {
      ecology: "tropical-woodland" as const,
      colorway: "rainforest" as const,
      kind: "open" as const,
      wet: 0.3,
      cover: 0,
      exposed: 0.9,
      season: "summer",
      site: {
        primary: "shore" as const,
        weights: { shore: 1 },
        region: { ecology: "tropical-woodland" as const, colorway: "rainforest" as const },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
  };
  const topography = (x: number, y: number) => ({
    ...base,
    height: x < 6 && y >= 6 ? 1 : 0,
    surface: (y < 2 ? "water" : x < 6 && y >= 6 ? "grass" : "sand") as "water" | "grass" | "sand",
    waterVisual: {
      distance: y - 1.5,
      kind: "sea" as const,
      ecology: "tropical-woodland" as const,
      shoreWidth: 7,
      flow: [0, 1] as const,
      frozenMargin: false,
    },
  });
  const posted: unknown[] = [];
  const prevSelf = globalThis.self;
  (globalThis as unknown as { self: { postMessage: (m: unknown) => void } }).self = {
    postMessage: (m: unknown) => posted.push(m),
  };
  try {
    useTerrainWorld({
      topography,
      decoration: () => undefined,
    } as unknown as import("../src/core/types").WorldModel);
    handleTerrainRequest({
      style: (await import("../src/render/ground-style")).defaultGroundStyle(),
      living: true,
      polish: shorePolishDefaults,
    });
    handleTerrainRequest({ id: "t1", region: { x: 0, y: 0, prefix: "t1" } });
  } finally {
    (globalThis as unknown as { self: unknown }).self = prevSelf;
  }
  const resp = posted.at(-1) as { layers: import("../src/render/terrain-contours").ContourLayer[] };
  const backdrop = resp.layers.find((l) => l.underLiving);
  expect(backdrop).toBeDefined();
  let opaque = 0;
  for (let i = 3; i < backdrop!.pixels.length; i += 4) if (backdrop!.pixels[i] > 0) opaque++;
  expect(opaque).toBeGreaterThan(0);
});
