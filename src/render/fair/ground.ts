import { BED, BOX, BRIDGE, BUILDING, DECK, FENCE, FLOOR, GRAVEL, HEDGE, LAWN, PAVING, WALL, WATER, type FairLevel } from "../../world/fair";
import { h2, Raster } from "../ship/raster";
import { paintFlag } from "./flags";

/** Cells of ground painted round an area, so its edges never show the void. */
export const PAD = { x: 8, top: 8, bottom: 6 };
// Cells round an interior that are its own building: the roof above the back wall.
const ROOF = 20, SKY = 21;

export const GRASS = ["#b4dc78", "#93c75a", "#7cb24a", "#62983c", "#4a7c30", "#355e24"];
const SAND = ["#f4e8d2", "#e4d4b8", "#d0bc9c", "#b49e80", "#8e7a62"];
const STONE = ["#f0ebe0", "#ddd5c6", "#c8bead", "#ab9f8c", "#82776a"];
const BOXC = ["#8ebe56", "#6ea040", "#548632", "#3e6a26", "#2a4e1c", "#1c3814"];
const CANOPY = ["#78a848", "#5a8c38", "#44722c", "#335a22", "#24441a", "#18301a"];
const SOIL = ["#8c6448", "#704e38", "#563c2c"];
const ROSES = [["#f4e4ff", "#c8a0ec", "#8e64c0"], ["#ffd2dc", "#f48aa8", "#c84a72"], ["#ff9a8a", "#e04848", "#a02838"], ["#fffaf0", "#f0e2c8", "#c8b494"], ["#fff2a8", "#f2c84a", "#c08a28"]];
const WATER_C = ["#c8ecf6", "#94d0e8", "#6cb4da", "#4e96c4", "#3a78a8", "#2c5c88"];
const IRON = ["#7a8490", "#4a525c", "#30363e", "#1e2228"];
const IRON_RED = ["#cc8a66", "#a8603f", "#884a30", "#643424", "#3e2018"];
const GLASS = ["#e4f2f6", "#b8d8e2", "#8cb8c8", "#6a96aa", "#4c7488"];
const FLOORS = {
  parquet: ["#ecc088", "#d8a468", "#c08850", "#9c6a3c", "#704a2a"],
  tile: ["#f4ecdc", "#ddd0b6", "#b4523e", "#88382a", "#4c2e28"],
  boards: ["#e2c492", "#caa874", "#ae8a5c", "#8a6a44", "#5e4830"],
  iron: ["#c8c3ba", "#aaa59c", "#8c877e", "#6a665e", "#46433e"],
};
const WALLS = {
  parquet: ["#fbf3e2", "#efe2c6", "#d8c6a2", "#b4a07e", "#86745a", "#5c4e3c"],
  tile: ["#f8eed8", "#ead8b4", "#d0b890", "#aa9070", "#806a52", "#56463a"],
  boards: ["#f2e6c8", "#e0cea6", "#c4ae84", "#9c8664", "#74624a", "#4e4234"],
  iron: ["#dfe2e4", "#c4cad0", "#a2aab2", "#7e8790", "#5c646c", "#3e444a"],
};
const DADO = ["#a8744c", "#8a5a38", "#6c4428", "#4e301c"];
const RUNNER = ["#d85a48", "#b23e34", "#862a26", "#e8c070"];

const indoorKind = (L: FairLevel) => L.kind === "hall" || L.kind === "pavilion" || L.kind === "machines";

/** The ground of one fair area and the margin round it, painted once. Cell
 * (0, 0) of the area is at pixel (PAD.x * 16, PAD.top * 16). */
export function paintFairGround(L: FairLevel, seed: number): Raster {
  const { w, h } = L, X0 = PAD.x, Y0 = PAD.top;
  const R = new Raster((w + 2 * PAD.x) * 16, (h + PAD.top + PAD.bottom) * 16);
  const indoor = indoorKind(L), door = (w >> 1) - 1;
  const raw = (x: number, y: number) => L.cells[y * w + x];
  const cell = (x: number, y: number): number => {
    if (x >= 0 && y >= 0 && x < w && y < h) return raw(x, y);
    if (L.kind === "platform") return SKY;
    if (!indoor) {
      const c = raw(Math.max(0, Math.min(w - 1, x)), Math.max(0, Math.min(h - 1, y)));
      return c === FENCE || c === BOX || c === BED || c === WATER ? LAWN : c;
    }
    // Round a building: its roof behind, a gravel apron, a forecourt, lawn beyond.
    if (x >= 0 && x < w && y < 0 && y >= -3) return ROOF;
    const d = Math.max(x < 0 ? -x : x >= w ? x - w + 1 : 0, y < -3 ? -3 - y : y >= h ? y - h + 1 : 0);
    if (y >= h && x >= door - 2 && x <= door + 3) return PAVING;
    return d <= 2 ? GRAVEL : LAWN;
  };
  const at = (cx: number, cy: number) => cell(cx - X0, cy - Y0);
  const CW = w + 2 * PAD.x, CH = h + PAD.top + PAD.bottom;
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    const c = at(cx, cy), X = cx * 16, Y = cy * 16;
    switch (c) {
      case LAWN: case BUILDING: case FENCE: lawn(R, X, Y, seed); break;
      case GRAVEL: gravel(R, X, Y, seed); break;
      case PAVING: case BRIDGE: paving(R, X, Y, seed); break;
      case WATER: water(R, X, Y, at, cx, cy); break;
      case BED: lawn(R, X, Y, seed); break;
      case BOX: lawn(R, X, Y, seed); break;
      case HEDGE: lawn(R, X, Y, seed); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) R.shade(X + i, Y + j, 0.22); break;
      case DECK: deck(R, X, Y, seed); break;
      case FLOOR: floor(R, X, Y, L, cx - X0, cy - Y0); break;
      case SKY: break;
      case ROOF: break;
      default: if (indoor) gravel(R, X, Y, seed); else canopy(R, X, Y, seed);
    }
  }
  // Second pass: edges, and the things built on the ground.
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    const c = at(cx, cy), X = cx * 16, Y = cy * 16;
    const n = at(cx, cy - 1), s = at(cx, cy + 1), wv = at(cx - 1, cy), e = at(cx + 1, cy);
    const soft = (k: number) => k === LAWN || k === FENCE || k === BUILDING;
    if (soft(c)) {
      // Turf meeting a walk: a dark cut edge on the turf, light on the walk's far side.
      if (n === GRAVEL || n === PAVING) R.fill(X, Y, 16, 1, GRASS[4]);
      if (s === GRAVEL || s === PAVING) { R.fill(X, Y + 15, 16, 1, GRASS[0]); }
      if (wv === GRAVEL || wv === PAVING) R.fill(X, Y, 1, 16, GRASS[3]);
      if (e === GRAVEL || e === PAVING) R.fill(X + 15, Y, 1, 16, GRASS[0]);
    }
    if ((c === GRAVEL || c === PAVING) && (soft(n) || n === BOX || n === BED)) R.fill(X, Y, 16, 1, SAND[3]), R.fill(X, Y + 1, 16, 2, SAND[2]);
    if (c === GRAVEL && (wv === FENCE || wv === LAWN || wv === BOX)) R.fill(X, Y, 2, 16, SAND[2]);
    if (c === BED) roses(R, X, Y, cx, cy, seed, at);
    if (c === BOX) box(R, X, Y, at, cx, cy, seed);
    if (c === FENCE) fence(R, X, Y, at, cx, cy);
    if (c === BRIDGE && wv !== BRIDGE) balustrade(R, X, Y, false);
    if (c === BRIDGE && e !== BRIDGE) balustrade(R, X + 11, Y, true);
    if (c === DECK) {
      if (s === WALL) rail(R, X, Y + 11);
      if (n === WALL || n === SKY) rail(R, X, Y);
      if (wv === WALL || wv === SKY) R.fill(X, Y, 3, 16, IRON_RED[2]), R.fill(X, Y, 1, 16, IRON_RED[0]);
      if (e === WALL || e === SKY) R.fill(X + 13, Y, 3, 16, IRON_RED[3]), R.fill(X + 15, Y, 1, 16, IRON_RED[4]);
    }
  }
  for (const p of L.plots) {
    const x0 = (X0 + p.x0) * 16, y0 = (Y0 + p.y0) * 16, x1 = (X0 + p.x1 + 1) * 16, y1 = (Y0 + p.y1 + 1) * 16;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) R.shade(x, y, y === y0 || x === x0 ? 0.32 : y === y1 - 1 || x === x1 - 1 ? 0.08 : 0.22, [70, 64, 80]);
  }
  for (const g of L.gardens) garden(R, L, g, seed);
  if (L.fountain) basin(R, L.fountain, seed);
  if (indoor) building(R, L, X0 * 16, Y0 * 16, seed);
  if (L.kind === "platform") paris(R, L, seed);
  return R;
}

