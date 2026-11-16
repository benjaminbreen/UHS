import { BED, BRIDGE, BUILDING, DECK, FLOOR, GRAVEL, HEDGE, LAWN, PAVING, WALL, WATER, type FairLevel } from "../../world/fair";
import { h2, Raster } from "../ship/raster";

const GRASS = ["#9cc865", "#7fb24f", "#6a9c43", "#568638", "#41692c"];
const SAND = ["#f0dfb4", "#e2cb98", "#cdb27e", "#b0935f", "#8a7048"];
const STONE = ["#e8e2d4", "#d2cab8", "#b8ae9a", "#978c7a", "#6e6558"];
const HEDGE_G = ["#6f9c4a", "#557f38", "#40662b", "#2f4e22", "#203818"];
const SOIL = ["#8a6448", "#714f38", "#5a3d2c", "#442d22"];
const BLOOM = [["#ff9a8a", "#e8484a", "#a82a3a"], ["#fff0a0", "#f0c840", "#b88a2a"], ["#f4f0ff", "#c8b8f0", "#8a74c0"], ["#ffc8e0", "#e870a8", "#a8406e"]];
const WATER_C = ["#a8dcec", "#78c0dc", "#5aa4c8", "#4686b0", "#356896"];
const IRON_RED = ["#c07a5a", "#a05a40", "#844630", "#5e3022", "#3a1e18"];
const FLOORS = {
  parquet: ["#e0b47c", "#c99a62", "#ad7e4c", "#8a603a", "#5e4028"],
  tile: ["#f0e8d8", "#d8ccb4", "#9a4a3a", "#6e3428", "#3c2a28"],
  boards: ["#d8b888", "#c0a070", "#a4845a", "#806444", "#584430"],
  iron: ["#b8b4ac", "#9c978e", "#7e7970", "#5e5a54", "#3c3a38"],
};
const WALLS = {
  parquet: ["#f4ead4", "#e4d6b8", "#c8b494", "#9a8466", "#6a5644"],
  tile: ["#f0e4cc", "#dccaa8", "#b8a080", "#8a7458", "#5c4c3a"],
  boards: ["#e8dcc0", "#d4c4a0", "#b4a07c", "#8a7858", "#5e5040"],
  iron: ["#c4c8cc", "#a8aeb4", "#888e96", "#646a72", "#40444a"],
};

