import { h2, Raster } from "../ship/raster";
import { palaceBays, type FairLevel } from "../../world/fair";
import type { FairSprite } from "./things";
import { fairById } from "../../content/fairs";
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
    } else if (kind === "mosaic") {
      // White tesserae with a black band round the room and a small cross at intervals.
      const ex = Math.min(gx - 16, (L.w - 1) * 16 - 1 - gx), ey = Math.min(gy - 48, (L.h - 1) * 16 - 1 - gy), e = Math.min(ex, ey);
      const u = ((gx + (Math.floor(gy / 48) % 2) * 24) % 48) - 24, v = (gy % 48) - 24, cross = (u === 0 || v === 0) && Math.abs(u) + Math.abs(v) < 3;
      col = (e >= 10 && e < 13) || e === 16 ? "#3e3a42" : cross && e > 22 ? "#8e8a90" : ((gx >> 1) + (gy >> 1)) % 2 ? "#ebe5d6" : "#e3dccc";
    } else if (kind === "signinum") {
      // Crushed tile in mortar, set with rows of white stones.
      const dot = gx % 12 === 6 && gy % 12 === 6 || gx % 12 === 0 && gy % 12 === 0;
      col = dot ? "#f0e8d8" : h2(gx >> 1, gy >> 1, 31) > 0.8 ? "#b46a52" : h2(gx >> 2, gy >> 2, 32) > 0.7 ? "#a25a44" : "#aa604a";
    } else if (kind === "earth") {
      // Beaten earth: broad soft patches a shade apart, a little straw trodden in.
      const o = PARQUET[0], rough = Math.floor(h2(gy >> 1, 3, 1) * 3), a = h2((gx + rough) >> 4, (gy + rough) >> 4, 11), b = h2((gx + 5 - rough) >> 3, (gy + 3) >> 3, 12);
      const straw = h2(gx >> 2, gy, 13) > 0.996;
      col = straw ? "#b8a070" : a > 0.62 && b > 0.45 ? o.a : a < 0.3 && b < 0.55 ? o.shade : b > 0.86 ? o.ground : o.b;
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
  if (STYLE.order === "timber") {
    // No windows: the fires light the floor round them, and the corners are dark.
    const fires = L.decor.filter((d) => d.type === "palace:hearth").map((d) => [d.x * 16 + 32, d.y * 16 - 6]);
    for (let y = 48; y < (L.h - 1) * 16; y++) for (let x = 16; x < (L.w - 1) * 16; x++) {
      const d = Math.min(...fires.map(([fx, fy]) => Math.hypot(x - fx, (y - fy) * 1.5)), 999);
      if (d < 72) R.shade(OX + x, OY + y, 0.26 * (1 - d / 72), [255, 176, 96]);
      else if (d > 96) R.shade(OX + x, OY + y, Math.min(0.34, (d - 96) / 300), [34, 24, 34]);
    }
    return;
  }
  if (STYLE.order === "roman") {
    // Daylight comes down through the roof: bright round the pool or the garden, dimmer toward the walls.
    const c = L.court;
    if (c) for (let y = 48; y < (L.h - 1) * 16; y++) for (let x = 16; x < (L.w - 1) * 16; x++) {
      const dx = Math.max(c.x0 * 16 - x, 0, x - (c.x1 + 1) * 16), dy = Math.max(c.y0 * 16 - y, 0, y - (c.y1 + 1) * 16), d = Math.hypot(dx, dy);
      if (d < 40) R.shade(OX + x, OY + y, 0.16 * (1 - d / 40), [255, 250, 220]);
      else if (d > 70) R.shade(OX + x, OY + y, Math.min(0.14, (d - 70) / 900), [40, 30, 44]);
    }
    return;
  }
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

const THATCH = ["#6a5438", "#584430", "#463626", "#34281c"], BONE = ["#f4ecd8", "#dccfb2", "#b8aa8c", "#8e8068"], HIDE = ["#dcc09a", "#c4a47c", "#a48660", "#806648"], IRONC = ["#c8ccd4", "#9aa0aa", "#6c727c", "#484c56"];

/** A timber hall's back wall: the underside of the thatch on its rafters, a wall plate, daub or planks between
 * posts with braces, and in each bay something hung up or a doorway. */
function timberBack(R: Raster, L: FairLevel, OX: number, T: number, seed: number) {
  const W = L.w * 16, x0 = OX + 8, x1 = OX + W - 8, { b0, n } = palaceBays(L.w), plank = STYLE.walling === "plank", B = T + TALL;
  for (let y = T; y < T + 38; y++) for (let x = x0; x < x1; x++) {
    // Reed thatch in courses, blacker with smoke toward the ridge.
    const t = y - T, course = Math.floor(t / 5), reed = h2((x + course * 3) >> 1, course, seed);
    R.set(x, y, t % 5 === 4 ? THATCH[3] : reed > 0.72 ? THATCH[0] : reed < 0.2 ? THATCH[2] : THATCH[1]);
    R.shade(x, y, 0.5 - (t / 38) * 0.4, [24, 18, 20]);
  }
  for (let x = OX + b0 * 16 - 24; x < x1; x += 24) if (x > x0) { R.fill(x - 1, T, 3, 38, GILT[3]); R.fill(x - 1, T, 1, 38, GILT[2]); for (let y = T; y < T + 20; y++) for (let i = -1; i < 2; i++) R.shade(x + i, y, 0.4 - (y - T) * 0.02, [24, 18, 20]); }
  R.fill(x0, T + 38, x1 - x0, 7, GILT[2]); R.fill(x0, T + 38, x1 - x0, 1, GILT[0]); R.fill(x0, T + 39, x1 - x0, 1, GILT[1]); R.fill(x0, T + 44, x1 - x0, 1, GILT[4]);
  for (let x = x0 + 5; x < x1; x += 12) R.fill(x, T + 41, 2, 2, GILT[4]);
  for (let y = T + 45; y < T + 108; y++) for (let x = x0; x < x1; x++) {
    let col: string;
    if (plank) {
      // Upright planks, each a tone of its own, a dark joint between.
      const p = Math.floor((x - x0) / 6), tone = h2(p, 3, seed), knot = h2(p, (y - T) >> 3, seed + 5) > 0.965 && (x - x0) % 6 > 1 && (x - x0) % 6 < 4;
      col = (x - x0) % 6 === 5 ? CREAM[4] : knot ? CREAM[4] : (x - x0) % 6 === 0 ? CREAM[tone > 0.5 ? 0 : 1] : tone > 0.66 ? CREAM[1] : tone < 0.3 ? CREAM[3] : CREAM[2];
    } else {
      // Daub: broad patches where it was laid on and mended, a crack here and there, darker with damp at the foot.
      const patch = h2((x + ((y >> 2) % 3) * 2) >> 4, (y + ((x >> 3) % 2) * 3) >> 3, seed), crack = h2((x - (y >> 1)) >> 1, y >> 4, seed + 2) > 0.985 && (x + y) % 3 === 0;
      col = y > T + 100 ? CREAM[patch > 0.5 ? 2 : 3] : crack ? CREAM[3] : patch > 0.74 ? CREAM[0] : patch < 0.24 ? CREAM[2] : CREAM[1];
    }
    R.set(x, y, col);
  }
  for (let k = 0; k < 5; k++) for (let x = x0; x < x1; x++) R.shade(x, T + 45 + k, 0.34 - k * 0.06, [30, 22, 24]);
  R.fill(x0, T + 108, x1 - x0, 4, GILT[3]); R.fill(x0, T + 108, x1 - x0, 1, GILT[2]); R.fill(x0, T + 111, x1 - x0, 1, GILT[4]);
  for (let k = 0; k < n; k++) {
    const ax = b0 + 3 * k, bx = OX + ax * 16, hung = L.things.some((t) => t.wall && t.x >= ax && t.x < ax + 3);
    if (L.exits.some((e) => e.y === 0 && e.x === ax)) { timberDoor(R, bx, B); continue; }
    const bay = hung ? "bare" : STYLE.bays[k % STYLE.bays.length], s2 = seed + k * 13;
    if (bay === "hanging") weaving(R, bx + 9, T + 50, 30, 46, s2);
    else if (bay === "shields") shields(R, bx, T, s2);
    else if (bay === "hides") hide(R, bx + 24, T + 76, s2);
    else if (bay === "antlers") antlers(R, bx + 24, T + 78);
    else if (bay === "shelf") shelf(R, bx, T, s2);
  }
  // Posts at every bay, braced up to the plate.
  for (let k = 0; k <= n; k++) {
    const px = OX + (b0 + 3 * k) * 16;
    for (let y = T + 45; y < T + 108; y++) for (let i = 0; i < 3; i++) R.shade(px + 4 + i, y, 0.2 - i * 0.06, [30, 22, 24]);
    for (const s of [-1, 1]) for (let j = 0; j < 10; j++) { R.fill(px + s * (4 + j) - (s < 0 ? 2 : 0), T + 56 - j, 3, 4, GILT[s < 0 ? 2 : 3]); R.fill(px + s * (4 + j) - (s < 0 ? 2 : 0), T + 56 - j, 3, 1, GILT[s < 0 ? 0 : 1]); }
    for (let y = T + 38; y < B; y++) for (let i = 0; i < 10; i++) {
      const grain = h2(i + k * 9, (y - T) >> 3, seed + 4) > 0.82;
      R.set(px - 5 + i, y, GILT[i === 0 ? 0 : i < 4 ? 1 : i < 7 ? (grain ? 3 : 2) : i < 9 ? 3 : 4]);
    }
    if (!STYLE.rude) for (let j = 0; j < 9; j++) for (let i = 0; i < 10; i++) R.set(px - 5 + i, T + 70 + j, j === 0 || j === 8 ? GILT[4] : (i + j) % 4 < 2 ? GILT[0] : GILT[3]);
    R.fill(px - 6, T + 108, 12, 4, ROUGE[2]); R.fill(px - 6, T + 108, 12, 1, ROUGE[0]); R.fill(px + 3, T + 109, 3, 3, ROUGE[3]);
  }
}

/** A doorway in a timber wall: posts and a lintel, the dark of the next house, and a plank door swung in, or a hide tied back. */
function timberDoor(R: Raster, bx: number, B: number) {
  const x0 = bx + 9, top = B - 56;
  for (let y = top; y < B; y++) for (let x = x0; x < x0 + 30; x++) { const t = (y - top) / 56; R.set(x, y, t > 0.86 ? "#5a4636" : t > 0.6 ? "#3e2e26" : "#2a1f1e"); }
  for (let x = x0 + 8; x < x0 + 26; x++) for (let j = 0; j < 5; j++) if ((x + j) % 5 < 3) R.set(x, B - 3 - j, "#6a5440");
  if (STYLE.rude) {
    // A hide curtain, gathered to one side.
    for (let y = top; y < B - 2; y++) { const wide = 6 + Math.round(Math.abs(Math.sin((y - top) * 0.11)) * 5 + (y - top) * 0.06); for (let i = 0; i < wide; i++) R.set(x0 + i, y, i === wide - 1 ? HIDE[3] : i % 4 === 0 ? HIDE[2] : i % 4 === 2 ? HIDE[0] : HIDE[1]); }
    R.fill(x0, top + 30, 9, 2, BONE[1]);
  } else for (let i = 0; i < 10; i++) {
    const y0 = top + Math.round(i * 0.7), y1 = B - 1 - Math.round(i * 1.5);
    for (let y = y0; y <= y1; y++) { const t = (y - y0) / (y1 - y0), ledge = Math.abs(t - 0.2) < 0.03 || Math.abs(t - 0.8) < 0.03; R.set(x0 + i, y, i === 9 ? FRAME[4] : ledge ? FRAME[3] : i % 3 === 2 ? FRAME[3] : i === 0 ? FRAME[0] : FRAME[i % 3 === 0 ? 1 : 2]); }
    if (i === 7) R.fill(x0 + i, top + 30, 1, 4, IRONC[2]);
  }
  for (const jx of [x0 - 6, x0 + 30]) { R.fill(jx, top - 6, 6, 62, GILT[2]); R.fill(jx, top - 6, 1, 62, GILT[0]); R.fill(jx + 1, top - 6, 1, 62, GILT[1]); R.fill(jx + 5, top - 6, 1, 62, GILT[4]); }
  R.fill(x0 - 8, top - 7, 46, 7, GILT[2]); R.fill(x0 - 8, top - 7, 46, 1, GILT[0]); R.fill(x0 - 8, top - 1, 46, 1, GILT[4]);
  if (!STYLE.rude) for (let x = x0 - 6; x < x0 + 36; x++) R.set(x, top - 4 + ((x >> 1) % 2), GILT[(x >> 1) % 2 ? 0 : 4]);
  R.fill(x0, B - 2, 30, 2, GILT[3]); R.fill(x0, B - 2, 30, 1, GILT[1]);
}

/** A woven hanging on a rod: bands of plain weave, zigzag and lozenges in the room's cloth, a fringe at the foot. */
function weaving(R: Raster, x: number, y: number, w: number, h: number, seed: number) {
  const c = CLOTH, pale = BONE[0];
  R.fill(x - 3, y - 2, w + 6, 2, GILT[3]); R.fill(x - 3, y - 2, w + 6, 1, GILT[1]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const band = Math.floor(j / 7), kind = (band + (seed % 5)) % 5, v = j % 7;
    let col = kind === 0 ? c[1] : kind === 1 ? ((i + Math.abs(v - 3)) % 6 < 2 ? pale : c[2]) : kind === 2 ? pale : kind === 3 ? (Math.abs((i % 8) - 4) + Math.abs(v - 3) < 3 ? c[0] : c[3]) : c[2];
    if (v === 0) col = c[3];
    if (j >= h - 3) col = i % 2 ? c[1] : pale;
    R.set(x + i, y + j, col);
    if (i % 10 === 9 || i === w - 1) R.shade(x + i, y + j, 0.12);
  }
  for (let j = 2; j < h; j++) R.shade(x + w, y + j, 0.2), R.shade(x + w + 1, y + j + 1, 0.1);
}

function shield(R: Raster, cx: number, cy: number, r: number, seed: number) {
  const a = CLOTH, b = h2(seed, 1, 2) > 0.5 ? BONE : ["#3a3a44", "#2e2e38", "#24242c", "#1a1a20"], quarter = h2(seed, 2, 2) > 0.5;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x + 0.5, y + 0.5);
    if (d > r) continue;
    const side = quarter ? x * y < 0 : x < 0, lit = -x - y > r * 0.5 ? 0 : x + y > r * 0.7 ? 2 : 1;
    R.set(cx + x, cy + y, d > r - 1.2 ? HIDE[x + y > 0 ? 3 : 2] : d < 2.2 ? IRONC[x + y < 0 ? 0 : 2] : (side ? a : b)[lit]);
  }
  for (let y = 2; y <= r; y++) R.shade(cx + r + 1, cy + y - 2, 0.2);
}

