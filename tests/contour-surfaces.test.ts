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
  // A cached donor tile may contain shoreline ink from a different location.
  const moved = surfaces.pixel(surfaces.owner(17, 8, 1)!, 17, 8, 1, () => 1)!;
  expect([...moved]).not.toEqual([40, 110, 45, 255]);
  expect(moved[3]).toBe(255);
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

it("keeps lower beach pixels free of grass borrowed across a cliff", () => {
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
  expect(fringe).toBe(0);
  expect(sandPixels).toBe(256);
});

it("uses identical world-position material samples across chunk origins", () => {
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

it("borrows the donor habitat when a lower beach corner falls under a grassy cliff cell", () => {
  setGroundStyle(defaultGroundStyle());
  const scrub = {
    ...grass,
    surface: "dry" as const,
    habitat: {
      ...grass.habitat!,
      site: {
        primary: "scrub" as const,
        weights: { scrub: 1 },
        region: { ecology: "grassland" as const },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0.2, canopy: 0.2, exposure: 0.2, freshwater: false, inundated: false },
      },
    },
  };
  const shore = {
    ...sand,
    habitat: {
      ...sand.habitat!,
      site: {
        primary: "shore" as const,
        weights: { shore: 1 },
        region: { ecology: "grassland" as const },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
  };
  const sample: TopographySample = (x) => (x < 1 ? scrub : shore);
  const surfaces = contourSurfaces(sample, [], 0, 0);
  const donor = surfaces.owner(14, 8, 0)!;
  expect(donor.cell.surface).toBe("sand");
  const px = surfaces.pixel(donor, 14, 8, 0, () => 0)!;
  // Sand stays warm/neutral rather than inheriting the upland cell's green turf.
  expect(px[0]).toBeGreaterThanOrEqual(px[1] - 10);
});

it("hides tier-0 flat pixels occluded behind a 1-tier plateau to the south", () => {
  setGroundStyle(defaultGroundStyle());
  const sample: TopographySample = (_x, y) => (y >= 2 ? grass : sand);
  const layers = rasterTerrainContours(sample, 4, 5, [], { x: 0, y: 0, prefix: "test" }, tiles(sample));
  const row1Flat = layers.find((l) => l.flat && l.row === 1);
  if (row1Flat) {
    // Pixels near the bottom of row 1 (py = 24..31) lie 14px north of row 2's
    // tier-1 plateau (py = 38..45) and must be hidden so they cannot leak over
    // an unowned tier-1 ground tile below.
    let visible = 0;
    for (let sy = 24; sy < 32; sy++) {
      const iy = sy - row1Flat.y;
      if (iy < 0 || iy >= row1Flat.height) continue;
      for (let sx = 16; sx < 48; sx++)
        if (row1Flat.pixels[(iy * row1Flat.width + sx - row1Flat.x) * 4 + 3]) visible++;
    }
    expect(visible).toBe(0);
  }
});

it("avoids green turf lips on non-grass south ramps and omits wobble cracks beside west ramps", () => {
  setGroundStyle(defaultGroundStyle());
  const soilLow = { ...sand, surface: "soil" as const, pavement: "square" as const };
  const soilHigh = { ...grass, surface: "soil" as const, pavement: "square" as const };
  // South-climbing timber ramp into raised earth should not paint a green turf lip on the ramp row.
  const southRamp: TopographySample = (_x, y) =>
    y === 2
      ? { ...soilLow, ramp: "s", rampStyle: "timber" }
      : y > 2
        ? soilHigh
        : soilLow;
  const southLayers = rasterTerrainContours(southRamp, 4, 5, [], { x: 0, y: 0, prefix: "sr" }, tiles(southRamp));
  let greenPx = 0;
  for (const l of southLayers) {
    if (l.row !== 2) continue;
    for (let i = 0; i < l.pixels.length; i += 4)
      if (l.pixels[i + 3] > 200 && l.pixels[i + 1] > l.pixels[i] + 15 && l.pixels[i + 1] > l.pixels[i + 2] + 15)
        greenPx++;
  }
  expect(greenPx).toBe(0);

  // A west-climbing ramp flush against a tier-1 plateau must not open a vertical face seam at the joint.
  const westRamp: TopographySample = (x, y) =>
    x === 2 && (y === 1 || y === 2)
      ? { ...soilLow, ramp: "w", rampStyle: "cut" }
      : x < 2
        ? soilHigh
        : soilLow;
  const westLayers = rasterTerrainContours(westRamp, 4, 4, [], { x: 0, y: 0, prefix: "wr" }, tiles(westRamp));
  // Column x = 31 (east edge of x=1 plateau, touching the west ramp at x=2) must
  // not wobble into a south-facing cliff drop below row 1's lifted surface (sy >= 12).
  let seamWallPx = 0;
  for (const l of westLayers) {
    if (l.flat || l.row !== 1) continue;
    const ix = 31 - l.x;
    if (ix < 0 || ix >= l.width) continue;
    for (let y = 0; y < l.height; y++) {
      const sy = l.y + y;
      if (sy >= 12 && l.pixels[(y * l.width + ix) * 4 + 3] > 200)
        seamWallPx++;
    }
  }
  expect(seamWallPx).toBe(0);
});