/** The ground of one fair area, every cell, painted once. */
export function paintFairGround(L: FairLevel, seed: number): Raster {
  const { w, h } = L, R = new Raster(w * 16, h * 16);
  const cell = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : L.cells[y * w + x]);
  const floor = FLOORS[L.floor ?? "parquet"], wallc = WALLS[L.floor ?? "parquet"];
  const indoor = L.kind === "hall" || L.kind === "pavilion" || L.kind === "machines";
  for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
    const c = cell(cx, cy), X = cx * 16, Y = cy * 16;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const x = X + i, y = Y + j, n = h2(x, y, seed);
      let col: string;
      switch (c) {
        case LAWN: case BUILDING: case HEDGE: {
          // Mown turf: quiet base, clusters of lighter blades.
          // Mown stripes, and a few blade clusters, quiet between.
          const tuft = h2(x >> 3, y >> 3, seed + 3), blade = h2(x >> 1, y, seed + 4);
          col = ((y >> 4) % 2 ? GRASS[1] : "#86b853");
          if (tuft > 0.82 && blade > 0.7) col = GRASS[0];
          else if (tuft < 0.1 && blade > 0.75) col = GRASS[2];
          break;
        }
        case GRAVEL: {
          // Raked gravel: an even ground with the odd pebble lit on top.
          const k = h2(x >> 1, y >> 1, seed + 5);
          col = k > 0.96 ? SAND[0] : k < 0.04 ? SAND[3] : k < 0.1 && y % 2 ? SAND[2] : SAND[1];
          break;
        }
        case PAVING: case BRIDGE: {
          const sx = (x + ((y >> 4) % 2) * 8) % 16, sy = y % 16;
          col = sy === 15 || sx === 15 ? STONE[3] : sy === 0 || sx === 0 ? STONE[0] : h2((x + ((y >> 4) % 2) * 8) >> 4, y >> 4, seed) < 0.2 ? STONE[2] : STONE[1];
          break;
        }
        case BED: col = n < 0.3 ? SOIL[0] : n > 0.85 ? SOIL[2] : SOIL[1]; break;
        case WATER: {
          const ripple = Math.sin(x * 0.35 + Math.sin(y * 0.5) * 2) + Math.sin(y * 0.9 + x * 0.05);
          col = ripple > 1.55 ? WATER_C[0] : ripple < -1.2 ? WATER_C[3] : WATER_C[2];
          break;
        }
        case DECK: {
          // Oak planking laid on the iron, with the rail's shadow at the edges.
          const plank = Math.floor(y / 4);
          col = y % 4 === 3 ? FLOORS.boards[3] : h2(plank, (x + plank * 7) >> 4, seed) < 0.15 ? FLOORS.boards[2] : FLOORS.boards[1];
          if ((x + plank * 7) % 16 === 0) col = FLOORS.boards[3];
          break;
        }
        case FLOOR: col = floorPx(L.floor ?? "parquet", x, y, floor); break;
        default: col = indoor ? wallc[3] : L.kind === "platform" ? "#8aa0b8" : HEDGE_G[3];
      }
      R.set(x, y, col);
    }
  }
  // Edges where surfaces meet: a lit lip on paving and a shade where turf meets gravel.
  for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
    const c = cell(cx, cy), X = cx * 16, Y = cy * 16;
    if (c === LAWN && [GRAVEL, PAVING].includes(cell(cx, cy - 1))) R.fill(X, Y, 16, 1, GRASS[3]);
    if (c === LAWN && [GRAVEL, PAVING].includes(cell(cx, cy + 1))) R.fill(X, Y + 15, 16, 1, GRASS[0]);
    if (c === LAWN && [GRAVEL, PAVING].includes(cell(cx - 1, cy))) R.fill(X, Y, 1, 16, GRASS[2]);
    if (c === WATER && cell(cx, cy - 1) !== WATER) {
      R.fill(X, Y, 16, 3, STONE[1]); R.fill(X, Y, 16, 1, STONE[0]); R.fill(X, Y + 3, 16, 2, WATER_C[4]);
    }
    if (c === WATER && cell(cx, cy + 1) !== WATER) { R.fill(X, Y + 13, 16, 3, STONE[2]); R.fill(X, Y + 13, 16, 1, STONE[0]); }
    if (c === WATER && cell(cx - 1, cy) !== WATER) { R.fill(X, Y, 2, 16, STONE[1]); R.fill(X + 2, Y, 1, 16, WATER_C[4]); }
    if (c === WATER && cell(cx + 1, cy) !== WATER) R.fill(X + 14, Y, 2, 16, STONE[2]);
    if (c === BED) flowers(R, X, Y, cx, cy, seed);
    if (c === BRIDGE && cell(cx - 1, cy) !== BRIDGE) parapetV(R, X, Y);
    if (c === BRIDGE && cell(cx + 1, cy) !== BRIDGE) parapetV(R, X + 12, Y);
    if (c === HEDGE) hedge(R, X, Y, cell(cx, cy + 1) !== HEDGE, seed + cx * 7 + cy);
    if (c === DECK && cell(cx, cy + 1) === WALL) rail(R, X, Y + 12);
    if (c === DECK && cell(cx, cy - 1) === WALL) rail(R, X, Y);
    if (c === DECK && cell(cx - 1, cy) === WALL) R.fill(X, Y, 2, 16, IRON_RED[2]);
    if (c === DECK && cell(cx + 1, cy) === WALL) R.fill(X + 14, Y, 2, 16, IRON_RED[3]);
  }
  if (indoor) backWall(R, L, wallc);
  if (L.kind === "platform") paris(R, L, seed);
  return R;
}

function floorPx(kind: keyof typeof FLOORS, x: number, y: number, f: string[]) {
  if (kind === "parquet") {
    // Herringbone: blocks 8 by 2, alternating direction every 8 px.
    const flip = ((x >> 3) + (y >> 3)) % 2, a = flip ? x : y, b = flip ? y : x;
    return a % 2 === 1 && b % 8 === 7 ? f[3] : a % 2 === 1 ? f[2] : h2(x >> 3, y >> 3, 9) < 0.2 ? f[0] : f[1];
  }
  if (kind === "tile") {
    const sx = x % 16, sy = y % 16, d = Math.abs(sx - 7.5) + Math.abs(sy - 7.5);
    return d < 4 ? f[2] : d < 5 ? f[3] : sx === 0 || sy === 0 ? f[1] : f[0];
  }
  if (kind === "iron") return x % 16 === 0 || y % 16 === 0 ? f[3] : (x % 8 === 3 && y % 8 === 3) ? f[0] : (x + y) % 4 === 0 ? f[2] : f[1];
  const plank = Math.floor(x / 6);
  return x % 6 === 5 ? f[3] : (y + plank * 13) % 40 === 0 ? f[3] : h2(plank, 1, 3) < 0.25 ? f[2] : f[1];
}

function flowers(R: Raster, X: number, Y: number, cx: number, cy: number, seed: number) {
  const pal = BLOOM[Math.floor(h2(cx >> 2, cy, seed) * BLOOM.length)];
  for (let j = 2; j < 15; j += 3) for (let i = 1 + (j % 2) * 2; i < 15; i += 4) {
    R.set(X + i, Y + j + 1, GRASS[3]);
    R.set(X + i, Y + j, pal[1]);
    R.set(X + i + 1, Y + j, pal[2]);
    R.set(X + i, Y + j - 1, pal[0]);
  }
}

