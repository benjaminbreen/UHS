import type { WorldSetting } from "../geography/types";
import type { SeasonId } from "../../core/season";
import type { Inventory, ItemDef, ItemId, WorldObject } from "../../core/types";
import fishData from "./fish.json" with { type: "json" };
import { capabilitiesFor } from "../characters/resolve";
import { random } from "../../core/random";

/**
 * How fishing was done, worked out from what a place and date allowed rather
 * than written per region: the water, the climate's materials, and the tools a
 * society had. Each household draws its own method and craft from the weights,
 * so one landing mixes a seine crew with a line fisher, as landings did.
 */
export type FishingWater = "sea" | "river" | "lake";
export type Hull = "raft" | "reed" | "dugout" | "bark" | "hide" | "plank";
export type FishingMethod = "seine" | "net" | "line" | "trap" | "spear";
export type FishingPractice = { water: FishingWater; method: FishingMethod; hull?: Hull; crew: number };
type Weights<T extends string> = Partial<Record<T, number>>;

function pick<T extends string>(w: Weights<T>, roll: number): T | undefined {
  const entries = (Object.entries(w) as [T, number][]).filter(([, n]) => n > 0);
  let left = roll * entries.reduce((n, [, v]) => n + v, 0);
  for (const [k, v] of entries) if ((left -= v) < 0) return k;
  return entries.at(-1)?.[0];
}

export function waterOf(s: WorldSetting): FishingWater | undefined {
  if (s.water === "none") return;
  return s.water === "lake" ? "lake" : s.water.startsWith("river") ? "river" : "sea";
}

/** Craft that could be built here. */
export function hullWeights(s: WorldSetting): Weights<Hull> {
  const y = s.year, c = s.climate;
  // Sahul was reached over open water by about 50,000 years ago, on rafts or bundles.
  if (y < -50000) return {};
  if (y < -8000) return { raft: 2, reed: c === "arid" ? 2 : 0.5, hide: c === "tundra" ? 2 : 0 };
  const w: Weights<Hull> = {};
  // Reed bundles where shores grow reed and little timber: the Nile,
  // Mesopotamia, Titicaca, the tule balsas of California, Lake Chad.
  if (c === "arid") w.reed = 4;
  if (c === "mediterranean") w.reed = 1;
  if (c === "tundra") w.hide = 4;
  if (c === "boreal") Object.assign(w, { bark: 2, hide: 1 });
  if (c === "tropical" || c === "monsoon") w.raft = 1;
  // Dugouts wherever big trees grew, from Pesse (c. 8000 BCE) on.
  if (c !== "arid" && c !== "tundra") w.dugout = 3;
  // Plank boats need edge tools: sewn planks on the Nile by 3000 BCE,
  // Ferriby in Britain c. 1900 BCE. Dugouts lasted on tropical rivers.
  if (capabilitiesFor(s).has("metallurgy") && y >= -3000) {
    w.plank = c === "arid" ? 3 : 5;
    if (w.dugout && c !== "tropical" && c !== "monsoon") w.dugout = 1;
    if (w.bark) w.bark /= 4;
    if (w.hide) w.hide /= 4;
  }
  if (y >= 1850) w.plank = (w.plank ?? 0) + 6;
  return w;
}

export function methodWeights(s: WorldSetting, water: FishingWater, boat: boolean): Weights<FishingMethod> {
  const warm = s.climate === "tropical" || s.climate === "monsoon";
  const w: Weights<FishingMethod> = {
    line: water === "sea" ? 3 : 1.5,
    trap: water === "lake" ? 1 : 2,
    spear: s.year < -9000 ? 3 : warm && water === "sea" ? 1 : 0.4,
  };
  // Nets survive from the Mesolithic (Antrea, c. 8300 BCE); hooks are far older.
  if (s.year >= -9000) Object.assign(w, { net: water === "river" ? 2 : 3, seine: water === "sea" ? 1 : 3 });
  if (!boat) Object.assign(w, { net: (w.net ?? 0) / 2, line: w.line! * 0.7, spear: w.spear! * 2 });
  return w;
}

const crews: Record<FishingMethod, [number, number]> = { seine: [3, 5], net: [2, 3], line: [1, 2], trap: [1, 1], spear: [1, 1] };

