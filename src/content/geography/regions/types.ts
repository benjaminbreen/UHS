import type { DateRange } from "../../history/dates";
import type { WorldSetting } from "../types";

export type Coordinate = readonly [lon: number, lat: number];
export type Bounds = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
];
export type Provenance = {
  status: "documented" | "inferred" | "hypothesis" | "fictional";
  note: string;
  sources: readonly string[];
};
export type LocalDefaults = Partial<
  Pick<
    WorldSetting,
    | "culture"
    | "community"
    | "architecture"
    | "climate"
    | "settlement"
    | "settlementPattern"
    | "relief"
  >
>;
export type RegionalPlace = {
  id: string;
  name: string;
  at: Coordinate;
  dates: DateRange;
  /** A footprint can span districts; radius is the approximate fallback in tiles. */
  footprint?: readonly Coordinate[];
  radius: number;
  /** Rough population within this entry's dates; sizes the built extent. */
  population?: number;
  defaults: LocalDefaults;
  evidence: Provenance;
};
export type RegionalFeature = {
  id: string;
  dates: DateRange;
  geometry: readonly Coordinate[];
  kind:
    | "land"
    | "sea"
    | "lake"
    | "river"
    | "park"
    | "wilderness"
    | "fields"
    | "rock";
  /** Rivers use a line and half-width in tiles; other features use polygons. */
  width?: number;
  evidence: Provenance;
};
export type RegionalConnection = {
  id: string;
  from: string;
  to: string;
  mode: "road" | "ferry" | "river" | "sea";
  dates: DateRange;
  via?: readonly Coordinate[];
  evidence: Provenance;
};
export type RegionalProfile = {
  id: string;
  bounds: Bounds;
  dates: DateRange;
  /** Explicit precedence; equal-priority overlaps must not contradict one another. */
  priority: number;
  defaults: LocalDefaults;
  settlement: "procedural" | "anchored" | "none";
  places?: readonly RegionalPlace[];
  features?: readonly RegionalFeature[];
  connections?: readonly RegionalConnection[];
  evidence: Provenance;
};
