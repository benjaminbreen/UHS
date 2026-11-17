import type { WorldSetting } from "../geography/types";
import type { LandUse } from "./zoning";
import { buildingModels } from "../graphics/models";

/** Twentieth-century street looks drawn by scripts/art/front_modern.py and
 * front_modern_world.py, with
 * the year each became ordinary and the blocks that build it. An `accent` is a
 * one-off (a bank, a picture palace) that stands in another look's block
 * rather than filling one. Frames are `mod-<look>-<n>-urban-<form>`. */
const LOOKS = {
  falsefront: { since: 1900, uses: ["commercial"] },
  brick: { since: 1900, uses: ["commercial", "downtown"] },
  diner: { since: 1930, uses: ["commercial"], accent: true },
  motel: { since: 1940, uses: ["commercial"], accent: true },
  bank: { since: 1955, uses: ["downtown", "commercial"], accent: true },
  strip: { since: 1960, uses: ["commercial"] },
  office: { since: 1955, uses: ["downtown"] },
  deco: { since: 1923, uses: ["downtown", "commercial"] },
  vysotka: { since: 1952, uses: ["downtown", "commercial"], accent: true },
  bubble: { since: 1974, uses: ["downtown", "commercial"] },
  theatre: { since: 1915, uses: ["downtown", "commercial"], accent: true },
  moderno: { since: 1940, uses: ["commercial", "downtown", "tenement"] },
  zakkyo: { since: 1960, uses: ["commercial", "downtown", "tenement"] },
  stalinka: { since: 1935, uses: ["downtown", "commercial", "tenement"] },
  panelka: { since: 1960, uses: ["tenement", "estate", "commercial"] },
  tehran: { since: 1935, uses: ["commercial", "downtown", "tenement"] },
  delhi: { since: 1930, uses: ["commercial", "downtown", "tenement", "informal"] },
  veranda: { since: 1890, uses: ["commercial", "downtown"] },
  bokaap: { since: 1900, uses: ["tenement", "rowhouse"] },
  "brick-mx": { since: 1920, uses: ["commercial"] },
  "brick-cn": { since: 1900, uses: ["commercial", "downtown"] },
  "strip-mx": { since: 1965, uses: ["commercial"] },
  "strip-asia": { since: 1975, uses: ["commercial"] },
  cairo: { since: 1945, uses: ["commercial", "downtown", "tenement"] },
  tonglau: { since: 1920, uses: ["commercial", "downtown", "tenement"] },
  highstreet: { since: 1900, uses: ["commercial", "downtown"] },
  storey: { since: 1950, uses: ["commercial", "downtown", "tenement"] },
  habana: { since: 1900, uses: ["commercial", "downtown", "tenement"] },
  mission: { since: 1915, uses: ["commercial"] },
  walkup: { since: 1890, uses: ["tenement", "rowhouse"] },
  gas: { since: 1925, uses: ["commercial"], accent: true },
  drivein: { since: 1950, uses: ["commercial"], accent: true },
  market: { since: 1950, uses: ["commercial"], accent: true },
} satisfies Record<string, { since: number; uses: LandUse[]; accent?: boolean }>;
export type StreetLook = keyof typeof LOOKS;

type Mix = Partial<Record<StreetLook, number>>;
type At = readonly (readonly [lon: number, lat: number])[];

/** Where a look is the local builders' own, fading with distance (`km` is
 * where it falls to about a third). A town far from every home keeps the
 * older modern kit. `w` weighs a home against its neighbours. */
