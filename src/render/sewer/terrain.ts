import { BRIDGE, DEEP, FLOOR, GRATE, LEDGE, SILT, WALL, WATER, type SewerLevel } from "../../world/sewer";
import type { CatacombKind, MineKind, SewerKind } from "../../content/sewers";
import { catacombPalettes, minePalettes, mix, oldPalette, quarryPalette, sewerPalettes, shade, type RGB, type SewerPalette } from "./palette";

/** Pixels of back wall shown above a floor: two and a half cells. */
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

const BLACK: RGB = [8, 7, 9];
const SHADE: RGB = [22, 16, 30];

export const paletteOf = (level: Pick<SewerLevel, "network" | "kind" | "layer">): SewerPalette =>
  level.network === "mine" ? minePalettes[level.kind as MineKind]
  : level.network === "catacomb" ? (level.kind === "ossuary" && level.layer !== "upper" ? quarryPalette : catacombPalettes[level.kind as CatacombKind])
  : level.layer === "old" ? oldPalette : sewerPalettes[level.kind as SewerKind];
const mined = (p: SewerPalette) => p.fabric === "rock" || p.fabric === "coal" || p.fabric === "salt";
const dug = (p: SewerPalette) => p.fabric === "loculi" || p.fabric === "bones" || p.fabric === "quarry";

