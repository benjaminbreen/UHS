import type { WorldSetting } from "../geography/types";

export function historicalWell(setting: WorldSetting | undefined, key: string, roll: number, irrigation = false) {
  if (!setting) return undefined;
  const { year, lat, lon, culture, settlement, climate } = setting;
  const type = (id: string, name: string) => ({ sprite: `nature-well-${id}`, name });
  if (key === "pump")
    return year >= 1850 && year <= 1930 ? type("pump", "Hand pump") : undefined;
  if (!["well", "roofedWell", "townWell"].includes(key)) return undefined;
  const urban = settlement === "city" || settlement === "port";
  if (culture === "mesoamerican" && year >= 600 && year <= 1000 &&
      lon >= -90.3 && lon <= -89 && lat >= 19.5 && lat <= 20.7)
    return type("maya", "Rainwater cistern");
  if (culture === "european" && year >= -5300 && year <= -4800 &&
      lon >= 5 && lon <= 25 && lat >= 45 && lat <= 55)
    return type("timber", "Timber-lined well");
  if (culture === "south-asian" && year >= -2600 && year <= -1900 &&
      lon >= 64 && lon <= 77 && lat >= 22 && lat <= 33)
    return type("indus", "Brick-lined well");
  if (culture === "east-asian" && year >= -206 && year <= 220 &&
      lon >= 75 && lon <= 125 && lat >= 18 && lat <= 43)
    return type("han", "Covered well");
  if (culture === "east-asian" && year >= 1615 && year <= 1868 &&
      lat >= 30 && lat <= 46 && lon <= 146 && (lon >= 130 || (lon >= 128 && lat < 34.2)))
    return type("japan", "Bucket well");
  // The bronze head belongs to a civic cistern, not every Venetian courtyard.
  if (culture === "european" && key === "townWell" && urban && roll < 0.25 &&
      year >= 1550 && year <= 1700 && lon >= 12.1 && lon <= 12.6 && lat >= 45.1 && lat <= 45.6)
    return type("venice", "Bronze cistern wellhead");
  if (["european", "north-african-west-asian"].includes(culture) &&
      year >= -100 && year <= 300 && lon >= -10 && lon <= 45 && lat >= 25 && lat <= 49)
    return type("roman", "Stone wellhead");
  // A pot-chain lift serves irrigation; drinking-water wells retain their curb.
  if (irrigation && culture === "south-asian" && key === "well" && roll < 0.3 &&
      year >= 1500 && year <= 1850 && lon >= 67 && lon <= 88 && lat >= 15 && lat <= 34)
    return type("rahat", "Pot-chain well");
  if (culture === "north-african-west-asian" && year >= 1200 && year <= 1800 &&
      lon >= 35 && lon <= 65 && lat >= 16 && lat <= 42)
    return type("westasia", "Courtyard well");
  if (culture === "north-african-west-asian" && climate === "arid" &&
      year >= 0 && year < 1850 && lon >= -17 && lon < 35 && lat >= 15 && lat <= 36)
    return type("arid", "Draw-well");
  if (culture === "european" && year >= 1100 && year <= 1700 &&
      lon >= -12 && lon <= 40 && lat >= 35 && lat <= 65)
    return type("windlass", "Windlass well");
  return undefined;
}
