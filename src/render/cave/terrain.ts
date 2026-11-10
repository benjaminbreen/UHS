import type { CaveKind } from "../../content/caves";
import type { Rock } from "../../content/geography/rock";
import { DEEP, FLOOR, MOUTH, SHALLOW, WALL, type CaveLevel } from "../../world/cave";
import { cliffPixel, rockRamp } from "../edge-faces";
import { cavePalettes, mix, type RGB } from "./palette";

/** Pixels of rock face shown above the floor at the back of a chamber: two
 * and a half cells, as the generator keeps back walls at least three thick. */
export const FACE = 40;

const h2 = (x: number, y: number, s: number) => {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s, 2147483647);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const vn = (x: number, y: number, scale: number, s: number) => {
  const fx = x / scale, fy = y / scale, x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  return (h2(x0, y0, s) * (1 - sx) + h2(x0 + 1, y0, s) * sx) * (1 - sy) + (h2(x0, y0 + 1, s) * (1 - sx) + h2(x0 + 1, y0 + 1, s) * sx) * sy;
};

const BLACK: RGB = [7, 6, 9];
// Shadows lean purple and highlights warm, as lamplight on rock does.
const SHADE: RGB = [28, 14, 34];
const WARM: RGB = [255, 236, 196];
/** Which of the exterior cliffs' forms each cave's walls take: the shape
 * only, since the colour comes from the cave's palette. Basalt's narrow ribs
 * read as flowstone draperies. */
const FORM: Record<CaveKind, Rock> = { karst: "basalt", sandstone: "sandstone", lava: "basalt", fissure: "granite", sea: "shale", ice: "basalt" };
const CB = 11;

/** The slab under a floor pixel: its id, its centre, how far in from its
 * edge, and which way that edge faces. */
function slab(x: number, y: number) {
  const gx = Math.floor(x / CB), gy = Math.floor(y / CB);
  let d1 = 1e9, d2 = 1e9, ax = 0, ay = 0, bx = 0, by = 0, id = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const cx = gx + dx, cy = gy + dy;
      const fx = (cx + 0.12 + h2(cx, cy, 41) * 0.76) * CB, fy = (cy + 0.12 + h2(cx, cy, 42) * 0.76) * CB;
      // Slabs read wider than deep on a floor seen from above at a slant.
      const d = (x - fx) ** 2 + ((y - fy) * 1.25) ** 2;
      if (d < d1) (d2 = d1), (bx = ax), (by = ay), (d1 = d), (ax = fx), (ay = fy), (id = cx * 7919 + cy);
      else if (d < d2) (d2 = d), (bx = fx), (by = fy);
    }
  const nx = bx - ax, ny = (by - ay) * 1.25, len = Math.hypot(nx, ny) || 1;
  const e = -((x - (ax + bx) / 2) * nx + (y - (ay + by) / 2) * 1.25 * ny) / len;
  return { id, ax, ay, e, toward: (nx + ny) / len };
}

/** Distance in pixels from each pixel to the nearest one where `seed` holds,
 * by a two-pass chamfer, capped at `cap`. */
function distance(W: number, H: number, seed: (x: number, y: number) => boolean, cap: number) {
  const d = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d[y * W + x] = seed(x, y) ? 0 : cap;
  const A = 1, B = 1.41;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + A);
      if (y > 0) {
        d[i] = Math.min(d[i], d[i - W] + A);
        if (x > 0) d[i] = Math.min(d[i], d[i - W - 1] + B);
        if (x < W - 1) d[i] = Math.min(d[i], d[i - W + 1] + B);
      }
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (x < W - 1) d[i] = Math.min(d[i], d[i + 1] + A);
      if (y < H - 1) {
        d[i] = Math.min(d[i], d[i + W] + A);
        if (x < W - 1) d[i] = Math.min(d[i], d[i + W + 1] + B);
        if (x > 0) d[i] = Math.min(d[i], d[i + W - 1] + B);
      }
    }
  return d;
}

/** The rock itself on the cell grid, as a top-down tile game draws it: floor,
 * water, a tall face at the back of every chamber, and the dark tops of the
 * rock everywhere else, rimmed where they meet the floor. */