/** A catacomb's back wall. `base` is the face's floor row, so each stretch of wall gets its own graves. */
function catacombPixel(p: SewerPalette, r: number, px: number, base: number, painted: boolean): RGB {
  const f = p.face, n = vn(px, r + base, 7, 71);
  let c: RGB = f[n < 0.3 ? 1 : n < 0.75 ? 2 : 3];
  // Pick marks in the soft rock, slanting the way the fossor swung.
  if ((px + r * 2 + Math.floor(h2(Math.floor(px / 9), Math.floor(r / 5), 72) * 9)) % 9 === 0 && h2(px >> 2, r >> 2, 73) < 0.5) c = shade(c, -14);
  if (painted) {
    // Lime plaster in panels ruled in red with a green line inside, over a red dado.
    const P = p.plaster!, K = p.paint!, lx = px % 30, panel = Math.floor(px / 30);
    c = P[vn(px, r + base, 11, 74) > 0.7 ? 2 : vn(px, r + base, 4, 75) < 0.2 ? 0 : 1];
    if (r >= 31) c = mix(K[0], f[1], r === 31 ? 0.5 : 0.2 + (h2(px, r, 76) < 0.1 ? 0.2 : 0));
    else if (r === 30) c = mix(K[0], BLACK, 0.3);
    else {
      const ink = (rr: number, l0: number, l1: number, t0: number, t1: number) => (rr === t0 || rr === t1) && lx >= l0 && lx <= l1 || (lx === l0 || lx === l1) && rr >= t0 && rr <= t1;
      if (ink(r, 3, 26, 6, 27)) c = K[0];
      else if (ink(r, 5, 24, 8, 25) && (lx + r) % 3 !== 0) c = K[1];
      else if (panel % 3 === 1 && r >= 13 && r <= 19) {
        // A garland swung between the frame's corners, leaves and red berries.
        const sag = Math.round(3 * Math.sin(((lx - 6) / 17) * Math.PI));
        if (lx >= 6 && lx <= 23 && r === 14 + sag) c = (lx & 1) ? K[1] : mix(K[1], P[0], 0.4);
        else if (lx >= 6 && lx <= 23 && r === 15 + sag && lx % 4 === 1) c = K[0];
      } else if (panel % 3 === 2 && r >= 14 && r <= 19 && lx >= 11 && lx <= 18) {
        // A dove.
        const bird = ["..##....", ".####.##", "#######.", ".#####..", "..#.#..."][r - 14];
        if (bird && bird[lx - 11] === "#") c = r === 14 ? mix(P[0], f[1], 0.3) : mix(P[0], BLACK, 0.18);
      }
    }
    // Damp coming through: ochre blooms with a darker tide edge, up from the floor and down from the vault.
    const wet = vn(px, r + base, 13, 77) + (r > 22 ? (r - 22) / 30 : 0) + (r < 8 ? (8 - r) / 20 : 0);
    if (wet > 0.78) c = mix(c, K[2], 0.38);
    else if (wet > 0.74) c = mix(c, K[2], 0.6);
    if (h2(px >> 1, (r + base) >> 1, 78) < 0.012) c = f[1];
  } else if (p.fabric === "loculi") {
    // Graves cut in rows along the gallery, sealed with tiles or a marble slab, or opened by robbers.
    const row = Math.floor((r - 4) / 11), lr = (r - 4) % 11;
    if (r >= 4 && row < 3 && lr < 8) {
      const off = row * 9 + Math.floor(h2(base, row, 79) * 20), slot = Math.floor((px + off) / 26), lx = (px + off) % 26;
      const len = 16 + Math.floor(h2(slot, row + base, 80) * 6), k = h2(slot, row * 7 + base, 81);
      if (lx >= 2 && lx < 2 + len) {
        const ix = lx - 2;
        if (lr === 0) c = mix(f[0], BLACK, 0.3);
        else if (lr === 7) c = f[3];
        else if (k < 0.42) {
          c = (ix % 6 === 5) ? mix(f[0], [200, 180, 150], 0.4) : shade([150, 74, 44], (h2(slot, Math.floor(ix / 6), 82) - 0.5) * 30);
          if (lr === 1) c = shade(c, 16);
        } else if (k < 0.66) {
          c = lr === 1 ? [232, 226, 210] : [206, 198, 180];
          if (lr === 3 && ix > 2 && ix < len - 3 && h2(ix, slot, 83) < 0.55) c = [150, 46, 32];
          if (lr === 5 && ix > 4 && ix < len - 6 && h2(ix, slot, 84) < 0.4) c = [150, 46, 32];
        } else {
          c = lr < 3 ? [10, 7, 6] : [26, 18, 14];
          if (lr === 6 && h2(ix >> 1, slot, 85) < 0.45) c = [196, 184, 156];
        }
      }
    }
    if (vn(px, r + base, 17, 86) > 0.7) c = mix(c, p.slime, 0.22);
  } else if (p.fabric === "bones") {
    // Long bones stacked with their round ends out, and bands of skulls set in rows between.
    const B = p.ore!, band = r >= 6 && r < 14 ? 6 : r >= 26 && r < 34 ? 26 : -1;
    if (band >= 0) {
      const sr = r - band, u = px + (band === 26 ? 5 : 0), sx = u % 10, id = Math.floor(u / 10);
      const skull = ["..#####..", ".#######.", "#########", "#oo###oo#", "#oo###oo#", ".###o###.", "..#####..", "..#.#.#.."][sr];
      c = B[0];
      const ch = sx < 9 ? skull[sx] : ".";
      if (ch === "o") c = [34, 26, 20];
      else if (ch === "#") {
        c = sr <= 1 ? B[3] : sx === 0 || sx === 8 || sr >= 6 ? B[1] : B[2];
        if (h2(id, band, 87) < 0.25) c = mix(c, [150, 118, 76], 0.3);
      }
    } else {
      const row = Math.floor(r / 4), u = px + (row & 1) * 2, lx = u % 5, ly = r % 4, id = h2(Math.floor(u / 5), row + base, 88);
      const knob = ly < 3 && lx < 4 && !((lx === 0 || lx === 3) && (ly === 0 || ly === 2));
      c = knob ? (ly === 0 || lx === 0 ? B[3] : lx === 3 || ly === 2 ? B[1] : B[2]) : B[0];
      if (knob && id < 0.3) c = mix(c, [150, 118, 76], 0.35);
      else if (knob && id > 0.85) c = shade(c, -20);
    }
  } else {
    // The quarry face: beds of limestone, joints between, and the quarrymen's pick lines.
    const bed = Math.floor((r + vn(px, 0, 20, 89) * 3) / 7);
    c = f[[2, 3, 2, 1, 2][bed % 5]];
    if (Math.floor((r + vn(px, 0, 20, 89) * 3)) % 7 === 0) c = f[0];
    if (vn(px, r + base, 5, 90) > 0.72) c = shade(c, 8);
    // Every so often a built pier of cut stone where the roof needed holding.
    if (px % 112 < 22) {
      const lr = r % 6, lx = (px % 112 + (Math.floor(r / 6) & 1) * 5) % 11;
      c = lr === 5 || lx === 10 ? f[0] : lr === 0 || lx === 0 ? f[3] : f[2];
    }
  }
  if (r < 6) c = mix(c, SHADE, (6 - r) / 9);
  if (r >= FACE - 2) c = mix(c, BLACK, 0.3);
  return c;
}

