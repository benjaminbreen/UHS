import type { GarmentKit } from "../types";

/**
 * West and Central Africa. A wrapper round the waist is the constant for both
 * sexes, with the upper body bare, draped, or under a wide enveloping robe —
 * the boubou and agbada family, which `open-robe` and `robe` carry.
 *
 * Cloth here is woven in narrow strips and sewn edge to edge, so banding is
 * not decoration applied to cloth but the structure of the cloth itself. That
 * makes `stripes` the default motif rather than an occasional one. Indigo is
 * the region's great dye and is treated as ordinary rather than costly.
 */
export const westCentralAfrica: readonly GarmentKit[] = [
  {
    id: "wca-early",
    label: "West & Central Africa · raffia and the wrapper",
    scope: { years: [-1000000, 1100], cultures: ["west-central-african"] },
    garment: [
      { value: "none", weight: 6, sex: ["male"] },
      { value: "wrap", weight: 5 },
      { value: "loincloth", weight: 3, sex: ["male"] },
      { value: "tunic", weight: 2 },
    ],
    leggings: [
      { value: "sarong", weight: 8 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "cap", weight: 4 },
      { value: "wrap", weight: 4 },
      { value: "band", weight: 3 },
      { value: "fillet", weight: 2, means: ["wealthy"] },
      { value: "plume", weight: 1, means: ["wealthy"] },
    ],
    footwear: [{ value: "none", weight: 8 }, { value: "sandals", weight: 3 }],
    belt: [
      { value: "sash", weight: 5 },
      { value: "cord", weight: 3 },
      { value: "none", weight: 3 },
    ],
    over: [
      { value: "none", weight: 6 },
      { value: "shoulder-cloth", weight: 3 },
      { value: "mantle", weight: 2 },
    ],
  },
  {
    id: "wca-strip-loom",
    label: "West & Central Africa · strip cloth and the wide robe",
    scope: { years: [1100, 1900], cultures: ["west-central-african"] },
    garment: [
      { value: "open-robe", weight: 5 },
      { value: "robe", weight: 4 },
      { value: "wrap", weight: 4 },
      { value: "long-tunic", weight: 3 },
      { value: "none", weight: 3, sex: ["male"], means: ["poor"] },
    ],
    leggings: [
      { value: "sarong", weight: 7 },
      { value: "wide", weight: 3 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "cap", weight: 6 },
      { value: "wrap", weight: 6 },
      { value: "none", weight: 3 },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "none", weight: 5 },
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 1, means: ["wealthy"] },
    ],
    belt: [{ value: "sash", weight: 7 }, { value: "cord", weight: 2 }],
    // Cloth woven in narrow strips and sewn edge to edge: the banding is the
    // structure of the cloth, not decoration added to it.
    motif: [
      { value: "stripes", weight: 7 },
      { value: "band", weight: 3 },
      { value: "plain", weight: 2 },
    ],
    // Indigo is the region's own dye and was worn by everyone, not only by
    // people who could afford a colour.
    dye: [
      { value: "indigo", weight: 7 },
      { value: "undyed", weight: 5 },
      { value: "ochre", weight: 4 },
      { value: "bark", weight: 3 },
      { value: "morinda", weight: 4 },
      { value: "clay", weight: 3 },
      { value: "soot", weight: 2 },
      { value: "henna", weight: 3, means: ["common", "wealthy"] },
      { value: "goldthread", weight: 1, means: ["wealthy"] },
    ],
  },
  {
    id: "wca-modern",
    label: "West & Central Africa · the robe beside the shirt",
    scope: { years: [1900, 10001], cultures: ["west-central-african"] },
    garment: [
      { value: "shirt", weight: 5 },
      { value: "open-robe", weight: 4 },
      { value: "long-tunic", weight: 4 },
      { value: "wrap", weight: 3, sex: ["female"] },
      { value: "dress", weight: 3, sex: ["female"] },
    ],
    leggings: [
      { value: "sarong", weight: 5 },
      { value: "trousers", weight: 5 },
      { value: "wide", weight: 3 },
    ],
    headwear: [
      { value: "wrap", weight: 5, sex: ["female"] },
      { value: "cap", weight: 4 },
      { value: "none", weight: 4 },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "ball-cap", weight: 2, ages: ["child", "youth", "adult"] },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "shoes", weight: 4 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
  },
];

