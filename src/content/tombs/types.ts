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

/** The painter keys a find may use; each is drawn in `render/tomb/things.ts`. */
export const TOMB_ART = [
  "sarcophagus", "shrine", "coffin", "canopic", "chest", "jars", "statue", "bed", "baskets", "vessels", "lamp", "debris", "blocking",
  "painting", "stela", "niche", "sketch",
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
  finds: readonly TombFind[];
  note: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
};
