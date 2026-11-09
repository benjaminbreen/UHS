import type { WorldSetting } from "./types";

/** What the water of a place does that its ecology alone does not say: deltas
 * and their flood, the colour of the river, ice, reefs, tides and the works
 * people built on water. Region boxes are [west, south, east, north]. */
export type Waterscape = {
  /** A delta plain: the river splits into distributaries. */
  delta?: boolean;
  /** Seasonal river stage: 0 low water, 1 the full flood. */
  flood: number;
  tint?: "silt" | "loess" | "clear";
  /** Lakes and rivers bear ice; "fast" adds shore ice on the sea, "pack" floes beyond it. */
  ice?: "lakes" | "fast" | "pack";
  icebergs?: boolean;
  reef?: "fringing" | "atoll";
  /** Tidal range, 0 microtidal to 1 macrotidal. */
  tide: number;
  mangrove?: boolean;
  works?: "polder" | "chinampa" | "qanat";
};
type Box = readonly [number, number, number, number];
const inBox = ([w, s, e, n]: Box, lon: number, lat: number) =>
  lon >= w && lon <= e && lat >= s && lat <= n;
type Season = WorldSetting["season"];

// Flood stage by season for each river regime.
const nile: Record<Season, number> = { spring: 0, summer: 0.5, autumn: 1, winter: 0 };
const monsoon: Record<Season, number> = { spring: 0, summer: 1, autumn: 0.6, winter: 0 };
const snowmelt: Record<Season, number> = { spring: 1, summer: 0.3, autumn: 0, winter: 0 };

const rivers: { box: Box; delta?: Box; regime: Record<Season, number>; tint?: Waterscape["tint"] }[] = [
  // Nile valley from Aswan, and its delta below Cairo.
  { box: [29.5, 24, 33.5, 31.7], delta: [29.6, 30.1, 32.6, 31.7], regime: nile },
  // Tigris and Euphrates: the spring flood, and the marshes and Shatt al-Arab.
  { box: [43, 29.5, 48.8, 34.5], delta: [46.3, 29.8, 48.8, 31.6], regime: snowmelt, tint: "silt" },
  // Yellow River: the North China Plain and its delta.
  { box: [110, 34, 119.5, 38.3], delta: [118.2, 37.3, 119.5, 38.3], regime: monsoon, tint: "loess" },
  // Ganges–Brahmaputra and the Sundarbans.
  { box: [80, 21.4, 92, 27], delta: [87.8, 21.4, 91.2, 24], regime: monsoon, tint: "silt" },
  // Mekong, from Phnom Penh to the sea.
  { box: [104.2, 8.5, 106.9, 13], delta: [104.6, 8.5, 106.9, 11], regime: monsoon, tint: "silt" },
  // Irrawaddy.
  { box: [94, 15.6, 96.5, 22], delta: [94.2, 15.6, 96.5, 17.6], regime: monsoon, tint: "silt" },
  // Indus.
  { box: [67, 23.5, 72, 30], delta: [67, 23.5, 68.6, 25], regime: monsoon, tint: "silt" },
  // Red River (Tonkin).
  { box: [105.2, 19.8, 106.9, 21.4], delta: [105.6, 19.8, 106.9, 21], regime: monsoon, tint: "silt" },
  // Mississippi below New Orleans.
  { box: [-91.5, 28.8, -89, 30.5], delta: [-90.2, 28.8, -89, 29.8], regime: snowmelt, tint: "silt" },
  // Rhine–Meuse.
  { box: [3.8, 51.4, 6.2, 52.1], delta: [3.8, 51.4, 5.2, 52.1], regime: snowmelt },
];
const clearWater: Box[] = [
  [109.5, 24.2, 111, 25.8], // Guilin and the Li River karst
  [-90.6, 19.5, -86.6, 21.7], // Yucatán cenotes
  [14.5, 42.3, 19.5, 45.5], // Dinaric karst
  [-82.8, 28.5, -81.5, 30.5], // Florida springs
];
const icebergCoasts: Box[] = [
  [-75, 59, -15, 84], // Greenland
  [10, 76, 35, 81], // Svalbard
  [-150, 57, -134, 61.5], // Gulf of Alaska tidewater glaciers
  [-76, -56, -70, -46], // Patagonian fjords
  [-180, -85, 180, -60], // Antarctica
  [-82, 66, -60, 80], // Baffin Bay
];
// The Gulf Stream keeps Norway's and Iceland's harbours open all winter.
// The Baltic and the Gulf of Bothnia, east of 16°E below 68.5°N, still freeze.
const gulfStream = (lon: number, lat: number) => lon > -25 && lat < 71 && (lon < 16 || (lat > 68.5 && lon < 30));
const atolls: Box[] = [
  [-148.9, -23.5, -134, -14], // Tuamotu, east of high Tahiti
  [72.5, -0.8, 74, 7.2], // Maldives
  [160, 4, 173, 15], // Marshall Islands
  [172, -10, 180, 4], // Kiribati and Tuvalu
  [96.7, -12.3, 97, -11.8], // Cocos (Keeling)
  [71, 9.5, 73.8, 12.5], // Lakshadweep
];
const reefCoasts: Box[] = [
  [-90, 9, -59, 27], // Caribbean and the Bahamas
  [32, 12, 44, 29.5], // Red Sea
  [39, -27, 50, -3], // East Africa and Madagascar
  [92, -12, 160, 24], // Southeast Asia and the Coral Triangle
  [142, -25, 155, -9], // Great Barrier Reef
  [160, -25, 230, 25], // Pacific islands
  [-180, -25, -130, 25],
  [50, 5, 80, 27], // Arabian Sea islands and Gulf
];
// Large macrotidal and mesotidal coasts; the rest of the world is lower.
const macrotidal: Box[] = [
  [47.3, 28.3, 51, 30.6], // Head of the Gulf: Kuwait Bay and the Shatt al-Arab flats
  [-67.5, 44.5, -63.5, 46], // Bay of Fundy
  [-5.5, 50.8, -2.5, 51.8], // Bristol Channel
  [-3.5, 47.5, -0.8, 49.8], // Brittany and Normandy
  [121, 34, 127.5, 39], // Yellow Sea, west Korea
  [70, 20, 73.5, 22.8], // Gulf of Khambhat
  [86.5, 20, 92.5, 23], // Bengal coast and Sundarbans
  [118, -20, 130, -13], // northwest Australia
  [-52, -2, -43, 2.5], // Amazon mouth
  [-70, -54, -64, -45], // Patagonia
  [-157, 57, -149, 62], // Cook Inlet
];
const microtidal: Box[] = [
  [-6, 30, 36.5, 46], // Mediterranean
  [9, 53.5, 31, 66], // Baltic
  [-98, 18, -60, 31], // Gulf of Mexico and the Caribbean
  [27, 40.5, 42, 47.5], // Black Sea
];
const mangroveCoasts: Box[] = [
  [86.5, 20, 92.5, 23.5],
  [92, -11, 155, 23],
  [-92, 7, -60, 27],
  [-55, -5, -34, 6],
  [-18, 4, 12, 16],
  [32, -26, 60, 28],
  [66, 8, 80, 25],
];
const polders: Box = [3.3, 50.9, 7.2, 53.6];
const lakeTexcoco: Box = [-99.35, 19.15, -98.85, 19.6];
const qanatLands: Box[] = [
  [44, 25.5, 63.5, 38.5], // Iran and Iraq's eastern edge
  [88.5, 42.5, 90.5, 43.4], // Turpan
  [55.5, 21, 60, 26.5], // Oman's aflaj
  [-3, 25.5, 3.5, 31.5], // Saharan foggaras
];

