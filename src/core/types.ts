import type { PersonBrief } from "./brief";
import type { CharacterAppearance, WearSlot } from "./character";
import type { LandscapeStyle } from "../content/graphics/landscapes";
import type { WorldSetting } from "../content/geography/types";
export type PackId = string;
export type Point = { x: number; y: number };
export type Position = Point & { space: string };
/** Built-in ids are plain words; items invented during play are prefixed "x-". */
export type ItemId = string;
export type Inventory = Partial<Record<ItemId, number>>;
export type Evidence = {
  id: string;
  title: string;
  statement: string;
  /** Omitted by content that cites a source instead of grading itself. */
  status?: "documented" | "inferred" | "hypothesis" | "fictional";
  url: string;
  limitation?: string;
};
export type ItemDef = {
  id: ItemId;
  name: string;
  sprite: string;
  value: number;
  /** A wearable: the slot it occupies and the look it adds when worn. */
  wear?: { slot: WearSlot; look: Partial<CharacterAppearance["wearing"]> };
  /** Can be taken in hand. `strike` means it swings; `edge` means it cuts
   * rather than thumps. */
  hand?: { strike?: boolean; edge?: boolean };
  /** Hunger relieved when eaten. */
  edible?: number;
  /** Health change when eaten. */
  health?: number;
  description?: string;
  flammable?: boolean;
  floats?: boolean;
};
/** All 0-100. The first four drive checks; the rest colour dialogue. */
export type Stats = {
  strength: number;
  agility: number;
  endurance: number;
  wit: number;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};
export type Household = {
  id: string;
  members: string[];
  residence?: string;
  home: Position;
  storeId: string;
};
export type SocialRelation = {
  other: string;
  kind: "partner" | "parent" | "child" | "co-resident";
};
export type Resource = {
  item: ItemId;
  capacity: number;
  regrowSeconds: number;
  seasons: string[];
  readyAt: number;
};
export type CharacterOrigin = {
  revision: 1;
  profile: string;
  community: string;
  nameKit?: string;
  nameTradition?: string;
  nameRegion?: string;
  sex?: "unspecified" | "male" | "female";
  standing?: "free" | "unfree";
  nameFormat?: string;
  nameFamilies?: string[];
  livelihood: string;
  /** The title as drawn; a belief-driven office resolves per person. */
  roleLabel?: string;
  notes: string[];
};
export type Actor = {
  stats?: Stats;
  health?: number;
  /** Experience by skill. The player's only; residents have none stored. */
  skills?: import("./skills").Skills;
  /** A hurt that outlasts the fight: weaker blows and quicker tiring until
   * the clock passes `until`. */
  injury?: { name: string; until: number };
  origin?: CharacterOrigin;
  appearance?: CharacterAppearance;
  /** Items on the body, by slot. Not counted in `inventory`; `wearing` derives from these. */
  worn?: Partial<Record<WearSlot, ItemId>>;
  age?: number;
  householdId?: string;
  relations?: SocialRelation[];
  knownResources?: string[];
  task?: { target: string; until: number };
  id: string;
  name: string;
  role: string;
  kind: "human" | "sheep" | "goat" | "lizard" | "chicken";
  pos: Position;
  home: Position;
  work: Position;
  sprite: string;
  inventory: Inventory;
  activity: string;
  fatigue: number;
  hunger: number;
  trust: number;
  owner?: string;
  follows?: string;
  consentUntil?: number;
  memories: string[];
  direction: number;
  /** Render-only eight-way facing; `direction` remains authoritative. */
  facing?: number;
  /** Perched on top of something: one cell, no roaming. `rise` is the sprite
   * lift in world pixels, which is also what the view reaches over. */
  perch?: { on: string; label: string; rise: number; at?: Point };
  held?: string;
  /** An inventory item taken in hand. A carried world object wins over this,
   * and the engine never lets both be set. */
  heldItem?: ItemId;
  /** Set while a need has pulled this actor off their daily routine. Absent is
   * the normal case, so a resident is drawn from the schedule from the first
   * frame, before the simulation has ticked at all. */
  offRoutine?: boolean;
  lastUpdated?: number;
  goal?: Position;
  /** Out with a herd at grass: stays by it, at a place of their own. */
  tends?: { herd: string; seat: number };
};
export type Place = {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sprite: string;
  entrance: Point;
  access: "public" | "household";
  owner: string;
  claim: string;
  entranceLabel: string;
};
export type WorldObject = {
  resource?: Resource;
  prop?: string;
  carriedBy?: "player";
  broken?: boolean;
  /** Went into water over its head. Still drawn, on the bed, but out of play. */
  submerged?: boolean;
  damage?: number;
  id: string;
  name: string;
  placeId?: string;
  /** Clock at the last knock on this door; drives the rattle the scene draws. */
  knocked?: number;
  kind:
    | "container"
    | "gate"
    /** A gate in a building wall; `placeId` is what it lets you into. */
    | "door"
    | "well"
    | "fire"
    | "crop"
    | "tree"
    | "exit"
    | "bed"
    /** Looked at, not used. Carries no interaction of its own. */
    | "monument"
    /** An inventory item set down on the ground, waiting to be picked up. */
    | "item";
  pos: Position;
  sprite: string;
  inventory: Inventory;
  /** What a `kind: "item"` object is: the id that goes back into a pocket. */
  item?: ItemId;
  owner?: string;
  open?: boolean;
  depleted?: boolean;
  claim?: string;
  /** Drawn only in these seasons. Standing sheaves are not a summer sight. */
  seasons?: string[];
  /** Knocked over: draws its fallen sprite and spills what it held. */
  tipped?: boolean;
};
export type Decoration = Point & { id: string; sprite: string; solid: boolean };
export type Terrain =
  | "grass"
  | "dry"
  | "dirt"
  | "sand"
  | "water"
  | "paving"
  | "bridge"
  | "field"
  | "floor"
  | "snow"
  | "rock"
  | "marsh";
