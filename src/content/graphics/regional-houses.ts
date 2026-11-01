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
    case "inuit":
      // Snow houses on the central Arctic coast; sod, stone and whalebone
      // where driftwood and whales were to hand, west and east of it.
      return frames(
        "forager-shelter",
        setting.lon > -125 && setting.lon < -70 ? "inuit-snow" : "inuit-sod",
      );
    case "new-guinea-highlands":
    case "ethiopian-highlands":
    case "irish-ringforts":
      return ["house-round-0", "house-round-1", "house-round-2"];
  }
  return [];
}

/** Maya on the Yucatán, Petén and Gulf lowlands; the Nahua highland house
 * stands in for the rest until Zapotec and Mixtec profiles exist. */
export function mesoamericanHouseProfile(setting: WorldSetting): Profile {
  return setting.lon > -94 && setting.lat < 22 ? "maya" : "nahua";
}

export function mesoamericanRegionalHouses(setting: WorldSetting) {
  const profile = mesoamericanHouseProfile(setting);
  return [
    ...frames("meso-jacal", profile),
    ...frames("meso-terrace", profile),
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

export function southeastAsianRegionalHouses(setting: WorldSetting) {
  return frames("seasia-house", setting.lon < 100 ? "burmese" : "javanese");
}

export function andeanRegionalHouses(setting: WorldSetting) {
  const city = setting.settlement === "city" || setting.settlement === "port";
  return frames("andes-house", city ? "cusco" : "andean-highland");
}

/** Polynesia only: New Guinea and Australia build otherwise. */
export function pacificRegionalHouses(setting: WorldSetting) {
  return setting.lon > 160 || setting.lon < -120
    ? frames("pacific-house", "polynesian")
    : [];
}

/** Front-on vernacular houses where the culture had no family of its own. */
export function vernacularHouses(setting: WorldSetting) {
  if (setting.architecture === "shelter" || setting.year < 0) return [];
  switch (setting.culture) {
    case "west-central-african":
      return africanRegionalHouses(setting);
    case "southeast-asian":
      return southeastAsianRegionalHouses(setting);
    case "andean":
      return setting.year >= 600 ? andeanRegionalHouses(setting) : [];
    case "australian-pacific":
      return pacificRegionalHouses(setting);
    default:
      return [];
  }
}
