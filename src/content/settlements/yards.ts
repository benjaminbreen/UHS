import type { WorldSetting } from "../geography/types";
import type { Boundary, CropId } from "../agriculture/types";
import { lifeway } from "./lifeways";
import type { EarthFinish } from "./urban-form/types";

/** What a house platform is faced with. plaster: lime stucco over rubble.
 * dressed: squared kerb stones round rammed earth. drystone: stacked field
 * stone under a pebble floor. mud: raised earth smeared with clay. earth: a
 * turfed bank under a clay cap. */
export type PlinthFace = "plaster" | "dressed" | "drystone" | "mud" | "earth";

/** What stands in a household's yard, beyond the fence and the bed. `sprite`
 * is a prop family in the redrawn set; `where` says which part of the yard. */
export type YardProp = {
  prop: string;
  family: string;
  name: string;
  /** `back` is behind the house, where the kit keeps a back yard. */
  where: "bed" | "wall" | "door" | "yard" | "back";
  chance: number;
  /** Only for residents whose livelihood matches. */
  role?: RegExp;
  contents?: Record<string, number>;
  /** Set down beside it, cells across and down from it (mirrored at random):
   * a yard reads as worked in when things stand in the groups work leaves. */
  with?: readonly YardCompanion[];
};

export type YardCompanion = Pick<YardProp, "prop" | "family" | "name" | "contents"> & {
  dx: number;
  dy: number;
};

const chopping: YardCompanion = {
  prop: "choppingBlock",
  family: "chopping-block",
  name: "Chopping block",
  dx: 1,
  dy: 1,
};

export type YardKit = {
  id: string;
  /** Fence material; "era" chooses by culture, date and climate. */
  boundary: "era" | Boundary;
  /** Rows of open yard kept in front of the house. */
  front: readonly [number, number];
  /** Rows kept behind it, for the coop, the hives and the privy. */
  back?: readonly [number, number];
  /** Shares of yards that wrap the house, fence only the bed, or go unfenced. */
  styles: { wrap: number; side: number; open: number };
  beds: readonly CropId[];
  /** How the open yard is kept. Absent, it is turf worn at the door. */
  ground?: EarthFinish;
  /** The low platform the house stands on; `apron` is the rows of it kept
   * clear in front of the door. */
  plinth?: { face: PlinthFace; apron: number };
  /** The taller platform under the place's public building, `rise` pixels
   * high; `sacred` puts its shrine or temple on one too. */
  mound?: { face: PlinthFace; rise: number; sacred?: boolean };
  /** Share of households with a second house beside them on one platform. */
  group?: number;
  /** `sprites` is the kit's own planting; without it the yard takes from the
   * local wild mix. */
  tree?: { sprites?: readonly string[]; chance: number };
  props: readonly YardProp[];
};

const stores: YardProp[] = [
  {
    prop: "woodpile",
    family: "woodpile",
    name: "Firewood stack",
    where: "wall",
    chance: 0.7,
    contents: { wood: 3 },
    with: [chopping],
  },
];

/** Northern Europe, 400-1800: the toft. A fenced front yard, a vegetable bed
 * to one side, a fruit tree, and the stores of whoever lives there. */
