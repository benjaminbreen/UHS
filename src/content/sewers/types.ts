import type { CharacterScope } from "../characters/context-types";
import type { CaveKind } from "../caves/types";

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

/** What a mine works, which decides the rock, the roads and the air. */
export type MineKind = "coal" | "metal" | "salt";
/** A mine's levels: the roads in from the shaft or adit, the workings off
 * them, and the abandoned workings below. */
export type MineDepth = "level" | "workings" | "old";

/** Any network of tunnels under a place: a town's sewers or a mine. */
export type TunnelKind = SewerKind | MineKind;
export type TunnelDepth = SewerDepth | MineDepth;

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
  // In a mine: on the floor, then on the wall.
  "ore", "snap", "tools", "candles", "tally", "crust", "tio", "tub", "lamp", "nugget", "rucksack", "powder", "wheel", "harness", "cage",
  "vein", "fossil", "chalk", "barbara", "relief", "crystals", "board",
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
  kinds?: readonly TunnelKind[];
  depths?: readonly TunnelDepth[];
  /** For a mine find: what the mine must work, "coal", "silver". */
  ores?: readonly string[];
  weight?: number;
  /** What the action key does: "Pick up the ring". */
  verb: string;
  /** Game seconds the work takes. */
  time?: number;
  /** Item counts, or a [low, high] range rolled per find. In a mine, "ore"
   * and "ore-rich" stand for what this mine works. */
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
  /** Any one of these regions will do, on top of `scope.bounds`. */
  where?: readonly Box[];
  kinds?: readonly (TunnelKind | CaveKind)[];
  /** In a cave, "mouth" is the first level and "deep" any below it. */
  depths?: readonly (TunnelDepth | "mouth" | "deep")[];
  ores?: readonly string[];
  /** Their role, as the wardrobe reads it: "Sewer flusher", "Urban explorer". */
  label: string;
  /** The livelihood id they are generated as. */
  dress: string;
  /** What they are doing, shown as their activity. */
  doing: string;
  /** How they keep to the tunnels: a crew works along the channel, a camp
   * stays by its fire, explorers wander and photograph, a scavenger works
   * the silt, a lookout keeps still and watches, a worker keeps to one spot
   * and works it: a face, a door, a pump. */
  manner: "crew" | "camp" | "explore" | "scavenge" | "lookout" | "work";
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
  /** Something to do with them besides talk: work alongside, trade, an offering. */
  deal?: FolkDeal;
  /** A cave find they set up beside them, and fight anyone for who takes it. */
  keeps?: string;
  /** The player's livelihoods they take for an enemy, matched against the role. */
  foes?: RegExp;
  /** What they say to one, just before they go for them, or run. */
  threat?: string;
  /** Run from a foe rather than fight. */
  flee?: boolean;
  /** Times the usual chance of a random start as one, where and when they were common. */
  start?: readonly { times: number; years: readonly [number, number]; where?: readonly Box[] }[];
  /** What is documented, inferred or hypothetical about them, and on what. */
  note: string;
  basis: "documented" | "inferred" | "hypothesis" | "fiction";
};

export type FolkDeal = {
  /** The action: "Give the hermit some bread". */
  verb: string;
  /** What they want for it: food, money (food where there is no coin), or one of these items. */
  wants?: "food" | "coin" | readonly string[];
  /** How many coins or pieces of food. */
  price?: number;
  gives?: Readonly<Record<string, number | readonly [number, number]>>;
  /** Coins paid for the work. */
  wage?: number;
  /** Items they buy off the player, at the item's value. */
  buys?: readonly string[];
  heal?: number;
  /** Game seconds of light added. */
  fuel?: number;
  /** Damage, the cause, and the chance of it. */
  risk?: readonly [number, string, number];
  /** Game seconds it takes. */
  time: number;
  text: string;
  /** Can be done more than once with the same person. */
  again?: boolean;
};
