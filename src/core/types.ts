import type { CharacterAppearance } from "./character";
import type { LandscapeStyle } from "../content/graphics/landscapes";
import type { WorldSetting } from "../content/geography/types";
export type PackId = string;
export type Point = { x: number; y: number };
export type Position = Point & { space: string };
export type ItemId =
  | "fruit"
  | "berries"
  | "reeds"
  | "fodder"
  | "bread"
  | "grain"
  | "water"
  | "coin"
  | "obsidian"
  | "wool"
  | "wood"
  | "fish"
  | "tool"
  | "flax"
  | "lizard";
export type Inventory = Partial<Record<ItemId, number>>;
export type Evidence = {
  id: string;
  title: string;
  statement: string;
  status: "documented" | "inferred" | "hypothesis" | "fictional";
  url: string;
  limitation: string;
};
export type ItemDef = {
  id: ItemId;
  name: string;
  sprite: string;
  value: number;
  edible?: number;
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
  nameFormat?: string;
  nameFamilies?: string[];
  livelihood: string;
  notes: string[];
};
export type Actor = {
  origin?: CharacterOrigin;
  appearance?: CharacterAppearance;
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
  held?: string;
  /** Set while a need has pulled this actor off their daily routine. Absent is
   * the normal case, so a resident is drawn from the schedule from the first
   * frame, before the simulation has ticked at all. */
  offRoutine?: boolean;
  lastUpdated?: number;
  goal?: Position;
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
  damage?: number;
  id: string;
  name: string;
  kind:
    | "container"
    | "gate"
    | "well"
    | "fire"
    | "crop"
    | "tree"
    | "exit"
    | "bed"
    /** Looked at, not used. Carries no interaction of its own. */
    | "monument";
  pos: Position;
  sprite: string;
  inventory: Inventory;
  owner?: string;
  open?: boolean;
  depleted?: boolean;
  claim?: string;
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
  | { type: "move"; dx: number; dy: number; traverse?: boolean }
  | { type: "throw"; dx: number; dy: number }
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
        | "store"
        | "harvest"
        | "capture"
        | "herd"
        | "follow"
        | "take"
        | "rest"
        | "return"
        | "pickup"
        | "drop"
        | "strike"
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
  | { type: "use"; item: ItemId };
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
};
export type Affordance = {
  label: string;
  command: PlayerCommand;
  enabled: boolean;
  reason?: string;
};
export type Inspection = {
  sprite?: string;
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
        label: string;
        offset: number;
      }
    | undefined;
  elevation?(x: number, y: number): number;
  moisture?(x: number, y: number): number;
  activate?(x: number, y: number): void;
  restoreDistricts?(entityIds: string[]): void;
  regionExtent?: number;
  overview?(x: number, y: number): Terrain;
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
