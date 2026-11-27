import { random } from "../../core/random";
import type { Inventory, ItemDef } from "../../core/types";
import type { WorldSetting } from "../geography/types";
import type { CharacterScope, Livelihood, Rank, SocietyCapability } from "./context-types";
import { callingItems } from "./livelihoods";
import { matchesCharacterScope } from "./resolve";
import { smokingHabit, supplyFor } from "./smoking";

/** The small personal things a person has on them, apart from the tools of their work.
 * Shares are educated guesses at how many people like this one had one. */
type Row = Omit<CharacterScope, "years"> & {
  item: string;
  years: readonly [number, number];
  share: number;
  n?: number;
  ranks?: readonly Rank[];
  sex?: "male" | "female";
  ages?: readonly [number, number];
  tiers?: readonly NonNullable<Livelihood["tier"]>[];
  /** The work, matched against the livelihood's label and id, or against the role asked for. */
  work?: RegExp;
  belief?: RegExp;
  needs?: SocietyCapability;
  without?: SocietyCapability;
};

const ANY = [-1000000, 10001] as const;
const ADULT = [14, 200] as const;
const CHILD = [3, 14] as const;
const LOW = ["destitute", "labouring"] as const;
const MID = ["middling", "gentry", "elite"] as const;
const TOP = ["gentry", "elite"] as const;
const URBAN = ["town", "industrial", "modern"] as const;
const NEAR_EAST = ["north-african-west-asian"] as const;
const AUSTRALIA: CharacterScope["bounds"] = [112, -45, 155, -10];
const MESOPOTAMIA: CharacterScope["bounds"] = [38, 28, 51, 38];
const RED_SEA_HORN: CharacterScope["bounds"] = [36, 3, 55, 19];
const FAITH_BEADS = /buddh|hindu|jain|sikh|bhakti|vaishnav|shaiv|tibet|lama/i;
const WRITERS = /scribe|clerk|scholar|priest|monk|physician|teacher|poet|official|secretary|notary|lawyer|accountant|steward|merchant|student/i;