const toft: YardKit = {
  id: "toft",
  boundary: "era",
  // The yard at the door was trodden mud; the green was the garth behind.
  ground: "beaten",
  front: [2, 4],
  back: [2, 4],
  styles: { wrap: 0.55, side: 0.3, open: 0.15 },
  beds: ["vegetables", "vegetables", "beans", "flax"],
  tree: { sprites: ["nature-oak"], chance: 0.5 },
  props: [
    ...stores,
    {
      prop: "scarecrow",
      family: "scarecrow",
      name: "Scarecrow",
      where: "bed",
      chance: 0.35,
    },
    {
      prop: "beehive",
      family: "beehive",
      name: "Beehive",
      where: "back",
      chance: 0.2,
      // Skeps stand in a row on the bee bench.
      with: [{ prop: "beehive", family: "beehive", name: "Beehive", dx: 1, dy: 0 }],
    },
    {
      prop: "washingLine",
      family: "washing-line",
      name: "Washing line",
      where: "yard",
      chance: 0.3,
      with: [
        { prop: "washTub", family: "wash-tub", name: "Wash tub", dx: 0, dy: 1 },
        { prop: "basket", family: "open-basket", name: "Basket", dx: 1, dy: 1 },
      ],
    },
    {
      prop: "flowerTub",
      family: "flower-tub",
      name: "Planted tub",
      where: "door",
      chance: 0.45,
    },
    {
      prop: "grainSacks",
      family: "grain-sacks",
      name: "Grain sacks",
      where: "wall",
      chance: 0.5,
      role: /farm|plough|husband|peasant|reap|thresh|mill/i,
      contents: { grain: 2 },
    },
    {
      prop: "trough",
      family: "trough",
      name: "Animal trough",
      where: "yard",
      chance: 0.6,
      role: /herd|shepherd|dairy|cow|swine|drover/i,
      contents: { water: 4 },
    },
    {
      prop: "barrel",
      family: "barrel",
      name: "Wooden barrel",
      where: "wall",
      chance: 0.5,
    },
    {
      prop: "chickenCoop",
      family: "chicken-coop",
      name: "Henhouse",
      where: "back",
      chance: 0.35,
      with: [{ prop: "bucket", family: "bucket", name: "Feed bucket", dx: 1, dy: 1 }],
    },
    {
      prop: "hayRick",
      family: "hay-rick",
      name: "Hay rick",
      where: "back",
      chance: 0.5,
      role: /farm|plough|husband|peasant|herd|shepherd|dairy|cow|drover/i,
      with: [{ prop: "pitchfork", family: "pitchfork", name: "Pitchfork", dx: 1, dy: 0 }],
    },
    {
      prop: "dovecote",
      family: "dovecote",
      name: "Dovecote",
      where: "back",
      chance: 0.1,
    },
  ],
};

/** The Mediterranean court: a walled yard to one side, no front garden, a
 * vine or a few vegetables, an olive in the corner. */
const court: YardKit = {
  id: "court",
  boundary: "era",
  ground: "beaten",
  front: [0, 0],
  styles: { wrap: 0, side: 0.75, open: 0.25 },
  beds: ["vine", "vegetables", "beans"],
  tree: { sprites: ["nature-olive"], chance: 0.6 },
  props: [...stores],
};

const coop: YardProp = {
  prop: "chickenCoop",
  family: "chicken-coop",
  name: "Henhouse",
  where: "back",
  chance: 0.45,
  with: [{ prop: "bucket", family: "bucket", name: "Feed bucket", dx: 1, dy: 1 }],
};
const washing: YardProp = {
  prop: "washingLine",
  family: "washing-line",
  name: "Washing line",
  where: "back",
  chance: 0.45,
  with: [{ prop: "washTub", family: "wash-tub", name: "Wash tub", dx: 0, dy: 1 }],
};

/** Northern Europe and the settler colonies, 1650-1950: the cottage. Flowers
 * and a path in a fenced front garden, the kitchen garden of potatoes and
 * beans to the side, and the wash, the hens and the water butt out the back. */
const cottage: YardKit = {
  id: "cottage",
  boundary: "era",
  front: [2, 3],
  back: [3, 4],
  styles: { wrap: 0.7, side: 0.2, open: 0.1 },
  beds: ["vegetables", "potato", "beans", "vegetables"],
  tree: { sprites: ["nature-broadleaf-young"], chance: 0.55 },
  props: [
    ...stores,
    coop,
    washing,
    {
      prop: "flowerTub",
      family: "flower-tub",
      name: "Planted tub",
      where: "door",
      chance: 0.6,
    },
    {
      prop: "barrel",
      family: "barrel",
      name: "Water butt",
      where: "wall",
      chance: 0.55,
      contents: { water: 4 },
    },
    {
      prop: "beehive",
      family: "beehive",
      name: "Beehive",
      where: "back",
      chance: 0.15,
    },
  ],
};

