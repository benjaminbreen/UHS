/** What a shop writes over its door.
 *
 * Signage in a Latin alphabet is a modern habit and a regional one: the word
 * is the trade's, the language is the street's, and often enough the name is
 * the family's. Arabic, Persian, Chinese, Japanese, Korean and Devanagari come
 * as bitmaps rendered offline from sign-words.json; Russian uses the runtime
 * font's Cyrillic. A street whose language is not written here keeps its
 * picture boards (`content/props/signage.ts`) instead.
 */
import type { WorldSetting } from "../geography/types";
import SCRIPT_WORDS from "./sign-words.json" with { type: "json" };

export type SignLanguage =
  | "en" | "fr" | "nl" | "es" | "pt" | "id" | "tr" | "sw" | "ru" | "de" | "it" | "pl" | "sv" | "da"
  | "ar" | "fa" | "he" | "zh" | "zhs" | "ja" | "hi" | "bn" | "ko";
export const SCRIPTED = new Set<SignLanguage>(["ar", "fa", "he", "zh", "zhs", "ja", "hi", "bn", "ko"]);

/** Which language a modern street writes in.
 *
 * Dates matter as much as places: Turkish takes the Latin alphabet in 1928,
 * Indonesian spelling is Dutch-era before independence, and a colonial capital
 * signs in the metropole's language whatever is spoken in the market.
 */
export function signLanguage(setting: WorldSetting): SignLanguage | undefined {
  const { culture, lon, lat, year } = setting;
  if (year < 1800) return undefined;
  const box = (w: number, e: number, s: number, n: number) =>
    lon >= w && lon <= e && lat >= s && lat <= n;
  // The Hindi belt and Bombay sign in Devanagari, Bengal in Bengali; Gujarati,
  // the Dravidian scripts and Urdu are not drawn yet.
  if (culture === "south-asian") {
    if (year < 1900) return undefined;
    if (box(85.8, 92.7, 20.6, 27.3)) return "bn";
    return box(72.5, 88, 18.8, 31) ? "hi" : undefined;
  }
  if (culture === "east-asian") {
    if (box(128, 146, 30, 46)) return year >= 1870 ? "ja" : undefined;
    if (box(124, 131, 33, 43)) return year >= 1945 ? "ko" : year >= 1910 ? "ja" : undefined;
    return year < 1850 ? undefined : box(73, 135, 18, 54) && year >= 1956 && !box(113.8, 114.5, 22.1, 22.6) ? "zhs" : "zh";
  }
  if (culture === "north-african-west-asian") {
    if (box(26, 45, 36, 42)) return year >= 1928 ? "tr" : undefined;
    if (box(34.2, 35.7, 29.4, 33.3) && year >= 1948) return "he";
    if (year < 1850) return undefined;
    // Iran and Afghanistan; Iraq, Kuwait and the Gulf states write Arabic.
    return box(48.5, 75, 27, 40) || box(46, 48.5, 34, 40) ? "fa" : "ar";
  }
  if (culture === "southeast-asian")
    return box(95, 120, -11, 7) || box(99, 105, 1, 7) ? "id" : undefined;
  if (culture === "west-central-african") {
    // Nigeria, Ghana, Sierra Leone, Liberia and the Gambia sign in English.
    if (box(2.7, 14.7, 4, 13.9) || box(-3.3, 1.2, 4.7, 11.2) || box(-13.3, -7.4, 4.3, 10) || box(-16.9, -13.8, 13, 13.9))
      return "en";
    return box(-18, 16, 4, 17) ? "fr" : box(11, 24, -18, -4) ? "pt" : "en";
  }
  if (culture === "east-southern-african")
    return box(29, 42, -12, 5) ? "sw" : box(30, 41, -27, -10) ? "pt" : "en";
  if (culture === "mesoamerican" || culture === "andean") return "es";
  if (culture === "european") {
    if (box(-74, -34, -34, 6)) return "pt"; // Brazil
    if (box(-118, -34, -56, 25) && !box(-100, -60, 25, 50)) return "es";
    if (box(-74.5, -57, 45, 53)) return "fr"; // Quebec
    if (box(27, 180, 41.5, 75) || box(22.3, 27, 41.2, 44.2)) return "ru"; // Russia and the Slavic east; Bulgaria
    if (lon < -30 || lon > 60 || lat < 34 || box(-10.7, 1.8, 49.8, 60.9)) return "en";
    if (box(3.3, 7.3, 51.2, 53.6)) return "nl"; // the Netherlands and Flanders
    // Alsace and Lorraine letter in German while they are German.
    if (box(5.9, 7.8, 47.4, 49.6) && lat < 49.1) return year >= 1871 && year < 1919 ? "de" : "fr";
    // Silesia, Pomerania and East Prussia letter in German until 1945; Kaliningrad in Russian after.
    if (box(14.1, 24.2, 49, 54.9)) {
      if (year >= 1945) return lat > 54.3 && lon > 19.6 ? "ru" : "pl";
      return lon >= 17.5 && lat <= 54 ? "pl" : "de";
    }
    if (box(5.9, 15.1, 47.3, 55.1) || box(9.5, 17.2, 46.4, 49)) return "de";
    if (box(-5, 8, 42, 51)) return "fr";
    if (box(-9.6, -6.2, 36.9, 42.2)) return "pt";
    if (box(-10, 4, 36, 44)) return "es";
    if (box(6.6, 13.9, 43.7, 47.1) || box(8, 16.2, 40, 43.7) || box(12.4, 18.6, 36.6, 42) || box(8, 10, 38.8, 41.3))
      return "it";
    // Denmark, and Norway, which wrote Danish until 1907 and something close to it after.
    if (box(8, 12.75, 54.5, 57.8) || (lat > 57.9 && lat < 71 && lon < 11.8)) return "da";
    if (box(11.8, 24.2, 55.3, 69.1)) return "sv";
    // Greece, the Balkans, Hungary, the Czech lands, Romania, Finland and the
    // Baltic keep their picture boards until their languages are written here.
    return undefined;
  }
  return "en";
}

