import type { WorldSetting } from "../geography/types";
import { sexFromName } from "../characters/name-sex";

/**
 * The proper names of inns, taverns and hotels: a sign, a founder, a pious
 * wish or the town itself, as the place and date would name one. Signs are
 * drawn from attested types (English and German inn signs, Pompeii's "At the
 * Elephant", Japanese yagō, Chinese auspicious inn names); the particular
 * name is invented.
 */
type Tongue = "english" | "french" | "german" | "dutch" | "spanish" | "italian" | "other";

function tongueOf(s: WorldSetting): Tongue {
  const { lon, lat, year, culture } = s;
  // Texas and Florida were the United States' by 1850, south of the old line.
  if (lon < -30 && year >= 1520) return lat > 31 || (year >= 1850 && lat > 25.8 && lon > -106 && lon < -80) ? "english" : "spanish";
  if (culture === "european") {
    if (lat > 50 && lon < 1.7 && lon > -11) return "english";
    if (lat < 44 && lon < 3.3) return "spanish";
    if (lon > 6.6 && lon < 19 && lat < 46.5 && lat > 36) return "italian";
    if (lon > 2.5 && lon < 7.2 && lat > 50.8 && lat < 53.6) return "dutch";
    if (lon > 6 && lon < 17 && lat > 46 && lat < 55) return "german";
    if (lon > -5 && lon < 8 && lat > 42 && lat < 51.2) return "french";
    return "other";
  }
  if (culture === "australian-pacific" && year >= 1788 && lat < -10) return "english";
  return "other";
}

const ENGLISH_SIGNS = [
  "Red Lion", "White Hart", "Green Dragon", "Black Bull", "Bell", "Crown", "George", "Swan", "Plough",
  "Rose and Crown", "King's Head", "Saracen's Head", "Golden Fleece", "Star", "Angel", "Wheatsheaf",
  "Three Tuns", "Chequers", "Cock", "Blue Boar", "Pelican", "Bull", "Mitre", "Ship",
];
const LATER_ENGLISH: [number, string][] = [
  [1600, "King's Arms"], [1650, "Coach and Horses"], [1660, "Royal Oak"], [1760, "Marquis of Granby"],
  [1830, "Railway Tavern"], [1840, "Queen Victoria"],
];
const SIGNS: Record<Exclude<Tongue, "english" | "other">, string[]> = {
  french: ["Auberge du Cheval Blanc", "Au Lion d'Or", "À la Croix Blanche", "Au Cygne", "Auberge de la Pomme de Pin", "Hôtellerie de l'Écu", "Au Grand Cerf", "Auberge des Trois Rois"],
  german: ["Gasthaus zum Goldenen Hirsch", "Zum Schwarzen Adler", "Zum Roten Ochsen", "Gasthof zur Krone", "Zum Löwen", "Zur Sonne", "Zum Weißen Rössl", "Gasthaus zum Hirschen"],
  dutch: ["De Gouden Leeuw", "Het Witte Paard", "De Drie Haringen", "De Zwaan", "Het Hert", "De Roode Os"],
  spanish: ["Posada del Sol", "Mesón de la Cruz", "Posada de San Antonio", "Venta del Rey", "Posada de la Santísima Trinidad", "Mesón del Toro", "Posada de las Ánimas"],
  italian: ["Osteria del Moro", "Locanda della Corona", "Albergo del Sole", "Osteria della Campana", "Locanda del Gallo", "Albergo delle Tre Chiavi"],
};
const ROMAN = ["At the Elephant", "At the Cockerel", "At the Eagle", "At the Wheel"];
const YAGO = ["Tsuruya", "Kameya", "Masuya", "Daikokuya", "Izumiya", "Kikuya", "Ebisuya", "Fujiya", "Matsuya", "Yamatoya"];
const KEZHAN = [
  "Inn of Joyful Arrivals", "Inn of Peaceful Rest", "Inn of a Thousand Li", "Inn of Lasting Prosperity",
  "Dragon Gate Inn", "Inn of Spring Breezes", "Inn of the Three Rivers", "Inn of Welcome Guests",
];
const MOTELS = ["Starlite Motel", "Sunset Motor Inn", "Blue Sky Motel", "Desert Rose Motel", "Wagon Wheel Motel", "Pines Motel", "El Rancho Motel"];
const PULQUE = ["La Gloria", "El Gallo de Oro", "Los Recuerdos del Porvenir", "La Hija del Sol", "El Gran Tinacal", "La Reina Xóchitl"];

/** The town's name where it reads as one; a "Slopes of" or "Country north of" is no town. */
const townOf = (s: WorldSetting) =>
  /^[A-Z][a-z]+ (of|north|south|east|west)\b/.test(s.location) ? undefined : s.location.split(",")[0];

/**
 * A name for an establishment of this kind: a worksite inn profile's id, a
 * building's business ("hotel", "motel", "pub") or a venue's id. Undefined
 * leaves the place its generic label.
 */
