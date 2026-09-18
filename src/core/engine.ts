import { wornFromWearing } from "./wearing";
import {
  clothName,
  clothWorth,
  parseCloth,
} from "../content/characters/wardrobe/cloth";
import { waterDepthAt, wadingCost, MAX_WADING_DEPTH } from "./water-field";
import { trimCache } from "./cache";
import {
  depositSupplies,
  harvestResource,
  householdActivity,
  refreshResource,
  seasonAt,
  grazeActivity,
} from "./livelihood";
import { weatherAt } from "./weather";
import { propDefs } from "../content/props/catalog";
import { propAffordances, heldObject } from "./props";

/** Which pile of remains, and which arrangement of it. Three per material, so
 * a yard of broken crockery is not the same pile stamped out three times. */
function brokenSprite(id: string, material: string) {
  let hash = 7;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `prop-broken-${material}-${hash % 3}`;
}
import {
  distance,
  SIGHT,
  type Actor,
  type Affordance,
  type Decoration,
  type CommandRequest,
  type CommandResult,
  type GameEvent,
  type Household,
  type Inspection,
  type Inventory,
  type ItemDef,
  type ItemId,
  type Observation,
  type PlayerCommand,
  type Position,
  type Snapshot,
  type WorldModel,
  type WorldObject,
} from "./types";
import { canonical, random, stateHash } from "./random";
import { resolveIntents, validateIntents } from "./intents";
import { findPath } from "./pathfinding";
import { itineraryAt, type Itinerary } from "./itinerary";
import { route, type RouteResult } from "./routing";
import { terrainJump, terrainLeap, type LeapResult } from "./topography";
import { advanceFauna } from "./fauna-sim";
import { faunaBlockOf } from "../world/v3/fauna";

/** Cells either side of the player whose animal groups stay in the save. */
const FAUNA_KEEP = 160;
import {
  axeWork,
  pickWork,
  type ToolAction,
  ROCK_BLOWS,
  STUMP_BLOWS,
  editedDecoration,
  fellingSwings,
  plantClass,
  tileKey,
  woodYield,
  isWorkedGround,
  isRock,
  LOGS_SPRITE,
  plantName,
  STUMP_SPRITE,
  type TileEdit,
} from "./tile-edits";

/** Elevation carried by one altitude step, matching the terrain renderer. */
const TERRAIN_STEP = 14;
import { facingFromStep } from "./facing";
import {
  doorAccess,
  doorApproach,
  isShutBarrier,
  type DoorVerdict,
} from "./doors";
import {
  isSolid,
  reactionFor,
  toolClass,
  toughness,
  type Hit,
  type HitClass,
  type ToolClass,
} from "./reactions";
import type { Place, Point } from "./types";
const copy = <T>(x: T): T => structuredClone(x);
/** Routines built in one call to `advance`. */
const ROUTINE_BUILDS_PER_ADVANCE = 32;
/** The generated decoration function of each world, before any engine wrapped
 * it in its own tile edits. */
const grownDecoration = new WeakMap<WorldModel, WorldModel["decoration"]>();
const treeName = (sprite: string) =>
  sprite
    .replace(/^(nature-understory|nature|ecology)-/, "")
    .replaceAll("-", " ")
    .replace(/^./, (c) => c.toUpperCase());
/** Saves from before wearables carry an authored look; give them the matching worn slots. */
function migrateWorn(snapshot: Snapshot): Snapshot {
  for (const actor of [snapshot.player, ...snapshot.actors])
    if (actor.kind === "human" && actor.appearance && !actor.worn)
      actor.worn = wornFromWearing(actor.appearance.wearing);
  return snapshot;
}