/** Trade words, shortest first: the renderer takes the first that fits the
 * board, so a 3-cell shopfront gets PAIN and a wide one BOULANGER. */
const WORDS: Record<string, Partial<Record<SignLanguage, string[]>>> = {
  "corner store": {
    en: ["MART", "STORE", "SUNDRIES"],
    fr: ["EPICERIE"],
    nl: ["WINKEL"],
    es: ["TIENDA", "ABARROTES"],
    pt: ["VENDA", "MERCEARIA"],
    id: ["TOKO", "WARUNG"],
    tr: ["BAKKAL"],
    sw: ["DUKA"],
    ru: ["МАГАЗИН"],
  },
  grocery: {
    en: ["FOODS", "GROCERY"],
    fr: ["EPICERIE"],
    nl: ["KRUIDENIER"],
    es: ["TIENDA", "ABARROTES"],
    pt: ["MERCEARIA"],
    id: ["TOKO", "SEMBAKO"],
    tr: ["BAKKAL"],
    sw: ["DUKA"],
    ru: ["ПРОДУКТЫ"],
  },
  "neighborhood market": {
    en: ["MARKET", "MART"],
    fr: ["MARCHE"],
    nl: ["MARKT"],
    es: ["MERCADO"],
    pt: ["MERCADO"],
    id: ["PASAR"],
    tr: ["PAZAR"],
    sw: ["SOKO"],
    ru: ["РЫНОК"],
  },
  bakery: {
    en: ["BAKERY"],
    fr: ["PAIN", "BOULANGER"],
    nl: ["BROOD", "BAKKER"],
    es: ["PAN", "PANADERIA"],
    pt: ["PADARIA"],
    id: ["ROTI"],
    tr: ["FIRIN"],
    sw: ["MKATE"],
    ru: ["ХЛЕБ", "БУЛОЧНАЯ"],
  },
  cafe: {
    en: ["CAFE", "COFFEE"],
    fr: ["CAFE", "BRASSERIE"],
    nl: ["CAFE", "KOFFIEHUIS"],
    es: ["CAFE"],
    pt: ["CAFE"],
    id: ["KOPI", "WARUNG"],
    tr: ["KAHVE"],
    sw: ["KAHAWA"],
    ru: ["КАФЕ"],
  },
  diner: {
    en: ["EATS", "DINER", "GRILL"],
    fr: ["RESTO"],
    nl: ["EETHUIS"],
    es: ["FONDA", "COMIDAS"],
    pt: ["LANCHES"],
    id: ["MAKAN", "WARUNG"],
    tr: ["LOKANTA"],
    sw: ["CHAKULA"],
    ru: ["СТОЛОВАЯ"],
  },
  pharmacy: {
    en: ["DRUGS", "RX"],
    fr: ["PHARMACIE"],
    nl: ["APOTHEEK"],
    es: ["FARMACIA"],
    pt: ["FARMACIA"],
    id: ["APOTIK"],
    tr: ["ECZANE"],
    sw: ["DAWA"],
    ru: ["АПТЕКА"],
  },
  clinic: {
    en: ["CLINIC"],
    fr: ["CLINIQUE"],
    nl: ["KLINIEK"],
    es: ["CLINICA"],
    pt: ["CLINICA"],
    id: ["KLINIK"],
    tr: ["KLINIK"],
    sw: ["ZAHANATI"],
    ru: ["ПОЛИКЛИНИКА"],
  },
  "auto workshop": {
    en: ["GARAGE", "AUTO"],
    fr: ["GARAGE"],
    nl: ["GARAGE"],
    es: ["TALLER"],
    pt: ["OFICINA"],
    id: ["BENGKEL"],
    tr: ["TAMIR"],
    sw: ["GARAJI"],
    ru: ["РЕМОНТ", "АВТОСЕРВИС"],
  },
  "gas station": {
    en: ["GAS", "FUEL"],
    fr: ["ESSENCE"],
    nl: ["BENZINE"],
    es: ["GASOLINA"],
    pt: ["POSTO"],
    id: ["BENSIN"],
    tr: ["BENZIN"],
    sw: ["PETROLI"],
    ru: ["АЗС", "БЕНЗИН"],
  },
  laundromat: {
    en: ["WASH", "LAUNDRY"],
    fr: ["LAVERIE"],
    nl: ["WASSERIJ"],
    es: ["LAVANDERIA"],
    pt: ["LAVANDARIA"],
    id: ["BINATU"],
    tr: ["CAMASIR"],
    sw: ["DOBI"],
    ru: ["ПРАЧЕЧНАЯ"],
  },
  "donut shop": { en: ["DONUTS"] },
  motel: {
    en: ["MOTEL", "ROOMS"],
    fr: ["HOTEL"],
    nl: ["HOTEL"],
    es: ["HOTEL"],
    pt: ["HOTEL"],
    id: ["LOSMEN", "PENGINAPAN"],
    tr: ["OTEL"],
    sw: ["HOTELI"],
    ru: ["ГОСТИНИЦА"],
  },
  barber: {
    en: ["BARBER"],
    fr: ["COIFFEUR"],
    nl: ["KAPPER"],
    es: ["BARBERIA"],
    pt: ["BARBEARIA"],
    id: ["CUKUR"],
    tr: ["BERBER"],
    sw: ["KINYOZI"],
    ru: ["ПАРИКМАХЕРСКАЯ"],
  },
  hardware: {
    en: ["HARDWARE", "TOOLS"],
    fr: ["QUINCAILLERIE"],
    nl: ["IJZERWAREN"],
    es: ["FERRETERIA"],
    pt: ["FERRAGENS"],
    id: ["BESI"],
    tr: ["HIRDAVAT"],
    sw: ["VYOMA"],
    ru: ["ХОЗТОВАРЫ"],
  },
  tailor: {
    en: ["TAILOR"],
    fr: ["TAILLEUR"],
    nl: ["KLEERMAKER"],
    es: ["SASTRE"],
    pt: ["ALFAIATE"],
    id: ["PENJAHIT"],
    tr: ["TERZI"],
    sw: ["FUNDI"],
    ru: ["АТЕЛЬЕ"],
  },
  shoes: { en: ["SHOES"], fr: ["CHAUSSURES"], nl: ["SCHOENEN"], es: ["ZAPATOS"], pt: ["SAPATOS"], tr: ["AYAKKABI"], ru: ["ОБУВЬ"] },
  jeweler: { en: ["JEWELRY", "WATCHES"], fr: ["BIJOUX"], nl: ["JUWELIER"], es: ["JOYERIA"], pt: ["JOIAS"], tr: ["KUYUMCU"], ru: ["ЧАСЫ"] },
  radio: { en: ["RADIO", "TV"], fr: ["RADIO"], nl: ["RADIO"], es: ["RADIO"], pt: ["RADIO"], tr: ["RADYO"], sw: ["REDIO"], ru: ["РАДИО"] },
  books: { en: ["BOOKS"], fr: ["LIBRAIRIE"], nl: ["BOEKEN"], es: ["LIBROS"], pt: ["LIVROS"], tr: ["KITAP"], sw: ["VITABU"], ru: ["КНИГИ"] },
  butcher: { en: ["MEATS", "BUTCHER"], fr: ["BOUCHERIE"], nl: ["SLAGER"], es: ["CARNES"], pt: ["ACOUGUE"], tr: ["KASAP"], sw: ["NYAMA"], ru: ["МЯСО"] },
  sweets: { en: ["CANDY", "SWEETS"], fr: ["PATISSERIE"], nl: ["BANKET"], es: ["DULCES"], pt: ["DOCES"], tr: ["TATLI"], ru: ["КОНДИТЕРСКАЯ"] },
  juice: { en: ["JUICE"], fr: ["JUS"], nl: ["SAP"], es: ["JUGOS"], pt: ["SUCOS"], tr: ["MEYVE SUYU"], sw: ["JUISI"], ru: ["СОКИ"] },
  bank: { en: ["BANK", "SAVINGS"], fr: ["BANQUE"], nl: ["BANK"], es: ["BANCO"], pt: ["BANCO"], id: ["BANK"], tr: ["BANKA"], sw: ["BENKI"], ru: ["СБЕРКАССА"] },
  /** Anything that only says it is open for business. */
  shop: {
    en: ["SHOP", "STORE"],
    fr: ["MAGASIN"],
    nl: ["WINKEL"],
    es: ["TIENDA"],
    pt: ["LOJA"],
    id: ["TOKO"],
    tr: ["DUKKAN"],
    sw: ["DUKA"],
    ru: ["МАГАЗИН"],
  },
};

