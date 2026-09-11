import type { WorldSetting } from "../../content/geography/types";

export function geographicClimate(
  lat: number,
  moisture: number,
): WorldSetting["climate"] {
  return Math.abs(lat) > 68
    ? "tundra"
    : Math.abs(lat) > 55
      ? "boreal"
      : moisture < 0.23
        ? "arid"
        : Math.abs(lat) < 18
          ? "tropical"
          : moisture < 0.45
            ? "mediterranean"
            : "temperate";
}
