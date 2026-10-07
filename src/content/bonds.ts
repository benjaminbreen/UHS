import type { CharacterScope } from "./characters/context-types";
import type { WorldSetting } from "./geography/types";
import type { HouseholdEvent } from "../core/types";
import { random } from "../core/random";

const B = (year: number) => 1 - year;

/**
 * Love between two men or two women existed everywhere and was mostly
 * unspoken. These are the places and times where a culture made open room for
 * it; elsewhere it is a secret the player keeps.
 */
export const OPEN_SAME_SEX: readonly { scope: CharacterScope; sex: "male" | "female"; chance: number; note: string }[] = [
  {
    scope: { years: [B(650), B(146)], bounds: [19.5, 34.8, 28.5, 41.5] },
    sex: "male",
    chance: 0.12,
    note: "Love between men had an accepted, if regulated, place in Greek civic life.",
  },
  {
    scope: { years: [1603, 1868], bounds: [129, 30, 146, 46] },
    sex: "male",
    chance: 0.08,
    note: "Nanshoku, love between men, was written about openly in Edo Japan.",
  },
];
/** Elsewhere, the share of loves that are for someone of the same sex. */
export const SAME_SEX_CHANCE = 0.04;

/** Why a grown son or daughter left, and what has been heard since. */
export function whyLeft(as: string, setting: WorldSetting | undefined, roll: number): string {
  const y = setting?.year ?? 1500;
  const coast = !!setting && (setting.water.startsWith("coast") || setting.water === "island" || setting.settlement === "port");
  if (as === "daughter")
    return y >= 1500 && roll < 0.3 && setting?.settlement !== "camp"
      ? "went into service in a bigger house"
      : "married into a village a day's walk away";
  const ways = [
    ...(coast ? ["went to sea"] : []),
    ...(y > -2500 ? ["went for a soldier"] : []),
    ...(y >= 1840 && y < 1914 && setting?.culture === "european" ? ["went to America"] : []),
    ...(y >= 1750 ? ["went to the city for work"] : []),
    "went off to make his own way",
  ];
  return ways[Math.floor(roll * ways.length)];
}

export type Departure = { as: string; name?: string; why: string; noWord: boolean; year: number };

export function absentChildOf(seed: string, history: HouseholdEvent[], setting?: WorldSetting): Departure | undefined {
  if (!setting) return;
  const left = [...history].reverse().find((e) => e.kind === "left" &&
    (e.as === "son" || e.as === "daughter") && e.year <= setting.year && e.year >= setting.year - 8);
  if (!left) return;
  const later = history.slice(history.indexOf(left) + 1);
  if (later.some((e) => ["joined", "died"].includes(e.kind) &&
    (left.name && e.name ? left.name === e.name : e.as === left.as))) return;
  const why = whyLeft(left.as!, setting, random(seed, "left", String(left.year)));
  return { as: left.as!, name: left.name, year: left.year, why,
    noWord: /sea|soldier|America/.test(why) && random(seed, "left-word") < 0.5 };
}