// Words kept apart by language only so the table above stays readable.
const MORE: Partial<Record<SignLanguage, Record<string, string[]>>> = {
  de: {
    "corner store": ["LADEN"], grocery: ["KOLONIALWAREN", "LEBENSMITTEL"], "neighborhood market": ["MARKT", "MARKTHALLE"],
    bakery: ["BROT", "BACKWAREN"], cafe: ["CAFE", "KAFFEEHAUS"], diner: ["IMBISS", "GASTHAUS"], pharmacy: ["APOTHEKE"],
    clinic: ["KLINIK", "PRAXIS"], "auto workshop": ["GARAGE", "WERKSTATT"], "gas station": ["BENZIN", "TANKSTELLE"],
    laundromat: ["WASCHSALON"], motel: ["HOTEL", "PENSION"], barber: ["FRISEUR"], hardware: ["EISENWAREN"],
    tailor: ["SCHNEIDER"], shoes: ["SCHUHE"], jeweler: ["UHREN", "JUWELIER"], radio: ["RADIO"], books: ["BUCHHANDLUNG"],
    butcher: ["FLEISCH", "METZGEREI"], sweets: ["KONDITOREI"], juice: ["SAFT"], bank: ["BANK", "SPARKASSE"], shop: ["LADEN"],
  },
  it: {
    "corner store": ["BOTTEGA", "ALIMENTARI"], grocery: ["ALIMENTARI", "SALUMERIA"], "neighborhood market": ["MERCATO"],
    bakery: ["PANE", "FORNO", "PANIFICIO"], cafe: ["BAR", "CAFFE"], diner: ["OSTERIA", "TRATTORIA"], pharmacy: ["FARMACIA"],
    clinic: ["CLINICA"], "auto workshop": ["OFFICINA"], "gas station": ["BENZINA"], laundromat: ["LAVANDERIA"],
    motel: ["HOTEL", "ALBERGO"], barber: ["BARBIERE"], hardware: ["FERRAMENTA"], tailor: ["SARTO", "SARTORIA"],
    shoes: ["SCARPE", "CALZATURE"], jeweler: ["OREFICE", "GIOIELLERIA"], radio: ["RADIO"], books: ["LIBRI", "LIBRERIA"],
    butcher: ["CARNI", "MACELLERIA"], sweets: ["DOLCI", "PASTICCERIA"], juice: ["SUCCHI"], bank: ["BANCA"],
    shop: ["NEGOZIO", "BOTTEGA"],
  },
  pl: {
    "corner store": ["SKLEP"], grocery: ["SPOŻYWCZY", "KOLONIALNE"], "neighborhood market": ["TARG", "HALA"],
    bakery: ["CHLEB", "PIEKARNIA"], cafe: ["KAWA", "KAWIARNIA"], diner: ["BAR", "RESTAURACJA"], pharmacy: ["APTEKA"],
    clinic: ["PRZYCHODNIA"], "auto workshop": ["WARSZTAT"], "gas station": ["BENZYNA", "STACJA"], laundromat: ["PRALNIA"],
    motel: ["HOTEL"], barber: ["FRYZJER"], hardware: ["NARZĘDZIA"], tailor: ["KRAWIEC"], shoes: ["OBUWIE"],
    jeweler: ["JUBILER", "ZEGARMISTRZ"], radio: ["RADIO"], books: ["KSIĘGARNIA"], butcher: ["MIĘSO", "RZEŹNIK"],
    sweets: ["CUKIERNIA"], juice: ["SOKI"], bank: ["BANK"], shop: ["SKLEP"],
  },
  sv: {
    "corner store": ["LIVS", "HANDEL"], grocery: ["LIVS", "SPECERIER"], "neighborhood market": ["TORG", "SALUHALL"],
    bakery: ["BAGERI"], cafe: ["KAFE", "KONDITORI"], diner: ["MATSAL", "SERVERING"], pharmacy: ["APOTEK"],
    clinic: ["KLINIK"], "auto workshop": ["VERKSTAD"], "gas station": ["BENSIN"], laundromat: ["TVÄTT"],
    motel: ["HOTELL"], barber: ["FRISÖR"], hardware: ["JÄRNHANDEL"], tailor: ["SKRÄDDARE"], shoes: ["SKOR"],
    jeweler: ["UR", "GULDSMED"], radio: ["RADIO"], books: ["BOKHANDEL"], butcher: ["KÖTT", "SLAKTARE"],
    sweets: ["GODIS", "KONDITORI"], juice: ["JUICE"], bank: ["BANK", "SPARBANK"], shop: ["BUTIK", "HANDEL"],
  },
  da: {
    "corner store": ["KIOSK", "HANDEL"], grocery: ["KOLONIAL", "KØBMAND"], "neighborhood market": ["TORV"],
    bakery: ["BAGER", "BAGERI"], cafe: ["CAFE", "KONDITORI"], diner: ["KRO", "SPISEHUS"], pharmacy: ["APOTEK"],
    clinic: ["KLINIK"], "auto workshop": ["AUTO", "VÆRKSTED"], "gas station": ["BENZIN"], laundromat: ["VASKERI"],
    motel: ["HOTEL", "PENSIONAT"], barber: ["FRISØR"], hardware: ["ISENKRAM"], tailor: ["SKRÆDDER"], shoes: ["SKO"],
    jeweler: ["URMAGER", "GULDSMED"], radio: ["RADIO"], books: ["BØGER", "BOGHANDEL"], butcher: ["SLAGTER"],
    sweets: ["SLIK"], juice: ["SAFT"], bank: ["BANK", "SPAREKASSE"], shop: ["BUTIK"],
  },
};
for (const [language, trades] of Object.entries(MORE))
  for (const [trade, words] of Object.entries(trades)) (WORDS[trade] ??= {})[language as SignLanguage] = words;

