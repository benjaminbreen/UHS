import { expect, it, vi } from "vitest";
import type { WorldSetting } from "../src/content/geography/types";
vi.mock("../src/content/geography/ecoregions", () => ({
  ecoregionNear: (lon: number) =>
    lon < 32
      ? { id: 1, biome: 1, realm: "Indomalayan", sourceName: "Moist forest" }
      : { id: 2, biome: 13, realm: "Palearctic", sourceName: "Dry upland" },
}));
import { createRegionalContext } from "../src/world/regional/context";
import { regionalEcology } from "../src/content/ecology/variants";
const s = {
  version: 2,
  lon: 32,
  lat: 38,
  year: -12000,
  relief: 0.3,
  climate: "temperate",
  water: "none",
  geographyMode: "earth",
  ecologyRevision: 2,
  environment: {
    ecology: "temperate-woodland",
    landform: "rolling",
    population: "none",
    start: "wanderer",
    household: "mixed",
  },
} as WorldSetting;
it("samples the actual ecoregion on either side of a geographic boundary regardless of cache order", () => {
  for (const order of [
    [-1024, 1024],
    [1024, -1024],
  ]) {
    const region = createRegionalContext(s);
    for (const x of order) region.settingAt(x, 0, false);
    expect(region.settingAt(-1024, 0, false).environment!.ecology).toBe(
      "tropical-woodland",
    );
    expect(region.settingAt(1024, 0, false).environment!.ecology).toBe(
      "desert",
    );
    expect(region.ecologyAt(-1024, 0).selected.ecology).toBe(
      "tropical-woodland",
    );
  }
});
it("uses real ecoregions over rough climate while retaining explicit configured climate", () => {
  expect(regionalEcology(31, 38, "arid", 0.1, true).ecology).toBe(
    "tropical-woodland",
  );
  expect(regionalEcology(31, 38, "arid", 0.1, false).ecology).toBe("desert");
});
it("fades a neighbour's ecology out at both ends of its seam", () => {
  const size = 384;
  const region = createRegionalContext({
    ...s,
    playableMap: {
      name: "Test",
      size,
      exits: [
        {
          id: "w",
          mode: "land",
          bearing: "W",
          neighbor: { ecology: "tundra" },
          seam: {
            side: "W",
            start: 0.1,
            end: 0.55,
            water: [],
            sea: [],
            height: [],
            road: false,
            roadAt: 0.5,
            walkable: 1,
          },
        },
      ],
    },
  } as unknown as WorldSetting);
  const share = (y: number) =>
    region
      .ecologyAt(-size / 2 + 2, y)
      .parts.filter((p) => p.ecology === "tundra")
      .reduce((sum, p) => sum + p.weight, 0);
  // The seam runs y = -145 to y = 17; each end now ramps over ~50 cells
  // instead of stopping at full strength.
  const middle = share(-60);
  expect(middle).toBeCloseTo(0.5, 2);
  for (const ramp of [
    [-150, -140, -130, -120, -110],
    [10, 0, -10, -20, -30],
  ]) {
    expect(share(ramp[0])).toBeLessThan(0.05);
    for (let i = 1; i < ramp.length; i++)
      expect(share(ramp[i])).toBeGreaterThan(share(ramp[i - 1]) + 0.05);
  }
});
