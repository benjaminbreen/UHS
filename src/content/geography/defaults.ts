import type { WorldSetting } from "./types";

export function environmentFor(
  s: WorldSetting,
): NonNullable<WorldSetting["environment"]> {
  return {
    ecology:
      s.climate === "tundra"
        ? "tundra"
        : s.climate === "boreal"
          ? "boreal-woodland"
          : s.climate === "arid"
            ? "desert"
            : s.climate === "mediterranean"
              ? "dry-scrub"
              : s.climate === "tropical" || s.climate === "monsoon"
                ? "tropical-woodland"
                : "temperate-woodland",
    landform: s.relief > 0.65 ? "ridge" : s.relief > 0.25 ? "rolling" : "plain",
    population: s.settlement === "camp" ? "sparse" : "settled",
    start: "resident",
    household: "mixed",
  };
}

/** Called only for new worlds. Workers and replay consume the pinned input as-is. */
export function integratedSetting(s: WorldSetting): WorldSetting {
  if (s.terrainRevision === 1 || s.geographyRevision) return s;
  return {
    ...s,
    geographyRevision: 1,
    urbanRevision: 1,
    roadRevision: 1,
    geographyMode: s.environment ? "configured" : "earth",
    terrainRevision: 2,
    environment: s.environment ?? environmentFor(s),
  };
}
