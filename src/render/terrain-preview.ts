import { habitatAppearance } from "./habitat-appearance";
import type { TopographyCell } from "../core/topography";
import { TERRAIN_CHUNK_SIZE as SIZE } from "./terrain-region";

/** One flat colour per cell, sent ahead of the tile raster so a chunk has
 * something on screen within a frame of its cells being sampled. Rastering a
 * chunk properly costs the better part of a second; this costs a fraction of
 * a millisecond and is replaced the moment the real pixels arrive. */
export type TerrainPreview = {
  /** SIZE x SIZE, one pixel per cell. */
  pixels: Uint8ClampedArray;
  /** Modal height, for the same vertical offset the ground page would take. */
  tier: number;
};

const WATER = { shallow: [61, 147, 176], deep: [42, 111, 147] };
const BARE = [122, 116, 98];

export function previewChunk(
  cell: (x: number, y: number) => TopographyCell | undefined,
): TerrainPreview {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  const tiers = new Map<number, number>();
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const c = cell(x, y);
      if (!c) continue;
      tiers.set(c.height, (tiers.get(c.height) ?? 0) + 1);
      const rgb =
        c.surface === "water"
          ? c.waterDepth === "shallow"
            ? WATER.shallow
            : WATER.deep
          : c.habitat
            ? habitatAppearance(c.habitat).ground
            : BARE;
      const i = (y * SIZE + x) * 4;
      pixels[i] = rgb[0];
      pixels[i + 1] = rgb[1];
      pixels[i + 2] = rgb[2];
      pixels[i + 3] = 255;
    }
  let tier = 0,
    best = 0;
  for (const [height, count] of tiers)
    if (count > best) ((best = count), (tier = height));
  return { pixels, tier };
}
