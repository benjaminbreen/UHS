import { ecoregionNear } from "../geography/ecoregions";
import { koppenAt } from "../geography/climate-map";
import { highlandAltitude, iceSheetAt, terrainProvinceAt } from "../geography/landforms";
import type { WorldSetting } from "../geography/types";
import { desertColorwayFor, type Colorway, type Ecology } from "./profiles";

/** Which envelope and colourway a place on Earth gets. The RESOLVE biome map
 * decides the envelope; realm and a few latitude bands decide the colourway.
 * These are broad authored readings of a modern potential-vegetation map, not
 * dated reconstructions. Places outside the map fall back to the climate rule. */
export type RegionalEcology = { ecology: Ecology; colorway?: Colorway };

const inBox = (lon: number, lat: number, box: number[]) =>
  lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3];

export function regionalEcology(
  lon: number,
  lat: number,
  climate: WorldSetting["climate"],
  moisture?: number,
  geographic = false,
  year?: number,
): RegionalEcology {
  // Köppen EF, and the ice sheets of a glacial age.
  if (koppenAt(lon, lat) === 30 || (year !== undefined && iceSheetAt(lon, lat, year)))
    return { ecology: "tundra", colorway: "ice" };
  if (!geographic && climate === "tundra") return { ecology: "tundra", colorway: "polar" };
  // A dry climate reading wins over the map: it is what dry previews and
  // regional terrain agree on, and the biome cell may be a plateau edge.
  if (!geographic && climate === "arid")
    return { ecology: "desert", colorway: desertColorwayFor(lon, lat) };
  const region = ecoregionNear(lon, lat);
  if (region?.sourceName.toLowerCase().includes("swamp"))
    return { ecology: "wetland", colorway: "swamp" };
  const biome = region?.biome ?? 0;
  const realm = region?.realm ?? "";
  const name = region?.sourceName ?? "";
  const tropical = Math.abs(lat) < 23.5;
  const altitude = highlandAltitude(lon, lat);
  const province = terrainProvinceAt(lon, lat);
  if (province === "loess") return { ecology: "grassland", colorway: "loess" };
  // The Fens and the Somerset Levels before their seventeenth-century drainage.
  if ((year === undefined || year < 1650) && (inBox(lon, lat, [-0.5, 52.2, 0.6, 53.1]) || inBox(lon, lat, [-3.1, 51, -2.6, 51.3])))
    return { ecology: "wetland", colorway: "fen" };
  switch (biome) {
    case 1:
      return {
        ecology: "tropical-woodland",
        colorway: /montane|Yungas/.test(name) ? "cloud" : "rainforest",
      };
    case 2:
      return { ecology: "tropical-woodland", colorway: "monsoon" };
    case 3:
      // Pine-oak country: the Sierra Madre, Central America, the Himalayan
      // chir pine belt, Luzon and Sumatra.
      return { ecology: "temperate-woodland", colorway: "pine-oak" };
    case 5:
      // Redwood and Douglas fir country: the coast ranges, Cascades and Sierra.
      return {
        ecology: "temperate-woodland",
        colorway: inBox(lon, lat, [-125, 35, -117, 49]) ? "redwood" : "conifer",
      };
    case 4:
      return {
        ecology: "temperate-woodland",
        colorway:
          realm === "Nearctic"
            ? "oak-hickory"
            : realm === "Palearctic" && lon > 70
              ? "east-asian"
              : /Valdivian|Fiordland|Westland|Tasmanian temperate rain/.test(name)
                ? "temperate-rain"
                : realm === "Australasia" || realm === "Neotropic"
                  ? "southern-beech"
                  : undefined,
      };
    case 6:
      return {
        ecology: "boreal-woodland",
        colorway:
          realm === "Palearctic" && lon > 90
            ? "larch"
            : inBox(lon, lat, [-150, 45, -120, 62])
              ? "coastal"
              : undefined,
      };
    case 7:
      return {
        ecology: "savanna",
        colorway:
          realm === "Afrotropic"
            ? "acacia"
            : realm === "Neotropic"
              ? "cerrado"
              : realm === "Australasia"
                ? "eucalypt"
                : "monsoon",
      };
    case 8:
      return {
        ecology: "grassland",
        colorway:
          realm === "Nearctic"
            ? "prairie"
            : realm === "Neotropic"
              ? "pampas"
              : "steppe",
      };
    case 9:
      return {
        ecology: "wetland",
        colorway: tropical
          ? realm === "Afrotropic"
            ? "papyrus"
            : realm === "Neotropic"
              ? "pantanal"
              : "monsoon"
          : Math.abs(lat) > 50
            ? "bog"
            : Math.abs(lat) > 40
              ? "fen"
              : "marsh",
      };
    case 10:
      return {
        ecology: "grassland",
        colorway: /páramo/.test(name)
          ? "paramo"
          : /puna/.test(name)
            ? "puna"
            : /moorland/.test(name) || (realm === "Afrotropic" && altitude >= 3000)
              ? "afroalpine"
              : realm === "Palearctic" && altitude >= 3000
                ? "tibetan"
                : "montane",
      };
    case 11:
      return { ecology: "tundra", colorway: lat < 66 ? "alpine" : undefined };
    case 12:
      return {
        ecology: "dry-scrub",
        colorway:
          realm === "Nearctic"
            ? "chaparral"
            : realm === "Australasia"
              ? "mallee"
              : realm === "Afrotropic"
                ? "fynbos"
                : realm === "Neotropic"
                  ? "matorral"
                  : "maquis",
      };
    case 13:
      // The xeric biome spans true sand seas and thorny semi-desert alike.
      if ((moisture ?? 0) > 0.3 && tropical)
        return { ecology: "dry-scrub", colorway: "sahel" };
      return { ecology: "desert", colorway: desertColorwayFor(lon, lat) };
    case 14:
      return { ecology: "wetland", colorway: "mangrove" };
  }
  if (geographic && climate === "temperate" && (moisture ?? 0.6) < 0.55)
    return { ecology: "grassland", colorway: "steppe" };
  return climateEcology(lon, lat, climate);
}

