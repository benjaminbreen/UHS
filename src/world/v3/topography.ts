import type { WorldSetting } from "../../content/geography/types";
import type { TopographyCell, HeightTier } from "../../core/topography";
import { noise } from "../v2/noise";
import { createLandscape } from "../v2/landscape";
/** Revision 1: world-coordinate fields; chunk order never affects landforms. */
export function createReliefLandscape(setting: WorldSetting, seed: string) {
  const base = createLandscape(setting, seed);
  const cache = new Map<string, ReturnType<typeof base.sample>>();
  const sample = (x: number, y: number) => {
    const key = `${x},${y}`,
      old = cache.get(key);
    if (old) return old;
    const f = base.sample(x, y);
    const river = setting.water === "river-ns" || setting.water === "river-ew";
    const along = setting.water === "river-ew" ? x : y;
    const across = setting.water === "river-ew" ? y : x;
    const center =
      -32 +
      Math.sin(along / 23) * 4 +
      (noise(seed, 0, along, 55, "course") - 0.5) * 10;
    const water = river
      ? Math.abs(across - center) - (4 + noise(seed, 0, along, 35, "width") * 3)
      : f.water;
    const moisture = Math.max(
      0.15,
      Math.min(
        0.95,
        0.32 +
          noise(seed, x, y, 42, "wet-pockets") * 0.3 +
          Math.max(0, 1 - water / 12) * 0.3,
      ),
    );
    const hills =
      noise(seed, x, y, 80, "terraces") * 0.7 +
      noise(seed, x, y, 160, "ridges") * 0.3 +
      Math.tanh((x - 24) / 20) * 0.18;
    const height: HeightTier =
      water < 3 ? 0 : hills > 0.59 && Math.hypot(x, y) > 16 ? 2 : 1;
    const result = {
      ...f,
      water,
      moisture,
      elevation: height * 14,
      snow: false,
    };
    if (cache.size > 131072) cache.clear();
    cache.set(key, result);
    return result;
  };
  return { origin: base.origin, sample };
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