/** A household's way of fishing. `salt` is the household. */
export function fishingPractice(s: WorldSetting, water: FishingWater, salt: string, boatShare = 0.85): FishingPractice {
  const hull = random(salt, "boat") < boatShare ? pick(hullWeights(s), random(salt, "hull")) : undefined;
  const method = pick(methodWeights(s, water, !!hull), random(salt, "method")) ?? "line";
  const [lo, hi] = crews[method];
  return { water, method, hull, crew: lo + Math.floor(random(salt, "crew") * (hi - lo + 1)) };
}

/** The work's words, by method. Plain enough for a card or a task line. */
export const fishingWords: Record<FishingMethod, { gear: string; ready: string; fish: string; shore: string }> = {
  seine: { gear: "the seine net", ready: "Mend the seine and coil its ropes", fish: "Set the seine and haul it in", shore: "Haul the seine from the bank" },
  net: { gear: "the nets", ready: "Mend the nets and check the floats", fish: "Set the nets and lift them", shore: "Cast the net from the bank" },
  line: { gear: "the lines and hooks", ready: "Bait the hooks and check the lines", fish: "Fish with hand lines", shore: "Fish with lines from the bank" },
  trap: { gear: "the traps", ready: "Repair the traps and baskets", fish: "Check and empty the traps", shore: "Check and empty the traps" },
  spear: { gear: "the fish spear", ready: "Sharpen the spear points", fish: "Spear fish from the boat", shore: "Spear fish in the shallows" },
};

export const hullNames: Record<Hull, { name: string; description: string }> = {
  raft: { name: "Fishing raft", description: "Logs lashed side by side into a low raft, poled or paddled." },
  reed: { name: "Reed-bundle boat", description: "Bundles of reed bound tight and tied up at the ends. Light, and short-lived once waterlogged." },
  dugout: { name: "Dugout canoe", description: "A single log hollowed out with adze and fire, paddled by one or two." },
  bark: { name: "Bark canoe", description: "Bark sewn over a light wooden frame and sealed with gum. Light enough to carry." },
  hide: { name: "Skin boat", description: "Hides stretched over a wooden frame and greased against the water." },
  plank: { name: "Plank fishing boat", description: "An open boat of planks fastened to one another and to frames, rowed or sculled." },
};

/** The moored art for a craft; plank boats still share two hull drawings. */
export function boatArt(hull: Hull | undefined, s: WorldSetting) {
  if (hull === "reed") return "worksite-reed-skiff";
  if (hull && hull !== "plank") return `boat-moored-${hull}`;
  // Overlapping planks were the northern European way of building a boat.
  if (hull === "plank" && s.culture === "european" && s.lat > 45) return "worksite-fishing-boat";
  return "worksite-plank-skiff";
}

// Spawning runs in spring and autumn; cold winters drive fish deep. The arid
// row is a flood river's: the high water scatters fish over the plain, the
// falling water gathers them back into the channels.
const seasons: Record<WorldSetting["climate"], Record<SeasonId, number>> = {
  temperate: { spring: 1.2, summer: 1, autumn: 1.15, winter: 0.6 },
  boreal: { spring: 1.1, summer: 1.1, autumn: 1.2, winter: 0.5 },
  tundra: { spring: 0.9, summer: 1.3, autumn: 1.1, winter: 0.4 },
  mediterranean: { spring: 1.15, summer: 0.9, autumn: 1.1, winter: 0.8 },
  arid: { spring: 1, summer: 0.75, autumn: 1.3, winter: 0.95 },
  monsoon: { spring: 1.1, summer: 0.6, autumn: 1.2, winter: 1 },
  tropical: { spring: 1, summer: 0.9, autumn: 1, winter: 1 },
};
const methodYield: Record<FishingMethod, number> = { seine: 1.2, net: 1.1, line: 0.9, trap: 0.9, spear: 0.8 };

/** How hungry the fish are at an hour, against an ordinary hour. */
export const feedingAt = (hour: number) => hour < 4 || hour >= 21 ? 0.7 : hour < 8 ? 1.25 : hour < 11 ? 1 : hour < 16 ? 0.8 : 1.15;
export const seasonRun = (s: Pick<WorldSetting, "climate">, season: SeasonId) => seasons[s.climate][season];

