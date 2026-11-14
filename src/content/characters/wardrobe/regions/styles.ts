import type { CharacterScope } from "../../context-types";
import type { GarmentKit, Option, WardrobeSlot, WearerScope } from "../types";

/**
 * Street styles of the later twentieth century and after: a look a share of
 * the young took up in particular cities and years, over whatever work they
 * did. Each look takes a band of one seeded roll, so a person is wholly a punk
 * or wholly not, and two looks in the same place never mix on one person.
 * Naming the look in a role ("a punk in London") gives the whole of it.
 */
type Choice = readonly [value: unknown, weight?: number, scope?: WearerScope];

/** Two kits: the share of the young on the street, under any uniform; and
 * whoever is named as one, over everything but regalia. */
function look(id: string, label: string, scope: CharacterScope, band: readonly [number, number], wearer: WearerScope,
  slots: Partial<Record<WardrobeSlot, readonly Choice[]>>): GarmentKit[] {
  const role = id.replace(/-(europe|australia|africa|80s|west|us|japan|late|90s|world)$/, "");
  const street: Record<string, unknown> = { id: `style-${id}`, label, scope, priority: 2 };
  const named: Record<string, unknown> = { id: `style-${id}-named`, label, scope, priority: 4 };
  for (const [slot, choices] of Object.entries(slots)) {
    street[slot] = choices!.map(([value, weight = 1, only = {}]): Option<unknown> => ({ value, weight, ...wearer, ...only, share: band }));
    named[slot] = choices!.map(([value, weight = 1, only = {}]): Option<unknown> => ({ value, weight, ...only, roles: [role] }));
  }
  return [street as GarmentKit, named as GarmentKit];
}

const M: WearerScope = { sex: ["male"] }, F: WearerScope = { sex: ["female"] };
const YOUNG: WearerScope = { ages: ["youth", "adult"], under: 30 };
const UK = [-8, 49.8, 2, 59] as const;
const WEST = [-10, 36, 20, 60] as const;
const US = [-125, 24, -66, 49] as const;
const JAPAN = [128, 30, 146, 46] as const;
const at = (years: readonly [number, number], bounds: readonly [number, number, number, number]): CharacterScope => ({ years, bounds });

const LEATHER: readonly Choice[] = [["coat"]];
const PUNK_DYES: readonly Choice[] = [["#16121a", 3], ["#e0408a"], ["#3fbf4a"], ["#3a6ad8"], ["#d83030"], ["#f0e070", 2]];

const punk = {
  garment: [["coat", 3], ["shirt", 1, M], ["skirt", 2, F]],
  dye: [["soot", 4], ["madder", 1]],
  motif: [["studs", 3], ["plaid", 1]],
  hairdress: [["mohawk", 2], ["spikes", 3]],
  hairDye: PUNK_DYES,
  leggings: [["trousers", 1, M], ["fishnet", 1, F]],
  footwear: [["boots"]],
  neck: [["chain"]],
  headwear: [["none"]],
} as const;
const goth = {
  garment: [["coat", 2, M], ["shirt", 1, M], ["dress", 1, F]],
  dye: [["soot"]],
  hairdress: [["spikes", 1], ["long", 2]],
  hairDye: [["#16121a"]],
  makeup: [["goth"]],
  headwear: [["none"]],
  leggings: [["trousers", 1, M], ["fishnet", 1, F]],
  footwear: [["boots"]],
  neck: [["chain"]],
} as const;
const hiphop80s = {
  garment: [["coat", 2], ["tunic", 1]],
  motif: [["tracksuit", 3], ["plain", 1]],
  dye: [["woad"], ["madder"], ["soot"], ["weld"]],
  leggings: [["trousers"]],
  headwear: [["none", 2], ["ball-cap", 1], ["fedora", 1, M]],
  hairdress: [["afro", 1], ["none", 2]],
  footwear: [["sneakers"]],
  neck: [["chain", 3], ["none", 1]],
} as const;
const hiphop90s = {
  garment: [["tunic", 3], ["coat", 1]],
  motif: [["jersey", 2], ["plain", 2], ["tracksuit", 1]],
  leggings: [["wide"]],
  headwear: [["ball-cap", 3], ["none", 2], ["hood", 1]],
  footwear: [["sneakers"]],
  neck: [["chain", 2], ["none", 1]],
} as const;
const hippie = {
  garment: [["shirt", 2, M], ["tunic", 1, M], ["dress", 3, F], ["skirt", 1, F]],
  motif: [["tie-dye", 2], ["plain", 2], ["stitch", 1]],
  dye: [["safflower"], ["weld"], ["woad"], ["madder"], ["undyed"]],
  hairdress: [["long", 3], ["afro", 1]],
  headwear: [["band", 2], ["none", 3]],
  shave: [["full", 1, M], ["none", 1, M]],
  neck: [["beads"]],
  leggings: [["trousers", 1, M]],
  footwear: [["sandals", 2], ["none", 1]],
} as const;

