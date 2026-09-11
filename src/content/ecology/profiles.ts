/** Broad ecological envelopes; species and land use remain separate choices. */
export const ecologies = [
  "grassland",
  "temperate-woodland",
  "boreal-woodland",
  "tropical-woodland",
  "wetland",
  "dry-scrub",
  "desert",
  "tundra",
] as const;
export type Ecology = (typeof ecologies)[number];
/** Desert colourways: the same envelope in a different earth. Highland is
 * the pale ochre of a dry plateau, sahara warm gold sand, red earth the
 * iron-stained soil of the American Southwest or the Australian interior. */
export const desertColorways = ["highland", "sahara", "red-earth"] as const;
export type DesertColorway = (typeof desertColorways)[number];
/** Key into the per-ecology colour tables. Only the desert has variants. */
export type PaletteKey = Ecology | "desert:sahara" | "desert:red-earth";
export function paletteKey(
  ecology: Ecology,
  colorway?: DesertColorway,
): PaletteKey {
  return ecology === "desert" && colorway && colorway !== "highland"
    ? `desert:${colorway}`
    : ecology;
}
/** Default colourway for an arid place, by where on Earth it is. */
export function desertColorwayFor(lon: number, lat: number): DesertColorway {
  const sahara =
    (lat > 10 && lat < 38 && lon > -18 && lon < 62) ||
    (lat > 20 && lat < 45 && lon > 60 && lon < 95);
  const redEarth =
    (lat > 26 && lat < 42 && lon > -125 && lon < -98) ||
    (lat > -36 && lat < -14 && lon > 112 && lon < 154);
  return redEarth ? "red-earth" : sahara ? "sahara" : "highland";
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
