import type { GarmentKit } from "./types";
import { clothPalettes } from "./regions/cloth-palettes";
import {
  eastSouthernAfrica,
  westCentralAfrica,
} from "./regions/africa";
import { americas } from "./regions/americas";
import { specialSets } from "./regions/special";
import {
  australiaPacific,
  indigenousAmerican,
} from "./regions/pacific-indigenous";
import { eastAsia } from "./regions/east-asia";
import { europe } from "./regions/europe";
import { innerEurasia } from "./regions/inner-eurasia";
import { southAsia } from "./regions/south-asia";
import { southeastAsia } from "./regions/southeast-asia";
import { westAsiaNorthAfrica } from "./regions/west-asia-north-africa";

/** Era floors. These are qualified visual defaults, not reconstructions: they
 * say only what the period could make, so a bowler never turns up in the
 * Neolithic and a wide-brim straw hat is available wherever the sun is. A
 * regional kit that overlaps one of these wins on every slot it names, and
 * inherits the rest. */
export const eraFloors: readonly GarmentKit[] = [
  {
    id: "floor-prehistoric",
    label: "Before the loom is ordinary",
    scope: { years: [-1000000, -3000] },
    garment: [
      { value: "wrap", weight: 3 },
      { value: "tunic", weight: 2 },
      { value: "skirt" },
      { value: "none", weight: 2, sex: ["male"] },
      { value: "none", ages: ["child"], weight: 3 },
    ],
    headwear: [{ value: "none", weight: 6 }, { value: "band" }],
    leggings: [{ value: "none", weight: 5 }, { value: "wrapped" }],
    footwear: [{ value: "none", weight: 4 }, { value: "sandals", weight: 2 }],
    belt: [{ value: "cord", weight: 3 }, { value: "none", weight: 2 }],
    over: [{ value: "none", weight: 6 }, { value: "shoulder-cloth" }],
  },
  {
    id: "floor-ancient",
    label: "Woven cloth, mostly undyed",
    scope: { years: [-3000, 500] },
    garment: [
      { value: "tunic", weight: 4 },
      { value: "long-tunic", weight: 3 },
      { value: "wrap", weight: 2 },
      { value: "robe", weight: 2, means: ["wealthy"] },
      { value: "skirt", weight: 2, sex: ["female"] },
      { value: "none", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "band", weight: 2 },
      { value: "wrap", weight: 2 },
      { value: "brimmed", livelihoods: ["farmer", "herder", "gatherer"] },
      { value: "conical", weight: 1 },
    ],
    leggings: [{ value: "none", weight: 5 }, { value: "wrapped", weight: 2 }],
    footwear: [
      { value: "sandals", weight: 4 },
      { value: "none", weight: 3 },
      { value: "shoes", weight: 2, means: ["wealthy"] },
    ],
    belt: [
      { value: "cord", weight: 2 },
      { value: "sash", weight: 2 },
      { value: "leather", weight: 2 },
      { value: "none" },
    ],
    over: [
      { value: "none", weight: 5 },
      { value: "shoulder-cloth", weight: 2 },
      { value: "cloak", means: ["wealthy"], weight: 2 },
    ],
  },
  {
    id: "floor-medieval",
    label: "Cut and sewn, layered against the cold",
    scope: { years: [500, 1500] },
    garment: [
      { value: "tunic", weight: 4 },
      { value: "long-tunic", weight: 3 },
      { value: "robe", weight: 2 },
      { value: "dress", weight: 3, sex: ["female"] },
      { value: "coat", means: ["wealthy"], weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 3 },
      { value: "cap", weight: 3 },
      { value: "hood", weight: 3 },
      { value: "wrap", weight: 2, sex: ["female"] },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "turban", weight: 1 },
      { value: "conical", weight: 1 },
    ],
    leggings: [
      { value: "hose", weight: 4 },
      { value: "none", weight: 2 },
      { value: "wrapped", weight: 2 },
    ],
    footwear: [
      { value: "shoes", weight: 5 },
      { value: "none", weight: 2, means: ["poor"] },
      { value: "boots", weight: 2, means: ["wealthy"] },
    ],
    belt: [
      { value: "leather", weight: 4 },
      { value: "cord", weight: 2 },
      { value: "sash", weight: 2 },
    ],
    over: [
      { value: "none", weight: 5 },
      { value: "cloak", weight: 3 },
      { value: "shoulder-cloth" },
    ],
  },
  {
    id: "floor-early-modern",
    label: "Tailoring and trade cloth",
    scope: { years: [1500, 1800] },
    garment: [
      { value: "shirt", weight: 4 },
      { value: "coat", weight: 3 },
      { value: "long-tunic", weight: 2 },
      { value: "dress", weight: 4, sex: ["female"] },
      { value: "robe", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 2 },
      { value: "cap", weight: 3 },
      { value: "brimmed", weight: 3 },
      { value: "headscarf", weight: 3, sex: ["female"] },
      // Regional kits raise these where they belong; the floor only keeps
      // them reachable so a world without a kit is not all one hat.
      { value: "turban", weight: 1 },
      { value: "conical", weight: 1 },
    ],
    leggings: [
      { value: "hose", weight: 3 },
      { value: "trousers", weight: 3 },
      { value: "none", weight: 2 },
    ],
    footwear: [
      { value: "shoes", weight: 5 },
      { value: "boots", weight: 3 },
      { value: "none", means: ["poor"], weight: 2 },
    ],
    belt: [{ value: "leather", weight: 4 }, { value: "sash", weight: 2 }],
    over: [{ value: "none", weight: 5 }, { value: "cloak", weight: 3 }],
  },
  {
    id: "floor-industrial",
    label: "Mill cloth and the hat that says which street",
    scope: { years: [1800, 1940] },
    garment: [
      { value: "shirt", weight: 5 },
      { value: "coat", weight: 4 },
      { value: "dress", weight: 5, sex: ["female"] },
      { value: "long-tunic", weight: 2 },
    ],
    headwear: [
      { value: "flat-cap", weight: 4, means: ["poor", "common"] },
      { value: "bowler", weight: 4, means: ["wealthy"] },
      { value: "bowler", weight: 1, means: ["common"] },
      { value: "brimmed", weight: 2 },
      { value: "headscarf", weight: 4, sex: ["female"] },
      { value: "none", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 6, sex: ["male", "unspecified"] },
      { value: "trousers", weight: 1, sex: ["female"] },
      { value: "hose", weight: 2, sex: ["female"] },
      { value: "none", weight: 1 },
    ],
    footwear: [
      { value: "shoes", weight: 5 },
      { value: "boots", weight: 4 },
      { value: "none", means: ["poor"] },
    ],
    belt: [{ value: "leather", weight: 5 }, { value: "none", weight: 2 }],
    over: [{ value: "none", weight: 6 }, { value: "cloak", weight: 2 }],
  },
  {
    id: "floor-postwar",
    label: "Suits, housedresses and the work shirt",
    scope: { years: [1940, 1965] },
    garment: [
      { value: "shirt", weight: 7, sex: ["male"] },
      { value: "coat", weight: 3, sex: ["male"] },
      { value: "coat", weight: 5, sex: ["male"], roles: ["office"] },
      { value: "tunic", weight: 1, sex: ["male"], ages: ["child", "youth"] },
      { value: "dress", weight: 7, sex: ["female"] },
      { value: "shirt", weight: 2, sex: ["female"] },
      { value: "skirt", weight: 2, sex: ["female"] },
    ],
    sleeves: [
      { value: "long", weight: 3 },
      { value: "short", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 4 },
      { value: "brimmed", weight: 4, sex: ["male"], ages: ["adult", "elder"] },
      { value: "flat-cap", weight: 2, sex: ["male"], means: ["poor", "common"] },
      { value: "ball-cap", weight: 1, sex: ["male"], ages: ["child", "youth"] },
      { value: "headscarf", weight: 2, sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 8, sex: ["male"] },
      { value: "trousers", weight: 1, sex: ["female"] },
      { value: "hose", weight: 4, sex: ["female"] },
    ],
    footwear: [
      { value: "shoes", weight: 7 },
      { value: "boots", weight: 2, means: ["poor", "common"] },
      { value: "boots", weight: 8, roles: ["tradesman"] },
      { value: "sneakers", weight: 2, ages: ["child", "youth"] },
    ],
    belt: [
      { value: "leather", weight: 6, sex: ["male"] },
      { value: "none", weight: 3 },
    ],
    over: [{ value: "none" }],
    motif: [
      { value: "plain", weight: 6 },
      { value: "placket", weight: 3, sex: ["male"] },
      { value: "plaid", weight: 3, sex: ["male"], roles: ["tradesman"] },
      { value: "plaid", weight: 1 },
      { value: "stripes", weight: 1 },
    ],
    eyewear: [
      { value: "none", weight: 10 },
      { value: "glasses", weight: 2 },
      { value: "glasses", weight: 4, ages: ["elder"] },
    ],
    neck: [
      { value: "none", weight: 10 },
      { value: "beads", weight: 3, sex: ["female"] },
    ],
  },
  {
    id: "floor-late-modern",
    label: "Denim, T-shirts and the first trainers",
    scope: { years: [1965, 1990] },
    garment: [
      { value: "shirt", weight: 6, sex: ["male"] },
      { value: "tunic", weight: 4, sex: ["male"] },
      { value: "coat", weight: 2, sex: ["male"] },
      { value: "coat", weight: 5, sex: ["male"], roles: ["office"] },
      { value: "shirt", weight: 5, sex: ["female"] },
      { value: "tunic", weight: 3, sex: ["female"] },
      { value: "dress", weight: 4, sex: ["female"] },
      { value: "skirt", weight: 2, sex: ["female"] },
    ],
    headwear: [
      { value: "none", weight: 8 },
      { value: "ball-cap", weight: 3, sex: ["male"] },
      { value: "ball-cap", weight: 3, roles: ["tradesman"] },
      { value: "brimmed", weight: 1, ages: ["elder"] },
      { value: "headscarf", weight: 1, sex: ["female"], ages: ["elder"] },
    ],
    leggings: [
      { value: "trousers", weight: 9, sex: ["male"] },
      { value: "trousers", weight: 5, sex: ["female"] },
      { value: "hose", weight: 2, sex: ["female"] },
    ],
    footwear: [
      { value: "shoes", weight: 5 },
      { value: "sneakers", weight: 4 },
      { value: "sneakers", weight: 6, ages: ["child", "youth"] },
      { value: "boots", weight: 2 },
      { value: "boots", weight: 9, roles: ["tradesman"] },
      { value: "sandals", weight: 1 },
    ],
    belt: [
      { value: "leather", weight: 5, sex: ["male"] },
      { value: "leather", weight: 1, sex: ["female"] },
      { value: "none", weight: 3 },
    ],
    over: [{ value: "none" }],
    motif: [
      { value: "plain", weight: 6 },
      { value: "placket", weight: 2 },
      { value: "plaid", weight: 2 },
      { value: "plaid", weight: 4, roles: ["tradesman"] },
      { value: "stripes", weight: 2 },
      { value: "jersey", weight: 2, sex: ["male"], ages: ["child", "youth", "adult"] },
    ],
    eyewear: [
      { value: "none", weight: 10 },
      { value: "glasses", weight: 2 },
      { value: "glasses", weight: 4, ages: ["elder"] },
      { value: "sunglasses", weight: 1, ages: ["youth", "adult"] },
    ],
    neck: [
      { value: "none", weight: 10 },
      { value: "chain", weight: 1, sex: ["male"], ages: ["youth", "adult"] },
      { value: "chain", weight: 2, sex: ["female"] },
      { value: "beads", weight: 2, sex: ["female"] },
    ],
  },
  {
    id: "floor-contemporary",
    label: "T-shirts, jeans and sneakers, worn everywhere",
    scope: { years: [1990, 10001] },
    garment: [
      { value: "tunic", weight: 7 },
      { value: "shirt", weight: 5 },
      { value: "coat", weight: 2 },
      { value: "coat", weight: 4, roles: ["office"] },
      { value: "shirt", weight: 4, roles: ["office"] },
      { value: "dress", weight: 2, sex: ["female"] },
      { value: "skirt", weight: 1, sex: ["female"] },
    ],
    headwear: [
      { value: "none", weight: 9 },
      { value: "ball-cap", weight: 3, sex: ["male"] },
      { value: "ball-cap", weight: 1, sex: ["female"] },
      { value: "ball-cap", weight: 4, roles: ["tradesman"] },
      { value: "hood", weight: 1, ages: ["youth"] },
      { value: "brimmed", weight: 1, ages: ["elder"] },
    ],
    leggings: [
      { value: "trousers", weight: 9, sex: ["male"] },
      { value: "trousers", weight: 7, sex: ["female"] },
      { value: "hose", weight: 1, sex: ["female"] },
    ],
    footwear: [
      { value: "sneakers", weight: 7 },
      { value: "shoes", weight: 3 },
      { value: "shoes", weight: 5, roles: ["office"] },
      { value: "boots", weight: 2 },
      { value: "boots", weight: 12, roles: ["tradesman"] },
      { value: "sandals", weight: 1 },
    ],
    belt: [
      { value: "leather", weight: 5, sex: ["male"] },
      { value: "leather", weight: 1, sex: ["female"] },
      { value: "none", weight: 4 },
    ],
    over: [{ value: "none" }],
    motif: [
      { value: "plain", weight: 7 },
      { value: "placket", weight: 1 },
      { value: "plaid", weight: 2 },
      { value: "plaid", weight: 4, roles: ["tradesman"] },
      { value: "stripes", weight: 2 },
      { value: "jersey", weight: 3, sex: ["male"], ages: ["child", "youth", "adult"] },
      { value: "jersey", weight: 1, sex: ["female"], ages: ["child", "youth"] },
    ],
    eyewear: [
      { value: "none", weight: 10 },
      { value: "glasses", weight: 3 },
      { value: "glasses", weight: 5, ages: ["elder"] },
      { value: "sunglasses", weight: 2, ages: ["youth", "adult"] },
    ],
    neck: [
      { value: "none", weight: 10 },
      { value: "chain", weight: 2, sex: ["male"], ages: ["youth", "adult"] },
      { value: "chain", weight: 3, sex: ["female"] },
      { value: "beads", weight: 1, sex: ["female"] },
    ],
  },
];

/** Regional kits. Each names only the slots it changes; everything else falls
 * through to the era floor it sits inside. */
export const regionalKits: readonly GarmentKit[] = [
  ...southAsia,
  ...southeastAsia,
  ...eastAsia,
  ...westAsiaNorthAfrica,
  ...americas,
  ...europe,
  ...innerEurasia,
  ...westCentralAfrica,
  ...eastSouthernAfrica,
  ...indigenousAmerican,
  ...australiaPacific,
  // Cloth-only kits: they name no silhouette, so they never displace one.
  ...clothPalettes,
  // Uniforms, court dress and the future: overlays that beat regional dress.
  ...specialSets,
];

export const garmentKits: readonly GarmentKit[] = [
  ...eraFloors,
  ...regionalKits,
];
