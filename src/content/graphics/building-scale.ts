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
};

export function buildingScale(frame: string): BuildingScale {
  return (
    (buildingModels[frame] as { goldScale?: BuildingScale } | undefined)
      ?.goldScale ?? "small"
  );
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
  const available = (["small", "medium", "large"] as const).filter((scale) =>
    frames.some((frame) => buildingScale(frame) === scale),
  );
  const total = available.reduce(
    (sum, scale) => sum + buildingScaleWeight(scale, context),
    0,
  );
  let at = roll * total;
  for (const scale of available) {
    at -= buildingScaleWeight(scale, context);
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
  const scale = chooseBuildingScale(frames, context, scaleRoll);
  const pool = frames.filter((frame) => buildingScale(frame) === scale);
  return pool[Math.min(pool.length - 1, Math.floor(variantRoll * pool.length))];
}