export const carriedItems: Record<string, ItemDef> = Object.fromEntries(([
  ["stone-knife", "Flint knife", "flint", 1, "A sharp flake of flint or obsidian bound to a short handle, for cutting meat, hide, rope and wood."],
  ["knife", "Knife", "tool", 3, "A plain working knife with a wooden or bone handle, used for everything from dinner to repairs."],
  ["fire-drill", "Fire drill", "stick", 1, "A spindle of dry wood and a notched board, spun with a bow or the palms until the dust smoulders; tinder fungus wrapped around it."],
  ["tinderbox", "Tinderbox", "flint", 2, "A small box with a flint, an iron striker and dry tinder: the way to make a light until matches."],
  ["hide-pouch", "Hide pouch", "hide", 1, "A small skin bag on a cord, holding a few useful scraps."],
  ["pouch", "Belt pouch", "satchel", 2, "A little leather bag hung from the belt, for coins, a knife sheath, a flint and odd bits."],
  ["purse", "Purse", "satchel", 2, "A small clasp purse for coins and a few folded notes."],
  ["wallet", "Wallet", "satchel", 3, "A folding leather wallet with money, cards and a few scraps of paper."],
  ["handbag", "Handbag", "satchel", 4, "A bag on a shoulder strap with a purse, keys, tissues and everything else a day might need."],
  ["tote", "Tote bag", "satchel", 2, "A cloth carrier bag with two handles, folded flat when empty."],
  ["backpack", "Backpack", "satchel", 4, "A rucksack with two shoulder straps, for books, lunch and a change of clothes."],
  ["keys", "Keys", "chain", 2, "A ring of keys to the door and whatever else needs locking."],
  ["handkerchief", "Handkerchief", "kerchief", 1, "A square of cotton or linen for the nose, the brow and the occasional knot."],
  ["spectacles", "Spectacles", "glasses", 8, "Two lenses in a frame, for reading and close work. Without them small print is a blur."],
  ["amulet", "Amulet", "necklace", 2, "A charm on a cord against the evil eye, illness and bad luck: a tooth, a knot, a stone or a little bag of something."],
  ["seal-ring", "Seal ring", "ring", 12, "A ring with a carved face, pressed in wax to close a letter and to stand in for a signature."],
  ["cylinder-seal", "Cylinder seal", "stone", 8, "A small stone cylinder carved in reverse, worn on a cord and rolled over wet clay to sign for goods."],
  ["chop", "Name seal", "stone", 6, "A carved stone stamp with the owner's name, dipped in red paste and pressed to documents and paintings."],
  ["scroll", "Scroll", "papyrus", 4, "A roll of papyrus, parchment or paper, written on one side and wound on a stick."],
  ["clay-tablet", "Clay tablet and stylus", "clay", 2, "A palm-sized pad of damp clay and a reed stylus for accounts, letters and lessons; wedge-shaped marks dry hard."],
  ["wax-tablet", "Wax tablet", "wood", 3, "Two wooden leaves hollowed and filled with wax, scratched with a pointed stylus and smoothed over to use again."],
  ["ink-brush", "Brush and ink", "stick", 3, "A brush, an inkstick and a small inkstone, for writing characters on paper or silk."],
  ["pen-and-ink", "Pen and ink", "tool", 3, "A quill or reed pen, a stoppered horn of ink and a pounce box of sand."],
  ["pen", "Pen", "tool", 1, "A ballpoint or fountain pen clipped in a pocket."],
  ["guidebook", "Guidebook", "book", 5, "A paperback guide to the sights, the history, the restaurants and the prices."],
  ["street-map", "Folded map", "newspaper", 1, "A paper map of the town, creased from folding and refolding."],
  ["passport", "Passport", "book", 2, "A small booklet with a photograph, stamped at every border."],
  ["papers", "Identity papers", "book", 1, "A card or booklet that says who you are, to be shown to an official on demand."],
  ["lighter", "Lighter", "matches", 1, "A pocket lighter with a flint wheel and a little fuel, or a throwaway plastic one."],
  ["pipe", "Tobacco pipe", "tobacco", 2, "A bowl and a stem for smoking: clay, wood or brass, with the bowl blackened inside."],
  ["spindle", "Drop spindle", "stick", 1, "A stick weighted with a whorl, twirled to spin a thread from a bundle of fleece or flax tucked in the belt."],
  ["needle", "Needle and thread", "tool", 1, "A bone or metal needle with sinew, fibre or thread wound round it, for mending as you go."],
  ["digging-stick", "Digging stick", "stick", 1, "A hardwood stick, fire-hardened at the point, for prising up roots, tubers and burrowing animals."],
  ["lota", "Brass water pot", "water", 3, "A round-bellied brass pot with a narrow neck, for drinking, washing and the morning ritual."],
  ["phone", "Mobile phone", "phone-bar", 40, "A telephone carried in the pocket."],
  ["pager", "Pager", "pager", 12, "A belt-clip receiver that beeps and shows who wants you."],
  ["pocket-radio", "Transistor radio", "pocket-radio", 8, "A pocket radio set with an earpiece."],
  ["cassette-player", "Personal cassette player", "cassette-player", 20, "A cassette player with headphones, small enough for a belt."],
  ["game-handheld", "Pocket game", "lcd-game", 15, "An electronic game that fits in the hand."],
  ["khipu", "Khipu", "cord", 3, "A bundle of knotted cords hanging from a master cord, whose colours and knots record counts of people, llamas and tribute."],
] as const).map(([id, name, sprite, value, description]) => [id, { id, name, sprite, value, description }]));

const row = (item: string, years: readonly [number, number], share: number, rest: Partial<Row> = {}): Row => ({ item, years, share, ...rest });

const EARLY_ADOPTERS = ["european", "east-asian"] as const;
const ON_CALL = /physician|doctor|surgeon|nurse|engineer|manager|broker|dealer|courier|reporter|plumber|electrician|executive/i;

