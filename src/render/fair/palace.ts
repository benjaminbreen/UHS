import { h2, Raster } from "../ship/raster";
import { palaceBays, type FairLevel } from "../../world/fair";
import type { FairSprite } from "./things";
import { GILT as GILT_BRONZE, louisQuatorze, type PalaceStyle } from "../../content/palaces/styles";

const MIRROR = ["#d3e0e7", "#b7c8d2", "#a0b3bf", "#899eac", "#6e8494"];
const WHITE = ["#ffffff", "#f2eee6", "#dcd6ca", "#b8b0a2", "#8c8478"];
/** Candlesticks, clocks and candle stands are gilt bronze whatever the room's woodwork. */
const METAL = GILT_BRONZE;

// The style being painted. Every painter here is called with a level or a style and runs to
// the end before the next, so the materials are set once at the door and read as constants.
let CREAM: readonly string[] = louisQuatorze.wall, GILT: readonly string[] = louisQuatorze.trim, FRAME: readonly string[] = louisQuatorze.frame;
let ROUGE: readonly string[] = louisQuatorze.stone, CLOTH: readonly string[] = louisQuatorze.cloth, FIELD: readonly string[] = louisQuatorze.cloth;
let PARQUET = woods(louisQuatorze.wood), STYLE: PalaceStyle = louisQuatorze;
function use(style: PalaceStyle = louisQuatorze) {
  if (style === STYLE) return;
  STYLE = style;
  CREAM = style.wall; GILT = style.trim; FRAME = style.frame; ROUGE = style.stone; CLOTH = style.cloth; FIELD = style.field ?? style.cloth;
  PARQUET = woods(style.wood);
}

/** A floor's wood as three close families of one colour: two strips, the ground between, the frame, the shade, the joint. */
function woods(hex: string) {
  const n = parseInt(hex.slice(1), 16), tone = (k: number) => "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v, i) => Math.max(0, Math.min(255, Math.round(v * k * (k < 1 ? 1 - (1 - k) * 0.25 * i : 1)))).toString(16).padStart(2, "0")).join("");
  return [1, 0.985, 1.015].map((f) => ({ a: tone(1.02 * f), b: tone(0.985 * f), ground: tone(0.94 * f), frame: tone(1.005 * f), shade: tone(0.915 * f), joint: tone(0.86) }));
}
const DARK = "#2a2226";
/** How far the back wall rises above the room's top row, and its whole height. */
export const PALACE_RISE = 64;
const TALL = PALACE_RISE + 48;

/** A palace floor, by the room's kind of floor: parquet de Versailles in panels a
 * bay square, or black and white marble. */
export function palaceFloor(R: Raster, X: number, Y: number, L: FairLevel, ax: number, ay: number) {
  use(L.palace);
  const { b0 } = palaceBays(L.w), kind = STYLE.floor, rug = kind === "carpet" && ax >= 3 && ax < L.w - 3 && ay >= 5 && ay < L.h - 3;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const gx = ax * 16 + i, gy = ay * 16 + j;
    let col: string;
    if (rug) {
      // A carpet: a border of two gold lines round a field of small lozenges, all in the room's cloth.
      const ex = Math.min(gx - 48, (L.w - 3) * 16 - 1 - gx), ey = Math.min(gy - 80, (L.h - 3) * 16 - 1 - gy), e = Math.min(ex, ey);
      const m = Math.abs((gx % 24) - 12) + Math.abs(((gy + (Math.floor(gx / 24) % 2) * 12) % 24) - 12);
      col = e === 0 ? CLOTH[3] : e === 3 || e === 9 ? METAL[2] : e < 12 ? (e > 4 && e < 8 && (ex + ey) % 6 < 2 ? CLOTH[1] : CLOTH[3]) : e === 12 ? CLOTH[3] : m < 2 ? CLOTH[1] : CLOTH[2];
    } else if (kind === "herringbone" || kind === "carpet") {
      // Short blocks laid in a herringbone: two tones for the two ways they run, a joint a shade down.
      const o = PARQUET[0], flip = ((gx >> 3) + (gy >> 3)) % 2 === 0, along = flip ? gx : gy, across = flip ? gy : gx;
      col = across % 4 === 3 || along % 8 === 7 ? o.ground : flip ? o.a : o.b;
    } else if (kind === "marble") {
      // Marble squares set on the diagonal: soft black and warm white, a thin joint, one vein to a slab.
      const p = Math.floor((gx + gy) / 24), q = Math.floor((gx - gy + 4800) / 24), black = (p + q) % 2 === 0;
      const pu = (gx + gy) % 24, qu = (gx - gy + 4800) % 24, vein = Math.abs(pu - 6 - Math.floor(h2(p, q, 2) * 10) - (qu >> 2)) === 0 && qu > 3 && qu < 20;
      col = pu === 0 || qu === 0 ? (black ? "#3a3844" : "#d2cabc") : black ? (vein ? "#6a6876" : pu === 1 || qu === 1 ? "#5c5a68" : "#4c4a58") : vein ? "#ded8cc" : pu === 1 || qu === 1 ? "#fffdf8" : "#f1ece2";
    } else {
      // A panel a bay square: a plain frame with a small block at each corner, and inside it broad
      // strips woven on the diagonal. No drawn lines: one flat tone against the next, all close.
      const u = (((gx - b0 * 16) % 48) + 48) % 48, v = (((gy - 48) % 48) + 48) % 48;
      const o = PARQUET[Math.floor(h2(Math.floor((gx - b0 * 16) / 48), Math.floor((gy - 48) / 48), 3) * PARQUET.length)];
      const ru = Math.min(u, 47 - u), rv = Math.min(v, 47 - v), rim = Math.min(ru, rv);
      if (rim === 0) col = o.joint;
      else if (rim < 4) col = ru < 4 && rv < 4 ? o.ground : o.frame;
      else if (rim === 4) col = o.shade;
      else {
        const P = 20, S = 11, p = (u + v + 2) % P, q = (u - v + 60) % P, a = p < S, b = q < S;
        const over = (Math.floor((u + v + 2) / P) + Math.floor((u - v + 60) / P)) % 2 === 0;
        col = a && b ? (over ? o.a : o.b) : a ? (p === S - 1 ? o.shade : o.a) : b ? (q === S - 1 ? o.shade : o.b) : o.ground;
      }
    }
    R.set(X + i, Y + j, col);
  }
}

/** Sun through the windows of the wall the viewer stands behind: a leaning patch of panes on the floor, one to a bay. */
export function palaceLight(R: Raster, L: FairLevel, OX: number, OY: number) {
  use(L.palace);
  const { b0, n } = palaceBays(L.w), foot = OY + (L.h - 1) * 16 - 4, tall = 46;
  for (let k = 0; k < n; k++) for (let j = 0; j < tall; j++) for (let i = 0; i < 32; i++) {
    // Three panes across, four down, under a round head; the glazing bars fall as shadow.
    if (i % 11 > 8 || (j > 9 && (j - 10) % 12 > 9)) continue;
    if (j < 10 && (i - 15.5) ** 2 + ((10 - j) * 1.6) ** 2 > 16 * 16) continue;
    const x = OX + (b0 + 3 * k) * 16 + i + ((tall - j) >> 1) - 6, y = foot - tall + j;
    if (x < OX + 16 || x >= OX + (L.w - 1) * 16 || y < OY + 56) continue;
    R.shade(x, y, 0.4, [255, 240, 184]);
  }
}

const glass = (x: number, y: number, t: number) => {
  // Broad soft streaks of light across a glass that darkens toward the floor.
  const s = (((x + y) % 34) + 34) % 34, k = t < 18 ? 1 : t < 44 ? 2 : 3;
  return MIRROR[s < 6 ? k - 1 : s > 12 && s < 15 ? k - 1 : s > 22 && s < 27 ? Math.min(4, k + 1) : k];
};

/** Red marble: broad cloudy patches a tone up or down, and a few pale veins running across them. */
function marble(x: number, y: number, k: number, seed: number) {
  const cloud = h2((x + y * 2) >> 4, (y - x + 256) >> 3, seed), vein = (((x * 3 + y + (((y + seed * 5) >> 4) % 3) * 5 + seed * 7) % 37) + 37) % 37;
  if (vein === 0 && cloud > 0.25) return ROUGE[Math.max(0, k - 2)];
  return ROUGE[cloud > 0.8 ? Math.max(0, k - 1) : cloud < 0.14 ? Math.min(4, k + 1) : k];
}

