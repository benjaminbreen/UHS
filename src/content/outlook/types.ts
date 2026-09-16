import type { GlyphId } from "../../render/glyphs";
import type {
  CharacterScope,
  QualifiedContent,
  Rank,
} from "../characters/context-types";

/**
 * A slot. A person draws at most one stance of each kind, which is what stops
 * them holding two incompatible views at once without anyone writing out the
 * incompatibilities.
 */
export const stanceKinds = [
  /** How they hold any belief at all, rather than which one. */
  "temper",
  /** The order of things: fate, the dead, how the world is arranged. */
  "cosmic",
  /** Power, rank, and who may legitimately command. */
  "political",
  /** Conduct and the good life. */
  "ethical",
  /** Wealth, land, and work. */
  "economic",
] as const;
export type StanceKind = (typeof stanceKinds)[number];
/**
 * A closed vocabulary the machinery reads, so a coffee house can ask for
 * `reformist` without knowing what a Chartist is. The label is for the reader;
 * these are for matching.
 */
export const stanceTags = [
  "hierarchical",
  "egalitarian",
  "communal",
  "individualist",
  "traditionalist",
  "reformist",
  "revolutionary",
  "restorationist",
  "millenarian",
  "universalist",
  "particularist",
  "mystical",
  "ascetic",
  "worldly",
  "sceptical",
  "devout",
  "rationalist",
  "empirical",
  "literate",
  "oral",
  "civic",
  "martial",
  "quietist",
  "mercantile",
  "agrarian",
] as const;
export type StanceTag = (typeof stanceTags)[number];
/**
 * One position a person holds. General where the record is thin — a Neolithic
 * villager gets "the dead remain among the living" — and named where it is
 * not. Both are the same shape and sit in the same list.
 *
 * Labels are the historian's term, not the holder's self-description: nobody
 * called themselves a Marxist-Leninist in 1890 and the point is to be legible.
 */
export type Stance = QualifiedContent & {
  /**
   * One or two words for a line that has no room for a sentence. Required
   * where the label is longer than two words; a label like "Stoic" is already
   * short and omits it.
   */
  short?: string;
  /** A glyph id from `src/render/glyphs`. One per stance, so the panel can
   * show a position rather than a bullet. */
  icon: GlyphId;
  /**
   * A subjectless verb phrase, so stances can be joined into a sentence:
   * "values the judgement of the ancestors". Third person present, under ten
   * words, no clause of its own and no pronoun standing for the holder —
   * anything else stops composing the moment two are put side by side.
   */
  clause: string;
  kind: StanceKind;
  tags: readonly StanceTag[];
  scope: CharacterScope;
  /** Who held it. Absent means it crossed the ranks. */
  ranks?: readonly Rank[];
  /** Relative share of those who hold any stance of this kind here. A
   * dissenting position belongs at 1 against 20, not left out. */
  weight: number;
  /** Which way the personality draw leans toward this. Absent is neutral. */
  lean?: "orthodox" | "heterodox";
  /** Required, unlike the religious systems': every stance here is a thing
   * with a name somebody can go and read about. */
  wiki: string;
  /**
   * A position with no proper name, standing in for whatever is unrecorded.
   * Set on import for the whole `general.ts` file rather than per entry. Its
   * weight is what a thin scope needs and swamps a dense one, so a scope with
   * named traditions of the same kind discounts it.
   */
  fallback?: boolean;
};
