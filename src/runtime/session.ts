import type { FaunaTier } from "../core/combat";
import { gameAudio } from "../audio/director";
import type { EventId } from "../audio/sfx";
import { timed } from "../render/perf-switches";
import { communityLabels } from "../content/ecology/communities";
import { populateCharacter } from "../content/geography/character";
import { generateCharacter } from "../content/characters/generate";
import { resolveCharacterContext } from "../content/characters/resolve";
import { releaseTerrainWorker } from "./terrain-worker-owner";
import { startChronicle, type Chronicle } from "../chronicle/chronicle";
import type { PreparedSettlement } from "../world/v3/prepared";
import {
  clothFor,
  rolesFrom,
  wardrobeFor,
  type Sex,
} from "../content/characters/wardrobes";
import { composeWearing, wornFromWearing } from "../core/wearing";
import {
  actorAppearance,
  generateAppearance,
  type AppearancePalette,
} from "../core/character";
import type { Actor, Intent, ItemId } from "../core/types";
import type { CharacterPose } from "../render/characters/poses";
import type {
  ToolEffect,
  SwingEffect,
  ThrowEffect,
  ShoveEffect,
} from "../render/tool-effects";
import { allowedHeights, type CharacterAppearance } from "../core/character";
import { characterAppearanceSchema } from "./schema";
import { heldObject, nearbyProp } from "../core/props";
import { withProps } from "../content/props/place";
import { propDefs } from "../content/props/catalog";
import { Engine } from "../core/engine";
import {
  axeWork,
  pickWork,
  plantName,
  TOOL_ACTIONS,
  type ToolAction,
} from "../core/tile-edits";
/** A pick swings overhead like an axe. */
export type Verb = {
  kind:
    | "talk"
    | "pickup"
    | "strike"
    | "throw"
    | "drop"
    | "give"
    | "set-down"
    | "look"
    | "drink"
    | "climb"
    /** Select a building, as clicking it does: outline, and the sidebar. */
    | "inspect"
    /** Work the door of the building in front of you. */
    | "door";
  /** What the HUD prints beside the key. */
  label: string;
  /** Talk: whom to open the dialogue panel on. Inspect: what to select. */
  actor?: string;
  command?: Extract<PlayerCommand, { type: "interact" }>;
};
const TOOL_POSES: Record<ToolAction, CharacterPose> = {
  chop: "chop",
  dig: "dig",
  reap: "reap",
  mine: "chop",
};
import { findPath } from "../core/pathfinding";
import {
  distance,
  type CommandRequest,
  type PlayerCommand,
  type Point,
  type Snapshot,
  type Observation,
} from "../core/types";
import { items, packs } from "../content/packs";
import { rollStats } from "../core/stats";
import { narratorTurn, type Turn } from "../narrator/turn";
import { findNearest, parseFind, type FindTarget } from "./find";
import { createWorld } from "../world/generate";
import { commandSchema, snapshotSchema } from "./schema";
import { ChunkCache } from "./chunks";
import { z } from "zod";
import { settingSchema, type WorldSetting } from "../content/geography/types";
import { packForSetting } from "../content/geography/pack";
import { createSettlementWorld } from "../world/v3/generate";
import { createAtlasWorld } from "../world/v2/generate";
import { integratedSetting } from "../content/geography/defaults";
import { ecologyProfiles } from "../content/ecology/profiles";
import { colorwayLabels } from "../content/ecology/variants";
import { biomeNames, ecoregionNear } from "../content/geography/ecoregions";
import { fromAtlas, toAtlas } from "../world/geography/coordinates";
export function createSession(
  packId = "roman",
  seed = packs[packId]?.defaultSeed ?? "earth-2",
  snapshot?: Snapshot,
  setting?: WorldSetting,
  content: 1 | 2 = 2,
  generator: 1 | 2 | 3 = 3,
  prepared?: PreparedSettlement,
) {
  const resolved = setting ?? snapshot?.manifest.setting;
  const pack = resolved
    ? packForSetting(settingSchema.parse(resolved))
    : packs[packId];
  if (!pack) throw Error("Unsupported content pack.");
  const generation = snapshot?.manifest.generator ?? generator;
  let world = resolved
    ? generation === 3
      ? createSettlementWorld(pack, seed, prepared)
      : createAtlasWorld(pack, seed)
    : createWorld(pack, seed);
  const version = snapshot?.manifest.content ?? content;
  if (version === 2) world = withProps(world, seed);
  if (snapshot)
    world.restoreDistricts?.(
      [...snapshot.actors, ...snapshot.objects].map((e) => e.id),
    );
  const engine = new Engine(world, items, snapshot);
  if (!snapshot) {
    engine.state.manifest.content = version;
    engine.initialize(seed);
    if (resolved?.characterRevision) {
      for (const actor of engine.state.actors) {
        if (actor.kind !== "human" || actor.appearance) continue;
        const local =
          world.geography?.packAt(actor.home.x, actor.home.y).setting ??
          resolved;
        Object.assign(
          actor,
          generateCharacter(local, seed, actor.id, actor.age ?? 34, actor.role),
        );
      }
      Object.assign(
        engine.state.player,
        generateCharacter(
          resolved,
          resolved.character?.appearanceSeed ?? seed,
          "player",
          engine.state.player.age ?? 34,
          resolved.role,
          resolved.characterName,
        ),
      );
    }
    if (resolved?.character) {
      engine.state.player.hunger = resolved.character.hunger;
      engine.state.player.fatigue = resolved.character.fatigue;
      if (resolved.character.appearanceSeed && !resolved.characterRevision) {
        const appearance = generateAppearance(
          resolved.character.appearanceSeed,
          0,
          engine.state.player.age ?? 34,
        );
        appearance.wearing = wardrobeFor(
          {
            id: resolved.character.appearanceSeed,
            age: engine.state.player.age,
            sex: wearerSex(
              engine.state.player.origin?.sex,
              appearance.physique?.sex,
            ),
            standing: engine.state.player.origin?.standing,
            livelihood: engine.state.player.origin?.livelihood,
            roles: rolesFrom(
              engine.state.player.role,
              engine.state.player.origin?.roleLabel,
            ),
          },
          pack,
          appearance.wearing,
        );
        engine.state.player.appearance = appearance;
        engine.state.player.worn = wornFromWearing(
          appearance.wearing,
          clothFor(
            {
              id: resolved.character.appearanceSeed,
              age: engine.state.player.age,
              sex: wearerSex(
                engine.state.player.origin?.sex,
                appearance.physique?.sex,
              ),
              roles: rolesFrom(engine.state.player.role),
            },
            pack,
            undefined,
            appearance.wearing.color,
          ),
        );
      }
    }
    engine.state.player.stats = rollStats(seed, engine.state.player);
    engine.state.player.health = 100;
  }
  return engine;
}
/** Origin records "unspecified" where the name kit decided sex; the drawn
 * body still has one, and dressing without it puts men in dresses. */