/** The Mesoamerican house lot, the solar: maize, beans and squash grown
 * together by the house, fruit trees, and turkeys and hens kept out back.
 * The house stands on a low plastered platform, as excavated house mounds
 * do across the Maya lowlands and the Basin of Mexico; the yard is swept. */
const solar: YardKit = {
  id: "solar",
  boundary: "era",
  ground: "swept",
  plinth: { face: "plaster", apron: 2 },
  mound: { face: "plaster", rise: 13 },
  group: 0.6,
  front: [3, 4],
  back: [2, 3],
  styles: { wrap: 0.45, side: 0.35, open: 0.2 },
  beds: ["maize", "beans", "squash", "maize"],
  tree: { sprites: ["nature-tropical-broadleaf"], chance: 0.6 },
  props: [
    ...stores,
    { ...coop, name: "Turkey pen", chance: 0.5 },
    { prop: "metate", family: "metate", name: "Metate and mano", where: "door", chance: 0.8 },
    { prop: "jar", family: "storage-jar", name: "Water jar", where: "door", chance: 0.7 },
    { prop: "threeStoneHearth", family: "three-stone-hearth", name: "Three-stone hearth", where: "yard", chance: 0.5 },
  ],
};

/** After the conquest the congregated towns built at ground level; the lot,
 * its crops and its swept yard carried on. */
const colonialSolar: YardKit = { ...solar, id: "colonial-solar", plinth: undefined, mound: undefined, group: undefined, front: [1, 2] };

/** The Andes: a stone-walled patio and a plot of tubers and grain beside it;
 * few trees at that height. */
const andean: YardKit = {
  id: "andean",
  boundary: "wall",
  ground: "beaten",
  front: [1, 2],
  back: [1, 2],
  // The kancha: houses inside one fieldstone wall.
  styles: { wrap: 0.8, side: 0.15, open: 0.05 },
  beds: ["potato", "quinoa", "potato", "maize"],
  tree: { chance: 0.15 },
  props: [...stores],
};

/** Southeast Asia: a yard under fruit trees and palms, hens loose beneath
 * the house, and a fenced bed of taro and greens to keep the stock out. */
const kampong: YardKit = {
  id: "kampong",
  boundary: "era",
  ground: "swept",
  front: [1, 3],
  back: [2, 3],
  styles: { wrap: 0.35, side: 0.45, open: 0.2 },
  beds: ["taro", "vegetables", "yam"],
  tree: { sprites: ["nature-feather-palm", "nature-tropical-broadleaf"], chance: 0.75 },
  props: [...stores, { ...coop, chance: 0.4 }],
};

/** Anywhere unresearched: a bed and the firewood, nothing period-specific. */
const plain: YardKit = {
  id: "plain",
  boundary: "era",
  front: [2, 3],
  styles: { wrap: 0.35, side: 0.35, open: 0.3 },
  beds: ["vegetables"],
  tree: { chance: 0.45 },
  props: [...stores],
};

/** China, Korea and Japan: a bamboo clump or a broadleaf behind the house.
 * Sweetgum and camphor were the planted village trees of the south; the
 * maple stands in for both. The house stands on a stone-kerbed footing of
 * rammed earth (taiji, gidan), and the yard is beaten flat for threshing. */
const eastAsian: YardKit = {
  ...plain,
  id: "east-asian",
  ground: "beaten",
  plinth: { face: "dressed", apron: 1 },
  mound: { face: "dressed", rise: 9, sacred: true },
  back: [2, 3],
  styles: { wrap: 0.6, side: 0.25, open: 0.15 },
  tree: { sprites: ["nature-bamboo-clump", "nature-bamboo-clump", "nature-maple"], chance: 0.5 },
  props: [...stores, { ...coop, chance: 0.3 }],
};

