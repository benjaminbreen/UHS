import { rngOf } from "../../core/random";
import type { Fair, FairArea, FairFind } from "../fairs/types";
import { find as f } from "./kit";
import { BLACK_GROUND, CINNABAR, EGYPTIAN_BLUE, MADDER, meadHall, neolithicHall, OCHRE, romanHouse, UNDYED, WELD, WOAD, type PalaceStyle } from "./styles";

// Palaces nobody drew a plan of. A kind of palace is a recipe: given a seed it chooses its rooms,
// their sizes and colours, and sets them out in rows from the gate inward. Each kind is expanded
// into a few plans when the game loads; a prompt that asks for the kind starts in one of them.

/** A room or court in a row of the plan: plan units wide, and what a `FairArea` needs besides its rectangle. */
type Slot = Omit<FairArea, "at" | "kind" | "basis"> & { kind: "room" | "yard"; wide: number; basis?: FairArea["basis"] };

/** Rows of rooms into rectangles: the first row at the gate, each next row behind it, every row centred on the way in. */
export function setOut(rows: { deep: number; slots: Slot[] }[]): FairArea[] {
  const out: FairArea[] = [];
  let y = rows.reduce((n, r) => n + r.deep, 0);
  for (const row of rows) {
    y -= row.deep;
    let x = 30 - Math.round(row.slots.reduce((n, s) => n + s.wide, 0) / 2);
    for (const { wide, kind, ...rest } of row.slots) {
      out.push({ basis: "inferred", floor: "parquet", ...rest, kind: kind === "room" ? "gallery" : "court", rustic: kind === "yard" || undefined, at: [x, y, wide, row.deep] });
      x += wide;
    }
  }
  return out;
}

type Kind = {
  id: string;
  name: string;
  years: readonly [number, number];
  /** Words that ask for this kind; `prompt` then says which of its periods an undated prompt means. */
  asks: RegExp;
  prompt: RegExp;
  entry: string;
  place: string;
  role: string;
  style: PalaceStyle;
  coin: readonly [string, string];
  finds: readonly FairFind[];
  enter: string;
  plan(rng: () => number): FairArea[];
};

const pick = <T,>(rng: () => number, of: readonly T[]) => of[Math.floor(rng() * of.length)];

const stoneFinds: readonly FairFind[] = [
  f("jadeite-axe", "Polished green axe", "axe", [], "prize", "An axe head of green stone, polished until it shines, too thin and too fine ever to cut wood.", "The stone comes from a mountain many weeks' walk away. It was passed from hand to hand to get here, and whoever holds it is someone.", { tint: "#5e9a72", basis: "inferred" }),
  f("grain-baskets", "Baskets of grain", "sacks", ["store"], "common", "Baskets of wheat and barley, kept off the ground on poles.", "This is next year's seed and this winter's bread. Whoever stores the most has the most people eating at his fire.", { weight: 3 }),
  f("hides", "Bundled hides", "bales", ["store"], "common", "Cattle hides, scraped and rolled.", "Cattle are what a big house counts.", { tint: "#8a6a4a", weight: 2 }),
  f("store-jar", "Storage jar", "vase", ["store", "hall"], "common", "A round-bottomed jar as tall as a child, sealed with clay.", "Fat, honey or dried fruit, put by against the spring.", { tint: "#9a6a4a", weight: 2 }),
];
const ironFinds: readonly FairFind[] = [
  f("mead-vat", "Mead vat", "barrels", [], "prize", "Stave-built vats of mead, with a ladle hung on the rim.", "A lord is someone who gives. Mead, rings and a place by the fire are what he gives, and men fight for him in return.", { tint: "#8a5a2a", verb: "Take a horn", heal: 4, time: 300 }),
  f("wool-bales", "Bales of wool", "bales", ["store"], "common", "Fleeces tied in bales, paid in as rent.", "The hall is fed and clothed by the farms round it, which owe it food, cloth and days of work.", { tint: "#d8ceb4", weight: 2 }),
  f("grain-sacks", "Sacks of barley", "sacks", ["store"], "common", "Sacks of barley for bread and for malt.", "Most of it becomes ale.", { weight: 3 }),
  f("ale-jar", "Jar of ale", "vase", ["store", "hall"], "common", "A big-bellied jar with a cloth tied over its mouth.", "Weak ale is what everyone drinks, children too.", { tint: "#7a5a3a", weight: 2 }),
];