/** The first year a trade, or a word for it, belongs on a street. */
const TRADE_FROM: Record<string, number> = {
  "auto workshop": 1900, "gas station": 1905, "donut shop": 1920, radio: 1922, motel: 1925, laundromat: 1934, juice: 1950,
};
const WORD_FROM: Record<string, number> = { TV: 1950, MART: 1930, "АЗС": 1930, "АВТОСЕРВИС": 1960, BAR: 1920 };

/** Shops a builder leaves unnamed take one of these. */
const STREET_TRADES = [
  "grocery", "cafe", "bakery", "barber", "tailor", "hardware", "pharmacy", "shop",
  "shoes", "jeweler", "radio", "books", "butcher", "sweets", "juice",
];
export function streetTrade(year: number, roll: number): string {
  const open = STREET_TRADES.filter((trade) => (TRADE_FROM[trade] ?? 0) <= year);
  return open[Math.floor(roll * open.length)];
}

/** Trades a family puts its own name over. A gas station is a brand; a tailor
 * is a person. */
const PERSONAL = new Set([
  "grocery",
  "corner store",
  "bakery",
  "pharmacy",
  "auto workshop",
  "barber",
  "hardware",
  "tailor",
  "cafe",
  "diner",
  "clinic",
]);

/** The words this shop could write, shortest first. The caller takes the first
 * that fits its board, so the same trade reads differently on a narrow
 * frontage and a wide one. */
