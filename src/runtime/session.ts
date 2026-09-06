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
export function createSession(
  packId = "roman",
  seed = packs[packId].defaultSeed,
  snapshot?: Snapshot,
) {
  const pack = packs[packId];
  if (!pack) throw Error("Unsupported content pack.");
  const world = createWorld(pack, seed);
  const engine = new Engine(world, items, snapshot);
  if (!snapshot) engine.initialize(seed);
  return engine;
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
  private chunks = new ChunkCache();
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
  constructor(engine: Engine) {
    this.engine = engine;
    this.cached = this.view();
  }
  private view() {
    return {
      observation: this.engine.observe(),
      selection: this.selected ? this.engine.inspect(this.selected) : undefined,
      notice: this.notice,
      running: this.running,
      zoom: this.zoom,
      pack: this.engine.world.pack,
      replay: this.replay
        ? {
            index: this.replay.index,
            total: this.replay.commands.length,
            playing: this.replay.playing,
          }
        : undefined,
    };
  }
  getSnapshot = () => this.cached;
  subscribe = (listener: () => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };
  emit() {
    this.chunks.prefetch(
      this.engine.world.pack.id,
      this.engine.state.manifest.seed,
      this.engine.state.player.pos.x,
      this.engine.state.player.pos.y,
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
      const path = findPath(p, end, (x, y) => this.engine.blocked(x, y));
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
      const path = findPath(p, end, (x, y) => this.engine.blocked(x, y));
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
        this.route = findPath(p, a.pos, (x, y) =>
          this.engine.blocked(x, y),
        ).slice(0, 1);
      } else {
        this.command({ type: "wait", seconds: 6 });
        return;
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
      (space === "outside" ? this.chunks.at(x, y) : undefined) ??
      this.engine.world.terrain(x, y, space)
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
    this.engine = createSession(envelope.manifest.pack, envelope.manifest.seed);
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
    this.engine = createSession(replay.manifest.pack, replay.manifest.seed);
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
