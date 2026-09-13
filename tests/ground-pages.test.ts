import { expect, it } from "vitest";
import { batchGroundPage } from "../src/render/ground-pages";
import type { TopographySample } from "../src/core/topography";
import { TERRAIN_RISE } from "../src/render/terrain-projection";

it("copies every native pixel into its projected page without changing alpha", () => {
  const sample: TopographySample = () => ({ height: 3, surface: "grass" });
  const tiles = Array.from({ length: 6 }, (_, i) => ({
    x: i % 3,
    y: Math.floor(i / 3),
    pixels: Uint8ClampedArray.from(
      { length: 1024 },
      (_, p) => (p + i * 17) % 256,
    ),
  }));
  const page = batchGroundPage(sample, 3, 2, tiles, false)!;
  expect(page.y).toBe(-3 * TERRAIN_RISE);
  for (const tile of tiles)
    for (let row = 0; row < 16; row++) {
      const start = ((tile.y * 16 + row) * page.width + tile.x * 16) * 4;
      expect(page.pixels.slice(start, start + 64)).toEqual(
        tile.pixels.slice(row * 64, row * 64 + 64),
      );
    }
});

it("retains the original path for overlapping heights, ramps and bridges", () => {
  const tiles = [{ x: 0, y: 0, pixels: new Uint8ClampedArray(1024) }];
  for (const extra of [
    { height: 1 },
    { ramp: "n" as const },
    { bridge: true },
  ]) {
    const sample: TopographySample = (x) => ({
      height: 0,
      surface: "grass",
      ...(x === 1 ? extra : {}),
    });
    expect(batchGroundPage(sample, 2, 2, tiles, false)).toBeUndefined();
  }
});