function pilaster(R: Raster, px: number, T: number, seed: number) {
  for (let y = T + 16; y < T + 92; y++) for (let k = 0; k < 3; k++) R.shade(px + 7 + k, y, 0.18 - k * 0.05);
  // A cream pier with a slab of red marble let into its face.
  R.fill(px - 7, T + 28, 14, 60, CREAM[1]); R.fill(px - 7, T + 28, 2, 60, CREAM[0]); R.fill(px + 5, T + 28, 2, 60, CREAM[3]);
  for (let y = T + 31; y < T + 83; y++) for (let i = -4; i < 4; i++) R.set(px + i, y, marble(px + i, y, i < -2 ? 1 : i > 1 ? 3 : 2, seed));
  R.fill(px - 4, T + 30, 8, 1, CREAM[4]); R.fill(px - 5, T + 30, 1, 54, CREAM[4]); R.fill(px - 4, T + 83, 8, 1, CREAM[0]); R.fill(px + 4, T + 31, 1, 53, CREAM[0]);
  // The capital: an abacus, volutes at its corners, two rows of leaves.
  R.fill(px - 9, T + 16, 18, 2, GILT[1]); R.fill(px - 9, T + 16, 18, 1, GILT[0]); R.fill(px - 9, T + 18, 18, 1, GILT[3]);
  for (const vx of [px - 9, px + 5]) { R.fill(vx, T + 19, 4, 4, GILT[1]); R.fill(vx + 1, T + 20, 2, 2, GILT[3]); R.set(vx, T + 19, GILT[0]); R.set(vx + 1, T + 20, GILT[0]); }
  R.fill(px - 5, T + 19, 10, 4, GILT[2]); R.fill(px - 1, T + 19, 2, 3, GILT[0]);
  for (let i = -7; i < 7; i++) {
    const leaf = (i + 7) % 3;
    R.fill(px + i, T + 23, 1, 5, leaf === 0 ? GILT[0] : leaf === 1 ? GILT[1] : GILT[3]);
    if (leaf === 1) R.set(px + i, T + 23, GILT[3]);
    if (i > 2) R.shade(px + i, T + 25, 0.18, [112, 72, 26]), R.shade(px + i, T + 26, 0.18, [112, 72, 26]);
  }
  R.fill(px - 7, T + 27, 14, 1, GILT[3]);
  // Its base in three gilt rings, and the pedestal it stands on.
  for (const [y, hw] of [[T + 84, 7], [T + 87, 8], [T + 89, 9]]) {
    R.fill(px - hw, y, hw * 2, 3, GILT[2]); R.fill(px - hw, y, hw * 2, 1, GILT[0]); R.fill(px - hw, y + 1, Math.round(hw * 1.2), 1, GILT[1]); R.fill(px - hw, y + 2, hw * 2, 1, GILT[3]);
  }
  R.fill(px - 8, T + 92, 16, 20, CREAM[1]); R.fill(px - 8, T + 92, 2, 20, CREAM[0]); R.fill(px + 6, T + 92, 2, 20, CREAM[3]);
  R.fill(px - 9, T + 92, 18, 2, CREAM[0]); R.fill(px - 9, T + 94, 18, 1, CREAM[3]);
  R.fill(px - 5, T + 97, 10, 9, CREAM[2]); R.fill(px - 5, T + 97, 10, 1, CREAM[3]); R.fill(px - 5, T + 97, 1, 9, CREAM[3]); R.fill(px - 4, T + 105, 9, 1, CREAM[0]); R.fill(px + 4, T + 98, 1, 8, CREAM[0]);
  R.fill(px - 9, T + 108, 18, 4, CREAM[2]); R.fill(px - 9, T + 108, 18, 1, CREAM[0]); R.fill(px - 9, T + 111, 18, 1, CREAM[4]);
}

/** A gilt ornament over an arch or a door: a shell between two sprays. */
function crest(R: Raster, cx: number, y: number) {
  for (let i = -3; i <= 3; i++) R.fill(cx + i, y + Math.abs(i) - (Math.abs(i) > 2 ? 1 : 0), 1, 5 - Math.abs(i), i % 2 ? GILT[2] : GILT[1]);
  R.fill(cx - 1, y, 2, 1, GILT[0]); R.set(cx - 2, y + 1, GILT[0]);
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) R.set(cx + s * (4 + k), y + 4 - Math.round(Math.sin((k / 5) * Math.PI) * 2), k % 2 ? GILT[1] : GILT[2]);
}

/** One arch of mirror in its gilt frame, glazed in panes. */
function mirror(R: Raster, bx: number, T: number) {
  const cx = bx + 24, spring = T + 36;
  for (let y = T + 21; y < T + 89; y++) for (let x = bx + 9; x < bx + 39; x++) {
    const dx = x + 0.5 - cx, d = y < spring ? Math.hypot(dx, spring - y - 0.5) : Math.abs(dx);
    if (d > 15) continue;
    const t = y - (T + 21);
    let col: string;
    if (d > 13 || y >= T + 87) col = d > 14 || y === T + 88 ? (dx < 0 || y < T + 26 ? GILT[1] : GILT[2]) : GILT[3];
    else if (x === bx + 19 || x === bx + 28 || (y >= spring && (y - spring) % 13 === 0)) col = GILT[2];
    else if (d > 12 && dx < 0) col = MIRROR[4];
    else col = glass(x - bx, t, t);
    R.set(x, y, col);
  }
  for (let a = 0; a < 30; a++) { const dx = a - 14.5, y = spring - Math.sqrt(Math.max(0, 15 * 15 - dx * dx)); if (dx < 2) R.set(bx + 9 + a, Math.round(y), GILT[0]); }
  crest(R, cx, T + 17);
}

/** A bay hung with damask in a gilt frame, and a picture on it unless something is hung there already. */
function hanging(R: Raster, bx: number, T: number, c: readonly string[], seed: number, bare: boolean, plain = false) {
  R.fill(bx + 9, T + 21, 30, 68, GILT[1]); R.fill(bx + 9, T + 21, 30, 1, GILT[0]); R.fill(bx + 9, T + 21, 1, 68, GILT[0]); R.fill(bx + 38, T + 22, 1, 67, GILT[3]); R.fill(bx + 10, T + 88, 29, 1, GILT[3]);
  for (let y = T + 23; y < T + 87; y++) for (let x = bx + 11; x < bx + 37; x++) {
    const m = Math.abs((x - bx) % 10 - 5) + Math.abs((y - T + ((x - bx) % 20 < 10 ? 0 : 7)) % 14 - 7);
    R.set(x, y, x === bx + 11 || y === T + 23 ? c[3] : plain ? c[1] : m < 2 ? c[0] : m === 4 ? c[2] : c[1]);
  }
  if (bare) return;
  // A picture in a gilt frame: a head and shoulders against the dark, or a stretch of country.
  const px = bx + 14, py = T + 34, w = 20, h = 26, r = (k: number) => h2(seed, k, 71);
  R.fill(px - 1, py + h, w + 3, 2, c[3]);
  R.fill(px, py, w, h, GILT[1]); R.fill(px, py, w, 1, GILT[0]); R.fill(px, py, 1, h, GILT[0]); R.fill(px + w - 1, py + 1, 1, h - 1, GILT[3]); R.fill(px + 1, py + h - 1, w - 1, 1, GILT[3]);
  R.fill(px + 2, py + 2, w - 4, h - 4, GILT[3]);
  if (r(0) < 0.6) {
    const coat = ["#3e5aa0", "#8a2c34", "#3e6a4a", "#c8a85a", "#58406e"][Math.floor(r(1) * 5)], hair = ["#e8e2d6", "#4a3426", "#8a6a44", "#2a2226"][Math.floor(r(2) * 4)];
    R.fill(px + 3, py + 3, w - 6, h - 6, "#3a2e2a"); R.fill(px + 3, py + 3, 6, 8, "#54443a");
    R.fill(px + 5, py + 16, 10, 7, coat); R.fill(px + 6, py + 15, 8, 1, coat); R.fill(px + 9, py + 16, 2, 4, "#f4f0e8");
    R.fill(px + 6, py + 6, 8, 10, hair); R.fill(px + 8, py + 7, 4, 7, "#f0c8a8"); R.fill(px + 8, py + 7, 1, 7, "#ffe0c4"); R.set(px + 9, py + 10, "#5a3a30"); R.set(px + 11, py + 10, "#5a3a30");
  } else {
    R.fill(px + 3, py + 3, w - 6, 10, "#bcd4e4"); R.fill(px + 3, py + 3, w - 6, 3, "#dcecf4"); R.fill(px + 6, py + 6, 6, 2, "#f6f8f8");
    for (let x = 3; x < w - 3; x++) { const hill = 11 + Math.round(Math.sin(x * 0.5 + r(3) * 6) * 2); R.fill(px + x, py + hill, 1, h - 3 - hill, x % 5 < 2 ? "#5e8a4a" : "#4a7440"); }
    R.fill(px + 3, py + 18, w - 6, 5, "#8a9a52"); R.fill(px + 12, py + 9, 4, 8, "#34583a"); R.fill(px + 13, py + 16, 1, 3, "#5a4030");
  }
}

