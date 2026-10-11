import { lightKey, mix, type Ramp } from "../v2/pixels";

export const W = 80,
  H = 80;
/** The seam between columns 39 and 40: the figure's centre line. */
export const CX = 39.5;
const INK = "#1a1322";

export const SKIN = 0,
  HAIR = 1,
  TOP = 2,
  LOWER = 3,
  TRIM = 4,
  INNER = 5,
  HAT = 6,
  CLOAK = 7,
  LEATHER = 8,
  BOOT = 9,
  METAL = 10,
  WHITE = 11,
  SOLE = 12,
  LIP = 13,
  BLUSH = 14,
  EYE = 15,
  GLASS = 16,
  STUBBLE = 17,
  LEG = 18,
  IRIS = 19,
  PATCH = 20,
  KERCHIEF = 21,
  APRON = 22,
  ACCENT = 23,
  ORN = 24,
  MARK = 25,
  DECO = 26,
  PLUME = 27,
  /** Motion lines: drawn first, so the body covers them, and half see-through. */
  SMEAR = 28,
  MATS = 29;

/** Ties round toward the centre line, so a shape and its mirror land on mirrored columns. */
export const rnd = (x: number) =>
  x < CX ? Math.floor(x + 0.5) : Math.ceil(x - 0.5);

export class Mask {
  bits = new Uint8Array(W * H);
  has(x: number, y: number) {
    return x >= 0 && y >= 0 && x < W && y < H && this.bits[y * W + x] === 1;
  }
  set(x: number, y: number) {
    if (x >= 0 && y >= 0 && x < W && y < H) this.bits[y * W + x] = 1;
    return this;
  }
  clear(x: number, y: number) {
    if (x >= 0 && y >= 0 && x < W && y < H) this.bits[y * W + x] = 0;
    return this;
  }
  span(y: number, x0: number, x1: number) {
    for (let x = x0; x <= x1; x++) this.set(x, y);
    return this;
  }
  rect(x0: number, y0: number, x1: number, y1: number) {
    for (let y = y0; y <= y1; y++) this.span(y, x0, x1);
    return this;
  }
  /** A run `w` pixels wide centred on a float x. */
  bar(y: number, cx: number, w: number) {
    const x0 = rnd(cx - (w - 1) / 2);
    return this.span(y, x0, x0 + w - 1);
  }
  /** A square brush dragged from one float point to another. */
  line(x0: number, y0: number, x1: number, y1: number, w: number) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n,
        y = y0 + ((y1 - y0) * i) / n,
        sx = rnd(x - (w - 1) / 2),
        sy = Math.round(y - (w - 1) / 2);
      this.rect(sx, sy, sx + w - 1, sy + w - 1);
    }
    return this;
  }
  /** Rows of a glyph: any character but '.' and ' ' is set. */
  glyph(x0: number, y0: number, rows: readonly string[], flip = false) {
    rows.forEach((row, dy) => {
      for (let i = 0; i < row.length; i++)
        if (row[i] !== "." && row[i] !== " ")
          this.set(flip ? x0 + row.length - 1 - i : x0 + i, y0 + dy);
    });
    return this;
  }
  minus(o: Mask) {
    for (let i = 0; i < this.bits.length; i++) if (o.bits[i]) this.bits[i] = 0;
    return this;
  }
  add(o: Mask) {
    for (let i = 0; i < this.bits.length; i++) if (o.bits[i]) this.bits[i] = 1;
    return this;
  }
  empty() {
    return !this.bits.includes(1);
  }
}

export type Part = {
  /** Outer line: `ink` on whatever it borders, `line` a softer dark of its
   * own material where it lies over another part, `none` for flush pieces. */
  ring?: "ink" | "line" | "none";
  /** The far side's share of each run that falls into shade. */
  shade?: number;
  /** The key side's share of each run that takes the light. */
  light?: number;
  /** The light catches top edges as well. */
  top?: boolean;
  /** Shade the lowest pixel of each column. */
  bottom?: boolean;
  /** No line where it lies over its own material: hair over hair is one mass. */
  merge?: boolean;
  /** Steps darker: limbs on the far side of the body. */
  dark?: number;
  /** Shade the pixels just below and away from the light on what lies behind. */
  cast?: boolean;
  /** Material per pixel, for garments whose zones share one silhouette. */
  zone?: (x: number, y: number) => number;
  /** Final say over a pixel's tone (0 ink to 4 light). */
  tone?: (x: number, y: number, tone: number) => number;
};

