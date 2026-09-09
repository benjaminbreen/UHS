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
/** What a paved cell is for; the raster grades its stones by this. */
/** How a street cell is used. `verge` marks a planted grass strip between a
 * roadway and its footway; the cell's surface is grass, not paving, and a kerb
 * is drawn where paving meets it. */
export type Pavement = "square" | "dais" | "footway" | "lane" | "verge";
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
  /** Where density concentrates, in local tile coordinates. Omitted, the
   * public square is the one core. */
  cores?: { x: number; y: number; radius: number; weight?: number }[];
  /** Built extent's width over its height, where the place says so. */
  aspect?: number;
};
export type Road = {
  id: string;
  points: Point[];
  /** Half-width; a symmetric road covers `width` cells either side. */
  width: number;
  /** Total cells across, for even widths a half-width cannot express. */
  span?: number;
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
  pavement?: Map<string, Pavement>;
  traffic: Set<string>;
  reserved: Set<string>;
  solid: Set<string>;
  work: Map<string, WorkSite>;
  /** Places people stop to talk, spread through the settlement. */
  gatherings?: Point[];
  /** Country round the settlement, kept for routines built after planning. */
  outdoors?: { wild: Point[]; shore?: Point; quarry?: Point; roadOut?: Point };
  /** Ordered daily errands per resident; the world turns these into routes. */
  stations: Map<string, import("../../core/itinerary").Station[]>;
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
