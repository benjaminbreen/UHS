import type { WorldSetting } from "../geography/types";
import { industrialized } from "../settlements/modernity";

/** Looks drawn by scripts/art/front_straits.py for a Southeast Asian town
 * before its industry: the shop-house rows of the Straits ports and of the
 * Chinese quarters from Rangoon to Batavia, in the fronts of the date. Once
 * the town is zoned, `street-looks.ts` builds the same looks by block. The
 * Philippines built the bahay na bato, which `casaLook` names first. */
export function straitsHouses(setting: WorldSetting): string[] {
  const { year, culture, settlement } = setting;
  if (culture !== "southeast-asian" || (settlement !== "city" && settlement !== "port")) return [];
  if (year < 1700 || industrialized(setting)) return [];
  const looks = year < 1895 ? ["shophouse"] : ["shophouse", "shophouse-late"];
  return looks.flatMap((look) => [0, 1, 2].map((i) => `mod-${look}-${i}`));
}