/** Japan: the farmhouse stands on footing stones at ground level, with a
 * beaten working yard (niwa) before it; shrines and halls keep the stone
 * terrace. */
const japanese: YardKit = { ...eastAsian, id: "japanese", plinth: undefined };

/** Polynesia: the house on a paepae, a platform of stacked field stone
 * floored with water-worn pebbles, in a swept yard under breadfruit and
 * coconut. Documented for Hawaii, the Marquesas and the Society Islands. */
const paepae: YardKit = {
  ...plain,
  id: "paepae",
  ground: "swept",
  plinth: { face: "drystone", apron: 1 },
  mound: { face: "drystone", rise: 10, sacred: true },
  group: 0.4,
  styles: { wrap: 0.1, side: 0.3, open: 0.6 },
  beds: ["taro", "yam"],
  props: [
    ...stores,
    { prop: "poundingMortar", family: "pounding-mortar", name: "Poi board and pounder", where: "door", chance: 0.6 },
    { prop: "earthOven", family: "earth-oven", name: "Earth oven", where: "yard", chance: 0.6 },
  ],
};

/** Eastern North America before 1650: houses on swept ground round a plaza,
 * maize, beans and squash beside them, the corn in a raised crib. The
 * townhouse or temple stood on an earthen platform mound, documented from
 * Cahokia to the Gulf. */
const woodland: YardKit = {
  ...plain,
  id: "woodland",
  ground: "swept",
  mound: { face: "earth", rise: 13, sacred: true },
  back: [2, 3],
  styles: { wrap: 0.05, side: 0.35, open: 0.6 },
  beds: ["maize", "beans", "squash"],
  props: [
    ...stores,
    { prop: "poundingMortar", family: "pounding-mortar", name: "Corn mortar", where: "door", chance: 0.6 },
    { prop: "granaryStilt", family: "granary-stilt", name: "Corn crib", where: "back", chance: 0.5 },
  ],
};
const americasNorthwest = (s: WorldSetting) => s.lon < -115 && s.lat > 40;

/** The Pueblo Southwest: room blocks round a plaza of beaten earth, the
 * grinding done at the door. */
const pueblo: YardKit = {
  ...plain,
  id: "pueblo",
  ground: "beaten",
  styles: { wrap: 0, side: 0.3, open: 0.7 },
  beds: ["maize", "beans", "squash"],
  tree: { chance: 0.1 },
  props: [
    ...stores,
    { prop: "metate", family: "metate", name: "Metate and mano", where: "door", chance: 0.7 },
    { prop: "jar", family: "storage-jar", name: "Water jar", where: "door", chance: 0.6 },
  ],
};

/** The walled court of the Near East and North Africa, the house standing
 * in it, its shade a date palm where it is hot and dry. */
const westAsian: YardKit = {
  ...court,
  id: "west-asian",
  // Courts were floored with the same mud plaster as the roofs.
  ground: "daub",
  front: [2, 3],
  styles: { wrap: 0.7, side: 0.25, open: 0.05 },
  tree: { sprites: ["nature-date-palm"], chance: 0.5 },
};

/** Before iron: wattle hurdles round a plot of emmer or pulses, a trough, a
 * rack. Mostly unfenced; stock was herded, not penned at the door. */
