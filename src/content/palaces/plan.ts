import { rngOf } from "../../core/random";
import type { Fair, FairArea, FairFind, FairPost } from "../fairs/types";
import type { Box } from "../sewers/types";
import { find as f } from "./kit";
import { aegeanPalace, BLACK_GROUND, BLUSH, chinesePalace, CINNABAR, CRIMSON, EGYPTIAN_BLUE, egyptianPalace, IMPERIAL_YELLOW, INDIGO, gothicHall, incaHall, islamicPalace, louisQuatorze, MADDER, MALACHITE, manorHall, mexicaPalace, meadHall, neolithicHall, OCHRE, OLD_GOLD, persianPalace, romanHouse, ROYAL_BLUE, SAGE, service, shoinPalace, TURKEY_RED, UNDYED, victorianState, WELD, WOAD, type PalaceBay, type PalaceStyle } from "./styles";

// Palaces nobody drew a plan of. A kind of palace is a recipe: given a seed it chooses its rooms, their sizes and
// colours, and sets them out the way its builders did: a hall with the lord's chamber at one end and the service
// at the other; a house round its courts; state rooms in a row that grow smaller and more private; rooms off a
// corridor. Each kind is expanded into a few plans when the game loads; a prompt that asks for the kind starts in one.

/** A room or court in a row of the plan: cells wide, and deep when shallower than its row; what a `FairArea` needs besides its rectangle. */
type Room = Omit<FairArea, "at" | "kind" | "basis"> & { kind: "room" | "yard" | "garden"; wide: number; deep?: number; hold?: "s"; basis?: FairArea["basis"] };
/** A room, rooms one behind another in the same width, or nothing for that width. */
type Slot = Room | { stack: Room[]; wide: number } | { gap: number };

/** Rows of rooms into rectangles: the first row at the gate, each next row behind it, every row centred on the way in.
 * Rooms that touch get a door unless one of them says which rooms it `opens` to. A room shallower than its row
 * stands against the back of it, or the front if it holds south. */
export function setOut(rows: { deep: number; slots: Slot[] }[]): FairArea[] {
  const out: FairArea[] = [], width = (s: Slot) => ("gap" in s ? s.gap : s.wide);
  const place = ({ wide, deep, hold, kind, ...rest }: Room, x: number, y: number) =>
    out.push({ basis: "inferred", floor: "parquet", ...rest, kind: kind === "room" ? "gallery" : "court", rustic: kind === "yard" || undefined, at: [x, y, wide, deep!] });
  let y = rows.reduce((n, r) => n + r.deep, 0);
  for (const row of rows) {
    y -= row.deep;
    let x = 60 - Math.round(row.slots.reduce((n, s) => n + width(s), 0) / 2);
    for (const s of row.slots) {
      if ("stack" in s) { let sy = y; for (const r of s.stack) { place({ ...r, wide: s.wide, deep: r.deep ?? row.deep }, x, sy); sy += r.deep ?? row.deep; } }
      else if (!("gap" in s)) { const deep = s.deep ?? row.deep; place({ ...s, deep }, x, s.hold === "s" ? y + row.deep - deep : y); }
      x += width(s);
    }
  }
  return out;
}

