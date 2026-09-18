import type { GarmentKit } from "./types";
import { clothPalettes } from "./regions/cloth-palettes";
import {
  eastSouthernAfrica,
  westCentralAfrica,
} from "./regions/africa";
import { americas } from "./regions/americas";
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
    id: "floor-modern",
    label: "Factory clothing, worn everywhere",
    scope: { years: [1940, 10001] },
    garment: [
      { value: "shirt", weight: 6 },
      { value: "coat", weight: 3 },
      { value: "dress", weight: 3, sex: ["female"] },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "ball-cap", weight: 3, ages: ["child", "youth", "adult"] },
      { value: "flat-cap", weight: 2, ages: ["elder"] },
      { value: "headscarf", weight: 2, sex: ["female"] },
      { value: "brimmed", weight: 1 },
    ],
    leggings: [
      { value: "trousers", weight: 7 },
      { value: "hose", weight: 2 },
      { value: "none", weight: 1 },
    ],
    footwear: [{ value: "shoes", weight: 7 }, { value: "boots", weight: 3 }],
    belt: [{ value: "leather", weight: 4 }, { value: "none", weight: 3 }],
    over: [{ value: "none", weight: 7 }, { value: "cloak" }],
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
];

export const garmentKits: readonly GarmentKit[] = [
  ...eraFloors,
  ...regionalKits,
];
