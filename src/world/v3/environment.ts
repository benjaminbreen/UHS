import type { WorldSetting } from "../../content/geography/types";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { random } from "../../core/random";
import { noise } from "../v2/noise";
import { toAtlas } from "../v2/atlas";
import type { LandSample } from "../v2/landscape";
/** Geography is sampled independently of settlements and player circumstances. */
export function createEnvironment(s: WorldSetting, seed: string) {
  const cfg = s.environment!,
    profile = ecologyProfiles[cfg.ecology];
  const angle = random(seed, "land-angle") * Math.PI * 2,
    phase = random(seed, "land-offset") * 500;
  const cache = new Map<string, LandSample>();
  const calculate = (x: number, y: number): LandSample => {
    const u = x * Math.cos(angle) + y * Math.sin(angle),
      v = -x * Math.sin(angle) + y * Math.cos(angle);
    const broad =
      noise(seed, x, y, 110, "height") * 0.75 +
      noise(seed, x, y, 48, "height-detail") * 0.25;
    const shape =
      cfg.landform === "plain"
        ? 0.44 + (broad - 0.5) * 0.2
        : cfg.landform === "rolling"
          ? broad
          : cfg.landform === "ridge"
            ? 0.38 + Math.cos((u + phase) / 58) * 0.22 + (broad - 0.5) * 0.35
            : 0.26 +
              Math.min(0.5, Math.hypot(u / 95, v / 75) * 0.25) +
              (broad - 0.5) * 0.3;
    const along = s.water === "river-ew" ? x : y,
      across = s.water === "river-ew" ? y : x;
    const course =
      -34 +
      Math.sin((along + phase) / 39) * 10 +
      (noise(seed, 0, along, 90, "course") - 0.5) * 16;
    let water = 1000,
      kind: LandSample["kind"] = "river";
    if (s.water.startsWith("river"))
      water =
        Math.abs(across - course) -
        (4 + noise(seed, 0, along, 55, "width") * 4);
    else if (s.water.startsWith("coast")) {
      const signed =
        s.water === "coast-n"
          ? y
          : s.water === "coast-s"
            ? -y
            : s.water === "coast-e"
              ? -x
              : x;
      const lateral = s.water.endsWith("n") || s.water.endsWith("s") ? x : y;
      water =
        signed +
        35 +
        Math.sin((lateral + phase) / 35) * 6 +
        (noise(seed, lateral, 0, 65, "shore") - 0.5) * 12;
      kind = "sea";
    } else if (s.water === "lake") {
      water =
        (Math.hypot((x + 38) / 25, (y - 20) / 33) - 1) * 25 +
        (noise(seed, x, y, 30, "lake") - 0.5) * 4;
      kind = "lake";
    }
    if (cfg.ecology === "wetland" && s.water === "none") {
      const pool = noise(seed, x, y, 24, "pools");
      if (pool > 0.72) {
        water = (0.72 - pool) * 70;
        kind = "lake";
      }
    }
    const moisture = Math.max(
      0.05,
      Math.min(
        0.96,
        profile.moisture +
          (noise(seed, x, y, 36, "moisture") - 0.5) * 0.22 +
          Math.max(0, 1 - Math.max(0, water) / 14) * 0.18,
      ),
    );
    const level = water < 3 ? 0 : shape > 0.57 ? 2 : shape < 0.34 ? 0 : 1;
    return {
      water,
      kind,
      moisture,
      elevation: level * 14,
      snow:
        (cfg.ecology === "tundra" && s.season === "winter") ||
        (cfg.ecology === "boreal-woodland" && s.season === "winter"),
    };
  };
  const sample = (x: number, y: number) => {
    const key = `${x},${y}`;
    let value = cache.get(key);
    if (!value) {
      value = calculate(x, y);
      if (cache.size >= 65536) cache.clear();
      cache.set(key, value);
    }
    return value;
  };
  return { origin: toAtlas(s.lon, s.lat), sample };
}
/** Local habitats vary inside the selected climatic envelope. */
export function localEcology(
  s: WorldSetting,
  seed: string,
  x: number,
  y: number,
  f: LandSample,
) {
  const base = s.environment!.ecology;
  if (base === "tundra" || base === "boreal-woodland") return base;
  if (f.water >= 0 && f.water < 9 && f.moisture > 0.67)
    return "wetland" as const;
  const cover = noise(seed, x, y, 45, "woods");
  if (
    (base === "temperate-woodland" || base === "tropical-woodland") &&
    cover < 0.3
  )
    return "grassland" as const;
  if (base === "grassland" && cover > 0.66 && f.moisture > 0.52)
    return "temperate-woodland" as const;
  if (
    (base === "desert" || base === "dry-scrub") &&
    f.water >= 0 &&
    f.water < 10 &&
    f.moisture > 0.28
  )
    return "grassland" as const;
  return base;
}
