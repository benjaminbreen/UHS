import { expect, it } from "vitest";
import type { WorldSetting } from "../src/content/geography/types";
import { createRegionalContext } from "../src/world/regional/context";
import { adjacentTerrain } from "../src/world/travel/terrain-preview";

const base = {
  version: 2,
  lon: 32,
  lat: 38,
  year: -1042,
  relief: 0.3,
  climate: "arid",
  settlement: "camp",
  water: "none",
  season: "summer",
  terrainRevision: 2,
  geographyRevision: 1,
  geographyMode: "configured",
  ecologyRevision: 1,
  hydrologyRevision: 1,
  environment: {
    ecology: "desert",
    landform: "rolling",
    population: "none",
    start: "wanderer",
    household: "mixed",
  },
} as WorldSetting;
const neighbor = (ecology: "desert" | "temperate-woodland") => ({
  lon: 32,
  lat: 38,
  ecology,
  relief: 0.3,
  climate: "arid" as const,
  water: "none" as const,
  landform: "rolling" as const,
  size: 304,
  geographyMode: "configured" as const,
});
const pair = (
  ecology: "desert" | "temperate-woodland",
  bearing: string,
): WorldSetting => ({
  ...base,
  environment: { ...base.environment!, ecology },
  playableMap: {
    id: ecology,
    size: 304,
    exits: [
      {
        id: "link",
        to: "next",
        bearing,
        mode: "land",
        neighbor: neighbor(
          ecology === "desert" ? "temperate-woodland" : "desert",
        ),
      },
    ],
  },
});
it("both maps meet at the same biome mixture while retaining their interiors", () => {
  const desert = createRegionalContext(pair("desert", "N"));
  const forest = createRegionalContext(pair("temperate-woodland", "S"));
  const weight = (r: ReturnType<typeof desert.ecologyAt>) =>
    r.parts.find((p) => p.ecology === "desert")?.weight ?? 0;
  expect(weight(desert.ecologyAt(0, -152))).toBeCloseTo(0.2);
  expect(weight(forest.ecologyAt(0, 151))).toBeCloseTo(0.2);
  expect(weight(desert.ecologyAt(0, -96))).toBeGreaterThan(0.2);
  expect(weight(desert.ecologyAt(0, 0))).toBe(1);
  expect(weight(forest.ecologyAt(0, 0))).toBe(0);
});
it("previews land and its biome beyond a land exit instead of boundary water", () => {
  const preview = adjacentTerrain(pair("desert", "N"));
  expect(preview(0, 0)).toBeUndefined();
  const beyond = preview(0, -200)!;
  expect(beyond.terrain).not.toBe("water");
  expect(
    beyond.habitat.blend!.find((p) => p.ecology === "temperate-woodland")!
      .weight,
  ).toBeGreaterThan(0.2);
});
