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

/** One simulation decision can drive several presentation-only flock members. */
export type FaunaGroup = {
  id: string;
  speciesId: string;
  memberCount: number;
  pos: Position;
  home: Position;
  homeRadius: number;
  state: FaunaState;
  target?: Position;
  targetGroupId?: string;
  landingSiteId?: string;
  nextDecisionAt: number;
};
