import data from "./regional-houses.json" with { type: "json" };
import type { WorldSetting } from "../geography/types";

type Family = keyof typeof data.families;
type Profile = keyof typeof data.profiles;

function frames(family: Family, profile: Profile) {
  const sizes = data.families[family].sizes as Record<
    string,
    { variants?: number }
  >;
  return Object.entries(sizes).flatMap(([scale, shape]) =>
    Array.from(
      { length: shape.variants ?? 1 },
      (_, variant) => `${family}-${profile}-${scale}-${variant}`,
    ),
  );
}

export function romanHouseProfile(setting: WorldSetting): Profile {
  if (setting.culture === "north-african-west-asian")
    return "roman-north-african";
  return setting.lon >= 20 ? "roman-eastern" : "roman-italian";
}

export function westAsianHouseProfile(setting: WorldSetting): Profile {
  const { lon, lat, placeId } = setting;
  if (lon < 12) return "maghrebi";
  if (placeId === "nile" || (lon >= 24 && lon <= 36 && lat < 33)) return "nile";
  if (lon >= 44 && lat >= 24) return "iranian";
  if (lon >= 35 && lat < 29) return "arabian";
  return "levantine";
}

export function romanRegionalHouses(setting: WorldSetting) {
  const profile = romanHouseProfile(setting);
  return [
    ...frames("roman-domus", profile),
    ...frames("roman-insula", profile),
  ];
}

export function westAsianRegionalHouses(setting: WorldSetting) {
  return frames("westasian-courtyard", westAsianHouseProfile(setting));
}

export function eastAsianHouseProfile(setting: WorldSetting): Profile {
  const { lon, lat } = setting;
  if (lon >= 130 && lat >= 30 && lat <= 46) return "japanese";
  if (lon >= 124 && lon < 131 && lat >= 33 && lat <= 40) return "korean";
  if (setting.year < 220) return "early-chinese";
  return lat < 31 ? "south-chinese" : "north-chinese";
}

export function eastAsianRegionalHouses(setting: WorldSetting) {
  const profile = eastAsianHouseProfile(setting);
  if (profile === "japanese")
    return [
      ...frames("eastasian-row", profile),
      ...frames("eastasian-service", profile),
    ];
  const houses = [
    ...frames("eastasian-house", profile),
    ...frames("eastasian-courtyard", profile),
  ];
  if (profile === "early-chinese") return houses;
  const services = frames("eastasian-service", profile);
  if (profile === "korean") return [...houses, ...services];
  return [...houses, ...frames("eastasian-row", profile), ...services];
}

export function southAsianHouseProfile(setting: WorldSetting): Profile {
  const { lon, lat, placeId } = setting;
  if (placeId === "bengal" || (lon >= 87 && lat < 27)) return "bengali";
  if (lon < 78 && lat < 16) return "malabar";
  if (setting.year < 1200) return lat < 24 ? "deccan" : "early-north-indian";
  if (lon < 76.5 && lat >= 23.5 && lat <= 30.5) return "rajput";
  if (lat < 24) return "deccan";
  // Babur took Delhi in 1526.
  return setting.year < 1526 ? "sultanate" : "north-indian";
}

export function southAsianRegionalHouses(setting: WorldSetting) {
  const profile = southAsianHouseProfile(setting);
  const houses = frames(
    profile === "bengali" || profile === "malabar"
      ? "southasian-monsoon"
      : "southasian-courtyard",
    profile,
  );
  return [...houses, ...frames("southasian-service", profile)];
}

/** Felt and cart tents on the open steppe by period; the forest-edge log
 * and bark house in Manchuria and the boreal north. */
export function steppeHouseProfile(setting: WorldSetting): Profile {
  const { lon, lat, year } = setting;
  if (setting.climate === "boreal" || (lon >= 118 && lat >= 40 && lat < 55))
    return "manchurian-forest";
  if (year < -200) return "scytho-saka";
  if (year < 550) return "xiongnu";
  if (year < 1200) return "early-turkic";
  return "mongol";
}

