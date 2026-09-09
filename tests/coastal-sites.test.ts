import { describe, expect, it } from "vitest";
import { places } from "../src/content/geography/places";
import { settingFor } from "../src/content/geography/resolve";
import {
  createRegionalContext,
  REGION_CELL,
} from "../src/world/regional/context";
import { regionalSettlements } from "../src/world/regional/settlements";
import { createEnvironment } from "../src/world/v3/environment";

function siteFor(id: string, year: number) {
  const place = places.find((p) => p.id === id)!;
  const setting = settingFor(place, year);
  const regional = createRegionalContext(setting);
  const land = createEnvironment(setting, "coastal-sites", regional);
  const planner = regionalSettlements(regional, land.sample, "coastal-sites");
  const hx = Math.floor(regional.origin.x / REGION_CELL),
    hy = Math.floor(regional.origin.y / REGION_CELL);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const site = planner
        .sitesIn(hx + dx, hy + dy)
        .find((s) => s.namedId === place.id);
      if (site) return { place, site, sample: land.sample };
    }
  throw Error(`no site for ${id}`);
}

describe("coastal sites", () => {
  it("marks gazetteer cities on the shore as ports with coast metadata", () => {
    for (const id of [
      "city-miami",
      "city-lagos",
      "city-mumbai",
      "city-venice",
    ]) {
      const p = places.find((q) => q.id === id)!;
      expect(p.settlement, id).toBe("port");
      expect(p.water, id).toMatch(/^coast-/);
      expect(p.coast!.distance, id).toBeLessThan(80);
    }
    // The hand-curated river stays over the computed coast.
    expect(places.find((p) => p.id === "london")!.water).toBe("river-ew");
  });
  for (const id of ["city-miami", "alexandria"])
    it(`puts ${id} in 2000 on its waterfront`, () => {
      const { site, sample } = siteFor(id, 2000);
      const { x, y } = site.center;
      const here = sample(x, y);
      expect(here.water).toBeGreaterThan(0);
      // A city centre stands back about two fifths of its claim from the shore.
      expect(here.water).toBeLessThan(75);
      const r = site.profile.radius;
      let wettest = Infinity;
      for (let dy = -r; dy <= r; dy += 4)
        for (let dx = -r; dx <= r; dx += 4)
          wettest = Math.min(wettest, sample(x + dx, y + dy).water);
      expect(wettest).toBeLessThan(0);
    }, 120000);
});
