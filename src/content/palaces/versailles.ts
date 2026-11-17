import type { Fair, FairArea, FairFind } from "../fairs/types";

// The palace of Versailles from 1701, when the King's bedchamber was moved to
// the middle of the house, to 1789. A palace is planned the way a fair is: rooms
// and courts by their rectangles on a plan, joined where they adjoin. Up the
// screen is west, from the town gate through the courts to the Hall of Mirrors
// and out to the gardens, so the plan is the visitor's own way in. The rooms
// and their order follow the palace; their sizes are squeezed.

const WALL_ART = ["painting", "tapestry", "carpet", "panel", "map"];
const f = (id: string, name: string, art: FairFind["art"], tags: string[], tier: FairFind["tier"], look: string, text: string, more: Partial<FairFind> = {}): FairFind =>
  ({ id, name, art, on: WALL_ART.includes(art) ? "wall" : "floor", tags, tier, verb: "Look closely", time: 60, look, text, basis: "documented", keeps: true, ...more });

const finds: readonly FairFind[] = [
  f("kings-bed", "The King's bed", "state-bed", [], "prize", "A bed hung in crimson and gold behind a gilded rail, in the exact middle of the palace, facing the rising sun.", "Nobody passes the rail unless the King calls them. Courtiers bow to the bed when they cross the room, whether he is in it or not.", { staff: "vrs-valet" }),
  f("throne", "The throne", "throne", [], "prize", "A gilded armchair on a dais under a canopy. The old throne was solid silver; it went to the mint in 1689 to pay for the war.", "The King almost never sits in it. Ambassadors are received here; on other days the room is used for music and cards."),
  f("rigaud-portrait", "Portrait of the King", "painting", [], "notable", "The King at sixty-three in his coronation robes, one leg forward in white silk. Rigaud painted it in 1701.", "It was meant as a present for his grandson in Spain. He liked it too much to send it.", { tint: "#3a4a8a", w: 2 }),
  f("gobelins", "Gobelins tapestry", "tapestry", ["state"], "notable", "A tapestry from the Gobelins works: the King, larger than everyone round him, receiving a city's keys.", "There is a whole set of these, one for each thing he would like remembered.", { tint: "#8a4a3a", weight: 2 }),
  f("antique-marble", "Antique marble", "statue", ["state", "garden"], "common", "A Roman statue on a pedestal of coloured marble.", "Bought in Rome, or dug up there, and shipped north by the crate.", { weight: 3 }),
  f("porphyry-vase", "Porphyry vase", "vase", ["state"], "common", "A vase of purple porphyry taller than a child, with gilt bronze handles.", "The stone is harder than iron. Cutting one of these takes years.", { tint: "#7a3a5a", weight: 2 }),
  f("harpsichord", "Harpsichord", "piano", [], "notable", "A harpsichord painted inside the lid, in the room where the court dances and plays cards three evenings a week.", "On those evenings the King's apartments are open to the whole court, with music, tables of cards and a buffet.", { verb: "Listen", time: 300, staff: "vrs-musician" }),
  f("petition-table", "Petition table", "counter", [], "notable", "A table where anyone may lay a written petition to the King.", "The petitions are gathered up and read by his secretaries. Most come back marked in the margin; a few are answered.", { verb: "Leave a petition", time: 120, staff: "vrs-secretary" }),
  f("serdeau", "Leftovers stall", "kiosk", [], "notable", "A stall selling dishes sent back from the royal tables, hardly touched.", "Officers of the kitchen have the right to sell what the King's table does not eat. Half the town dines on it.", { verb: "Buy a plate", price: 1, heal: 10, time: 900, tint: "#b8863a", staff: "vrs-cook" }),
  f("sword-hire", "Sword and hat for hire", "counter", [], "notable", "A man at the gate with a rack of plain swords and a row of hats.", "Anyone decently dressed may walk into the palace, but a man must wear a sword and carry a hat. He hires out both.", { verb: "Hire a sword", price: 1, loot: { "court-sword": 1 }, staff: "vrs-sword-hirer" }),
  f("orange-trees", "Orange trees in tubs", "pyramid", ["garden"], "common", "Orange trees in square wooden tubs, wheeled out from the Orangery for the summer.", "There are more than a thousand. Some are older than the palace.", { tint: "#e8963a", weight: 3 }),
  f("roasting-spits", "Roasting spits", "counter", ["kitchen"], "common", "Spits the length of a room, turning in front of a wall of fire.", "The kitchens feed several thousand people a day, in order of rank.", { tint: "#5a3a2a", weight: 2 }),
  f("wine-casks", "Wine casks", "barrels", ["kitchen"], "common", "Casks of Burgundy and Champagne, chalked with the name of the table each is for.", "The King's own wine is tasted in front of him before he drinks.", { tint: "#7a2a3a", weight: 2 }),
];

