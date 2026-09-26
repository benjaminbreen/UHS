import type { CharacterScope, QualifiedContent, Rank } from "../characters/context-types";
import type { Evidence } from "../history/types";
import type { StanceTag } from "../outlook/types";
import type { StationActivity } from "../../core/itinerary";
import type { SocialRelation, Stats } from "../../core/types";
import type { PersonalBelief } from "../beliefs";

/** Why a person does this today. Every trigger on an occasion must hold. */
export type Trigger =
  /** The day an event in the household's history falls on, years later. */
  | { type: "anniversary"; kind: "wed" | "died" | "born-self"; as?: readonly string[] }
  | { type: "observance"; levels: readonly PersonalBelief["observance"][] }
  /** A power in their tradition whose domain matches their work. */
  | { type: "craft-power" }
  | { type: "patron" }
  | { type: "trait"; key: keyof Stats; above?: number; below?: number }
  | { type: "tag"; any: readonly StanceTag[] }
  | { type: "kin"; kind: SocialRelation["kind"]; minAge?: number; maxAge?: number }
  | { type: "seek-match" }
  | { type: "fortune"; above?: number; below?: number }
  | { type: "rank"; any: readonly Rank[] }
  | { type: "season"; any: readonly string[] }
  | { type: "work"; match: RegExp }
  /** A seeded roll against this chance, per person per day. */
  | { type: "chance"; p: number }
  /** Day of a repeating count of game days: a market day, a rest day. */
  | { type: "cycle"; every: number; on: number }
  /** Day of the solar year, 1-366, northern reckoning. */
  | { type: "date"; dayOfYear: number }
  | { type: "sex"; is: "female" | "male" }
  | { type: "adult" };

/** Where the station goes, resolved against the settlement plan. */
export type PlaceWant =
  | "home"
  | "hearth"
  | "well"
  | "sanctuary"
  | "market"
  | "gathering"
  | "wild"
  | "edge"
  | "work"
  /** Somebody else's door, a real walk away. */
  | "door"
  | { kin: SocialRelation["kind"] }
  | { venue: string };

/**
 * Something a person might do on a particular day that is not their work
 * cycle, and why. The picker fills `{partner}`, `{child}`, `{parent}`,
 * `{patron}`, `{craftPower}`, `{paramount}`, `{nth}`, `{years}`, `{dead}` and
 * `{place}` from the person's own household, tradition and settlement.
 */
export type Occasion = QualifiedContent & {
  scope: CharacterScope;
  evidence: Evidence["status"];
  when: readonly Trigger[];
  weight: number;
  /** A stand-in for whatever is unrecorded; discounted where named ones apply. */
  fallback?: boolean;
  part: "morning" | "midday" | "evening";
  place: PlaceWant;
  activity: StationActivity;
  minutes: number;
  carry?: "basket" | "vessel" | "bundle";
  text: string;
  /** Life aims this serves; the current aim weighs it up. */
  serves?: readonly string[];
};

/**
 * A day the whole settlement keeps. Dated on the compressed game calendar by
 * day of the solar year, or by a repeating count of days.
 */
export type Festival = QualifiedContent & {
  scope: CharacterScope;
  evidence: Evidence["status"];
  /** Day of the year, 1-366, northern reckoning; or a repeating cycle. */
  date: { dayOfYear: number } | { every: number; on: number };
  /** True where nobody works: the day's stations are replaced by the gathering. */
  rest: boolean;
  place: "sanctuary" | "market" | "gathering" | "hearth" | "edge";
  text: string;
  minutes: number;
};
