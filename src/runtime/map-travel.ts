import { edgeCrossings, sharedCrossings } from "../world/travel/waterways";
import { Engine } from "../core/engine";
import { skySeed } from "../core/weather";
import { findTravelPath } from "../world/travel/routing";
import {
  cellPoint,
  isWater,
  kilometers,
  snapCell,
} from "../world/travel/geography";
import { toAtlas } from "../world/geography/atlas";
import type { Coordinate } from "../world/travel/types";
import type { PlayerCommand, Snapshot } from "../core/types";
import type { Runtime } from "./session";
import { releaseTerrainWorker } from "./terrain-worker-owner";
import {
  mapForCoordinate,
  loadTileNames,
  tileCentre,
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
  setting.hydrologyRevision = 3;
  setting.playableMap = {
    id: map.networkId,
    name: map.name,
    size: 384,
    exits: exits.map(({ id, to, bearing, mode, seam }) => {
      const destination = permanentMap(to, year);
      const next = settingForTravelStop(destination, year);
      const peer = permanentExits(to, year).find((e) => e.id === id)?.seam;
      const a = seam ? edgeCrossings(setting, map.networkId, 384, seam) : [];
      const b = peer ? edgeCrossings(next, to, 384, peer) : [];
      const waterways = map.networkId < to ? sharedCrossings(a, b)
        : sharedCrossings(b, a).map((p) => ({ ...p, flow: -p.flow }));
      return {
        id, to, bearing, mode, seam, waterways,
        peer: peer ? { side: peer.side, start: peer.start, end: peer.end } : undefined,
        neighbor: {
          lon: next.lon, lat: next.lat, relief: next.relief,
          climate: next.climate, water: next.water,
          ecology: next.environment!.ecology,
          colorway: next.environment!.colorway,
          landform: next.environment!.landform,
          size: 384,
          geographyMode: next.geographyMode ?? "earth",
        },
      };
    }),
  };
  setting.environment!.population =
    map.settlement === "city" || map.settlement === "town" || map.settlement === "village"
      ? "settled"
      : (map.countryside ?? "none");
  setting.environment!.start = "wanderer";
  return setting;
}
export async function prepareTravelMap(
  id: string,
  year: number,
  signal?: AbortSignal,
  saved?: Snapshot,
) {
  await loadTileNames([id]);
  const map = permanentMap(id, year),
    exits = permanentExits(id, year);
  const { prepareSettingSession } = await import("./preparation");
  return prepareSettingSession(
    saved?.manifest.setting ?? travelSetting(map, exits, year),
    saved?.manifest.seed ?? "travel-review:" + id,
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
    const promise = this.prepare(
      id,
      this.year,
      abort.signal,
      this.visited.get(id),
    )
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
      .filter((e) => e.point && e.walkable && e.id !== this.arrival?.id)
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
  borderHint() {
    if (this.busy) return "Preparing the next map…";
    const p = this.runtime.engine.state.player.pos;
    const half =
      this.runtime.engine.state.manifest.setting!.playableMap!.size / 2;
    if (
      p.space !== "outside" ||
      half - Math.max(Math.abs(p.x), Math.abs(p.y)) > 18
    )
      return undefined;
    const side =
      Math.abs(p.x) > Math.abs(p.y)
        ? p.x < 0
          ? "W"
          : "E"
        : p.y < 0
          ? "N"
          : "S";
    const entrance = this.entrances
      .filter(
        (e) =>
          e.point && e.walkable && (e.seam?.side ?? e.bearing).includes(side),
      )
      .sort(
        (a, b) =>
          Math.hypot(p.x - a.point!.x, p.y - a.point!.y) -
            Math.hypot(p.x - b.point!.x, p.y - b.point!.y) ||
          a.id.localeCompare(b.id),
      )[0];
    const exit = this.exits.find((e) => e.id === entrance?.id);
    const direction = { N: "north", E: "east", S: "south", W: "west" }[side];
    return exit
      ? `Continue ${direction} to ${exit.name}`
      : "Follow another border to an overland crossing.";
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
    const side = y < -half ? "N" : y >= half ? "S" : x < -half ? "W" : "E";
    const entrance = this.entrances
      .filter(
        (e) =>
          e.point &&
          (outside
            ? e.walkable && (e.seam?.side ?? e.bearing).includes(side)
            : e.shore &&
              Math.hypot(p.x - e.point.x, p.y - e.point.y) <= 2 &&
              this.runtime.engine.world.terrain(x, y) === "water"),
      )
      .sort(
        (a, b) =>
          Math.hypot(p.x - a.point!.x, p.y - a.point!.y) -
            Math.hypot(p.x - b.point!.x, p.y - b.point!.y) ||
          a.id.localeCompare(b.id),
      )[0];
    if (!entrance) {
      if (outside) {
        this.runtime.notice =
          "No overland connection on this border. Follow another edge.";
        return true;
      }
      return false;
    }
    if (!entrance.walkable) {
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
    if (this.busy || this.closed || !entrance.point || !entrance.walkable)
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
      const world = destination.engine.world as SettlementWorld;
      const from = this.runtime.engine.state.player.pos;
      const half = destination.engine.state.manifest.setting!.playableMap!.size / 2;
      // The neighbour's edge is the same line of ground, so step straight on
      // across it; its paired entrance is only for a border cell it walls off.
      const across = {
        N: { x: from.x, y: half - 2 },
        S: { x: from.x, y: -half + 1 },
        E: { x: -half + 1, y: from.y },
        W: { x: half - 2, y: from.y },
      }[exit.bearing as "N"];
      const incoming = world.entrances().find((e) => e.id === exit.id);
      const point =
        across && !world.blocked(across.x, across.y, "outside")
          ? across
          : incoming?.point && incoming.path.length >= 2
            ? incoming.path[Math.max(0, incoming.path.length - 4)]
            : undefined;
      if (!point)
        throw Error("The destination has no reachable paired entrance.");
      this.arrive(destination, exit.to, point, 0);
      this.arrival = { id: exit.id, ...point };
      // New country is what the road teaches.
      destination.engine.grantXp("wayfaring", 40);
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
  /** Carries the traveller, what they hold and the day's record into a
   * prepared map, after `seconds` on the road. */
  private arrive(
    destination: Prepared,
    to: string,
    point: { x: number; y: number },
    seconds: number,
  ) {
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
    next.clock = source.clock + seconds;
    next.manifest.sky = skySeed(source.manifest);
    destination.engine.runEconomy();
    next.notes = source.notes;
    next.catalog = { ...next.catalog, ...source.catalog };
    next.ledger = source.ledger;
    next.narration = source.narration;
    this.visited.delete(to);
    this.id = to;
    this.staged = undefined;
    this.runtime.replace(destination.engine, true);
  }
  /** A long journey the player does not walk: the map at the far end is
   * prepared and the days on the road pass at once. */
  async voyage(to: Coordinate) {
    if (this.busy || this.closed) return;
    const id = mapForCoordinate(to);
    if (id === this.id) return;
    await loadTileNames([id]);
    if (permanentMap(id, this.year).water) {
      this.runtime.notice = "That is open sea; choose somewhere on land.";
      this.runtime.emit();
      return;
    }
    this.busy = true;
    this.runtime.stop(false);
    this.runtime.notice = "Setting out…";
    this.runtime.emit(false);
    try {
      const plan = journeyPlan(tileCentre(this.id), to);
      const destination = await this.load(id);
      if (this.closed) return;
      const world = destination.engine.world;
      // Arrive where the chosen point lies within its square, if one can stand there.
      const here = toAtlas(to.lon, to.lat),
        centre = tileCentre(id),
        c = toAtlas(centre.lon, centre.lat);
      const half = destination.engine.state.manifest.setting!.playableMap!.size / 2 - 2;
      const aim = {
        x: Math.max(-half, Math.min(half, here.x - c.x)),
        y: Math.max(-half, Math.min(half, here.y - c.y)),
      };
      const point = world.blocked(aim.x, aim.y, "outside") ? world.spawn : aim;
      this.arrive(destination, id, point, plan.days * 86400);
      this.arrival = undefined;
      destination.engine.grantXp("wayfaring", 40 + plan.days * 10);
      const told = `After ${plan.days} day${plan.days === 1 ? "" : "s"} on the road${plan.sea ? " and at sea" : ""}, you reach ${permanentMap(id, this.year).name}.`;
      destination.engine.event(told, "system");
      this.runtime.notice = told;
    } catch (e) {
      if (!this.closed) this.runtime.notice = "Journey unavailable: " + String(e);
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

// A caravan's day on foot and a coasting ship's day under sail.
const LAND_KM_PER_DAY = 25,
  SEA_KM_PER_DAY = 100;
/** The route a traveller would take, overland where it can, by sea where it
 * must, and the days it costs. */
export function journeyPlan(from: Coordinate, to: Coordinate) {
  const path = findTravelPath(
    snapCell(from, "land"),
    snapCell(to, "land"),
    "mixed",
  ).path.map(cellPoint);
  let land = 0,
    sea = 0;
  for (let i = 1; i < path.length; i++) {
    const km = kilometers(path[i - 1], path[i]);
    if (isWater(path[i - 1]) || isWater(path[i])) sea += km;
    else land += km;
  }
  return {
    land,
    sea,
    days: Math.max(1, Math.round(land / LAND_KM_PER_DAY + sea / SEA_KM_PER_DAY)),
  };
}

export async function prepareConnectedStart(
  setting: import("../content/geography/types").WorldSetting,
  seed: string,
  signal?: AbortSignal,
) {
  if (setting.situation) {
    const { prepareSettingSession } = await import("./preparation");
    return prepareSettingSession(setting, seed, signal);
  }
  const id = mapForCoordinate({ lon: setting.lon, lat: setting.lat });
  await loadTileNames([id]);
  const map = permanentMap(id, setting.year);
  const exits = permanentExits(id, setting.year);
  const bounded = {
    ...setting,
    // The world is generated about the square's centre so that its borders
    // are the same lines of Earth its neighbours see.
    ...tileCentre(id),
    // A wilderness start is otherwise labelled "Countryside" while the map it
    // sits on has a real geographic name. A chosen place keeps its own name,
    // even where its square is named for a feature beside the town.
    location:
      map.locationId ||
      (setting.location !== "Countryside" && !setting.placeId?.startsWith("area-"))
        ? setting.location
        : map.name,
    playableMap: travelSetting(map, exits, setting.year).playableMap,
  };
  const { prepareSettingSession } = await import("./preparation");
  return prepareSettingSession(bounded, seed, signal);
}
