export const Mat = {
  Empty: 0,
  Wood: 1,
  Leaf: 2,
  Thatch: 3,
  Stone: 4,
  Tile: 5,
  Plaster: 6,
  Char: 7,
  Ore: 8,
} as const;

type Props = { ignite: number; fuel: number; burn: number; axe: number; pick: number };
const NEVER = 9;
const PROPS: Props[] = [
  { ignite: NEVER, fuel: 0, burn: 0, axe: 0, pick: 0 },
  { ignite: 0.55, fuel: 1, burn: 0.0022, axe: 1, pick: 0.35 },
  { ignite: 0.4, fuel: 0.25, burn: 0.005, axe: 1.4, pick: 0.8 },
  { ignite: 0.25, fuel: 0.5, burn: 0.005, axe: 1.2, pick: 0.7 },
  { ignite: NEVER, fuel: 0, burn: 0, axe: 0.06, pick: 0.8 },
  { ignite: NEVER, fuel: 0, burn: 0, axe: 0.12, pick: 1 },
  { ignite: NEVER, fuel: 0, burn: 0, axe: 0.25, pick: 1.3 },
  { ignite: 0.45, fuel: 0.3, burn: 0.0016, axe: 1.5, pick: 1 },
  { ignite: NEVER, fuel: 0, burn: 0, axe: 0.05, pick: 0.7 },
];
const masonry = (m: number) => (m >= Mat.Stone && m <= Mat.Plaster) || m === Mat.Ore;

/** A guess from colour alone: the atlas carries no material channel. */
export function classify(r: number, g: number, b: number, tree: boolean) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const s = max ? (max - min) / max : 0,
    v = max / 255;
  let hue = 0;
  if (max !== min) {
    if (max === r) hue = ((g - b) / (max - min) + 6) % 6;
    else if (max === g) hue = (b - r) / (max - min) + 2;
    else hue = (r - g) / (max - min) + 4;
    hue *= 60;
  }
  const green = hue > 65 && hue < 170 && s > 0.12;
  if (tree) return green ? Mat.Leaf : Mat.Wood;
  if (green) return Mat.Leaf;
  if (s < 0.14) return v > 0.72 ? Mat.Plaster : Mat.Stone;
  if (v > 0.78 && s < 0.3) return Mat.Plaster;
  if ((hue < 18 || hue > 340) && s > 0.4) return Mat.Tile;
  if (hue >= 28 && hue < 60 && s > 0.35 && v > 0.62) return Mat.Thatch;
  return Mat.Wood;
}

export type Kind = "tree" | "building" | "piece";
export type Body = {
  kind: Kind;
  w: number;
  h: number;
  px: Uint8ClampedArray;
  base: Uint8ClampedArray;
  shadow: Uint8ClampedArray | null;
  mat: Uint8Array;
  heat: Float32Array;
  fuel: Float32Array;
  wet: Float32Array;
  dmg: Float32Array;
  row0: Int16Array;
  rowL0: Int16Array;
  rowR0: Int16Array;
  bottom: number;
  /** World point that local point (lx, ly) sits on; the body turns about it. */
  x: number;
  y: number;
  lx: number;
  ly: number;
  angle: number;
  av: number;
  vx: number;
  vy: number;
  state: "rooted" | "hinged" | "free" | "rest";
  ground: number;
  hot: number;
  dirty: boolean;
  still: number;
  mass: number;
  cx: number;
  cy: number;
  inertia: number;
};

function blank(kind: Kind, w: number, h: number): Body {
  const n = w * h;
  return {
    kind,
    w,
    h,
    px: new Uint8ClampedArray(n * 4),
    base: new Uint8ClampedArray(n * 4),
    shadow: null,
    mat: new Uint8Array(n),
    heat: new Float32Array(n),
    fuel: new Float32Array(n),
    wet: new Float32Array(n),
    dmg: new Float32Array(n),
    row0: new Int16Array(h),
    rowL0: new Int16Array(h),
    rowR0: new Int16Array(h),
    bottom: h - 1,
    x: 0,
    y: 0,
    lx: 0,
    ly: 0,
    angle: 0,
    av: 0,
    vx: 0,
    vy: 0,
    state: "rooted",
    ground: 0,
    hot: 0,
    dirty: false,
    still: 0,
    mass: 0,
    cx: 0,
    cy: 0,
    inertia: 1,
  };
}

/** Top-left of the sprite at world (x, y). */
export function makeBody(
  kind: Kind,
  w: number,
  h: number,
  rgba: Uint8ClampedArray,
  x: number,
  y: number,
) {
  const b = blank(kind, w, h);
  b.x = x;
  b.y = y;
  let bottom = 0;
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3];
    if (!a) continue;
    // Soft pixels are the baked ground shadow, not matter.
    if (a < 200) {
      b.shadow ??= new Uint8ClampedArray(w * h * 4);
      for (let k = 0; k < 4; k++) b.shadow[i * 4 + k] = rgba[i * 4 + k];
      continue;
    }
    for (let k = 0; k < 4; k++) b.px[i * 4 + k] = b.base[i * 4 + k] = rgba[i * 4 + k];
    const m = classify(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], kind === "tree");
    b.mat[i] = m;
    b.fuel[i] = PROPS[m].fuel;
    const row = (i / w) | 0,
      col = i % w;
    if (!b.row0[row]) b.rowL0[row] = col;
    b.row0[row]++;
    b.rowR0[row] = col;
    bottom = Math.max(bottom, row);
  }
  b.bottom = bottom;
  b.ground = y + bottom + 1;
  massOf(b);
  return b;
}

