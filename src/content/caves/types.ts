
/** What the rock and the place make of a hollow. */
export type CaveKind = "karst" | "sandstone" | "lava" | "fissure" | "sea" | "ice";

/** [west, south, east, north] in degrees. */
export type Box = readonly [number, number, number, number];

export type CaveFind = {
  id: string;
  name: string;
  /** The painter's key in `render/cave/finds.ts`. */
  art: string;
  /** A wall find is drawn on a north face and used from the cell below it. */
  on: "wall" | "floor";
  /** Nodes are the rock's own; the rest is what people and animals left. */
  tier: "node" | "common" | "notable" | "prize";
  /** Astronomical years, inclusive. */
  years?: readonly [number, number];
  where?: readonly Box[];
  kinds?: readonly CaveKind[];
  /** Levels it turns up on, 1 the mouth chamber. */
  depth?: readonly [number, number];
  weight?: number;
  /** What the key does: "Take the flints". */
  verb: string;
  /** Game seconds the work takes. */
  time?: number;
  /** Item counts, or a [low, high] range rolled per cave. */
  loot?: Readonly<Record<string, number | readonly [number, number]>>;
  /** Seconds of light it adds: a torch stub, a jar of lamp oil. */
  fuel?: number;
  heal?: number;
  /** What the player is told when they use it. */
  text: string;
  /** What they are told when they look at it. */
  look: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
  /** Stays as it is once used: a painting is still a painting. */
  keeps?: boolean;
  /** Lets feet past: a scatter on the floor rather than a thing in the way. */
  flat?: boolean;
  /** Colour of the light it gives off. */
  glow?: string;
};

export type CaveLight = {
  id: string;
  name: string;
  years: readonly [number, number];
  /** Game seconds a fresh one lasts. */
  burns: number;
  /** Cells it lights. */
  reach: number;
  /** A flame flickers, warms the rock and keeps animals back. */
  flame: boolean;
  color: string;
  /** What the player is told at the mouth. */
  lit: string;
  out: string;
};
