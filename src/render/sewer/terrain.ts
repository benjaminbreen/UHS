import { BRIDGE, DEEP, FLOOR, GRATE, LEDGE, SILT, WALL, WATER, type SewerLevel } from "../../world/sewer";
import { mix, oldPalette, sewerPalettes, shade, type RGB, type SewerPalette } from "./palette";

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

export const paletteOf = (level: SewerLevel): SewerPalette => (level.layer === "old" ? oldPalette : sewerPalettes[level.kind]);

/** The back wall at row `r` of its face (0 at the top), column `px`. */
function facePixel(p: SewerPalette, r: number, px: number, py: number): RGB {
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
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const c = cell(px, py);
      let col: RGB;
      if (c === WALL) {
        let k = 1;
        while (k <= FACE && wall(px, py + k)) k++;
        let up = 1;
        while (up <= 6 && wall(px, py - up)) up++;
        let side = 9;
        for (let d = 1; d < 9; d++) if (!wall(px - d, py) || !wall(px + d, py)) {
          side = d;
          break;
        }
        if (k <= FACE && !wall(px, py + k)) {
          col = facePixel(p, FACE - k, px, py);
          // Where the wall turns a corner, its edge catches the light.
          if (side === 1) col = mix(col, BLACK, 0.5);
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
        // A walkway's edge over the channel: a coping stone, lit along its top.
        const below = cell(px, py + 1), below2 = cell(px, py + 2);
        if (c !== BRIDGE && wet(cell(px, py - 1))) col = shade(p.coping[0], 10);
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
