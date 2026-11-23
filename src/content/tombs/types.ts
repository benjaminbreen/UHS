import type { Box } from "../sewers/types";

/** What an area of a tomb is cut as. The planner strings these into a tomb. */
export type TombRole =
  /** The stair down from the hillside. */
  | "entrance"
  /** A long passage on the tomb's axis. */
  | "corridor"
  /** A room with a shaft in its floor, the only way on. */
  | "well"
  /** A pillared room. */
  | "hall"
  /** A side room of grave goods. */
  | "store"
  /** A side room the cutters never finished. */
  | "cutting"
  /** Where the dead lie. */
  | "burial";

/** The painter keys a find may use; each is drawn in `render/tomb/paint.ts`. */
export const TOMB_ART = [
  "sarcophagus", "shrine", "coffin", "canopic", "chest", "jars", "statue", "bed", "baskets", "vessels", "lamp", "debris", "blocking",
  "painting", "stela", "niche", "sketch", "bones",
] as const;
export type TombArt = (typeof TOMB_ART)[number];

export type TombFind = {
  id: string;
  name: string;
  art: TombArt;
  on: "wall" | "floor";
  /** A seal is a blocked doorway: the planner puts it across a passage. */
  tier: "common" | "notable" | "prize" | "seal";
  /** The areas it turns up in; anywhere when unset. */
  roles?: readonly TombRole[];
  weight?: number;
  /** Cells wide and deep. */
  w?: number;
  h?: number;
  /** Lies on the floor and is walked over. */
  flat?: boolean;
  verb: string;
  /** Game seconds the work takes. */
  time?: number;
  loot?: Readonly<Record<string, number | readonly [number, number]>>;
  /** Seconds of light it adds. */
  fuel?: number;
  /** Still stands there once used. */
  keeps?: boolean;
  text: string;
  look: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
};

/** A tradition of tomb building: where, when, what its rooms are called and what was left in them. */
export type TombStyle = {
  id: string;
  name: string;
  where: Box;
  /** Astronomical years in which one can be found and entered. */
  years: readonly [number, number];
  /** What each kind of area is called, first use first. */
  names: Readonly<Record<TombRole, readonly string[]>>;
  /** Said on going in. */
  enter: string;
  /** Said on coming out, and what the stair comes out onto. */
  leave: string;
  surface: string;
  /** How its walls, floors and pillars are drawn. */
  look: "painted-rock" | "crypt";
  /** Entered by a doorway in a cliff face, where the map has one. */
  cliff?: boolean;
  /** Who a start down here plays, by the year the start is in. */
  roles: readonly (readonly [number, string])[];
  /** Where and when a start that names no place opens. */
  place: readonly [string, number];
  plan: {
    /** Well rooms with a shaft to a lower level. */
    shafts: boolean;
    pillars: boolean;
    /** Areas on the axis between the stair and the burial: the fewest, and how many more at most. */
    axis?: readonly [number, number];
    /** Odds of a side room off each side of an area. */
    side?: Partial<Record<TombRole, number>>;
    litter: readonly string[];
  };
  finds: readonly TombFind[];
  note: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
};

/** A find, on the wall when its art is painted or cut there. */
export const tombFindOf = (id: string, name: string, art: TombArt, tier: TombFind["tier"], verb: string, look: string, text: string, more: Partial<TombFind> = {}): TombFind =>
  ({ id, name, art, on: ["painting", "stela", "niche", "sketch"].includes(art) ? "wall" : "floor", tier, verb, look, text, basis: "documented", ...more });
