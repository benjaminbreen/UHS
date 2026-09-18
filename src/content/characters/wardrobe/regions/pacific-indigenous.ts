import type { GarmentKit } from "../types";

/**
 * Indigenous America outside Mesoamerica and the Andes, and the Pacific.
 *
 * "Other Indigenous American" covers two climates that dress nothing alike, so
 * this is the one place in the atlas that splits on `bounds` rather than on
 * culture: hide and fur north of the Gulf, near-nothing and ornament in the
 * Amazon basin, and a middle case for everywhere else the tag reaches.
 */
export const indigenousAmerican: readonly GarmentKit[] = [
  {
    id: "nai-north",
    label: "North America · hide, leggings and a robe",
    scope: {
      years: [-1000000, 1850],
      cultures: ["other-indigenous-american"],
      bounds: [-170, 25, -52, 75],
    },
    garment: [
      { value: "tunic", weight: 6 },
      { value: "long-tunic", weight: 4, sex: ["female"] },
      { value: "loincloth", weight: 4, sex: ["male"] },
      { value: "none", weight: 3, sex: ["male"] },
      { value: "poncho", weight: 2 },
    ],
    leggings: [
      { value: "wrapped", weight: 6 },
      { value: "hose", weight: 4 },
      { value: "none", weight: 3 },
    ],
    headwear: [
      { value: "none", weight: 6 },
      { value: "band", weight: 5 },
      { value: "cap", weight: 2 },
      { value: "plume", weight: 3, means: ["wealthy"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    // Moccasins: soft, and at this size simply shoes.
    footwear: [
      { value: "shoes", weight: 7 },
      { value: "none", weight: 3 },
      { value: "boots", weight: 2 },
    ],
    belt: [
      { value: "leather", weight: 5 },
      { value: "cord", weight: 4 },
      { value: "sash", weight: 2 },
    ],
    over: [
      { value: "mantle", weight: 4 },
      { value: "cloak", weight: 3 },
      { value: "none", weight: 5 },
    ],
    material: [
      { value: "hide", weight: 7 },
      { value: "fur", weight: 4 },
      { value: "barkcloth", weight: 2 },
      { value: "cotton", weight: 1 },
    ],
  },
  {
    id: "nai-tropical",
    label: "Amazonia · ornament rather than cloth",
    scope: {
      years: [-1000000, 1850],
      cultures: ["other-indigenous-american"],
      bounds: [-80, -20, -35, 12],
    },
    garment: [
      { value: "none", weight: 8, sex: ["male"] },
      { value: "loincloth", weight: 6 },
      { value: "wrap", weight: 3, sex: ["female"] },
      { value: "none", weight: 4, sex: ["female"] },
    ],
    leggings: [{ value: "none", weight: 9 }],
    headwear: [
      { value: "none", weight: 5 },
      { value: "band", weight: 5 },
      { value: "plume", weight: 5 },
      { value: "fillet", weight: 2 },
    ],
    footwear: [{ value: "none", weight: 9 }, { value: "sandals", weight: 1 }],
    belt: [{ value: "cord", weight: 6 }, { value: "none", weight: 4 }],
    over: [{ value: "none", weight: 8 }, { value: "shoulder-cloth", weight: 2 }],
  },
  {
    id: "nai-general",
    label: "Indigenous America · cloth and hide",
    scope: { years: [-1000000, 1850], cultures: ["other-indigenous-american"] },
    garment: [
      { value: "tunic", weight: 5 },
      { value: "wrap", weight: 4 },
      { value: "loincloth", weight: 4, sex: ["male"] },
      { value: "none", weight: 3, sex: ["male"] },
      { value: "poncho", weight: 3 },
    ],
    leggings: [
      { value: "none", weight: 5 },
      { value: "wrapped", weight: 4 },
      { value: "sarong", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 6 },
      { value: "band", weight: 5 },
      { value: "plume", weight: 3 },
      { value: "wrap", weight: 2 },
    ],
    footwear: [
      { value: "none", weight: 5 },
      { value: "sandals", weight: 4 },
      { value: "shoes", weight: 3 },
    ],
    over: [
      { value: "mantle", weight: 4 },
      { value: "none", weight: 6 },
    ],
  },
  {
    id: "nai-modern",
    label: "Indigenous America · trade cloth and after",
    scope: { years: [1850, 10001], cultures: ["other-indigenous-american"] },
    garment: [
      { value: "shirt", weight: 6 },
      { value: "coat", weight: 4 },
      { value: "tunic", weight: 3 },
      { value: "dress", weight: 4, sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 7 },
      { value: "hose", weight: 2 },
      { value: "none", weight: 1 },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "brimmed", weight: 4 },
      { value: "cap", weight: 3 },
      { value: "band", weight: 3 },
      { value: "ball-cap", weight: 2, ages: ["child", "youth", "adult"] },
    ],
    footwear: [
      { value: "boots", weight: 5 },
      { value: "shoes", weight: 5 },
      { value: "sandals", weight: 2 },
    ],
  },
];

/**
 * Australia and the Pacific. Beaten bark cloth rather than woven cloth is the
 * material fact across the islands — tapa, kapa, masi — worn as a wound lower
 * sheet with the upper body bare, and as a cape or cloak that carries rank.
 * The feather cloaks of Hawai'i and the flax korowai of Aotearoa are both
 * `mantle`, and both are the most valuable thing anyone is wearing.
 *
 * The 1830s break is missionary dress: a loose covering gown for women that
 * spread across the islands within a generation, and is still ordinary.
 */
export const australiaPacific: readonly GarmentKit[] = [
  {
    id: "ap-early",
    label: "Australia & the Pacific · bark cloth and the cape",
    scope: { years: [-1000000, 1830], cultures: ["australian-pacific"] },
    garment: [
      { value: "none", weight: 8, sex: ["male"] },
      { value: "wrap", weight: 5 },
      { value: "loincloth", weight: 4, sex: ["male"] },
      { value: "none", weight: 3, sex: ["female"] },
    ],
    leggings: [
      { value: "sarong", weight: 7 },
      { value: "none", weight: 4 },
    ],
    headwear: [
      { value: "none", weight: 7 },
      { value: "band", weight: 4 },
      { value: "plume", weight: 3, means: ["common", "wealthy"] },
      { value: "fillet", weight: 2, means: ["wealthy"] },
      { value: "wrap", weight: 2 },
    ],
    footwear: [{ value: "none", weight: 9 }, { value: "sandals", weight: 1 }],
    belt: [
      { value: "cord", weight: 5 },
      { value: "sash", weight: 3 },
      { value: "none", weight: 3 },
    ],
    // The cape is the rank: feather, flax, or possum skin in the south.
    over: [
      { value: "mantle", weight: 5 },
      { value: "none", weight: 5 },
      { value: "shoulder-cloth", weight: 2 },
    ],
  },
  {
    id: "ap-modern",
    label: "Australia & the Pacific · the gown and the lavalava",
    scope: { years: [1830, 10001], cultures: ["australian-pacific"] },
    garment: [
      { value: "shirt", weight: 5 },
      // The island dress: loose, to the ankle, and everywhere within a
      // generation of the missions.
      { value: "dress", weight: 7, sex: ["female"] },
      { value: "long-tunic", weight: 3 },
      { value: "none", weight: 2, sex: ["male"], means: ["poor"] },
    ],
    leggings: [
      { value: "sarong", weight: 6 },
      { value: "trousers", weight: 4 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 6 },
      { value: "brimmed", weight: 3 },
      { value: "band", weight: 3 },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "ball-cap", weight: 2, ages: ["child", "youth", "adult"] },
    ],
    footwear: [
      { value: "none", weight: 4 },
      { value: "sandals", weight: 6 },
      { value: "shoes", weight: 3 },
    ],
    over: [{ value: "mantle", weight: 3 }, { value: "none", weight: 7 }],
  },
];