/** How a day's fishing went against an ordinary one, and why. `roll` is the day's luck. */
export function catchOf(s: WorldSetting, p: FishingPractice, season: SeasonId, hour: number, roll: number) {
  const time = feedingAt(hour);
  const sea = seasons[s.climate][season];
  const factor = sea * time * methodYield[p.method] * (p.hull ? 1.1 : 0.9) * (0.7 + 0.6 * roll);
  const why = sea < 0.8
    ? season === "winter" ? "The water is cold and the fish have gone deep." : "The water is high and muddy, and the fish are scattered."
    : time < 0.9 ? "Out too late in the day; the fish had stopped feeding."
    : sea > 1.1 ? "The fish are running this time of year." : time > 1.1 ? "Out at first light, when the fish were feeding." : "";
  const line = factor >= 1.3 ? `A heavy catch. ${why}` : factor < 0.75 ? `A thin catch. ${why}` : `An ordinary catch. ${why}`;
  return { factor, line: line.trim() };
}

/** Where the catch goes: to a buyer where people bought and sold, a share to
 * whoever held the water where land was held, and round the kin otherwise. */
export type CatchFate = { sold: boolean; buyer: string; owed?: { to: string; share: number } };
export function catchFate(s: WorldSetting): CatchFate {
  const can = capabilitiesFor(s);
  const sold = can.has("market_exchange") || can.has("coinage") || can.has("urban_settlement");
  // Fishing rights went with the land wherever land was held and recorded:
  // estates and temples took deliveries (Middle Kingdom fishermen owed fixed
  // quotas), lords a tithe in coin-using places. Free fishing came with the
  // nineteenth century's reforms.
  const holder = s.year < 1850 && (can.has("heritable_land") || (can.has("writing") && can.has("settled_agriculture")));
  return {
    sold,
    buyer: !sold ? "your kin" : can.has("coinage") ? "the fish buyer" : "the market",
    ...(holder ? { owed: { to: can.has("heritable_land") ? "the landlord" : "the temple", share: can.has("coinage") ? 0.1 : 0.25 } } : {}),
  };
}

export type Preserve = "fresh" | "sun-dry" | "smoke" | "wind-dry" | "salt" | "ferment";
/** How fish were kept, from the climate and what salt and markets allowed.
 * `salt` is the settlement, so neighbours keep fish the same way. */
export function preserveOf(s: WorldSetting, water: FishingWater, salt: string): Preserve {
  const c = s.climate, market = catchFate(s).sold, warm = c === "tropical" || c === "monsoon";
  // Ice and rail sent fish to market fresh from about the 1880s.
  if (s.year >= 1880) return "fresh";
  const w: Weights<Preserve> = {
    // Split and sun-dried where it is hot and dry: the Nile, Arabia, the Sahel.
    "sun-dry": c === "arid" ? 5 : c === "mediterranean" ? 3 : warm ? 2 : 0,
    // Smoked where it is damp: northern Europe, West Africa's smoking ovens, the Pacific Northwest.
    smoke: c === "temperate" ? 3 : c === "boreal" ? 2 : warm ? 2 : c === "tundra" ? 1 : 0,
    // Dried hard in cold wind: Norwegian stockfish, Siberian yukola.
    "wind-dry": c === "tundra" ? 3 : c === "boreal" ? 2 : 0,
    salt: market && s.year >= -1000 ? (water === "sea" ? 3 : 1) : 0,
    // Fermented fish sauce and paste: Southeast Asian nuoc mam and pla ra, Roman garum.
    ferment: market && s.year >= -500 && (warm || c === "mediterranean") ? 2 : 0,
    fresh: market && capabilitiesFor(s).has("urban_settlement") ? 0.5 : 0.1,
  };
  return pick(w, random(salt, "preserve")) ?? "fresh";
}

export const preserveWords: Record<Preserve, { task: string; doing: string; prop?: "dryingRack" | "barrel" | "jar"; name: string }> = {
  fresh: { task: "Pack the fish to sell fresh", doing: "Packing the fish to sell fresh", name: "Baskets for the fresh catch" },
  "sun-dry": { task: "Split the fish and lay them out to dry", doing: "Splitting fish and laying them out to dry", prop: "dryingRack", name: "Fish drying in the sun" },
  smoke: { task: "Hang the fish over a slow fire to smoke", doing: "Hanging fish over the fire to smoke", prop: "dryingRack", name: "Fish smoking rack" },
  "wind-dry": { task: "Hang the fish to dry in the wind", doing: "Hanging fish to dry in the wind", prop: "dryingRack", name: "Fish drying in the wind" },
  salt: { task: "Gut the fish and pack them in salt", doing: "Gutting fish and packing them in salt", prop: "barrel", name: "Salted fish" },
  ferment: { task: "Salt the small fish and put them down to ferment", doing: "Salting small fish to ferment", prop: "jar", name: "Fermenting fish" },
};

