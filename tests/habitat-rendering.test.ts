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
});
