import type { CharacterScope, Rank } from "../characters/context-types";
import type { QualifiedContent } from "../characters/context-types";
import type { StanceTag } from "../outlook/types";
import type { StationActivity } from "../../core/itinerary";

/**
 * What a place is for, rather than what it is called. Fifteen of these cover
 * the game's range; the named institution — an opera house, a noh stage, a
 * picture palace — is a `Venue` scoped to a time and a culture.
 */
export const venueKinds = [
  "market",
  "tavern",
  "coffee-house",
  "temple-yard",
  "bath",
  "theatre",
  "arena",
  "assembly",
  "lodge",
  "school",
  "crossroads",
  "gaming-house",
  "shrine",
  "promenade",
  "washing-place",
] as const;
export type VenueKind = (typeof venueKinds)[number];
/**
 * Somewhere people go when the day's work is done. Resolved twice: once by the
 * planner, to decide which exist in this settlement, and once per person, to
 * decide which draws them.
 */
export type Venue = QualifiedContent & {
  kind: VenueKind;
  scope: CharacterScope;
  /** Smallest settlement that can support it, in buildings. */
  minBuildings: number;
  /** Who is admitted. Absent means anyone. */
  ranks?: readonly Rank[];
  /** Outlooks it draws. Matched against the person's tags. */
  tags?: readonly StanceTag[];
  /** Work that has its own room: a guild hall, a union hall. */
  livelihoods?: readonly string[];
  /** Where in the day it belongs. The itinerary is a sequence rather than a
   * clock, so this places the station rather than timing it. */
  slot: "midday" | "evening";
  minutes: number;
  activity: StationActivity;
  /** Relative draw among the venues a person is admitted to. */
  weight: number;
  /** The same institution housed differently by date: first match wins,
   * else `building`. */
  eras?: readonly {
    from: number;
    to: number;
    building: string;
    /** Only where the settlement's culture is one of these. */
    cultures?: readonly string[];
  }[];
  /** True where the venue is street, water or ground rather than a building,
   * and the planner should not give it a lot. */
  open?: boolean;
  /**
   * What hangs at the door. Until each archetype has a building of its own,
   * this is how a tavern is told from the house beside it — and it is how
   * they were told apart for most of history anyway.
   */
  sign?: "board" | "lantern";
  /** The object that stands outside it: a `sacred-marker` sprite variant,
   * with its own name and description. */
  marker?: { variant: number; name: string; description: string };
  /**
   * A building recipe of its own, from `src/content/graphics/theatres.json`
   * and its like. Absent means the venue takes an ordinary house with a mark
   * at the door, which is the fallback every archetype starts on.
   */
  building?: string;
};
