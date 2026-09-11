import { afterEach, expect, it } from "vitest";
import { rasterTerrainContours, type TerrainReceivers } from "../src/render/terrain-contours";
import { rasterBankShadows } from "../src/render/bank-shadows";
import { defaultGroundStyle, setGroundStyle } from "../src/render/ground-style";
import type { TopographySample } from "../src/core/topography";
import { TERRAIN_RISE } from "../src/render/terrain-projection";

const sample: TopographySample = (x, y) => ({
  height: x + y < 15 ? 2 : 0,
  surface: x + y < 15 ? "grass" : "sand",
  habitat: { ecology: "grassland", kind: "open", wet: 0.2, cover: 0.3, exposed: 0, season: "summer" },
});
afterEach(() => setGroundStyle(undefined));

it("keeps contour pixels identical when producing shadow receivers", () => {
  setGroundStyle(defaultGroundStyle());
  const receivers: Partial<TerrainReceivers> = {};
  const render = (mask?: Partial<TerrainReceivers>) => rasterTerrainContours(
    sample, 16, 16, [], { x: 0, y: 0, prefix: "test" }, [], [], mask);
  expect(render(receivers)).toEqual(render());
  expect(receivers.tiers?.some(t => t === -2)).toBe(true);
});

it("casts only onto visible ground and assigns its actual projected row", () => {
  setGroundStyle(defaultGroundStyle());
  const data: Partial<TerrainReceivers> = {};
  const rims: number[] = [];
  rasterTerrainContours(sample, 16, 16, [], { x: 0, y: 0, prefix: "test" }, [], rims, data);
  const mask = data as TerrainReceivers;
  const cells = Array.from({ length: 32 * 32 }, (_, i) => sample(i % 32 - 8, Math.floor(i / 32) - 8)!);
  const layers = rasterBankShadows(rims, cells, [0.8, 0.6], 0.3, mask)!;
  expect(layers.length).toBeGreaterThan(0);
  let count = 0;
  for (const layer of layers)
    for (let y = 0; y < layer.height; y++)
      for (let x = 0; x < layer.width; x++) {
        if (!layer.pixels[(y * layer.width + x) * 4 + 3]) continue;
        const sx = layer.x + x, sy = layer.y + y;
        const i = (sy - mask.y) * mask.width + sx - mask.x;
        expect(mask.tiers[i]).toBeGreaterThanOrEqual(0);
        expect(layer.row).toBe(mask.rows[i]);
        expect(layer.row).toBe(Math.floor((sy + mask.tiers[i] * TERRAIN_RISE) / 16));
        count++;
      }
  expect(count).toBeGreaterThan(100);
  expect(rasterBankShadows(rims, cells, [0, 0], 0, mask)).toBeUndefined();
});
