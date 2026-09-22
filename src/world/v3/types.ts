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
  /** Stable lifecycle seam for later paving, neglect and reuse. */
  baselineYear?: number;
  state?: "used" | "disused" | "ruined";
  condition?: number;
};
export type Plot = Rect & {
  id: string;
  kind: "household" | "field" | "pasture" | "public";
  owner?: string;
  access: Point;
  baselineYear?: number;
  state?: "used" | "fallow" | "abandoned";
};
export type WorkSite = {
  home: Point;
  work: Point;
  water: Point;
  social: Point;
  pasture?: Point;
  gateId?: string;
  /** A drying rack this household keeps, if their work is on the water. */
  rackId?: string;
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
  /** Kept animals as groups: the pen herd, the yard flock. */
  fauna?: import("../../core/fauna").FaunaGroup[];
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
  /** Shared interpretation of solid, traffic and visual keep-out cells. */
  placement: import("./placement").PlacementClaims;
  /** Building footprints only: what wears the ground round it. */
  built?: Set<string>;
  work: Map<string, WorkSite>;
  /** Places people stop to talk, spread through the settlement. */
  gatherings?: Point[];
  /** Somewhere to go when the work is done. Open venues have no building and
   * borrow a gathering point; the rest name a door. */
  venues?: {
    venue: import("../../content/venues").Venue;
    pos: Point;
    placeId?: string;
  }[];
  /** Country round the settlement, kept for routines built after planning. */
  outdoors?: { wild: Point[]; shore?: Point; quarry?: Point; roadOut?: Point };
  /** Farmland round the town: crop per cell, the parcels, and the territory
   * with its lanes and the slots kept free for outlying sites. */
  fields?: Map<string, import("./farmland").FieldCell>;
  canals?: Set<string>;
  /** The canals stand empty this season: dug, banked, but unwatered. */
  canalsDry?: boolean;
  culverts?: Set<string>;
  parcels?: import("./farmland").Parcel[];
  territory?: import("./farmland").Territory;
  /** Ordered daily errands per resident; the world turns these into routes. */
  stations: Map<string, import("../../core/itinerary").Station[]>;
  slots: Map<string, { yard: Point[]; work: Point[] }>;
  spawn: Point;
  diagnostics: {
    routeFailures: number;
    rejectedBuildings: number;
    /** Milliseconds per planning phase. */
    timing?: Record<string, number>;
  };
};
export const cellKey = (x: number, y: number) => `${x},${y}`;
export const inside = (r: Rect, x: number, y: number) =>
  x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
export function eachCell(r: Rect, fn: (x: number, y: number) => void) {
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) fn(x, y);
}
