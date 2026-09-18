import type { GarmentKit } from "../types";

/**
 * North Africa and West Asia. Loose covering cloth against sun and dust is the
 * constant: a long shift to the ankle, an open outer robe over it, and a cloth
 * on the head that can be wound, draped or dropped across the face. So
 * `long-tunic` and `open-robe` carry the region and `wrap` carries the head.
 *
 * The fez is deliberately late. It is an Ottoman standardisation of the 1820s
 * and after, not a general Islamic or Middle Eastern hat, and putting it in
 * earlier bands would be the commonest way to get this region wrong.
 */
export const westAsiaNorthAfrica: readonly GarmentKit[] = [
  {
    id: "wana-ancient",
    label: "West Asia & North Africa · linen and the draped cloth",
    scope: { years: [-1000000, 650], cultures: ["north-african-west-asian"] },
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "wrap", weight: 4 },
      { value: "tunic", weight: 4 },
      { value: "loincloth", weight: 2, means: ["poor"], sex: ["male"] },
      { value: "none", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "none", weight: 6 },
      { value: "sarong", weight: 2 },
      { value: "wrapped", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 4 },
      { value: "wrap", weight: 5 },
      { value: "band", weight: 3 },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "veil", weight: 2, sex: ["female"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "none", weight: 4 },
      { value: "shoes", weight: 2, means: ["wealthy"] },
    ],
    belt: [
      { value: "sash", weight: 4 },
      { value: "cord", weight: 3 },
      { value: "leather", weight: 2 },
      { value: "none", weight: 2 },
    ],
    over: [
      { value: "none", weight: 5 },
      { value: "mantle", weight: 3 },
      { value: "cloak", weight: 2 },
    ],
  },
  {
    id: "wana-medieval",
    label: "West Asia & North Africa · the robe over the shift",
    scope: { years: [650, 1500], cultures: ["north-african-west-asian"] },
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "open-robe", weight: 5 },
      { value: "robe", weight: 3 },
      { value: "tunic", weight: 2 },
      { value: "none", weight: 1, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "none", weight: 4 },
      { value: "wide", weight: 4 },
      { value: "sarong", weight: 2 },
    ],
    headwear: [
      { value: "wrap", weight: 7 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "none", weight: 2 },
      { value: "cap", weight: 2 },
      { value: "brimmed", weight: 1, livelihoods: ["farmer", "herder"] },
    ],
    footwear: [
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 4 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    belt: [{ value: "sash", weight: 7 }, { value: "leather", weight: 2 }],
    over: [
      { value: "none", weight: 5 },
      { value: "cloak", weight: 3 },
      { value: "mantle", weight: 2 },
    ],
  },
  {
    id: "wana-early-modern",
    label: "West Asia & North Africa · kaftan and turban",
    scope: { years: [1500, 1850], cultures: ["north-african-west-asian"] },
    garment: [
      { value: "open-robe", weight: 6 },
      { value: "long-tunic", weight: 5 },
      { value: "robe", weight: 3 },
      { value: "none", weight: 1, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "wide", weight: 6 },
      { value: "none", weight: 3 },
      { value: "hose", weight: 1 },
    ],
    headwear: [
      { value: "wrap", weight: 7 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "cap", weight: 2 },
      { value: "none", weight: 2 },
    ],
    footwear: [
      { value: "shoes", weight: 5 },
      { value: "sandals", weight: 4 },
      { value: "boots", weight: 2, means: ["wealthy"] },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    belt: [{ value: "sash", weight: 8 }, { value: "leather", weight: 2 }],
  },
  {
    id: "wana-modern",
    label: "West Asia & North Africa · the fez, then the shirt",
    scope: { years: [1850, 10001], cultures: ["north-african-west-asian"] },
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "shirt", weight: 5 },
      { value: "open-robe", weight: 3 },
      { value: "coat", weight: 2 },
      { value: "robe", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 5 },
      { value: "wide", weight: 4 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "wrap", weight: 5 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "fez", weight: 3, sex: ["male"] },
      { value: "cap", weight: 2 },
      { value: "none", weight: 3 },
    ],
    footwear: [
      { value: "shoes", weight: 6 },
      { value: "sandals", weight: 4 },
      { value: "boots", weight: 2 },
    ],
  },
];
