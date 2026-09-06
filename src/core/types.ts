export type PackId = string;
export type Point = { x: number; y: number };
export type Position = Point & { space: string };
export type ItemId =
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
  status: "documented" | "inferred";
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
export type Actor = {
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
    | "bed";
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
  | "floor";
export type Settlement = Point & { id: string; name: string; size: number };
export type Pack = {
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
  architecture: "roman" | "mud";
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
  schema: 1;
  simulation: 1;
  generator: 1;
  content: 1;
  atlas: 1;
};
export type GameEvent = {
  id: number;
  time: number;
  text: string;
  kind: "action" | "social" | "world" | "system";
  pos?: Position;
};
export type PlayerCommand =
  | { type: "move"; dx: number; dy: number }
  | { type: "wait"; seconds: number }
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
        | "harvest"
        | "capture"
        | "herd"
        | "follow"
        | "take"
        | "rest"
        | "return";
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
  >[];
  objects: WorldObject[];
  places: Place[];
  events: GameEvent[];
  manifest: WorldManifest;
};
export interface WorldModel {
  pack: Pack;
  settlements: Settlement[];
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