export function steppeRegionalHouses(setting: WorldSetting) {
  const { lon, lat, settlement } = setting;
  // Towns south of the open steppe, from Bukhara and Kabul to Kashgar and
  // Lhasa, built flat-roofed courtyard houses, not tents; Xining built Chinese ones.
  if ((settlement === "city" || settlement === "port") && lon >= 56 && lat >= 26 && lat <= 44)
    return lon >= 100 ? eastAsianRegionalHouses(setting) : westAsianRegionalHouses(setting);
  const profile = steppeHouseProfile(setting);
  return [
    ...frames("steppe-tent", profile),
    ...frames("steppe-winter", profile),
    ...(profile === "manchurian-forest" ? [] : frames("steppe-cart", profile)),
  ];
}

/** A band's shelters, by country: bark in the wetter south and north of
 * Australia, spinifex and brush in the desert, grass huts in the Kalahari,
 * brush and tule wickiups in the Great Basin. */
export function foragerRegionalHouses(setting: WorldSetting) {
  const { culture, climate, lon, lat } = setting;
  const profile: Profile =
    culture === "australian-pacific"
      ? climate === "arid"
        ? "aboriginal-arid"
        : "aboriginal-bark"
      : culture === "east-southern-african"
        ? "san"
        : culture === "other-indigenous-american" &&
            lon >= -124 &&
            lon <= -110 &&
            lat >= 32 &&
            lat <= 44
          ? "great-basin"
          : "forager";
  return frames("forager-shelter", profile);
}

/** The houses a lifeway builds, where it has its own; the steppe camp takes
 * its tents from the inner-Eurasian set instead. */
export function lifewayHouses(
  way: { id: string; mode: string },
  setting: WorldSetting,
) {
  if (way.mode === "mobile-foraging") return foragerRegionalHouses(setting);
  switch (way.id) {
    case "northwest-coast":
      return frames("northwest-house", "northwest-coast");
    case "amazonian-ring":
      return frames("amazon-maloca", "amazonian");
    case "maasai":
      return frames("enkang-house", "maasai");
    case "khoikhoi":
      return frames("forager-shelter", "khoikhoi");
    case "iroquoian":
      return frames("iroquoian-longhouse", "iroquoian");
    case "eastern-algonquian":
      return frames("forager-shelter", "algonquian");
    case "ainu":
      return frames("ainu-chise", "ainu");
    case "bedouin":
      return frames("black-tent", "bedouin");
    case "tibetan-drokpa":
      return frames("black-tent", "tibetan");
    case "tuareg":
      return frames("pastoral-tent", "tuareg");
    case "fulani":
      return frames("pastoral-tent", "fulani");
    case "sami":
      return frames("pastoral-tent", "sami");
    case "siberian-reindeer":
      // Nenets reindeer skins west of the Yenisei, Evenki birch bark east of it.
      return frames("pastoral-tent", setting.lon < 86 ? "nenets" : "evenki");
    case "plains":
      return frames("pastoral-tent", "plains");
    case "samoan-nuu":
    case "polynesian-hamlets-east":
    case "polynesian-hamlets-west":
      return pacificRegionalHouses(setting);
    case "inuit":
      // Snow houses on the central Arctic coast; sod, stone and whalebone
      // where driftwood and whales were to hand, west and east of it.
      return frames(
        "forager-shelter",
        setting.lon > -125 && setting.lon < -70 ? "inuit-snow" : "inuit-sod",
      );
    case "ethiopian-highlands":
      return ethiopianHouses(setting);
    case "new-guinea-highlands":
    case "irish-ringforts":
      return ["house-round-0", "house-round-1", "house-round-2"];
  }
  return [];
}

/** Maya on the Yucatán, Petén and Gulf lowlands; Zapotec and Mixtec in
 * Oaxaca; the Purépecha troje in Michoacán; Nahua for the central highlands. */
