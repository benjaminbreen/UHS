import { describe, expect, it } from "vitest";
import { panelCity } from "../scripts/review/panel";

/** Terrain-constrained panel cities; flat-ground fabric capacity is covered in urban.test.ts. */
describe("city panel", () => {
  const cases = [
    // Revision 2 leaves refused terrain parcels open, including riverside cores.
    { place: "city-miami", year: 2001, buildings: 400, core: 0.14, water: true },
    { place: "london", year: 1400, buildings: 60, core: 0.035, water: true },
    { place: "alexandria", year: -244, buildings: 60, core: 0.1, water: true },
  ];
  for (const { place, year, buildings, core, water } of cases)
    it(`${place} ${year} is dense, coherent and on its water`, () => {
      const c = panelCity(place, year);
      expect(c.buildings, "buildings").toBeGreaterThanOrEqual(buildings);
      expect(c.coreShare, "core built share").toBeGreaterThanOrEqual(core);
      expect(c.routeFailures, "route failures").toBeLessThan(
        Math.max(25, c.buildings * 0.08),
      );
      if (water) {
        const { x, y } = c.plan.site.center,
          r = c.radius;
        let wet = false;
        for (let dy = -r; dy <= r && !wet; dy += 4)
          for (let dx = -r; dx <= r && !wet; dx += 4)
            wet = c.engine.world.terrain(x + dx, y + dy) === "water";
        expect(wet, "water within the claim").toBe(true);
      }
    });
});