type Kind = {
  id: string;
  name: string;
  years: readonly [number, number];
  /** Words that ask for a start in this kind of house. */
  asks: RegExp;
  /** Words that name its people or its period. A kind without them is what a bare "palace" or "king" means in its years. */
  words?: RegExp;
  /** Who lives and works here: the title, the words that ask for it (the word itself is the title when none is given), the work, and how many of them there are. */
  posts: readonly FairPost[];
  residents?: Fair["residents"];
  /** The part of the world that built this way. */
  within?: Box;
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

const none = { tags: [], n: 0 };

/** A big house in its fenced yard: the hall, a store and a weaving house beside it, the lord's own chamber once there are lords, sometimes a second yard behind. */
function hallPlan(stone: boolean) {
  return (rng: () => number): FairArea[] => {
    const cloth = pick(rng, stone ? [UNDYED] : [MADDER, WOAD, WELD]), long = 52 + 4 * Math.floor(rng() * 5), people = stone ? ["nh-kin", "nh-kin", "nh-herder", "nh-potter", "nh-elder", "nh-child-minder"] : ["mh-warrior", "mh-warrior", "mh-guest", "mh-servant", "mh-weaver", "mh-poet"];
    const hall: Room = {
      kind: "room", wide: long, id: "hall", name: stone ? "the big house" : "the hall", palace: { cloth }, stands: { tags: ["hall"], n: 1 }, people,
      exhibits: [stone ? "jadeite-axe" : "mead-vat"],
      note: stone ? "The largest house in the settlement, long enough for a dozen families to eat in. Whoever lives here feeds the others at need, and is owed for it." : "One long room under one roof: the lord's seat in the middle of the long wall, the fires down the centre, benches where his men eat and sleep.",
    };
    const store: Room = { kind: "room", wide: 22, deep: 17, id: "store", name: stone ? "the store house" : "the store", palace: { room: "store", cloth }, stands: { tags: ["store"], n: 4 }, people: people.slice(2, 5), note: stone ? "Grain, hides and jars, kept dry under the same thatch." : "What the farms pay in: grain, wool, ale and salt meat." };
    const weaving: Room = { kind: "room", wide: 20, deep: 16, id: "bower", name: stone ? "the women's house" : "the weaving house", palace: { room: "store", cloth, bays: ["bare", "hanging", "shelf"] }, stands: { tags: ["store"], n: 2 }, people: people.slice(3), note: stone ? "A smaller house where cloth is woven and children are minded." : "A house apart from the hall, where the weaving is done." };
    // A lord sleeps apart from his men, in a small house of his own beside the hall.
    const chamber: Room = { kind: "room", wide: 16, deep: 14, id: "chamber", name: "the lord's chamber", opens: ["hall"], palace: { room: "bedchamber", cloth, bays: ["hanging", "bare", "hanging"] }, stands: none, people: ["mh-servant", "mh-weaver"], note: "The lord's own house, a few steps from the hall: a bed, his chests, and a door that shuts. Everyone else sleeps on the hall benches." };
    const sides = stone ? (rng() < 0.5 ? [store, hall, weaving] : rng() < 0.5 ? [store, hall] : [hall, weaving]) : rng() < 0.5 ? [store, hall, chamber] : [chamber, hall, weaving];
    const yard = (id: string, name: string, note: string, gate?: "s"): Room => ({ kind: "yard", wide: 84, id, name, note, people: people.slice(0, 4), stands: none, gate });
    const rows = [
      { deep: 30, slots: [yard("yard", "the yard", stone ? "Trodden earth inside a fence of stakes, with cattle penned at night." : "The fenced yard in front of the hall, where horses are tied and spears are left at the door.", "s")] },
      { deep: 25, slots: sides },
    ];
    if (rng() < 0.6) rows.push({ deep: 25, slots: [yard("croft", stone ? "the gardens" : "the back yard", stone ? "Plots of peas, flax and poppies behind the houses." : "The yard behind the hall: the midden, the woodpile, the kitchen fire.")] });
    return setOut(rows);
  };
}

const manorFinds: readonly FairFind[] = [
  f("wine-tuns", "Tuns of wine", "barrels", [], "prize", "Great casks of Gascon wine on a low stand, one of them tapped.", "The butler keeps the key. Wine is for the high table; the hall drinks ale.", { tint: "#7a2a3a", verb: "Take a cup", heal: 4, time: 300 }),
  f("flour-sacks", "Sacks of flour", "sacks", ["store"], "common", "Flour from the lord's mill, where every tenant must grind and pay for it.", "The pantry is the bread room. Its keeper cuts the day's trenchers: slices of old bread used as plates.", { weight: 3 }),
  f("ale-casks", "Casks of ale", "barrels", ["store"], "common", "Small casks of ale, brewed in the last fortnight.", "Ale will not keep, so the household brews all year. A gallon a head a day is the usual allowance.", { tint: "#8a6a3a", weight: 3 }),
  f("salt-jar", "Jar of salt", "vase", ["store", "hall"], "common", "A glazed jar of grey salt.", "At table the salt stands in front of the lord. Where you sit from it says what you are.", { tint: "#8a8a80", weight: 2 }),
];

/** A manor: the hall between its two ends. Past the lord's table, his chamber and sometimes a chapel; past the door, the buttery, the pantry and the kitchen. */
function manorPlan(rng: () => number): FairArea[] {
  const cloth = pick(rng, [MADDER, WOAD, WELD]), long = 44 + 4 * Math.floor(rng() * 4), people = ["mh-warrior", "mh-guest", "mh-guest", "mh-servant", "mh-servant", "mh-poet"], servants = ["mh-servant", "mh-servant", "mh-weaver"];
  const upper: Slot[] = [{ kind: "room", wide: 18, deep: 15, id: "chamber", name: "the great chamber", opens: ["hall", "chapel"], palace: { room: "bedchamber", cloth, bays: ["hanging", "bare", "hanging"] }, stands: none, people: servants.slice(1), note: "The lord's own room behind the high table, where the family sleeps, eats on ordinary days and keeps what is worth locking up." }];
  const hall: Room = { kind: "room", wide: long, id: "hall", name: "the hall", palace: { cloth }, stands: { tags: ["hall"], n: 1 }, people, note: "The lord's table across the far end, the household's tables down the sides, a fire in the middle of the floor and the smoke going out through the roof. Courts are held here and rents are paid here." };
  const low: Slot[] = [
    { wide: 15, stack: [
      { kind: "room", wide: 15, deep: 13, id: "buttery", name: "the buttery", opens: ["hall"], palace: { room: "store", bays: ["bare", "shelf"] }, stands: { tags: ["store"], n: 2 }, exhibits: ["wine-tuns"], people: servants.slice(0, 1), note: "Where the drink is kept, in butts: wine for the high table, ale for everyone else. The butler answers for every cup." },
      { kind: "room", wide: 15, deep: 13, id: "pantry", name: "the pantry", opens: ["hall", "kitchen"], palace: { room: "store", bays: ["shelf", "bare"] }, stands: { tags: ["store"], n: 3 }, people: servants.slice(0, 1), note: "Where bread, salt and table linen are kept and given out. Dishes come through here from the kitchen on their way to the hall." },
    ] },
    { kind: "room", wide: 20, deep: 18, hold: "s", id: "kitchen", name: "the kitchen", opens: ["pantry", "yard"], palace: { room: "kitchen", bays: ["bare", "shelf", "bare"] }, stands: none, people: servants, note: "A building of its own, kept away from the hall because kitchens burn down. One pot is always on." },
  ];
  const chapel = rng() < 0.6, flip = rng() < 0.5, main = [...upper, hall, ...low], behind: Slot[] = [chapel ? { kind: "room", wide: 16, id: "chapel", name: "the chapel", opens: ["chamber"], palace: { room: "chapel", cloth, bays: ["bare", "hanging", "bare"] }, stands: none, people: ["mh-guest"], note: "A small chapel off the lord's chamber, with a priest paid to say Mass in it for the family and their dead." } : { gap: 16 }, { gap: long + 37 }];
  return setOut([
    { deep: 30, slots: [{ kind: "yard", wide: 84, id: "yard", name: "the court", gate: "s", stands: none, people: people.slice(0, 4), note: "The yard inside the gate: stables and barns round it, the hall door across it." }] },
    { deep: 26, slots: flip ? main.reverse() : main },
    { deep: 15, slots: flip ? behind.reverse() : behind },
  ]);
}

const romanFinds: readonly FairFind[] = [
  f("strongbox", "The strongbox", "strongbox", [], "prize", "A chest bound in iron and bolted to the floor, in full view of everyone who comes in.", "It is meant to be seen. Callers who come for money in the morning are paid out of it, and they notice how heavy the lid is."),
  f("greek-bronze", "Greek bronze", "statue", ["garden", "state"], "notable", "A bronze athlete, older than the house by four hundred years.", "Taken from a Greek city by a general and sold on. Half the good statues in Rome arrived that way.", { tint: "#6a8a6a", weight: 2 }),
  f("falernian", "Jar of Falernian", "vase", ["dining"], "common", "A sealed jar of wine with the consul's name of its year painted on the shoulder.", "Wine is dated by who was consul when it was made. This one is older than the cook.", { tint: "#9a5a3a", weight: 2 }),
  f("water-jar", "Water jar", "vase", ["state", "garden"], "common", "A big-bellied jar by the wall.", "The roof drains into the pool, the pool into a cistern under the floor, and the house drinks from that.", { tint: "#b88a64", weight: 2 }),
];

/** A Roman town house from the street door inward: the passage, the atrium with bedrooms beside it, the master's room and the dining room behind, then the garden court with the kitchen and the bath off it. */
function domusPlan(rng: () => number): FairArea[] {
  const house = ["rm-client", "rm-client", "rm-slave", "rm-slave", "rm-freedman", "rm-matrona", "rm-guest"], back = ["rm-slave", "rm-slave", "rm-matrona", "rm-tutor"];
  const second = pick(rng, [OCHRE, BLACK_GROUND, EGYPTIAN_BLUE]);
  const bed = (id: string, name: string, off = "atrium"): Room => ({ kind: "room", wide: 15, deep: 14, id, name, opens: [off], palace: { room: "cubiculum", floor: "signinum", bays: ["fresco-alt", "fresco"], field: BLACK_GROUND }, stands: none, people: back.slice(0, 2), note: "A small bedroom off the atrium: a couch, a chest, a lamp. People slept wherever in the house suited the season." });
  const dining: Room = { kind: "room", wide: 28, id: "triclinium", name: "the dining room", opens: ["atrium", "peristyle"], palace: { room: "triclinium", bays: ["garden", "fresco", "garden"], field: second }, stands: { tags: ["dining"], n: 1 }, people: ["rm-slave", "rm-slave", "rm-guest", "rm-cook"], note: "Three couches round a table, three diners to a couch, each leaning on the left elbow. Where you are put says what the host thinks of you." };
  const study: Room = { kind: "room", wide: 24, id: "tablinum", name: "the tablinum", opens: ["atrium", "peristyle"], palace: { room: "tablinum", bays: ["scrolls", "fresco", "scrolls"], field: BLACK_GROUND }, stands: none, exhibits: ["strongbox"], people: ["rm-freedman", "rm-client", "rm-slave"], note: "The master's room at the head of the atrium, open to it, where he keeps his papers and receives callers." };
  const third: Room = rng() < 0.5 ? bed("winter-room", "the winter room", "peristyle") : { ...dining, id: "oecus", name: "the garden room", wide: 24, palace: { room: "triclinium", bays: ["fresco-alt", "garden"], field: second, cloth: pick(rng, [CINNABAR, EGYPTIAN_BLUE]) } };
  return setOut([
    { deep: 14, slots: [{ kind: "room", wide: 15, id: "vestibule", name: "the entrance passage", gate: "s", palace: { room: "vestibule", floor: "signinum", bays: ["fresco"] }, stands: none, people: ["rm-client", "rm-client", "rm-slave"], note: "The passage from the street door, where the doorkeeper sits and callers wait before sunrise to be let in." }] },
    { deep: 25, slots: [bed("bedroom", "a bedroom"), { kind: "room", wide: 45, id: "atrium", name: "the atrium", palace: { bays: ["fresco", "niche", "fresco-alt", "fresco"], field: second }, stands: { tags: ["state"], n: 2 }, people: house, note: "The hall inside the street door, open to the sky in the middle, with a pool under the opening to catch the rain. Every morning it fills with people who depend on the master and have come to say so." }, bed("porter", "the steward's room")] },
    { deep: 22, slots: [dining, study, third] },
    { deep: 30, slots: [
      { kind: "room", wide: 16, deep: 15, id: "kitchen", name: "the kitchen", opens: ["peristyle"], palace: { room: "kitchen", floor: "signinum", cloth: UNDYED, bays: ["fresco", "niche"] }, stands: none, people: ["rm-cook", "rm-slave"], note: "A small, smoky room at the back with a raised hearth of masonry. The cook is a slave, and a good one costs more than a horse." },
      { kind: "room", wide: 56 + 4 * Math.floor(rng() * 5), id: "peristyle", name: "the garden court", palace: { room: "peristyle", floor: "signinum", bays: ["garden", "fresco", "fresco-alt"], field: second }, stands: { tags: ["garden"], n: 2 }, people: back, note: "A garden inside the house with a covered walk round it on columns: the family's part of the house, where callers are not brought." },
      { kind: "room", wide: 16, deep: 15, id: "bath", name: "the bath", opens: ["peristyle"], palace: { room: "bath", floor: "mosaic", bays: ["fresco-alt", "fresco"], field: EGYPTIAN_BLUE }, stands: none, people: ["rm-slave"], note: "A private bath, which only a rich house has: a warm room and a plunge, heated from the kitchen fire next door. Everyone else goes to the public baths." },
    ] },
  ]);
}

const courtFinds: readonly FairFind[] = [
  f("pb-marble", "Antique marble", "statue", ["state", "garden"], "common", "A Roman statue on a pedestal of coloured marble.", "Bought in Rome, or dug up there, and shipped north by the crate.", { weight: 3, basis: "inferred" }),
  f("pb-vase", "Porcelain vase", "vase", ["state"], "common", "A Chinese vase taller than a child, in gilt bronze mounts made for it here.", "It crossed two oceans in a ship's hold packed in tea.", { tint: "#3a5a9a", weight: 2, basis: "inferred" }),
  f("pb-tapestry", "Tapestry", "tapestry", ["state"], "notable", "A tapestry of a hunt, with the owner's arms woven into the border.", "A set like this costs more than the room it hangs in.", { tint: "#6a7a4a", weight: 2, basis: "inferred" }),
  f("pb-portrait", "State portrait", "painting", ["state"], "notable", "The master of the house in armour he has never worn, one hand on a baton.", "Copies of it hang in every house that wants to be thought loyal.", { tint: "#3a4a6a", w: 2, basis: "inferred" }),
  f("pb-harpsichord", "Harpsichord", "piano", [], "notable", "A harpsichord painted inside the lid with a landscape.", "There is music most evenings. Being asked to it is the point.", { verb: "Listen", time: 300, basis: "inferred" }),
  f("pb-oranges", "Orange trees in tubs", "pyramid", ["garden"], "common", "Orange trees in square tubs, wheeled out for the summer.", "They spend the winter in a heated house of their own.", { tint: "#e8963a", weight: 3, basis: "inferred" }),
];

/** A palace of the Baroque: a court of honour, the working rooms across the front, and behind them two apartments either
 * side of a great room, each a row of rooms that grow smaller and more private: antechamber, bedchamber, closet. */
function enfiladePlan(rng: () => number): FairArea[] {
  const court = ["vrs-courtier", "vrs-courtier", "vrs-lady", "vrs-lady", "vrs-visitor", "vrs-petitioner", "vrs-footman", "vrs-officer"], close = ["vrs-valet", "vrs-footman", "vrs-lady"];
  const [his, hers] = rng() < 0.5 ? [CRIMSON, pick(rng, [ROYAL_BLUE, SAGE])] : [pick(rng, [ROYAL_BLUE, OLD_GOLD]), CRIMSON], great = pick(rng, ["gallery", "ballroom"] as const);
  const room = (id: string, name: string, wide: number, opens: string[], palace: Partial<PalaceStyle>, note: string, more: Partial<Room> = {}): Room => ({ kind: "room", wide, id, name, opens, palace, stands: none, people: close, note, ...more });
  const front: Slot[] = [
    room("kitchen", "the kitchens", 22, ["forecourt"], { ...service, room: "kitchen", bays: ["hearth", "panel", "panel"] }, "The kitchens, in a wing of their own across the court from anything that matters. Dinner crosses the open air and arrives lukewarm.", { people: ["vrs-cook", "vrs-footman", "vrs-footman"] }),
    room("chapel", "the chapel", 20, ["vestibule"], { room: "chapel", floor: "marble", cloth: his, bays: ["hanging", "panel"] }, "Mass is said here every morning, and the household is expected at it.", { people: ["vrs-abbe", "vrs-lady", "vrs-courtier"] }),
    room("vestibule", "the vestibule", 26, ["forecourt", "salon", "guard-room", "chapel"], { room: "vestibule", floor: "marble", bays: ["panel", "mirror", "panel"] }, "The entrance hall, in stone, cold on purpose. Anyone decently dressed may come this far.", { people: court, stands: { tags: ["state"], n: 1 } }),
    room("guard-room", "the guard room", 20, ["vestibule", "antechamber"], { room: "guard", floor: "marble", bays: ["panel"] }, "The guard sits here day and night. Past this door you need a reason.", { people: ["vrs-guard", "vrs-guard", "vrs-officer"] }),
    room("office", "the steward's office", 22, ["forecourt"], { room: "office", floor: "herringbone", bays: ["bookcase", "panel", "window"] }, "Where the house is run from: wages, tradesmen, and who has been promised which rooms.", { people: ["vrs-secretary", "vrs-petitioner"] }),
  ];
  const state: Slot[] = [
    room("bath", "the bathing closet", 14, ["bedchamber-2"], { room: "bath", floor: "marble", cloth: hers, field: BLUSH, bays: ["panel", "mirror", "panel"] }, "A copper bath, filled and emptied by hand, and a close stool behind a screen. Most of the house makes do with a basin.", { deep: 13, people: [] }),
    room("bedchamber-2", "the second bedchamber", 18, ["antechamber-2", "bath"], { room: "bedchamber", cloth: hers, bays: ["hanging", "panel", "hanging"] }, "The bedchamber of the second apartment, kept for the mistress of the house or for a guest too grand to refuse.", { deep: 16 }),
    room("antechamber-2", "the second antechamber", 20, ["salon", "bedchamber-2"], { room: "antechamber", cloth: hers, bays: ["hanging", "mirror", "hanging"] }, "The waiting room of the second apartment. Callers sit here until they are sent for."),
    room("salon", great === "gallery" ? "the gallery" : "the great room", 32, ["vestibule", "antechamber", "antechamber-2", "parterre"], { room: great, bays: great === "gallery" ? ["mirror", "window"] : ["hanging", "mirror", "window"] }, "The great room in the middle of the garden front, with an apartment opening off either end. Balls, audiences and bad news all happen here.", { people: court, stands: { tags: ["state"], n: 3 }, exhibits: ["pb-harpsichord"] }),
    room("antechamber", "the antechamber", 20, ["guard-room", "salon", "bedchamber"], { room: "antechamber", cloth: his, bays: ["hanging", "mirror", "hanging"] }, "The room outside the bedchamber, where people wait to be let in. How long you are kept here is the message.", { people: court.slice(0, 5), stands: { tags: ["state"], n: 1 } }),
    room("bedchamber", "the state bedchamber", 18, ["antechamber", "cabinet"], { room: "bedchamber", cloth: his, bays: ["hanging", "panel", "hanging"] }, "The master rises and goes to bed here in front of whoever has the right to watch. Business is done at the bedside.", { deep: 16 }),
    room("cabinet", "the cabinet", 14, ["bedchamber"], { room: "closet", floor: "herringbone", cloth: his, bays: ["bookcase", "panel", "mirror"] }, "The last and smallest room, where the master is alone or with one other person. To be asked in here is to have arrived.", { deep: 13, people: ["vrs-secretary"] }),
  ];
  const flip = rng() < 0.5;
  return setOut([
    { deep: 28, slots: [{ kind: "garden", wide: 84, id: "forecourt", name: "the court of honour", gate: "s", stands: { tags: ["garden"], n: 2 }, people: [...court, "vrs-guard"], note: "The court inside the gates, where carriages set down in order of rank." }] },
    { deep: 18, slots: flip ? front.reverse() : front },
    { deep: 22, slots: flip ? state.reverse() : state },
    { deep: 28, slots: [{ kind: "garden", wide: 84, id: "parterre", name: "the parterre", fountain: "basin", stands: { tags: ["garden"], n: 3 }, people: [...court, "vrs-gardener"], note: "Clipped box and gravel under the windows of the great room, laid out to be looked down on." }] },
  ]);
}

const houseFinds: readonly FairFind[] = [
  f("ps-marble", "Marble group", "statue", ["state", "garden"], "common", "A marble group bought in Rome on somebody's wedding journey.", "It took the sculptor and his workshop several years.", { weight: 3, basis: "inferred" }),
  f("ps-vase", "Porcelain vase", "vase", ["state"], "common", "A vase of dark blue porcelain with gilt handles.", "One of a pair. The other was broken by a housemaid who is still spoken of.", { tint: "#2c3e8a", weight: 2, basis: "inferred" }),
  f("ps-portrait", "Family portrait", "painting", ["state"], "notable", "The family in the park, painted larger than life and very calm.", "The dog was added afterwards, at extra cost.", { tint: "#4a5a4a", w: 2, basis: "inferred" }),
  f("ps-piano", "Grand piano", "piano", [], "notable", "A grand piano with its lid up.", "Daughters of the house are expected to play it after dinner.", { verb: "Listen", time: 300, basis: "inferred" }),
];

/** A great house of the nineteenth century: every room off a corridor, so that nobody need walk through one room to reach another; servants at one end, a bathroom with the bedroom. */
function corridorPlan(rng: () => number): FairArea[] {
  const guests = ["bp-guest", "bp-guest", "bp-lady", "bp-lady", "bp-equerry", "bp-footman", "bp-page"], staff = ["bp-footman", "bp-housemaid", "bp-page"];
  const [a, b] = rng() < 0.5 ? [SAGE, CRIMSON] : [ROYAL_BLUE, OLD_GOLD];
  const room = (id: string, name: string, wide: number, opens: string[], palace: Partial<PalaceStyle>, note: string, more: Partial<Room> = {}): Room => ({ kind: "room", wide, id, name, opens, palace, stands: none, people: staff, note, ...more });
  const rooms: Slot[] = [
    room("bathroom", "the bathroom", 14, ["bedroom"], { room: "bath", floor: "marble", field: BLUSH, bays: ["panel", "window"] }, "A room for nothing but washing, with a fixed bath and hot water carried up in cans. A new idea, and thought rather French.", { deep: 13, people: [] }),
    room("bedroom", "the principal bedroom", 18, ["corridor", "bathroom"], { room: "bedchamber", cloth: a, bays: ["panel", "window", "panel"] }, "A bedroom that is only a bedroom. Nobody is received in it, and nobody passes through.", { people: staff.slice(1) }),
    room("drawing-room", "the drawing room", 24, ["corridor", "garden"], { room: "drawing", cloth: a }, "Where the ladies withdraw after dinner and the gentlemen join them, later and louder.", { people: guests, stands: { tags: ["state"], n: 2 }, exhibits: ["ps-piano"] }),
    room("dining-room", "the dining room", 24, ["corridor"], { room: "dining", cloth: b, bays: ["hanging", "hearth", "hanging"] }, "Dinner is at eight, in order of precedence, and lasts two hours.", { people: guests, stands: { tags: ["state"], n: 1 } }),
    room("library", "the library", 18, ["corridor"], { room: "library", floor: "herringbone", cloth: b, bays: ["bookcase", "bookcase", "hearth"] }, "The gentlemen's room. Some of the books have been read.", { people: guests.slice(0, 3) }),
  ];
  const front: Slot[] = [
    room("kitchen", "the kitchen", 24, ["corridor"], { ...service, room: "kitchen", bays: ["hearth", "panel", "window"] }, "A cast-iron range, a scrubbed table and a cook who is not to be spoken to before luncheon.", { people: staff }),
    room("hall", "the entrance hall", 26, ["forecourt", "corridor"], { room: "vestibule", floor: "marble", bays: ["panel", "mirror", "panel"] }, "The front hall, where callers leave their cards and are told whether anyone is at home.", { people: guests, stands: { tags: ["state"], n: 1 } }),
    room("office", "the study", 22, ["corridor"], { room: "office", floor: "herringbone", cloth: b, bays: ["bookcase", "panel", "window"] }, "Where the estate's letters are answered and its bills are not.", { people: staff.slice(0, 1) }),
  ];
  const flip = rng() < 0.5;
  return setOut([
    { deep: 26, slots: [{ kind: "garden", wide: 84, id: "forecourt", name: "the carriage sweep", gate: "s", stands: none, people: guests.slice(0, 4), note: "Gravel raked every morning, and a porch deep enough to keep a carriage dry." }] },
    { deep: 18, slots: flip ? front.reverse() : front },
    { deep: 13, slots: [room("corridor", "the corridor", 84, ["hall", "kitchen", "office", "bedroom", "drawing-room", "dining-room", "library"], { room: "gallery", cloth: b, bays: ["panel", "hanging", "panel"] }, "A passage the length of the house with a door to every room. Servants can now cross the house without crossing the family.", { people: staff, stands: { tags: ["state"], n: 2 } })] },
    { deep: 20, slots: flip ? rooms.reverse() : rooms },
    { deep: 26, slots: [{ kind: "garden", wide: 84, id: "garden", name: "the garden front", fountain: "basin", stands: { tags: ["garden"], n: 2 }, people: [...guests.slice(0, 4), "bp-housemaid"], note: "A terrace, a lawn and a basin, laid out to be seen from the drawing room windows." }] },
  ]);
}


type Court = {
  people: string[]; guard: string; servant: string; scribe: string; pool: boolean; finds: readonly FairFind[];
  /** Wall bays for its plain rooms and its fine ones, and the floor of its working rooms, where they are not the pillared hall's own. */
  plain?: PalaceBay[]; rich?: PalaceBay[]; rough?: PalaceStyle["floor"];
  /** Each room's name and what is told of it. */
  rooms: Record<"court" | "porch" | "guard" | "stores" | "hall" | "magazine" | "kitchen" | "chamber" | "bath" | "shrine", readonly [string, string]>;
};

/** A palace on one line from the gate: a court, a porch, the hall of columns with the throne at its far end, and behind the throne
 * the rooms the ruler lives in. Stores, the guard and the kitchen open off the sides. */
function axisPlan(c: Court) {
  return (rng: () => number): FairArea[] => {
    const long = 48 + 6 * Math.floor(rng() * 3), flip = rng() < 0.5, second = pick(rng, [EGYPTIAN_BLUE, CINNABAR, MALACHITE]);
    const plain = c.plain ?? ["bare", "bands"], rich = c.rich ?? ["relief", "beast"], rough = c.rough ?? "flags";
    const room = (id: keyof Court["rooms"], wide: number, opens: string[] | undefined, palace: Partial<PalaceStyle>, more: Partial<Room> = {}): Room => ({ kind: "room", wide, id, name: c.rooms[id][0], note: c.rooms[id][1], opens, palace, stands: none, people: [c.servant, c.servant, c.scribe], ...more });
    const row = (slots: Slot[]) => (flip ? slots.reverse() : slots);
    return setOut([
      { deep: 28, slots: [{ kind: "garden", wide: 84, id: "court", name: c.rooms.court[0], note: c.rooms.court[1], gate: "s", fountain: c.pool ? "basin" : undefined, stands: { tags: ["garden"], n: 2 }, people: [...c.people, c.guard] }] },
      { deep: 16, slots: row([
        room("guard", 18, ["porch"], { room: "guard", bays: plain }, { people: [c.guard, c.guard] }),
        room("porch", 30, ["court", "hall", "guard", "stores"], { room: "vestibule", bays: rich }, { people: c.people }),
        room("stores", 18, ["porch"], { room: "store", bays: ["bare"], floor: rough }, { stands: { tags: ["store"], n: 4 }, people: [c.scribe, c.servant] }),
      ]) },
      { deep: 26, slots: row([
        room("magazine", 20, ["hall"], { room: "store", bays: ["bare"], floor: rough }, { deep: 16, stands: { tags: ["store"], n: 4 }, people: [c.scribe, c.servant] }),
        room("hall", long, undefined, {}, { people: c.people, stands: { tags: ["hall"], n: 2 } }),
        room("kitchen", 18, ["hall"], { room: "kitchen", bays: ["bare"], floor: rough }, { deep: 16, people: [c.servant, c.servant] }),
      ]) },
      { deep: 16, slots: row([
        room("bath", 14, ["chamber"], { room: "bath", bays: [...plain].reverse(), field: second }, { deep: 13, people: [c.servant] }),
        room("chamber", 20, ["hall", "bath"], { room: "bedchamber", bays: [plain[1], rich[1], plain[1]], field: second }, { people: [c.servant] }),
        room("shrine", 16, ["hall"], { room: "chapel", bays: [rich[0], "bare", rich[0]] }, { people: [c.scribe] }),
      ]) },
    ]);
  };
}

const egypt: Court = {
  people: ["eg-official", "eg-official", "eg-scribe", "eg-servant", "eg-servant", "eg-guard"], guard: "eg-guard", servant: "eg-servant", scribe: "eg-scribe", pool: true,
  finds: [
    f("eg-wine", "Wine jars", "vase", ["store"], "common", "Tall jars with pointed feet, leaning in a rack, each labelled in ink on the shoulder.", "The label gives the year of the reign, the vineyard and the name of the man who made it.", { tint: "#b08a5a", weight: 3, basis: "documented" }),
    f("eg-grain", "Sacks of emmer", "sacks", ["store"], "common", "Sacks of wheat, sealed with a lump of mud stamped with the house's seal.", "Wages are paid in bread and beer, so the palace's wealth is counted in grain.", { weight: 3, basis: "documented" }),
    f("eg-linen", "Chests of linen", "bales", ["store"], "common", "Folded linen, some of it so fine you can see your hand through it.", "The best cloth is woven in the king's own workshops and given out as a mark of favour.", { tint: "#ece4d0", weight: 2, basis: "documented" }),
    f("eg-statue", "Statue of the king", "statue", ["hall", "garden"], "notable", "The king striding forward, twice life size, in painted stone.", "It stands in for him when he is elsewhere. People bow to it.", { weight: 2, basis: "inferred" }),
  ],
  rooms: {
    court: ["the garden court", "A walled court with a pool in the middle and trees round it. Everyone who has business with the king waits here first."],
    porch: ["the columned porch", "The first roofed room, where officials sort those who will go further from those who will not."],
    guard: ["the guard room", "The palace guard, many of them foreigners, who answer to the king and to nobody local."],
    stores: ["the storerooms", "Long rooms of jars, sacks and chests. The palace is a warehouse with a throne in it."],
    hall: ["the hall of columns", "A forest of painted columns holding up a roof higher than any house, dim, cool, and built so that the far end is the last thing you see."],
    magazine: ["the wine store", "Wine and oil in sealed jars, each with its year written on it."],
    kitchen: ["the kitchen", "Bread ovens and beer vats. Bread and beer are what the household is paid in."],
    chamber: ["the king's bedchamber", "The private room behind the throne: a bed on a raised alcove, chests, and painted walls nobody else sees."],
    bath: ["the bath room", "A stone slab with a drain and a screen wall. A servant pours the water over you from a jar."],
    shrine: ["the shrine", "A small room with an offering table, where the day begins with food set before a god."],
  },
};
const persia: Court = {
  people: ["pe-envoy", "pe-envoy", "pe-usher", "pe-servant", "pe-guard", "pe-guard"], guard: "pe-guard", servant: "pe-servant", scribe: "pe-usher", pool: true,
  finds: [
    f("pe-silver", "Silver vessels", "vitrine", ["store"], "common", "Bowls and jugs of silver, stacked by weight.", "Tribute is melted down and stored as metal. It is cut up and weighed out when something must be paid for.", { weight: 2, basis: "documented" }),
    f("pe-cloth", "Bolts of purple cloth", "bales", ["store"], "common", "Cloth dyed purple with sea snails, folded in bolts.", "Some of it has been in store for two hundred years and has not faded.", { tint: "#784482", weight: 2, basis: "documented" }),
    f("pe-jars", "Jars of wine", "vase", ["store"], "common", "Sealed jars of wine from the king's estates.", "Every jar issued is recorded on a clay tablet, with who drew it and by whose order.", { tint: "#9a7a5a", weight: 3, basis: "documented" }),
    f("pe-statue", "Statue from Egypt", "statue", ["hall", "garden"], "notable", "A statue of the king carved in Egypt, in Egyptian dress, with his name on it in four scripts.", "He rules Egypt too, and wants it known here.", { weight: 2, basis: "documented" }),
  ],
  rooms: {
    court: ["the garden court", "A walled garden with water channels and trees in rows. The Persian word for it is the root of 'paradise'."],
    porch: ["the gate hall", "The Gate of All Nations: everyone the king rules comes in through one door."],
    guard: ["the guard room", "Spearmen of the royal guard, who stand in file along every wall you will pass."],
    stores: ["the treasury", "Tribute, stored as weighed metal and folded cloth, and counted more often than it is looked at."],
    hall: ["the audience hall", "Columns twenty times the height of a man, each carrying two bulls, and at the far end the king on his throne with his feet on a stool."],
    magazine: ["the wine store", "Wine and grain issued by tablet to everyone the palace feeds."],
    kitchen: ["the kitchen", "The king's kitchen feeds his guard and his court as well as his table. What he does not eat is their pay."],
    chamber: ["the king's chamber", "The private rooms behind the hall, where a few people are allowed and fewer are comfortable."],
    bath: ["the bath room", "A room with a drain in the floor, a great jar and a clay bath."],
    shrine: ["the fire room", "A fire is kept burning here on a stand and is never let go out while the king lives."],
  },
};
const aegean: Court = {
  people: ["ae-scribe", "ae-servant", "ae-servant", "ae-guard", "ae-guard", "ae-priestess"], guard: "ae-guard", servant: "ae-servant", scribe: "ae-scribe", pool: false,
  finds: [
    f("ae-pithoi", "Oil jars", "vase", ["store"], "common", "Jars taller than a man, with rope patterns moulded round them.", "Each holds enough oil to light a house for years. There are hundreds.", { tint: "#b0825a", weight: 4, basis: "documented" }),
    f("ae-wool", "Bales of wool", "bales", ["store"], "common", "Wool from the palace's flocks, weighed and baled.", "The palace counts close to a hundred thousand sheep and knows each shepherd by name.", { tint: "#e0d8c4", weight: 2, basis: "documented" }),
    f("ae-ingots", "Copper ingots", "ingots", ["store"], "common", "Slabs of copper cast in the shape of a stretched ox hide, so two men can carry one.", "It comes by ship from Cyprus. Without it there is no bronze and no army.", { weight: 2, basis: "documented" }),
    f("ae-tablets", "Baskets of tablets", "counter", ["hall"], "notable", "Flat baskets of clay tablets, each scratched with a few lines.", "This year's accounts. They were never meant to last, and only a fire will bake them hard enough to.", { basis: "documented" }),
  ],
  rooms: {
    court: ["the court", "A paved court inside the gate, with the porch of the great hall on its far side."],
    porch: ["the porch", "Two columns and a deep porch. A guard stands at the door behind them."],
    guard: ["the guard room", "The king's followers, with their spears against the wall and their helmets on a shelf."],
    stores: ["the archive", "Where the tablet writers work, by the door, so that nothing comes in or goes out uncounted."],
    hall: ["the great hall", "One square room: a round hearth in the middle as wide as a cart, four columns round it, an opening in the roof above, and the throne against the right-hand wall."],
    magazine: ["the oil store", "Rows of great jars sunk in benches of clay. Oil is what this palace is rich in."],
    kitchen: ["the pantry", "Thousands of plain cups, stacked by size, for the days when the whole district is fed."],
    chamber: ["the queen's hall", "A smaller hall with its own hearth, painted with griffins and lions."],
    bath: ["the bath room", "A clay bath set in a plastered bench, with two big jars for water and a step to climb in by."],
    shrine: ["the shrine", "A small room with an offering table and a few clay figures with their arms raised."],
  },
};

const chinaFinds: readonly FairFind[] = [
  f("cn-vase", "Blue and white vase", "vase", ["hall", "state"], "common", "A porcelain vase as tall as a child, painted in blue with dragons among clouds.", "Made at the imperial kilns far to the south, where anything less than perfect is smashed and buried.", { tint: "#3a5a9a", weight: 3, basis: "documented" }),
  f("cn-silk", "Bolts of silk", "bales", ["store"], "common", "Silk in bolts, each tagged with the workshop that wove it.", "The court's silk comes from three imperial workshops in the south and travels north by canal.", { tint: "#d8b040", weight: 3, basis: "documented" }),
  f("cn-tea", "Chests of tea", "sacks", ["store"], "common", "Tribute tea, packed in chests lined with lead.", "The first picking of each spring belongs to the palace.", { weight: 2, basis: "documented" }),
  f("cn-rice", "Sacks of rice", "sacks", ["store"], "common", "Rice brought a thousand miles up the Grand Canal.", "The capital cannot feed itself. Four million sacks come north every year.", { weight: 3, basis: "documented" }),
  f("cn-clock", "Chiming clock", "vitrine", ["hall"], "notable", "A gilt clock from Europe, with a little figure that writes with a brush when it strikes.", "The emperors collect them. There is a workshop in the palace that does nothing but keep them going.", { basis: "documented" }),
];

/** A Chinese palace: courts one behind another on a line from the south gate, a hall across the head of each, lesser halls down the sides. The outer court is for business; the inner is where the household lives. */
function courtAxisPlan(rng: () => number): FairArea[] {
  const court = ["cn-official", "cn-official", "cn-eunuch", "cn-eunuch", "cn-guard"], inner = ["cn-eunuch", "cn-maid", "cn-maid"], flip = rng() < 0.5, silk = pick(rng, [IMPERIAL_YELLOW, CRIMSON, ROYAL_BLUE]);
  const room = (id: string, name: string, wide: number, opens: string[] | undefined, palace: Partial<PalaceStyle>, note: string, more: Partial<Room> = {}): Room => ({ kind: "room", wide, id, name, opens, palace, stands: none, people: inner, note, ...more });
  const row = (slots: Slot[]) => (flip ? slots.reverse() : slots);
  return setOut([
    { deep: 26, slots: row([
      room("waiting-hall", "the waiting hall", 18, ["outer-court"], { room: "antechamber", bays: ["lattice", "scroll"] }, "A side hall where officials wait before dawn to be called, and are given tea if they are of sufficient rank.", { people: court }),
      { kind: "garden", wide: 48, id: "outer-court", name: "the outer court", gate: "s", stands: { tags: ["state"], n: 2 }, people: court, note: "A paved court inside the south gate, big enough for the whole court to stand in rows by rank." },
      room("storehouse", "the storehouse", 18, ["outer-court"], { room: "store", bays: ["bare"] }, "Silk, tea and grain, received in tribute and given out as salaries and presents.", { stands: { tags: ["store"], n: 5 }, people: ["cn-eunuch", "cn-official"] }),
    ]) },
    { deep: 24, slots: row([
      room("guard", "the guard room", 16, ["hall"], { room: "guard", bays: ["bare", "lattice"] }, "The guard, who match tallies at every gate and count who went in against who came out.", { deep: 14, people: ["cn-guard", "cn-guard"] }),
      room("hall", "the audience hall", 44 + 6 * Math.floor(rng() * 3), undefined, { cloth: IMPERIAL_YELLOW }, "The throne faces south, as the ruler always does. Those who come before it kneel three times and touch the floor with their foreheads nine times.", { people: court, stands: { tags: ["hall"], n: 2 } }),
      room("study", "the study", 18, ["hall"], { room: "office", bays: ["scroll", "screen", "scroll"], cloth: silk }, "Where memorials from the provinces are read and answered in red ink, which only one person may use.", { deep: 14, people: ["cn-eunuch"] }),
    ]) },
    { deep: 26, slots: row([
      room("kitchen", "the kitchen", 18, ["inner-court"], { room: "kitchen", bays: ["bare"] }, "The palace kitchen cooks a hundred dishes for each meal. Most are for show and are sent on to people it is useful to honour.", { people: ["cn-eunuch", "cn-eunuch"] }),
      { kind: "garden", wide: 48, id: "inner-court", name: "the inner court", fountain: "basin", stands: { tags: ["garden"], n: 2 }, people: inner, note: "The court behind the great hall, with a pool, old cypresses and strange rocks. No man from outside comes this far." },
      room("tea-room", "the side hall", 18, ["inner-court"], { room: "drawing", bays: ["screen", "lattice", "scroll"], cloth: silk }, "A side hall for sitting in: tea, chess, and the long afternoons of people who may not leave.", { people: inner }),
    ]) },
    { deep: 18, slots: row([
      room("bath", "the bath room", 14, ["bedchamber"], { room: "bath", bays: ["lattice", "bare"] }, "A wooden tub filled from kettles, and a screen to keep the draught off.", { deep: 13, people: ["cn-maid"] }),
      room("bedchamber", "the bedchamber", 24, ["inner-court", "bath"], { room: "bedchamber", bays: ["lattice", "screen", "lattice"], cloth: silk }, "The rear hall, where the household sleeps: a bed built like a small room, with curtains and its own lattice.", { people: ["cn-maid", "cn-eunuch"] }),
      room("shrine", "the ancestral hall", 16, ["inner-court"], { room: "chapel", bays: ["scroll", "bare", "scroll"] }, "Tablets with the names of the dead of the family, who are given food and told the news.", { people: ["cn-eunuch"] }),
    ]) },
  ]);
}

const japanFinds: readonly FairFind[] = [
  f("jp-rice", "Bales of rice", "bales", ["store"], "common", "Rice in straw bales, stacked to the rafters.", "A lord's worth is counted in rice, and so is every man's pay under him.", { tint: "#d8c890", weight: 3, basis: "documented" }),
  f("jp-sake", "Casks of sake", "barrels", ["store"], "common", "Cedar casks of sake bound in rope, with the brewer's name painted on.", "Sent as a gift. Most things that arrive here are gifts, and all of them are written down.", { tint: "#c8a878", verb: "Take a cup", heal: 2, time: 300, weight: 2, basis: "documented" }),
  f("jp-armour", "Suit of armour", "statue", ["hall"], "notable", "A suit of armour on a stand, laced in dark blue silk, with a crest on the helmet.", "Nobody has worn it in war for three generations. It is aired once a year.", { tint: "#3a4a6a", basis: "inferred" }),
  f("jp-lacquer", "Lacquer boxes", "vitrine", ["store", "hall"], "common", "Nested boxes of black lacquer with gold dust sprinkled into the pattern.", "Thirty coats, each dried in a damp cupboard for days before the next.", { weight: 2, basis: "documented" }),
];

/** A Japanese lord's palace about 1600: rooms set corner to corner, each further back and further in. Guests wait at the front, are received in the great room,
 * and only the household passes beyond it. The rooms give onto a garden made to be looked at from where the lord sits. */
function shoinPlan(rng: () => number): FairArea[] {
  const house = ["jp-retainer", "jp-retainer", "jp-page", "jp-lord"], inner = ["jp-page", "jp-lady", "jp-lady"], flip = rng() < 0.5, colour = pick(rng, [INDIGO, MADDER, SAGE]);
  const room = (id: string, name: string, wide: number, opens: string[] | undefined, palace: Partial<PalaceStyle>, note: string, more: Partial<Room> = {}): Room => ({ kind: "room", wide, id, name, opens, palace, stands: none, people: inner, note, ...more });
  const row = (slots: Slot[]) => (flip ? slots.reverse() : slots);
  return setOut([
    { deep: 24, slots: [{ kind: "garden", wide: 84, id: "forecourt", name: "the forecourt", gate: "s", stands: none, people: house, note: "Raked gravel inside the gate, where visitors get down from their palanquins and leave most of their attendants." }] },
    { deep: 16, slots: row([
      { gap: 36 },
      room("waiting-room", "the retainers' room", 28, ["forecourt", "great-room", "kitchen"], { room: "antechamber", bays: ["screen", "lattice"] }, "The first room, painted with tigers to remind visitors where they are. Guests wait here, and the lord's own men sit along the walls watching them.", { people: house }),
      room("kitchen", "the kitchen", 20, ["waiting-room"], { room: "kitchen", floor: "earth", bays: ["bare", "lattice"] }, "An earth floor, clay stoves and a roof open to let the smoke out. Each guest's tray is carried in separately.", { people: ["jp-page", "jp-page"] }),
    ]) },
    { deep: 20, slots: row([
      { gap: 18 },
      room("great-room", "the great room", 40, ["waiting-room", "guard", "inner-room", "garden"], {}, "The lord sits at the far end on a floor one step higher than everyone else's, with a gold screen behind him. Guests kneel below in rows fixed by rank.", { people: house, stands: { tags: ["hall"], n: 1 } }),
      room("guard", "the guard room", 16, ["great-room"], { room: "guard", bays: ["bare", "lattice"] }, "Behind a sliding door with tassels on it, a few armed men who can be in the great room in two steps.", { deep: 14, people: ["jp-retainer", "jp-retainer"] }),
      { gap: 10 },
    ]) },
    { deep: 30, slots: row([
      { gap: 2 },
      { wide: 28, stack: [
        room("private-room", "the lord's room", 28, ["inner-room", "bath", "garden"], { room: "bedchamber", bays: ["scroll", "lattice", "screen"], cloth: colour }, "The innermost room, small and plain, painted with ink landscapes where the outer rooms have gold. He sleeps, reads and is himself here.", { deep: 15 }),
        room("inner-room", "the inner room", 28, ["great-room", "private-room", "garden"], { room: "drawing", bays: ["screen", "scroll", "lattice"], cloth: colour }, "For relatives and old allies only. Smaller than the great room, quieter, and nobody sits by rank.", { deep: 15 }),
      ] },
      { kind: "garden", wide: 50, id: "garden", name: "the garden", fountain: "basin", stands: none, people: inner, note: "A pond, rocks brought from every province as presents, and pines trained for a century. It is made to be seen sitting down, from indoors." },
      { gap: 4 },
    ]) },
    { deep: 13, slots: row([{ gap: 2 }, room("bath", "the bath house", 14, ["private-room"], { room: "bath", bays: ["lattice", "bare"] }, "A steam room and a wooden tub. You wash first and get in afterwards.", { people: ["jp-page"] }), { gap: 68 }]) },
  ]);
}

const mexica: Court = {
  people: ["az-steward", "az-painter", "az-servant", "az-servant", "az-guard", "az-guard"], guard: "az-guard", servant: "az-servant", scribe: "az-painter", pool: true,
  finds: [
    f("az-cacao", "Sacks of cacao", "sacks", ["store"], "common", "Sacks of cacao beans, counted out in lots of eight thousand.", "They are money as well as drink: a turkey is a hundred beans, a cloak sixty-five or more.", { tint: "#7a4a30", weight: 3, basis: "documented" }),
    f("az-mantles", "Loads of cloaks", "bales", ["store"], "common", "Cotton cloaks in bundles of twenty, each province's pattern its own.", "Cloth is how tribute is counted. The palace receives more than a hundred thousand cloaks a year.", { tint: "#e8dcc0", weight: 3, basis: "documented" }),
    f("az-maize", "Bins of maize", "sacks", ["store"], "common", "Dried maize in great bins of wickerwork plastered with clay.", "In a famine year the ruler opens these to the city.", { tint: "#e0c060", weight: 2, basis: "documented" }),
    f("az-feathers", "Feather work", "vitrine", ["hall"], "notable", "A shield and a headdress made of thousands of feathers tied on one by one: green, blue and red.", "The green ones are quetzal tail feathers, carried on foot from forests forty days south.", { basis: "documented" }),
  ],
  rooms: {
    court: ["the great court", "A paved court with a pool and flowering trees, where the lords of the city gather each morning and wait to be told what is wanted."],
    porch: ["the lords' hall", "A long room open to the court between piers, where nobles and judges sit by rank and cases are heard."],
    guard: ["the warriors' house", "The room of the seasoned warriors who guard the palace, with their shields and weapons on the wall."],
    stores: ["the tribute house", "Where the provinces' tribute is counted in and written down: cloaks, cacao, feathers, gold."],
    hall: ["the hall of the speaker", "The ruler's title means 'he who speaks'. He sits here on a reed seat with a back, on a jaguar skin, and people address him through an officer."],
    magazine: ["the granary", "Maize, beans and chia in bins, enough to feed the palace and, in a bad year, the city."],
    kitchen: ["the kitchens", "Women grind maize here from before dawn. Hundreds of dishes go out at each meal on small braziers."],
    chamber: ["the ruler's rooms", "The private rooms behind the hall: mats, low seats, cotton hangings, and a bed of cloaks."],
    bath: ["the sweat bath", "A low domed room heated from a fire wall. You go in on your knees, throw water on the hot stones and are switched with leaves."],
    shrine: ["the shrine", "A room for the household's gods, with incense burning in a brazier and offerings of flowers and paper."],
  },
};
const inca: Court = {
  people: ["in-quipu", "in-servant", "in-servant", "in-aclla", "in-guard", "in-guard"], guard: "in-guard", servant: "in-servant", scribe: "in-quipu", pool: true,
  plain: ["bare", "niche"], rich: ["niche", "hanging"], rough: "earth",
  finds: [
    f("in-chicha", "Jars of maize beer", "vase", [], "prize", "Tall jars with pointed bases, set in hollows in the floor, brimming with maize beer.", "Nobody is asked to work for the Inca without being given drink first. The beer is the bargain.", { tint: "#b08a5a", verb: "Take a cup", heal: 3, time: 300, basis: "documented" }),
    f("in-cloth", "Bales of fine cloth", "bales", ["store"], "common", "Cloth woven so fine it has two hundred threads to a finger's width.", "It is worth more than gold here. Soldiers are paid in it and enemies are won over with it.", { tint: "#d89030", weight: 3, basis: "documented" }),
    f("in-chuno", "Sacks of dried potato", "sacks", ["store"], "common", "Potatoes frozen at night, trodden and dried in the sun until they are light as cork.", "They keep for ten years. The storehouses on the hills hold enough for an army.", { tint: "#c8c0b0", weight: 3, basis: "documented" }),
    f("in-maize", "Sacks of maize", "sacks", ["store"], "common", "Maize from the warm valleys, carried up on llamas.", "Most of it becomes beer.", { tint: "#e0c060", weight: 2, basis: "documented" }),
  ],
  rooms: {
    court: ["the court", "A walled court with a stone basin where water runs in a cut channel. Everyone who comes in sets down a load first."],
    porch: ["the gate hall", "A long hall with one side open to the court, where people shelter, wait and are fed at festivals."],
    guard: ["the guard house", "The guards, drawn from peoples the Inca trusts, who serve a year as their village's tax."],
    stores: ["the cloth store", "Fine cloth folded on shelves in the wall. It is given out as pay, as presents and as an honour."],
    hall: ["the great hall", "Fitted stone to the height of a man, then a steep roof of thatch on poles. The Inca sits on a low stool, and nobody looks at his face."],
    magazine: ["the storehouse", "Dried potato, maize and jerked meat, counted on knotted cords."],
    kitchen: ["the brew house", "The chosen women boil and chew maize here to make the beer every feast depends on."],
    chamber: ["the Inca's rooms", "A small plain room of perfect stonework, with niches for his things and blankets of vicuña on the floor."],
    bath: ["the bath", "A stone basin sunk in the floor, fed by a channel cut through the wall."],
    shrine: ["the shrine", "A room with gold in its niches and a brazier that is fed with cloth and maize."],
  },
};

const castleFinds: readonly FairFind[] = [
  f("gc-plate", "Cupboard of plate", "vitrine", ["hall"], "notable", "Gold and silver cups and dishes set out on stepped shelves, where every guest can count them.", "It is the king's credit. In a bad year it goes to the Italians as security for a loan.", { basis: "documented" }),
  f("gc-tuns", "Tuns of wine", "barrels", [], "prize", "Great casks of Gascon wine on a low stand, one of them tapped.", "The household drinks a tun every few days. The butler answers for each one.", { tint: "#7a2a3a", verb: "Take a cup", heal: 4, time: 300, basis: "documented" }),
  f("gc-flour", "Sacks of flour", "sacks", ["store"], "common", "Fine white flour for the high table, coarser for the hall.", "What bread you are given says where you stand.", { weight: 3, basis: "documented" }),
  f("gc-spice", "Chest of spices", "bales", ["store"], "common", "A locked chest of pepper, ginger, cinnamon and sugar.", "Worth more than the horse that carried it. The clerk of the spicery weighs out every ounce.", { tint: "#a06a3a", weight: 2, basis: "documented" }),
];

/** A king's castle of the later Middle Ages: a ward inside the gate, the great hall, and beyond its high table a row of rooms each harder to enter:
 * the great chamber, then the privy chamber. The service lies past the other end of the hall, the chapel behind the chamber. */
function castlePlan(rng: () => number): FairArea[] {
  const court = ["gc-usher", "gc-usher", "gc-guard", "gc-clerk", "gc-lady"], servants = ["gc-usher", "gc-usher"], cloth = pick(rng, [CRIMSON, ROYAL_BLUE, SAGE]), long = 46 + 4 * Math.floor(rng() * 4), flip = rng() < 0.5;
  const room = (id: string, name: string, wide: number, opens: string[] | undefined, palace: Partial<PalaceStyle>, note: string, more: Partial<Room> = {}): Room => ({ kind: "room", wide, id, name, opens, palace, stands: none, people: servants, note, ...more });
  const row = (slots: Slot[]) => (flip ? slots.reverse() : slots);
  return setOut([
    { deep: 26, slots: row([
      room("guard", "the gatehouse", 18, ["ward"], { room: "guard", bays: ["bare", "shields"] }, "The guard room over the gate, with the windlass for the portcullis and a fire that never goes out.", { deep: 14, hold: "s", people: ["gc-guard", "gc-guard"] }),
      { kind: "garden", wide: 48, id: "ward", name: "the ward", gate: "s", stands: none, people: court, note: "The court inside the walls. Suitors, messengers and tradesmen wait here, sometimes for weeks." },
      room("wardrobe", "the wardrobe", 18, ["ward"], { room: "store", bays: ["bare", "shelf"] }, "Not clothes only: cloth, spices, wax, jewels and ready money, under one keeper who travels with the king.", { deep: 14, hold: "s", stands: { tags: ["store"], n: 3 }, people: ["gc-clerk"] }),
    ]) },
    { deep: 26, slots: row([
      room("privy-chamber", "the privy chamber", 16, ["great-chamber"], { room: "bedchamber", cloth, bays: ["hanging", "bare", "hanging"] }, "Where the king sleeps and is himself. A handful of people may come in, and their names are written down.", { deep: 15, people: ["gc-lady"] }),
      room("great-chamber", "the great chamber", 20, ["hall", "privy-chamber", "chapel"], { room: "antechamber", cloth, bays: ["hanging", "lancet", "hanging"] }, "The room behind the high table where the king receives people worth receiving. Getting past its door is most courtiers' whole ambition.", { deep: 18, people: court }),
      room("hall", "the great hall", long, ["ward", "great-chamber", "buttery", "pantry"], { cloth }, "Three hundred people eat here twice a day under a roof like the inside of a ship, in order of rank from the high table down to the door.", { people: court, stands: { tags: ["hall"], n: 1 } }),
      { wide: 15, stack: [
        room("buttery", "the buttery", 15, ["hall"], { room: "store", bays: ["bare", "shelf"] }, "Wine and ale in butts, and a butler who counts every cup.", { deep: 13, stands: { tags: ["store"], n: 1 }, exhibits: ["gc-tuns"] }),
        room("pantry", "the pantry", 15, ["hall", "kitchen"], { room: "store", bays: ["shelf", "bare"] }, "Bread, salt and linen. Dishes pass through here from the kitchen to the hall.", { deep: 13, stands: { tags: ["store"], n: 3 } }),
      ] },
      room("kitchen", "the kitchens", 20, ["pantry"], { room: "kitchen", bays: ["bare", "shelf", "bare"] }, "Stone-vaulted against fire, with hearths a man can stand in. Boys turn the spits and are not allowed to go naked, by written order.", { deep: 18, hold: "s" }),
    ]) },
    { deep: 15, slots: row([{ gap: 16 }, room("chapel", "the chapel", 20, ["great-chamber"], { room: "chapel", cloth, bays: ["lancet", "bare", "lancet"] }, "The king hears Mass here each morning before anything else is done. His chaplains are also his clerks.", { people: ["gc-clerk"] }), { gap: long + 35 }]) },
  ]);
}

const divanFinds: readonly FairFind[] = [
  f("is-silk", "Bolts of silk", "bales", ["store"], "common", "Silk and brocade from the palace workshops, each bolt with the ruler's name woven into its border.", "Robes of it are given to officers when they are appointed. Wearing one says whose man you are.", { tint: "#a2302e", weight: 3, basis: "documented" }),
  f("is-sugar", "Sacks of sugar and rice", "sacks", ["store"], "common", "White sugar in cones and sacks of rice.", "The kitchens feed several thousand people a day. On feast days the poor are fed from the same pots.", { weight: 3, basis: "documented" }),
  f("is-ceramic", "Painted jar", "vase", ["hall", "state"], "common", "A tall jar painted under the glaze with leaves and tulips in blue and red.", "Made for the court at the ruler's own potteries.", { tint: "#3f8fb8", weight: 2, basis: "documented" }),
  f("is-astrolabe", "Astrolabe and books", "vitrine", ["hall"], "notable", "A brass astrolabe, and beside it books of the stars, of medicine and of law.", "The court astronomer sets the hours of prayer and is consulted before any campaign.", { basis: "documented" }),
];

/** A palace of the Islamic world: courts one behind another, each more private. The first is open to anyone with business; the council sits off the second,
 * round its pool; the ruler's hall closes it; and behind the hall is the household's own garden court, where no outsider comes. */
function divanPlan(rng: () => number): FairArea[] {
  const court = ["is-petitioner", "is-petitioner", "is-secretary", "is-guard", "is-eunuch"], inner = ["is-eunuch", "is-lady", "is-lady"], flip = rng() < 0.5, cloth = pick(rng, [TURKEY_RED, ROYAL_BLUE, SAGE]);
  const room = (id: string, name: string, wide: number, opens: string[] | undefined, palace: Partial<PalaceStyle>, note: string, more: Partial<Room> = {}): Room => ({ kind: "room", wide, id, name, opens, palace, stands: none, people: inner, note, ...more });
  const row = (slots: Slot[]) => (flip ? slots.reverse() : slots);
  return setOut([
    { deep: 26, slots: [{ kind: "garden", wide: 84, id: "outer-court", name: "the first court", gate: "s", stands: { tags: ["garden"], n: 2 }, people: [...court, "is-guard"], note: "Open to anyone with business here. The bakery, the mint and the stables give onto it, and silence is not yet required." }] },
    { deep: 16, slots: row([
      room("guard", "the gate guard", 16, ["council"], { room: "guard", floor: "flags", bays: ["bare", "bands"] }, "The guard at the second gate. From here on everyone walks, and speaks low.", { people: ["is-guard", "is-guard"] }),
      room("council", "the council hall", 30, ["outer-court", "pool-court", "guard", "treasury"], { room: "vestibule", floor: "flags", bays: ["arch", "bands", "arch"] }, "The ministers sit here on set mornings to hear petitions and settle the state's business, with secretaries writing along the wall.", { people: court }),
      room("treasury", "the treasury", 16, ["council"], { room: "store", floor: "flags", bays: ["bare"] }, "Coin, robes of honour and the registers of what every province owes.", { stands: { tags: ["store"], n: 3 }, people: ["is-secretary"] }),
    ]) },
    { deep: 25, slots: row([
      room("bath", "the bath", 16, ["pool-court"], { room: "bath", floor: "flags", bays: ["arch", "bands"] }, "A hot room under a dome pierced with glass stars, a warm room, and a plunge. An hour here is part of every day.", { deep: 15, people: ["is-eunuch"] }),
      room("pool-court", "the court of the pool", 45, ["council", "hall", "bath", "kitchen"], { room: "atrium", floor: "flags", bays: ["arch", "lattice", "arch"] }, "A long pool that doubles the arches in it, with a walk on slender columns at either end. Envoys are kept waiting here on purpose.", { people: court }),
      room("kitchen", "the kitchens", 16, ["pool-court"], { room: "kitchen", floor: "flags", bays: ["bare"] }, "A row of domed kitchens, one for the ruler, one for the household, one for the sweets.", { deep: 15, people: ["is-eunuch", "is-eunuch"] }),
    ]) },
    { deep: 22, slots: row([
      room("library", "the library", 18, ["hall"], { room: "office", cloth, bays: ["arch", "bands", "arch"] }, "Books in niches, lying flat with their titles written on the edge, and a clerk who knows where each one is.", { deep: 14, people: ["is-secretary"] }),
      room("hall", "the hall of audience", 44, ["pool-court", "library", "inner-court"], { cloth }, "The ruler sits against the far wall under a wooden ceiling made of thousands of pieces. Those he receives kiss the hem of his robe.", { people: court, stands: { tags: ["hall"], n: 2 } }),
      { gap: 18 },
    ]) },
    { deep: 26, slots: row([
      room("bedchamber", "the ruler's chamber", 18, ["inner-court"], { room: "bedchamber", cloth, bays: ["arch", "bands", "arch"] }, "A tiled room with a fountain in the floor and a bed in an alcove.", { deep: 15 }),
      room("inner-court", "the inner court", 48, ["hall", "bedchamber", "sitting-room"], { room: "peristyle", floor: "flags", bays: ["arch", "lattice"] }, "The household's own court: a garden in four beds with water running between them. No man from outside passes the door.", { people: inner }),
      room("sitting-room", "the women's hall", 18, ["inner-court"], { room: "drawing", cloth, bays: ["lattice", "arch", "bands"] }, "Cushions round the walls, a brazier, and a window screened so that those inside can see out and nobody can see in.", { deep: 15 }),
    ]) },
  ]);
}

const MATRON = /\b(?:matrona?|noblewoman|(?:noble|patrician|rich|wealthy|aristocratic)(?: roman)? (?:woman|lady))\b/;
const ROMAN = /\b(?:caesar|senator|patrician|consul|pontifex|domus|roman (?:noble(?:woman|man)?|matron|aristocrat|palace|villa|house|household)|rich roman)\b/;
const LORD = /\b(?:warlord|chieftain|headman|jarl|thegn|thane|mead[- ]?hall|long ?house|great hall)\b/;
const MANOR = /\b(?:manor(?: house)?|baron|great hall|medieval lord|lord of the manor)\b/;
const PALACE = /\b(?:(?<!crystal )palace|ch[aâ]teau|schloss|residenz|palazzo|stately home|country house)\b/;
const RULER = /\b(?:king|queen|emperor|empress|prince|princess|duke|duchess)\b/;
// Someone of a ruler's household, when they are who the prompt is about: named before any "in", "of" or "for".
const COURT = /^(?:(?!\b(?:in|at|near|from|of|for|under|to|who|serving|with)\b).)*\b(?:(?:king|queen|emperor|empress|prince|princess|duke|duchess|sultan|caliph|emir|shah)(?!s\b|'s| street| road| lane| square| cross)|nobles?|noble(?:man|woman)|courtier|chamberlain|lady[- ]in[- ]waiting|page ?boy|eunuch|concubine|royal [a-z]+|palace [a-z]+|court [a-z]+)\b/;
const any = (...of: RegExp[]) => new RegExp(of.map((r) => r.source).join("|"));
const EUROPE: Box = [-11, 35, 45, 66], ROMAN_WORLD: Box = [-10, 28, 42, 56];
const hallEnter = "woodsmoke, dogs, and a roof-tree taller than any house in the country.";
const GUARD = /\b(?:guards?(?:m[ae]n)?|sentr(?:y|ies)|soldiers?|warriors?|spearm[ae]n|m[ae]n[- ]at[- ]arms)\b/, SERVANT = /\b(?:servants?|maids?|pages?|footm[ae]n|attendants?|slaves?|ushers?|grooms?|valets?)\b/, SCRIBE = /\b(?:scribes?|clerks?|secretar(?:y|ies)|stewards?|officials?|accountants?)\b/, COOK = /\b(?:cooks?|bakers?|brewers?|kitchen [a-z]+|scullions?)\b/, NOBLE = /\b(?:nobles?|noble(?:man|woman)|courtiers?|lords?|lad(?:y|ies))\b/;
const hallPosts: readonly FairPost[] = [["Chieftain", /\b(?:warlord|chieftain|headman|jarl|king|queen)\b/, "ruler", 0], ["Warrior of the household", GUARD, "soldier", 4], ["Servant of the hall", SERVANT, "servant", 3], ["Weaver of the hall", /\bweavers?\b/, "weaver", 2], ["Poet of the hall", /\b(?:poets?|bards?|skalds?|singers?)\b/, "musician", 1]];
const domusPosts: readonly FairPost[] = [["Noblewoman", MATRON, "landowner", 0], ["", /\b(?:nobleman|aristocrat)\b/, "landowner", 0], ["Senator", /\b(?:caesar|senator|patrician|consul|pontifex|noble)\b/, "ruler", 0], ["Household slave", SERVANT, "servant", 6], ["Doorkeeper", GUARD, "servant", 1], ["Secretary of the house", SCRIBE, "scribe", 2], ["Cook of the house", COOK, "cook", 1], ["Client", /\bclients?\b/, "courtier", 3]];
const kinds: readonly Kind[] = [
  {
    id: "hall-stone", name: "the big house", years: [-9500, -2001], asks: LORD, words: /\b(?:neolithic|stone age)\b/, entry: "yard", place: "konya", role: "Chieftain", style: neolithicHall,
    posts: [["Headman", /\b(?:warlord|chieftain|headman)\b/, "ruler", 0], ["Kin of the big house", /\bkin(?:sm[ae]n|swom[ae]n)?\b/, "servant", 3]],
    coin: ["bead", "beads"], finds: stoneFinds, enter: "smoke through thatch, cattle in the yard, and the longest roof you have seen.", plan: hallPlan(true),
  },
  { id: "hall-lord", name: "the lord's hall", years: [500, 1150], asks: LORD, within: EUROPE, entry: "yard", place: "london", role: "Chieftain", style: meadHall, posts: hallPosts, coin: ["ring", "rings"], finds: ironFinds, enter: hallEnter, plan: hallPlan(false) },
  { id: "hall-iron", name: "the chieftain's hall", years: [-2000, 499], asks: LORD, words: /\b(?:bronze age|iron age)\b/, within: EUROPE, entry: "yard", place: "normandy", role: "Chieftain", style: meadHall, posts: hallPosts, coin: ["ring", "rings"], finds: ironFinds, enter: hallEnter, plan: hallPlan(false) },
  {
    residents: [["Julius Caesar", "Senator", "male", -99, -59, -43, "atrium"], ["Cicero", "Senator", "male", -105, -60, -42, "tablinum"]],
    id: "domus", name: "the house", years: [-60, 480], asks: any(ROMAN, COURT, PALACE, MATRON), words: /\b(?:roman|rome|domus|caesar|senator|patrician|consul|pontifex)\b/, within: ROMAN_WORLD, entry: "atrium", place: "rome", role: "Senator", style: romanHouse, posts: domusPosts,
    coin: ["sestertius", "sestertii"], finds: romanFinds, enter: "a dim hall, a square of sky in its roof, and a pool under it.", plan: domusPlan,
  },
  {
    id: "domus-early", name: "the house", years: [-300, -61], asks: any(ROMAN, COURT, PALACE, MATRON), words: /\brepublic\b/, within: ROMAN_WORLD, entry: "atrium", place: "rome", role: "Senator", style: romanHouse, posts: domusPosts,
    coin: ["as", "asses"], finds: romanFinds, enter: "a dim hall, a square of sky in its roof, and a pool under it.", plan: domusPlan,
  },
  // Kinds that a prompt names by their people come before those any "palace" or "king" would mean.
  {
    id: "palace-egypt", name: "the palace", years: [-1550, -332], asks: any(PALACE, COURT, /\b(?:pharaoh|vizier)\b/), words: /\b(?:pharaoh|vizier|egypt|thebes|memphis|amarna)/, within: [24, 21, 37, 32], entry: "court", place: "nile", role: "Scribe", style: egyptianPalace,
    posts: [["Pharaoh", /\b(?:pharaoh|king|queen)\b/, "ruler", 0], ["Vizier", /\b(?:vizier|nobles?|courtiers?)\b/, "courtier", 1], ["Scribe of the palace", SCRIBE, "scribe", 4], ["Doorkeeper", GUARD, "soldier", 3], ["Fan-bearer", SERVANT, "servant", 4], ["Baker of the palace", COOK, "cook", 2]],
    coin: ["deben", "deben"], finds: egypt.finds, enter: "a white wall, a pool with trees round it, and columns painted like a reed bed.", plan: axisPlan(egypt),
  },
  {
    id: "palace-persia", name: "the palace", years: [-550, -330], asks: any(PALACE, COURT, /\b(?:great king|satrap|apadana|persepolis|achaemenid)\b/), words: /\b(?:great king|satrap|apadana|persepolis|achaemenid|persian?)\b/, within: [38, 24, 63, 40], entry: "court", place: "mesopotamia", role: "Envoy", style: persianPalace,
    posts: [["Great King", /\b(?:great king|king|queen|satrap)\b/, "ruler", 0], ["Spearman of the guard", GUARD, "soldier", 4], ["Usher", /\b(?:ushers?|chamberlains?|nobles?|courtiers?)\b/, "courtier", 2], ["Cupbearer", SERVANT, "servant", 4], ["Scribe of the treasury", SCRIBE, "scribe", 3], ["Cook of the king's table", COOK, "cook", 2]],
    coin: ["shekel", "shekels"], finds: persia.finds, enter: "a gate between stone bulls, a garden laid out in squares, and columns taller than trees.", plan: axisPlan(persia),
  },
  {
    id: "palace-aegean", name: "the palace", years: [-1450, -1150], asks: any(PALACE, COURT, /\b(?:wanax|megaron|mycenaean|knossos|mycenae|pylos)\b/), words: /\b(?:wanax|megaron|mycenaean|knossos|mycenae|pylos)\b/, within: [19, 34, 29, 41], entry: "court", place: "athens", role: "Scribe", style: aegeanPalace,
    posts: [["Wanax", /\b(?:wanax|king|queen)\b/, "ruler", 0], ["Follower of the king", GUARD, "soldier", 3], ["Tablet writer", SCRIBE, "scribe", 3], ["Oil worker", SERVANT, "servant", 4], ["Priestess", /\bpriest(?:ess)?\b/, "high-priest", 1], ["Weaver of the palace", /\bweavers?\b/, "weaver", 3]],
    coin: ["measure of barley", "measures of barley"], finds: aegean.finds, enter: "a paved court, red columns, and the smell of oil.", plan: axisPlan(aegean),
  },
  {
    residents: [["Kangxi Emperor", "Emperor", "male", 1654, 1672, 1722, "hall"], ["Qianlong Emperor", "Emperor", "male", 1711, 1735, 1796, "hall"]],
    id: "palace-china", name: "the palace", years: [1368, 1911], asks: any(PALACE, COURT, /\b(?:mandarin|forbidden city|yamen)\b/), words: /\b(?:forbidden city|mandarin|eunuch|yamen|chinese|china|ming|qing)\b/, within: [98, 20, 124, 42], entry: "outer-court", place: "beijing", role: "Official", style: chinesePalace,
    posts: [["Emperor", /\b(?:emperor|empress|king|queen|prince|princess)\b/, "ruler", 0], ["Palace eunuch", /\b(?:eunuchs?|servants?|attendants?|pages?)\b/, "servant", 5], ["Official", /\b(?:mandarins?|officials?|scribes?|clerks?|secretar(?:y|ies)|nobles?|courtiers?)\b/, "scribe", 3], ["Guardsman", GUARD, "soldier", 3], ["Palace maid", /\b(?:maids?|concubines?|lad(?:y|ies))\b/, "servant", 3], ["Cook of the imperial kitchen", COOK, "cook", 2]],
    coin: ["tael", "taels"], finds: chinaFinds, enter: "a red wall, a gate with three doors, and a court paved to the horizon.", plan: courtAxisPlan,
  },
  {
    id: "palace-japan", name: "the palace", years: [1580, 1868], asks: any(PALACE, COURT, /\b(?:shogun|daimyo|shoin)\b/), words: /\b(?:shogun|daimyo|shoin|japan|japanese|kyoto|edo)\b/, within: [128, 30, 146, 46], entry: "forecourt", place: "kyoto", role: "Retainer", style: shoinPalace,
    posts: [["", /\b(?:shogun|daimyo)\b/, "ruler", 0], ["Retainer", /\b(?:retainers?|samurai|guards?|soldiers?|nobles?|courtiers?)\b/, "soldier", 5], ["Page", SERVANT, "servant", 3], ["Lady-in-waiting", /\b(?:lad(?:y|ies)|maids?|concubines?)\b/, "courtier", 2], ["Clerk of the household", SCRIBE, "scribe", 2], ["Cook of the household", COOK, "cook", 2]],
    coin: ["mon", "mon"], finds: japanFinds, enter: "raked gravel, a carved gate, and a roof of cypress bark sweeping down to meet you.", plan: shoinPlan,
  },
  {
    residents: [["Moctezuma II", "Tlatoani", "male", 1466, 1502, 1520, "hall"]],
    id: "palace-mexica", name: "the palace", years: [1325, 1521], asks: any(PALACE, COURT, /\b(?:tlatoani|tecpan|moctezuma|montezuma)\b/), words: /\b(?:aztecs?|mexica|tenochtitlan|texcoco|tlatoani|tecpan|moctezuma|montezuma|nahua)\b/, within: [-106, 14, -86, 23], entry: "court", place: "mexico", role: "Noble", style: mexicaPalace,
    posts: [["Tlatoani", /\b(?:tlatoani|king|emperor|ruler|moctezuma|montezuma)\b/, "ruler", 0], ["Noble", NOBLE, "courtier", 2], ["Warrior of the guard", GUARD, "soldier", 3], ["Steward", /\b(?:stewards?|officials?|clerks?)\b/, "scribe", 2], ["Painter of books", /\b(?:scribes?|painters?)\b/, "scribe", 2], ["Palace servant", SERVANT, "servant", 4], ["Palace cook", COOK, "cook", 3]],
    coin: ["cacao bean", "cacao beans"], finds: mexica.finds, enter: "white walls banded in red, a court full of flowering trees, and every voice kept low.", plan: axisPlan(mexica),
  },
  {
    id: "palace-inca", name: "the palace", years: [1400, 1533], asks: any(PALACE, COURT, /\b(?:sapa inca|kancha|aclla)\b/), words: /\b(?:incas?|inka|cusco|cuzco|tawantinsuyu|sapa inca|andean|quechua)\b/, within: [-82, -36, -62, 2], entry: "court", place: "cusco-city", role: "Noble", style: incaHall,
    posts: [["Sapa Inca", /\b(?:sapa inca|king|emperor|ruler)\b/, "ruler", 0], ["Noble", NOBLE, "courtier", 2], ["Guard of the Inca", GUARD, "soldier", 3], ["Keeper of the knots", SCRIBE, "scribe", 2], ["Chosen woman", /\b(?:chosen wom[ae]n|acllas?|weavers?|brewers?)\b/, "weaver", 3], ["Servant for life", SERVANT, "servant", 4]],
    coin: ["length of cloth", "lengths of cloth"], finds: inca.finds, enter: "a wall of stones fitted like a puzzle, a narrow gate, and thatch as thick as a man is tall.", plan: axisPlan(inca),
  },
  {
    residents: [["Suleiman the Magnificent", "Sultan", "male", 1494, 1520, 1566, "hall"]],
    id: "palace-islamic", name: "the palace", years: [700, 1900], asks: any(PALACE, COURT, /\b(?:vizier|harem|seraglio|alhambra|topkapi|divan)\b/), words: /\b(?:sultan|caliph|emir|shah|vizier|harem|seraglio|alhambra|topkapi|divan|ottoman|abbasid|mughal|safavid|mamluk|moorish)\b/, within: [-10, 12, 80, 45], entry: "outer-court", place: "city-istanbul", role: "Secretary", style: islamicPalace,
    posts: [["", /\b(?:sultan|caliph|emir|shah|king|queen|emperor|prince|princess)\b/, "ruler", 0], ["Vizier", /\b(?:viziers?|nobles?|courtiers?)\b/, "courtier", 1], ["Palace guard", GUARD, "soldier", 4], ["Eunuch of the household", /\b(?:eunuchs?|servants?|attendants?|pages?|slaves?)\b/, "servant", 4], ["Secretary", SCRIBE, "scribe", 3], ["Palace cook", COOK, "cook", 3], ["Woman of the household", /\b(?:concubines?|lad(?:y|ies)|maids?)\b/, "courtier", 2]],
    coin: ["dirham", "dirhams"], finds: divanFinds, enter: "a gate deep enough to shelter in, a court full of people waiting, and beyond it another gate.", plan: divanPlan,
  },
  {
    id: "manor", name: "the manor", years: [1151, 1520], asks: MANOR, within: EUROPE, entry: "yard", place: "london", role: "Lord", style: manorHall,
    posts: [["Lord", /\b(?:lords?|barons?|knights?)\b/, "ruler", 0], ["Steward", SCRIBE, "scribe", 1], ["Man-at-arms", GUARD, "soldier", 2], ["Servant of the hall", SERVANT, "servant", 4], ["Cook of the hall", COOK, "cook", 2]],
    coin: ["penny", "pence"], finds: manorFinds, enter: "a gatehouse, a muddy court, and a hall with a roof like an upturned ship.", plan: manorPlan,
  },
  {
    id: "palace-gothic", name: "the castle", years: [1151, 1649], asks: any(COURT, /\b(?:castles?|royal household)\b/), within: EUROPE, entry: "ward", place: "london", role: "Courtier", style: gothicHall,
    posts: [["", RULER, "ruler", 0], ["Knight of the household", /\b(?:knights?|nobles?|noblem[ae]n|courtiers?)\b/, "courtier", 2], ["Man-at-arms", GUARD, "soldier", 3], ["Usher of the hall", SERVANT, "servant", 4], ["Clerk of the household", /\b(?:scribes?|clerks?|secretar(?:y|ies)|stewards?|chaplains?|officials?)\b/, "scribe", 2], ["Cook of the king's kitchen", COOK, "cook", 2], ["Lady of the chamber", /\b(?:lad(?:y|ies)|noblewom[ae]n|damsels?)\b/, "courtier", 2]],
    coin: ["penny", "pence"], finds: castleFinds, enter: "a drawbridge, a gate with a guard in it, and a hall roof rising over the wall.", plan: castlePlan,
  },
  {
    id: "palace-baroque", name: "the palace", years: [1650, 1789], asks: any(PALACE, COURT), within: EUROPE, entry: "forecourt", place: "paris", role: "Courtier", style: louisQuatorze,
    posts: [["", RULER, "ruler", 0], ["Courtier", /\b(?:nobles?|noblem[ae]n|courtiers?|chamberlains?)\b/, "courtier", 3], ["Guardsman", GUARD, "soldier", 3], ["Footman", SERVANT, "servant", 5], ["Secretary", SCRIBE, "scribe", 2], ["Palace cook", COOK, "cook", 2], ["Lady-in-waiting", /\b(?:lad(?:y|ies)|noblewom[ae]n|maids of honou?r)\b/, "courtier", 2]],
    coin: ["ducat", "ducats"], finds: courtFinds, enter: "gravel, carriages, and more windows than you can count.", plan: enfiladePlan,
  },
  {
    id: "palace-house", name: "the great house", years: [1790, 1914], asks: any(PALACE, COURT), within: EUROPE, entry: "forecourt", place: "london", role: "Guest", style: victorianState,
    posts: [["", RULER, "ruler", 0], ["Guest of the house", /\b(?:nobles?|noblem[ae]n|courtiers?|lad(?:y|ies)|guests?)\b/, "courtier", 1], ["Footman", /\b(?:footm[ae]n|servants?|pages?|valets?|grooms?)\b/, "servant", 4], ["Housemaid", /\b(?:maids?|housemaids?)\b/, "servant", 5], ["Butler", /\b(?:butlers?|stewards?|secretar(?:y|ies)|clerks?)\b/, "servant", 1], ["Cook of the house", COOK, "cook", 2]],
    coin: ["pound", "pounds"], finds: houseFinds, enter: "a gravel sweep, a porch, and a footman already coming down the steps.", plan: corridorPlan,
  },
];

/** How many plans each kind is expanded into. */
const PLANS = 4;

/** A post's own title asks for its house as surely as the house's name: "a palace eunuch", "a keeper of the knots", "a footman". */
const titled = (k: Kind) => any(k.asks, new RegExp(`\\b(?:${k.posts.filter((p) => p[0] && p[3]).map((p) => p[0].toLowerCase().replace(/-/g, "[- ]")).join("|")})\\b`));

export const plannedPalaces: readonly Fair[] = kinds.map((k) => ({ ...k, asks: titled(k) })).flatMap((k) => Array.from({ length: PLANS }, (_, i): Fair => ({
  id: `${k.id}-${i}`, name: k.name, city: "", where: [999, 999, 999, 999], years: k.years, entry: k.entry, areas: k.plan(rngOf("palace-plan", k.id, i)),
  scale: 1, look: "palace", palace: k.style, within: k.within, named: k.words, posts: k.posts, residents: k.residents, role: k.role, finds: k.finds, ticket: 0, coin: k.coin, place: k.place, generated: true, asks: k.asks,
  // Asked for with no date: the kind whose own period the prompt names, or the first that takes any.
  prompt: new RegExp(`(?=.*(?:${k.asks.source}))${k.words ? `(?=.*${k.words.source})` : ""}`),
  words: { short: "", gate: "", enter: k.enter },
})));