/** A doorway through the back wall: gilt architrave, the next room's floor going back into the dark,
 * a carpet over the sill, and both leaves standing open. */
function doorway(R: Raster, bx: number, T: number) {
  const B = T + TALL, x0 = bx + 9, top = B - 60, tall = B - top;
  R.fill(x0 - 4, top - 4, 38, tall + 4, GILT[1]); R.fill(x0 - 4, top - 4, 38, 1, GILT[0]); R.fill(x0 - 4, top - 4, 1, tall + 4, GILT[0]); R.fill(x0 + 33, top - 3, 1, tall + 3, GILT[3]);
  R.fill(x0 - 2, top - 2, 34, tall + 2, GILT[3]); R.fill(x0 - 1, top - 1, 32, tall + 1, GILT[2]);
  // The next room's floor going back, in its own light.
  for (let y = top; y < B; y++) for (let x = x0; x < x0 + 30; x++) {
    const far = (B - y) / tall, v = Math.floor((B - y) * (1 + far * 1.6)), d = (x - x0 + (v >> 1)) % 16;
    R.set(x, y, v % 14 === 0 ? PARQUET[0].shade : d < 8 ? PARQUET[2].a : PARQUET[0].ground);
    R.shade(x, y, far > 0.8 ? 0.3 : 0.06 + far * 0.12, [70, 44, 40]);
  }
  for (let k = 0; k < 5; k++) R.fill(x0, top + k, 30, 1, undefined), R.fill(x0, top + k, 30, 1, k < 2 ? "#6e4a3a" : undefined);
  // The leaves, hinged at the jambs and swung away: three panels each, lit on the left leaf.
  for (let i = 0; i < 9; i++) for (const [x, lit] of [[x0 + i, true], [x0 + 29 - i, false]] as const) {
    const y0 = top + Math.round(i * 0.8), y1 = B - 1 - Math.round(i * 1.6);
    for (let y = y0; y <= y1; y++) {
      const t = (y - y0) / (y1 - y0), rail = t < 0.05 || t > 0.95 || Math.abs(t - 0.34) < 0.025 || Math.abs(t - 0.68) < 0.025, stile = i === 1 || i === 7;
      R.set(x, y, i === 0 ? FRAME[lit ? 0 : 1] : i === 8 ? FRAME[4] : rail || stile ? FRAME[lit ? 1 : 2] : i === 2 ? FRAME[lit ? 3 : 4] : FRAME[lit ? 2 : 3]);
    }
  }
  R.fill(x0 + 7, top + 34, 1, 3, FRAME[0]); R.fill(x0 + 22, top + 34, 1, 3, FRAME[0]);
  // The carpet over the sill and out onto the floor.
  for (let y = B - 12; y < B + 9; y++) for (let x = x0 + 2; x < x0 + 28; x++) {
    const ex = Math.min(x - x0 - 2, x0 + 27 - x), ey = B + 8 - y;
    R.set(x, y, ex === 0 || ey === 0 ? CLOTH[3] : ex === 2 || ey === 2 ? METAL[1] : (x + y) % 6 === 0 && ex > 3 && ey > 3 ? CLOTH[0] : y < B ? CLOTH[2] : CLOTH[1]);
  }
  // Over the door, a device in a framed panel: the King's sun, or a wreath.
  const cx = bx + 24, cy = T + 33;
  R.fill(bx + 9, T + 21, 30, 24, GILT[1]); R.fill(bx + 9, T + 21, 30, 1, GILT[0]); R.fill(bx + 9, T + 21, 1, 24, GILT[0]); R.fill(bx + 38, T + 22, 1, 23, GILT[3]);
  R.fill(bx + 11, T + 23, 26, 20, "#f8f0de"); R.fill(bx + 11, T + 23, 26, 1, CREAM[3]); R.fill(bx + 11, T + 23, 1, 20, CREAM[3]);
  if (STYLE.emblem === "wreath") {
    for (let a = 0; a < 24; a++) { const x = cx + Math.round(Math.cos((a / 24) * 6.283) * 8), y = cy + Math.round(Math.sin((a / 24) * 6.283) * 7); R.fill(x, y, 2, 2, GILT[a % 3 === 0 ? 3 : 2]); R.set(x, y, GILT[a % 3 === 0 ? 2 : 1]); }
    R.fill(cx - 1, cy + 6, 3, 3, GILT[3]);
    return;
  }
  for (let a = 0; a < 16; a++) for (let d = 5; d < (a % 2 ? 8 : 10); d++) R.set(cx + Math.round(Math.cos((a / 16) * 6.283) * d), cy + Math.round(Math.sin((a / 16) * 6.283) * d * 0.9), a % 2 ? GILT[2] : GILT[1]);
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 18) R.set(cx + x, cy + y, x + y < -3 ? GILT[0] : x + y > 3 ? GILT[3] : GILT[1]);
  R.set(cx - 2, cy - 1, GILT[4]); R.set(cx + 1, cy - 1, GILT[4]); R.fill(cx - 1, cy + 2, 3, 1, GILT[3]);
}

/** A plain pilaster in the wall's own paint, fluted, on the same capital, base and pedestal. */
function fluted(R: Raster, px: number, T: number, seed: number) {
  pilaster(R, px, T, seed);
  R.fill(px - 7, T + 28, 14, 56, CREAM[1]); R.fill(px - 7, T + 28, 2, 56, CREAM[0]); R.fill(px + 5, T + 28, 2, 56, CREAM[3]);
  for (const i of [-4, -1, 2]) { R.fill(px + i, T + 31, 1, 51, CREAM[3]); R.fill(px + i + 1, T + 31, 1, 51, CREAM[0]); R.set(px + i, T + 30, CREAM[2]); R.set(px + i, T + 82, CREAM[2]); }
  R.fill(px - 5, T + 97, 10, 9, CREAM[1]); R.fill(px - 5, T + 97, 10, 1, CREAM[3]); R.fill(px - 5, T + 97, 1, 9, CREAM[3]); R.fill(px - 4, T + 105, 9, 1, CREAM[0]);
}

const SKY = ["#f2f8fa", "#d8ecf6", "#c2e0f0", "#b0d4ea"], TREES = ["#a8c890", "#8cb47c", "#74a06a"];

/** A tall sash window on a garden: daylight, treetops low in the glass, curtains in the room's cloth drawn back under a pelmet. */
function sash(R: Raster, bx: number, T: number) {
  const x0 = bx + 9, top = T + 21, bot = T + 89;
  R.fill(x0, top, 30, bot - top, GILT[1]); R.fill(x0, top, 30, 1, GILT[0]); R.fill(x0, top, 1, bot - top, GILT[0]); R.fill(x0 + 29, top + 1, 1, bot - top - 1, GILT[3]); R.fill(x0 + 1, bot - 1, 29, 1, GILT[3]);
  for (let y = top + 2; y < bot - 3; y++) for (let x = x0 + 2; x < x0 + 28; x++) {
    const t = y - top, i = x - x0 - 2, crown = 50 + Math.round(Math.sin(i * 0.55 + bx) * 3 + Math.sin(i * 1.3) * 1.5);
    const bar = i === 8 || i === 17 || t === 18 || t === 34 || t === 50;
    R.set(x, y, bar ? WHITE[0] : t > crown ? TREES[t > crown + 6 ? 2 : (i + t) % 5 < 2 ? 0 : 1] : ((i + t) % 37 < 5 ? SKY[0] : SKY[t < 16 ? 3 : t < 34 ? 2 : 1]));
  }
  R.fill(x0 + 1, bot - 3, 28, 2, WHITE[1]); R.fill(x0 + 1, bot - 3, 28, 1, WHITE[0]);
  // Curtains: gathered folds, held back by a cord two thirds of the way down.
  for (const left of [true, false]) for (let y = top + 8; y < bot - 3; y++) {
    const t = (y - top - 8) / (bot - top - 11), wide = t < 0.62 ? Math.round(9 - t * 6) : Math.round(4 + (t - 0.62) * 9);
    for (let i = 0; i < wide; i++) {
      const fold = (i + Math.round(t * 3)) % 3;
      R.set(left ? x0 + 2 + i : x0 + 27 - i, y, i === wide - 1 ? CLOTH[3] : fold === 0 ? CLOTH[0] : fold === 1 ? CLOTH[1] : CLOTH[2]);
    }
    if (Math.abs(t - 0.62) < 0.02) for (let i = 0; i < 5; i++) R.set(left ? x0 + 2 + i : x0 + 27 - i, y, METAL[1]);
  }
  // The pelmet, scalloped, with a fringe.
  for (let i = 0; i < 28; i++) {
    const drop = 8 + Math.round(Math.abs(Math.sin((i / 28) * Math.PI * 3)) * 3);
    R.fill(x0 + 1 + i, top + 1, 1, drop, i % 9 === 0 ? CLOTH[2] : CLOTH[1]); R.set(x0 + 1 + i, top + 1, CLOTH[0]); R.set(x0 + 1 + i, top + 1 + drop, METAL[i % 2 ? 1 : 2]);
  }
}

