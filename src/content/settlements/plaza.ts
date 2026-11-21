import props from "../graphics/props.json" with { type: "json" };
import type { Pack } from "../../core/types";
import { industrialized, modernity } from "./modernity";
import { statueFor } from "./statues";

/** One thing stood in a square: its sprite, what it is called, and how many
 * cells of ground its foot takes. */
export type PlazaPiece = { sprite: string; label: string; w: number };

/** How a city's main square is built and meets its streets, once its streets
 * are kerbed. A `place` is paved out to its own kerb, the streets passing its
 * sides and their trees standing on it: the continental square, the Soviet
 * one, a station front in East Asia. A `garden` is lawns between cross walks
 * inside the public footway: behind iron railings with a gate on each walk
 * in Britain and its settler cities until the railings went for scrap in the
 * 1940s, open elsewhere, as a courthouse square, a Latin American plaza
 * round its kiosk, a maidan or a padang. Undefined, the square is open
 * ground running into its streets: a market place, a plaza mayor before its
 * gardens. */
export type SquareKind = { form: "place" } | { form: "garden"; railed: boolean };
export function squareKind(s: { lon: number; lat: number; year: number }): SquareKind | undefined {
  if (!industrialized(s)) return undefined;
  const id = modernity(s).id;
  if (id === "britain" || id === "australasia") return { form: "garden", railed: s.year < 1940 };
  if (["north-america", "latin-america", "southern-africa", "south-asia", "southeast-asia"].includes(id)) return { form: "garden", railed: false };
  return { form: "place" };
}

/** What a town's square holds beside its centrepiece: who sells there and
 * from what, where people sit, what they drink from, what stands along its
 * sides. The planner places these; it knows nothing about which city has a
 * yatai or a row of togate statues. */
