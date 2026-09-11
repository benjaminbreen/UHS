import { afterEach, expect, it } from "vitest";
import { contourSurfaces } from "../src/render/contour-surfaces";
import { rasterTerrainContours } from "../src/render/terrain-contours";
import { defaultGroundStyle, setGroundStyle } from "../src/render/ground-style";
import type { TopographyCell, TopographySample } from "../src/core/topography";
import type { GroundTileData } from "../src/render/habitat-raster";

const grass: TopographyCell = {
  height: 1,
  surface: "grass",
  habitat: {
    ecology: "grassland",
    kind: "open",
    wet: 0.2,
    cover: 0.3,
    exposed: 0,
    season: "summer",
  },
};
const sand: TopographyCell = {
  ...grass,
  height: 0,
  surface: "sand",
  feature: "bank",
};
const sample: TopographySample = (x) => (x < 1 ? grass : sand);
const tiles = (sample: TopographySample, ox = 0): GroundTileData[] =>
  Array.from({ length: 36 }, (_, i) => {
    const x = (i % 6) - 2,
      y = Math.floor(i / 6) - 2;
    const pixels = new Uint8ClampedArray(1024);
    const color =
      sample(x + ox, y)!.surface === "sand"
        ? [220, 190, 130, 255]
        : [40, 110, 45, 255];
    for (let j = 0; j < 1024; j += 4) pixels.set(color, j);
    return { x, y, pixels };
  });
afterEach(() => setGroundStyle(undefined));

it("reassigns reshaped pixels to the material of their new tier", () => {
  const surfaces = contourSurfaces(sample, tiles(sample), 0, 0);
  expect(surfaces.owner(14, 8, 0)?.cell).toBe(sand);
  expect(surfaces.owner(17, 8, 1)?.cell).toBe(grass);
  expect([
    ...surfaces.pixel(surfaces.owner(14, 8, 0)!, 14, 8, 0, () => 0)!,
  ]).toEqual([220, 190, 130, 255]);
  expect([
    ...surfaces.pixel(surfaces.owner(17, 8, 1)!, 17, 8, 1, () => 1)!,
  ]).toEqual([40, 110, 45, 255]);
});

it("keeps paving, fields, water, bridges and paths out of natural material transfer", () => {
  for (const excluded of [
    { ...grass, feature: "paving" as const },
    { ...grass, feature: "field" as const },
    { ...grass, surface: "water" as const },
    { ...grass, bridge: true },
    { ...grass, ramp: "e" as const },
    { ...grass, surface: "soil" as const },
  ]) {
    const s: TopographySample = (x) => (x < 1 ? excluded : sand);
    expect(contourSurfaces(s, [], 0, 0).owner(17, 8, 1)?.cell).toBe(sand);
  }
});

it("adds a sparse fringe only within three pixels of a different surface", () => {
  const surfaces = contourSurfaces(sample, tiles(sample), 0, 0);
  const level = (x: number) => (x < 16 ? 1 : 0);
  let fringe = 0,
    sandPixels = 0;
  for (let y = 0; y < 32; y++)
    for (let x = 16; x < 24; x++) {
      const p = surfaces.pixel(surfaces.owner(x, y, 0)!, x, y, 0, level)!;
      if (p[0] === 40) {
        expect(x).toBeLessThan(19);
        fringe++;
      } else sandPixels++;
      expect(p[3]).toBe(255);
    }
  expect(fringe).toBeGreaterThan(0);
  expect(fringe).toBeLessThan(sandPixels);
});

it("uses identical texture and dither across chunk origins", () => {
  const a = contourSurfaces(sample, tiles(sample), 0, 0);
  const b = contourSurfaces((x, y) => sample(x + 1, y), tiles(sample, 1), 1, 0);
  for (let y = 0; y < 32; y++)
    for (let x = 12; x < 23; x++) {
      const level = (x: number) => (x < 15 ? 1 : 0);
      const tier = level(x);
      expect(
        b.pixel(b.owner(x - 16, y, tier)!, x - 16, y, tier, (u) =>
          level(u + 16),
        ),
      ).toEqual(a.pixel(a.owner(x, y, tier)!, x, y, tier, level));
    }
});

it("preserves bank silhouette and coverage while changing surface materials", () => {
  setGroundStyle(defaultGroundStyle());
  const mixed: TopographySample = (x, y) => (x + y < 4 ? grass : sand);
  const uniform: TopographySample = (x, y) => ({
    ...grass,
    height: mixed(x, y)!.height,
  });
  const render = (s: TopographySample) =>
    rasterTerrainContours(
      s,
      3,
      3,
      [],
      { x: 0, y: 0, prefix: "test" },
      tiles(s),
    );
  const a = render(mixed),
    b = render(uniform);
  expect(a.map(({ pixels, ...layer }) => layer)).toEqual(
    b.map(({ pixels, ...layer }) => layer),
  );
  expect(a.map((l) => l.pixels.filter((_, i) => i % 4 === 3))).toEqual(
    b.map((l) => l.pixels.filter((_, i) => i % 4 === 3)),
  );
});

it("does not paint lower shoreline sand onto the raised grass terrace", async () => {
  const { rasterHabitatTile } = await import("../src/render/habitat-raster");
  setGroundStyle(defaultGroundStyle());
  const waterVisual = {
    distance: 1,
    kind: "lake" as const,
    ecology: "grassland" as const,
    shoreWidth: 3,
    flow: [0, 0] as const,
    frozenMargin: false,
  };
  const raised: TopographySample = (x) =>
    x < 1 ? { ...grass, waterVisual } : { ...sand, waterVisual };
  const noShore: TopographySample = (x) => ({
    ...raised(x, 0)!,
    waterVisual: undefined,
  });
  expect(rasterHabitatTile(raised, 0, 0, 0, 0).pixels).toEqual(
    rasterHabitatTile(noShore, 0, 0, 0, 0).pixels,
  );
  const sameTier: TopographySample = (x) => ({ ...raised(x, 0)!, height: 1 });
  expect(rasterHabitatTile(sameTier, 0, 0, 0, 0).pixels).not.toEqual(
    rasterHabitatTile(noShore, 0, 0, 0, 0).pixels,
  );
});

it("uses the nearest real height for intermediate tiers on a tall bank", () => {
  const cliff: TopographySample = (x) =>
    x < 1 ? { ...grass, height: 7 } : sand;
  const surfaces = contourSurfaces(cliff, [], 0, 0);
  expect(surfaces.owner(14, 8, 1)?.cell.surface).toBe("sand");
  expect(surfaces.owner(17, 8, 6)?.cell.surface).toBe("grass");
});
