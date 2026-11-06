import type { WorldSetting } from "../geography/types";
import type { Colorway } from "./profiles";
import type { Habitat, VegetationPattern } from "../../world/v3/habitats";
import type { LandSample } from "../../world/geography/landscape";
import natureAtlas from "../../render/generated/nature-atlas.json" with { type: "json" };

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
  mangrove = "nature-mangrove",
  beech = "nature-beech",
  datePalm = "nature-date-palm",
  mahogany = "nature-mahogany",
  fig = "nature-fig",
  umbrella = "nature-umbrella-tree";
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
  "nature-japanese-maple",
  "nature-ginkgo",
  "nature-cherry",
  "nature-banyan",
  "nature-plane",
  "nature-ceiba",
  "nature-yew",
  "nature-oil-palm",
  "nature-coconut-palm",
  "nature-banana",
  "nature-mango",
  beech,
  datePalm,
  mahogany,
  fig,
  umbrella,
];
type Mix = readonly (readonly [string, number])[];
const north: Mix = [
  [spruce, 7],
  [pine, 2],
  [birch, 3],
];
const temperate: Mix = [
  [oak, 4],
  [beech, 3],
  [pine, 3],
  [birch, 1],
];
// Emergents, figs and the pioneers of gaps, with the generic broadleaf as filler.
const humid: Mix = [
  [mahogany, 3],
  [fig, 2],
  [umbrella, 2],
  [tropical, 2],
  [palm, 1],
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
  sahara: [[datePalm, 1]],
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
    [beech, 1],
    [pine, 1],
  ],
  "east-asian": [
    [maple, 4],
    [oak, 3],
    [beech, 1],
    [pine, 2],
    ["nature-bamboo-clump", 1],
  ],
  "southern-beech": [
    [beech, 4],
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
    [datePalm, 4],
    [thorn, 2],
    [tropical, 2],
  ],
  pantanal: [
    [palm, 5],
    [fig, 2],
    [tropical, 2],
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
    [fig, 3],
    [umbrella, 2],
    [tropical, 2],
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
    return humid;
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
export function choose(mix: Mix, value: number): string | undefined {
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
type Form = "grass" | "bloom" | "shrub" | "scrub" | "heath" | "fern" | "reed";
const forms: Form[] = ["grass", "bloom", "shrub", "scrub", "heath", "fern", "reed"];
/** Growth forms on the ground, by ecology. The form picks a sprite and the
 * flora tables name a regional species for it, so a heath is ling in
 * Scotland and rooibos at the Cape. */
const coverMix: Record<string, Partial<Record<Form, number>>> = {
  grassland: { grass: 5, bloom: 2.5, shrub: 1, scrub: 0.5, heath: 0.5 },
  savanna: { grass: 5, scrub: 2, shrub: 1, bloom: 0.7 },
  "dry-scrub": { scrub: 4, grass: 2.5, shrub: 1, heath: 0.6, bloom: 0.6 },
  desert: { scrub: 5, grass: 1.5, bloom: 0.4 },
  "temperate-woodland": { fern: 3, shrub: 2.5, heath: 1.2, bloom: 1, grass: 1 },
  "boreal-woodland": { heath: 3, fern: 2.5, shrub: 1.5, grass: 0.5 },
  "tropical-woodland": { shrub: 3, fern: 3, grass: 1, bloom: 0.6 },
  wetland: { reed: 4, fern: 1.5, shrub: 1, bloom: 0.8, grass: 0.5 },
  tundra: { heath: 4, grass: 1.5, bloom: 1, shrub: 0.5 },
};
const community: Partial<Record<string, Partial<Record<Form, number>>>> = {
  grassland: { grass: 2, bloom: 1.5, fern: 0.3, shrub: 0.6 },
  scrub: { scrub: 2, shrub: 1.5, heath: 1.3, grass: 0.6 },
  woodland: { fern: 2, shrub: 1.5, grass: 0.3, bloom: 0.5 },
  "riparian-woodland": { fern: 2, reed: 1.5, shrub: 1.3, grass: 0.4 },
  rocky: { heath: 2, scrub: 1.5, fern: 0.2, shrub: 0.3, reed: 0 },
  barren: { scrub: 2, heath: 1.5, fern: 0, shrub: 0.2, reed: 0, bloom: 0.3 },
  shore: { scrub: 2, grass: 1.5, fern: 0, heath: 0.6, reed: 0.5 },
};
const bloomSeason: Record<string, number> = { spring: 1.6, summer: 1.2, autumn: 0.5, winter: 0.2 };
function groundCover(h: Habitat, roll: number, patch: number) {
  const ecology = h.site?.region.ecology ?? h.ecology;
  const base = coverMix[ecology] ?? coverMix.grassland;
  const local = community[h.site?.primary ?? ""] ?? {};
  const wet = h.wet,
    open = h.exposed;
  const dry = ["desert", "dry-scrub", "savanna"].includes(ecology);
  const weights = forms.map((f) => {
    let w = (base[f] ?? 0) * (local[f] ?? 1);
    if (f === "reed" || f === "fern") w *= 1 + Math.max(0, wet - 0.3) * 3;
    if (f === "grass" || f === "scrub") w *= 1 - wet * 0.5;
    if (f === "heath" || f === "scrub") w *= 1 + open;
    if (f === "fern" || f === "shrub") w *= 1 - open * 0.6;
    if (f === "bloom") w *= bloomSeason[h.season] ?? 1;
    return w;
  });
  // Most cells take the patch's form, so heather and bracken lie in drifts
  // rather than as a sprinkle of everything.
  // Smooth noise bunches round 0.5; stretched, every form gets its drifts.
  const r = (roll * 7.31) % 1 < 0.7 ? Math.min(0.999, Math.max(0, (patch - 0.5) * 2 + 0.5)) : roll;
  let pick = r * weights.reduce((a, b) => a + b, 0);
  let form: Form = "grass";
  for (let i = 0; i < forms.length; i++)
    if ((pick -= weights[i]) < 0) {
      form = forms[i];
      break;
    }
  switch (form) {
    case "grass":
      return dry || h.season === "autumn" || h.season === "winter"
        ? "nature-understory-dry-bunchgrass"
        : "ecology-grazing";
    case "bloom":
      return "flowers";
    case "shrub":
      return "nature-understory-low-leafy-shrub";
    case "scrub":
      return scrub;
    case "heath":
      return heath;
    case "fern":
      return fern;
    case "reed":
      return "nature-understory-sedge";
  }
}
export function vegetationUnderstory(
  s: WorldSetting,
  h: Habitat,
  land: LandSample,
  roll: number,
  /** 0-1, smooth across a few cells: which form a drift of ground cover takes. */
  patch = roll,
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
      case "rocky":
      case "barren":
        // Cushions and scrub in the cracks, most of the ground bare.
        return roll < 0.35 ? groundCover(h, roll / 0.35, patch) : undefined;
      case "shore":
        // A strand line of low salt-tolerant growth on the upper beach only.
        return land.water > (land.shoreWidth ?? 3) * 0.6 && roll < 0.4
          ? groundCover(h, roll / 0.4, patch)
          : undefined;
      case "woodland":
      case "riparian-woodland":
        if (roll > (h.season === "autumn" ? 0.92 : 0.975)) return "nature-understory-fungi";
        return groundCover(h, roll, patch);
      default:
        return groundCover(h, roll, patch);
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
  if (sprite === scrub) {
    const base = roll < 0.6
      ? "nature-dry-scrub-small"
      : roll < 0.9 ? "nature-dry-scrub-medium" : sprite;
    const alternate = roll < 0.6
      ? roll >= 0.3
      : roll < 0.9 ? roll >= 0.75 : roll >= 0.95;
    return alternate ? `${base}-b` : base;
  }
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
