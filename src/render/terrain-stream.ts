import { usesLivingWater } from "./living-water/game";
import { takeTerrainWorker } from "../runtime/terrain-worker-owner";
import { ensureWaterAtlas } from "./water-motifs";
import type Phaser from "phaser";
import type { WorldModel } from "../core/types";
import { drawTopography } from "./topography";
import { drawContourLayers, type TerrainReceivers } from "./terrain-contours";
import {
  TERRAIN_CHUNK_SIZE as SIZE,
  TERRAIN_CHUNK_PAD as PAD,
  type TerrainRegion,
} from "./terrain-region";
import type { TerrainRequest, TerrainResponse } from "./terrain-worker";
import { groundStyle, setGroundStyle, type GroundStyle } from "./ground-style";
import { rasterBankShadows } from "./bank-shadows";
import type { TopographyCell } from "../core/topography";
import type { PreparedSettlement } from "../world/v3/prepared";

type Chunk = {
  region: TerrainRegion;
  objects: Phaser.GameObjects.GameObject[];
  textures: string[];
  rims: Int16Array;
  receivers?: TerrainReceivers;
  cells: TopographyCell[];
  shade: Phaser.GameObjects.Image[];
};
/** One rasterising worker and the chunk it is busy with, if any. */
type Rasterizer = { worker: Worker; busy?: string };
export type SunPhase = {
  id: string;
  cast: readonly [number, number];
  opacity: number;
};
/** Two extra rasterisers doubles throughput; each one holds its own copy of
 * the world, and past three they mostly compete for the same cores. */
const WORKER_LIMIT = Math.min(
  3,
  Math.max(1, (navigator.hardwareConcurrency ?? 4) - 1),
);
const NO_SUN: SunPhase = { id: "night", cast: [0, 0], opacity: 0 };
/** Rasterize off-thread, install one small chunk per frame, retain a bounded
 * ring for backtracking. Neither movement nor lighting re-rasterizes terrain. */
