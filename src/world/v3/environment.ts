import type { WorldSetting } from "../../content/geography/types";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { regionalLandforms } from "./landforms";
import { noise } from "../v2/noise";
import { toAtlas, atlasSample } from "../v2/atlas";
import type { RegionalContext } from "../regional/context";
import type { LandSample } from "../v2/landscape";
/** Geography is sampled independently of settlements and player circumstances. */
export function createEnvironment(
  s: WorldSetting,
  seed: string,
  regional?: RegionalContext,
) {
  const cfg = s.environment!;
  const origin = toAtlas(s.lon, s.lat);
  const plan = regionalLandforms(
    s,
    seed,
    regional
      ? (x, y) =>
          regional.settingAt(x - origin.x, y - origin.y, false).environment!
            .landform
      : undefined,
  );
  const configuredPlan =
    regional && s.geographyMode === "configured"
      ? regionalLandforms(s, seed)
      : undefined;
  const blendWeight = (x: number, y: number) =>
    configuredPlan
      ? Math.max(0, Math.min(1, (384 - Math.hypot(x, y)) / 192))
      : 0;
  const field = (x: number, y: number) => {
    const global = plan.field(
      regional ? x + origin.x : x,
      regional ? y + origin.y : y,
    );
    const weight = blendWeight(x, y);
    return configuredPlan && weight
      ? global * (1 - weight) + configuredPlan.field(x, y) * weight
      : global;
  };
  const atlasCache = new Map<string, ReturnType<typeof atlasSample>>();
  function earth(x: number, y: number) {
    const ax = x + origin.x,
      ay = y + origin.y;
    const gx = Math.floor(ax / 32) * 32,
      gy = Math.floor(ay / 32) * 32;
    const key = `${gx},${gy}`;
    let broad = atlasCache.get(key);
    if (!broad) {
      broad = atlasSample(gx + 16, gy + 16);
      if (atlasCache.size >= 4096) atlasCache.clear();
      atlasCache.set(key, broad);
    }
    // Exact sampling is only needed within reach of a shoreline or river.
    return Math.abs(broad.coast) < 64 || broad.river < 64
      ? atlasSample(ax, ay)
      : broad;
  }
  const cache = new Map<string, LandSample>();
  const calculate = (x: number, y: number): LandSample => {
    const local = regional?.settingAt(x, y) ?? s;
    const profile = ecologyProfiles[local.environment!.ecology];
    const fx = regional ? x + origin.x : x,
      fy = regional ? y + origin.y : y;
    const shape = field(x, y);
    const wx = x + (noise(seed, x, y, 75, "shore-warp-x") - 0.5) * 36,
      wy = y + (noise(seed, x, y, 87, "shore-warp-y") - 0.5) * 36;
    let waterFlow: readonly [number, number] = [0, 0];
    let water = 1000,
      floodplain = 3,
      shoreWidth = 2,
      kind: LandSample["kind"] = "river";
    if (
      s.water.startsWith("river") &&
      (!regional || s.geographyMode === "configured")
    ) {
      ({ water, floodplain, shoreWidth, waterFlow } = plan.river(x, y));
    } else if (s.water.startsWith("coast")) {
      const signed =
        s.water === "coast-n"
          ? wy
          : s.water === "coast-s"
            ? -wy
            : s.water === "coast-e"
              ? -wx
              : wx;
      water = signed + 35 + (noise(seed, x, y, 27, "headlands") - 0.5) * 13;
      kind = "sea";
      shoreWidth = 2 + noise(seed, x, y, 46, "beaches") * 9;
      floodplain = shoreWidth + 3;
    } else if (s.water === "lake") {
      // Overlapping distorted basins create coves and uneven shores.
      const a = Math.hypot((wx + 42) / 24, (wy - 19) / 29),
        b = Math.hypot((wx + 29) / 19, (wy - 35) / 21);
      water =
        (Math.min(a, b) - 1) * 24 +
        (noise(seed, x, y, 19, "lake-shore") - 0.5) * 4;
      kind = "lake";
      shoreWidth = 0.7 + noise(seed, x, y, 25, "lake-margin") * 3;
      floodplain = shoreWidth + noise(seed, x, y, 40, "lake-flat") * 7;
    }
    if (cfg.ecology === "wetland" && s.water === "none") {
      const pool = noise(seed, x, y, 24, "pools");
      if (pool > 0.72) {
        water = (0.72 - pool) * 70;
        kind = "lake";
      }
    }
    if (regional) {
      const atlas = earth(x, y);
      const riverWidth = 4 + noise(seed, fx, fy, 130, "atlas-river-width") * 3;
      const riverWater = atlas.river - riverWidth;
      const earthWater = Math.min(atlas.coast, riverWater);
      // Explorer recipes constrain a bounded starting area; beyond it the same
      // generator returns to Earth geography, rather than extending a coast forever.
      const weight = blendWeight(x, y);
      water =
        weight === 1
          ? water
          : weight === 0
            ? earthWater
            : water * weight + Math.min(1000, earthWater) * (1 - weight);
      if (weight < 0.5) {
        kind = atlas.coast < riverWater ? "sea" : "river";
        shoreWidth =
          kind === "sea" ? 3 + noise(seed, fx, fy, 45, "beach-width") * 6 : 2;
        floodplain =
          kind === "river"
            ? 4 + noise(seed, fx, fy, 80, "floodplain") * 9
            : shoreWidth;
        waterFlow = atlas.riverFlow;
      }
      const feature = regional.featureAt(x, y, [
        "land",
        "sea",
        "lake",
        "river",
      ]);
      if (feature) {
        const type = feature.feature.kind;
        if (type === "river" || type === "sea" || type === "lake") {
          water = feature.distance;
          kind = type;
          waterFlow = feature.flow;
        } else if (type === "land") water = Math.max(0.1, -feature.distance);
      }
    }
    const moisture = Math.max(
      0.05,
      Math.min(
        0.96,
        profile.moisture +
          (noise(seed, fx, fy, 36, "moisture") - 0.5) * 0.22 +
          Math.max(0, 1 - Math.max(0, water) / 14) *
            noise(seed, fx + 43, fy - 19, 29, "drainage-pockets") *
            0.28,
      ),
    );
    // Broad dry tiers and asymmetric low floodplains; a generous intermediate
    // terrace prevents a two-tier wall directly at a water edge.
    let baseTier = shape > 0.56 ? 2 : shape < 0.34 ? 0 : 1;
    if (baseTier !== 1) {
      const support = [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ].filter(([dx, dy]) => {
        const h = field(x + dx, y + dy);
        return (h > 0.56 ? 2 : h < 0.34 ? 0 : 1) === baseTier;
      }).length;
      if (support < 3) baseTier = 1;
    }
    // Approximate urban land is graded as a shared footprint, never per building.
    if (regional?.placeAt(x, y) && water > floodplain + 10) baseTier = 1;
    const level =
      water < floodplain
        ? 0
        : water < floodplain + 10
          ? Math.min(1, baseTier)
          : baseTier;
    return {
      water,
      shoreWidth,
      waterFlow,
      kind,
      moisture,
      elevation: level * 14,
      snow:
        (local.environment!.ecology === "tundra" && s.season === "winter") ||
        (local.environment!.ecology === "boreal-woodland" &&
          s.season === "winter"),
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
