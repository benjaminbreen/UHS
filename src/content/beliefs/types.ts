import type { CharacterScope } from "../characters/context-types";
import type { Evidence } from "../history/types";

export type Power = {
  name: string;
  /** What they are asked about, in a few words. */
  domain: string;
  rank: "paramount" | "major" | "local";
  /** Place in the hierarchy, when there is one worth drawing. */
  relation?: {
    kind: "child-of" | "consort-of" | "aspect-of" | "serves";
    of: string;
  };
};
export type BeliefSystem = {
  id: string;
  label: string;
  scope: CharacterScope;
  powers: readonly Power[];
  /** Short lines: what people give, when they gather, what they avoid. */
  practice: readonly string[];
  /** Who officiates, if anyone does. */
  specialist?: string;
  afterlife?: string;
  evidence: Evidence;
};
