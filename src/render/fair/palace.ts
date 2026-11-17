import { h2, Raster } from "../ship/raster";
import { palaceBays, type FairLevel } from "../../world/fair";
import type { FairSprite } from "./things";

const CREAM = ["#fffaf0", "#f4ead8", "#e2d4ba", "#c2b092", "#94826a", "#665848"];
const GILT = ["#fff6c0", "#f6d266", "#d9a23a", "#a87424", "#70481a"];
/** Rouge griotte, the red marble of the pilasters. */
const ROUGE = ["#e6c0b0", "#c98474", "#ad5e54", "#8c4440", "#683030"];
const MIRROR = ["#d3e0e7", "#b7c8d2", "#a0b3bf", "#899eac", "#6e8494"];
const CRIMSON = ["#e0666a", "#b83c46", "#8e2a36", "#641c28"];
const HANGINGS = [CRIMSON, ["#7fae84", "#4e8258", "#386444", "#264830"], ["#7e9cd0", "#5070aa", "#3a548a", "#283c64"], ["#e6c070", "#c49844", "#9c7430", "#705020"]];
const WHITE = ["#ffffff", "#f2eee6", "#dcd6ca", "#b8b0a2", "#8c8478"];
/** Parquet panels, each a close family of honey browns: the two woven strips, the ground between, the frame, the lines, the joint. */
const PARQUET = [
  { a: "#cd9052", b: "#c68a4c", ground: "#bd8044", frame: "#ca8d4f", shade: "#b87b40", joint: "#ad7039" },
  { a: "#ca8d4f", b: "#c38749", ground: "#ba7d42", frame: "#c78a4d", shade: "#b5783e", joint: "#ad7039" },
  { a: "#d09355", b: "#c98d4f", ground: "#c08347", frame: "#cd9052", shade: "#bb7e42", joint: "#ad7039" },
];
const DARK = "#2a2226";
/** How far the back wall rises above the room's top row, and its whole height. */
export const PALACE_RISE = 64;
const TALL = PALACE_RISE + 48;

/** A palace floor, by the room's kind of floor: parquet de Versailles in panels a
 * bay square, or black and white marble. */
export function palaceFloor(R: Raster, X: number, Y: number, L: FairLevel, ax: number, ay: number) {
  const { b0 } = palaceBays(L.w);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const gx = ax * 16 + i, gy = ay * 16 + j;
    let col: string;
    if (L.floor === "tile" || L.floor === "iron") {
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
function hanging(R: Raster, bx: number, T: number, c: string[], seed: number, bare: boolean) {
  R.fill(bx + 9, T + 21, 30, 68, GILT[1]); R.fill(bx + 9, T + 21, 30, 1, GILT[0]); R.fill(bx + 9, T + 21, 1, 68, GILT[0]); R.fill(bx + 38, T + 22, 1, 67, GILT[3]); R.fill(bx + 10, T + 88, 29, 1, GILT[3]);
  for (let y = T + 23; y < T + 87; y++) for (let x = bx + 11; x < bx + 37; x++) {
    const m = Math.abs((x - bx) % 10 - 5) + Math.abs((y - T + ((x - bx) % 20 < 10 ? 0 : 7)) % 14 - 7);
    R.set(x, y, x === bx + 11 || y === T + 23 ? c[3] : m < 2 ? c[0] : m === 4 ? c[2] : c[1]);
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
      R.set(x, y, i === 0 ? GILT[lit ? 0 : 1] : i === 8 ? GILT[4] : rail || stile ? GILT[lit ? 1 : 2] : i === 2 ? GILT[lit ? 3 : 4] : GILT[lit ? 2 : 3]);
    }
  }
  R.fill(x0 + 7, top + 34, 1, 3, GILT[0]); R.fill(x0 + 22, top + 34, 1, 3, GILT[0]);
  // The carpet over the sill and out onto the floor.
  for (let y = B - 12; y < B + 9; y++) for (let x = x0 + 2; x < x0 + 28; x++) {
    const ex = Math.min(x - x0 - 2, x0 + 27 - x), ey = B + 8 - y;
    R.set(x, y, ex === 0 || ey === 0 ? CRIMSON[3] : ex === 2 || ey === 2 ? GILT[1] : (x + y) % 6 === 0 && ex > 3 && ey > 3 ? CRIMSON[0] : y < B ? CRIMSON[2] : CRIMSON[1]);
  }
  // Over the door, the King's sun in a gilt panel.
  const cx = bx + 24, cy = T + 33;
  R.fill(bx + 9, T + 21, 30, 24, GILT[1]); R.fill(bx + 9, T + 21, 30, 1, GILT[0]); R.fill(bx + 9, T + 21, 1, 24, GILT[0]); R.fill(bx + 38, T + 22, 1, 23, GILT[3]);
  R.fill(bx + 11, T + 23, 26, 20, "#f8f0de"); R.fill(bx + 11, T + 23, 26, 1, CREAM[3]); R.fill(bx + 11, T + 23, 1, 20, CREAM[3]);
  for (let a = 0; a < 16; a++) for (let d = 5; d < (a % 2 ? 8 : 10); d++) R.set(cx + Math.round(Math.cos((a / 16) * 6.283) * d), cy + Math.round(Math.sin((a / 16) * 6.283) * d * 0.9), a % 2 ? GILT[2] : GILT[1]);
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 18) R.set(cx + x, cy + y, x + y < -3 ? GILT[0] : x + y > 3 ? GILT[3] : GILT[1]);
  R.set(cx - 2, cy - 1, GILT[4]); R.set(cx + 1, cy - 1, GILT[4]); R.fill(cx - 1, cy + 2, 3, 1, GILT[3]);
}

