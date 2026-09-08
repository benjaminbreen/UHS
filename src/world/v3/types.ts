import type {
  Actor,
  Place,
  Point,
  Terrain,
  WorldModel,
  WorldObject,
} from "../../core/types";
import type { SettlementProfile } from "../../content/settlements/profiles";
export type Rect = Point & { w: number; h: number };
export type Site = {
  id: string;
  cx: number;
  cy: number;
  center: Point;
  home: boolean;
  profile: SettlementProfile;
  name?: string;
  namedId?: string;
  pack?: import("../../core/types").Pack;
  accepts?(x: number, y: number): boolean;
};
export type Road = {
  id: string;
  points: Point[];
  width: number;
  kind: "street" | "lane" | "path" | "bridge";
  cost: number;
};
export type Plot = Rect & {
  id: string;
  kind: "household" | "field" | "pasture" | "public";
  owner?: string;
  access: Point;
};
export type WorkSite = {
  home: Point;
  work: Point;
  water: Point;
  social: Point;
  pasture?: Point;
  gateId?: string;
  label: string;
  offset: number;
};
export type SettlementPlan = {
  site: Site;
  roads: Road[];
  plots: Plot[];
  places: Place[];
  objects: WorldObject[];
  actors: Actor[];
  enclosures: WorldModel["enclosures"];
  surface: Map<string, Terrain>;
  streetSurfaces?: Map<
    string,
    import("../../content/settlements/streets/palettes").StreetSurface
  >;
  pavement?: Map<string, "square" | "footway">;
  traffic: Set<string>;
  reserved: Set<string>;
  solid: Set<string>;
  work: Map<string, WorkSite>;
  slots: Map<string, { yard: Point[]; work: Point[] }>;
  spawn: Point;
  diagnostics: { routeFailures: number; rejectedBuildings: number };
};
export const cellKey = (x: number, y: number) => `${x},${y}`;
export const inside = (r: Rect, x: number, y: number) =>
  x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
export function eachCell(r: Rect, fn: (x: number, y: number) => void) {
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) fn(x, y);
}