/** Who does what in a fishing household. `slot` 0 is the household head. */
export type CrewRole = "boat" | "haul" | "gut" | "sell" | "child";
export function crewRole(p: FishingPractice, fate: CatchFate, slot: number, age: number, female: boolean, roll: number): CrewRole {
  if (age < 14) return "child";
  if (slot === 0) return "boat";
  // Across most fishing peoples on record men crewed the boats and hauled,
  // and women gutted, dried and sold: the fishwives of Scotland and Holland,
  // West Africa's fish traders. Not a rule, so a share of each goes the other way.
  const ashore = female ? roll < 0.85 : roll < 0.2;
  if (!ashore && p.method === "seine") return "haul";
  if (ashore && fate.sold && roll < (female ? 0.45 : 0.1)) return "sell";
  return "gut";
}

/** A fish as it is landed: its local name, how big they run, how it fights,
 * when it bites and how it is drawn. Colours are back, belly and fins. `fight`
 * 0 comes in like a weed, 1 runs the line. Kinds live in fish.json, which the
 * voxel icon baker reads too. */
export type FishKind = {
  name: string; kg: [number, number]; fight: number; rarity?: "rare" | "legendary";
  back: number; belly: number; fin: number;
  shape: "slim" | "deep" | "long" | "flat" | "crab" | "claw" | "squid" | "frog";
  mark?: "bars" | "spots" | "stripe" | "pearls";
  /** How it fights on a line: darts about, bores for the bottom, leaps, or just pulls. */
  style: "dart" | "sink" | "leap" | "steady";
  /** Taken in traps, pots and weirs rather than on a line. */
  trap?: boolean;
  when?: { hours?: "day" | "night" | "twilight"; seasons?: SeasonId[]; rain?: boolean };
  note: string;
};
type Raw = Omit<FishKind, "back" | "belly" | "fin" | "style"> & { colors: [string, string, string]; style?: FishKind["style"] };
const kinds = (raw: Raw[]): FishKind[] => raw.map(({ colors, ...f }) => ({
  ...f,
  back: parseInt(colors[0].slice(1), 16), belly: parseInt(colors[1].slice(1), 16), fin: parseInt(colors[2].slice(1), 16),
  style: f.style ?? (f.shape === "slim" ? "dart" : f.shape === "deep" ? "steady" : "sink"),
}));
const waters = Object.fromEntries(Object.entries(fishData).map(([k, v]) => [k, kinds(v as Raw[])])) as Record<keyof typeof fishData, FishKind[]>;

/** Whether a kind is about at this hour, season and weather. */
/** What a line or a trap brings up that isn't a fish: item, kilograms, how often. */
const findsAt = {
  sea: [["shell", 0.1, 5], ["stick", 0.4, 2], ["wood", 1.2, 1], ["coin", 0.01, 0.15]],
  fresh: [["stick", 0.4, 4], ["river-rock", 1, 2], ["pebble", 0.1, 2], ["boots", 0.8, 1], ["clay-pot", 0.6, 0.6], ["coin", 0.01, 0.15]],
} satisfies Record<string, [ItemId, number, number][]>;
export const fishingFinds = (water: FishingWater) => findsAt[water === "sea" ? "sea" : "fresh"];
export const isFishingFind = (id: ItemId) => Object.values(findsAt).some((l) => l.some(([f]) => f === id));

export function biting(f: FishKind, hour: number, season: SeasonId, rain: number) {
  const w = f.when;
  if (!w) return true;
  if (w.seasons && !w.seasons.includes(season)) return false;
  if (w.rain && rain <= 0) return false;
  const h = ((hour % 24) + 24) % 24;
  if (w.hours === "night") return h >= 20 || h < 5;
  if (w.hours === "twilight") return (h >= 4 && h < 8) || (h >= 17 && h < 21);
  if (w.hours === "day") return h >= 7 && h < 19;
  return true;
}