/** Smooth value noise in 0..1 on a grid of `k` px. */
function vnoise(x: number, y: number, k: number, seed: number) {
  const gx = Math.floor(x / k), gy = Math.floor(y / k), fx = x / k - gx, fy = y / k - gy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = h2(gx, gy, seed), b = h2(gx + 1, gy, seed), c = h2(gx, gy + 1, seed), d = h2(gx + 1, gy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function lawnPx(x: number, y: number, seed: number) {
  // Turf in soft drifts of three tones, not stripes or pixel noise.
  const n = vnoise(x, y, 14, seed + 30) * 0.65 + vnoise(x, y, 5, seed + 31) * 0.35;
  return n > 0.68 ? "#88bd52" : n < 0.28 ? "#70a644" : GRASS[2];
}

function lawn(R: Raster, X: number, Y: number, seed: number) {
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) R.set(X + i, Y + j, lawnPx(X + i, Y + j, seed));
  tufts(R, X, Y, seed);
}

/** A lit blade pair over a dark root, a few to a cell; now and then a daisy. */
function tufts(R: Raster, X: number, Y: number, seed: number, keep?: (x: number, y: number) => boolean) {
  for (let k = 0; k < 4; k++) {
    if (h2(X + k, Y, seed + 11) < 0.3) continue;
    const tx = X + 1 + Math.floor(h2(X, Y + k, seed + 12) * 13), ty = Y + 2 + Math.floor(h2(Y, X + k, seed + 13) * 12);
    if (keep && !keep(tx, ty)) continue;
    const dark = lawnPx(tx, ty, seed) === GRASS[3];
    R.set(tx, ty, dark ? GRASS[2] : GRASS[0]); R.set(tx + 2, ty - 1, dark ? GRASS[2] : GRASS[0]);
    R.set(tx + 1, ty + 1, dark ? GRASS[4] : GRASS[3]);
  }
  if (h2(X, Y, seed + 14) > 0.88) {
    const tx = X + 4 + Math.floor(h2(Y, X, seed + 15) * 8), ty = Y + 5 + Math.floor(h2(X, X, seed + 16) * 6);
    if (keep && !keep(tx, ty)) return;
    const pal = ROSES[Math.floor(h2(X, Y, 17) * ROSES.length)];
    R.set(tx, ty, pal[0]); R.set(tx + 1, ty, pal[1]); R.set(tx, ty + 1, GRASS[3]);
  }
}

function gravelPx(x: number, y: number, seed: number) {
  const n = vnoise(x, y, 10, seed + 4);
  return n > 0.7 ? "#e9dbc0" : n < 0.25 ? "#dfceb0" : SAND[1];
}

function gravel(R: Raster, X: number, Y: number, seed: number) {
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) R.set(X + i, Y + j, gravelPx(X + i, Y + j, seed));
  pebbles(R, X, Y, 16, 16, seed);
}

/** Pebbles raked into the gravel: a lit stone over its own small shadow. */
function pebbles(R: Raster, X: number, Y: number, w: number, h: number, seed: number, keep?: (x: number, y: number) => boolean) {
  for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 3) {
    const k = h2(X + i, Y + j, seed + 5), x = X + i + (j % 4 ? 1 : 0), y = Y + j;
    if (keep && !keep(x, y)) continue;
    if (k > 0.86) { R.set(x, y, SAND[0]); R.set(x + 1, y, "#fbf4e6"); R.set(x, y + 1, SAND[2]); R.set(x + 1, y + 1, SAND[3]); }
    else if (k > 0.78) { R.set(x, y, "#c8b8a6"); R.set(x, y + 1, SAND[3]); }
    else if (k < 0.1) R.set(x, y, SAND[2]);
  }
}