function parapetV(R: Raster, X: number, Y: number) {
  R.fill(X, Y, 4, 16, STONE[1]);
  R.fill(X, Y, 1, 16, STONE[0]);
  R.fill(X + 3, Y, 1, 16, STONE[3]);
  for (let j = 0; j < 16; j += 8) R.fill(X, Y + j, 4, 1, STONE[2]);
}

function hedge(R: Raster, X: number, Y: number, front: boolean, seed: number) {
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const n = h2((X + i) >> 2, (Y + j) >> 2, seed);
    R.set(X + i, Y + j, n > 0.7 ? HEDGE_G[1] : n < 0.2 ? HEDGE_G[3] : HEDGE_G[2]);
    if (h2(X + i, Y + j, 4) > 0.93) R.set(X + i, Y + j, HEDGE_G[0]);
  }
  if (front) { R.fill(X, Y + 12, 16, 3, HEDGE_G[3]); R.fill(X, Y + 15, 16, 1, HEDGE_G[4]); }
}

function rail(R: Raster, X: number, Y: number) {
  R.fill(X, Y, 16, 4, IRON_RED[2]);
  R.fill(X, Y, 16, 1, IRON_RED[0]);
  for (let i = 0; i < 16; i += 4) R.fill(X + i, Y + 1, 1, 3, IRON_RED[4]);
}

/** The back wall of a hall, three cells tall: a dado, pilasters, a frieze, and high windows. */
function backWall(R: Raster, L: FairLevel, c: string[]) {
  const W = L.w * 16;
  R.fill(0, 0, W, 48, c[1]);
  R.fill(0, 0, W, 6, c[3]);
  R.fill(0, 6, W, 2, c[0]);
  R.fill(0, 36, W, 10, c[2]);
  R.fill(0, 36, W, 1, c[0]);
  R.fill(0, 46, W, 2, c[4]);
  for (let x = 8; x < W - 8; x += 32) {
    R.fill(x, 8, 5, 28, c[0]);
    R.fill(x + 4, 8, 1, 28, c[2]);
    if (x + 30 < W) {
      R.fill(x + 12, 12, 12, 18, "#5a7894");
      R.fill(x + 12, 12, 12, 1, c[3]);
      for (let i = 0; i < 12; i += 4) R.fill(x + 12 + i, 12, 1, 18, c[3]);
      R.fill(x + 13, 13, 3, 6, "#a8c8e0");
      R.fill(x + 12, 30, 12, 1, c[0]);
    }
  }
  // Side walls in shade.
  R.fill(0, 48, 16, L.h * 16 - 48, c[3]);
  R.fill(W - 16, 48, 16, L.h * 16 - 48, c[4]);
  R.fill(14, 48, 2, L.h * 16 - 48, c[2]);
}

/** Through the middle of a Tower platform: Paris, far below, in haze. */
function paris(R: Raster, L: FairLevel, seed: number) {
  let x0 = L.w, y0 = L.h, x1 = 0, y1 = 0;
  for (let y = 1; y < L.h - 1; y++) for (let x = 1; x < L.w - 1; x++) if (L.cells[y * L.w + x] === WALL) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 < x0) return;
  const haze = ["#c4d4dc", "#aebfca", "#98aab8", "#8496a6", "#b8a898", "#9a8c80"];
  for (let y = y0 * 16; y < (y1 + 1) * 16; y++) for (let x = x0 * 16; x < (x1 + 1) * 16; x++) {
    // Blocks of roofs between the boulevards, the Seine across them.
    const bx = Math.floor((x + Math.floor(y / 9) * 3) / 7), by = Math.floor(y / 9);
    const street = x % 23 === 0 || y % 19 === 0;
    const river = Math.abs(y - (y0 * 16 + 30) - Math.sin(x * 0.03) * 8) < 4;
    const k = h2(bx, by, seed);
    R.set(x, y, river ? "#8cb0c4" : street ? haze[0] : k < 0.15 ? "#8aa078" : k < 0.55 ? haze[2] : k < 0.85 ? haze[4] : haze[3]);
  }
  // The girders of the tower framing the drop.
  for (let x = x0 * 16; x < (x1 + 1) * 16; x++) {
    R.set(x, y0 * 16, IRON_RED[1]); R.set(x, y0 * 16 + 1, IRON_RED[3]);
    R.set(x, (y1 + 1) * 16 - 1, IRON_RED[3]);
    if ((x - x0 * 16) % 24 < 2) for (let k = 0; k < 10; k++) R.set(x + k, y0 * 16 + 2 + k, IRON_RED[2]);
  }
  for (let y = y0 * 16; y < (y1 + 1) * 16; y++) { R.set(x0 * 16, y, IRON_RED[2]); R.set((x1 + 1) * 16 - 1, y, IRON_RED[4]); }
}
