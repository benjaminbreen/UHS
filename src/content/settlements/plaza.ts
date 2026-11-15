import props from "../graphics/props.json" with { type: "json" };
import type { Pack } from "../../core/types";
import { modernity } from "./modernity";

/** One thing stood in a square: its sprite, what it is called, and how many
 * cells of ground its foot takes. */
export type PlazaPiece = { sprite: string; label: string; w: number };

/** What a city's square holds beside its monument, from the 1850s on: who
 * sells there and from what, where people sit, what they drink from. The
 * planner places these; it knows nothing about which city has a yatai. */
export type PlazaKit = {
  /** Table sets, clustered as one terrace. */
  terrace: PlazaPiece[];
  /** Carts, stalls and mats, spread round the edges. */
  vendors: PlazaPiece[];
  /** Clocks, boards, postboxes: one of each, at the edges. */
  fixtures: PlazaPiece[];
  /** Bandstands and fountains this square might be built round instead of a monument. */
  centres: PlazaPiece[];
  games?: PlazaPiece;
  trade?: PlazaPiece;
  water?: PlazaPiece;
  planter?: PlazaPiece;
  bench?: PlazaPiece;
  tree?: PlazaPiece;
  pigeons?: PlazaPiece;
};

const families = new Map(props.families.map((f) => [f.id, f.variants]));

const piece = (family: string, variant: string, w = 2): PlazaPiece => {
  const index = families.get(family)?.indexOf(variant) ?? -1;
  if (index < 0) throw Error(`No ${family} variant called ${variant}`);
  return { sprite: `study-propb-${family}-${index}`, label: variant, w };
};

/** [from, to, family, variant, cells]: the years a thing stood in the street.
 * Broad and inferred: the first decade it was common, not its invention. */
type Row = readonly [number, number, string, string, number?];
const NOW = 9999;

type Region = {
  terrace?: Row[];
  vendors?: Row[];
  fixtures?: Row[];
  centres?: Row[];
  games?: Row[];
  trade?: Row[];
  water?: Row[];
  planter?: Row[];
  bench?: Row[];
  tree?: Row[];
  pigeons?: boolean;
};

const fountain: Row = [1850, NOW, "plaza-centre", "Tiered fountain", 5];
const worthy: Row = [1850, NOW, "plaza-centre", "Statue", 1];
const clock: Row = [1870, 1960, "street-fixture", "Street clock", 1];

