import { rulerDress } from "./rulers";
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
  ...(["pilot", "mountaineer"] as const).map((role): GarmentKit => ({
    id: `${role}-outdoors`, label: `${role} · cold weather clothing`,
    scope: { years: [1900, 10001] }, priority: 4,
    garment: [{ value: "coat", roles: [role] }],
    leggings: [{ value: "trousers", roles: [role] }],
    headwear: [{ value: "cap", roles: [role] }],
    footwear: [{ value: "boots", roles: [role] }],
    material: [{ value: role === "pilot" ? "hide" : "wool", roles: [role] }],
    dye: [{ value: "soot", roles: [role] }],
    over: [{ value: "none", roles: [role] }],
    motif: [{ value: "plain", roles: [role] }],
  })),
  // Oilskins and dark wool, then navy overalls, then high-visibility orange.
  // South Asia's sewer cleaners were sent down without any of it.
  ...([
    ["sewer-early", [1900, 1950], [["coat", 6], ["shirt", 2]], [["cap", 5], ["flat-cap", 4], ["brimmed", 2]], [["hide", 4], ["wool", 4], ["cotton", 3]], [["soot", 5], ["umber", 3], ["ash", 3], ["bark", 2]]],
    ["sewer-mid", [1950, 1980], [["suit", 5], ["coat", 4]], [["helmet", 5], ["cap", 3]], [["cotton", 5], ["synthetic", 3], ["hide", 2]], [["vat", 5], ["soot", 3], ["ash", 2], ["chrome", 1]]],
    ["sewer-hivis", [1980, 10001], [["suit", 6], ["coat", 4]], [["helmet", 7], ["cap", 1]], [["synthetic", 8], ["cotton", 1]], [["vermilion", 5], ["weld", 3], ["vat", 3], ["soot", 1]]],
  ] as const).map(([id, years, garment, headwear, material, dye]): GarmentKit => ({
    id, label: `Sewer work · ${years[0]}`,
    scope: { years, except: [[60, 5, 93, 37], ...(years[0] < 1950 ? [[-180, -23.5, 180, 23.5] as const] : [])] },
    priority: 4,
    garment: garment.map(([value, weight]) => ({ value, weight, roles: ["sewerman"] })),
    leggings: [{ value: "trousers", roles: ["sewerman"] }],
    headwear: headwear.map(([value, weight]) => ({ value, weight, roles: ["sewerman"] })),
    footwear: [{ value: "boots", roles: ["sewerman"] }],
    belt: [{ value: "leather", roles: ["sewerman"] }],
    over: [{ value: "none", roles: ["sewerman"] }],
    material: material.map(([value, weight]) => ({ value, weight, roles: ["sewerman"] })),
    dye: dye.map(([value, weight]) => ({ value, weight, roles: ["sewerman"] })),
    motif: [{ value: "plain", roles: ["sewerman"] }],
  })),
  // A miner's hard felt hat with a candle stuck to it in clay, then the cloth
  // cap of the coalfields, then the helmet and cap lamp; dirt over everything.
  // Before caps and helmets, miners outside Europe dressed as their region did.
  ...([
    ["mine-felt", [1500, 1880], [["shirt", 6], ["tunic", 2]], [["brimmed", 5], ["cap", 3], ["none", 1]], [["wool", 4], ["cotton", 4], ["linen", 2]], [["soot", 5], ["umber", 3], ["ash", 2]]],
    ["mine-cap", [1880, 1935], [["shirt", 5], ["coat", 3]], [["flat-cap", 6], ["brimmed", 2], ["helmet", 1]], [["cotton", 5], ["wool", 3]], [["soot", 6], ["umber", 2], ["ash", 2]]],
    ["mine-helmet", [1935, 10001], [["suit", 5], ["shirt", 3]], [["helmet", 9]], [["cotton", 5], ["synthetic", 3]], [["soot", 4], ["vat", 3], ["umber", 2], ["vermilion", 1]]],
  ] as const).map(([id, years, garment, headwear, material, dye]): GarmentKit => ({
    id, label: `Mine work · ${years[0]}`,
    scope: { years, except: years[0] < 1880 ? [[-82, -56, -34, 13], [-20, -35, 52, 37], [60, -11, 150, 55]] : [] },
    priority: 4,
    garment: garment.map(([value, weight]) => ({ value, weight, roles: ["pitman"] })),
    leggings: [{ value: "trousers", roles: ["pitman"] }],
    headwear: headwear.map(([value, weight]) => ({ value, weight, roles: ["pitman"] })),
    footwear: [{ value: "boots", roles: ["pitman"] }],
    over: [{ value: "none", roles: ["pitman"] }],
    material: material.map(([value, weight]) => ({ value, weight, roles: ["pitman"] })),
    dye: dye.map(([value, weight]) => ({ value, weight, roles: ["pitman"] })),
    motif: [{ value: "plain", roles: ["pitman"] }],
  })),
  {
    id: "urbex",
    label: "Urban explorer · dark synthetics",
    scope: { years: [1970, 10001] },
    priority: 4,
    garment: [{ value: "coat", weight: 6, roles: ["urbex"] }, { value: "shirt", weight: 2, roles: ["urbex"] }],
    leggings: [{ value: "trousers", roles: ["urbex"] }],
    headwear: [
      { value: "hood", weight: 4, roles: ["urbex"] },
      { value: "none", weight: 3, roles: ["urbex"] },
      { value: "ball-cap", weight: 2, roles: ["urbex"] },
      { value: "helmet", weight: 2, roles: ["urbex"] },
    ],
    footwear: [{ value: "boots", weight: 6, roles: ["urbex"] }, { value: "sneakers", weight: 2, roles: ["urbex"] }],
    over: [{ value: "none", roles: ["urbex"] }],
    material: [{ value: "synthetic", weight: 6, roles: ["urbex"] }, { value: "cotton", weight: 2, roles: ["urbex"] }],
    dye: [
      { value: "soot", weight: 6, roles: ["urbex"] },
      { value: "ash", weight: 3, roles: ["urbex"] },
      { value: "umber", weight: 2, roles: ["urbex"] },
      { value: "chrome", weight: 2, roles: ["urbex"] },
      { value: "vat", weight: 2, roles: ["urbex"] },
    ],
    motif: [{ value: "plain", roles: ["urbex"] }],
  },
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

