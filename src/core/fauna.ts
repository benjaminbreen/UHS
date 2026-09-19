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
export type FaunaMember = {
  x: number;
  y: number;
  direction: 0 | 1 | 2 | 3;
  /** Stable within the group, so a death does not renumber the rest. Absent
   * until the engine first sees the animal, like `tier` and `hp`. */
  n?: number;
  tier?: "weak" | "ordinary" | "strong" | "very-strong" | "legendary";
  hp?: number;
  /** Clock until which a blow has it reeling: it does not move. */
  stun?: number;
  /** Legendaries only: "the grey boar of the ford". */
  name?: string;
  /** Art to show instead of the group's, while this one is doing something
   * the rest are not: pawing the ground, running in. */
  pose?: FaunaState;
};

/** One animal's attack on the player, a phase at a time. `dir` is fixed when
 * the run starts, which is what makes a sidestep work. */
export type FaunaAttack = {
  n: number;
  phase: "windup" | "charge" | "recover";
  until: number;
  dir?: { x: number; y: number };
  from?: { x: number; y: number };
  /** Cells run so far. */
  ran?: number;
};

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
  /** The last member number handed out. */
  serial?: number;
  /** Clock until which the group runs from people because one of them hit it.
   * Kept animals need this: nothing else makes a sheep bolt from its herder. */
  hurtUntil?: number;
  /** Clock until which the group means the player harm. */
  provoked?: number;
  attack?: FaunaAttack;
  /** Packs: how far round the ring they have worked, in eighths of a turn. */
  ring?: number;
  /** Kept animals: who tends them, which gate they pass, where they graze. */
  owner?: string;
  gateId?: string;
  pasture?: Position;
};
