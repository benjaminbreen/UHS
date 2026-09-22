import type { Pack } from "../../core/types";
import type { PropDef } from "./catalog";

/** What a board says: the trade of the house it hangs outside.
 *
 * Seven emblems cover the shops a town has enough of to be worth drawing.
 * A house that sells nothing hangs nothing, so anything unmatched returns
 * undefined and no sign is placed. Matched against the livelihood id the
 * character generator gives the owner, and against the role label for the
 * older packs, which carry no livelihood.
 */
const TRADE_EMBLEMS: string[][] = [
  // Drink. Matched whole word: "swineherd" contains "wine", and a swineherd
  // keeps no tavern.
  [
    "brewer",
    "brewster",
    "alewife",
    "taverner",
    "innkeeper",
    "vintner",
    "distiller",
    "publican",
    "tapster",
    "ale",
    "beer",
    "wine",
    "cider",
    "mead",
    "tavern",
    "inn",
    "alehouse",
    "beerseller",
  ],
  [
    "weaver",
    "spinner",
    "dyer",
    "fuller",
    "tailor",
    "draper",
    "mercer",
    "milliner",
    "dressmaker",
    "seamstress",
    "embroiderer",
    "hatter",
    "clothier",
    "silk",
    "wool",
    "linen",
    "cloth",
    "weaving",
    "felter",
    "carder",
  ],
  [
    "blacksmith",
    "smith",
    "farrier",
    "armourer",
    "armorer",
    "cutler",
    "founder",
    "tinsmith",
    "whitesmith",
    "nailer",
    "locksmith",
    "forge",
    "smithy",
    "bladesmith",
    "coppersmith",
  ],
  ["baker", "miller", "confectioner", "pastrycook", "bakehouse", "bakery"],
  [
    "cobbler",
    "shoemaker",
    "leatherworker",
    "tanner",
    "saddler",
    "currier",
    "glover",
    "cordwainer",
    "harness",
    "leather",
  ],
  [
    "potter",
    "grocer",
    "apothecary",
    "pharmacist",
    "chandler",
    "spicer",
    "merchant",
    "shopkeeper",
    "pedlar",
    "peddler",
    "fishmonger",
    "ironmonger",
    "salter",
    "oilman",
    "trader",
    "spice",
    "spicer",
  ],
];
const TRADE_INDEX = new Map(
  TRADE_EMBLEMS.flatMap((words, index) =>
    words.map((word) => [word, index] as const),
  ),
);
/** The venue kinds that sell something over a counter. The rest of the
 * archetypes — a school, a bath, a lodge — get the bell, which is what a
 * street hung outside anything that was not a shop. */
const VENUE_EMBLEMS: Record<string, number> = {
  tavern: 0,
  "coffee-house": 5,
  market: 5,
};
export function legacyEmblemFor(
  venueKind: string | undefined,
  ...trades: (string | undefined)[]
) {
  if (venueKind) return VENUE_EMBLEMS[venueKind] ?? 6;
  // In order of authority: where the generator gave the owner a livelihood
  // that is the answer, and a generic pack role is not consulted over it.
  for (const trade of trades) {
    if (!trade) continue;
    for (const word of trade.toLowerCase().split(/[^a-z]+/)) {
      const index = word ? TRADE_INDEX.get(word) : undefined;
      if (index !== undefined) return index;
    }
    return undefined;
  }
  return undefined;
}
/** Which shop sign this street hangs, if it hangs one at all.
 *
 * Signage is a market's habit, not a human universal: it wants a street of
 * premises competing for the same passer-by. A hamlet has neither, and a
 * Neolithic one has nothing to write a board in, so it gets nothing. The
 * three families are three regions' answers, and the form within each is
 * mostly the date. Where no sign was drawn, none is hung.
 */