const BOOKS = [["#b85a4a", "#8e3c34"], ["#5a7ea8", "#3e5c82"], ["#6a9462", "#4a7046"], ["#c8a45c", "#9c7c3c"], ["#8a6a8e", "#644a68"], ["#d8ccb0", "#b0a488"], ["#7a5a40", "#56402c"]];

/** A bookcase to the floor: a cornice, shelves of books in runs of a colour, cupboards below. */
function bookcase(R: Raster, bx: number, T: number, seed: number) {
  const x0 = bx + 8, wd = 32, top = T + 20, bot = T + 112, c = FRAME;
  R.fill(x0, top, wd, bot - top, c[2]); R.fill(x0, top, 2, bot - top, c[1]); R.fill(x0 + wd - 2, top, 2, bot - top, c[3]);
  R.fill(x0 - 1, top, wd + 2, 3, c[1]); R.fill(x0 - 1, top, wd + 2, 1, c[0]); R.fill(x0 - 1, top + 3, wd + 2, 1, c[4]);
  for (let sh = 0; sh < 5; sh++) {
    const y = top + 5 + sh * 14;
    R.fill(x0 + 2, y, wd - 4, 12, c[4]);
    for (let x = x0 + 2, k = 0; x < x0 + wd - 3; k++) {
      // A run of volumes the same binding, then another.
      const b = BOOKS[Math.floor(h2(seed + sh, k >> 1, 9) * BOOKS.length)], wide = 2 + (h2(seed, sh * 31 + k, 4) > 0.6 ? 1 : 0), tall = 9 + Math.floor(h2(seed + k, sh, 6) * 3);
      if (h2(seed + sh * 7, k, 8) < 0.07) { x += 2; continue; }
      const ww = Math.min(wide, x0 + wd - 2 - x);
      R.fill(x, y + 12 - tall, ww, tall, b[0]); R.fill(x + ww - 1, y + 12 - tall, 1, tall, b[1]); if (tall > 10) R.fill(x, y + 15 - tall, ww - 1, 1, METAL[2]);
      x += ww;
    }
    R.fill(x0 + 2, y + 12, wd - 4, 2, c[1]); R.fill(x0 + 2, y + 12, wd - 4, 1, c[0]);
  }
  const cy = top + 76;
  R.fill(x0 + 2, cy, wd - 4, bot - cy - 3, c[2]);
  for (const dx of [x0 + 3, x0 + wd / 2 + 1]) { R.fill(dx, cy + 2, wd / 2 - 4, bot - cy - 7, c[1]); R.fill(dx, cy + 2, wd / 2 - 4, 1, c[0]); R.fill(dx, cy + 2, 1, bot - cy - 7, c[0]); R.fill(dx + 1, cy + 3, wd / 2 - 6, bot - cy - 9, c[2]); }
  R.fill(x0 + wd / 2 - 2, cy + 6, 1, 2, METAL[1]); R.fill(x0 + wd / 2 + 1, cy + 6, 1, 2, METAL[1]);
  R.fill(x0 - 1, bot - 3, wd + 2, 3, c[3]); R.fill(x0 - 1, bot - 3, wd + 2, 1, c[1]);
}

/** A chimneypiece: a white marble surround with the fire lit, a clock and candles on the shelf, a glass over it. */
function chimneypiece(R: Raster, bx: number, T: number) {
  const x0 = bx + 6, wd = 36, shelf = T + 72, bot = T + 112, cx = bx + 24;
  // The glass over the mantel.
  R.fill(x0 + 4, T + 24, wd - 8, 44, GILT[1]); R.fill(x0 + 4, T + 24, wd - 8, 1, GILT[0]); R.fill(x0 + 4, T + 24, 1, 44, GILT[0]); R.fill(x0 + wd - 5, T + 25, 1, 43, GILT[3]);
  for (let y = T + 26; y < T + 68; y++) for (let x = x0 + 6; x < x0 + wd - 6; x++) R.set(x, y, x === x0 + 6 || y === T + 26 ? MIRROR[4] : glass(x - bx, y - T, y - T - 26));
  crest(R, cx, T + 20);
  // The surround.
  R.fill(x0, shelf + 3, wd, bot - shelf - 3, WHITE[1]); R.fill(x0, shelf + 3, 3, bot - shelf - 3, WHITE[0]); R.fill(x0 + wd - 3, shelf + 3, 3, bot - shelf - 3, WHITE[3]);
  R.fill(x0 + 3, shelf + 5, wd - 6, 6, WHITE[2]); R.fill(x0 + 3, shelf + 5, wd - 6, 1, WHITE[3]); R.fill(cx - 4, shelf + 6, 8, 4, WHITE[1]); R.fill(cx - 3, shelf + 7, 6, 2, WHITE[3]);
  for (const jx of [x0 + 2, x0 + wd - 8]) { R.fill(jx, shelf + 11, 6, bot - shelf - 14, WHITE[1]); R.fill(jx, shelf + 11, 1, bot - shelf - 14, WHITE[0]); R.fill(jx + 2, shelf + 13, 1, bot - shelf - 18, WHITE[3]); R.fill(jx + 5, shelf + 11, 1, bot - shelf - 14, WHITE[3]); }
  R.fill(x0 - 2, shelf, wd + 4, 3, WHITE[0]); R.fill(x0 - 2, shelf + 2, wd + 4, 1, WHITE[2]); R.fill(x0 - 1, shelf + 3, wd + 2, 1, WHITE[4]);
  R.fill(x0 - 1, bot - 3, wd + 2, 3, WHITE[2]); R.fill(x0 - 1, bot - 3, wd + 2, 1, WHITE[0]);
  // The fire.
  const fx = x0 + 8, fw = wd - 16, fy = shelf + 11;
  R.fill(fx, fy, fw, bot - fy - 3, "#33282c"); R.fill(fx, fy, fw, 2, "#241c20"); R.fill(fx, fy, 2, bot - fy - 3, "#241c20");
  for (let i = 2; i < fw - 2; i++) {
    const tall = 4 + Math.round(Math.abs(Math.sin(i * 0.9 + bx)) * 7);
    for (let j = 0; j < tall; j++) R.set(fx + i, bot - 6 - j, j < tall * 0.35 ? "#fff0a0" : j < tall * 0.7 ? "#ffb838" : "#e8702a");
  }
  R.fill(fx + 2, bot - 5, fw - 4, 2, "#5a3a2a"); R.fill(fx + 1, bot - 9, 1, 6, METAL[2]); R.fill(fx + fw - 2, bot - 9, 1, 6, METAL[2]);
  // On the shelf.
  clock(R, cx, shelf - 1); candelabrum(R, x0 + 6, shelf - 1, []); candelabrum(R, x0 + wd - 7, shelf - 1, []);
}

/** A palace room's walls: the back wall seven cells tall, in bays of mirror, damask and doorway
 * between marble pilasters under a gilt entablature; the side and front walls seen from above. */
