import type { Position } from "./types";

export const faunaStates = [
  "idle",
  "rest",
  "forage",
  "graze",
  "wander",
  "flee",
  "stalk",
  "chase",
  "perch",
  "takeoff",
  "flight",
  "approach",
  "landing",
] as const;

export type FaunaState = (typeof faunaStates)[number];
export const aerialStates = new Set<FaunaState>([
  "takeoff",
  "flight",
  "approach",
  "landing",
]);

/** One animal's cell and facing, numbered as for actors: 0 north, 1 east,
 * 2 south, 3 west. Side-view species only ever hold 1 or 3. */
export type FaunaMember = { x: number; y: number; direction: 0 | 1 | 2 | 3 };

/** One simulation decision drives every member; members keep their own cells
 * so a person can corner one. */
export type FaunaGroup = {
  id: string;
  speciesId: string;
  members: FaunaMember[];
  /** The leader's cell; other members keep near it. */
  pos: Position;
  home: Position;
  homeRadius: number;
  state: FaunaState;
  target?: Position;
  nextDecisionAt: number;
  /** Steps banked between ticks: a pace under one waits, over one hurries. */
  stride: number;
  /** Clock at which the current state began. */
  since: number;
  /** Something has been noticed: the clock at which the group will act on it.
   * Until then it has its head up, watching. Cleared when the threat goes. */
  alarm?: number;
  /** How hard the last fright was, 0 to 1. It sets the pace of the run and
   * eases off once whatever caused it has gone. */
  panic?: number;
  /** Seconds of hard running banked. A blown animal cannot keep the pace up. */
  hard?: number;
  /** Hunters: the clock after which this group hunts again. A kill feeds a
   * pack for the best part of a day. */
  fedUntil?: number;
  /** Hunters: the group being hunted, held between ticks so a pack does not
   * swap quarry whenever another herd drifts closer. */
  quarry?: string;
  /** Kept animals: who tends them, which gate they pass, where they graze. */
  owner?: string;
  gateId?: string;
  pasture?: Position;
};
