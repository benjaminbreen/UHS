import type { GarmentKit } from "../types";

/**
 * The Andes and Mesoamerica. Both dress from rectangles taken straight off the
 * loom and never cut: a poncho or tunic with a slit for the head, a wound
 * lower cloth, and a mantle knotted at the shoulder. So `poncho`, `mantle` and
 * `loincloth` carry these regions, and the flared European silhouettes have no
 * business here.
 *
 * Colour is the other half of it. Cochineal, indigo, relbunium and q'olle were
 * local and abundant, so brilliant cloth was ordinary here rather than a
 * luxury — the opposite of the European case. Both kits therefore carry their
 * own palettes, vivid at every rung, and banded patterning as the default.
 */
const andeanDyes = [
  { value: "relbunium" as const, weight: 6 },
  { value: "qolle" as const, weight: 6 },
  { value: "undyed" as const, weight: 5 },
  { value: "ochre" as const, weight: 4 },
  { value: "umber" as const, weight: 3 },
  { value: "chilca" as const, weight: 4 },
  { value: "indigo" as const, weight: 5 },
  { value: "cochineal" as const, weight: 4, means: ["common", "wealthy"] as const },
  { value: "vermilion" as const, weight: 2, means: ["wealthy"] as const },
  { value: "goldthread" as const, weight: 1, means: ["wealthy"] as const },
];
const mesoDyes = [
  { value: "achiote" as const, weight: 6 },
  { value: "mayablue" as const, weight: 6 },
  { value: "undyed" as const, weight: 5 },
  { value: "qolle" as const, weight: 4 },
  { value: "ochre" as const, weight: 3 },
  { value: "logwood" as const, weight: 4 },
  { value: "cochineal" as const, weight: 5, means: ["common", "wealthy"] as const },
  { value: "purpura" as const, weight: 2, means: ["wealthy"] as const },
  { value: "goldthread" as const, weight: 1, means: ["wealthy"] as const },
];
/** Bands off the loom, because that is how the cloth came off it. */
const banded = [
  { value: "stripes" as const, weight: 6 },
  { value: "band" as const, weight: 3 },
  { value: "yoke" as const, weight: 2 },
  { value: "plain" as const, weight: 2 },
];

export const americas: readonly GarmentKit[] = [
  {
    id: "andes",
    label: "Andes · the loomed rectangle",
    scope: { years: [-2500, 1550], cultures: ["andean"] },
    garment: [
      { value: "poncho", weight: 6 },
      { value: "tunic", weight: 5 },
      { value: "long-tunic", weight: 3, sex: ["female"] },
      { value: "loincloth", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "none", weight: 7 },
      { value: "wrapped", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 4 },
      { value: "cap", weight: 4 },
      { value: "band", weight: 4 },
      { value: "wrap", weight: 3 },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "fillet", weight: 2, means: ["wealthy"] },
      { value: "plume", weight: 2, means: ["wealthy"] },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "none", weight: 5 },
    ],
    belt: [
      { value: "sash", weight: 6 },
      { value: "cord", weight: 3 },
      { value: "none", weight: 2 },
    ],
    // The lliclla and its relatives: a rectangle pinned at the shoulder, and
    // usually the brightest thing anyone is wearing.
    over: [
      { value: "mantle", weight: 5 },
      { value: "none", weight: 4 },
      { value: "shoulder-cloth", weight: 2 },
    ],
    material: [
      { value: "wool", weight: 7 },
      { value: "cotton", weight: 5 },
      { value: "hide", weight: 1 },
    ],
    dye: andeanDyes,
    motif: banded,
  },
  {
    id: "andes-colonial",
    label: "Andes · the loom under the shirt",
    scope: { years: [1550, 10001], cultures: ["andean"] },
    garment: [
      { value: "shirt", weight: 5 },
      { value: "poncho", weight: 5 },
      { value: "tunic", weight: 3 },
      { value: "dress", weight: 3, sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 5 },
      { value: "none", weight: 3 },
      { value: "wide", weight: 2 },
    ],
    headwear: [
      { value: "brimmed", weight: 5 },
      { value: "cap", weight: 3 },
      { value: "none", weight: 3 },
      { value: "bowler", weight: 3, sex: ["female"] },
      { value: "band", weight: 2 },
    ],
    footwear: [
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 4 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    over: [
      { value: "mantle", weight: 4 },
      { value: "none", weight: 5 },
    ],
    material: [
      { value: "wool", weight: 7 },
      { value: "cotton", weight: 5 },
      { value: "synthetic", weight: 2 },
    ],
    dye: andeanDyes,
    motif: banded,
  },
  {
    id: "mesoamerica",
    label: "Mesoamerica · cotton off the backstrap loom",
    scope: { years: [-2000, 1550], cultures: ["mesoamerican"] },
    garment: [
      { value: "none", weight: 5, sex: ["male"] },
      { value: "poncho", weight: 4 },
      { value: "long-tunic", weight: 5, sex: ["female"] },
      { value: "tunic", weight: 3 },
      { value: "loincloth", weight: 5, means: ["poor", "common"], sex: ["male"] },
    ],
    leggings: [
      { value: "none", weight: 7 },
      { value: "sarong", weight: 3, sex: ["female"] },
    ],
    headwear: [
      { value: "none", weight: 5 },
      { value: "band", weight: 4 },
      { value: "wrap", weight: 3 },
      { value: "brimmed", weight: 2, livelihoods: ["farmer"] },
      { value: "plume", weight: 3, means: ["wealthy"] },
      { value: "fillet", weight: 2, means: ["wealthy"] },
    ],
    footwear: [
      { value: "none", weight: 6 },
      { value: "sandals", weight: 5 },
    ],
    belt: [
      { value: "sash", weight: 6 },
      { value: "cord", weight: 3 },
      { value: "none", weight: 2 },
    ],
    // The tilmatli, knotted at the shoulder, and the rank it carried.
    over: [
      { value: "mantle", weight: 5 },
      { value: "none", weight: 4 },
      { value: "shoulder-cloth", weight: 2 },
    ],
    material: [
      { value: "cotton", weight: 7 },
      { value: "jute", weight: 4 },
      { value: "barkcloth", weight: 3 },
      { value: "hide", weight: 1 },
    ],
    dye: mesoDyes,
    motif: banded,
  },
  {
    id: "mesoamerica-colonial",
    label: "Mesoamerica · the shirt over the loom",
    scope: { years: [1550, 10001], cultures: ["mesoamerican"] },
    garment: [
      { value: "shirt", weight: 5 },
      { value: "long-tunic", weight: 4, sex: ["female"] },
      { value: "poncho", weight: 3 },
      { value: "tunic", weight: 3 },
    ],
    leggings: [
      { value: "trousers", weight: 5 },
      { value: "none", weight: 3 },
      { value: "sarong", weight: 2, sex: ["female"] },
    ],
    headwear: [
      { value: "brimmed", weight: 6 },
      { value: "none", weight: 3 },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "cap", weight: 2 },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "shoes", weight: 3 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    over: [
      { value: "mantle", weight: 3 },
      { value: "none", weight: 6 },
    ],
    material: [
      { value: "cotton", weight: 7 },
      { value: "wool", weight: 3 },
      { value: "synthetic", weight: 2 },
    ],
    dye: mesoDyes,
    motif: banded,
  },
];