function wearerSex(origin?: Sex, body?: Sex): Sex | undefined {
  return origin && origin !== "unspecified" ? origin : body;
}
export function createSettingSession(setting: WorldSetting, seed = "earth-2") {
  return createSession(
    "atlas",
    seed,
    undefined,
    populateCharacter(integratedSetting(setting), seed),
  );
}
export function restoreSession(value: unknown) {
  const save = snapshotSchema.parse(value);
  const engine = createSession(save.manifest.pack, save.manifest.seed, save);
  const ids = new Set<string>();
  for (const e of [save.player, ...save.actors, ...save.objects]) {
    if (ids.has(e.id)) throw Error("Duplicate entity identity in save.");
    ids.add(e.id);
    if (e.pos.space !== "outside" && !engine.world.place(e.pos.space))
      throw Error("Unknown interior in save.");
  }
  if (save.player.id !== "player") throw Error("Invalid player identity.");
  for (const o of save.objects) {
    if (o.prop && !propDefs[o.prop])
      throw Error("Unknown prop definition in save.");
    if (o.carriedBy && (save.player.held !== o.id || o.broken))
      throw Error("Invalid carried prop in save.");
  }
  if (
    save.player.held &&
    !save.objects.some(
      (o) =>
        o.id === save.player.held &&
        o.carriedBy === "player" &&
        propDefs[o.prop ?? ""]?.portable,
    )
  )
    throw Error("Missing carried object in save.");
  return engine;
}
/** Game seconds the idle clock hands to the simulation at a time. Every block
 * is one logged command and one retained receipt, neither of which is ever
 * trimmed, so this trades log growth against how coarsely an actor the engine
 * rather than a routine moves steps across the screen. */
