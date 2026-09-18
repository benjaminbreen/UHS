import type { GarmentKit, Option } from "../types";

/**
 * Sets that cut across region. A uniform, a pressure suit and court dress are
 * not regional dress with local variations — they are the same object issued
 * or copied everywhere, which is exactly why they need `priority`: they beat
 * whatever the place would otherwise have worn.
 *
 * All but the aristocratic set and the future set are reached by role, which
 * is how a world-weaver prompt gets at them: ask for a sailor and you get a
 * sailor, wherever and whenever the world is set.
 */
const anyone = <T,>(v: T, weight = 1): Option<T> => ({ value: v, weight });

/** Post-2020. Deliberately restrained: everyday clothing that survived, plus
 * the coverall, and colour that costs nothing to make. */
export const futureDress: readonly GarmentKit[] = [
  {
    id: "future",
    label: "After 2020 · synthetic everyday",
    scope: { years: [2020, 10001] },
    priority: 1,
    garment: [
      anyone("shirt", 6),
      anyone("coat", 4),
      anyone("suit", 4),
      anyone("long-tunic", 2),
      { value: "dress", weight: 3, sex: ["female"] },
      { value: "gown", weight: 1, means: ["elite"] },
    ],
    leggings: [anyone("trousers", 7), anyone("wide", 2), anyone("hose", 2)],
    headwear: [
      anyone("none", 6),
      { value: "ball-cap", weight: 3, ages: ["child", "youth", "adult"] },
      anyone("visor", 2),
      anyone("cap", 2),
      { value: "headscarf", weight: 2, sex: ["female"] },
      anyone("brimmed", 1),
    ],
    footwear: [anyone("shoes", 7), anyone("boots", 4), anyone("sandals", 2)],
    material: [
      anyone("synthetic", 7),
      anyone("cotton", 4),
      anyone("wool", 1),
    ],
    dye: [
      anyone("white", 4),
      anyone("vat", 4),
      anyone("chrome", 3),
      anyone("soot", 3),
      anyone("ash", 3),
      anyone("aniline", 3),
      anyone("bleached", 2),
      anyone("vermilion", 2),
      { value: "goldthread", weight: 1, means: ["wealthy", "elite"] },
    ],
    motif: [anyone("plain", 6), anyone("band", 2), anyone("placket", 2)],
  },
];

