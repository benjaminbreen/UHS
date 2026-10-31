import type { WorldSetting } from "../geography/types";
import type { Ecology } from "../ecology/profiles";

/** What the land and water around a place give. */
export type Resource = "grain" | "fish" | "salt" | "timber" | "stone" | "clay" | "ore" | "herds" | "reeds" | "oil";
/** 0 none, 1 some, 2 plenty. */
export type Endowment = Record<Resource, 0 | 1 | 2>;
/** The geography any place has, whether it is the one being played or a tile on the region map. */
export type Ground = Pick<WorldSetting, "lon" | "lat" | "year" | "climate" | "relief" | "water"> & { ecology?: Ecology };

type Specialty = {
  resource: Resource;
  /** What it is called where it is known: "tin", "cedar". */
  name: string;
  years: [number, number];
  bounds: readonly [number, number, number, number]; // west, south, east, north
  source: string;
};
/** Places famous for one thing, documented; they outrank the geography. */
const specialties: Specialty[] = [
  { resource: "ore", name: "copper", years: [-2500, 400], bounds: [32, 34.5, 34.6, 35.7], source: "Cypriot copper, the metal named for the island" },
  { resource: "ore", name: "copper", years: [-5000, -1100], bounds: [34.8, 29.6, 35.2, 30], source: "Timna copper mines, Arabah" },
  { resource: "ore", name: "silver", years: [-1000, -100], bounds: [23.8, 37.6, 24.2, 37.9], source: "Laurion silver mines, Attica" },
  { resource: "ore", name: "copper and silver", years: [-3000, 2000], bounds: [-6.8, 37.6, -6.4, 37.8], source: "Rio Tinto mines, Huelva" },
  { resource: "ore", name: "tin", years: [-2000, 1998], bounds: [-6, 49.9, -4.2, 50.8], source: "Cornish tin" },
  { resource: "ore", name: "gold", years: [-3000, -30], bounds: [32, 19, 35, 23], source: "Nubian and Eastern Desert gold, worked for Egypt" },
  { resource: "ore", name: "silver", years: [1545, 1900], bounds: [-65.9, -19.8, -65.6, -19.5], source: "Cerro Rico, Potosí" },
  { resource: "ore", name: "silver", years: [1526, 1923], bounds: [132.3, 35, 132.5, 35.2], source: "Iwami Ginzan silver mine" },
  { resource: "ore", name: "gold", years: [1601, 1989], bounds: [138.2, 37.8, 138.6, 38.3], source: "Sado gold mine" },
  { resource: "salt", name: "rock salt", years: [-1200, 2000], bounds: [13.4, 47.4, 13.8, 47.7], source: "Hallstatt salt mines" },
  { resource: "salt", name: "brine salt", years: [-500, 1922], bounds: [-2.3, 52.2, -2, 52.4], source: "Droitwich brine springs" },
  { resource: "salt", name: "rock salt", years: [1250, 1996], bounds: [19.9, 49.9, 20.2, 50.1], source: "Wieliczka salt mine" },
  { resource: "salt", name: "brine salt", years: [-250, 2000], bounds: [104.5, 29.2, 105, 29.5], source: "Zigong brine wells, Sichuan" },
  { resource: "salt", name: "rock salt", years: [1000, 1600], bounds: [-5, 23.4, -4.5, 23.8], source: "Taghaza salt slabs, carried south across the Sahara" },
  { resource: "timber", name: "cedar", years: [-3000, 600], bounds: [35.5, 33.3, 36.5, 34.6], source: "Cedars of Lebanon, shipped to Egypt and Mesopotamia" },
  { resource: "clay", name: "kaolin", years: [1004, 2000], bounds: [117, 29, 117.5, 29.5], source: "Jingdezhen porcelain clay" },
];
const inside = (g: Ground, b: Specialty["bounds"]) => g.lon >= b[0] && g.lon <= b[2] && g.lat >= b[1] && g.lat <= b[3];
export const specialtiesAt = (g: Ground) => specialties.filter((s) => g.year >= s.years[0] && g.year < s.years[1] && inside(g, s.bounds));

const WOODS: Ecology[] = ["temperate-woodland", "boreal-woodland", "tropical-woodland"];
const OPEN: Ecology[] = ["grassland", "savanna", "dry-scrub"];