function paving(R: Raster, X: number, Y: number, seed: number) {
  // Flags of uneven length in courses: each stone its own tone, lit on its upper
  // left, seamed dark on its lower right, some still wet and catching the sky.
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = X + i, y = Y + j, row = y >> 4, sy = y & 15, off = Math.floor(h2(row, 0, seed + 6) * 8);
    const seg = (x + off) >> 3, edge = (q: number) => q % 4 === 0 || h2(row, q, seed + 7) > 0.55;
    let start = seg;
    while (!edge(start) && seg - start < 3) start--;
    const sx = x + off - start * 8, last = edge(seg + 1) && ((x + off) & 7) === 7;
    const tone = h2(row, start, seed + 8);
    let col = tone < 0.22 ? STONE[2] : tone > 0.8 ? STONE[0] : STONE[1];
    if (vnoise(x, y, 24, seed + 9) > 0.7 && tone > 0.3) col = tone > 0.7 ? "#e2e6e6" : "#cfd4d6";
    if (sy === 0 || sx === 0) col = tone > 0.8 ? "#fbf8f2" : STONE[0];
    if (sy === 15 || last) col = STONE[3];
    if (sy === 15 && last) col = STONE[4];
    R.set(x, y, col);
  }
  if (h2(X, Y, seed + 8) > 0.85) {
    const cx = X + 4 + Math.floor(h2(Y, X, 9) * 8), cy = Y + 4 + Math.floor(h2(X, Y, 10) * 8);
    R.set(cx, cy, STONE[3]); R.set(cx + 1, cy + 1, STONE[3]); R.set(cx + 2, cy + 1, STONE[2]);
  }
}

/** A fountain's basin: an oval of water in a moulded coping on its paved apron,
 * the far wall's shadow on the water and the near coping lit along its top. */
function basin(R: Raster, f: NonNullable<FairLevel["fountain"]>, seed: number) {
  const ox = PAD.x * 16, oy = PAD.top * 16, cx = ox + (f.x + f.w / 2) * 16, cy = oy + (f.y + f.h / 2) * 16, rx = f.w * 8 + 4, ry = f.h * 8 + 4;
  for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) paving(R, ox + x * 16, oy + y * 16, seed);
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 6; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
    const e = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry), d = (e - 1) * Math.min(rx, ry);
    if (d > 1 && !(y > cy && d < 4 && Math.hypot((x + 0.5 - cx) / rx, (y - 3.5 - cy) / ry) <= 1)) continue;
    if (d > 0) { R.set(x, y, d < 2.5 ? STONE[3] : STONE[4]); continue; }
    if (d > -6) {
      // The coping: lit across its top, its inner lip shaded.
      const up = y < cy;
      R.set(x, y, d > -1 ? (up ? "#fbf8f2" : STONE[1]) : d > -5 ? (up ? STONE[0] : STONE[1]) : STONE[3]);
      continue;
    }
    const band = Math.sin(x * 0.22 + Math.sin(y * 0.4) * 1.8) + Math.sin(y * 0.6 - x * 0.07);
    const shadow = Math.hypot((x + 0.5 - cx) / rx, (y - 6 - cy) / ry) > 1 - 6 / Math.min(rx, ry) && y < cy;
    R.set(x, y, shadow ? WATER_C[5] : band > 1.5 ? WATER_C[1] : band < -1.2 ? WATER_C[4] : h2(x >> 2, y, seed) > 0.97 ? WATER_C[0] : WATER_C[3]);
  }
}

type Rect = { x: number; y: number; w: number; h: number };
const sdBox = (px: number, py: number, r: Rect, rad: number) => {
  const qx = Math.abs(px - r.x - r.w / 2) - r.w / 2 + rad, qy = Math.abs(py - r.y - r.h / 2) - r.h / 2 + rad;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
};
const sdEllipse = (px: number, py: number, cx: number, cy: number, a: number, b: number) => (Math.hypot((px - cx) / a, (py - cy) / b) - 1) * Math.min(a, b);

/** A railed garden drawn at the pixel over its cells: an oval walk, beds with
 * rounded ends edged in clipped box, a round basin in its coping. The cells
 * still decide where one can walk; this only rounds what they square off. */