export type PlazaKit = {
  /** Table sets, clustered as one terrace. */
  terrace: PlazaPiece[];
  /** Carts, stalls and mats, spread round the edges. */
  vendors: PlazaPiece[];
  /** Clocks, boards, postboxes: one of each, at the edges. */
  fixtures: PlazaPiece[];
  /** Bandstands and fountains this square might be built round instead of a monument. */
  centres: PlazaPiece[];
  /** Statues, stelae, lanterns or braziers standing in rows down the sides. */
  lined: PlazaPiece[];
  /** Market pitches beyond the two every square has: how much of it is a market. */
  pitches: number;
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
  lined?: Row[];
  /** The sides are lined with the tradition's own statues, where it has any. */
  statues?: boolean;
  pitches?: number;
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

/** Before the boulevard age, by cultural family and date. Inferred from what
 * each tradition's public ground is known to have held, not a survey. */
const EARLY: Record<string, Region> = {
  // A forum: honorific statues down the sides, the public weights, a street fountain.
  roman: {
    statues: true,
    lined: [[-200, 500, "monument", "Roman honorific column", 1]],
    fixtures: [[-300, 500, "beam-scale", "Brass pans"], [-400, 500, "censer", "Bronze tripod", 1]],
    vendors: [[-400, 500, "amphora-stack", "Terracotta"]],
    water: [[-300, 500, "street-fountain", "Pale limestone"]],
    bench: [[-400, 500, "plaza-bench", "Stone", 3]],
    pitches: 2,
    pigeons: true,
  },
  // A market place: pitches over most of it, the town's scales, a rail for the horses.
  "medieval-europe": {
    fixtures: [[1100, 1500, "beam-scale", "Iron pans"], [500, 1500, "hitching-post", "Rail", 3]],
    vendors: [[500, 1500, "trade-goods", "Cloth"], [500, 1500, "trade-goods", "Bales"]],
    water: [[500, 1500, "town-well", "Granite", 3]],
    bench: [[500, 1500, "bench", "Oak plank", 3]],
    pitches: 6,
    pigeons: true,
  },
  "early-modern-europe": {
    fixtures: [[1500, 1850, "beam-scale", "Brass beam"], [1500, 1850, "hitching-post", "Post and ring", 3]],
    vendors: [[1500, 1850, "handcart", "Crates of greens"], [1700, 1850, "street-barrow", "Fruit"], [1500, 1850, "handcart", "Sacks"]],
    water: [[1500, 1700, "town-well", "Limestone", 3], [1700, 1850, "public-water", "Street pump", 1]],
    bench: [[1500, 1850, "bench", "Oak plank", 3]],
    planter: [[1650, 1850, "street-planter", "Stone urn", 1]],
    pitches: 4,
    pigeons: true,
  },
  // Spanish and Portuguese America: the fountain the town drinks from, stone
  // benches, sellers sitting on the paving.
  "colonial-america": {
    fixtures: [[1540, 1850, "beam-scale", "Brass pans"], [1540, 1850, "hitching-post", "Post and ring", 3]],
    vendors: [[1540, 1850, "street-vendor", "Market mat", 3], [1700, 1850, "street-vendor", "Aguas frescas"]],
    water: [[1540, 1850, "street-fountain", "Warm stone"]],
    bench: [[1540, 1850, "plaza-bench", "Stone", 3]],
    planter: [[1700, 1850, "street-planter", "Stone urn", 1]],
    pitches: 4,
    pigeons: true,
  },
  // A maidan or a mosque's forecourt: water set out for whoever passes, a
  // coffeehouse from the sixteenth century, the market round the edges.
  islamic: {
    terrace: [[1550, 1850, "cafe-terrace", "Coffeehouse", 3]],
    lined: [[650, 1850, "brazier-post", "Sandstone", 1]],
    fixtures: [[650, 1850, "beam-scale", "Brass pans"], [650, 1850, "hitching-post", "Rail", 3]],
    vendors: [[650, 1850, "street-vendor", "Market mat", 3], [650, 1850, "trade-goods", "Cloth"], [650, 1850, "trade-goods", "Salt"]],
    games: [[650, 1850, "game-table", "Backgammon", 3]],
    water: [[650, 1850, "public-water", "Zeer jars"]],
    planter: [[650, 1850, "street-planter", "Orange tree", 1]],
    tree: [[650, 1850, "plaza-tree", "Date palm", 1]],
    pitches: 4,
    pigeons: true,
  },
  "ancient-near-east": {
    lined: [[-3000, 650, "brazier-post", "Sandstone", 1]],
    fixtures: [[-2500, 650, "beam-scale", "Brass pans"]],
    vendors: [[-3000, 650, "street-vendor", "Market mat", 3], [-3000, 650, "trade-goods", "Bales"]],
    water: [[-3000, 650, "framed-well", "Plastered rim", 3]],
    pitches: 3,
  },
  // Under the tree: rope beds to sit on, a lamp pillar, sellers on the ground.
  "south-asia": {
    statues: true,
    terrace: [[-500, 1850, "charpoy", "Jute rope"], [-500, 1850, "charpoy", "Coloured tape"]],
    centres: [[-500, 1850, "plaza-centre", "Banyan platform", 5]],
    fixtures: [[300, 1850, "sacred-marker", "Lamp pillar"], [-500, 1850, "beam-scale", "Brass pans"]],
    vendors: [[-500, 1850, "street-vendor", "Market mat", 3], [-200, 1850, "street-vendor", "Paan stall"], [-500, 1850, "trade-goods", "Cloth"]],
    water: [[-2600, 1850, "framed-well", "Stone blocks", 3]],
    pitches: 4,
  },
  // No civic square: a crossing with its steles and lanterns, a well, a board game.
  china: {
    statues: true,
    lined: [[600, 1850, "monument", "Stele on a tortoise", 1], [1000, 1850, "lantern-post", "Red paper", 1]],
    fixtures: [[-200, 1850, "sacred-marker", "Incense burner"], [-200, 1850, "beam-scale", "Brass beam"]],
    vendors: [[300, 1850, "street-vendor", "Baozi steamers"], [1200, 1850, "street-vendor", "Tanghulu pole", 1], [-500, 1850, "trade-goods", "Bales"]],
    games: [[1000, 1850, "game-table", "Xiangqi", 3]],
    water: [[-1000, 1850, "framed-well", "Stone blocks", 3]],
    planter: [[900, 1850, "street-planter", "Pine in glazed jar", 1]],
    pitches: 3,
  },
  japan: {
    lined: [[700, 1850, "stone-lantern", "Weathered granite", 1], [1000, 1850, "lantern-post", "White paper", 1]],
    vendors: [[1700, 1850, "street-vendor", "Yatai", 3], [700, 1850, "trade-goods", "Bales"]],
    games: [[800, 1850, "game-table", "Go bench", 3]],
    water: [[700, 1850, "well", "Stone tsukubai", 3]],
    planter: [[1000, 1850, "street-planter", "Pine in glazed jar", 1]],
    pitches: 3,
  },
  korea: {
    statues: true,
    lined: [[1000, 1850, "lantern-post", "Pale timber", 1]],
    vendors: [[600, 1850, "trade-goods", "Bales"]],
    games: [[700, 1850, "game-table", "Go bench", 3]],
    water: [[600, 1850, "well", "Fieldstone", 3]],
    planter: [[1000, 1850, "street-planter", "Pine in glazed jar", 1]],
    pitches: 3,
  },
  "southeast-asia": {
    statues: true,
    fixtures: [[1100, 1850, "sacred-marker", "Chedi"], [100, 1850, "festival-drum", "Barrel drum", 1]],
    vendors: [[100, 1850, "street-vendor", "Coconut stand", 3], [100, 1850, "street-vendor", "Market mat", 3]],
    water: [[100, 1850, "public-water", "Roofed water jars"]],
    planter: [[1300, 1850, "street-planter", "Dragon jar"]],
    pitches: 3,
  },
  // The assembly ground: a plank bench in the shade, the drum, sellers on mats.
  africa: {
    fixtures: [[800, 1850, "festival-drum", "Standing drum", 1], [800, 1850, "pounding-mortar", "Oak", 1]],
    vendors: [[800, 1850, "street-vendor", "Market mat", 3], [800, 1850, "trade-goods", "Salt"], [800, 1850, "trade-goods", "Cloth"]],
    water: [[800, 1850, "well", "Sandstone cistern", 3]],
    bench: [[800, 1850, "plaza-bench", "Plank", 3]],
    pitches: 4,
  },
  // A ceremonial plaza: carved stones before the platform, incense, braziers.
  mesoamerica: {
    statues: true,
    lined: [[-300, 950, "monument", "Maya stela and altar"], [-1200, 1540, "brazier-post", "Limestone", 1]],
    fixtures: [[-1200, 1540, "censer", "Clay bowl", 1], [-1200, 1540, "festival-drum", "Standing drum", 1]],
    vendors: [[-1200, 1540, "street-vendor", "Market mat", 3]],
    pitches: 2,
  },
  andes: {
    statues: true,
    lined: [[-3000, 1540, "brazier-post", "Granite", 1]],
    fixtures: [[-3000, 1540, "censer", "Clay bowl", 1]],
    vendors: [[-3000, 1540, "street-vendor", "Market mat", 3], [-3000, 1540, "trade-goods", "Cloth"]],
    pitches: 2,
  },
  steppe: {
    statues: true,
    lined: [[-1200, 1850, "standing-stone", "Deer stone", 1]],
    fixtures: [[-1000, 1850, "hitching-post", "Rail", 3]],
    vendors: [[-1000, 1850, "trade-goods", "Bales"]],
    water: [[-1000, 1850, "trough", "Carved stone", 3]],
    pitches: 2,
  },
};

function earlyRegions(pack: Pack): string[] {
  const { lon, lat } = pack.anchor;
  const year = pack.year;
  switch (pack.setting?.culture) {
    case "european": {
      const america = ["latin-america", "north-america"].includes(modernity(pack.anchor).id);
      if (america) return modernity(pack.anchor).id === "latin-america" ? ["colonial-america"] : ["early-modern-europe"];
      return year < -400 ? [] : year < 500 ? ["roman"] : year < 1500 ? ["medieval-europe"] : ["early-modern-europe"];
    }
    case "north-african-west-asian":
      return year >= 650 ? ["islamic"] : year >= -330 ? ["roman"] : ["ancient-near-east"];
    case "south-asian":
      return ["south-asia"];
    case "east-asian":
      return lon >= 129 ? ["japan"] : within(lon, lat, [124, 33, 131, 43]) ? ["korea"] : ["china"];
    case "southeast-asian":
      return ["southeast-asia"];
    case "west-central-african":
    case "east-southern-african":
      return ["africa"];
    case "mesoamerican":
      return year < 1540 ? ["mesoamerica"] : ["colonial-america"];
    case "andean":
      return year < 1540 ? ["andes"] : ["colonial-america"];
    case "inner-eurasian":
      return ["steppe"];
    default:
      return [];
  }
}

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

/** `rank` is the town's standing, 0 provincial to 2 a capital: it sizes the
 * figures a forum or a temple approach lines its sides with. */
export function plazaKitFor(pack: Pack, rank = 1): PlazaKit | undefined {
  const year = pack.year;
  const regions = year < 1850 ? earlyRegions(pack).map((id) => EARLY[id]) : regionsFor(pack).map((id) => REGIONS[id]);
  if (!regions.length) return undefined;
  const rows = (key: Exclude<keyof Region, "pigeons" | "pitches" | "statues">) =>
    (regions.find((r) => r[key])?.[key] ?? [])
      .filter(([from, to]) => year >= from && year < to)
      .map(([, , family, variant, w]) => piece(family, variant, w));
  return {
    terrace: rows("terrace"),
    vendors: rows("vendors"),
    fixtures: rows("fixtures"),
    centres: rows("centres"),
    // Two of the place's own figures first, a size below the centrepiece's.
    lined: [
      ...(regions.some((r) => r.statues)
        ? [0.15, 0.65].flatMap((p) => statueFor(pack, p, rank) ?? [])
        : []),
      ...rows("lined"),
    ],
    pitches: regions.find((r) => r.pitches !== undefined)?.pitches ?? 0,
    games: rows("games")[0],
    trade: rows("trade")[0],
    water: rows("water")[0],
    planter: rows("planter")[0],
    bench: rows("bench")[0],
    tree: rows("tree")[0],
    pigeons: regions.some((r) => r.pigeons) ? piece("pigeons", "Flock", 3) : undefined,
  };
}
