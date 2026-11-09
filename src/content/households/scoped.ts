import { matchesCharacterScope } from "../characters/resolve";
import type { CharacterScope, QualifiedContent } from "../characters/context-types";
import type { WorldSetting } from "../geography/types";

export type HouseholdCustom = QualifiedContent & {
  scope: CharacterScope;
  priority: number;
  evidence: "documented" | "inferred";
};

/** The most particular custom that covers this place and year. */
export const customFor = <T extends HouseholdCustom>(list: readonly T[], setting?: WorldSetting): T | undefined =>
  setting && list
    .filter((c) => matchesCharacterScope(c.scope, setting, "*"))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))[0];

/** One of `lines` for this person, the same each time. */
export const lineFor = (lines: readonly string[], roll: number) => lines[Math.floor(roll * lines.length)];