function garden(R: Raster, L: FairLevel, g: FairLevel["gardens"][number], seed: number) {
  const OX = PAD.x * 16, OY = PAD.top * 16, { w } = L;
  const X0 = OX + g.x0 * 16, Y0 = OY + g.y0 * 16, X1 = OX + (g.x1 + 1) * 16, Y1 = OY + (g.y1 + 1) * 16;
  const cell = (px: number, py: number) => {
    const x = Math.floor((px - OX) / 16), y = Math.floor((py - OY) / 16);
    return x < 0 || y < 0 || x >= w || y >= L.h ? -1 : L.cells[y * w + x];
  };
  const seen = new Set<number>(), beds: Rect[] = [];
  let basin: Rect | undefined;
  for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) {
    const c = L.cells[y * w + x], k = y * w + x;
    if (seen.has(k) || (c !== BED && c !== BOX && c !== WATER)) continue;
    const water = c === WATER, same = (q: number) => (water ? q === WATER : q === BED || q === BOX);
    let x1 = x, y1 = y;
    while (x1 + 1 <= g.x1 && same(L.cells[y * w + x1 + 1])) x1++;
    while (y1 + 1 <= g.y1 && same(L.cells[(y1 + 1) * w + x])) y1++;
    for (let j = y; j <= y1; j++) for (let i = x; i <= x1; i++) seen.add(j * w + i);
    const r = { x: OX + x * 16, y: OY + y * 16, w: (x1 - x + 1) * 16, h: (y1 - y + 1) * 16 };
    if (water) basin = r;
    else beds.push(r);
  }
  const bcx = basin ? basin.x + basin.w / 2 : 0, bcy = basin ? basin.y + basin.h / 2 : 0, brad = basin ? Math.min(basin.w, basin.h) / 2 + 6 : 0;
  const cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2, ea = (X1 - X0) / 2 - 22, eb = (Y1 - Y0) / 2 - 22;
  const gxc = OX + (g.gx[0] + g.gx.length / 2) * 16, gyc = OY + (g.gy[0] + g.gy.length / 2) * 16;
  const inBasin = (px: number, py: number) => basin !== undefined && Math.hypot(px - bcx, py - bcy) < brad;
  const inApron = (px: number, py: number) => basin !== undefined && px >= basin.x - 16 && px < basin.x + basin.w + 16 && py >= basin.y - 16 && py < basin.y + basin.h + 16;
  // The square of gravel round a basin is drawn as a round walk, the turf filling its corners.
  const isWalk = (px: number, py: number) => {
    const cross = Math.abs(px - gxc) < g.gx.length * 8 || Math.abs(py - gyc) < g.gy.length * 8;
    return walkD(px, py) <= 0 || (cell(px, py) === GRAVEL && (!basin || cross || !inApron(px, py)));
  };
  const bedD = (px: number, py: number) => {
    let d = 1e9;
    for (const r of beds) {
      const rad = g.style === "parterre" ? 10 : Math.min(r.w, r.h) / 2 - 2;
      let e = sdBox(px, py, { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 4 }, rad);
      if (basin) e = Math.max(e, brad + 14 - Math.hypot(px - bcx, py - bcy));
      d = Math.min(d, e);
    }
    return d;
  };
  const walkD = (px: number, py: number) => {
    if (g.style === "oval") {
      const e = sdEllipse(px, py, cx, cy, ea, eb);
      let d = Math.abs(e) - 7;
      // Spurs out to the gaps in the railing.
      if (e > 0) d = Math.min(d, Math.abs(px - gxc) - g.gx.length * 8 + 3, Math.abs(py - gyc) - g.gy.length * 8 + 3);
      return d;
    }
    if (basin) return Math.hypot(px - bcx, py - bcy) - brad - 12;
    return 1e9;
  };
  for (let py = Y0; py < Y1; py++) for (let px = X0; px < X1; px++) {
    const c = cell(px, py);
    if (c === FENCE || c < 0) continue;
    if (inBasin(px, py)) {
      const r = Math.hypot(px - bcx, py - bcy);
      if (r > brad - 5) R.set(px, py, r > brad - 1 ? STONE[3] : py < bcy - 2 || px < bcx - brad + 6 ? "#fbf8f2" : STONE[1]);
      else {
        const band = Math.sin(px * 0.3 + Math.sin(py * 0.5) * 1.5) + Math.sin(py * 0.8 - px * 0.1);
        R.set(px, py, Math.hypot(px - bcx, py - bcy + 3) > brad - 5 && py < bcy ? WATER_C[5] : band > 1.5 ? WATER_C[1] : band < -1.3 ? WATER_C[4] : WATER_C[3]);
      }
      continue;
    }
    const bd = bedD(px, py);
    if (bd <= 0) {
      if (bd > -5) {
        const up = bedD(px, py - 3) > 0, down = bedD(px, py + 3) > 0, left = bedD(px - 3, py) > 0, right = bedD(px + 3, py) > 0;
        let col = up ? (bd > -1.5 ? BOXC[0] : BOXC[1]) : down ? BOXC[2] : left ? BOXC[1] : right ? BOXC[3] : BOXC[2];
        if (!up && !down && h2(px >> 1, py >> 1, seed + 21) > 0.8) col = BOXC[1];
        R.set(px, py, col);
      } else R.set(px, py, (px + py * 2) % 7 === 0 ? SOIL[0] : SOIL[1]);
      continue;
    }
    // The hedge's face, and its shadow on the ground in front.
    if (bd < 3 && bedD(px, py - 3) <= 0) { R.set(px, py, bd < 2 ? BOXC[4] : BOXC[5]); continue; }
    const wd = walkD(px, py), onWalk = isWalk(px, py);
    let col = onWalk ? gravelPx(px, py, seed) : lawnPx(px, py, seed);
    if (!onWalk && wd < 1.5) col = GRASS[4];
    if (onWalk && c !== GRAVEL && wd > -1.5) col = SAND[2];
    R.set(px, py, col);
    if (bd < 8 && bedD(px, py - 8) <= 0) R.shade(px, py, 0.2);
  }
  const walk = (x: number, y: number) => isWalk(x, y) && bedD(x, y) > 6 && !inBasin(x, y);
  pebbles(R, X0, Y0, X1 - X0, Y1 - Y0, seed, walk);
  for (let y = Y0; y < Y1; y += 16) for (let x = X0; x < X1; x += 16) tufts(R, x, y, seed, (px, py) => !walk(px, py) && walkD(px, py) > 3 && bedD(px, py) > 8 && cell(px, py) === LAWN && !inBasin(px, py));
  // Roses massed in the beds, one colour to a bed with a stray of another.
  const main = Math.floor(h2(g.x0, g.y0, seed) * ROSES.length);
  for (const r of beds) {
    const pal0 = (main + Math.floor(h2(r.x, r.y, 3) * 2)) % ROSES.length;
    for (let by = r.y + 6; by < r.y + r.h - 4; by += 6) for (let bx = r.x + 6 + ((by >> 1) % 2) * 3; bx < r.x + r.w - 4; bx += 7) {
      const x = bx + Math.round((h2(bx, by, seed + 3) - 0.5) * 3), y = by + Math.round((h2(by, bx, seed + 6) - 0.5) * 3);
      if (bedD(x, y) > -7) continue;
      // A big bed is banded: its rim in a second colour round the main one.
      const pal = ROSES[Math.min(r.w, r.h) > 40 && bedD(x, y) > -14 ? (pal0 + 3) % ROSES.length : h2(x, y, seed + 4) > 0.9 ? (pal0 + 2) % ROSES.length : pal0];
      for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) {
        if (i * i / 16 + j * j / 9 > 1 || bedD(x + i, y + j) > -4) continue;
        const lit = -i - j;
        R.set(x + i, y + j, lit > 3 ? BOXC[1] : lit > -2 ? BOXC[2] : BOXC[3]);
      }
      for (const [fx, fy] of [[-2, -1], [1, -2], [2, 1], [-1, 1], [-3, 0], [0, -2]]) {
        if (h2(x + fx, y + fy, 9) < 0.2 || bedD(x + fx, y + fy) > -4) continue;
        R.set(x + fx, y + fy, pal[1]); R.set(x + fx + 1, y + fy, pal[2]); R.set(x + fx, y + fy - 1, pal[0]);
      }
    }
  }
}

function water(R: Raster, X: number, Y: number, at: (x: number, y: number) => number, cx: number, cy: number) {
  const n = at(cx, cy - 1) !== WATER, s = at(cx, cy + 1) !== WATER, wv = at(cx - 1, cy) !== WATER, e = at(cx + 1, cy) !== WATER;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = X + i, y = Y + j;
    const band = Math.sin(x * 0.28 + Math.sin(y * 0.45) * 1.6) + Math.sin(y * 0.7 - x * 0.08);
    let col = band > 1.6 ? WATER_C[1] : band < -1.3 ? WATER_C[4] : WATER_C[3];
    if (n && j < 5) col = j < 3 ? WATER_C[5] : WATER_C[4];
    R.set(x, y, col);
  }
  // A stone coping all round, lit along its top.
  const coping = (x: number, y: number, ww: number, hh: number, lit: boolean) => {
    R.fill(x, y, ww, hh, STONE[1]);
    R.fill(x, y, ww, 1, lit ? "#fbf8f2" : STONE[2]);
    R.fill(x, y + hh - 1, ww, 1, STONE[3]);
  };
  if (n) coping(X, Y, 16, 3, true);
  if (s) { coping(X, Y + 12, 16, 4, true); R.fill(X, Y + 11, 16, 1, WATER_C[2]); }
  if (wv) { R.fill(X, Y, 3, 16, STONE[1]); R.fill(X, Y, 1, 16, "#fbf8f2"); R.fill(X + 3, Y, 1, 16, WATER_C[5]); }
  if (e) { R.fill(X + 13, Y, 3, 16, STONE[2]); R.fill(X + 15, Y, 1, 16, STONE[3]); R.fill(X + 12, Y, 1, 16, WATER_C[2]); }
}

