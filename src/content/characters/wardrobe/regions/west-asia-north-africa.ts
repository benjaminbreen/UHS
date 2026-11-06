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
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
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
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
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
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
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
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
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
  {
    // Camel and goat herders of the Arabian and Syrian desert: a long shirt
    // (thawb), a head cloth held by a cord, the cloak (aba) of camel or goat
    // hair; women in long dark gowns, veiled.
    id: "bedouin",
    label: "Bedouin · thawb, head cloth and aba",
    scope: { years: [-1000, 1950], bounds: [37, 18, 52, 33] },
    garment: [{ value: "robe", weight: 7 }, { value: "long-tunic", weight: 3 }, { value: "dress", weight: 6, sex: ["female"] }],
    sleeves: [{ value: "long", weight: 8 }],
    headwear: [
      { value: "headscarf", weight: 7, sex: ["male"] },
      { value: "wrap", weight: 3, sex: ["male"] },
      { value: "veil", weight: 8, sex: ["female"] },
    ],
    leggings: [{ value: "none", weight: 6 }, { value: "wide", weight: 2 }],
    footwear: [{ value: "sandals", weight: 6 }, { value: "none", weight: 3, means: ["poor"] }],
    over: [{ value: "cloak", weight: 6 }, { value: "none", weight: 3 }],
    material: [{ value: "wool", weight: 5 }, { value: "cotton", weight: 4 }],
    dye: [{ value: "undyed", weight: 6 }, { value: "soot", weight: 4 }, { value: "indigo", weight: 3 }, { value: "bark", weight: 2 }],
  },
  {
    // Tuareg men veil the face with the tagelmust, the indigo staining the
    // skin blue; women go unveiled under a head cloth. Wide robes and trousers.
    id: "tuareg",
    label: "Tuareg · the indigo veil",
    scope: { years: [500, 1950], bounds: [-4, 16, 12, 26] },
    garment: [{ value: "robe", weight: 6 }, { value: "open-robe", weight: 3 }, { value: "dress", weight: 5, sex: ["female"] }],
    headwear: [{ value: "veil", weight: 9, sex: ["male"], ages: ["adult", "elder"] }, { value: "wrap", weight: 4, sex: ["male"] }, { value: "headscarf", weight: 7, sex: ["female"] }],
    leggings: [{ value: "wide", weight: 7 }],
    footwear: [{ value: "sandals", weight: 8 }],
    neck: [{ value: "beads", weight: 3 }, { value: "none", weight: 4 }],
    sidearm: [{ value: "sword", weight: 2, sex: ["male"], means: ["common", "wealthy"] }, { value: "none", weight: 6 }],
    dye: [{ value: "indigo", weight: 8 }, { value: "undyed", weight: 3 }, { value: "soot", weight: 2 }],
  },
  {
    // The Persepolis reliefs: Persians in the long pleated robe and fluted
    // hat, Medes in the riding coat, trousers and rounded felt cap.
    id: "persia-achaemenid",
    label: "Achaemenid Iran · the court robe and the Median coat",
    scope: { years: [-550, -330], bounds: [44, 25, 65, 40] },
    garment: [{ value: "robe", weight: 5 }, { value: "coat", weight: 4, sex: ["male"] }, { value: "dress", weight: 6, sex: ["female"] }],
    sleeves: [{ value: "loose", weight: 5, garments: ["robe"] }, { value: "long", weight: 5 }],
    leggings: [{ value: "trousers", weight: 6 }, { value: "none", weight: 3 }],
    headwear: [{ value: "cap", weight: 6, sex: ["male"] }, { value: "fillet", weight: 2, means: ["wealthy"] }, { value: "veil", weight: 5, sex: ["female"] }],
    footwear: [{ value: "shoes", weight: 7 }, { value: "boots", weight: 2 }],
    belt: [{ value: "sash", weight: 6 }, { value: "leather", weight: 3 }],
    dye: [{ value: "undyed", weight: 4 }, { value: "madder", weight: 3 }, { value: "kermes", weight: 2, means: ["wealthy"] }, { value: "indigo", weight: 2 }],
  },
  {
    // Parthian and Sasanian dress from the rock reliefs and silver plates:
    // a belted tunic over baggy trousers, the riding coat, ribbons streaming
    // from the cap of the well born.
    id: "persia-parthian-sasanian",
    label: "Parthian and Sasanian Iran · tunic and trousers",
    scope: { years: [-250, 651], bounds: [44, 25, 65, 40] },
    garment: [{ value: "tunic", weight: 6, sex: ["male"] }, { value: "coat", weight: 3, sex: ["male"] }, { value: "dress", weight: 6, sex: ["female"] }],
    sleeves: [{ value: "long", weight: 8 }],
    leggings: [{ value: "wide", weight: 6 }, { value: "trousers", weight: 3 }],
    headwear: [{ value: "cap", weight: 6, sex: ["male"] }, { value: "fillet", weight: 2, means: ["wealthy"] }, { value: "veil", weight: 5, sex: ["female"] }],
    footwear: [{ value: "boots", weight: 4 }, { value: "shoes", weight: 5 }],
    belt: [{ value: "leather", weight: 5 }, { value: "sash", weight: 4 }],
    hatTrim: [{ value: "ribbon", weight: 2, means: ["wealthy"] }, { value: "none", weight: 6 }],
    dye: [{ value: "madder", weight: 4 }, { value: "undyed", weight: 4 }, { value: "indigo", weight: 2 }, { value: "kermes", weight: 1, means: ["wealthy"] }],
    trimPattern: [{ value: "diamond", weight: 3 }, { value: "dots", weight: 3 }, { value: "none", weight: 3 }],
  },
  {
    // Safavid Iran: the long coat (qaba) sashed at the waist and the turban
    // wound round a tall cap; Isfahan's silks for those who could pay.
    id: "persia-safavid",
    label: "Safavid and Qajar Iran · qaba, sash and turban",
    scope: { years: [1501, 1900], bounds: [44, 25, 65, 40] },
    garment: [{ value: "open-robe", weight: 6 }, { value: "robe", weight: 4 }, { value: "dress", weight: 6, sex: ["female"] }],
    headwear: [{ value: "turban", weight: 7, sex: ["male"] }, { value: "cap", weight: 2, sex: ["male"] }, { value: "veil", weight: 7, sex: ["female"] }],
    leggings: [{ value: "wide", weight: 6 }, { value: "trousers", weight: 2 }],
    belt: [{ value: "sash", weight: 9 }],
    material: [{ value: "cotton", weight: 6 }, { value: "silk", weight: 3, means: ["wealthy"] }, { value: "wool", weight: 2 }],
    dye: [{ value: "madder", weight: 3 }, { value: "indigo", weight: 3 }, { value: "pomegranate", weight: 2 }, { value: "undyed", weight: 3 }, { value: "goldthread", weight: 1, means: ["wealthy"] }],
  },
];
