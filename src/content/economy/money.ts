import type { CultureId } from "../history/types";

/**
 * What a day's pay is counted in, by place and year. `name` is the item as it
 * sits in a purse; `one` and `many` are what a client counts out, sized so that two to
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
  one: string;
  many: string;
  /** What it is, for someone who has never handled one. */
  about: string;
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
/** The Nanzhao and Dali kingdoms, then Ming Yunnan. */
const YUNNAN = [97.5, 21.5, 105, 28.5] as const;
const DAI_VIET = [102, 17, 108.5, 23.5] as const;
const SIAM = [97.5, 5.5, 106, 21] as const;
const SWAHILI = [38, -11, 42, -1] as const;
const KATANGA = [22, -14, 30, -8] as const;

const table: Money[] = [
  { box: BRITAIN, from: 700, to: 1500, name: "Silver pennies", one: "silver penny", many: "silver pennies", about: "Small, thin silver coins, the only coin most people ever handled." },
  { box: BRITAIN, from: 1500, to: 1971, name: "Shillings", one: "shilling", many: "shillings", about: "Silver coins; twenty made a pound." },
  { box: BRITAIN, from: 1971, to: 10001, name: "Ten-pound notes", one: "ten-pound note", many: "ten-pound notes", about: "Bank of England notes." },
  { box: FRANCE, from: 800, to: 1266, name: "Silver deniers", one: "denier", many: "deniers", about: "Small silver coins, the penny of the Frankish kingdoms." },
  { box: FRANCE, from: 1266, to: 1795, name: "Sous", one: "sou", many: "sous", about: "Coins worth twelve deniers; twenty made a livre." },
  { box: FRANCE, from: 1795, to: 1960, name: "Francs", one: "franc", many: "francs", about: "The silver franc, divided into a hundred centimes." },
  { box: FRANCE, from: 1960, to: 2002, name: "Hundred-franc notes", one: "hundred-franc note", many: "hundred-franc notes", about: "Banque de France notes." },
  { box: ITALY, from: -211, to: 300, name: "Sestertii", one: "sestertius", many: "sestertii", about: "Brass coins; four made a silver denarius." },
  { box: GREECE, from: -600, to: -100, name: "Silver obols", one: "obol", many: "obols", about: "Small silver coins, often carried in the mouth; six made a drachma." },
  { box: ANATOLIA, from: 1330, to: 1844, name: "Akçe", one: "akçe", many: "akçe", about: "Small Ottoman silver coins." },
  { box: CHINA, from: 1949, to: 10001, name: "Ten-yuan notes", one: "ten-yuan note", many: "ten-yuan notes", about: "People's Bank of China notes." },
  { box: CHINA, from: 1912, to: 1949, name: "Silver yuan", one: "silver dollar", many: "silver dollars", about: "Silver yuan coins, called dollars by foreigners." },
  { box: JAPAN, from: 1636, to: 1871, name: "Strings of mon", one: "string of mon", many: "strings of mon", about: "Copper coins with a square hole, threaded a hundred to a cord." },
  { box: JAPAN, from: 1871, to: 1950, name: "Yen", one: "yen", many: "yen", about: "The yen, divided into a hundred sen." },
  { box: JAPAN, from: 1950, to: 10001, name: "Thousand-yen notes", one: "thousand-yen note", many: "thousand-yen notes", about: "Bank of Japan notes." },
  { box: USA, from: 1792, to: 1950, name: "Dollars", one: "dollar", many: "dollars", about: "The US dollar." },
  { box: USA, from: 1950, to: 10001, name: "Ten-dollar bills", one: "ten-dollar bill", many: "ten-dollar bills", about: "Federal Reserve notes." },
  { box: INDONESIA, from: 1950, to: 10001, name: "Rupiah notes", one: "thousand-rupiah note", many: "thousand-rupiah notes", about: "Bank Indonesia notes." },
  { box: INDONESIA, from: 1400, to: 1800, name: "Picis", one: "string of picis", many: "strings of picis", about: "Chinese copper coins and local copies, threaded on cords." },
  // Cowries were Dali's money and stayed Yunnan's small change until the 1650s.
  { box: YUNNAN, from: 738, to: 1650, name: "Cowrie shells", one: "string of cowries", many: "strings of cowries", about: "Small white sea shells from the Maldives, counted out on strings and used as money." },
  // Dinh Bo Linh struck the first Vietnamese coins in 970; Chinese cash circulated alongside.
  { box: DAI_VIET, from: 970, to: 1900, name: "Copper cash", one: "string of cash", many: "strings of cash", about: "Copper coins with a square hole, threaded on cords." },
  // Siam's small change, beside the silver bullet coins too valuable for a day's pay.
  { box: SIAM, from: 1300, to: 1860, name: "Cowrie shells", one: "string of cowries", many: "strings of cowries", about: "Sea shells used as small change; larger sums were paid in silver." },
  { box: SWAHILI, from: 1000, to: 1500, name: "Copper coins", one: "copper coin", many: "copper coins", about: "Small copper coins struck by the sultans of Kilwa and the other coast towns." },
  { box: KATANGA, from: 900, to: 1900, name: "Copper crosses", one: "small copper cross", many: "small copper crosses", about: "Copper cast in an X shape, used as money across the Copperbelt." },
  { cultures: ["european"], from: 2002, to: 10001, name: "Euro notes", one: "twenty-euro note", many: "twenty-euro notes", about: "Euro banknotes." },
  { cultures: ["european", "north-african-west-asian"], from: -600, to: 300, name: "Bronze coins", one: "bronze coin", many: "bronze coins", about: "Small bronze coins, the everyday change." },
  { cultures: ["north-african-west-asian"], from: 690, to: 1900, name: "Silver dirhams", one: "dirham", many: "dirhams", about: "Thin silver coins, struck across the Islamic world." },
  { cultures: ["south-asian"], from: -600, to: 1200, name: "Copper panas", one: "pana", many: "panas", about: "Copper coins, often square and stamped with marks." },
  { cultures: ["south-asian"], from: 1200, to: 1540, name: "Copper jitals", one: "jital", many: "jitals", about: "Small copper and billon coins of the Delhi sultans." },
  { cultures: ["south-asian"], from: 1540, to: 1835, name: "Copper dams", one: "dam", many: "dams", about: "Heavy copper coins; forty made a silver rupee." },
  { cultures: ["south-asian"], from: 1835, to: 1950, name: "Rupees", one: "rupee", many: "rupees", about: "The silver rupee." },
  { cultures: ["south-asian"], from: 1950, to: 10001, name: "Ten-rupee notes", one: "ten-rupee note", many: "ten-rupee notes", about: "Reserve Bank of India notes." },
  { cultures: ["east-asian", "inner-eurasian"], from: -300, to: 1912, name: "Copper cash", one: "string of cash", many: "strings of cash", about: "Copper coins with a square hole, threaded a hundred to a cord." },
  { cultures: ["southeast-asian"], from: 700, to: 1900, name: "Copper cash", one: "string of cash", many: "strings of cash", about: "Copper coins with a square hole, threaded on cords." },
  { cultures: ["west-central-african"], from: 800, to: 1900, name: "Cowries", one: "string of cowries", many: "strings of cowries", about: "Sea shells counted out on strings and used as money." },
  { cultures: ["east-southern-african"], from: 800, to: 1900, name: "Copper ingots", one: "copper ingot", many: "copper ingots", about: "Small cast bars of copper." },
  { cultures: ["andean", "mesoamerican", "other-indigenous-american"], from: 1535, to: 1850, name: "Silver reales", one: "real", many: "reales", about: "Spanish silver coins, sometimes cut into bits." },
  { from: 1900, to: 10001, name: "Banknotes", one: "small note", many: "small notes", about: "Paper money." },
  { from: -10000, to: 10001, name: "Coins", one: "small coin", many: "small coins", about: "Small change." },
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

/** Where nobody uses coin, what a debt or a gift is counted in. */
const STAPLES: { cultures?: readonly CultureId[]; box?: readonly [number, number, number, number]; from?: number; to?: number; one: string; many: string }[] = [
  // Strung shell beads served as money between colonists and Native nations in the Northeast.
  { box: [-80, 38, -66, 47], from: 1620, to: 1720, one: "string of wampum", many: "strings of wampum" },
  // The Hudson's Bay Company kept its accounts in "made beaver", one prime pelt.
  { box: [-140, 45, -55, 65], from: 1670, to: 1870, one: "beaver pelt", many: "beaver pelts" },
  { box: [112, -44, 154, -10], one: "net bag of food", many: "net bags of food" },
  { cultures: ["mesoamerican"], one: "hundred cacao beans", many: "hundred cacao beans" },
  { cultures: ["inner-eurasian"], one: "sheep", many: "sheep" },
  { cultures: ["east-asian", "southeast-asian"], one: "basket of rice", many: "baskets of rice" },
  { cultures: ["south-asian"], one: "measure of rice", many: "measures of rice" },
  { cultures: ["north-african-west-asian"], one: "jar of barley", many: "jars of barley" },
  { cultures: ["other-indigenous-american", "andean"], one: "basket of maize", many: "baskets of maize" },
  { cultures: ["west-central-african", "east-southern-african"], one: "basket of millet", many: "baskets of millet" },
  { cultures: ["australian-pacific"], one: "basket of taro", many: "baskets of taro" },
];

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const count = (n: number, one: string, many: string) => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;

/** "four strings of cash", or "four baskets of rice" where there is no coin. */
export function amountIn(s: { year: number; culture: CultureId; lon: number; lat: number }, n: number, coined: boolean) {
  if (coined) {
    const m = moneyFor(s);
    return count(n, m.one, m.many);
  }
  const staple = STAPLES.find((x) =>
    (!x.cultures || x.cultures.includes(s.culture)) &&
    (!x.box || (s.lon >= x.box[0] && s.lon <= x.box[2] && s.lat >= x.box[1] && s.lat <= x.box[3])) &&
    s.year >= (x.from ?? -Infinity) && s.year < (x.to ?? Infinity));
  return count(n, staple?.one ?? "sack of grain", staple?.many ?? "sacks of grain");
}
