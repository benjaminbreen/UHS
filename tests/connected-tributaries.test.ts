import { regionalEcology } from "../src/content/ecology/variants";
import { expect, it } from "vitest";
import { createEnvironment } from "../src/world/v3/environment";
import type { WorldSetting } from "../src/content/geography/types";

const setting = (water: WorldSetting["water"]): WorldSetting =>
  ({
    version: 2,
    lon: 30,
    lat: 40,
    year: 1300,
    relief: 0.3,
    climate: "temperate",
    settlement: "camp",
    water,
    season: "summer",
    terrainRevision: 2,
    geographyMode: "configured",
    hydrologyRevision: 2,
    environment: {
      ecology: "temperate-woodland",
      landform: "rolling",
      population: "none",
      start: "wanderer",
      household: "mixed",
    },
  }) as WorldSetting;

for (const water of ["river-ns", "coast-n", "lake"] as const) {
  it(`generates winding tributaries with wet connections to ${water}`, () => {
    const land = createEnvironment(setting(water), "tributary-review");
    const streams = land.tributariesAt(0, 0);
    expect(streams.length).toBeGreaterThan(0);
    for (const stream of streams) {
      expect(stream.pond).toBe(false);
      const end = stream.points.at(-1)!;
      expect(land.mainWater(...(end as [number, number])).water).toBeLessThan(
        -2,
      );
      let length = 0;
      for (let i = 1; i < stream.points.length; i++) {
        const a = stream.points[i - 1],
          b = stream.points[i];
        length += Math.hypot(b[0] - a[0], b[1] - a[1]);
        expect(
          land.sample(Math.round(b[0]), Math.round(b[1])).water,
        ).toBeLessThan(0);
      }
      const start = stream.points[0];
      expect(
        length / Math.hypot(end[0] - start[0], end[1] - start[1]),
      ).toBeGreaterThan(1.05);
    }
  });
}

it("recognizes named swamp forests and floods their river margins shallowly", () => {
  expect(regionalEcology(109.125, 1.375, "tropical")).toEqual({
    ecology: "wetland",
    colorway: "swamp",
  });
  const dry = createEnvironment(setting("river-ns"), "swamp-review");
  const swamp = createEnvironment(
    {
      ...setting("river-ns"),
      environment: {
        ...setting("river-ns").environment!,
        ecology: "wetland",
        colorway: "swamp",
      },
    },
    "swamp-review",
  );
  let flooded = 0;
  for (let y = -40; y < 40; y += 2)
    for (let x = -100; x < 40; x += 2) {
      const before = dry.mainWater(x, y).water;
      const after = swamp.mainWater(x, y).water;
      if (before >= 0 && after < 0) {
        flooded++;
        expect(after).toBeGreaterThanOrEqual(-1.2);
      }
    }
  expect(flooded).toBeGreaterThan(30);
});
