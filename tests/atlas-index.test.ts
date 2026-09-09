import { expect, it } from "vitest";
import { stateHash } from "../src/core/random";
import { places } from "../src/content/geography/places";
import {
  atlasSample,
  nearestRiverPoint,
  toAtlas,
} from "../src/world/geography/atlas";

it("preserves global coast, river and flow samples after offline indexing", () => {
  const samples = [];
  for (let lat = -85; lat <= 85; lat += 5)
    for (let lon = -175; lon <= 175; lon += 5) {
      const p = toAtlas(lon, lat);
      samples.push(atlasSample(p.x, p.y));
    }
  // Captured after the move to the 10m coastline and half-degree buckets;
  // the a00d0dc runtime-built index hashed to 30bd2d09.
  expect(stateHash(samples)).toBe("194c3cfb");
  const p = toAtlas(31, 30);
  expect(nearestRiverPoint(p.x, p.y, "Nile")).toEqual([
    63940.4032, -61455.9744,
  ]);
  expect(nearestRiverPoint(p.x, p.y)).toEqual([63547.8016, -61868.8512]);
});

it("keeps place identifiers unique and disambiguates names by their own region", () => {
  const ids = places.map((p) => p.id);
  expect(ids.filter((v, i) => ids.indexOf(v) !== i)).toEqual([]);
  // Matching a name on modern population alone moved medieval York to
  // Pennsylvania and recomputed its culture from those coordinates.
  const york = places.find((p) => p.id === "york")!;
  expect(york.lon).toBeCloseTo(-1.08, 1);
  expect(york.culture).toBe("european");
  // The generated gazetteer must be able to produce cities, not only villages.
  const generated = places.filter((p) => p.id.startsWith("city-"));
  expect(
    generated.filter((p) => p.settlement === "city").length,
  ).toBeGreaterThan(100);
});
