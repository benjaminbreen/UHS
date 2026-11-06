import { terrainProvinceAt } from "./landforms";
import type { Colorway, Ecology } from "../ecology/profiles";

/** The rock a cliff face shows. Broad strokes from real geology where a coast
 * or scarp is famous for it; otherwise a guess from the climate's usual rock
 * and weathering (laterite crusts in the wet tropics, red beds in deserts). */
export type Rock =
  | "sandstone"
  | "redstone"
  | "granite"
  | "limestone"
  | "chalk"
  | "basalt"
  | "shale"
  | "laterite";

const boxes: readonly [Rock, number, number, number, number][] = [
  // [rock, west, south, east, north]
  ["sandstone", 17, -35, 27, -32], // Table Mountain and the Cape fold belt
  ["basalt", -25, 63, -13, 67], // Iceland
  ["basalt", -161, 18, -154, 23], // Hawaii
  ["basalt", 72, 16, 80, 23], // Deccan traps
  ["basalt", -121, 44, -116, 48], // Columbia plateau
  ["basalt", 36, 6, 42, 14], // Ethiopian highlands
  ["basalt", -7.5, 54.6, -5.5, 55.3], // Antrim
  ["basalt", -18.5, 27.5, -13, 29.5], // Canaries
  ["chalk", -2, 50.5, 1.5, 51.5], // the Channel downs
  ["chalk", 0, 49.3, 2, 50.5], // Normandy
  ["chalk", 12, 54, 14.5, 55.2], // Møn and Rügen
  ["granite", -6, 47, -2, 50.4], // Cornwall and Brittany
  ["granite", 8, 39, 10, 43], // Corsica and Sardinia
  ["granite", -100, 45, -60, 62], // Canadian shield
  ["granite", 5, 58, 32, 71], // Scandinavia
  ["limestone", 99, 8, 110, 26], // the karst of Guilin, Ha Long and Krabi
  ["limestone", -92, 17, -86, 22], // Yucatán
  ["limestone", -9.5, 52.8, -8.8, 53.2], // the Burren
  ["redstone", -115, 33, -105, 39], // Colorado plateau
  ["redstone", 34.5, 29, 36.5, 31], // Petra and Wadi Rum
  ["laterite", 74, 8, 77, 13], // the Malabar cliffs
];

const byColorway: Partial<Record<Colorway, Rock>> = {
  sahara: "redstone",
  "red-earth": "laterite",
  sonoran: "redstone",
  atacama: "redstone",
  kalahari: "redstone",
  maquis: "limestone",
  matorral: "limestone",
  chaparral: "granite",
  fynbos: "sandstone",
  mallee: "laterite",
  cerrado: "laterite",
  eucalypt: "sandstone",
  monsoon: "laterite",
  alpine: "granite",
  polar: "granite",
  conifer: "granite",
  larch: "granite",
};

const byEcology: Record<Ecology, Rock> = {
  grassland: "shale",
  savanna: "laterite",
  "temperate-woodland": "shale",
  "boreal-woodland": "granite",
  "tropical-woodland": "laterite",
  wetland: "shale",
  "dry-scrub": "limestone",
  desert: "redstone",
  tundra: "granite",
};

export function rockAt(
  lon: number | undefined,
  lat: number | undefined,
  ecology: Ecology,
  colorway?: Colorway,
): Rock {
  if (lon !== undefined && lat !== undefined) {
    const province = terrainProvinceAt(lon, lat);
    if (province === "karst" || province === "cenote" || province === "doline" || province === "pavement") return "limestone";
    if (province === "volcanic") return "basalt";
    if (province === "loess") return "sandstone";
    for (const [rock, w, s, e, n] of boxes)
      if (lon >= w && lon <= e && lat >= s && lat <= n) return rock;
  }
  if (lon !== undefined && lat !== undefined && lon >= -10 && lon <= 36 && lat >= 30 && lat <= 46)
    return "limestone";
  return (colorway && byColorway[colorway]) ?? byEcology[ecology];
}