/** The pre-biome rule, still used off the map and by configured worlds. */
export function climateEcology(
  lon: number,
  lat: number,
  climate: WorldSetting["climate"],
): RegionalEcology {
  switch (climate) {
    case "tundra":
      return { ecology: "tundra" };
    case "tropical":
      return { ecology: "tropical-woodland", colorway: "rainforest" };
    case "boreal":
      return { ecology: "boreal-woodland" };
    case "arid":
      return { ecology: "desert", colorway: desertColorwayFor(lon, lat) };
    case "mediterranean":
      return { ecology: "dry-scrub" };
    case "monsoon":
      return { ecology: "tropical-woodland", colorway: "monsoon" };
    default:
      return { ecology: "temperate-woodland" };
  }
}

/** Colourways that make sense for each envelope, for labs and validation. */
export const colorwaysFor: Record<Ecology, readonly Colorway[]> = {
  desert: ["highland", "sahara", "reg", "red-earth", "sonoran", "atacama", "kalahari"],
  "dry-scrub": ["maquis", "chaparral", "mallee", "fynbos", "matorral", "sahel"],
  grassland: ["prairie", "steppe", "pampas", "montane", "puna", "paramo", "tibetan", "afroalpine", "loess"],
  savanna: ["acacia", "cerrado", "eucalypt", "monsoon"],
  "temperate-woodland": ["oak-hickory", "east-asian", "southern-beech", "conifer", "redwood", "pine-oak", "temperate-rain"],
  "boreal-woodland": ["larch", "coastal"],
  "tropical-woodland": ["rainforest", "monsoon", "cloud"],
  wetland: ["marsh", "fen", "monsoon", "papyrus", "pantanal", "bog", "mangrove", "swamp"],
  tundra: ["alpine", "polar", "ice"],
};

export const colorwayLabels: Record<Colorway, string> = {
  highland: "Gravel plateau",
  sahara: "Sand sea",
  reg: "Stony desert",
  "red-earth": "Red earth",
  sonoran: "Cactus desert",
  atacama: "Fog desert",
  kalahari: "Red sand savanna edge",
  maquis: "Maquis",
  chaparral: "Chaparral",
  mallee: "Mallee",
  fynbos: "Fynbos",
  matorral: "Matorral",
  sahel: "Thorn savanna",
  prairie: "Tallgrass prairie",
  steppe: "Steppe",
  pampas: "Pampas",
  montane: "Montane meadow",
  acacia: "Acacia savanna",
  cerrado: "Cerrado",
  eucalypt: "Eucalypt savanna",
  monsoon: "Monsoon",
  "oak-hickory": "Oak and hickory",
  "east-asian": "East Asian mixed",
  "southern-beech": "Southern beech",
  conifer: "Conifer",
  redwood: "Redwood forest",
  larch: "Larch taiga",
  coastal: "Coastal rainforest",
  marsh: "Reed marsh",
  papyrus: "Papyrus swamp",
  pantanal: "Flooded savanna",
  bog: "Peat bog",
  mangrove: "Mangrove",
  swamp: "Freshwater swamp forest",
  alpine: "Alpine",
  polar: "Polar",
  "pine-oak": "Pine and oak",
  "temperate-rain": "Temperate rainforest",
  rainforest: "Rainforest",
  cloud: "Cloud forest",
  puna: "Puna",
  paramo: "Páramo",
  tibetan: "High plateau",
  afroalpine: "Afroalpine moorland",
  loess: "Loess",
  fen: "Fen",
  ice: "Ice cap",
};

