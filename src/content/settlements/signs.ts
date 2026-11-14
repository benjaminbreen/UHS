/** What a shop writes over its door.
 *
 * Signage in a Latin alphabet is a modern habit and a regional one: the word
 * is the trade's, the language is the street's, and often enough the name is
 * the family's. Scripts this 3x5 font cannot draw — Chinese, Arabic,
 * Devanagari, Thai — get no lettering at all; those streets already hang their
 * own painted boards from the prop kit, which is the right answer there.
 * Arabic, Persian, Chinese and Japanese come as bitmaps rendered offline from
 * sign-words.json; Russian uses the runtime font's Cyrillic.
 */
import type { WorldSetting } from "../geography/types";
import SCRIPT_WORDS from "./sign-words.json" with { type: "json" };

export type SignLanguage =
  "en" | "fr" | "nl" | "es" | "pt" | "id" | "tr" | "sw" | "ru" | "ar" | "fa" | "zh" | "zhs" | "ja" | "hi" | "ko";
export const SCRIPTED = new Set<SignLanguage>(["ar", "fa", "zh", "zhs", "ja", "hi", "ko"]);

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
  // The Hindi belt and Bombay sign in Devanagari; Bengali, Gujarati, the
  // Dravidian scripts and Urdu are not drawn yet.
  if (culture === "south-asian") return year >= 1900 && box(72.5, 88, 18.8, 31) ? "hi" : undefined;
  if (culture === "east-asian") {
    if (box(128, 146, 30, 46)) return year >= 1870 ? "ja" : undefined;
    if (box(124, 131, 33, 43)) return year >= 1945 ? "ko" : year >= 1910 ? "ja" : undefined;
    return year < 1850 ? undefined : box(73, 135, 18, 54) && year >= 1956 && !box(113.8, 114.5, 22.1, 22.6) ? "zhs" : "zh";
  }
  if (culture === "north-african-west-asian") {
    if (box(26, 45, 36, 42)) return year >= 1928 ? "tr" : undefined;
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
    if (box(27, 180, 41.5, 75) || box(22, 27, 41, 45)) return "ru"; // Russia and the Slavic east; Bulgaria
    if (box(-74, -34, -34, 6)) return "pt"; // Brazil
    if (box(-118, -34, -56, 25) && !box(-100, -60, 25, 50)) return "es";
    if (box(3.3, 7.3, 51.2, 53.6)) return "nl"; // the Netherlands and Flanders
    if (box(-5, 8, 42, 51)) return "fr";
    if (box(-10, 4, 36, 44)) return "es";
    return "en";
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
  surname?: string,
  personal = false,
): string[] {
  if (!language) return [];
  const scripted = (SCRIPT_WORDS as unknown as Record<string, Partial<Record<SignLanguage, string[]>>>)[trade]?.[language];
  if (SCRIPTED.has(language)) return scripted ? [...scripted] : [];
  const words = [...(WORDS[trade]?.[language] ?? WORDS[trade]?.en ?? [])].sort(
    (a, b) => a.length - b.length,
  );
  if (surname && personal && PERSONAL.has(trade) && language !== "ru") return [surname, ...words];
  return words;
}

/** A second language some boards on the street are written in, and how many:
 * French and then English on Cairo's shopfronts, English in Hong Kong. */
export function secondLanguage(setting: WorldSetting): [SignLanguage, number] | undefined {
  const first = signLanguage(setting);
  if (first === "ar" || first === "fa") return [setting.year < 1952 ? "fr" : "en", 0.14];
  if (first === "zh" && setting.lon > 113.8 && setting.lon < 114.5) return ["en", 0.25];
  if (first === "ja") return ["en", 0.1];
  if (first === "hi") return ["en", 0.45];
  return undefined;
}

/** Board paints a street chooses from: hex, painted wood or enamel. */
export function signPaints(setting: WorldSetting): string[] {
  const first = signLanguage(setting);
  if (first === "ar" || first === "fa") return ["#2f6b4f", "#b33a2e", "#2a4f8f", "#e0b23c", "#ece4cf", "#1f6f74", "#6b3a2a"];
  if (first === "zh" || first === "zhs") return ["#b8262c", "#1d5a3a", "#d9a632", "#1e3557", "#f2e8d0", "#2b2b2b"];
  if (first === "ja") return ["#f2ecdc", "#1f3b6a", "#c43c2e", "#2e6b4a", "#e9c54a", "#30303a"];
  if (first === "hi") return ["#e8b730", "#b8302a", "#f1ead6", "#1f4e8c", "#2e7a4a", "#d2602a"];
  if (first === "ko") return ["#f3f0e6", "#1f4a8a", "#c0392b", "#2f7a52", "#f0c43a"];
  if (first === "ru") return ["#2c4a7a", "#a8322b", "#ece6d6", "#3d6b4a", "#5a5a64"];
  return ["#2f5d4a", "#9c3528", "#2b4a7a", "#d8a43b", "#ebe2cb", "#35353f", "#7a3b5e", "#c8642c"];
}

export function takesPersonalName(trade: string): boolean {
  return PERSONAL.has(trade);
}