/** The thick rim of dressed blocks where the rock meets the open, bevelled, light above and left. */
function blockPixel(p: SewerPalette, px: number, py: number, d: number): RGB {
  const row = Math.floor(py / 8), u = px + (row & 1) * 7, lx = u % 14, ly = py % 8;
  const k = h2(Math.floor(u / 14), row, 91);
  let c = mix(p.face[k < 0.4 ? 1 : 2], p.rim, 0.3);
  if (ly === 7 || lx === 13) c = mix(p.top, p.rim, 0.25);
  else if (ly <= 1 || lx === 0) c = shade(c, ly === 0 || lx === 0 ? 24 : 12);
  else if (ly === 6 || lx === 12) c = shade(c, -18);
  else if (h2(px, py, 99) < 0.06) c = shade(c, -8);
  return d > 14 ? mix(c, p.top, (d - 14) * 0.45) : c;
}

/** A mine's back wall: cut rock, a coal seam under its shale roof, or banded salt;
 * with the timber sets that hold the roof up. */
function rockPixel(p: SewerPalette, r: number, px: number, py: number): RGB {
  const f = p.face;
  const n = vn(px, r + py * 0.3, 6, 51), m = vn(px * 0.6, r, 14, 52);
  let c: RGB;
  if (p.fabric === "coal") {
    const seam = r >= 12 && r < FACE - 5;
    if (seam) {
      // The coal: near black, split by vertical cleat, catching the light in points.
      c = mix(p.ore![1], p.ore![2], n > 0.6 ? 0.6 : n > 0.4 ? 0.25 : 0);
      if (px % 7 === 0 && h2(Math.floor(px / 7), Math.floor(r / 5), 53) < 0.6) c = p.ore![0];
      if (h2(px, r + py, 54) < 0.012) c = p.ore![3];
      if (r === 12) c = shade(c, -6);
    } else c = f[n < 0.35 ? 1 : n < 0.75 ? 2 : 3];
    if (!seam && (r + Math.floor(m * 4)) % 5 === 0) c = shade(c, -10);
  } else if (p.fabric === "salt") {
    // Layers of rock salt, grey and honey and pink, smoothed by the picks in scallops.
    const band = Math.floor((r + m * 6) / 4);
    c = f[[2, 3, 2, 1, 3, 2][band % 6]];
    if (band % 5 === 3) c = mix(c, [196, 150, 140], 0.25);
    const scallop = ((px + Math.floor(r / 6) * 5) % 12) / 12;
    if (scallop < 0.15) c = shade(c, 10);
    else if (scallop > 0.85) c = shade(c, -8);
    if (h2(px, r + py, 55) < 0.015) c = p.ore![3];
  } else {
    // Hard rock, blocky and fractured, with the lode's colour in it here and there.
    c = f[n < 0.3 ? 1 : n < 0.72 ? 2 : 3];
    if (Math.abs(((px + r * 0.6) % 23) - 11) < 0.6 && m > 0.45) c = f[0];
    if (vn(px, r, 4, 56) > 0.8) c = mix(c, p.ore![1], 0.5);
    if (r % 9 === 0 && h2(Math.floor(px / 5), r, 57) < 0.2) c = shade(c, -12);
  }
  // Stains down from drips: soot and wet on coal, ochre on metal, white bloom on salt.
  const streak = h2(Math.floor(px / 3), 7, 17);
  if (streak < 0.08 && r > FACE * streak * 6) c = mix(c, p.slime, 0.22);
  // Timber sets: a leg either side of the road and a collar across, every few metres.
  const T = p.timber!, span = p.fabric === "salt" ? 96 : 48, lx = px % span;
  if (lx < 4 && r >= 2) c = T[lx === 0 ? 0 : lx === 1 ? 3 : lx === 2 ? 2 : 1];
  else if (r < 4 && lx < 4 + 6) c = T[r === 0 ? 3 : r === 3 ? 0 : 2];
  if (lx < 4 && r >= 2 && (r % 11 === 5)) c = shade(c, -14);
  if (r < 6) c = mix(c, SHADE, (6 - r) / 9);
  if (r >= FACE - 3) c = mix(c, BLACK, (r - (FACE - 4)) * 0.12);
  return c;
}

