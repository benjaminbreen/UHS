import type { CultureId } from "../history/types";
import type { PrisonFind, PrisonStyle } from "./types";

export type { PrisonAreaId, PrisonFind, PrisonOrder, PrisonPalette, PrisonSentence, PrisonStyle } from "./types";

const sharedFinds: readonly PrisonFind[] = [
  {
    id: "pallet",
    name: "Straw pallet",
    art: "pallet",
    verb: "Rest on the pallet",
    look: "A ticking stuffed with flattened straw and a folded wool blanket.",
    text: "You stretch out on the pallet and catch a short rest.",
    solid: true,
    keeps: true,
    heal: 8,
    special: "bed",
    time: 1200,
  },
  {
    id: "cot",
    name: "Iron cot",
    art: "cot",
    verb: "Rest on the cot",
    look: "A narrow riveted iron frame bolted to the wall, with a folded grey blanket.",
    text: "You lie back on the narrow cot and let the hours pass.",
    solid: true,
    keeps: true,
    heal: 8,
    special: "bed",
    time: 1200,
  },
  {
    id: "loose-stone",
    name: "Cracked masonry wall",
    art: "wall-crack",
    verb: "Pry the cracked wall",
    look: "A jagged crack splits the masonry blocks here. Cold air leaks through the dark seam—hollow behind it.",
    text: "You work your iron tool into the crack and loosen a chunk of masonry.",
    keeps: true,
    special: "pry",
    time: 300,
  },
  {
    id: "tallies",
    name: "Scratched tallies",
    art: "tallies",
    verb: "Scratch a mark",
    look: "Row after row of five-stroke tallies scratched into the stone by whoever held this cell before you.",
    text: "You add a fresh stroke to the wall.",
    wall: true,
    keeps: true,
    special: "tallies",
    time: 30,
  },
  {
    id: "spoon",
    name: "Bent iron spoon",
    art: "spoon",
    verb: "Hide the iron spoon",
    look: "A heavy iron soup spoon, its handle filed flat into a makeshift chisel.",
    text: "You slip the filed iron spoon inside your sleeve.",
    loot: { tool: 1 },
    time: 20,
  },
  {
    id: "bucket",
    name: "Iron-bound chest",
    art: "chest",
    verb: "Search the chest",
    look: "A battered iron-banded chest left in the corner of the cell.",
    text: "Empty, save for a handful of damp straw.",
    solid: true,
    keeps: true,
    time: 15,
  },
  {
    id: "key-rack",
    name: "Turnkey's key rack",
    art: "key-rack",
    verb: "Snatch a key",
    look: "Heavy brass and iron keys hanging on pegs beside the corridor door.",
    text: "Your fingers close around a heavy brass gate key.",
    wall: true,
    keeps: true,
    special: "keys",
    time: 30,
  },
  {
    id: "grate",
    name: "Yard drain grate",
    art: "grate",
    verb: "Pry the drain grate",
    look: "Rusted iron bars set into the lowest stones of the courtyard. Cold air rises from a culvert beneath.",
    text: "You test the rusted iron bars.",
    keeps: true,
    special: "grate",
    time: 300,
  },
  {
    id: "rations",
    name: "Ration bench",
    art: "rations",
    verb: "Take rations",
    look: "Coarse bread loaves, a wooden tub of small beer, and tin mugs.",
    text: "You take a crust of bread and a mug of water.",
    solid: true,
    keeps: true,
    heal: 10,
    loot: { bread: 1, water: 1 },
    time: 120,
  },
  {
    id: "taproom",
    name: "Gaol taproom cask",
    art: "taproom",
    verb: "Buy ale and bread",
    look: "In a fee-paying gaol, the turnkey sells ale, roast meat, and clean straw to anyone with coin.",
    text: "The tapster draws a mug and slides over a fresh loaf.",
    solid: true,
    keeps: true,
    price: 2,
    heal: 15,
    loot: { bread: 1, water: 1 },
    time: 120,
  },
  {
    id: "work-bench",
    name: "Prison work bench",
    art: "work-bench",
    verb: "Work a shift",
    look: "Bundles of tarred rope to pick into oakum, or rough stone to dress for a few coins a day.",
    text: "You put in a hard shift at the bench and earn a couple of coins.",
    solid: true,
    keeps: true,
    special: "work",
    time: 3600,
  },
  {
    id: "ledger",
    name: "Warden's ledger desk",
    art: "ledger",
    verb: "Check your sentence",
    look: "A heavy oak desk with a bound commitment book, inkwell, and wax seals.",
    text: "You scan the commitment book for your entry.",
    solid: true,
    keeps: true,
    special: "ledger",
    time: 60,
  },
];

// Classic ALttP Hyrule Castle dungeon look: slate-violet beveled masonry, warm umber plinth, teal-slate cobbles.
const medievalKeep: PrisonStyle = {
  id: "medieval-keep",
  name: "the castle undercroft",
  label: "Castle Undercroft",
  order: "stone-keep",
  years: [800, 1550],
  cultures: ["european", "north-african-west-asian"],
  coin: ["penny", "pence"],
  warder: { label: "Gaoler", dress: "guard" },
  inmate: { label: "Prisoner", dress: "laborer" },
  enter: "Cold air rises from the cobbled flags as the iron cell gate clangs shut behind you.",
  prompt: /\b(?:dungeon|oubliette|tower of london|castle prison|castle jail|undercroft)\b/i,
  palette: {
    wall: ["#aea8cc", "#867fa8", "#6b648c", "#524c70", "#2a253d"],
    mortar: "#35304c",
    plinth: ["#92684c", "#744f38", "#483022"],
    floor: ["#627e8a", "#4e6874", "#3b525e", "#283944"],
    yard: ["#6e8076", "#58685f", "#404d46"],
    trim: ["#9ca4be", "#707892", "#4e556c", "#2a2f3e"],
    voidFill: ["#766e98", "#5f587f"],
    glow: 0xffc668,
    void: 0x766e98,
  },
  finds: sharedFinds,
};

