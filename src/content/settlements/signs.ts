/** What a shop writes over its door.
 *
 * Signage in a Latin alphabet is a modern habit and a regional one: the word
 * is the trade's, the language is the street's, and often enough the name is
 * the family's. Scripts this 3x5 font cannot draw — Chinese, Arabic,
 * Devanagari, Thai — get no lettering at all; those streets already hang their
 * own painted boards from the prop kit, which is the right answer there.
 */
import type { WorldSetting } from "../geography/types";

export type SignLanguage = "en" | "fr" | "es" | "pt" | "id" | "tr" | "sw";

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
  if (culture === "east-asian" || culture === "south-asian") return undefined;
  if (culture === "north-african-west-asian")
    return box(26, 45, 36, 42) && year >= 1928 ? "tr" : undefined;
  if (culture === "southeast-asian")
    return box(95, 120, -11, 7) || box(99, 105, 1, 7) ? "id" : undefined;
  if (culture === "west-central-african")
    return box(-18, 16, 4, 17) ? "fr" : box(11, 24, -18, -4) ? "pt" : "en";
  if (culture === "east-southern-african")
    return box(29, 42, -12, 5) ? "sw" : box(30, 41, -27, -10) ? "pt" : "en";
  if (culture === "mesoamerican" || culture === "andean") return "es";
  if (culture === "european") {
    if (box(-74, -34, -34, 6)) return "pt"; // Brazil
    if (box(-118, -34, -56, 25) && !box(-100, -60, 25, 50)) return "es";
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
    es: ["TIENDA", "ABARROTES"],
    pt: ["VENDA", "MERCEARIA"],
    id: ["TOKO", "WARUNG"],
    tr: ["BAKKAL"],
    sw: ["DUKA"],
  },
  grocery: {
    en: ["FOODS", "GROCERY"],
    fr: ["EPICERIE"],
    es: ["TIENDA", "ABARROTES"],
    pt: ["MERCEARIA"],
    id: ["TOKO", "SEMBAKO"],
    tr: ["BAKKAL"],
    sw: ["DUKA"],
  },
  "neighborhood market": {
    en: ["MARKET", "MART"],
    fr: ["MARCHE"],
    es: ["MERCADO"],
    pt: ["MERCADO"],
    id: ["PASAR"],
    tr: ["PAZAR"],
    sw: ["SOKO"],
  },
  bakery: {
    en: ["BAKERY"],
    fr: ["PAIN", "BOULANGER"],
    es: ["PAN", "PANADERIA"],
    pt: ["PADARIA"],
    id: ["ROTI"],
    tr: ["FIRIN"],
    sw: ["MKATE"],
  },
  cafe: {
    en: ["CAFE", "COFFEE"],
    fr: ["CAFE", "BRASSERIE"],
    es: ["CAFE"],
    pt: ["CAFE"],
    id: ["KOPI", "WARUNG"],
    tr: ["KAHVE"],
    sw: ["KAHAWA"],
  },
  diner: {
    en: ["EATS", "DINER", "GRILL"],
    fr: ["RESTO"],
    es: ["FONDA", "COMIDAS"],
    pt: ["LANCHES"],
    id: ["MAKAN", "WARUNG"],
    tr: ["LOKANTA"],
    sw: ["CHAKULA"],
  },
  pharmacy: {
    en: ["DRUGS", "RX"],
    fr: ["PHARMACIE"],
    es: ["FARMACIA"],
    pt: ["FARMACIA"],
    id: ["APOTIK"],
    tr: ["ECZANE"],
    sw: ["DAWA"],
  },
  clinic: {
    en: ["CLINIC"],
    fr: ["CLINIQUE"],
    es: ["CLINICA"],
    pt: ["CLINICA"],
    id: ["KLINIK"],
    tr: ["KLINIK"],
    sw: ["ZAHANATI"],
  },
  "auto workshop": {
    en: ["GARAGE", "AUTO"],
    fr: ["GARAGE"],
    es: ["TALLER"],
    pt: ["OFICINA"],
    id: ["BENGKEL"],
    tr: ["TAMIR"],
    sw: ["GARAJI"],
  },
  "gas station": {
    en: ["GAS", "FUEL"],
    fr: ["ESSENCE"],
    es: ["GASOLINA"],
    pt: ["POSTO"],
    id: ["BENSIN"],
    tr: ["BENZIN"],
    sw: ["PETROLI"],
  },
  laundromat: {
    en: ["WASH", "LAUNDRY"],
    fr: ["LAVERIE"],
    es: ["LAVANDERIA"],
    pt: ["LAVANDARIA"],
    id: ["BINATU"],
    tr: ["CAMASIR"],
    sw: ["DOBI"],
  },
  "donut shop": { en: ["DONUTS"] },
  motel: {
    en: ["MOTEL", "ROOMS"],
    fr: ["HOTEL"],
    es: ["HOTEL"],
    pt: ["HOTEL"],
    id: ["LOSMEN", "PENGINAPAN"],
    tr: ["OTEL"],
    sw: ["HOTELI"],
  },
  barber: {
    en: ["BARBER"],
    fr: ["COIFFEUR"],
    es: ["BARBERIA"],
    pt: ["BARBEARIA"],
    id: ["CUKUR"],
    tr: ["BERBER"],
    sw: ["KINYOZI"],
  },
  hardware: {
    en: ["HARDWARE", "TOOLS"],
    fr: ["QUINCAILLERIE"],
    es: ["FERRETERIA"],
    pt: ["FERRAGENS"],
    id: ["BESI"],
    tr: ["HIRDAVAT"],
    sw: ["VYOMA"],
  },
  tailor: {
    en: ["TAILOR"],
    fr: ["TAILLEUR"],
    es: ["SASTRE"],
    pt: ["ALFAIATE"],
    id: ["PENJAHIT"],
    tr: ["TERZI"],
    sw: ["FUNDI"],
  },
  /** Anything that only says it is open for business. */
  shop: {
    en: ["SHOP", "STORE"],
    fr: ["MAGASIN"],
    es: ["TIENDA"],
    pt: ["LOJA"],
    id: ["TOKO"],
    tr: ["DUKKAN"],
    sw: ["DUKA"],
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
  const words = [...(WORDS[trade]?.[language] ?? WORDS[trade]?.en ?? [])].sort(
    (a, b) => a.length - b.length,
  );
  if (surname && personal && PERSONAL.has(trade)) return [surname, ...words];
  return words;
}

export function takesPersonalName(trade: string): boolean {
  return PERSONAL.has(trade);
}
