import type { WorldSetting } from "../geography/types";
import type { Boundary, CropId } from "../agriculture/types";
import { lifeway, westernZhouFarm } from "./lifeways";
import type { EarthFinish } from "./urban-form/types";
import type { StreetMaterial } from "./streets";

export type GardenBorder = "flowers" | "herbs" | "shrubs";
export type GardenBedStyle = "timber" | "brick" | "stone" | "bamboo" | "earth";
export type WalkSurface = StreetMaterial | EarthFinish | "stepping";

/** What a house platform is faced with. plaster: lime stucco over rubble.
 * dressed: squared kerb stones round rammed earth. drystone: stacked field
 * stone under a pebble floor. mud: raised earth smeared with clay. earth: a
 * turfed bank under a clay cap. */
export type PlinthFace = "plaster" | "dressed" | "drystone" | "mud" | "earth";

/** What stands in a household's yard, beyond the fence and the bed. `sprite`
 * is a prop family in the redrawn set; `where` says which part of the yard. */
export type OutbuildingForm =
  | "timber"
  | "brick"
  | "wattle"
  | "stone"
  | "med"
  | "adobe"
  | "bamboo"
  | "east";
export type HenhouseForm = Exclude<OutbuildingForm, "stone" | "med">;

export type YardProp = {
  prop: string;
  family: string;
  /** Sprite variants, for a family with no entry in the prop catalogue. */
  variants?: number;
  /** Pin a specific regional/era variant index instead of rolling across all variants. */
  variant?: number;
  /** An animal house: where the yard has room, a small building of this
   * kind and make stands in the back corner. A henhouse falls back to the
   * coop prop; a byre to nothing. */
  building?:
    | { kind: "byre"; form: OutbuildingForm }
    | { kind: "stable"; form: OutbuildingForm }
    | { kind: "henhouse"; form: HenhouseForm };
  name: string;
  /** An apron uses the kept ground at the front even when a full yard cannot fit. */
  where: "bed" | "wall" | "door" | "apron" | "yard" | "back";
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
  /** Front walkway & threshold apron finish, chosen per household from this list. */
  walk?: readonly WalkSurface[];
  /** Depth (cells) of the paved or kept threshold apron along the front wall. */
  apron?: number;
  /** Low ornamental or kitchen planting flanking the front walk/wall. */
  border?: GardenBorder;
  /** Edging style for kitchen garden beds. */
  bed?: GardenBedStyle;
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
const byre = (form: OutbuildingForm, chance = 0.2): YardProp => ({
  prop: "byre",
  family: "byre",
  name: "Byre",
  where: "back",
  chance,
  building: { kind: "byre", form },
});
const stable = (form: OutbuildingForm, chance = 0.16): YardProp => ({
  prop: "stable",
  family: "stable",
  name: "Stable",
  where: "back",
  chance,
  building: { kind: "stable", form },
});
const toft: YardKit = {
  id: "toft",
  boundary: "era",
  // The yard at the door was trodden mud; the green was the garth behind.
  ground: "beaten",
  walk: ["beaten", "cobble"],
  apron: 1,
  border: "herbs",
  bed: "timber",
  front: [2, 4],
  back: [2, 4],
  styles: { wrap: 0.55, side: 0.3, open: 0.15 },
  beds: ["vegetables", "turnip", "beans", "flax"],
  tree: { sprites: ["nature-cherry", "nature-oak", "nature-chestnut", "nature-beech"], chance: 0.72 },
  props: [
    byre("wattle"),
    ...stores,
    {
      prop: "scarecrow",
      family: "scarecrow",
      variants: 6,
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
      variant: 0,
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
      building: { kind: "henhouse", form: "wattle" },
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
  ground: "lime",
  walk: ["slab", "cobble"],
  apron: 2,
  border: "herbs",
  bed: "stone",
  front: [1, 2],
  styles: { wrap: 0.25, side: 0.6, open: 0.15 },
  beds: ["vine", "vegetables", "lentils", "beans"],
  tree: { sprites: ["nature-olive", "nature-olive", "nature-fig", "nature-cypress"], chance: 0.8 },
  props: [
    ...stores,
    byre("med"),
    { prop: "flowerTub", family: "flower-tub", variant: 1, name: "Terracotta planter", where: "door", chance: 0.55 },
  ],
};

const coop: YardProp = {
  prop: "chickenCoop",
  family: "chicken-coop",
  name: "Henhouse",
  where: "back",
  chance: 0.45,
  building: { kind: "henhouse", form: "timber" },
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
  walk: ["stepping", "cobble", "brick"],
  apron: 1,
  border: "flowers",
  bed: "timber",
  front: [2, 3],
  back: [3, 4],
  styles: { wrap: 0.7, side: 0.2, open: 0.1 },
  beds: ["vegetables", "potato", "beans", "turnip"],
  tree: { sprites: ["nature-cherry", "nature-broadleaf-young", "nature-chestnut", "nature-maple"], chance: 0.78 },
  props: [
    byre("timber"),
    ...stores,
    coop,
    washing,
    {
      prop: "flowerTub",
      family: "flower-tub",
      variant: 0,
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
  walk: ["slab", "swept"],
  apron: 1,
  border: "flowers",
  bed: "earth",
  plinth: { face: "plaster", apron: 2 },
  mound: { face: "plaster", rise: 13 },
  group: 0.6,
  front: [3, 4],
  back: [2, 3],
  styles: { wrap: 0.45, side: 0.35, open: 0.2 },
  beds: ["maize", "beans", "squash", "maize"],
  tree: { sprites: ["nature-tropical-broadleaf", "nature-ceiba", "nature-ahuehuete"], chance: 0.75 },
  props: [
    ...stores,
    { ...coop, name: "Turkey pen", chance: 0.5, building: { kind: "henhouse", form: "adobe" } },
    { prop: "metate", family: "metate", name: "Metate and mano", where: "door", chance: 0.8 },
    { prop: "jar", family: "storage-jar", name: "Water jar", where: "door", chance: 0.7 },
    { prop: "threeStoneHearth", family: "three-stone-hearth", name: "Three-stone hearth", where: "yard", chance: 0.5 },
  ],
};

/** After the conquest the congregated towns built at ground level; the lot,
 * its crops and its swept yard carried on. */
const colonialSolar: YardKit = {
  ...solar,
  id: "colonial-solar",
  plinth: undefined,
  mound: undefined,
  group: undefined,
  front: [1, 2],
  tree: { sprites: ["nature-banana", "nature-fig", "nature-tropical-broadleaf"], chance: 0.78 },
};

/** The Andes: a stone-walled patio and a plot of tubers and grain beside it;
 * few trees at that height. */
const andean: YardKit = {
  id: "andean",
  boundary: "wall",
  ground: "beaten",
  walk: ["cobble", "slab"],
  apron: 1,
  bed: "stone",
  front: [1, 2],
  back: [1, 2],
  // The kancha: houses inside one fieldstone wall.
  styles: { wrap: 0.8, side: 0.15, open: 0.05 },
  beds: ["potato", "quinoa", "potato", "maize"],
  tree: { sprites: ["nature-polylepis"], chance: 0.35 },
  props: [...stores, byre("stone", 0.18)],
};

/** Southeast Asia: a yard under fruit trees and palms, hens loose beneath
 * the house, and a fenced bed of taro and greens to keep the stock out. */
const kampong: YardKit = {
  id: "kampong",
  boundary: "era",
  ground: "swept",
  walk: ["stepping", "plank", "swept"],
  apron: 1,
  border: "shrubs",
  bed: "bamboo",
  front: [1, 3],
  back: [2, 3],
  styles: { wrap: 0.35, side: 0.45, open: 0.2 },
  beds: ["taro", "vegetables", "yam"],
  tree: { sprites: ["nature-banana", "nature-coconut-palm", "nature-mango", "nature-feather-palm"], chance: 0.85 },
  props: [
    ...stores,
    { ...coop, chance: 0.4, building: { kind: "henhouse", form: "bamboo" } },
    byre("bamboo", 0.15),
  ],
};

/** Anywhere unresearched: a bed and the firewood, nothing period-specific. */
const plain: YardKit = {
  id: "plain",
  boundary: "era",
  walk: ["gravel", "slab"],
  apron: 1,
  border: "shrubs",
  bed: "timber",
  front: [2, 3],
  styles: { wrap: 0.35, side: 0.35, open: 0.3 },
  beds: ["vegetables"],
  tree: { chance: 0.65 },
  props: [...stores],
};

const zhouFarm: YardKit = {
  id: "zhou-farm",
  boundary: "era",
  ground: "swept",
  walk: ["swept"],
  apron: 1,
  bed: "earth",
  front: [2, 4],
  styles: { wrap: 0.15, side: 0.4, open: 0.45 },
  beds: ["millet", "millet", "beans"],
  props: [
    {
      prop: "poundingMortar", family: "pounding-mortar", name: "Millet mortar", where: "apron", chance: 1, contents: { grain: 2 },
      with: [{ prop: "basket", family: "open-basket", name: "Gathering basket", contents: { reeds: 2 }, dx: 2, dy: 0 }],
    },
    { prop: "jar", family: "storage-jar", name: "Storage jar", where: "yard", chance: 0.55 },
  ],
};

/** China, Korea and Japan: a bamboo clump or a broadleaf behind the house.
 * Sweetgum and camphor were the planted village trees of the south; the
 * maple stands in for both. The house stands on a stone-kerbed footing of
 * rammed earth (taiji, gidan), and the yard is beaten flat for threshing. */
const eastAsian: YardKit = {
  ...plain,
  id: "east-asian",
  ground: "beaten",
  walk: ["stepping", "slab", "brick"],
  apron: 1,
  border: "shrubs",
  bed: "brick",
  plinth: { face: "dressed", apron: 1 },
  mound: { face: "dressed", rise: 9, sacred: true },
  back: [2, 3],
  styles: { wrap: 0.6, side: 0.25, open: 0.15 },
  beds: ["vegetables", "turnip", "beans", "mulberry"],
  tree: { sprites: ["nature-bamboo-clump", "nature-ginkgo", "nature-maple", "nature-cherry"], chance: 0.78 },
  props: [
    ...stores,
    { ...coop, chance: 0.35, building: { kind: "henhouse", form: "east" } },
    byre("east", 0.18),
    { prop: "flowerTub", family: "flower-tub", variant: 2, name: "Potted azalea", where: "door", chance: 0.45 },
  ],
};

/** Japan: the farmhouse stands on footing stones at ground level, with a
 * beaten working yard (niwa) before it; shrines and halls keep the stone
 * terrace. */
const japanese: YardKit = {
  ...eastAsian,
  id: "japanese",
  ground: "gravel",
  walk: ["stepping", "slab"],
  border: "shrubs",
  bed: "bamboo",
  beds: ["vegetables", "turnip", "beans", "tea"],
  tree: { sprites: ["nature-cherry", "nature-japanese-maple", "nature-bamboo-clump", "nature-ginkgo"], chance: 0.85 },
  plinth: undefined,
};

/** Polynesia: the house on a paepae, a platform of stacked field stone
 * floored with water-worn pebbles, in a swept yard under breadfruit and
 * coconut. Documented for Hawaii, the Marquesas and the Society Islands. */
const paepae: YardKit = {
  ...plain,
  id: "paepae",
  ground: "swept",
  walk: ["sand"],
  apron: 1,
  border: undefined,
  bed: "earth",
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
  bed: "earth",
  mound: { face: "earth", rise: 13, sacred: true },
  back: [2, 3],
  styles: { wrap: 0.05, side: 0.35, open: 0.6 },
  beds: ["maize", "beans", "squash"],
  props: [
    ...stores,
    { prop: "poundingMortar", family: "pounding-mortar", name: "Corn mortar", where: "door", chance: 0.6 },
    { prop: "granaryStilt", family: "granary-stilt", variant: 2, name: "Corn crib", where: "back", chance: 0.5 },
  ],
};
const americasNorthwest = (s: WorldSetting) => s.lon < -115 && s.lat > 40;

/** The Pueblo Southwest: room blocks round a plaza of beaten earth, the
 * grinding done at the door. */
const pueblo: YardKit = {
  ...plain,
  id: "pueblo",
  ground: "beaten",
  walk: ["beaten"],
  apron: 1,
  border: undefined,
  bed: "earth",
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
  walk: ["slab", "daub"],
  apron: 1,
  border: undefined,
  bed: "earth",
  front: [2, 3],
  styles: { wrap: 0.7, side: 0.25, open: 0.05 },
  beds: ["vegetables", "lentils", "vine"],
  tree: { sprites: ["nature-date-palm", "nature-date-palm", "nature-fig", "nature-olive"], chance: 0.78 },
  props: [
    ...stores,
    { ...coop, chance: 0.3, building: { kind: "henhouse", form: "adobe" } },
    byre("adobe", 0.18),
  ],
};

/** Before iron: wattle hurdles round a plot of emmer or pulses, a trough, a
 * rack. Mostly unfenced; stock was herded, not penned at the door. */
const croft: YardKit = {
  id: "croft",
  boundary: "era",
  ground: "beaten",
  bed: "earth",
  front: [1, 2],
  styles: { wrap: 0.15, side: 0.4, open: 0.45 },
  beds: ["wheat", "barley", "beans", "flax"],
  tree: { chance: 0.6 },
  props: [
    byre("stone"),
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
  walk: ["swept"],
  apron: 1,
  bed: "earth",
  front: [2, 3],
  styles: { wrap: 0.1, side: 0.3, open: 0.6 },
  beds: ["sorghum", "millet", "beans", "yam"],
  tree: { sprites: ["nature-shea", "nature-acacia", "nature-baobab"], chance: 0.7 },
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
  walk: ["daub", "brick"],
  apron: 1,
  border: "flowers",
  bed: "bamboo",
  // The otla: a mud platform along the front, sat on and slept on.
  plinth: { face: "mud", apron: 1 },
  front: [2, 3],
  styles: { wrap: 0.55, side: 0.3, open: 0.15 },
  beds: ["vegetables", "lentils", "beans"],
  tree: { sprites: ["nature-mango", "nature-banana", "nature-neem", "nature-banyan"], chance: 0.82 },
  props: [
    byre("adobe"),
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
    {
      prop: "flowerTub",
      family: "flower-tub",
      variant: 3,
      name: "Tulsi planter",
      where: "door",
      chance: 0.65,
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

const withOutbuildings = (
  kit: YardKit,
  byreForm: OutbuildingForm,
  henForm?: HenhouseForm,
): YardKit => {
  const mapped = kit.props.map((p) =>
    p.building?.kind === "byre"
      ? { ...p, building: { kind: "byre" as const, form: byreForm } }
      : p.building?.kind === "stable"
        ? { ...p, building: { kind: "stable" as const, form: byreForm } }
        : henForm && p.building?.kind === "henhouse"
          ? { ...p, building: { kind: "henhouse" as const, form: henForm } }
          : p,
  );
  const hasByre = mapped.some((p) => p.building?.kind === "byre");
  const hasStable = mapped.some((p) => p.building?.kind === "stable");
  return {
    ...kit,
    props: hasByre && !hasStable ? [...mapped, stable(byreForm)] : mapped,
  };
};

const ensureStable = (kit: YardKit): YardKit => {
  const b = kit.props.find((p) => p.building?.kind === "byre");
  if (!b || kit.props.some((p) => p.building?.kind === "stable")) return kit;
  return { ...kit, props: [...kit.props, stable(b.building!.form as OutbuildingForm)] };
};

export function yardKit(setting: WorldSetting | undefined): YardKit {
  return ensureStable(rawYardKit(setting));
}

function rawYardKit(setting: WorldSetting | undefined): YardKit {
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
  if (westernZhouFarm(setting)) return zhouFarm;
  if (setting.year < -800) return croft;
  const { culture, climate, year } = setting;
  if (culture === "european" && climate === "mediterranean") return court;
  if (culture === "european" && year >= 400 && year < 1750) return toft;
  if (
    (culture === "european" && year >= 1750) ||
    (culture === "other-indigenous-american" && year >= 1650 && year < 1950)
  )
    return culture === "european" && year >= 1800
      ? withOutbuildings(cottage, "brick", "brick")
      : cottage;
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
  if (culture === "south-asian" && year >= 1000) {
    const base =
      climate === "arid"
        ? { ...angan, bed: "earth" as const, tree: { sprites: ["nature-neem", "nature-date-palm", "nature-acacia"], chance: 0.68 } }
        : withOutbuildings(angan, "bamboo", "bamboo");
    return forest ? { ...base, tree: { sprites: keptTrees(setting), chance: 0.85 } } : base;
  }
  if (culture === "east-asian") {
    if (setting.lon > 129.5 && setting.lat > 30 && setting.lat < 46) return japanese;
    return climate === "monsoon" || climate === "tropical"
      ? { ...eastAsian, bed: "bamboo" }
      : eastAsian;
  }
  if (culture === "other-indigenous-american" && year < 1650 && !americasNorthwest(setting))
    return setting.lon < -103 && setting.lat < 38 ? pueblo : woodland;
  return plain;
}
