import { takeTerrainWorker } from "../runtime/terrain-worker-owner";
import { ensureWaterAtlas } from "./water-motifs";
import type Phaser from "phaser";
import type { WorldModel } from "../core/types";
import { drawTopography } from "./topography";
import { drawContourLayers } from "./terrain-contours";
import {
  TERRAIN_CHUNK_SIZE as SIZE,
  TERRAIN_CHUNK_PAD as PAD,
  type TerrainRegion,
} from "./terrain-region";
import type { TerrainRequest, TerrainResponse } from "./terrain-worker";
import { groundStyle, setGroundStyle, type GroundStyle } from "./ground-style";

type Chunk = {
  region: TerrainRegion;
  objects: Phaser.GameObjects.GameObject[];
  textures: string[];
};
/** Rasterize off-thread, install one small chunk per frame, retain a bounded
 * ring for backtracking. Neither movement nor lighting re-rasterizes terrain. */
export class TerrainStream {
  private worker: Worker;
  private chunks = new Map<string, Chunk>();
  private wanted = new Map<string, TerrainRegion>();
  private pending?: string;
  private completed?: TerrainResponse;
  private started = performance.now();
  private loaded = false;
  private dirty = true;
  private queue: [string, TerrainRegion][] = [];
  private count = 0;
  /** Bumped on restyle; responses rasterised under an older style are dropped. */
  private generation = 0;
  private maxInstall = 0;
  private center = { x: 0, y: 0 };
  private reach = { x: 0, y: 0 };
  /** The reach WorldScene asked for, before any lab cap. */
  private asked = { x: 0, y: 0 };
  constructor(
    private scene: Phaser.Scene,
    world: WorldModel,
    seed: string,
  ) {
    ensureWaterAtlas(scene);
    const retained = takeTerrainWorker(world);
    this.worker =
      retained ??
      new Worker(new URL("../world/worker.ts", import.meta.url), {
        type: "module",
      });
    if (!retained)
      this.worker.postMessage({
        pack: world.pack,
        seed,
      } satisfies TerrainRequest);
    this.worker.onmessage = ({ data }) => {
      if (data.error) {
        scene.game.canvas.dataset.terrainError = data.error;
        this.pending = undefined;
        return;
      }
      this.completed = data;
    };
    // A retained worker may still hold the previous scene's style.
    this.worker.postMessage({
      style: groundStyle() ?? null,
    } satisfies TerrainRequest);
    live.add(this);
    this.worker.onerror = (event) => {
      scene.game.canvas.dataset.terrainError = event.message;
    };
  }
  setView(x: number, y: number, halfX: number, halfY: number) {
    this.asked = { x: halfX, y: halfY };
    if (reachLimit) {
      halfX = Math.min(halfX, reachLimit);
      halfY = Math.min(halfY, reachLimit);
    }
    if (
      this.center.x === x &&
      this.center.y === y &&
      this.reach.x === halfX &&
      this.reach.y === halfY &&
      this.wanted.size
    )
      return;
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
    this.queue = [...this.wanted]
      .filter(([id]) => !this.chunks.has(id))
      .sort(([, a], [, b]) => this.priority(a) - this.priority(b));
    this.dirty = true;
    this.metrics();
  }
  update() {
    if (!this.completed && (this.pending || !this.queue.length)) return;
    const start = performance.now();
    if (this.completed) {
      const { id, layers, cells, bridges, waterTiles, groundTiles } =
        this.completed;
      this.completed = undefined;
      this.pending = undefined;
      const [gen, key] = id.split(":");
      const region =
        Number(gen) === this.generation ? this.wanted.get(key) : undefined;
      const id2 = key;
      if (region) {
        const resources = drawTopography(
          this.scene,
          (x, y) => cells[(y + PAD) * (SIZE + PAD * 2) + x + PAD],
          SIZE,
          SIZE,
          region,
          bridges,
          waterTiles,
          groundTiles,
        );
        drawContourLayers(this.scene, layers, region.prefix, resources);
        const { objects, textures } = resources;
        for (const object of objects) {
          const o = object as Phaser.GameObjects.Image;
          o.x += region.x * 16;
          o.y += region.y * 16;
          // All ground pages share the lowest plane; logical row determines
          // the overlap of lifted tiles at adjacent chunk boundaries.
          o.depth += region.y * 16;
        }
        this.chunks.set(id2, {
          region,
          objects,
          textures,
        });
        this.count++;
        this.dirty = true;
      }
    }
    if (!this.pending) {
      while (this.queue.length && this.chunks.has(this.queue[0][0]))
        this.queue.shift();
      const next = this.queue.shift();
      if (next) {
        const [id, region] = next;
        this.pending = id;
        this.worker.postMessage({
          id: `${this.generation}:${id}`,
          region,
        } satisfies TerrainRequest);
      }
    }
    this.maxInstall = Math.max(this.maxInstall, performance.now() - start);
    if (this.dirty) this.metrics();
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
    this.dirty = false;
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
  /** Drop every rasterised chunk and ask for them again under a new style.
   * Cheaper and far less disruptive than tearing down the whole scene. */
  restyle(style: GroundStyle | null) {
    this.generation++;
    this.worker.postMessage({ style } satisfies TerrainRequest);
    for (const chunk of this.chunks.values()) this.release(chunk);
    this.chunks.clear();
    this.pending = undefined;
    this.completed = undefined;
    // Keep `wanted`: WorldScene only calls setView when the camera moves, so
    // clearing it would leave a still preview with nothing to re-request.
    this.queue = [...this.wanted].sort(
      ([, a], [, b]) => this.priority(a) - this.priority(b),
    );
    this.dirty = true;
  }
  /** Re-plan the view after the lab changes how far terrain may stream. */
  replan() {
    this.reach = { x: -1, y: -1 };
    this.setView(this.center.x, this.center.y, this.asked.x, this.asked.y);
  }
  dispose() {
    live.delete(this);
    this.worker.terminate();
    for (const chunk of this.chunks.values()) this.release(chunk);
    this.chunks.clear();
  }
}

const live = new Set<TerrainStream>();
let reachLimit = 0;

/** Lab-only: cap how far terrain streams from the camera, in cells. 0 lifts it. */
export function setTerrainReach(cells: number) {
  if (reachLimit === cells) return;
  reachLimit = cells;
  for (const stream of live) {
    stream.replan();
    stream.restyle(groundStyle() ?? null);
  }
}

/** Lab-facing entry point: restyle every terrain surface in one call, on both
 * the main thread and the worker that rasterises chunks off it. */
export function restyleTerrain(style: GroundStyle | null) {
  setGroundStyle(style ?? undefined);
  for (const stream of live) stream.restyle(style);
}
