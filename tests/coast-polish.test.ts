import { expect, it } from "vitest";
import {
  coastDistance,
  coastBeachWidth,
} from "../src/render/living-water/coast";
import { shorePolishDefaults } from "../src/render/living-water/polish";
import { rasterLivingWater } from "../src/render/living-water/mask";
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