/** Clipped box: a low hedge with a lit top, a shaded face, rounded at its outer corners. */
function box(R: Raster, X: number, Y: number, at: (x: number, y: number) => number, cx: number, cy: number, seed: number) {
  const same = (dx: number, dy: number) => at(cx + dx, cy + dy) === BOX;
  const n = same(0, -1), s = same(0, 1), wv = same(-1, 0), e = same(1, 0);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    // A hedge 10 px thick down the middle of its run; joined to its neighbours.
    const inX = (i >= 3 || wv) && (i <= 12 || e), inY = (j >= 2 || n) && (j <= 13 || s);
    const coreX = i >= 3 && i <= 12, coreY = j >= 2 && j <= 13;
    if (!(inX && inY && ((coreX && (n || s || coreY)) || (coreY && (wv || e)) || (coreX && coreY)))) continue;
    const top = !n && j < 4, face = !s && j > 10, left = !wv && i < 5, right = !e && i > 10;
    let col = BOXC[2];
    if (top) col = j === 2 ? BOXC[0] : BOXC[1];
    else if (face) col = j === 13 ? BOXC[5] : BOXC[4];
    else if (left) col = BOXC[1];
    else if (right) col = BOXC[3];
    else if (h2((X + i) >> 1, (Y + j) >> 1, seed + 21) > 0.78) col = BOXC[1];
    else if (h2((X + i) >> 1, (Y + j) >> 1, seed + 22) < 0.12) col = BOXC[3];
    R.set(X + i, Y + j, col);
  }
  if (!s) R.fill(X + 3, Y + 14, 10, 1, GRASS[4]);
}

/** A bed of roses: round bushes in rows, in bloom. */
function roses(R: Raster, X: number, Y: number, cx: number, cy: number, seed: number, at: (x: number, y: number) => number) {
  R.fill(X, Y, 16, 16, SOIL[1]);
  for (let j = 0; j < 16; j += 3) for (let i = (j % 2) * 2; i < 16; i += 4) R.set(X + i, Y + j, SOIL[0]);
  // One colour a bed, from the bed's top-left cell.
  let ox = cx, oy = cy;
  while (at(ox - 1, oy) === BED) ox--;
  while (at(ox, oy - 1) === BED) oy--;
  const main = Math.floor(h2(ox, oy, seed) * ROSES.length);
  // Bushes on a jittered grid, so a long bed does not read as rows.
  for (const [bx, by] of [[3, 3], [11, 2], [7, 9], [15, 9], [2, 13], [11, 14]] as const) {
    const jx = Math.round((h2(X + bx, Y + by, seed + 3) - 0.5) * 4), jy = Math.round((h2(Y + by, X + bx, seed + 6) - 0.5) * 4);
    const x = X + bx + jx, y = Y + by + jy, rx = 4 + (h2(x, y, 8) > 0.5 ? 1 : 0), ry = 4;
    const pal = ROSES[h2(x, y, seed + 4) > 0.8 ? (main + 1 + Math.floor(h2(X, y, 5) * 3)) % ROSES.length : main];
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
      if (i * i / (rx * rx) + j * j / (ry * ry) > 1) continue;
      const lit = -i - j;
      R.set(x + i, y + j, lit > 3 ? BOXC[1] : lit > -2 ? BOXC[2] : BOXC[3]);
    }
    R.fill(x - rx + 1, y + ry, rx * 2 - 1, 1, BOXC[5]);
    for (const [fx, fy] of [[-2, -1], [1, -2], [2, 1], [-1, 1], [-3, 1], [0, -3]]) {
      if (h2(x + fx, y + fy, 9) < 0.15) continue;
      R.set(x + fx, y + fy, pal[1]); R.set(x + fx + 1, y + fy, pal[2]); R.set(x + fx, y + fy - 1, pal[0]);
    }
  }
}

/** Spear railings on a low kerb: posts at corners and gate-ends, bars between. */
function fence(R: Raster, X: number, Y: number, at: (x: number, y: number) => number, cx: number, cy: number) {
  const f = (dx: number, dy: number) => at(cx + dx, cy + dy) === FENCE;
  const horiz = f(-1, 0) || f(1, 0), vert = f(0, -1) || f(0, 1);
  const post = (x: number, y: number) => {
    R.fill(x, y - 4, 3, 14, IRON[2]); R.fill(x, y - 4, 1, 14, IRON[1]);
    R.fill(x - 1, y - 6, 5, 2, IRON[2]); R.set(x + 1, y - 7, IRON[0]); R.set(x, y - 6, IRON[0]);
  };
  if (horiz) {
    R.fill(X, Y + 11, 16, 2, STONE[2]); R.fill(X, Y + 11, 16, 1, STONE[0]);
    R.fill(X, Y + 2, 16, 1, IRON[2]); R.fill(X, Y + 9, 16, 1, IRON[2]);
    for (let i = 1; i < 16; i += 3) { R.fill(X + i, Y, 1, 11, IRON[3]); R.set(X + i, Y - 1, IRON[1]); }
    R.fill(X, Y + 13, 16, 2, GRASS[4]);
  }
  if (vert) {
    R.fill(X + 6, Y, 3, 16, STONE[2]); R.fill(X + 6, Y, 1, 16, STONE[0]);
    R.fill(X + 7, Y, 1, 16, IRON[3]);
    for (let j = 1; j < 16; j += 3) R.set(X + 7, Y + j, IRON[0]);
    R.fill(X + 9, Y, 2, 16, GRASS[4]);
  }
  const corner = horiz && vert, end = (horiz && !(f(-1, 0) && f(1, 0))) || (vert && !(f(0, -1) && f(0, 1)));
  if (corner || end || (!horiz && !vert)) post(X + 6, Y + 3);
}

