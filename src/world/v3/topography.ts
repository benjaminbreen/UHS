import type { WorldSetting } from "../../content/geography/types";
import type { TopographyCell, HeightTier } from "../../core/topography";
import { noise } from "../v2/noise";
import { toAtlas } from "../v2/atlas";
import type { LandSample } from "../v2/landscape";
/** Revision 1: world-coordinate fields; chunk order never affects landforms. */
export function createReliefLandscape(setting: WorldSetting, seed: string) {
  const origin = toAtlas(setting.lon, setting.lat);
  const cache = new Map<string, LandSample>();
  const sample = (x: number, y: number) => {
    const key = `${x},${y}`,
      old = cache.get(key);
    if (old) return old;

    const river = setting.water === "river-ns" || setting.water === "river-ew";
    const along = setting.water === "river-ew" ? x : y;
    const across = setting.water === "river-ew" ? y : x;
    const center =
      -23 +
      Math.sin(along / 10) * 3.5 +
      (noise(seed, 0, along, 55, "course") - 0.5) * 10;
    const water = river
      ? Math.abs(across - center) - (3 + noise(seed, 0, along, 35, "width") * 2)
      : 1000;
    const pocket = noise(seed, x, y, 18, "wet-pockets");
    const moisture = Math.max(
      0.18,
      Math.min(
        0.95,
        0.38 +
          noise(seed, x, y, 35, "meadow") * 0.3 +
          Math.max(0, 1 - water / 9) * (0.1 + pocket * 0.5),
      ),
    );
    // Broad lobes expose front-facing earth as well as narrow side returns.
    // Their low-frequency outline varies by seed without fragmenting the rise.
    const wobble = (noise(seed, x, y, 26, "edge") - 0.5) * 3;
    const north = Math.hypot((x - 35) / 22, (y + 23) / 19);
    const south = Math.hypot((x - 38) / 23, (y - 30) / 19);
    const high = Math.min(north, south) < 1 + wobble * 0.035 || x > 51 + wobble;
    const height: HeightTier = water < 1.5 + pocket * 1.5 ? 0 : high ? 2 : 1;
    const result = {
      kind: "river" as const,
      water,
      moisture,
      elevation: height * 14,
      snow: false,
    };
    if (cache.size > 131072) cache.clear();
    cache.set(key, result);
    return result;
  };
  return { origin, sample };
}
export function reliefCell(
  height: HeightTier,
  water: number,
  moisture: number,
): TopographyCell {
  return {
    height,
    moisture,
    biome:
      moisture > 0.73
        ? "wetland"
        : moisture < 0.48
          ? "dry-upland"
          : "grassland",
    surface:
      water < 0
        ? "water"
        : moisture > 0.73
          ? "damp"
          : moisture < 0.48
            ? "dry"
            : "grass",
    ...(water < 0
      ? { waterDepth: water > -2 ? ("shallow" as const) : ("deep" as const) }
      : {}),
  };
}
