import type { CultureId } from "../history/types";

/**
 * What a day's pay is counted in, by place and year. `name` is the item as it
 * sits in a purse; `unit` is what a client counts out, sized so that two to
 * five of them is about a labourer's day. First match wins, so narrow boxes
 * come before the culture-wide rows. Educated guesses from the usual small
 * change of each time and place, not a price history.
 */
type Money = {
  from: number;
  to: number;
  cultures?: readonly CultureId[];
  /** lon/lat: west, south, east, north. */
  box?: readonly [number, number, number, number];
  name: string;
  unit: string;
};

const BRITAIN = [-8, 49.5, 2, 59] as const;
const FRANCE = [-5, 42, 8, 51] as const;
const ITALY = [6, 36, 19, 47] as const;
const GREECE = [19, 34, 30, 42] as const;
const ANATOLIA = [26, 36, 45, 42.5] as const;
const CHINA = [97, 18, 125, 45] as const;
const JAPAN = [129, 30, 146, 46] as const;
const USA = [-125, 24, -66, 50] as const;
const INDONESIA = [95, -11, 141, 6] as const;

const table: Money[] = [
  { box: BRITAIN, from: 700, to: 1500, name: "Silver pennies", unit: "silver pennies" },
  { box: BRITAIN, from: 1500, to: 1971, name: "Shillings", unit: "shillings" },
  { box: BRITAIN, from: 1971, to: 10001, name: "Ten-pound notes", unit: "ten-pound notes" },
  { box: FRANCE, from: 800, to: 1266, name: "Silver deniers", unit: "deniers" },
  { box: FRANCE, from: 1266, to: 1795, name: "Sous", unit: "sous" },
  { box: FRANCE, from: 1795, to: 1960, name: "Francs", unit: "francs" },
  { box: FRANCE, from: 1960, to: 2002, name: "Hundred-franc notes", unit: "hundred-franc notes" },
  { box: ITALY, from: -211, to: 300, name: "Sestertii", unit: "sestertii" },
  { box: GREECE, from: -600, to: -100, name: "Silver obols", unit: "obols" },
  { box: ANATOLIA, from: 1330, to: 1844, name: "Akçe", unit: "akçe" },
  { box: CHINA, from: 1949, to: 10001, name: "Ten-yuan notes", unit: "ten-yuan notes" },
  { box: CHINA, from: 1912, to: 1949, name: "Silver yuan", unit: "yuan" },
  { box: JAPAN, from: 1636, to: 1871, name: "Strings of mon", unit: "strings of a hundred mon" },
  { box: JAPAN, from: 1871, to: 1950, name: "Yen", unit: "yen" },
  { box: JAPAN, from: 1950, to: 10001, name: "Thousand-yen notes", unit: "thousand-yen notes" },
  { box: USA, from: 1792, to: 1950, name: "Dollars", unit: "dollars" },
  { box: USA, from: 1950, to: 10001, name: "Ten-dollar bills", unit: "ten-dollar bills" },
  { box: INDONESIA, from: 1950, to: 10001, name: "Rupiah notes", unit: "thousand-rupiah notes" },
  { box: INDONESIA, from: 1400, to: 1800, name: "Picis", unit: "strings of picis" },
  { cultures: ["european"], from: 2002, to: 10001, name: "Euro notes", unit: "twenty-euro notes" },
  { cultures: ["european", "north-african-west-asian"], from: -600, to: 300, name: "Bronze coins", unit: "bronze coins" },
  { cultures: ["north-african-west-asian"], from: 690, to: 1900, name: "Silver dirhams", unit: "dirhams" },
  { cultures: ["south-asian"], from: -600, to: 1200, name: "Copper panas", unit: "panas" },
  { cultures: ["south-asian"], from: 1200, to: 1540, name: "Copper jitals", unit: "jitals" },
  { cultures: ["south-asian"], from: 1540, to: 1835, name: "Copper dams", unit: "dams" },
  { cultures: ["south-asian"], from: 1835, to: 1950, name: "Rupees", unit: "rupees" },
  { cultures: ["south-asian"], from: 1950, to: 10001, name: "Ten-rupee notes", unit: "ten-rupee notes" },
  { cultures: ["east-asian", "inner-eurasian"], from: -300, to: 1912, name: "Copper cash", unit: "strings of a hundred cash" },
  { cultures: ["southeast-asian"], from: 700, to: 1900, name: "Copper cash", unit: "strings of cash" },
  { cultures: ["west-central-african"], from: 800, to: 1900, name: "Cowries", unit: "strings of cowries" },
  { cultures: ["east-southern-african"], from: 800, to: 1900, name: "Copper ingots", unit: "copper ingots" },
  { cultures: ["andean", "mesoamerican", "other-indigenous-american"], from: 1535, to: 1850, name: "Silver reales", unit: "reales" },
  { from: 1900, to: 10001, name: "Banknotes", unit: "small notes" },
  { from: -10000, to: 10001, name: "Coins", unit: "small coins" },
];

export function moneyFor(s: { year: number; culture: CultureId; lon: number; lat: number }) {
  return table.find(
    (m) =>
      s.year >= m.from &&
      s.year < m.to &&
      (!m.cultures || m.cultures.includes(s.culture)) &&
      (!m.box || (s.lon >= m.box[0] && s.lon <= m.box[2] && s.lat >= m.box[1] && s.lat <= m.box[3])),
  )!;
}
