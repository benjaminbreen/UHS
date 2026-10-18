import { describe, expect, it } from "vitest";
import { ecologies } from "../src/content/ecology/profiles";
import { habitatAt, habitatTree } from "../src/world/v3/habitats";
import { naturalGround, rasterHabitatTile } from "../src/render/habitat-raster";
import type { TopographySample } from "../src/core/topography";
import type { LandSample } from "../src/world/v2/landscape";
const land: LandSample = {
  water: 80,
  shoreWidth: 3,
  elevation: 14,
  moisture: 0.52,
  kind: "river",
  snow: false,
};
describe("local habitat composition", () => {
  it("retains every climatic envelope while producing multiple connected habitat types", () => {
    for (const ecology of ecologies) {
      const kinds = new Set<string>();
      let jumps = 0;
      for (let y = -80; y < 80; y += 4)
        for (let x = -80; x < 80; x += 4) {
          const a = habitatAt(ecology, "summer", "review", x, y, land);
          const b = habitatAt(ecology, "summer", "review", x + 1, y, land);
          expect(a.ecology).toBe(ecology);
          kinds.add(a.kind);
          if (
            Math.abs(a.cover - b.cover) > 0.3 ||
            Math.abs(a.wet - b.wet) > 0.3
          )
            jumps++;
        }
      expect(kinds.size).toBeGreaterThanOrEqual(3);
      expect(jumps).toBe(0);
    }
  });
  it("places at most one tree per jittered block, with no trees at zero density", () => {
    const h = habitatAt("boreal-woodland", "summer", "review", 0, 0, land);
    h.cover = 0.8;
    for (let by = -12; by < 12; by++)
      for (let bx = -12; bx < 12; bx++) {
        let count = 0;
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const x = bx * 2 + dx,
              y = by * 2 + dy;
            if (habitatTree(h, "review", x, y, 0.4)) count++;
            expect(habitatTree(h, "review", x, y, 0)).toBe(false);
          }
        expect(count).toBeLessThanOrEqual(1);
      }
  });
  it("rasterizes identically across positive and negative chunk origins", () => {
    const world: TopographySample = (x, y) => ({
      height: 1,
      surface: "grass",
      habitat: habitatAt("grassland", "summer", "review", x, y, land),
    });
    for (const [ox, oy] of [
      [16, 32],
      [-32, -16],
    ]) {
      const local: TopographySample = (x, y) => world(x + ox, y + oy);
      for (const [x, y] of [
        [0, 0],
        [15, 15],
        [0, 15],
      ]) {
        expect(rasterHabitatTile(local, x, y, ox, oy).pixels).toEqual(
          rasterHabitatTile(world, x + ox, y + oy, 0, 0).pixels,
        );
      }
    }
  });
  it("preserves constructed surfaces and gives all ecologies distinct ground colors", () => {
    const h = habitatAt("grassland", "summer", "review", 0, 0, land);
    for (const surface of ["soil", "water"] as const)
      expect(naturalGround({ height: 0, surface, habitat: h })).toBe(false);
    expect(
      naturalGround({
        height: 0,
        surface: "gravel",
        feature: "paving",
        habitat: h,
      }),
    ).toBe(false);
    const sums = ecologies.map((ecology) => {
      const sample: TopographySample = () => ({
        height: 1,
        surface: "grass",
        habitat: { ...h, ecology },
      });
      return Array.from(rasterHabitatTile(sample, 0, 0, 0, 0).pixels).reduce(
        (v, n, i) => v + n * ((i % 4) + 1),
        0,
      );
    });
    expect(new Set(sums).size).toBe(ecologies.length);
  });
  it("preserves a narrow planted garden between paved cells", () => {
    const h = habitatAt("grassland", "summer", "review", 0, 0, land);
    const garden: TopographySample = () => ({ height: 0, surface: "grass", pavement: "garden", habitat: h });
    const beside: TopographySample = (x, y) => x === 0 ? garden(x, y)
      : { height: 0, surface: "gravel", feature: "paving", streetMaterial: "slab", pavement: "court", habitat: h };
    expect(rasterHabitatTile(beside, 0, 0, 0, 0).pixels).toEqual(rasterHabitatTile(garden, 0, 0, 0, 0).pixels);
  });
});

it("keeps activity wear out of planted ground and across height boundaries", () => {
  const habitat = { ecology: "grassland" as const, kind: "open" as const,
    cover: 0.3, wet: 0.2, exposed: 0.1, season: "summer" };
  for (const pavement of ["garden", "park", "verge"] as const) {
    const untouched: TopographySample = () => ({ height: 1, surface: "grass", pavement, habitat });
    const worn: TopographySample = (x, y) => ({ ...untouched(x, y)!, groundWear: 1,
      landscape: { kind: "trample", strength: 1 } });
    expect(rasterHabitatTile(worn, 0, 0, 0, 0).pixels)
      .toEqual(rasterHabitatTile(untouched, 0, 0, 0, 0).pixels);
  }
  const terrace: TopographySample = (x) => ({ height: x < 0 ? 2 : 1, surface: "grass", habitat });
  const wornTerrace: TopographySample = (x, y) => ({ ...terrace(x, y)!, groundWear: x < 0 ? 1 : 0 });
  expect(rasterHabitatTile(wornTerrace, 0, 0, 0, 0).pixels)
    .toEqual(rasterHabitatTile(terrace, 0, 0, 0, 0).pixels);
});

it("renders localized activity wear consistently across signed chunk origins", () => {
  const habitat = { ecology: "grassland" as const, kind: "open" as const,
    cover: 0.3, wet: 0.2, exposed: 0.1, season: "summer" };
  const world: TopographySample = (x, y) => ({ height: 1, surface: "grass", habitat,
    groundWear: Math.max(0, 1 - Math.hypot(x + 16, y - 16) / 2) });
  const local: TopographySample = (x, y) => world(x - 16, y + 16);
  expect(rasterHabitatTile(local, 0, 0, -16, 16).pixels)
    .toEqual(rasterHabitatTile(world, -16, 16, 0, 0).pixels);
  const unworn: TopographySample = (x, y) => ({ ...world(x, y)!, groundWear: 0 });
  expect(rasterHabitatTile(world, -16, 16, 0, 0).pixels)
    .not.toEqual(rasterHabitatTile(unworn, -16, 16, 0, 0).pixels);
});
