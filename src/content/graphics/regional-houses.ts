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
  return lat < 31 ? "south-chinese" : "north-chinese";
}

export function eastAsianRegionalHouses(setting: WorldSetting) {
  const profile = eastAsianHouseProfile(setting);
  const services = frames("eastasian-service", profile);
  if (profile === "japanese")
    return [...frames("eastasian-row", profile), ...services];
  if (profile === "korean")
    return [...frames("eastasian-courtyard", profile), ...services];
  return [
    ...frames("eastasian-courtyard", profile),
    ...frames("eastasian-row", profile),
    ...services,
  ];
}

export function southAsianHouseProfile(setting: WorldSetting): Profile {
  const { lon, lat, placeId } = setting;
  if (placeId === "bengal" || (lon >= 84 && lat < 27)) return "bengali";
  if (lon < 78 && lat < 16) return "malabar";
  if (lat < 24) return "deccan";
  return "north-indian";
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
