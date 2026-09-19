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

  it("puts a realistic start where the people were, not where the map is dense", () => {
    const share = (mode: "any" | "realistic") => {
      const counts: Record<string, number> = {};
      const byId = new Map(places.map((place) => [place.id, place]));
      for (let i = 0; i < 1500; i++) {
        const start = randomStartFromDraws(
          // A fixed year: this is about the place draw, not the year draw.
          new Uint32Array([(i * 2654435761) >>> 0, 0, 0x9000_0000]),
          mode,
        );
        const culture = byId.get(start.setting.placeId)!.culture;
        counts[culture] = (counts[culture] ?? 0) + 1;
      }
      return (key: string) => (counts[key] ?? 0) / 1500;
    };
    const even = share("any"),
      weighted = share("realistic");
    // The gazetteer holds more North American entries than South Asian ones,
    // which is a cartographic fact about the source rather than a demographic
    // one. Weighting by population turns that around.
    expect(even("other-indigenous-american")).toBeGreaterThan(
      even("south-asian"),
    );
    expect(weighted("south-asian")).toBeGreaterThan(
      weighted("other-indigenous-american") * 3,
    );
    expect(weighted("south-asian") + weighted("east-asian")).toBeGreaterThan(
      0.4,
    );
  });

  it("leaves no place unreachable, including the curated anchors", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20000; i++)
      seen.add(
        randomStartFromDraws(
          new Uint32Array([(i * 2654435761) >>> 0, 0, (i * 40503) >>> 0]),
          "realistic",
        ).setting.placeId,
      );
    // Rome and Delhi are hand-authored anchors, absent from the generated
    // country table; they take the country of the nearest place that is in it.
    for (const id of ["rome", "delhi", "london"]) expect(seen).toContain(id);
  });
});
