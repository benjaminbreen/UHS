import type { CharacterScope } from "../characters/context-types";

/** How a town's drains are built, which decides the walls, the floor and the water. */
export type SewerKind =
  /** Egg-section brick, a channel in the invert, a ledge either side. */
  | "brick"
  /** Masonry galleries with a walkway over a wide channel, water mains and cables along the vault. */
  | "gallery"
  /** Cast concrete pipes and box culverts of the motor age. */
  | "concrete"
  /** Slab-covered concrete storm channels of a hot, wet town. */
  | "tropical"
  /** Concrete utility collectors shared with district-heating mains. */
  | "collector";

/** What a level is: the sewers under the streets, the big trunk sewer below
 * them, or whatever older or stranger thing lies under that. */
export type SewerDepth = "street" | "trunk" | "old";

/** [west, south, east, north] in degrees. */
export type Box = readonly [number, number, number, number];

/** The painter keys a find may use; each is drawn in `render/sewer/art.ts`. */
export const SEWER_ART = [
  // Floor, small.
  "glint", "purse", "bottle", "toy", "bones", "keys", "phone", "jewel", "tin", "papers",
  // Floor, big enough to walk round.
  "crate", "locker", "trolley", "bicycle", "bedroll", "camp", "fatberg", "silt-heap", "barrel", "toolbag", "sandbags", "shrine",
  // On a back wall.
  "graffiti", "plaque", "valve", "gauge", "fusebox", "niche", "mural", "notice",
] as const;
export type SewerArt = (typeof SEWER_ART)[number];

export type SewerFind = {
  id: string;
  name: string;
  art: SewerArt;
  on: "wall" | "floor";
  tier: "common" | "notable" | "prize";
  /** Astronomical years, inclusive. */
  years?: readonly [number, number];
  where?: readonly Box[];
  kinds?: readonly SewerKind[];
  depths?: readonly SewerDepth[];
  weight?: number;
  /** What the action key does: "Pick up the ring". */
  verb: string;
  /** Game seconds the work takes. */
  time?: number;
  /** Item counts, or a [low, high] range rolled per find. */
  loot?: Readonly<Record<string, number | readonly [number, number]>>;
  /** Seconds of light it adds: fresh batteries, a carbide refill. */
  fuel?: number;
  heal?: number;
  /** What the player is told when they use it. */
  text: string;
  /** What they are told when they look at it. */
  look: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
  /** Stays as it is once used: a plaque is still a plaque. */
  keeps?: boolean;
  /** Lets feet past. */
  flat?: boolean;
  /** Colour of the light it gives off, as "#rrggbb". */
  glow?: string;
};

/** Someone met underground. They are real people in the world: generated,
 * dressed by `dress` and `label`, and spoken to like anyone else. */
export type SewerPerson = {
  id: string;
  scope: CharacterScope;
  kinds?: readonly SewerKind[];
  depths?: readonly SewerDepth[];
  /** Their role, as the wardrobe reads it: "Sewer flusher", "Urban explorer". */
  label: string;
  /** The livelihood id they are generated as. */
  dress: string;
  /** What they are doing, shown as their activity. */
  doing: string;
  /** How they keep to the tunnels: a crew works along the channel, a camp
   * stays by its fire, explorers wander and photograph, a scavenger works
   * the silt, a lookout keeps still and watches. */
  manner: "crew" | "camp" | "explore" | "scavenge" | "lookout";
  /** Lines they might say, in plain modern English. One is picked per meeting. */
  lines: readonly string[];
  /** Chance of one, two or three together. */
  party: readonly [number, number, number];
  /** Share of women. */
  women: number;
  /** Ages, inclusive. */
  ages?: readonly [number, number];
  /** Carries a light of their own, which lights the tunnel round them. */
  lit?: boolean;
  /** Items they may give or sell. */
  goods?: readonly string[];
  weight: number;
  /** What is documented, inferred or hypothetical about them, and on what. */
  note: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
};
