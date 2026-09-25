import type { WorldSetting } from "../geography/types";
import type { Colorway } from "./profiles";
import type { Habitat, VegetationPattern } from "../../world/v3/habitats";
import type { LandSample } from "../../world/geography/landscape";
import natureAtlas from "../../../public/nature/atlas.json" with { type: "json" };

export function vegetationPattern(
  s: WorldSetting,
  land: LandSample,
): VegetationPattern | undefined {
  if ((s.vegetationRevision ?? 0) < 6) return undefined;
  if (s.environment?.vegetation) return s.environment.vegetation;
  const ecology = s.environment?.ecology;
  const colorway = s.environment?.colorway;
  if (ecology === "savanna") return "savanna";
  if (colorway === "steppe" || colorway === "montane") return "steppe";
  // A local high-mountain proxy, not a measured global treeline.
  if (s.relief > 0.7 && land.elevation / (land.summit ?? 126) > 0.7)
    return "alpine";
  if (ecology === "desert" || ecology === "tundra" || ecology === "wetland")
    return undefined;
  if (Math.abs(s.lat) < 30 && land.moisture < 0.6) return "savanna";
  if (
    Math.abs(s.lat) >= 30 &&
    land.moisture < 0.48 &&
    ecology !== "boreal-woodland"
  )
    return "steppe";
  return undefined;
}

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
  ginger = "nature-understory-tropical-ginger",
  eucalyptus = "nature-eucalyptus",
  baobab = "nature-baobab",
  saguaro = "nature-saguaro",
  quiver = "nature-quiver-tree",
  candelabra = "nature-candelabra-spurge",
  larch = "nature-larch",
  juniper = "nature-juniper",
  maple = "nature-maple",
  oak = "nature-oak",
  olive = "nature-olive",
  acacia = "nature-acacia",
  redwood = "nature-redwood",
  fir = "nature-douglas-fir",
  cedar = "nature-cedar",
  cypress = "nature-cypress",
  mangrove = "nature-mangrove";