export function palaceWalls(R: Raster, L: FairLevel, OX: number, OY: number, seed: number) {
  use(L.palace);
  const { w, h } = L, W = w * 16, H = h * 16, T = OY - PALACE_RISE, B = OY + 48, x0 = OX + 8, x1 = OX + W - 8;
  const { b0, n } = palaceBays(w);
  const exitAt = (x: number, y: number) => L.exits.some((e) => x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((y < 3 || x === 0 || x === w - 1 || y === h - 1) && !(exitAt(x, y) && y >= 3)) R.fill(OX + x * 16, OY + y * 16, 16, 16, DARK);
  // The gravel laid under every wall cell strays a pixel or two past the room.
  R.fill(OX + W, OY, 3, H + 3, DARK); R.fill(OX, OY + H, W, 3, DARK);
  R.fill(x0, T, x1 - x0, TALL, CREAM[1]);
  // The dado: a gilt rail, panels outlined in gold, a skirting.
  R.fill(x0, T + 92, x1 - x0, 1, GILT[2]); R.fill(x0, T + 93, x1 - x0, 1, CREAM[0]);
  R.fill(x0, T + 108, x1 - x0, 4, CREAM[2]); R.fill(x0, T + 108, x1 - x0, 1, CREAM[0]); R.fill(x0, T + 111, x1 - x0, 1, CREAM[4]);
  const panel = (x: number, y: number, pw: number, ph: number) => {
    if (pw < 5) return;
    R.fill(x, y, pw, 1, GILT[2]); R.fill(x, y, 1, ph, GILT[2]); R.fill(x, y + ph - 1, pw, 1, GILT[1]); R.fill(x + pw - 1, y, 1, ph, GILT[1]);
    R.fill(x + 1, y + 1, pw - 2, 1, CREAM[3]); R.fill(x + 1, y + 1, 1, ph - 2, CREAM[3]);
  };
  // What is left over at either end of the bays: plain panelling.
  for (const [a, b] of [[x0 + 8, OX + b0 * 16 - 8], [OX + (b0 + 3 * n) * 16 + 8, x1 - 8]]) { panel(a + 2, T + 22, b - a - 4, 66); panel(a + 2, T + 96, b - a - 4, 11); }
  for (let k = 0; k < n; k++) {
    const ax = b0 + 3 * k, bx = OX + ax * 16;
    const hung = L.things.some((t) => t.wall && t.x >= ax && t.x < ax + 3);
    if (L.exits.some((e) => e.y === 0 && e.x === ax)) { doorway(R, bx, T); continue; }
    const bay = hung ? (STYLE.bays.includes("panel") ? "panel" : "hanging") : STYLE.bays[k % STYLE.bays.length];
    if (bay !== "bookcase" && bay !== "hearth") panel(bx + 10, T + 96, 28, 11);
    if (bay === "mirror") mirror(R, bx, T);
    else if (bay === "window") sash(R, bx, T);
    else if (bay === "bookcase") bookcase(R, bx, T, seed + k * 31);
    else if (bay === "hearth") chimneypiece(R, bx, T);
    else hanging(R, bx, T, bay === "panel" ? FIELD : CLOTH, seed + k * 17, hung, bay === "panel");
  }
  // The entablature: a cornice with dentils, a frieze of red marble with gilt brackets, egg and dart under it.
  R.fill(x0, T, x1 - x0, 1, GILT[0]); R.fill(x0, T + 1, x1 - x0, 1, GILT[2]);
  R.fill(x0, T + 2, x1 - x0, 3, CREAM[0]);
  R.fill(x0, T + 5, x1 - x0, 1, GILT[2]);
  for (let x = x0; x < x1; x++) {
    if ((x - x0) % 4 < 2) R.fill(x, T + 3, 1, 2, CREAM[3]);
    for (let y = T + 6; y < T + 12; y++) R.set(x, y, STYLE.pier === "fluted" ? CREAM[y === T + 6 ? 3 : 2] : marble(x, y * 3, y === T + 6 ? 3 : 2, seed + 9));
    const m = (x - OX - b0 * 16 + 480 + 2) % 24;
    if (m < 4) R.fill(x, T + 6, 1, 6, m === 0 ? GILT[0] : m === 3 ? GILT[3] : GILT[1]);
    else if (m === 13 || m === 14) R.fill(x, T + 8, 1, 2, m === 13 ? GILT[0] : GILT[2]);
    R.set(x, T + 12, (x - x0) % 4 === 3 ? GILT[3] : GILT[0]); R.set(x, T + 13, (x - x0) % 4 === 3 ? GILT[3] : GILT[1]);
  }
  R.fill(x0, T + 14, x1 - x0, 1, GILT[3]);
  for (let k = 0; k < 4; k++) for (let x = x0; x < x1; x++) R.shade(x, T + 15 + k, 0.3 - k * 0.07);
  for (let k = 0; k <= n; k++) (STYLE.pier === "fluted" ? fluted : pilaster)(R, OX + (b0 + 3 * k) * 16, T, seed + k);
  // The wall's foot throws a shadow on the floor.
  for (let k = 0; k < 6; k++) for (let x = OX + 16; x < OX + W - 16; x++) if (R.has(x, B + k)) R.shade(x, B + k, 0.3 - k * 0.05);
  // Side walls from above, gilt along the inner edge; open where a doorway goes through.
  for (const [x, left] of [[x0, true], [x1 - 8, false]] as const) {
    R.fill(x, T, 8, PALACE_RISE + H - 8, CREAM[2]); R.fill(x, T, 1, PALACE_RISE + H - 8, left ? CREAM[0] : CREAM[3]);
    R.fill(left ? x + 7 : x, T, 1, PALACE_RISE + H - 8, GILT[2]); R.fill(left ? x + 6 : x + 1, T, 1, PALACE_RISE + H - 8, left ? CREAM[4] : CREAM[0]);
    if (left) for (let k = 0; k < 4; k++) for (let y = B; y < OY + H - 16; y++) R.shade(x + 8 + k, y, 0.26 - k * 0.06);
  }
  R.fill(x0 - 2, T, 2, TALL, DARK); R.fill(x1, T, 2, TALL, DARK);
  const fy = OY + (h - 1) * 16;
  R.fill(x0, fy, x1 - x0, 8, CREAM[2]); R.fill(x0, fy, x1 - x0, 1, GILT[2]); R.fill(x0, fy + 1, x1 - x0, 1, CREAM[0]); R.fill(x0, fy + 7, x1 - x0, 1, CREAM[4]);
  for (const e of L.exits) {
    if (e.y === 0) continue;
    const X = OX + e.x * 16, Y = OY + e.y * 16;
    for (let ay = e.y; ay < e.y + e.h; ay++) for (let ax = e.x; ax < e.x + e.w; ax++) palaceFloor(R, OX + ax * 16, OY + ay * 16, L, ax, ay);
    if (e.y === h - 1) {
      for (let k = 0; k < 16; k++) for (let x = X; x < X + e.w * 16; x++) R.shade(x, Y + k, Math.min(0.85, 0.08 + k * 0.055), [38, 26, 34]);
      for (const jx of [X - 4, X + e.w * 16]) { R.fill(jx, fy, 4, 10, GILT[1]); R.fill(jx, fy, 4, 1, GILT[0]); R.fill(jx, fy + 9, 4, 1, GILT[3]); }
    } else {
      const left = e.x === 0;
      for (let k = 0; k < 16; k++) for (let y = Y; y < Y + e.h * 16; y++) R.shade(left ? X + 15 - k : X + k, y, Math.min(0.85, 0.08 + k * 0.055), [38, 26, 34]);
      for (const jy of [Y - 4, Y + e.h * 16]) { R.fill(left ? X + 6 : X, jy, 10, 4, GILT[1]); R.fill(left ? X + 6 : X, jy, 10, 1, GILT[0]); R.fill(left ? X + 6 : X, jy + 3, 10, 1, GILT[3]); }
    }
  }
}

const sprite = (w: number, h: number, ox: number, foot: number) => ({ r: new Raster(w, h), ox, oy: foot - 14 });

/** An edge in a deeper shade of whatever it borders, lighter along the top: no dark line round anything. */
function soften(r: Raster) {
  const { w, h, data: d } = r, src = new Uint8ClampedArray(d);
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] >= 200;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (on(x, y)) continue;
    for (const [dx, dy, k] of [[0, 1, 0.8], [1, 0, 0.66], [-1, 0, 0.6], [0, -1, 0.54]] as const) {
      if (!on(x + dx, y + dy)) continue;
      const i = (y * w + x) * 4, j = ((y + dy) * w + x + dx) * 4;
      d[i] = src[j] * k; d[i + 1] = src[j + 1] * k * 0.94; d[i + 2] = src[j + 2] * k * 0.9; d[i + 3] = 255;
      break;
    }
  }
}

