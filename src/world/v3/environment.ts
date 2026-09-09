import { trimCache } from "../../core/cache";
import { marshBasin } from "./wet-features";
import type { WorldSetting } from "../../content/geography/types";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { regionalLandforms } from "./landforms";
import { noise } from "../geography/noise";
import { toAtlas, atlasSample } from "../geography/atlas";
import type { RegionalContext } from "../regional/context";
import type { LandSample } from "../geography/landscape";
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
      trimCache(atlasCache, 4096);
      atlasCache.set(key, broad);
    }
    // Exact sampling is only needed within reach of a shoreline or river.
    return Math.abs(broad.coast) < 64 || broad.river < 64
      ? atlasSample(ax, ay)
      : broad;
  }
  const cache = new Map<number, LandSample>();
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
      const bankShape =
        (noise(seed, fx, fy, 13, "regional-coves") - 0.5) * 5 +
        (noise(seed, fx, fy, 37, "regional-bars") - 0.5) * 3;
      const riverWater = Math.min(
        atlas.river - riverWidth - bankShape,
        atlas.river - 2.5,
      );
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
          const localBank =
            (noise(seed, fx, fy, 15, "feature-coves") - 0.5) * 5;
          water =
            type === "river" && Math.abs(feature.distance) < 9
              ? feature.distance -
                localBank * Math.max(0, 1 - Math.max(0, -feature.distance) / 4)
              : feature.distance;
          kind = type;
          waterFlow = feature.flow;
        } else if (type === "land") water = Math.max(0.1, -feature.distance);
      }
    }
    // Creeks: a meandering stream every few hundred cells, three cells wide,
    // so nearly every settlement has water through it and a bridge or two.
    // The starting town's creek runs through its eastern quarter, clear of
    // the square. Real rivers and coasts keep their own water.
    {
      const CREEK = 640;
      const lane = Math.round((fx - 46) / CREEK);
      const wander = noise(seed, lane * 7, 3, 1, "creek") - 0.5;
      const creekX =
        46 +
        lane * CREEK +
        Math.sin(fy / 210 + wander * 6) * 22 +
        Math.sin(fy / 57 + lane) * 5 +
        wander * 80 * Math.min(1, Math.abs(lane));
      const creek = Math.abs(fx - creekX) - 1.5;
      if (creek < water && water > 12) {
        water = creek;
        kind = "river";
        shoreWidth = 1;
        floodplain = 2 + noise(seed, fx, fy, 30, "creek-flat") * 2;
        waterFlow = [0, lane % 2 ? -1 : 1];
      }
    }
    // Real pools join the terrain sample before settlement siting and routing.
    // A common basin center controls eligibility across every pixel of the pool.
    const basin = marshBasin(seed, fx, fy, local.environment!.ecology);
    if (
      basin &&
      basin.distance < 2 &&
      water > shoreWidth + 5 &&
      profile.moisture > 0.36 &&
      basin.wet > 0.57 &&
      field(
        basin.x - (regional ? origin.x : 0),
        basin.y - (regional ? origin.y : 0),
      ) < 0.5 &&
      !regional?.placeAt(x, y)
    ) {
      water = basin.distance;
      kind = "lake";
      shoreWidth = 0.5;
      floodplain = 2.5;
      waterFlow = [0, 0];
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
    // Packed, not a string: exact while |x| < 2^20 and |y| < 2^21.
    const key = x * 2097152 + y;
    let value = cache.get(key);
    if (!value) {
      value = calculate(x, y);
      trimCache(cache, 65536);
      cache.set(key, value);
    }
    return value;
  };
  return { origin: toAtlas(s.lon, s.lat), sample };
}
/** Local habitats vary inside the selected climatic envelope. */
export function localEcology(
  s: WorldSetting,
  _seed: string,
  _x: number,
  _y: number,
  _f: LandSample,
) {
  // Local habitats retain their climatic envelope. Cover/wetness live in
  // habitat metadata, so a tropical clearing never becomes temperate grassland.
  return s.environment!.ecology;
}