/** A palace room's walls: the back wall seven cells tall, in bays of mirror, damask and doorway
 * between marble pilasters under a gilt entablature; the side and front walls seen from above. */
export function palaceWalls(R: Raster, L: FairLevel, OX: number, OY: number, seed: number) {
  const { w, h } = L, W = w * 16, H = h * 16, T = OY - PALACE_RISE, B = OY + 48, x0 = OX + 8, x1 = OX + W - 8;
  const { b0, n } = palaceBays(w);
  const exitAt = (x: number, y: number) => L.exits.some((e) => x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((y < 3 || x === 0 || x === w - 1 || y === h - 1) && !(exitAt(x, y) && y >= 3)) R.fill(OX + x * 16, OY + y * 16, 16, 16, DARK);
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
  const hue = HANGINGS[(seed >> 1) % HANGINGS.length];
  for (let k = 0; k < n; k++) {
    const ax = b0 + 3 * k, bx = OX + ax * 16;
    const hung = L.things.some((t) => t.wall && t.x >= ax && t.x < ax + 3);
    if (L.exits.some((e) => e.y === 0 && e.x === ax)) { doorway(R, bx, T); continue; }
    panel(bx + 10, T + 96, 28, 11);
    if (hung || (!L.mirrors && k % 3 !== 1)) hanging(R, bx, T, hue, seed + k * 17, hung);
    else mirror(R, bx, T);
  }
  // The entablature: a cornice with dentils, a frieze of red marble with gilt brackets, egg and dart under it.
  R.fill(x0, T, x1 - x0, 1, GILT[0]); R.fill(x0, T + 1, x1 - x0, 1, GILT[2]);
  R.fill(x0, T + 2, x1 - x0, 3, CREAM[0]);
  R.fill(x0, T + 5, x1 - x0, 1, GILT[2]);
  for (let x = x0; x < x1; x++) {
    if ((x - x0) % 4 < 2) R.fill(x, T + 3, 1, 2, CREAM[3]);
    for (let y = T + 6; y < T + 12; y++) R.set(x, y, marble(x, y * 3, y === T + 6 ? 3 : 2, seed + 9));
    const m = (x - OX - b0 * 16 + 480 + 2) % 24;
    if (m < 4) R.fill(x, T + 6, 1, 6, m === 0 ? GILT[0] : m === 3 ? GILT[3] : GILT[1]);
    else if (m === 13 || m === 14) R.fill(x, T + 8, 1, 2, m === 13 ? GILT[0] : GILT[2]);
    R.set(x, T + 12, (x - x0) % 4 === 3 ? GILT[3] : GILT[0]); R.set(x, T + 13, (x - x0) % 4 === 3 ? GILT[3] : GILT[1]);
  }
  R.fill(x0, T + 14, x1 - x0, 1, GILT[3]);
  for (let k = 0; k < 4; k++) for (let x = x0; x < x1; x++) R.shade(x, T + 15 + k, 0.3 - k * 0.07);
  for (let k = 0; k <= n; k++) pilaster(R, OX + (b0 + 3 * k) * 16, T, seed + k);
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
  ], cx - 7, base - 13, GILT);
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
  ], cx - 5, base - 10, GILT);
  r.fill(cx - 2, base - 7, 4, 5, "#fffaf0"); r.fill(cx + 1, base - 7, 1, 5, "#e6dcc8"); r.fill(cx - 1, base - 6, 1, 2, "#3a3038"); r.set(cx, base - 5, "#3a3038");
}

