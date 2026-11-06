import type { GarmentKit, Option } from "../types";
import { clothTrades, kerchiefTrades, tradeAprons } from "./work-dress";

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
const grown = ["youth", "adult", "elder"] as const;
// Bib overalls: denim on the farm, the railway and the shop floor from the 1890s.
const overallTrades = [
  "farmer", "farm-hand", "farm-labourer", "farm-worker", "agricultural-labourer", "tenant-farmer", "sharecropper",
  "homesteader", "dairy-farmer", "railway-labourer", "factory-hand", "machine-operator", "motor-mechanic",
  "painter-and-decorator", "plumber", "electrician", "welder", "boilermaker", "construction-labourer", "carpenter",
];
/** The working apron, with the wrap pinafore in place of the waist apron for
 * women of the house, the laundry and the kitchen. */
const pinafores = (overalls: number): readonly Option<"none" | "cloth" | "leather" | "pinafore" | "overalls">[] => [
  ...tradeAprons.filter((o) => o.value !== "cloth"),
  { value: "pinafore", sex: ["female"], livelihoods: clothTrades, weight: 8 },
  { value: "cloth", sex: ["male"], livelihoods: clothTrades, weight: 3 },
  { value: "pinafore", sex: ["female"], means: ["poor", "common"], weight: 2 },
  { value: "none", sex: ["female"], weight: 3 },
  { value: "overalls", sex: ["male"], livelihoods: overallTrades, weight: overalls },
  { value: "none", sex: ["male"], livelihoods: overallTrades, weight: 2 },
];
/** The necktie on every man above the poorest, the knotted kerchief at work. */
const neckties = (bow: number): readonly Option<"none" | "neckerchief" | "necktie" | "bow-tie">[] => [
  { value: "necktie", sex: ["male"], ages: grown, means: ["common", "wealthy"], weight: 6 },
  { value: "bow-tie", sex: ["male"], ages: grown, means: ["wealthy"], weight: bow },
  { value: "necktie", sex: ["male"], ages: grown, means: ["poor"], weight: 2 },
  { value: "neckerchief", sex: ["male"], livelihoods: kerchiefTrades, weight: 3 },
  { value: "none", sex: ["male"], weight: 2 },
];

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
    headwear: [{ value: "top-hat", weight: 4, sex: ["male"], means: ["wealthy"], ranks: ["gentry", "elite"], ages: ["adult", "elder"] },
      { value: "bowler", weight: 4, sex: ["male"], means: ["wealthy"] },
      { value: "brimmed", weight: 2, sex: ["female"], means: ["wealthy"] }],
    leggings: [{ value: "trousers", sex: ["male"] }],
    belt: [{ value: "none", garments: ["coat", "dress", "skirt"] }],
    over: [{ value: "none", weight: 8 }, { value: "cloak", weight: 1 }],
    dye: [{ value: "soot", weight: 5, garments: ["coat"] }, { value: "ash", weight: 3, garments: ["coat"] },
      { value: "walnut", weight: 2, garments: ["coat"] }],
    motif: [{ value: "plain" }],
    accessory: [{ value: "walking-cane", weight: 3, sex: ["male"], means: ["wealthy"], ages: ["adult", "elder"], garments: ["coat"] },
      { value: "fan", weight: 1, sex: ["female"], means: ["wealthy"], ages: ["adult", "elder"] },
      { value: "walking-cane", weight: 2, ages: ["elder"] }, { value: "none", weight: 5 }],
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
  // Europe and the settler towns it dressed, decade by decade from the bowler
  // to the end of the hat. A hat outdoors was all but universal until the
  // 1950s, and which hat dated and placed a person more than anything else.
  {
    id: "eu-belle-epoque",
    label: "Europe · bowlers, boaters and the shirtwaist",
    scope: { years: [1880, 1915], cultures: ["european"] },
    garment: [
      { value: "coat", weight: 6, sex: ["male"], ages: grown, means: ["common", "wealthy"] },
      { value: "shirt", weight: 5, sex: ["male"] },
      { value: "dress", weight: 5, sex: ["female"] },
      // The shirtwaist: a blouse over a separate skirt, the working woman's dress.
      { value: "skirt", weight: 5, sex: ["female"] },
    ],
    sleeves: [{ value: "long" }],
    motif: [
      { value: "collar", weight: 5, sex: ["female"], garments: ["skirt", "dress"] },
      { value: "plain", weight: 2, sex: ["female"] },
      { value: "placket", weight: 3, sex: ["male"], garments: ["shirt"] },
      { value: "plain", weight: 3, sex: ["male"] },
    ],
    headwear: [
      { value: "bowler", weight: 5, sex: ["male"], ages: grown, means: ["common", "wealthy"] },
      { value: "flat-cap", weight: 6, sex: ["male"], means: ["poor", "common"] },
      { value: "boater", weight: 2, sex: ["male"], ages: ["youth", "adult"] },
      { value: "top-hat", weight: 3, sex: ["male"], ages: ["adult", "elder"], ranks: ["gentry", "elite"] },
      { value: "brimmed", weight: 5, sex: ["female"], ages: grown, means: ["common", "wealthy"] },
      { value: "boater", weight: 2, sex: ["female"], ages: ["youth", "adult"] },
      { value: "kerchief", weight: 4, sex: ["female"], means: ["poor"] },
      { value: "kerchief", weight: 1, sex: ["female"], means: ["common"] },
      { value: "none", weight: 2, sex: ["female"] },
      { value: "none", weight: 1, ages: ["child", "youth"] },
    ],
    // Plumes on the wide hats of the 1900s; grosgrain on the men's.
    hatTrim: [
      { value: "feather", weight: 3, sex: ["female"] },
      { value: "ribbon", weight: 3, sex: ["female"] },
      { value: "ribbon", weight: 2, sex: ["male"] },
      { value: "none", weight: 1 },
    ],
    leggings: [
      { value: "trousers", sex: ["male", "unspecified"] },
      { value: "hose", sex: ["female"] },
    ],
    footwear: [{ value: "boots", weight: 6 }, { value: "shoes", weight: 3 }, { value: "none", weight: 1, means: ["poor"], ages: ["child"] }],
    belt: [{ value: "leather", weight: 3, garments: ["shirt", "skirt"] }, { value: "none", weight: 3 }],
    over: [{ value: "none" }],
    neckwear: neckties(1),
    apron: pinafores(1),
  },
  {
    id: "eu-twenties",
    label: "Europe · the cloche and the trilby",
    scope: { years: [1915, 1930], cultures: ["european"] },
    garment: [
      { value: "coat", weight: 6, sex: ["male"], ages: grown, means: ["common", "wealthy"] },
      { value: "shirt", weight: 5, sex: ["male"] },
      { value: "dress", weight: 7, sex: ["female"] },
      { value: "skirt", weight: 3, sex: ["female"] },
    ],
    sleeves: [{ value: "long", weight: 3 }, { value: "short", weight: 2, sex: ["female"] }],
    motif: [
      { value: "collar", weight: 3, sex: ["female"] },
      { value: "plain", weight: 4, sex: ["female"] },
      { value: "placket", weight: 3, sex: ["male"], garments: ["shirt"] },
      { value: "plain", weight: 3, sex: ["male"] },
    ],
    headwear: [
      { value: "fedora", weight: 5, sex: ["male"], ages: grown, means: ["common", "wealthy"] },
      { value: "flat-cap", weight: 6, sex: ["male"], means: ["poor", "common"] },
      { value: "bowler", weight: 2, sex: ["male"], ages: ["adult", "elder"], means: ["common", "wealthy"] },
      { value: "boater", weight: 2, sex: ["male"], ages: ["youth", "adult"] },
      { value: "cloche", weight: 7, sex: ["female"], ages: grown, means: ["common", "wealthy"] },
      { value: "cloche", weight: 2, sex: ["female"], ages: grown, means: ["poor"] },
      { value: "kerchief", weight: 3, sex: ["female"], means: ["poor"] },
      { value: "none", weight: 1 },
    ],
    hatTrim: [
      { value: "ribbon", weight: 2, sex: ["female"] },
      { value: "feather", weight: 1, sex: ["female"], means: ["wealthy"] },
      { value: "none", weight: 3 },
    ],
    leggings: [
      { value: "trousers", sex: ["male", "unspecified"] },
      { value: "hose", sex: ["female"] },
    ],
    footwear: [{ value: "shoes", weight: 6 }, { value: "boots", weight: 3, means: ["poor", "common"] }],
    belt: [{ value: "leather", weight: 2, garments: ["shirt", "skirt"] }, { value: "none", weight: 3 }],
    over: [{ value: "none" }],
    neckwear: neckties(1),
    apron: pinafores(2),
  },
  {
    id: "eu-thirties",
    label: "Europe · the snap-brim, the beret and the kerchief",
    scope: { years: [1930, 1946], cultures: ["european"] },
    garment: [
      { value: "coat", weight: 5, sex: ["male"], ages: grown, means: ["common", "wealthy"] },
      { value: "shirt", weight: 6, sex: ["male"] },
      { value: "dress", weight: 7, sex: ["female"] },
      { value: "skirt", weight: 3, sex: ["female"] },
    ],
    sleeves: [{ value: "short", weight: 3, sex: ["female"] }, { value: "long", weight: 2 }],
    motif: [
      { value: "collar", weight: 4, sex: ["female"] },
      { value: "plain", weight: 3, sex: ["female"] },
      { value: "placket", weight: 3, sex: ["male"], garments: ["shirt"] },
      { value: "plain", weight: 3, sex: ["male"] },
    ],
    headwear: [
      { value: "fedora", weight: 7, sex: ["male"], ages: grown, means: ["common", "wealthy"] },
      { value: "fedora", weight: 2, sex: ["male"], ages: grown, means: ["poor"] },
      { value: "flat-cap", weight: 5, sex: ["male"], means: ["poor", "common"] },
      { value: "beret", weight: 1, sex: ["male"] },
      { value: "none", weight: 1, sex: ["male"] },
      { value: "pillbox", weight: 2, sex: ["female"], ages: grown, means: ["common", "wealthy"] },
      { value: "beret", weight: 3, sex: ["female"], ages: grown },
      { value: "brimmed", weight: 2, sex: ["female"], ages: grown, means: ["common", "wealthy"] },
      { value: "kerchief", weight: 5, sex: ["female"], means: ["poor", "common"] },
      { value: "none", weight: 1 },
    ],
    hatTrim: [
      { value: "feather", weight: 1, sex: ["female"] },
      { value: "ribbon", weight: 1, sex: ["female"] },
      { value: "none", weight: 3 },
    ],
    leggings: [
      { value: "trousers", sex: ["male", "unspecified"] },
      { value: "hose", weight: 6, sex: ["female"] },
      // Slacks for war work and the weekend.
      { value: "trousers", weight: 1, sex: ["female"], ages: ["youth", "adult"] },
    ],
    footwear: [{ value: "shoes", weight: 7 }, { value: "boots", weight: 2, means: ["poor", "common"] }],
    belt: [{ value: "leather", weight: 3, garments: ["shirt", "skirt", "dress"] }, { value: "none", weight: 2 }],
    over: [{ value: "none" }],
    neckwear: neckties(1),
    apron: pinafores(3),
  },
  {
    id: "eu-postwar",
    label: "Europe · the last of the hats",
    scope: { years: [1946, 1962], cultures: ["european"] },
    garment: [
      { value: "coat", weight: 5, sex: ["male"], ages: grown, means: ["common", "wealthy"] },
      { value: "shirt", weight: 6, sex: ["male"] },
      { value: "dress", weight: 6, sex: ["female"] },
      { value: "skirt", weight: 4, sex: ["female"] },
    ],
    sleeves: [{ value: "short", weight: 3 }, { value: "long", weight: 2 }],
    motif: [
      { value: "collar", weight: 3, sex: ["female"] },
      { value: "plain", weight: 4, sex: ["female"] },
      { value: "plaid", weight: 2, sex: ["male"], garments: ["shirt"] },
      { value: "placket", weight: 2, sex: ["male"], garments: ["shirt"] },
      { value: "plain", weight: 3, sex: ["male"] },
    ],
    headwear: [
      { value: "fedora", weight: 5, sex: ["male"], ages: ["adult", "elder"] },
      { value: "flat-cap", weight: 2, sex: ["male"], means: ["poor", "common"] },
      { value: "none", weight: 4, sex: ["male"] },
      { value: "pillbox", weight: 2, sex: ["female"], ages: grown, means: ["common", "wealthy"] },
      { value: "kerchief", weight: 3, sex: ["female"] },
      { value: "none", weight: 6, sex: ["female"] },
      { value: "none", weight: 1 },
    ],
    leggings: [
      { value: "trousers", sex: ["male", "unspecified"] },
      { value: "hose", weight: 5, sex: ["female"] },
      { value: "trousers", weight: 1, sex: ["female"], ages: ["youth", "adult"] },
    ],
    footwear: [{ value: "shoes", weight: 7 }, { value: "boots", weight: 2, means: ["poor", "common"] }, { value: "sneakers", weight: 2, ages: ["child", "youth"] }],
    belt: [{ value: "leather", weight: 4, garments: ["shirt", "skirt", "dress"] }, { value: "none", weight: 2 }],
    over: [{ value: "none" }],
    neckwear: neckties(1),
    apron: pinafores(3),
  },
  {
    id: "eu-cardigan",
    label: "Europe · the cardigan",
    // Knitted jackets came in with the 1920s and stayed.
    scope: { years: [1920, 1975], cultures: ["european"] },
    waistcoat: [
      { value: "cardigan", weight: 2, sex: ["female"], garments: ["dress", "skirt", "shirt"] },
      { value: "none", weight: 5, sex: ["female"] },
    ],
  },
  {
    id: "eu-modern",
    label: "Europe · factory clothing",
    scope: { years: [1962, 10001], cultures: ["european"] },
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
      { value: "ball-cap", weight: 3, ages: ["child", "youth"] },
      { value: "ball-cap", weight: 1, ages: ["adult"] },
      { value: "flat-cap", weight: 2, ages: ["elder"] },
      { value: "headscarf", weight: 2, sex: ["female"], ages: ["elder"] },
      { value: "brimmed", weight: 1 },
    ],
    footwear: [{ value: "shoes", weight: 7 }, { value: "boots", weight: 3 }],
  },
  {
    // Constantinople, Thessaloniki and the Aegean until the Ottoman conquest.
    // Manuscripts and church mosaics show the long belted tunic with woven
    // bands (clavi), the cloak pinned at the shoulder for the well off, and
    // women's long gowns with the head covered outdoors.
    id: "byzantine",
    label: "Byzantium · the banded tunic and the mantle",
    scope: { years: [600, 1460], bounds: [19, 34.5, 30.5, 42.2] },
    garment: [
      { value: "long-tunic", weight: 6, sex: ["male"] },
      { value: "tunic", weight: 4, sex: ["male"], means: ["poor", "common"] },
      { value: "dress", weight: 8, sex: ["female"] },
      { value: "robe", weight: 3, means: ["wealthy"] },
    ],
    sleeves: [{ value: "long", weight: 7 }, { value: "loose", weight: 2, garments: ["robe"] }],
    motif: [{ value: "band", weight: 6 }, { value: "plain", weight: 3 }],
    leggings: [{ value: "hose", weight: 6 }, { value: "trousers", weight: 2, sex: ["male"] }, { value: "none", weight: 2 }],
    headwear: [
      { value: "none", weight: 5, sex: ["male"] },
      { value: "cap", weight: 3, sex: ["male"] },
      { value: "veil", weight: 6, sex: ["female"], ages: ["adult", "elder"] },
      { value: "headscarf", weight: 3, sex: ["female"] },
    ],
    footwear: [{ value: "shoes", weight: 6 }, { value: "boots", weight: 2 }, { value: "sandals", weight: 2 }],
    belt: [{ value: "leather", weight: 5 }, { value: "sash", weight: 4 }],
    over: [{ value: "none", weight: 5 }, { value: "cloak", weight: 3, means: ["wealthy"] }, { value: "mantle", weight: 3 }],
    material: [{ value: "linen", weight: 5 }, { value: "wool", weight: 5 }, { value: "silk", weight: 3, means: ["wealthy"] }],
    dye: [
      { value: "undyed", weight: 4 },
      { value: "madder", weight: 3 },
      { value: "woad", weight: 2 },
      { value: "weld", weight: 2 },
      { value: "kermes", weight: 2, means: ["wealthy"] },
      { value: "tyrian", weight: 1, means: ["elite"] },
      { value: "goldthread", weight: 1, means: ["wealthy"] },
    ],
    trimPattern: [{ value: "meander", weight: 3 }, { value: "diamond", weight: 3 }, { value: "none", weight: 3 }],
  },
  {
    // Novgorod's excavated textiles and the birch-bark letters: a long linen
    // shirt belted outside, trousers tucked into foot-wrappings and bast shoes,
    // a kaftan over it for those who could pay; women's long shirts and a
    // pinafore dress, the head always covered once married.
    id: "rus",
    label: "Rus · the belted shirt and the kaftan",
    scope: { years: [880, 1700], bounds: [24, 48.5, 60, 64] },
    garment: [
      { value: "tunic", weight: 6, sex: ["male"] },
      { value: "coat", weight: 3, sex: ["male"], means: ["common", "wealthy"] },
      { value: "dress", weight: 8, sex: ["female"] },
      { value: "open-robe", weight: 2, means: ["wealthy"] },
    ],
    sleeves: [{ value: "long", weight: 9 }],
    motif: [{ value: "band", weight: 5 }, { value: "plain", weight: 4 }],
    leggings: [{ value: "wrapped", weight: 6 }, { value: "trousers", weight: 4 }],
    headwear: [
      { value: "cap", weight: 6, sex: ["male"] },
      { value: "none", weight: 3, sex: ["male"] },
      { value: "headscarf", weight: 5, sex: ["female"] },
      { value: "kerchief", weight: 3, sex: ["female"] },
    ],
    footwear: [{ value: "shoes", weight: 6 }, { value: "boots", weight: 4, means: ["common", "wealthy"] }],
    belt: [{ value: "sash", weight: 7 }, { value: "cord", weight: 2 }],
    over: [{ value: "none", weight: 5 }, { value: "cloak", weight: 3 }],
    material: [{ value: "linen", weight: 6 }, { value: "wool", weight: 4 }, { value: "fur", weight: 1, means: ["wealthy"] }],
    dye: [{ value: "undyed", weight: 6 }, { value: "madder", weight: 4 }, { value: "woad", weight: 2 }, { value: "bark", weight: 2 }],
    trimPattern: [{ value: "cross-stitch", weight: 5 }, { value: "none", weight: 3 }],
  },
  {
    // The gákti: a wool tunic in blue or red with bands of contrasting cloth
    // at hem, cuff and collar, worn with a leather belt, reindeer-skin boots
    // and leggings; fur coats in winter.
    id: "sami",
    label: "Sápmi · the gákti",
    scope: { years: [1500, 1950], bounds: [14, 65.5, 41, 71] },
    garment: [{ value: "long-tunic", weight: 7 }, { value: "coat", weight: 3 }],
    sleeves: [{ value: "long" }],
    motif: [{ value: "band", weight: 8 }, { value: "plain", weight: 1 }],
    leggings: [{ value: "trousers", weight: 8 }],
    headwear: [{ value: "cap", weight: 8 }, { value: "hood", weight: 2 }],
    footwear: [{ value: "boots" }],
    belt: [{ value: "leather" }],
    over: [{ value: "none", weight: 7 }, { value: "cloak", weight: 2 }],
    material: [{ value: "wool", weight: 7 }, { value: "fur", weight: 3 }],
    dye: [{ value: "woad", weight: 6 }, { value: "madder", weight: 3 }, { value: "soot", weight: 1 }],
    trimPattern: [{ value: "step", weight: 4 }, { value: "strip", weight: 4 }],
  },
];
