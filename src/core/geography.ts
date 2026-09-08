import type { Pack, Point } from "./types";

export type GeographicArea = { x: number; y: number; w: number; h: number };
export type GeographicPlace = Point & {
  id: string;
  name: string;
  /** Local route nodes can belong to a larger named settlement. */
  parentId?: string;
  radius: number;
  origin: "named" | "procedural";
};
export type GeographicConnection = {
  id: string;
  from: string;
  to: string;
  mode: "road" | "ferry" | "river" | "sea";
  status: "proposed" | "routed" | "blocked";
  points: Point[];
};
/** Read-only spatial queries shared by maps, generation and future transport/economy. */
export interface WorldGeography {
  packAt(x: number, y: number): Pack;
  placesIn(area: GeographicArea): GeographicPlace[];
  connectionsIn(area: GeographicArea): GeographicConnection[];
  resourcesAt(
    x: number,
    y: number,
  ): {
    habitat: string;
    water: "sea" | "river" | "lake" | "none";
    potentials: string[];
  };
}
