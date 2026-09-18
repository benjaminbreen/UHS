import type { GarmentKit } from "../types";

/**
 * Inner Eurasia: the steppe and what borders it. Riding dress is the
 * organising fact, and it is the near-inverse of the Mediterranean — trousers
 * rather than a bare leg, boots rather than sandals, and a coat that wraps
 * across the body and is held with a sash. Felt does what linen does
 * elsewhere, and silk arrives along the routes as the thing that marks rank.
 *
 * Boots are close to universal here from the earliest band, which is unusual:
 * almost everywhere else in this atlas most people are barefoot or in sandals
 * for most of the record.
 */
export const innerEurasia: readonly GarmentKit[] = [
  {
    id: "ie-early",
    label: "Inner Eurasia · riding dress",
    scope: { years: [-1500, 600], cultures: ["inner-eurasian"] },
    garment: [
      { value: "open-robe", weight: 5 },
      { value: "tunic", weight: 5 },
      { value: "coat", weight: 4 },
      { value: "long-tunic", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 7 },
      { value: "wide", weight: 3 },
      { value: "wrapped", weight: 2 },
    ],
    headwear: [
      { value: "cap", weight: 5 },
      // The tall pointed felt hat of the Saka and their neighbours.
      { value: "conical", weight: 4 },
      { value: "wrap", weight: 3 },
      { value: "none", weight: 3 },
      { value: "hood", weight: 2 },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "boots", weight: 8 },
      { value: "shoes", weight: 3 },
      { value: "none", weight: 1, means: ["poor"] },
    ],
    belt: [
      { value: "sash", weight: 5 },
      { value: "leather", weight: 5 },
      { value: "cord", weight: 2 },
    ],
    over: [
      { value: "none", weight: 5 },
      { value: "cloak", weight: 3 },
      { value: "mantle", weight: 2 },
    ],
  },
  {
    id: "ie-medieval",
    label: "Inner Eurasia · the wrapped coat",
    scope: { years: [600, 1500], cultures: ["inner-eurasian"] },
    garment: [
      { value: "open-robe", weight: 7 },
      { value: "coat", weight: 4 },
      { value: "long-tunic", weight: 3 },
      { value: "tunic", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 7 },
      { value: "wide", weight: 4 },
      { value: "hose", weight: 1 },
    ],
    headwear: [
      { value: "cap", weight: 6 },
      { value: "conical", weight: 3 },
      { value: "wrap", weight: 3 },
      { value: "hood", weight: 2 },
      { value: "none", weight: 2 },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "boots", weight: 8 },
      { value: "shoes", weight: 3 },
    ],
    belt: [
      { value: "sash", weight: 6 },
      { value: "leather", weight: 5 },
      { value: "wide", weight: 2 },
    ],
    over: [
      { value: "none", weight: 5 },
      { value: "cloak", weight: 3 },
      { value: "mantle", weight: 2 },
    ],
  },
  {
    id: "ie-early-modern",
    label: "Inner Eurasia · felt, fur and the sash",
    scope: { years: [1500, 1900], cultures: ["inner-eurasian"] },
    garment: [
      { value: "open-robe", weight: 6 },
      { value: "coat", weight: 5 },
      { value: "long-tunic", weight: 3 },
      { value: "shirt", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 7 },
      { value: "wide", weight: 4 },
    ],
    headwear: [
      { value: "cap", weight: 6 },
      { value: "brimmed", weight: 3 },
      { value: "conical", weight: 2 },
      { value: "wrap", weight: 2 },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "none", weight: 2 },
    ],
    footwear: [
      { value: "boots", weight: 8 },
      { value: "shoes", weight: 3 },
    ],
    belt: [{ value: "sash", weight: 6 }, { value: "leather", weight: 5 }],
  },
  {
    id: "ie-modern",
    label: "Inner Eurasia · the coat over the shirt",
    scope: { years: [1900, 10001], cultures: ["inner-eurasian"] },
    garment: [
      { value: "shirt", weight: 6 },
      { value: "coat", weight: 5 },
      { value: "open-robe", weight: 3 },
      { value: "dress", weight: 3, sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 8 },
      { value: "wide", weight: 2 },
    ],
    headwear: [
      { value: "cap", weight: 5 },
      { value: "none", weight: 4 },
      { value: "headscarf", weight: 4, sex: ["female"] },
      { value: "brimmed", weight: 2 },
      { value: "ball-cap", weight: 2, ages: ["child", "youth", "adult"] },
    ],
    footwear: [
      { value: "boots", weight: 7 },
      { value: "shoes", weight: 5 },
    ],
  },
];
