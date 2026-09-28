import type { GarmentKit } from "../types";

/**
 * Europe. Two long phases: a draped Mediterranean one, where the garment is a
 * length of wool pinned and belted and the leg is bare, and a cut-and-sewn
 * northern one, where it is hose and a fitted tunic under a hood. The
 * changeover is not a date so much as a drift, and the bands here straddle it.
 *
 * Trousers stayed a foreign thing in the classical Mediterranean for a long
 * time — a mark of the people beyond the frontier rather than ordinary dress —
 * so they are deliberately scarce before the medieval band.
 */
export const europe: readonly GarmentKit[] = [
  {
    id: "eu-before-bowler",
    label: "Europe · caps and tall hats before the bowler",
    scope: { years: [1700, 1850], cultures: ["european"] },
    headwear: [{ value: "cap", weight: 4, sex: ["male"] }, { value: "brimmed", weight: 4 },
      { value: "headscarf", weight: 5, sex: ["female"] }, { value: "none", weight: 2 }],
  },
  {
    id: "eu-early-top-hat",
    label: "Europe · the tall town hat",
    scope: { years: [1790, 1850], cultures: ["european"] },
    headwear: [{ value: "top-hat", weight: 4, sex: ["male"], means: ["wealthy"] },
      { value: "cap", weight: 4, sex: ["male"] }, { value: "brimmed", weight: 3 },
      { value: "headscarf", weight: 5, sex: ["female"] }, { value: "none", weight: 2 }],
  },
  {
    id: "eu-19c-tailoring",
    label: "Europe · tailored town dress",
    scope: { years: [1850, 1920], cultures: ["european"] },
    garment: [{ value: "coat", weight: 7, sex: ["male"], means: ["wealthy"] }],
    headwear: [{ value: "top-hat", weight: 4, sex: ["male"], means: ["wealthy"], ages: ["adult", "elder"] },
      { value: "bowler", weight: 4, sex: ["male"], means: ["wealthy"] },
      { value: "brimmed", weight: 2, sex: ["female"], means: ["wealthy"] }],
    leggings: [{ value: "trousers", sex: ["male"] }],
    belt: [{ value: "none", garments: ["coat", "dress", "skirt"] }],
    over: [{ value: "none", weight: 8 }, { value: "cloak", weight: 1 }],
    dye: [{ value: "soot", weight: 5, garments: ["coat"] }, { value: "ash", weight: 3, garments: ["coat"] },
      { value: "walnut", weight: 2, garments: ["coat"] }],
    motif: [{ value: "plain" }],
    accessory: [{ value: "walking-cane", weight: 3, sex: ["male"], means: ["wealthy"], ages: ["adult", "elder"], garments: ["coat"] },
      { value: "fan", weight: 1, sex: ["female"], means: ["wealthy"], ages: ["adult", "elder"] }, { value: "none", weight: 5 }],
  },
  {
    id: "eu-classical",
    label: "Europe · the draped length of wool",
    scope: { years: [-2000, 500], cultures: ["european"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 7 }, { value: "band", weight: 2, garments: ["tunic", "long-tunic", "robe"] }, { value: "placket", weight: 2, garments: ["shirt", "coat"] }],
    garment: [
      { value: "tunic", weight: 6 },
      { value: "long-tunic", weight: 4 },
      { value: "wrap", weight: 3 },
      { value: "robe", weight: 2, means: ["wealthy"] },
      { value: "none", weight: 1, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "none", weight: 6 },
      { value: "wrapped", weight: 3 },
      { value: "hose", weight: 1 },
    ],
    headwear: [
      { value: "none", weight: 6 },
      { value: "band", weight: 3 },
      { value: "wrap", weight: 2 },
      { value: "veil", weight: 2, sex: ["female"] },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "none", weight: 3 },
      { value: "shoes", weight: 3 },
      { value: "boots", weight: 1, means: ["wealthy"] },
    ],
    belt: [
      { value: "cord", weight: 4 },
      { value: "leather", weight: 3 },
      { value: "sash", weight: 2 },
      { value: "none", weight: 2 },
    ],
    // The himation, pallium and paenula: a rectangle over the shoulder, which
    // is what a Mediterranean cloak actually was.
    over: [
      { value: "none", weight: 4 },
      { value: "mantle", weight: 4 },
      { value: "cloak", weight: 2 },
      { value: "shoulder-cloth", weight: 2 },
    ],
  },
  {
    id: "eu-medieval",
    label: "Europe · hose, hood and a fitted tunic",
    scope: { years: [500, 1350], cultures: ["european"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 7 }, { value: "band", weight: 2, garments: ["tunic", "long-tunic", "robe"] }, { value: "placket", weight: 2, garments: ["shirt", "coat"] }],
    garment: [
      { value: "tunic", weight: 6 },
      { value: "long-tunic", weight: 4 },
      { value: "dress", weight: 5, sex: ["female"] },
      { value: "robe", weight: 2, means: ["wealthy"] },
    ],
    leggings: [
      { value: "hose", weight: 7 },
      { value: "wrapped", weight: 3 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "hood", weight: 5 },
      { value: "cap", weight: 4 },
      { value: "none", weight: 3 },
      { value: "veil", weight: 4, sex: ["female"], ages: ["adult", "elder"] },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "shoes", weight: 7 },
      { value: "boots", weight: 3 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    belt: [
      { value: "leather", weight: 6 },
      { value: "cord", weight: 3 },
      { value: "sash", weight: 1 },
    ],
    over: [
      { value: "none", weight: 5 },
      { value: "cloak", weight: 4 },
      { value: "mantle", weight: 2 },
    ],
  },
  {
    id: "eu-early-modern",
    label: "Europe · the doublet and the broad hat",
    scope: { years: [1350, 1700], cultures: ["european"] },
    front: [{ value: "closed", garments: ["coat"] }],
    sleeves: [{ value: "long", weight: 6 }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 7 }, { value: "band", weight: 2, garments: ["tunic", "long-tunic", "robe"] }, { value: "placket", weight: 2, garments: ["shirt", "coat"] }],
    garment: [
      { value: "shirt", weight: 5 },
      { value: "coat", weight: 5 },
      { value: "dress", weight: 6, sex: ["female"] },
      { value: "tunic", weight: 3 },
      { value: "robe", weight: 2, means: ["wealthy"] },
    ],
    leggings: [
      { value: "hose", weight: 6 },
      { value: "trousers", weight: 3 },
      { value: "wide", weight: 2 },
    ],
    headwear: [
      { value: "brimmed", weight: 5 },
      { value: "cap", weight: 5 },
      { value: "hood", weight: 2 },
      { value: "headscarf", weight: 4, sex: ["female"] },
      { value: "none", weight: 2 },
    ],
    footwear: [
      { value: "shoes", weight: 6 },
      { value: "boots", weight: 4 },
      { value: "none", weight: 1, means: ["poor"] },
    ],
    belt: [{ value: "leather", weight: 7 }, { value: "sash", weight: 2 }],
    over: [{ value: "none", weight: 6 }, { value: "cloak", weight: 3 }],
  },
  {
    id: "eu-industrial",
    label: "Europe · mill cloth and the hat that says which street",
    scope: { years: [1700, 1920], cultures: ["european"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 7 }, { value: "band", weight: 2, garments: ["tunic", "long-tunic", "robe"] }, { value: "placket", weight: 2, garments: ["shirt", "coat"] }],
    garment: [
      { value: "shirt", weight: 6, sex: ["male", "unspecified"] },
      { value: "coat", weight: 5, sex: ["male", "unspecified"] },
      { value: "dress", weight: 8, sex: ["female"] },
      { value: "skirt", weight: 4, sex: ["female"] },
      { value: "coat", weight: 2, sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 7, sex: ["male", "unspecified"] },
      { value: "hose", weight: 3 },
      { value: "none", weight: 1 },
    ],
    headwear: [
      { value: "flat-cap", weight: 5, means: ["poor", "common"] },
      { value: "bowler", weight: 5, means: ["wealthy"] },
      { value: "bowler", weight: 1, means: ["common"] },
      { value: "brimmed", weight: 3 },
      { value: "headscarf", weight: 5, sex: ["female"] },
      { value: "none", weight: 2 },
    ],
    footwear: [
      { value: "boots", weight: 6 },
      { value: "shoes", weight: 5 },
      { value: "none", weight: 1, means: ["poor"] },
    ],
    belt: [{ value: "leather", weight: 6 }, { value: "none", weight: 2 }],
  },
  {
    id: "eu-modern",
    label: "Europe · factory clothing",
    scope: { years: [1920, 10001], cultures: ["european"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 7 }, { value: "band", weight: 2, garments: ["tunic", "long-tunic", "robe"] }, { value: "placket", weight: 2, garments: ["shirt", "coat"] }],
    garment: [
      { value: "shirt", weight: 7 },
      { value: "coat", weight: 4 },
      { value: "dress", weight: 5, sex: ["female"] },
      { value: "skirt", weight: 3, sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 8 },
      { value: "hose", weight: 2 },
      { value: "none", weight: 1 },
    ],
    headwear: [
      { value: "none", weight: 6 },
      { value: "ball-cap", weight: 3, ages: ["child", "youth", "adult"] },
      { value: "flat-cap", weight: 2, ages: ["elder"] },
      { value: "headscarf", weight: 2, sex: ["female"], ages: ["elder"] },
      { value: "brimmed", weight: 1 },
    ],
    footwear: [{ value: "shoes", weight: 7 }, { value: "boots", weight: 3 }],
  },
];