const croft: YardKit = {
  id: "croft",
  boundary: "era",
  ground: "beaten",
  front: [1, 2],
  styles: { wrap: 0.15, side: 0.4, open: 0.45 },
  beds: ["wheat", "barley", "beans", "flax"],
  tree: { chance: 0.5 },
  props: [
    ...stores,
    {
      prop: "trough",
      family: "trough",
      name: "Log trough",
      where: "yard",
      chance: 0.4,
      contents: { water: 4 },
    },
    {
      prop: "dryingRack",
      family: "drying-rack",
      name: "Drying rack",
      where: "yard",
      chance: 0.45,
      with: [{ prop: "basket", family: "open-basket", name: "Basket", dx: 1, dy: 1 }],
    },
    {
      prop: "hayRick",
      family: "hay-rick",
      name: "Hay rick",
      where: "yard",
      chance: 0.3,
    },
    {
      prop: "hideFrame",
      family: "hide-frame",
      name: "Hide on a drying frame",
      where: "wall",
      chance: 0.35,
    },
    {
      prop: "knappingFloor",
      family: "knapping-floor",
      name: "Knapping floor",
      where: "door",
      chance: 0.3,
    },
  ],
};

/** Africa south of the Sahara before colonial rule: an open swept yard, the
 * mortar and the water gourds by the door, a hive hung at the edge, and the
 * stock brought into a kraal at night. */
const compound: YardKit = {
  id: "compound",
  boundary: "era",
  ground: "swept",
  front: [2, 3],
  styles: { wrap: 0.1, side: 0.3, open: 0.6 },
  beds: ["sorghum", "millet", "beans", "yam"],
  props: [
    ...stores,
    {
      prop: "poundingMortar",
      family: "pounding-mortar",
      name: "Mortar and pestle",
      where: "door",
      chance: 0.75,
      with: [{ prop: "calabash", family: "calabash", name: "Calabash", dx: 1, dy: 1 }],
    },
    {
      prop: "calabash",
      family: "calabash",
      name: "Calabash",
      where: "wall",
      chance: 0.6,
      contents: { water: 2 },
    },
    {
      prop: "logHive",
      family: "log-hive",
      name: "Log hive",
      where: "yard",
      chance: 0.15,
    },
    {
      prop: "stockPen",
      family: "stock-pen",
      name: "Stock pen",
      where: "yard",
      chance: 0.5,
      role: /herd|drover|cattle|goat|farm/i,
    },
  ],
};

/** The trees a wet-tropics village plants or spares. Oil palm is African;
 * bananas reached the Americas in 1516 and mangoes the Caribbean about 1780
 * and inland Africa about 1800. */
export function keptTrees(setting: WorldSetting): string[] {
  const americas = setting.lon < -30;
  const africa = !americas && (setting.culture === "west-central-african" || setting.culture === "east-southern-african");
  const year = setting.year;
  if (Math.abs(setting.lat) < 25 && (setting.lon > 150 || setting.lon < -130))
    return ["nature-breadfruit", "nature-breadfruit", "nature-coconut-palm", "nature-pandanus", "nature-banana"];
  return [
    ...(africa ? ["nature-oil-palm", "nature-oil-palm"] : []),
    ...(!africa && (!americas || year >= 1550) && Math.abs(setting.lat) < 24 ? ["nature-coconut-palm"] : []),
    ...(year >= (americas ? 1520 : -500) ? ["nature-banana"] : []),
    ...(year >= (americas ? 1780 : africa ? 1800 : -1000) ? ["nature-mango"] : []),
  ];
}

/** South Asia: the rope bed out in the yard by day. */
const angan: YardKit = {
  id: "angan",
  boundary: "era",
  // Smeared afresh with clay and dung (lipai), which is what an angan is.
  ground: "daub",
  // The otla: a mud platform along the front, sat on and slept on.
  plinth: { face: "mud", apron: 1 },
  front: [2, 3],
  styles: { wrap: 0.55, side: 0.3, open: 0.15 },
  beds: ["vegetables", "beans"],
  props: [
    ...stores,
    {
      prop: "charpoy",
      family: "charpoy",
      name: "Rope bed",
      where: "yard",
      chance: 0.6,
    },
    {
      prop: "poundingMortar",
      family: "pounding-mortar",
      name: "Mortar and pestle",
      where: "door",
      chance: 0.4,
    },
  ],
};

