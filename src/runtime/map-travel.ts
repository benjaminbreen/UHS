import { gathersPlants } from "../content/characters/livelihoods";
import { gatheringJourney, type Way } from "../world/v3/wayfarers";
import { livelihoodOf } from "../world/v3/routines";
import { BASKET_SIZE, emptyBasket, pickHandful, refreshResource, seasonAt } from "../core/livelihood";
import { itineraryAt } from "../core/itinerary";
import { withTravelWaterways } from "../world/travel/waterways";
import { prepareConnectedStart, travelSettings } from "./preparation";
export { prepareConnectedStart };
import { Engine } from "../core/engine";
import { seedAilments } from "../core/health";
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
import type { Actor, PlayerCommand, Point, Snapshot } from "../core/types";
import type { Runtime } from "./session";
import { smallMemoryDevice } from "./device";
import { releaseTerrainWorker, surveyingEdges, surveyMapEdges } from "./terrain-worker-owner";
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
import type { SettlementWorld } from "../world/v3/generate";
import { DAY, railSpeed, timetable } from "../world/v3/railway";
import type { MapEntrance } from "../world/travel/entrances";
export function travelSetting(map: PermanentMap, exits: MapExit[], year: number) {
  const { setting, waterways } = travelSettings(map, exits, year);
  setting.playableMap = withTravelWaterways(setting.playableMap!, waterways);
  return setting;
}
export async function prepareTravelMap(
  id: string,
  year: number,
  signal?: AbortSignal,
  saved?: Snapshot,
) {
  const [{ prepareSettingSession }] = await Promise.all([import("./preparation"), loadTileNames([id])]);
  signal?.throwIfAborted();
  const seed = saved?.manifest.seed ?? "travel-review:" + id;
  if (saved?.manifest.setting) return prepareSettingSession(saved.manifest.setting, seed, signal);
  const map = permanentMap(id, year),
    exits = permanentExits(id, year);
  const { setting, waterways } = travelSettings(map, exits, year);
  return prepareSettingSession(setting, seed, signal, true, undefined, waterways);
}
type Prepared = { id: string; engine: Engine };
function acrossBorder(bearing: string, from: Point, half: number) {
  switch (bearing) {
    case "N": return { x: from.x, y: half - 2 };
    case "S": return { x: from.x, y: -half + 1 };
    case "E": return { x: -half + 1, y: from.y };
    case "W": return { x: half - 2, y: from.y };
  }
}
function borderDistances({ x, y }: Point, half: number) {
  return { N: half + y, E: half - 1 - x, S: half - 1 - y, W: half + x };
}
export class MapTravel {
  readonly visited = new Map<string, Snapshot>();
  busy = false;
  private foodTrip?: { home:Prepared; away:Prepared; worker:Actor; round:NonNullable<ReturnType<typeof gatheringJourney>>; beats:number; across:boolean };
  private foodDay = new Map<string, number>();
  private foodSearch?: { id:string; day:number; tried:Set<string>; retry:number };
  private entered = new Set<string>();
  private closed = false;
  private staged?: Prepared;
  private pending?: {
    id: string;
    abort: AbortController;
    promise: Promise<Prepared>;
  };
  private prefetchFailures = new Set<string>();
  private approach?: { entrance: MapEntrance; from: Point };
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
    this.entered.add(id);
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
      visited: this.entered.size,
      prepared: this.staged?.id,
      preparing: this.pending?.id,
      exits: this.entrances,
    };
  }
  private gatherer() {
    const e = this.runtime.engine, day = Math.floor(e.state.clock/86400), hour = e.state.clock/3600%24;
    if (this.foodTrip || this.foodDay.get(this.id) === day || hour < 6 || hour >= 14) return;
    if (this.foodSearch?.id !== this.id || this.foodSearch.day !== day)
      this.foodSearch = { id:this.id, day, tried:new Set(), retry:0 };
    if (e.state.clock < this.foodSearch.retry) return;
    const worker = e.state.actors.find(a => a.kind === "human" && !a.dead && !a.basket && !a.mount && !a.tends && !a.errand &&
      a.householdId && gathersPlants(livelihoodOf(e.world.pack,a)));
    if (!worker) this.foodSearch.retry = e.state.clock + 300;
    return worker;
  }
  private startGathering(away: Prepared, worker:Actor) {
    const home = { id:this.id, engine:this.runtime.engine };
    const exit = this.entrances.find(e => e.to === away.id && e.walkable && e.point);
    const entry = (away.engine.world as SettlementWorld).entrances?.().find(e => e.id === exit?.id && e.walkable && e.point);
    const storeId = home.engine.state.households?.find(h => h.id === worker.householdId)?.storeId;
    const store = home.engine.state.objects.find(o => o.id === storeId);
    if (!exit?.point || !exit.path.length || !entry?.point || !store || away.engine.state.actors.some(a => a.id === worker.id)) return;
    away.engine.populateNearby({ ...entry.point, space:"outside" });
    const season = seasonAt(away.engine.world.pack.setting?.season ?? "spring",home.engine.state.clock);
    for (const patch of away.engine.state.objects) if (patch.resource) refreshResource(patch,home.engine.state.clock,season);
    const round = gatheringJourney(home.engine.world,away.engine.world,exit as Way,entry as Way,worker,store,away.engine.state.objects,home.engine.state.clock);
    if (!round) return;
    this.foodTrip = { home, away, round, worker, beats:0, across:false };
    for (const [side,route] of [[home,round.town],[away,round.gather]] as const)
      side.engine.world.outing = { actor:worker.id, route, tick:clock => this.walkGatherer(clock) };
    this.walkGatherer(home.engine.state.clock);
    return true;
  }
  private walkGatherer(clock:number) {
    const trip = this.foodTrip;
    if (!trip) return;
    const {home,away,worker,round} = trip, minute = clock/60;
    if (worker.dead) { this.finishGathering(trip); return; }
    const patch = minute >= round.pick+4 && trip.beats < BASKET_SIZE ? away.engine.state.objects.find(o => o.id === round.patch) : undefined;
    const remote = minute >= round.cross && minute < round.again;
    if (patch) {
      const season = seasonAt(away.engine.world.pack.setting?.season ?? "spring",clock);
      while (trip.beats < BASKET_SIZE && minute >= round.pick + (trip.beats+1)*4) {
        const when = (round.pick + ++trip.beats*4)*60;
        const at = itineraryAt(round.gather,when-0.01);
        worker.pos = { x:Math.round(at.x),y:Math.round(at.y),space:"outside" };
        pickHandful(worker,patch,when,season);
      }
    }
    if (trip.across !== remote) {
      const source = (trip.across ? away : home).engine.state, dest = (remote ? away : home).engine.state;
      source.actors = source.actors.filter(a => a.id !== worker.id);
      dest.actors.push(worker);
      trip.across = remote;
    }
    const at = itineraryAt(remote ? round.gather : round.town, Math.min(clock,round.unload*60+1));
    worker.pos = { x:Math.round(at.x),y:Math.round(at.y),space:"outside" };
    worker.activity = at.label; worker.direction = at.direction; worker.offRoutine = false;
    worker.lastUpdated = clock; worker.heldItem = round.basket;
    if (minute >= round.unload) {
      const store = home.engine.state.objects.find(o => o.id === round.store);
      if (store) emptyBasket(worker,store);
      this.finishGathering(trip);
    }
  }
  private finishGathering(trip:NonNullable<MapTravel["foodTrip"]>) {
    delete trip.worker.heldItem;
    for (const side of [trip.home,trip.away]) {
      delete side.engine.world.outing;
      if (side.id !== this.id) this.visited.set(side.id,side.engine.snapshot());
    }
    this.foodTrip = undefined;
  }
  private load(id: string): Promise<Prepared> {
    const trip = this.foodTrip;
    const side = trip && (trip.home.id === id ? trip.home : trip.away.id === id ? trip.away : undefined);
    if (side) return Promise.resolve(side);
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
        this.prefetchFailures.delete(id);
        if (this.pending?.abort === abort) this.pending = undefined;
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
    const trip = this.foodTrip;
    if (trip && this.id !== trip.home.id && this.id !== trip.away.id) this.walkGatherer(this.runtime.engine.state.clock);
    const { player, manifest } = this.runtime.engine.state;
    const p = player.pos;
    this.approach = undefined;
    const half = manifest.setting!.playableMap!.size / 2;
    const routeEnd = this.runtime.route.at(-1);
    if (!this.runtime.timeTravelLocked && surveyingEdges(this.runtime.engine.world)) {
      const target = routeEnd ?? p;
      const nearest = Object.entries(borderDistances(target, half)).sort((a, b) => a[1] - b[1])[0];
      surveyMapEdges(this.runtime.engine.world, p.space === "outside" && nearest[1] < 64 ? nearest[0] : undefined);
    }
    if (p.space !== "outside") return;
    if (
      this.arrival &&
      Math.hypot(p.x - this.arrival.x, p.y - this.arrival.y) > 4
    )
      this.arrival = undefined;
    // Phones cannot hold a second SettlementWorld or spawn another world-worker
    // while playing; neighboring maps load on demand when the player crosses.
    if (smallMemoryDevice()) return;
    const distance = borderDistances(p, half);
    const routeDistance = routeEnd && borderDistances(routeEnd, half);
    const heading = ["N", "E", "S", "W"][player.direction];
    let best = 48;
    let bestRoute = 2;
    let routeEntrance: MapEntrance | undefined;
    for (const entrance of this.entrances) {
      if (!entrance.point || !entrance.walkable || entrance.id === this.arrival?.id) continue;
      const side = (entrance.seam?.side ?? entrance.bearing) as keyof typeof distance;
      const routeEdge = routeDistance?.[side];
      if (routeEdge !== undefined && routeEdge >= 0 && routeEdge < bestRoute) {
        routeEntrance = entrance;
        bestRoute = routeEdge;
      }
      const edge = distance[side];
      const score = (edge ?? Math.hypot(p.x - entrance.point.x, p.y - entrance.point.y))
        - (side === heading ? 16 : 0);
      if (score >= best) continue;
      this.approach = { entrance, from: p };
      best = score;
    }
    if (routeEntrance && routeEnd) this.approach = { entrance: routeEntrance, from: routeEnd };
    const worker = surveyingEdges(this.runtime.engine.world) ? undefined : this.gatherer();
    const search = this.foodSearch;
    const edge = worker && this.entrances.filter(e => e.walkable && e.point && e.path.length > 1 && !search!.tried.has(e.to) && !this.prefetchFailures.has(e.to))
      .sort((a,b) => a.path.length-b.path.length)[0];
    const id = this.approach?.entrance.to ?? edge?.to;
    if (worker && search) {
      if (!edge) this.foodDay.set(this.id,search.day);
      else if (id && !search.tried.has(id) && this.staged?.id === id) {
        search.tried.add(id);
        if (this.startGathering(this.staged,worker) || search.tried.size >= 3) this.foodDay.set(this.id,search.day);
      }
    }
    if (!id || this.staged?.id === id || this.pending?.id === id || this.prefetchFailures.has(id)) return;
    const pending = this.load(id);
    const signal = this.pending?.abort.signal;
    void pending.catch(() => {
      if (!signal?.aborted) this.prefetchFailures.add(id);
    });
  }
  landing() {
    const { approach, staged } = this;
    if (this.closed || this.busy || !staged || approach?.entrance.to !== staged.id) return;
    const { player } = this.runtime.engine.state;
    if (player.pos.space !== "outside") return;
    const half = staged.engine.state.manifest.setting!.playableMap!.size / 2;
    const point = acrossBorder(approach.entrance.bearing, approach.from, half);
    if (point) return { point, world: staged.engine.world };
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
    if (!entrance && this.pendingSide(side)) return "Finding the crossing on this border…";
    const exit = this.exits.find((e) => e.id === entrance?.id);
    const direction = { N: "north", E: "east", S: "south", W: "west" }[side];
    return exit
      ? `Continue ${direction} to ${exit.name}`
      : "Follow another border to an overland crossing.";
  }

  private pendingSide(side: string) {
    const world = this.runtime.engine.world, map = world.pack.setting?.playableMap;
    return surveyingEdges(world) && map?.exits.some(e =>
      (e.seam?.side ?? e.bearing).includes(side) && !this.entrances.some(done => done.id === e.id));
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
        if (this.pendingSide(side)) {
          surveyMapEdges(this.runtime.engine.world, side);
          this.runtime.notice = "Finding the crossing on this border…";
        } else this.runtime.notice = "No overland connection on this border. Follow another edge.";
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
    if (this.runtime.engine.state.encounter) { this.runtime.notice = "Answer the encounter before leaving."; this.runtime.emit(); return; }
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
      const across = acrossBorder(exit.bearing, from, half);
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
    this.walkGatherer(this.runtime.engine.state.clock);
    const source = this.runtime.engine.snapshot();
    const player = structuredClone(source.player);
    player.identity ??= {
      seed: source.manifest.seed,
      setting: source.manifest.setting,
      concern: this.runtime.engine.world.pack.concern,
    };
    const household = source.households?.find((h) =>
      h.members.includes(player.id) && (!player.householdId || h.id === player.householdId));
    if (household) player.identity.household = {
      size: household.members.length,
      people: source.actors.filter((a) => player.relations?.some((r) => r.other === a.id))
        .map(({ id, name, age }) => ({ id, name, age })),
    };
    if (!player.identity.holdings || player.identity.holdings.map === this.id) {
      // The pen is only in the snapshot once the player has been near it.
      const herd = [...(source.fauna ?? []), ...(this.runtime.engine.world.fauna?.(player.home.x, player.home.y) ?? [])]
        .find((g) => g.owner === "player" && g.members.length);
      player.identity.holdings = {
        map: this.id,
        home: { x: player.home.x, y: player.home.y },
        herd: herd && { species: herd.speciesId, count: herd.members.length, at: { x: herd.pos.x, y: herd.pos.y } },
      };
    }
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
    if (smallMemoryDevice())
      while (this.visited.size > 4)
        this.visited.delete(this.visited.keys().next().value!);
    const trip = this.foodTrip;
    const side = trip && (trip.home.id === this.id ? trip.home : trip.away.id === this.id ? trip.away : undefined);
    if (side) {
      side.engine.state = source;
      const resident = source.actors.find(a => a.id === trip!.worker.id);
      if (resident) trip!.worker = resident;
    }
    delete player.drivingVehicle;
    if (player.riding) delete player.riding.groupId;
    player.pos = { ...point, space: "outside" };
    player.home = next.player.home;
    player.work = next.player.work;
    for (const h of next.households ?? [])
      if (h.id !== player.householdId) h.members = h.members.filter((id) => id !== player.id);
    player.goal = undefined;
    for (const object of carried) object.pos = { ...player.pos };
    next.player = player;
    next.objects = next.objects
      .filter((o) => !carried.some((c) => c.id === o.id))
      .concat(carried);
    next.clock = source.clock + seconds;
    next.manifest.sky = skySeed(source.manifest);
    next.manifest.hazards = source.manifest.hazards;
    next.manifest.survival = source.manifest.survival;
    const generatedDisease = next.manifest.disease;
    next.manifest.disease = source.manifest.disease;
    if (!source.manifest.disease && generatedDisease) {
      next.ailments = seedAilments(next, destination.engine.world.pack.setting, new Set(Object.values(next.plot?.cast ?? {})));
      delete next.disease;
      for (const a of next.actors) delete a.medicalStock;
    }
    next.ailments = [...(next.ailments ?? []).filter((a) => a.who !== "player"), ...(source.ailments ?? []).filter((a) => a.who === "player").map((a) => ({ ...a }))];
    if (source.disease) next.disease = {
      serial: source.disease.serial,
      events: structuredClone(source.disease.events),
      sources: next.disease?.sources ?? [],
      exposures: [...(next.disease?.exposures ?? []).filter((e) => e.who !== "player"), ...source.disease.exposures.filter((e) => e.who === "player").map((e) => ({ ...e }))],
    };
    next.care = source.care?.who === "player" ? { ...source.care } : undefined;
    if (seconds > 0 && source.manifest.disease) destination.engine.healthStep(next.clock, false);
    destination.engine.runEconomy();
    next.notes = source.notes;
    next.catalog = { ...next.catalog, ...source.catalog };
    next.ledger = source.ledger;
    next.narration = source.narration;
    next.plot = source.plot;
    next.introduced = source.introduced;
    next.lifeAim = source.lifeAim;
    this.visited.delete(to);
    this.id = to;
    this.entered.add(to);
    this.walkGatherer(next.clock);
    this.staged = undefined;
    this.runtime.replace(destination.engine, true);
  }
  /** A long journey the player does not walk: the map at the far end is
   * prepared and the days on the road pass at once. */
  async voyage(to: Coordinate, rail?: { departs: number; label: string }) {
    if (this.runtime.engine.state.encounter) { this.runtime.notice = "Answer the encounter before leaving."; this.runtime.emit(); return; }
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
    this.runtime.notice = rail ? `Aboard the ${rail.label}…` : "Setting out…";
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
      let point = world.blocked(aim.x, aim.y, "outside") ? world.spawn : aim;
      let seconds = plan.days * 86400;
      let told = `After ${plan.days} day${plan.days === 1 ? "" : "s"} on the road${plan.sea ? " and at sea" : ""}, you reach ${permanentMap(id, this.year).name}.`;
      if (rail) {
        // From the moment the train pulls out, at the line's pace; off onto
        // the platform at the far end, where there is one.
        const hours = plan.land / railSpeed(this.year);
        seconds = Math.max(0, rail.departs - this.runtime.engine.state.clock) + Math.round(hours * 3600);
        const s = world as SettlementWorld;
        const at = s.planAt?.(Math.round(world.spawn.x), Math.round(world.spawn.y)) ?? s.planAt?.(0, 0);
        const station = at?.railway?.station;
        const name = permanentMap(id, this.year).name;
        const setting = destination.engine.state.manifest.setting;
        if (station && at && setting) {
          const p = station.platform;
          point = { x: p.x + (p.w >> 1), y: p.y + (p.h >> 1) };
          // Off the train that brings them: the first to stand at this
          // platform once the journey is run.
          const due = this.runtime.engine.state.clock + seconds;
          const runs = timetable(destination.engine.state.manifest.seed, at.site.id, setting, at.railway!)
            .filter((r) => r.dwell);
          const day = Math.floor(due / DAY);
          const next = [day, day + 1]
            .flatMap((d) => runs.map((r) => d * DAY + r.at + 40))
            .filter((t) => t >= due)
            .sort((a, b) => a - b)[0];
          if (next !== undefined) seconds = next - this.runtime.engine.state.clock;
        }
        const m = Math.max(10, Math.round((hours * 60) / 10) * 10);
        const took = m < 60 ? `${m} minutes` : `${Math.floor(m / 60)} hour${m >= 120 ? "s" : ""}${m % 60 ? ` and ${m % 60} minutes` : ""}`;
        told = station
          ? `After ${took} on the train, you step down onto the platform at ${name}.`
          : `After ${took} on the train and the last miles on foot, you reach ${name}.`;
      }
      this.arrive(destination, id, point, seconds);
      this.arrival = undefined;
      destination.engine.grantXp("wayfaring", 40 + Math.round(seconds / 8640));
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
  /** What the traveller left on the map they set out from, and the walk back
   * to it from where they stand. */
  away() {
    const p = this.runtime.engine.state.player,
      h = p.identity?.holdings;
    if (!h || h.map === this.id) return undefined;
    const here = tileCentre(this.id),
      there = tileCentre(h.map),
      a = toAtlas(here.lon, here.lat),
      b = toAtlas(there.lon, there.lat),
      to = h.herd?.at ?? h.home;
    const dx = b.x + to.x - a.x - (p.pos.space === "outside" ? p.pos.x : 0),
      dy = b.y + to.y - a.y - (p.pos.space === "outside" ? p.pos.y : 0);
    const bearing = ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"][
      (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8
    ];
    // Two seconds a cell is the engine's walk; a third more for the way not being straight.
    const seconds = Math.max(300, Math.round((Math.hypot(dx, dy) * 2 * 1.3) / 300) * 300);
    const m = seconds / 60;
    const time = m < 90 ? `${m} minutes` : `${Math.round(m / 30) / 2} hours`;
    return { ...h, name: permanentMap(h.map, this.year).name, to, bearing, seconds, time };
  }
  /** Walks back to the herd or the house left behind, unplayed. */
  async goBack() {
    const away = this.away();
    if (!away || this.busy || this.closed) return;
    if (this.runtime.engine.state.encounter) { this.runtime.notice = "Answer the encounter before leaving."; this.runtime.emit(); return; }
    this.busy = true;
    this.runtime.stop(false);
    this.runtime.notice = "Setting out…";
    this.runtime.emit(false);
    try {
      const destination = await this.load(away.map);
      if (this.closed) return;
      const world = destination.engine.world;
      // Outside the pen, at its gate: the side of the gate away from the animals.
      const state = destination.engine.state,
        herd = [...(state.fauna ?? []), ...(world.fauna?.(away.to.x, away.to.y) ?? [])].find((g) => g.owner === "player"),
        gate = state.objects.find((o) => o.id === herd?.gateId)?.pos ?? away.to;
      const point = [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 2], [2, 0], [0, -2], [-2, 0]]
        .map(([x, y]) => ({ x: gate.x + x, y: gate.y + y }))
        .filter((q) => !world.blocked(q.x, q.y, "outside"))
        .sort((a, b) => Math.hypot(b.x - away.to.x, b.y - away.to.y) - Math.hypot(a.x - away.to.x, a.y - away.to.y))[0] ?? world.spawn;
      this.arrive(destination, away.map, point, away.seconds);
      this.arrival = undefined;
      const told = `After ${away.time} on foot, you are back at ${away.name}.`;
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
    if (this.foodTrip) { delete this.foodTrip.home.engine.world.outing; delete this.foodTrip.away.engine.world.outing; this.foodTrip = undefined; }
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