/** Rails on a mine road, along it or across it: sleepers, then two rails lit along the top. */
function railPixel(p: SewerPalette, col: RGB, px: number, py: number, along: boolean): RGB {
  const a = along ? px : py, b = along ? py & 15 : px & 15;
  const T = p.timber!;
  let c = col;
  if (a % 6 < 2 && b >= 2 && b <= 13) c = a % 6 === 0 ? T[1] : T[0];
  if (b === 4 || b === 11) c = [150, 150, 156];
  else if (b === 5 || b === 12) c = [70, 64, 60];
  return c;
}

/** The back wall at row `r` of its face (0 at the top), column `px`. */
function facePixel(p: SewerPalette, r: number, px: number, py: number, painted = false): RGB {
  if (mined(p)) return rockPixel(p, r, px, py);
  if (dug(p)) return catacombPixel(p, r, px, py + FACE - r, painted);
  const f = p.face;
  let c: RGB;
  if (p.fabric === "brick") {
    const course = Math.floor((py - r + 400) / 4) + Math.floor(r / 4), off = (course & 1) * 5;
    const brick = Math.floor((px + off) / 10);
    if (r % 4 === 3 || (px + off) % 10 === 9) c = f[0];
    else {
      const k = h2(brick, course, 11);
      c = f[k < 0.25 ? 1 : k < 0.8 ? 2 : 3];
      if (r % 4 === 0) c = shade(c, 6);
      if (h2(brick, course, 12) < 0.07) c = mix(c, BLACK, 0.35);
    }
  } else if (p.fabric === "ashlar") {
    const course = Math.floor(r / 8), off = (course & 1) * 9;
    const block = Math.floor((px + off) / 18);
    if (r % 8 === 7 || (px + off) % 18 === 17) c = f[0];
    else {
      const k = h2(block, course + Math.floor(py / 200), 13);
      c = f[k < 0.3 ? 1 : k < 0.85 ? 2 : 3];
      if (r % 8 === 0 || (px + off) % 18 === 0) c = shade(c, 8);
      if (vn(px, r, 5, 14) > 0.72) c = shade(c, -8);
    }
  } else if (p.fabric === "cast") {
    c = f[2];
    if (vn(px, py, 9, 15) > 0.62) c = f[1];
    if (r % 10 === 0) c = shade(c, 7);
    else if (r % 10 === 9) c = shade(c, -6);
    const j = px % 48;
    if (j === 0) c = f[0];
    else if (j === 1) c = f[3];
    if (r % 10 === 5 && px % 24 === 12) c = f[0];
  } else {
    c = f[2];
    const j = px % 32;
    if (j === 0 || r === 19) c = f[0];
    else if (j === 1 || r === 20) c = f[3];
    else if (h2(px, py, 16) < 0.06) c = f[1];
  }
  // Water stains run down from the joints.
  const streak = h2(Math.floor(px / 3), 7, 17);
  if (streak < 0.12 && r > FACE * streak * 4) c = mix(c, p.slime, 0.25);
  // The vault closes overhead: the top of the wall is in its own shadow.
  if (r < 6) c = mix(c, SHADE, (6 - r) / 9);
  // The tide line: slime and wet up to where the water usually comes.
  if (r >= FACE - 8) c = mix(c, p.slime, (r - (FACE - 9)) / 11 + (vn(px, r, 3, 18) > 0.6 ? 0.15 : 0));
  if (r === FACE - 1) c = mix(c, BLACK, 0.45);
  return pipesOver(p, c, r, px);
}

/** Mains, cables or lagged heating pipes hung along the wall. */
function pipesOver(p: SewerPalette, c: RGB, r: number, px: number): RGB {
  const P = p.pipe;
  if (p.pipes === "mains") {
    // A big water main and a smaller one, flanged every few metres.
    for (const [top, size] of [[9, 8], [19, 4]] as const) {
      const t = r - top;
      if (t < 0 || t >= size) continue;
      const flange = px % 64 < 2;
      let k = t === 0 ? 3 : t === 1 ? 2 : t >= size - 1 ? 0 : 1;
      if (flange) k = Math.min(3, k + 1);
      return t === size - 1 ? mix(P[0], BLACK, 0.3) : P[k];
    }
    if (r === 9 + 8 && px % 64 < 6) return mix(c, BLACK, 0.4);
    if ((r === 17 || r === 23) && px % 32 === 8) return P[0];
  } else if (p.pipes === "heating") {
    for (const top of [8, 19]) {
      const t = r - top;
      if (t < 0 || t >= 8) continue;
      const band = px % 22 < 2;
      const k = t === 0 ? 3 : t <= 2 ? 2 : t <= 5 ? 1 : 0;
      return band ? shade(P[k], -22) : P[k];
    }
    if ((r === 16 || r === 27) && px % 44 < 3) return P[0];
  } else if (p.pipes === "cable") {
    if (r >= 6 && r <= 9 && r !== 8) return px % 40 < 2 ? P[2] : r === 6 ? P[1] : P[0];
    if (r === 10 && px % 40 < 2) return P[1];
  }
  return c;
}

