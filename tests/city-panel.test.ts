import { describe, expect, it } from "vitest";
import { panelCity } from "../scripts/review/panel";

/** Guards on the review panel: a city must fill its core, keep its count,
 * reach its water and build within a time budget. The full panel with
 * screenshots is scripts/review/city-panel.ts; this is the subset cheap
 * enough to run every time. */
describe("city panel", () => {
  const cases = [
    // Core share is building footprint over the central third of the extent;
    // streets, the square and (for New York) the river take the rest.
    { place: "city-miami", year: 2001, buildings: 400, core: 0.18, water: true },
    { place: "city-new-york", year: 2000, buildings: 150, core: 0.08, water: true },
    { place: "london", year: 1400, buildings: 150, core: 0.12, water: true },
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
      // A single town must plan in seconds, or the world takes too long to open.
      expect(c.timing.total, "plan ms").toBeLessThan(8000);
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