export function mesoamericanHouseProfile(setting: WorldSetting): Profile {
  const { lon, lat } = setting;
  if (lon > -94 && lat < 22) return "maya";
  if (lon >= -98.6 && lon <= -94.5 && lat >= 15.5 && lat <= 18.6) return "zapotec";
  if (lon >= -103.8 && lon <= -100.4 && lat >= 18.4 && lat <= 20.6) return "purepecha";
  return "nahua";
}

export function mesoamericanRegionalHouses(setting: WorldSetting) {
  const profile = mesoamericanHouseProfile(setting);
  return [
    ...frames("meso-jacal", profile),
    // A troje's steep shingle roof is not a terrace.
    ...(profile === "purepecha" ? [] : frames("meso-terrace", profile)),
    ...frames("meso-service", profile),
  ];
}

/** West and Central African houses: the kay across the Atlantic, banco in the
 * Sahel, the Kongo house of mats and thatch in the forest and savanna. */
export function africanRegionalHouses(setting: WorldSetting) {
  const { lon, lat, placeId, climate, architecture } = setting;
  const profile: Profile =
    placeId === "haiti" || lon < -30
      ? "kay"
      : lat > 8 && (climate === "arid" || architecture === "mudbrick")
        ? "sahel"
        : "kongo";
  return frames("africa-house", profile);
}

/** Burma, the Khmer and Thai plains, the Red River delta, the Malay world
 * and the Philippines each raised (or, in Vietnam, grounded) their own house. */
export function southeastAsianHouseProfile(setting: WorldSetting): Profile {
  const { lon, lat } = setting;
  if (lon < 98 || (lon < 100 && lat >= 16)) return "burmese";
  if (lon >= 117 && lat >= 4.5) return "filipino";
  if (lon >= 104 && lat >= 16) return "vietnamese";
  if (lon >= 102 && lon < 109 && lat >= 9.5 && lat < 16) return "khmer";
  if (lon >= 98 && lon < 104 && lat >= 12) return "thai";
  if (lat > -1.5 && lat < 7.5 && lon < 120) return "malay";
  return "javanese";
}

export function southeastAsianRegionalHouses(setting: WorldSetting) {
  return frames("seasia-house", southeastAsianHouseProfile(setting));
}

/** Highland Andean stone after 600; the adobe house of the north coast from
 * Caral to Chan Chan, on the desert strip below the sierra. */
export function andeanRegionalHouses(setting: WorldSetting) {
  const { lon, lat } = setting;
  // The coast runs south-east: about -79 at Trujillo, -77 at Lima.
  if (lon < -78.3 + (-8 - lat) * 0.5 && lat > -15 && lat < -3)
    return frames("andes-house", "moche");
  if (setting.year < 600) return [];
  const city = setting.settlement === "city" || setting.settlement === "port";
  return frames("andes-house", city ? "cusco" : "andean-highland");
}

/** Samoa and Tonga build the open fale, Aotearoa the whare; the fare stands
 * for the rest of Polynesia and Micronesia. New Guinea and Australia build
 * otherwise. */
export function pacificRegionalHouses(setting: WorldSetting) {
  const { lon, lat } = setting;
  if (lon >= 165 && lat < -33) return frames("pacific-house", "maori");
  if (lon <= -168 && lat > -23 && lat < -12)
    return frames("pacific-house", "samoan");
  const polynesia = lon >= 155 || lon < -120;
  const micronesia = lon >= 130 && lat >= 4;
  return polynesia || micronesia ? frames("pacific-house", "polynesian") : [];
}

/** Tigray's flat-roofed stone hidmo north of the Tekezé; the round thatched
 * tukul on the plateau. */
export function ethiopianHouses(setting: WorldSetting) {
  const tukul = frames("hut-house", "tukul");
  return setting.lat >= 12.8 ? [...frames("africa-house", "hidmo"), ...tukul.slice(0, 2)] : tukul;
}