export type Settlement = Point & { id: string; name: string; size: number };
export type Pack = {
  setting?: WorldSetting;
  id: PackId;
  name: string;
  region: string;
  date: string;
  year: number;
  subtitle: string;
  characterName: string;
  role: string;
  concern: string;
  ground: "grass" | "dry";
  road: "paving" | "dirt";
  buildings: string[];
  buildingClaim: string;
  landscape: LandscapeStyle;
  layout: "streets" | "clusters";
  trees: string[];
  buildingNames: string[];
  names: string[];
  roles: string[];
  currency?: ItemId;
  startInventory: Inventory;
  trade: { give: ItemId; take: ItemId; cost: number };
  evidence: Evidence[];
  anchor: { lon: number; lat: number; label: string };
  settlementNames: string[];
  species: Actor["kind"][];
  greeting: string;
  commodities: ItemId[];
  entryLabel: string;
  defaultSeed: string;
  description: string;
  playerSprite: string;
  geography?: {
    projection: string;
    origin: number[];
    segments: number[][][];
    limitations: string;
  };
};
export type WorldManifest = {
  seed: string;
  pack: PackId;
  schema: 1 | 2;
  simulation: 1 | 2;
  generator: 1 | 2 | 3;
  content: 1 | 2;
  atlas: 1 | 2;
  setting?: WorldSetting;
};
export type GameEvent = {
  id: number;
  time: number;
  text: string;
  kind: "action" | "social" | "world" | "system";
  pos?: Position;
};
export type PlayerCommand =
  | {
      type: "move";
      dx: number;
      dy: number;
      traverse?: boolean;
      jump?: "short" | "long";
      run?: boolean;
    }
  /** `run` is a throw taken at a sprint: it carries twice as far. */
  | {
      type: "throw";
      dx: number;
      dy: number;
      run?: boolean;
      /** Cells aimed for. Absent is a snap throw: three, or six at a run. */
      reach?: number;
    }
  /** A swing of whatever is in hand, at whatever the arc finds. Takes no
   * target: the cone in front of the player is the target. */
  | { type: "swing"; power?: 1 | 2 }
  | { type: "wait"; seconds: number }
  /** Time passing while the player stands still. Logged so a replay keeps the
   * same clock, but it raises no event of its own. */
  | { type: "pass"; seconds: number }
  | {
      type: "interact";
      target: string;
      action:
        | "talk"
        | "enter"
        | "exit"
        | "open"
        | "close"
        | "drink"
        | "cook"
        | "store"
        | "harvest"
        | "capture"
        | "herd"
        | "knock"
        | "follow"
        | "take"
        | "rest"
        | "sleep"
        | "return"
        | "pickup"
        | "drop"
        | "strike"
        | "climb"
        | "descend"
        | "chop"
        | "dig"
        | "reap"
        | "mine"
        | "right"
        | "topple"
        | "look";
    }
  | {
      type: "trade";
      target: string;
      give: ItemId;
      giveQuantity: number;
      take: ItemId;
      takeQuantity: number;
    }
  | { type: "use"; item: ItemId }
  /** Put a wearable from the inventory on; whatever held the slot comes off. */
  | { type: "wear"; item: ItemId }
  /** Take an inventory item in hand, so it is drawn and can be swung. */
  | { type: "hold"; item: ItemId }
  /** Put whatever is in hand away: an item back into the inventory, a
   * carried object down on the ground. */
  | { type: "stow" }
  /** Set the item in hand down on the ground, where anyone can take it. */
  | { type: "drop" }
  /** Hand the item in hand to somebody. They keep it. */
  | { type: "give"; target: string; item: ItemId }
  /** Take the item in a slot off, into the inventory. */
  | { type: "remove"; slot: WearSlot }
  /** Sleep or long rest. Time passes in one step, the night can leave a mark,
   * and shelter decides how much good it does. */
  | { type: "sleep"; seconds: number }
  | { type: "narrate"; intents: Intent[] };
