import type { Pack } from "../../core/types";
import type { PropDef } from "./catalog";

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
/** Trades with a mark of their own. A general shopkeeper, merchant or trader
 * gets none: a board that says only "shop" tells a passer-by nothing. Words
 * match whole, so a swineherd is not a wine seller. */
const trades: [RegExp, number][] = [
  [/\b(fishmonger|fishseller|fishwife)\b/, 7],
  [/\b(bookseller|bookbinder|stationer|printer|scribe)\b/, 8],
  [/\b(tea|teahouse|teaseller|coffee|coffeehouse)\b/, 9],
  [/\b(apothecary|pharmacist|pharmacy|herbalist|spicer)\b/, 10],
  [/\b(moneychanger|banker|goldsmith)\b/, 11],
  [/\b(weaver|draper|mercer|cloth|silk|linen|wool|dyer|fuller)\b/, 12],
  [
    /\b(brewer|brewster|alewife|taverner|innkeeper|vintner|distiller|publican|tapster|ale|beer|wine|cider|mead|tavern|inn|alehouse)\b/,
    0,
  ],
  [
    /\b(tailor|milliner|dressmaker|seamstress|embroiderer|hatter|clothier)\b/,
    1,
  ],
  [
    /\b(blacksmith|smith|farrier|armourer|armorer|cutler|tinsmith|whitesmith|nailer|locksmith|forge|smithy|bladesmith|coppersmith)\b/,
    2,
  ],
  [/\b(baker|confectioner|pastrycook|bakehouse|bakery)\b/, 3],
  [
    /\b(cobbler|shoemaker|leatherworker|saddler|currier|glover|cordwainer)\b/,
    4,
  ],
  [/\b(potter|oilman|oilseller)\b/, 5],
];

export function emblemFor(
  venueKind: string | undefined,
  ...names: (string | undefined)[]
) {
  if (venueKind) return venueGlyphs[venueKind];
  for (const name of names) {
    if (!name) continue;
    const words = name.toLowerCase().replace(/[^a-z]+/g, " ");
    for (const [pattern, glyph] of trades)
      if (pattern.test(words)) return glyph;
  }
  return undefined;
}

/** Which frame a street's trade signs take, if it has any. Premodern only:
 * once shops letter their fronts, a freestanding pictorial board is heritage
 * decoration. Scoped visual interpretations, not dates of invention. */
export function signFor(pack: Pack): { key: string; form: number } | undefined {
  const s = pack.setting;
  if (!s || s.settlement === "camp" || s.settlement === "farm") return;
  if (s.settlement === "village" && pack.year < 1200) return;
  const year = pack.year;
  const pick = (style: (typeof signStyles)[number]) => ({
    key: `signpost-${style}`,
    form: 0,
  });
  // Ottoman lands keep the bazaar's cloth whatever the culture family says.
  if (
    year >= 1453 &&
    year < 1870 &&
    s.lon >= 26 &&
    s.lon <= 44 &&
    s.lat >= 35 &&
    s.lat <= 42
  )
    return pick("bazaar");
  if (s.culture === "european" && year >= 1100 && year < 1800)
    return pick(year >= 1500 ? "painted" : "oak");
  if (s.culture === "east-asian" && year >= 600 && year < 1870)
    return pick(s.lon >= 130 && s.lat >= 30 && s.lat <= 46 ? "split" : "lacquer");
  if (
    (s.culture === "south-asian" || s.culture === "southeast-asian") &&
    year >= 1000 &&
    year < 1870
  )
    return pick("pennant");
  if (
    (s.culture === "north-african-west-asian" ||
      s.culture === "inner-eurasian") &&
    year >= 1000 &&
    year < 1870
  )
    return pick("bazaar");
  return undefined;
}
