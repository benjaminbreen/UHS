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
    cut: [{ value: "full", garments: ["robe", "open-robe"] }],
    sleeves: [{ value: "short", weight: 3, garments: ["tunic", "long-tunic", "shirt", "dress", "skirt"] }, { value: "loose", weight: 6, garments: ["robe", "open-robe", "long-tunic"] }, { value: "long", weight: 2 }],
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
    cut: [{ value: "full", garments: ["robe", "open-robe"] }],
    sleeves: [{ value: "short", weight: 3, garments: ["tunic", "long-tunic", "shirt", "dress", "skirt"] }, { value: "loose", weight: 6, garments: ["robe", "open-robe", "long-tunic"] }, { value: "long", weight: 2 }],
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
    // The Edo kingdom until the British sack of 1897. The court bronzes and
    // Portuguese accounts show men in a wrapper, bare above the waist or with
    // a cloth over one shoulder, and title-holders in coral beads at the neck
    // and on the head. The robe of the savanna is rare this far south.
    id: "wca-benin",
    label: "Benin · the wrapper and coral",
    scope: { years: [1300, 1897], cultures: ["west-central-african"], bounds: [4.5, 5.5, 7.5, 7.5] },
    garment: [
      { value: "none", weight: 6, sex: ["male"] },
      { value: "wrap", weight: 6 },
      { value: "open-robe", weight: 1, means: ["wealthy"] },
    ],
    leggings: [{ value: "sarong", weight: 9 }, { value: "none", weight: 1, means: ["poor"] }],
    headwear: [
      { value: "none", weight: 7 },
      { value: "cap", weight: 3, means: ["wealthy"] },
      { value: "wrap", weight: 2, sex: ["female"] },
      { value: "band", weight: 1 },
    ],
    footwear: [{ value: "none", weight: 9 }, { value: "sandals", weight: 2, means: ["common", "wealthy"] }],
    over: [{ value: "none", weight: 5 }, { value: "shoulder-cloth", weight: 4 }],
    neck: [
      { value: "beads", weight: 6, means: ["wealthy"] },
      { value: "beads", weight: 2 },
      { value: "none", weight: 5 },
    ],
    dye: [
      { value: "undyed", weight: 5 },
      { value: "indigo", weight: 5 },
      { value: "morinda", weight: 4 },
      { value: "bark", weight: 2 },
      { value: "safflower", weight: 2, means: ["wealthy"] },
    ],
  },
  {
    id: "wca-modern",
    label: "West & Central Africa · the robe beside the shirt",
    scope: { years: [1900, 10001], cultures: ["west-central-african"] },
    cut: [{ value: "full", garments: ["robe", "open-robe"] }],
    sleeves: [{ value: "short", weight: 3, garments: ["tunic", "long-tunic", "shirt", "dress", "skirt"] }, { value: "loose", weight: 6, garments: ["robe", "open-robe", "long-tunic"] }, { value: "long", weight: 2 }],
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
  {
    // Fulbe herders: the men's wide robe and trousers, the conical leather and
    // straw hat against the sun, a staff over the shoulders; women in wrapped
    // cloth with amber, beads and brass in the hair.
    id: "fulani",
    label: "Fulbe herders · the wide robe and the sun hat",
    scope: { years: [1000, 1950], bounds: [-17, 9, 16, 17] },
    garment: [
      { value: "open-robe", weight: 5, sex: ["male"] },
      { value: "tunic", weight: 3, sex: ["male"] },
      { value: "wrap", weight: 7, sex: ["female"] },
    ],
    headwear: [
      { value: "conical", weight: 4, sex: ["male"], livelihoods: ["herder"] },
      { value: "wrap", weight: 3, sex: ["male"] },
      { value: "headscarf", weight: 5, sex: ["female"] },
    ],
    leggings: [{ value: "wide", weight: 6, sex: ["male"] }, { value: "sarong", weight: 6, sex: ["female"] }],
    neck: [{ value: "beads", weight: 5 }, { value: "none", weight: 3 }],
    accessory: [{ value: "walking-cane", weight: 4, livelihoods: ["herder"] }, { value: "none", weight: 4 }],
    dye: [{ value: "indigo", weight: 5 }, { value: "undyed", weight: 5 }, { value: "bleached", weight: 2 }],
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
    cut: [{ value: "full", garments: ["robe", "open-robe"] }],
    sleeves: [{ value: "short", weight: 3, garments: ["tunic", "long-tunic", "shirt", "dress", "skirt"] }, { value: "loose", weight: 6, garments: ["robe", "open-robe", "long-tunic"] }, { value: "long", weight: 2 }],
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
    cut: [{ value: "full", garments: ["robe", "open-robe"] }],
    sleeves: [{ value: "short", weight: 3, garments: ["tunic", "long-tunic", "shirt", "dress", "skirt"] }, { value: "loose", weight: 6, garments: ["robe", "open-robe", "long-tunic"] }, { value: "long", weight: 2 }],
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
    cut: [{ value: "full", garments: ["robe", "open-robe"] }],
    sleeves: [{ value: "short", weight: 3, garments: ["tunic", "long-tunic", "shirt", "dress", "skirt"] }, { value: "loose", weight: 6, garments: ["robe", "open-robe", "long-tunic"] }, { value: "long", weight: 2 }],
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
  {
    // Kilwa, Mombasa, Lamu: men in the long white kanzu and an embroidered cap,
    // women in wrapped cloths with the head covered, cotton from India and
    // the coast's own looms.
    id: "swahili",
    label: "Swahili coast · the kanzu and the wrapped cloth",
    scope: { years: [900, 1900], bounds: [38.5, -12, 44, 4.5] },
    garment: [
      { value: "long-tunic", weight: 7, sex: ["male"] },
      { value: "wrap", weight: 3, sex: ["male"], means: ["poor"] },
      { value: "wrap", weight: 7, sex: ["female"] },
      { value: "dress", weight: 2, sex: ["female"] },
    ],
    leggings: [{ value: "sarong", weight: 7 }, { value: "none", weight: 2 }],
    headwear: [
      { value: "cap", weight: 7, sex: ["male"] },
      { value: "turban", weight: 2, sex: ["male"], means: ["wealthy"] },
      { value: "headscarf", weight: 5, sex: ["female"] },
      { value: "veil", weight: 3, sex: ["female"], means: ["common", "wealthy"] },
    ],
    footwear: [{ value: "sandals", weight: 7 }, { value: "none", weight: 2, means: ["poor"] }],
    over: [{ value: "none", weight: 6 }, { value: "shoulder-cloth", weight: 2 }],
    material: [{ value: "cotton", weight: 8 }, { value: "silk", weight: 1, means: ["wealthy"] }],
    dye: [{ value: "bleached", weight: 6 }, { value: "undyed", weight: 3 }, { value: "indigo", weight: 3 }, { value: "madder", weight: 1 }],
  },
  {
    // The highlands: white cotton for everyone, the shamma wrapped over the
    // shoulders, a woven coloured border (tibeb) on the women's dresses,
    // narrow trousers for men, bare feet.
    id: "ethiopian-highlands",
    label: "Ethiopian highlands · white cotton and the shamma",
    scope: { years: [300, 1950], bounds: [35, 6, 42.5, 15.5] },
    garment: [
      { value: "long-tunic", weight: 6, sex: ["male"] },
      { value: "tunic", weight: 3, sex: ["male"] },
      { value: "dress", weight: 8, sex: ["female"] },
    ],
    sleeves: [{ value: "long", weight: 8 }],
    motif: [{ value: "band", weight: 7 }, { value: "plain", weight: 2 }],
    leggings: [{ value: "trousers", weight: 6, sex: ["male"] }, { value: "none", weight: 4 }],
    headwear: [{ value: "none", weight: 6 }, { value: "wrap", weight: 3 }, { value: "headscarf", weight: 3, sex: ["female"] }],
    footwear: [{ value: "none", weight: 7 }, { value: "sandals", weight: 2 }],
    over: [{ value: "shoulder-cloth", weight: 7 }, { value: "mantle", weight: 2 }, { value: "none", weight: 2 }],
    material: [{ value: "cotton" }],
    dye: [{ value: "bleached", weight: 6 }, { value: "undyed", weight: 5 }],
    trimPattern: [{ value: "diamond", weight: 4 }, { value: "step", weight: 3 }, { value: "cross-stitch", weight: 2 }],
  },
  {
    // The Zimbabwe plateau: cotton was spun at Great Zimbabwe and Ingombe
    // Ilede, but hide aprons and skin cloaks stayed ordinary; copper and gold
    // beads and wire for the rich.
    id: "shona",
    label: "Zimbabwe plateau · hide, cotton and beads",
    scope: { years: [1000, 1900], bounds: [25, -23, 34, -15] },
    garment: [
      { value: "loincloth", weight: 4, sex: ["male"] },
      { value: "wrap", weight: 5 },
      { value: "none", weight: 3, sex: ["male"] },
      { value: "skirt", weight: 4, sex: ["female"] },
    ],
    leggings: [{ value: "none", weight: 7 }, { value: "sarong", weight: 3 }],
    headwear: [{ value: "none", weight: 6 }, { value: "band", weight: 3 }, { value: "fillet", weight: 1, means: ["wealthy"] }],
    footwear: [{ value: "none", weight: 8 }, { value: "sandals", weight: 2 }],
    over: [{ value: "mantle", weight: 5 }, { value: "none", weight: 4 }],
    neck: [{ value: "beads", weight: 6 }, { value: "none", weight: 3 }],
    material: [{ value: "hide", weight: 5 }, { value: "cotton", weight: 3 }, { value: "barkcloth", weight: 2 }],
    dye: [{ value: "undyed", weight: 5 }, { value: "ochre", weight: 3 }, { value: "bark", weight: 3 }],
  },
  {
    // Nguni men in a hide apron front and back and a skin cloak, women in the
    // pleated leather skirt of married women; beadwork and feathers marked
    // rank and age.
    id: "nguni",
    label: "Nguni · hide aprons, skin cloaks and beadwork",
    scope: { years: [1000, 1900], bounds: [27, -34, 33, -24] },
    garment: [
      { value: "loincloth", weight: 6, sex: ["male"] },
      { value: "none", weight: 3, sex: ["male"] },
      { value: "skirt", weight: 7, sex: ["female"] },
    ],
    leggings: [{ value: "none" }],
    headwear: [{ value: "none", weight: 5 }, { value: "band", weight: 4 }, { value: "plume", weight: 2, means: ["wealthy"] }],
    footwear: [{ value: "none" }],
    over: [{ value: "mantle", weight: 5 }, { value: "none", weight: 5 }],
    neck: [{ value: "beads", weight: 7 }, { value: "none", weight: 2 }],
    material: [{ value: "hide", weight: 8 }, { value: "fur", weight: 2 }],
    dye: [{ value: "undyed", weight: 5 }, { value: "ochre", weight: 3 }, { value: "bark", weight: 3 }],
  },
];