function shields(R: Raster, bx: number, T: number, seed: number) {
  // Two spears crossed behind a pair of shields.
  for (let k = 0; k < 52; k++) { R.set(bx + 9 + Math.round(k * 0.58), T + 104 - k, BONE[2]); R.set(bx + 39 - Math.round(k * 0.58), T + 104 - k, BONE[1]); }
  for (const [hx, s] of [[bx + 39, 1], [bx + 9, -1]]) for (let j = 0; j < 5; j++) R.fill(hx - (j > 2 ? 0 : 1), T + 52 - j - 4 + j * 2, j > 2 ? 1 : 2, 1, IRONC[s > 0 ? 0 : 1]);
  shield(R, bx + 16, T + 72, 9, seed); shield(R, bx + 33, T + 78, 9, seed + 3);
}

/** A hide pegged out to cure: broad in the body, the legs drawn out to pegs at the corners, darker down the spine. */
function hide(R: Raster, cx: number, cy: number, seed: number) {
  for (let y = -24; y <= 24; y++) for (let x = -17; x <= 17; x++) {
    const ax = Math.abs(x), ay = Math.abs(y), body = ax < 11 - (ay > 14 ? (ay - 14) * 0.5 : 0) - (ay < 5 ? 1.5 : 0) && ay < 19;
    const leg = ay > 11 && ay < 24 && Math.abs(ax - 8 - (ay - 11) * 0.65) < 2.6 - (ay - 11) * 0.12, neck = ax < 4 - (y < -21 ? 1 : 0) && y < -15 && y > -24;
    if (!body && !leg && !neck) continue;
    const rim = !((Math.abs(x) < 9 - (ay > 14 ? (ay - 14) * 0.5 : 0) - (ay < 5 ? 1.5 : 0)) && ay < 17) && !neck;
    const fold = h2((x + 40) >> 2, (y + 40) >> 3, seed) > 0.8;
    R.set(cx + x, cy + y, rim ? HIDE[leg && !body ? 2 : 3] : ax < 2 ? HIDE[2] : fold ? HIDE[2] : x < -3 ? HIDE[0] : HIDE[1]);
  }
  for (const [px, py] of [[-16, -23], [15, -23], [-16, 22], [15, 22]]) R.fill(cx + px, cy + py, 2, 2, GILT[4]);
}

/** A skull and antlers on the wall. */
function antlers(R: Raster, cx: number, cy: number) {
  for (const s of [-1, 1]) {
    for (let k = 0; k < 22; k++) { const x = cx + s * (3 + Math.round(k * 0.55 + Math.sin(k * 0.2) * 3)), y = cy - 4 - k; R.fill(x, y, 2, 1, BONE[s < 0 ? 0 : 1]); R.set(x + (s < 0 ? 1 : 0), y, BONE[s < 0 ? 1 : 2]); }
    for (const [at, len] of [[6, 6], [12, 7], [17, 5]]) for (let j = 0; j < len; j++) R.set(cx + s * (3 + Math.round(at * 0.55 + Math.sin(at * 0.2) * 3) + j + 1), cy - 4 - at - Math.round(j * 0.8), BONE[j === len - 1 ? 0 : 1]);
  }
  for (let y = 0; y < 12; y++) { const hw = y < 3 ? 4 : y < 7 ? 5 - ((y - 3) >> 1) : 3 - ((y - 7) >> 1); R.fill(cx - hw, cy - 5 + y, hw * 2, 1, BONE[1]); R.set(cx - hw, cy - 5 + y, BONE[0]); R.set(cx + hw - 1, cy - 5 + y, BONE[2]); }
  R.fill(cx - 3, cy - 2, 2, 2, BONE[3]); R.fill(cx + 1, cy - 2, 2, 2, BONE[3]); R.fill(cx - 1, cy + 4, 2, 2, BONE[3]);
}

const CLAY = ["#dca680", "#bc825a", "#986240", "#70452e"];
function jar(R: Raster, cx: number, base: number, half: number[], seed: number) {
  for (let j = 0; j < half.length; j++) for (let i = -half[j]; i < half[j]; i++) {
    const t = (i + half[j]) / (half[j] * 2), band = j === Math.floor(half.length * 0.6) || (STYLE.rude && j === Math.floor(half.length * 0.6) - 2 && (i + seed) % 2 === 0);
    R.set(cx + i, base - j, band ? (STYLE.rude ? CLAY[3] : BONE[1]) : CLAY[t < 0.25 ? 0 : t < 0.6 ? 1 : t < 0.85 ? 2 : 3]);
  }
}

