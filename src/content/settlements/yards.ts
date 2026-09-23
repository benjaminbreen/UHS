import type { WorldSetting } from "../geography/types";
import type { Boundary, CropId } from "../agriculture/types";
import { lifeway } from "./lifeways";

/** What stands in a household's yard, beyond the fence and the bed. `sprite`
 * is a prop family in the redrawn set; `where` says which part of the yard. */
export type YardProp = {
  prop: string;
  family: string;
  name: string;
  where: "bed" | "wall" | "door" | "yard";
  chance: number;
  /** Only for residents whose livelihood matches. */
  role?: RegExp;
  contents?: Record<string, number>;
};

export type YardKit = {
  id: string;
  /** Fence material; "era" chooses by culture, date and climate. */
  boundary: "era" | Boundary;
  /** Rows of open yard kept in front of the house. */
  front: readonly [number, number];
  /** Shares of yards that wrap the house, fence only the bed, or go unfenced. */
  styles: { wrap: number; side: number; open: number };
  beds: readonly CropId[];
  tree?: { sprites: readonly string[]; chance: number };
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
  },
];

/** Northern Europe, 400-1800: the toft. A fenced front yard, a vegetable bed
 * to one side, a fruit tree, and the stores of whoever lives there. */
const toft: YardKit = {
  id: "toft",
  boundary: "era",
  front: [2, 4],
  styles: { wrap: 0.55, side: 0.3, open: 0.15 },
  beds: ["vegetables", "vegetables", "beans", "flax"],
  tree: { sprites: ["oak"], chance: 0.5 },
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
      where: "yard",
      chance: 0.2,
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
      where: "yard",
      chance: 0.35,
    },
    {
      prop: "hayRick",
      family: "hay-rick",
      name: "Hay rick",
      where: "yard",
      chance: 0.5,
      role: /farm|plough|husband|peasant|herd|shepherd|dairy|cow|drover/i,
    },
    {
      prop: "dovecote",
      family: "dovecote",
      name: "Dovecote",
      where: "yard",
      chance: 0.1,
    },
  ],
};

/** The Mediterranean court: a walled yard to one side, no front garden, a
 * vine or a few vegetables, an olive in the corner. */
const court: YardKit = {
  id: "court",
  boundary: "era",
  front: [0, 0],
  styles: { wrap: 0, side: 0.75, open: 0.25 },
  beds: ["vine", "vegetables", "beans"],
  tree: { sprites: ["olive"], chance: 0.6 },
  props: [...stores],
};

/** Anywhere unresearched: a bed and the firewood, nothing period-specific. */
const plain: YardKit = {
  id: "plain",
  boundary: "era",
  front: [2, 3],
  styles: { wrap: 0.35, side: 0.35, open: 0.3 },
  beds: ["vegetables"],
  props: [...stores],
};

/** Before iron: wattle hurdles round a plot of emmer or pulses, a trough, a
 * rack. Mostly unfenced; stock was herded, not penned at the door. */
const croft: YardKit = {
  id: "croft",
  boundary: "era",
  front: [1, 2],
  styles: { wrap: 0.15, side: 0.4, open: 0.45 },
  beds: ["wheat", "barley", "beans", "flax"],
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

/** South Asia: the rope bed out in the yard by day. */
const angan: YardKit = {
  id: "angan",
  boundary: "era",
  front: [1, 3],
  styles: { wrap: 0.3, side: 0.4, open: 0.3 },
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
  const way = lifeway(setting);
  if (way)
    return way.mode === "nomadic-pastoral"
      ? encampment
      : way.mode === "sedentary-foraging"
        ? shoreYard
        : bandCamp;
  if (setting.year < -800) return croft;
  const { culture, climate, year } = setting;
  if (culture === "european" && climate === "mediterranean") return court;
  if (culture === "european" && year >= 400 && year < 1800) return toft;
  if (
    (culture === "west-central-african" || culture === "east-southern-african") &&
    year < 1900
  )
    return compound;
  if (culture === "south-asian" && year >= 1000 && year < 1950) return angan;
  return plain;
}
