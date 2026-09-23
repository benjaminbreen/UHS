import type { WorldSetting } from "./types";
import { regionalEcology } from "../ecology/variants";

export function environmentFor(
  s: Pick<WorldSetting, "climate" | "lon" | "lat" | "relief" | "settlement"> & Partial<Pick<WorldSetting, "ecologyRevision" | "geographyMode">>,
  moisture?: number,
): NonNullable<WorldSetting["environment"]> {
  const { ecology, colorway } = regionalEcology(s.lon, s.lat, s.climate, moisture, s.ecologyRevision === 2 && s.geographyMode !== "configured");
  return {
    ecology,
    colorway,
    landform: s.relief > 0.65 ? "ridge" : s.relief > 0.25 ? "rolling" : "plain",
    population: s.settlement === "camp" ? "sparse" : "settled",
    start: "resident",
    household: "mixed",
  };
}

/** Called only for new worlds. Workers and replay consume the pinned input as-is. */
export function integratedSetting(s: WorldSetting): WorldSetting {
  if (s.terrainRevision === 1)
    return { ...s, characterRevision: s.characterRevision ?? 1 };
  if (s.geographyRevision)
    return {
      ...s,
      characterRevision: s.characterRevision ?? 1,
      terraceRevision: 1,
      vegetationRevision: s.vegetationRevision ?? 6,
      ecologyRevision: 2,
      hydrologyRevision: 3,
    };
  return {
    ...s,
    characterRevision: 2,
    geographyRevision: 1,
    urbanRevision: 2,
    roadRevision: 1,
    streetRevision: 1,
    terraceRevision: 1,
    vegetationRevision: 7,
    ecologyRevision: 2,
    hydrologyRevision: 3,
    geographyMode: s.environment ? "configured" : "earth",
    terrainRevision: 2,
    environment: s.environment ?? environmentFor({ ...s, ecologyRevision: 2, geographyMode: "earth" }),
  };
}