export const carried: readonly Row[] = [
  // Pocket electronics; devices.ts says which model each date and place had.
  row("phone", [1984, 1994], 0.04, { ranks: TOP, ages: ADULT, cultures: EARLY_ADOPTERS }),
  row("phone", [1994, 1999], 0.2, { ranks: MID, ages: ADULT, cultures: EARLY_ADOPTERS }),
  row("phone", [1999, 2004], 0.6, { ages: ADULT, cultures: EARLY_ADOPTERS }),
  row("phone", [2004, 2011], 0.85, { ages: [12, 200], cultures: EARLY_ADOPTERS }),
  row("phone", [1999, 2006], 0.12, { ages: ADULT }),
  row("phone", [2006, 2012], 0.55, { ages: ADULT }),
  row("phone", [2012, 10001], 0.85, { ages: [12, 200] }),
  row("phone", [2011, 10001], 0.96, { ages: [11, 200], cultures: EARLY_ADOPTERS }),
  row("pager", [1980, 1996], 0.3, { work: ON_CALL, ages: ADULT, cultures: EARLY_ADOPTERS }),
  row("pager", [1992, 1999], 0.3, { ages: [14, 30], cultures: ["east-asian"], tiers: URBAN }),
  row("pager", [1994, 2001], 0.08, { ages: [16, 45], tiers: URBAN }),
  row("pocket-radio", [1957, 1980], 0.2, { ages: [12, 200] }),
  row("pocket-radio", [1980, 2005], 0.08, { ages: [12, 200] }),
  row("pocket-radio", [1965, 2012], 0.25, { ages: ADULT, cultures: ["west-central-african", "east-southern-african", "south-asian"] }),
  row("cassette-player", [1980, 2000], 0.18, { ages: [12, 35], cultures: EARLY_ADOPTERS }),
  row("cassette-player", [1985, 2004], 0.08, { ages: [12, 35] }),
  row("cassette-player", [2002, 2011], 0.2, { ages: [12, 35] }),
  row("game-handheld", [1980, 1989], 0.12, { ages: [6, 16], cultures: EARLY_ADOPTERS }),
  row("game-handheld", [1989, 2011], 0.25, { ages: [6, 18] }),
  row("game-handheld", [1989, 2011], 0.05, { ages: [18, 35] }),
  // Everyone had a blade.
  row("stone-knife", ANY, 0.85, { ages: ADULT, without: "metallurgy" }),
  row("knife", [-1000000, 1900], 0.8, { ages: ADULT, needs: "metallurgy" }),
  row("knife", [1900, 1960], 0.4, { ages: ADULT, needs: "metallurgy" }),
  row("knife", [1960, 10001], 0.12, { ages: ADULT, needs: "metallurgy" }),
  row("fire-drill", ANY, 0.5, { ages: ADULT, without: "metallurgy" }),
  row("tinderbox", [-800, 1870], 0.5, { ages: ADULT, needs: "metallurgy" }),
  row("hide-pouch", [-1000000, -3000], 0.6, { ages: ADULT }),
  row("pouch", [-3000, 1800], 0.6, { ages: ADULT }),
  row("amulet", [-1000000, 1900], 0.3, { ages: [1, 200] }),
  row("amulet", [1900, 10001], 0.08, { ages: [1, 200] }),
  row("silver-ring", ANY, 0.3, { ages: [16, 200], ranks: MID, needs: "metallurgy" }),
  row("silver-ring", [1500, 10001], 0.2, { ages: [18, 200], sex: "female", ranks: LOW }),

  // Handwork. A woman's day was never idle hands.
  row("spindle", [-8000, 1850], 0.45, { sex: "female", ages: [10, 200] }),
  row("needle", [-40000, 1950], 0.4, { sex: "female", ages: [12, 200] }),
  row("wooden-bowl", [-3000, 1850], 0.25, { ages: ADULT, ranks: LOW }),
  row("wooden-bowl", [-500, 1850], 0.6, { ages: ADULT, sex: "male", cultures: ["inner-eurasian"] }),

  // Money and keys.
  row("purse", [1790, 1950], 0.55, { sex: "female", ages: ADULT }),
  row("wallet", [1790, 10001], 0.85, { sex: "male", ages: [16, 200] }),
  row("wallet", [1950, 10001], 0.4, { sex: "female", ages: [16, 200] }),
  row("handbag", [1920, 10001], 0.65, { sex: "female", ages: [14, 200] }),
  row("tote", [1990, 10001], 0.25, { ages: [14, 200], tiers: ["modern"] }),
  row("backpack", [1975, 10001], 0.35, { ages: [10, 40] }),
  row("keys", [1100, 1750], 0.4, { sex: "female", ranks: TOP, ages: [20, 200] }),
  row("keys", [1750, 1900], 0.55, { ranks: MID, ages: [16, 200] }),
  row("keys", [1900, 10001], 0.9, { ages: [16, 200] }),
  row("handkerchief", [1600, 1900], 0.5, { cultures: ["european"], ages: [8, 200] }),
  row("handkerchief", [1850, 10001], 0.4, { ages: [8, 200] }),

  // Seeing, and being seen to see.
  row("spectacles", [1300, 1800], 0.12, { cultures: ["european", ...NEAR_EAST], ranks: MID, ages: [45, 200] }),
  row("spectacles", [1500, 1850], 0.15, { cultures: ["east-asian"], ranks: MID, ages: [45, 200] }),
  row("spectacles", [1800, 1950], 0.35, { ages: [45, 200] }),
  row("spectacles", [1950, 10001], 0.45, { ages: [40, 200] }),
  row("spectacles", [1950, 10001], 0.2, { ages: [14, 40] }),

  // Timekeeping, from the pocket to the wrist.
  row("pocket-watch", [1700, 1930], 0.6, { sex: "male", ranks: TOP }),
  row("pocket-watch", [1750, 1930], 0.3, { sex: "male", ranks: ["middling"] }),
  row("pocket-watch", [1850, 1930], 0.12, { sex: "male", ranks: LOW, tiers: ["industrial", "town"] }),
  row("wristwatch", [1915, 1960], 0.35, { sex: "male", ages: ADULT }),
  row("wristwatch", [1960, 2005], 0.7, { ages: ADULT }),
  row("wristwatch", [2005, 10001], 0.4, { ages: ADULT }),

  // Signing for things.
  row("seal-ring", [-500, 1900], 0.35, { cultures: ["european", ...NEAR_EAST], sex: "male", ranks: MID }),
  row("cylinder-seal", [-3500, -300], 0.5, { bounds: MESOPOTAMIA, ranks: MID, needs: "writing" }),
  row("chop", [-1000, 1950], 0.45, { cultures: ["east-asian"], ranks: MID, needs: "writing", ages: [16, 200] }),

  // Writing and reading.
  row("clay-tablet", [-3300, -500], 0.5, { bounds: MESOPOTAMIA, work: WRITERS, needs: "writing" }),
  row("clay-tablet", [-3300, -500], 0.15, { bounds: MESOPOTAMIA, ranks: MID, needs: "writing" }),
  row("wax-tablet", [-700, 600], 0.55, { cultures: ["european", ...NEAR_EAST], work: WRITERS, needs: "writing" }),
  row("wax-tablet", [-700, 600], 0.15, { cultures: ["european", ...NEAR_EAST], ranks: MID, needs: "writing" }),
  row("ink-brush", [-1200, 1950], 0.55, { cultures: ["east-asian"], work: WRITERS, needs: "writing" }),
  row("ink-brush", [-1200, 1950], 0.2, { cultures: ["east-asian"], ranks: MID, needs: "writing" }),
  row("pen-and-ink", [600, 1950], 0.5, { cultures: ["european", ...NEAR_EAST, "south-asian"], work: WRITERS, needs: "writing" }),
  row("pen-and-ink", [600, 1950], 0.15, { cultures: ["european", ...NEAR_EAST, "south-asian"], ranks: MID, needs: "writing" }),
  row("pen", [1930, 10001], 0.5, { ages: [8, 200], tiers: URBAN }),
  row("scroll", [-3000, 1460], 0.55, { work: WRITERS, needs: "writing" }),
  row("scroll", [-3000, 1460], 0.15, { ranks: TOP, needs: "writing" }),
  row("book", [1460, 10001], 0.3, { cultures: ["european"], ranks: MID, ages: [14, 200] }),
  row("book", [1460, 10001], 0.65, { work: WRITERS, ages: [14, 200] }),
  row("woodblock-book", [800, 10001], 0.3, { cultures: ["east-asian"], ranks: MID, ages: [14, 200] }),
  row("book", [1880, 10001], 0.5, { ages: [6, 14], tiers: URBAN }),
  row("newspaper", [1800, 1900], 0.25, { ranks: MID, ages: [18, 200], tiers: URBAN }),
  row("newspaper", [1900, 2000], 0.2, { ages: [16, 200], tiers: URBAN }),
  row("newspaper", [2000, 10001], 0.04, { ages: [16, 200], tiers: URBAN }),

  // Faith in the pocket.
  row("beads", [-500, 10001], 0.35, { belief: FAITH_BEADS, ages: [12, 200] }),
  row("beads", [700, 10001], 0.35, { belief: /islam|muslim|sufi/i, ages: [12, 200] }),
  row("beads", [1100, 10001], 0.35, { belief: /christian|catholic|orthodox|protestant/i, ages: [12, 200] }),

  // Weather and heat.
  row("umbrella", [1770, 10001], 0.25, { cultures: ["european"], ages: [16, 200] }),
  row("umbrella", [1900, 10001], 0.25, { ages: [16, 200] }),
  row("paper-umbrella", [-200, 1920], 0.2, { cultures: ["east-asian", "southeast-asian"], ages: [16, 200] }),
  row("fan", [1500, 1930], 0.4, { cultures: ["european"], sex: "female", ranks: MID }),
  row("fan", [-200, 1930], 0.4, { cultures: ["east-asian"], sex: "female", ranks: MID }),
  row("fan", [-200, 1930], 0.15, { cultures: ["east-asian"], sex: "male", ranks: MID }),
  row("fan", [1000, 1930], 0.3, { cultures: ["south-asian", ...NEAR_EAST], sex: "female", ranks: MID }),
  row("walking-cane", [1650, 1920], 0.4, { cultures: ["european"], sex: "male", ranks: MID, ages: [25, 200] }),
  row("walking-cane", ANY, 0.15, { ages: [62, 200] }),

  // Children carry what they find.
  row("pebble", ANY, 0.5, { ages: CHILD }),
  row("stick", ANY, 0.4, { ages: CHILD }),
  row("satchel", [1850, 1975], 0.6, { ages: [6, 14], tiers: URBAN }),
  row("backpack", [1975, 10001], 0.7, { ages: [6, 14] }),

  // Regions.
  row("coca", [-3000, 10001], 0.55, { cultures: ["andean"], ages: [14, 200] }),
  row("sling", [-1500, 1700], 0.4, { cultures: ["andean"], sex: "male", ages: [14, 200] }),
  row("khipu", [1000, 1700], 0.25, { cultures: ["andean"], sex: "male", ranks: MID }),
  row("khipu", [1000, 1700], 0.6, { cultures: ["andean"], work: /official|clerk|accountant|steward|kuraka|tribute|overseer/i }),
  row("obsidian", [-1500, 1550], 0.25, { cultures: ["mesoamerican"], sex: "male", ages: ADULT }),
  row("khat", [1400, 10001], 0.3, { bounds: RED_SEA_HORN, sex: "male", ages: [16, 200] }),
  row("pituri", [-1000000, 1900], 0.3, { bounds: [128, -30, 146, -18], ages: ADULT }),
  row("throwing-stick", [-1000000, 1850], 0.5, { bounds: AUSTRALIA, sex: "male", ages: ADULT }),
  row("digging-stick", [-1000000, 1900], 0.7, { bounds: AUSTRALIA, sex: "female", ages: ADULT }),
  row("cudgel", [-500, 1900], 0.15, { cultures: ["east-southern-african"], sex: "male", ages: ADULT }),
  row("cudgel", [-500, 1900], 0.5, { cultures: ["east-southern-african"], sex: "male", ages: ADULT, work: /herd|cattle|pastoral|shepherd/i }),
  row("lota", [-500, 10001], 0.3, { cultures: ["south-asian"], ranks: LOW, ages: ADULT }),

  // Visitors carry what visitors carry.
  row("guidebook", [1850, 10001], 0.7, { work: /^(tourist|visitor|day tripper)$/i }),
  row("street-map", [1900, 2000], 0.6, { work: /^tourist$/i }),
  row("street-map", [2000, 10001], 0.1, { work: /^tourist$/i }),
  row("passport", [1920, 10001], 0.6, { work: /^tourist$/i }),
  row("backpack", [1970, 10001], 0.6, { work: /^(tourist|student)$/i }),
  row("umbrella", [1900, 10001], 0.3, { work: /^(tourist|commuter|day tripper)$/i }),
  row("newspaper", [1920, 2005], 0.7, { work: /^(commuter|day tripper)$/i }),
  row("briefcase", [1920, 10001], 0.4, { work: /^commuter$/i }),
  row("briefcase", [1840, 10001], 0.8, { work: /^(commercial traveller|sales rep)$/i }),
  row("ledger", [1840, 1980], 0.5, { work: /^(commercial traveller|inspector|market trader)$/i }),
  row("basket", [1840, 1940], 0.7, { work: /^market trader$/i }),
  row("book", [1950, 10001], 0.9, { work: /^student$/i }),
  row("pen", [1950, 10001], 0.9, { work: /^(student|sales rep|inspector)$/i }),
  row("papers", [1915, 1990], 0.6, { cultures: ["european", "inner-eurasian"], ages: ADULT }),
];