export function establishmentName(
  kind: string,
  setting: WorldSetting | undefined,
  names: readonly string[],
  roll: (key: string) => number,
  /** Names already up in this town, which a second sign should not repeat. */
  taken: (name: string) => boolean = () => false,
): string | undefined {
  let name: string | undefined;
  for (let i = 0; i < 6; i++) {
    name = nameOnce(kind, setting, names, i ? (k) => roll(`${k}-${i}`) : roll);
    if (!name || !taken(name)) break;
  }
  return name;
}
function nameOnce(
  kind: string,
  setting: WorldSetting | undefined,
  names: readonly string[],
  roll: (key: string) => number,
) {
  if (!setting) return undefined;
  const pick = <T,>(xs: readonly T[], key = "sign") => xs[Math.floor(roll(key) * xs.length)];
  // Pashas, khans, seths and sons: the titles these names take are men's, and
  // a chichería's Doña a woman's.
  const men = names.filter((n) => sexFromName(n) !== "female");
  const women = names.filter((n) => sexFromName(n) === "female");
  const person = men.length ? pick(men, "founder") : undefined;
  // "Ali Muhammad": a founder's name and his father's.
  const founder = person && men.length > 1 ? `${person} ${pick(men, "father")}` : person;
  const town = townOf(setting);
  const tongue = tongueOf(setting);
  const sign = (inn: boolean) => {
    // Rome's taverns took a painted sign; the vernacular signs come in with the
    // medieval towns, and England made alehouses hang one in 1393.
    if (setting.year < 500) return ["european", "north-african-west-asian"].includes(setting.culture) ? pick(ROMAN) : undefined;
    if (setting.year < 1100) return undefined;
    if (tongue === "english") {
      const pool = [...ENGLISH_SIGNS, ...LATER_ENGLISH.filter(([y]) => setting.year >= y).map(([, n]) => n)];
      return `The ${pick(pool)}${inn && roll("suffix") < 0.5 ? " Inn" : ""}`;
    }
    return tongue === "other" ? undefined : pick(SIGNS[tongue]);
  };
  switch (kind) {
    case "persian-caravanserai":
      return founder && roll("form") < 0.75 ? `Caravanserai of ${founder}` : "Caravanserai of the Shah";
    case "ottoman-han":
      return person && roll("form") < 0.6 ? `${person} Pasha Han` : pick(["Büyük Han", "Taş Han", "Koza Han", "Valide Han"]);
    case "mughal-sarai":
      return founder ? pick([`Sarai ${person}`, `${founder} Khan's Sarai`], "form") : "Badshahi Sarai";
    case "maghreb-funduq":
      return pick(["Funduq al-Najjarin", "Funduq al-Attarin", "Funduq al-Tettaouniyine", "Funduq al-Sagha"]);
    case "roman-caupona":
      return person && roll("form") < 0.5 ? `Caupona of ${person}` : pick(ROMAN);
    case "roman-mansio":
      return town && `Mansio at ${town}`;
    case "european-inn":
    case "grand-coaching-inn":
      return sign(true);
    case "colonial-posada":
      return pick(SIGNS.spanish);
    case "grand-ryokan":
    case "edo-hatago":
    case "venue.izakaya":
      return pick(YAGO);
    case "sinitic-kezhan":
      return pick(KEZHAN);
    case "chinese-yizhan":
      return town && `${town} Post Station`;
    case "steppe-yam":
      return town && `${town} Relay Station`;
    case "inca-tambo":
      return town && `Tambo of ${town}`;
    case "dharamshala":
      return person && `Seth ${person}'s Dharamshala`;
    case "zongo-guesthouse":
      return person && `${person}'s Zongo`;
    case "frontier-livery":
      return person && `${person} & Sons Livery`;
    case "venue.tavern":
    case "venue.alehouse":
    case "pub":
      return sign(false);
    case "venue.pulqueria":
      return pick(PULQUE);
    case "venue.chicheria":
      return women.length ? `Chichería de Doña ${pick(women, "founder")}` : undefined;
    case "grand-hotel":
    case "modern-hotel":
    case "hotel":
      return pick(setting.year < 1945
        ? ["Grand Hotel", "Hotel Metropole", "Hotel Majestic", "Palace Hotel", "Hotel Continental", "Imperial Hotel",
           ...(town ? [`${town} Palace Hotel`, `Hotel ${town}`] : []),
           ...(tongue === "english" ? ["The Ambassador Hotel", "The Commodore", ...(town ? [`The ${town} House`] : [])] : [])]
        : ["Hotel Ambassador", "The Regency", "Park View Hotel", "Hotel Europa",
           ...(town ? [`${town} Plaza Hotel`, `Hotel ${town} Central`] : [])]);
    case "motel":
      return pick(MOTELS);
  }
  return undefined;
}
