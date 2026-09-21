import type { TerrainReceivers } from "./terrain-contours";
import type { TopographyCell } from "../core/topography";
import { TERRAIN_RISE } from "./terrain-projection";
import { boundaryCasts } from "./fence-pass";
import {
  TERRAIN_CHUNK_SIZE as SIZE,
  TERRAIN_CHUNK_PAD as PAD,
} from "./terrain-region";

const MIN_CAST = 0.45;
export type ShadowLayer = {
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
};

/** Sun-cast shadow of every bank in a chunk, from the rim feet the worker
 * recorded: a wall of height h at ground point G shades the segment from G
 * to G + h·cast, on ground no higher than the wall's foot. Cheap enough to
 * redo on the main thread whenever the lighting phase changes. */
export function rasterBankShadows(
  rims: ArrayLike<number>,
  cells: readonly TopographyCell[],
  cast: readonly [number, number],
  opacity: number,
  receivers?: TerrainReceivers,
  /** Chunk origin in world cells, for the fence posts that also cast here. */
  origin?: { x: number; y: number },
): ShadowLayer[] | undefined {
  let [vx, vy] = cast;
  // Fence posts cast here too, and most farmland is flat: bailing on an empty
  // rim list would leave every post on level ground without a shadow.
  if (opacity <= 0 || (!vx && !vy) || (!rims.length && !origin)) return;
  // A bank is only a few metres tall, so a high sun would leave it with no
  // visible shadow at all. Keep the direction, floor the length.
  const len = Math.hypot(vx, vy);
  if (len < MIN_CAST) {
    vx *= MIN_CAST / len;
    vy *= MIN_CAST / len;
  }
  const R = TERRAIN_RISE;
  const stride = SIZE + PAD * 2;
  let maxTier = 0;
  for (const c of cells) if (c && c.height > maxTier) maxTier = c.height;
  // Screen-space surface map: which tier the topmost ground at a pixel
  // belongs to. Painted in row order so nearer rows cover farther ones,
  // and a wall counts as its own plateau, never as shadable ground.
  const top = -maxTier * R - PAD * 16,
    W = stride * 16,
    H = SIZE * 16 + PAD * 16 - top;
  const map = new Int8Array(W * H).fill(-1);
  const at = (x: number, y: number) => (y - top) * W + x + PAD * 16;
  if (!receivers) for (let y = -PAD; y < SIZE + PAD; y++)
    for (let x = -PAD; x < SIZE + PAD; x++) {
      const c = cells[(y + PAD) * stride + x + PAD];
      if (!c) continue;
      const t = c.bridge ? 0 : c.height;
      const south = cells[(y + 1 + PAD) * stride + x + PAD];
      const s = south ? (south.bridge ? 0 : south.height) : t;
      const sy = y * 16 - t * R,
        end = (y + 1) * 16 - Math.min(s, t) * R;
      for (let py = sy; py < end; py++) {
        if (py < top || py >= top + H) continue;
        map.fill(t, at(x * 16, py), at(x * 16 + 16, py));
      }
    }
  const receiverAt = (x: number, y: number) => {
    if (!receivers || x < receivers.x || y < receivers.y ||
      x >= receivers.x + receivers.width || y >= receivers.y + receivers.height) return -1;
    return (y - receivers.y) * receivers.width + x - receivers.x;
  };
  const tierAt = (x: number, y: number) => receivers
    ? receivers.tiers[receiverAt(x, y)] ?? -1 : map[at(x, y)];
  const alpha = new Uint8Array(W * H);
  const a = Math.round(opacity * 255);
  let x0 = W,
    x1 = -1,
    y0 = H,
    y1 = -1;
  for (let i = 0; i < rims.length; i += 5) {
    const gx = rims[i],
      gy = rims[i + 1],
      drop = rims[i + 2],
      below = rims[i + 3],
      side = rims[i + 4];
    if (side === 1 ? vy <= 0 : side === 2 ? vx >= 0 : vx <= 0) continue;
    const len = drop * Math.hypot(vx, vy);
    const steps = Math.ceil(len);
    for (let k = 0; k <= steps; k++) {
      const s = steps ? k / steps : 0;
      const px = Math.round(gx + vx * drop * s),
        py = Math.round(gy + vy * drop * s);
      if (px < -PAD * 16 || px >= SIZE * 16 + PAD * 16) continue;
      if (py < top || py >= top + H) continue;
      // A two-pixel brush: single-pixel lines from neighbouring rim feet
      // leave diagonal holes between them.
      for (const [bx, by] of [
        [px, py],
        [px + 1, py],
        [px, py + 1],
        [px + 1, py + 1],
      ]) {
        if (bx >= SIZE * 16 + PAD * 16 || by >= top + H) continue;
        const j = at(bx, by);
        const tier = tierAt(bx, by);
        if (tier < 0 || tier > below) continue;
        // Adjacent rim rays share receiver pixels.
        if (a <= alpha[j]) continue;
        alpha[j] = a;
        if (bx < x0) x0 = bx;
        if (bx > x1) x1 = bx;
        if (by < y0) y0 = by;
        if (by > y1) y1 = by;
      }
    }
  }
  // Fences, walls and hedges cast with the same sun, each solid column from
  // its own foot, lifted with the ground it stands on. Only this chunk's own
  // boundaries cast; any boundary in reach masks, so no shadow lies on one.
  const covered = origin ? new Uint8Array(W * H) : undefined;
  if (origin) {
    const cellAt = (cx: number, cy: number) => {
      const lx = cx - origin.x + PAD,
        ly = cy - origin.y + PAD;
      if (lx < 0 || ly < 0 || lx >= stride || ly >= stride) return;
      return cells[ly * stride + lx];
    };
    const lift = (cx: number, cy: number) => {
      const c = cellAt(cx, cy);
      return c && !c.bridge ? c.height * R : 0;
    };
    const ox = origin.x * 16,
      oy = origin.y * 16;
    const inMap = (x: number, y: number) =>
      x >= -PAD * 16 && x < SIZE * 16 + PAD * 16 && y >= top && y < top + H;
    const cast = Math.hypot(vx, vy);
    boundaryCasts(
      (cx, cy) => cellAt(cx, cy)?.field,
      origin.x - PAD + 3,
      origin.y - PAD + 3,
      origin.x + SIZE + PAD - 3,
      origin.y + SIZE + PAD - 3,
      (cx, cy) => {
        if (cx < origin.x || cy < origin.y || cx >= origin.x + SIZE || cy >= origin.y + SIZE)
          return;
        const dz = lift(cx, cy);
        return (fx, fy, h0, h1) => {
          const lx = fx - ox,
            ly = fy - oy - dz;
          if (!inMap(lx, ly)) return;
          const below = tierAt(lx, ly);
          if (!(below >= 0)) return;
          const steps = Math.max(1, Math.ceil((h1 - h0) * cast));
          for (let k = 0; k <= steps; k++) {
            const h = h0 + ((h1 - h0) * k) / steps;
            const px = Math.round(lx + vx * h),
              py = Math.round(ly + vy * h);
            if (!inMap(px, py)) continue;
            const j = at(px, py);
            const tier = tierAt(px, py);
            if (tier < 0 || tier > below || a <= alpha[j]) continue;
            alpha[j] = a;
            if (px < x0) x0 = px;
            if (px > x1) x1 = px;
            if (py < y0) y0 = py;
            if (py > y1) y1 = py;
          }
        };
      },
      (cx, cy) => {
        const dz = lift(cx, cy);
        return (wx, wy) => {
          const lx = wx - ox,
            ly = wy - oy - dz;
          if (inMap(lx, ly)) covered![at(lx, ly)] = 1;
        };
      },
    );
  }
  if (x1 < x0) return;
  // One layer per logical row of the ground it falls on, so it sits above
  // that row's ground strip and below anything standing there.
  const boxes = new Map<number, [number, number, number, number]>();
  const rowOf = (x: number, y: number) =>
    receivers ? receivers.rows[receiverAt(x, y)] : Math.floor((y + map[at(x, y)] * R) / 16);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (!alpha[at(x, y)]) continue;
      const row = rowOf(x, y);
      const b = boxes.get(row) ?? [x, x, y, y];
      b[0] = Math.min(b[0], x);
      b[1] = Math.max(b[1], x);
      b[2] = Math.min(b[2], y);
      b[3] = Math.max(b[3], y);
      boxes.set(row, b);
    }
  const layers: ShadowLayer[] = [];
  for (const [row, [bx0, bx1, by0, by1]] of boxes) {
    const width = bx1 - bx0 + 1,
      height = by1 - by0 + 1,
      pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const sx = bx0 + x,
          sy = by0 + y;
        const v = alpha[at(sx, sy)];
        if (!v || covered?.[at(sx, sy)] || rowOf(sx, sy) !== row) continue;
        const o = (y * width + x) * 4;
        pixels[o] = 28;
        pixels[o + 1] = 35;
        pixels[o + 2] = 42;
        pixels[o + 3] = v;
      }
    layers.push({ row, x: bx0, y: by0, width, height, pixels });
  }
  return layers;
}
