import type { Box } from "../sewers/types";

/** What an area of a fair is laid out as. */
export type FairArchetype =
  /** Open grounds: avenues, lawns, beds, basins, and buildings along the top. */
  | "grounds"
  /** The river crossing: a bridge over water between two quays. */
  | "bridge"
  /** A long exhibition gallery: bays of stands between rows of columns. */
  | "hall"
  /** One building's single room of exhibits, entered from the grounds. */
  | "pavilion"
  /** A machinery hall: big engines in rows, a central aisle. */
  | "machines"
  /** A platform of a tower: a railed deck round the open middle. */
  | "platform";

/** How a building's front is drawn; each is a painter in `scripts/art/front_fair.py`. */
export type PavilionStyle =
  | "iron-glass" | "aztec" | "inca" | "siamese" | "classical" | "timber" | "moorish" | "pagoda" | "khmer"
  | "dome-central" | "formige" | "tower";

export type FairBuilding = {
  id: string;
  name: string;
  style: PavilionStyle;
  /** Footprint in cells, front wall first. */
  w: number;
  h: number;
  /** Left edge of the footprint in the area, in cells; the front wall stands on the area's top band. */
  x: number;
  /** The area its door leads into. */
  interior?: string;
  /** A tinted variant of the style: roof or tile colour. */
  look?: number;
};

export type FairArea = {
  id: string;
  name: string;
  kind: FairArchetype;
  /** The areas through each edge: north, east, south, west. */
  links?: { n?: string; e?: string; s?: string; w?: string };
  /** The way up and down a tower: lifts and stairs to these areas. */
  lifts?: readonly string[];
  /** Back out of the fair through this edge, onto the street. */
  gate?: "n" | "e" | "s" | "w";
  buildings?: readonly FairBuilding[];
  /** A big fountain or basin in the middle. */
  fountain?: "coutan" | "basin";
  /** A river across the middle of the area. */
  river?: boolean;
  /** Exhibits always here, by find id. */
  exhibits?: readonly string[];
  /** Tags filler stands are drawn from, and how many. */
  stands?: { tags: readonly string[]; n: number };
  /** Who is about, by person id. */
  people?: readonly string[];
  /** For an interior: the floor and walls. */
  floor?: "parquet" | "tile" | "boards" | "iron";
  note: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
};

export type Fair = {
  id: string;
  name: string;
  city: string;
  where: Box;
  /** Astronomical years it was open. */
  years: readonly [number, number];
  /** The area a visitor comes in by. */
  entry: string;
  areas: readonly FairArea[];
  /** Francs at the gate. */
  ticket: number;
};

/** The painter keys an exhibit may use; each is drawn in `render/fair/things.ts`. */
export const FAIR_ART = [
  // Floor.
  "vitrine", "counter", "bales", "barrels", "sacks", "ingots", "statue", "vase", "engine", "dynamo", "locomotive",
  "phonograph", "telephone", "piano", "model", "loom", "press", "lamp-standard", "pyramid", "kiosk", "lift",
  // Wall.
  "painting", "tapestry", "carpet", "panel", "map",
] as const;
export type FairArt = (typeof FAIR_ART)[number];

export type FairFind = {
  id: string;
  name: string;
  art: FairArt;
  on: "wall" | "floor";
  tier: "common" | "notable" | "prize";
  /** The areas it fits, by tag: an area's id, kind, or stand tags. */
  tags: readonly string[];
  /** Cells wide and deep, for the big ones. */
  w?: number;
  h?: number;
  /** The colour of what it shows: the wool in a case, the paint on a canvas. */
  tint?: string;
  verb: string;
  time?: number;
  loot?: Readonly<Record<string, number | readonly [number, number]>>;
  /** Francs it costs: a ride, a drink, a souvenir. */
  price?: number;
  heal?: number;
  text: string;
  look: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
  /** Can be used again: a phonograph plays every time. */
  keeps?: boolean;
  weight?: number;
};