/** A herding camp: no bed and no fence, the day's work out in the open by
 * the door -- curd and meat on the rack, a hide stretched, water for stock. */
const encampment: YardKit = {
  id: "encampment",
  boundary: "none",
  ground: "beaten",
  front: [1, 2],
  styles: { wrap: 0, side: 0, open: 1 },
  beds: [],
  props: [
    {
      prop: "dryingRack",
      family: "drying-rack",
      name: "Drying rack",
      where: "yard",
      chance: 0.5,
    },
    {
      prop: "hideFrame",
      family: "hide-frame",
      name: "Hide on a drying frame",
      where: "wall",
      chance: 0.35,
    },
    {
      prop: "trough",
      family: "trough",
      name: "Water trough",
      where: "yard",
      chance: 0.4,
      role: /herd|shepherd|drover|cattle|horse|camel/i,
      contents: { water: 4 },
    },
  ],
};

/** A band's camp: the family's own fire and whatever it is working on. The
 * shelter sprite carries the hearth and tools, so the ground stays clear. */
const bandCamp: YardKit = {
  id: "band",
  boundary: "none",
  ground: "beaten",
  front: [1, 2],
  styles: { wrap: 0, side: 0, open: 1 },
  beds: [],
  props: [],
};

/** A fishing village's frontage: nothing grown, the catch drying in front. */
const shoreYard: YardKit = {
  id: "shore",
  boundary: "none",
  front: [1, 2],
  styles: { wrap: 0, side: 0, open: 1 },
  beds: [],
  props: [
    {
      prop: "dryingRack",
      family: "drying-rack",
      name: "Fish-drying rack",
      where: "yard",
      chance: 0.6,
    },
  ],
};

export function yardKit(setting: WorldSetting | undefined): YardKit {
  if (!setting) return plain;
  // Island households farmed; their lifeway is a hamlet, not a band's camp.
  if (setting.culture === "australian-pacific" && setting.year < 1900 && Math.abs(setting.lat) < 25 && (setting.lon > 150 || setting.lon < -130))
    return { ...paepae, tree: { sprites: keptTrees(setting), chance: 0.7 } };
  const way = lifeway(setting);
  if (way && way.mode !== "mixed-farming")
    return way.mode === "nomadic-pastoral"
      ? encampment
      : way.mode === "sedentary-foraging"
        ? shoreYard
        : bandCamp;
  if (setting.year < -800) return croft;
  const { culture, climate, year } = setting;
  if (culture === "european" && climate === "mediterranean") return court;
  if (culture === "european" && year >= 400 && year < 1750) return toft;
  if (
    (culture === "european" && year >= 1750 && year < 1950) ||
    (culture === "other-indigenous-american" && year >= 1650 && year < 1950)
  )
    return cottage;
  if (culture === "north-african-west-asian") return climate === "arid" ? westAsian : court;
  if (culture === "mesoamerican" && year < 1900) return year < 1550 ? solar : colonialSolar;
  if (culture === "andean" && year < 1900) return andean;
  if (culture === "southeast-asian") return kampong;
  const forest = setting.environment?.ecology === "tropical-woodland";
  if (
    (culture === "west-central-african" || culture === "east-southern-african") &&
    year < 1900
  )
    return forest && keptTrees(setting).length ? { ...compound, id: "forest-compound", tree: { sprites: keptTrees(setting), chance: 0.75 } } : compound;
  if (culture === "south-asian" && year >= 1000 && year < 1950)
    return forest ? { ...angan, tree: { sprites: keptTrees(setting), chance: 0.7 } } : angan;
  if (culture === "east-asian") return setting.lon > 129.5 && setting.lat > 30 && setting.lat < 46 ? japanese : eastAsian;
  if (culture === "other-indigenous-american" && year < 1650 && !americasNorthwest(setting))
    return setting.lon < -103 && setting.lat < 38 ? pueblo : woodland;
  return plain;
}
