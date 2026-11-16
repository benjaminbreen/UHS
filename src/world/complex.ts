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
};
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
};

/** The first open cell beside `at`, for someone arriving by a hole or ladder. */
export function landing(at: Point, blocked: (x: number, y: number) => boolean | undefined, fallback: Point): Point {
  return [[0, 1], [-1, 0], [1, 0], [0, -1], [1, 1], [-1, 1]].map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy })).find((q) => !blocked(q.x, q.y)) ?? fallback;
}
