import type { CueKind } from "./combat";

/**
 * What a person currently makes of the player, and how a change in it shows.
 * One place, because the portrait, the gauge under their name, the mark the
 * world pops over their head and the prompt the model is given all have to
 * agree about where the lines fall.
 */

/** The gauge is five notches wide; the middle one is having just met. */
export const REGARD_NOTCHES = 5;
/** Below this they are wary; at or above `WARM` they are genuinely warm. */
export const WARY = 0;
export const WARM = 2;

export function regardNotches(trust: number) {
  return Math.max(0, Math.min(REGARD_NOTCHES, trust + 2));
}

export function regardLabel(trust: number) {
  return trust < WARY
    ? trust <= -3
      ? "Hostile"
      : "Wary"
    : trust >= WARM
      ? trust >= 4
        ? "Devoted"
        : "Warm"
      : trust >= 1
        ? "Friendly"
        : "Neutral";
}

/**
 * How someone shows a change in what they think of the player. A loss angers.
 * A gain warms only when it takes them over into real warmth, so the heart
 * marks the threshold rather than appearing after every kind word. Everything
 * else is a nod.
 */
export function regardCue(delta: number, trust: number): CueKind {
  if (delta < 0) return "anger";
  return delta >= 2 || (trust >= WARM && trust - delta < WARM) ? "warm" : "nod";
}
