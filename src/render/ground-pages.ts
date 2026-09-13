import type { TopographySample } from "../core/topography";
import type { GroundTileData } from "./habitat-raster";
import { wallOwnsCell } from "./terrain-contours";
import { TERRAIN_RISE } from "./terrain-projection";

export type GroundPage = {
  x: number;
  y: number;
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  tiles: Uint8Array;
};

export function batchGroundPage(
  sample: TopographySample,
  width: number,
  height: number,
  tiles: readonly GroundTileData[],
  styled: boolean,
): GroundPage | undefined {
  if (!tiles.length) return;
  const tier = sample(0, 0)!.height;
  // Raised tiles and ramps can overlap later rows; retain their painter order.
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const c = sample(x, y)!;
      if (c.height !== tier || c.ramp || c.bridge) return;
    }
  const page: GroundPage = {
    x: 0,
    y: -tier * TERRAIN_RISE,
    width: width * 16,
    height: height * 16,
    pixels: new Uint8ClampedArray(width * height * 16 * 16 * 4),
    tiles: new Uint8Array(width * height),
  };
  for (const tile of tiles) {
    if (styled && wallOwnsCell(sample, tile.x, tile.y)) continue;
    page.tiles[tile.y * width + tile.x] = 1;
    for (let row = 0; row < 16; row++)
      page.pixels.set(
        tile.pixels.subarray(row * 64, row * 64 + 64),
        ((tile.y * 16 + row) * page.width + tile.x * 16) * 4,
      );
  }
  return page.tiles.some(Boolean) ? page : undefined;
}
