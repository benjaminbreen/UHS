import { expect, it } from "vitest";
import {
  terrainTransitionTiles,
  transitionPixel,
} from "../src/render/terrain-tiles";
import { bankOffset, marshBasin } from "../src/world/v3/wet-features";
import { createEnvironment } from "../src/world/v3/environment";
import { ecologyProfiles } from "../src/content/ecology/profiles";
import type { WorldSetting } from "../src/content/geography/types";
it("authored transition tiles share identical boundary pixels for matching corners", () => {
  expect(terrainTransitionTiles).toHaveLength(16);
  for (let a = 0; a < 16; a++)
    for (let b = 0; b < 16; b++) {
      if (
        Boolean(a & 2) === Boolean(b & 1) &&
        Boolean(a & 8) === Boolean(b & 4)
      )
        for (let y = 0; y < 16; y++)
          expect(transitionPixel(a, 15, y)).toBe(transitionPixel(b, 0, y));
      if (
        Boolean(a & 4) === Boolean(b & 1) &&
        Boolean(a & 8) === Boolean(b & 2)
      )
        for (let x = 0; x < 16; x++)
          expect(transitionPixel(a, x, 15)).toBe(transitionPixel(b, x, 0));
    }
  expect(transitionPixel(9, 7, 7)).toBe(true);
  expect(transitionPixel(6, 7, 7)).toBe(true);
});
it("banks vary independently, preserve quiet sections and remain continuous across feature blocks", () => {
  let unequal = 0,
    quiet = 0;
  for (let t = -300; t < 300; t++) {
    const a = bankOffset("review", t, -1),
      b = bankOffset("review", t, 1);
    if (Math.abs(a - b) > 0.4) unequal++;
    if (a === 0) quiet++;
    expect(Math.abs(a - bankOffset("review", t + 0.001, -1))).toBeLessThan(
      0.01,
    );
  }
  expect(unequal).toBeGreaterThan(80);
  expect(quiet).toBeGreaterThan(50);
});
it("deserts reject marsh basins; admitted wetland basins enter authoritative water terrain", () => {
  expect(marshBasin("review", 0, 0, "desert")).toBeUndefined();
  const setting = {
    water: "none",
    lon: 0,
    lat: 0,
    season: "summer",
    environment: { ecology: "wetland", landform: "plain" },
  } as WorldSetting;
  const env = createEnvironment(setting, "review");
  let pools = 0;
  for (let y = -120; y < 120; y += 3)
    for (let x = -120; x < 120; x += 3) {
      const basin = marshBasin("review", x, y, "wetland");
      if (!basin || basin.distance >= 0 || basin.wet <= 0.57) continue;
      const f = env.sample(x, y);
      if (f.water < 0 && f.kind === "lake" && f.shoreWidth === 0.5) pools++;
    }
  expect(pools).toBeGreaterThan(0);
  expect(ecologyProfiles.wetland.moisture).toBeGreaterThan(0.36);
});
