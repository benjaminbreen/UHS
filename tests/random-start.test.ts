import { describe, expect, it } from "vitest";
import { places } from "../src/content/geography/places";
import { randomStartFromDraws } from "../src/content/geography/random-start";

describe("random starts", () => {
  it("can draw every atlas location, not only the curated examples", () => {
    for (const id of ["area-oahu-basin", "area-iceland", "city-philadelphia"]) {
      const index = places.findIndex((place) => place.id === id);
      expect(index, id).toBeGreaterThanOrEqual(0);
      const start = randomStartFromDraws(new Uint32Array([index, 0]));
      expect(start.setting.placeId).toBe(id);
    }
  });
});