function massOf(b: Body) {
  let m = 0,
    sx = 0,
    sy = 0;
  for (let i = 0; i < b.w * b.h; i++)
    if (b.mat[i]) {
      m++;
      sx += (i % b.w) + 0.5;
      sy += ((i / b.w) | 0) + 0.5;
    }
  b.mass = m;
  b.cx = m ? sx / m : 0;
  b.cy = m ? sy / m : 0;
  let inertia = 0;
  for (let i = 0; i < b.w * b.h; i++)
    if (b.mat[i]) {
      const dx = (i % b.w) + 0.5 - b.lx,
        dy = ((i / b.w) | 0) + 0.5 - b.ly;
      inertia += dx * dx + dy * dy;
    }
  b.inertia = Math.max(1, inertia);
}

export function toWorld(b: Body, lx: number, ly: number): [number, number] {
  const c = Math.cos(b.angle),
    s = Math.sin(b.angle);
  const dx = lx - b.lx,
    dy = ly - b.ly;
  return [b.x + c * dx - s * dy, b.y + s * dx + c * dy];
}

/** Turn about the centre of mass from here on, keeping the body where it is. */
function aboutMass(b: Body) {
  massOf(b);
  const [wx, wy] = toWorld(b, b.cx, b.cy);
  b.lx = b.cx;
  b.ly = b.cy;
  b.x = wx;
  b.y = wy;
  massOf(b);
}

const P = { Chip: 0, Flame: 1, Smoke: 2, Ash: 3, Ember: 4, Water: 5, Steam: 6, Debris: 7, Spark: 8 } as const;
type P = (typeof P)[keyof typeof P];
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: P;
  r: number;
  g: number;
  b: number;
  ground: number;
};

const FLAME = [
  [255, 244, 176],
  [255, 196, 61],
  [240, 122, 28],
  [184, 50, 26],
  [90, 26, 16],
];
const CHAR = [30, 24, 20];
const EMBER = [
  [120, 30, 12],
  [170, 55, 18],
  [210, 90, 24],
  [90, 22, 12],
];
const G = 0.045;
const GLOW_FALL = Array.from({ length: 49 }, (_, i) => Math.max(0, 1 - Math.hypot((i % 7) - 3, ((i / 7) | 0) - 3) / 3.6));
const WATER = [
  [145, 186, 163],
  [94, 165, 159],
  [54, 135, 148],
  [40, 107, 134],
  [44, 80, 112],
];
const rand = Math.random;

export type Actor = { depth: number; draw: (out: Uint8ClampedArray) => void };

export class Scene {
  bodies: Body[] = [];
  parts: Particle[] = [];
  wind = 0.2;
  tick = 0;
  readonly occB: Int32Array;
  readonly occI: Int32Array;
  readonly bg: Uint8ClampedArray;
  private scratch = new Float32Array(0);
  /** World x, y and strength of each glowing pixel this tick. */
  private glow: number[] = [];
  /** 0 grass, 1 dug ditch, 2 pond. */
  readonly ground: Uint8Array;
  readonly water: Float32Array;
  readonly depth: Float32Array;
  private channels: number[] = [];

  constructor(
    readonly W: number,
    readonly H: number,
  ) {
    this.occB = new Int32Array(W * H).fill(-1);
    this.occI = new Int32Array(W * H);
    this.bg = new Uint8ClampedArray(W * H * 4);
    this.ground = new Uint8Array(W * H);
    this.water = new Float32Array(W * H);
    this.depth = new Float32Array(W * H);
    const shades = [
      [98, 116, 60],
      [106, 124, 64],
      [92, 108, 56],
      [116, 130, 70],
    ];
    for (let i = 0; i < W * H; i++) {
      const x = i % W,
        y = (i / W) | 0;
      const h = hash(x, y, 3);
      const c =
        h > 0.995 ? [150, 132, 88] : shades[((h * 7 + hash(x >> 3, y >> 3, 9) * 2) | 0) % 4];
      this.bg.set([c[0], c[1], c[2], 255], i * 4);
    }
  }

  add(b: Body) {
    this.bodies.push(b);
    return b;
  }

  at(wx: number, wy: number): [Body, number] | null {
    if (wx < 0 || wy < 0 || wx >= this.W || wy >= this.H) return null;
    const k = (wy | 0) * this.W + (wx | 0);
    const bi = this.occB[k];
    return bi < 0 || !this.bodies[bi] ? null : [this.bodies[bi], this.occI[k]];
  }