/** Rows of digits into pixels: each digit a step of the ramp, anything else left clear. */
function stamp(r: Raster, rows: string[], x: number, y: number, c: readonly string[]) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch >= "0" && ch <= "9") r.set(x + i, y + j, c[+ch]); }));
}

const WAX = ["#fffaea", "#ecdcb8"], FLAME = ["#fff6b8", "#ffd65a", "#ff9e2e"];

/** A three-branched candlestick, its foot on `base`. */
function candelabrum(r: Raster, cx: number, base: number, glow: { x: number; y: number }[]) {
  stamp(r, [
    "......11......",
    "......12......",
    ".00...12...00.",
    ".12...12...12.",
    ".1220.12.0122.",
    "..12211221223.",
    "...233122333..",
    "......12......",
    ".....0123.....",
    "......12......",
    "......12......",
    ".....0123.....",
    "....011223....",
    "...01122233...",
  ], cx - 7, base - 13, METAL);
  for (const [dx, top] of [[-5, base - 17], [-1, base - 20], [4, base - 17]]) {
    const tall = dx === -1 ? 7 : 6;
    r.fill(cx + dx, top, 1, tall, WAX[0]); r.fill(cx + dx + 1, top, 1, tall, WAX[1]);
    r.set(cx + dx, top - 1, FLAME[2]); r.set(cx + dx + 1, top - 1, FLAME[1]); r.set(cx + dx, top - 2, FLAME[1]); r.set(cx + dx + 1, top - 2, FLAME[0]); r.set(cx + dx, top - 3, FLAME[0]);
  }
  glow.push({ x: cx, y: base - 20 });
}

const CHINA = ["#ffffff", "#eef1f8", "#cdd5e6", "#a9b4cc"];
function porcelain(r: Raster, cx: number, base: number, n: number) {
  const blue = n % 2 ? ["#5878c4", "#34509c"] : ["#4a8eb0", "#2c6886"], half = [3, 3, 2, 3, 4, 5, 5, 5, 5, 4, 3, 2, 2, 3, 1];
  for (let j = 0; j < half.length; j++) {
    const y = base - j, hw = half[j];
    for (let i = -hw; i < hw; i++) {
      const t = (i + hw) / (hw * 2), paint = j === 1 || j === 11 || j === 13 || (j > 3 && j < 10 && ((i + 9) * 3 + j * 5 + n) % 7 < 3 && Math.abs(i) < hw - 1);
      r.set(cx + i, y, paint ? blue[t > 0.6 ? 1 : 0] : CHINA[t < 0.2 ? 1 : t < 0.45 ? 0 : t < 0.75 ? 1 : t < 0.9 ? 2 : 3]);
    }
  }
}

function clock(r: Raster, cx: number, base: number) {
  stamp(r, [
    "....01....",
    "...0112...",
    "..011223..",
    "..1....3..",
    ".01....23.",
    ".01....23.",
    ".01....23.",
    "..1....3..",
    "..112233..",
    ".01122233.",
    "0112222334",
  ], cx - 5, base - 10, METAL);
  r.fill(cx - 2, base - 7, 4, 5, "#fffaf0"); r.fill(cx + 1, base - 7, 1, 5, "#e6dcc8"); r.fill(cx - 1, base - 6, 1, 2, "#3a3038"); r.set(cx, base - 5, "#3a3038");
}

/** A gilt cabriole leg: a heavy knee, a waist, a scrolled foot. `s` is -1 for the left leg. */
function leg(r: Raster, x: number, top: number, s: number) {
  const rows = ["0123", "0123", "0123", ".012", ".013", ".013", ".013", ".012", "0123", "0123", "0113"];
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") r.set(x + (s < 0 ? i : 3 - i), top + j, FRAME[s < 0 ? +ch : [1, 2, 3, 4][+ch]]); }));
}

const BUST = ["#fdf6e8", "#ecdfc8", "#d4c5aa", "#b3a288", "#8c7c66"];