export type CommandRequest = {
  actionId: string;
  expectedRevision: number;
  command: PlayerCommand;
};
export type CommandResult = {
  actionId: string;
  revision: number;
  status: "completed" | "interrupted" | "rejected";
  elapsedSeconds: number;
  events: GameEvent[];
  reason?: string;
};
export type Receipt = { payload: string; result: CommandResult };
export type Snapshot = {
  households?: Household[];
  /** Animal groups: wild ones spawned as districts open, kept ones from pens. */
  fauna?: import("./fauna").FaunaGroup[];
  /** Animals the district has a name for, by group and member number. */
  legends?: Record<string, import("./combat").Legend>;
  manifest: WorldManifest;
  clock: number;
  revision: number;
  randomCounter: number;
  player: Actor;
  actors: Actor[];
  objects: WorldObject[];
  events: GameEvent[];
  notes: { id: number; text: string; time: number; evidence?: string }[];
  visited: string[];
  receipts: Record<string, Receipt>;
  log: CommandRequest[];
  permissions: Record<string, number>;
  /** Items invented during play. */
  catalog?: Record<ItemId, ItemDef>;
  /** Ground the player has worked: felled plants, cut grass, dug furrows.
   * Keyed by cell. */
  tiles?: import("./tile-edits").TileEdits;
  /** Bumped with every tile edit, so the scenery cache knows to rebuild. */
  tilesRevision?: number;
  /** Standing facts the narrator has established. Newest last. */
  ledger?: string[];
  /** Narrator turns, oldest first. */
  narration?: { clock: number; input: string; text: string }[];
};
/** What a narrator turn may do to the world. Each one resolves
 * deterministically in the engine; the model only proposes. */
export type Intent =
  | {
      type: "attempt";
      check: "strength" | "agility" | "wit";
      difficulty: number;
      success: string;
      failure: string;
      minutes?: number;
    }
  | { type: "forage"; item?: ItemId }
  /** Puts the player on top of something the narrator has just described them
   * climbing. Without it a granted climb is prose and nothing else. */
  | { type: "climb"; target: string }
  | {
      type: "invent";
      item: {
        name: string;
        description: string;
        value: number;
        edible?: number;
        health?: number;
        flammable?: boolean;
        floats?: boolean;
        look:
          | "rock"
          | "plant"
          | "food"
          | "wood"
          | "cloth"
          | "tool"
          | "vessel"
          | "creature";
      };
      consumes?: { item: ItemId; quantity: number }[];
    }
  | { type: "pass"; minutes: number }
  | { type: "travel"; direction: "north" | "south" | "east" | "west" }
  | { type: "regard"; delta: number; reason: string }
  | { type: "fact"; text: string }
  | { type: "converse"; with: string; said: string; delta: number }
  | {
      type: "receive";
      from: string;
      item: {
        name: string;
        description: string;
        value: number;
        look:
          | "rock"
          | "plant"
          | "food"
          | "wood"
          | "cloth"
          | "tool"
          | "vessel"
          | "creature";
      };
    };