function canopy(R: Raster, X: number, Y: number, seed: number) {
  // Park trees seen from above: leaf clumps lit on their upper left.
  R.fill(X, Y, 16, 16, CANOPY[3]);
  for (let k = 0; k < 4; k++) {
    const cx = X + Math.floor(h2(X + k, Y, seed + 31) * 16), cy = Y + Math.floor(h2(Y + k, X, seed + 32) * 16), r = 4 + Math.floor(h2(X, Y + k, 33) * 3);
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (i * i + j * j > r * r || cx + i < X || cx + i >= X + 16 || cy + j < Y || cy + j >= Y + 16) continue;
      const lit = (-i - j) / r;
      R.set(cx + i, cy + j, lit > 0.9 ? CANOPY[0] : lit > 0.1 ? CANOPY[1] : lit > -0.8 ? CANOPY[2] : CANOPY[4]);
    }
  }
}

function deck(R: Raster, X: number, Y: number, seed: number) {
  const f = FLOORS.boards;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = X + i, y = Y + j, plank = y >> 2, cut = (x + plank * 11) % 32;
    R.set(x, y, y % 4 === 3 ? f[3] : cut === 0 ? f[4] : h2(plank, (x + plank * 11) >> 5, seed) < 0.2 ? f[2] : y % 4 === 0 ? f[0] : f[1]);
  }
}

function floor(R: Raster, X: number, Y: number, L: FairLevel, ax: number, ay: number) {
  const kind = L.floor ?? "parquet", f = FLOORS[kind], cx = L.w >> 1;
  const border = ax === 1 || ax === L.w - 2 || ay === 3 || ay === L.h - 2;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = X + i, y = Y + j;
    let col: string;
    if (kind === "parquet") {
      // Herringbone of short blocks: quiet seams, each block a shade of its own.
      const flip = ((x >> 3) + (y >> 3)) % 2, a = flip ? x : y, b = flip ? y : x;
      const tone = h2(a >> 2, (b >> 3) * 3 + flip, 9);
      col = a % 4 === 3 || b % 8 === 7 ? f[2] : tone > 0.8 ? f[0] : f[1];
    } else if (kind === "tile") {
      // Cream squares, a small red lozenge where four meet.
      const sx = (x + 16) % 32, sy = (y + 16) % 32, d = Math.abs(sx - 15.5) + Math.abs(sy - 15.5);
      col = d < 3 ? f[2] : d < 4 ? f[3] : x % 16 === 0 || y % 16 === 0 ? f[1] : ((x >> 4) + (y >> 4)) % 2 ? f[0] : "#efe5d2";
    } else if (kind === "iron") {
      // Square stone flags, each a shade of its own, a lit edge on the top and left.
      const px = x % 16, py = y % 16, tone = h2(x >> 4, y >> 4, 4);
      col = px === 15 || py === 15 ? f[2] : px === 0 || py === 0 ? f[0] : tone > 0.75 ? "#b4afa6" : tone < 0.2 ? "#9e998f" : f[1];
    } else {
      const plank = Math.floor(x / 6);
      col = x % 6 === 5 ? f[3] : (y + plank * 13) % 40 === 0 ? f[4] : x % 6 === 0 ? f[0] : f[1];
    }
    // An inlaid border a cell in from the walls.
    if (border && kind !== "iron") {
      // A band of dark wood with a pale stringing line down its middle.
      const along = ax === 1 || ax === L.w - 2 ? i : j;
      col = along === 7 || along === 8 ? f[0] : f[3];
    }
    R.set(x, y, col);
  }
  // A red runner up the aisle from the door.
  if ((ax === cx - 1 || ax === cx) && ay >= 4 && kind !== "iron") {
    R.fill(X, Y, 16, 16, RUNNER[1]);
    if (ax === cx - 1) R.fill(X + 1, Y, 2, 16, RUNNER[3]), R.fill(X, Y, 1, 16, RUNNER[2]);
    else R.fill(X + 13, Y, 2, 16, RUNNER[3]), R.fill(X + 15, Y, 1, 16, RUNNER[2]);
    for (let j = 4; j < 16; j += 8) R.fill(X + (ax === cx - 1 ? 7 : 0), Y + j, 9, 1, RUNNER[2]);
  }
}


/** National banners hung from the gallery: each a list of bands, and whether they run down the banner. */
const BANNERS: [string[], boolean][] = [
  [["#3a5aa8", "#f4f0e8", "#d0403a"], true], [["#2a2a30", "#f0c838", "#d0403a"], true], [["#3a8a4a", "#f4f0e8", "#d0403a"], true],
  [["#d0403a", "#f4f0e8", "#3a5aa8"], false], [["#c8343a", "#f0c838", "#c8343a"], false], [["#f4f0e8", "#3a5aa8", "#d0403a"], false],
];

function banner(R: Raster, x: number, y: number, k: number) {
  const [bands, down] = BANNERS[k % BANNERS.length], W = 9, H = 24;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (j > H - 4 && Math.abs(i - 4) < j - (H - 4)) continue;
    const col = bands[down ? Math.min(2, Math.floor(i / 3)) : Math.min(2, Math.floor(j / 8))];
    R.set(x + i, y + j, col);
    if (i === W - 1 || j === H - 1) R.shade(x + i, y + j, 0.3);
  }
  for (let j = 2; j < H; j++) R.shade(x + W, y + j + 1, 0.25), R.shade(x + W + 1, y + j + 2, 0.12);
  R.fill(x - 1, y - 1, W + 2, 2, BRASS_ROD[0]); R.set(x - 2, y - 1, BRASS_ROD[1]); R.set(x + W + 1, y - 1, BRASS_ROD[1]);
}
const BRASS_ROD = ["#e8c060", "#a87a30"];

function balustrade(R: Raster, X: number, Y: number, right: boolean) {
  R.fill(X, Y, 5, 16, STONE[1]);
  R.fill(X, Y, 1, 16, right ? STONE[2] : "#fbf8f2");
  R.fill(X + 4, Y, 1, 16, STONE[3]);
  for (let j = 2; j < 16; j += 4) R.fill(X + 1, Y + j, 3, 2, STONE[0]);
}

function rail(R: Raster, X: number, Y: number) {
  R.fill(X, Y, 16, 5, IRON_RED[2]);
  R.fill(X, Y, 16, 1, IRON_RED[0]);
  R.fill(X, Y + 4, 16, 1, IRON_RED[4]);
  for (let i = 0; i < 16; i += 4) { R.fill(X + i, Y + 1, 1, 3, IRON_RED[4]); R.set(X + i + 1, Y + 1, IRON_RED[1]); }
}

/** An interior's own building: the glazed roof behind, the back wall with its
 * windows and flag, the side walls' tops, and the front wall with its door
 * and steps, all round the floor the visitor walks on. */
