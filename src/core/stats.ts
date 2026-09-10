import { random } from "./random";
import type { Actor, Stats } from "./types";
const keys = [
  "strength",
  "agility",
  "wit",
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
] as const;
/** Sum of two draws so the middle is common and the ends are rare. */
function draw(
  seed: string,
  id: string,
  key: string,
  floor: number,
  span: number,
) {
  return Math.round(
    floor +
      (span *
        (random(seed, "stats", id, key, 0) +
          random(seed, "stats", id, key, 1))) /
        2,
  );
}
export function rollStats(
  seed: string,
  actor: Pick<Actor, "id" | "age" | "appearance">,
): Stats {
  const age = actor.age ?? 30,
    body = actor.appearance?.physique?.strength;
  const stats = Object.fromEntries(
    keys.map((k) => [k, draw(seed, actor.id, k, 10, 80)]),
  ) as Stats;
  if (body !== undefined)
    stats.strength = Math.round((stats.strength + body * 2) / 3);
  if (age < 14) {
    stats.strength = Math.round(stats.strength * 0.5);
    stats.wit = Math.round(stats.wit * 0.7);
  } else if (age >= 60) {
    stats.strength = Math.round(stats.strength * 0.7);
    stats.agility = Math.round(stats.agility * 0.7);
  }
  return stats;
}
/** Stored stats when present, otherwise a stable roll. Residents are not
 * stored with stats, so a village costs nothing to give personalities. */
export function statsOf(
  seed: string,
  actor: Pick<Actor, "id" | "age" | "appearance" | "stats">,
): Stats {
  return actor.stats ?? rollStats(seed, actor);
}
const words: Record<keyof Stats, [low: string, high: string]> = {
  strength: ["frail", "strong"],
  agility: ["clumsy", "nimble"],
  wit: ["slow-witted", "sharp"],
  openness: ["set in their ways", "curious"],
  conscientiousness: ["careless", "diligent"],
  extraversion: ["reserved", "outgoing"],
  agreeableness: ["hard-nosed", "warm"],
  neuroticism: ["unflappable", "anxious"],
};
/** Only the traits that stand out, so most people get two or three words. */
export function describeStats(stats: Stats): string[] {
  return keys.flatMap((k) =>
    stats[k] >= 68 ? [words[k][1]] : stats[k] <= 32 ? [words[k][0]] : [],
  );
}
export const statKeys = keys;