const IDLE_BLOCK = 60;
export const JUMP_MS = 260;
export const LONG_JUMP_MS = 300;
export const JUMP_CHARGE_MS = 240;
/** Airtime scales with the tiles cleared: 260, 300, 340, 380. */
export const jumpMs = (distance: number) => 220 + 40 * distance;
export const ZOOM_STEPS = [
  0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5, 6,
];
const ZOOM_MIN = ZOOM_STEPS[0];
const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1];
export class Runtime {
  engine: Engine;
  /** The written record of this playthrough. Human play produces the same
   * document an agent does, minus the stated reasoning. */
  chronicle: Chronicle;
  journey?: import("./map-travel").MapTravel;
  selected?: string;
  notice = "";
  running = false;
  zoom = 2;
  route: Point[] = [];
  private follow?: string;
  private steps = 0;
  private serial = 0;
  private chunks: ChunkCache;
  replay?: {
    commands: CommandRequest[];
    index: number;
    playing: boolean;
    manifest: Snapshot["manifest"];
    expectedHash?: string;
  };
  private appearanceDefaults = new Map<
    string,
    { signature: string; value: CharacterAppearance }
  >();
  private cachedPalette?: { key: string; value: AppearancePalette | undefined };
  /** This world's complexion and hair range, for anyone spawned without one. */
  palette(): AppearancePalette | undefined {
    const setting = this.engine.world.pack.setting;
    if (!setting) return undefined;
    const key = `${setting.placeId}:${setting.year}:${setting.culture}`;
    if (this.cachedPalette?.key !== key)
      this.cachedPalette = {
        key,
        value: resolveCharacterContext(setting).appearance,
      };
    return this.cachedPalette.value;
  }
  appearanceFor(
    actor: Pick<Actor, "id" | "sprite" | "appearance" | "age" | "worn"> &
      Partial<Pick<Actor, "role" | "origin">>,
  ): CharacterAppearance {
    const base = actor.appearance
      ? actorAppearance(actor)
      : this.defaultAppearance(actor);
    if (!actor.worn) return base;
    return {
      ...base,
      wearing: composeWearing(base.wearing, actor.worn, (id) =>
        this.engine.item(id),
      ),
    };
  }
  private defaultAppearance(
    actor: Pick<Actor, "id" | "sprite" | "appearance" | "age"> &
      Partial<Pick<Actor, "role" | "origin">>,
  ): CharacterAppearance {
    const pack = this.engine.world.pack;
    // Origin is part of the signature now: a wardrobe keyed to sex, standing
    // and livelihood must redraw when those resolve.
    const signature = `${actor.sprite}:${actor.age}:${pack.id}:${pack.year}:${actor.origin?.sex ?? ""}:${actor.origin?.standing ?? ""}:${actor.origin?.livelihood ?? ""}:${actor.role ?? ""}`;
    const cached = this.appearanceDefaults.get(actor.id);
    if (cached?.signature === signature) return cached.value;
    const base = actorAppearance(actor, this.palette());
    const value = {
      ...base,
      wearing: wardrobeFor(
        {
          id: actor.id,
          age: actor.age,
          sex: wearerSex(actor.origin?.sex, base.physique?.sex),
          standing: actor.origin?.standing,
          livelihood: actor.origin?.livelihood,
          roles: rolesFrom(actor.role, actor.origin?.roleLabel),
        },
        pack,
        base.wearing,
      ),
    };
    this.appearanceDefaults.set(actor.id, { signature, value });
    return value;
  }
  characterAction?: {
    serial: number;
    pose: CharacterPose;
    at: number;
    prop?: string;
    /** Sprite arc for a jump: the shadow stays on the ground beneath it. */
    arc?: { height: number; duration: number };
    /** What follows the arc. A fall of two tiers, or a long running jump,
     * staggers on; three tiers rolls out of it; a near miss hangs. */
    after?: "land" | "stumble" | "roll" | "hang";
  };
  private characterSerial = 0;
  /** What the last tool blow did, for the scene to throw chips and drop a
   * tree. Read once by serial, like `characterAction`. */
  toolEffect?: ToolEffect;
  /** The arc of the last swing and everything it found, for the scene to
   * throw chips, rock scenery and sound off. */
  swingEffect?: SwingEffect;
  /** The last rock lifted: the strain, and whatever was under it. */
  heaveEffect?: {
    serial: number;
    at: { x: number; y: number };
    loot: { item: string; n: number }[];
    boulder: boolean;
  };
  /** The last thrown prop's flight, read once by serial. */
  throwEffect?: ThrowEffect;
  /** The last shove, or the last one that came to nothing. */
  shoveEffect?: ShoveEffect;
  /** An animal the player has just walked into. */
  jostleEffect?: {
    serial: number;
    group: string;
    n: number;
    yielded: boolean;
    small: boolean;
  };
  /** The plant a chop is about to land on, read before the engine takes it. */
  private toolTargetPlant(command: PlayerCommand) {
    if (command.type !== "interact" || command.action !== "chop") return;
    const at = /^tile:(-?\d+),(-?\d+)$/.exec(command.target);
    return at
      ? this.engine.world.decoration(Number(at[1]), Number(at[2]))?.sprite
      : undefined;
  }
  private recordToolEffect(command: PlayerCommand, previousPlant?: string) {
    if (command.type !== "interact") return;
    const action = command.action;
    if (
      action !== "chop" &&
      action !== "dig" &&
      action !== "reap" &&
      action !== "mine"
    )
      return;
    const parsed = /^tile:(-?\d+),(-?\d+)$/.exec(command.target);
    if (!parsed) return;
    const at = { x: Number(parsed[1]), y: Number(parsed[2]) };
    const stage = this.engine.state.tiles?.[`${at.x},${at.y}`]?.stage;
    const kind: ToolEffect["kind"] =
      action === "dig"
        ? "dig"
        : action === "reap"
          ? "reap"
          : action === "mine"
            ? stage === "rubble" || stage === "clear"
              ? "shatter"
              : "mine"
            : // An axe can open a rock too, and that wants the shatter, not a
              // chop's chips.
              stage === "rubble"
              ? "shatter"
              : stage === "logs"
                ? "fell"
                : stage === "stump"
                  ? "buck"
                  : stage === "stems" || stage === "clear"
                    ? "cut"
                    : "hit";
    const p = this.engine.state.player.pos;
    this.toolEffect = {
      serial: ++this.characterSerial,
      kind,
      at,
      from: { x: p.x, y: p.y },
      facing: this.engine.state.player.direction,
      sprite: previousPlant,
    };
  }
  customizeCharacter(id: string, appearance: CharacterAppearance) {
    const parsed = characterAppearanceSchema.parse(appearance);
    const actor =
      id === "player"
        ? this.engine.state.player
        : this.engine.state.actors.find((a) => a.id === id);
    if (!actor || actor.kind !== "human" || this.replay) return;
    if (!allowedHeights(actor.age).includes(parsed.height))
      throw Error("That height is not available for this character’s age.");
    actor.appearance = parsed;
    actor.worn = wornFromWearing(parsed.wearing);
    this.onChange?.();
    this.emit();
  }
  private animateCommand(
    command: PlayerCommand,
    accepted: boolean,
    previousProp?: string,
    previousPlant?: string,
  ) {
    // A refused step still has something to show if it was a failed shove.
    if (!accepted) {
      if (command.type === "move" && !command.jump && !command.traverse) {
        const push = this.engine.shovePlan(command.dx, command.dy);
        const at = push && "refused" in push ? push : undefined;
        if (at) {
          const p = this.engine.state.player.pos;
          const cell = { x: p.x + command.dx, y: p.y + command.dy };
          this.shoveEffect = {
            serial: ++this.characterSerial,
            from: cell,
            to: cell,
            ground: this.engine.groundClass(cell.x, cell.y, p.space),
            ids: [this.engine.shoveTargetId(command.dx, command.dy) ?? ""],
            refused: at.refused,
          };
        }
      }
      return;
    }
    this.recordToolEffect(command, previousPlant);
    if (command.type === "move") {
      const shove = this.engine.lastShove;
      if (shove)
        this.shoveEffect = { serial: ++this.characterSerial, ...shove };
      const jostle = this.engine.lastJostle;
      if (jostle)
        this.jostleEffect = { serial: ++this.characterSerial, ...jostle };
      const leap = this.engine.lastLeap;
      if (leap)
        this.characterAction = {
          serial: ++this.characterSerial,
          // A ledge scramble already reports itself as a climb; it was
          // animating as a jump because there was no climb pose to play.
          pose: leap.kind === "climb" && !command.jump ? "climb" : "jump",
          at: performance.now(),
          arc: {
            height: command.jump
              ? 12 + leap.distance * 6 + this.leapLift
              : leap.kind === "leap"
                ? 15
                : leap.kind === "drop"
                  ? 8
                  : leap.kind === "climb"
                    ? 6
                    : 11,
            duration: command.jump
              ? jumpMs(leap.distance)
              : command.run
                ? 210
                : leap.distance === 2
                  ? 400
                  : 340,
          },
          after: leap.caught
            ? "hang"
            : (leap.drop ?? 0) >= 3
              ? "roll"
              : (leap.drop ?? 0) === 2 || (command.run && leap.distance >= 4)
                ? "stumble"
                : "land",
        };
      return;
    }
    if (command.type === "interact") {
      const lifted = heldObject(this.engine.state);
      const heavy =
        command.action === "heave" ||
        (command.action === "pickup" &&
          (lifted?.prop === "boulder" || lifted?.prop === "fieldStone"));
      if (heavy) {
        const heave =
          command.action === "heave" ? this.engine.lastHeave : undefined;
        this.heaveEffect = {
          serial: ++this.characterSerial,
          at: heave?.at ?? { x: lifted!.pos.x, y: lifted!.pos.y },
          loot: heave?.loot ?? [],
          boulder: lifted?.prop === "boulder",
        };
      }
    }
    if (command.type === "throw") {
      const flight = this.engine.lastThrow;
      if (flight)
        this.throwEffect = { serial: ++this.characterSerial, ...flight };
    }
    if (command.type === "swing") {
      const swing = this.engine.lastSwing;
      const held = heldObject(this.engine.state);
      const item = this.engine.state.player.heldItem;
      const tool = propDefs[held?.prop ?? ""]?.tool;
      this.characterAction = {
        serial: ++this.characterSerial,
        // A spear goes straight in.
        pose: tool
          ? TOOL_POSES[TOOL_ACTIONS[tool]]
          : swing?.thrust
            ? "thrust"
            : "swing",
        at: performance.now(),
        prop:
          held?.sprite ?? (item ? this.engine.item(item)?.sprite : undefined),
      };
      if (swing) {
        const p = this.engine.state.player.pos;
        this.swingEffect = {
          serial: ++this.characterSerial,
          from: { x: p.x, y: p.y },
          facing: swing.direction,
          tool: swing.tool,
          sprite: held?.sprite,
          hits: swing.hits,
          creatures: swing.creatures,
          power: swing.power,
          thrust: swing.thrust,
        };
      }
      return;
    }
    const action = command.type === "interact" ? command.action : command.type;
    const pose: CharacterPose | undefined = (
      {
        pickup: "pickup",
        drop: "drop",
        climb: "climb",
        descend: "climb",
        throw: "swing",
        strike: "swing",
        chop: "chop",
        dig: "dig",
        reap: "reap",
        mine: "chop",
        talk: "talk",
        trade: "give",
        harvest: "work",
        drink: "give",
        rest: "sit",
        use: "give",
      } as Record<string, CharacterPose>
    )[action];
    const event = (
      {
        pickup: "pickup",
        drop: "drop",
        harvest: "harvest",
        drink: "drink",
        trade: "trade",
        use: "use",
        rest: "rest",
        talk: "talk",
      } as Record<string, EventId>
    )[action];
    if (event) void gameAudio()?.event(event);
    if (pose)
      this.characterAction = {
        serial: ++this.characterSerial,
        pose,
        at: performance.now(),
        prop: previousProp,
      };
  }
  private subscribers = new Set<() => void>();
  private cached: ReturnType<Runtime["view"]>;
  onChange?: () => void;
  private observation?: Observation;
  constructor(engine: Engine, options: { cacheTerrain?: boolean } = {}) {
    this.chunks = new ChunkCache(options.cacheTerrain !== false);
    this.engine = engine;
    this.chronicle = startChronicle(engine, "human");
    this.syncAmbient();
    this.cached = this.view();
    this.startJourney(engine);
  }
  /** Map travel reaches h3-js, a multi-megabyte emscripten build. Loading it
   * on demand keeps it off the startup path; nothing can issue a command
   * before the import settles. */
  private startJourney(engine: Engine) {
    const map = engine.state.manifest.setting?.playableMap;
    if (!map) return;
    const id = map.id,
      year = engine.state.manifest.setting!.year;
    void import("./map-travel").then(({ MapTravel }) => {
      // A replacement world may have arrived while the module loaded.
      if (this.engine === engine) new MapTravel(this, id, year);
    });
  }
  private view(refresh = true) {
    const pos = this.engine.state.player.pos;
    const outside =
      pos.space === "outside"
        ? pos
        : this.engine.world.place(pos.space)?.entrance;
    const observation =
      refresh || !this.observation
        ? (this.observation = this.engine.observe())
        : this.observation;
    return {
      observation: {
        ...observation,
        player: {
          ...observation.player,
          appearance: this.appearanceFor(observation.player),
        },
        actors: observation.actors.map((actor) =>
          actor.kind === "human"
            ? { ...actor, appearance: this.appearanceFor(actor) }
            : actor,
        ),
      },
      selection: this.selected ? this.engine.inspect(this.selected) : undefined,
      // Drives the C prompt. Recomputed per view so it follows the player.
      climbable: this.engine.climbable(),
      // A wall walk is not a perch, but it offers the same way back down.
      perch:
        observation.player.perch ??
        (this.engine.onWall()
          ? { on: "wall", label: "the wall", rise: 0 }
          : undefined),
      notice: this.notice,
      running: this.running,
      zoom: this.zoom,
      pack:
        (outside &&
          this.engine.world.geography?.packAt(outside.x, outside.y)) ||
        this.engine.world.pack,
      replay: this.replay
        ? {
            index: this.replay.index,
            total: this.replay.commands.length,
            playing: this.replay.playing,
          }
        : undefined,
    };
  }
  dispose() {
    this.journey?.dispose();
    releaseTerrainWorker(this.engine.world);
    this.stop(false);
    this.chunks.dispose();
    this.subscribers.clear();
  }
  getSnapshot = () => this.cached;
  subscribe = (listener: () => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };
  emit(refresh = true) {
    // Relief rendering streams its own cell data; the legacy tile worker
    // would otherwise regenerate the same settlement without any consumer.
    if (!this.engine.world.topography)
      this.chunks.prefetch(
        this.engine.world.pack.id,
        this.engine.state.manifest.seed,
        this.engine.state.player.pos.x,
        this.engine.state.player.pos.y,
        this.engine.state.manifest.setting,
        this.engine.state.manifest.generator,
      );
    this.journey?.observe();
    this.cached = timed("runtime view", () => this.view(refresh));
    for (const listener of this.subscribers) listener();
  }
  select(id?: string) {
    if (id) this.flushAmbient();
    this.selected = id;
    this.emit(false);
  }
  setZoom(z: number) {
    this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    this.emit(false);
  }
  /** Move `steps` notches along ZOOM_STEPS from wherever we currently sit. */
  stepZoom(steps: number) {
    let i = ZOOM_STEPS.findIndex((v) => v >= this.zoom - 1e-4);
    if (i < 0) i = ZOOM_STEPS.length - 1;
    this.setZoom(
      ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, i + steps))],
    );
  }
  replace(engine: Engine, preserveJourney = false) {
    if (!preserveJourney) this.journey?.dispose();
    releaseTerrainWorker(this.engine.world);
    this.replay = undefined;
    this.stop();
    this.engine = engine;
    this.chronicle = startChronicle(engine, "human");
    if (!preserveJourney) this.startJourney(engine);
    this.selected = undefined;
    this.syncAmbient();
    this.notice = "A new day, a different world.";
    this.emit();
    this.onChange?.();
  }
  /** Game seconds per real second while the player stands still. Matches the
   * rate that walking already advances the clock, so the settlement keeps one
   * pace whether or not the player is moving. */
  ambientRate = 20;
  private ambientBase = 0;
  private ambientAt = 0;
  /** What the renderer draws: the world clock plus the time that has passed
   * since the last command. Monotonic, and never behind the simulation. */
  displayClock() {
    if (this.journey?.busy) return this.engine.state.clock;
    // A short grace period means the gaps between walking steps contribute
    // nothing; only actually standing still lets the clock run on.
    const idle = (performance.now() - this.ambientAt) / 1000 - 0.25;
    return Math.max(
      this.engine.state.clock,
      this.ambientBase + (idle > 0 ? idle * this.ambientRate : 0),
    );
  }
  resumeAmbient() {
    this.syncAmbient();
  }
  private syncAmbient() {
    this.ambientBase = this.engine.state.clock;
    this.ambientAt = performance.now();
  }
  /** Hands the drawn time back to the simulation, so positions the player can
   * click on agree with the ones on screen. */
  flushAmbient() {
    if (this.journey?.busy) return;
    const seconds = Math.floor(this.displayClock() - this.engine.state.clock);
    if (seconds >= 1)
      this.dispatch({ type: "pass", seconds: Math.min(3600, seconds) });
    this.syncAmbient();
  }
  item(id: ItemId) {
    return this.engine.item(id);
  }
  /** One narrator turn from free text. "Find the goats" and its kin are
   * answered here instead, from the loaded world: no model call, the same
   * answer every time, and the player walks off at once. */
  say(input: string): Promise<Turn> {
    const terms = parseFind(input);
    if (terms) {
      this.engine.syncFauna();
      const found = findNearest(this.engine.state, terms);
      if (found) return Promise.resolve(this.walkToFound(input, found));
      // Nothing of that name is loaded; let the narrator answer as before.
    }
    return narratorTurn(this, input);
  }
  /** Walks to a found target and logs it as a narration turn, so the search
   * reads back in the log beside everything else the player has said. */
  private walkToFound(input: string, found: FindTarget): Turn {
    const p = this.engine.state.player.pos;
    const steps = Math.round(
      Math.hypot(found.point.x - p.x, found.point.y - p.y),
    );
    this.walkTo(found.point);
    this.engine.cue("player", this.running ? "point" : "question", found.point);
    const text = this.running
      ? `You set off toward the ${found.label.toLowerCase()}, ${steps} paces away.`
      : `You can see the ${found.label.toLowerCase()} ${steps} paces off, but there is no way through.`;
    const s = this.engine.state;
    s.narration = [
      ...(s.narration ?? []),
      { clock: s.clock, input, text },
    ].slice(-200);
    this.touch();
    return { text, outcomes: [] };
  }
  /** Marks state changed outside a command, such as the narration log. */
  touch() {
    this.onChange?.();
    this.emit();
  }
  /** Runs narrator intents and reports what the engine made of each. */
  narrate(intents: Intent[]) {
    const result = this.command({ type: "narrate", intents });
    return {
      result,
      outcomes: result?.status === "completed" ? this.engine.lastOutcomes : [],
    };
  }
  command(command: PlayerCommand) {
    if (this.replay) {
      this.notice = "Continue from this point before taking a new action.";
      this.emit();
      return;
    }
    const parsed = commandSchema.safeParse(command);
    if (!parsed.success) {
      this.notice = "That command is not supported.";
      this.emit();
      return;
    }
    if (parsed.data.type !== "pass") this.flushAmbient();
    const result = this.dispatch(parsed.data);
    this.syncAmbient();
    return result;
  }
  private dispatch(command: PlayerCommand) {
    if (this.journey?.intercept(command)) {
      this.emit(false);
      return {
        actionId: "travel-" + ++this.serial,
        revision: this.engine.state.revision,
        status: "interrupted" as const,
        elapsedSeconds: 0,
        events: [],
        reason: this.notice,
      };
    }
    const previousProp = heldObject(this.engine.state)?.sprite;
    const previousPlant = this.toolTargetPlant(command);
    const result = this.engine.act({
      actionId: `ui-${this.engine.state.revision}-${++this.serial}`,
      expectedRevision: this.engine.state.revision,
      command,
    });
    this.animateCommand(
      command,
      result.status !== "rejected",
      previousProp,
      previousPlant,
    );
    this.notice = result.reason ?? "";
    if (result.status !== "rejected") this.onChange?.();
    this.emit();
    return result;
  }
  /** Save this playthrough's record. The markdown is for reading, the JSONL
   * for analysis. */
  downloadChronicle() {
    const { id } = this.chronicle.header;
    for (const [name, body] of [
      [`${id}.md`, this.chronicle.markdown()],
      [`${id}.jsonl`, this.chronicle.jsonl()],
    ]) {
      const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
      const link = Object.assign(document.createElement("a"), {
        href: url,
        download: name,
      });
      link.click();
      URL.revokeObjectURL(url);
    }
  }
  act(request: CommandRequest) {
    if (this.replay)
      throw Error("Continue from this replay point before acting.");
    const command = commandSchema.parse(request.command);
    if (
      request.expectedRevision === this.engine.state.revision &&
      this.journey?.intercept(command)
    ) {
      this.emit(false);
      return {
        actionId: request.actionId,
        revision: this.engine.state.revision,
        status: "interrupted" as const,
        elapsedSeconds: 0,
        events: [],
        reason: this.notice,
        observation: structuredClone(this.observation!),
      };
    }
    const previousProp = heldObject(this.engine.state)?.sprite;
    const previousPlant = this.toolTargetPlant(command);
    const result = this.engine.act({ ...request, command });
    this.animateCommand(
      command,
      result.status !== "rejected",
      previousProp,
      previousPlant,
    );
    if (result.status !== "rejected") this.onChange?.();
    this.emit();
    return { ...result, observation: structuredClone(this.observation!) };
  }
  /**
   * The person close enough to speak with, if any. The reach matches the
   * distance `validateIntents` enforces, so a prompt never offers a
   * conversation the engine will then refuse.
   */
  /** One key for both directions: climb what is in reach, or come back down. */
  climb() {
    const p = this.engine.state.player;
    if (p.perch || this.engine.onWall())
      return this.command({
        type: "interact",
        target: p.perch?.on ?? "wall",
        action: "descend",
      });
    const target = this.engine.climbable();
    if (target)
      this.command({ type: "interact", target: target.id, action: "climb" });
  }
  nearestSpeaker() {
    const s = this.engine.state,
      p = s.player;
    return s.actors
      .filter(
        (a) =>
          a.kind === "human" &&
          a.pos.space === p.pos.space &&
          distance(a.pos, p.pos) <= 2.5 &&
          this.engine.visible(a.pos),
      )
      .sort((a, b) => distance(a.pos, p.pos) - distance(b.pos, p.pos))[0];
  }
  /** Two prop scans over everything the player can see. The UI asks on every
   * React render, which is every step; the answer only changes when the view
   * does. */
  private propCache?: {
    view: unknown;
    revision: number;
    value: ReturnType<Runtime["buildPropControls"]>;
  };
  propControls() {
    const revision = this.engine.state.revision;
    if (
      this.propCache?.view === this.cached &&
      this.propCache.revision === revision
    )
      return this.propCache.value;
    const value = this.buildPropControls();
    this.propCache = { view: this.cached, revision, value };
    return value;
  }
  private buildPropControls() {
    const s = this.engine.state,
      held = heldObject(s);
    const target = nearbyProp(
      s,
      (p) => this.engine.visible(p),
      (o) =>
        held
          ? !!propDefs[o.prop!]?.breakable && !o.broken
          : o.kind === "item" || (!!propDefs[o.prop!]?.portable && !o.broken),
    );
    const nearby = nearbyProp(
      s,
      (p) => this.engine.visible(p),
      (o) =>
        !!propDefs[o.prop!]?.drink ||
        !!propDefs[o.prop!]?.container ||
        (!!propDefs[o.prop!]?.fire && (s.player.inventory.meat ?? 0) > 0),
    );
    const context =
      nearby && propDefs[nearby.prop!]?.drink
        ? nearby
        : held && propDefs[held.prop!]?.container
          ? held
          : nearby;
    const tool = propDefs[held?.prop ?? ""]?.tool;
    const toolAction = tool ? TOOL_ACTIONS[tool] : undefined;
    let toolCommand:
      | { type: "interact"; target: string; action: ToolAction }
      | undefined;
    let toolProblem: string | undefined;
    let toolLabel: string | undefined;
    if (toolAction) {
      const p = s.player.pos;
      const facing = this.engine.facingCell();
      // A spade or scythe also works the cell underfoot; an axe needs a target
      // in front of it.
      const cells =
        toolAction === "chop" ? [facing] : [facing, { x: p.x, y: p.y }];
      for (const at of cells) {
        const target = Engine.tileTarget(at.x, at.y);
        const problem = this.engine.toolProblem(toolAction, target);
        toolProblem ??= problem;
        if (!problem) {
          toolProblem = undefined;
          toolCommand = { type: "interact", target, action: toolAction };
          toolLabel = this.toolLabel(toolAction, at);
          break;
        }
      }
    }
    const primary = target
      ? {
          type: "interact" as const,
          target: target.id,
          action: held ? ("strike" as const) : ("pickup" as const),
        }
      : undefined;
    const secondary = context
      ? {
          type: "interact" as const,
          target: context.id,
          action: propDefs[context.prop!]?.drink
            ? ("drink" as const)
            : propDefs[context.prop!]?.fire
              ? ("cook" as const)
              : ("look" as const),
        }
      : undefined;
    return {
      held,
      primary: toolCommand ?? primary,
      secondary,
      // A tool with nothing in front of it still leaves the ordinary prop
      // actions; only when there is nothing else to do does the label explain
      // why the tool will not bite.
      primaryLabel: toolCommand
        ? toolLabel!
        : primary
          ? `${held ? "Strike" : "Pick up"} ${target!.name.toLowerCase()}`
          : toolAction
            ? (toolProblem ?? "")
            : held
              ? `Swing ${held.name.toLowerCase()}`
              : "Move near a portable object",
      secondaryLabel: context
        ? propDefs[context.prop!]?.drink
          ? "Drink water"
          : propDefs[context.prop!]?.fire
            ? "Cook meat"
            : `Look inside ${context.name.toLowerCase()}`
        : undefined,
    };
  }
  private toolLabel(action: ToolAction, at: { x: number; y: number }) {
    if (action === "dig") return "Dig a furrow";
    if (action === "mine") {
      const rock = this.engine.world.decoration(at.x, at.y);
      const work = pickWork(rock?.sprite);
      return work === "clear"
        ? "Clear the broken rock"
        : work === "grub"
          ? "Grub out the stump"
          : `Break the ${plantName(rock?.sprite)}`;
    }
    const crop = this.engine.cropAt(at.x, at.y);
    if (action === "reap")
      return crop ? `Cut the ${crop.name.toLowerCase()}` : "Cut the growth";
    const plant = this.engine.world.decoration(at.x, at.y);
    const work = axeWork(plant?.sprite);
    return work === "buck"
      ? "Buck the fallen trunk"
      : work === "clear"
        ? "Clear the cut stems"
        : work === "split"
          ? `Split the ${plantName(plant?.sprite)}`
          : `Chop the ${plantName(plant?.sprite)}`;
  }
  /** The one speaker the action key will reach: in range, and roughly in
   * front, so walking past someone does not hijack F. */
  facingSpeaker() {
    const p = this.engine.state.player,
      d = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][p.direction];
    const a = this.nearestSpeaker();
    if (!a) return undefined;
    const dx = a.pos.x - p.pos.x,
      dy = a.pos.y - p.pos.y;
    return dx * d[0] + dy * d[1] > 0 ? a : undefined;
  }
  /** The building the player is facing, within a stride of its wall. Same
   * footprint test a click uses, so F picks what a click would. */
  facingPlace() {
    const p = this.engine.state.player;
    if (p.pos.space !== "outside") return undefined;
    const d = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][p.direction];
    for (const step of [1, 2]) {
      const x = p.pos.x + d[0] * step,
        y = p.pos.y + d[1] * step;
      const place = this.engine.world.places.find(
        (b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h,
      );
      if (place) return place;
    }
    return undefined;
  }
  /** Open, knock at, or step through the door of the building in front of the
   * player. Undefined when there is no door within a stride, or when it will
   * not answer them at all. */
  doorVerb(): Verb | undefined {
    const p = this.engine.state.player;
    if (p.pos.space !== "outside") return undefined;
    const door = this.engine.doorNear(p.pos, p.direction);
    const place = door?.placeId
      ? this.engine.world.place(door.placeId)
      : undefined;
    if (!door || !place) return undefined;
    const command = (action: "open" | "knock") =>
      ({ type: "interact", target: door.id, action }) as Verb["command"];
    if (door.open)
      return {
        kind: "door",
        label: `${place.entranceLabel} ${place.name.toLowerCase()}`,
        command: { type: "interact", target: place.id, action: "enter" },
      };
    return this.engine.doorVerdict(place, "player") === "open"
      ? { kind: "door", label: "Open the door", command: command("open") }
      : {
          kind: "door",
          label: `Knock at ${place.name.toLowerCase()}`,
          command: command("knock"),
        };
  }
  /** What F and E do right now. Two slots, resolved in a fixed order so the
   * player can learn it, and labelled so they never have to guess. */
  verbs(): { primary?: Verb; alternate?: Verb } {
    const c = this.propControls();
    const p = this.engine.state.player;
    const held = c.held;
    const def = propDefs[held?.prop ?? ""];
    // An inventory item taken in hand stands in for a carried prop.
    const item = !held && p.heldItem ? this.engine.item(p.heldItem) : undefined;
    const hands = held
      ? { name: held.name, swingable: !!(def?.strike || def?.tool) }
      : item
        ? { name: item.name, swingable: !!item.hand?.strike }
        : undefined;
    const speaker = this.facingSpeaker();
    const other = speaker ? undefined : this.nearestSpeaker();
    const place = this.facingPlace();
    const door = this.doorVerb();
    const descend = !!p.perch || this.engine.onWall();
    const climbTarget = descend ? undefined : this.engine.climbable();
    const climb: Verb | undefined =
      descend || climbTarget
        ? {
            kind: "climb",
            label: descend
              ? `Climb down from ${p.perch?.label ?? "the wall"}`
              : `Climb ${climbTarget!.label.toLowerCase()}`,
          }
        : undefined;
    let primary: Verb | undefined;
    if (speaker)
      primary = {
        kind: "talk",
        label: `Talk to ${speaker.name}`,
        actor: speaker.id,
      };
    else if (
      c.primary &&
      ["chop", "dig", "reap", "mine"].includes(c.primary.action)
    )
      primary = { kind: "strike", label: c.primaryLabel, command: c.primary };
    else if (hands?.swingable)
      // A tool is never thrown. Swinging at nothing is the answer, so the
      // player learns the arc before they learn what it bites.
      primary = {
        kind: "strike",
        label:
          held && c.primary?.action === "strike"
            ? c.primaryLabel
            : `Swing ${hands.name.toLowerCase()}`,
      };
    else if (held)
      primary = { kind: "throw", label: `Throw ${held.name.toLowerCase()}` };
    else if (item)
      primary = { kind: "drop", label: `Put ${item.name.toLowerCase()} away` };
    else if (door) primary = door;
    else if (place)
      primary = {
        kind: "inspect",
        label: `Look at ${place.name}`,
        actor: place.id,
      };
    // Empty hands swing first; lifting and climbing go to E.
    else primary = { kind: "strike", label: "Take a swing" };
    const ahead = this.engine.facingCell();
    const pickup: Verb | undefined =
      !held && !item && c.primary?.action === "pickup"
        ? { kind: "pickup", label: c.primaryLabel, command: c.primary }
        : !held &&
            !item &&
            !this.engine.heaveProblem(Engine.tileTarget(ahead.x, ahead.y))
          ? {
              kind: "pickup",
              label: "Lift the rock",
              command: {
                type: "interact",
                target: Engine.tileTarget(ahead.x, ahead.y),
                action: "heave",
              },
            }
          : undefined;
    let alternate: Verb | undefined;
    // Something in hand and somebody in front of you: handing it over is what
    // the second slot is for, ahead of any scenery.
    // A fire and raw meat: cooking comes before putting the stick down.
    if (c.secondary?.action === "cook")
      alternate = {
        kind: "look",
        label: c.secondaryLabel!,
        command: c.secondary,
      };
    else if (item && speaker)
      alternate = {
        kind: "give",
        label: `Give ${item.name.toLowerCase()} to ${speaker.name}`,
        actor: speaker.id,
      };
    // E lifts or climbs; F is always the swing.
    else if (pickup) alternate = pickup;
    else if (climb) alternate = climb;
    else if (held)
      alternate = {
        kind: "drop",
        label: `Put down ${held.name.toLowerCase()}`,
        command: { type: "interact", target: held.id, action: "drop" },
      };
    else if (item)
      // Away is the pocket; down is the ground, where anyone can take it.
      alternate = {
        kind: "set-down",
        label: `Set ${item.name.toLowerCase()} down`,
      };
    else if (c.secondary)
      alternate = {
        kind: c.secondary.action === "drink" ? "drink" : "look",
        label: c.secondaryLabel!,
        command: c.secondary,
      };
    else if (other)
      alternate = {
        kind: "talk",
        label: `Talk to ${other.name}`,
        actor: other.id,
      };
    return { primary, alternate };
  }
  /** Runs a slot and hands the verb back. Talk is returned unrun: the
   * dialogue panel is React's, not the engine's. */
  runVerb(slot: "primary" | "alternate"): Verb | undefined {
    const verb = this.verbs()[slot];
    if (!verb) {
      this.notice =
        slot === "primary"
          ? "Nothing to reach here."
          : "No second action here.";
      this.emit();
      return undefined;
    }
    this.stop(false);
    if (verb.kind === "talk") return verb;
    if (verb.kind === "inspect") {
      this.select(verb.actor);
      return verb;
    }
    if (verb.kind === "climb") {
      this.climb();
      return verb;
    }
    if (verb.kind === "throw") {
      const at = this.engine.facingCell(),
        p = this.engine.state.player.pos;
      this.throwHeld(at.x - p.x, at.y - p.y, this.running);
      return verb;
    }
    if (verb.command) {
      this.selected = verb.command.target;
      this.command(verb.command);
      return verb;
    }
    if (verb.kind === "drop") {
      this.command({ type: "stow" });
      return verb;
    }
    if (verb.kind === "set-down") {
      this.command({ type: "drop" });
      return verb;
    }
    if (verb.kind === "give") {
      const item = this.engine.state.player.heldItem;
      if (item) this.command({ type: "give", target: verb.actor!, item });
      return verb;
    }
    this.command({ type: "swing" });
    return verb;
  }
  /** A pose for the player that no command asked for: a flinch, say. */
  playPose(pose: CharacterPose) {
    this.characterAction = {
      serial: ++this.characterSerial,
      pose,
      at: performance.now(),
    };
  }
  /** F held after a swing: the wind-up for a wide one. `half` and `full` are
   * the milliseconds at which it becomes a half circle and a whole one. */
  charge?: { at: number; half: number; full: number };
  beginCharge() {
    if (this.replay) return;
    this.chargeSwung = false;
    const quick = this.engine.skillLevel("hunting") >= 5 ? 0.75 : 1;
    this.charge = {
      at: performance.now(),
      half: 550 * quick,
      full: 1100 * quick,
    };
  }
  releaseCharge() {
    const c = this.charge;
    this.charge = undefined;
    if (!c) return;
    const held = performance.now() - c.at;
    const power = held >= c.full ? 2 : held >= c.half ? 1 : 0;
    // A press that found nothing to hit held its swing back for this.
    if (power) this.command({ type: "swing", power });
    else if (!this.chargeSwung) this.command({ type: "swing" });
  }
  /** X is held and a throw is being aimed. Set by the scene. */
  aiming = false;
  /** Set when the press that began the wind-up already swung. */
  chargeSwung = false;
  /** F: swing at once if there is anything to hit. With nothing in reach the
   * swing waits for the release, so a wind-up does not start with a flail
   * that sends the game running before the wide one lands. */
  pressSwing(): Verb | undefined {
    const verb = this.verbs().primary;
    if (verb?.kind !== "strike" || verb.command) return this.runVerb("primary");
    const now = this.engine.swingFinds();
    if (now) this.runVerb("primary");
    this.beginCharge();
    this.chargeSwung = now;
    return verb;
  }
  /** Dev panel hooks. Outside the command log, so a replay will not have them. */
  devSpawnFauna(species: string, count: number, tier?: FaunaTier) {
    this.flushAmbient();
    const added = this.engine.devSpawnFauna(species, count, tier);
    this.emit();
    return added;
  }
  devClearFauna() {
    this.engine.devClearFauna();
    this.emit();
  }
  devHeal() {
    this.engine.state.player.health = 100;
    delete this.engine.state.player.injury;
    this.engine.state.revision++;
    this.emit();
  }
  devArm(prop?: string) {
    // "item:pebble": a pocketful of something to throw, one in the hand.
    if (prop?.startsWith("item:")) {
      const item = prop.slice(5);
      this.engine.devArm();
      const bag = this.engine.state.player.inventory;
      bag[item] = (bag[item] ?? 0) + 10;
      this.command({ type: "hold", item });
      return;
    }
    this.engine.devArm(prop);
    this.emit();
  }
  propAction(key: "KeyE" | "KeyF") {
    return this.runVerb(key === "KeyF" ? "primary" : "alternate");
  }
  /** Turns to a blocked step without taking it, so F and E act that way. */
  face(dx: number, dy: number) {
    const p = this.engine.state.player;
    if (p.perch || (!dx && !dy)) return;
    const direction = dx === 0 ? (dy < 0 ? 0 : 2) : dx > 0 ? 1 : 3;
    if (p.direction === direction) return;
    p.direction = direction;
    this.emit(false);
  }
  move(dx: number, dy: number, traverse = false, run = false) {
    this.stop(false);
    // A pot stops you once, which is long enough to read what it is and to
    // pick it up if that is what you wanted. Walk into it again and you step
    // over it: a yard of vessels should cost a hop, not a detour. A crate is
    // shoved first — only a shove that goes nowhere becomes a hop.
    const small =
      !traverse &&
      !heldObject(this.engine.state) &&
      !!this.engine.validate({ type: "move", dx, dy }) &&
      this.engine.lowPropAhead(dx, dy);
    if (small && this.bump?.dx === dx && this.bump?.dy === dy) {
      this.bump = undefined;
      return this.command({ type: "move", dx, dy, jump: "short", run });
    }
    this.bump = small ? { dx, dy } : undefined;
    const result = this.command(
      traverse
        ? { type: "move", dx, dy, traverse }
        : run
          ? { type: "move", dx, dy, run }
          : { type: "move", dx, dy },
    );
    if (small && this.notice) this.notice += " Step again to go over it.";
    return result;
  }
  /** The last step refused by something small enough to step over. */
  private bump?: { dx: number; dy: number };
  /** Returns the tiles actually cleared, so the renderer can time the arc. */
  jump(
    dx: number,
    dy: number,
    power: "short" | "long",
    running = false,
    /** Extra arc height in pixels: a kick off a wall starts above the ground. */
    lift = 0,
  ) {
    this.stop(false);
    this.engine.lastLeap = undefined;
    this.leapLift = lift;
    this.command({ type: "move", dx, dy, jump: power, run: running });
    this.leapLift = 0;
    return this.engine.leapDistance();
  }
  private leapLift = 0;
  /** A line for the event bar that no command produced. */
  remark(text: string) {
    this.notice = text;
    this.emit();
  }
  throwHeld(dx: number, dy: number, running = false, reach?: number) {
    this.stop(false);
    return this.command({
      type: "throw",
      dx,
      dy,
      run: running,
      ...(reach ? { reach } : {}),
    });
  }
  /** A jump at something tall runs a step up it, and a second press kicks
   * off. Nothing to the engine until the kick, which is an ordinary jump. */
  wallAhead(dx: number, dy: number) {
    const p = this.engine.state.player;
    if (this.replay || p.perch || (dx !== 0) === (dy !== 0)) return undefined;
    const wall = this.engine.tallAt({ x: p.pos.x + dx, y: p.pos.y + dy });
    if (!wall) return undefined;
    // Not with full arms, a bad leg, or nothing left; not the very young or old.
    const able =
      !heldObject(this.engine.state) &&
      !p.injury &&
      p.fatigue < 80 &&
      (p.age ?? 30) >= 8 &&
      (p.age ?? 30) <= 60;
    return { ...wall, able };
  }
  /** Jump on the spot. Expression only, like a strike that hits nothing. */
  hop() {
    if (this.replay || (heldObject(this.engine.state) && !this.engine.armed()))
      return;
    this.stop(false);
    this.characterAction = {
      serial: ++this.characterSerial,
      pose: "jump",
      at: performance.now(),
      arc: { height: 11, duration: 320 },
    };
    this.emit();
  }
  /** Command-click: what the ground here is, in the event bar. */
  inspectCell(x: number, y: number) {
    const w = this.engine.world;
    const s = w.pack.setting;
    const cell = w.topography?.(x, y);
    const h = cell?.habitat;
    const parts: string[] = [];
    if (h) {
      const region = h.site?.region ?? h;
      const label = ecologyProfiles[region.ecology]?.label ?? region.ecology;
      parts.push(
        region.colorway
          ? `${label} · ${colorwayLabels[region.colorway]}`
          : label,
      );
      if (h.site) {
        const c = h.site.conditions;
        parts.push(
          communityLabels[h.site.primary],
          c.inundated
            ? "Inundated ground"
            : c.saturation > 0.45
              ? "Saturated ground"
              : "Drained ground",
          c.canopy > 0.6
            ? "Dense vegetation"
            : c.canopy > 0.3
              ? "Open vegetation"
              : "Sparse vegetation",
        );
      } else
        parts.push(
          `${h.kind}${h.vegetation ? ` (${h.vegetation})` : ""}, wet ${h.wet.toFixed(2)}, cover ${h.cover.toFixed(2)}, exposed ${h.exposed.toFixed(2)}`,
        );
    }
    if (cell) {
      parts.push(
        `tier ${cell.height}, ${cell.surface}${cell.feature ? ` ${cell.feature}` : ""}${cell.waterVisual ? `, ${cell.waterVisual.kind} ${cell.waterVisual.distance.toFixed(1)} cells` : ""}`,
      );
      if (cell.pathArt?.length) parts.push("path");
      if (cell.field)
        parts.push(`field ${cell.field.crop} ${cell.field.stage}`);
    }
    const d = w.decoration?.(x, y);
    if (d) parts.push(d.sprite.replace(/^(nature-|ecology-)/, ""));
    if (s && typeof s.lon === "number") {
      const o = toAtlas(s.lon, s.lat);
      const ll = fromAtlas(x + o.x, y + o.y);
      const region = ecoregionNear(ll.lon, ll.lat);
      parts.push(
        `${ll.lat.toFixed(3)}, ${ll.lon.toFixed(3)}` +
          (region
            ? ` · ${region.sourceName} (${biomeNames[region.biome] ?? "unmapped"})`
            : ""),
      );
    }
    this.engine.event(`Cell ${x},${y}: ${parts.join(" · ")}`, "action");
    this.emit(false);
  }
  walkTo(target: Point) {
    this.stop(false);
    const p = this.engine.state.player.pos;
    let candidates = [target];
    if (this.engine.blocked(target.x, target.y))
      candidates = [
        { x: target.x, y: target.y + 1 },
        { x: target.x + 1, y: target.y },
        { x: target.x - 1, y: target.y },
        { x: target.x, y: target.y - 1 },
      ];
    for (const end of candidates) {
      if (this.engine.blocked(end.x, end.y)) continue;
      const path =
        this.engine.state.manifest.simulation === 2
          ? this.engine.findRoute(p, end).path
          : findPath(p, end, (x, y) => this.engine.blocked(x, y));
      if (path.length) {
        this.route = path;
        this.running = true;
        this.notice = "";
        this.emit();
        return;
      }
    }
    this.notice = "No walkable route to that spot.";
    this.emit();
  }
  approach(id: string) {
    this.flushAmbient();
    const target = this.engine.inspect(id);
    if (!target) return;
    const p = this.engine.state.player.pos;
    const candidates = [];
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        if (Math.hypot(dx, dy) <= 2)
          candidates.push({ x: target.pos.x + dx, y: target.pos.y + dy });
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
    );
    for (const end of candidates) {
      if (this.engine.blocked(end.x, end.y)) continue;
      const path =
        this.engine.state.manifest.simulation === 2
          ? this.engine.findRoute(p, end).path
          : findPath(p, end, (x, y) => this.engine.blocked(x, y));
      if (path.length) {
        this.stop(false);
        this.route = path;
        this.running = true;
        this.emit();
        return;
      }
    }
  }
  startFollow(id: string) {
    this.flushAmbient();
    const result = this.command({
      type: "interact",
      target: id,
      action: "follow",
    });
    if (result?.status === "completed") {
      this.follow = id;
      this.steps = 0;
      this.running = true;
      this.emit();
    }
  }
  tick() {
    if (this.replay) {
      if (this.replay.playing) this.stepReplay();
      return;
    }
    if (!this.running) {
      // Standing still still spends time. Small blocks, because the whole block
      // is simulated in one frame: 600 seconds at once is a visible hitch, and
      // anyone the engine rather than a routine moves stands frozen until it
      // lands.
      // In a fight the block is one animal tick, or the quarry stands frozen
      // whenever the player does.
      // The same while winding up or aiming: otherwise the wait is handed to
      // the world in one lump just before the blow, and the quarry is gone.
      const block =
        this.engine.state.clock < this.engine.combatUntil ||
        this.charge ||
        this.aiming
          ? 6
          : IDLE_BLOCK;
      if (this.displayClock() - this.engine.state.clock >= block)
        this.flushAmbient();
      return;
    }
    const p = this.engine.state.player.pos;
    if (this.follow) {
      const a = this.engine.state.actors.find((a) => a.id === this.follow);
      if (
        !a ||
        !this.engine.visible(a.pos) ||
        a.trust < 0 ||
        (a.consentUntil ?? 0) < this.engine.state.clock ||
        this.steps++ > 150
      ) {
        this.stop();
        this.notice = "The accompanying walk has ended.";
        this.emit();
        return;
      }
      if (distance(p, a.pos) > 2.2) {
        this.route = (
          this.engine.state.manifest.simulation === 2
            ? this.engine.findRoute(p, a.pos).path
            : findPath(p, a.pos, (x, y) => this.engine.blocked(x, y))
        ).slice(0, 1);
      } else {
        this.command({ type: "wait", seconds: 6 });
        return;
      }
    }
    const upcoming = this.route[0];
    if (upcoming && this.engine.state.manifest.simulation === 2) {
      const gate = this.engine.barrierAt(upcoming);
      if (gate) {
        const result = this.command({
          type: "interact",
          target: gate.id,
          action: "open",
        });
        if (result?.status !== "completed") this.stop();
        return;
      }
      if (this.engine.blocked(upcoming.x, upcoming.y)) {
        const goal = this.route.at(-1)!;
        this.route = this.engine.findRoute(p, goal).path;
        if (!this.route.length) this.notice = "The route is now blocked.";
      }
    }
    const step = this.route.shift();
    if (!step) {
      this.stop();
      return;
    }
    const result = this.command({
      type: "move",
      dx: step.x - p.x,
      dy: step.y - p.y,
    });
    if (result?.status === "rejected") this.stop();
    if (!this.route.length && !this.follow) this.stop();
  }
  stop(emit = true) {
    this.route = [];
    this.follow = undefined;
    this.running = false;
    if (emit) this.emit(false);
  }
  terrainAt(x: number, y: number, space = "outside") {
    return (
      (space === "outside" && !this.engine.world.topography
        ? this.chunks.at(x, y)
        : undefined) ?? this.engine.world.terrain(x, y, space)
    );
  }
  loadReplay(value: unknown) {
    const envelope = z
      .object({
        manifest: snapshotSchema.shape.manifest,
        commands: z
          .array(
            z.object({
              actionId: z.string(),
              expectedRevision: z.number(),
              command: commandSchema,
            }),
          )
          .max(20000)
          .optional(),
        entries: z
          .array(
            z.object({
              request: z.object({
                actionId: z.string(),
                expectedRevision: z.number(),
                command: commandSchema,
              }),
            }),
          )
          .max(20000)
          .optional(),
        hash: z.string().optional(),
        finalHash: z.string().optional(),
      })
      .parse(value);
    const commands =
      envelope.commands ?? envelope.entries?.map((e) => e.request);
    if (!commands) throw Error("Missing trajectory commands.");
    this.stop(false);
    this.engine = createSession(
      envelope.manifest.pack,
      envelope.manifest.seed,
      undefined,
      envelope.manifest.generator !== 1 ? envelope.manifest.setting : undefined,
      envelope.manifest.content,
      envelope.manifest.generator,
    );
    this.selected = undefined;
    this.replay = {
      commands,
      index: 0,
      playing: false,
      manifest: envelope.manifest,
      expectedHash: envelope.hash ?? envelope.finalHash,
    };
    this.notice =
      "Recorded journey loaded. Play it back, step through, or continue from any point.";
    this.emit();
  }
  stepReplay() {
    const replay = this.replay;
    if (!replay) return;
    const request = replay.commands[replay.index];
    if (!request) {
      replay.playing = false;
      this.notice =
        replay.expectedHash && replay.expectedHash !== this.engine.hash()
          ? "Replay finished with a state mismatch."
          : replay.expectedHash
            ? "Journey complete. The recorded state matches."
            : "Journey complete.";
      this.emit();
      return;
    }
    this.engine.act(request);
    replay.index++;
    if (replay.index === replay.commands.length) {
      replay.playing = false;
      this.notice =
        replay.expectedHash && replay.expectedHash !== this.engine.hash()
          ? "Replay finished with a state mismatch."
          : replay.expectedHash
            ? "Journey complete. The recorded state matches."
            : "Journey complete.";
    }
    this.emit();
  }
  toggleReplay() {
    if (!this.replay) return;
    this.replay.playing = !this.replay.playing;
    this.emit();
  }
  seekReplay(index: number) {
    const replay = this.replay;
    if (!replay) return;
    replay.playing = false;
    this.engine = createSession(
      replay.manifest.pack,
      replay.manifest.seed,
      undefined,
      replay.manifest.setting,
      replay.manifest.content,
      replay.manifest.generator,
    );
    replay.index = 0;
    for (
      let i = 0;
      i < Math.min(Math.max(0, index), replay.commands.length);
      i++
    ) {
      this.engine.act(replay.commands[i]);
      replay.index++;
    }
    this.emit();
  }
  branchReplay() {
    if (!this.replay) return;
    this.replay = undefined;
    this.notice =
      "Your journey continues from this point. The imported recording is unchanged.";
    this.onChange?.();
    this.emit();
  }
  addNote(text: string, evidence?: string) {
    if (!text.trim()) return;
    this.engine.state.notes.push({
      id: this.engine.state.notes.length + 1,
      text: text.trim().slice(0, 4000),
      time: this.engine.state.clock,
      evidence,
    });
    this.onChange?.();
    this.emit();
  }
}