function building(R: Raster, L: FairLevel, OX: number, OY: number, seed: number) {
  const { w, h } = L, W = w * 16, c = WALLS[L.floor ?? "parquet"], door = (w >> 1) - 1;
  // The roof: a glazed lantern between solid margins, three cells deep, seen from above.
  const ry = OY - 48;
  R.fill(OX, ry, W, 48, c[2]);
  for (let y = ry + 4; y < ry + 42; y++) for (let x = OX + 10; x < OX + W - 10; x++) {
    const gx = (x - OX - 10) % 12, gy = (y - ry - 4) % 9;
    const col = gx === 0 || gy === 0 ? IRON[1] : gx === 1 ? IRON[0] : (gx + gy) < 7 ? GLASS[1] : gy > 6 ? GLASS[3] : GLASS[2];
    R.set(x, y, col);
  }
  R.fill(OX + 8, ry + 2, W - 16, 2, IRON[2]); R.fill(OX + 8, ry + 42, W - 16, 2, IRON[2]);
  R.fill(OX, ry, W, 2, c[0]);
  for (let x = OX + 6; x < OX + W - 6; x += 16) R.fill(x, ry, 4, 4, c[3]);
  // The back wall's face, three cells tall.
  const by = OY;
  R.fill(OX + 8, by, W - 16, 48, c[1]);
  R.fill(OX + 8, by, W - 16, 3, c[0]);
  R.fill(OX + 8, by + 3, W - 16, 3, c[3]);
  R.fill(OX + 8, by + 6, W - 16, 1, c[4]);
  R.fill(OX + 8, by + 36, W - 16, 10, DADO[1]);
  R.fill(OX + 8, by + 36, W - 16, 1, DADO[0]);
  for (let x = OX + 12; x < OX + W - 12; x += 12) R.fill(x, by + 38, 1, 7, DADO[2]);
  R.fill(OX + 8, by + 46, W - 16, 2, DADO[3]);
  const cx = OX + W / 2;
  if (L.kind === "machines") ironWall(R, L, OX, ry, by, c);
  else if (L.kind === "hall") gallery(R, L, OX, by, c);
  else for (let x = OX + 16; x + 20 < OX + W - 8; x += 32) {
    // A pilaster, then a tall arched window between it and the next.
    R.fill(x, by + 7, 6, 29, c[0]); R.fill(x + 5, by + 7, 1, 29, c[3]); R.fill(x - 1, by + 7, 8, 2, c[2]);
    const wx = x + 13, ww = 12;
    if (Math.abs(wx + ww / 2 - cx) < 20) continue;
    for (let y = by + 10; y < by + 33; y++) for (let i = 0; i < ww; i++) {
      const top = y - (by + 10), r = ww / 2, dx = i + 0.5 - r;
      if (top < r && dx * dx + (r - top) ** 2 > r * r) continue;
      const glass = (i + top) < 9 ? GLASS[0] : top > 17 ? GLASS[3] : GLASS[2];
      R.set(wx + i, y, i === 0 || i === ww - 1 || i === ww >> 1 || top === 12 ? IRON[1] : glass);
    }
    R.fill(wx - 1, by + 33, ww + 2, 2, c[0]); R.fill(wx - 1, by + 35, ww + 2, 1, c[3]);
  }
  paintFlag(R, L.area.replace(/-in$/, ""), cx - 14, by + 9, seed);
  // The wall's foot throws a shadow on the floor.
  for (let k = 0; k < 5; k++) for (let x = OX + 16; x < OX + W - 16; x++) R.shade(x, by + 48 + k, 0.32 - k * 0.06);
  // Side walls seen from above, with their shadow inside.
  const H = h * 16;
  for (const [x, lit] of [[OX + 8, true], [OX + W - 16, false]] as const) {
    R.fill(x, by, 8, H, c[2]);
    R.fill(x, by, lit ? 1 : 8, H, lit ? c[0] : c[2]);
    R.fill(lit ? x + 7 : x, by, 1, H, c[4]);
    if (lit) for (let k = 0; k < 4; k++) for (let y = by + 48; y < by + H - 16; y++) R.shade(x + 8 + k, y, 0.28 - k * 0.06);
  }
  // The front wall: its top from above, its face below, the door open and steps down.
  const fy = OY + (h - 1) * 16;
  R.fill(OX + 8, fy, W - 16, 6, c[2]); R.fill(OX + 8, fy, W - 16, 1, c[0]);
  R.fill(OX + 8, fy + 6, W - 16, 30, c[1]);
  R.fill(OX + 8, fy + 6, W - 16, 2, c[3]);
  R.fill(OX + 8, fy + 30, W - 16, 6, c[3]); R.fill(OX + 8, fy + 30, W - 16, 1, c[0]); R.fill(OX + 8, fy + 35, W - 16, 1, c[5]);
  for (let x = OX + 16; x < OX + W - 20; x += 24) {
    if (x + 16 > OX + door * 16 - 8 && x < OX + (door + 2) * 16 + 8) continue;
    R.fill(x, fy + 11, 12, 16, c[4]);
    R.fill(x + 1, fy + 12, 10, 14, GLASS[3]);
    R.fill(x + 1, fy + 12, 4, 6, GLASS[1]);
    R.fill(x + 5, fy + 12, 1, 14, IRON[1]); R.fill(x + 1, fy + 18, 10, 1, IRON[1]);
    R.fill(x - 1, fy + 27, 14, 2, c[0]);
  }
  const dx = OX + door * 16;
  R.fill(dx - 4, fy, 40, 36, c[0]);
  R.fill(dx, fy, 32, 30, FLOORS[L.floor ?? "parquet"][2]);
  for (let k = 0; k < 6; k++) R.fill(dx, fy + k, 32, 1, FLOORS[L.floor ?? "parquet"][3]);
  // Door leaves standing open against the jambs.
  for (const [x, lit] of [[dx - 4, true], [dx + 32, false]] as const) {
    R.fill(x, fy + 4, 4, 28, lit ? "#4e7a46" : "#3a5e36"); R.fill(x, fy + 4, 1, 28, lit ? "#6e9a5e" : "#2a4428");
  }
  for (let k = 0; k < 3; k++) {
    const sy = fy + 30 + k * 4;
    R.fill(dx - 4 - k * 3, sy, 40 + k * 6, 4, STONE[1]); R.fill(dx - 4 - k * 3, sy, 40 + k * 6, 1, "#fbf8f2"); R.fill(dx - 4 - k * 3, sy + 3, 40 + k * 6, 1, STONE[3]);
  }
  void seed;
}