const REGIONS: Record<string, Region> = {
  europe: {
    terrace: [[1850, NOW, "cafe-terrace", "Parasol"], [1850, NOW, "cafe-terrace", "Open"]],
    vendors: [
      [1850, 1960, "street-barrow", "Flowers"],
      [1850, NOW, "street-vendor", "Chestnut roaster"],
      [1900, NOW, "street-vendor", "Gelato tricycle"],
      [1850, 1950, "street-barrow", "Fruit"],
    ],
    fixtures: [clock],
    centres: [fountain, [1860, 1950, "plaza-centre", "Bandstand", 5], worthy],
    trade: [[1880, 1960, "street-trade", "Shoeshine stand"]],
    water: [[1850, 1925, "public-water", "Street pump", 1]],
    planter: [[1850, 1950, "street-planter", "Iron urn", 1], [1950, NOW, "street-planter", "Stone urn", 1]],
    tree: [[1850, NOW, "plaza-tree", "Plane in a guard", 1]],
    pigeons: true,
  },
  soviet: {
    vendors: [
      [1930, 1995, "street-vendor", "Kvass barrel", 3],
      [1935, NOW, "street-vendor", "Ice-cream cart"],
    ],
    fixtures: [
      [1955, 1992, "street-fixture", "Soda machine", 1],
      [1930, 1992, "street-fixture", "Newspaper stand"],
      [1955, 1992, "street-fixture", "Soda machine, red", 1],
    ],
    centres: [fountain],
    games: [[1950, NOW, "game-table", "Concrete chess"]],
    planter: [[1930, NOW, "street-planter", "Pedestal vase", 1]],
    pigeons: true,
  },
  "north-america": {
    terrace: [[1980, NOW, "cafe-terrace", "Parasol"], [1920, NOW, "cafe-terrace", "Picnic table"]],
    vendors: [
      [1900, NOW, "street-vendor", "Hot-dog cart"],
      [1890, 1960, "street-vendor", "Popcorn wagon"],
      [1900, NOW, "street-vendor", "Hot-dog cart, red"],
    ],
    fixtures: [[1850, NOW, "street-fixture", "Flagpole", 1], clock],
    centres: [[1870, 1940, "plaza-centre", "Bandstand", 5], fountain, worthy],
    games: [[1940, NOW, "game-table", "Park chess"]],
    trade: [[1880, 1970, "street-trade", "Shoeshine stand"]],
    water: [[1850, 1910, "public-water", "Street pump", 1], [1910, NOW, "public-water", "Pedestal bubbler", 1]],
    planter: [[1850, 1950, "street-planter", "Iron urn", 1]],
    pigeons: true,
  },
  latin: {
    terrace: [[1900, NOW, "cafe-terrace", "Parasol"]],
    vendors: [
      [1930, NOW, "street-vendor", "Paletero cart"],
      [1900, NOW, "street-vendor", "Aguas frescas"],
      [1920, NOW, "street-vendor", "Balloon seller", 1],
      [1900, NOW, "street-vendor", "Elote cart"],
    ],
    fixtures: [clock, [1850, NOW, "street-fixture", "Flagpole", 1]],
    centres: [
      [1880, NOW, "plaza-centre", "Kiosco", 5],
      [1880, NOW, "plaza-centre", "Kiosco, red roof", 5],
      fountain,
    ],
    trade: [[1900, NOW, "street-trade", "Bolero chair"]],
    planter: [[1850, NOW, "street-planter", "Stone urn", 1]],
    bench: [[1870, NOW, "plaza-bench", "Wrought iron", 3]],
    pigeons: true,
  },
  andes: {
    vendors: [
      [1900, NOW, "street-vendor", "Emoliente cart"],
      [1920, NOW, "street-vendor", "Balloon seller", 1],
      [1930, NOW, "street-vendor", "Paletero cart"],
    ],
  },
  mena: {
    terrace: [[1850, NOW, "cafe-terrace", "Coffeehouse", 3]],
    vendors: [
      [1900, NOW, "street-vendor", "Orange-juice stall", 3],
      [1850, NOW, "street-vendor", "Corn and chestnut cart"],
    ],
    fixtures: [[1880, 1970, "street-fixture", "Street clock", 1]],
    centres: [[1860, NOW, "plaza-centre", "Tiered fountain", 5]],
    games: [[1850, NOW, "game-table", "Backgammon", 3]],
    trade: [[1880, NOW, "street-trade", "Shoeshine box"]],
    water: [[1850, NOW, "public-water", "Zeer jars"]],
    planter: [[1850, NOW, "street-planter", "Orange tree", 1]],
    tree: [[1850, NOW, "plaza-tree", "Date palm", 1]],
    pigeons: true,
  },
  turkey: {
    vendors: [
      [1900, NOW, "street-vendor", "Simit cart"],
      [1850, NOW, "street-vendor", "Corn and chestnut cart"],
    ],
    tree: [],
  },
  africa: {
    vendors: [
      [1960, NOW, "street-vendor", "Umbrella vendor", 3],
      [1850, NOW, "street-vendor", "Market mat", 3],
      [1900, NOW, "street-vendor", "Suya grill"],
      [1920, NOW, "street-vendor", "Duka kiosk", 3],
      [1920, NOW, "street-vendor", "Mkokoteni", 3],
    ],
    trade: [[1900, NOW, "street-trade", "Tailor"]],
    water: [[1930, NOW, "public-water", "Standpipe"]],
    bench: [[1850, NOW, "plaza-bench", "Plank", 3]],
  },
  "south-asia": {
    vendors: [
      [1900, NOW, "street-vendor", "Chai stall", 4],
      [1850, NOW, "street-vendor", "Paan stall"],
      [1880, NOW, "street-vendor", "Chaat cart", 3],
      [1920, NOW, "street-vendor", "Cane press", 3],
      [1880, NOW, "street-vendor", "Lime soda cart", 3],
    ],
    fixtures: [[1880, NOW, "street-fixture", "Letterbox", 1]],
    centres: [[1850, NOW, "plaza-centre", "Banyan platform", 5]],
    trade: [[1900, NOW, "street-trade", "Tailor"]],
    water: [[1900, NOW, "public-water", "Hand pump"]],
  },
  "southeast-asia": {
    terrace: [[1975, NOW, "cafe-terrace", "Pavement stools", 3]],
    vendors: [
      [1900, NOW, "street-vendor", "Noodle cart", 4],
      [1850, NOW, "street-vendor", "Coconut stand", 3],
      [1930, NOW, "street-vendor", "Iced drinks"],
      [1950, NOW, "street-vendor", "Banh mi stand", 3],
    ],
    water: [[1850, NOW, "public-water", "Roofed water jars"]],
    planter: [[1850, NOW, "street-planter", "Dragon jar"]],
  },
  archipelago: {
    vendors: [
      [1900, NOW, "street-vendor", "Kaki lima", 3],
      [1850, NOW, "street-vendor", "Coconut stand", 3],
      [1900, NOW, "street-vendor", "Kaki lima, green", 3],
      [1930, NOW, "street-vendor", "Iced drinks"],
    ],
  },
  china: {
    terrace: [[1950, NOW, "cafe-terrace", "Park tea table", 3]],
    vendors: [
      [1850, NOW, "street-vendor", "Baozi steamers"],
      [1850, NOW, "street-vendor", "Tanghulu pole", 1],
      [1950, NOW, "street-vendor", "Sweet-potato oven"],
    ],
    fixtures: [
      [1950, NOW, "street-fixture", "Notice board", 3],
      [1998, NOW, "street-fixture", "Air walker"],
    ],
    games: [[1850, NOW, "game-table", "Xiangqi", 3]],
    planter: [[1850, NOW, "street-planter", "Pine in glazed jar", 1]],
  },
  japan: {
    vendors: [
      [1850, NOW, "street-vendor", "Yatai", 3],
      [1850, NOW, "street-vendor", "Yaki-imo cart", 3],
    ],
    fixtures: [[1901, NOW, "street-fixture", "Pillar postbox", 1]],
    games: [[1850, NOW, "game-table", "Go bench", 3]],
    water: [[1920, NOW, "public-water", "Park tap", 1]],
    planter: [[1850, NOW, "street-planter", "Hydrangea tub", 1]],
    pigeons: true,
  },
  korea: {
    vendors: [
      [1950, NOW, "street-vendor", "Pojangmacha", 3],
      [1953, NOW, "street-vendor", "Tteokbokki cart", 3],
    ],
    games: [[1850, NOW, "game-table", "Go bench", 3]],
    water: [[1960, NOW, "public-water", "Park tap", 1]],
    planter: [[1850, NOW, "street-planter", "Pine in glazed jar", 1]],
    pigeons: true,
  },
};