export const workingSets: readonly GarmentKit[] = [
  {
    id: "astronaut",
    label: "Crew · pressure suit",
    scope: { years: [1957, 10001] },
    priority: 3,
    garment: [{ value: "suit", roles: ["astronaut"] }],
    leggings: [{ value: "trousers", roles: ["astronaut"] }],
    headwear: [
      { value: "visor", weight: 5, roles: ["astronaut"] },
      { value: "cap", weight: 2, roles: ["astronaut"] },
      { value: "none", weight: 2, roles: ["astronaut"] },
    ],
    footwear: [{ value: "boots", roles: ["astronaut"] }],
    belt: [{ value: "wide", roles: ["astronaut"] }],
    over: [{ value: "none", roles: ["astronaut"] }],
    material: [{ value: "synthetic", roles: ["astronaut"] }],
    dye: [
      { value: "white", weight: 6, roles: ["astronaut"] },
      { value: "bleached", weight: 3, roles: ["astronaut"] },
      { value: "vermilion", weight: 2, roles: ["astronaut"] },
      { value: "vat", weight: 2, roles: ["astronaut"] },
    ],
    motif: [{ value: "plain", roles: ["astronaut"] }],
  },
  {
    id: "soldier-modern",
    label: "Soldier · the world wars",
    scope: { years: [1900, 1960] },
    priority: 3,
    garment: [
      { value: "coat", weight: 5, roles: ["soldier"] },
      { value: "shirt", weight: 3, roles: ["soldier"] },
    ],
    leggings: [
      { value: "trousers", weight: 6, roles: ["soldier"] },
      { value: "wrapped", weight: 4, roles: ["soldier"] },
    ],
    headwear: [
      { value: "helmet", weight: 6, roles: ["soldier"] },
      { value: "cap", weight: 4, roles: ["soldier"] },
      { value: "none", weight: 1, roles: ["soldier"] },
    ],
    footwear: [{ value: "boots", roles: ["soldier"] }],
    belt: [
      { value: "leather", weight: 5, roles: ["soldier"] },
      { value: "wide", weight: 3, roles: ["soldier"] },
    ],
    over: [
      { value: "none", weight: 6, roles: ["soldier"] },
      { value: "cloak", weight: 2, roles: ["soldier"] },
    ],
    material: [
      { value: "wool", weight: 6, roles: ["soldier"] },
      { value: "cotton", weight: 3, roles: ["soldier"] },
    ],
    // Khaki and field grey: the whole point is not being seen.
    dye: [
      { value: "bark", weight: 5, roles: ["soldier"] },
      { value: "ash", weight: 5, roles: ["soldier"] },
      { value: "umber", weight: 4, roles: ["soldier"] },
      { value: "chilca", weight: 3, roles: ["soldier"] },
      { value: "ochre", weight: 3, roles: ["soldier"] },
    ],
    motif: [
      { value: "placket", weight: 4, roles: ["soldier"] },
      { value: "plain", weight: 4, roles: ["soldier"] },
    ],
  },
  {
    id: "soldier-early",
    label: "Soldier · before the world wars",
    scope: { years: [-1000000, 1900] },
    priority: 2,
    garment: [
      { value: "coat", weight: 5, roles: ["soldier"] },
      { value: "tunic", weight: 4, roles: ["soldier"] },
    ],
    headwear: [
      { value: "helmet", weight: 5, roles: ["soldier"] },
      { value: "cap", weight: 3, roles: ["soldier"] },
      { value: "conical", weight: 1, roles: ["soldier"] },
    ],
    footwear: [{ value: "boots", roles: ["soldier"] }],
    belt: [{ value: "wide", roles: ["soldier"] }],
  },
  {
    id: "sailor",
    label: "Sailor · at sea",
    scope: { years: [-1000000, 10001] },
    priority: 2,
    garment: [
      { value: "shirt", weight: 6, roles: ["sailor"] },
      { value: "coat", weight: 3, roles: ["sailor"] },
      { value: "none", weight: 2, roles: ["sailor"], sex: ["male"] },
    ],
    // Wide-cut at the ankle, so they roll clear of the water.
    leggings: [
      { value: "wide", weight: 6, roles: ["sailor"] },
      { value: "trousers", weight: 3, roles: ["sailor"] },
      { value: "none", weight: 1, roles: ["sailor"] },
    ],
    headwear: [
      { value: "cap", weight: 5, roles: ["sailor"] },
      { value: "wrap", weight: 3, roles: ["sailor"] },
      { value: "brimmed", weight: 3, roles: ["sailor"] },
      { value: "none", weight: 2, roles: ["sailor"] },
    ],
    footwear: [
      { value: "none", weight: 4, roles: ["sailor"] },
      { value: "shoes", weight: 4, roles: ["sailor"] },
      { value: "boots", weight: 2, roles: ["sailor"] },
    ],
    belt: [{ value: "sash", weight: 4, roles: ["sailor"] }],
    // The stripe is real, and it is the one thing everyone recognises.
    motif: [
      { value: "stripes", weight: 6, roles: ["sailor"] },
      { value: "plain", weight: 3, roles: ["sailor"] },
    ],
    dye: [
      { value: "indigo", weight: 5, roles: ["sailor"] },
      { value: "bleached", weight: 5, roles: ["sailor"] },
      { value: "undyed", weight: 4, roles: ["sailor"] },
      { value: "soot", weight: 2, roles: ["sailor"] },
    ],
  },
];

/**
 * Court dress. Keyed to `elite`, which is one person in five hundred, so this
 * turns up as the occasional astonishing figure in a street rather than as a
 * fashion — the emperor, not the merchant. A role of "king" or "duchess" on a
 * world-weaver prompt also reaches it.
 */
