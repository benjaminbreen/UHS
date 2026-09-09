import { populateCharacter } from "../content/geography/character";
import { generateCharacter } from "../content/characters/generate";
import { releaseTerrainWorker } from "./terrain-worker-owner";
import type { PreparedSettlement } from "../world/v3/prepared";
import { wardrobeFor } from "../content/characters/wardrobes";
import { actorAppearance, generateAppearance } from "../core/character";
import type { Actor } from "../core/types";
import type { CharacterPose } from "../render/characters/poses";
import { allowedHeights, type CharacterAppearance } from "../core/character";
import { characterAppearanceSchema } from "./schema";
import { heldObject, nearbyProp } from "../core/props";
import { withProps } from "../content/props/place";
import { propDefs } from "../content/props/catalog";
import { Engine } from "../core/engine";
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
import { createWorld } from "../world/generate";
import { commandSchema, snapshotSchema } from "./schema";
import { ChunkCache } from "./chunks";
import { z } from "zod";
import { settingSchema, type WorldSetting } from "../content/geography/types";
import { packForSetting } from "../content/geography/pack";
import { createSettlementWorld } from "../world/v3/generate";
import { createAtlasWorld } from "../world/v2/generate";
import { integratedSetting } from "../content/geography/defaults";
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
          resolved.character.appearanceSeed,
          pack,
          appearance.wearing,
        );
        engine.state.player.appearance = appearance;
      }
    }
  }
  return engine;
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
export class Runtime {
  engine: Engine;
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
  appearanceFor(
    actor: Pick<Actor, "id" | "sprite" | "appearance" | "age">,
  ): CharacterAppearance {
    if (actor.appearance) return actorAppearance(actor);
    const pack = this.engine.world.pack;
    const signature = `${actor.sprite}:${actor.age}:${pack.id}:${pack.year}`;
    const cached = this.appearanceDefaults.get(actor.id);
    if (cached?.signature === signature) return cached.value;
    const base = actorAppearance(actor);
    const value = {
      ...base,
      wearing: wardrobeFor(actor.id, pack, base.wearing),
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
  };
  private characterSerial = 0;
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
    this.onChange?.();
    this.emit();
  }
  private animateCommand(
    command: PlayerCommand,
    accepted: boolean,
    previousProp?: string,
  ) {
    if (!accepted) return;
    if (command.type === "move") {
      const leap = command.traverse ? this.engine.lastLeap : undefined;
      if (leap)
        this.characterAction = {
          serial: ++this.characterSerial,
          pose: "jump",
          at: performance.now(),
          arc: {
            height:
              leap.kind === "leap"
                ? 15
                : leap.kind === "drop"
                  ? 8
                  : leap.kind === "climb"
                    ? 6
                    : 11,
            duration: leap.distance === 2 ? 400 : 340,
          },
        };
      return;
    }
    const action = command.type === "interact" ? command.action : command.type;
    const pose: CharacterPose | undefined = (
      {
        pickup: "pickup",
        drop: "drop",
        throw: "swing",
        strike: "swing",
        talk: "talk",
        trade: "give",
        harvest: "work",
        drink: "give",
        rest: "sit",
        use: "give",
      } as Record<string, CharacterPose>
    )[action];
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
    this.syncAmbient();
    this.cached = this.view();
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
    this.cached = this.view(refresh);
    for (const listener of this.subscribers) listener();
  }
  select(id?: string) {
    if (id) this.flushAmbient();
    this.selected = id;
    this.emit(false);
  }
  setZoom(z: number) {
    this.zoom = Math.min(4, Math.max(1, z));
    this.emit(false);
  }
  replace(engine: Engine) {
    releaseTerrainWorker(this.engine.world);
    this.replay = undefined;
    this.stop();
    this.engine = engine;
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
    // A short grace period means the gaps between walking steps contribute
    // nothing; only actually standing still lets the clock run on.
    const idle = (performance.now() - this.ambientAt) / 1000 - 0.25;
    return Math.max(
      this.engine.state.clock,
      this.ambientBase + (idle > 0 ? idle * this.ambientRate : 0),
    );
  }
  private syncAmbient() {
    this.ambientBase = this.engine.state.clock;
    this.ambientAt = performance.now();
  }
  /** Hands the drawn time back to the simulation, so positions the player can
   * click on agree with the ones on screen. */
  flushAmbient() {
    const seconds = Math.floor(this.displayClock() - this.engine.state.clock);
    if (seconds >= 1)
      this.dispatch({ type: "pass", seconds: Math.min(3600, seconds) });
    this.syncAmbient();
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
    const previousProp = heldObject(this.engine.state)?.sprite;
    const result = this.engine.act({
      actionId: `ui-${this.engine.state.revision}-${++this.serial}`,
      expectedRevision: this.engine.state.revision,
      command,
    });
    this.animateCommand(command, result.status !== "rejected", previousProp);
    this.notice = result.reason ?? "";
    if (result.status !== "rejected") this.onChange?.();
    this.emit();
    return result;
  }
  act(request: CommandRequest) {
    if (this.replay)
      throw Error("Continue from this replay point before acting.");
    const command = commandSchema.parse(request.command);
    const previousProp = heldObject(this.engine.state)?.sprite;
    const result = this.engine.act({ ...request, command });
    this.animateCommand(command, result.status !== "rejected", previousProp);
    if (result.status !== "rejected") this.onChange?.();
    this.emit();
    return { ...result, observation: structuredClone(this.observation!) };
  }
  propControls() {
    const s = this.engine.state,
      held = heldObject(s),
      weapon = !!propDefs[held?.prop ?? ""]?.strike;
    const target = nearbyProp(
      s,
      (p) => this.engine.visible(p),
      (o) =>
        held
          ? weapon && !!propDefs[o.prop!]?.breakable && !o.broken
          : !!propDefs[o.prop!]?.portable && !o.broken,
    );
    const nearby = nearbyProp(
      s,
      (p) => this.engine.visible(p),
      (o) => !!propDefs[o.prop!]?.drink || !!propDefs[o.prop!]?.container,
    );
    const context =
      nearby && propDefs[nearby.prop!]?.drink
        ? nearby
        : held && propDefs[held.prop!]?.container
          ? held
          : nearby;
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
            : ("look" as const),
        }
      : undefined;
    return {
      held,
      primary,
      secondary,
      primaryLabel: primary
        ? `${held ? "Strike" : "Pick up"} ${target!.name.toLowerCase()}`
        : held
          ? "G: put down held object"
          : "Move near a portable object",
      secondaryLabel: context
        ? propDefs[context.prop!]?.drink
          ? "Drink water"
          : `Look inside ${context.name.toLowerCase()}`
        : undefined,
    };
  }
  propAction(key: "Space" | "KeyE" | "KeyG") {
    this.stop(false);
    const controls = this.propControls();
    const command =
      key === "Space"
        ? controls.primary
        : key === "KeyE"
          ? controls.secondary
          : controls.held
            ? {
                type: "interact" as const,
                target: controls.held.id,
                action: "drop" as const,
              }
            : undefined;
    if (command) {
      this.selected = command.target;
      this.command(command);
    } else {
      if (
        key === "Space" &&
        controls.held &&
        propDefs[controls.held.prop ?? ""]?.strike &&
        !this.replay
      ) {
        this.characterAction = {
          serial: ++this.characterSerial,
          pose: "swing",
          at: performance.now(),
          prop: controls.held.sprite,
        };
        this.notice = "You swing through the air.";
        this.emit();
        return;
      }
      this.notice =
        key === "Space"
          ? controls.primaryLabel
          : "No contextual action nearby.";
      this.emit();
    }
  }
  move(dx: number, dy: number, traverse = false) {
    this.stop(false);
    return this.command(
      traverse ? { type: "move", dx, dy, traverse } : { type: "move", dx, dy },
    );
  }
  throwHeld(dx: number, dy: number) {
    this.stop(false);
    return this.command({ type: "throw", dx, dy });
  }
  /** Jump on the spot. Expression only, like a strike that hits nothing. */
  hop() {
    if (this.replay) return;
    this.stop(false);
    this.characterAction = {
      serial: ++this.characterSerial,
      pose: "jump",
      at: performance.now(),
      arc: { height: 11, duration: 320 },
    };
    this.emit();
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
      if (this.displayClock() - this.engine.state.clock >= IDLE_BLOCK)
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
      const gate = this.engine.gateAt(upcoming);
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