export function signOptions(
  trade: string,
  language: SignLanguage | undefined,
  year: number,
  surname?: string,
  personal = false,
): string[] {
  if (!language || (TRADE_FROM[trade] ?? 0) > year) return [];
  const scripted = (SCRIPT_WORDS as unknown as Record<string, Partial<Record<SignLanguage, string[]>>>)[trade]?.[language];
  if (SCRIPTED.has(language)) return scripted ? [...scripted] : [];
  const words = (WORDS[trade]?.[language] ?? WORDS.shop[language] ?? WORDS[trade]?.en ?? [])
    .filter((word) => (WORD_FROM[word] ?? 0) <= year)
    .sort((a, b) => a.length - b.length);
  // Soviet shops belonged to the state; a merchant before 1918 hung his name.
  if (surname && personal && PERSONAL.has(trade) && !(language === "ru" && year >= 1918)) return [surname, ...words];
  return words;
}

/** A second language some boards on the street are written in, and how many:
 * French and then English on Cairo's shopfronts, English in Hong Kong. */
export function secondLanguage(setting: WorldSetting): [SignLanguage, number] | undefined {
  const first = signLanguage(setting);
  if (first === "ar" || first === "fa") return [setting.year < 1952 ? "fr" : "en", 0.14];
  if (first === "zh" && setting.lon > 113.8 && setting.lon < 114.5) return ["en", 0.25];
  if (first === "ja") return ["en", 0.1];
  if (first === "hi" || first === "bn") return ["en", 0.45];
  if (first === "he") return ["en", 0.25];
  return undefined;
}

