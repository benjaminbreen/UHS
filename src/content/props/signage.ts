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
  "Pretzel",
  "Basin",
  "Balls",
  "Key",
  "Glove",
  "Candle",
  "Ox",
  "Saw",
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
      variants: 16,
      solid: true,
      visualClearance: [0, 1, 0, 0] as [number, number, number, number],
    },
  ]),
);

/** Signs hung off the wall beside a door. Those in `MARKED` carry a trade
 * mark and take a variant per label; the rest are one thing each. */
export const wallStyles = [
  "oak", "painted", "cutout", "fascia", "pennant", "bazaar",
  "bush", "barber", "lacquer", "split", "noren", "sugidama", "wineflag",
] as const;
type WallStyle = (typeof wallStyles)[number];
const MARKED = new Set<WallStyle>(["oak", "painted", "cutout", "fascia", "pennant", "bazaar"]);
export const wallSignDefs: Record<string, PropDef> = Object.fromEntries(
  wallStyles.map((style) => [
    `wallsign-${style}`,
    {
      name: "Trade sign",
      family: `wallsign-${style}`,
      variants: MARKED.has(style) ? signLabels.length : 1,
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
  [/\b(barber|barbers|surgeon)\b/, 17],
  [/\b(pawnbroker|pawnshop|lombard)\b/, 18],
  [/\b(locksmith)\b/, 19],
  [/\b(glover)\b/, 20],
  [/\b(chandler|candlemaker|tallowman)\b/, 21],
  [/\b(butcher|flesher|slaughterman)\b/, 22],
  [/\b(carpenter|joiner|cooper|wheelwright|cabinetmaker)\b/, 23],
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

const japan = (lon: number, lat: number) => lon >= 130 && lat >= 30 && lat <= 46;
const china = (lon: number, lat: number) => lon >= 100 && lon < 125 && lat >= 18 && lat <= 45;

/** Which wall sign a street's shops hang, if any. Scoped interpretations,
 * not dates of invention. Rome is left out: its shopfronts carry their
 * painted notices and reliefs in the building art. */
export function signFor(pack: Pack): { key: string; style: WallStyle } | undefined {
  const s = pack.setting;
  if (!s || s.settlement === "camp" || s.settlement === "farm") return;
  if (s.settlement === "village" && pack.year < 1200) return;
  const year = pack.year;
  const pick = (style: WallStyle) => ({ key: `wallsign-${style}`, style });
  // Ottoman lands keep the bazaar's cloth whatever the culture family says.
  if (year >= 1453 && year < 1870 && s.lon >= 26 && s.lon <= 44 && s.lat >= 35 && s.lat <= 42)
    return pick("bazaar");
  if (s.culture === "european" && year >= 1100 && year < 1800) {
    // Paris (1761) and London (1762) had the hanging signs taken down; the
    // name went on a board over the shop until lettered fronts took over.
    if (year >= 1762) return pick("fascia");
    // The gilt cut-out of the German and Low Country trades.
    if (year >= 1500 && s.lon >= 3 && s.lon <= 20 && s.lat >= 46 && s.lat <= 56) return pick("cutout");
    return pick(year >= 1500 ? "painted" : "oak");
  }
  if (s.culture === "east-asian" && year >= 600 && year < 1870) {
    if (japan(s.lon, s.lat)) return pick(year >= 1600 ? "noren" : "split");
    return pick("lacquer");
  }
  if ((s.culture === "south-asian" || s.culture === "southeast-asian") && year >= 1000 && year < 1870)
    return pick("pennant");
  if ((s.culture === "north-african-west-asian" || s.culture === "inner-eurasian") && year >= 1000 && year < 1870)
    return pick("bazaar");
  return undefined;
}

/** The sign one house hangs, from the street's style, its trade's mark and
 * its venue: an English alehouse its ale-stake, a barber his pole and basin,
 * a sake brewer the cedar ball, a Song wine shop its flag, and a baker in
 * German lands the pretzel. */
export function wallSignFor(pack: Pack, street: { style: WallStyle }, emblem: number, venue?: string) {
  const { lon = 0, lat = 0 } = pack.setting ?? {};
  const year = pack.year;
  const drink = venue === "tavern" || emblem === 0;
  let style: WallStyle = street.style;
  let mark = emblem;
  if (venue === "tavern" && lon >= -6 && lon <= 2 && lat >= 50 && lat <= 56 && year >= 1200 && year < 1600) style = "bush";
  else if (emblem === 17 && pack.setting?.culture === "european" && year >= 1500) style = "barber";
  else if (drink && japan(lon, lat) && year >= 1600) style = "sugidama";
  else if (drink && china(lon, lat) && year >= 960) style = "wineflag";
  if (mark === 3 && lon >= 6 && lon <= 17 && lat >= 46 && lat <= 55) mark = 16;
  return { key: `wallsign-${style}`, variant: MARKED.has(style) ? mark : 0 };
}
