import type { Inventory, Point } from "../core/types";

/** A complex is a set of areas the player walks between, each generated from
 * the seed when first reached: a cave's levels, a sewer's, a mine's. */

export const N4 = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

export type AreaThing = {
  id: string;
  find: string;
  x: number;
  y: number;
  /** On a north face: used from the cell below. */
  wall: boolean;
  solid: boolean;
  /** Art key, with any variant the generator chose. */
  art: string;
  name: string;
  loot: Inventory;
  /** Cells wide and deep, from x,y to the right and down; one when unset. */
  w?: number;
  h?: number;
};
/** A way through to another area: a strip of an edge, or a doorway. Standing
 * in it takes the player to the matching exit of `to`, one step inside it. */
export type AreaExit = { x: number; y: number; w: number; h: number; to: string; name: string; inward: number };
export type AreaDecor = { type: string; x: number; y: number; solid: boolean; v: number };
/** Someone in an area when the player arrives, by the content id they are generated from. */
export type AreaFolk = { id: string; person: string; x: number; y: number; sex: "male" | "female"; age: number };

/** What every area of every complex has. */
export type Area = {
  space: string;
  depth: number;
  name: string;
  w: number;
  h: number;
  cells: Uint8Array;
  entry: Point;
  down?: Point;
  things: AreaThing[];
  decor: AreaDecor[];
  folk: AreaFolk[];
  /** Which way the water runs in each wet cell: 0 N, 1 E, 2 S, 3 W, -1 still. */
  flow: Int8Array;
  exits?: AreaExit[];
};

/** The exit whose strip covers a cell. */
export const exitAt = (area: Area, x: number, y: number) => area.exits?.find((e) => x >= e.x && y >= e.y && x < e.x + e.w && y < e.y + e.h);

/** Where someone coming through from `from` stands in `area`: inside the exit that leads back. */
export function arrivalFrom(area: Area, from: string): Point | undefined {
  const e = area.exits?.find((x) => x.to === from);
  if (!e) return undefined;
  const [dx, dy] = N4[e.inward];
  return { x: e.x + Math.floor(e.w / 2) + dx, y: e.y + Math.floor(e.h / 2) + dy };
}

/** The first open cell beside `at`, for someone arriving by a hole or ladder. */
export function landing(at: Point, blocked: (x: number, y: number) => boolean | undefined, fallback: Point): Point {
  return [[0, 1], [-1, 0], [1, 0], [0, -1], [1, 1], [-1, 1]].map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy })).find((q) => !blocked(q.x, q.y)) ?? fallback;
}
