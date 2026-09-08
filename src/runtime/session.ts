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
) {
  const resolved = setting ?? snapshot?.manifest.setting;
  const pack = resolved
    ? packForSetting(settingSchema.parse(resolved))
    : packs[packId];
  if (!pack) throw Error("Unsupported content pack.");
  const generation = snapshot?.manifest.generator ?? generator;
  let world = resolved
    ? generation === 3
      ? createSettlementWorld(pack, seed)
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
    if (resolved?.character) {
      engine.state.player.hunger = resolved.character.hunger;
      engine.state.player.fatigue = resolved.character.fatigue;
    }
  }
  return engine;
}
export function createSettingSession(setting: WorldSetting, seed = "earth-2") {
  return createSession("atlas", seed, undefined, integratedSetting(setting));
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
  private subscribers = new Set<() => void>();
  private cached: ReturnType<Runtime["view"]>;
  onChange?: (snapshot: Snapshot) => void;
  constructor(engine: Engine, options: { cacheTerrain?: boolean } = {}) {
    this.chunks = new ChunkCache(options.cacheTerrain !== false);
    this.engine = engine;
    this.cached = this.view();
  }
  private view() {
    const pos = this.engine.state.player.pos;
    const outside =
      pos.space === "outside"
        ? pos
        : this.engine.world.place(pos.space)?.entrance;
    return {
      observation: this.engine.observe(),
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
  emit() {
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
    this.cached = this.view();
    for (const listener of this.subscribers) listener();
  }
  select(id?: string) {
    this.selected = id;
    this.emit();
  }
  setZoom(z: number) {
    this.zoom = Math.min(4, Math.max(1, z));
    this.emit();
  }
  replace(engine: Engine) {
    this.replay = undefined;
    this.stop();
    this.engine = engine;
    this.selected = undefined;
    this.notice = "A new day, a different world.";
    this.emit();
    this.onChange?.(this.engine.snapshot());
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
    const result = this.engine.act({
      actionId: `ui-${this.engine.state.revision}-${++this.serial}`,
      expectedRevision: this.engine.state.revision,
      command: parsed.data,
    });
    this.notice = result.reason ?? "";
    if (result.status !== "rejected") this.onChange?.(this.engine.snapshot());
    this.emit();
    return result;
  }
  act(request: CommandRequest) {
    if (this.replay)
      throw Error("Continue from this replay point before acting.");
    const command = commandSchema.parse(request.command);
    const result = this.engine.act({ ...request, command });
    if (result.status !== "rejected") this.onChange?.(this.engine.snapshot());
    this.emit();
    return { ...result, observation: this.engine.observe() };
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
      this.notice =
        key === "Space"
          ? controls.primaryLabel
          : "No contextual action nearby.";
      this.emit();
    }
  }
  move(dx: number, dy: number) {
    this.stop(false);
    return this.command({ type: "move", dx, dy });
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
    if (!this.running) return;
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
    if (emit) this.emit();
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
    this.onChange?.(this.engine.snapshot());
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
    this.onChange?.(this.engine.snapshot());
    this.emit();
  }
}
