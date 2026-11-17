import { expect, it } from "vitest";
import { createEnvironment } from "../src/world/v3/environment";
import type { WorldSetting } from "../src/content/geography/types";

const setting = {
  version: 2, lon: 0, lat: 50, year: 1300, relief: 0.3,
  climate: "temperate", settlement: "village", water: "coast-n",
  season: "summer", geographyMode: "earth",
  environment: { ecology: "grassland", landform: "rolling", population: "none", start: "wanderer", household: "mixed" },
} as WorldSetting;

it("does not reclaim a coastline to match a dry travel border", () => {
  const plain = createEnvironment(setting, "coast-policy");
  const bordered = createEnvironment({ ...setting, playableMap: {
    id: "coast", size: 304, exits: [{ id: "north", to: "other", bearing: "N", mode: "land", seam: {
      side: "N", start: 0, end: 1, water: [64, 64], height: [28, 28],
      sea: [false, false], road: true, roadAt: 0.5, walkable: 1,
    } }],
  } }, "coast-policy");
  for (const x of [-100, 0, 100]) {
    expect(plain.sample(x, -151).water).toBeLessThan(0);
    expect(bordered.sample(x, -151)).toEqual(plain.sample(x, -151));
  }
});

it("leaves dry configured countryside without invented creek ponds", () => {
  const land = createEnvironment({ ...setting, water: "none", geographyMode: "configured" }, "dry-policy");
  for (let y = -100; y <= 100; y += 10)
    for (let x = -100; x <= 100; x += 10)
      expect(land.sample(x, y).water).toBeGreaterThan(0);
});

