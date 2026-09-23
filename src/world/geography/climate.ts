import type { WorldSetting } from "../../content/geography/types";
import { climateAt } from "../../content/geography/climate-map";

/** The mapped climate of 1991-2020, and the latitude rule where the map has
 * no cell or the year is glacial, when the north above 48 degrees is tundra
 * as settingFor has it. */
export function geographicClimate(
  lon: number,
  lat: number,
  moisture: number,
  year?: number,
): WorldSetting["climate"] {
  const glacial = year !== undefined && year <= -10000;
  if (glacial && lat > 48) return "tundra";
  return (!glacial && climateAt(lon, lat)) || (Math.abs(lat) > 68
    ? "tundra"
    : Math.abs(lat) > 55
      ? "boreal"
      : moisture < 0.23
        ? "arid"
        : Math.abs(lat) < 18
          ? "tropical"
          : moisture < 0.45
            ? "mediterranean"
            : "temperate");
}
