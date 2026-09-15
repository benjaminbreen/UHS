import { urbanProps } from "./urban";
import type { Inventory } from "../../core/types";

export type PropDef = {
  name: string;
  family: string;
  portable?: boolean;
  /** Occupies its ground tile while intact and on the ground. */
  solid?: boolean;
  container?: boolean;
  breakable?: "clay" | "wood" | "fiber";
  drink?: boolean;
  strike?: boolean;
  contents?: Inventory;
  /** The settlement's shared fire. Keeps the `fire` object kind. */
  fire?: boolean;
  /** Sprite variants the family has; three unless said otherwise. */
  variants?: number;
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
    solid: true,
    name: "Earthen pot",
    family: "earthen-pot",
    portable: true,
    container: true,
    breakable: "clay",
  },
  jar: {
    solid: true,
    name: "Storage jar",
    family: "storage-jar",
    portable: true,
    container: true,
    breakable: "clay",
  },
  jug: {
    solid: true,
    name: "Water jug",
    family: "water-jug",
    portable: true,
    container: true,
    breakable: "clay",
    contents: { water: 2 },
  },
  amphora: {
    solid: true,
    name: "Transport amphora",
    family: "amphora",
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
    breakable: "clay",
  },
  basket: {
    solid: true,
    name: "Woven basket",
    family: "open-basket",
    portable: true,
    container: true,
    breakable: "fiber",
  },
  liddedBasket: {
    solid: true,
    name: "Lidded basket",
    family: "lidded-basket",
    portable: true,
    container: true,
    breakable: "fiber",
  },
  sack: {
    solid: true,
    name: "Cloth sack",
    family: "sack",
    portable: true,
    container: true,
  },
  chest: {
    solid: true,
    name: "Wooden chest",
    family: "bound-chest",
    portable: true,
    container: true,
    breakable: "wood",
  },
  paintedChest: {
    solid: true,
    name: "Painted chest",
    family: "painted-chest",
    portable: true,
    container: true,
    breakable: "wood",
  },
  crate: {
    solid: true,
    name: "Transport crate",
    family: "crate",
    portable: true,
    container: true,
    breakable: "wood",
  },
  barrel: {
    solid: true,
    name: "Wooden barrel",
    family: "barrel",
    portable: true,
    container: true,
    breakable: "wood",
  },
  bucket: {
    solid: true,
    name: "Wooden pail",
    family: "bucket",
    portable: true,
    container: true,
    breakable: "wood",
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
    solid: true,
    name: "Animal trough",
    family: "trough",
    container: true,
    contents: { water: 4 },
  },
  firepit: {
    solid: true,
    name: "Shared firepit",
    family: "hearth",
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
  tin: {
    solid: true,
    name: "Metal canister",
    family: "metal-tin",
    portable: true,
    container: true,
  },
  plastic: {
    solid: true,
    name: "Plastic bucket",
    family: "plastic-bin",
    portable: true,
    container: true,
  },
  carton: {
    solid: true,
    name: "Cardboard carton",
    family: "cardboard-box",
    portable: true,
    container: true,
  },
  stick: {
    solid: false,
    name: "Stout stick",
    family: "stick",
    portable: true,
    strike: true,
    variants: 1,
  },
};
export { propKit } from "./selection";
export type { PropContext, PropKit } from "./selection";