const debtorsGaol: PrisonStyle = {
  id: "debtors-gaol",
  name: "the debtors' gaol",
  label: "Debtors' Gaol",
  order: "brick-gaol",
  years: [1550, 1845],
  cultures: ["european"],
  feePaying: true,
  coin: ["shilling", "shillings"],
  warder: { label: "Turnkey", dress: "guard" },
  inmate: { label: "Debtor", dress: "clerk" },
  enter: "The iron-studded door slams behind you and the bolt shoots home. The ward smells of damp brick, woodsmoke, and sour ale.",
  prompt: /\b(?:fleet prison|marshalsea|newgate|bastille|debtor'?s? (?:gaol|jail|prison)|debtor in|gaol)\b/i,
  palette: {
    wall: ["#c08c70", "#9e6850", "#82523e", "#633d2e", "#36201a"],
    mortar: "#4a2e24",
    plinth: ["#846c54", "#66523e", "#3e3024"],
    floor: ["#7a8684", "#64706f", "#4f5959", "#373f40"],
    yard: ["#968a76", "#7e7362", "#62594b"],
    trim: ["#8e6a4a", "#6e4e34", "#4f3724", "#2e1f14"],
    voidFill: ["#7a5e54", "#624a42"],
    glow: 0xffca72,
    void: 0x7a5e54,
  },
  finds: sharedFinds,
};

const yamenJail: PrisonStyle = {
  id: "yamen-jail",
  name: "the county yamen jail",
  label: "Yamen Jail",
  order: "yamen-wood",
  years: [600, 1911],
  cultures: ["east-asian"],
  coin: ["cash", "cash"],
  warder: { label: "Yamen runner", dress: "guard" },
  inmate: { label: "Detainee", dress: "clerk" },
  enter: "The heavy wooden bars slide shut behind you. Through the timber lattice you hear clerks shouting in the magistrate's courtyard.",
  prompt: /\b(?:yamen jail|yamen prison|jianyu|imperial prison|magistrate'?s? jail)\b/i,
  palette: {
    wall: ["#9cb4a6", "#7a9686", "#5e786a", "#465c52", "#26342e"],
    mortar: "#34463e",
    plinth: ["#a64638", "#823228", "#501d18"],
    floor: ["#767c8a", "#606675", "#4c5260", "#343945"],
    yard: ["#8d8878", "#757063", "#5c584d"],
    trim: ["#b04c3c", "#8c382c", "#64261e", "#3d1612"],
    voidFill: ["#6c8076", "#566860"],
    glow: 0xffd288,
    void: 0x6c8076,
  },
  finds: sharedFinds,
};

const cellularPenitentiary: PrisonStyle = {
  id: "cellular-penitentiary",
  name: "the penitentiary",
  label: "Penitentiary",
  order: "iron-cellblock",
  years: [1820, 2030],
  coin: ["coin", "coins"],
  warder: { label: "Warder", dress: "guard" },
  inmate: { label: "Convict", dress: "laborer" },
  enter: "The steel cell gate clangs shut and locks with a sharp metallic snap. Boots echo down the iron gallery.",
  prompt: /\b(?:penitentiary|pentonville|alcatraz|cellblock|convict|inmate|prisoner|jail|prison)\b/i,
  palette: {
    wall: ["#a8b89c", "#889a7e", "#6c7e64", "#52624c", "#2c3629"],
    mortar: "#3c4838",
    plinth: ["#68728a", "#4e576c", "#323848"],
    floor: ["#72788c", "#5d6376", "#494e60", "#333745"],
    yard: ["#8a8d88", "#737672", "#5a5d59"],
    trim: ["#8e9eae", "#6a7a8a", "#4b5866", "#2c343e"],
    voidFill: ["#7c8a74", "#64725e"],
    glow: 0xffe4a8,
    void: 0x7c8a74,
  },
  finds: sharedFinds,
};

export const prisonStyles: readonly PrisonStyle[] = [
  medievalKeep,
  debtorsGaol,
  yamenJail,
  cellularPenitentiary,
];

export const prisonStyle = (id: string) => prisonStyles.find((s) => s.id === id);
export const prisonFind = (style: PrisonStyle, id: string) => style.finds.find((f) => f.id === id);

export function prisonAt(lon: number, lat: number, year: number, culture?: CultureId) {
  return (
    prisonStyles.find(
      (s) =>
        year >= s.years[0] &&
        year <= s.years[1] &&
        (!s.cultures || (culture ? s.cultures.includes(culture) : false)) &&
        (!s.where || (lon >= s.where[0] && lat >= s.where[1] && lon <= s.where[2] && lat <= s.where[3])),
    ) ??
    prisonStyles.find(
      (s) =>
        year >= s.years[0] &&
        year <= s.years[1] &&
        !s.cultures &&
        (!s.where || (lon >= s.where[0] && lat >= s.where[1] && lon <= s.where[2] && lat <= s.where[3])),
    )
  );
}

export function prisonFromPrompt(q: string) {
  return prisonStyles.find((s) => s.prompt.test(q));
}
