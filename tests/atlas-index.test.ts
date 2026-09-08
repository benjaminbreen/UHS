import { expect, it } from "vitest";
import { stateHash } from "../src/core/random";
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
  // Captured from the original runtime-built index at a00d0dc.
  expect(stateHash(samples)).toBe("30bd2d09");
  const p = toAtlas(31, 30);
  expect(nearestRiverPoint(p.x, p.y, "Nile")).toEqual([
    63940.4032, -61455.9744,
  ]);
  expect(nearestRiverPoint(p.x, p.y)).toEqual([63547.8016, -61868.8512]);
});
