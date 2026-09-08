import { ensureWaterAtlas } from "./water-motifs";
import type Phaser from "phaser";
import type { Pack } from "../core/types";
import { drawTopography } from "./topography";
import { drawContourLayers } from "./terrain-contours";
import {
  TERRAIN_CHUNK_SIZE as SIZE,
  TERRAIN_CHUNK_PAD as PAD,
  type TerrainRegion,
} from "./terrain-region";
import type { TerrainRequest, TerrainResponse } from "./terrain-worker";

type Chunk = {
  region: TerrainRegion;
  objects: Phaser.GameObjects.GameObject[];
  textures: string[];
};
/** Rasterize off-thread, install one small chunk per frame, retain a bounded
 * ring for backtracking. Neither movement nor lighting re-rasterizes terrain. */
export class TerrainStream {
  private worker = new Worker(new URL("../world/worker.ts", import.meta.url), {
    type: "module",
  });
  private chunks = new Map<string, Chunk>();
  private wanted = new Map<string, TerrainRegion>();
  private pending?: string;
  private completed?: TerrainResponse;
  private started = performance.now();
  private loaded = false;
  private count = 0;
  private maxInstall = 0;
  private center = { x: 0, y: 0 };
  private reach = { x: 0, y: 0 };
  constructor(
    private scene: Phaser.Scene,
    pack: Pack,
    seed: string,
  ) {
    ensureWaterAtlas(scene);
    this.worker.postMessage({ pack, seed } satisfies TerrainRequest);
    this.worker.onmessage = ({ data }) => {
      if (data.error) {
        scene.game.canvas.dataset.terrainError = data.error;
        this.pending = undefined;
        return;
      }
      this.completed = data;
    };
    this.worker.onerror = (event) => {
      scene.game.canvas.dataset.terrainError = event.message;
    };
  }
  setView(x: number, y: number, halfX: number, halfY: number) {
    this.center = { x, y };
    this.reach = { x: halfX, y: halfY };
    this.wanted.clear();
    // One chunk of lookahead covers >2 seconds of walking. The topographic
    // projection can reveal tiles below the ordinary viewport as well.
    for (
      let cy = Math.floor((y - halfY) / SIZE) - 1;
      cy <= Math.floor((y + halfY + 4) / SIZE) + 1;
      cy++
    )
      for (
        let cx = Math.floor((x - halfX) / SIZE) - 1;
        cx <= Math.floor((x + halfX) / SIZE) + 1;
        cx++
      ) {
        const id = `${cx},${cy}`;
        this.wanted.set(id, {
          x: cx * SIZE,
          y: cy * SIZE,
          prefix: `stream-${id}`,
        });
      }
    for (const [id, chunk] of this.chunks) {
      const r = chunk.region;
      if (
        Math.abs(r.x + SIZE / 2 - x) > halfX + SIZE * 3 ||
        Math.abs(r.y + SIZE / 2 - y) > halfY + SIZE * 3 + 4
      ) {
        this.release(chunk);
        this.chunks.delete(id);
      }
    }
    this.metrics();
  }
  update() {
    const start = performance.now();
    if (this.completed) {
      const { id, layers, cells, bridges, waterTiles } = this.completed;
      this.completed = undefined;
      this.pending = undefined;
      const region = this.wanted.get(id);
      if (region) {
        const before = new Set(this.scene.children.list);
        const textures = new Set(this.scene.textures.getTextureKeys());
        drawTopography(
          this.scene,
          (x, y) => cells[(y + PAD) * (SIZE + PAD * 2) + x + PAD],
          SIZE,
          SIZE,
          region,
          bridges,
          waterTiles,
        );
        drawContourLayers(this.scene, layers, region.prefix);
        const objects = this.scene.children.list.filter((o) => !before.has(o));
        for (const object of objects) {
          const o = object as Phaser.GameObjects.Image;
          o.x += region.x * 16;
          o.y += region.y * 16;
          // All ground pages share the lowest plane; logical row determines
          // the overlap of lifted tiles at adjacent chunk boundaries.
          o.depth += region.y * 16;
        }
        this.chunks.set(id, {
          region,
          objects,
          textures: this.scene.textures
            .getTextureKeys()
            .filter((k) => !textures.has(k)),
        });
        this.count++;
      }
    }
    if (!this.pending) {
      const next = [...this.wanted]
        .filter(([id]) => !this.chunks.has(id))
        .sort(([, a], [, b]) => this.priority(a) - this.priority(b))[0];
      if (next) {
        const [id, region] = next;
        this.pending = id;
        this.worker.postMessage({ id, region } satisfies TerrainRequest);
      }
    }
    this.maxInstall = Math.max(this.maxInstall, performance.now() - start);
    this.metrics();
  }
  private priority(r: TerrainRegion) {
    const dx = Math.abs(r.x + SIZE / 2 - this.center.x),
      dy = Math.abs(r.y + SIZE / 2 - this.center.y);
    return (
      (dx > this.reach.x + SIZE / 2 || dy > this.reach.y + SIZE / 2 + 4
        ? 100000
        : 0) +
      dx * dx +
      dy * dy
    );
  }
  private metrics() {
    const canvas = this.scene.game.canvas;
    const visible = [...this.wanted].filter(
      ([, r]) => this.priority(r) < 100000,
    );
    const ready = visible.every(([id]) => this.chunks.has(id));
    canvas.dataset.terrainReady = String(ready);
    canvas.dataset.terrainPending = String(
      [...this.wanted.keys()].filter((id) => !this.chunks.has(id)).length,
    );
    canvas.dataset.terrainChunkCount = String(this.chunks.size);
    canvas.dataset.terrainChunksBuilt = String(this.count);
    canvas.dataset.terrainInstallMaxMs = this.maxInstall.toFixed(1);
    if (ready && !this.loaded) {
      this.loaded = true;
      canvas.dataset.terrainLoadMs = String(
        Math.round(performance.now() - this.started),
      );
    }
  }
  private release(chunk: Chunk) {
    for (const object of chunk.objects) object.destroy();
    for (const key of chunk.textures) this.scene.textures.remove(key);
  }
  dispose() {
    this.worker.terminate();
    for (const chunk of this.chunks.values()) this.release(chunk);
    this.chunks.clear();
  }
}
