import type { GarmentKit } from "../types";

/**
 * Southeast Asia, island and mainland. A wound lower cloth — kain, sarung,
 * sampot, longyi, chong kben — is the constant, and for most of the record the
 * upper body is bare, a breast cloth, or a short jacket. Cut-and-sewn upper
 * garments spread late and from outside, so they arrive as an addition over
 * the sarong rather than as a replacement for it.
 *
 * The conical leaf hat is the one strong occupational marker: field and water
 * work in sun and monsoon, across the whole region, for a very long time.
 */
export const southeastAsia: readonly GarmentKit[] = [
  {
    id: "sea-early",
    label: "Southeast Asia · the wound cloth",
    scope: { years: [-2000, 1400], cultures: ["southeast-asian"] },
    garment: [
      { value: "none", weight: 6, sex: ["male"] },
      { value: "wrap", weight: 5 },
      { value: "loincloth", weight: 3, means: ["poor"], sex: ["male"] },
      { value: "tunic", weight: 1, means: ["wealthy"] },
    ],
    leggings: [
      { value: "sarong", weight: 8 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    headwear: [
      { value: "none", weight: 6 },
      { value: "conical", weight: 4, livelihoods: ["farmer", "fisher"] },
      { value: "conical", weight: 1 },
      { value: "wrap", weight: 3 },
      { value: "band", weight: 2 },
      { value: "fillet", weight: 2, means: ["wealthy"] },
      { value: "plume", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "none", weight: 8 },
      { value: "sandals", weight: 2 },
    ],
    belt: [
      { value: "sash", weight: 4 },
      { value: "cord", weight: 3 },
      { value: "none", weight: 3 },
    ],
    over: [
      { value: "none", weight: 7 },
      { value: "shoulder-cloth", weight: 3 },
    ],
  },
  {
    id: "sea-classical",
    label: "Southeast Asia · a jacket over the sarong",
    scope: { years: [1400, 1900], cultures: ["southeast-asian"] },
    garment: [
      { value: "none", weight: 4, sex: ["male"] },
      { value: "wrap", weight: 4 },
      { value: "tunic", weight: 4 },
      // The baju and its relatives: an open jacket, worn over the wound cloth
      // rather than instead of it.
      { value: "open-robe", weight: 3, means: ["common", "wealthy"] },
      { value: "loincloth", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "sarong", weight: 8 },
      { value: "wide", weight: 2 },
      { value: "none", weight: 1, means: ["poor"] },
    ],
    headwear: [
      { value: "wrap", weight: 4 },
      { value: "none", weight: 4 },
      { value: "conical", weight: 4, livelihoods: ["farmer", "fisher"] },
      { value: "conical", weight: 2 },
      { value: "cap", weight: 2 },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "none", weight: 6 },
      { value: "sandals", weight: 3 },
      { value: "shoes", weight: 1, means: ["wealthy"] },
    ],
    belt: [
      { value: "sash", weight: 6 },
      { value: "cord", weight: 2 },
      { value: "none", weight: 2 },
    ],
  },
  {
    id: "sea-modern",
    label: "Southeast Asia · the shirt arrives, the sarong stays",
    scope: { years: [1900, 10001], cultures: ["southeast-asian"] },
    garment: [
      { value: "shirt", weight: 6 },
      { value: "tunic", weight: 3 },
      { value: "wrap", weight: 2, sex: ["female"] },
      { value: "none", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "sarong", weight: 5 },
      { value: "trousers", weight: 5 },
      { value: "wide", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "conical", weight: 4, livelihoods: ["farmer", "fisher"] },
      { value: "cap", weight: 2 },
      { value: "ball-cap", weight: 2, ages: ["child", "youth", "adult"] },
      { value: "headscarf", weight: 2, sex: ["female"] },
      { value: "brimmed", weight: 1 },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "shoes", weight: 3 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
  },
];
