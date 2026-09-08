import type { WorldModel } from "../core/types";
const workers = new WeakMap<WorldModel, Worker>();
export function retainTerrainWorker(world: WorldModel, worker: Worker) {
  workers.set(world, worker);
}
export function takeTerrainWorker(world: WorldModel) {
  const worker = workers.get(world);
  workers.delete(world);
  return worker;
}
export function releaseTerrainWorker(world: WorldModel) {
  takeTerrainWorker(world)?.terminate();
}