  private spawn(p: Omit<Particle, "max">) {
    if (this.parts.length > 14000) return;
    this.parts.push({ ...p, max: p.life });
  }

  private removePixel(b: Body, j: number, kind: P, vx: number, vy: number) {
    const [wx, wy] = toWorld(b, (j % b.w) + 0.5, ((j / b.w) | 0) + 0.5);
    const q = j * 4;
    if (kind !== P.Debris)
      this.spawn({
        x: wx,
        y: wy,
        vx,
        vy,
        life: kind === P.Ash ? 80 + rand() * 60 : 600,
        kind,
        r: b.px[q],
        g: b.px[q + 1],
        b: b.px[q + 2],
        ground: b.ground - rand() * 3,
      });
    b.mat[j] = 0;
    b.px[q + 3] = b.base[q + 3] = 0;
    b.heat[j] = 0;
    b.dirty = true;
  }

  /** One blow: a V notch for the axe, a round bite for the pick, landing on the
   * first surface along the swing so repeated blows cut deeper. */
  chop(wx: number, wy: number, dir: number, tool: "axe" | "pick") {
    let hit: [Body, number] | null = null;
    for (const dy of [0, -2, 2, -4, 4, -6, 6])
      for (let k = 0; k <= 14 && !hit; k++) hit = this.at(Math.round(wx + dir * k), Math.round(wy + dy));
    if (!hit) return false;
    const [b, i] = hit;
    if (b.state === "hinged" || b.state === "free") return false;
    const c = Math.cos(b.angle),
      s = Math.sin(b.angle);
    const dlx = c * dir,
      dly = -s * dir;
    const hx = i % b.w,
      hy = (i / b.w) | 0;
    const removed: number[] = [];
    let sparks = 0;
    for (let dy = -5; dy <= 5; dy++)
      for (let dx = -5; dx <= 5; dx++) {
        const x = hx + dx,
          y = hy + dy;
        if (x < 0 || y < 0 || x >= b.w || y >= b.h) continue;
        const j = y * b.w + x,
          m = b.mat[j];
        if (!m) continue;
        let w: number;
        if (tool === "pick") {
          const d2 = (dx - dlx) ** 2 + (dy - dly) ** 2;
          if (d2 > 5) continue;
          w = 1.2 - d2 / 6;
        } else {
          const t = dx * dlx + dy * dly,
            p = -dx * dly + dy * dlx;
          if (t < -1 || t > 4 || Math.abs(p) > 3.2 - t * 0.7) continue;
          w = 1 - t / 5;
        }
        b.dmg[j] += w * PROPS[m][tool] * 0.6 * (0.8 + rand() * 0.4);
        if (m === Mat.Ore) sparks = Math.max(sparks, 10 + ((rand() * 8) | 0));
        else if (masonry(m)) sparks = Math.max(sparks, 2);
        if (b.dmg[j] < 1) continue;
        removed.push(j);
        this.removePixel(b, j, P.Chip, -dir * (0.4 + rand()), -0.8 - rand() * 1.8);
      }
    const [sx, sy] = toWorld(b, hx + 0.5, hy + 0.5);
    for (let k = 0; k < sparks; k++)
      this.spawn({
        x: sx - dir,
        y: sy,
        vx: -dir * (0.5 + rand() * 2.5) + (rand() - 0.5),
        vy: -0.5 - rand() * 2.2,
        life: 14 + rand() * 20,
        kind: P.Spark,
        r: 0,
        g: 0,
        b: 0,
        ground: b.ground + rand() * 6,
      });
    for (const j of removed) {
      const x = j % b.w,
        y = (j / b.w) | 0;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= b.w || ny >= b.h) continue;
        const n = ny * b.w + nx,
          m = b.mat[n];
        if (!m || b.dmg[n]) continue;
        const fresh = masonry(m) ? [192, 188, 178] : [222, 184, 128];
        for (let k = 0; k < 3; k++)
          b.px[n * 4 + k] = b.base[n * 4 + k] = b.base[n * 4 + k] * 0.45 + fresh[k] * 0.55;
        b.dmg[n] = 1e-3;
      }
    }
    this.structure(b);
    return true;
  }

  pond(cx: number, cy: number, rx: number, ry: number) {
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++)
      for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
        if (x < 0 || y < 0 || x >= this.W || y >= this.H) continue;
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (hash(x >> 2, y >> 2, 5) - 0.5) * 0.25;
        if (d > 1) continue;
        const i = y * this.W + x;
        if (!this.ground[i]) this.channels.push(i);
        this.ground[i] = 2;
        this.water[i] = 1;
        this.depth[i] = Math.min(1, 0.3 + (1 - d) * 1.4);
      }
  }

  /** Cut a ditch into the grass; water finds it by itself. */
  dig(wx: number, wy: number, r: number) {
    let dug = false;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -2 * r; dx <= 2 * r; dx++) {
        const x = Math.round(wx + dx),
          y = Math.round(wy + dy);
        const e = (dx * dx) / (r * r * 1.4) + (dy * dy) / (r * r * 0.5);
        if (e > 1 + hash(x, y, 31) * 0.15 || x < 0 || y < 0 || x >= this.W || y >= this.H) continue;
        const i = y * this.W + x;
        if (this.ground[i]) continue;
        this.ground[i] = 1;
        this.depth[i] = 0.45 + (1 - e) * 0.4;
        this.channels.push(i);
        dug = true;
        if (rand() < 0.5)
          this.spawn({ x, y, vx: (rand() - 0.5) * 1.6, vy: -0.8 - rand(), life: 400, kind: P.Chip, r: 104, g: 84, b: 58, ground: y + 2 });
      }
    return dug;
  }

  /** Water runs along the channels: each ditch cell rises toward its fullest
   * neighbour, a little lower, and the pond never drains. */
  private flow() {
    const { W, ground, water } = this;
    for (const i of this.channels) {
      if (ground[i] !== 1) continue;
      let top = 0;
      for (const j of [i - 1, i + 1, i - W, i + W]) if (ground[j] && water[j] > top) top = water[j];
      water[i] += (top * 0.998 - water[i]) * 0.15;
      if (water[i] > 1) water[i] = 1;
    }
  }

  heatAt(wx: number, wy: number, r: number, amount: number) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const hit = this.at(wx + dx, wy + dy);
        if (hit) this.warm(hit[0], hit[1], amount);
      }
  }

  douse(wx: number, wy: number, r: number) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const hit = this.at(wx + dx, wy + dy);
        if (!hit) continue;
        const [b, j] = hit;
        if (b.heat[j] > 0.3 && rand() < 0.3) this.steam(wx + dx, wy + dy);
        b.heat[j] = 0;
        b.wet[j] = 1;
      }
  }

  private steam(x: number, y: number) {
    this.spawn({ x, y, vx: 0, vy: -0.4, life: 30, kind: P.Steam, r: 222, g: 228, b: 232, ground: 0 });
  }

  private warm(b: Body, j: number, amount: number) {
    if (!b.mat[j]) return;
    if (b.wet[j] > 0) b.wet[j] -= amount * 2;
    else b.heat[j] += amount;
    b.hot = 90;
  }

  /** Detach what no longer reaches the ground, and fell what stands on too
   * little: a row cut past half its width, or one the weight above has
   * swung out beyond. */
  private structure(b: Body) {
    b.dirty = false;
    if (b.state === "hinged" || b.state === "free") return;
    const { w, h, mat } = b;
    const n = w * h;
    const label = new Int32Array(n).fill(-1);
    const comps: number[][] = [];
    for (let i = 0; i < n; i++) {
      if (!mat[i] || label[i] >= 0) continue;
      const comp = [i];
      label[i] = comps.length;
      for (let k = 0; k < comp.length; k++) {
        const x = comp[k] % w,
          y = (comp[k] / w) | 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const j = ny * w + nx;
            if (mat[j] && label[j] < 0) {
              label[j] = comps.length;
              comp.push(j);
            }
          }
      }
      comps.push(comp);
    }
    if (!comps.length) return;
    const keep = new Set<number>();
    if (b.state === "rooted") {
      comps.forEach((comp, ci) => {
        if (comp.some((j) => ((j / w) | 0) >= b.bottom - 1)) keep.add(ci);
      });
    } else {
      let best = 0;
      comps.forEach((comp, ci) => comp.length > comps[best].length && (best = ci));
      keep.add(best);
    }
    comps.forEach((comp, ci) => keep.has(ci) || this.detach(b, comp, "free"));
    if (b.state !== "rooted") return;

    const rowMass = new Float64Array(h),
      rowX = new Float64Array(h),
      rowMin = new Int16Array(h).fill(w),
      rowMax = new Int16Array(h).fill(-1);
    for (let i = 0; i < n; i++) {
      if (!mat[i]) continue;
      const x = i % w,
        y = (i / w) | 0;
      rowMass[y]++;
      rowX[y] += x + 0.5;
      rowMin[y] = Math.min(rowMin[y], x);
      rowMax[y] = Math.max(rowMax[y], x);
    }
    let above = 0,
      aboveX = 0,
      fail = -1;
    for (let y = 0; y < b.bottom - 1; y++) {
      const c = rowMass[y],
        w0 = b.row0[y];
      if (above > 0 && c > 0 && c < w0) {
        const com = aboveX / above;
        const thin = c < w0 * 0.5 && above > 25 * c;
        const over = c < w0 * 0.8 && above > 30 && (com < rowMin[y] - 0.5 || com > rowMax[y] + 1.5);
        if (thin || over) fail = y;
      }
      above += rowMass[y];
      aboveX += rowX[y];
    }
    if (fail < 0) return;

    let upMass = 0,
      upX = 0;
    const upper: number[] = [];
    for (let i = 0; i < fail * w; i++)
      if (mat[i]) {
        upper.push(i);
        upMass++;
        upX += (i % w) + 0.5;
      }
    const remC = (rowMin[fail] + rowMax[fail] + 1) / 2;
    const origC = (b.rowL0[fail] + b.rowR0[fail] + 1) / 2;
    const d = upX / upMass - remC;
    // A tree falls toward its notch unless its weight already leans the other way.
    const side = Math.abs(d) > 1.5 ? Math.sign(d) : Math.sign(origC - remC) || (rand() < 0.5 ? -1 : 1);
    const piece = this.detach(b, upper, "hinged");
    piece.lx = side > 0 ? rowMax[fail] + 1 : rowMin[fail];
    piece.ly = fail;
    piece.x = b.x - b.lx + piece.lx;
    piece.y = b.y - b.ly + piece.ly;
    piece.av = side * 0.003;
    massOf(piece);
  }

  private detach(b: Body, pixels: number[], state: "free" | "hinged") {
    const p = blank(b.kind === "tree" ? "tree" : "piece", b.w, b.h);
    if (pixels.length < 6 && state === "free") {
      for (const j of pixels) this.removePixel(b, j, P.Chip, (rand() - 0.5) * 0.6, -rand());
      return p;
    }
    p.kind = "piece";
    Object.assign(p, {
      x: b.x,
      y: b.y,
      lx: b.lx,
      ly: b.ly,
      angle: b.angle,
      state,
      ground: b.ground,
      hot: b.hot,
      row0: b.row0,
      rowL0: b.rowL0,
      rowR0: b.rowR0,
      bottom: b.bottom,
    });
    for (const j of pixels) {
      for (let k = 0; k < 4; k++) {
        p.px[j * 4 + k] = b.px[j * 4 + k];
        p.base[j * 4 + k] = b.base[j * 4 + k];
      }
      p.mat[j] = b.mat[j];
      p.heat[j] = b.heat[j];
      p.fuel[j] = b.fuel[j];
      p.wet[j] = b.wet[j];
      p.dmg[j] = b.dmg[j];
      b.mat[j] = 0;
      b.px[j * 4 + 3] = b.base[j * 4 + 3] = 0;
      b.heat[j] = 0;
    }
    if (state === "free") aboutMass(p);
    else massOf(p);
    this.bodies.push(p);
    return p;
  }

  private lowest(b: Body): [number, number] {
    const c = Math.cos(b.angle),
      s = Math.sin(b.angle);
    let max = -Infinity,
      sx = 0,
      count = 0;
    const ys = new Float32Array(b.w * b.h);
    for (let i = 0; i < b.w * b.h; i++) {
      if (!b.mat[i]) continue;
      const dx = (i % b.w) + 0.5 - b.lx,
        dy = ((i / b.w) | 0) + 0.5 - b.ly;
      const y = b.y + s * dx + c * dy + 0.5;
      ys[i] = y;
      max = Math.max(max, y);
    }
    for (let i = 0; i < b.w * b.h; i++) {
      if (!b.mat[i] || ys[i] < max - 1) continue;
      const dx = (i % b.w) + 0.5 - b.lx,
        dy = ((i / b.w) | 0) + 0.5 - b.ly;
      sx += b.x + c * dx - s * dy;
      count++;
    }
    return [max, count ? sx / count : b.x];
  }

  private move(b: Body) {
    if (b.state === "hinged") {
      const c = Math.cos(b.angle),
        s = Math.sin(b.angle);
      const arm = c * (b.cx - b.lx) - s * (b.cy - b.ly);
      b.av = (b.av + (G * b.mass * arm) / b.inertia) * 0.998;
      const prev = b.angle;
      b.angle += b.av;
      if (this.lowest(b)[0] > b.ground) {
        b.angle = prev;
        if (Math.abs(b.av) < 0.012) this.settle(b);
        else {
          b.av *= -0.3;
          this.dust(b);
        }
      }
    } else if (b.state === "free") {
      b.vy += G;
      b.x += b.vx;
      b.y += b.vy;
      b.angle += b.av;
      const [maxY, contactX] = this.lowest(b);
      if (maxY <= b.ground) return;
      b.y -= maxY - b.ground;
      if (b.vy > 0.6) this.dust(b);
      if (b.vy > 0) b.vy *= -0.2;
      b.vx *= 0.7;
      // Gravity about the contact point: what overhangs it rolls over.
      const arm = b.x - contactX;
      b.av = (b.av + (G * b.mass * arm) / (b.inertia + b.mass * arm * arm)) * 0.8;
      if (Math.abs(b.vy) < 0.3 && Math.abs(b.av) < 0.004 && Math.abs(b.vx) < 0.1) {
        if (++b.still > 15) this.settle(b);
      } else b.still = 0;
    }
  }

  private settle(b: Body) {
    b.state = "rest";
    b.av = b.vx = b.vy = 0;
    b.dirty = true;
  }

  private dust(b: Body) {
    const [, x] = this.lowest(b);
    for (let k = 0; k < 14; k++)
      this.spawn({
        x: x + (rand() - 0.5) * 30,
        y: b.ground - 1,
        vx: (rand() - 0.5) * 0.8,
        vy: -rand() * 0.4,
        life: 30 + rand() * 30,
        kind: P.Smoke,
        r: 150,
        g: 136,
        b: 110,
        ground: 0,
      });
  }

  /** The cellular automaton: heat rises, fuel burns down to char, char to ash. */
  private fire(b: Body) {
    if (b.hot <= 0) return;
    const { w, h, mat, heat, fuel, px, base } = b;
    const n = w * h;
    if (this.scratch.length < n) this.scratch = new Float32Array(n);
    const add = this.scratch;
    add.fill(0, 0, n);
    let any = false;
    const side = 0.007,
      lean = this.wind * 0.006;
    const cs = Math.cos(b.angle),
      sn = Math.sin(b.angle);
    for (let i = 0; i < n; i++) {
      const m = mat[i];
      if (!m) continue;
      const t = heat[i];
      if (t < 0.002) continue;
      any = true;
      const p = PROPS[m];
      const x = i % w,
        y = (i / w) | 0;
      if (t >= p.ignite && fuel[i] > 0) {
        // Smoulder first: glowing and smoking, no flame until the heat builds.
        const flaming = t >= p.ignite + 0.25;
        fuel[i] -= p.burn * (flaming ? 1 : 0.35);
        heat[i] = Math.min(1.2, t + 0.004);
        const k = flaming ? 1.2 : 0.35;
        if (y > 0) {
          add[i - w] += 0.014 * k;
          if (x > 0) add[i - w - 1] += 0.008 * k;
          if (x < w - 1) add[i - w + 1] += 0.008 * k;
        }
        if (x > 0) add[i - 1] += Math.max(0, side - lean) * k;
        if (x < w - 1) add[i + 1] += Math.max(0, side + lean) * k;
        if (y < h - 1) add[i + w] += 0.002 * k;
        const q = i * 4;
        const f = flaming
          ? rand() < 0.55
            ? FLAME[Math.min(4, ((1.2 - heat[i]) * 3 + rand() * 1.5) | 0)]
            : rand() < 0.35
              ? [150, 40, 14]
              : CHAR
          : EMBER[(rand() * EMBER.length) | 0];
        if (!flaming && rand() < 0.5) {
          const v = 0.55 + t * 0.5;
          px[q] = base[q] * (1 - v) + f[0] * v;
          px[q + 1] = base[q + 1] * (1 - v) + f[1] * v;
          px[q + 2] = base[q + 2] * (1 - v) + f[2] * v;
        } else {
          px[q] = f[0];
          px[q + 1] = f[1];
          px[q + 2] = f[2];
        }
        if (this.glow.length < 3000)
          this.glow.push(
            b.x + cs * (x + 0.5 - b.lx) - sn * (y + 0.5 - b.ly),
            b.y + sn * (x + 0.5 - b.lx) + cs * (y + 0.5 - b.ly),
            flaming ? 1 : 0.45,
          );
        const r = rand();
        const smoke = flaming ? 0.09 : 0.04;
        if (r < smoke + (flaming ? 0.03 : 0) || r > (flaming ? 0.992 : 0.998)) {
          const [wx, wy] = toWorld(b, x + 0.5, y);
          const kind = r < smoke ? P.Smoke : r < 0.5 ? P.Flame : P.Ember;
          this.spawn({
            x: wx,
            y: wy,
            vx: (rand() - 0.5) * 0.3,
            vy: kind === P.Ember ? -0.6 - rand() * 0.6 : kind === P.Smoke ? -0.15 - rand() * 0.2 : -0.3,
            life: kind === P.Flame ? 8 + rand() * 14 : kind === P.Smoke ? 180 + rand() * 180 : 40 + rand() * 30,
            kind,
            r: 0,
            g: 0,
            b: 0,
            ground: b.ground,
          });
        }
        if (fuel[i] <= 0) {
          if (m !== Mat.Char) {
            mat[i] = Mat.Char;
            fuel[i] = PROPS[Mat.Char].fuel * (m === Mat.Leaf ? 0.25 : 1);
            const v = 0.8 + rand() * 0.5;
            base[q] = CHAR[0] * v;
            base[q + 1] = CHAR[1] * v;
            base[q + 2] = CHAR[2] * v;
          } else
            this.removePixel(b, i, rand() < 0.5 ? P.Ash : P.Debris, this.wind * 0.3, -0.2 - rand() * 0.3);
        }
      } else {
        heat[i] = Math.max(0, t * 0.985 - 0.0005);
        const q = i * 4;
        if (masonry(m) && t > 0.3) for (let k = 0; k < 3; k++) base[q + k] *= 0.997;
        px[q] = base[q];
        px[q + 1] = base[q + 1];
        px[q + 2] = base[q + 2];
      }
    }
    for (let i = 0; i < n; i++) if (add[i] && mat[i]) this.warm(b, i, add[i]);
    b.hot = any ? 90 : b.hot - 1;
  }

  step() {
    this.tick++;
    this.glow.length = 0;
    this.flow();
    const count = this.bodies.length;
    for (let k = 0; k < count; k++) {
      const b = this.bodies[k];
      this.move(b);
      this.fire(b);
      if (b.dirty && (this.tick % 6 === 0 || b.hot <= 0)) this.structure(b);
    }
    this.bodies = this.bodies.filter((b) => b.mass > 0 && b.mat.some(Boolean));
    const W = this.W;
    this.parts = this.parts.filter((p) => {
      p.life--;
      switch (p.kind) {
        case P.Chip:
          p.vy += 0.12;
          p.vx *= 0.98;
          if (p.y + p.vy >= p.ground) {
            p.kind = P.Debris;
            p.y = p.ground;
            p.life = 1800;
          }
          break;
        case P.Flame:
        case P.Ember: {
          p.vx += (rand() - 0.5) * 0.1 + this.wind * 0.01;
          if (p.kind === P.Ember) p.vy += 0.015;
          // Flames spread through the automaton; only a landing ember jumps a gap.
          const hit = p.kind === P.Ember && p.vy > 0 && this.at(p.x + p.vx, p.y + p.vy);
          if (hit) {
            this.warm(hit[0], hit[1], 0.3);
            p.life = 0;
          }
          if (p.kind === P.Ember && p.y >= p.ground) p.life = 0;
          break;
        }
        case P.Smoke:
        case P.Steam:
          p.vx += (this.wind * 0.02 - p.vx) * 0.03 + (rand() - 0.5) * 0.04;
          p.vy = p.vy * 0.99 - 0.002;
          break;
        case P.Ash:
          p.vx += (this.wind * 0.3 - p.vx) * 0.05 + (rand() - 0.5) * 0.05;
          p.vy = 0.12 + Math.sin((this.tick + p.max) * 0.1) * 0.08;
          if (p.y >= p.ground) {
            p.kind = P.Debris;
            p.life = 900;
          }
          break;
        case P.Water: {
          p.vy += 0.1;
          const hit = this.at(p.x, p.y);
          if (hit) {
            this.douse(p.x | 0, p.y | 0, 1);
            p.life = 0;
          }
          if (p.y >= p.ground) p.life = 0;
          break;
        }
        case P.Spark: {
          p.vy += 0.09;
          const hit = this.at(p.x + p.vx, p.y + p.vy);
          if (hit) {
            const m = hit[0].mat[hit[1]];
            if (PROPS[m].ignite < NEVER && rand() < 0.3) this.warm(hit[0], hit[1], 0.7);
            if (m) p.life = 0;
          }
          if (p.y >= p.ground) p.life = 0;
          break;
        }
        case P.Debris:
          return p.life > 0;
      }
      p.x += p.vx;
      p.y += p.vy;
      return p.life > 0 && p.x >= 0 && p.x < W && p.y > -20;
    });
  }

  spawnWater(x: number, y: number, dir: number, ground: number) {
    for (let k = 0; k < 40; k++)
      this.spawn({
        x,
        y,
        vx: dir * (0.8 + rand() * 1.8),
        vy: -1.4 + rand() * 1.1,
        life: 90,
        kind: P.Water,
        r: 90,
        g: 142,
        b: 200,
        ground,
      });
  }

  flameAt(x: number, y: number) {
    this.spawn({ x, y, vx: (rand() - 0.5) * 0.3, vy: -0.35, life: 6 + rand() * 10, kind: P.Flame, r: 0, g: 0, b: 0, ground: 0 });
    if (rand() < 0.08)
      this.spawn({ x, y: y - 3, vx: 0, vy: -0.3, life: 50, kind: P.Smoke, r: 0, g: 0, b: 0, ground: 0 });
  }

  render(out: Uint8ClampedArray, actors: Actor[]) {
    out.set(this.bg);
    this.occB.fill(-1);
    const W = this.W;
    for (const i of this.channels) {
      const x = i % W,
        y = (i / W) | 0;
      const lvl = this.water[i];
      let c: number[];
      if (lvl > 0.04) {
        const d = this.depth[i] * Math.min(1, lvl * 1.3);
        c = WATER[Math.min(4, (d * 4.4) | 0)];
        const glint = hash(x, y + ((this.tick >> 4) & 3), 21);
        if (glint > 0.993) c = [161, 213, 212];
        else if ((x + y * 3 + (this.tick >> 3)) % 29 === 0 && hash(x >> 2, y, 22) > 0.6) c = WATER[Math.max(0, WATER.indexOf(c) - 1)];
        if (lvl < 0.25 && this.ground[i] === 1 && hash(x, y, this.tick >> 2) > 0.7) c = [225, 238, 224];
      } else c = this.depth[i] > 0.75 ? [78, 62, 44] : hash(x, y, 23) > 0.5 ? [110, 88, 60] : [98, 78, 54];
      // The bank above a cut reads as its shadowed far wall in oblique view.
      if (y > 0 && !this.ground[i - W]) c = lvl > 0.04 ? [139, 137, 112] : [72, 58, 42];
      out[i * 4] = c[0];
      out[i * 4 + 1] = c[1];
      out[i * 4 + 2] = c[2];
    }
    for (const b of this.bodies) {
      if (!b.shadow || b.state !== "rooted") continue;
      for (let i = 0; i < b.w * b.h; i++) {
        const a = b.shadow[i * 4 + 3];
        if (!a) continue;
        const X = Math.floor(b.x - b.lx + (i % b.w)),
          Y = Math.floor(b.y - b.ly + ((i / b.w) | 0));
        if (X < 0 || Y < 0 || X >= W || Y >= this.H) continue;
        const q = (Y * W + X) * 4,
          f = a / 255;
        for (let k = 0; k < 3; k++) out[q + k] = out[q + k] * (1 - f) + b.shadow[i * 4 + k] * f;
      }
    }
    const items: (Actor | { depth: number; body: number })[] = [
      ...this.bodies.map((b, body) => ({ depth: b.ground - (b.state === "rooted" ? 0 : 0.5), body })),
      ...actors,
    ];
    items.sort((a, b) => a.depth - b.depth);
    for (const item of items) {
      if ("body" in item) this.blit(item.body, out);
      else item.draw(out);
    }
    for (const p of this.parts) {
      const X = p.x | 0,
        Y = p.y | 0;
      if (X < 0 || Y < 0 || X >= W || Y >= this.H) continue;
      const t = p.life / p.max;
      let c: number[];
      switch (p.kind) {
        case P.Flame:
          c = FLAME[Math.min(4, ((1 - t) * 4.5) | 0)];
          break;
        case P.Ember:
          c = (this.tick + X) % 6 < 3 ? FLAME[1] : FLAME[2];
          break;
        case P.Smoke:
        case P.Steam:
          if (hash(X, Y, this.tick) > t * 0.6) continue;
          c = p.r ? [p.r, p.g, p.b] : t > 0.7 ? [70, 66, 62] : t > 0.4 ? [112, 108, 104] : [150, 146, 142];
          break;
        case P.Ash:
          c = [150, 146, 140];
          break;
        case P.Spark:
          c = t > 0.5 ? [255, 250, 210] : [255, 190, 70];
          break;
        default:
          c = [p.r, p.g, p.b];
      }
      const q = (Y * W + X) * 4;
      out[q] = c[0];
      out[q + 1] = c[1];
      out[q + 2] = c[2];
      // Smoke billows: an older puff covers a 2×2 block.
      if (p.kind === P.Smoke && t < 0.7 && X + 1 < W && Y + 1 < this.H)
        for (const k of [4, W * 4, W * 4 + 4]) if (hash(X, Y + k, 17) < 0.7) out.set(c, q + k);
      if (p.kind === P.Flame || p.kind === P.Spark) this.glow.push(p.x, p.y, 0.3);
    }
    // Screen-blended halo: cheap enough at a few thousand 7×7 stamps.
    const g = this.glow;
    for (let k = 0; k < g.length; k += 3) {
      const gx = g[k] | 0,
        gy = g[k + 1] | 0,
        I = g[k + 2] * 0.07;
      for (let dy = -3; dy <= 3; dy++) {
        const Y = gy + dy;
        if (Y < 0 || Y >= this.H) continue;
        for (let dx = -3; dx <= 3; dx++) {
          const X = gx + dx;
          if (X < 0 || X >= W) continue;
          const f = I * GLOW_FALL[(dy + 3) * 7 + dx + 3],
            q = (Y * W + X) * 4;
          out[q] += (255 - out[q]) * f;
          out[q + 1] += (255 - out[q + 1]) * f * 0.45;
          out[q + 2] += (255 - out[q + 2]) * f * 0.08;
        }
      }
    }
  }

  private blit(bi: number, out: Uint8ClampedArray) {
    const b = this.bodies[bi];
    const c = Math.cos(b.angle),
      s = Math.sin(b.angle);
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (const [lx, ly] of [
      [0, 0],
      [b.w, 0],
      [0, b.h],
      [b.w, b.h],
    ]) {
      const [wx, wy] = toWorld(b, lx, ly);
      x0 = Math.min(x0, wx);
      y0 = Math.min(y0, wy);
      x1 = Math.max(x1, wx);
      y1 = Math.max(y1, wy);
    }
    const W = this.W;
    for (let Y = Math.max(0, Math.floor(y0)); Y < Math.min(this.H, Math.ceil(y1)); Y++)
      for (let X = Math.max(0, Math.floor(x0)); X < Math.min(W, Math.ceil(x1)); X++) {
        const dx = X + 0.5 - b.x,
          dy = Y + 0.5 - b.y;
        const lx = Math.floor(b.lx + c * dx + s * dy),
          ly = Math.floor(b.ly - s * dx + c * dy);
        if (lx < 0 || ly < 0 || lx >= b.w || ly >= b.h) continue;
        const j = ly * b.w + lx;
        if (!b.px[j * 4 + 3]) continue;
        const q = (Y * W + X) * 4;
        out[q] = b.px[j * 4];
        out[q + 1] = b.px[j * 4 + 1];
        out[q + 2] = b.px[j * 4 + 2];
        this.occB[Y * W + X] = bi;
        this.occI[Y * W + X] = j;
      }
  }
}

export function hash(x: number, y: number, seed: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