export class Engine {
  state: Snapshot;
  /** Set by a chronicle to witness every command, human or agent. */
  onAct?: (request: CommandRequest, result: CommandResult) => void;
  constructor(
    readonly world: WorldModel,
    readonly items: Record<ItemId, ItemDef>,
    snapshot?: Snapshot,
  ) {
    this.state = snapshot
      ? migrateWorn(copy(snapshot))
      : {
          manifest: {
            seed: "",
            pack: world.pack.id,
            schema: world.pack.setting ? 2 : 1,
            simulation: world.generatorVersion === 3 ? 2 : 1,
            generator: world.generatorVersion ?? (world.pack.setting ? 2 : 1),
            content: 1,
            atlas: world.pack.setting ? 2 : 1,
            ...(world.pack.setting
              ? { setting: copy(world.pack.setting) }
              : {}),
          },
          clock: 9 * 3600,
          revision: 0,
          randomCounter: 0,
          player: {
            id: "player",
            name: world.pack.characterName,
            role: world.pack.role,
            kind: "human",
            pos: copy(world.spawn),
            home: copy(world.spawn),
            work: copy(world.spawn),
            sprite: world.pack.playerSprite,
            inventory: copy(world.pack.startInventory),
            activity: "Exploring",
            fatigue: 0,
            hunger: 12,
            trust: 0,
            memories: [],
            direction: 2,
          },
          ...(world.households ? { households: copy(world.households) } : {}),
          actors: copy(world.initialActors).map((a) => ({
            ...a,
            lastUpdated: 9 * 3600,
          })),
          objects: copy(world.initialObjects),
          events: [],
          notes: [],
          visited: ["0,0"],
          receipts: {},
          log: [],
          permissions: {},
        };
    const edited = (x: number, y: number, base: Decoration | undefined) =>
      editedDecoration(base, this.state.tiles?.[tileKey(x, y)], x, y);
    // The generator hook is what lets collision and pathing see a felled tree;
    // wrapping the public function covers worlds built without it. A world
    // outlives the engine that first wrapped it — map travel builds a new
    // engine on the same world — so wrap the original each time rather than
    // stacking one engine's edits on the last one's.
    world.overrideDecoration?.(edited);
    const grown = (grownDecoration.get(world) ??
      grownDecoration
        .set(world, world.decoration.bind(world))
        .get(world)!) as WorldModel["decoration"];
    world.decoration = (x, y) => edited(x, y, grown(x, y));
  }
  initialize(seed: string) {
    this.state.manifest.seed = seed;
    if (this.world.pack.setting?.environment) {
      const season = seasonAt(this.world.pack.setting.season, this.state.clock);
      for (const o of this.state.objects)
        refreshResource(o, this.state.clock, season);
    }
    const sites = this.world.activitySites?.("player");
    if (sites) {
      this.state.player.home = { ...sites.home, space: "outside" };
      this.state.player.work = { ...sites.work, space: "outside" };
    }
    const household = this.state.households?.find((h) =>
      h.members.includes("player"),
    );
    if (household) {
      Object.assign(this.state.player, {
        householdId: household.id,
        age: 34,
        knownResources: [],
        relations: this.state.actors.flatMap((a) =>
          (a.relations ?? [])
            .filter((r) => r.other === "player")
            .map((r) => ({
              other: a.id,
              kind:
                r.kind === "parent"
                  ? "child"
                  : r.kind === "child"
                    ? "parent"
                    : r.kind,
            })),
        ),
      });
    }
    this.event(
      "You arrive as the morning’s work begins. Walk, meet someone, or find your own way.",
      "system",
    );
  }
  item(id: ItemId): ItemDef | undefined {
    const known = this.items[id] ?? this.state.catalog?.[id];
    if (known) return known;
    // A garment carries its cloth in its id. Everything a worn item does —
    // the look it adds, the slot it fills — comes from the base definition;
    // the cloth only changes what it is called and what it is worth.
    const q = parseCloth(id);
    const base = q && (this.items[q.base] ?? this.state.catalog?.[q.base]);
    if (!base) return undefined;
    return {
      ...base,
      id,
      name: clothName(base.name, q!.cloth, id),
      value: Math.max(1, Math.round(base.value * clothWorth(q!.cloth))),
    };
  }
  hash() {
    const { receipts, log, notes, narration, ...physical } = this.state;
    return stateHash(physical);
  }
  snapshot() {
    return copy(this.state);
  }
  private dropSpot(): Position | undefined {
    const p = this.state.player,
      dir = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][p.direction];
    return [
      dir,
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]
      .map(([x, y]) => ({ ...p.pos, x: p.pos.x + x, y: p.pos.y + y }))
      .find(
        (pos) =>
          !this.blocked(pos.x, pos.y, pos.space) &&
          this.visible(pos) &&
          !this.state.objects.some(
            (o) => !o.carriedBy && distance(o.pos, pos) < 1,
          ) &&
          !this.state.actors.some((a) => distance(a.pos, pos) < 1) &&
          !this.world.places.some(
            (b) =>
              pos.space === "outside" &&
              distance({ ...b.entrance, space: "outside" }, pos) < 1.5,
          ),
      );
  }
  private propOwnership(o: import("./types").WorldObject, action: string) {
    const p = this.state.player;
    if (!o.owner || o.owner === "player") return;
    const memory = `property:${o.id}`;
    if (p.memories.includes(memory)) return;
    p.memories.push(memory);
    for (const witness of this.state.actors.filter(
      (a) =>
        a.kind === "human" &&
        distance(a.pos, p.pos) < 7 &&
        this.visibleFrom(a.pos, p.pos),
    )) {
      witness.trust -= 3;
      witness.memories.push(`Saw player ${action} ${o.id}`);
      this.event(
        `${witness.name} saw you ${action} household property.`,
        "social",
      );
    }
  }
  rng(purpose: string) {
    return random(
      this.state.manifest.seed,
      "simulation",
      purpose,
      this.state.randomCounter++,
    );
  }
  event(text: string, kind: GameEvent["kind"] = "action", pos?: Position) {
    const e = {
      id: (this.state.events.at(-1)?.id ?? 0) + 1,
      time: this.state.clock,
      text,
      kind,
      pos: pos ? copy(pos) : undefined,
    };
    this.state.events.push(e);
    if (this.state.events.length > 160) this.state.events.shift();
  }
  private tickObstacles?: Map<string, typeof this.state.objects>;
  // Per-advance indexes. All undefined outside advance(), where the callers
  // fall back to the linear scans they replace.
  private barriersAt?: Map<string, WorldObject[]>;
  private actorsAt?: Map<string, Actor[]>;
  private actorCell?: Map<string, string>;
  private actorsById?: Map<string, Actor>;
  private objectsById?: Map<string, WorldObject>;
  private householdsById?: Map<string, Household>;
  private resourceObjects?: WorldObject[];
  private terrainCollision = new Map<string, boolean>();
  private wallCells?: Set<string>;
  private wallCellsFor = -1;
  /** A cell belonging to an enclosure circuit: a wall you can stand on, as
   * opposed to a building footprint or a tree. Districts push enclosures as
   * they activate, so the index is rebuilt when their number changes. */
  wallAt(x: number, y: number, space = this.state.player.pos.space) {
    if (space !== "outside") return false;
    const all = this.world.enclosures ?? [];
    if (!this.wallCells || this.wallCellsFor !== all.length) {
      this.wallCells = new Set();
      for (const e of all)
        for (const part of e.parts ?? [])
          this.wallCells.add(`${part.x},${part.y}`);
      this.wallCellsFor = all.length;
    }
    return this.wallCells.has(`${x},${y}`);
  }
  /** Standing on top of a wall, rather than beside it. */
  onWall() {
    const p = this.state.player.pos;
    return this.wallAt(p.x, p.y, p.space);
  }
  /** Re-files an actor in actorsAt after any write to a.pos, including ones
   * made by livelihood callbacks the engine does not own. */
  private syncActor(a: Actor) {
    if (!this.actorsAt || !this.actorCell) return;
    const key = `${a.pos.space}:${a.pos.x},${a.pos.y}`;
    const old = this.actorCell.get(a.id);
    if (old === key) return;
    if (old !== undefined) {
      const bucket = this.actorsAt.get(old);
      if (bucket) {
        const i = bucket.indexOf(a);
        if (i >= 0) bucket.splice(i, 1);
      }
    }
    const bucket = this.actorsAt.get(key);
    if (bucket) bucket.push(a);
    else this.actorsAt.set(key, [a]);
    this.actorCell.set(a.id, key);
  }
  private moveActor(a: Actor, pos: Position) {
    a.pos = pos;
    this.syncActor(a);
  }
  /** Same-cell test standing in for `actors.some(o => distance(o.pos, p) < 1)`;
   * positions are integer cells, so the two agree. */
  private actorAt(p: Position, excludeId: string) {
    if (this.actorsAt)
      return (
        this.actorsAt
          .get(`${p.space}:${p.x},${p.y}`)
          ?.some((o) => o.id !== excludeId) ?? false
      );
    return this.state.actors.some(
      (o) =>
        o.id !== excludeId &&
        o.pos.space === p.space &&
        o.pos.x === p.x &&
        o.pos.y === p.y,
    );
  }
  private household(id: string | undefined) {
    return this.householdsById
      ? id === undefined
        ? undefined
        : this.householdsById.get(id)
      : this.state.households?.find((h) => h.id === id);
  }
  private object(id: string | undefined) {
    return this.objectsById
      ? id === undefined
        ? undefined
        : this.objectsById.get(id)
      : this.state.objects.find((o) => o.id === id);
  }
  blocked(x: number, y: number, space = this.state.player.pos.space) {
    const key = `${space}:${x},${y}`;
    let fixed = this.terrainCollision.get(key);
    if (fixed === undefined) {
      fixed = this.world.blocked(x, y, space);
      trimCache(this.terrainCollision, 16384);
      this.terrainCollision.set(key, fixed);
    }
    return (
      fixed ||
      (
        this.tickObstacles?.get(key) ??
        (this.tickObstacles ? [] : this.state.objects)
      ).some(
        (o) =>
          (isShutBarrier(o) ||
            (!!o.prop &&
              !!propDefs[o.prop]?.solid &&
              !o.carriedBy &&
              !o.broken)) &&
          o.pos.space === space &&
          o.pos.x === x &&
          o.pos.y === y,
      )
    );
  }
  traversal(
    from: Position,
    dx: number,
    dy: number,
    jump?: "short" | "long",
    running?: boolean,
  ): LeapResult | { kind: "blocked"; reason: string } {
    const to = { x: from.x + dx, y: from.y + dy };
    const clear = (p: Point) => !this.blocked(p.x, p.y, from.space);
    if (jump) {
      const sample = (x: number, y: number) => {
        const cell =
          from.space === "outside" && this.world.topography
            ? this.world.topography(x, y)
            : { height: 0, surface: "grass" as const };
        if (!cell) return cell;
        const water = cell.surface === "water" && !cell.bridge;
        const obstacle = this.state.objects.some(
          (o) =>
            o.pos.space === from.space &&
            o.pos.x === x &&
            o.pos.y === y &&
            (isShutBarrier(o) ||
              (!!o.prop &&
                !!propDefs[o.prop]?.solid &&
                !o.carriedBy &&
                !o.broken)),
        );
        return {
          ...cell,
          solid: cell.solid || obstacle || (!water && !clear({ x, y })),
        };
      };
      const result = terrainJump(sample, from, to, jump, running);
      if (result.kind === "blocked") return result;
      const landing = {
        x: from.x + dx * result.distance,
        y: from.y + dy * result.distance,
      };
      return clear(landing)
        ? result
        : { kind: "blocked", reason: "Something is in the way." };
    }
    if (from.space === "outside" && this.world.topography) {
      const sample = (x: number, y: number) => this.world.topography!(x, y);
      const result = terrainLeap(sample, from, to);
      // Props and gates sit above the terrain contract and still block a landing.
      if (result.kind === "blocked") return result;
      const landing =
        result.distance === 2 ? { x: to.x + dx, y: to.y + dy } : to;
      return clear(landing)
        ? result
        : { kind: "blocked", reason: "Something is in the way." };
    }
    if (
      clear(to) &&
      !(
        dx &&
        dy &&
        (!clear({ x: to.x, y: from.y }) || !clear({ x: from.x, y: to.y }))
      )
    )
      return {
        kind: "hop",
        distance: 1,
        seconds: 3,
        reason: "You hop forward.",
      };
    // Without a terrain contract there is no way to tell a ditch from a wall,
    // so a jump reaches open ground only.
    return { kind: "blocked", reason: "There is no way over that." };
  }
  /** What the player could climb from where they stand: a solid prop, a tree,
   * a building or wall, or ground one to three steps higher. Adjacent only —
   * you climb what you can reach. Ordered nearest first so the prompt is
   * predictable. A `to` cell means the climb ends standing there rather than
   * perched on top. */
  /** The cell a held tool lands on: the one the player faces. */
  facingCell(): Point {
    const p = this.state.player,
      d = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][p.direction];
    return { x: p.pos.x + d[0], y: p.pos.y + d[1] };
  }
  heldTool() {
    return propDefs[heldObject(this.state)?.prop ?? ""]?.tool;
  }
  /** What a blow landing on this cell would find. Props first, then whoever
   * is standing there, then what grows on it, then the ground itself. */
  hitClass(
    x: number,
    y: number,
    space: string,
  ): { hit: HitClass; sprite?: string; prop?: WorldObject } {
    const prop = this.state.objects.find(
      (o) =>
        o.prop &&
        !o.carriedBy &&
        o.pos.x === x &&
        o.pos.y === y &&
        o.pos.space === space &&
        o.id !== this.state.player.held,
    );
    if (prop) {
      const def = propDefs[prop.prop!];
      const material: Record<string, HitClass> = {
        clay: "pottery",
        glaze: "pottery",
        wood: "timber",
        metal: "metal",
        fiber: "fiber",
        plastic: "fiber",
        paper: "fiber",
      };
      const hit: HitClass = def?.fire
        ? "fire"
        : (material[def?.breakable ?? ""] ?? "timber");
      return { hit, sprite: prop.sprite, prop };
    }
    const actor = this.state.actors.find(
      (a) => a.pos.x === x && a.pos.y === y && a.pos.space === space,
    );
    if (actor) return { hit: "creature", sprite: actor.id };
    if (space === "outside") {
      const plant = this.world.decoration(x, y);
      if (plant) {
        if (isRock(plant.sprite)) return { hit: "rock", sprite: plant.sprite };
        if (plant.sprite === STUMP_SPRITE || plant.sprite === LOGS_SPRITE)
          return { hit: "trunk", sprite: plant.sprite };
        const c = plantClass(plant.sprite);
        if (c === "grass") return { hit: "grass", sprite: plant.sprite };
        if (c === "shrub") return { hit: "brush", sprite: plant.sprite };
        if (c !== "none") return { hit: "tree", sprite: plant.sprite };
      }
      if (this.cropAt(x, y)) return { hit: "crop" };
    }
    const ground = this.world.terrain(x, y, space);
    const hit = (
      {
        water: "water",
        marsh: "marsh",
        sand: "sand",
        snow: "snow",
        dirt: "soil",
        dry: "soil",
        field: "soil",
        grass: "grass",
        rock: "stone",
        paving: "stone",
        bridge: "timber",
        floor: "timber",
      } as Record<string, HitClass>
    )[ground];
    return { hit: hit ?? "air" };
  }
  /** The three cells a swing sweeps: what you face, and the corner to each
   * side of it. */
  private swingCone(direction: number) {
    const p = this.state.player.pos;
    const d = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][direction];
    // Perpendicular, for the two corners.
    const s = [-d[1], d[0]];
    return [
      { x: p.x + d[0], y: p.y + d[1] },
      { x: p.x + d[0] - s[0], y: p.y + d[1] - s[1] },
      { x: p.x + d[0] + s[0], y: p.y + d[1] + s[1] },
    ];
  }
  /** Frees the hand, whichever system was using it: an item goes back into
   * the inventory, a carried object down on the ground. */
  private emptyHands() {
    const p = this.state.player;
    if (p.heldItem) {
      p.inventory[p.heldItem] = (p.inventory[p.heldItem] ?? 0) + 1;
      delete p.heldItem;
    }
    const carried = this.state.objects.find((o) => o.id === p.held);
    if (carried) {
      carried.pos = this.dropSpot() ?? copy(p.pos);
      delete carried.carriedBy;
    }
    delete p.held;
  }
  /** One blow's worth of damage to a prop. Returns what became of it. */
  private hurtProp(
    prop: WorldObject,
    hit: HitClass,
  ): "broke" | "damaged" | "tipped" | undefined {
    const def = propDefs[prop.prop!];
    if (!def) return undefined;
    if (def.breakable && !prop.broken) {
      this.propOwnership(prop, "break");
      prop.damage = (prop.damage ?? 0) + 1;
      if (prop.damage < (toughness(hit) ?? 2)) return "damaged";
      prop.broken = true;
      prop.open = true;
      prop.depleted = false;
      prop.sprite = brokenSprite(prop.id, def.breakable);
      return "broke";
    }
    if (def.tips && !prop.tipped) {
      this.propOwnership(prop, "break");
      prop.tipped = true;
      prop.open = true;
      return "tipped";
    }
    return undefined;
  }
  /** The last swing's hits, for the renderer. Read by serial, like a leap. */
  lastSwing?: { hits: Hit[]; tool: ToolClass; direction: number };
  /** The last thrown prop's flight, for the renderer to arc it over. */
  lastThrow?: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    sprite?: string;
    hit: Hit;
  };
  /** Aim assist: if the cone is empty but something solid stands to either
   * side, turn to it. Forgiving aim is most of what makes a swing feel good. */
  private aimAt(direction: number) {
    const space = this.state.player.pos.space;
    const solid = (dir: number) =>
      this.swingCone(dir).some(
        (c) =>
          !["air", "grass", "soil", "sand", "snow"].includes(
            this.hitClass(c.x, c.y, space).hit,
          ),
      );
    if (solid(direction)) return direction;
    for (const turn of [1, 3]) {
      const dir = (direction + turn) % 4;
      if (solid(dir)) return dir;
    }
    return direction;
  }
  /** `tile:x,y`. Tool work has no object to address, only ground. */
  static tileTarget(x: number, y: number) {
    return `tile:${x},${y}`;
  }
  private tileAt(target: string): Point | undefined {
    const m = /^tile:(-?\d+),(-?\d+)$/.exec(target);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : undefined;
  }
  private editAt(x: number, y: number): TileEdit {
    const tiles = (this.state.tiles ??= {});
    return (tiles[tileKey(x, y)] ??= {});
  }
  /** Scenery is cached until something tells the renderer the ground changed. */
  private tilesChanged() {
    this.state.tilesRevision = (this.state.tilesRevision ?? 0) + 1;
  }
  cropAt(x: number, y: number) {
    return this.state.objects.find(
      (o) =>
        o.kind === "crop" &&
        !o.depleted &&
        o.pos.space === "outside" &&
        o.pos.x === x &&
        o.pos.y === y,
    );
  }
  /** Why this tool cannot be used on this cell, or undefined if it can. */
  toolProblem(action: ToolAction, target: string): string | undefined {
    const tool = this.heldTool();
    const needed = {
      chop: "axe",
      dig: "spade",
      reap: "scythe",
      mine: "pick",
    }[action];
    if (tool !== needed)
      return `You need ${needed === "axe" ? "an axe" : `a ${needed}`} in hand.`;
    const at = this.tileAt(target);
    const p = this.state.player;
    if (!at) return "Aim at a patch of ground.";
    if (p.pos.space !== "outside") return "There is no ground to work indoors.";
    if (p.perch) return `Climb down from ${p.perch.label} first.`;
    const reach = Math.max(Math.abs(at.x - p.pos.x), Math.abs(at.y - p.pos.y));
    if (reach > 1) return "Stand next to it.";
    const plant = this.world.decoration(at.x, at.y);
    if (action === "chop")
      return reach === 0
        ? "Face what you mean to fell."
        : axeWork(plant?.sprite)
          ? undefined
          : "There is nothing here to fell.";
    if (action === "mine")
      return reach === 0
        ? "Face what you mean to break."
        : pickWork(plant?.sprite)
          ? undefined
          : "There is no rock here to break.";
    const edit = this.state.tiles?.[tileKey(at.x, at.y)];
    if (action === "dig") {
      if (edit?.dug) return "This ground is already turned.";
      // A spade turns grass under; anything woodier has to come out first.
      if (plant && plantClass(plant.sprite) !== "grass")
        return plant.sprite === STUMP_SPRITE
          ? "A stump is rooted here."
          : `${this.plantName(plant.sprite, true)} is in the way.`;
      const surface = this.world.terrain(at.x, at.y, "outside");
      return ["grass", "dry", "dirt", "sand", "field"].includes(surface)
        ? undefined
        : `You cannot dig ${surface}.`;
    }
    if (this.cropAt(at.x, at.y)) return undefined;
    return plantClass(plant?.sprite) === "grass"
      ? undefined
      : "Nothing here to cut.";
  }
  /** The cells a tool takes in one stroke. A long shovel opens the cell you
   * face and the one beyond it; a scythe lays a two-by-two swathe. Anything
   * in the swathe that cannot be worked is simply skipped. */
  private swathe(action: ToolAction, at: Point): Point[] {
    const sweep = propDefs[heldObject(this.state)?.prop ?? ""]?.sweep ?? 1;
    if (sweep < 2) return [at];
    const p = this.state.player;
    const d = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][p.direction];
    const beyond = { x: at.x + d[0], y: at.y + d[1] };
    if (action === "dig") return [at, beyond];
    const side = { x: -d[1], y: d[0] };
    return [
      at,
      { x: at.x + side.x, y: at.y + side.y },
      beyond,
      { x: beyond.x + side.x, y: beyond.y + side.y },
    ];
  }
  /** Whether a cell in the swathe beyond the aimed one can take the stroke. */
  private workable(action: ToolAction, at: Point) {
    if (this.world.blocked(at.x, at.y, "outside")) return false;
    const plant = this.world.decoration(at.x, at.y);
    if (action === "dig") {
      if (this.state.tiles?.[tileKey(at.x, at.y)]?.dug) return false;
      if (plant && plantClass(plant.sprite) !== "grass") return false;
      return ["grass", "dry", "dirt", "sand", "field"].includes(
        this.world.terrain(at.x, at.y, "outside"),
      );
    }
    return !!this.cropAt(at.x, at.y) || plantClass(plant?.sprite) === "grass";
  }
  /** Axe, spade and scythe. Validation has already run on the aimed cell. */
  private useTool(action: ToolAction, target: string) {
    const at = this.tileAt(target)!;
    const p = this.state.player;
    const edit = this.editAt(at.x, at.y);
    if (action === "dig") {
      const cells = this.swathe(action, at).filter(
        (q) => (q.x === at.x && q.y === at.y) || this.workable(action, q),
      );
      for (const q of cells) this.editAt(q.x, q.y).dug = true;
      this.tilesChanged();
      this.advance(cells.length > 1 ? 70 : 45);
      this.event(
        cells.length > 1
          ? "You drive the shovel through two spits of earth."
          : "You turn the earth into a furrow of broken soil.",
      );
      return;
    }
    if (action === "reap") {
      const cells = this.swathe(action, at).filter(
        (q) => (q.x === at.x && q.y === at.y) || this.workable(action, q),
      );
      const cut: string[] = [];
      let stubble = false;
      for (const q of cells) {
        const crop = this.cropAt(q.x, q.y);
        if (crop) {
          harvestResource(p, crop, this.state.clock);
          crop.depleted = true;
          cut.push(crop.name.toLowerCase());
        } else {
          this.editAt(q.x, q.y).cut = true;
          stubble = true;
        }
      }
      if (stubble) this.tilesChanged();
      this.advance(cut.length ? 30 : 15);
      this.event(
        cut.length > 1
          ? `You lay a swathe of ${cut[0]} and gather it.`
          : cut.length
            ? `You cut the ${cut[0]} and gather it.`
            : "You cut the growth back to stubble.",
      );
      return;
    }
    const plant = this.world.decoration(at.x, at.y);
    if (action === "mine") return this.usePick(plant, edit);
    const work = axeWork(plant?.sprite);
    if (work === "buck") {
      const wood = edit.wood ?? 1;
      edit.stage = "stump";
      edit.wood = 0;
      p.inventory.wood = (p.inventory.wood ?? 0) + wood;
      this.tilesChanged();
      this.advance(60);
      this.event(
        `You buck the fallen trunk into ${wood} firewood. A stump is left in the ground.`,
      );
      return;
    }
    if (work === "clear") {
      edit.stage = "clear";
      p.inventory.wood = (p.inventory.wood ?? 0) + 1;
      this.tilesChanged();
      this.advance(20);
      this.event("You clear the cut stems away. The ground is bare.");
      return;
    }
    const needed = fellingSwings(plant?.sprite);
    edit.chops = (edit.chops ?? 0) + 1;
    this.advance(30);
    if (edit.chops < needed) {
      const left = needed - edit.chops;
      // Nine blows on an oak should not fill the log with nine lines: the
      // first one and the last one before it goes are the ones worth keeping.
      if (edit.chops === 1 || left === 1)
        this.event(
          `You sink the axe into ${this.plantName(plant?.sprite)}. ${left} more ${left === 1 ? "blow" : "blows"} will bring it down.`,
        );
      return;
    }
    edit.chops = 0;
    if (plantClass(plant?.sprite) === "shrub") {
      edit.stage = "stems";
      this.tilesChanged();
      this.event(`You cut ${this.plantName(plant?.sprite)} off at the root.`);
      return;
    }
    edit.stage = "logs";
    edit.wood = woodYield(plant?.sprite);
    this.tilesChanged();
    this.event(
      `${this.plantName(plant?.sprite, true)} comes down with a crash and lies where it fell.`,
    );
  }
  /** The pick: boulders open into rubble, rubble clears, stumps come out. */
  private usePick(plant: Decoration | undefined, edit: TileEdit) {
    const p = this.state.player;
    const work = pickWork(plant?.sprite);
    const take = (item: ItemId, n: number) =>
      (p.inventory[item] = (p.inventory[item] ?? 0) + n);
    if (work === "clear") {
      edit.stage = "clear";
      edit.chops = 0;
      take("stone", 1);
      if (this.rng("flint") < 0.3) take("flint", 1);
      this.tilesChanged();
      this.advance(40);
      this.event(
        "You clear the broken stone away and pocket what is worth keeping.",
      );
      return;
    }
    const needed = work === "grub" ? STUMP_BLOWS : ROCK_BLOWS;
    edit.chops = (edit.chops ?? 0) + 1;
    this.advance(40);
    if (edit.chops < needed) {
      const left = needed - edit.chops;
      if (edit.chops === 1 || left === 1)
        this.event(
          work === "grub"
            ? `You lever at the stump. ${left} more ${left === 1 ? "heave" : "heaves"} will have it out.`
            : `The pick rings off the rock. ${left} more ${left === 1 ? "blow" : "blows"} will split it.`,
        );
      return;
    }
    edit.chops = 0;
    if (work === "grub") {
      edit.stage = "clear";
      take("wood", 1);
      this.tilesChanged();
      this.event("You lever the stump out of the ground. The cell is clear.");
      return;
    }
    edit.stage = "rubble";
    take("stone", 2);
    this.tilesChanged();
    this.event("The rock splits open. Broken stone lies where it stood.");
  }
  private plantName(sprite: string | undefined, capital = false) {
    const name = plantName(sprite);
    return capital ? `The ${name}` : `the ${name}`;
  }
  climbable():
    | { id: string; label: string; rise: number; at: Point; to?: Point }
    | undefined {
    const p = this.state.player;
    if (p.perch || this.onWall()) return undefined;
    const near = (q: Point) =>
      Math.max(Math.abs(q.x - p.pos.x), Math.abs(q.y - p.pos.y)) <= 1;
    const object = this.state.objects
      .filter(
        (o) =>
          o.pos.space === p.pos.space &&
          near(o.pos) &&
          !o.carriedBy &&
          !o.broken &&
          !!o.prop &&
          !!propDefs[o.prop]?.solid,
      )
      .sort((a, b) => distance(p.pos, a.pos) - distance(p.pos, b.pos))[0];
    // object.name, not inspect(): inspect() asks this method for its climb
    // affordance, so reaching back into it recurses until the stack blows.
    if (object)
      return {
        id: object.id,
        label: object.name,
        rise: 12,
        at: { x: object.pos.x, y: object.pos.y },
      };
    if (p.pos.space === "outside") {
      const ring: Point[] = [];
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ])
        ring.push({ x: p.pos.x + dx, y: p.pos.y + dy });
      for (const q of ring) {
        const plant = this.world.decoration(q.x, q.y);
        if (plant?.solid && plant.sprite !== "rock")
          return {
            id: plant.id,
            label: treeName(plant.sprite),
            rise: 24,
            at: q,
          };
      }
      // A blocked cell with nothing growing on it is masonry: a house wall or
      // a town wall. Either is a scramble to the top rather than a way through.
      for (const q of ring) {
        if (!this.world.blocked(q.x, q.y, "outside")) continue;
        if (this.world.decoration(q.x, q.y)?.solid) continue;
        const place = (this.world.places ?? []).find(
          (r) => q.x >= r.x && q.x < r.x + r.w && q.y >= r.y && q.y < r.y + r.h,
        );
        if (place) return { id: place.id, label: place.name, rise: 22, at: q };
        // A wall walk is a surface, not a perch: step onto it and the wall
        // top is ground until you climb down the far side.
        if (this.wallAt(q.x, q.y, "outside"))
          return {
            id: `wall:${q.x},${q.y}`,
            label: "the wall",
            rise: 20,
            at: q,
            to: q,
          };
        return {
          id: `wall:${q.x},${q.y}`,
          label: "the wall",
          rise: 20,
          at: q,
        };
      }
    }
    const place = (this.world.places ?? []).find((q) => near(q.entrance));
    if (place)
      return {
        id: place.id,
        label: place.name,
        rise: 22,
        at: { ...place.entrance },
      };
    if (p.pos.space === "outside" && this.world.topography) {
      const here = this.world.topography(p.pos.x, p.pos.y);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const to = { x: p.pos.x + dx, y: p.pos.y + dy };
        const cell = this.world.topography(to.x, to.y);
        const rise = here && cell ? cell.height - here.height : 0;
        // A one-tier step is already a walk; only a real face needs climbing.
        if (cell && !cell.solid && rise >= 2 && rise <= 3)
          return {
            id: `ledge:${to.x},${to.y}`,
            label: "the ledge",
            rise: rise * 8,
            at: to,
            to,
          };
      }
    }
    return undefined;
  }
  /** Shared by the C key, the affordance and the narrator's climb intent. */
  perch(target: {
    id: string;
    label: string;
    rise: number;
    at?: Point;
    to?: Point;
  }) {
    const p = this.state.player;
    if (target.to) {
      p.pos = { ...target.to, space: p.pos.space };
      this.advance(40);
      this.event(`You scramble up ${target.label}.`);
      return;
    }
    p.perch = {
      on: target.id,
      label: target.label,
      rise: target.rise,
      // Standing on the thing, not beside it: the renderer draws the player
      // over this cell while pos, and so collision, stays put.
      ...(target.at ? { at: { ...target.at } } : {}),
    };
    this.advance(40);
    this.event(`You climb ${target.label} and settle at the top.`);
  }
  descend() {
    const p = this.state.player;
    if (!p.perch && this.onWall()) {
      const down = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
        .map(([dx, dy]) => ({ x: p.pos.x + dx, y: p.pos.y + dy }))
        .find(
          (q) =>
            !this.wallAt(q.x, q.y, "outside") &&
            !this.blocked(q.x, q.y, "outside"),
        );
      if (!down) return;
      p.pos = { ...down, space: p.pos.space };
      this.advance(20);
      this.event("You climb down off the wall.");
      return;
    }
    if (!p.perch) return;
    const label = p.perch.label;
    p.perch = undefined;
    this.advance(20);
    this.event(`You climb down from ${label}.`);
  }
  doorOf(placeId: string) {
    if (!this.doorsByPlace) {
      this.doorsByPlace = new Map();
      for (const o of this.state.objects)
        if (o.kind === "door" && o.placeId) this.doorsByPlace.set(o.placeId, o);
    }
    return this.doorsByPlace.get(placeId);
  }
  /** Doors are created with the world and never added or removed, so the
   * index only has to survive a reload. */
  private doorsByPlace?: Map<string, WorldObject>;
  /** Who just answered a knock, for the UI to open the conversation on. Read
   * once and cleared; never part of the saved state. */
  doorAnswer?: string;
  /** Whether a door opens for this caller right now. The rules are in
   * doors.ts; the engine only supplies who is inside and who is welcome. */
  doorVerdict(place: Place, actorId: string): DoorVerdict {
    const invited =
      place.access === "public"
        ? false
        : place.owner === actorId ||
          (actorId === "player" &&
            this.state.manifest.simulation === 2 &&
            place.owner === this.state.player.id) ||
          !!this.state.households?.some(
            (h) =>
              h.members.includes(actorId) && h.members.includes(place.owner),
          ) ||
          (actorId === "player" &&
            (this.state.permissions[place.owner] ?? 0) > this.state.clock);
    return doorAccess({
      access: place.access,
      invited,
      occupied: this.state.actors.some((a) => a.pos.space === place.id),
      hour: (this.state.clock / 3600) % 24,
    });
  }
  barrierAt(p: Point, space = this.state.player.pos.space) {
    if (this.barriersAt)
      return this.barriersAt
        .get(`${space}:${p.x},${p.y}`)
        ?.find((o) => !o.open);
    return this.state.objects.find(
      (o) =>
        (o.kind === "gate" || o.kind === "door") &&
        !o.open &&
        o.pos.space === space &&
        o.pos.x === p.x &&
        o.pos.y === p.y,
    );
  }
  findRoute(
    start: Position,
    target: Point,
    actorId = "player",
    maxNodes = 18000,
  ): RouteResult {
    // Hoisted out of the cost callback: both were rescanning the whole actor
    // list at every explored node.
    const human =
      actorId === "player" ||
      (this.actorsById
        ? this.actorsById.get(actorId)?.kind === "human"
        : this.state.actors.some(
            (a) => a.id === actorId && a.kind === "human",
          ));
    // Inside advance the per-cell actor index answers this directly, so the
    // route callback never rebuilds a set over every actor.
    const cellOccupied = (p: Point) =>
      this.actorAt({ ...p, space: start.space }, actorId);
    const occupied = this.actorsAt ? undefined : new Set<string>();
    if (occupied && actorId !== "player")
      for (const a of this.state.actors)
        if (a.id !== actorId && a.pos.space === start.space)
          occupied.add(`${a.pos.x},${a.pos.y}`);
    return route(
      start,
      target,
      (to, from) => {
        if (
          start.space === "outside" &&
          this.world.canCross &&
          !this.world.canCross(from, to)
        )
          return Infinity;
        if (this.blocked(to.x, to.y, start.space)) {
          const gate = this.barrierAt(to, start.space);
          // Humans can open a gate; animals must wait for an actual open gate.
          if (
            !gate ||
            !human ||
            (actorId !== "player" && gate.owner && gate.owner !== actorId) ||
            this.world.blocked(to.x, to.y, start.space)
          )
            return Infinity;
          return 5;
        }
        if (
          actorId !== "player" &&
          (occupied ? occupied.has(`${to.x},${to.y}`) : cellOccupied(to))
        )
          return Infinity;
        return start.space === "outside"
          ? (this.world.navigationCost?.(to.x, to.y, actorId) ?? 1) *
              (this.world.topography
                ? wadingCost(
                    waterDepthAt(this.world.topography, to.x + 0.5, to.y + 0.5),
                  )
                : 1)
          : 1;
      },
      {
        maxNodes,
        bounds: {
          x: Math.min(start.x, target.x) - 48,
          y: Math.min(start.y, target.y) - 48,
          w: Math.abs(start.x - target.x) + 96,
          h: Math.abs(start.y - target.y) + 96,
        },
      },
    );
  }
  private routes = new Map<string, { target: string; path: Point[] }>();
  visible(pos: Position) {
    return this.visibleFrom(this.state.player.pos, pos);
  }
  visibleFrom(
    p: Position,
    pos: Position,
    places: WorldModel["places"] = this.world.places,
  ) {
    if (distance(p, pos) > SIGHT) return false;
    if (p.space !== "outside") return true;
    const steps = Math.max(Math.abs(p.x - pos.x), Math.abs(p.y - pos.y));
    if (steps < 2) return true;
    // Only places overlapping the sight line's bounds can block it; without
    // this the whole place list is rescanned for every step of every ray.
    const minX = Math.min(p.x, pos.x),
      maxX = Math.max(p.x, pos.x),
      minY = Math.min(p.y, pos.y),
      maxY = Math.max(p.y, pos.y),
      blockers = places.filter(
        (b) =>
          b.x <= maxX && b.x + b.w > minX && b.y <= maxY && b.y + b.h > minY,
      );
    if (!blockers.length) return true;
    for (let i = 1; i < steps; i++) {
      const x = Math.round(p.x + ((pos.x - p.x) * i) / steps),
        y = Math.round(p.y + ((pos.y - p.y) * i) / steps);
      for (const b of blockers)
        if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)
          return false;
    }
    return true;
  }
  observe(): Observation {
    const s = this.state;
    const p = s.player.pos;
    const places =
      p.space === "outside"
        ? this.world.places.filter(
            (b) =>
              b.x <= p.x + SIGHT &&
              b.x + b.w > p.x - SIGHT &&
              b.y <= p.y + SIGHT &&
              b.y + b.h > p.y - SIGHT,
          )
        : [];
    const visible = (pos: Position) => this.visibleFrom(p, pos, places);
    return copy({
      revision: s.revision,
      clock: s.clock,
      player: s.player,
      actors: s.actors
        .filter((a) => visible(a.pos))
        .map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          kind: a.kind,
          pos: a.pos,
          sprite: a.sprite,
          appearance: a.appearance,
          origin: a.origin,
          age: a.age,
          held: a.held,
          activity: a.activity,
          direction: a.direction,
        })),
      objects: s.objects
        .filter((o) => visible(o.pos))
        .map((o) => ({
          ...o,
          inventory: o.prop
            ? o.open
              ? o.inventory
              : {}
            : o.owner && o.owner !== "player"
              ? {}
              : o.inventory,
        })),
      places: this.world.places.filter((p) =>
        visible({ ...p.entrance, space: "outside" }),
      ),
      events: s.events.slice(-12),
      manifest: s.manifest,
    });
  }
  inspect(id: string): Inspection | undefined {
    const coordinates = /^decor-(-?\d+)-(-?\d+)$/.exec(id);
    if (coordinates) {
      const x = Number(coordinates[1]),
        y = Number(coordinates[2]);
      const pos = { x, y, space: "outside" };
      if (!this.visible(pos)) return;
      const plant = this.world.decoration(x, y);
      if (!plant || plant.id !== id || plant.sprite === "rock") return;
      const worked = isWorkedGround(plant.sprite);
      const name = worked
        ? plantName(plant.sprite).replace(/^./, (c) => c.toUpperCase())
        : treeName(plant.sprite);
      return {
        id,
        pos,
        name,
        sprite: plant.sprite,
        kind: "vegetation",
        description: worked
          ? "Ground you have worked."
          : plant.solid
            ? "A tree growing in the surrounding landscape."
            : "Low vegetation growing in the surrounding landscape.",
        affordances: [],
      };
    }

    const actor = this.state.actors.find((a) => a.id === id);
    const object = this.state.objects.find((o) => o.id === id);
    const place = this.world.place(id);
    const pos =
      actor?.pos ??
      object?.pos ??
      (place ? { ...place.entrance, space: "outside" } : undefined);
    if (!pos || !this.visible(pos)) return;
    const close = distance(this.state.player.pos, pos) <= 2.5;
    const affordances: Affordance[] = [];
    const add = (
      label: string,
      command: PlayerCommand,
      enabled = close,
      reason = "Walk closer to interact",
    ) =>
      affordances.push({
        label,
        command,
        enabled,
        reason: enabled ? undefined : reason,
      });
    const interact = (
      action: Extract<PlayerCommand, { type: "interact" }>["action"],
      label: string,
      enabled = close,
      reason?: string,
    ) => add(label, { type: "interact", target: id, action }, enabled, reason);
    const reachable = this.climbable();
    if (reachable?.id === id) interact("climb", `Climb ${reachable.label}`);
    if (this.state.player.perch?.on === id)
      interact("descend", "Climb down", true);
    if (actor) {
      if (actor.kind === "human") {
        interact("talk", "Talk");
        interact(
          "follow",
          "Ask to accompany",
          close && actor.trust >= 0,
          actor.trust < 0 ? "They decline your company" : "Walk closer",
        );
        const t = this.world.pack.trade;
        add(
          `Trade ${t.cost} ${this.items[t.give].name.toLowerCase()} for ${this.items[t.take].name.toLowerCase()}`,
          {
            type: "trade",
            target: id,
            give: t.give,
            giveQuantity: t.cost,
            take: t.take,
            takeQuantity: 1,
          },
          close && (this.state.player.inventory[t.give] ?? 0) >= t.cost,
          close ? "You do not have the offered goods" : undefined,
        );
      } else if (actor.kind === "lizard")
        interact("capture", "Attempt capture");
      else interact("herd", "Guide toward the enclosure");
      return {
        id,
        name: actor.name,
        description:
          actor.kind === "human"
            ? `${actor.role}${actor.age !== undefined ? `, age ${actor.age}` : ""}. ${actor.activity}. ${(actor.relations ?? []).map((r) => `${r.kind}: ${[this.state.player, ...this.state.actors].find((a) => a.id === r.other)?.name ?? r.other}`).join("; ")}. ${actor.trust < 0 ? "They seem wary of you." : "They notice your approach."}`
            : `${actor.activity}. ${actor.owner ? "Part of a household’s flock." : "Moving through the landscape."}`,
        kind: actor.kind,
        pos,
        affordances,
      };
    }
    if (place) {
      const door = this.doorOf(place.id);
      const verdict = this.doorVerdict(place, "player");
      interact(
        "enter",
        place.entranceLabel,
        close && !!door?.open,
        door?.open
          ? "Walk to the entrance"
          : verdict === "barred"
            ? "The door is shut against you"
            : "Open the door first",
      );
      return {
        id,
        name: place.name,
        description:
          place.description +
          (place.access === "household" ? " This is a household space." : ""),
        kind: "building",
        pos,
        claim: place.claim,
        affordances,
      };
    }
    if (!object) return;
    if (object.prop) {
      const def = propDefs[object.prop];
      return {
        id,
        name: object.broken
          ? `Broken ${object.name.toLowerCase()}`
          : object.name,
        pos,
        kind: object.kind,
        claim: object.claim,
        description: [
          object.broken
            ? "Broken remains; spilled contents can be recovered."
            : def?.strike
              ? "A stout branch. Hold it to strike breakable containers."
              : def?.drink
                ? "A water source."
                : def?.container
                  ? object.open
                    ? "The contents are visible."
                    : "Look inside to discover the contents."
                  : "A household work object.",
          object.carriedBy ? "You are holding it." : "",
          object.owner && object.owner !== "player"
            ? "Household property; carrying it does not change ownership."
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        affordances: [
          ...propAffordances(this.state, object, close),
          ...(this.state.households?.some(
            (h) => h.storeId === object.id && h.members.includes("player"),
          )
            ? [
                {
                  label: "Contribute supplies",
                  command: {
                    type: "interact" as const,
                    target: object.id,
                    action: "store" as const,
                  },
                  enabled: close,
                  reason: close ? undefined : "Walk closer",
                },
              ]
            : []),
          ...(this.state.player.memories.some((m) =>
            m.startsWith(`theft:${id}:`),
          )
            ? [
                {
                  label: "Return what you took",
                  command: {
                    type: "interact" as const,
                    target: id,
                    action: "return" as const,
                  },
                  enabled: close,
                },
              ]
            : []),
        ],
        inventory: object.open ? copy(object.inventory) : undefined,
      };
    }

    if (object.kind === "gate")
      interact(
        object.open ? "close" : "open",
        object.open ? "Close gate" : "Open gate",
      );
    if (object.kind === "door") {
      const place = object.placeId
        ? this.world.place(object.placeId)
        : undefined;
      const verdict = place ? this.doorVerdict(place, "player") : "open";
      if (object.open) interact("close", "Close the door");
      else if (verdict === "open") interact("open", "Open the door");
      // A door that will not open can still be knocked on. Whether anything
      // answers is the knock's business, not the prompt's.
      else interact("knock", "Knock and wait");
    }
    if (object.kind === "well") interact("drink", "Drink and refill water");
    if (object.kind === "fire")
      interact("rest", "Warm yourself for 20 minutes");
    if (object.kind === "bed") {
      interact("rest", "Rest for 20 minutes");
      interact("sleep", "Sleep until morning");
    }
    if (object.kind === "tree")
      interact(
        "harvest",
        object.resource
          ? `Gather ${this.items[object.resource.item].name.toLowerCase()}`
          : "Gather fallen branches",
        close && !object.depleted,
        object.depleted ? "The fallen wood has been gathered" : "Walk closer",
      );
    if (object.kind === "crop")
      interact(
        "harvest",
        "Gather grain",
        close && !object.depleted,
        object.depleted ? "Already gathered" : "Walk closer",
      );
    if (object.kind === "container" && !object.depleted)
      interact(
        "take",
        object.owner && object.owner !== "player"
          ? "Take without permission"
          : "Take",
      );
    if (
      object.kind === "container" &&
      this.state.player.memories.some((m) => m.startsWith(`theft:${id}:`))
    )
      interact("return", "Return what you took");
    if (object.kind === "exit") interact("exit", "Return outside");
    return {
      id,
      name: object.name,
      description: object.resource
        ? `${object.name}. ${object.depleted ? "Currently depleted or out of season." : `${object.inventory[object.resource.item] ?? 0} available.`} Harvest season: ${object.resource.seasons.join(", ")}.`
        : object.kind === "tree"
          ? object.depleted
            ? "The fallen wood has been gathered. The tree remains."
            : "A little shade. Dry branches lie beneath the canopy."
          : object.depleted
            ? "The container or plot has been emptied."
            : object.kind === "door"
              ? object.open
                ? "The door stands open."
                : "The door is shut."
              : object.kind === "gate"
                ? object.open
                  ? "The gate stands open."
                  : "The gate keeps animals inside."
                : object.owner
                  ? "These possessions belong to a household. Access does not grant ownership."
                  : "A shared resource in the settlement.",
      kind: object.kind,
      pos,
      claim: object.claim,
      affordances,
      inventory: object.owner ? undefined : copy(object.inventory),
    };
  }
  act(request: CommandRequest): CommandResult {
    const payload = canonical(request.command);
    const prior = Object.hasOwn(this.state.receipts, request.actionId)
      ? this.state.receipts[request.actionId]
      : undefined;
    if (prior)
      return prior.payload === payload
        ? copy(prior.result)
        : {
            actionId: request.actionId,
            revision: this.state.revision,
            status: "rejected",
            elapsedSeconds: 0,
            events: [],
            reason: "That action ID was already used with another command.",
          };
    if (
      !/^[a-zA-Z0-9_-]{1,100}$/.test(request.actionId) ||
      ["__proto__", "constructor", "prototype"].includes(request.actionId)
    )
      return {
        actionId: request.actionId,
        revision: this.state.revision,
        status: "rejected",
        elapsedSeconds: 0,
        events: [],
        reason: "Invalid action ID.",
      };
    let result: CommandResult;
    if (request.expectedRevision !== this.state.revision) {
      result = {
        actionId: request.actionId,
        revision: this.state.revision,
        status: "rejected",
        elapsedSeconds: 0,
        events: [],
        reason:
          "The world has changed. Read the current view and try a new action.",
      };
    } else {
      const before = this.state.clock,
        lastEvent = this.state.events.at(-1)?.id ?? 0;
      const reason = this.validate(request.command);
      if (reason)
        result = {
          actionId: request.actionId,
          revision: this.state.revision,
          status: "rejected",
          elapsedSeconds: 0,
          events: [],
          reason,
        };
      else {
        this.execute(request.command);
        const held = heldObject(this.state);
        if (held) held.pos = copy(this.state.player.pos);
        this.state.revision++;
        this.state.log.push(copy(request));
        result = {
          actionId: request.actionId,
          revision: this.state.revision,
          status: "completed",
          elapsedSeconds: this.state.clock - before,
          events: copy(this.state.events.filter((e) => e.id > lastEvent)),
        };
      }
    }
    this.state.receipts[request.actionId] = { payload, result: copy(result) };
    this.onAct?.(request, result);
    return result;
  }
  validate(c: PlayerCommand): string | undefined {
    const p = this.state.player;
    if (c.type === "interact" && c.action === "descend")
      return p.perch || this.onWall() ? undefined : "You are not up anything.";
    if (
      c.type === "interact" &&
      (c.action === "chop" ||
        c.action === "dig" ||
        c.action === "reap" ||
        c.action === "mine")
    )
      return this.toolProblem(c.action, c.target);
    if (c.type === "interact" && c.action === "climb") {
      if (p.perch) return `You are already up ${p.perch.label}.`;
      return this.climbable() ? undefined : "There is nothing here to climb.";
    }
    if (p.perch && (c.type === "move" || c.type === "throw"))
      return `Climb down from ${p.perch.label} first.`;
    if (c.type === "move" || c.type === "throw") {
      if (
        !Number.isInteger(c.dx) ||
        !Number.isInteger(c.dy) ||
        Math.max(Math.abs(c.dx), Math.abs(c.dy)) !== 1
      )
        return c.type === "throw"
          ? "Throw in one direction."
          : "Move one adjacent step.";
      if (c.type === "throw")
        return heldObject(this.state)
          ? undefined
          : "You are not holding anything to throw.";
      if (c.jump && heldObject(this.state))
        return "Put down the held object before jumping.";
      if (c.jump && c.traverse) return "Choose one movement style.";
      if (c.traverse || c.jump) {
        const leap = this.traversal(p.pos, c.dx, c.dy, c.jump, c.run);
        if (leap.kind === "blocked") return leap.reason;
        const landing = {
          x: p.pos.x + c.dx * leap.distance,
          y: p.pos.y + c.dy * leap.distance,
        };
        const there = this.state.actors.find(
          (a) =>
            a.pos.space === p.pos.space &&
            a.pos.x === landing.x &&
            a.pos.y === landing.y,
        );
        return there ? `${there.name} is standing there.` : undefined;
      }
      if (
        p.pos.space === "outside" &&
        this.world.topography &&
        waterDepthAt(
          this.world.topography,
          p.pos.x + c.dx + 0.5,
          p.pos.y + c.dy + 0.5,
        ) > MAX_WADING_DEPTH
      )
        return "Too deep to wade — find a shallower crossing or a bridge.";
      if (
        (p.pos.space === "outside" &&
          this.world.canCross &&
          !this.world.canCross(p.pos, {
            x: p.pos.x + c.dx,
            y: p.pos.y + c.dy,
          })) ||
        (this.blocked(p.pos.x + c.dx, p.pos.y + c.dy) &&
          !(this.onWall() && this.wallAt(p.pos.x + c.dx, p.pos.y + c.dy))) ||
        (c.dx !== 0 &&
          c.dy !== 0 &&
          (this.blocked(p.pos.x + c.dx, p.pos.y) ||
            this.blocked(p.pos.x, p.pos.y + c.dy)))
      )
        return "The way is blocked.";
      const occupant = this.state.actors.find(
        (a) =>
          a.pos.space === p.pos.space &&
          a.pos.x === p.pos.x + c.dx &&
          a.pos.y === p.pos.y + c.dy,
      );
      if (occupant) return `${occupant.name} is standing there.`;
      return;
    }
    if (c.type === "sleep")
      return Number.isInteger(c.seconds) &&
        c.seconds >= 600 &&
        c.seconds <= 24 * 3600
        ? undefined
        : "Sleep between 10 minutes and a full day.";
    if (c.type === "wait" || c.type === "pass")
      return Number.isInteger(c.seconds) && c.seconds > 0 && c.seconds <= 3600
        ? undefined
        : "Wait between 1 and 3,600 seconds.";
    if (c.type === "use")
      return this.item(c.item)?.edible && (p.inventory[c.item] ?? 0) > 0
        ? undefined
        : "You cannot eat that item.";
    if (c.type === "wear")
      return this.item(c.item)?.wear && (p.inventory[c.item] ?? 0) > 0
        ? undefined
        : "You cannot wear that item.";
    if (c.type === "remove")
      return p.worn?.[c.slot]
        ? undefined
        : "There is nothing there to take off.";
    if (c.type === "narrate") return validateIntents(this, c.intents);
    if (c.type === "swing")
      return p.perch ? `Climb down from ${p.perch.label} first.` : undefined;
    if (c.type === "hold") {
      const def = this.item(c.item);
      if (!def?.hand) return "That is not something you can take in hand.";
      if ((p.inventory[c.item] ?? 0) < 1) return "You have none of those.";
      return p.held && !this.dropSpot()
        ? "There is no clear place to set down what you are holding."
        : undefined;
    }
    if (c.type === "stow") {
      if (!p.held && !p.heldItem) return "Your hands are already empty.";
      return p.held && !this.dropSpot()
        ? "There is no clear adjacent place to put it down."
        : undefined;
    }
    if (c.type === "interact" && c.action === "drop" && !this.dropSpot())
      return "There is no clear adjacent place to put it down.";
    const target = this.inspect(c.target);
    if (!target) return "That target is not visible.";
    if (distance(p.pos, target.pos) > 2.5) return "Move closer first.";
    if (c.type === "trade") {
      const a = this.state.actors.find((a) => a.id === c.target);
      if (!a || a.kind !== "human") return "You cannot trade with this target.";
      if (a.trust < 0)
        return "They will not trade while the loss remains unresolved.";
      if (
        !Number.isSafeInteger(c.giveQuantity) ||
        !Number.isSafeInteger(c.takeQuantity) ||
        c.giveQuantity < 1 ||
        c.takeQuantity < 1 ||
        c.giveQuantity > 999 ||
        c.takeQuantity > 999 ||
        c.give === c.take
      )
        return "Invalid quantities or items.";
      const give = this.item(c.give),
        take = this.item(c.take);
      if (
        !give ||
        !take ||
        (p.inventory[c.give] ?? 0) < c.giveQuantity ||
        (a.inventory[c.take] ?? 0) < c.takeQuantity
      )
        return "One side does not have the offered goods.";
      if (give.value * c.giveQuantity < take.value * c.takeQuantity)
        return "They decline those terms.";
      return;
    }
    const offered = target.affordances.find(
      (a) => a.command.type === "interact" && a.command.action === c.action,
    );
    if (!offered?.enabled)
      return offered?.reason ?? "That action is not available.";
  }
  private populatedDistrict = "";
  /** One line per intent from the last narrate command. */
  lastOutcomes: string[] = [];
  populateNearby() {
    if (!this.world.activate) return;
    const p = this.state.player.pos;
    if (p.space !== "outside") return;
    const key = `${Math.floor(p.x / 128)},${Math.floor(p.y / 128)}`;
    if (key === this.populatedDistrict) return;
    this.populatedDistrict = key;
    this.world.activate(p.x, p.y);
    if (this.world.households)
      for (const h of this.world.households) {
        this.state.households ??= [];
        if (!this.state.households.some((old) => old.id === h.id))
          this.state.households.push(copy(h));
      }
    const ids = new Set(
      [...this.state.actors, ...this.state.objects].map((o) => o.id),
    );
    for (const actor of this.world.initialActors)
      if (!ids.has(actor.id))
        this.state.actors.push({
          ...copy(actor),
          lastUpdated: this.state.clock,
        });
    for (const object of this.world.initialObjects)
      if (!ids.has(object.id)) {
        const next = copy(object);
        if (this.world.pack.setting?.environment)
          refreshResource(
            next,
            this.state.clock,
            seasonAt(this.world.pack.setting.season, this.state.clock),
          );
        this.state.objects.push(next);
      }
    this.syncFauna();
  }
  /** Copies the animal groups near the player into the snapshot and drops the
   * ones left behind. Safe to call at any time: groups are matched by id, and
   * `world.fauna` only hands out a block it has not handed out before. */
  syncFauna() {
    if (!this.world.fauna) return;
    const p = this.state.player.pos;
    this.state.fauna ??= [];
    // Groups far behind the player are dropped and their block released, so
    // a long walk does not grow the save without bound; coming back spawns
    // the same animals from the same seed.
    const stale = new Set<string>();
    this.state.fauna = this.state.fauna.filter((g) => {
      if (
        Math.abs(g.pos.x - p.x) <= FAUNA_KEEP &&
        Math.abs(g.pos.y - p.y) <= FAUNA_KEEP
      )
        return true;
      if (!g.gateId) stale.add(faunaBlockOf(g.home.x, g.home.y));
      return !!g.gateId;
    });
    for (const key of stale) this.world.forgetFauna?.(key);
    const known = new Set(this.state.fauna.map((g) => g.id));
    for (const g of this.world.fauna(p.x, p.y))
      if (!known.has(g.id)) {
        known.add(g.id);
        this.state.fauna.push(copy(g));
      }
  }
  /** One six-second step for the animal groups near the player. Their pace
   * is their own: a wolf outruns a person, a sheep does not keep up. */
  private stepFauna(clock: number) {
    const groups = this.state.fauna;
    if (!groups?.length) return;
    const player = this.state.player;
    const focus =
      player.pos.space === "outside"
        ? player.pos
        : {
            ...(this.world.place(player.pos.space)?.entrance ?? player.pos),
            space: "outside",
          };
    const near = groups.filter(
      (g) =>
        Math.abs(g.pos.x - focus.x) <= 80 && Math.abs(g.pos.y - focus.y) <= 80,
    );
    if (!near.length) return;
    const humans = [
      player.pos,
      ...this.state.actors
        .filter(
          (a) =>
            a.kind === "human" &&
            a.pos.space === "outside" &&
            Math.abs(a.pos.x - focus.x) <= 90 &&
            Math.abs(a.pos.y - focus.y) <= 90,
        )
        .map((a) => a.pos),
    ];
    advanceFauna(
      near,
      {
        blocked: (x, y) => this.blocked(x, y, "outside"),
        canCross: this.world.canCross
          ? (from, to) => this.world.canCross!(from, to)
          : undefined,
        topography: this.world.topography
          ? (x, y) => this.world.topography!(x, y)
          : undefined,
        occupied: (x, y) => this.actorAt({ x, y, space: "outside" }, ""),
        gateOpen: (id) => !!this.object(id)?.open,
        humans,
        rng: (purpose) => this.rng(purpose),
        hour: (clock / 3600) % 24,
      },
      clock,
    );
  }
  /** The traversal a move resolved to, for the renderer to animate. Cleared
   * once read, so a walked step never inherits the previous jump's arc. */
  lastLeap?: LeapResult;
  /** Tiles cleared by the last traversal; 1 for a plain step. */
  leapDistance() {
    return this.lastLeap?.distance ?? 1;
  }
  execute(c: PlayerCommand) {
    const p = this.state.player;
    if (c.type === "swing") {
      const held = heldObject(this.state);
      const def = propDefs[held?.prop ?? ""];
      const inHand = p.heldItem ? this.item(p.heldItem)?.hand : undefined;
      const tool = held
        ? toolClass(def.tool, def.strike)
        : toolClass(undefined, inHand?.strike, inHand?.edge);
      p.direction = this.aimAt(p.direction);
      const cone = this.swingCone(p.direction);
      const hits: Hit[] = [];
      let told: string | undefined;
      for (const [i, at] of cone.entries()) {
        const found = this.hitClass(at.x, at.y, p.pos.space);
        const kind = reactionFor(found.hit, tool);
        const h: Hit = {
          at,
          hit: found.hit,
          kind,
          solid: isSolid(kind),
          sprite: found.sprite,
        };
        // The cell you face takes the blow; the corners only rattle, so a
        // wide arc never breaks three pots at once.
        if (i === 0 && found.prop && tool !== "bare") {
          const outcome = this.hurtProp(found.prop, found.hit);
          h.damaged = !!outcome;
          const name = found.prop.name.toLowerCase();
          told =
            outcome === "broke"
              ? `You break ${name}. Its contents spill onto the ground.`
              : outcome === "tipped"
                ? `You knock ${name} over. What it held rolls out.`
                : outcome === "damaged"
                  ? `You strike ${name}. It is damaged but still holds together.`
                  : undefined;
        }
        hits.push(h);
      }
      this.lastSwing = { hits, tool, direction: p.direction };
      const solid = hits.find((h) => h.solid);
      if (told) this.event(told);
      else if (solid && solid.hit !== "creature")
        this.event(
          `Your swing ${solid.kind === "thwock" ? "rings off" : "thumps into"} the ${plantName(solid.sprite)}.`,
        );
      this.advance(solid ? 3 : 2);
      return;
    }
    if (c.type === "throw") {
      const prop = heldObject(this.state);
      if (!prop) throw Error("Throw validation failed");
      p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
      p.facing = facingFromStep(c.dx, c.dy, p.direction);
      let landed = { ...p.pos };
      const reach = c.run ? 6 : 3;
      for (let i = 1; i <= reach; i++) {
        const step = { ...p.pos, x: p.pos.x + c.dx * i, y: p.pos.y + c.dy * i };
        // A thrown thing flies: a bank it could not wade across does not stop
        // it, though a wall still does.
        if (this.blocked(step.x, step.y, step.space)) break;
        landed = step;
      }
      const distance = Math.max(
        Math.abs(landed.x - p.pos.x),
        Math.abs(landed.y - p.pos.y),
      );
      const sprite = prop.sprite;
      // Read the landing cell before the prop is standing in it.
      const ground = this.hitClass(landed.x, landed.y, landed.space);
      prop.pos = landed;
      delete prop.carriedBy;
      delete p.held;
      const def = propDefs[prop.prop ?? ""];
      const kind = reactionFor(ground.hit, "thrown");
      // Soft ground and water catch a pot; anything else bursts it.
      const bursts = !!def?.breakable && kind === "shatter" && distance > 0;
      if (bursts) {
        this.propOwnership(prop, "break");
        prop.broken = true;
        prop.open = true;
        prop.depleted = false;
        prop.sprite = brokenSprite(prop.id, def.breakable!);
      }
      this.lastThrow = {
        from: { x: p.pos.x, y: p.pos.y },
        to: { x: landed.x, y: landed.y },
        sprite,
        hit: {
          at: { x: landed.x, y: landed.y },
          hit: ground.hit,
          kind: bursts ? "shatter" : kind,
          solid: isSolid(bursts ? "shatter" : kind),
          damaged: bursts,
        },
      };
      if (!distance)
        this.event(`You have no room to throw ${prop.name.toLowerCase()}.`);
      else if (bursts)
        this.event(
          `You hurl ${prop.name.toLowerCase()}. It shatters where it lands.`,
        );
      else if (kind === "splash")
        this.event(
          `You hurl ${prop.name.toLowerCase()}. It lands with a splash.`,
        );
      else
        this.event(
          `You ${c.run ? "fling" : "throw"} ${prop.name.toLowerCase()} ${distance} pace${distance > 1 ? "s" : ""} away.`,
        );
      this.advance(3);
      return;
    }
    if (c.type === "move") {
      const leap =
        c.traverse || c.jump
          ? this.traversal(p.pos, c.dx, c.dy, c.jump, c.run)
          : undefined;
      if (leap && leap.kind !== "blocked") {
        this.lastLeap = leap;
        p.pos.x += c.dx * leap.distance;
        p.pos.y += c.dy * leap.distance;
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        const depth =
          p.pos.space === "outside" && this.world.topography
            ? waterDepthAt(this.world.topography, p.pos.x + 0.5, p.pos.y + 0.5)
            : 0;
        p.activity = depth > 0 ? "Wading" : "Exploring";
        this.populateNearby();
        this.advance(leap.seconds);
        const key = `${Math.floor(p.pos.x / 64)},${Math.floor(p.pos.y / 64)}`;
        if (!this.state.visited.includes(key)) this.state.visited.push(key);
        return;
      }
      delete this.lastLeap;
      p.pos.x += c.dx;
      p.pos.y += c.dy;
      p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
      p.facing = facingFromStep(c.dx, c.dy, p.direction);
      const depth =
        p.pos.space === "outside" && this.world.topography
          ? waterDepthAt(this.world.topography, p.pos.x + 0.5, p.pos.y + 0.5)
          : 0;
      p.activity = depth > 0 ? "Wading" : "Exploring";
      this.populateNearby();
      const rise =
        p.pos.space === "outside" && this.world.elevation
          ? this.world.elevation(p.pos.x, p.pos.y) -
            this.world.elevation(p.pos.x - c.dx, p.pos.y - c.dy)
          : 0;
      const slope = Math.abs(rise);
      // Tier changes animate even without an explicit jump.
      if (slope >= TERRAIN_STEP)
        this.lastLeap = {
          kind: rise > 0 ? "climb" : "drop",
          distance: 1,
          seconds: 0,
          reason: rise > 0 ? "You scramble up." : "You drop down.",
        };
      this.advance(
        Math.ceil(
          (c.run && !depth ? (c.dx && c.dy ? 2 : 1) : c.dx && c.dy ? 3 : 2) *
            wadingCost(depth),
        ) + (slope > 1 ? 1 : 0),
      );
      const key = `${Math.floor(p.pos.x / 64)},${Math.floor(p.pos.y / 64)}`;
      if (!this.state.visited.includes(key)) this.state.visited.push(key);
      return;
    }
    if (c.type === "pass") {
      this.advance(c.seconds);
      return;
    }
    if (c.type === "wait") {
      this.advance(c.seconds);
      this.event(
        `You wait ${c.seconds >= 60 ? Math.round(c.seconds / 60) + " minutes" : c.seconds + " seconds"}.`,
      );
      return;
    }
    if (c.type === "sleep") {
      this.sleep(c.seconds);
      return;
    }
    if (c.type === "use") {
      const def = this.item(c.item)!;
      p.inventory[c.item] = (p.inventory[c.item] ?? 0) - 1;
      p.hunger = Math.max(0, p.hunger - (def.edible ?? 0));
      if (def.health)
        p.health = Math.min(100, Math.max(0, (p.health ?? 100) + def.health));
      this.advance(60);
      this.event(
        `You eat some ${def.name.toLowerCase()}.${def.health && def.health < 0 ? " It does not sit well." : ""}`,
      );
      return;
    }
    if (c.type === "wear") {
      const def = this.item(c.item)!;
      const slot = def.wear!.slot;
      p.worn ??= {};
      const previous = p.worn[slot];
      p.inventory[c.item] = (p.inventory[c.item] ?? 0) - 1;
      if (previous) p.inventory[previous] = (p.inventory[previous] ?? 0) + 1;
      p.worn[slot] = c.item;
      this.advance(20);
      this.event(`You put on the ${def.name.toLowerCase()}.`);
      return;
    }
    if (c.type === "hold") {
      this.emptyHands();
      p.inventory[c.item] = (p.inventory[c.item] ?? 0) - 1;
      if (!p.inventory[c.item]) delete p.inventory[c.item];
      p.heldItem = c.item;
      this.advance(4);
      this.event(`You take ${this.item(c.item)!.name.toLowerCase()} in hand.`);
      return;
    }
    if (c.type === "stow") {
      const what = p.heldItem
        ? this.item(p.heldItem)!.name.toLowerCase()
        : (this.state.objects
            .find((o) => o.id === p.held)
            ?.name.toLowerCase() ?? "it");
      const wasItem = !!p.heldItem;
      this.emptyHands();
      this.advance(4);
      this.event(wasItem ? `You put ${what} away.` : `You put down ${what}.`);
      return;
    }
    if (c.type === "remove") {
      const id = p.worn![c.slot]!;
      delete p.worn![c.slot];
      p.inventory[id] = (p.inventory[id] ?? 0) + 1;
      this.advance(20);
      this.event(
        `You take off the ${(this.item(id)?.name ?? id).toLowerCase()}.`,
      );
      return;
    }
    if (c.type === "narrate") {
      this.lastOutcomes = resolveIntents(this, c.intents);
      return;
    }
    if (c.type === "interact") {
      const prop = this.state.objects.find((o) => o.id === c.target && o.prop);
      if (
        prop &&
        ["pickup", "drop", "strike", "look", "right", "topple"].includes(
          c.action,
        )
      ) {
        const def = propDefs[prop.prop!];
        if (c.action === "pickup") {
          this.emptyHands();
          prop.carriedBy = "player";
          p.held = prop.id;
          prop.pos = copy(p.pos);
          this.propOwnership(prop, "pick up");
          this.event(
            `You pick up ${prop.name.toLowerCase()}. ${def.strike ? "F swings it." : "F throws it; E puts it down."}`,
          );
        } else if (c.action === "drop") {
          const spot = this.dropSpot();
          if (!spot) throw Error("Drop validation failed");
          prop.pos = spot;
          delete prop.carriedBy;
          delete p.held;
          this.event(`You put down ${prop.name.toLowerCase()}.`);
        } else if (c.action === "look") {
          prop.open = true;
          const contents = Object.entries(prop.inventory)
            .filter(([, n]) => n! > 0)
            .map(
              ([id, n]) =>
                `${n} ${this.items[id as ItemId].name.toLowerCase()}`,
            );
          this.event(
            contents.length
              ? `Inside ${prop.name.toLowerCase()}: ${contents.join(", ")}.`
              : `${prop.name} is empty.`,
          );
        } else if (c.action === "right") {
          prop.tipped = false;
          this.event(`You stand ${prop.name.toLowerCase()} back up.`);
        } else if (c.action === "topple") {
          // Knocked over, not broken: it empties where it lies.
          this.propOwnership(prop, "break");
          prop.tipped = true;
          prop.open = true;
          this.event(
            `You knock ${prop.name.toLowerCase()} over. What it held rolls out.`,
          );
        } else if (c.action === "strike" && def.breakable) {
          this.propOwnership(prop, "break");
          prop.damage = (prop.damage ?? 0) + 1;
          const resistance =
            def.breakable === "wood" || def.breakable === "metal"
              ? 3
              : def.breakable === "fiber" || def.breakable === "plastic"
                ? 2
                : 1;
          if (prop.damage >= resistance) {
            prop.broken = true;
            prop.open = true;
            prop.depleted = false;
            prop.sprite = brokenSprite(prop.id, def.breakable);
            this.event(
              `You break ${prop.name.toLowerCase()}. Its contents spill onto the ground.`,
            );
          } else
            this.event(
              `You strike ${prop.name.toLowerCase()}. It is damaged but still holds together.`,
            );
        }
        this.advance(c.action === "strike" || c.action === "topple" ? 4 : 2);
        return;
      }
    }
    const a = this.state.actors.find((a) => a.id === c.target),
      o = this.state.objects.find((o) => o.id === c.target),
      b = this.world.place(c.target);
    if (c.type === "trade" && a) {
      // Reserve both participants for this short exchange; commit both transfers together.
      p.inventory[c.give] = (p.inventory[c.give] ?? 0) - c.giveQuantity;
      a.inventory[c.give] = (a.inventory[c.give] ?? 0) + c.giveQuantity;
      a.inventory[c.take] = (a.inventory[c.take] ?? 0) - c.takeQuantity;
      p.inventory[c.take] = (p.inventory[c.take] ?? 0) + c.takeQuantity;
      this.advance(60, a.id);
      a.trust++;
      this.event(
        `${a.name} accepts: ${c.giveQuantity} ${this.items[c.give].name.toLowerCase()} for ${c.takeQuantity} ${this.items[c.take].name.toLowerCase()}.`,
        "social",
      );
      return;
    }
    if (c.type !== "interact") return;
    switch (c.action) {
      case "talk":
        if (a) {
          this.advance(90, a.id);
          if (a.trust >= 0) a.trust++;
          const owner = this.world.places.find((b) => b.owner === a.id);
          if (a.trust >= 2) {
            this.state.permissions[a.id] = this.state.clock + 3600 * 3;
            this.event(
              `${a.name}: “${this.world.pack.greeting} You may visit ${owner?.name.toLowerCase() ?? "our household"} for the next few hours.”`,
              "social",
            );
          } else
            this.event(
              `${a.name}: “Something has gone missing. Return it before asking for favors.”`,
              "social",
            );
        }
        break;
      case "follow":
        if (a) {
          this.advance(30, a.id);
          a.consentUntil = this.state.clock + 600;
          p.follows = a.id;
          this.event(
            `${a.name} agrees to your company on the way to work. The invitation lasts ten minutes.`,
            "social",
          );
        }
        break;
      case "enter":
        if (b) {
          this.advance(10);
          p.pos = { x: 6, y: 8, space: b.id };
          p.activity = "Visiting a household";
          this.event(
            `You ${this.world.pack.entryLabel.toLowerCase()} ${b.name.toLowerCase()}.`,
          );
        }
        break;
      case "exit": {
        const home = this.world.place(p.pos.space);
        if (home) {
          // Out through the door that was drawn, not the lot's street corner.
          p.pos = { ...doorApproach(home), space: "outside" };
          const out = this.doorOf(home.id);
          if (out) out.open = true;
          this.advance(10);
          this.event("You return to the open air.");
        }
        break;
      }
      case "open":
      case "close":
        if (o) {
          o.open = c.action === "open";
          this.advance(3);
          this.event(
            o.kind === "door"
              ? `You ${c.action} the door.`
              : `You ${c.action} the gate.`,
          );
        }
        break;
      case "knock": {
        const place = o?.placeId ? this.world.place(o.placeId) : undefined;
        this.advance(30);
        if (!place || !o) break;
        // The rattle the renderer draws; cleared when the door next moves.
        o.knocked = this.state.clock;
        const inside = this.state.actors
          .filter((a) => a.pos.space === place.id && a.kind === "human")
          .sort((a, b) => (a.id < b.id ? -1 : 1));
        const hour = (this.state.clock / 3600) % 24;
        const answerer = inside[0];
        if (!answerer) {
          this.event(
            `You knock at ${place.name.toLowerCase()}. Nobody answers.`,
          );
          break;
        }
        if (hour < 6 || hour >= 22) {
          this.event(
            `A voice inside tells you to come back in daylight. The door stays shut.`,
          );
          break;
        }
        if (answerer.trust < 0) {
          this.event(
            `${answerer.name} calls through the door for you to go away.`,
          );
          break;
        }
        // Answering is standing granted, the same way a conversation grants it,
        // and it lapses the same way.
        this.state.permissions[place.owner] = this.state.clock + 3600;
        o.open = true;
        this.moveActor(answerer, { ...place.entrance, space: "outside" });
        answerer.activity = "Answering the door";
        this.doorAnswer = answerer.id;
        this.event(`${answerer.name} opens the door and looks you over.`);
        break;
      }
      case "climb": {
        const target = this.climbable();
        if (target) this.perch(target);
        break;
      }
      case "descend":
        this.descend();
        break;
      case "drink":
        p.inventory.water = Math.max(p.inventory.water ?? 0, 2);
        p.fatigue = Math.max(0, p.fatigue - 2);
        this.advance(30);
        this.event("You drink cool water and refill your vessel.");
        break;
      case "sleep":
        this.sleep(this.untilMorning());
        break;
      case "rest":
        p.activity = "Resting";
        this.advance(1200);
        p.fatigue = Math.max(0, p.fatigue - 35);
        const depth =
          p.pos.space === "outside" && this.world.topography
            ? waterDepthAt(this.world.topography, p.pos.x + 0.5, p.pos.y + 0.5)
            : 0;
        p.activity = depth > 0 ? "Wading" : "Exploring";
        this.event("You rest beside the household’s work. Your fatigue eases.");
        break;
      case "store":
        if (o) {
          const amount = depositSupplies(p, o);
          this.advance(30);
          this.event(
            `You contribute ${amount} supplies to the household stores.`,
          );
        }
        break;
      case "chop":
      case "dig":
      case "reap":
      case "mine":
        this.useTool(c.action, c.target);
        break;
      case "harvest":
        if (o) {
          if (!harvestResource(p, o, this.state.clock)) break;
          this.advance(180);
          this.event(
            o.resource
              ? `You gather ${this.items[o.resource.item].name.toLowerCase()}. The resource is depleted until it replenishes in season.`
              : o.kind === "tree"
                ? "You gather fallen branches for firewood. The tree remains standing."
                : "You gather ripe grain. The harvested plot remains bare.",
          );
        }
        break;
      case "take":
        if (o) {
          const taken = copy(o.inventory);
          this.transfer(o.inventory, p.inventory);
          o.depleted = !o.prop;
          this.advance(6);
          this.event(`You take the contents of ${o.name.toLowerCase()}.`);
          if (o.owner) {
            p.memories.push(`theft:${o.id}:${JSON.stringify(taken)}`);
            for (const witness of this.state.actors.filter(
              (a) =>
                a.kind === "human" &&
                distance(a.pos, p.pos) < 7 &&
                this.visibleFrom(a.pos, p.pos),
            )) {
              witness.trust -= 3;
              witness.memories.push(`Saw player take ${o.id}`);
              this.event(
                `${witness.name} saw you take property belonging to the household.`,
                "social",
              );
            }
          }
        }
        break;
      case "return":
        if (o) {
          const key = p.memories.find((m) => m.startsWith(`theft:${o.id}:`));
          if (key) {
            const inv = JSON.parse(
              key.slice(`theft:${o.id}:`.length),
            ) as Inventory;
            for (const [k, v] of Object.entries(inv)) {
              const item = k as ItemId;
              const n = Math.min(v ?? 0, p.inventory[item] ?? 0);
              o.inventory[item] = (o.inventory[item] ?? 0) + n;
              p.inventory[item] = (p.inventory[item] ?? 0) - n;
            }
            o.depleted = !o.prop && Object.values(o.inventory).every((v) => !v);
            p.memories = p.memories.filter((m) => m !== key);
            this.advance(10);
            this.event("You return the goods you still carry.");
            for (const a of this.state.actors.filter((a) =>
              a.memories.some((m) => m.includes(o.id)),
            )) {
              a.trust = Math.max(0, a.trust + 2);
              a.memories.push(`Restitution for ${o.id}`);
            }
          }
        }
        break;
      case "capture":
        if (a) {
          const success = this.rng("capture") < 0.48;
          this.advance(12, a.id);
          if (success) {
            this.state.actors = this.state.actors.filter((e) => e.id !== a.id);
            p.inventory.lizard = (p.inventory.lizard ?? 0) + 1;
            this.event("You catch the lizard. It is now in your possession.");
          } else {
            this.stepAway(a, p.pos);
            this.stepAway(a, p.pos);
            a.activity = "Fleeing";
            this.event("The lizard slips away into cover.");
          }
        }
        break;
      case "herd":
        if (a) {
          a.goal = copy(a.home);
          a.activity = "Moving toward the enclosure";
          this.advance(12);
          this.event(
            `You guide the ${a.kind} toward its enclosure. Open the gate to let it through.`,
          );
        }
        break;
    }
  }
  private transfer(from: Inventory, to: Inventory) {
    for (const [k, n] of Object.entries(from)) {
      const id = k as ItemId;
      to[id] = (to[id] ?? 0) + (n ?? 0);
      from[id] = 0;
    }
  }
  private stepToward(a: Actor, target: Position) {
    // Livelihood callbacks write a.pos behind the engine's back.
    this.syncActor(a);
    if (a.pos.space !== target.space) return;
    if (this.state.manifest.simulation === 2) {
      if (a.pos.x === target.x && a.pos.y === target.y) return;
      if (
        (a.householdId &&
          this.blocked(target.x, target.y, target.space) &&
          !this.barrierAt(target, target.space)) ||
        this.actorAt(target, a.id)
      ) {
        const alternative = [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0],
        ]
          .map(([x, y]) => ({ ...target, x: target.x + x, y: target.y + y }))
          .find(
            (p) => !this.blocked(p.x, p.y, p.space) && !this.actorAt(p, a.id),
          );
        if (!alternative) return;
        target = alternative;
      }
      const key = `${target.space}:${target.x},${target.y}`;
      let cached = this.routes.get(a.id);
      if (
        !cached ||
        cached.target !== key ||
        (!cached.path.length && !a.householdId) ||
        (cached.path[0] &&
          this.blocked(cached.path[0].x, cached.path[0].y, a.pos.space) &&
          !this.barrierAt(cached.path[0], a.pos.space))
      ) {
        cached = {
          target: key,
          path: this.findRoute(a.pos, target, a.id, 5000).path,
        };
        this.routes.set(a.id, cached);
      }
      const step = cached.path[0];
      if (!step) return;
      const gate = this.barrierAt(step, a.pos.space);
      if (gate && a.kind === "human" && (!gate.owner || gate.owner === a.id)) {
        gate.open = true;
        return;
      }
      if (this.blocked(step.x, step.y, a.pos.space)) {
        this.routes.delete(a.id);
        return;
      }
      if (this.actorAt({ ...step, space: a.pos.space }, a.id)) {
        this.routes.delete(a.id);
        return;
      }
      cached.path.shift();
      a.direction =
        step.y < a.pos.y ? 0 : step.x > a.pos.x ? 1 : step.y > a.pos.y ? 2 : 3;
      this.moveActor(a, { ...step, space: a.pos.space });
      return;
    }
    const dx = Math.sign(target.x - a.pos.x),
      dy = Math.sign(target.y - a.pos.y);
    const steps =
      Math.abs(target.x - a.pos.x) > Math.abs(target.y - a.pos.y)
        ? [
            [dx, 0],
            [0, dy],
          ]
        : [
            [0, dy],
            [dx, 0],
          ];
    for (const [x, y] of steps) {
      if ((x || y) && !this.blocked(a.pos.x + x, a.pos.y + y, a.pos.space)) {
        a.pos.x += x;
        a.pos.y += y;
        a.direction = y < 0 ? 0 : x > 0 ? 1 : y > 0 ? 2 : 3;
        this.syncActor(a);
        return;
      }
    }
    const step = findPath(
      a.pos,
      target,
      (x, y) => this.blocked(x, y, a.pos.space),
      800,
    )[0];
    if (step) {
      a.pos.x = step.x;
      a.pos.y = step.y;
      this.syncActor(a);
    }
  }
  private stepAway(a: Actor, p: Position) {
    const dx = Math.sign(a.pos.x - p.x) || 1,
      dy = Math.sign(a.pos.y - p.y);
    this.stepToward(a, {
      x: a.pos.x + dx * 3,
      y: a.pos.y + dy * 3,
      space: a.pos.space,
    });
  }
  /** Eats one edible from the actor's own bag, else from the household store.
   * Returns false when there is nothing to eat. */
  private feed(a: Actor, household?: Household) {
    const store = household ? this.object(household.storeId) : undefined;
    for (const bag of [a.inventory, store?.inventory]) {
      if (!bag) continue;
      const food = (Object.keys(bag) as ItemId[]).find(
        (k) => this.items[k].edible && (bag[k] ?? 0) > 0,
      );
      if (!food) continue;
      bag[food] = (bag[food] ?? 0) - 1;
      a.hunger = Math.max(0, a.hunger - (this.items[food].edible ?? 0));
      return true;
    }
    return false;
  }
  /** Places an actor from their precomputed day. Sleeping moves them inside
   * the house, so nobody stands at the door overnight. */
  private followRoutine(a: Actor, routine: Itinerary, clock: number) {
    const at = itineraryAt(routine, clock);
    const household = this.household(a.householdId);
    a.offRoutine = false;
    const sites = this.world.activitySites?.(a.id);
    const gateId = sites?.gateId;
    if (gateId) {
      const gate = this.object(gateId);
      if (gate) gate.open = at.activity !== "rest";
    }
    // The catch hangs while the household is up. The routine puts them at the
    // rack at both ends of the day, so the change happens where you can see it.
    if (sites?.rackId) {
      const rack = this.object(sites.rackId);
      if (rack) rack.open = at.activity !== "rest";
    }
    if (at.activity === "rest" && household?.residence) {
      const index = Math.max(0, household.members.indexOf(a.id));
      this.moveActor(a, {
        x: 3 + (index % 4),
        y: 3,
        space: household.residence,
      });
      a.activity = at.label;
      a.fatigue = Math.max(0, a.fatigue - 0.1);
      // Eating at home is what keeps a resident under the hunger gate below and
      // so on their routine at all. Without it the whole settlement drifts onto
      // the pathfinding fallback over a long session.
      // High enough that one meal covers the night's ~16 points of hunger:
      // followRoutine runs every 12 seconds, and a lower gate empties the
      // household store in a few days.
      if (a.hunger > 35) this.feed(a, household);
      // Indoors the routine's outdoor coordinates mean nothing: let the drawn
      // position fall back to the simulated one.
      a.offRoutine = true;
      return;
    }
    this.moveActor(a, {
      x: Math.round(at.x),
      y: Math.round(at.y),
      space: "outside",
    });
    a.direction = at.direction;
    a.activity = at.label;
  }
  /** Keeps a dormant resident indoors at their household, or at their door
   * when the house has no interior. */
  private park(a: Actor) {
    const household = this.household(a.householdId);
    a.offRoutine = true;
    a.activity = "At home";
    a.hunger = Math.min(a.hunger, 30);
    a.fatigue = Math.max(0, a.fatigue - 0.1);
    if (household?.residence) {
      const index = Math.max(0, household.members.indexOf(a.id));
      this.moveActor(a, {
        x: 3 + (index % 4),
        y: 3,
        space: household.residence,
      });
    } else if (a.pos.space === "outside" && distance(a.pos, a.home) > 0) {
      this.moveActor(a, copy(a.home));
    }
  }
  /** Seconds from now until the next morning, for a night's sleep. */
  untilMorning(hour = 6) {
    const now = this.state.clock;
    const target = Math.floor(now / 86400) * 86400 + hour * 3600;
    return Math.max(600, (target > now ? target : target + 86400) - now);
  }

  /** Where the player would lie down: their own bed, any bed in reach, or the
   * ground. */
  shelter() {
    const p = this.state.player;
    const bed = this.state.objects.find(
      (o) =>
        o.kind === "bed" &&
        o.pos.space === p.pos.space &&
        distance(o.pos, p.pos) <= 2.5,
    );
    const household = this.state.households?.find((h) =>
      h.members.includes("player"),
    );
    const own =
      !!bed &&
      (!bed.owner ||
        bed.owner === "player" ||
        (!!household && household.residence === p.pos.space));
    return {
      bed,
      own,
      indoors: p.pos.space !== "outside",
      /** Under a roof of some kind, whether or not it is yours. */
      covered: p.pos.space !== "outside" || !!bed,
    };
  }

  /**
   * Sleep or long rest. One step of the clock, then the night's account:
   * shelter decides how much good it did, and a night in the open can cost
   * something. Every roll is seeded, so a replay spends the same night.
   */
  sleep(seconds: number) {
    const p = this.state.player;
    const started = this.state.clock;
    const { bed, own, indoors, covered } = this.shelter();
    const setting = this.world.pack.setting;
    const seed = this.state.manifest.seed;
    const before = p.activity;
    p.activity = "Sleeping";
    this.advance(seconds);
    p.activity = before === "Sleeping" ? "Exploring" : before;

    const hours = seconds / 3600;
    // A bed of your own is worth roughly twice the bare ground.
    const quality = own ? 1 : bed ? 0.85 : indoors ? 0.7 : 0.45;
    p.fatigue = Math.max(0, p.fatigue - hours * 14 * quality);

    // The same fallbacks the scene shows, so a night in the visible rain is a
    // night in the rain.
    const weather = weatherAt(
      seed,
      setting?.climate ?? "temperate",
      setting?.season ?? "spring",
      started + seconds / 2,
    );
    const roll = (key: string) => random(seed, "sleep", started, key);
    const cold = weather.tempC < 8;
    const wet = /rain|storm|snow|sleet/i.test(weather.label);
    const rough = !covered && hours >= 3;

    const startHour = Math.floor(started / 3600) % 24;
    const overnight = hours >= 5 && (startHour >= 18 || startHour < 4);
    this.event(
      hours >= 5
        ? `You sleep ${own ? "in your own bed" : bed ? "on a bed not your own" : indoors ? "under a roof" : "on the ground"}.`
        : `You lie down and rest ${Math.round(hours)} hour${hours >= 2 ? "s" : ""}.`,
    );

    // A proper night is the one thing that mends you; nothing else restores
    // health but food.
    if (covered && hours >= 5)
      p.health = Math.min(100, (p.health ?? 100) + (own ? 6 : 4));

    if (rough && (cold || wet)) {
      const harm = Math.round(4 + (cold ? 4 : 0) + (wet ? 3 : 0));
      p.health = Math.max(0, Math.min(100, (p.health ?? 100) - harm));
      this.event(
        `You wake stiff and ${cold ? "cold" : "soaked"} from ${
          overnight ? "a night in the open" : "lying out unsheltered"
        }.`,
      );
      if (roll("illness") < 0.18) {
        p.health = Math.max(0, (p.health ?? 100) - 12);
        this.event("Something has settled in your chest.");
      }
    }
    if (rough && roll("theft") < 0.14) {
      const worth = Object.entries(p.inventory)
        .filter(([, n]) => (n ?? 0) > 0)
        .sort(
          (a, b) =>
            (this.item(b[0])?.value ?? 0) - (this.item(a[0])?.value ?? 0),
        )[0];
      if (worth && (this.item(worth[0])?.value ?? 0) > 0) {
        p.inventory[worth[0]] = (p.inventory[worth[0]] ?? 0) - 1;
        this.event(
          `Someone went through your things while you slept. Your ${(
            this.item(worth[0])?.name ?? worth[0]
          ).toLowerCase()} is gone.`,
        );
      }
    }
  }

  advance(seconds: number, heldActor?: string) {
    // Derived paths never survive a command boundary: saves and replays need no hidden routing state.
    this.routes.clear();
    this.tickObstacles = new Map();
    this.barriersAt = new Map();
    this.objectsById = new Map();
    this.resourceObjects = [];
    for (const o of this.state.objects) {
      if (!this.objectsById.has(o.id)) this.objectsById.set(o.id, o);
      if (o.resource) this.resourceObjects.push(o);
      if (o.kind !== "gate" && o.kind !== "door" && !o.prop) continue;
      const key = `${o.pos.space}:${o.pos.x},${o.pos.y}`;
      const at = this.tickObstacles.get(key) ?? [];
      at.push(o);
      this.tickObstacles.set(key, at);
      if (o.kind === "gate" || o.kind === "door") {
        const gates = this.barriersAt.get(key) ?? [];
        gates.push(o);
        this.barriersAt.set(key, gates);
      }
    }
    this.householdsById = new Map();
    for (const h of this.state.households ?? [])
      if (!this.householdsById.has(h.id)) this.householdsById.set(h.id, h);
    this.actorsById = new Map();
    this.actorsAt = new Map();
    this.actorCell = new Map();
    for (const a of this.state.actors) {
      if (!this.actorsById.has(a.id)) this.actorsById.set(a.id, a);
      this.syncActor(a);
    }
    const actors = [...this.state.actors].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
    const end = this.state.clock + seconds;
    const player = this.state.player;
    // Building a routine costs a path search per station, and a city has a
    // couple of hundred residents wanting one at once. Capped per advance and
    // spent in the actors' fixed order, so a cold city fills in over a few
    // ticks and every replay spends the budget on the same people.
    let routineBuilds = 0;
    while (this.state.clock < end) {
      const next = Math.min(end, (Math.floor(this.state.clock / 6) + 1) * 6),
        elapsed = next - this.state.clock;
      this.state.clock = next;
      player.hunger = Math.min(100, player.hunger + elapsed / 1800);
      player.fatigue = Math.min(
        100,
        player.fatigue +
          elapsed /
            (player.activity === "Resting" || player.activity === "Sleeping"
              ? 100000
              : 2400),
      );
      if (next % 6 !== 0) continue;
      if (next % 3600 === 0) this.world.rotateRoutines?.(next);
      if (this.world.pack.setting?.environment) {
        const season = seasonAt(this.world.pack.setting.season, next);
        for (const o of this.resourceObjects) refreshResource(o, next, season);
      }
      for (const a of actors) {
        if (a.id === heldActor) continue;
        const focus =
          this.state.manifest.simulation === 2 && player.pos.space !== "outside"
            ? {
                ...(this.world.place(player.pos.space)?.entrance ?? player.pos),
                space: "outside",
              }
            : player.pos;
        if (
          distance(
            a.pos.space === "outside"
              ? a.pos
              : (this.household(a.householdId)?.home ?? a.pos),
            focus,
          ) > (this.state.manifest.simulation === 2 ? 220 : 80)
        )
          continue;
        const gap = next - (a.lastUpdated ?? next - 6);
        a.lastUpdated = next;
        a.hunger = Math.min(100, a.hunger + gap / 1800);
        // Catch up returning distant residents before either endpoint becomes visible.
        if (
          this.state.manifest.simulation === 1 &&
          gap > 600 &&
          a.kind === "human"
        ) {
          const hour = (next / 3600) % 24,
            target = hour < 7 || hour > 18 ? a.home : a.work;
          if (
            !this.visible(a.pos) &&
            !this.visible(target) &&
            distance(a.pos, target) * 18 < gap &&
            !this.blocked(target.x, target.y, target.space)
          )
            this.moveActor(a, copy(target));
        }
        if (a.kind === "human") {
          // Past the routine budget a resident is furniture: home, fed, and
          // never routed. The budget rotates them back in over the days.
          if (this.world.dormant?.(a.id)) {
            this.park(a);
            continue;
          }
          if (this.world.routinePending?.(a.id)) {
            if (routineBuilds >= ROUTINE_BUILDS_PER_ADVANCE) continue;
            routineBuilds++;
          }
          // A resident on their routine costs a binary search, not a path
          // search. Needs pull them off it; everything else is the day's round.
          const routine = this.world.itinerary?.(a.id);
          if (routine && a.hunger <= 45 && !a.task) {
            if (next % 12 === 0) this.followRoutine(a, routine, next);
            continue;
          }
          if (next % 18 !== 0) continue;
          a.offRoutine = true;
          const hour = (next / 3600) % 24;
          const dutyGate =
            a.origin && a.role === "Herder"
              ? this.world.activitySites?.(a.id)?.gateId
              : undefined;
          const penDuty =
            dutyGate &&
            a.hunger <= 55 &&
            ((hour >= 7 && hour < 17) ||
              this.state.objects.some((o) => o.id === dutyGate && o.open));
          const busy =
            !penDuty &&
            householdActivity(
              a,
              this.state,
              this.items,
              (target) => this.stepToward(a, target),
              (target) =>
                this.findRoute(a.pos, target, a.id, 1500).status === "found",
            );
          // householdActivity moves residents indoors itself.
          this.syncActor(a);
          if (busy) continue;
          if (a.hunger > 55) {
            a.activity = "Finding something to eat";
            this.stepToward(a, a.home);
            if (
              distance(a.pos, a.home) < 2 &&
              this.feed(a, this.household(a.householdId))
            )
              a.activity = "Eating at home";
          } else if (this.world.activitySites?.(a.id)) {
            const sites = this.world.activitySites(a.id)!;
            const minute = (next / 60 + sites.offset) % 1440;
            const resting = minute < 420 || minute >= 1080;
            const fetching = minute >= 660 && minute < 700;
            const social = minute >= 1020 && minute < 1080;
            const target = resting
              ? sites.home
              : fetching
                ? sites.water
                : social
                  ? sites.social
                  : sites.work;
            a.activity = resting
              ? "Returning to the household"
              : fetching
                ? "Fetching water"
                : social
                  ? "At the common"
                  : sites.label;
            if (sites.gateId) {
              const gate = this.object(sites.gateId);
              if (gate && distance(a.pos, gate.pos) < 2.5) {
                if (!resting && !social) gate.open = true;
                const animals = this.state.actors.filter(
                  (b) => b.owner === a.id && b.kind !== "human",
                );
                const herds = (this.state.fauna ?? []).filter(
                  (g) => g.owner === a.id,
                );
                if (
                  resting &&
                  animals.every((b) => distance(b.pos, b.home) < 2) &&
                  herds.every((g) =>
                    g.members.every(
                      (m) => Math.hypot(m.x - g.home.x, m.y - g.home.y) < 3.5,
                    ),
                  )
                )
                  gate.open = false;
              }
              // Check the pen before returning home for the night.
              if (resting && gate?.open) {
                this.stepToward(a, { ...sites.work, space: "outside" });
                continue;
              }
            }
            this.stepToward(a, { ...target, space: "outside" });
            if (resting && distance(a.pos, a.home) < 1)
              a.activity = "Resting at home";
          } else if (hour < 7 || hour > 18) {
            a.activity = "Returning to the household";
            this.stepToward(a, a.home);
          } else {
            a.activity =
              distance(a.pos, a.work) > 2
                ? "Walking to work"
                : `${a.role} at work`;
            if (distance(a.pos, a.work) > 2) this.stepToward(a, a.work);
            else if (next % 90 === 0) {
              const dx = Math.floor(this.rng("routine") * 3) - 1,
                dy = Math.floor(this.rng("routine") * 3) - 1;
              this.stepToward(a, {
                ...a.pos,
                x: a.pos.x + dx,
                y: a.pos.y + dy,
              });
            }
          }
          if (next % 1800 === 0)
            for (const o of this.state.objects.filter(
              (o) =>
                o.owner === a.id && o.depleted && distance(o.pos, a.pos) < 3,
            )) {
              const memory = `Found missing contents: ${o.id}`;
              if (!a.memories.includes(memory)) {
                a.memories.push(memory);
                if (this.visible(a.pos))
                  this.event(
                    `${a.name} notices missing household supplies. They do not know who took them.`,
                    "social",
                  );
              }
            }
        } else if (a.goal) {
          this.stepToward(a, a.goal);
          if (distance(a.pos, a.goal) < 1) {
            a.goal = undefined;
            a.activity = "Grazing inside the enclosure";
          }
        } else if (
          grazeActivity(a, this.state, (target) => this.stepToward(a, target))
        ) {
          // Food comes from finite, replenishing pasture patches.
        } else if (this.world.activitySites?.(a.id)) {
          const sites = this.world.activitySites(a.id)!;
          const gate = this.object(sites.gateId);
          const hour = (next / 3600) % 24;
          const grazing = hour >= 8 && hour < 17 && gate?.open;
          const target = grazing ? sites.work : sites.home;
          a.activity = grazing
            ? "Grazing in the pasture"
            : "Returning to the enclosure";
          if (next % 18 === 0)
            this.stepToward(a, { ...target, space: "outside" });
          if (distance(a.pos, { ...target, space: "outside" }) < 1)
            a.activity = grazing ? "Grazing" : "Resting in the enclosure";
        } else if (
          (a.kind === "lizard" || a.kind === "sheep" || a.kind === "goat") &&
          distance(a.pos, player.pos) < 2
        ) {
          this.stepAway(a, player.pos);
          a.activity = "Fleeing";
        } else if (next % 30 === 0 && this.rng("graze") < 0.5) {
          const dx = Math.floor(this.rng("animal-x") * 3) - 1,
            dy = Math.floor(this.rng("animal-y") * 3) - 1;
          this.stepToward(a, { ...a.pos, x: a.pos.x + dx, y: a.pos.y + dy });
        }
      }
      this.stepFauna(next);
    }
    this.tickObstacles = undefined;
    this.barriersAt = undefined;
    this.actorsAt = undefined;
    this.actorCell = undefined;
    this.actorsById = undefined;
    this.objectsById = undefined;
    this.householdsById = undefined;
    this.resourceObjects = undefined;
  }
}