export function paintCaveTerrain(ctx: CanvasRenderingContext2D, level: CaveLevel) {
  const { w, h, cells, kind } = level;
  const pal = cavePalettes[kind];
  const rock = FORM[kind];
  const W = w * 16, H = h * 16;
  const img = ctx.createImageData(W, H);
  const out = img.data;
  const cell = (px: number, py: number) => {
    const x = px >> 4, y = py >> 4;
    return x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x];
  };
  // The cells read as a smooth field between their centres, so a staircase of
  // cells becomes a diagonal brink and a corner a rounded one, while a long
  // run stays straight. A slow wobble keeps it from looking drawn by rule.
  const field = (px: number, py: number, hit: (k: number) => boolean) => {
    const fx = (px + 0.5) / 16 - 0.5, fy = (py + 0.5) / 16 - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? hit(WALL) : hit(cells[y * w + x])) ? 1 : 0;
    const v = (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
    return v + (vn(px, py, 23, 1) - 0.5) * 0.22 + (vn(px, py, 7, 2) - 0.5) * 0.06;
  };
  const solid = new Uint8Array(W * H), wet = new Uint8Array(W * H);
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      // The mouth passage, at the foot of the first level, is cut on the grid.
      const steady = level.depth === 1 && py > H - 40;
      solid[py * W + px] = steady ? +(cell(px, py) === WALL) : +(field(px, py, (k) => k === WALL) > 0.5);
      wet[py * W + px] = +(field(px, py, (k) => k === SHALLOW || k === DEEP) > 0.5);
    }
  const wall = (px: number, py: number) => px < 0 || py < 0 || px >= W || py >= H || solid[py * W + px] === 1;
  const dry = (px: number, py: number) => px < 0 || py < 0 || px >= W || py >= H || !wet[py * W + px];
  // Rounded corners: rock within a few pixels of the open is rim, and the
  // open within a few pixels of rock lies in its shadow.
  const toOpen = distance(W, H, (x, y) => !wall(x, y), 16);
  const toRock = distance(W, H, (x, y) => wall(x, y), 8);
  const fl = pal.floor, fc = pal.face;
  const mortar = mix(fl[0], SHADE, 0.2), lit = mix(fl[2], WARM, 0.12);
  // The cliff painter gives the form; the cave's own ramp gives the colour.
  const src = rockRamp(rock).map((c) => c[0] + c[1] + c[2]);
  const dst: RGB[] = [mix(fc[0], SHADE, 0.5), fc[0], fc[1], fc[2], fc[3], fc[4], mix(fc[4], WARM, 0.3)];
  const tint = (c: number[]): RGB => {
    const l = c[0] + c[1] + c[2];
    let k = 0;
    for (let j = 1; j < 7; j++) if (Math.abs(src[j] - l) < Math.abs(src[k] - l)) k = j;
    return dst[k];
  };
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const i0 = py * W + px, under0 = cell(px, py);
      const c = solid[i0] ? WALL : wet[i0] ? (under0 === DEEP ? DEEP : SHALLOW) : under0 === MOUTH ? MOUTH : FLOOR;
      let col: RGB;
      if (c === WALL) {
        let k = 1;
        while (k <= FACE && wall(px, py + k)) k++;
        let up = 1;
        while (up <= 8 && wall(px, py - up)) up++;
        const d = toOpen[i0];
        if (k <= FACE && !wall(px, py + k)) {
          // The back wall, drawn as the cliffs outside are.
          const r = FACE - k;
          col = tint(cliffPixel(rock, r, FACE, px, py - r));
          if (r < 2 && d < 3) col = mix(col, BLACK, 0.5);
        } else if (up <= 8 && !wall(px, py - up)) {
          // The front edge of a floor, its lip seen falling away into the dark.
          col = up <= 6 ? tint(cliffPixel(rock, up - 1, 6, px, py - up + 1)) : mix(fc[0], BLACK, 0.6);
          if (up > 3) col = mix(col, BLACK, (up - 3) / 5);
        } else if (d <= 3) {
          col = d <= 1 ? fc[1] : d <= 2 ? fc[0] : mix(fc[0], SHADE, 0.5);
        } else {
          col = d < 9 ? mix(pal.top, BLACK, (d - 3) / 6) : BLACK;
          // Cones of rock standing out in the dark beyond the light.
          if (d >= 10) {
            const gx = Math.floor(px / 24), gy = Math.floor(py / 24);
            if (h2(gx, gy, 47) < 0.08) {
              const ox = gx * 24 + 6 + h2(gx, gy, 48) * 12, base = gy * 24 + 22, tall = 10 + h2(gx, gy, 49) * 12;
              const above = base - py, half = 4 - (above / tall) * 3.5;
              if (above >= 0 && above < tall && Math.abs(px - ox) < half) col = px - ox < -half + 1.5 ? mix(pal.top, pal.rim, 0.5) : pal.top;
            }
          }
        }
      } else if (c === SHALLOW || c === DEEP) {
        let bank = 0;
        while (bank < 5 && !dry(px, py - bank - 1)) bank++;
        col = c === DEEP ? pal.water[vn(px, py, 30, 3) > 0.5 ? 1 : 0] : pal.water[1];
        if (vn(px, py * 3, 14, 31) > 0.74) col = mix(col, pal.water[2], 0.7);
        if (dry(px - 1, py) || dry(px + 1, py) || dry(px, py + 1)) col = pal.water[2];
        // The floor stands a little above the water: a cut bank, then its shadow.
        if (bank < 5 && !wall(px, py - bank - 1)) col = bank < 2 ? (bank === 0 ? fc[2] : fc[1]) : mix(pal.water[0], SHADE, 0.35);
      } else {
        const s = slab(px, py);
        const n = vn(px, py, 22, 5);
        if (vn(s.ax, s.ay, 44, 3) < pal.silt) {
          col = fl[n < 0.4 ? 0 : n < 0.75 ? 1 : 2];
          const g = h2(px, py, 5);
          if (g < 0.02) col = fl[0];
          else if (g > 0.985) col = fl[3];
        } else {
          col = fl[[1, 2, 2, 1, 2, 3][Math.floor(h2(s.id, 0, 43) * 6)]];
          if (n < 0.3) col = mix(col, fl[0], 0.35);
          if (s.e < 0.8) col = mortar;
          else if (s.e < 1.8 && s.toward > 0.3) col = mix(col, fl[0], 0.6);
          else if (s.e < 1.8 && s.toward < -0.3) col = lit;
          else if (h2(px, py, 6) < 0.025) col = fl[0];
        }
        // The back wall shades its foot; any rock beside shades a little.
        let under = 1;
        while (under <= 10 && !wall(px, py - under)) under++;
        if (under <= 10) col = mix(col, SHADE, under <= 2 ? 0.6 : under <= 5 ? 0.4 : 0.18);
        else if (toRock[i0] <= 3) col = mix(col, SHADE, 0.38 - toRock[i0] * 0.08);
        if (c === MOUTH || py > H - 64) {
          // Daylight on the floor of the mouth, burning out at the sill.
          const t = Math.max(0, Math.min(1, (py - (H - 64)) / 60));
          col = mix(col, [255, 244, 214], t * t * 0.85);
        }
      }
      const i = i0 * 4;
      out[i] = col[0];
      out[i + 1] = col[1];
      out[i + 2] = col[2];
      out[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}