/** Two shelves of pots and bowls, with bunches of herbs hung under the upper one. */
function shelf(R: Raster, bx: number, T: number, seed: number) {
  for (const y of [T + 66, T + 90]) { R.fill(bx + 8, y, 32, 3, GILT[2]); R.fill(bx + 8, y, 32, 1, GILT[0]); R.fill(bx + 8, y + 3, 32, 1, GILT[4]); for (const px of [bx + 10, bx + 37]) R.fill(px, y + 3, 2, 4, GILT[3]); }
  jar(R, bx + 15, T + 65, [3, 4, 5, 5, 5, 4, 3, 2, 3], seed); jar(R, bx + 26, T + 65, [2, 3, 3, 3, 2, 2], seed + 1); jar(R, bx + 34, T + 65, [3, 4, 4, 3], seed + 2);
  jar(R, bx + 14, T + 89, [3, 4, 4, 3], seed + 3); jar(R, bx + 24, T + 89, [3, 4, 5, 6, 6, 6, 5, 4, 3, 2, 3], seed + 4); jar(R, bx + 35, T + 89, [2, 3, 4, 4, 4, 3, 2], seed + 5);
  for (let k = 0; k < 3; k++) { const hx = bx + 13 + k * 9 + (seed % 3); R.fill(hx, T + 70, 1, 3, BONE[2]); for (let j = 0; j < 7; j++) R.fill(hx - 1 - (j > 2 ? 1 : 0), T + 73 + j, 3 + (j > 2 ? 2 : 0), 1, j % 2 ? "#7a9a5a" : "#5e7e46"); }
}

const INK = ["#4a444c", "#34303a", "#26222a"], LEAFY = ["#8ab87a", "#62945a", "#467448", "#2e5438"];

/** A small picture in the middle of a painted panel: a bird on a twig, a floating figure, a bowl of fruit, a mask, a head in a round frame. */
function vignette(R: Raster, cx: number, cy: number, seed: number) {
  const kind = Math.floor(h2(seed, 3, 9) * 5), pale = "#f6ecd2", gold = "#e8c060";
  if (kind === 0) {
    R.fill(cx - 6, cy + 3, 13, 1, LEAFY[1]); R.fill(cx + 4, cy + 1, 2, 2, LEAFY[0]); R.fill(cx - 6, cy + 4, 2, 2, LEAFY[0]);
    stamp(R, [".....11.", "...1101.", ".111112.", "1111122.", ".11222..", "..2.2..."], cx - 4, cy - 3, [gold, h2(seed, 1, 1) > 0.5 ? "#8ab4d8" : pale, "#b8a888"]);
    R.set(cx + 4, cy - 2, gold);
  } else if (kind === 1) {
    stamp(R, ["...00...", "...00...", "..1221..", ".012210.", "0.1221.0", "..1221..", "..2112..", ".21..12.", ".2....2.", "2......2"], cx - 4, cy - 5, ["#f0c8a8", pale, "#9cc4d8"]);
  } else if (kind === 2) {
    R.fill(cx - 7, cy + 4, 15, 1, pale);
    stamp(R, ["..3.4.3..", ".3434343.", "111111111", ".1222221.", "..12221..", "...111..."], cx - 4, cy - 2, ["", gold, "#b88838", "#c84a3a", "#7ab04e"]);
  } else if (kind === 3) {
    stamp(R, [".011110.", "01111112", "01211212", "01111112", "01122112", ".012212.", "..0112.."], cx - 4, cy - 3, [pale, "#e8dcc0", "#3a3038"]);
  } else {
    for (let a = 0; a < 28; a++) R.set(cx + Math.round(Math.cos((a / 28) * 6.283) * 6), cy + Math.round(Math.sin((a / 28) * 6.283) * 6), gold);
    stamp(R, [".0000.", "011110", "011110", ".1111.", "222222", "222222"], cx - 3, cy - 3, ["#5a4030", "#f0c8a8", pale]);
  }
}

/** The household shrine: a little temple front against the wall, the gods of the house painted inside it, a lamp on its shelf. */
function shrine(R: Raster, cx: number, T: number) {
  const top = T + 42;
  for (let j = 0; j < 8; j++) R.fill(cx - 2 - j * 1.5, top + j, 4 + j * 3, 1, j === 7 ? CREAM[3] : CREAM[j < 2 ? 0 : 1]);
  R.fill(cx - 13, top + 8, 26, 3, CREAM[0]); R.fill(cx - 13, top + 10, 26, 1, CREAM[3]);
  R.fill(cx - 10, top + 11, 20, 28, "#8a2e2a"); R.fill(cx - 10, top + 11, 20, 2, "#5e1e1e");
  for (const s of [-1, 1]) {
    R.fill(cx + s * 11 - 1, top + 11, 3, 28, CREAM[1]); R.fill(cx + s * 11 - 1, top + 11, 1, 28, CREAM[0]); R.fill(cx + s * 11 + 1, top + 11, 1, 28, CREAM[3]);
    stamp(R, [".00.", ".00.", "1111", "1121", ".11.", ".11.", ".11.", "1..1"], cx + s * 5 - 2, top + 22, ["#f0c8a8", "#f6ecd2", "#c84a3a"]);
  }
  stamp(R, [".00.", ".00.", "1111", "2112", "2112", ".11.", ".11."], cx - 2, top + 20, ["#f0c8a8", "#f6ecd2", "#e8c060"]);
  for (let i = -8; i <= 8; i++) R.set(cx + i, top + 35 + Math.round(Math.sin(i * 0.9)), LEAFY[1]);
  R.fill(cx - 14, top + 39, 28, 3, CREAM[0]); R.fill(cx - 14, top + 41, 28, 1, CREAM[3]); R.fill(cx - 12, top + 42, 24, 2, CREAM[2]);
  R.fill(cx - 2, top + 37, 5, 2, GILT_BRONZE[2]); R.set(cx + 3, top + 36, FLAME[1]); R.set(cx + 3, top + 35, FLAME[0]);
}

/** A cupboard of book rolls: pigeon holes, each with the ends of two or three rolls and their tags. */
function rolls(R: Raster, bx: number, T: number, seed: number) {
  const x0 = bx + 8, top = T + 36, bot = T + 112, c = FRAME;
  R.fill(x0, top, 32, bot - top, c[2]); R.fill(x0, top, 32, 2, c[0]); R.fill(x0, top, 2, bot - top, c[1]); R.fill(x0 + 30, top, 2, bot - top, c[4]); R.fill(x0, bot - 4, 32, 4, c[3]); R.fill(x0, bot - 4, 32, 1, c[1]);
  for (let row = 0; row < 6; row++) for (let col = 0; col < 3; col++) {
    const x = x0 + 3 + col * 9, y = top + 4 + row * 11;
    R.fill(x, y, 8, 9, c[4]); R.fill(x, y, 8, 1, "#1e1612");
    for (let k = 0; k < 2 + Math.floor(h2(seed + row, col, 2) * 2); k++) {
      const rx = x + 1 + (k % 2) * 4 + (k > 1 ? 2 : 0), ry = y + (k > 1 ? 1 : 5);
      R.fill(rx, ry, 3, 3, "#eadfc4"); R.set(rx + 1, ry + 1, "#8a7a5a"); R.set(rx, ry, "#fbf5e6");
      if (h2(seed + k, row * 3 + col, 5) > 0.5) R.fill(rx + 3, ry + 1, 1, 2, "#c84a3a");
    }
  }
}

/** A garden painted on the wall as if the wall were not there: sky, a thicket of fruit trees with birds in it, a low trellis in front. */
function paintedGarden(R: Raster, bx: number, T: number, seed: number) {
  for (let y = T + 36; y < T + 92; y++) for (let x = bx + 4; x < bx + 44; x++) {
    const t = y - T - 36, i = x - bx - 4, crown = 16 + Math.round(Math.sin(i * 0.42 + seed) * 5 + Math.sin(i * 1.1 + seed * 2) * 3), clump = h2((i + seed) >> 2, t >> 2, seed);
    let col = t < crown ? (t < 8 ? "#b4d8dc" : "#c8e2dc") : LEAFY[clump > 0.7 ? 0 : clump > 0.35 ? 1 : t > 34 ? 3 : 2];
    if (t >= crown + 3 && h2(i >> 1, t >> 1, seed + 4) > 0.94) col = (i + t) % 3 ? "#f0a030" : "#f6dc60";
    if (t > 44) { const d = (i + t) % 6, e = (i - t + 60) % 6; col = t === 45 || t === 55 || d === 0 || e === 0 ? "#f0e6c8" : LEAFY[3]; }
    R.set(x, y, col);
  }
  for (const [dx, dy] of [[10, 12], [28, 20]]) stamp(R, ["..00.", "0001.", ".000.", "..0.."], bx + 4 + dx, T + 36 + dy + (seed % 3), ["#f6f2e6", "#e8c060"]);
}

/** A Roman room's back wall: a stucco cornice, a pale upper zone with garlands, panels of colour between dark bands
 * with gilded candelabra painted on them, and a dark dado. */