export const versaillesItems = {
  "court-sword": ["Hired sword", "tool", 2, "A plain sword on a worn belt, hired at the gate of Versailles so as to be let in."],
} as const;

const court = ["vrs-courtier", "vrs-courtier", "vrs-courtier", "vrs-lady", "vrs-lady", "vrs-visitor", "vrs-petitioner", "vrs-footman", "vrs-officer", "vrs-abbe"];
const room = (id: string, name: string, at: [number, number, number, number], tags: string[], n: number, note: string, more: Partial<FairArea> = {}): FairArea =>
  ({ id, name, kind: "gallery", at, floor: "parquet", stands: { tags, n }, people: court, note, basis: "documented", ...more });
const open = (id: string, name: string, at: [number, number, number, number], note: string, more: Partial<FairArea> = {}): FairArea =>
  ({ id, name, kind: "court", at, stands: { tags: ["garden"], n: 3 }, people: [...court, "vrs-gardener"], note, basis: "documented", ...more });

const areas: FairArea[] = [
  open("forecourt", "the forecourt", [10, 30, 20, 6], "The outer court inside the town gate, where carriages set down and swords are hired.", { gate: "s", exhibits: ["sword-hire"], people: [...court, "vrs-guard"] }),
  open("royal-court", "the Royal Court", [12, 24, 16, 6], "The inner court between the ministers' wings. Only carriages with the right to enter it pass the second gate."),
  open("marble-court", "the Marble Court", [16, 19, 8, 5], "The small court of black and white marble under the King's windows.", { stands: { tags: ["state"], n: 2 } }),
  room("grand-commun", "the Grand Commun: the kitchens", [4, 24, 8, 6], ["kitchen"], 4, "The great service building beside the palace, where the court's food was cooked and its officers lodged.", { floor: "tile", look: "warm", exhibits: ["serdeau"], people: ["vrs-footman", "vrs-footman", "vrs-visitor"] }),
  room("ministers", "the Ministers' Wing", [28, 24, 6, 6], ["office"], 1, "The wing of the secretaries of state. The petition table stood in the guard room on set days; it is put here with the clerks.", { exhibits: ["petition-table"], basis: "inferred" }),
  room("guard-room", "the King's Guard Room", [10, 19, 6, 5], ["arms"], 1, "The room of the bodyguard, at the head of the stair, which everyone crosses to reach the King.", { floor: "tile", people: [...court, "vrs-guard", "vrs-guard"] }),
  room("chapel", "the Royal Chapel", [24, 19, 6, 5], ["chapel"], 1, "The King hears Mass here every morning from the gallery, with the court below facing him and not the altar. The present chapel was finished in 1710.", { floor: "tile" }),
  room("antechamber", "the Bull's-Eye Antechamber", [16, 15, 4, 4], ["state"], 2, "The room outside the bedchamber, named for its oval window, where the court waits each morning to be let in."),
  room("bedchamber", "the King's Bedchamber", [20, 15, 4, 4], ["bedchamber"], 0, "The King rises and goes to bed here in public, each garment handed to him by someone with the right to hand it.", { exhibits: ["kings-bed"] }),
  room("queens", "the Queen's Apartments", [8, 13, 6, 6], ["state"], 3, "The south range of state rooms. With no queen since 1683 they belong to the first lady of the court.", { exhibits: ["gobelins"] }),
  room("state", "the King's State Apartments", [26, 13, 6, 6], ["state"], 3, "Seven rooms in a row, each named for a planet's god. The last, Apollo's, is the throne room.", { exhibits: ["throne", "rigaud-portrait", "harpsichord"] }),
  room("mirrors", "the Hall of Mirrors", [14, 11, 12, 4], ["state"], 4, "Seventeen windows on the gardens and seventeen arches of mirror facing them, 357 mirrors in all. Everyone crosses it to reach the King, so everyone waits here to be seen."),
  open("parterre", "the Water Parterre", [12, 5, 16, 6], "Two great basins on the terrace under the Hall of Mirrors.", { fountain: "basin" }),
  open("latona", "the Latona Fountain", [14, 0, 12, 5], "The fountain of Latona, at the head of the walk down to the Grand Canal.", { fountain: "coutan" }),
];

export const versailles: Fair = {
  id: "versailles",
  name: "the palace of Versailles",
  city: "Versailles",
  where: [2.0, 48.7, 2.5, 49.0],
  years: [1701, 1789],
  entry: "forecourt",
  areas,
  scale: 5,
  look: "palace",
  role: "Courtier",
  finds,
  ticket: 0,
  coin: ["livre", "livres"],
  prompt: /\bversailles\b|\bsun king\b/,
  place: "paris",
  staff: { arms: "vrs-guard", kitchen: "vrs-cook", office: "vrs-secretary", chapel: "vrs-abbe", "": "vrs-footman" },
  words: {
    short: "",
    gate: "The guards look at your coat and your sword and let you pass.",
    enter: "gravel, carriages, and three hundred windows looking down at you.",
  },
};
