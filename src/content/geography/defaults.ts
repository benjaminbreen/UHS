import type { WorldSetting } from "./types";
import { regionalEcology } from "../ecology/variants";

export function environmentFor(
  s: Pick<WorldSetting, "climate" | "lon" | "lat" | "relief" | "settlement">,
): NonNullable<WorldSetting["environment"]> {
  const { ecology, colorway } = regionalEcology(s.lon, s.lat, s.climate);
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
      vegetationRevision: 6,
      ecologyRevision: 1,
      hydrologyRevision: 2,
    };
  return {
    ...s,
    characterRevision: 2,
    geographyRevision: 1,
    urbanRevision: 2,
    roadRevision: 1,
    vegetationRevision: 6,
    ecologyRevision: 1,
    hydrologyRevision: 2,
    geographyMode: s.environment ? "configured" : "earth",
    terrainRevision: 2,
    environment: s.environment ?? environmentFor(s),
  };
}
