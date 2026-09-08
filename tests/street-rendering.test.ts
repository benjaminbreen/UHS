import { expect, it } from "vitest";
import { pathArt } from "../src/world/v3/path-art";
import { streetMaterial } from "../src/content/settlements/streets";
import { rasterStreetTile } from "../src/render/street-raster";
import type { WorldSetting } from "../src/content/geography/types";
import type { TopographySample } from "../src/core/topography";
it("simplifies staircase footpaths into continuous diagonals without changing routes", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
  ];
  const before = JSON.stringify(points);
  const art = pathArt([{ id: "p", points, width: 0, kind: "path", cost: 1 }]);
  expect(art.get("1,1")).toEqual([
    { a: [0.5, 0.5], b: [3.5, 3.5], radius: 0.5 },
  ]);
  expect(JSON.stringify(points)).toBe(before);
  expect(
    pathArt([{ id: "b", points, width: 0, kind: "bridge", cost: 1 }]).size,
  ).toBe(0);
});
it("selects regional paving by date and location", () => {
  const s = {
    lon: 12.5,
    lat: 41.9,
    year: 100,
    culture: "european",
  } as WorldSetting;
  expect(streetMaterial(s)).toBe("basalt");
  expect(streetMaterial({ ...s, year: 1600 })).toBe("cobble");
  expect(streetMaterial({ ...s, lon: 5, lat: 52, year: 1700 })).toBe("brick");
});
it("paving keeps world-coordinate joints identical across chunk origins", () => {
  const sample: TopographySample = () => ({
    height: 0,
    surface: "gravel",
    feature: "paving",
    streetMaterial: "basalt",
  });
  expect(rasterStreetTile(sample, 0, 0, -16, 32).pixels).toEqual(
    rasterStreetTile(sample, -16, 32, 0, 0).pixels,
  );
  expect(rasterStreetTile(sample, 0, 0, 0, 0).pixels).not.toEqual(
    rasterStreetTile(sample, 1, 0, 0, 0).pixels,
  );
});