function frescoBack(R: Raster, L: FairLevel, OX: number, T: number, seed: number) {
  const W = L.w * 16, x0 = OX + 8, x1 = OX + W - 8, { b0, n } = palaceBays(L.w), B = T + TALL;
  R.fill(x0, T, x1 - x0, TALL, CREAM[1]);
  for (let k = 0; k < 7; k++) R.fill(x0, T + k, x1 - x0, 1, k < 3 ? "#4a3a34" : CREAM[k === 3 ? 4 : k === 6 ? 3 : 0]);
  for (let x = x0; x < x1; x += 4) R.fill(x, T + 4, 2, 2, CREAM[2]);
  R.fill(x0, T + 9, x1 - x0, 1, GILT[2]); R.fill(x0, T + 33, x1 - x0, 2, GILT[2]); R.fill(x0, T + 33, x1 - x0, 1, "#e8c060");
  R.fill(x0, T + 35, x1 - x0, 57, INK[1]);
  R.fill(x0, T + 92, x1 - x0, 20, INK[2]); R.fill(x0, T + 92, x1 - x0, 1, "#e8c060"); R.fill(x0, T + 93, x1 - x0, 1, GILT[2]);
  R.fill(x0, T + 109, x1 - x0, 3, "#6a646c"); R.fill(x0, T + 109, x1 - x0, 1, "#8a848c");
  for (let k = 0; k < n; k++) {
    const ax = b0 + 3 * k, bx = OX + ax * 16, cx = bx + 24, s2 = seed + k * 19;
    const hung = L.things.some((t) => t.wall && t.x >= ax && t.x < ax + 3);
    // Above: a garland slung between two painted colonnettes.
    for (const px of [bx + 10, bx + 37]) R.fill(px, T + 12, 1, 21, "#c89a4a"), R.fill(px - 1, T + 12, 3, 1, "#c89a4a");
    for (let i = 0; i < 26; i++) { const y = T + 15 + Math.round(Math.sin((i / 25) * Math.PI) * 7); R.fill(bx + 11 + i, y, 1, 2, LEAFY[i % 3 === 0 ? 0 : 1]); if (i % 6 === 3) R.set(bx + 11 + i, y + 1, "#c84a3a"); }
    // In the dado: a lozenge picked out in a thin line.
    for (let i = 0; i < 9; i++) for (const s of [-1, 1]) { R.set(cx + s * i, T + 101 - (8 - i) / 2, GILT[1]); R.set(cx + s * i, T + 101 + (8 - i) / 2, GILT[1]); }
    if (L.exits.some((e) => e.y === 0 && e.x === ax)) { romanDoor(R, bx, B); continue; }
    const bay = hung ? "fresco" : STYLE.bays[k % STYLE.bays.length];
    if (bay === "scrolls") { rolls(R, bx, T, s2); continue; }
    if (bay === "garden") paintedGarden(R, bx, T, s2);
    else {
      const c = bay === "fresco-alt" ? FIELD : CLOTH;
      R.fill(bx + 4, T + 36, 40, 55, c[1]); R.fill(bx + 4, T + 36, 40, 1, c[0]); R.fill(bx + 4, T + 90, 40, 1, c[3]); R.fill(bx + 43, T + 37, 1, 54, c[2]);
      for (const [fx, fy, fw, fh] of [[bx + 8, T + 40, 32, 1], [bx + 8, T + 86, 32, 1], [bx + 8, T + 40, 1, 47], [bx + 39, T + 40, 1, 47]]) R.fill(fx, fy, fw, fh, "#f0e2bc");
      if (bay === "niche") shrine(R, cx, T); else if (!hung) vignette(R, cx, T + 62, s2);
    }
  }
  // Between the panels, a gilded candelabrum painted on the dark band.
  for (let k = 0; k <= n; k++) {
    const px = OX + (b0 + 3 * k) * 16;
    if (px < x0 + 2 || px > x1 - 2) continue;
    R.fill(px, T + 38, 1, 50, "#d8ac50");
    for (let y = T + 44; y < T + 88; y += 11) { R.fill(px - 1, y, 3, 2, "#e8c060"); R.set(px - 2, y + 1, "#b88838"); R.set(px + 2, y + 1, "#b88838"); }
    R.fill(px - 2, T + 37, 5, 1, "#e8c060"); R.fill(px - 3, T + 88, 7, 2, "#b88838"); R.fill(px - 2, T + 88, 5, 1, "#e8c060");
  }
}

/** A Roman doorway: a stucco frame, the next room lit beyond it, and a curtain in the room's cloth drawn back on its rod. */
function romanDoor(R: Raster, bx: number, B: number) {
  const x0 = bx + 9, top = B - 66;
  R.fill(x0 - 5, top - 6, 40, B - top + 6, CREAM[1]); R.fill(x0 - 5, top - 6, 40, 2, CREAM[0]); R.fill(x0 - 5, top - 6, 1, B - top + 6, CREAM[0]); R.fill(x0 + 34, top - 5, 1, B - top + 5, CREAM[3]);
  R.fill(x0 - 5, top - 2, 40, 1, GILT[2]);
  for (let y = top; y < B; y++) for (let x = x0; x < x0 + 30; x++) { const t = (y - top) / (B - top); R.set(x, y, t < 0.5 ? "#5a4640" : t < 0.72 ? "#8a7464" : (x + y) % 2 ? "#d8d0c0" : "#cfc6b6"); }
  for (let k = 0; k < 6; k++) R.fill(x0, top + k, 30, 1, k < 3 ? "#3a2c2a" : "#4a3a36");
  R.fill(x0 - 1, top + 3, 32, 1, GILT_BRONZE[2]);
  for (let y = top + 4; y < B - 3; y++) {
    const t = (y - top - 4) / (B - top - 7), wide = t < 0.55 ? Math.round(13 - t * 10) : Math.round(7 + (t - 0.55) * 8);
    for (let i = 0; i < wide; i++) { const fold = (i + Math.round(t * 4)) % 4; R.set(x0 + i, y, i === wide - 1 ? CLOTH[3] : fold === 0 ? CLOTH[0] : fold === 3 ? CLOTH[2] : CLOTH[1]); }
    if (Math.abs(t - 0.55) < 0.02) R.fill(x0, y, 8, 1, GILT_BRONZE[1]);
  }
}