function pavedPixel(p: SewerPalette, ramp: RGB[], px: number, py: number): RGB {
  if (dug(p)) {
    // Trodden earth, and worn flags where the way was most used.
    let c = ramp[vn(px, py, 9, 92) < 0.4 ? 1 : 2];
    if (h2(px, py, 93) < 0.03) c = ramp[h2(px, py, 94) < 0.5 ? 0 : 3];
    const row = Math.floor(py / 9), off = (row & 1) * 6, sx = Math.floor((px + off) / 12), lx = (px + off) % 12, ly = py % 9;
    if (vn(sx * 12, row * 9, 40, 95) > 0.6 && h2(sx, row, 96) < 0.75 && lx < 11 && ly < 8 && !((lx === 0 || lx === 10) && (ly === 0 || ly === 7))) {
      const k = h2(sx, row, 97);
      c = mix(ramp[3], k < 0.4 ? p.face[2] : p.coping[1], 0.45);
      if (ly === 0 || lx === 0) c = shade(c, 12);
      else if (ly === 7 || lx === 10) c = shade(c, -18);
      if (h2(px, py, 98) < 0.04) c = shade(c, -10);
    }
    return c;
  }
  if (mined(p)) {
    // Trodden rock and grit, dust thicker along the walls.
    let c = ramp[vn(px, py, 11, 61) < 0.45 ? 1 : 2];
    if (vn(px, py, 3, 64) > 0.8) c = ramp[3];
    if (h2(px, py, 63) < 0.003) c = p.ore![p.fabric === "coal" ? 0 : 2];
    return c;
  }
  if (p.fabric === "brick") {
    // Stone setts in courses along the walkway.
    const row = Math.floor(py / 6), off = (row & 1) * 6, stone = Math.floor((px + off) / 12);
    if (py % 6 === 5 || (px + off) % 12 === 11) return ramp[0];
    const k = h2(stone, row, 21);
    let c = ramp[k < 0.3 ? 1 : k < 0.85 ? 2 : 3];
    if (py % 6 === 0) c = shade(c, 6);
    return c;
  }
  if (p.fabric === "ashlar") {
    const row = Math.floor(py / 10), off = (row & 1) * 11, stone = Math.floor((px + off) / 22);
    if (py % 10 === 9 || (px + off) % 22 === 21) return ramp[0];
    const k = h2(stone, row, 22);
    let c = ramp[k < 0.3 ? 1 : k < 0.85 ? 2 : 3];
    if (vn(px, py, 4, 23) > 0.7) c = shade(c, -6);
    return c;
  }
  let c = mix(ramp[2], ramp[1], Math.max(0, vn(px, py, 13, 24) - 0.45) * 0.9);
  if (h2(px, py, 25) < 0.025) c = ramp[3];
  else if (h2(px, py, 26) < 0.02) c = ramp[1];
  if (px % 32 === 0 || py % 32 === 0) c = shade(ramp[0], 6);
  return c;
}

/** The tunnels on the cell grid, as a top-down tile game draws them: walkways,
 * channels, a tall back wall wherever a floor has rock behind it, and the dark
 * earth everywhere else. */
/** `over` gets what lies on top of the moving water: the banks' coping and
 * shadow, the scum at the edges and the gratings, over transparency. */
