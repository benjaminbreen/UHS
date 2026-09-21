import { urbanProps } from "./urban";
import type { Inventory } from "../../core/types";
import type { ShoveDef } from "../../core/shove";

export type PropDef = {
  name: string;
  family: string;
  portable?: boolean;
  /** Occupies its ground tile while intact and on the ground. */
  solid?: boolean;
  container?: boolean;
  /** What it leaves on the ground when it breaks. */
  breakable?:
    | "clay"
    | "glaze"
    | "wood"
    | "fiber"
    | "metal"
    | "plastic"
    | "paper";
  drink?: boolean;
  strike?: boolean;
  /** What this tool does to the ground in front of you. */
  tool?: "axe" | "spade" | "scythe" | "pick";
  /** How wide a bite it takes: one cell, or a swathe of them. */
  sweep?: number;
  contents?: Inventory;
  /** The settlement's shared fire. Keeps the `fire` object kind. */
  fire?: boolean;
  /** Sprite variants the family has; three unless said otherwise. */
  variants?: number;
  /** Too solid to break: a blow knocks it over instead. */
  tips?: boolean;
  /** How often the picker should land on this, relative to 1. A street of
   * pots is what an even roll gives you: the common vessels are damped so the
   * rarer yard furniture gets a turn. */
  rarity?: number;
  /** Whether a shoulder moves it, and how. Absent means it stands fast. */
  shove?: ShoveDef;
  /** Where this belongs. A washing line hangs behind a house, not on the
   * square; a crate stands at a works or a farm, not on a shopping street. */
  where?: "backyard" | "worksite" | "privy";
};
export const propDefs: Record<string, PropDef> = {
  ...urbanProps,
  hideBag: {
    solid: true,
    name: "Hide bag",
    family: "sack",
    portable: true,
    container: true,
  },
  pot: {
    rarity: 0.3,
    solid: true,
    name: "Earthen pot",
    family: "earthen-pot",
    portable: true,
    container: true,
    breakable: "clay",
  },
  jar: {
    rarity: 0.4,
    solid: true,
    name: "Storage jar",
    family: "storage-jar",
    portable: true,
    container: true,
    breakable: "clay",
  },
  jug: {
    rarity: 0.4,
    solid: true,
    name: "Water jug",
    family: "water-jug",
    portable: true,
    container: true,
    breakable: "clay",
    contents: { water: 2 },
  },
  amphora: {
    rarity: 0.6,
    solid: true,
    name: "Transport amphora",
    family: "amphora",
    portable: true,
    container: true,
    breakable: "clay",
  },
  vat: {
    shove: { as: "free", mass: 1.8 },
    solid: true,
    name: "Storage vat",
    family: "pithos",
    container: true,
    breakable: "clay",
    contents: { grain: 4 },
  },
  flask: {
    rarity: 0.5,
    solid: true,
    name: "Stoppered flask",
    family: "flask",
    portable: true,
    container: true,
    breakable: "clay",
    contents: { water: 1 },
  },
  bowl: {
    rarity: 0.5,
    solid: true,
    name: "Open bowl",
    family: "bowl",
    portable: true,
    container: true,
    breakable: "clay",
  },
  glazed: {
    solid: true,
    name: "Glazed jar",
    family: "glazed-jar",
    portable: true,
    container: true,
    breakable: "glaze",
  },
  basket: {
    rarity: 0.6,
    solid: true,
    name: "Woven basket",
    family: "open-basket",
    portable: true,
    container: true,
    breakable: "fiber",
    tips: true,
  },
  liddedBasket: {
    solid: true,
    name: "Lidded basket",
    family: "lidded-basket",
    portable: true,
    container: true,
    breakable: "fiber",
    tips: true,
  },
  sack: {
    solid: true,
    name: "Cloth sack",
    family: "sack",
    portable: true,
    container: true,
  },
  standingStone: {
    solid: true,
    name: "Standing stone",
    family: "standing-stone",
    variants: 5,
  },
  waymark: {
    solid: true,
    name: "Waymark",
    family: "waymark",
    variants: 4,
  },
  waysideShrine: {
    solid: true,
    name: "Wayside shrine",
    family: "wayside-shrine",
    variants: 4,
  },
  hayRick: {
    solid: true,
    name: "Hay rick",
    family: "hay-rick",
    container: true,
  },
  dovecote: {
    solid: true,
    name: "Dovecote",
    family: "dovecote",
  },
  chickenCoop: {
    solid: true,
    name: "Henhouse",
    family: "chicken-coop",
    container: true,
  },
  crateStack: {
    rarity: 0.6,
    solid: true,
    name: "Stacked crates",
    family: "crate-stack",
    container: true,
  },
  grainSacks: {
    solid: true,
    name: "Grain sacks",
    family: "grain-sacks",
    container: true,
    contents: { grain: 2 },
  },
  flowerTub: {
    rarity: 0.8,
    solid: true,
    name: "Planted tub",
    family: "flower-tub",
  },
  chest: {
    shove: { as: "free", mass: 1.4 },
    solid: true,
    name: "Wooden chest",
    family: "bound-chest",
    portable: true,
    container: true,
    breakable: "wood",
  },
  cookingPot: {
    solid: true,
    name: "Cooking pot",
    family: "cooking-pot",
    portable: true,
    container: true,
    tips: true,
  },
  strappedChest: {
    shove: { as: "free", mass: 1.6 },
    solid: true,
    name: "Strapped chest",
    family: "strapped-chest",
    portable: true,
    container: true,
    breakable: "wood",
  },
  paintedChest: {
    shove: { as: "free", mass: 1.4 },
    solid: true,
    name: "Painted chest",
    family: "painted-chest",
    portable: true,
    container: true,
    breakable: "wood",
  },
  /** Wild stone, not yard furniture: placed by the land rather than a
   * settlement, and drawn from the nature atlas in the local stone colour. */
  boulder: {
    solid: true,
    name: "Boulder",
    family: "boulder",
    shove: { as: "free", mass: 2.6, rolls: true },
  },
  crate: {
    shove: { as: "free", mass: 1 },
    rarity: 0.7,
    where: "worksite",
    solid: true,
    name: "Transport crate",
    family: "crate",
    portable: true,
    container: true,
    breakable: "wood",
  },
  barrel: {
    shove: { as: "free", mass: 1 },
    solid: true,
    name: "Wooden barrel",
    family: "barrel",
    portable: true,
    container: true,
    breakable: "wood",
  },
  bucket: {
    rarity: 0.6,
    solid: true,
    name: "Wooden pail",
    family: "bucket",
    portable: true,
    container: true,
    breakable: "wood",
    tips: true,
  },
  well: {
    solid: true,
    name: "Communal well",
    family: "well",
    drink: true,
  },
  roofedWell: {
    solid: true,
    name: "Roofed well",
    family: "framed-well",
    drink: true,
  },
  spring: {
    solid: true,
    name: "Spring-water basin",
    family: "trough",
    drink: true,
  },
  trough: {
    shove: { as: "free", mass: 2 },
    solid: true,
    name: "Animal trough",
    family: "trough",
    container: true,
    contents: { water: 4 },
  },
  townWell: {
    solid: true,
    name: "Public well",
    family: "town-well",
    drink: true,
  },
  sickle: {
    solid: true,
    name: "Sickle",
    family: "sickle",
    portable: true,
    strike: true,
    tool: "scythe",
  },
  axe: {
    solid: true,
    name: "Hafted axe",
    family: "hoe",
    portable: true,
    strike: true,
    tool: "axe",
  },
  pick: {
    solid: true,
    name: "Pickaxe",
    family: "pick",
    portable: true,
    strike: true,
    tool: "pick",
  },
  dryingRack: {
    where: "worksite",
    solid: true,
    name: "Drying rack",
    family: "drying-rack",
    container: true,
  },
  pump: {
    solid: true,
    name: "Hand pump",
    family: "pump",
    drink: true,
  },
  spade: {
    solid: true,
    name: "Spade",
    family: "spade",
    portable: true,
    strike: true,
    tool: "spade",
  },
  shovel: {
    solid: true,
    name: "Long shovel",
    family: "shovel",
    portable: true,
    strike: true,
    tool: "spade",
    // A navvy's shovel opens the cell you face and the one beyond it.
    sweep: 2,
    where: "worksite",
  },
  scythe: {
    solid: true,
    name: "Scythe",
    family: "scythe",
    portable: true,
    strike: true,
    tool: "scythe",
    // A swathe, not a handful: four cells to the sickle's one.
    sweep: 2,
    where: "worksite",
  },
  sheaf: {
    solid: true,
    name: "Sheaf of grain",
    family: "sheaf",
    container: true,
    breakable: "fiber",
    contents: { grain: 2 },
  },
  anvil: {
    shove: { as: "free", mass: 3.2 },
    solid: true,
    name: "Anvil and block",
    family: "anvil",
  },
  loom: {
    solid: true,
    name: "Upright loom",
    family: "loom",
  },
  bench: {
    shove: { as: "free", mass: 1.2 },
    solid: true,
    name: "Bench",
    family: "bench",
  },
  stool: {
    shove: { as: "free", mass: 0.5 },
    solid: true,
    name: "Stool",
    family: "stool",
    portable: true,
    tips: true,
  },
  privyShed: {
    solid: true,
    name: "Privy",
    family: "privy-shed",
    where: "privy",
  },
  privyScreen: {
    solid: true,
    name: "Screened pit",
    family: "privy-screen",
    where: "privy",
  },
  privyBench: {
    solid: true,
    name: "Public latrine",
    family: "privy-bench",
    where: "privy",
  },
  privyStone: {
    solid: true,
    name: "Stone privy",
    family: "privy-stone",
    where: "privy",
  },
  privyNightSoil: {
    solid: true,
    name: "Privy",
    family: "privy-nightsoil",
    where: "privy",
  },
  privyOuthouse: {
    solid: true,
    name: "Outhouse",
    family: "privy-outhouse",
    where: "privy",
  },
  privyMidden: {
    solid: true,
    name: "Midden",
    family: "privy-midden",
    where: "privy",
  },
  privyDung: {
    solid: true,
    name: "Dung heap",
    family: "privy-dung",
    where: "privy",
  },
  granaryStaddle: {
    solid: true,
    name: "Granary",
    family: "granary-staddle",
    container: true,
    contents: { grain: 12 },
    where: "worksite",
  },
  granaryMud: {
    solid: true,
    name: "Granary",
    family: "granary-mud",
    container: true,
    contents: { grain: 12 },
    where: "worksite",
  },
  granaryStilt: {
    solid: true,
    name: "Granary",
    family: "granary-stilt",
    container: true,
    contents: { grain: 12 },
    where: "worksite",
  },
  granaryClay: {
    solid: true,
    name: "Grain silo",
    family: "granary-clay",
    container: true,
    contents: { grain: 12 },
    where: "worksite",
  },
  // Both hang above head height, so neither blocks the cell it stands on.
  shopSign: {
    solid: false,
    name: "Shop sign",
    family: "shop-sign",
  },
  shopSignEuro: {
    solid: false,
    name: "Shop sign",
    family: "sign-hanging",
    // One board per trade, plus a bell for a house that is not a shop.
    variants: 7,
  },
  shopSignSouk: {
    solid: false,
    name: "Shop sign",
    family: "sign-souk",
    // The same seven trades as the European board, hung rather than painted.
    variants: 7,
  },
  doorLantern: {
    solid: false,
    name: "Door lanterns",
    family: "door-lantern",
  },
  hitchingPost: {
    solid: true,
    name: "Hitching post",
    family: "hitching-post",
  },
  beamScale: {
    solid: true,
    name: "Beam scale",
    family: "beam-scale",
  },
  plough: {
    shove: { as: "axle", axis: "x", mass: 2.2 },
    solid: true,
    name: "Plough",
    family: "plough",
    where: "worksite",
  },
  waterButt: {
    solid: true,
    name: "Water butt",
    family: "water-butt",
    container: true,
    contents: { water: 6 },
    where: "backyard",
  },
  rake: {
    solid: true,
    name: "Rake",
    family: "rake",
    portable: true,
    strike: true,
    where: "backyard",
  },
  pitchfork: {
    solid: true,
    name: "Pitchfork",
    family: "pitchfork",
    portable: true,
    strike: true,
    where: "backyard",
  },
  beehive: {
    solid: true,
    name: "Beehive",
    family: "beehive",
    where: "worksite",
  },
  logHive: {
    solid: true,
    name: "Log hive",
    family: "log-hive",
    where: "worksite",
  },
  calabash: {
    rarity: 0.5,
    solid: true,
    name: "Calabash",
    family: "calabash",
    portable: true,
    container: true,
    breakable: "wood",
    contents: { water: 2 },
  },
  poundingMortar: {
    shove: { as: "free", mass: 1.4 },
    solid: true,
    name: "Mortar and pestle",
    family: "pounding-mortar",
    container: true,
    tips: true,
  },
  charpoy: {
    shove: { as: "free", mass: 1.0 },
    solid: true,
    name: "Rope bed",
    family: "charpoy",
    where: "backyard",
  },
  stockPen: {
    solid: true,
    name: "Stock pen",
    family: "stock-pen",
    where: "worksite",
  },
  milkChurn: {
    solid: true,
    name: "Milk churn",
    family: "milk-churn",
    container: true,
    portable: true,
    where: "worksite",
  },
  farmCart: {
    shove: { as: "axle", axis: "x", mass: 2.4 },
    solid: true,
    name: "Farm cart",
    family: "farm-cart",
    container: true,
    where: "worksite",
  },
  firepit: {
    solid: true,
    name: "Shared firepit",
    family: "hearth",
    fire: true,
    variants: 1,
  },
  threeStoneHearth: {
    solid: true,
    name: "Three-stone hearth",
    family: "three-stone-hearth",
    fire: true,
    variants: 1,
  },
  longFire: {
    solid: true,
    name: "Long fire",
    family: "long-fire",
    fire: true,
    variants: 1,
  },
  tannur: {
    solid: true,
    name: "Sunken clay oven",
    family: "tannur",
    fire: true,
  },
  brazier: {
    solid: true,
    name: "Standing brazier",
    family: "brazier",
    fire: true,
    variants: 2,
  },
  bakeOven: {
    solid: true,
    name: "Communal bake oven",
    family: "oven",
    fire: true,
  },
  teaStove: {
    solid: true,
    name: "Stove and kettle",
    family: "stove",
    fire: true,
  },
  fireBasket: {
    solid: true,
    name: "Iron fire basket",
    family: "fire-basket",
    fire: true,
    variants: 1,
  },
  drumFire: {
    solid: true,
    name: "Oil-drum fire",
    family: "oil-drum",
    fire: true,
    variants: 1,
  },
  woodpile: {
    where: "worksite",
    solid: true,
    name: "Firewood stack",
    family: "woodpile",
    container: true,
    contents: { wood: 3 },
  },
  grinder: {
    solid: true,
    name: "Grinding stone",
    family: "grinder",
    // The atlas only carries two; the default of three asked for a frame
    // that does not exist and Phaser warned on every draw.
    variants: 2,
  },
  dustbin: {
    shove: { as: "free", mass: 0.8 },
    rarity: 0.5,
    where: "backyard",
    solid: true,
    name: "Galvanised bin",
    family: "dustbin",
    container: true,
    tips: true,
  },
  drum: {
    shove: { as: "free", mass: 1.5 },
    where: "worksite",
    solid: true,
    name: "Steel drum",
    family: "steel-drum",
    container: true,
    contents: { water: 6 },
    tips: true,
  },
  barrow: {
    shove: { as: "axle", axis: "x", mass: 1.4 },
    where: "worksite",
    solid: true,
    name: "Wheelbarrow",
    family: "wheelbarrow",
    container: true,
  },
  washingLine: {
    where: "backyard",
    solid: true,
    name: "Washing line",
    family: "washing-line",
  },
  tin: {
    rarity: 0.5,
    solid: true,
    name: "Metal canister",
    family: "metal-tin",
    portable: true,
    container: true,
    breakable: "metal",
  },
  plastic: {
    rarity: 0.35,
    solid: true,
    name: "Plastic bucket",
    family: "plastic-bin",
    portable: true,
    container: true,
    breakable: "plastic",
  },
  carton: {
    solid: true,
    name: "Cardboard carton",
    family: "cardboard-box",
    portable: true,
    container: true,
    breakable: "paper",
  },
  stick: {
    solid: false,
    name: "Stout stick",
    family: "stick",
    portable: true,
    strike: true,
    variants: 1,
  },
  /** The hunting weapon of every period before the gun, and most after. */
  spear: {
    solid: false,
    name: "Spear",
    family: "spear",
    portable: true,
    strike: true,
    where: "backyard",
  },
  /** The same length of wood, found rather than kept: it lies under trees in
   * every period, so there is always something to hand to swing. */
  branch: {
    solid: false,
    name: "Fallen branch",
    family: "stick",
    portable: true,
    strike: true,
    variants: 1,
  },
};
export { propKit } from "./selection";
export type { PropContext, PropKit } from "./selection";
