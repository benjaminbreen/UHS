import type { GeographicName } from "./naming";
export type Coordinate = { lon: number; lat: number };
export type TravelLocation = Coordinate & {
  id: string;
  name: string;
  landscape: string;
  kind: "settlement" | "landscape";
  importance: number;
  settlement?: {
    from: number;
    to?: number;
    rank: "town" | "city";
    source: string;
  };
  note?: string;
};
export type TravelMode = "land" | "sea" | "mixed";
export type TravelQuery = {
  from: string;
  to: string;
  via: string[];
  year: number;
  spacing: number;
  mode: TravelMode;
};
export type TravelCell = Coordinate & {
  naming: GeographicName;
  regionId?: string;
  id: string;
  water: boolean;
  relief: number;
  climate: string;
  culture: string;
  name: string;
};
export type TravelStop = TravelCell & {
  transition?: "embark" | "disembark";
  locationId?: string;
  settlement: "city" | "town" | "unresearched" | "none";
  reason: string;
  km: number;
  pathIndex: number;
  size: number;
  note: string;
};
export type TravelLeg = {
  from: string;
  to: string;
  km: number;
  snappedKm: number;
};
export type TravelResult = {
  query: TravelQuery;
  cells: TravelCell[];
  stops: TravelStop[];
  legs: TravelLeg[];
  km: number;
  expanded: number;
  warnings: string[];
};
