import type { CharacterScope } from "../characters/context-types";
import type { Evidence } from "../history/types";

export type RelationKind =
  /** Descent, either way round: draw the arrow from the child. */
  | "child-of"
  | "consort-of"
  | "sibling-of"
  /** One face of a larger power, or an emanation of it. */
  | "aspect-of"
  /** Attends, carries messages for, or works under. */
  | "serves"
  /** Opposed, in the stories people tell. */
  | "rival-of"
  /** Taught by, or founded the line that teaches. */
  | "taught-by";
export type Relation = { kind: RelationKind; of: string };
export type Power = {
  name: string;
  /** English Wikipedia article for this power, where one exists. The panel
   * falls back to the system's own article. */
  wiki?: string;
  /** Where the name is a linguistic reconstruction rather than a recorded one:
   * "Proto-Uralic *ilma, 'sky, air'". The asterisk belongs in the name. */
  gloss?: string;
  /** What they are asked about, in a few words. */
  domain: string;
  rank: "paramount" | "major" | "local";
  /** How this power stands to others in the same list. More than one is
   * normal: a god is commonly the child of one and the consort of another. */
  relations?: readonly Relation[];
};
export type BeliefSystem = {
  id: string;
  label: string;
  scope: CharacterScope;
  /** English Wikipedia article for the tradition itself; the fallback for any
   * power without one of its own. */
  wiki?: string;
  powers: readonly Power[];
  /** Short lines: what people give, when they gather, what they avoid. */
  practice: readonly string[];
  /** Who officiates, if anyone does. */
  specialist?: string;
  afterlife?: string;
  evidence: Evidence;
};