/**
 * East and Southern Africa. The unifying form is a rectangle worn over the
 * shoulder and round the body — the shamma of the highlands, the shuka of the
 * pastoralists, the kaross of the south — so `wrap` and `mantle` carry the
 * region and the lower body is wound rather than cut.
 *
 * Ornament does work here that cut does elsewhere: beaded collars, bands and
 * fillets mark age, marriage and standing, and red ochre is dress as much as
 * it is pigment.
 */
export const eastSouthernAfrica: readonly GarmentKit[] = [
  {
    id: "esa-early",
    label: "East & Southern Africa · the draped rectangle",
    scope: { years: [-1000000, 1000], cultures: ["east-southern-african"] },
    garment: [
      { value: "wrap", weight: 6 },
      { value: "none", weight: 5, sex: ["male"] },
      { value: "loincloth", weight: 3, sex: ["male"] },
      { value: "tunic", weight: 2 },
    ],
    leggings: [
      { value: "none", weight: 6 },
      { value: "sarong", weight: 4 },
    ],
    headwear: [
      { value: "none", weight: 6 },
      { value: "band", weight: 5 },
      { value: "wrap", weight: 3 },
      { value: "fillet", weight: 3, means: ["common", "wealthy"] },
      { value: "plume", weight: 2, means: ["wealthy"] },
    ],
    footwear: [{ value: "none", weight: 8 }, { value: "sandals", weight: 3 }],
    belt: [
      { value: "cord", weight: 4 },
      { value: "sash", weight: 3 },
      { value: "none", weight: 4 },
    ],
    over: [
      { value: "mantle", weight: 5 },
      { value: "none", weight: 4 },
      { value: "shoulder-cloth", weight: 3 },
    ],
  },
  {
    id: "esa-middle",
    label: "East & Southern Africa · woven cloth on the coast",
    scope: { years: [1000, 1850], cultures: ["east-southern-african"] },
    garment: [
      { value: "wrap", weight: 6 },
      { value: "long-tunic", weight: 4 },
      { value: "none", weight: 3, sex: ["male"] },
      { value: "robe", weight: 2 },
      { value: "loincloth", weight: 2, sex: ["male"], means: ["poor"] },
    ],
    leggings: [
      { value: "sarong", weight: 6 },
      { value: "none", weight: 4 },
    ],
    headwear: [
      { value: "none", weight: 4 },
      { value: "cap", weight: 4 },
      { value: "wrap", weight: 4 },
      { value: "band", weight: 3 },
      { value: "fillet", weight: 2, means: ["wealthy"] },
    ],
    footwear: [
      { value: "none", weight: 6 },
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 1, means: ["wealthy"] },
    ],
    over: [
      { value: "mantle", weight: 4 },
      { value: "none", weight: 5 },
      { value: "shoulder-cloth", weight: 2 },
    ],
  },
  {
    id: "esa-modern",
    label: "East & Southern Africa · the shirt over the shuka",
    scope: { years: [1850, 10001], cultures: ["east-southern-african"] },
    garment: [
      { value: "shirt", weight: 5 },
      { value: "wrap", weight: 4 },
      { value: "long-tunic", weight: 3 },
      { value: "dress", weight: 4, sex: ["female"] },
      { value: "coat", weight: 2 },
    ],
    leggings: [
      { value: "sarong", weight: 4 },
      { value: "trousers", weight: 5 },
      { value: "none", weight: 3 },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "cap", weight: 3 },
      { value: "headscarf", weight: 4, sex: ["female"] },
      { value: "wrap", weight: 3 },
      { value: "brimmed", weight: 2 },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "shoes", weight: 4 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    over: [{ value: "mantle", weight: 3 }, { value: "none", weight: 6 }],
  },
];