/** Pixels hold a material and one of five tones, not a colour: shading and
 * lines are decided per part, and colour only at the end. */
export class Sheet {
  mat = new Uint8Array(W * H);
  tone = new Uint8Array(W * H);
  part = new Uint16Array(W * H);
  private n = 0;
  key = lightKey();

  put(mask: Mask, mat: number, o: Part = {}) {
    const id = ++this.n,
      key = this.key,
      { bits } = mask,
      zone = o.zone ?? (() => mat);
    const shade = o.shade ?? 0.34,
      light = o.light ?? 0;
    const tones = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      let x = 0;
      while (x < W) {
        if (!bits[y * W + x]) {
          x++;
          continue;
        }
        let x1 = x;
        while (x1 + 1 < W && bits[y * W + x1 + 1]) x1++;
        const len = x1 - x + 1;
        for (let c = x; c <= x1; c++) {
          const i = key < 0 ? c - x : x1 - c,
            t = (i + 0.5) / len;
          let tone = len > 1 && t > 1 - shade ? 2 : t < light ? 4 : 3;
          if (o.top && !mask.has(c, y - 1) && t < 0.6 && tone === 3) tone = 4;
          if (o.bottom && !mask.has(c, y + 1)) tone = Math.min(tone, 2);
          tones[y * W + c] = tone;
        }
        x = x1 + 1;
      }
    }
    const ring = o.ring ?? "ink";
    if (ring !== "none")
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (!bits[y * W + x]) continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || bits[ny * W + nx]) continue;
            const j = ny * W + nx,
              behind = this.part[j];
            if (behind === id || (o.merge && behind && this.mat[j] === zone(x, y))) continue;
            this.part[j] = id;
            this.mat[j] = zone(x, y);
            this.tone[j] = behind && ring === "line" ? 1 : 0;
          }
        }
    if (o.cast)
      for (let y = 0; y < H - 1; y++)
        for (let x = 0; x < W; x++) {
          if (!bits[y * W + x]) continue;
          for (const nx of [x, x - key]) {
            const j = (y + 1) * W + nx;
            if (nx < 0 || nx >= W || bits[j] || !this.part[j] || this.part[j] === id) continue;
            if (o.merge && this.mat[j] === zone(x, y)) continue;
            if (this.tone[j] >= 3) this.tone[j] = 2;
          }
        }
    for (let i = 0; i < bits.length; i++) {
      if (!bits[i]) continue;
      const x = i % W,
        y = (i - x) / W;
      let tone = Math.max(1, tones[i] - (o.dark ?? 0));
      if (o.tone) tone = o.tone(x, y, tone);
      this.part[i] = id;
      this.mat[i] = zone(x, y);
      this.tone[i] = tone;
    }
    return id;
  }

  /** One pixel, for faces and small marks. */
  px(x: number, y: number, mat: number, tone = 3) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    this.part[i] ||= ++this.n;
    this.mat[i] = mat;
    this.tone[i] = tone;
  }
  at(x: number, y: number) {
    if (x < 0 || y < 0 || x >= W || y >= H) return undefined;
    const i = y * W + x;
    return this.part[i] ? { mat: this.mat[i], tone: this.tone[i], part: this.part[i] } : undefined;
  }
  /** Retone what is already there, keeping its material. */
  retone(x: number, y: number, tone: number) {
    const i = y * W + x;
    if (x >= 0 && y >= 0 && x < W && y < H && this.part[i]) this.tone[i] = tone;
  }

  resolve(palette: Ramp[], out: Uint8ClampedArray) {
    const cache = palette.map((r) =>
      [mix(r.shadowEdge ?? r.edge, INK, 0.55), r.shadowEdge ?? r.edge, r.shade, r.base, r.light].map(
        (hex) => parseInt(hex.slice(1), 16),
      ),
    );
    for (let i = 0; i < W * H; i++) {
      const o = i * 4;
      if (!this.part[i]) {
        out[o + 3] = 0;
        continue;
      }
      const v = cache[this.mat[i]][this.tone[i]];
      out[o] = v >> 16;
      out[o + 1] = (v >> 8) & 255;
      out[o + 2] = v & 255;
      out[o + 3] = this.mat[i] === SMEAR ? 110 : 255;
    }
  }
}

/** A material that does not shade: eye whites, a buckle. */
export const flat = (hex: string, dark = hex): Ramp => ({
  base: hex,
  light: hex,
  shade: dark,
  edge: dark,
  shadowEdge: dark,
});
