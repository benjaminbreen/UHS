import type { WorldSetting } from "../geography/types";

/** Looks drawn by scripts/art/front_europe.py: frames `euro-<look>-<0..2>`
 * and their street forms, each frame a row of houses. */
export type EuroLook = "paris" | "london" | "amsterdam";

const inBox = (s: WorldSetting, w: number, sth: number, e: number, n: number) =>
  s.lon >= w && s.lon <= e && s.lat >= sth && s.lat <= n;

/** The city house of northwestern Europe from 1700 to 1899, or undefined
 * where the older period sprites still stand. Paris after Haussmann (1853)
 * has no front-on look of its own yet and keeps the earlier one. */
export function euroLook(setting: WorldSetting): EuroLook | undefined {
  const { year, culture, settlement } = setting;
  if (culture !== "european" || year < 1700 || year >= 1900) return undefined;
  if (settlement !== "city" && settlement !== "port") return undefined;
  if (inBox(setting, 2.5, 50.7, 7.3, 53.6)) return "amsterdam";
  if (inBox(setting, -10.6, 49.9, 1.8, 58.7)) return "london";
  if (inBox(setting, -4.8, 42.3, 8.2, 51.1)) return "paris";
  return undefined;
}

export function euroHouses(setting: WorldSetting): string[] {
  const look = euroLook(setting);
  return look ? [0, 1, 2].map((i) => `euro-${look}-${i}`) : [];
}