/** The furniture of a palace room, drawn to stand against the back wall or on the open floor. */
export function paintPalaceDecor(kind: string, v: number, style?: PalaceStyle): FairSprite | undefined {
  use(style);
  const n = Math.floor(v * 997), glow: { x: number; y: number }[] = [];
  if (kind === "console") {
    // A pier table: a thick slab of white marble on a carved and gilded frame, candles and porcelain on it.
    const s = sprite(48, 62, 0, 60), { r } = s, x = 4, wd = 40, top = 32, cx = x + wd / 2;
    r.shadow(24, 59, 20, 3, 0.26);
    // The apron, carved in scrolls, with a mask at its middle.
    r.fill(x + 2, top + 8, wd - 4, 6, FRAME[2]); r.fill(x + 2, top + 8, wd - 4, 1, FRAME[3]); r.fill(x + 2, top + 9, wd - 4, 1, FRAME[1]);
    for (let i = x + 5; i < x + wd - 5; i += 5) { r.fill(i, top + 10, 2, 2, FRAME[0]); r.set(i + 2, top + 11, FRAME[1]); r.fill(i + 1, top + 12, 3, 1, FRAME[3]); }
    for (let i = x + 2; i < x + wd - 2; i++) r.set(i, top + 13 + ((i - x) % 5 === 2 ? 1 : 0), FRAME[3]);
    stamp(r, ["011223", "001123", "011223", ".0123.", "..13.."], cx - 3, top + 10, FRAME);
    leg(r, x + 2, top + 14, -1); leg(r, x + wd - 6, top + 14, 1);
    r.fill(x + 6, top + 21, wd - 12, 2, FRAME[2]); r.fill(x + 6, top + 21, wd - 12, 1, FRAME[1]); r.fill(x + wd / 2, top + 22, wd / 2 - 6, 1, FRAME[3]);
    stamp(r, [".01.", "0123", "0123", ".13."], cx - 2, top + 18, FRAME);
    // The slab: its top seen from above, its front edge below, the corners eased.
    r.fill(x + 1, top, wd - 2, 1, WHITE[0]); r.fill(x, top + 1, wd, 5, WHITE[1]); r.fill(x, top + 1, wd, 1, WHITE[0]);
    r.fill(x, top + 6, wd, 2, WHITE[2]); r.fill(x + 1, top + 8, wd - 2, 1, WHITE[3]); r.fill(x + wd - 2, top + 1, 2, 7, WHITE[2]);
    for (let k = 0; k < 5; k++) { const vx = x + 4 + Math.floor(h2(k, n, 3) * (wd - 10)); r.set(vx, top + 2, WHITE[2]); r.set(vx + 1, top + 3, WHITE[2]); r.set(vx + 2, top + 3, WHITE[2]); r.set(vx + 3, top + 4, WHITE[2]); }
    soften(r);
    // What stands on it, and its shadow on the marble.
    for (const ix of [x + 8, x + wd - 8]) { r.fill(ix - 3, top + 4, 8, 1, WHITE[2]); candelabrum(r, ix, top + 3, glow); }
    r.fill(cx - 3, top + 5, 8, 1, WHITE[2]);
    if (n % 4 === 3) clock(r, cx, top + 4); else porcelain(r, cx, top + 4, n);
    return { ...s, glow };
  }
  if (kind === "stool") {
    // A folding stool, the only seat most of the court was allowed.
    const s = sprite(14, 18, 7, 17), { r } = s;
    r.shadow(7, 16, 6, 2, 0.24);
    stamp(r, [
      ".0001111112.",
      "000111111122",
      "001111111223",
      "011111112223",
      "112222222333",
      "122222223333",
    ], 1, 3, CLOTH);
    r.fill(1, 9, 12, 2, FRAME[2]); r.fill(1, 9, 12, 1, FRAME[1]); r.fill(1, 9, 3, 1, FRAME[0]); r.fill(10, 10, 3, 1, FRAME[3]);
    for (const x of [1, 10]) stamp(r, ["012", "013", ".13", "013", "123"], x, 11, FRAME);
    soften(r);
    return s;
  }
  if (kind === "bench") {
    // A long bench in crimson velvet on a gilt frame.
    const s = sprite(48, 24, 0, 23), { r } = s, c = CLOTH;
    r.shadow(24, 22, 21, 3, 0.26);
    r.fill(3, 4, 42, 1, c[0]); r.fill(2, 5, 44, 5, c[1]); r.fill(2, 5, 30, 1, c[0]); r.fill(2, 10, 44, 3, c[2]); r.fill(2, 12, 44, 1, c[3]); r.fill(44, 5, 2, 7, c[2]);
    for (let x = 8; x < 44; x += 7) r.set(x, 7, c[2]), r.set(x, 8, c[0]);
    r.fill(2, 13, 44, 3, FRAME[2]); r.fill(2, 13, 44, 1, FRAME[1]); r.fill(2, 13, 12, 1, FRAME[0]); r.fill(2, 15, 44, 1, FRAME[3]);
    for (let x = 6; x < 44; x += 5) r.set(x, 14, FRAME[0]);
    for (const x of [2, 15, 30, 43]) stamp(r, ["012", "013", ".13", "013", "123"], x, 16, FRAME);
    soften(r);
    return s;
  }
  if (kind === "bust") {
    // A marble head and shoulders on a pedestal faced with red marble.
    const s = sprite(20, 58, 2, 57), { r } = s, cx = 10;
    r.shadow(cx + 1, 56, 9, 3, 0.26);
    r.fill(cx - 8, 51, 16, 5, CREAM[1]); r.fill(cx - 8, 51, 16, 1, CREAM[0]); r.fill(cx - 8, 55, 16, 1, CREAM[3]); r.fill(cx + 6, 52, 2, 3, CREAM[3]);
    r.fill(cx - 6, 30, 12, 21, CREAM[1]); r.fill(cx - 6, 30, 2, 21, CREAM[0]); r.fill(cx + 4, 30, 2, 21, CREAM[3]);
    for (let y = 34; y < 48; y++) for (let i = -3; i < 3; i++) r.set(cx + i, y, marble(cx + i + n, y, i < -1 ? 1 : i > 0 ? 3 : 2, n));
    r.fill(cx - 3, 33, 6, 1, CREAM[4]); r.fill(cx - 4, 33, 1, 15, CREAM[4]); r.fill(cx - 3, 48, 7, 1, CREAM[0]);
    r.fill(cx - 8, 27, 16, 3, CREAM[0]); r.fill(cx - 8, 29, 16, 1, CREAM[3]); r.fill(cx + 6, 27, 2, 2, CREAM[2]);
    stamp(r, [
      "...122221...",
      "..12111222..",
      ".1211111223.",
      ".1100001123.",
      ".1003003123.",
      ".2100001223.",
      ".2100201223.",
      "..10033123..",
      "..21001123..",
      "...211123...",
      "....0123....",
      "....0123....",
      "..10011223..",
      ".1000112223.",
      "100011122233",
      "100111222233",
      ".1011222333.",
      "..11222333..",
      "....1223....",
      "...012233...",
      "..00112233..",
    ], cx - 6, 6, BUST);
    soften(r);
    return s;
  }
  if (kind === "orange") {
    // An orange tree clipped to a ball, in a green Versailles tub.
    const s = sprite(22, 48, 3, 47), { r } = s, cx = 11, leaf = ["#b4d878", "#86b854", "#5e963c", "#42782e", "#2c5a24"], tub = ["#84ba74", "#5e9a5a", "#447e4a", "#30603a"];
    r.shadow(cx + 1, 46, 9, 3, 0.26);
    r.fill(cx - 7, 33, 14, 12, tub[1]); r.fill(cx - 7, 33, 14, 1, tub[0]); r.fill(cx - 7, 33, 2, 12, tub[0]); r.fill(cx + 5, 33, 2, 12, tub[3]); r.fill(cx - 7, 44, 14, 1, tub[3]);
    r.fill(cx - 4, 35, 3, 8, tub[2]); r.fill(cx - 4, 35, 3, 1, tub[3]); r.fill(cx + 1, 35, 3, 8, tub[2]); r.fill(cx + 1, 35, 3, 1, tub[3]);
    for (const x of [cx - 8, cx + 6]) { r.fill(x, 30, 2, 3, BUST[1]); r.set(x, 30, BUST[0]); r.set(x + 1, 32, BUST[3]); }
    r.fill(cx - 5, 32, 10, 1, "#6a4a34");
    r.fill(cx - 1, 20, 2, 12, "#8a6a4a"); r.fill(cx - 1, 20, 1, 12, "#b08e68");
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) {
      const lump = h2((x + 20) >> 2, (y + 20) >> 2, n) * 1.4;
      if (x * x + y * y > (10 - lump) ** 2) continue;
      // Lit from the upper left in broad bands, with leaf clusters two pixels across breaking each band's edge.
      const k = (-x * 0.7 - y) / 10 + (h2((x + 30) >> 1, (y + 30) >> 1, n + 1) - 0.5) * 0.3;
      r.set(cx + x, 12 + y, leaf[k > 0.55 ? 0 : k > 0.15 ? 1 : k > -0.3 ? 2 : k > -0.65 ? 3 : 4]);
    }
    for (let k = 0; k < 6; k++) {
      const a = h2(k, n, 5) * 6.28, d = 2 + h2(k, n, 6) * 6, x = Math.round(cx + Math.cos(a) * d), y = Math.round(12 + Math.sin(a) * d);
      r.fill(x, y, 2, 2, "#f08a24"); r.set(x, y, "#ffc45a"); r.set(x + 1, y + 1, "#c8641a");
    }
    soften(r);
    return s;
  }
  if (kind === "torchere") {
    // A tall gilt stand carrying candles.
    const s = sprite(16, 54, 0, 53), { r } = s, cx = 8;
    r.shadow(cx, 52, 6, 2, 0.24);
    stamp(r, [
      ".00111122233.",
      "..011122233..",
      "....0123.....",
      "....0123.....",
      "...011233....",
      "....0123.....",
      "....0123.....",
      "....0123.....",
      "....0123.....",
      "...011233....",
      "..00112233...",
      "...011233....",
      "....0123.....",
      "....0123.....",
      "....0123.....",
      "....0123.....",
      "...011233....",
      "....0123.....",
      "...001233....",
      "..00112233...",
      ".0011222333..",
      "001.0123.233.",
      "01..0123..34.",
    ], cx - 6, 28, METAL);
    soften(r);
    candelabrum(r, cx, 27, glow);
    return { ...s, glow };
  }
  if (kind === "sofa") {
    // A sofa: an upholstered back under a carved rail, scrolled arms, a deep seat.
    const s = sprite(48, 36, 0, 35), { r } = s, c = CLOTH;
    r.shadow(24, 34, 21, 3, 0.26);
    for (let x = 4; x < 44; x++) { const rise = Math.round(Math.sin(((x - 4) / 39) * Math.PI) * 3); r.fill(x, 7 - rise, 1, 2, FRAME[x < 20 ? 1 : 2]); r.set(x, 7 - rise, FRAME[x < 24 ? 0 : 1]); r.fill(x, 9 - rise, 1, 10 + rise, x % 8 === 3 ? c[2] : c[1]); r.set(x, 9 - rise, c[0]); }
    for (let x = 9; x < 42; x += 8) r.set(x, 12, c[3]), r.set(x, 11, c[0]);
    r.fill(3, 19, 42, 5, c[1]); r.fill(3, 19, 42, 1, c[0]); r.fill(3, 20, 26, 1, c[0]); r.fill(3, 24, 42, 4, c[2]); r.fill(3, 27, 42, 1, c[3]);
    for (const [x, lit] of [[1, true], [42, false]] as const) { r.fill(x, 12, 5, 16, c[lit ? 1 : 2]); r.fill(x, 11, 5, 2, FRAME[1]); r.fill(x, 11, 3, 1, FRAME[0]); r.fill(x + (lit ? 0 : 4), 13, 1, 15, lit ? c[0] : c[3]); r.fill(x + 1, 13, 3, 3, FRAME[2]); r.set(x + 1, 13, FRAME[0]); }
    r.fill(1, 28, 46, 2, FRAME[2]); r.fill(1, 28, 46, 1, FRAME[1]); r.fill(1, 28, 14, 1, FRAME[0]);
    for (const x of [2, 16, 29, 43]) stamp(r, ["012", "013", ".13", "013", "123"], x, 30, FRAME);
    soften(r);
    return s;
  }
  if (kind === "chair" || kind === "chair-back") {
    // A side chair, facing the room or turned to a table.
    const s = sprite(16, 28, 0, 27), { r } = s, c = CLOTH, back = kind === "chair-back";
    r.shadow(8, 26, 6, 2, 0.22);
    r.fill(3, 2, 10, 13, FRAME[2]); r.fill(3, 2, 10, 1, FRAME[0]); r.fill(3, 2, 1, 13, FRAME[1]); r.fill(12, 3, 1, 12, FRAME[3]); r.fill(4, 1, 8, 1, FRAME[1]);
    if (back) { r.fill(5, 4, 6, 9, FRAME[3]); r.fill(5, 4, 6, 1, FRAME[4]); r.fill(7, 5, 2, 8, FRAME[2]); }
    else { r.fill(5, 4, 6, 9, c[1]); r.fill(5, 4, 6, 1, c[0]); r.fill(5, 4, 1, 9, c[0]); r.fill(10, 5, 1, 8, c[2]); }
    r.fill(2, 15, 12, 4, back ? FRAME[2] : c[1]); r.fill(2, 15, 12, 1, back ? FRAME[1] : c[0]); r.fill(2, 18, 12, 1, back ? FRAME[3] : c[2]);
    r.fill(2, 19, 12, 2, FRAME[2]); r.fill(2, 19, 12, 1, FRAME[1]);
    for (const x of [2, 11]) stamp(r, ["012", "013", ".13", "013", "123"], x, 21, FRAME);
    soften(r);
    return s;
  }
  if (kind.startsWith("dining:")) {
    // A table laid for dinner: a white cloth, a plate to each chair, candles and dishes down the middle,
    // chairs behind it facing out and chairs in front with their backs to the room.
    const cells = Number(kind.slice(7)), W = cells * 16, s = sprite(W, 68, 0, 50), { r } = s, c = CLOTH;
    r.shadow(W / 2, 53, W / 2 - 2, 4, 0.26);
    for (let x = 12; x + 10 < W - 6; x += 16) { r.fill(x, 3, 10, 14, FRAME[2]); r.fill(x, 3, 10, 1, FRAME[0]); r.fill(x, 3, 1, 14, FRAME[1]); r.fill(x + 9, 4, 1, 13, FRAME[3]); r.fill(x + 2, 5, 6, 10, c[1]); r.fill(x + 2, 5, 6, 1, c[0]); r.fill(x + 7, 6, 1, 9, c[2]); }
    r.fill(3, 15, W - 6, 1, WHITE[0]); r.fill(2, 16, W - 4, 24, WHITE[1]); r.fill(2, 16, W - 4, 1, WHITE[0]); r.fill(W - 4, 17, 2, 23, WHITE[2]);
    for (let x = 2; x < W - 2; x++) { const fold = x % 7; r.fill(x, 40, 1, 9 + (fold === 3 ? 1 : 0), fold === 0 ? WHITE[3] : fold < 3 ? WHITE[2] : WHITE[1]); }
    r.fill(2, 40, W - 4, 1, WHITE[2]);
    soften(r);
    for (let x = 12; x + 10 < W - 6; x += 16) for (const y of [19, 33]) {
      r.fill(x + 1, y, 8, 4, WHITE[0]); r.fill(x + 2, y - 1, 6, 1, WHITE[0]); r.fill(x + 2, y + 4, 6, 1, WHITE[3]); r.fill(x + 3, y + 1, 4, 2, WHITE[2]); r.fill(x, y + 1, 1, 2, WHITE[3]);
      r.fill(x + 10, y, 1, 4, "#c8ccd4"); r.set(x + 10, y, "#eef0f4");
    }
    for (let x = 20, k = 0; x < W - 14; x += 32, k++) {
      if (k % 2 === 0) candelabrum(r, x, 30, glow);
      else { stamp(r, ["..0112..", ".001122.", "00112233", ".012233.", "..0123..", ".001233."], x - 4, 24, METAL); for (const [dx, dy, col] of [[-2, -2, "#e04a3a"], [1, -3, "#f0a030"], [3, -2, "#7ab04e"], [0, -1, "#c83a5a"]] as const) r.fill(x + dx, 24 + dy, 2, 2, col); }
    }
    for (let x = 12; x + 10 < W - 6; x += 16) {
      r.fill(x, 40, 10, 13, FRAME[2]); r.fill(x, 40, 10, 1, FRAME[0]); r.fill(x, 40, 1, 13, FRAME[1]); r.fill(x + 9, 41, 1, 12, FRAME[3]); r.fill(x + 2, 42, 6, 9, FRAME[3]); r.fill(x + 4, 43, 2, 8, FRAME[2]);
      r.fill(x - 1, 53, 12, 3, FRAME[2]); r.fill(x - 1, 53, 12, 1, FRAME[1]);
      for (const lx of [x - 1, x + 8]) stamp(r, ["012", "013", ".13", "013", "123"], lx, 56, FRAME);
      r.fill(x - 1, 39, 1, 1, FRAME[4]);
    }
    return { ...s, glow };
  }
  if (kind === "desk") {
    // A pedestal desk with a leather top, papers and an inkstand on it, and its chair behind.
    const s = sprite(48, 44, 0, 43), { r } = s;
    r.shadow(24, 42, 21, 3, 0.26);
    r.fill(19, 2, 10, 13, FRAME[2]); r.fill(19, 2, 10, 1, FRAME[0]); r.fill(19, 2, 1, 13, FRAME[1]); r.fill(21, 4, 6, 10, CLOTH[1]); r.fill(21, 4, 6, 1, CLOTH[0]);
    r.fill(2, 15, 44, 1, FRAME[0]); r.fill(1, 16, 46, 8, FRAME[1]); r.fill(1, 16, 46, 1, FRAME[0]); r.fill(45, 17, 2, 7, FRAME[2]);
    r.fill(5, 17, 38, 6, "#4a8060"); r.fill(5, 17, 38, 1, "#6aa07c"); r.fill(5, 22, 38, 1, "#366048"); for (let x = 5; x < 43; x += 2) r.set(x, 17, METAL[2]);
    r.fill(1, 24, 46, 2, FRAME[2]); r.fill(1, 25, 46, 1, FRAME[4]);
    for (const x of [2, 31]) { r.fill(x, 26, 15, 15, FRAME[2]); r.fill(x, 26, 1, 15, FRAME[1]); r.fill(x + 14, 26, 1, 15, FRAME[4]); for (const y of [27, 32, 37]) { r.fill(x + 2, y, 11, 4, FRAME[1]); r.fill(x + 2, y, 11, 1, FRAME[0]); r.fill(x + 2, y + 3, 11, 1, FRAME[3]); r.fill(x + 6, y + 1, 3, 1, METAL[1]); } }
    r.fill(17, 26, 14, 9, FRAME[4]); r.fill(17, 26, 14, 3, FRAME[3]);
    soften(r);
    r.fill(9, 18, 8, 4, "#fffaf0"); r.fill(11, 19, 8, 4, "#f4ecd8"); r.fill(12, 20, 5, 1, "#8a8478");
    r.fill(30, 19, 7, 3, METAL[2]); r.fill(30, 19, 7, 1, METAL[1]); r.fill(31, 17, 2, 2, "#2a2a3a"); r.fill(34, 17, 2, 2, "#2a2a3a"); for (let k = 0; k < 6; k++) r.set(36 + (k >> 1), 16 - k, "#fffaf0");
    candelabrum(r, 40, 19, glow);
    return { ...s, glow };
  }
  if (kind === "globe") {
    // A library globe in a wooden stand, a brass meridian over it.
    const s = sprite(18, 34, 1, 33), { r } = s, cx = 9, cy = 12;
    r.shadow(cx, 32, 7, 2, 0.24);
    for (const dx of [-5, 4]) stamp(r, ["01", "12", "12", "12", "12", "12", "12", "23"], cx + dx, 23, FRAME);
    r.fill(cx - 6, 21, 13, 3, FRAME[2]); r.fill(cx - 6, 21, 13, 1, FRAME[0]); r.fill(cx - 6, 23, 13, 1, FRAME[4]); r.fill(cx - 4, 28, 9, 1, FRAME[3]);
    for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) {
      if (x * x + y * y > 68) continue;
      const k = (-x * 0.7 - y) / 8, land = h2((x + 20 + n) >> 1, (y + 20) >> 1, n) > 0.55;
      r.set(cx + x, cy + y, land ? (k > 0.3 ? "#c8c486" : k > -0.3 ? "#a8a468" : "#84804e") : k > 0.5 ? "#b8d8e4" : k > 0 ? "#8cb8cc" : k > -0.5 ? "#6a98b0" : "#4e7a94");
    }
    soften(r);
    for (let a = 0; a < 40; a++) { const t = (a / 40) * 6.283; r.set(cx + Math.round(Math.cos(t) * 9), cy + Math.round(Math.sin(t) * 9), METAL[Math.cos(t) + Math.sin(t) < 0 ? 1 : 3]); }
    return s;
  }
  return undefined;
}