/** A gilt cabriole leg: a heavy knee, a waist, a scrolled foot. `s` is -1 for the left leg. */
function leg(r: Raster, x: number, top: number, s: number) {
  const rows = ["0123", "0123", "0123", ".012", ".013", ".013", ".013", ".012", "0123", "0123", "0113"];
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") r.set(x + (s < 0 ? i : 3 - i), top + j, GILT[s < 0 ? +ch : [1, 2, 3, 4][+ch]]); }));
}

const BUST = ["#fdf6e8", "#ecdfc8", "#d4c5aa", "#b3a288", "#8c7c66"];

/** The furniture of a palace room, drawn to stand against the back wall or on the open floor. */
export function paintPalaceDecor(kind: string, v: number): FairSprite | undefined {
  const n = Math.floor(v * 997), glow: { x: number; y: number }[] = [];
  if (kind === "console") {
    // A pier table: a thick slab of white marble on a carved and gilded frame, candles and porcelain on it.
    const s = sprite(48, 62, 0, 60), { r } = s, x = 4, wd = 40, top = 32, cx = x + wd / 2;
    r.shadow(24, 59, 20, 3, 0.26);
    // The apron, carved in scrolls, with a mask at its middle.
    r.fill(x + 2, top + 8, wd - 4, 6, GILT[2]); r.fill(x + 2, top + 8, wd - 4, 1, GILT[3]); r.fill(x + 2, top + 9, wd - 4, 1, GILT[1]);
    for (let i = x + 5; i < x + wd - 5; i += 5) { r.fill(i, top + 10, 2, 2, GILT[0]); r.set(i + 2, top + 11, GILT[1]); r.fill(i + 1, top + 12, 3, 1, GILT[3]); }
    for (let i = x + 2; i < x + wd - 2; i++) r.set(i, top + 13 + ((i - x) % 5 === 2 ? 1 : 0), GILT[3]);
    stamp(r, ["011223", "001123", "011223", ".0123.", "..13.."], cx - 3, top + 10, GILT);
    leg(r, x + 2, top + 14, -1); leg(r, x + wd - 6, top + 14, 1);
    r.fill(x + 6, top + 21, wd - 12, 2, GILT[2]); r.fill(x + 6, top + 21, wd - 12, 1, GILT[1]); r.fill(x + wd / 2, top + 22, wd / 2 - 6, 1, GILT[3]);
    stamp(r, [".01.", "0123", "0123", ".13."], cx - 2, top + 18, GILT);
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
    ], 1, 3, ["#f29a90", "#d85a58", "#b23c44", "#8a2a36"]);
    r.fill(1, 9, 12, 2, GILT[2]); r.fill(1, 9, 12, 1, GILT[1]); r.fill(1, 9, 3, 1, GILT[0]); r.fill(10, 10, 3, 1, GILT[3]);
    for (const x of [1, 10]) stamp(r, ["012", "013", ".13", "013", "123"], x, 11, GILT);
    soften(r);
    return s;
  }
  if (kind === "bench") {
    // A long bench in crimson velvet on a gilt frame.
    const s = sprite(48, 24, 0, 23), { r } = s, c = ["#f29a90", "#d85a58", "#b23c44", "#8a2a36"];
    r.shadow(24, 22, 21, 3, 0.26);
    r.fill(3, 4, 42, 1, c[0]); r.fill(2, 5, 44, 5, c[1]); r.fill(2, 5, 30, 1, c[0]); r.fill(2, 10, 44, 3, c[2]); r.fill(2, 12, 44, 1, c[3]); r.fill(44, 5, 2, 7, c[2]);
    for (let x = 8; x < 44; x += 7) r.set(x, 7, c[2]), r.set(x, 8, c[0]);
    r.fill(2, 13, 44, 3, GILT[2]); r.fill(2, 13, 44, 1, GILT[1]); r.fill(2, 13, 12, 1, GILT[0]); r.fill(2, 15, 44, 1, GILT[3]);
    for (let x = 6; x < 44; x += 5) r.set(x, 14, GILT[0]);
    for (const x of [2, 15, 30, 43]) stamp(r, ["012", "013", ".13", "013", "123"], x, 16, GILT);
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
    ], cx - 6, 28, GILT);
    soften(r);
    candelabrum(r, cx, 27, glow);
    return { ...s, glow };
  }
  return undefined;
}
