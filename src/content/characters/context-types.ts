import type { CharacterAppearance } from "../../core/character";
import type { Inventory } from "../../core/types";
import type { CultureId, Evidence } from "../history/types";

/** Exact-year, local scopes; never a culture × era Cartesian product. */
export type CharacterScope = {
  years: readonly [number, number]; // start inclusive, end exclusive; astronomical years
  cultures?: readonly CultureId[];
  places?: readonly string[];
  bounds?: readonly [number, number, number, number]; // west, south, east, north
  communities?: readonly string[]; // structured community IDs, not substring guesses
};
export type QualifiedContent = {
  id: string;
  label: string;
  evidence: Evidence;
};
export type NameKit = QualifiedContent & {
  scope: CharacterScope;
  /** Personal names may themselves contain multiple words; never split on spaces. */
  names: readonly string[];
  format?:
    | "personal"
    | "family-personal"
    | "personal-family"
    | "personal-two-families"
    /** A personal name plus a non-hereditary parent-derived element. */
    | "personal-patronymic";
  familyNames?: readonly string[];
  secondFamilyNames?: readonly string[];
  /** Complete patronymic/metronymic displays; never inherited as a family name. */
  patronymics?: readonly string[];
};
/** Palette weights are art direction, never measured demographic probabilities. */
export type AppearanceKit = QualifiedContent & {
  skin: readonly string[];
  hairColors: readonly string[];
  hairStyles: readonly CharacterAppearance["hair"][];
  garments: readonly CharacterAppearance["wearing"]["garment"][];
};
export type CommunityProfile = QualifiedContent & {
  scope: CharacterScope;
  priority: number;
  appearance: string;
  livelihoods: readonly string[];
  allowedItems: readonly (keyof Inventory)[];
};
export type Livelihood = {
  id: string;
  label: string;
  activity: string;
  needs?: readonly ("water" | "settled" | "cultivation")[];
  inventory: Inventory;
};
