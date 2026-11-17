import type { PropDef } from "./catalog";

// The furniture of palaces, halls and Roman houses, as props like any on the map: what can be carried,
// what a shoulder knocks over, what breaks and into what, what holds something, what can be sat on and
// what would burn. `render/fair/palace.ts` draws each by the name after "palace-"; `world/fair.ts` places them.

const fixed = (name: string, kind: string, more: Partial<PropDef> = {}): PropDef => ({ name, family: `palace-${kind}`, solid: true, ...more });
const loose = (name: string, kind: string, more: Partial<PropDef> = {}): PropDef => ({ name, family: `palace-${kind}`, portable: true, ...more });
const stands = (name: string, kind: string, more: Partial<PropDef> = {}): PropDef => ({ name, family: `palace-${kind}`, solid: true, topples: true, ...more });

const defs: PropDef[] = [
  // Carried off.
  loose("Candlestick", "candlestick", { breakable: "metal" }),
  loose("Porcelain vase", "vase", { breakable: "glaze" }),
  loose("Mantel clock", "clock", { breakable: "metal" }),
  loose("Stool", "stool", { seat: 1, burns: "cloth" }),
  loose("Folding stool", "sella", { seat: 1, burns: "cloth" }),
  loose("Jars", "pots", { breakable: "clay" }),
  loose("Quern", "quern"),
  // Knocked over.
  stands("Bust on a pedestal", "bust"),
  stands("Orange tree in a tub", "orange", { burns: "leaf" }),
  stands("Candle stand", "torchere"),
  stands("Lamp stand", "lampstand", { burns: "oil" }),
  stands("Globe", "globe", { breakable: "wood", burns: "wood", act: { verb: "Turn the globe", text: "The coasts are drawn with confidence. The middles of the continents are mostly decoration." } }),
  stands("Marble basin", "labrum", { act: { verb: "Drink from the basin", text: "You drink from the basin and fill what you carry.", water: true } }),
  stands("Small table", "mensa", { burns: "wood" }),
  stands("Chair", "chair", { seat: 1, burns: "cloth" }),
  // Stands where it is put.
  fixed("Pier table", "console-bare", { burns: "wood" }),
  fixed("Bench", "bench", { seat: 3, burns: "cloth" }),
  fixed("Sofa", "sofa", { seat: 3, burns: "cloth" }),
  fixed("Desk", "desk", { burns: "wood", act: { verb: "Read the papers", text: "Petitions, tradesmen's bills, and a list of who is to be seated where.", minutes: 5 } }),
  fixed("Writing table", "tabula", { burns: "paper", act: { verb: "Read the letters", text: "Letters asking for money, letters asking for votes, and the accounts of a farm you have never seen.", minutes: 5 } }),
  fixed("Marble table", "cartibulum"),
  fixed("Couch", "lectus", { seat: 3, burns: "cloth" }),
  fixed("Couch", "lectus-side", { seat: 3, burns: "cloth" }),
  fixed("Strongbox", "arca", { container: true, contents: { coin: 60 } }),
  fixed("Wall bench", "platform", { seat: 3, burns: "wood" }),
  fixed("Board on trestles", "trestle", { burns: "wood" }),
  fixed("High seat", "highseat", { seat: 1, burns: "wood" }),
  fixed("Rack", "rack", { burns: "wood" }),
  fixed("Loom", "loom", { burns: "cloth" }),
];

export const palaceProps: Record<string, PropDef> = Object.fromEntries(defs.map((d) => [d.family, d]));