/** A hall's back wall in two storeys: an arcade of dark bays below, and above
 * it the gallery's balustrade with the nations' banners hung over it. */
function gallery(R: Raster, L: FairLevel, OX: number, by: number, c: string[]) {
  const W = L.w * 16, x0 = OX + 8, x1 = OX + W - 8;
  // The gallery: a deep recess behind the balustrade, its own windows faint at the back.
  R.fill(x0, by + 7, x1 - x0, 14, c[4]);
  R.fill(x0, by + 7, x1 - x0, 2, c[5]);
  for (let x = x0 + 10; x < x1 - 10; x += 16) R.fill(x, by + 10, 5, 6, c[3]), R.fill(x, by + 10, 2, 2, c[2]);
  R.fill(x0, by + 18, x1 - x0, 2, c[0]); R.fill(x0, by + 20, x1 - x0, 1, c[3]);
  for (let x = x0 + 1; x < x1 - 1; x += 3) R.fill(x, by + 21, 2, 4, c[1]), R.set(x + 1, by + 24, c[3]);
  R.fill(x0, by + 25, x1 - x0, 2, c[0]); R.fill(x0, by + 27, x1 - x0, 1, c[4]);
  // The arcade below: round-headed bays, dark, with a case glimpsed in each.
  for (let x = x0 + 4; x + 18 < x1; x += 24) {
    for (let y = by + 29; y < by + 36; y++) for (let i = 0; i < 18; i++) {
      const top = y - (by + 29), dx = i + 0.5 - 9;
      if (top < 4 && dx * dx + (4 - top) ** 2 * 5 > 81) continue;
      R.set(x + i, y, top < 2 ? c[5] : c[4]);
    }
    R.fill(x + 5, by + 32, 8, 4, c[3]); R.fill(x + 5, by + 32, 8, 1, c[2]);
  }
  for (let x = x0 + 22; x < x1 - 4; x += 24) R.fill(x, by + 28, 6, 8, c[1]), R.fill(x, by + 28, 1, 8, c[0]), R.fill(x + 5, by + 28, 1, 8, c[3]);
  // Banners from the balustrade, one over each pier, clear of the flag at the middle.
  const mid = OX + W / 2;
  for (let x = x0 + 22, k = 0; x < x1 - 12; x += 48, k++) if (Math.abs(x + 4 - mid) > 28) banner(R, x - 1, by + 19, k + L.w);
}

/** The Machines' back wall: glass from the dado up, between the feet of the
 * arched ribs, which carry on up over the roof. */
function ironWall(R: Raster, L: FairLevel, OX: number, ry: number, by: number, c: string[]) {
  const W = L.w * 16, x0 = OX + 8, x1 = OX + W - 8;
  for (let y = by + 7; y < by + 35; y++) for (let x = x0; x < x1; x++) {
    const gx = (x - x0) % 10, gy = (y - by - 7) % 9;
    R.set(x, y, gx === 0 || gy === 0 ? IRON[1] : (gx + gy) < 6 ? GLASS[1] : gy > 6 ? GLASS[3] : GLASS[2]);
  }
  R.fill(x0, by + 33, x1 - x0, 3, c[0]); R.fill(x0, by + 35, x1 - x0, 1, c[3]);
  // Heavier mullions, riveted, every few panes, up the wall and over the roof.
  for (let x = x0 + 30; x < x1 - 4; x += 70) for (let y = ry + 2; y < by + 36; y++) {
    R.fill(x, y, 4, 1, IRON[2]); R.set(x, y, IRON[0]); R.set(x + 3, y, IRON[3]);
    if (y % 6 === 0) R.set(x + 1, y, IRON[0]);
  }
}

/** Round and through the middle of a Tower platform: Paris, far below, in haze. */
function paris(R: Raster, L: FairLevel, seed: number) {
  const OX = PAD.x * 16, OY = PAD.top * 16;
  const haze = ["#d4dee4", "#bccad4", "#a4b4c2", "#e4dccc", "#c8bca8", "#8aa088", "#9cb0a0"];
  const below = (x: number, y: number) => {
    const ax = Math.floor((x - OX) / 16), ay = Math.floor((y - OY) / 16);
    return ax < 0 || ay < 0 || ax >= L.w || ay >= L.h || L.cells[ay * L.w + ax] === WALL;
  };
  for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) {
    if (!below(x, y)) continue;
    // Haussmann blocks: zinc roofs with a lit ridge, pale stone fronts, tree-lined boulevards, the river.
    const sx = x + Math.floor(y / 40) * 7, bx = Math.floor(sx / 18), by = Math.floor(y / 13), lx = sx % 18, ly = y % 13;
    const boulevard = Math.floor(sx / 18) % 5 === 0 && lx < 4;
    const river = Math.abs(y - R.h * 0.32 - Math.sin(x * 0.012) * 26) < 7;
    let col: string;
    if (river) col = Math.abs(y - R.h * 0.32 - Math.sin(x * 0.012) * 26) > 5 ? haze[4] : "#9cbccc";
    else if (boulevard) col = lx === 1 || lx === 2 ? (y % 3 ? haze[5] : haze[6]) : haze[3];
    else if (ly > 10 || lx > 15) col = haze[3];
    else if (ly > 7) col = haze[4];
    else col = h2(bx, by, seed) < 0.12 ? haze[5] : ly === 3 ? haze[0] : ly < 3 ? haze[1] : haze[2];
    R.set(x, y, col);
  }
  // The girders of the platform's edge.
  for (let ay = 0; ay < L.h; ay++) for (let ax = 0; ax < L.w; ax++) {
    if (L.cells[ay * L.w + ax] !== WALL) continue;
    const X = OX + ax * 16, Y = OY + ay * 16;
    const open = (dx: number, dy: number) => { const c = L.cells[(ay + dy) * L.w + ax + dx]; return ay + dy >= 0 && ay + dy < L.h && ax + dx >= 0 && ax + dx < L.w && c !== WALL; };
    if (open(0, -1)) { R.fill(X, Y, 16, 4, IRON_RED[2]); R.fill(X, Y + 4, 16, 2, IRON_RED[4]); for (let i = 0; i < 16; i += 8) for (let k = 0; k < 8; k++) R.set(X + i + k, Y + 6 + k, IRON_RED[3]); }
    if (open(0, 1)) R.fill(X, Y + 12, 16, 4, IRON_RED[1]);
    if (open(1, 0)) R.fill(X + 12, Y, 4, 16, IRON_RED[3]);
    if (open(-1, 0)) R.fill(X, Y, 4, 16, IRON_RED[2]);
  }
}
