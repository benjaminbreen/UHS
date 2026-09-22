/** Broad ecological envelopes; species and land use remain separate choices. */
export const ecologies = [
  "grassland",
  "savanna",
  "temperate-woodland",
  "boreal-woodland",
  "tropical-woodland",
  "wetland",
  "dry-scrub",
  "desert",
  "tundra",
] as const;
export type Ecology = (typeof ecologies)[number];
/** Regional colourways: the same envelope in a different earth. Each names a
 * palette, soil, tree mix and habitat layout; see `variants.ts` for which
 * part of the world selects it. The first three are the original desert set. */
export const colorways = [
  "highland",
  "sahara",
  "red-earth",
  "sonoran",
  "atacama",
  "kalahari",
  "maquis",
  "chaparral",
  "mallee",
  "fynbos",
  "matorral",
  "sahel",
  "prairie",
  "steppe",
  "pampas",
  "montane",
  "acacia",
  "cerrado",
  "eucalypt",
  "monsoon",
  "oak-hickory",
  "east-asian",
  "southern-beech",
  "conifer",
  "redwood",
  "larch",
  "coastal",
  "marsh",
  "papyrus",
  "pantanal",
  "bog",
  "mangrove",
  "swamp",
  "alpine",
  "polar",
] as const;
export type Colorway = (typeof colorways)[number];
/** Kept for the desert-only callers that predate regional variants. */
export const desertColorways = ["highland", "sahara", "red-earth"] as const;
export type DesertColorway = Colorway;
/** Variant palette keys that every colour table must define. A colourway
 * missing here falls back to its envelope's palette. */
export const variantPaletteKeys = [
  "desert:sahara",
  "desert:red-earth",
  "desert:sonoran",
  "desert:atacama",
  "desert:kalahari",
  "dry-scrub:chaparral",
  "dry-scrub:mallee",
  "dry-scrub:fynbos",
  "dry-scrub:matorral",
  "dry-scrub:sahel",
  "grassland:prairie",
  "grassland:steppe",
  "grassland:pampas",
  "grassland:montane",
  "savanna:cerrado",
  "savanna:eucalypt",
  "savanna:monsoon",
  "temperate-woodland:oak-hickory",
  "temperate-woodland:east-asian",
  "temperate-woodland:southern-beech",
  "temperate-woodland:conifer",
  "temperate-woodland:redwood",
  "boreal-woodland:larch",
  "boreal-woodland:coastal",
  "tropical-woodland:monsoon",
  "wetland:monsoon",
  "wetland:papyrus",
  "wetland:pantanal",
  "wetland:bog",
  "wetland:mangrove",
  "wetland:swamp",
  "tundra:alpine",
  "tundra:polar",
] as const;
export type VariantPaletteKey = (typeof variantPaletteKeys)[number];
/** Key into the per-ecology colour tables. */
export type PaletteKey = Ecology | VariantPaletteKey;
const variantKeySet: ReadonlySet<string> = new Set(variantPaletteKeys);
export function paletteKey(ecology: Ecology, colorway?: Colorway): PaletteKey {
  const key = `${ecology}:${colorway}`;
  return colorway && variantKeySet.has(key) ? (key as PaletteKey) : ecology;
}
/** Default colourway for an arid place, by where on Earth it is. */
export function desertColorwayFor(lon: number, lat: number): Colorway {
  const sahara =
    (lat > 10 && lat < 38 && lon > -18 && lon < 62) ||
    (lat > 20 && lat < 45 && lon > 60 && lon < 95);
  const sonoran = lat > 22 && lat < 38 && lon > -118 && lon < -104;
  const redEarth =
    (lat > 26 && lat < 42 && lon > -125 && lon < -98) ||
    (lat > -36 && lat < -14 && lon > 112 && lon < 154);
  const atacama = lat > -30 && lat < -15 && lon > -75 && lon < -66;
  const kalahari = lat > -30 && lat < -16 && lon > 12 && lon < 28;
  return sonoran
    ? "sonoran"
    : redEarth
      ? "red-earth"
      : atacama
        ? "atacama"
        : kalahari
          ? "kalahari"
          : sahara
            ? "sahara"
            : "highland";
}
export const landforms = ["plain", "rolling", "ridge", "basin"] as const;
export const populations = ["none", "sparse", "settled"] as const;
export const starts = ["resident", "visitor", "wanderer", "shepherd"] as const;
export const householdForms = ["mixed", "extended", "shared"] as const;
export const ecologyProfiles: Record<
  Ecology,
  {
    label: string;
    moisture: number;
    trees: number;
    tree: string;
    surface: "grass" | "damp" | "dry" | "sand" | "snow";
    resources: readonly ("fruit" | "berries" | "wood" | "reeds" | "grazing")[];
  }
> = {
  grassland: {
    label: "Grassland",
    moisture: 0.52,
    trees: 0.08,
    tree: "oak",
    surface: "grass",
    resources: ["berries", "wood", "grazing"],
  },
  savanna: {
    label: "Savanna",
    moisture: 0.36,
    trees: 0.07,
    tree: "acacia",
    surface: "dry",
    resources: ["wood", "grazing", "berries"],
  },
  "temperate-woodland": {
    label: "Temperate woodland",
    moisture: 0.64,
    trees: 0.4,
    tree: "oak",
    surface: "grass",
    resources: ["fruit", "berries", "wood", "grazing"],
  },
  "boreal-woodland": {
    label: "Boreal woodland",
    moisture: 0.53,
    trees: 0.36,
    tree: "cypress",
    surface: "grass",
    resources: ["berries", "wood", "grazing"],
  },
  "tropical-woodland": {
    label: "Tropical woodland",
    moisture: 0.78,
    trees: 0.5,
    tree: "hackberry",
    surface: "damp",
    resources: ["fruit", "wood", "reeds"],
  },
  wetland: {
    label: "Wetland",
    moisture: 0.83,
    trees: 0.1,
    tree: "hackberry",
    surface: "damp",
    resources: ["reeds", "wood", "grazing"],
  },
  "dry-scrub": {
    label: "Dry scrubland",
    moisture: 0.31,
    trees: 0.08,
    tree: "acacia",
    surface: "dry",
    resources: ["wood", "grazing", "berries"],
  },
  desert: {
    label: "Desert",
    moisture: 0.12,
    trees: 0.015,
    tree: "acacia",
    surface: "sand",
    resources: ["wood"],
  },
  tundra: {
    label: "Tundra",
    moisture: 0.38,
    trees: 0,
    tree: "bush",
    surface: "dry",
    resources: ["berries", "grazing"],
  },
};
