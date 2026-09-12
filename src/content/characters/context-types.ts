import type { CharacterAppearance } from "../../core/character";
import type { Inventory } from "../../core/types";
import type { Ecology } from "../ecology/profiles";
import type { CultureId } from "../history/types";
import type { Workplace } from "./workplace";

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
  /** Human-authored further reading for this choice; https URLs. */
  sources: readonly string[];
  /**
   * One specific fact about the practice or the surviving record — what the
   * convention is, or why it is hard to recover. Never a hedge about how
   * confident the content is.
   */
  note?: string;
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
  /**
   * Preferred over `patronymics`: a parent's name plus a suffix chosen by the
   * child's sex. A flat list of finished displays cannot know the sex, which
   * is how women ended up called -sson.
   */
  patronymic?: { parents: readonly string[]; male: string; female: string };
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
  format:
    | "personal"
    | "personal-family"
    | "family-personal"
    | "personal-patronymic";
  /**
   * Suffixes for a parent-derived element, by the child's sex. Built from a
   * parent's personal name rather than drawn from a flat list, so a woman
   * cannot end up called -sson.
   */
  patronymic?: {
    /** Parent-name forms to build on; falls back to the masculine pool. */
    parents?: readonly string[];
    male: string;
    female: string;
  };
  /**
   * When this naming tradition is attested, clamped. A region window may be
   * wider than the traditions it offers; the resolver drops options whose era
   * does not contain the year, which is what stops a 1000-year window handing
   * out names from one end of it.
   */
  era: readonly [number, number];
  sources: readonly string[];
  note?: string;
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
  /**
   * Which naming traditions this community draws on, where that differs from
   * whatever the surrounding region uses. Without it a community inherits the
   * region's traditions, which is right for the majority and wrong for anyone
   * whose names travelled with them.
   */
  nameTraditions?: readonly { tradition: string; weight: number }[];
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
  /**
   * Which kind of settlement this work belongs to; absent on the eight
   * hand-written kits. This is about settlement form, not date — when a trade
   * begins and ends is `years`, which used to be buried in here and meant the
   * catalogue was identical from 3000 BCE to 1600 CE.
   */
  tier?: "prehistoric" | "village" | "town" | "industrial" | "modern";
  /** When this work exists at all. Half-open, astronomical years. */
  years?: readonly [number, number];
  /** Where, when the work is local to a region. [W, S, E, N]. */
  bounds?: readonly [number, number, number, number];
  cultures?: readonly CultureId[];
  /** Work tied to what grows here: a reindeer herder needs tundra. */
  ecologies?: readonly Ecology[];
  /** A settlement smaller than this cannot support the trade. */
  minPopulation?: number;
  /**
   * Relative share of the workforce. Everything used to be drawn uniformly, so
   * twelve adults held ten different trades and nobody grew any food.
   */
  weight?: number;
  /** Where the day happens. Falls back to reading it off `activity`. */
  workplace?: Workplace;
  /**
   * Work whose title comes from whatever people here believe, rather than
   * being one label everywhere: an officiant of the local belief system, named
   * for the power they attend. One row stands for a priest of Amun-Ra, a
   * Lutheran minister and a curaca.
   */
  fromBeliefs?: boolean;
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