const senatorial = ["senator", "magistrate", "princeps", "general"];
const curule = ["magistrate", "princeps", "pontifex"];
/**
 * Roman office, wherever Rome governed. Only those whose role names it are
 * dressed by it, so everyone else falls through to the street. Senators wore
 * the broad stripe (latus clavus) and the plain toga; magistrates and priests
 * the praetexta; equestrians the narrow stripe; a general in the field the
 * cuirass and the red paludamentum. Priests sacrificed with the toga drawn
 * over the head.
 */
export const romanOffice: readonly GarmentKit[] = [
  {
    id: "rome-office",
    label: "Rome · the dress of office",
    scope: { years: [-500, 300], bounds: [-10, 29, 42, 55] },
    // Above the street and guard sets: only the named offices reach it.
    priority: 5,
    garment: [
      { value: "tunic", sex: ["male"], roles: [...senatorial, "eques", "pontifex"] },
      { value: "tunic", sex: ["male"], livelihoods: ["statesman", "ruler", "commander", "high-priest", "courtier", "envoy"] },
      { value: "dress", sex: ["female"], roles: ["princeps", "aristocrat"] },
      { value: "dress", sex: ["female"], livelihoods: ["ruler", "courtier"] },
    ],
    sleeves: [{ value: "short", sex: ["male"], roles: [...senatorial, "eques", "pontifex"] },
      { value: "short", sex: ["male"], livelihoods: ["statesman", "ruler", "commander", "high-priest", "courtier", "envoy"] }],
    motif: [
      { value: "laticlave", sex: ["male"], roles: senatorial },
      { value: "laticlave", sex: ["male"], livelihoods: ["statesman", "ruler", "commander"] },
      { value: "clavi", sex: ["male"], roles: ["eques"] },
      { value: "clavi", sex: ["male"], livelihoods: ["courtier", "envoy"] },
    ],
    drape: [
      { value: "praetexta", sex: ["male"], roles: curule },
      { value: "praetexta", sex: ["male"], livelihoods: ["ruler", "high-priest"] },
      { value: "toga", sex: ["male"], roles: ["senator", "eques"] },
      { value: "toga", sex: ["male"], livelihoods: ["statesman", "courtier", "envoy"] },
      { value: "palla", sex: ["female"], roles: ["princeps", "aristocrat"] },
      { value: "palla", sex: ["female"], livelihoods: ["ruler", "courtier"] },
      { value: "none", roles: ["general"] },
      { value: "none", livelihoods: ["commander"] },
    ],
    headwear: [
      { value: "veil", roles: ["pontifex"] },
      { value: "veil", livelihoods: ["high-priest"] },
      { value: "fillet", roles: ["princeps"] },
    ],
    // Senators' calcei; a soldier's boots.
    footwear: [
      { value: "shoes", roles: [...curule, "senator", "eques"] },
      { value: "shoes", livelihoods: ["statesman", "ruler", "high-priest", "courtier"] },
      { value: "boots", roles: ["general"] },
      { value: "boots", livelihoods: ["commander"] },
    ],
    over: [{ value: "cloak", roles: ["general"] }, { value: "cloak", livelihoods: ["commander"] }],
    armour: [{ value: "cuirass", roles: ["general"] }, { value: "cuirass", livelihoods: ["commander"] }],
    armourColor: [{ value: "#b08a4a", roles: ["general"] }, { value: "#b08a4a", livelihoods: ["commander"] }],
    sidearm: [{ value: "sword", roles: ["general"] }, { value: "sword", livelihoods: ["commander"] }],
    material: [{ value: "wool", roles: [...senatorial, "eques", "pontifex"] },
      { value: "wool", livelihoods: ["statesman", "ruler", "commander", "high-priest", "courtier", "envoy"] }],
    // White wool under the toga; the paludamentum and the general's tunic red.
    dye: [
      { value: "bleached", roles: ["senator", "magistrate", "princeps", "eques", "pontifex"] },
      { value: "bleached", livelihoods: ["statesman", "ruler", "high-priest", "courtier", "envoy"] },
      { value: "kermes", roles: ["general"] },
      { value: "kermes", livelihoods: ["commander"] },
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
    // The full-bottomed wig went out with Louis XIV. After it courtiers wore
    // their own hair or a small wig, powdered and tied, under a cocked hat.
    id: "court-georgian",
    label: "Court · powder, lace and side hoops",
    scope: { years: [1715, 1790], cultures: ["european", "andean", "mesoamerican"], except: [[18, 34, 45, 46]] },
    priority: 2.5,
    garment: [{ value: "gown", means: ["elite"], sex: ["female"] }, { value: "coat", means: ["elite"], sex: ["male"] }],
    silhouette: [{ value: "pannier", means: ["elite"], sex: ["female"] }],
    cut: [{ value: "full", means: ["elite"], sex: ["male"] }],
    front: [{ value: "open", means: ["elite"], sex: ["male"] }],
    waistcoat: [{ value: "figured", means: ["elite"], sex: ["male"] }],
    leggings: [{ value: "breeches", means: ["elite"], sex: ["male"] }, { value: "hose", means: ["elite"], sex: ["female"] }],
    headwear: [
      { value: "none", weight: 5, means: ["elite"] },
      { value: "tricorne", weight: 3, means: ["elite"], sex: ["male"] },
      { value: "plume", weight: 2, means: ["elite"], sex: ["female"] },
    ],
    footwear: [{ value: "shoes", means: ["elite"] }],
    wrist: [{ value: "cuffs", means: ["elite"], sex: ["male"] }, { value: "ruffles", means: ["elite"], sex: ["female"] }],
    sleeves: [{ value: "short", means: ["elite"], sex: ["female"] }],
    neckwear: [{ value: "cravat", means: ["elite"], sex: ["male"] }],
    belt: [{ value: "none", means: ["elite"] }],
    apron: [{ value: "none", means: ["elite"] }],
    over: [{ value: "none", weight: 6, means: ["elite"] }, { value: "cloak", weight: 1, means: ["elite"] }],
  },
  {
    id: "court-18c",
    label: "Court · wigs and panniers",
    // European courts and their colonial capitals; not the Ottoman Balkans.
    scope: { years: [1650, 1830], cultures: ["european", "andean", "mesoamerican"], except: [[18, 34, 45, 46]] },
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
    id: "court-19c-early",
    label: "Court · the long century of state dress",
    scope: { years: [1830, 1850] },
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
  },  {
    id: "court-19c",
    label: "Court · the long century of state dress",
    // The bowler is Lock & Co.'s of 1849.
    scope: { years: [1850, 1920] },
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
  ...romanOffice,
  ...rulerDress,
  ...courtDress,
  ...futureDress,
];
