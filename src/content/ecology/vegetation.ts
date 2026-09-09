import type { WorldSetting } from "../geography/types";
import type { Habitat } from "../../world/v3/habitats";
import type { LandSample } from "../../world/geography/landscape";

// Reusable visual growth forms, not exact species distributions. Regional filters
// avoid turning distinctive sagebrush and Sahel tree art into worldwide defaults.
const palm = "nature-feather-palm",
  pine = "nature-spreading-pine",
  spruce = "nature-boreal-spruce",
  birch = "nature-silver-birch",
  tropical = "nature-tropical-broadleaf",
  willow = "nature-riverside-willow",
  thorn = "nature-sahel-thorn",
  scrub = "nature-dry-thorn-scrub",
  fern = "nature-understory-woodland-fern",
  heath = "nature-understory-flowering-heath",
  sage = "nature-understory-sagebrush",
  ginger = "nature-understory-tropical-ginger";
export const natureTreeSprites = [
  "nature-bamboo-clump",
  "nature-teak",
  "nature-broadleaf-sapling",
  "nature-broadleaf-young",
  "nature-broadleaf-mature",
  "nature-broadleaf-giant",
  palm,
  pine,
  spruce,
  birch,
  tropical,
  willow,
  thorn,
];
type Mix = readonly (readonly [string, number])[];
const north: Mix = [
  [spruce, 7],
  [pine, 2],
  [birch, 3],
];
const temperate: Mix = [
  ["oak", 5],
  [pine, 4],
  [birch, 1],
];
const humid: Mix = [
  [tropical, 8],
  [palm, 2],
];
const mediterranean: Mix = [
  ["olive", 5],
  [pine, 3],
  ["oak", 2],
];
const sahel: Mix = [
  [thorn, 9],
  ["acacia", 1],
];
export function treeMix(s: WorldSetting): Mix {
  if (
    (s.vegetationRevision ?? 0) >= 4 &&
    s.environment?.ecology === "tropical-woodland"
  ) {
    // Inland South/Southeast Asian seasonal woodland: an authored growth-form mix.
    if (s.lon >= 75 && s.lon <= 110 && s.lat >= 8 && s.lat <= 28)
      return [
        ["nature-teak", 5],
        [tropical, 4],
        ["nature-bamboo-clump", 2],
        [palm, 0.3],
      ];
    return [
      [tropical, 12],
      [palm, 1],
    ];
  }
  switch (s.environment?.ecology) {
    case "tundra":
      return [];
    case "boreal-woodland":
      return north;
    case "tropical-woodland":
      return humid;
    case "desert":
      return s.lat > 0 && s.lat < 30 && s.lon > -20 && s.lon < 55 ? sahel : [];
    case "dry-scrub":
      return s.lat > 0 && s.lat < 30 && s.lon > -20 && s.lon < 55
        ? sahel
        : s.lon > -15 && s.lon < 50
          ? mediterranean
          : [
              [pine, 6],
              ["oak", 4],
            ];
    case "wetland":
      return Math.abs(s.lat) < 25 ||
        s.climate === "tropical" ||
        s.climate === "monsoon"
        ? humid
        : [
            [willow, 7],
            ["oak", 3],
          ];
    default:
      return temperate;
  }
}
function choose(mix: Mix, value: number): string | undefined {
  let target = value * mix.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [sprite, weight] of mix) {
    target -= weight;
    if (target < 0) return sprite;
  }
  return mix.at(-1)?.[0];
}
export function vegetationTree(
  s: WorldSetting,
  h: Habitat,
  land: LandSample,
  roll: number,
) {
  if (h.ecology === "tundra") return undefined;
  const fresh =
    land.kind !== "sea" &&
    land.water > (land.shoreWidth ?? 3) &&
    land.water < 20;
  if (
    fresh &&
    ["temperate-woodland", "grassland", "wetland"].includes(h.ecology) &&
    Math.abs(s.lat) >= 25 &&
    roll < 0.7
  )
    return willow;
  return choose(treeMix(s), roll);
}
export function vegetationUnderstory(
  s: WorldSetting,
  h: Habitat,
  land: LandSample,
  roll: number,
): string | undefined {
  const wet = land.kind !== "sea" && land.water < 16;
  if (
    (s.vegetationRevision ?? 0) >= 4 &&
    !land.snow &&
    land.water > (land.shoreWidth ?? 3)
  ) {
    if ((wet || h.ecology === "wetland") && roll < 0.65)
      return "nature-understory-sedge";
    if (["dry-scrub", "desert", "grassland"].includes(h.ecology) && roll < 0.6)
      return "nature-understory-dry-bunchgrass";
  }
  if (land.snow || land.water < (land.shoreWidth ?? 3)) return undefined;
  if (wet && land.moisture > 0.55 && roll < 0.4) return "reeds";
  switch (h.ecology) {
    case "tropical-woodland":
      return h.wet > 0.22 || h.cover > 0.35
        ? s.lon >= 60 &&
          s.lon <= 155 &&
          Math.abs(s.lat) < 32 &&
          roll < ((s.vegetationRevision ?? 0) >= 4 ? 0.08 : 0.5)
          ? ginger
          : fern
        : "ecology-grazing";
    case "boreal-woodland":
      return h.wet > 0.35 || h.kind === "woodland" ? fern : heath;
    case "temperate-woodland":
      return h.wet > 0.35 || h.kind === "woodland"
        ? fern
        : roll < 0.65
          ? heath
          : "flowers";
    case "wetland":
      return wet || h.wet > 0.45 ? "reeds" : fern;
    case "tundra":
      return heath;
    case "dry-scrub":
    case "desert":
      return s.lon > -130 && s.lon < -100 && s.lat > 28 && s.lat < 55
        ? sage
        : scrub;
    case "grassland":
      if (
        s.lon > -130 &&
        s.lon < -100 &&
        s.lat > 28 &&
        s.lat < 55 &&
        h.wet < 0.3
      )
        return sage;
      return h.wet > 0.4 ? fern : roll < 0.7 ? "ecology-grazing" : "flowers";
  }
}

/** Size variety changes the silhouette, never the native pixel scale. */
export function understorySize(sprite: string, roll: number): string {
  if (sprite === scrub)
    return roll < 0.6
      ? "nature-dry-scrub-small"
      : roll < 0.9
        ? "nature-dry-scrub-medium"
        : sprite;
  if (sprite === heath)
    return roll < 0.8 ? "nature-understory-low-heath" : sprite;
  if (sprite === fern || sprite === "bush")
    return roll < 0.65 ? "nature-understory-low-leafy-shrub" : sprite;
  return sprite;
}
