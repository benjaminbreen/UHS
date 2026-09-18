import type { GarmentKit } from "../types";

/**
 * South Asia. The through-line is unstitched cloth: a length wound round the
 * lower body and a second over the upper, with stitched garments arriving
 * late, unevenly, and from the north. So `sarong` carries the lower body in
 * every band, and a sari is drawn as `wrap` over `sarong` rather than as a
 * dress — the pallu over one shoulder is what the silhouette has to say.
 *
 * Status shows as the quantity and covering of cloth, not as cut: a labourer
 * wears the same form as a landowner, shorter and with less of it.
 */
export const southAsia: readonly GarmentKit[] = [
  {
    id: "sa-early",
    label: "South Asia · unstitched cloth",
    scope: { years: [-3000, 500], cultures: ["south-asian"] },
    garment: [
      { value: "wrap", weight: 5 },
      { value: "none", weight: 4, sex: ["male"] },
      { value: "none", weight: 3, means: ["poor"], sex: ["male"] },
      { value: "loincloth", weight: 3, means: ["poor"], sex: ["male"] },
      { value: "long-tunic", weight: 1, means: ["wealthy"] },
    ],
    leggings: [
      { value: "sarong", weight: 7 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "wrap", weight: 4 },
      { value: "band", weight: 2 },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "fillet", weight: 2, means: ["wealthy"] },
      { value: "veil", weight: 1, sex: ["female"], means: ["wealthy"] },
    ],
    footwear: [
      { value: "none", weight: 7 },
      { value: "sandals", weight: 3 },
    ],
    belt: [
      { value: "sash", weight: 3 },
      { value: "cord", weight: 3 },
      { value: "none", weight: 3 },
    ],
    over: [
      { value: "none", weight: 6 },
      { value: "shoulder-cloth", weight: 3 },
    ],
  },
  {
    id: "sa-medieval",
    label: "South Asia · wound cloth, stitched at the edges",
    scope: { years: [500, 1500], cultures: ["south-asian"] },
    garment: [
      { value: "wrap", weight: 5 },
      { value: "none", weight: 3, sex: ["male"] },
      { value: "tunic", weight: 3 },
      { value: "long-tunic", weight: 2, means: ["common", "wealthy"] },
      { value: "loincloth", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "sarong", weight: 7 },
      { value: "none", weight: 2, means: ["poor"] },
      { value: "wide", weight: 1, means: ["wealthy"] },
    ],
    headwear: [
      { value: "wrap", weight: 5 },
      { value: "none", weight: 4 },
      { value: "band", weight: 2 },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "fillet", weight: 2, means: ["wealthy"] },
      { value: "veil", weight: 2, sex: ["female"] },
    ],
    footwear: [
      { value: "none", weight: 5 },
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 2, means: ["wealthy"] },
    ],
    belt: [
      { value: "sash", weight: 4 },
      { value: "cord", weight: 2 },
      { value: "none", weight: 2 },
    ],
  },
  {
    id: "sa-early-modern",
    label: "South Asia · the jama and the turban",
    scope: { years: [1500, 1850], cultures: ["south-asian"] },
    garment: [
      // The open-fronted jama and angarkha are the northern courtly form; the
      // wound cloth underneath never went away.
      { value: "open-robe", weight: 4, means: ["common", "wealthy"] },
      { value: "wrap", weight: 4 },
      { value: "long-tunic", weight: 3 },
      { value: "none", weight: 3, means: ["poor"], sex: ["male"] },
      { value: "loincloth", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "sarong", weight: 5 },
      { value: "wide", weight: 4, means: ["common", "wealthy"] },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    headwear: [
      { value: "wrap", weight: 7 },
      { value: "none", weight: 2 },
      { value: "cap", weight: 2 },
      { value: "veil", weight: 3, sex: ["female"] },
      { value: "brimmed", weight: 1, livelihoods: ["farmer", "herder"] },
    ],
    footwear: [
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 3, means: ["common", "wealthy"] },
      { value: "none", weight: 4, means: ["poor"] },
    ],
    belt: [
      { value: "sash", weight: 6 },
      { value: "none", weight: 2 },
      { value: "cord", weight: 2 },
    ],
  },
  {
    id: "sa-modern",
    label: "South Asia · mill cloth over the dhoti",
    scope: { years: [1850, 10001], cultures: ["south-asian"] },
    garment: [
      { value: "shirt", weight: 5 },
      { value: "long-tunic", weight: 4 },
      { value: "wrap", weight: 4, sex: ["female"] },
      { value: "none", weight: 2, means: ["poor"], sex: ["male"] },
      { value: "open-robe", weight: 1, means: ["wealthy"] },
    ],
    leggings: [
      { value: "sarong", weight: 5 },
      { value: "trousers", weight: 4 },
      { value: "wide", weight: 3 },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "cap", weight: 3 },
      { value: "wrap", weight: 3 },
      { value: "veil", weight: 2, sex: ["female"] },
      { value: "brimmed", weight: 1, livelihoods: ["farmer"] },
    ],
    footwear: [
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 4 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
  },
];
