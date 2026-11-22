import type { WorldSetting } from "../geography/types";
import { buildingModels } from "./models";

export type BuildingScale = "small" | "medium" | "large";
export type BuildingScaleContext = {
  settlement?: WorldSetting["settlement"];
  /** 0 at the loose edge, 1 at the settlement's dense centre. */
  density?: number;
  /** Household means on the shared 0-100 standing scale. */
  wealth?: number;
  quarter?: "market" | "craft" | "elite" | "residential" | "edge";
  /** True for agricultural/pastoral households and farmstead lots. */
  rural?: boolean;
  /** Target architectural wealth tier (0 humble, 1 middling, 2 grand). */
  wealthTier?: 0 | 1 | 2;
  year?: number;
};

type RegionalModel = {
  goldScale?: string;
  regionalHouse?: string;
  prehistoricExpansion?: string;
  wealthTier?: number;
  serviceStyle?: string;
};

const URBAN_REGIONAL = new Set([
  "southasian-courtyard",
  "westasian-courtyard",
  "eastasian-courtyard",
  "eastasian-row",
  "roman-insula",
  "roman-domus",
]);

export function buildingScale(frame: string): BuildingScale {
  const scale = (buildingModels[frame] as RegionalModel | undefined)?.goldScale;
  // The East Asian house sets add tiny and grand frames at either end.
  return scale === "tiny" ? "small" : scale === "grand" ? "large" : ((scale as BuildingScale) ?? "small");
}

export function buildingWealthTier(frame: string): number | undefined {
  return (buildingModels[frame] as RegionalModel | undefined)?.wealthTier;
}

export function isServiceFrame(frame: string): boolean {
  return Boolean((buildingModels[frame] as RegionalModel | undefined)?.serviceStyle);
}

export function isUrbanRegionalFrame(frame: string): boolean {
  const fam = (buildingModels[frame] as RegionalModel | undefined)?.regionalHouse;
  return Boolean(fam && URBAN_REGIONAL.has(fam));
}

export function targetWealthTier(wealth = 48): 0 | 1 | 2 {
  return wealth < 38 ? 0 : wealth < 72 ? 1 : 2;
}

/** A scale tier's share before normalisation. Wealth chooses the exceptional
 * house inside a settlement; density and settlement form decide whether that
 * settlement can support exceptional houses at all. */
export function buildingScaleWeight(
  scale: BuildingScale,
  context: BuildingScaleContext,
) {
  const density = Math.max(0, Math.min(1, context.density ?? 0.45));
  const wealth = Math.max(0, Math.min(100, context.wealth ?? 48)) / 100;
  const rank = context.settlement ?? "village";
  const quarter = context.quarter;
  if (scale === "small")
    return (
      0.62 *
      (1.2 - density * 0.35) *
      (1.2 - wealth * 0.35) *
      (rank === "camp" ? 1.45 : rank === "farm" ? 1.15 : 1)
    );
  if (scale === "medium")
    return (
      0.34 *
      (0.7 + density * 0.65) *
      (0.65 + wealth * 0.8) *
      (rank === "camp" ? 0.5 : rank === "city" || rank === "port" ? 1.15 : 1) *
      (quarter === "elite" ? 1.35 : quarter === "edge" ? 0.75 : 1)
    );
  return (
    0.04 *
    (0.3 + density * 1.15) *
    (0.15 + wealth * wealth * 1.9) *
    (rank === "camp"
      ? 0.08
      : rank === "farm"
        ? 0.45
        : rank === "village"
          ? 0.7
          : 1.25) *
    (quarter === "elite"
      ? 2.8
      : quarter === "market"
        ? 1.35
        : quarter === "edge"
          ? 0.25
          : 1)
  );
}

export function chooseBuildingScale(
  frames: readonly string[],
  context: BuildingScaleContext,
  roll: number,
): BuildingScale {
  const prehistoricCamp =
    context.settlement === "camp" &&
    frames.some(
      (frame) =>
        (buildingModels[frame] as RegionalModel | undefined)
          ?.prehistoricExpansion,
    );
  const regionalHouse = frames.some(
    (frame) =>
      (buildingModels[frame] as RegionalModel | undefined)
        ?.regionalHouse,
  );
  const urbanWealth =
    regionalHouse &&
    (context.settlement === "city" || context.settlement === "port") &&
    (context.quarter === "elite" || (context.wealth ?? 48) >= 70);
  const available = (["small", "medium", "large"] as const).filter((scale) =>
    frames.some((frame) => buildingScale(frame) === scale),
  );
  const weight = (scale: BuildingScale) =>
    buildingScaleWeight(scale, context) *
    (prehistoricCamp
      ? scale === "small"
        ? 0.1
        : scale === "medium"
          ? 4
          : 1
      : context.rural
        ? scale === "small"
          ? 1.35
          : scale === "medium"
            ? 0.85
            : 0.12
        : urbanWealth
          ? scale === "small"
            ? 0.7
            : scale === "medium"
              ? 1.25
              : 1.6
          : 1);
  const total = available.reduce(
    (sum, scale) => sum + weight(scale),
    0,
  );
  let at = roll * total;
  for (const scale of available) {
    at -= weight(scale);
    if (at <= 0) return scale;
  }
  return available.at(-1) ?? "small";
}

export function chooseBuildingFrame(
  frames: readonly string[],
  context: BuildingScaleContext,
  scaleRoll: number,
  variantRoll: number,
) {
  // A one-room hut (kitchen, store or widow's house) is a family's home only
  // on the poorest lots before modern building; elsewhere it read as a shed.
  const hut = (frame: string) =>
    (buildingModels[frame] as RegionalModel | undefined)?.goldScale === "tiny" &&
    ((context.year ?? 0) >= 1900 || (context.wealth ?? 48) >= 25);
  const homes = frames.filter((frame) => !isServiceFrame(frame) && !hut(frame));
  let candidates = homes.length ? homes : frames;
  if (context.rural) {
    const ruralHomes = candidates.filter((frame) => !isUrbanRegionalFrame(frame));
    if (ruralHomes.length) candidates = ruralHomes;
  }
  const scale = chooseBuildingScale(candidates, context, scaleRoll);
  const byScale = candidates.filter((frame) => buildingScale(frame) === scale);
  const tier = context.wealthTier ?? targetWealthTier(context.wealth);
  const exact = byScale.filter((frame) => buildingWealthTier(frame) === tier);
  const near = exact.length
    ? exact
    : byScale.filter((frame) => {
        const t = buildingWealthTier(frame);
        return t !== undefined && Math.abs(t - tier) <= 1;
      });
  const pool = near.length ? near : byScale;
  return pool[Math.min(pool.length - 1, Math.floor(variantRoll * pool.length))];
}