/** A big house in its fenced yard: the hall, sometimes a store or a weaving house beside it, sometimes a second yard behind. */
function hallPlan(stone: boolean) {
  return (rng: () => number): FairArea[] => {
    const cloth = pick(rng, stone ? [UNDYED] : [MADDER, WOAD, WELD]), long = 11 + Math.floor(rng() * 4), people = stone ? ["nh-kin", "nh-kin", "nh-herder", "nh-potter", "nh-elder", "nh-child-minder"] : ["mh-warrior", "mh-warrior", "mh-guest", "mh-servant", "mh-weaver", "mh-poet"];
    const hall: Slot = {
      kind: "room", wide: long, id: "hall", name: stone ? "the big house" : "the hall", palace: { cloth }, stands: { tags: ["hall"], n: 1 }, people,
      exhibits: [stone ? "jadeite-axe" : "mead-vat"],
      note: stone ? "The largest house in the settlement, long enough for a dozen families to eat in. Whoever lives here feeds the others at need, and is owed for it." : "One long room under one roof: the lord's seat in the middle of the long wall, the fires down the centre, benches where his men eat and sleep.",
    };
    const store: Slot = { kind: "room", wide: 6, id: "store", name: stone ? "the store house" : "the store", palace: { room: "store", cloth }, stands: { tags: ["store"], n: 5 }, people: people.slice(2, 5), note: stone ? "Grain, hides and jars, kept dry under the same thatch." : "What the farms pay in: grain, wool, ale and salt meat." };
    const weaving: Slot = { kind: "room", wide: 6, id: "bower", name: stone ? "the women's house" : "the bower", palace: { room: "store", cloth, bays: ["bare", "hanging", "shelf"] }, stands: { tags: ["store"], n: 2 }, people: people.slice(3), note: stone ? "A smaller house where cloth is woven and children are minded." : "The women's house apart from the hall, where the weaving is done." };
    const sides = rng() < 0.5 ? [store, hall, weaving] : rng() < 0.5 ? [store, hall] : [hall, weaving];
    const yard = (id: string, name: string, note: string, gate?: "s"): Slot => ({ kind: "yard", wide: 18, id, name, note, people: people.slice(0, 4), stands: { tags: [], n: 0 }, gate });
    const rows = [
      { deep: 6, slots: [yard("yard", "the yard", stone ? "Trodden earth inside a fence of stakes, with cattle penned at night." : "The fenced yard in front of the hall, where horses are tied and spears are left at the door.", "s")] },
      { deep: 5, slots: sides },
    ];
    if (rng() < 0.6) rows.push({ deep: 5, slots: [yard("croft", stone ? "the gardens" : "the back yard", stone ? "Plots of peas, flax and poppies behind the houses." : "The yard behind the hall: the midden, the woodpile, the kitchen fire.")] });
    return setOut(rows);
  };
}

const romanFinds: readonly FairFind[] = [
  f("strongbox", "The strongbox", "strongbox", [], "prize", "A chest bound in iron and bolted to the floor, in full view of everyone who comes in.", "It is meant to be seen. Callers who come for money in the morning are paid out of it, and they notice how heavy the lid is."),
  f("greek-bronze", "Greek bronze", "statue", ["garden", "state"], "notable", "A bronze athlete, older than the house by four hundred years.", "Taken from a Greek city by a general and sold on. Half the good statues in Rome arrived that way.", { tint: "#6a8a6a", weight: 2 }),
  f("falernian", "Jar of Falernian", "vase", ["dining"], "common", "A sealed jar of wine with the consul's name of its year painted on the shoulder.", "Wine is dated by who was consul when it was made. This one is older than the cook.", { tint: "#9a5a3a", weight: 2 }),
  f("water-jar", "Water jar", "vase", ["state", "garden"], "common", "A big-bellied jar by the wall.", "The roof drains into the pool, the pool into a cistern under the floor, and the house drinks from that.", { tint: "#b88a64", weight: 2 }),
];