/** Board paints a street chooses from: hex, painted wood or enamel. */
export function signPaints(setting: WorldSetting): string[] {
  const first = signLanguage(setting);
  if (first === "ar" || first === "fa") return ["#2f6b4f", "#b33a2e", "#2a4f8f", "#e0b23c", "#ece4cf", "#1f6f74", "#6b3a2a"];
  if (first === "zh" || first === "zhs") return ["#b8262c", "#1d5a3a", "#d9a632", "#1e3557", "#f2e8d0", "#2b2b2b"];
  if (first === "ja") return ["#f2ecdc", "#1f3b6a", "#c43c2e", "#2e6b4a", "#e9c54a", "#30303a"];
  if (first === "hi" || first === "bn") return ["#e8b730", "#b8302a", "#f1ead6", "#1f4e8c", "#2e7a4a", "#d2602a"];
  if (first === "ko") return ["#f3f0e6", "#1f4a8a", "#c0392b", "#2f7a52", "#f0c43a"];
  if (first === "ru") return ["#2c4a7a", "#a8322b", "#ece6d6", "#3d6b4a", "#5a5a64"];
  return ["#2f5d4a", "#9c3528", "#2b4a7a", "#d8a43b", "#ebe2cb", "#35353f", "#7a3b5e", "#c8642c"];
}

export function takesPersonalName(trade: string): boolean {
  return PERSONAL.has(trade);
}