const HOMES: { looks: Mix; at: At; km: number; w?: number; from?: number }[] = [
  {
    looks: { brick: 3, strip: 2, diner: 0.5, motel: 0.6, bank: 1, office: 1, theatre: 0.6, gas: 0.6, drivein: 0.3, market: 0.5 },
    at: [[-98, 39], [-82, 37], [-119, 38], [-90, 32], [-112, 45], [-81.4, 28.5], [-84.4, 33.7]],
    km: 1300,
  },
  // Canada built the same Main Street, a little less of the roadside.
  { looks: { brick: 3, strip: 1, bank: 1, office: 1, theatre: 1, gas: 0.5, market: 0.4 }, at: [[-79.4, 43.7], [-73.6, 45.5], [-114, 51], [-123, 49.3]], km: 700 },
  // Tenements and brownstones of the old Northeast and Midwest.
  { looks: { walkup: 1 }, at: [[-74, 40.7], [-71.06, 42.36], [-75.16, 39.95], [-76.6, 39.3], [-87.65, 41.88], [-79.99, 40.44]], km: 450, w: 0.5 },
  // The setback towers the 1916 zoning law shaped, in the downtowns of the big cities that built them.
  { looks: { deco: 1 }, at: [[-74, 40.71], [-87.63, 41.88], [-83.05, 42.33], [-75.16, 39.95], [-79.99, 40.44], [-81.69, 41.5], [-90.2, 38.63]], km: 160, w: 0.6, from: 1923 },
  // Spanish Colonial Revival, California's own; Florida's Mediterranean.
  { looks: { mission: 1 }, at: [[-118.24, 34.05], [-119.7, 34.42], [-117.16, 32.72], [-122.03, 36.97], [-121.9, 37.3]], km: 350, w: 0.35, from: 1915 },
  { looks: { mission: 1 }, at: [[-80.2, 25.8], [-112.07, 33.45]], km: 250, w: 0.15, from: 1920 },
  { looks: { falsefront: 1 }, at: [[-106, 42], [-113, 44], [-103, 47], [-112, 36]], km: 600, w: 0.08 },
  { looks: { moderno: 1 }, at: [[-99.1, 19.4], [-103.3, 20.7], [-100.3, 25.7], [-89.6, 21]], km: 700 },
  { looks: { moderno: 1 }, at: [[-74.1, 4.7], [-66.9, 10.5], [-77, -12], [-58.4, -34.6], [-70.6, -33.4], [-79.5, 9]], km: 900 },
  { looks: { cairo: 1 }, at: [[31.24, 30.04], [29.92, 31.2], [35.5, 33.89], [36.29, 33.51], [35.93, 31.95], [13.19, 32.89], [32.53, 15.59]], km: 700 },
  { looks: { cairo: 1 }, at: [[44.37, 33.31], [46.68, 24.71], [-7.6, 33.57], [3.06, 36.75], [10.18, 36.81]], km: 600, w: 0.5 },
  { looks: { tonglau: 1 }, at: [[114.17, 22.3], [113.26, 23.13], [113.54, 22.2], [121.47, 31.23], [103.85, 1.29], [100.33, 5.41], [100.5, 13.75], [106.7, 10.78]], km: 650 },
  { looks: { highstreet: 1 }, at: [[-0.12, 51.5], [-2.6, 51.45], [-1.9, 52.48], [-2.24, 53.48], [-1.55, 53.8], [-1.6, 54.97], [-4.25, 55.86], [-3.19, 55.95], [-3.18, 51.48], [-5.93, 54.6], [-6.26, 53.35]], km: 180 },
  { looks: { storey: 1 }, at: [[3.38, 6.45], [-0.19, 5.6], [3.9, 7.38], [-1.62, 6.69], [8.52, 12], [-13.23, 8.48], [-4.01, 5.35], [9.7, 4.05]], km: 900 },
  { looks: { storey: 1 }, at: [[36.82, -1.29], [39.28, -6.8], [32.58, 0.35], [15.3, -4.32]], km: 900, w: 0.5 },
  { looks: { habana: 1 }, at: [[-82.37, 23.13], [-75.82, 20.02], [-66.1, 18.47], [-69.9, 18.48], [-75.5, 10.4]], km: 500 },
  { looks: { zakkyo: 1 }, at: [[139.7, 35.7], [135.5, 34.7], [130.4, 33.6], [141.3, 43.1]], km: 600, from: 1955 },
  // The office towers of Shinjuku, Marunouchi and Umeda, after the height limit went in 1963.
  { looks: { bubble: 1 }, at: [[139.7, 35.69], [135.5, 34.7], [136.9, 35.17]], km: 120, w: 0.25, from: 1974 },
  // Stalin's high-rises: the seven in Moscow, and the gifts to Warsaw and Riga.
  { looks: { vysotka: 1 }, at: [[37.62, 55.75], [21.01, 52.23], [24.11, 56.95]], km: 80, w: 0.06, from: 1952 },
  { looks: { stalinka: 1, panelka: 1 }, at: [[37.6, 55.8], [30.3, 59.9], [30.5, 50.4], [27.6, 53.9], [44.5, 48.7], [82.9, 55], [69.2, 41.3], [76.9, 43.2], [49.1, 55.8], [104.3, 52.3], [131.9, 43.1]], km: 650, from: 1930 },
  { looks: { tehran: 1 }, at: [[51.4, 35.7], [51.7, 32.7], [59.6, 36.3], [46.3, 38.1], [52.5, 29.6]], km: 700 },
  { looks: { delhi: 1 }, at: [[77.2, 28.6], [72.9, 19.1], [88.4, 22.6], [80.3, 13.1], [74.3, 31.5], [67, 24.9], [90.4, 23.8], [78.5, 17.4]], km: 900 },
  { looks: { veranda: 2, bokaap: 1 }, at: [[18.4, -33.9]], km: 250 },
  { looks: { veranda: 2, brick: 1 }, at: [[28, -26.2], [31, -29.9], [25.6, -33.9], [28.2, -25.7]], km: 700 },
  { looks: { veranda: 2, brick: 1, strip: 1, bank: 1, office: 1 }, at: [[151.2, -33.9], [153, -27.5], [145, -37.8], [115.9, -32], [138.6, -34.9]], km: 900 },
  { looks: { veranda: 1, brick: 2, strip: 1, office: 1 }, at: [[174.8, -36.8], [172.6, -43.5]], km: 600 },
];