export function legacySignFor(
  pack: Pack,
): { key: string; form: number } | undefined {
  const culture = pack.setting?.culture,
    year = pack.year,
    settlement = pack.setting?.settlement;
  // A market village with a fair and an inn is late; before that a board
  // belongs to a town.
  const market =
    settlement === "city" ||
    settlement === "port" ||
    (settlement === "village" && year >= 1200);
  if (!market) return undefined;
  if (culture === "east-asian" || culture === "southeast-asian")
    return year >= 599
      ? { key: "shopSign", form: culture === "east-asian" ? 0 : 2 }
      : undefined;
  if (culture === "south-asian")
    return year >= 599 ? { key: "shopSign", form: 1 } : undefined;
  // Painted shop signs are a Greek and Roman street habit; the wrought
  // bracket and the ale-stake are the medieval town's.
  // It stops at 1800 because what comes next is lettering, painted across
  // the fascia by people who expect to be read. A hanging trade board on a
  // street of shopfronts is a heritage pub, not a city.
  if (culture === "european")
    return year >= -299 && year < 1800
      ? { key: "shopSignEuro", form: year >= 1100 ? 1 : 0 }
      : undefined;
  // A plaque where there are glazed tiles to make one; otherwise the wares
  // hung at the front, which is what a bazaar mostly did. The pennant belongs
  // to the caravan towns.
  // The open-fronted shop with its stock on show is as old as the bazaar;
  // the form is the trade's, not the century's.
  if (culture === "north-african-west-asian")
    return year >= -999 ? { key: "shopSignSouk", form: 0 } : undefined;
  if (culture === "inner-eurasian")
    return year >= 399 ? { key: "shopSignSouk", form: 0 } : undefined;
  return undefined;
}

export const signLabels = [
  "Jug",
  "Shears",
  "Hammer",
  "Loaf",
  "Boot",
  "Jar",
  "Bell",
  "Fish",
  "Book",
  "Tea cup",
  "Mortar",
  "Scales",
  "Cloth",
  "Bath",
  "Stage",
  "Dice",
] as const;
export const signStyles = [
  "oak",
  "painted",
  "iron",
  "lacquer",
  "split",
  "pennant",
  "bazaar",
] as const;
export const signpostDefs: Record<string, PropDef> = Object.fromEntries(
  signStyles.map((style) => [
    `signpost-${style}`,
    {
      name: "Trade sign",
      family: `signpost-${style}`,
      variants: signLabels.length,
      solid: true,
      visualClearance: [0, 1, 0, 0] as [number, number, number, number],
    },
  ]),
);

const venueGlyphs: Record<string, number> = {
  tavern: 0,
  "coffee-house": 9,
  market: 11,
  school: 8,
  bath: 13,
  theatre: 14,
  assembly: 11,
  lodge: 6,
  "gaming-house": 15,
};
const specificTrades: [RegExp, number][] = [
  [/\b(fishmonger|fishseller)\b/, 7],
  [/\b(bookseller|bookbinder|stationer|printer|scribe)\b/, 8],
  [/\b(tea|teahouse|coffee|coffeehouse)\b/, 9],
  [/\b(apothecary|pharmacist|pharmacy|herbalist)\b/, 10],
  [/\b(weaver|draper|mercer|cloth|silk|linen|wool)\b/, 12],
];

export function emblemFor(
  venueKind: string | undefined,
  ...trades: (string | undefined)[]
) {
  if (venueKind) return venueGlyphs[venueKind];
  for (const trade of trades) {
    if (!trade) continue;
    const words = trade.toLowerCase().replace(/[^a-z]+/g, " ");
    for (const [pattern, glyph] of specificTrades)
      if (pattern.test(words)) return glyph;
    const glyph = legacyEmblemFor(undefined, trade);
    if (glyph !== undefined) return glyph;
  }
  return undefined;
}

// Scoped visual interpretations, not worldwide dates of invention.
export function signFor(pack: Pack): { key: string; form: number } | undefined {
  const s = pack.setting;
  if (!s || s.settlement === "camp" || s.settlement === "farm")
    return;
  if (s.settlement === "village" && pack.year < 1200) return;
  const year = pack.year;
  const pick = (style: (typeof signStyles)[number]) => ({
    key: `signpost-${style}`,
    form: 0,
  });
  if (s.culture === "european" && year >= 1100)
    return pick(year >= 1820 ? "iron" : year >= 1500 ? "painted" : "oak");
  if (s.culture === "east-asian" && year >= 600) {
    if (s.lon >= 130 && s.lat >= 30 && s.lat <= 46) return pick("split");
    return pick("lacquer");
  }
  if (
    (s.culture === "south-asian" || s.culture === "southeast-asian") &&
    year >= 1000
  )
    return pick("pennant");
  if (
    (s.culture === "north-african-west-asian" ||
      s.culture === "inner-eurasian") &&
    year >= 1000
  )
    return pick("bazaar");
  if (
    (s.culture === "other-indigenous-american" ||
      s.culture === "mesoamerican" ||
      s.culture === "andean") &&
    year >= 1800
  )
    return pick("iron");
  if (year >= 1900) return pick("iron");
  return undefined;
}