/**
 * Inferred from the ground: sea and lakes fish, rivers fish and grow reeds,
 * woodland gives timber, open country herds, high relief stone and some ore.
 * Alluvial plains lack stone, as Mesopotamia did. Salt dries in sun on warm
 * coasts and is boiled from seawater on cold ones.
 */
export function endowmentFor(g: Ground): Endowment {
  const e = g.ecology, coast = g.water.startsWith("coast") || g.water === "island" || g.water === "ocean";
  const river = g.water.startsWith("river"), lake = g.water === "lake";
  const sunny = ["arid", "mediterranean", "tropical", "monsoon"].includes(g.climate);
  const out: Endowment = {
    grain: g.climate === "tundra" ? 0
      : g.climate === "arid" || e === "desert" ? (river ? 2 : 0)
      : g.climate === "boreal" || g.relief > 0.6 ? 1 : 2,
    fish: coast || lake ? 2 : river ? 1 : 0,
    salt: coast ? (sunny ? 2 : 1) : 0,
    timber: e && WOODS.includes(e) ? 2 : e === "desert" || e === "tundra" || e === "grassland" ? (g.relief > 0.5 ? 1 : 0) : 1,
    stone: g.relief >= 0.45 ? 2 : g.relief >= 0.25 ? 1 : 0,
    clay: river || lake || e === "wetland" ? 2 : 1,
    ore: g.relief >= 0.55 && g.year >= -5000 ? 1 : 0,
    herds: e && OPEN.includes(e) ? 2 : 1,
    reeds: e === "wetland" ? 2 : river || lake ? 1 : 0,
    oil: g.climate === "mediterranean" && g.year >= -4000 ? 2 : 0,
  };
  for (const s of specialtiesAt(g)) out[s.resource] = 2;
  return out;
}

/** The staple by its local name: rice in monsoon Asia, maize in the Americas. */
export function stapleName(g: Ground) {
  if (g.lon < -30) return g.year >= 1550 && g.lat > 25 ? "grain" : "maize";
  if (g.lon > 95 && g.lat < 40 && g.climate !== "arid") return "rice";
  return "grain";
}
const NAMES: Record<Resource, string> = {
  grain: "grain", fish: "fish", salt: "salt", timber: "timber", stone: "stone", clay: "clay",
  ore: "ore", herds: "livestock", reeds: "reeds", oil: "olive oil",
};
export const resourceName = (r: Resource, g: Ground) =>
  r === "grain" ? stapleName(g) : specialtiesAt(g).find((s) => s.resource === r)?.name ?? NAMES[r];

/** Before metal, ore is coloured stone; nobody brings in what they cannot use. */
const NEEDS: Resource[] = ["grain", "salt", "timber", "ore"];
/** What the place is known for, documented specialties first, and what it has to bring in. */
export function tradeOf(g: Ground, farming = true) {
  const e = endowmentFor(g), named = new Set(specialtiesAt(g).map((s) => s.resource));
  const order: Resource[] = ["grain", "fish", "oil", "salt", "timber", "herds", "ore", "stone", "reeds", "clay"];
  const known = order.filter((r) => e[r] === 2 && (r !== "clay" || named.has(r))).sort((a, b) => Number(named.has(b)) - Number(named.has(a))).slice(0, 3);
  const lacks = NEEDS.filter((r) => !e[r] && (r !== "grain" || farming) && (r !== "ore" || g.year >= -1200));
  return { known, lacks };
}

export const DIRECTIONS: Record<string, string> = {
  N: "north", NE: "northeast", E: "east", SE: "southeast", S: "south", SW: "southwest", W: "west", NW: "northwest",
};
/** The neighbouring country that has it, and the way it comes: the first
 * exit by sea, else by river or road, else over open land. */
export function sourceOf(s: WorldSetting, r: Resource) {
  const order = ["sea", "ferry", "road", "land"];
  return (s.playableMap?.exits ?? [])
    .filter((x) => x.neighbor && endowmentFor({ ...x.neighbor, year: s.year })[r])
    .sort((a, b) => order.indexOf(a.mode) - order.indexOf(b.mode))
    // A town on a river had its goods come down or up it unless they came by sea.
    .map((x) => ({
      direction: DIRECTIONS[x.bearing] ?? x.bearing.toLowerCase(),
      by: x.mode === "sea" || x.mode === "ferry" ? "by sea" : s.water.startsWith("river") ? "by river" : x.mode === "road" ? "by road" : "overland",
    }))[0];
}
