import { CHUNK_SIZE, type Terrain } from "../core/types";
import type { WorldSetting } from "../content/geography/types";
import { stateHash } from "../core/random";
import type { ChunkRequest } from "../world/worker";
/** The worker is a disposable cache. Its completion order cannot alter the world. */
export class ChunkCache {
  private worker?: Worker;
  private cache = new Map<string, Terrain[]>();
  private pending = new Set<string>();
  private worldKey = "";
  private regionKey = "";
  constructor(private enabled = true) {}
  private ensureWorker() {
    if (!this.worker && this.enabled && typeof Worker !== "undefined") {
      this.worker = new Worker(new URL("../world/worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (
        event: MessageEvent<{ id: string; tiles?: Terrain[] }>,
      ) => {
        const { id, tiles } = event.data;
        this.pending.delete(id);
        if (!id.startsWith(this.worldKey + "|") || !tiles) return;
        this.cache.set(id, tiles);
        while (this.cache.size > 25)
          this.cache.delete(this.cache.keys().next().value!);
      };
    }
  }
  prefetch(
    packId: string,
    seed: string,
    x: number,
    y: number,
    setting?: WorldSetting,
    generator: 1 | 2 | 3 = setting ? 2 : 1,
  ) {
    this.ensureWorker();
    const key = `${generator}:${packId}:${seed}:${setting ? stateHash(setting) : "v1"}`;
    if (key !== this.worldKey) {
      this.worldKey = key;
      this.cache.clear();
      this.pending.clear();
      this.regionKey = "";
    }
    const cx = Math.floor(x / CHUNK_SIZE),
      cy = Math.floor(y / CHUNK_SIZE),
      region = `${key}|${cx},${cy}`;
    if (region === this.regionKey) return;
    this.regionKey = region;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const id = `${key}|${cx + dx},${cy + dy}`;
        if (this.cache.has(id) || this.pending.has(id) || !this.worker)
          continue;
        this.pending.add(id);
        this.worker.postMessage({
          id,
          packId,
          seed,
          setting,
          generator,
          cx: cx + dx,
          cy: cy + dy,
        } satisfies ChunkRequest);
      }
  }
  at(x: number, y: number) {
    const cx = Math.floor(x / CHUNK_SIZE),
      cy = Math.floor(y / CHUNK_SIZE),
      data = this.cache.get(`${this.worldKey}|${cx},${cy}`);
    return data?.[(y - cy * CHUNK_SIZE) * CHUNK_SIZE + x - cx * CHUNK_SIZE];
  }
  dispose() {
    this.worker?.terminate();
    this.worker = undefined;
    this.cache.clear();
    this.pending.clear();
  }
}