/** What comes out of the water here, by water, climate and broad region. */
export function fishOf(s: Pick<WorldSetting, "climate" | "culture"> & Partial<Pick<WorldSetting,"lon"|"lat"|"year">>, water: FishingWater): FishKind[] {
  const c = s.climate, u = s.culture, hot = c === "tropical" || c === "monsoon";
  const americas = u === "mesoamerican" || u === "andean" || u === "other-indigenous-american";
  // West Africa and the Caribbean share the tropical Atlantic's fish, not the Indo-Pacific's.
  const atlantic = u === "west-central-african" || americas || (s.lon !== undefined && s.lon > -100 && s.lon < 15);
  if (water === "sea")
    return hot ? atlantic ? waters.seaAtlanticTropical : waters.seaTropical : u === "east-asian" ? waters.seaEastAsia
      : c === "mediterranean" || c === "arid" ? waters.seaWarm : waters.seaCold;
  if(water==="lake" && s.lon!==undefined && s.lat!==undefined && s.lon>=31.5 && s.lon<=34.9 && s.lat>=-3 && s.lat<=.6)
    return waters.riverAfrica.filter(f=>["Tilapia","African catfish","Elephantfish","Freshwater crab"].includes(f.name) || f.name==="Nile perch" && (s.year ?? 0)>=1960);
  if (c === "boreal" || c === "tundra") return waters.riverCold;
  if (u === "east-asian") return waters.riverEastAsia;
  if (americas) return hot ? waters.riverAmazon : u === "andean" ? waters.lakeAndes : u === "mesoamerican" ? waters.lakeMexico : waters.riverNorthAmerica;
  if (u === "south-asian") return waters.riverSouthAsia;
  if (u === "southeast-asian") return waters.riverSoutheastAsia;
  if (u === "australian-pacific") return waters.riverAustralia;
  if (u === "west-central-african" || u === "east-southern-african") return waters.riverAfrica;
  if (c === "arid" || u === "north-african-west-asian") return waters.riverDry;
  return hot ? waters.riverAfrica : waters.riverTemperate;
}

export const fishItemId = (f: Pick<FishKind, "name">) => `fish-${f.name.toLowerCase().normalize("NFD").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`;
export const trophyFish = new Map(Object.values(waters).flat().filter(f => f.rarity === "legendary").map(f => [fishItemId(f), f]));
const fishWeight = ([lo, hi]: [number, number]) =>
  hi < 1 ? `${Math.round(lo * 1000)}-${Math.round(hi * 1000)} g` : `${lo < 1 ? lo.toFixed(1) : Math.round(lo)}-${Math.round(hi)} kg`;
/** Fresh fish, one item to each kind, worth what a typical one weighs. */
export const fishItems: Record<ItemId, ItemDef> = Object.fromEntries(
  Object.values(waters).flat().flatMap((f) => {
    const kg = Math.sqrt(f.kg[0] * f.kg[1]), id = fishItemId(f);
    const item: ItemDef = {
      id, name: f.name, sprite: "fish",
      value: Math.max(1, Math.min(40, Math.round((1 + kg * 1.2) * (f.rarity ? 2 : 1)))),
      edible: Math.min(60, Math.round(8 + kg * 6)),
      description: `${f.note} ${fishWeight(f.kg)}${f.rarity === "legendary" ? ". A legendary catch" : f.rarity ? ", and seldom landed" : ""}.`,
    };
    const dried = `dried-${id}`;
    return [[id, item], [dried, { ...item, id: dried, name: `Salt-dried ${f.name.toLowerCase()}`, value: item.value + 2, description: `Split, salted and dried under cover at the landing.` }]];
  }),
);


export function cureFish(rack: WorldObject, bag: Inventory, id: string, keeper: string, clock: number) {
  const batch = rack.curing, count = Math.min(3, bag[id] ?? 0);
  if (!batch || batch.fish || count < 1 || !id.startsWith("fish-") || !fishItems[id]) return 0;
  const salt = rack.inventory.salt ? rack.inventory : bag;
  if (!salt.salt) return 0;
  salt.salt--; bag[id]! -= count;
  Object.assign(batch, { fish: id, count, keeper, ready: clock + 6 * 3600 });
  return count;
}

export function collectDried(rack: WorldObject, bag: Inventory, keeper: string, clock: number) {
  const batch = rack.curing;
  if (!batch?.fish || batch.keeper !== keeper || clock < batch.ready!) return;
  const id = `dried-${batch.fish}`;
  bag[id] = (bag[id] ?? 0) + batch.count!;
  delete batch.fish; delete batch.count; delete batch.ready; delete batch.keeper;
  return id;
}