/** The stone town of the Swahili coast, the Ethiopian plateau, the daga
 * houses of the Zimbabwe plateau and the Nguni beehive in the south-east. */
export function eastAfricanHouses(setting: WorldSetting) {
  const { lon, lat, year } = setting;
  if (lon >= 38.5 && lat > -12 && lat < 4.5 && year >= 900) {
    const town = setting.settlement === "city" || setting.settlement === "port";
    // Coral stone for the patricians; the townspeople's wattle and thatch.
    return town
      ? frames("africa-house", "swahili")
      : [...frames("africa-house", "swahili").slice(0, 3), ...frames("hut-house", "daga")];
  }
  if (lon >= 35 && lon <= 42.5 && lat >= 6 && lat <= 15.5) return ethiopianHouses(setting);
  if (lon >= 28 && lat <= -24.5 && year >= 1000) return frames("hut-house", "nguni");
  return frames("hut-house", "daga");
}

/** Byzantine town houses round the Aegean and the Marmara until the Ottoman
 * conquest; Rus log houses from Novgorod to Kyiv and Vladimir. */
export function easternEuropeanHouses(setting: WorldSetting) {
  const { lon, lat, year } = setting;
  // Post-built, unwindowed longhouses: Iron Age and Viking Scandinavia, and
  // the Norse North Atlantic, whose turf walls are not drawn yet.
  if ((lon >= 4 && lat >= 54.5 && (lon <= 19 || (lon <= 24.5 && lat >= 60)) && year < 1100) || (lon < -0.5 && lat >= 58.5 && year >= 800 && year < 1450))
    return ["house-longhouse-0", "house-longhouse-1", "house-longhouse-gold-medium-0", "house-longhouse-gold-medium-1", "house-longhouse-gold-large-0"];
  if (lon >= 19 && lon <= 30.5 && lat >= 34.5 && lat <= 42.2 && year >= 600 && year < 1460)
    return frames("orthodox-house", "byzantine");
  if (lon >= 24 && lon <= 60 && lat >= 48.5 && lat <= 64 && year >= 880 && year < 1800)
    return frames("orthodox-house", "rus");
  return [];
}

/** Chaco and the Pueblos in the Southwest; the Mississippian towns of the
 * river valleys. */
export function northAmericanHouses(setting: WorldSetting) {
  const { lon, lat, year } = setting;
  if (lon >= -114 && lon <= -103 && lat >= 31 && lat <= 38.5 && year >= 700)
    return ["small-0", "small-1", "small-2", "medium-0", "medium-1", "large-0"].map(
      (v) => `house-mudbrick-pueblo-${v}`,
    );
  if (lon >= -96 && lon <= -81 && lat >= 29 && lat <= 41 && year >= 900 && year < 1600)
    return frames("hut-house", "mississippian");
  return [];
}

/** Front-on vernacular houses where the culture had no family of its own. */
export function vernacularHouses(setting: WorldSetting) {
  if (setting.architecture === "shelter") return [];
  if (setting.year < 0 && setting.culture !== "andean") return [];
  switch (setting.culture) {
    case "west-central-african":
    case "east-southern-african": {
      // By coordinates, not tag: the gazetteer has filed parts of each region
      // under the other.
      const { lon, lat } = setting;
      const east = (lon >= 33 && lat < 16) || (lon >= 24 && lat < -15);
      return east ? eastAfricanHouses(setting) : africanRegionalHouses(setting);
    }
    case "southeast-asian":
      return southeastAsianRegionalHouses(setting);
    case "andean":
      return andeanRegionalHouses(setting);
    case "australian-pacific":
      return pacificRegionalHouses(setting);
    case "european":
      return easternEuropeanHouses(setting);
    case "other-indigenous-american":
      return northAmericanHouses(setting);
    default:
      return [];
  }
}