export function paintSewerTerrain(ctx: CanvasRenderingContext2D, level: SewerLevel, over?: CanvasRenderingContext2D) {
  const { w, h, cells } = level;
  const p = paletteOf(level);
  const W = w * 16, H = h * 16;
  const img = ctx.createImageData(W, H);
  const out = img.data;
  const top = over?.createImageData(W, H);
  const cell = (px: number, py: number) => {
    const x = px >> 4, y = py >> 4;
    return px < 0 || py < 0 || x >= w || y >= h ? WALL : cells[y * w + x];
  };
  const wall = (px: number, py: number) => cell(px, py) === WALL;
  const wet = (c: number) => c === WATER || c === DEEP;
  const painted = new Uint8Array(w * h);
  for (const r of level.rooms) if (r.use === "cubiculum" || r.use === "crypt") for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) painted[y * w + x] = 1;
  const rimmed = dug(p);
  // Rows of rock between this pixel and the top of a wall face below it.
  const above = (px: number, py: number, k: number) => {
    while (k <= FACE + 17 && wall(px, py + k)) k++;
    return k <= FACE + 17 ? k - FACE : 18;
  };
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const c = cell(px, py);
      let col: RGB;
      if (c === WALL) {
        let k = 1;
        while (k <= FACE && wall(px, py + k)) k++;
        let up = 1;
        while (up <= (rimmed ? 17 : 6) && wall(px, py - up)) up++;
        let side = 18;
        for (let d = 1; d < (rimmed ? 18 : 9); d++) if (!wall(px - d, py) || !wall(px + d, py)) {
          side = d;
          break;
        }
        if (k <= FACE && !wall(px, py + k)) {
          col = facePixel(p, FACE - k, px, py, painted[((py + k) >> 4) * w + (px >> 4)] === 1);
          // Where the wall turns a corner, its edge catches the light.
          if (side === 1) col = mix(col, BLACK, 0.5);
        } else if (rimmed && Math.min(side, up, above(px, py, k)) <= 16) {
          col = blockPixel(p, px, py, Math.min(side, up, above(px, py, k)));
        } else if (up <= 6 && !wall(px, py - up)) {
          // The near edge of a floor above: its lip, then the dark below it.
          col = up <= 2 ? p.coping[up - 1] : mix(p.coping[2], BLACK, (up - 2) / 4);
        } else {
          const d = Math.min(side, up, k - FACE + 1);
          col = d <= 1 ? p.rim : d <= 3 ? mix(p.rim, p.top, 0.5) : p.top;
          if (d > 3 && h2(Math.floor(px / 4), Math.floor(py / 4), 31) < 0.03) col = shade(p.top, 6);
        }
      } else if (wet(c) || c === GRATE) {
        const open = (o: number) => wet(o) || o === GRATE;
        // The water lies below the walkways: how far down this pixel is from the bank above.
        let down = 0;
        while (down < 16 && open(cell(px, py - down - 1))) down++;
        const above = cell(px, py - down - 1);
        const drop = c === DEEP ? 9 : 6;
        const n = vn(px * 0.5, py, 18, 32);
        col = c === DEEP ? mix(p.water[1], p.water[0], 0.35 + n * 0.3) : mix(p.water[2], p.water[1], 0.15 + n * 0.35);
        let lay: RGB | undefined, alpha = 1;
        const stone = mix(p.ledge[0], p.coping[1], 0.4);
        const face = (k: number): RGB => {
          // The bank's own face: two courses of stone, lit at the lip, slimed at the tide line.
          let f = shade(stone, -k * 4);
          if (k === 0) return mix(stone, BLACK, 0.45);
          if (k === Math.floor(drop / 2) || (px + (k < drop / 2 ? 0 : 5)) % 9 === 0) f = mix(f, BLACK, 0.35);
          if (k >= drop - 2) f = mix(f, p.slime, 0.5);
          return f;
        };
        const bank = above !== WALL && above !== BRIDGE;
        if (bank && down < drop) lay = face(down);
        else if (bank && down < drop + 5) (lay = mix(face(drop - 1), p.water[0], 0.55)), (alpha = 0.62 - (down - drop) * 0.11);
        else if (!bank && down < 5) (lay = p.water[0]), (alpha = 0.6 - down * 0.1);
        else {
          // Scum along the banks: a broken film of grease and slime.
          let shore = 4;
          for (let k = 1; k < 4 && shore === 4; k++) if ([[k, 0], [-k, 0], [0, k]].some(([dx, dy]) => !open(cell(px + dx, py + dy)))) shore = k;
          if (shore < 4 && vn(px, py, 3, 34) > 0.42 + shore * 0.1) (lay = p.slime), (alpha = 0.55);
        }
        // Side walls throw a shadow across the water; the near bank's lip, a thin one.
        for (let k = 1; k <= 3; k++)
          if (!open(cell(px - k, py)) || !open(cell(px + k, py))) {
            const a2 = [0.7, 0.45, 0.2][k - 1];
            if (!lay || alpha < a2) (lay = mix(p.coping[2], lay ?? p.water[0], lay ? 0.3 : 0)), (alpha = a2);
            break;
          }
        if (!open(cell(px, py + 1)) || !open(cell(px, py + 2))) (lay = BLACK), (alpha = !open(cell(px, py + 1)) ? 0.5 : 0.22);
        if (c === GRATE) {
          // Iron bars across the tunnel's end, and the dark through them.
          const bx = px % 4, row = py % 16;
          lay = mix(col, BLACK, 0.55);
          alpha = 1;
          if (row < 2) lay = row === 0 ? p.pipe[2] : p.pipe[0];
          else if (bx === 1) lay = p.pipe[2];
          else if (bx === 2) lay = p.pipe[0];
        }
        if (lay) {
          col = mix(col, lay, alpha);
          if (top) top.data.set([lay[0], lay[1], lay[2], Math.round(alpha * 255)], (py * W + px) * 4);
        }
      } else if (c === BRIDGE) {
        // A steel footbridge: a chequer deck between two rails.
        const lx = px % 16;
        col = (Math.floor(px / 2) + Math.floor(py / 2)) % 2 ? p.pipe[1] : p.pipe[0];
        if (lx === 0 || lx === 15) col = p.pipe[2];
        else if (lx === 1 || lx === 14) col = BLACK;
        if ((lx === 0 || lx === 15) && py % 16 === 4) col = shade(p.pipe[2], 30);
      } else if (c === SILT) {
        const n = vn(px, py, 7, 41);
        col = p.silt[n < 0.38 ? 0 : n < 0.7 ? 1 : 2];
        if (Math.floor(py + vn(px, py, 16, 42) * 6) % 5 === 0) col = shade(col, -8);
        if (h2(px, py, 43) < 0.02) col = p.slime;
      } else {
        col = pavedPixel(p, c === FLOOR ? p.floor : p.ledge, px, py);
        if (c === LEDGE && mined(p)) {
          const x = px >> 4, y = py >> 4, rail = (o: number) => o === LEDGE;
          col = railPixel(p, col, px, py, rail(cell((x - 1) * 16, py)) || rail(cell((x + 1) * 16, py)) || !(rail(cell(px, (y - 1) * 16)) || rail(cell(px, (y + 1) * 16))));
        }
        // A walkway's edge over the channel: a coping stone, lit along its top.
        const below = cell(px, py + 1), below2 = cell(px, py + 2);
        if (mined(p)) {
          if (wet(cell(px, py - 1))) col = shade(p.coping[1], 8);
        } else if (c !== BRIDGE && wet(cell(px, py - 1))) col = shade(p.coping[0], 10);
        else if (c === LEDGE && (wet(below) || below === GRATE)) col = shade(p.coping[0], -12);
        else if (c === LEDGE && (wet(below2) || below2 === GRATE)) col = p.coping[0];
        else if (c === LEDGE && (wet(cell(px - 1, py)) || wet(cell(px + 1, py)))) col = p.coping[0];
        // The back wall shades the floor at its foot.
        let under = 1;
        while (under <= 8 && !wall(px, py - under)) under++;
        if (under <= 8) col = mix(col, SHADE, under <= 2 ? 0.55 : under <= 5 ? 0.35 : 0.15);
        else if (wall(px - 1, py) || wall(px + 1, py)) col = mix(col, SHADE, 0.3);
        else if (wall(px - 2, py) || wall(px + 2, py)) col = mix(col, SHADE, 0.15);
        // Damp creeps up from the channel's edge.
        if ((wet(cell(px, py + 3)) || wet(cell(px, py + 5))) && vn(px, py, 5, 44) > 0.55) col = mix(col, p.slime, 0.3);
      }
      const i = (py * W + px) * 4;
      out[i] = col[0];
      out[i + 1] = col[1];
      out[i + 2] = col[2];
      out[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  if (top) over!.putImageData(top, 0, 0);
}
