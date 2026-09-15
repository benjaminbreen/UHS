import { expect, it } from "vitest";
import {
  classifyCommunity,
  supportsHabitatResource,
} from "../src/content/ecology/communities";
import { habitatAppearance } from "../src/render/habitat-appearance";
import { rasterHabitatTile } from "../src/render/habitat-raster";
import { habitatAt } from "../src/world/v3/habitats";
import type { LandSample } from "../src/world/geography/landscape";
import { reliefCell } from "../src/world/v3/topography";
const land = (saturation: number, water = 2): LandSample => ({
  water,
  kind: "river",
  elevation: 0,
  moisture: 0.7,
  snow: false,
  drainage: { saturation, slope: 0.05, lowland: 0.8, waterDistance: water },
  ecologyParts: [
    { ecology: "tropical-woodland", colorway: "monsoon", weight: 1 },
  ],
});
it("distinguishes resource-bearing habitats by physical conditions within one regional ecology", () => {
  const region = {
    ecology: "tropical-woodland" as const,
    colorway: "monsoon" as const,
  };
  const marsh = classifyCommunity(region, land(0.85), 0.2, 0.1);
  const swamp = classifyCommunity(region, land(0.85), 0.8, 0.1);
  const rocky = classifyCommunity(region, land(0.1, 80), 0.15, 0.95);
  expect(marsh.primary).toBe("marsh");
  expect(swamp.primary).toBe("swamp");
  expect(rocky.primary).toBe("rocky");
  expect(supportsHabitatResource(marsh, "reeds")).toBe(true);
  expect(supportsHabitatResource(swamp, "reeds")).toBe(false);
  expect(supportsHabitatResource(swamp, "timber")).toBe(true);
  expect(supportsHabitatResource(rocky, "stone")).toBe(true);
  expect(Object.values(marsh.weights).reduce((a, b) => a + b, 0)).toBeCloseTo(
    1,
  );
});
it("keeps water and shores distinct from saturated land", () => {
  const region = { ecology: "tropical-woodland" as const };
  expect(classifyCommunity(region, land(0.85, -5), 0.8, 0.1).primary).toBe(
    "water",
  );
  expect(
    classifyCommunity(
      region,
      { ...land(0.85, 1), kind: "sea", shoreWidth: 3 },
      0.8,
      0.1,
    ).primary,
  ).toBe("shore");
});
it("renders the same regional ground colors used by the minimap even with a legacy vegetation hint", () => {
  const f = {
    ...land(0.1, 80),
    ecologyParts: [{ ecology: "dry-scrub" as const, weight: 1 }],
  };
  const h = habitatAt("dry-scrub", "summer", "lisbon", 0, 0, f);
  h.vegetation = "steppe";
  const cell = { ...reliefCell(0, 80, 0.4), habitat: h };
  const sample = () => cell;
  const expected = habitatAppearance(h).ground;
  const actual = [0, 0, 0];
  let count = 0;
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 3; x++) {
      const tile = rasterHabitatTile(sample, x, y, 0, 0);
      for (let i = 0; i < tile.pixels.length; i += 4) {
        for (let c = 0; c < 3; c++) actual[c] += tile.pixels[i + c];
        count++;
      }
    }
  for (let c = 0; c < 3; c++)
    expect(Math.abs(actual[c] / count - expected[c])).toBeLessThan(25);
});

it("keeps established river coloring separate from local flooded-margin habitat", () => {
  const river = habitatAt("tropical-woodland", "summer", "river", 0, 0, land(.9,-4), "monsoon");
  expect(river.site?.primary).toBe("water");
  expect(river.colorway).toBe("monsoon");
  const marsh = classifyCommunity({ecology:"wetland"}, land(.9), .15, .05);
  expect(supportsHabitatResource({...marsh,landUse:"cultivated"},"reeds")).toBe(false);
});
