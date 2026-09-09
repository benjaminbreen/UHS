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
/**
 * A naming tradition's components, gendered. Ported from the Historical Persona
 * Generator; see scripts/port-name-kits.ts.
 */
export type NameTradition = {
  id: string;
  label: string;
  masculine: readonly string[];
  feminine: readonly string[];
  /** Empty where the tradition carries no family element at all. */
  familyNames: readonly string[];
  /** Share of people in this tradition who carry no family name, 0-1. */
  noFamilyName: number;
  format: "personal" | "personal-family" | "family-personal";
  note: string;
};
/** Which traditions are drawn on in a place, and in which years. */
export type NameRegion = {
  id: string;
  label: string;
  bounds: readonly [number, number, number, number]; // west, south, east, north
  culture: CultureId;
  windows: readonly {
    years: readonly [number, number];
    options: readonly { tradition: string; weight: number }[];
  }[];
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
export type SocietyCapability =
  | "writing"
  | "metallurgy"
  | "settled_agriculture"
  | "heritable_land"
  | "draft_animals"
  | "guilds"
  | "coinage"
  | "urban_settlement"
  | "european_contact"
  | "market_exchange"
  | "wage_labor"
  | "retained_military_service"
  | "guild_apprenticeship";
/** What a society could do in a culture, between these years. */
export type CapabilityWindow = {
  capability: SocietyCapability;
  culture: CultureId;
  from: number;
  to: number;
};
export type CapabilityOverride = {
  id: string;
  label: string;
  bounds: readonly [number, number, number, number];
  cultures?: readonly CultureId[];
  capabilities: Partial<Record<SocietyCapability, number>>;
};
export type Livelihood = {
  id: string;
  label: string;
  activity: string;
  /** Ordinary-work tier; absent on the eight hand-written kits. */
  tier?: "prehistoric" | "village" | "town" | "industrial" | "modern";
  needs?: readonly ("water" | "settled" | "cultivation")[];
  /** All of these must be available here. */
  capabilities?: readonly SocietyCapability[];
  /** At least one must be, for work with more than one basis. */
  anyCapability?: readonly SocietyCapability[];
  /** None may be: work a later capability puts an end to. */
  withoutCapability?: readonly SocietyCapability[];
  /** Work done overwhelmingly by one sex where that is documented. */
  sex?: "male" | "female";
  inventory: Inventory;
};
