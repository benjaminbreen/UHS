import { surveyEntrances, type MapEntrance } from "../world/travel/entrances";
import type { WorldModel } from "../core/types";
import type { SettlementWorld } from "../world/v3/generate";
import type { PreparedSettlement } from "../world/v3/prepared";
import type { TerrainRequest } from "../render/terrain-worker";
import { TERRAIN_CHUNK_PAD as PAD, TERRAIN_CHUNK_SIZE as SIZE } from "../render/terrain-region";
import { workerBudget } from "./device";
import { worldWorker } from "./world-worker";
const workers = new WeakMap<WorldModel, Worker>();
const spares = new WeakMap<WorldModel, Worker[]>();
const surveys = new WeakMap<WorldModel, {
  start(side?: string): void; inline(): void; cancel(): void;
}>();

export function stageEntranceSurvey(world: WorldModel, routes: MapEntrance[], port?: MessagePort, worker?: Worker) {
  const map = world.pack.setting!.playableMap!;
  let started = false, preferred: string | undefined, cancel: (() => void) | undefined;
  const order = new Map(map.exits.map((e, i) => [e.id, i]));
  const receive = (route: MapEntrance) => {
    if (!routes.some(e => e.id === route.id)) {
      routes.push(route);
      routes.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    }
    if (routes.length === map.exits.length) {
      cancel?.();
      worker?.removeEventListener("error", inline);
      port?.close();
      surveys.delete(world);
    }
  };
  const start = (side?: string) => {
    if (started && preferred === side) return;
    started = true;
    preferred = side;
    if (port) port.postMessage(side ?? null);
    else cancel ??= surveyEntrances(world, map.size, map.exits, receive, () => preferred);
  };
  const stop = () => {
    worker?.removeEventListener("error", inline);
    port?.postMessage(false);
    port?.close();
    port = undefined;
    cancel?.();
  };
  const inline = () => {
    if (!port) return;
    stop();
    if (started) { started = false; start(preferred); }
  };
  if (port) {
    worker?.addEventListener("error", inline);
    port.onmessage = ({ data }: MessageEvent<MapEntrance>) => receive(data);
    port.onmessageerror = inline;
  }
  surveys.set(world, { start, inline, cancel: stop });
}

export const surveyMapEdges = (world: WorldModel, side?: string) => surveys.get(world)?.start(side);
export const surveyingEdges = (world: WorldModel) => surveys.has(world);
export const resumeSurveyInline = (world: WorldModel) => surveys.get(world)?.inline();
export function retainTerrainWorker(world: WorldModel, worker: Worker) {
  workers.set(world, worker);
}
export function peekTerrainWorker(world: WorldModel) {
  return workers.get(world);
}
export function takeTerrainWorker(world: WorldModel) {
  const worker = peekTerrainWorker(world);
  workers.delete(world);
  return worker;
}
export function takeSpareTerrainWorkers(world: WorldModel) {
  const taken = spares.get(world) ?? [];
  spares.delete(world);
  return taken;
}
export function releaseTerrainWorker(world: WorldModel, successor?: WorldModel) {
  const survey = surveys.get(world);
  if (survey) {
    survey.cancel();
    surveys.delete(world);
    const entrances = (world as SettlementWorld).entrances;
    // Living on in a later year can reuse the very same unfinished map.
    if (successor && entrances && entrances === (successor as SettlementWorld).entrances)
      stageEntranceSurvey(successor, entrances());
  }
  takeTerrainWorker(world)?.terminate();
  for (const worker of takeSpareTerrainWorkers(world)) worker.terminate();
}
/** Starts the rest of the terrain pool as soon as a first world exists and has
 * every worker work out the ground around the door. The scene otherwise grew
 * these workers once it was up, and each spent 0.85s loading and 1.5s more on
 * its first chunk than the warm one, which was most of the wait after Enter. */
export function warmTerrainPool(world: WorldModel, seed: string) {
  const retained = peekTerrainWorker(world);
  if (!retained || !world.topography) return;
  const cx = Math.floor(world.spawn.x / SIZE),
    cy = Math.floor(world.spawn.y / SIZE);
  const ground = { ground: { x: (cx - 1) * SIZE - PAD, y: (cy - 1) * SIZE - PAD, size: 3 * SIZE + 2 * PAD } } satisfies TerrainRequest;
  const count = workerBudget() - 1;
  const prepared = count > 0 ? (world as WorldModel & { prepare?(): PreparedSettlement }).prepare?.() : undefined;
  const started: Worker[] = [];
  for (let i = 0; prepared && i < count; i++) {
    const worker = worldWorker();
    worker.postMessage({ pack: world.pack, temporal: world.temporal, seed, prepared } satisfies TerrainRequest);
    worker.postMessage(ground);
    started.push(worker);
  }
  if (started.length) spares.set(world, started);
  retained.postMessage(ground);
}
