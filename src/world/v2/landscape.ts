import type { WorldSetting } from "../../content/geography/types";
import {
  atlasSample,
  toAtlas,
  ATLAS_SCALE,
  broadEnvironment,
  nearestRiverPoint,
} from "./atlas";
import { noise, segmentDistance } from "./noise";
export type LandSample = {
  /** Optional dry shoreline width in local cells, supplied by regional terrain. */
  shoreWidth?: number;
  waterFlow?: readonly [number, number];
  elevation: number;
  moisture: number;
  water: number;
  kind: "sea" | "river" | "lake";
  snow: boolean;
};
export function createLandscape(s: WorldSetting, seed: string) {
  const origin = toAtlas(s.lon, s.lat),
    samples = new Map<string, LandSample>();
  const ew = s.water === "river-ew";
  const course = (t: number) =>
    ew
      ? 48 + Math.sin(t / 180) * 12 + Math.sin(t / 510) * 24
      : -65 + Math.sin(t / 180) * 12 + Math.sin(t / 510) * 24;
  const riverName: Record<string, string> = {
    london: "Thames",
    rome: "Tiber",
    umbria: "Tiber",
    nile: "Nile",
    amazon: "Amazon",
    timbuktu: "Niger",
    mesopotamia: "Euphrates",
  };
  const joins = [-1800, 1800].map((t) => {
    const a = ew ? [t, course(t)] : [course(t), t];
    const found = nearestRiverPoint(
      origin.x + a[0],
      origin.y + a[1],
      riverName[s.placeId],
    );
    return {
      a,
      b: found ? [found[0] - origin.x, found[1] - origin.y] : undefined,
    };
  });
  const dry =
    s.climate === "arid"
      ? 0.14
      : s.climate === "mediterranean"
        ? 0.38
        : s.climate === "tropical"
          ? 0.85
          : s.climate === "monsoon"
            ? 0.72
            : 0.6;
  const wetSeason =
    s.climate === "monsoon"
      ? s.season === "summer"
        ? 0.2
        : -0.12
      : s.climate === "mediterranean"
        ? s.season === "summer"
          ? -0.15
          : 0.05
        : 0;
  function raw(x: number, y: number): LandSample {
    const ax = x + origin.x,
      ay = y + origin.y;
    const atlas = atlasSample(ax, ay);
    const ambient = broadEnvironment(ax / ATLAS_SCALE, -ay / ATLAS_SCALE);
    const localWeight = Math.max(
      0,
      Math.min(1, (12000 - Math.hypot(x, y)) / 8000),
    );
    const relief =
      ambient.relief * (1 - localWeight) +
      Math.max(ambient.relief, s.relief) * localWeight;
    const moistureBase =
      ambient.moisture * (1 - localWeight) + dry * localWeight;
    const broad = noise(seed, ax, ay, 780, "relief"),
      local = noise(seed, ax, ay, 100, "hills");
    let sea = atlas.coast;
    const radius = Math.hypot(x, y),
      blend = Math.max(0, Math.min(1, (2400 - radius) / 1200));
    const wiggle =
      (noise(seed, ax, ay, 180, "shore") - 0.5) *
      (s.settlement === "port" ? 12 : 30);
    let shore: number | undefined;
    const coastReach = s.settlement === "port" ? 18 : 70;
    if (s.water === "coast-n") shore = y + coastReach + wiggle;
    if (s.water === "coast-s") shore = coastReach - y + wiggle;
    if (s.water === "coast-e") shore = coastReach - x + wiggle;
    if (s.water === "coast-w") shore = x + coastReach + wiggle;
    if (shore !== undefined) sea = sea * (1 - blend) + shore * blend;
    // Inland named anchors remain land at the starting settlement despite atlas generalization.
    else if (radius < 500) sea = Math.max(sea, (500 - radius) * 0.8);
    let river = atlas.river - 8,
      kind: LandSample["kind"] = "river";
    const main = ew ? y - course(x) : x - course(y);
    if (s.water === "river-ew" || s.water === "river-ns") {
      const along = ew ? x : y;
      // Suppress the coarse duplicate channel near the city. The refined course rejoins
      // the atlas at both ends, so no neighboring chunk invents a continuation.
      const channel = Math.abs(main) - (s.settlement === "city" ? 18 : 9);
      if (Math.abs(along) < 1800)
        river = radius < 1100 ? channel : Math.min(river, channel);
      for (const join of joins) {
        if (join.b)
          river = Math.min(river, segmentDistance(x, y, join.a, join.b) - 8);
        else if (Math.hypot(x - join.a[0], y - join.a[1]) < 18)
          river = Math.min(
            river,
            Math.hypot(x - join.a[0], y - join.a[1]) - 18,
          );
      }
      // Tributaries meet the shared main course. They start at springs, independent of chunk boundaries.
      for (const t of [-640, 640]) {
        const cross = ew
          ? 48 + Math.sin(t / 180) * 12 + Math.sin(t / 510) * 24
          : -65 + Math.sin(t / 180) * 12 + Math.sin(t / 510) * 24;
        const alongTrib = ew ? y - cross : x - cross;
        if (alongTrib > -420 && alongTrib < 0) {
          const dist =
            Math.abs((ew ? x : y) - t - Math.sin(alongTrib / 90) * 16) - 2.5;
          river = Math.min(river, dist);
        }
      }
    }
    if (s.water === "lake") {
      const lake = Math.hypot((x + 110) * 0.7, y + 20) - 65;
      if (lake < river) {
        river = lake;
        kind = "lake";
      }
    }
    let water = river;
    if (sea < water) {
      water = sea;
      kind = "sea";
    }
    const valley = Math.max(0, 1 - Math.max(0, water) / 95);
    const elevation = Math.max(
      0,
      ((broad * 0.7 + local * 0.3) * relief * 180 + (local - 0.5) * 14) *
        (1 - valley * 0.9),
    );
    const moisture = Math.max(
      0,
      Math.min(
        1,
        moistureBase +
          wetSeason +
          (noise(seed, ax, ay, 170, "moisture") - 0.5) * 0.35 +
          valley * 0.3,
      ),
    );
    const latitude = Math.abs(ay / ATLAS_SCALE);
    const snow =
      (s.climate === "tundra" && s.season === "winter") ||
      (s.climate === "boreal" && s.season === "winter") ||
      (s.year < -9999 && latitude > 62) ||
      elevation > 145;
    return { elevation, moisture, water, kind, snow };
  }
  return {
    origin,
    sample(x: number, y: number): LandSample {
      // Small bounded memo, same semantics in worker/headless/browser.
      const k = `${x},${y}`;
      const old = samples.get(k);
      if (old) return old;
      const value = raw(x, y);
      if (samples.size >= 65536) samples.clear();
      samples.set(k, value);
      return value;
    },
  };
}
