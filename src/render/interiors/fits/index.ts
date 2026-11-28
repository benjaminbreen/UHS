import { boxoffice } from "./boxoffice";
import { concessions, concessionsClassic } from "./concessions";
import { grocer } from "./grocer";
import { overlookKitchen, overlookLobby } from "./overlook";
import { thermopolium } from "./thermopolium";

/** A shop fitted out from hand-drawn pieces. Grids use the shared letters of
 * `sprites.ts`; `ink` gives the fit its own letters, read first, for colours
 * that belong to the goods and not the room: labels, enamel, fruit, marble. */
export type Fit = {
  ink: Record<string, number>;
  grids: Record<string, string[]>;
  /** Units along the back wall, two tiles wide, taken in turn. Goods stand
   * in runs on each shelf: [first column, last column, the row they stand on]. */
  wall: { grid: string; shelves?: [number, number, number][]; goods?: string[] }[];
  /** Pieces one tile wide for a column of wall left over between the units. */
  narrow?: string[];
  /** 8 px ends and a 16 px middle that repeats. Goods stand on row `top`, the first always. */
  counter: { grid: string; top: number; goods: string[] };
  /** Groups set on the floor against the side walls, two tiles wide at most. */
  floor: string[];
  /** Hung on the wall where a house would hang a picture. */
  hung: string[];
};

/** By the shop's stock style (`styles.stock`). */
export const FITS: Record<string, Fit> = { boxoffice, concessions, "concessions-classic": concessionsClassic, grocery: grocer, "overlook-lobby": overlookLobby, "overlook-kitchen": overlookKitchen, thermopolium };