/** How a colourway lays its habitat out. Multipliers on the shared noise
 * fields in `habitats.ts`: hollow frequency (wet patches), exposed ground,
 * canopy cover, and whether wet ground threads into channels. */
export type HabitatLayout = {
  wet: number;
  exposed: number;
  cover: number;
  /** Ridged drainage: wet ground forms connected braids, not blobs. */
  braided?: boolean;
  /** Banded exposure: long parallel ridges of bare ground, for dune fields. */
  banded?: boolean;
  /** Extra riparian pull: trees crowd the water and thin away from it. */
  gallery?: number;
};
const layouts: Partial<Record<Colorway, HabitatLayout>> = {
  sahara: { wet: 0.25, exposed: 1.15, cover: 0.6, banded: true },
  "red-earth": { wet: 0.5, exposed: 1.1, cover: 0.8, gallery: 0.4 },
  sonoran: { wet: 0.6, exposed: 0.9, cover: 1.25, gallery: 0.3 },
  atacama: { wet: 0.15, exposed: 1.3, cover: 0.3 },
  kalahari: { wet: 0.5, exposed: 0.8, cover: 1.1, banded: true, gallery: 0.4 },
  highland: { wet: 0.4, exposed: 1.2, cover: 0.7 },
  sahel: { wet: 0.6, exposed: 0.9, cover: 1, gallery: 0.6 },
  acacia: { wet: 0.7, exposed: 0.8, cover: 1, gallery: 0.7 },
  cerrado: { wet: 0.8, exposed: 0.7, cover: 1.15, gallery: 0.8 },
  eucalypt: { wet: 0.6, exposed: 0.9, cover: 1.05, gallery: 0.6 },
  monsoon: { wet: 1.3, exposed: 0.6, cover: 1.1, braided: true },
  papyrus: { wet: 1.5, exposed: 0.4, cover: 0.9, braided: true },
  pantanal: { wet: 1.5, exposed: 0.5, cover: 1, braided: true, gallery: 0.5 },
  marsh: { wet: 1.3, exposed: 0.5, cover: 0.9 },
  bog: { wet: 1.4, exposed: 0.7, cover: 0.8 },
  swamp: { wet: 1.65, exposed: 0.2, cover: 1.35, braided: true, gallery: 0.4 },
  mangrove: { wet: 1.6, exposed: 0.3, cover: 1.2, braided: true },
  prairie: { wet: 0.9, exposed: 0.5, cover: 0.7, gallery: 0.8 },
  steppe: { wet: 0.6, exposed: 0.9, cover: 0.5 },
  pampas: { wet: 1, exposed: 0.5, cover: 0.6, gallery: 0.6 },
  montane: { wet: 0.8, exposed: 1.3, cover: 0.6 },
  chaparral: { wet: 0.6, exposed: 1.05, cover: 1.1 },
  mallee: { wet: 0.5, exposed: 1, cover: 1.1 },
  larch: { wet: 1.1, exposed: 0.8, cover: 0.9 },
  coastal: { wet: 1.2, exposed: 0.6, cover: 1.3 },
  redwood: { wet: 1.1, exposed: 0.5, cover: 1.4 },
  alpine: { wet: 0.7, exposed: 1.4, cover: 0.5 },
  polar: { wet: 0.8, exposed: 1.3, cover: 0.3 },
  reg: { wet: 0.2, exposed: 1.45, cover: 0.35 },
  "pine-oak": { wet: 0.8, exposed: 0.9, cover: 1.05 },
  "temperate-rain": { wet: 1.3, exposed: 0.4, cover: 1.45 },
  rainforest: { wet: 1.15, exposed: 0.35, cover: 1.5 },
  cloud: { wet: 1.25, exposed: 0.6, cover: 1.25 },
  puna: { wet: 0.5, exposed: 1.35, cover: 0.35 },
  paramo: { wet: 1.25, exposed: 0.9, cover: 0.45 },
  tibetan: { wet: 0.6, exposed: 1.3, cover: 0.3 },
  afroalpine: { wet: 0.9, exposed: 1.2, cover: 0.5 },
  loess: { wet: 0.4, exposed: 1.35, cover: 0.45 },
  fen: { wet: 1.35, exposed: 0.3, cover: 0.7 },
  ice: { wet: 0.2, exposed: 1.6, cover: 0 },
};
const plain: HabitatLayout = { wet: 1, exposed: 1, cover: 1 };
export function habitatLayout(colorway?: Colorway): HabitatLayout {
  return (colorway && layouts[colorway]) || plain;
}
