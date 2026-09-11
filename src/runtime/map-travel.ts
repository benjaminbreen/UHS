import { Engine } from "../core/engine";
import type { PlayerCommand, Snapshot } from "../core/types";
import type { Runtime } from "./session";
import { releaseTerrainWorker } from "./terrain-worker-owner";
import {
  permanentMap,
  permanentExits,
  connectionPath,
  type PermanentMap,
  type MapExit,
} from "../world/travel/network";
import { settingForTravelStop } from "../world/travel/environment";
import type { SettlementWorld } from "../world/v3/generate";
import type { MapEntrance } from "../world/travel/entrances";
export function travelSetting(
  map: PermanentMap,
  exits: MapExit[],
  year: number,
) {
  const setting = settingForTravelStop(map, year);
  setting.playableMap = {
    id: map.networkId,
    size: map.size === 512 ? 512 : 384,
    exits: exits.map(({ id, to, bearing, mode }) => ({
      id,
      to,
      bearing,
      mode,
    })),
  };
  setting.environment!.population =
    map.settlement === "city" || map.settlement === "town" ? "settled" : "none";
  setting.environment!.start = "wanderer";
  return setting;
}
export async function prepareTravelMap(
  id: string,
  year: number,
  signal?: AbortSignal,
) {
  const map = permanentMap(id, year),
    exits = permanentExits(id, year);
  const { prepareSettingSession } = await import("./preparation");
  return prepareSettingSession(
    travelSetting(map, exits, year),
    "travel-review:" + id,
    signal,
  );
}
type Prepared = { id: string; engine: Engine };
export class MapTravel {
  readonly visited = new Map<string, Snapshot>();
  busy = false;
  private closed = false;
  private staged?: Prepared;
  private pending?: {
    id: string;
    abort: AbortController;
    promise: Promise<Prepared>;
  };
  private prefetchFailures = new Set<string>();
  private arrival?: { id: string; x: number; y: number };
  constructor(
    readonly runtime: Runtime,
    public id: string,
    readonly year: number,
    private prepare = prepareTravelMap,
    private resolveExits = permanentExits,
    private validate = connectionPath,
  ) {
    runtime.journey = this;
  }
  get entrances(): MapEntrance[] {
    return (this.runtime.engine.world as SettlementWorld).entrances?.() ?? [];
  }
  get exits() {
    return this.resolveExits(this.id, this.year);
  }
  status() {
    return {
      id: this.id,
      busy: this.busy,
      visited: this.visited.size + 1,
      prepared: this.staged?.id,
      preparing: this.pending?.id,
      exits: this.entrances,
    };
  }
  private load(id: string): Promise<Prepared> {
    if (this.staged?.id === id) return Promise.resolve(this.staged);
    if (this.pending?.id === id) return this.pending.promise;
    this.pending?.abort.abort();
    if (this.staged) releaseTerrainWorker(this.staged.engine.world);
    this.staged = undefined;
    const abort = new AbortController();
    const promise = this.prepare(id, this.year, abort.signal)
      .then((fresh) => {
        if (abort.signal.aborted || this.closed) {
          releaseTerrainWorker(fresh.world);
          throw Error("Travel preparation cancelled.");
        }
        const saved = this.visited.get(id);
        if (saved) {
          fresh.world.restoreDistricts?.(
            [...saved.actors, ...saved.objects].map((x) => x.id),
          );
          fresh = new Engine(fresh.world, fresh.items, saved);
        }
        const result = { id, engine: fresh };
        this.staged = result;
        if (this.pending?.id === id) this.pending = undefined;
        return result;
      })
      .catch((e) => {
        if (this.pending?.abort === abort) this.pending = undefined;
        throw e;
      });
    this.pending = { id, abort, promise };
    return promise;
  }
  observe() {
    if (this.closed || this.busy) return;
    const p = this.runtime.engine.state.player.pos;
    if (p.space !== "outside") return;
    if (
      this.arrival &&
      Math.hypot(p.x - this.arrival.x, p.y - this.arrival.y) > 4
    )
      this.arrival = undefined;
    const nearest = this.entrances
      .filter((e) => e.point && e.mode === "land" && e.id !== this.arrival?.id)
      .sort(
        (a, b) =>
          Math.hypot(p.x - a.point!.x, p.y - a.point!.y) -
          Math.hypot(p.x - b.point!.x, p.y - b.point!.y),
      )[0];
    if (
      nearest &&
      !this.prefetchFailures.has(nearest.to) &&
      Math.hypot(p.x - nearest.point!.x, p.y - nearest.point!.y) < 32
    )
      void this.load(nearest.to).catch(() => {
        this.prefetchFailures.add(nearest.to);
      });
  }
  intercept(command: PlayerCommand) {
    if (this.busy) return true;
    if (command.type !== "move" || this.closed) return false;
    const p = this.runtime.engine.state.player.pos,
      half = this.runtime.engine.state.manifest.setting!.playableMap!.size / 2;
    if (p.space !== "outside") return false;
    const x = p.x + command.dx,
      y = p.y + command.dy;
    const outside = x < -half || y < -half || x >= half || y >= half;
    const entrance = this.entrances
      .filter(
        (e) =>
          e.point &&
          Math.hypot(p.x - e.point.x, p.y - e.point.y) <= 2 &&
          (outside ||
            (e.shore && this.runtime.engine.world.terrain(x, y) === "water")),
      )
      .sort(
        (a, b) =>
          Math.hypot(p.x - a.point!.x, p.y - a.point!.y) -
            Math.hypot(p.x - b.point!.x, p.y - b.point!.y) ||
          a.id.localeCompare(b.id),
      )[0];
    if (!entrance) return false;
    if (entrance.mode !== "land") {
      this.runtime.notice = "You need a boat to continue from this shore.";
      return true;
    }
    if (this.arrival?.id === entrance.id) {
      this.runtime.notice = "Step away from the entrance before returning.";
      return true;
    }
    void this.cross(entrance);
    return true;
  }
  async cross(entrance: MapEntrance) {
    if (this.busy || this.closed || !entrance.point || entrance.mode !== "land")
      return;
    const exit = this.exits.find((e) => e.id === entrance.id);
    if (!exit) return;
    this.busy = true;
    this.runtime.stop(false);
    this.runtime.notice = "Preparing the next map…";
    this.runtime.emit(false);
    try {
      this.validate(exit);
      const destination = await this.load(exit.to);
      if (this.closed) return;
      const incoming = (destination.engine.world as SettlementWorld)
        .entrances()
        .find((e) => e.id === exit.id);
      if (!incoming?.point || incoming.path.length < 2)
        throw Error("The destination has no reachable paired entrance.");
      const source = this.runtime.engine.snapshot();
      const player = structuredClone(source.player);
      const carried = source.objects.filter(
        (o) => o.carriedBy === "player" || o.id === player.held,
      );
      source.objects = source.objects.filter((o) => !carried.includes(o));
      const next = destination.engine.state;
      for (const object of carried) {
        const oldId = object.id;
        if (!object.id.startsWith("traveler:"))
          object.id = "traveler:" + this.id + ":" + object.id;
        if (player.held === oldId) player.held = object.id;
      }
      this.visited.set(this.id, source);
      const point = incoming.path[Math.max(0, incoming.path.length - 4)];
      player.pos = { ...point, space: "outside" };
      player.home = next.player.home;
      player.work = next.player.work;
      player.householdId = next.player.householdId;
      player.goal = undefined;
      for (const object of carried) object.pos = { ...player.pos };
      next.player = player;
      next.objects = next.objects
        .filter((o) => !carried.some((c) => c.id === o.id))
        .concat(carried);
      next.clock = source.clock;
      next.notes = source.notes;
      next.catalog = { ...next.catalog, ...source.catalog };
      next.ledger = source.ledger;
      next.narration = source.narration;
      this.visited.delete(exit.to);
      this.id = exit.to;
      this.arrival = { id: exit.id, ...incoming.point };
      this.staged = undefined;
      this.runtime.replace(destination.engine, true);
      this.runtime.notice =
        "You arrive in " + permanentMap(this.id, this.year).name + ".";
    } catch (e) {
      if (!this.closed)
        this.runtime.notice = "Travel unavailable: " + String(e);
    } finally {
      this.busy = false;
      if (!this.closed) {
        this.runtime.resumeAmbient();
        this.runtime.emit();
      }
    }
  }
  dispose() {
    this.closed = true;
    this.pending?.abort.abort();
    if (this.staged) releaseTerrainWorker(this.staged.engine.world);
    this.staged = undefined;
    this.visited.clear();
    if (this.runtime.journey === this) this.runtime.journey = undefined;
  }
}
