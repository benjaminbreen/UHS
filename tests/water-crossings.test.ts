import { expect, it } from "vitest";
import { createEnvironment } from "../src/world/v3/environment";
import { edgePoint, sharedCrossings } from "../src/world/travel/waterways";
import type { WorldSetting } from "../src/content/geography/types";
const make = (south: boolean): WorldSetting =>
  ({
    version: 2,
    lon: 30,
    lat: 40,
    year: 1300,
    relief: 0.3,
    climate: "temperate",
    settlement: "camp",
    water: south ? "river-ns" : "none",
    season: "summer",
    terrainRevision: 2,
    geographyMode: "configured",
    hydrologyRevision: 3,
    ecologyRevision: 2,
    environment: {
      ecology: "temperate-woodland",
      landform: "rolling",
      population: "none",
      start: "wanderer",
      household: "mixed",
    },
    playableMap: {
      id: south ? "a" : "b",
      size: 304,
      exits: [
        {
          id: "a~b",
          to: south ? "b" : "a",
          bearing: south ? "S" : "N",
          mode: "land",
          waterways: [{ at: 0.3, width: 0.02, flow: south ? 1 : -1 }],
          seam: {
            side: south ? "S" : "N",
            start: 0,
            end: 1,
            water: [64, 64],
            sea: [false, false],
            height: [0, 0],
            road: false,
            roadAt: 0.5,
            walkable: 1,
          },
        },
      ],
    },
  }) as WorldSetting;
it("shares positions, widths and flow across maps with different native water", () => {
  const a = createEnvironment(make(true), "upstream"),
    b = createEnvironment(make(false), "downstream");
  for (let x = -120; x <= 120; x += 2) {
    const north = a.sample(x, 151),
      south = b.sample(x, -152);
    expect(south.water).toBeCloseTo(north.water, 6);
    if (north.water < 0) {
      expect(north.waterFlow![1]).toBeGreaterThan(0);
      expect(south.waterFlow![1]).toBeGreaterThan(0);
    }
  }
  const [x] = edgePoint(304, make(false).playableMap!.exits[0].seam!, 0.3);
  for (let depth = 0; depth < 20; depth++)
    expect(b.sample(Math.round(x), -152 + depth).water).toBeLessThan(0);
});
it("merges nearby river crossings without losing separate small tributaries", () => {
  const shared = sharedCrossings(
    [{ at: 0.3, width: 0.02, flow: 1 }],
    [
      { at: 0.32, width: 0.025, flow: -1 },
      { at: 0.8, width: 0.005, flow: 1 },
    ],
  );
  expect(shared).toHaveLength(2);
  expect(shared[0].flow).toBe(1);
  expect(shared[1].width).toBe(0.005);
});