/** Who moved in and opened shops, as a share of a town's blocks by year
 * (linear between the points). A share is taken out of whatever the local
 * mix was, so it can stand on a town with no home of its own. */
const INFLUENCES: { looks: Mix; at: At; km: number; share: [year: number, share: number][] }[] = [
  {
    looks: { "strip-mx": 3, "brick-mx": 2, moderno: 1 },
    at: [[-118.2, 34], [-98.5, 29.4], [-106.5, 31.8], [-112, 33.4], [-95.4, 29.8], [-117.1, 32.7], [-119.8, 36.7], [-121.9, 37.3]],
    km: 500,
    share: [[1910, 0.05], [1945, 0.08], [1970, 0.15], [1990, 0.22]],
  },
  { looks: { "strip-mx": 2, "brick-mx": 1 }, at: [[-87.7, 41.9], [-104.9, 39.7], [-122.7, 45.5]], km: 300, share: [[1960, 0.02], [1990, 0.08]] },
  { looks: { "brick-cn": 1 }, at: [[-122.4, 37.8], [-74, 40.7], [-123.1, 49.3], [-118.2, 34.1], [-157.9, 21.3], [-77, -12], [-87.6, 41.9]], km: 120, share: [[1880, 0.08], [1990, 0.06]] },
  { looks: { "brick-cn": 1 }, at: [[-121, 38.5], [151.2, -33.9], [145, -37.8]], km: 500, share: [[1880, 0.01], [1990, 0.01]] },
  {
    looks: { "strip-asia": 1 },
    at: [[-118, 33.9], [-122, 37.4], [-95.6, 29.7], [-122.3, 47.6], [-117.2, 32.8], [-77.2, 38.9], [-79.4, 43.7], [-123.1, 49.3]],
    km: 400,
    share: [[1972, 0], [1980, 0.03], [1990, 0.05]],
  },
  { looks: { zakkyo: 1 }, at: [[121.5, 25], [126.98, 37.57], [120.3, 22.6], [129, 35.1]], km: 400, share: [[1960, 0], [1975, 0.25], [1990, 0.35]] },
  { looks: { panelka: 3, stalinka: 1 }, at: [[21, 52.2], [14.4, 50.1], [19, 47.5], [13.4, 52.5], [26.1, 44.4], [23.3, 42.7], [17.1, 48.1], [20.5, 44.8]], km: 500, share: [[1950, 0.1], [1970, 0.3], [1990, 0.35]] },
  { looks: { delhi: 1 }, at: [[31, -29.9], [39.3, -6.8], [36.8, -1.3], [55.3, 25.3], [103.8, 1.35], [101.7, 3.1]], km: 300, share: [[1900, 0.1], [1990, 0.15]] },
  { looks: { tehran: 1 }, at: [[44.4, 33.3], [69.2, 34.5], [55.3, 25.3]], km: 600, share: [[1950, 0.1], [1990, 0.2]] },
  { looks: { habana: 1 }, at: [[-80.2, 25.77]], km: 120, share: [[1960, 0.04], [1975, 0.2], [1990, 0.28]] },
  { looks: { habana: 1 }, at: [[-73.94, 40.8]], km: 60, share: [[1950, 0.03], [1975, 0.08]] },
  { looks: { highstreet: 1 }, at: [[151.2, -33.9], [145, -37.8], [174.8, -36.8], [18.4, -33.9], [-79.4, 43.7]], km: 400, share: [[1900, 0.12], [1990, 0.06]] },
];

