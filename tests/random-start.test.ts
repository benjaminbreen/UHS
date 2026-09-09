import { describe, expect, it } from "vitest";
import { places } from "../src/content/geography/places";
import {
  randomPopulationWeightedYear,
  randomStartFromDraws,
} from "../src/content/geography/random-start";

describe("random starts", () => {
  it("can draw every atlas location, not only the curated examples", () => {
    for (const id of ["area-oahu-basin", "area-iceland", "city-philadelphia"]) {
      const index = places.findIndex((place) => place.id === id);
      expect(index, id).toBeGreaterThanOrEqual(0);
      const start = randomStartFromDraws(new Uint32Array([index, 0, 0]));
      expect(start.setting.placeId).toBe(id);
    }
  });

  it("samples 10,000 BCE through the present in proportion to global population", () => {
    expect(randomPopulationWeightedYear(0)).toBe(-9999);
    expect(randomPopulationWeightedYear(0xffff_ffff)).toBe(2026);

    // At the median person-year, the world is already well into the Common Era.
    expect(randomPopulationWeightedYear(0x8000_0000)).toBeGreaterThan(1000);
  });
});
