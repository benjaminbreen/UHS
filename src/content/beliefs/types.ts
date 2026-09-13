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
  /** A holy person asked to pray to the divine on someone's behalf. */
  | "intercedes-before"
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
/**
 * Someone who officiates. Tiers run from the household up to the one office a
 * whole polity has; the weights make the high offices rare, so a hamlet has
 * elders and only a city has a high priest.
 */
export type Officiant = {
  tier: "household" | "local" | "temple" | "paramount";
  label: string;
  /** Which rank of power this office attends, for naming the role. */
  serves?: "paramount" | "major" | "local";
  weight: number;
};
export type BeliefSystem = {
  id: string;
  label: string;
  scope: CharacterScope;
  /** English Wikipedia article for the tradition itself; the fallback for any
   * power without one of its own. */
  wiki?: string;
  powers: readonly Power[];
  /** Named figures who may matter especially to one person. Nothing is chosen
   * implicitly: many traditions have no concept resembling a patron. */
  patronOptions?: readonly string[];
  /** Short lines: what people give, when they gather, what they avoid. */
  practice: readonly string[];
  /** Who officiates, if anyone does. */
  specialist?: string;
  afterlife?: string;
  evidence: Evidence;
};
