import { random } from "./random";
import { statsOf } from "./stats";
import type { Actor, Household, Stats } from "./types";

/** A pair beats a single trait: two traits together read as a character,
 * one on its own reads as a stat line. */
const pairs: [
  a: keyof Stats,
  aHigh: boolean,
  b: keyof Stats,
  bHigh: boolean,
  word: string,
][] = [
  ["agreeableness", true, "neuroticism", false, "patient"],
  ["agreeableness", true, "extraversion", true, "warm"],
  ["conscientiousness", true, "neuroticism", false, "steady"],
  ["conscientiousness", true, "openness", true, "exacting"],
  ["conscientiousness", false, "extraversion", true, "restless"],
  ["agreeableness", false, "neuroticism", true, "prickly"],
  ["agreeableness", false, "extraversion", false, "guarded"],
  ["openness", true, "extraversion", true, "inquisitive"],
  ["openness", false, "conscientiousness", true, "dutiful"],
  ["neuroticism", true, "extraversion", false, "wary"],
];
type Trait =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism";
const singles: Record<Trait, [low: string, high: string]> = {
  openness: ["set in their ways", "curious"],
  conscientiousness: ["easygoing", "diligent"],
  extraversion: ["reserved", "sociable"],
  agreeableness: ["blunt", "kind"],
  neuroticism: ["unflappable", "anxious"],
};
const HIGH = 62;
const LOW = 38;

/** One word for how this person comes across. Read off the five traits only:
 * strength and wit are not personality. */
export function dispositionOf(stats: Stats): string {
  const high = (k: keyof Stats) => stats[k] >= HIGH;
  const low = (k: keyof Stats) => stats[k] <= LOW;
  for (const [a, aHigh, b, bHigh, word] of pairs)
    if ((aHigh ? high(a) : low(a)) && (bHigh ? high(b) : low(b))) return word;
  let best = "openness" as Trait;
  for (const k of Object.keys(singles) as Trait[])
    if (Math.abs(stats[k] - 50) > Math.abs(stats[best] - 50)) best = k;
  const value = stats[best];
  if (value < HIGH && value > LOW) return "even-tempered";
  return singles[best][value >= HIGH ? 1 : 0];
}

export const standings = [
  "unknown",
  "tolerated",
  "known",
  "trusted",
  "relied upon",
] as const;
export type Standing = (typeof standings)[number];

/** How the settlement holds this person, which is not how the player does:
 * `actor.trust` stays the player's own account. */
export function standingOf(
  seed: string,
  actor: Pick<Actor, "id" | "age" | "appearance" | "stats" | "origin">,
  household?: Household,
): Standing {
  const stats = statsOf(seed, actor),
    age = actor.age ?? 30;
  let score =
    30 +
    (stats.conscientiousness - 50) * 0.35 +
    (stats.agreeableness - 50) * 0.25 +
    (random(seed, "standing", actor.id) - 0.5) * 30;
  // Years in one place, not merit: a child and a newcomer both start low.
  score += age < 14 ? -18 : Math.min(30, (age - 14) * 1.1);
  if (household) score += Math.min(12, (household.members.length - 1) * 4);
  if (actor.origin?.livelihood) score += 6;
  const index =
    score < 10 ? 0 : score < 28 ? 1 : score < 48 ? 2 : score < 66 ? 3 : 4;
  return standings[index];
}