export type Affordance = {
  label: string;
  command: PlayerCommand;
  enabled: boolean;
  reason?: string;
};
export type Inspection = {
  sprite?: string;
  /** Humans only: the focus card's two lines, already split for colouring. */
  brief?: PersonBrief;
  id: string;
  name: string;
  description: string;
  kind: string;
  pos: Position;
  claim?: string;
  affordances: Affordance[];
  inventory?: Inventory;
};
export type Observation = {
  revision: number;
  clock: number;
  player: Actor;
  actors: Pick<
    Actor,
    | "id"
    | "name"
    | "role"
    | "kind"
    | "pos"
    | "sprite"
    | "activity"
    | "direction"
    | "age"
    | "appearance"
    | "origin"
    | "held"
  >[];
  objects: WorldObject[];
  places: Place[];
  events: GameEvent[];
  manifest: WorldManifest;
};
export interface WorldModel {
  geography?: import("./geography").WorldGeography;
  households?: Household[];
  generatorVersion?: 3;
  topography?(x: number, y: number): import("./topography").TopographyCell;
  canCross?(from: Point, to: Point): boolean;
  navigationCost?(x: number, y: number, actorId?: string): number;
  protectedCell?(x: number, y: number): boolean;
  propSlots?(placeId: string): { yard: Point[]; work: Point[] } | undefined;
  /** A resident's whole day as a route. Built on demand and cached by the
   * world: sampling it costs a binary search, not a path search. */
  itinerary?(actorId: string): import("./itinerary").Itinerary | undefined;
  /** True while a routine is still queued to be built. */
  routinePending?(actorId: string): boolean;
  /** True for a resident outside the routine budget: they stay home and are
   * not simulated until the budget rotates to them. */
  dormant?(actorId: string): boolean;
  /** Retires one resting resident per settlement and wakes a dormant one.
   * Called once per game hour. */
  rotateRoutines?(clock: number): void;
  activitySites?(actorId: string):
    | {
        home: Point;
        work: Point;
        water: Point;
        social: Point;
        pasture?: Point;
        gateId?: string;
        rackId?: string;
        label: string;
        offset: number;
      }
    | undefined;
  elevation?(x: number, y: number): number;
  moisture?(x: number, y: number): number;
  activate?(x: number, y: number): void;
  /** Animal groups for the districts round (x, y); ids repeat, the engine keeps the first. */
  fauna?(x: number, y: number): import("./fauna").FaunaGroup[];
  /** Let a 64-cell block spawn its wild groups again after the engine has
   * dropped them for being far away. */
  forgetFauna?(block: string): void;
  restoreDistricts?(entityIds: string[]): void;
  regionExtent?: number;
  overview?(x: number, y: number): Terrain;
  habitatAt?(
    x: number,
    y: number,
  ): import("../content/ecology/communities").HabitatSite | undefined;
  /** Undefined past the playable map where no neighbouring region is sited. */
  mapTerrain?(
    x: number,
    y: number,
  ):
    | { terrain: Terrain; habitat?: import("../world/v3/habitats").Habitat }
    | undefined;
  pack: Pack;
  settlements: Settlement[];
  enclosures: {
    x: number;
    y: number;
    w: number;
    h: number;
    gate: Point;
    /** Explicit per-cell frames, for a circuit that is not a plain fence run. */
    parts?: { x: number; y: number; frame: string }[];
  }[];
  places: Place[];
  initialActors: Actor[];
  initialObjects: WorldObject[];
  spawn: Position;
  terrain(x: number, y: number, space?: string): Terrain;
  decoration(x: number, y: number): Decoration | undefined;
  /** Lets the engine rewrite what grows on a cell after generation, so the
   * renderer, collision and pathing all see a felled tree. */
  overrideDecoration?(
    fn: (
      x: number,
      y: number,
      base: Decoration | undefined,
    ) => Decoration | undefined,
  ): void;
  blocked(x: number, y: number, space: string): boolean;
  chunk(cx: number, cy: number): Terrain[];
  riverX(y: number): number;
  place(id: string): Place | undefined;
}
export const TILE_METRES = 2;
export const CHUNK_SIZE = 64;
export const SIGHT = 19;
export function distance(a: Position, b: Position) {
  return a.space === b.space ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity;
}
