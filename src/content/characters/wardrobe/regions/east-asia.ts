import type { GarmentKit } from "../types";

/**
 * East Asia. The constant is a cross-collar robe wrapped left over right and
 * held with a sash — shenyi, hanfu, kimono, hanbok, ao dai's ancestors — so
 * `open-robe` carries the region in every band, and the sash rather than a
 * buckled belt holds it shut. Trousers sit under the robe rather than instead
 * of it, which is why `wide` runs alongside the robe rather than against it.
 *
 * Fibre is the status axis here more than cut: hemp and ramie for most people
 * for most of the record, cotton spreading late, silk marking the few.
 */
export const eastAsia: readonly GarmentKit[] = [
  {
    id: "ea-early",
    label: "East Asia · hemp and the wrapped robe",
    scope: { years: [-2000, 600], cultures: ["east-asian"] },
    garment: [
      { value: "open-robe", weight: 5 },
      { value: "long-tunic", weight: 4 },
      { value: "tunic", weight: 3 },
      { value: "none", weight: 2, means: ["poor"], sex: ["male"] },
      { value: "loincloth", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "wide", weight: 5 },
      { value: "none", weight: 3 },
      { value: "wrapped", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 4 },
      { value: "cap", weight: 4 },
      { value: "band", weight: 3 },
      { value: "conical", weight: 3, livelihoods: ["farmer", "fisher"] },
      { value: "wrap", weight: 2 },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "sandals", weight: 5 },
      { value: "none", weight: 4 },
      { value: "shoes", weight: 3, means: ["common", "wealthy"] },
    ],
    // A sash, not a buckle: the robe is held shut rather than cinched.
    belt: [
      { value: "sash", weight: 7 },
      { value: "cord", weight: 2 },
      { value: "none", weight: 1 },
    ],
    over: [
      { value: "none", weight: 6 },
      { value: "mantle", weight: 2 },
      { value: "cloak", weight: 1 },
    ],
    // Cotton only becomes ordinary cloth here late. Before that the plain
    // stuff is bast fibre, and silk is what marks the few.
    material: [
      { value: "hemp", weight: 6 },
      { value: "ramie", weight: 5 },
      { value: "felt", weight: 2 },
      { value: "wool", weight: 2 },
      { value: "silk", weight: 3, means: ["wealthy"] },
    ],
  },
  {
    id: "ea-classical",
    label: "East Asia · the robe and the cap",
    scope: { years: [600, 1400], cultures: ["east-asian"] },
    garment: [
      { value: "open-robe", weight: 6 },
      { value: "long-tunic", weight: 4 },
      { value: "tunic", weight: 3 },
      { value: "none", weight: 1, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "wide", weight: 5 },
      { value: "hose", weight: 3 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "cap", weight: 5 },
      { value: "none", weight: 3 },
      { value: "conical", weight: 3, livelihoods: ["farmer", "fisher"] },
      { value: "wrap", weight: 2 },
      { value: "veil", weight: 1, sex: ["female"], means: ["wealthy"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "shoes", weight: 6 },
      { value: "sandals", weight: 4 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    belt: [{ value: "sash", weight: 8 }, { value: "cord", weight: 2 }],
    // Cotton only becomes ordinary cloth here late. Before that the plain
    // stuff is bast fibre, and silk is what marks the few.
    material: [
      { value: "hemp", weight: 6 },
      { value: "ramie", weight: 5 },
      { value: "felt", weight: 2 },
      { value: "wool", weight: 2 },
      { value: "silk", weight: 3, means: ["wealthy"] },
    ],
  },
  {
    id: "ea-late-imperial",
    label: "East Asia · cotton spreads, the robe stays",
    scope: { years: [1400, 1900], cultures: ["east-asian"] },
    garment: [
      { value: "open-robe", weight: 6 },
      { value: "long-tunic", weight: 4 },
      { value: "tunic", weight: 4 },
      { value: "shirt", weight: 1 },
    ],
    leggings: [
      { value: "wide", weight: 6 },
      { value: "trousers", weight: 3 },
      { value: "hose", weight: 2 },
    ],
    headwear: [
      { value: "cap", weight: 5 },
      { value: "conical", weight: 4, livelihoods: ["farmer", "fisher"] },
      { value: "conical", weight: 2 },
      { value: "none", weight: 3 },
      { value: "wrap", weight: 2 },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "shoes", weight: 7 },
      { value: "sandals", weight: 3 },
      { value: "none", weight: 1, means: ["poor"] },
    ],
    belt: [{ value: "sash", weight: 7 }, { value: "leather", weight: 2 }],
  },
  {
    id: "ea-modern",
    label: "East Asia · the shirt, and the robe kept for occasions",
    scope: { years: [1900, 10001], cultures: ["east-asian"] },
    garment: [
      { value: "shirt", weight: 6 },
      { value: "coat", weight: 3 },
      { value: "open-robe", weight: 2 },
      { value: "tunic", weight: 2 },
      { value: "dress", weight: 2, sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 7 },
      { value: "wide", weight: 2 },
      { value: "hose", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "cap", weight: 3 },
      { value: "conical", weight: 3, livelihoods: ["farmer", "fisher"] },
      { value: "ball-cap", weight: 2, ages: ["child", "youth", "adult"] },
      { value: "brimmed", weight: 1 },
    ],
    footwear: [
      { value: "shoes", weight: 7 },
      { value: "sandals", weight: 3 },
      { value: "boots", weight: 2 },
    ],
  },
];