/** A Roman town house from the street door inward: the atrium with bedrooms beside it, the master's room and the dining room behind, the garden court at the back. */
function domusPlan(rng: () => number): FairArea[] {
  const house = ["rm-client", "rm-client", "rm-slave", "rm-slave", "rm-freedman", "rm-matrona", "rm-guest"], back = ["rm-slave", "rm-slave", "rm-matrona", "rm-tutor"];
  const second = pick(rng, [OCHRE, BLACK_GROUND, EGYPTIAN_BLUE]);
  const bed = (id: string, name: string): Slot => ({ kind: "room", wide: 5, id, name, palace: { room: "cubiculum", floor: "signinum", bays: ["fresco-alt", "fresco"], field: BLACK_GROUND }, stands: { tags: [], n: 0 }, people: back.slice(0, 2), note: "A small bedroom off the atrium: a couch, a chest, a lamp. People slept wherever in the house suited the season." });
  const dining: Slot = { kind: "room", wide: 6, id: "triclinium", name: "the dining room", palace: { room: "triclinium", bays: ["garden", "fresco", "garden"], field: second }, stands: { tags: ["dining"], n: 1 }, people: ["rm-slave", "rm-slave", "rm-guest", "rm-cook"], note: "Three couches round a table, three diners to a couch, each leaning on the left elbow. Where you are put says what the host thinks of you." };
  const study: Slot = { kind: "room", wide: 6, id: "tablinum", name: "the tablinum", palace: { room: "tablinum", bays: ["scrolls", "fresco", "scrolls"], field: BLACK_GROUND }, stands: { tags: [], n: 0 }, exhibits: ["strongbox"], people: ["rm-freedman", "rm-client", "rm-slave"], note: "The master's room at the head of the atrium, open to it, where he keeps his papers and receives callers." };
  const third: Slot = rng() < 0.5 ? bed("winter-room", "the winter room") : { ...dining, id: "oecus", name: "the garden room", wide: 6, palace: { room: "triclinium", bays: ["fresco-alt", "garden"], field: second, cloth: pick(rng, [CINNABAR, EGYPTIAN_BLUE]) } };
  const rows: { deep: number; slots: Slot[] }[] = [
    { deep: 5, slots: [bed("bedroom", "a bedroom"), { kind: "room", wide: 9, id: "atrium", name: "the atrium", gate: "s", palace: { bays: ["fresco", "niche", "fresco-alt", "fresco"], field: second }, stands: { tags: ["state"], n: 2 }, people: house, note: "The hall inside the street door, open to the sky in the middle, with a pool under the opening to catch the rain. Every morning it fills with people who depend on the master and have come to say so." }, bed("porter", "the porter's room")] },
    { deep: 5, slots: [dining, study, third] },
    { deep: 6, slots: [{ kind: "room", wide: 16, id: "peristyle", name: "the garden court", palace: { room: "peristyle", floor: "signinum", bays: ["garden", "fresco", "fresco-alt"], field: second }, stands: { tags: ["garden"], n: 2 }, people: back, note: "A garden inside the house with a covered walk round it on columns: the family's part of the house, where callers are not brought." }] },
  ];
  return setOut(rows);
}

const ROMAN = /\b(?:caesar|senator|patrician|consul|pontifex|domus|roman (?:noble|villa|house|household)|rich roman)\b/;
const LORD = /\b(?:warlord|chieftain|headman|jarl|thegn|thane|mead[- ]?hall|long ?house|great hall)\b/;
const hallEnter = "woodsmoke, dogs, and a roof-tree taller than any house in the country.";
const kinds: readonly Kind[] = [
  {
    id: "hall-stone", name: "the big house", years: [-9500, -2001], asks: LORD, prompt: /\b(?:neolithic|stone age)\b/, entry: "yard", place: "konya", role: "Chieftain", style: neolithicHall,
    coin: ["bead", "beads"], finds: stoneFinds, enter: "smoke through thatch, cattle in the yard, and the longest roof you have seen.", plan: hallPlan(true),
  },
  { id: "hall-lord", name: "the lord's hall", years: [500, 1150], asks: LORD, prompt: /./, entry: "yard", place: "london", role: "Chieftain", style: meadHall, coin: ["ring", "rings"], finds: ironFinds, enter: hallEnter, plan: hallPlan(false) },
  { id: "hall-iron", name: "the chieftain's hall", years: [-2000, 499], asks: LORD, prompt: /\b(?:bronze age|iron age)\b/, entry: "yard", place: "normandy", role: "Chieftain", style: meadHall, coin: ["ring", "rings"], finds: ironFinds, enter: hallEnter, plan: hallPlan(false) },
  {
    id: "domus", name: "the house", years: [-60, 480], asks: ROMAN, prompt: /./, entry: "atrium", place: "rome", role: "Senator", style: romanHouse,
    coin: ["sestertius", "sestertii"], finds: romanFinds, enter: "a dim hall, a square of sky in its roof, and a pool under it.", plan: domusPlan,
  },
  {
    id: "domus-early", name: "the house", years: [-300, -61], asks: ROMAN, prompt: /\brepublic\b/, entry: "atrium", place: "rome", role: "Senator", style: romanHouse,
    coin: ["as", "asses"], finds: romanFinds, enter: "a dim hall, a square of sky in its roof, and a pool under it.", plan: domusPlan,
  },
];

/** How many plans each kind is expanded into. */
const PLANS = 4;

export const plannedPalaces: readonly Fair[] = kinds.flatMap((k) => Array.from({ length: PLANS }, (_, i): Fair => ({
  id: `${k.id}-${i}`, name: k.name, city: "", where: [999, 999, 999, 999], years: k.years, entry: k.entry, areas: k.plan(rngOf("palace-plan", k.id, i)),
  scale: 5, look: "palace", palace: k.style, role: k.role, finds: k.finds, ticket: 0, coin: k.coin, place: k.place, generated: true, asks: k.asks,
  // Asked for with no date: the kind whose own period the prompt names, or the first that takes any.
  prompt: new RegExp(`(?=.*${k.asks.source})(?=.*${k.prompt.source})`),
  words: { short: "", gate: "", enter: k.enter },
})));
