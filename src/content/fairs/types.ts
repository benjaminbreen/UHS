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
  | "platform"
  /** A gallery sized from the plan: aisles and bays of stands, a way through wherever another area adjoins. */
  | "gallery"
  /** A garden court sized from the plan: walks round railed lawns, a fountain or bandstands in the middle. */
  | "court";

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
  /** Where it lies on the fair's plan: left, top, width, depth, in plan units, north up. Galleries and
   * courts are sized from this, and joined to every area whose rectangle shares a stretch of edge. */
  at?: readonly [number, number, number, number];
  /** How a gallery is built and coloured: an iron and glass exhibition shed, a warm panelled room with deep
   * wainscot, or a palace room of white and gold panelling and tall mirrors. The fair's own look when unset. */
  look?: "shed" | "warm" | "palace";
  /** A palace room whose back wall is mirror in every bay. */
  mirrors?: boolean;
  /** Bandstands in a court. */
  bandstands?: number;
  /** Who plays in each of a court's bandstands, by person id. */
  band?: string;
  /** A gallery of machinery at work, in place of exhibitors' stands. */
  machinery?: boolean;
  /** The Tower stands over these grounds. */
  tower?: boolean;
  /** What the liftman takes at each ride, by item id. */
  liftTicket?: string;
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
  /** How its galleries look unless an area says otherwise. */
  look?: "shed" | "warm" | "palace";
  /** What someone who starts here by a prompt is, when not a visitor. */
  role?: string;
  /** Cells to a plan unit, for areas placed by `at`. */
  scale?: number;
  /** What it shows; an area's filler stands are drawn from these by tag. */
  finds: readonly FairFind[];
  /** Who minds a filler stand, by the first of the area's stand tags that has an entry; "" for any other. Person ids. */
  staff?: Readonly<Record<string, string>>;
  /** Coins at the gate, and what the coin is called: one, many. */
  ticket: number;
  coin: readonly [string, string];
  /** Words in a prompt that mean this fair. */
  prompt: RegExp;
  /** Where a prompt naming it starts, by place id. */
  place: string;
  /** Said at the gate without the money, on going in, and on riding its lifts up. */
  words: { short: string; enter: string; gate?: string; liftUp?: string; liftLook?: string };
};

/** The painter keys an exhibit may use; each is drawn in `render/fair/things.ts`. */
export const FAIR_ART = [
  // Floor.
  "vitrine", "counter", "bales", "barrels", "sacks", "ingots", "statue", "vase", "engine", "dynamo", "locomotive",
  "phonograph", "telephone", "piano", "model", "loom", "press", "lamp-standard", "pyramid", "kiosk", "lift", "bath", "throne", "state-bed",
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
  /** Someone posted at it, by person id: the exhibitor, the cook, the demonstrator. */
  staff?: string;
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
