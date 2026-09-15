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
