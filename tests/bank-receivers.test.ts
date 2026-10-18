import { afterEach, expect, it } from "vitest";
import { rasterTerrainContours, type TerrainReceivers } from "../src/render/terrain-contours";
import { rasterBankShadows } from "../src/render/bank-shadows";
import { defaultGroundStyle, setGroundStyle } from "../src/render/ground-style";
import type { TopographySample } from "../src/core/topography";
import { TERRAIN_RISE } from "../src/render/terrain-projection";
import { rasterLivingWater } from "../src/render/living-water/mask";

const sample: TopographySample = (x, y) => ({
  height: x + y < 15 ? 2 : 0,
  surface: x + y < 15 ? "grass" : "sand",
  habitat: { ecology: "grassland", kind: "open", wet: 0.2, cover: 0.3, exposed: 0, season: "summer" },
});
afterEach(() => setGroundStyle(undefined));

it("fits beach coverage to the curved cliff foot without painting the upper terrace", () => {
  setGroundStyle(defaultGroundStyle());
  const shore: TopographySample = (x, y) => ({
    ...sample(x, y)!,
    height: x + y < 15 ? 1 : 0,
    surface: x + y < 15 ? "grass" : "sand",
    waterVisual: {
      distance: 0.1, kind: "lake", ecology: "grassland", shoreWidth: 3,
      flow: [0, 0], frozenMargin: false,
    },
  });
  const data: Partial<TerrainReceivers> = {};
  rasterTerrainContours(shore, 16, 16, [], { x: 0, y: 0, prefix: "test" }, [], [], data);
  const mask = data as TerrainReceivers;
  const beach = rasterLivingWater(shore, 16, 16, undefined, undefined, [], mask);
  let reshaped = 0, upper = 0;
  for (let py = 16; py < 240; py++)
    for (let px = 16; px < 240; px++) {
      const tier = mask.surfaceTiers[(py - mask.y) * mask.width + px - mask.x];
      const sy = py - tier * TERRAIN_RISE;
      const i = (sy - mask.y) * mask.width + px - mask.x;
      if (mask.tiers[i] !== tier || mask.rows[i] !== Math.floor(py / 16)) continue;
      const alpha = beach.pixels[((sy + 96) * beach.width + px) * 4 + 3];
      if (tier === 0) {
        expect(alpha).toBe(255);
        if (shore(Math.floor(px / 16), Math.floor(py / 16))!.height !== tier) reshaped++;
      } else {
        expect(alpha).toBe(0);
        upper++;
      }
    }
  expect(reshaped).toBeGreaterThan(100);
  expect(upper).toBeGreaterThan(1000);
});

it("preserves flat shores and matches elevated beach pixels across chunk origins", () => {
  setGroundStyle(defaultGroundStyle());
  const shore: TopographySample = (x, y) => ({
    ...sample(x, y)!,
    waterVisual: {
      distance: (y - 4) / 16, kind: "sea", ecology: "grassland", shoreWidth: 3,
      flow: [0, 0], frozenMargin: false,
    },
  });
  const render = (sample: TopographySample, x: number, y: number, width: number) => {
    const local: TopographySample = (a, b) => sample(a + x, b + y);
    const region = { x, y, prefix: "test" };
    const receivers: Partial<TerrainReceivers> = {};
    rasterTerrainContours(local, width, 16, [], region, [], [], receivers);
    return rasterLivingWater(local, width, 16, region, undefined, [], receivers as TerrainReceivers);
  };
  const flat: TopographySample = (x, y) => ({ ...shore(x, y)!, height: 0 });
  expect(render(flat, 0, 0, 16).pixels).toEqual(rasterLivingWater(flat, 16, 16).pixels);
  const whole = render(shore, -8, -8, 16);
  for (const offset of [0, 8]) {
    const part = render(shore, -8 + offset, -8, 8);
    for (let y = 0; y < part.height; y++) {
      const start = (y * whole.width + offset * 16) * 4;
      expect(part.pixels.slice(y * part.width * 4, (y + 1) * part.width * 4))
        .toEqual(whole.pixels.slice(start, start + part.width * 4));
    }
  }
});

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