export const streetStyles: readonly GarmentKit[] = [
  // Britain's first youth cult: Edwardian drape jackets on working-class boys.
  look("teddy", "Teddy boys", at([1953, 1960], UK), [0.9, 0.95], { ...YOUNG, under: 25, ...M }, {
    garment: [["coat"]], dye: [["soot"], ["woad"], ["logwood"]], hairdress: [["quiff"]], neckwear: [["necktie"]],
    leggings: [["trousers"]], footwear: [["shoes"]], headwear: [["none"]],
  }),
  look("stilyagi", "Soviet stilyagi", { years: [1949, 1963], bounds: [19, 41, 60, 70] }, [0.92, 0.96], { ...YOUNG, under: 25 }, {
    garment: [["coat", 1, M], ["dress", 1, F]], dye: [["madder"], ["weld"], ["safflower"], ["woad"]],
    hairdress: [["quiff", 1, M], ["beehive", 1, F]], neckwear: [["necktie", 1, M]], headwear: [["none"]],
  }),
  look("rocker", "Rockers in black leather", at([1959, 1970], UK), [0.86, 0.9], { ...M, ...YOUNG }, {
    garment: LEATHER, dye: [["soot"]], motif: [["studs"]], hairdress: [["quiff"]], leggings: [["trousers"]],
    footwear: [["boots"]], headwear: [["none"]],
  }),
  look("mod", "Mods", at([1962, 1969], UK), [0.8, 0.86], { ...YOUNG, under: 25 }, {
    garment: [["coat", 1, M], ["dress", 1, F]], dye: [["woad"], ["soot"], ["ash"], ["safflower", 1, F]],
    neckwear: [["necktie", 1, M]], hairdress: [["bob", 1, F], ["none", 1, M]], leggings: [["trousers", 1, M]],
    footwear: [["shoes", 1, M], ["boots", 1, F]], headwear: [["none"]],
  }),
  look("hippie", "Hippies", at([1966, 1977], US), [0.7, 0.8], YOUNG, hippie),
  look("hippie-europe", "Hippies", at([1967, 1977], WEST), [0.72, 0.8], YOUNG, hippie),
  look("hippie-australia", "Hippies", at([1967, 1977], [112, -44, 154, -10]), [0.74, 0.8], YOUNG, hippie),
  // The afro as a statement, from Black Power to the dance floor. It only takes
  // on hair that will stand up into one, so the share is of that hair.
  look("afro", "The afro", at([1966, 1982], US), [0.2, 0.55], { ages: ["youth", "adult"], under: 40 }, { hairdress: [["afro"]] }),
  look("afro-africa", "The afro in African cities", { years: [1968, 1982], cultures: ["west-central-african", "east-southern-african"] }, [0.2, 0.45], YOUNG, {
    hairdress: [["afro"]], leggings: [["trousers", 1, M]],
  }),
  look("skinhead", "Skinheads", at([1968, 1973], UK), [0.95, 0.98], { ...M, ...YOUNG, under: 25 }, {
    hairdress: [["shaven"]], garment: [["shirt", 2], ["coat", 1]], motif: [["plaid", 1], ["plain", 2]],
    leggings: [["trousers"]], footwear: [["boots"]], headwear: [["none"]],
  }),
  look("skinhead-80s", "Skinheads", at([1978, 1990], UK), [0.95, 0.97], { ...M, ...YOUNG, under: 25 }, {
    hairdress: [["shaven"]], garment: [["coat"]], dye: [["soot"], ["chrome"]], leggings: [["trousers"]], footwear: [["boots"]], headwear: [["none"]],
  }),
  look("punk", "Punks", at([1976, 1986], UK), [0.6, 0.64], YOUNG, punk),
  look("punk-west", "Punks", at([1977, 1990], WEST), [0.6, 0.64], YOUNG, punk),
  look("punk-us", "Punks", at([1976, 1990], US), [0.6, 0.63], YOUNG, punk),
  look("punk-japan", "Punks", at([1978, 1995], JAPAN), [0.6, 0.62], YOUNG, punk),
  look("punk-late", "Punks", at([1986, 2015], [-125, 24, 20, 60]), [0.6, 0.615], YOUNG, punk),
  look("goth", "Goths", at([1980, 2012], WEST), [0.55, 0.585], { ages: ["youth", "adult"], under: 35 }, goth),
  look("goth-us", "Goths", at([1983, 2012], US), [0.55, 0.575], { ages: ["youth", "adult"], under: 35 }, goth),
  // Out of the Bronx: tracksuits and chains, then the baggy nineties.
  look("hip-hop", "Hip hop in New York", at([1979, 1991], [-74.3, 40.5, -73.6, 41]), [0.3, 0.5], YOUNG, hiphop80s),
  look("hip-hop-us", "Hip hop", at([1984, 1991], US), [0.4, 0.5], YOUNG, hiphop80s),
  look("hip-hop-90s", "Hip hop", at([1991, 2012], US), [0.3, 0.5], YOUNG, hiphop90s),
  look("hip-hop-world", "Hip hop", { years: [1991, 2020] }, [0.4, 0.46], { ...YOUNG, under: 25 }, hiphop90s),
  look("grunge", "Grunge", at([1991, 1998], [-125, 24, 20, 60]), [0.66, 0.72], YOUNG, {
    garment: [["shirt", 3], ["coat", 1]], motif: [["plaid"]], dye: [["madder"], ["chrome"], ["woad"], ["soot"]],
    hairdress: [["long"]], leggings: [["trousers"]], footwear: [["boots", 2], ["sneakers", 1]], headwear: [["none", 3], ["cap", 1]],
  }),
  look("emo", "Emo", at([2003, 2013], [-125, -40, 20, 60]), [0.72, 0.76], { ages: ["youth"], under: 22 }, {
    garment: [["tunic", 2], ["coat", 1]], dye: [["soot", 3], ["madder", 1]], motif: [["stripes", 1], ["plain", 2]],
    hairdress: [["bob"]], hairDye: [["#16121a"]], leggings: [["trousers", 1, M], ["fishnet", 1, F]], footwear: [["sneakers"]],
  }),
  look("hipster", "Hipsters", at([2008, 2017], [-125, 24, 20, 60]), [0.76, 0.81], { ages: ["adult"], under: 36 }, {
    garment: [["shirt", 2], ["coat", 1]], motif: [["plaid", 2], ["plain", 1]], eyewear: [["glasses"]],
    shave: [["full", 1, M]], headwear: [["cap", 1], ["none", 2]], leggings: [["trousers"]], footwear: [["boots"], ["sneakers"]],
  }),
  // Rastafari: locks under the tam in red, gold and green.
  look("rasta", "Rastafari", { years: [1950, 3000], bounds: [-78.5, 17.6, -76, 18.6] }, [0.3, 0.4], { ages: ["youth", "adult", "elder"] }, {
    hairdress: [["locs"]], headwear: [["tam", 3], ["none", 1]], dye: [["madder"], ["weld"], ["chrome"]], shave: [["full", 1, M]],
  }),
  // La Sape: Brazzaville and Kinshasa men in the loudest suits money could buy.
  look("sapeur", "La Sape", { years: [1970, 3000], bounds: [14.8, -4.8, 15.8, -4] }, [0.3, 0.34], { ...M, ages: ["youth", "adult"] }, {
    garment: [["coat"]], dye: [["safflower"], ["weld"], ["madder"], ["woad"], ["bleached"]], waistcoat: [["figured"]],
    neckwear: [["bow-tie"], ["necktie"]], headwear: [["fedora"]], leggings: [["trousers"]], motif: [["plain"]], accessory: [["walking-cane"]], footwear: [["shoes"]], eyewear: [["glasses", 1], ["none", 2]],
  }),
  look("cholo", "Cholos", { years: [1970, 2015], bounds: [-120, 25, -104, 36] }, [0.36, 0.44], { ...M, ...YOUNG, under: 35 }, {
    garment: [["shirt", 2], ["tunic", 1]], motif: [["plaid", 2], ["plain", 1]], leggings: [["wide"]], dye: [["bleached"], ["soot"], ["ash"]],
    headwear: [["kerchief", 1], ["none", 2]], eyewear: [["sunglasses", 1], ["none", 1]], hairdress: [["none"]],
  }),
  // Japanese biker gangs in long embroidered coats.
  look("bosozoku", "Bōsōzoku", at([1972, 1996], JAPAN), [0.96, 0.98], { ...M, ages: ["youth"] }, {
    garment: [["coat"]], dye: [["bleached"], ["soot"], ["logwood"]], headwear: [["band"]], hairdress: [["quiff"]], leggings: [["wide"]], footwear: [["boots"]],
  }),
  look("ganguro", "Ganguro", at([1995, 2005], JAPAN), [0.9, 0.95], { ...F, ages: ["youth"] }, {
    makeup: [["ganguro"]], headwear: [["none"]], hairdress: [["long"]], hairDye: [["#e6c48a"], ["#d9b26a"], ["#ece0c8"]], garment: [["skirt", 2], ["dress", 1]],
    dye: [["safflower"], ["weld"], ["woad"], ["bleached"]], footwear: [["boots"]], neck: [["beads"]],
  }),
  look("lolita", "Lolita", at([1998, 2016], JAPAN), [0.86, 0.9], { ...F, ages: ["youth", "adult"], under: 28 }, {
    garment: [["dress"]], dye: [["soot", 2], ["bleached", 1], ["safflower", 1]], hairdress: [["bob", 1], ["long", 1]],
    hairOrnament: [["ribbon"]], footwear: [["shoes"]], headwear: [["none"]],
  }),
  // Seoul after the Korean wave: dyed hair, ash brown to rose.
  look("seoul", "Seoul · dyed hair", { years: [2008, 3000], bounds: [126.7, 37.4, 127.2, 37.7] }, [0.5, 0.75], YOUNG, {
    hairDye: [["#b8a088"], ["#c9b8a8"], ["#8a5a3a", 2], ["#e8a0b8"]],
  }),
].flat();