export const natureTreeSprites = [
  oak,
  olive,
  acacia,
  redwood,
  fir,
  cedar,
  cypress,
  eucalyptus,
  baobab,
  saguaro,
  quiver,
  candelabra,
  larch,
  juniper,
  maple,
  mangrove,
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
  [oak, 5],
  [pine, 4],
  [birch, 1],
];
const humid: Mix = [
  [tropical, 8],
  [palm, 2],
];
const mediterranean: Mix = [
  [olive, 5],
  [pine, 3],
  [oak, 2],
];
const sahel: Mix = [
  [thorn, 9],
  [acacia, 1],
  [candelabra, 0.5],
];
// Colourway mixes take precedence over the latitude and longitude boxes below.
const regional: Partial<Record<Colorway, Mix>> = {
  sahara: [[palm, 1]],
  "red-earth": [
    [eucalyptus, 2],
    [scrub, 3],
  ],
  sonoran: [
    [saguaro, 6],
    [scrub, 3],
    [juniper, 1],
  ],
  atacama: [[scrub, 1]],
  kalahari: [
    [thorn, 6],
    [quiver, 2],
    [baobab, 1],
  ],
  highland: [
    [juniper, 3],
    [scrub, 4],
  ],
  maquis: [
    [olive, 4],
    [pine, 2],
    [oak, 2],
    [cypress, 1],
    [cedar, 1],
  ],
  chaparral: [
    [oak, 4],
    [juniper, 3],
    [pine, 2],
  ],
  mallee: [
    [eucalyptus, 8],
    [scrub, 2],
  ],
  fynbos: [
    [scrub, 6],
    [juniper, 1],
  ],
  matorral: [
    [oak, 3],
    [juniper, 2],
    [scrub, 2],
    [olive, 1],
    [cypress, 1],
  ],
  sahel: [
    [thorn, 8],
    [baobab, 1],
    [acacia, 1],
  ],
  prairie: [
    [oak, 5],
    [maple, 3],
    [willow, 2],
  ],
  steppe: [
    [juniper, 3],
    [birch, 2],
    [oak, 1],
  ],
  pampas: [
    [willow, 4],
    [oak, 3],
    [juniper, 1],
  ],
  montane: [
    [juniper, 4],
    [pine, 3],
    [birch, 2],
  ],
  acacia: [
    [thorn, 7],
    [acacia, 2],
    [baobab, 1],
    [candelabra, 1],
  ],
  cerrado: [
    [tropical, 4],
    [thorn, 3],
    [palm, 2],
  ],
  eucalypt: [
    [eucalyptus, 8],
    [thorn, 1],
  ],
  "oak-hickory": [
    [oak, 5],
    [maple, 4],
    [pine, 1],
  ],
  "east-asian": [
    [maple, 4],
    [oak, 3],
    [pine, 2],
    ["nature-bamboo-clump", 1],
  ],
  "southern-beech": [
    [oak, 4],
    [eucalyptus, 3],
    [pine, 2],
  ],
  conifer: [
    [pine, 6],
    [spruce, 3],
    [birch, 1],
  ],
  redwood: [
    [redwood, 5],
    [fir, 4],
    [pine, 1],
  ],
  larch: [
    [larch, 7],
    [birch, 2],
    [spruce, 1],
  ],
  coastal: [
    [spruce, 5],
    [fir, 3],
    [pine, 1],
    [birch, 1],
  ],
  marsh: [
    [willow, 7],
    [oak, 3],
  ],
  papyrus: [
    [palm, 4],
    [thorn, 2],
    [tropical, 2],
  ],
  pantanal: [
    [palm, 5],
    [tropical, 4],
  ],
  bog: [
    [spruce, 5],
    [birch, 4],
    [larch, 1],
  ],
  mangrove: [
    [mangrove, 9],
    [palm, 1],
  ],
  swamp: [
    [tropical, 7],
    [palm, 3],
  ],
};
export function treeMix(s: WorldSetting): Mix {
  const colorway = s.environment?.colorway;
  if (
    colorway &&
    (s.vegetationRevision ?? 0) >= 6 &&
    s.environment?.ecology !== "tropical-woodland"
  ) {
    const mix = regional[colorway];
    if (mix) return mix;
  }
  if (colorway === "monsoon" && s.environment?.ecology === "tropical-woodland")
    return [
      ["nature-teak", 5],
      [tropical, 3],
      ["nature-bamboo-clump", 1],
      [thorn, 1],
    ];
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
      if (s.lat > 0 && s.lat < 30 && s.lon > -20 && s.lon < 55) return sahel;
      // The saguaro's own range: the Sonoran Desert and nowhere else.
      if (s.lon > -116 && s.lon < -108 && s.lat > 26 && s.lat < 35)
        return [[saguaro, 1]];
      if (s.lon > 12 && s.lon < 22 && s.lat > -32 && s.lat < -18)
        return [[quiver, 1]];
      return [];
    case "dry-scrub":
      return s.lat > 0 && s.lat < 30 && s.lon > -20 && s.lon < 55
        ? sahel
        : s.lon > -15 && s.lon < 50
          ? mediterranean
          : [
              [pine, 6],
              [oak, 4],
            ];
    case "savanna":
      return sahel;
    case "wetland":
      return Math.abs(s.lat) < 25 ||
        s.climate === "tropical" ||
        s.climate === "monsoon"
        ? humid
        : [
            [willow, 7],
            [oak, 3],
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
  if (h.ecology === "tundra" || h.vegetation === "alpine") return undefined;
  if (h.vegetation === "savanna") {
    const mix = h.colorway && regional[h.colorway];
    if (mix) return choose(mix, roll);
    return Math.abs(s.lat) < 30 && s.lon > -20 && s.lon < 55
      ? choose(sahel, roll)
      : choose([[tropical, 1]], roll);
  }
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
  return choose(
    treeMix(
      land.drainage
        ? {
            ...s,
            environment: {
              ...s.environment!,
              ecology: h.ecology,
              colorway: h.colorway,
            },
          }
        : s,
    ),
    roll,
  );
}
export function vegetationUnderstory(
  s: WorldSetting,
  h: Habitat,
  land: LandSample,
  roll: number,
): string | undefined {
  if (h.site) {
    if (land.snow || h.site.primary === "water") return undefined;
    switch (h.site.primary) {
      case "marsh":
        return roll < 0.7 ? "reeds" : "nature-understory-sedge";
      case "swamp":
        return roll < 0.5 ? "nature-understory-sedge" : fern;
      case "bog":
        return roll < 0.6 ? "nature-understory-sedge" : heath;
      case "scrub":
        return roll < 0.65 ? scrub : "nature-understory-dry-bunchgrass";
      case "grassland": {
        // Dry bunchgrass belongs to dry country and the dead season; a moist
        // meadow in leaf carries flowers and low shrubs instead.
        const moist = [
          "temperate-woodland",
          "boreal-woodland",
          "tropical-woodland",
          "wetland",
        ].includes(h.site.region.ecology);
        if (!moist || h.season === "autumn" || h.season === "winter")
          return roll < 0.8 ? "nature-understory-dry-bunchgrass" : "flowers";
        return roll < 0.55
          ? "flowers"
          : roll < 0.8
            ? "nature-understory-low-leafy-shrub"
            : fern;
      }
      case "rocky":
      case "barren":
      case "shore":
        return undefined;
      case "woodland":
      case "riparian-woodland":
        break;
    }
  }
  const wet = land.kind !== "sea" && land.water < 16;
  if (h.vegetation && !land.snow && land.water > (land.shoreWidth ?? 3)) {
    if (h.vegetation === "alpine")
      return roll < 0.8 ? "nature-understory-low-heath" : "flowers";
    if (wet && roll < 0.6) return "nature-understory-sedge";
    return roll < 0.85 ? "nature-understory-dry-bunchgrass" : scrub;
  }
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
  // The mycelium is always there; it fruits mostly in autumn. Lichen is year-round.
  const fruiting =
    h.ecology === "tundra"
      ? 0.15
      : h.ecology.endsWith("woodland")
        ? h.season === "autumn"
          ? 0.1
          : 0.03
        : h.ecology === "grassland"
          ? h.season === "autumn"
            ? 0.03
            : 0.008
          : 0;
  if (roll > 1 - fruiting) return "nature-understory-fungi";
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
    case "savanna":
      return h.wet > 0.5
        ? "nature-understory-sedge"
        : roll < 0.75
          ? "nature-understory-dry-bunchgrass"
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

/** What a tool can do to a plant. Rocks and water features take no edge. */
export type PlantClass =
  | "none"
  | "grass"
  | "shrub"
  | "small"
  | "medium"
  | "large";
const worked = new Set([
  "nature-stump",
  "nature-logs",
  "nature-furrow",
  "nature-stubble",
  "nature-cut-stems",
  "nature-cut-thorns",
]);
const lowPlants = new Set([
  "flowers",
  "grass",
  "reeds",
  "ecology-grazing",
  "nature-understory-dry-bunchgrass",
  "nature-understory-sedge",
  "nature-understory-low-heath",
  "nature-understory-fungi",
]);
const frameHeight = (sprite: string) =>
  (natureAtlas.frames as Record<string, { frame: { h: number } }>)[sprite]
    ?.frame.h;
export function plantClass(sprite: string | undefined): PlantClass {
  if (!sprite) return "none";
  if (sprite === "rock" || sprite.startsWith("nature-rock")) return "none";
  // Worked ground is not a plant: an axe has no business with a furrow.
  if (worked.has(sprite) || sprite === "nature-waterfall") return "none";
  if (lowPlants.has(sprite) || sprite.startsWith("ecology-")) return "grass";
  // Understory and scrub are brush whatever their silhouette: one cut takes
  // any of them off at the root.
  if (sprite.includes("understory") || sprite.includes("scrub")) return "shrub";
  const h = frameHeight(sprite);
  // Pack art outside the nature atlas is a plain tree; treat it as mid-sized.
  if (h === undefined) return sprite === "bush" ? "shrub" : "medium";
  if (h <= 44) return "shrub";
  if (h <= 64) return "small";
  if (h <= 96) return "medium";
  return "large";
}
/** Axe blows to fell a plant. Zero where an axe is the wrong tool. */
export function fellingSwings(sprite: string | undefined): number {
  return { none: 0, grass: 0, shrub: 1, small: 3, medium: 6, large: 9 }[
    plantClass(sprite)
  ];
}