const POOL = ["#d4ece8", "#b0d8d6", "#90c0c4", "#74a4ae"];
/** What lies under the opening in the roof: the atrium's shallow pool in its marble rim, or the kerb round a garden. */
function openCourt(R: Raster, L: FairLevel, OX: number, OY: number) {
  const c = L.court;
  if (!c) return;
  const X = OX + c.x0 * 16, Y = OY + c.y0 * 16, W = (c.x1 - c.x0 + 1) * 16, H = (c.y1 - c.y0 + 1) * 16;
  if (c.kind === "garden") {
    for (const [x, y, w, h, col] of [[X - 3, Y - 3, W + 6, 3, WHITE[1]], [X - 3, Y + H, W + 6, 3, WHITE[2]], [X - 3, Y, 3, H, WHITE[1]], [X + W, Y, 3, H, WHITE[2]]] as const) R.fill(x, y, w, h, col);
    R.fill(X - 3, Y - 3, W + 6, 1, WHITE[0]); R.fill(X - 3, Y + H + 2, W + 6, 1, WHITE[4]); R.fill(X - 3, Y - 3, 1, H + 6, WHITE[0]); R.fill(X + W + 2, Y - 2, 1, H + 5, WHITE[3]);
    for (let k = 0; k < 3; k++) for (let x = X; x < X + W; x++) R.shade(x, Y + k, 0.18 - k * 0.05);
    return;
  }
  R.fill(X, Y, W, H, WHITE[1]); R.fill(X, Y, W, 1, WHITE[0]); R.fill(X, Y, 1, H, WHITE[0]); R.fill(X, Y + H - 1, W, 1, WHITE[4]); R.fill(X + W - 1, Y, 1, H, WHITE[3]);
  R.fill(X + 3, Y + 3, W - 6, H - 6, WHITE[2]); R.fill(X + 3, Y + 3, W - 6, 1, WHITE[3]); R.fill(X + 3, Y + 3, 1, H - 6, WHITE[3]);
  for (let y = Y + 6; y < Y + H - 6; y++) for (let x = X + 6; x < X + W - 6; x++) {
    const t = y - Y - 6, ripple = h2((x + t) >> 3, t >> 1, 7) > 0.8 && t % 4 === 1, sky = ((x - X) + t * 2) % 90 < 26;
    R.set(x, y, t < 3 ? POOL[3] : ripple ? POOL[0] : sky ? POOL[1] : (x >> 1) + (y >> 1) & 1 ? POOL[2] : "#8abcc0");
  }
  R.fill(X + 5, Y + 5, W - 10, 1, WHITE[4]); R.fill(X + 5, Y + 5, 1, H - 10, WHITE[4]); R.fill(X + 5, Y + H - 6, W - 10, 1, WHITE[0]); R.fill(X + W - 6, Y + 5, 1, H - 10, WHITE[0]);
  for (let k = 0; k < 4; k++) for (let x = X + 2; x < X + W + 2; x++) R.shade(x, Y + H + k, 0.2 - k * 0.05);
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
  if (STYLE.order === "timber") timberBack(R, L, OX, T, seed);
  else if (STYLE.order === "roman") frescoBack(R, L, OX, T, seed);
  else {
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
  }
  // The wall's foot throws a shadow on the floor.
  for (let k = 0; k < 6; k++) for (let x = OX + 16; x < OX + W - 16; x++) if (R.has(x, B + k)) R.shade(x, B + k, 0.3 - k * 0.05);
  // Side walls from above, gilt along the inner edge; open where a doorway goes through.
  for (const [x, left] of [[x0, true], [x1 - 8, false]] as const) {
    R.fill(x, T, 8, PALACE_RISE + H - 8, CREAM[2]); R.fill(x, T, 1, PALACE_RISE + H - 8, left ? CREAM[0] : CREAM[3]);
    R.fill(left ? x + 7 : x, T, 1, PALACE_RISE + H - 8, GILT[2]); R.fill(left ? x + 6 : x + 1, T, 1, PALACE_RISE + H - 8, left ? CREAM[4] : CREAM[0]);
    if (left) for (let k = 0; k < 4; k++) for (let y = B; y < OY + H - 16; y++) R.shade(x + 8 + k, y, 0.26 - k * 0.06);
  }
  R.fill(x0 - 18, T, 18, TALL, DARK); R.fill(x1, T, 18, TALL, DARK);
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
  openCourt(R, L, OX, OY);
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
  if (kind === "candlestick" || kind === "vase" || kind === "clock") {
    // What stands on a table, as a thing by itself.
    const s = sprite(16, 26, 0, 24), { r } = s;
    if (kind === "candlestick") candelabrum(r, 8, 24, glow); else if (kind === "vase") porcelain(r, 8, 25, n); else clock(r, 8, 25);
    return { ...s, glow };
  }
  if (kind === "console" || kind === "console-bare") {
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
    if (kind === "console-bare") return s;
    for (const ix of [x + 8, x + wd - 8]) { r.fill(ix - 3, top + 4, 8, 1, WHITE[2]); candelabrum(r, ix, top + 3, glow); }
    r.fill(cx - 3, top + 5, 8, 1, WHITE[2]);
    if (n % 4 === 3) clock(r, cx, top + 4); else porcelain(r, cx, top + 4, n);
    return { ...s, glow };
  }
  if (kind === "stool") {
    // A folding stool, the only seat most of the court was allowed.
    const s = sprite(14, 18, -1, 17), { r } = s;
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
  if (kind === "post") {
    // A roof post on a stone pad, braced at the head: carved and carrying a torch in a lord's hall, lashed and plain before that.
    const s = sprite(32, 88, 8, 87), { r } = s, cx = 16;
    r.shadow(cx + 1, 86, 7, 2, 0.26);
    r.fill(cx - 6, 82, 12, 4, ROUGE[2]); r.fill(cx - 6, 82, 12, 1, ROUGE[0]); r.fill(cx + 3, 83, 3, 3, ROUGE[3]);
    for (const sgn of [-1, 1]) for (let j = 0; j < 11; j++) { r.fill(cx + sgn * (4 + j) - (sgn < 0 ? 2 : 0), 20 - j, 3, 5, FRAME[sgn < 0 ? 2 : 3]); r.fill(cx + sgn * (4 + j) - (sgn < 0 ? 2 : 0), 20 - j, 3, 1, FRAME[sgn < 0 ? 0 : 1]); }
    for (let y = 2; y < 82; y++) for (let i = 0; i < 10; i++) {
      const grain = h2(i, y >> 3, n) > 0.8;
      r.set(cx - 5 + i, y, FRAME[i === 0 ? 0 : i < 4 ? 1 : i < 7 ? (grain ? 3 : 2) : i < 9 ? 3 : 4]);
    }
    if (STYLE.rude) {
      for (const y of [30, 33]) r.fill(cx - 5, y, 10, 2, BONE[1]), r.fill(cx + 2, y, 3, 2, BONE[3]);
      for (let j = 0; j < 9; j++) r.fill(cx + 4, 36 + j, 2 + (j > 3 ? 1 : 0), 1, j % 2 ? "#7a9a5a" : "#5e7e46");
    } else for (let j = 0; j < 11; j++) for (let i = 0; i < 10; i++) r.set(cx - 5 + i, 40 + j, j === 0 || j === 10 ? FRAME[4] : (i + j) % 4 < 2 ? FRAME[0] : FRAME[3]);
    soften(r);
    if (!STYLE.rude) {
      r.fill(cx + 4, 30, 5, 1, IRONC[2]); r.fill(cx + 8, 26, 1, 5, IRONC[2]); r.fill(cx + 7, 22, 3, 5, "#6a4a30");
      r.fill(cx + 7, 19, 3, 3, FLAME[2]); r.fill(cx + 8, 17, 2, 3, FLAME[1]); r.set(cx + 8, 16, FLAME[0]);
      glow.push({ x: cx + 8, y: 19 });
    }
    return { ...s, glow };
  }
  if (kind === "hearth") {
    // A long fire in a kerb of stones, burning: logs, embers and flame, with a pot at the edge or a cauldron hung over it.
    const W = 64, H = 56, base = new Raster(W, H), foot = 50;
    for (let y = foot - 26; y <= foot; y++) for (let x = 2; x < W - 2; x++) {
      const ex = Math.min(x - 2, W - 3 - x), ey = Math.min(y - (foot - 26), foot - y), round = ex + ey < 3;
      if (round) continue;
      const kerb = ex < 5 || ey < 4, stone = Math.floor((x + (ey < 4 ? 0 : y * 3)) / 7) + (ey < 4 ? 0 : Math.floor(y / 6) * 5);
      if (kerb) { const e = ex < 5 ? (y % 6) : (x % 7); base.set(x, y, e === 0 ? ROUGE[4] : ROUGE[(stone * 7 + n) % 3 === 0 ? 1 : e < 2 ? 0 : (stone % 2 ? 2 : 1)]); }
      else base.set(x, y, h2(x >> 1, y >> 1, n) > 0.7 ? "#5e544c" : h2(x >> 2, y >> 1, n + 1) > 0.8 ? "#2e2826" : "#463e3a");
    }
    for (const [lx, ly, len] of [[12, foot - 10, 22], [28, foot - 15, 24], [20, foot - 6, 26]]) { base.fill(lx, ly, len, 3, "#4a3222"); base.fill(lx, ly, len, 1, "#6a4a30"); base.fill(lx + len - 3, ly, 3, 3, "#ff9a3a"); base.fill(lx, ly, 2, 3, "#e8602a"); }
    soften(base);
    const frames = [0, 1, 2, 3].map((f) => {
      const r = new Raster(W, H);
      r.data.set(base.data);
      for (let x = 9; x < W - 9; x++) {
        const mid = 1 - Math.abs(x - W / 2) / (W / 2 - 6), tall = Math.round((6 + 12 * Math.abs(Math.sin(x * 0.45 + f * 1.9)) + 5 * Math.sin(x * 1.3 + f * 2.7)) * (0.45 + mid * 0.55));
        for (let j = 0; j < tall; j++) { const t = j / tall; r.set(x, foot - 8 - j, t < 0.3 ? FLAME[0] : t < 0.62 ? FLAME[1] : t < 0.86 ? FLAME[2] : "#e8602a"); }
      }
      for (let k = 0; k < 14; k++) { const ex = 8 + Math.floor(h2(k, f, n) * (W - 16)), ey = foot - 5 - Math.floor(h2(k, n, f + 3) * 16); r.set(ex, ey, k % 3 ? "#ffb040" : "#fff0a0"); }
      if (STYLE.rude) { jar(r, W - 9, foot - 20, [4, 5, 6, 6, 6, 5, 4, 3, 4], n); }
      else {
        // A cauldron on a chain from the roof.
        r.fill(46, 0, 1, foot - 30, IRONC[3]);
        for (let y = -7; y <= 5; y++) for (let x = -8; x <= 8; x++) if ((x / 8) ** 2 + (y / 6) ** 2 <= 1 && y > -5) r.set(46 + x, foot - 26 + y, x < -4 && y < 2 ? "#5a5a64" : x > 4 || y > 3 ? "#1e1e24" : "#34343c");
        r.fill(38, foot - 31, 17, 2, "#4a4a54"); r.fill(38, foot - 31, 17, 1, "#6c6c78");
      }
      return r;
    });
    return { r: frames[0], ox: 0, oy: foot - 30, frames, fps: 7, glow: [{ x: 22, y: foot - 20 }, { x: 42, y: foot - 20 }] };
  }
  if (kind === "highseat") {
    // The lord's seat: carved pillars with beasts' heads, furs and a cushion, a footboard; before that, a broad log bench under a bearskin.
    const s = sprite(48, 70, 0, 68), { r } = s, fur = ["#f2ece0", "#d8d0c0", "#b4ab9a", "#8e8676"], bear = ["#8a6a52", "#6a4e3c", "#4e382a", "#36261c"];
    r.shadow(24, 67, 22, 3, 0.28);
    if (STYLE.rude) {
      for (let x = 6; x < 42; x++) for (let y = 14; y < 44; y++) r.set(x, y, (x + (y >> 1)) % 4 === 0 ? HIDE[2] : y % 6 === 0 ? HIDE[3] : HIDE[1]);
      r.fill(5, 12, 38, 2, FRAME[2]); r.fill(5, 12, 38, 1, FRAME[0]); for (const x of [5, 41]) r.fill(x, 12, 2, 50, FRAME[2]), r.fill(x, 12, 1, 50, FRAME[1]);
      r.fill(4, 46, 40, 12, FRAME[1]); r.fill(4, 46, 40, 2, FRAME[0]); r.fill(4, 56, 40, 2, FRAME[3]); for (let x = 8; x < 44; x += 9) r.fill(x, 48, 1, 8, FRAME[2]);
      for (const x of [4, 41]) { for (let y = 0; y < 5; y++) r.fill(x - (y < 2 ? 1 : 0), 47 + y * 2, 3 + (y < 2 ? 2 : 0), 2, y % 2 ? FRAME[3] : FRAME[2]); }
      for (let y = 38; y < 54; y++) for (let x = 10; x < 38; x++) { const d = ((x - 24) / 14) ** 2 + ((y - 46) / 8) ** 2; if (d < 1) r.set(x, y, bear[(h2(x >> 1, y >> 1, 3) > 0.6 ? 0 : 1) + (x > 26 ? 1 : 0) + (d > 0.75 ? 1 : 0)]); }
      for (let y = 52; y < 60; y++) for (let x = 19; x < 29; x++) if (((x - 24) / 5) ** 2 + ((y - 55) / 4) ** 2 < 1) r.set(x, y, bear[x < 23 ? 0 : 1]);
      r.fill(21, 54, 2, 1, "#1e1612"); r.fill(26, 54, 2, 1, "#1e1612"); r.fill(23, 57, 3, 1, "#1e1612");
      soften(r);
      for (let k = 0; k < 40; k++) r.set(44 + Math.round(k * 0.05), 62 - k, BONE[2]);
      for (let j = 0; j < 6; j++) r.fill(42 + (j % 2), 20 + j, 4, 1, j % 2 ? "#c84a3a" : BONE[0]);
      return s;
    }
    r.fill(3, 58, 42, 6, FRAME[2]); r.fill(3, 58, 42, 1, FRAME[0]); r.fill(3, 63, 42, 1, FRAME[4]); for (let x = 9; x < 44; x += 8) r.fill(x, 59, 1, 4, FRAME[3]);
    r.fill(10, 14, 28, 30, FRAME[2]); r.fill(10, 14, 28, 1, FRAME[0]);
    for (let y = 17; y < 42; y++) for (let x = 13; x < 35; x++) { const k = (Math.abs(((x - 13) % 8) - 4) + Math.abs(((y - 17) % 8) - 4)); r.set(x, y, k === 2 || k === 3 ? FRAME[0] : k > 5 ? FRAME[4] : FRAME[3]); }
    r.fill(14, 24, 20, 14, CLOTH[1]); r.fill(14, 24, 20, 1, CLOTH[0]); r.fill(14, 37, 20, 1, CLOTH[3]); for (let x = 16; x < 33; x += 4) r.fill(x, 27, 2, 2, CLOTH[0]), r.fill(x + 2, 32, 2, 2, CLOTH[3]);
    for (const x of [5, 38]) {
      for (let y = 8; y < 58; y++) for (let i = 0; i < 5; i++) r.set(x + i, y, (y % 9 === 0 || y % 9 === 1) ? FRAME[i < 2 ? 0 : 4] : FRAME[i === 0 ? 0 : i < 3 ? 1 : i === 3 ? 3 : 4]);
      stamp(r, [".0112.", "001123", "011233", "012.34", "01234.", ".1234."], x - (x < 20 ? 1 : 0), 3, FRAME);
    }
    r.fill(8, 42, 32, 8, fur[1]); r.fill(8, 42, 32, 2, fur[0]); r.fill(8, 49, 32, 3, fur[2]);
    for (let x = 9; x < 40; x += 2) r.set(x, 44 + ((x >> 1) % 3), fur[2]), r.set(x + 1, 51 + ((x >> 2) % 2), fur[3]);
    r.fill(16, 40, 16, 5, CLOTH[1]); r.fill(16, 40, 16, 1, CLOTH[0]); r.fill(16, 44, 16, 1, CLOTH[3]);
    r.fill(17, 54, 14, 4, FRAME[1]); r.fill(17, 54, 14, 1, FRAME[0]); r.fill(17, 57, 14, 1, FRAME[4]);
    soften(r);
    return s;
  }
  if (kind === "platform") {
    // The bench along the wall, where people sit by day and sleep by night: planks, a fleece, a folded blanket.
    const s = sprite(48, 28, 0, 27), { r } = s, fur = ["#f2ece0", "#d8d0c0", "#b4ab9a", "#8e8676"];
    r.shadow(24, 26, 22, 3, 0.26);
    r.fill(1, 8, 46, 9, FRAME[1]); r.fill(1, 8, 46, 1, FRAME[0]); for (const y of [11, 14]) r.fill(1, y, 46, 1, FRAME[2]);
    r.fill(1, 17, 46, 6, FRAME[3]); r.fill(1, 17, 46, 1, FRAME[2]); for (const x of [1, 22, 44]) r.fill(x, 17, 3, 9, FRAME[2]), r.fill(x, 17, 1, 9, FRAME[1]);
    for (let y = 5; y < 16; y++) for (let x = 4; x < 21; x++) { const d = ((x - 12) / 9) ** 2 + ((y - 10) / 6) ** 2 + (h2(x >> 1, y >> 1, n) - 0.5) * 0.3; if (d < 1) r.set(x, y, STYLE.rude ? HIDE[d > 0.7 ? 3 : x < 10 ? 0 : 1] : fur[d > 0.75 ? 2 : (x + y) % 3 === 0 ? 2 : x < 11 ? 0 : 1]); }
    r.fill(27, 6, 15, 9, CLOTH[1]); r.fill(27, 6, 15, 1, CLOTH[0]); r.fill(27, 10, 15, 1, CLOTH[3]); r.fill(27, 14, 15, 1, CLOTH[3]); for (let x = 28; x < 42; x += 3) r.set(x, 8, CLOTH[0]), r.set(x + 1, 12, BONE[0]);
    soften(r);
    return s;
  }
  if (kind === "trestle") {
    // A board on trestles, laid: bowls, a horn, bread, a joint, a jug.
    const s = sprite(48, 32, 0, 30), { r } = s;
    r.shadow(24, 29, 21, 3, 0.26);
    for (const x of [7, 37]) for (let j = 0; j < 11; j++) { r.fill(x - (j >> 2), 18 + j, 2, 1, FRAME[2]); r.fill(x + 3 + (j >> 2), 18 + j, 2, 1, FRAME[3]); }
    r.fill(1, 8, 46, 8, FRAME[1]); r.fill(1, 8, 46, 1, FRAME[0]); r.fill(1, 12, 46, 1, FRAME[2]); r.fill(1, 16, 46, 2, FRAME[3]); r.fill(45, 9, 2, 8, FRAME[2]);
    soften(r);
    for (const bx of [6, 34]) { r.fill(bx, 10, 6, 3, "#8a6040"); r.fill(bx + 1, 9, 4, 1, "#a87c56"); r.fill(bx + 1, 10, 4, 1, "#c8b890"); r.fill(bx, 13, 6, 1, "#5e4028"); }
    for (let k = 0; k < 7; k++) r.fill(14 + k, 11 - Math.round(Math.sin((k / 6) * 3.14) * 3), 2 - (k > 4 ? 1 : 0), 2, k < 2 ? "#5e4028" : BONE[k % 2]);
    for (let y = 0; y < 4; y++) r.fill(22 - (y === 0 || y === 3 ? -1 : 0), 9 + y, 7 - (y === 0 || y === 3 ? 2 : 0), 1, y < 2 ? "#dcb478" : "#b88c50");
    r.fill(41, 10, 5, 3, "#8a4a3a"); r.fill(41, 10, 4, 1, "#b8705a"); r.fill(45, 9, 2, 1, BONE[0]);
    jar(r, 31, 12, [2, 3, 3, 3, 2, 1, 2], n);
    return s;
  }
  if (kind === "rack") {
    // What is kept to hand by the wall: spears and shields in a lord's hall; before that, bows, hafted axes and a net.
    const s = sprite(48, 54, 0, 52), { r } = s;
    r.shadow(24, 51, 20, 3, 0.24);
    for (const x of [5, 41]) r.fill(x, 14, 2, 38, FRAME[2]), r.fill(x, 14, 1, 38, FRAME[1]);
    r.fill(4, 22, 40, 2, FRAME[2]); r.fill(4, 22, 40, 1, FRAME[0]); r.fill(4, 44, 40, 2, FRAME[3]); r.fill(4, 44, 40, 1, FRAME[1]);
    soften(r);
    if (STYLE.rude) {
      for (const x of [12, 20]) { for (let k = 0; k < 44; k++) r.set(x + Math.round(Math.sin((k / 43) * 3.14) * 3), 50 - k, "#b89468"); r.fill(x, 7, 1, 43, BONE[1]); }
      for (const x of [28, 35]) { r.fill(x, 12, 2, 38, "#a07e58"); r.fill(x, 12, 1, 38, "#c8a47a"); r.fill(x - 3, 13, 6, 4, ROUGE[1]); r.fill(x - 3, 13, 6, 1, ROUGE[0]); r.fill(x - 4, 14, 1, 2, ROUGE[2]); r.fill(x - 1, 17, 4, 1, BONE[1]); }
    } else {
      for (const x of [10, 17, 30, 38]) { r.fill(x, 4, 1, 46, x % 2 ? "#c8a47a" : "#a88860"); for (let j = 0; j < 6; j++) r.fill(x - (j > 1 && j < 5 ? 1 : 0), j, j > 1 && j < 5 ? 3 : 1, 1, IRONC[x < 20 ? 0 : 1]); }
      shield(r, 16, 40, 9, n); shield(r, 34, 41, 9, n + 5);
    }
    return s;
  }
  if (kind === "loom") {
    // An upright loom leaning on the wall, the threads held tight by weights of stone or clay.
    const s = sprite(48, 58, 0, 56), { r } = s;
    r.shadow(24, 55, 19, 2, 0.22);
    for (const x of [7, 39]) r.fill(x, 4, 3, 51, FRAME[2]), r.fill(x, 4, 1, 51, FRAME[0]), r.fill(x + 2, 4, 1, 51, FRAME[4]);
    r.fill(5, 6, 39, 4, FRAME[1]); r.fill(5, 6, 39, 1, FRAME[0]); r.fill(5, 9, 39, 1, FRAME[4]); r.fill(9, 30, 31, 2, FRAME[1]); r.fill(9, 31, 31, 1, FRAME[3]);
    soften(r);
    for (let y = 10; y < 26; y++) for (let x = 11; x < 38; x++) { const band = (y - 10) >> 2; r.set(x, y, (y - 10) % 4 === 0 ? CLOTH[3] : band % 2 ? (x % 4 < 2 ? CLOTH[0] : CLOTH[2]) : CLOTH[1]); }
    for (let x = 11; x < 38; x += 2) { r.fill(x, 26, 1, 20, BONE[x % 4 ? 1 : 0]); }
    for (let x = 11; x < 37; x += 5) { r.fill(x, 46, 3, 4, STYLE.rude ? ROUGE[2] : CLAY[1]); r.fill(x, 46, 2, 1, STYLE.rude ? ROUGE[0] : CLAY[0]); r.set(x + 2, 49, STYLE.rude ? ROUGE[4] : CLAY[3]); }
    return s;
  }
  if (kind === "pots") {
    // Jars standing together: a big one, a middling one, a bowl.
    const s = sprite(20, 26, 2, 25), { r } = s;
    r.shadow(10, 24, 8, 2, 0.24);
    jar(r, 7, 21, [3, 4, 5, 6, 6, 6, 6, 5, 4, 3, 2, 3, 3], n); jar(r, 14, 23, [3, 4, 4, 4, 3, 2, 2], n + 1); jar(r, 5, 24, [3, 4, 3], n + 2);
    soften(r);
    return s;
  }
  if (kind === "quern") {
    // A grinding stone with its rubber, a heap of grain and a basket.
    const s = sprite(20, 20, 2, 19), { r } = s;
    r.shadow(10, 18, 8, 2, 0.22);
    r.fill(1, 11, 13, 5, ROUGE[1]); r.fill(2, 10, 11, 1, ROUGE[0]); r.fill(1, 15, 13, 1, ROUGE[3]); r.fill(3, 11, 9, 2, ROUGE[2]); r.fill(5, 8, 6, 3, ROUGE[2]); r.fill(5, 8, 5, 1, ROUGE[0]);
    for (let y = 0; y < 3; y++) r.fill(3 + y, 12 - y + 1, 3, 1, "#e0c880");
    for (let y = 0; y < 7; y++) for (let x = 0; x < 6; x++) r.set(13 + x, 10 + y, y === 0 ? "#e0c880" : (x + y) % 2 ? "#b08a58" : "#8e6a40");
    soften(r);
    return s;
  }
  if (kind === "column") {
    // A column of stuccoed brick, fluted above and painted red below, as at Pompeii.
    const s = sprite(24, 100, 4, 99), { r } = s, cx = 12;
    r.shadow(cx + 1, 98, 8, 2, 0.26);
    r.fill(cx - 7, 94, 14, 4, WHITE[1]); r.fill(cx - 7, 94, 14, 1, WHITE[0]); r.fill(cx + 4, 95, 3, 3, WHITE[3]);
    r.fill(cx - 6, 91, 12, 3, WHITE[1]); r.fill(cx - 6, 91, 12, 1, WHITE[0]); r.fill(cx - 6, 93, 12, 1, WHITE[3]);
    for (let y = 14; y < 91; y++) for (let i = 0; i < 10; i++) {
      const red = y > 62, tone = i < 1 ? 0 : i < 4 ? 1 : i < 7 ? 2 : 3, flute = !red && (i === 3 || i === 6);
      r.set(cx - 5 + i, y, red ? CLOTH[Math.min(3, tone)] : flute ? WHITE[3] : WHITE[Math.min(3, tone)]);
    }
    r.fill(cx - 5, 62, 10, 1, WHITE[4]);
    r.fill(cx - 6, 11, 12, 3, WHITE[1]); r.fill(cx - 6, 11, 12, 1, WHITE[0]); r.fill(cx - 7, 8, 14, 3, WHITE[1]); r.fill(cx - 7, 8, 14, 1, WHITE[0]); r.fill(cx - 7, 10, 14, 1, WHITE[3]);
    r.fill(cx - 8, 2, 16, 6, CREAM[1]); r.fill(cx - 8, 2, 16, 1, CREAM[0]); r.fill(cx - 8, 7, 16, 1, CREAM[4]); r.fill(cx + 5, 3, 3, 4, CREAM[3]);
    soften(r);
    return s;
  }
  if (kind === "lectus") {
    // A couch for dining or sleeping: turned legs, a raised head-board, a mattress and a bolster.
    const s = sprite(48, 34, 0, 33), { r } = s, c = CLOTH;
    r.shadow(24, 32, 21, 3, 0.26);
    for (const x of [3, 42]) stamp(r, ["012", ".13", "0123", ".13", "012", ".13", "0123"], x, 25, FRAME);
    r.fill(2, 21, 44, 4, FRAME[2]); r.fill(2, 21, 44, 1, FRAME[0]); r.fill(2, 24, 44, 1, FRAME[4]); for (let x = 8; x < 44; x += 9) r.fill(x, 22, 2, 2, GILT_BRONZE[1]);
    r.fill(4, 14, 41, 7, c[1]); r.fill(4, 14, 41, 1, c[0]); r.fill(4, 15, 28, 1, c[0]); r.fill(4, 20, 41, 1, c[3]); for (let x = 12; x < 44; x += 7) r.fill(x, 15, 1, 5, "#f0e2bc");
    for (let j = 0; j < 14; j++) { r.fill(1 + (j < 4 ? 3 - j : 0), 8 + j, 4, 1, FRAME[1]); r.set(1 + (j < 4 ? 3 - j : 0), 8 + j, FRAME[0]); }
    r.fill(2, 11, 3, 3, GILT_BRONZE[1]); r.set(2, 11, GILT_BRONZE[0]);
    r.fill(6, 9, 11, 6, "#f0e2bc"); r.fill(6, 9, 11, 1, "#fbf5e6"); r.fill(6, 14, 11, 1, "#c8b890"); r.fill(8, 10, 1, 4, c[1]); r.fill(14, 10, 1, 4, c[1]);
    for (let j = 0; j < 8; j++) r.fill(36 + (j >> 2), 21 + j, 8 - (j >> 1), 1, j % 3 ? c[2] : c[1]);
    soften(r);
    return s;
  }
  if (kind === "lectus-side") {
    // The same couch seen from its foot, running back into the room.
    const s = sprite(16, 56, 0, 55), { r } = s, c = CLOTH;
    r.shadow(8, 54, 7, 2, 0.24);
    r.fill(1, 6, 14, 44, FRAME[2]); r.fill(1, 6, 14, 1, FRAME[0]); r.fill(1, 6, 1, 44, FRAME[1]); r.fill(14, 7, 1, 43, FRAME[4]); r.fill(1, 49, 14, 2, FRAME[3]);
    r.fill(2, 3, 12, 4, FRAME[1]); r.fill(2, 3, 12, 1, FRAME[0]); r.fill(6, 4, 4, 2, GILT_BRONZE[1]);
    r.fill(3, 8, 10, 40, c[1]); r.fill(3, 8, 3, 40, c[0]); r.fill(12, 8, 1, 40, c[2]); for (let y = 19; y < 47; y += 7) r.fill(3, y, 10, 1, "#f0e2bc");
    r.fill(3, 8, 10, 6, "#f0e2bc"); r.fill(3, 8, 10, 1, "#fbf5e6"); r.fill(3, 13, 10, 1, "#c8b890");
    for (const x of [1, 12]) stamp(r, ["012", ".13", "0123"], x, 51, FRAME);
    soften(r);
    return s;
  }
  if (kind === "mensa") {
    // A round table on three legs, with what is being eaten.
    const s = sprite(20, 22, 2, 21), { r } = s, cx = 10;
    r.shadow(cx, 20, 7, 2, 0.22);
    for (const [x, sgn] of [[cx - 6, -1], [cx - 1, 0], [cx + 4, 1]] as const) for (let j = 0; j < 9; j++) { r.fill(x + Math.round(Math.sin(j * 0.5) * sgn), 11 + j, 2, 1, FRAME[sgn > 0 ? 3 : 2]); r.set(x + Math.round(Math.sin(j * 0.5) * sgn), 11 + j, FRAME[sgn > 0 ? 2 : 0]); }
    for (let y = -3; y <= 3; y++) for (let x = -8; x <= 8; x++) if ((x / 8.5) ** 2 + (y / 3.5) ** 2 <= 1) r.set(cx + x, 8 + y, y > 1 ? FRAME[3] : x < -3 && y < 1 ? FRAME[0] : FRAME[1]);
    soften(r);
    r.fill(cx - 5, 6, 3, 2, IRONC[0]); r.fill(cx - 5, 8, 3, 1, IRONC[2]); r.fill(cx, 5, 2, 2, "#c84a3a"); r.fill(cx + 2, 6, 2, 2, "#f0a030"); r.fill(cx + 1, 7, 2, 2, "#7ab04e"); r.fill(cx + 4, 8, 3, 1, "#dcb478");
    return s;
  }
  if (kind === "cartibulum") {
    // A marble table on carved supports, set with bronze: it stood at the head of the pool.
    const s = sprite(48, 38, 0, 37), { r } = s;
    r.shadow(24, 36, 20, 3, 0.26);
    for (const x of [8, 34]) { r.fill(x, 20, 6, 15, WHITE[1]); r.fill(x, 20, 2, 15, WHITE[0]); r.fill(x + 4, 20, 2, 15, WHITE[3]); stamp(r, ["0112", "0122", ".12.", ".12.", "0112", "0123"], x + 1, 24, WHITE); r.fill(x - 1, 33, 8, 2, WHITE[2]); r.fill(x - 1, 33, 8, 1, WHITE[0]); }
    r.fill(4, 13, 40, 5, WHITE[1]); r.fill(5, 12, 38, 1, WHITE[0]); r.fill(4, 13, 40, 1, WHITE[0]); r.fill(4, 18, 40, 2, WHITE[2]); r.fill(5, 20, 38, 1, WHITE[4]); r.fill(42, 13, 2, 6, WHITE[2]);
    soften(r);
    stamp(r, ["..01..", "..12..", ".0112.", "011223", "011223", ".0123.", ".0123."], 9, 8, GILT_BRONZE);
    stamp(r, ["0111112223", ".01112233.", "...1223..."], 20, 12, GILT_BRONZE);
    stamp(r, [".00.", ".00.", "0112", "0112", ".12.", "0123"], 35, 9, WHITE);
    return s;
  }
  if (kind === "arca") {
    // The strongbox: wood bound in iron, bolted to the floor.
    const s = sprite(32, 30, 0, 29), { r } = s;
    r.shadow(16, 28, 14, 2, 0.26);
    r.fill(2, 11, 28, 16, FRAME[2]); r.fill(2, 11, 28, 1, FRAME[1]); r.fill(28, 12, 2, 15, FRAME[4]); r.fill(2, 26, 28, 1, FRAME[4]);
    r.fill(1, 6, 30, 5, FRAME[1]); r.fill(2, 5, 28, 1, FRAME[0]); r.fill(1, 6, 30, 1, FRAME[0]); r.fill(1, 10, 30, 1, FRAME[4]);
    for (const x of [5, 15, 25]) { r.fill(x, 6, 2, 21, IRONC[2]); r.fill(x, 6, 1, 21, IRONC[1]); for (let y = 8; y < 26; y += 5) r.set(x, y, IRONC[0]); }
    r.fill(2, 17, 28, 2, IRONC[2]); r.fill(2, 17, 28, 1, IRONC[1]);
    r.fill(12, 13, 8, 6, GILT_BRONZE[2]); r.fill(12, 13, 8, 1, GILT_BRONZE[0]); r.fill(15, 15, 2, 3, "#2a2226");
    r.fill(3, 27, 3, 2, FRAME[4]); r.fill(26, 27, 3, 2, FRAME[4]);
    soften(r);
    return s;
  }
  if (kind === "lampstand") {
    // A bronze stand as tall as a person, an oil lamp burning on top.
    const s = sprite(16, 60, 0, 59), { r } = s, cx = 8;
    r.shadow(cx, 58, 6, 2, 0.24);
    stamp(r, ["...0123...", "...0123...", "..001233..", ".00.12.33.", "01..12..34"], cx - 5, 53, METAL);
    for (let y = 16; y < 53; y++) { const knop = y % 12 === 4 || y % 12 === 5; r.fill(cx - (knop ? 2 : 1), y, knop ? 4 : 2, 1, METAL[1]); r.set(cx - (knop ? 2 : 1), y, METAL[0]); r.set(cx + (knop ? 1 : 0), y, METAL[3]); }
    r.fill(cx - 4, 14, 8, 2, METAL[1]); r.fill(cx - 4, 14, 8, 1, METAL[0]); r.fill(cx - 3, 16, 6, 1, METAL[3]);
    stamp(r, ["..0112...", "011122223", ".0122233."], cx - 5, 11, METAL);
    soften(r);
    r.set(cx + 3, 10, FLAME[2]); r.fill(cx + 3, 8, 1, 2, FLAME[1]); r.set(cx + 3, 7, FLAME[0]);
    glow.push({ x: cx + 3, y: 9 });
    return { ...s, glow };
  }
  if (kind === "sella") {
    // A folding stool with a cushion.
    const s = sprite(16, 20, 0, 19), { r } = s;
    r.shadow(8, 18, 6, 2, 0.22);
    for (let j = 0; j < 9; j++) { r.fill(2 + j, 9 + j, 2, 1, FRAME[1]); r.fill(12 - j, 9 + j, 2, 1, FRAME[3]); }
    r.fill(7, 12, 2, 2, GILT_BRONZE[1]);
    r.fill(1, 5, 14, 4, CLOTH[1]); r.fill(2, 4, 12, 1, CLOTH[0]); r.fill(1, 5, 14, 1, CLOTH[0]); r.fill(1, 8, 14, 1, CLOTH[3]); r.fill(13, 5, 2, 4, CLOTH[2]);
    soften(r);
    return s;
  }
  if (kind === "labrum") {
    // A shallow marble basin on a fluted stem, brimming.
    const s = sprite(28, 36, 6, 35), { r } = s, cx = 14;
    r.shadow(cx, 34, 9, 2, 0.24);
    r.fill(cx - 6, 30, 12, 3, WHITE[1]); r.fill(cx - 6, 30, 12, 1, WHITE[0]); r.fill(cx + 3, 31, 3, 2, WHITE[3]);
    for (let y = 16; y < 30; y++) for (let i = 0; i < 6; i++) r.set(cx - 3 + i, y, i === 0 ? WHITE[0] : i === 2 || i === 4 ? WHITE[3] : i === 5 ? WHITE[4] : WHITE[1]);
    for (let y = -5; y <= 5; y++) for (let x = -13; x <= 13; x++) {
      const d = (x / 13.5) ** 2 + (y / 5.5) ** 2;
      if (d > 1) continue;
      r.set(cx + x, 11 + y, d < 0.5 && y < 3 ? POOL[x < -2 ? 0 : 1] : y > 2 ? WHITE[x > 5 ? 3 : 2] : x < -6 ? WHITE[0] : WHITE[1]);
    }
    soften(r);
    return s;
  }
  if (kind === "tabula") {
    // The master's table: book rolls, wax tablets, an inkpot and a lamp.
    const s = sprite(48, 34, 0, 33), { r } = s;
    r.shadow(24, 32, 21, 3, 0.26);
    for (const x of [4, 41]) stamp(r, ["012", "013", ".13", ".13", "013", ".13", ".13", "013", "0123"], x, 23, FRAME);
    r.fill(5, 26, 38, 1, FRAME[3]);
    r.fill(2, 13, 44, 7, FRAME[1]); r.fill(3, 12, 42, 1, FRAME[0]); r.fill(2, 13, 44, 1, FRAME[0]); r.fill(2, 20, 44, 3, FRAME[3]); r.fill(2, 22, 44, 1, FRAME[4]); r.fill(44, 13, 2, 8, FRAME[2]);
    soften(r);
    for (const [x, y] of [[7, 15], [9, 17]]) { r.fill(x, y, 11, 3, "#eadfc4"); r.fill(x, y, 11, 1, "#fbf5e6"); r.fill(x, y, 1, 3, "#c8b890"); r.fill(x + 10, y, 1, 3, "#c8b890"); }
    r.fill(22, 14, 9, 6, "#7a2e2a"); r.fill(23, 15, 7, 4, "#3a3038"); r.fill(24, 16, 4, 1, "#8a848c"); r.fill(24, 18, 3, 1, "#8a848c");
    r.fill(33, 15, 3, 3, METAL[2]); r.set(33, 15, METAL[0]); for (let k = 0; k < 6; k++) r.set(35 + (k >> 1), 14 - k, "#fbf5e6");
    stamp(r, ["..0112...", "011122223", ".0122233."], 37, 15, METAL); r.fill(45, 12, 1, 2, FLAME[1]); r.set(45, 11, FLAME[0]);
    glow.push({ x: 45, y: 12 });
    return { ...s, glow };
  }
  return undefined;
}

const pictures = new Map<string, { picture: Raster; lights: [number, number][] } | undefined>();
function palaceProp(frame: string) {
  if (pictures.has(frame)) return pictures.get(frame);
  const m = /^made:palace:([^:]+):([^:]+):([^:@]+):(\d+)(?:@(\d+))?$/.exec(frame);
  const fair = m ? fairById(m[1]) : undefined, area = fair?.areas.find((a) => a.id === m![2]);
  const s = m ? paintPalaceDecor(m[3], Number(m[4]) / 997, fair?.palace && { ...fair.palace, ...area?.palace }) : undefined;
  let made: { picture: Raster; lights: [number, number][] } | undefined;
  if (s) {
    const mid = s.ox + 8, half = Math.max(mid, s.r.w - mid), foot = s.oy + 16, picture = new Raster(half * 2, foot + Number(m![5] ?? 0));
    for (let y = 0; y < Math.min(foot, s.r.h); y++) for (let x = 0; x < s.r.w; x++) {
      const i = (y * s.r.w + x) * 4, o = (y * picture.w + x + half - mid) * 4;
      for (let k = 0; k < 4; k++) picture.data[o + k] = s.r.data[i + k];
    }
    made = { picture, lights: (s.glow ?? []).map((g) => [g.x + half - mid, g.y]) };
  }
  pictures.set(frame, made);
  return made;
}
/** A palace prop's picture from its sprite name, `made:palace:<fair>:<area>:<kind>:<n>` with `@<px>` when it stands on a
 * table: the piece in its room's style, set so the middle of the foot of the picture is the middle of the foot of its cell. */
export const palacePropPicture = (frame: string) => palaceProp(frame)?.picture;
/** Where its flames are in that picture, for a piece that carries candles or a lamp. */
export const palacePropLights = (frame: string) => palaceProp(frame)?.lights ?? [];