export function waterscape(s: Pick<WorldSetting, "lon" | "lat" | "year" | "season" | "climate">): Waterscape {
  const { lon, lat, year, season, climate } = s;
  const out: Waterscape = { flood: 0, tide: 0.4 };
  const river = rivers.find((r) => inBox(r.box, lon, lat));
  if (river) {
    out.flood = river.regime[season];
    // The Aswan High Dam ended the Nile flood in 1970; the Low Dam began to tame it.
    if (river.regime === nile && year >= 1902) out.flood *= year >= 1970 ? 0 : 0.4;
    out.delta = !!river.delta && inBox(river.delta, lon, lat);
    out.tint = river.tint ?? (out.flood >= 0.5 ? "silt" : undefined);
  } else if (climate === "monsoon") out.flood = monsoon[season] * 0.7;
  if (clearWater.some((b) => inBox(b, lon, lat))) out.tint = "clear";
  // The Little Ice Age froze the Thames and the Dutch canals.
  const littleIceAge = year >= 1450 && year <= 1850 ? 2 : 0;
  const cold =
    (climate === "tundra" && Math.abs(lat) > 40) || climate === "boreal" || Math.abs(lat) >= 54 - littleIceAge ||
    // Continental winters: the steppe, Siberia, Manchuria, the Great Lakes and prairie.
    (Math.abs(lat) >= 42 && ((lon > 25 && lon < 135) || (lon > -105 && lon < -70)));
  if (season === "winter" && cold)
    out.ice = Math.abs(lat) >= 72 || (climate === "tundra" && Math.abs(lat) >= 64) ? "pack" : Math.abs(lat) >= 58 && !gulfStream(lon, lat) ? "fast" : "lakes";
  else if (season !== "summer" && Math.abs(lat) >= 76) out.ice = "pack";
  out.icebergs = Math.abs(lat) >= 55 && icebergCoasts.some((b) => inBox(b, lon, lat));
  if (atolls.some((b) => inBox(b, lon, lat))) out.reef = "atoll";
  else if (Math.abs(lat) < 28 && reefCoasts.some((b) => inBox(b, lon, lat)) && !out.delta) out.reef = "fringing";
  out.tide = macrotidal.some((b) => inBox(b, lon, lat))
    ? 1
    : microtidal.some((b) => inBox(b, lon, lat)) || out.reef === "atoll"
      ? 0.1
      : 0.4;
  out.mangrove = Math.abs(lat) < 27 && mangroveCoasts.some((b) => inBox(b, lon, lat));
  if (inBox(polders, lon, lat) && year >= 1100) out.works = "polder";
  else if (inBox(lakeTexcoco, lon, lat) && year >= 1150 && year < 1800) out.works = "chinampa";
  else if (qanatLands.some((b) => inBox(b, lon, lat)) && year >= -800) out.works = "qanat";
  return out;
}

/** How far from the river, in cells, the flood reaches: the valley floor to
 * the first terrace, or a monsoon river swelling within its banks. */
export const floodReach = (ws: Waterscape, floodplain: number, climate: WorldSetting["climate"]) =>
  ws.flood <= 0 ? -Infinity : ws.delta || (ws.flood >= 0.5 && climate !== "monsoon") ? floodplain + 18 * ws.flood : 2.5 * ws.flood;

/** How far the tide has come up the intertidal shelf: 0 at low water, 0.6 at
 * high, the foot of the salt marsh. A 12.42-hour tide in three steps, so the
 * shore is redrawn a few times a tide rather than every frame; low water at
 * nine on the first morning, when the game opens. */
export const tideAt = (s: Parameters<typeof waterscape>[0], clock: number) =>
  waterscape(s).tide >= 0.3 ? Math.round(1 - Math.cos(((clock - 32400) / 44712) * 2 * Math.PI)) * 0.3 : 0;