export const courtDress: readonly GarmentKit[] = [
  {
    id: "court-18c",
    label: "Court · wigs and panniers",
    scope: { years: [1650, 1830] },
    priority: 2,
    garment: [
      { value: "gown", weight: 7, means: ["elite"], sex: ["female"] },
      { value: "coat", weight: 6, means: ["elite"], sex: ["male"] },
      { value: "open-robe", weight: 3, means: ["elite"] },
      { value: "robe", weight: 2, means: ["elite"] },
    ],
    leggings: [
      { value: "hose", weight: 7, means: ["elite"] },
      { value: "none", weight: 2, means: ["elite"] },
    ],
    headwear: [
      { value: "wig", weight: 7, means: ["elite"] },
      { value: "fillet", weight: 2, means: ["elite"] },
      { value: "plume", weight: 2, means: ["elite"], sex: ["female"] },
      { value: "brimmed", weight: 2, means: ["elite"] },
    ],
    footwear: [
      { value: "shoes", weight: 7, means: ["elite"] },
      { value: "boots", weight: 2, means: ["elite"] },
    ],
    belt: [{ value: "sash", weight: 5, means: ["elite"] }],
    over: [
      { value: "cloak", weight: 4, means: ["elite"] },
      { value: "mantle", weight: 3, means: ["elite"] },
      { value: "none", weight: 3, means: ["elite"] },
    ],
    material: [
      { value: "silk", weight: 8, means: ["elite"] },
      { value: "linen", weight: 2, means: ["elite"] },
    ],
    dye: [
      { value: "tyrian", weight: 4, means: ["elite"] },
      { value: "goldthread", weight: 4, means: ["elite"] },
      { value: "kermes", weight: 4, means: ["elite"] },
      { value: "cochineal", weight: 3, means: ["elite"] },
      { value: "indigo", weight: 3, means: ["elite"] },
      { value: "bleached", weight: 3, means: ["elite"] },
      { value: "saffron", weight: 2, means: ["elite"] },
    ],
    motif: [
      { value: "yoke", weight: 4, means: ["elite"] },
      { value: "placket", weight: 4, means: ["elite"] },
      { value: "band", weight: 3, means: ["elite"] },
    ],
  },
  {
    id: "court-19c",
    label: "Court · the long century of state dress",
    scope: { years: [1830, 1920] },
    priority: 2,
    garment: [
      { value: "gown", weight: 7, means: ["elite"], sex: ["female"] },
      { value: "coat", weight: 7, means: ["elite"], sex: ["male"] },
      { value: "dress", weight: 2, means: ["elite"], sex: ["female"] },
    ],
    leggings: [
      { value: "trousers", weight: 6, means: ["elite"] },
      { value: "hose", weight: 3, means: ["elite"] },
    ],
    headwear: [
      { value: "bowler", weight: 4, means: ["elite"], sex: ["male"] },
      { value: "brimmed", weight: 4, means: ["elite"] },
      { value: "fillet", weight: 3, means: ["elite"] },
      { value: "plume", weight: 2, means: ["elite"], sex: ["female"] },
      { value: "none", weight: 2, means: ["elite"] },
    ],
    footwear: [
      { value: "shoes", weight: 5, means: ["elite"] },
      { value: "boots", weight: 5, means: ["elite"] },
    ],
    over: [
      { value: "mantle", weight: 4, means: ["elite"] },
      { value: "cloak", weight: 3, means: ["elite"] },
      { value: "none", weight: 4, means: ["elite"] },
    ],
    material: [
      { value: "silk", weight: 8, means: ["elite"] },
      { value: "wool", weight: 3, means: ["elite"] },
    ],
    dye: [
      { value: "goldthread", weight: 4, means: ["elite"] },
      { value: "tyrian", weight: 3, means: ["elite"] },
      { value: "cochineal", weight: 4, means: ["elite"] },
      { value: "soot", weight: 4, means: ["elite"] },
      { value: "bleached", weight: 3, means: ["elite"] },
      { value: "indigo", weight: 3, means: ["elite"] },
    ],
  },
];

export const specialSets: readonly GarmentKit[] = [
  ...workingSets,
  ...courtDress,
  ...futureDress,
];