const within = (lon: number, lat: number, [w, s, e, n]: readonly number[]) =>
  lon >= w && lon <= e && lat >= s && lat <= n;

/** The regions whose rows apply, most local first; a local region's list
 * replaces the wider one's list of the same kind. */
function regionsFor(pack: Pack): string[] {
  const { lon, lat } = pack.anchor;
  const culture = pack.setting?.culture;
  const year = pack.year;
  if (culture === "north-african-west-asian" || modernity(pack.anchor).id === "west-asia-north-africa")
    return within(lon, lat, [26, 36, 45, 42]) ? ["turkey", "mena"] : ["mena"];
  switch (modernity(pack.anchor).id) {
    case "britain":
    case "western-europe":
      return ["europe"];
    case "eastern-europe":
      return year >= 1930 && year < 1992 && (lon >= 23 || culture === "inner-eurasian") ? ["soviet"] : ["europe"];
    case "north-america":
    case "australasia":
      return ["north-america"];
    case "latin-america":
      return culture === "andean" || within(lon, lat, [-82, -25, -62, 2]) ? ["andes", "latin"] : ["latin"];
    case "south-asia":
      return ["south-asia"];
    case "southeast-asia":
      return lat < 7 || within(lon, lat, [116, 4, 127, 20]) ? ["archipelago", "southeast-asia"] : ["southeast-asia"];
    case "japan":
      return ["japan"];
    case "east-asia":
      return within(lon, lat, [124, 33, 131, 43]) ? ["korea"] : ["china"];
    case "sub-saharan-africa":
    case "southern-africa":
      return ["africa"];
    default:
      return culture === "inner-eurasian" && year >= 1930 && year < 1992 ? ["soviet"] : [];
  }
}

export function plazaKitFor(pack: Pack): PlazaKit | undefined {
  const year = pack.year;
  if (year < 1850) return undefined;
  const regions = regionsFor(pack).map((id) => REGIONS[id]);
  if (!regions.length) return undefined;
  const rows = (key: Exclude<keyof Region, "pigeons">) =>
    (regions.find((r) => r[key])?.[key] ?? [])
      .filter(([from, to]) => year >= from && year < to)
      .map(([, , family, variant, w]) => piece(family, variant, w));
  return {
    terrace: rows("terrace"),
    vendors: rows("vendors"),
    fixtures: rows("fixtures"),
    centres: rows("centres"),
    games: rows("games")[0],
    trade: rows("trade")[0],
    water: rows("water")[0],
    planter: rows("planter")[0],
    bench: rows("bench")[0],
    tree: rows("tree")[0],
    pigeons: regions.some((r) => r.pigeons) ? piece("pigeons", "Flock", 3) : undefined,
  };
}
