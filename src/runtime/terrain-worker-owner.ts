import type { WorldModel } from "../core/types";
import type { PreparedSettlement } from "../world/v3/prepared";
import type { TerrainRequest } from "../render/terrain-worker";
import { TERRAIN_CHUNK_PAD as PAD, TERRAIN_CHUNK_SIZE as SIZE } from "../render/terrain-region";
import { tellMemory, workerBudget } from "./device";
const workers = new WeakMap<WorldModel, Worker>();
const spares = new WeakMap<WorldModel, Worker[]>();
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
export function releaseTerrainWorker(world: WorldModel) {
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
    const worker = tellMemory(new Worker(new URL("../world/worker.ts", import.meta.url), { type: "module" }));
    worker.postMessage({ pack: world.pack, temporal: world.temporal, seed, prepared } satisfies TerrainRequest);
    worker.postMessage(ground);
    started.push(worker);
  }
  if (started.length) spares.set(world, started);
  retained.postMessage(ground);
}