export class TerrainStream {
  private pool: Rasterizer[] = [];
  private chunks = new Map<string, Chunk>();
  private wanted = new Map<string, TerrainRegion>();
  private completed: TerrainResponse[] = [];
  /** Resent to every worker spawned later, and on restyle. */
  private styling: Extract<TerrainRequest, { style: GroundStyle | null }>;
  private started = performance.now();
  private loaded = false;
  private dirty = true;
  private queue: [string, TerrainRegion][] = [];
  private count = 0;
  /** Bumped on restyle; responses rasterised under an older style are dropped. */
  private generation = 0;
  private maxInstall = 0;
  private maxGroundInstall = 0;
  private batchedTiles = 0;
  private center = { x: 0, y: 0 };
  private reach = { x: 0, y: 0 };
  private sun: SunPhase = NO_SUN;
  /** The reach WorldScene asked for, before any lab cap. */
  private asked = { x: 0, y: 0 };
  constructor(
    private scene: Phaser.Scene,
    private world: WorldModel,
    private seed: string,
  ) {
    ensureWaterAtlas(scene);
    const retained = takeTerrainWorker(world);
    const first: Rasterizer = {
      worker:
        retained ??
        new Worker(new URL("../world/worker.ts", import.meta.url), {
          type: "module",
        }),
    };
    this.listen(first);
    if (!retained)
      first.worker.postMessage({
        pack: world.pack,
        seed,
      } satisfies TerrainRequest);
    // A retained worker may still hold the previous scene's style.
    this.styling = {
      style: groundStyle() ?? null,
      living: usesLivingWater(scene),
      polish: (
        scene as Phaser.Scene & {
          options: import("./appearance").RenderOptions;
        }
      ).options.shorePolish,
    };
    first.worker.postMessage(this.styling);
    this.pool.push(first);
    live.add(this);
  }
  private listen(r: Rasterizer) {
    const canvas = this.scene.game.canvas;
    r.worker.onmessage = ({ data }) => {
      r.busy = undefined;
      if (data.error) {
        canvas.dataset.terrainError = data.error;
        return;
      }
      this.completed.push(data);
    };
    r.worker.onerror = (event) => {
      r.busy = undefined;
      canvas.dataset.terrainError = event.message;
    };
  }
  /** Grow only once there is a backlog worth splitting: a still camera should
   * not pay for a second world. */
  private grow() {
    const prepare = (this.world as { prepare?: () => PreparedSettlement })
      .prepare;
    if (this.pool.length >= WORKER_LIMIT || !prepare) return;
    const r: Rasterizer = {
      worker: new Worker(new URL("../world/worker.ts", import.meta.url), {
        type: "module",
      }),
    };
    this.listen(r);
    r.worker.postMessage({
      pack: this.world.pack,
      seed: this.seed,
      prepared: prepare.call(this.world),
    } satisfies TerrainRequest);
    r.worker.postMessage(this.styling);
    this.pool.push(r);
  }
  private inFlight(id: string) {
    return this.pool.some((r) => r.busy === id);
  }
  /** Hand queued chunks to every idle worker. */
  private dispatch() {
    if (this.queue.length >= 3) this.grow();
    for (const r of this.pool) {
      if (r.busy) continue;
      while (
        this.queue.length &&
        (this.chunks.has(this.queue[0][0]) || this.inFlight(this.queue[0][0]))
      )
        this.queue.shift();
      const next = this.queue.shift();
      if (!next) return;
      const [id, region] = next;
      r.busy = id;
      r.worker.postMessage({
        id: `${this.generation}:${id}`,
        region,
      } satisfies TerrainRequest);
    }
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
        const size = this.world.pack.setting?.playableMap?.size;
        if (
          size !== undefined &&
          (cx * SIZE >= size / 2 + PAD ||
            (cx + 1) * SIZE < -size / 2 - PAD ||
            cy * SIZE >= size / 2 + PAD ||
            (cy + 1) * SIZE < -size / 2 - PAD)
        )
          continue;
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
      .filter(([id]) => !this.chunks.has(id) && !this.inFlight(id))
      .sort(([, a], [, b]) => this.priority(a) - this.priority(b));
    this.dirty = true;
    this.metrics();
  }
  update() {
    if (!this.completed.length && !this.queue.length) return;
    const start = performance.now();
    // Keep installation bounded while workers prepare the next chunks.
    const done = this.completed.shift();
    if (done) {
      const {
        id,
        layers,
        cells,
        bridges,
        waterTiles,
        groundTiles,
        groundPage,
        rims,
        receivers,
        living,
      } = done;
      const [gen, key] = id.split(":");
      const region =
        Number(gen) === this.generation ? this.wanted.get(key) : undefined;
      const id2 = key;
      if (region) {
        const groundStart = performance.now();
        const resources = drawTopography(
          this.scene,
          (x, y) => cells[(y + PAD) * (SIZE + PAD * 2) + x + PAD],
          SIZE,
          SIZE,
          region,
          bridges,
          waterTiles,
          groundTiles,
          living,
          groundPage,
        );
        this.maxGroundInstall = Math.max(
          this.maxGroundInstall,
          performance.now() - groundStart,
        );
        if (groundPage)
          this.batchedTiles += groundPage.tiles.reduce(
            (sum, value) => sum + value,
            0,
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
        const chunk: Chunk = {
          region,
          objects,
          textures,
          rims,
          receivers,
          cells,
          shade: [],
        };
        this.shadeChunk(chunk, id2);
        this.chunks.set(id2, chunk);
        this.count++;
        this.dirty = true;
      }
    }
    this.maxInstall = Math.max(this.maxInstall, performance.now() - start);
    this.dispatch();
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
    canvas.dataset.terrainWorkers = String(this.pool.length);
    canvas.dataset.terrainInstallMaxMs = this.maxInstall.toFixed(1);
    canvas.dataset.terrainGroundInstallMaxMs = this.maxGroundInstall.toFixed(1);
    canvas.dataset.terrainBatchedTiles = String(this.batchedTiles);
    if (ready && !this.loaded) {
      this.loaded = true;
      canvas.dataset.terrainLoadMs = String(
        Math.round(performance.now() - this.started),
      );
    }
  }
  private release(chunk: Chunk) {
    this.unshade(chunk);
    for (const object of chunk.objects) object.destroy();
    for (const key of chunk.textures) this.scene.textures.remove(key);
  }
  private unshade(chunk: Chunk) {
    for (const image of chunk.shade) {
      const key = image.texture.key;
      image.destroy();
      this.scene.textures.remove(key);
    }
    chunk.shade = [];
  }
  /** Bank shadows follow the sun like every other cast shadow. Only the
   * small shadow textures are rebuilt; ground and contour pages are kept. */
  private shadeChunk(chunk: Chunk, id: string) {
    this.unshade(chunk);
    const layers = rasterBankShadows(
      chunk.rims,
      chunk.cells,
      this.sun.cast,
      this.sun.opacity,
      chunk.receivers,
    );
    if (!layers) return;
    for (const layer of layers) {
      const key = `${chunk.region.prefix}-shade-${id}-${this.sun.id}-${layer.row}`;
      const texture = this.scene.textures.createCanvas(
        key,
        layer.width,
        layer.height,
      )!;
      const context = texture.getContext();
      const data = context.createImageData(layer.width, layer.height);
      data.data.set(layer.pixels);
      context.putImageData(data, 0, 0);
      texture.refresh();
      // Just above that row's ground strip (-7), below anything walking.
      chunk.shade.push(
        this.scene.add
          .image(
            chunk.region.x * 16 + layer.x,
            chunk.region.y * 16 + layer.y,
            key,
          )
          .setOrigin(0)
          .setDepth((chunk.region.y + layer.row) * 16 - 6.5),
      );
    }
  }
  setSun(sun: SunPhase) {
    if (sun.id === this.sun.id) return;
    this.sun = sun;
    for (const [id, chunk] of this.chunks) this.shadeChunk(chunk, id);
  }
  /** Drop every rasterised chunk and ask for them again under a new style.
   * Cheaper and far less disruptive than tearing down the whole scene. */
  restyle(style: GroundStyle | null) {
    this.generation++;
    this.styling = { ...this.styling, style };
    for (const r of this.pool) {
      r.worker.postMessage(this.styling);
      // The old-style raster still in flight is dropped on arrival, so the
      // chunk has to look free again or nothing would re-request it.
      r.busy = undefined;
    }
    for (const chunk of this.chunks.values()) this.release(chunk);
    this.chunks.clear();
    this.completed = [];
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
    for (const r of this.pool) r.worker.terminate();
    this.pool = [];
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