const KM_PER_DEGREE = 111.2;
function km(s: { lon: number; lat: number }, [lon, lat]: At[number]) {
  const dx = (s.lon - lon) * Math.cos(((s.lat + lat) / 2) * (Math.PI / 180));
  return Math.hypot(dx, s.lat - lat) * KM_PER_DEGREE;
}
const reach = (s: { lon: number; lat: number }, at: At, range: number) =>
  Math.max(...at.map((p) => Math.exp(-((km(s, p) / range) ** 2))));

function curve(points: [number, number][], year: number) {
  if (year < points[0][0]) return 0;
  for (let i = 1; i < points.length; i++) {
    const [y1, v1] = points[i];
    const [y0, v0] = points[i - 1];
    if (year <= y1) return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
  }
  return points[points.length - 1][1];
}

/** Adds `share` across the looks already built by `year` (and that build
 * `use`, if given); 0 if none were. */
function spread(into: Mix, looks: Mix, share: number, year: number, use?: LandUse) {
  const open = (Object.keys(looks) as StreetLook[]).filter(
    (l) => LOOKS[l].since <= year && (!use || (LOOKS[l].uses as readonly LandUse[]).includes(use)),
  );
  const total = open.reduce((t, l) => t + looks[l]!, 0);
  for (const l of open) into[l] = (into[l] ?? 0) + (share * looks[l]!) / total;
  return open.length ? share : 0;
}

/** Each look's share of a town's blocks, or of its blocks of one use. What
 * is left of 1 keeps the older modern kit. */
export function streetMix(s: Pick<WorldSetting, "lon" | "lat" | "year">, use?: LandUse): Mix {
  let held = 0;
  const homes: Mix = {};
  for (const h of HOMES) {
    if (s.year < (h.from ?? 0)) continue;
    const r = reach(s, h.at, h.km);
    if (r < 0.02) continue;
    // Sharpened so the nearest home leads, while a town halfway between two
    // takes both.
    if (spread(homes, h.looks, (h.w ?? 1) * r ** 4, s.year, use)) held = Math.max(held, r);
  }
  const mix: Mix = {};
  let incoming = 0;
  for (const f of INFLUENCES) {
    const share = curve(f.share, s.year) * reach(s, f.at, f.km);
    if (share >= 0.003) incoming += spread(mix, f.looks, share, s.year, use);
  }
  if (incoming > 0.6)
    for (const l of Object.keys(mix) as StreetLook[]) mix[l]! *= 0.6 / incoming;
  const local = (1 - Math.min(incoming, 0.6)) * held;
  const total = Object.values(homes).reduce((t, v) => t + v, 0);
  for (const l of Object.keys(homes) as StreetLook[])
    mix[l] = (mix[l] ?? 0) + (local * homes[l]!) / total;
  for (const l of Object.keys(mix) as StreetLook[]) if (mix[l]! < 0.004) delete mix[l];
  return mix;
}

type Shares = { look: StreetLook; share: number }[];

/** The looks blocks of this use are built in, largest share first, and the
 * one-offs set among them. The one-offs' share goes to the blocks they
 * stand in, so block shares still sum to the town's whole mix. */
export function streetLooks(
  s: Pick<WorldSetting, "lon" | "lat" | "year">,
  use: LandUse,
): { blocks: Shares; accents: Shares } {
  const mix = streetMix(s, use);
  const all = Object.values(mix).reduce((t, v) => t + v, 0);
  const fit = (Object.keys(mix) as StreetLook[]).filter((l) => streetFrames(l).length);
  const accent = (l: StreetLook) => "accent" in LOOKS[l];
  const kept = fit.filter((l) => !accent(l)).reduce((t, l) => t + mix[l]!, 0);
  const shares = (looks: StreetLook[], scale: number) =>
    looks.map((look) => ({ look, share: mix[look]! * scale })).sort((a, b) => b.share - a.share);
  if (!kept) return { blocks: [], accents: [] };
  return {
    blocks: shares(fit.filter((l) => !accent(l)), all / kept),
    accents: shares(fit.filter(accent), 1),
  };
}

const frameCache = new Map<StreetLook, string[]>();
/** Every street form of a look's colourings. */
export function streetFrames(look: StreetLook): string[] {
  let frames = frameCache.get(look);
  if (!frames) {
    const pattern = new RegExp(`^mod-${look}-\\d+-urban-[a-z]+$`);
    frames = Object.keys(buildingModels).filter((f) => pattern.test(f));
    frameCache.set(look, frames);
  }
  return frames;
}