const PIPES = new Set(["clay-pipe", "long-pipe", "kiseru", "chillum"]);

/** What this person has on them beyond their work. `role` is what they are called here; `visiting`
 * is set when it is not the work they were drawn with, and then the drawn work's tools are dropped
 * from `have` if the role has a kit of its own. */
export function carriedBy(
  s: WorldSetting,
  seed: string,
  id: string,
  person: {
    age: number;
    sex: "male" | "female" | "unspecified";
    livelihood: Livelihood;
    role: string;
    visiting: boolean;
    community: string;
    belief: string;
    capabilities: ReadonlySet<SocietyCapability>;
    have: Inventory;
  },
) {
  const { age, sex, livelihood, visiting } = person;
  const text = visiting ? person.role : `${livelihood.label} ${livelihood.id}`;
  const rank = livelihood.rank ?? "labouring";
  let replaces = false;
  const hits: { item: string; n: number; key: number }[] = [];
  for (const r of carried) {
    if (r.ages && (age < r.ages[0] || age >= r.ages[1])) continue;
    if (r.sex && r.sex !== sex) continue;
    if (r.ranks && !r.ranks.includes(rank)) continue;
    if (r.tiers && !(livelihood.tier && r.tiers.includes(livelihood.tier))) continue;
    if (r.belief && !r.belief.test(person.belief)) continue;
    if (r.work && !r.work.test(text)) continue;
    if (r.needs && !person.capabilities.has(r.needs)) continue;
    if (r.without && person.capabilities.has(r.without)) continue;
    if (!matchesCharacterScope(r, s, person.community)) continue;
    if (r.work && visiting) replaces = true;
    const roll = random(seed, id, "carries", r.item);
    if (roll < r.share) hits.push({ item: r.item, n: r.n ?? 1, key: roll - r.share - (r.work ? 1 : 0) });
  }
  const items: Inventory = {};
  const habit = smokingHabit(s, { age, sex: sex === "unspecified" ? undefined : sex, setting: s, role: person.role.toLowerCase() }, random(seed, "smokes", id), random(seed, "smoke-form", id));
  if (habit) {
    if (id !== "player") items[supplyFor(habit, s.year)] = 2;
    if (PIPES.has(habit)) items.pipe = 1;
    if (habit !== "betel" && habit !== "snuff" && s.year >= 1830)
      items[s.year >= 1930 && random(seed, id, "lights") < (s.year < 1970 ? 0.5 : 0.9) ? "lighter" : "matches"] = 1;
  }
  if (replaces) for (const k of callingItems) delete person.have[k];
  const taken = new Set([...Object.keys(person.have), ...Object.keys(items)]);
  let room = Math.max(0, Math.min(4, 7 - taken.size));
  for (const h of hits.sort((a, b) => a.key - b.key)) {
    if (room <= 0) break;
    if (taken.has(h.item)) continue;
    items[h.item] = h.n;
    taken.add(h.item);
    room--;
  }
  return items;
}
