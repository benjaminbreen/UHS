import type { LightField } from "./voxel";
import { ALTARS } from "./altars";
import { LETTERS, SPRITES } from "./sprites";
import type { RoomPlan } from "./building";
import {
  carpetColor, courtParams, floorColor, hash, wornTiles, mix, palette, roomMask, scale, sky, sun, wallColor,
  type Kind, type Palette, type Prop, type RoomParams,
} from "./room";

export const T = 16;
const WH = 48, S = 10, CAP = 6;
/** Where floor tile (0, 0) starts on the room's canvas. */
export const FLOOR_X = S, FLOOR_Y = CAP + WH;
/** Sprites widened by `stretch`, keyed `name@width`. */
const WIDE = new Map<string, string[]>();
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
type Hit = { u: number; v: number; hits: number; seed: number; base: number };
type Debris = { x: number; y: number; vx: number; vy: number; c: number; floor: number; rest: boolean };
type Light = { x: number; y: number; c: number; rad: number; k: number; phase: number };
// Lain on the floor: whoever crosses the room walks over these, never behind them.
const LOW: Kind[] = ["rug", "cat", "clutter", "mat", "cushions", "ladder"];
/** A standing piece's place in the cut-out sheet. */
export type Cutout = { id: number; ax: number; ay: number; w: number; h: number };

export class PixelRoom {
  W = 0;
  H = 0;
  hover = -1;
  dither = false;
  /** How the room is lit without a traced field: smooth light, or light in
   * a few crisp bands with hard-edged sun through the windows. */
  lighting: "smooth" | "stepped" | "layer" = "smooth";
  /** With `layer` lighting: the canvases a scene lays over the room itself,
   * so the people in it are lit too. Without them the room composites its
   * own light. */
  layers?: { light: CanvasRenderingContext2D; add: CanvasRenderingContext2D; glow: CanvasRenderingContext2D };
  private ownLayers?: PixelRoom["layers"];
  props: Prop[] = [];
  private col = new Uint32Array(0);
  private ids = new Int16Array(0);
  private glow = new Uint8Array(0);
  private img?: ImageData;
  private ctx: CanvasRenderingContext2D;
  private p!: RoomParams;
  private P!: Palette;
  private prog = new Map<number, number>();
  private turn = new Map<number, number>();
  private cur = -1;
  private t = 0;
  private lights: Light[] = [];
  private fires: { x: number; y: number; w: number; h: number; lit: boolean }[] = [];
  private flames: { x: number; y: number }[] = [];
  private beams: { x0: number; x1: number; top: number; floor: number; len: number; skew: number; k: number; c: number; sill?: number; style?: number }[] = [];
  private mask = new Uint8Array(0);
  /** Each column's back-wall row, -1 for a column with no floor. */
  private top: number[] = [];
  private smoke: { x: number; y: number }[] = [];
  private zz: { x: number; y: number }[] = [];
  private notes: { x: number; y: number }[] = [];
  private worn = new Float32Array(0);
  private walls: Hit[] = [];
  private tiles = new Map<number, Hit>();
  private debris: Debris[] = [];

  /** Standing pieces lifted out of each finished frame onto their own sheet,
   * for a scene that has people to pass behind them. */
  cutouts: Cutout[] = [];
  /** People without a bed, asleep on a pallet on the floor, by room tile. */
  floorSleepers: { x: number; y: number }[] = [];
  /** Where the head of a sleeper lies on the room's canvas: the k-th in a
   * piece, front first, or on a floor pallet at a tile. The scene draws the
   * head there; the room draws the rest of them under the covers. */
  pillow(at: { propId: number; k: number } | { x: number; y: number }) {
    if ("x" in at) return { x: S + at.x * T + 2, y: this.oy + at.y * T + 9 };
    const q = this.props[at.propId], X = S + q.x * T, Y = this.oy + q.y * T, PD = q.d * T;
    if (q.kind === "bed") return { x: X + 10 + at.k, y: Y + PD - 12 - at.k * 4 };
    if (q.kind === "boxbed") return { x: X + 7, y: Y - 3 };
    return { x: X + 5, y: Y + PD - 8 };
  }
  private sheet?: { ctx: CanvasRenderingContext2D; img: ImageData };

  constructor(canvas: HTMLCanvasElement, sheet?: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    if (sheet) this.sheet = { ctx: sheet.getContext("2d")!, img: new ImageData(1, 1) };
  }
  /** Where a cut-out sits on the room's canvas now. */
  cutoutAt(c: Cutout) {
    const q = this.props[c.id];
    return { x: S + q.x * T - 8, y: this.oy + (q.y + Math.max(1, q.d)) * T + 2 - c.h };
  }
  private layCutouts() {
    if (!this.sheet) return;
    let x = 0, y = 0, row = 0;
    this.cutouts = [];
    for (const q of this.props) {
      if (q.wall || LOW.includes(q.kind)) continue;
      const w = q.w * T + 16, h = Math.max(1, q.d) * T + 52;
      if (x + w > 512) (x = 0), (y += row), (row = 0);
      this.cutouts.push({ id: q.id, ax: x, ay: y, w, h });
      x += w;
      row = Math.max(row, h);
    }
    const c = this.sheet.ctx.canvas;
    c.width = 512;
    c.height = Math.max(1, y + row);
    this.sheet.img = this.sheet.ctx.createImageData(c.width, c.height);
  }
  private cut() {
    if (!this.sheet) return;
    const { W, H, ids } = this, src = this.img!.data, out = this.sheet.img, dst = out.data;
    dst.fill(0);
    for (const c of this.cutouts) {
      if (this.props[c.id].wrecked) continue;
      const at = this.cutoutAt(c);
      for (let j = 0; j < c.h; j++) {
        const y = at.y + j;
        if (y < 0 || y >= H) continue;
        for (let i = 0; i < c.w; i++) {
          const x = at.x + i;
          if (x < 0 || x >= W || ids[y * W + x] !== c.id) continue;
          const o = (y * W + x) * 4, n = ((c.ay + j) * out.width + c.ax + i) * 4;
          dst[n] = src[o];
          dst[n + 1] = src[o + 1];
          dst[n + 2] = src[o + 2];
          dst[n + 3] = 255;
        }
      }
    }
    this.sheet.ctx.putImageData(out, 0, 0);
  }
  private get oy() {
    return CAP + WH;
  }

  /** Rooms laid out on one grid; a single room is a plan of one. */
  private plan!: RoomPlan;
  private palettes: Palette[] = [];
  private main!: { p: RoomParams; P: Palette };
  /** Draw as the room a piece or a cell belongs to: its colours and its finish. */
  private inRoom(i = 0) {
    const r = this.plan.rooms[i] ?? this.main.p;
    r.hour = this.main.p.hour;
    this.p = r;
    this.P = this.palettes[i] ?? this.main.P;
  }
  private outOfRoom() {
    this.p = this.main.p;
    this.P = this.main.P;
  }

  set(p: RoomParams, props: Prop[], plan?: RoomPlan) {
    this.p = p;
    this.P = palette(p);
    this.main = { p, P: this.P };
    if (!plan) {
      const mask = roomMask(p);
      plan = { w: p.w, d: p.d, mask, cells: new Int16Array(p.w * p.d).map((_, i) => (mask[i] ? 0 : -1)), rooms: [p], entrance: [p.entrance ?? -1, p.d - 1], doorways: [] };
    }
    this.plan = plan;
    this.palettes = plan.rooms.map((r) => (r === p ? this.P : palette(r)));
    const keep = this.props.length === props.length && this.props.every((q, i) => q.kind === props[i].kind);
    this.props = props;
    if (!keep) {
      this.prog = new Map(props.map((q) => [q.id, q.on ? 1 : 0]));
      this.repair();
    }
    this.mask = plan.mask;
    this.worn = wornTiles({ ...p, entrance: plan.entrance[0] >= 0 ? plan.entrance[0] : undefined }, props, plan.mask);
    this.top = Array.from({ length: p.w }, (_, x) => {
      for (let y = 0; y < p.d; y++) if (this.mask[y * p.w + x]) return y;
      return -1;
    });
    this.W = p.w * T + 2 * S;
    this.H = CAP + WH + p.d * T + S;
    const n = this.W * this.H;
    this.col = new Uint32Array(n);
    this.ids = new Int16Array(n);
    this.glow = new Uint8Array(n);
    this.ctx.canvas.width = this.W;
    this.ctx.canvas.height = this.H;
    this.img = this.ctx.createImageData(this.W, this.H);
    this.layCutouts();
  }

  pick(x: number, y: number) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return -1;
    for (let r = 0; r < 3; r++)
      for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= this.W || yy >= this.H) continue;
        const id = this.ids[yy * this.W + xx];
        if (id >= 0 && this.props[id].kind !== "rug") return id;
      }
    return -1;
  }

  repair() {
    this.walls = [];
    this.tiles.clear();
    this.debris = [];
    for (const q of this.props) q.broken = false;
  }

  /** Hammer blow at canvas pixel (x, y). Returns what changed so the caller
   * knows whether the traced light needs rebuilding. */
  hit(x: number, y: number): "prop" | "wall" | "floor" | undefined {
    const { P, oy } = this;
    const hung = ["tapestry", "pegs", "plates", "map"];
    let q: Prop | undefined = this.props[this.pick(x, y)];
    if (q && hung.includes(q.kind)) q = undefined;
    const fw = this.p.w * T, u = Math.floor(x - S);
    if (q) {
      if ((q.kind === "lamp" || q.kind === "lantern" || q.kind === "window") && !q.broken) {
        q.broken = true;
        q.on = q.kind === "window";
        const floor = q.kind === "lamp" ? oy + (q.y + q.d) * T - 4 : oy + 3;
        this.spray(x, y, 26, [0xe4f4ff, 0xb8d8ec, 0x8fb4cc, P.brass[4]], floor, 70);
        return "prop";
      }
      this.spray(x, y, 3, [P.wood[3], P.wood[2]], y + 4, 30);
      return;
    }
    if (u < 0 || u >= fw) return;
    const cx = Math.floor(u / T), ty = this.top[cx], base = oy + ty * T;
    if (ty >= 0 && y >= base - WH && y < base) {
      const v = base - 1 - Math.floor(y);
      const near = this.walls.find((h) => h.base === base && Math.hypot(h.u - u, h.v - v) < 8);
      if (near) near.hits++;
      else this.walls.push({ u, v, hits: 1, seed: (Math.random() * 1e6) | 0, base });
      this.spray(x, y, 10, [P.wall[3], P.wall[4], P.wall[2], P.stone[3]], base + 2 + Math.random() * 6, 45);
      return "wall";
    }
    const cy = Math.floor((y - oy) / T);
    if (y >= oy && cy < this.p.d && this.mask[cy * this.p.w + cx]) {
      const v = Math.floor(y) - oy, key = (u >> 3) + (v >> 3) * 1024;
      const t = this.tiles.get(key) ?? { u, v, hits: 0, seed: (Math.random() * 1e6) | 0, base: 0 };
      t.hits++;
      this.tiles.set(key, t);
      this.spray(x, y, 3 + t.hits * 2, [P.floor[4], P.floor[3], P.floor[2]], y + 1, 22);
      return "floor";
    }
  }

  /** Back-wall voxels the hammer has knocked through, as x + z * 4096. */
  holes() {
    const out = new Set<number>();
    for (const h of this.walls) {
      if (h.hits < 3) continue;
      const r = (h.hits - 2) * 3;
      for (let dv = -r; dv <= r; dv++)
        for (let du = -r; du <= r; du++)
          if (du * du + dv * dv <= r * r) out.add(1 + ((h.u + du) >> 1) + (1 + ((h.v + dv) >> 1)) * 4096);
    }
    return out;
  }

  private spray(x: number, y: number, n: number, cols: number[], floor: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.1 + Math.random() * 0.8);
      this.debris.push({
        x, y, vx: Math.cos(a) * speed * (0.3 + Math.random()), vy: Math.sin(a) * speed * (0.5 + Math.random()),
        c: cols[i % cols.length], floor: floor + Math.random() * 5, rest: false,
      });
    }
    if (this.debris.length > 900) this.debris.splice(0, this.debris.length - 900);
  }

  frame(dt: number, field?: LightField) {
    if (!this.img) return;
    this.t += dt;
    for (const q of this.props) {
      const cur = this.prog.get(q.id) ?? 0, to = q.on ? 1 : 0;
      this.prog.set(q.id, cur + Math.sign(to - cur) * Math.min(Math.abs(to - cur), dt * 3.2));
      if (q.on && (q.kind === "spinwheel" || q.kind === "throw")) this.turn.set(q.id, (this.turn.get(q.id) ?? 0) + dt * 5);
    }
    for (const d of this.debris) {
      if (d.rest) continue;
      d.vy += 320 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y >= d.floor) {
        d.y = d.floor;
        if (d.vy > 50) (d.vy *= -0.3), (d.vx *= 0.5);
        else d.rest = true;
      }
    }
    this.paint();
    if (!field && this.lighting === "layer") {
      this.albedo();
      this.outline();
      this.particles(true);
      this.ctx.putImageData(this.img, 0, 0);
      this.cut();
      this.lightLayer();
      return;
    }
    const stepped = !field && this.lighting === "stepped";
    if (stepped) this.stepped();
    else if (field) this.traced(field);
    else this.shade();
    this.outline();
    if (!stepped) this.grade();
    this.particles(!field);
    this.ctx.putImageData(this.img, 0, 0);
    this.cut();
  }

  private s(x: number, y: number, c: number) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = y * this.W + x;
    this.col[i] = c;
    this.ids[i] = this.cur;
    this.glow[i] = 0;
  }
  private g(x: number, y: number, c: number) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = y * this.W + x;
    this.col[i] = c;
    this.ids[i] = this.cur;
    this.glow[i] = 1;
  }
  private r(x: number, y: number, w: number, h: number, c: number | ((i: number, j: number) => number)) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.s(x + i, y + j, typeof c === "number" ? c : c(i, j));
  }
  /** An oval of shade on the floor under a piece: a dark core and a lighter
   * rim, stepped, with a dithered edge between. */
  private contact(cx: number, cy: number, rx: number, ry: number) {
    for (let j = Math.floor(-ry - 1); j <= ry + 1; j++)
      for (let i = Math.floor(-rx - 1); i <= rx + 1; i++) {
        const x = Math.round(cx + i), y = Math.round(cy + j);
        if (x < 0 || y < 0 || x >= this.W || y >= this.H) continue;
        const e = (i * i) / (rx * rx) + (j * j) / (ry * ry), th = BAYER[(y & 3) * 4 + (x & 3)];
        if (e > 1 + th * 0.3) continue;
        const n = y * this.W + x;
        this.col[n] = scale(this.col[n], e < 0.45 + th * 0.2 ? 0.62 : 0.8);
      }
  }
  private dim(x: number, y: number, w: number, h: number, k: number) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const xx = (x + i) | 0, yy = (y + j) | 0;
        if (xx < 0 || yy < 0 || xx >= this.W || yy >= this.H) continue;
        const n = yy * this.W + xx;
        this.col[n] = scale(this.col[n], k);
      }
  }
  /** Oblique box: footprint (x, y, w, d) on the floor raised h px. */
  private box(x: number, y: number, w: number, d: number, h: number, top: number[], front: number[]) {
    this.r(x, y - h, w, d, (i, j) => (j === 0 ? top[5] : i === 0 ? top[4] : top[3]));
    this.r(x, y + d - h, w, h, (_i, j) => (j === 0 ? front[3] : j === h - 1 ? front[1] : front[2]));
  }
  private vase(cx: number, base: number, h: number, rad: (t: number) => number, R: number[], mouth = true) {
    for (let j = 0; j < h; j++) {
      const n = Math.max(0, Math.round(rad(j / Math.max(1, h - 1))));
      // Lit from the upper left: a band down the left third, the belly
      // darkening toward the foot, one bright point where the light lands.
      const tj = j / Math.max(1, h - 1);
      for (let i = -n; i <= n; i++) {
        const k = (i + n + 0.5) / (2 * n + 1) + (tj < 0.25 ? 0.12 : 0) - (tj > 0.7 ? 0.1 : 0);
        let c = R[k < 0.22 ? 4 : k < 0.5 ? 3 : k < 0.8 ? 2 : 1];
        if (n > 1 && i === -Math.round(n * 0.45) && Math.abs(tj - 0.6) < 0.08) c = R[5];
        if (n > 1 && i === n && tj > 0.3 && tj < 0.8) c = mix(c, R[3], 0.4);
        this.s(cx + i, base - j, c);
      }
      if (j === h - 1) {
        for (let i = -n; i <= n; i++) this.s(cx + i, base - j, R[5]);
        if (mouth && n > 1) for (let i = -n + 1; i < n; i++) this.s(cx + i, base - j + 1, R[0]);
      }
    }
  }
  /** A sprite widened to `w` px by repeating its middle columns: a long board from a table. */
  private stretch(name: string, w: number) {
    const rows = SPRITES[name], key = `${name}@${w}`;
    if (rows[0].length === w) return name;
    if (WIDE.has(key)) return key;
    const edge = 12, mid = rows[0].length - edge * 2;
    WIDE.set(key, rows.map((row) => {
      let out = row.slice(0, edge);
      for (let i = 0; i < w - edge * 2; i++) out += row[edge + (i % mid)];
      return out + row.slice(-edge);
    }));
    return key;
  }
  /** A barrel lying on the stillage, seen end-on: staves lit from the upper
   * left, an iron hoop, the strength chalked on the head, a brass tap. */
  private caskEnd(cx: number, cy: number, rr: number, seed: number, tap: boolean) {
    const { P } = this, W = P.wood;
    // End grain reads paler than the staves' sides.
    const H = W.map((c, i) => mix(c, P.straw[i], 0.35));
    for (let j = -rr; j <= rr; j++)
      for (let i = -rr; i <= rr; i++) {
        const d = Math.hypot(i, j);
        if (d > rr + 0.35) continue;
        let c: number;
        if (d > rr - 0.65) c = W[0];
        else if (d > rr - 1.8) c = i + j < -rr * 0.9 ? P.iron[3] : P.iron[1];
        else {
          const seam = (i + rr) % 4 === 0;
          const lit = i + j < -rr * 0.4 ? 1 : i + j > rr * 0.5 ? -1 : 0;
          c = seam ? H[1] : H[Math.max(1, Math.min(5, 3 + lit - (((i + rr) >> 2) & 1)))];
        }
        this.s(cx + i, cy + j, c);
      }
    // The strength in chalk: X, XX or XXX.
    const xs = 1 + (seed % 3);
    for (let k = 0; k < xs; k++) {
      const x = cx - (xs * 4 - 1) / 2 + k * 4, y = cy - rr + 3;
      for (const [dx, dy] of [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]) this.s(x + dx, y + dy, P.linen[5]);
    }
    if (!tap) return;
    this.r(cx - 2, cy + 2, 5, 1, (i) => P.brass[i === 0 ? 5 : i === 4 ? 2 : 4]);
    this.r(cx, cy + 3, 2, 3, (i, j) => P.brass[j === 2 ? 2 : i ? 2 : 4]);
  }
  /** A drinking pot standing on its base: 0 pewter, 1 stoneware, 2 a leather jack. */
  private mug(x: number, base: number, kind: number) {
    const { P } = this;
    const R = kind === 0 ? [0x2a2c34, 0x4e535e, 0x7a808a, 0x9ea4ac, 0xc4c8cc, 0xe8eaea] : kind === 1 ? P.pale : P.fur.map((c) => scale(c, 0.55));
    const h = kind === 2 ? 7 : 6, w = kind === 2 ? 5 : 4;
    this.r(x, base - h, w, h, (i, j) => (j === 0 ? R[5] : j === h - 1 ? R[1] : i === 0 ? R[4] : i === w - 1 ? R[1] : i === 1 ? R[3] : R[2]));
    if (kind === 0) this.r(x, base - h - 1, w - 1, 1, R[4]);
    this.r(x + w, base - h + 1, 1, 1, R[2]);
    this.r(x + w + 1, base - h + 2, 1, 2, R[1]);
    this.r(x + w, base - h + 4, 1, 1, R[2]);
  }
  /** A stoneware jug with a handle, mottled brown above as salt glaze fires. */
  private jug(cx: number, base: number) {
    const { P } = this;
    const R = P.clay.map((c, i) => mix(c, 0x5a3a22, 0.35 - i * 0.03));
    this.vase(cx, base, 9, (t) => 3.2 - Math.abs(t - 0.35) * 3 + (t > 0.85 ? 0.6 : 0), R);
    this.r(cx + 3, base - 7, 1, 1, R[2]);
    this.r(cx + 4, base - 6, 1, 3, R[1]);
    this.r(cx + 3, base - 3, 1, 1, R[2]);
  }
  /** A tallow candle in a pricket dish, lit. */
  private candle(x: number, base: number, seed: number) {
    const { P } = this;
    this.r(x - 2, base, 5, 1, P.brass[3]);
    this.s(x - 2, base, P.brass[5]);
    this.r(x, base - 5, 2, 5, (i, j) => (j === 0 ? P.linen[5] : i ? P.linen[3] : P.linen[4]));
    this.s(x + 1, base - 4, P.linen[5]);
    this.flames.push({ x, y: base - 7 });
    this.lights.push({ x, y: base - 7, c: 0xffb860, rad: 46, k: 1.15, phase: seed % 80 });
  }
  /** A saint or worshipper in a panel or niche: halo, face, robe. */
  private saint(cx: number, top: number, h: number, robe: number[], halo = true) {
    const { P } = this;
    if (halo) for (let a = 0; a < 16; a++) this.s(cx + Math.round(Math.cos(a / 2.55) * 3), top + 3 + Math.round(Math.sin(a / 2.55) * 3), P.brass[a < 8 ? 5 : 3]);
    this.r(cx - 1, top + 2, 3, 3, (i, j) => (j === 2 ? 0xc8987a : i === 0 ? 0xf0d0b0 : 0xe0b894));
    for (let j = 0; j < h - 5; j++) {
      const half = 1 + Math.floor(j / 3);
      for (let i = -half; i <= half; i++) this.s(cx + i, top + 5 + j, robe[i < 0 ? 4 : i === 0 ? 3 : (i + j) % 4 === 0 ? 1 : 2]);
    }
  }
  /** A lit candle on a stick: a brass foot, the wax, the flame and its light. */
  private taper(x: number, base: number, h: number, seed: number, k = 0.7) {
    const { P } = this;
    this.r(x - 1, base - 1, 3, 1, P.brass[3]);
    this.r(x, base - h, 1, h - 1, P.brass[4]);
    this.r(x, base - h - 4, 1, 4, P.linen[5]);
    this.flames.push({ x, y: base - h - 6 });
    this.lights.push({ x, y: base - h - 6, c: 0xffc070, rad: 30, k, phase: seed % 90 });
  }
  /** A tall pointed window of coloured glass in lead, throwing coloured light. */
  private lancet(x0: number, top: number, w: number, h: number, seed: number, sunNow: ReturnType<typeof sun>) {
    const { P } = this;
    const glass = [0xb8202a, 0x2a4ab0, 0xe0b030, 0x2a8a5a, 0x8a3aa0];
    const arch = (i: number, j: number) => j < w / 2 && Math.hypot(i - (w - 1) / 2, j - w / 2) > w / 2 + 0.2 && Math.abs(i - (w - 1) / 2) > j * 0.9;
    for (let j = -2; j < h + 2; j++)
      for (let i = -2; i < w + 2; i++) {
        const inside = i >= 0 && i < w && j >= 0 && j < h && !arch(i, j);
        const frame = !inside && i >= -2 && i < w + 2 && j < h + 2 && !arch(Math.max(0, Math.min(w - 1, i)), j + 2);
        if (frame) this.s(x0 + i, top + j, j === h + 1 ? P.stone[1] : i < 0 ? P.stone[4] : P.stone[2]);
        if (!inside) continue;
        const lead = i % 4 === 0 || j % 5 === 0 || Math.abs(i - (w - 1) / 2) < 0.6;
        const c = glass[Math.floor(hash(i >> 2, Math.floor(j / 5), seed) * glass.length)];
        const lit = 0.55 + sunNow.strength * 0.45;
        this.g(x0 + i, top + j, lead ? 0x1a1418 : mix(scale(c, lit), 0xffffff, hash(i, j, seed) < 0.1 ? 0.3 : 0));
      }
    this.r(x0 - 3, top + h + 2, w + 6, 2, (_i, j) => P.stone[j ? 2 : 4]);
    if (sunNow.strength > 0)
      for (let k = 0; k < 3; k++) {
        const len = 22 + (1 - sunNow.dir[2]) * 40, skew = (sunNow.dir[0] / Math.max(0.2, -sunNow.dir[1])) * len * -0.6;
        this.beams.push({ x0: x0 + k * 3, x1: x0 + k * 3 + 4, top: top + 4, floor: top + h + 8, len, skew, k: sunNow.strength * 0.5, c: glass[(seed + k) % 3] });
      }
  }
  /** A column: base, shaft and capital, in stone, red lacquer or timber. */
  private column(cx: number, base: number, style: string) {
    const { P } = this, W = P.wood;
    const h = 70, R = style === "red" ? [0x3a0e0a, 0x6a1a14, 0x9a2a1e, 0xb83a26, 0xd05a3a, 0xe88a5a] : style === "timber" ? W : P.stone;
    this.r(cx - 5, base - 4, 11, 4, (i, j) => (j === 0 ? P.stone[5] : i === 0 ? P.stone[4] : P.stone[2]));
    this.r(cx - 3, base - h, 7, h - 4, (i, j) => (style === "stone" && i % 2 === 1 && j % 9 !== 0 ? R[i < 3 ? 4 : 2] : R[i === 0 ? 4 : i === 1 ? 5 : i < 4 ? 3 : i === 6 ? 1 : 2]));
    if (style === "red") this.r(cx - 3, base - h + 8, 7, 3, (i) => P.brass[i < 3 ? 5 : 3]);
    this.r(cx - 5, base - h - 4, 11, 4, (i, j) => (j === 0 ? R[5] : j === 3 ? R[1] : i === 0 ? R[4] : R[3]));
    this.dim(cx + 4, base - h, 2, h - 4, 0.8);
  }
  /** A pulpit raised on a stem, its stair and its sounding board. */
  private pulpit(X: number, base: number, seed: number) {
    const { P } = this, W = P.wood;
    this.r(X + 6, base - 14, 4, 14, (i) => W[i === 0 ? 4 : i === 3 ? 1 : 2]);
    this.r(X + 1, base - 30, 14, 16, (i, j) => (j === 0 ? W[5] : j === 1 ? W[3] : i === 0 || i === 13 ? W[1] : (i - 3) % 5 === 0 ? W[1] : (i - 3) % 5 === 1 ? W[4] : j === 15 ? W[1] : W[2]));
    this.r(X + 4, base - 33, 8, 2, (i) => (i < 4 ? P.acc[3] : P.acc[2]));
    this.r(X + 3, base - 34, 4, 1, P.paper[5]);
    this.r(X - 1, base - 52, 18, 3, (i, j) => (j === 0 ? W[5] : j === 2 ? W[1] : i % 4 === 0 ? W[2] : W[4]));
    this.r(X + 7, base - 49, 2, 15, W[1]);
    for (let s = 0; s < 6; s++) this.r(X + 14 + s, base - 2 - s * 4, 2, 1, W[4 - (s & 1)]);
    void seed;
  }
  /** A minbar: the stair to the preacher's seat, its gate and its little dome. */
  private minbar(X: number, base: number) {
    const { P } = this, W = P.wood;
    this.r(X, base - 30, 16, 30, (i, j) => {
      if (i === 0 || i === 15 || j === 29) return W[1];
      const gate = i > 3 && i < 12 && j > 10;
      if (gate) return j < 13 && Math.abs(i - 7.5) > j - 9 ? W[3] : 0x24181a;
      return ((i + j) % 6 === 0 || (i - j + 60) % 6 === 0) ? W[1] : W[i < 3 ? 4 : 3];
    });
    this.r(X + 3, base - 36, 10, 6, (i, j) => (j === 5 ? W[1] : i === 0 || i === 9 ? W[2] : W[3]));
    for (let j = 0; j < 9; j++) this.r(X + 8 - Math.ceil((9 - j) / 2), base - 45 + j, Math.ceil((9 - j) / 2) * 2, 1, j === 0 ? P.brass[5] : W[j < 3 ? 4 : 3]);
    this.r(X + 7, base - 48, 2, 3, P.brass[4]);
  }
  /** The focus a room of rows faces, in the form of its faith and age. */
  private altar(style: string, q: Prop, X: number, Y: number, PW: number, PD: number) {
    const { P } = this, W = P.wood, cx = X + (PW >> 1), base = Y + PD - 3;
    const art = ALTARS[style];
    if (art) {
      const R = P as unknown as Record<string, number[]>, w = art.rows[0].length, x0 = cx - (w >> 1), y0 = Y + PD - 1 - art.rows.length;
      art.rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === ".") continue;
          if (ch === "%") {
            this.g(x0 + i, y0 + j, 0xffd890);
            continue;
          }
          if (ch === "*") {
            this.flames.push({ x: x0 + i, y: y0 + j });
            this.lights.push({ x: x0 + i, y: y0 + j, c: 0xffc070, rad: 30, k: 0.45, phase: (q.seed + i) % 90 });
            continue;
          }
          const ink = art.ink[ch];
          this.s(x0 + i, y0 + j, typeof ink === "number" ? ink : R[ink[0]][ink[1]]);
        }
      });
      return;
    }
    const lapis = [0x101a3a, 0x1a2a5a, 0x23387a, 0x30489a, 0x4a64b8, 0x7a90d8];
    const red = [0x3a0e0e, 0x6a1a16, 0x9a2a22, 0xb8402e, 0xd0604a, 0xe89070];
    const cloth = (tx: number, tw: number, top: number, h: number, band: number[]) => {
      this.r(tx, top, tw, h, (i, j) => (j === 0 ? P.linen[5] : i === 0 ? P.linen[4] : j === h - 1 ? P.linen[2] : j > 2 && j < 5 ? band[3] : P.linen[4 - ((i + j) % 7 === 0 ? 1 : 0)]));
    };
    const table = (tw: number, h: number, R: number[]) => {
      const tx = cx - (tw >> 1);
      this.box(tx, Y + 2, tw, PD - 5, h, R, R);
      return tx;
    };
    switch (style) {
      case "romanesque": {
        // Christ in Majesty in a mandorla, painted on the apse above a plain stone altar.
        const my = Y - 40;
        for (let j = 0; j < 30; j++)
          for (let i = -9; i <= 9; i++) {
            const e = (i * i) / 81 + ((j - 15) * (j - 15)) / 225;
            if (e > 1) continue;
            this.s(cx + i, my + j, e > 0.8 ? 0xc89a4a : e > 0.7 ? 0x8a3a2a : 0x3a5a8a);
          }
        this.saint(cx, my + 5, 20, red);
        for (const sx of [-15, 15]) this.saint(cx + sx, my + 12, 14, sx < 0 ? [0x2a3a2a, 0x3a5a3a, 0x4a6a4a, 0x5a7a4a, 0x7a9a6a, 0x9aba8a] : red, true);
        const tx = table(Math.min(30, PW - 10), 13, P.stone);
        cloth(tx, Math.min(30, PW - 10), Y - 11, 6, P.acc);
        this.r(cx, Y - 22, 1, 9, P.brass[4]);
        this.r(cx - 2, Y - 19, 5, 1, P.brass[4]);
        this.taper(tx + 3, Y - 10, 4, q.seed);
        this.taper(tx + Math.min(30, PW - 10) - 4, Y - 10, 4, q.seed + 3);
        break;
      }
      case "reformed": {
        // A communion table under boards of the Commandments, Creed and Lord's Prayer.
        for (const [k, bx] of [[0, cx - 20], [1, cx + 4]] as const) {
          for (let j = 0; j < 26; j++)
            for (let i = 0; i < 16; i++) {
              const r0 = Math.hypot(i - 7.5, j - 8);
              if (j < 8 && r0 > 8.2) continue;
              const rim = i === 0 || i === 15 || j === 25 || (j < 8 && r0 > 7.2);
              this.s(bx + i, Y - 42 + j, rim ? P.brass[i === 0 || j < 4 ? 4 : 2] : j > 8 && j < 23 && j % 3 === 0 && i > 2 && i < 13 && hash(i, j, k) < 0.8 ? P.brass[4] : 0x18141a);
            }
        }
        const tw = Math.min(30, PW - 8), tx = cx - (tw >> 1);
        for (const lx of [tx + 1, tx + tw - 3]) this.r(lx, base - 12, 2, 12, (i, j) => W[j % 4 === 0 ? 4 : i ? 1 : 3]);
        cloth(tx, tw, base - 18, 7, P.linen);
        this.vase(tx + 8, base - 18, 7, (t) => 2.2 - Math.abs(t - 0.3) * 1.5, P.iron);
        this.vase(tx + tw - 9, base - 18, 4, (t) => 1.6 - t * 0.6, P.brass);
        break;
      }
      case "baroque": {
        // A gilded retablo: twisted columns, saints in niches, the Virgin at the heart, a burst of rays above.
        const rw = PW - 2, rx = X + 1, top = Y - 46, gold = P.brass;
        this.r(rx, top + 6, rw, 44, (i, j) => (hash(i, j, 3) < 0.12 ? gold[5] : (i + j) % 5 === 0 ? gold[2] : gold[3 + ((i >> 1) % 2)]));
        for (let k = 0; k <= 3; k++) {
          const colX = rx + 1 + Math.round((k * (rw - 4)) / 3);
          for (let j = 0; j < 40; j++) this.r(colX, top + 8 + j, 3, 1, (i) => ((i + j) % 4 < 2 ? gold[5] : gold[1]));
        }
        const niche = (nx: number, nw: number, ny: number, nh: number, fig: number[], crown = false) => {
          this.r(nx, ny, nw, nh, (i, j) => (j < nw / 2 && Math.hypot(i - (nw - 1) / 2, j - nw / 2) > nw / 2 ? gold[4] : j === nh - 1 ? gold[1] : 0x3a1a2a));
          this.saint(nx + (nw >> 1), ny + 3, nh - 5, fig, !crown);
          if (crown) this.r(nx + (nw >> 1) - 1, ny + 2, 3, 1, gold[5]);
        };
        const cw = Math.round((rw - 4) / 3);
        niche(rx + 3, cw - 4, top + 18, 20, [0x2a1a10, 0x4a2e1a, 0x6a4428, 0x8a5a36, 0xa87a50, 0xc89a70]);
        niche(rx + rw - cw + 1, cw - 4, top + 18, 20, red);
        niche(cx - 5, 11, top + 12, 28, lapis, true);
        for (let a = 0; a < 12; a++) {
          const t = (a / 11) * Math.PI;
          for (let r0 = 3; r0 < 9; r0++) this.g(cx + Math.round(Math.cos(t) * r0), top + 7 - Math.round(Math.sin(t) * r0 * 0.7), gold[5]);
        }
        const tw = Math.min(36, PW - 6), tx = table(tw, 12, P.stone);
        cloth(tx, tw, Y - 10, 6, red);
        for (let k = 0; k < 6; k++) this.taper(tx + 2 + Math.round((k * (tw - 4)) / 5), Y - 9, 5 + (k === 0 || k === 5 ? 0 : 2), q.seed + k, 0.5);
        break;
      }
      case "mihrab": {
        // The niche in the qibla wall: a tiled frame, a calligraphy band, a lamp in the hollow.
        const nw = Math.min(22, PW - 8), nh = 36, nx = cx - (nw >> 1), top = Y - nh - 2;
        this.levha(nx - 4, top - 9, nw + 8, 7, q.seed);
        for (let j = 0; j < nh; j++)
          for (let i = 0; i < nw; i++) {
            const r = Math.hypot(i - (nw - 1) / 2, j - nw / 2);
            if (j < nw / 2 && r > nw / 2) continue;
            const edge = i < 3 || i > nw - 4 || (j < nw / 2 && r > nw / 2 - 3);
            if (edge) this.s(nx + i, top + j, (Math.floor(i / 2) + Math.floor(j / 2)) % 2 ? P.acc[3] : P.linen[5]);
            else this.s(nx + i, top + j, mix(0x3a2a30, 0x120c14, Math.min(1, (j + Math.abs(i - nw / 2)) / nh)));
          }
        this.r(cx, top + 10, 1, 6, P.brass[2]);
        this.vase(cx, top + 21, 5, (t) => 2.5 - Math.abs(t - 0.5) * 2, [0x2a5a4a, 0x3a8a6a, 0x6ac0a0, 0xa0e8d0, 0xd0fff0, 0xffffff]);
        this.g(cx, top + 18, 0xfff0b0);
        this.lights.push({ x: cx, y: top + 18, c: 0xffd890, rad: 34, k: 0.8, phase: q.seed % 60 });
        break;
      }
      case "buddha":
      case "buddha-jp": {
        const jp = style === "buddha-jp", gold = P.brass, by = Y - 2;
        // Halo or flame mandorla first, then the Buddha on the lotus, then the offering table before him.
        if (jp) for (let j = 0; j < 40; j++) {
          const half = Math.round(Math.sin((j / 40) * Math.PI) * 15 + (j > 20 ? 2 : 0));
          for (let i = -half; i <= half; i++) this.s(cx + i, by - 44 + j, Math.abs(i) > half - 2 ? gold[4] : hash(i, j, 5) < 0.1 ? gold[5] : 0x3a1a14);
        } else {
          for (let a = 0; a < 48; a++) for (const r0 of [10, 11]) this.s(cx + Math.round(Math.cos(a / 7.6) * r0), by - 31 + Math.round(Math.sin(a / 7.6) * r0), r0 === 10 ? gold[5] : gold[2]);
          this.r(X, Y - 46, PW, 5, (i, j) => (j === 4 ? gold[4] : i % 6 === 0 && j > 1 ? gold[3] : red[2 + (j === 0 ? 1 : 0)]));
        }
        for (let i = -13; i <= 13; i++) {
          const pet = Math.abs(((i + 13) % 6) - 3);
          for (let j = 0; j < 6 - pet / 2; j++) this.s(cx + i, by - j, j === 0 ? gold[1] : jp ? gold[3 + (j > 3 ? 1 : 0)] : mix(0xe89aa0, gold[4], j / 6));
        }
        for (let i = -10; i <= 10; i++) for (let j = 0; j < 5; j++) if ((i * i) / 100 + ((j - 2) * (j - 2)) / 6 <= 1) this.s(cx + i, by - 6 - j, gold[i < -3 ? 4 : i > 5 ? 2 : 3]);
        for (let j = 0; j < 12; j++) {
          const half = 6 - Math.floor(j / 4);
          for (let i = -half; i <= half; i++) this.s(cx + i, by - 11 - j, gold[i < -half + 2 ? 5 : i > half - 2 ? 2 : 3]);
        }
        for (let j = 0; j < 9; j++) this.s(cx - 3 + Math.floor(j / 2), by - 20 + j, gold[1]);
        this.r(cx - 2, by - 12, 5, 2, gold[4]);
        const hy = by - 28;
        for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 26) this.s(cx + i, hy + j, j < -2 ? (jp ? 0x1a1a24 : 0x2a3a6a) : gold[i < -1 ? 5 : i > 2 ? 3 : 4]);
        this.r(cx - 1, hy - 8, 3, 3, jp ? 0x1a1a24 : 0x2a3a6a);
        for (const ex of [-6, 6]) this.r(cx + ex, hy - 1, 1, 6, gold[2]);
        this.r(cx - 3, hy + 1, 2, 1, gold[1]);
        this.r(cx + 2, hy + 1, 2, 1, gold[1]);
        for (const [dx, dy] of [[-4, -3], [3, -3], [0, -9], [-2, 0]]) this.g(cx + dx, hy + dy + 6, gold[5]);
        const tw = Math.min(34, PW - 6), tx = cx - (tw >> 1), lac = jp ? [0x0e0808, 0x1e1210, 0x2e1c18, 0x3e2620, 0x5a3a2e, 0x7a5040] : red;
        this.box(tx, Y + 2, tw, PD - 5, 12, lac, lac);
        this.r(tx, Y - 1, tw, 1, gold[4]);
        this.vase(cx, Y - 10, 6, (t) => 3.2 - Math.abs(t - 0.4) * 2.4, P.iron);
        this.r(cx - 3, Y - 16, 7, 1, P.iron[3]);
        for (let k = 0; k < 3; k++) this.smoke.push({ x: cx - 1 + k, y: Y - 17 });
        for (const sx of [tx + 4, tx + tw - 5]) this.taper(sx, Y - 10, 3, q.seed + sx, 0.6);
        for (const sx of [tx + 9, tx + tw - 10]) {
          this.vase(sx, Y - 10, 4, () => 1.4, gold);
          for (const [dx, dy] of [[-1, -6], [1, -7], [0, -8]]) this.s(sx + dx, Y - 10 + dy, jp ? P.leaf[3] : 0xe8a0b0);
        }
        break;
      }
      case "hindu": {
        // The sanctum door: carved jambs and lintel, bells, and the god dark and garlanded within, lit by lamps.
        const dw = Math.min(30, PW - 6), dx = cx - (dw >> 1), top = Y - 44;
        this.r(dx - 4, top - 4, dw + 8, 48, (i, j) => (j < 6 ? P.stone[j === 0 ? 5 : (i + (j >> 1)) % 3 === 0 ? 2 : 4] : (i < 4 || i > dw + 3) ? P.stone[(j % 6 === 0 ? 1 : i % 4 === 0 ? 2 : 3) + (i < 2 ? 1 : 0)] : 0x140c0c));
        for (let k = 0; k < 5; k++) this.saint(dx + 2 + Math.round((k * (dw - 4)) / 4), top - 3, 6, P.stone, false);
        const gy = Y - 6;
        this.r(cx - 4, gy - 2, 9, 2, P.stone[3]);
        for (let j = 0; j < 24; j++) {
          const half = j < 6 ? 2 : j < 16 ? 3 : 4;
          for (let i = -half; i <= half; i++) this.s(cx + i, gy - 26 + j, [0x0c0a0e, 0x1a1820, 0x2a2834][i < 0 ? 2 : i === 0 ? 1 : 0]);
        }
        this.r(cx - 3, gy - 30, 7, 4, (i, j) => P.brass[j === 0 ? 5 : i % 2 ? 3 : 4]);
        for (let a = 0; a < 18; a++) this.s(cx + Math.round(Math.cos(a / 2.9) * 5), gy - 18 + Math.round(Math.abs(Math.sin(a / 2.9)) * 6), a % 2 ? 0xe8901a : 0xf0b030);
        this.s(cx, gy - 24, 0xd02020);
        this.r(cx - 4, gy - 8, 9, 6, (i, j) => (j === 0 ? 0xf0c040 : (i + j) % 3 === 0 ? 0xc02a2a : 0xd84a2a));
        for (const lx of [dx + 2, dx + dw - 3]) {
          this.r(lx - 1, gy - 1, 3, 1, P.clay[3]);
          this.flames.push({ x: lx, y: gy - 3 });
          this.lights.push({ x: lx, y: gy - 3, c: 0xffb050, rad: 34, k: 1, phase: (q.seed + lx) % 80 });
        }
        for (const bx of [dx + 6, dx + dw - 7]) {
          this.r(bx, top + 2, 1, 6, P.iron[2]);
          this.vase(bx, top + 12, 4, (t) => 2.2 - t, P.brass, false);
        }
        for (let k = 0; k < 10; k++) this.s(dx + hash(k, 1, q.seed) * dw, Y + 4 + hash(k, 2, q.seed) * 6, k % 2 ? 0xe8901a : 0xc02a2a);
        break;
      }
      case "classical": {
        // The cult statue on its podium, marble with gilt, a small altar smoking before it.
        const top = Y - 46, marble = [0x6a6460, 0x9a948c, 0xc4beb4, 0xdcd6cc, 0xece8e0, 0xfaf8f2];
        this.r(cx - 10, Y - 10, 21, 10, (i, j) => (j === 0 ? marble[5] : j === 9 ? marble[1] : i === 0 ? marble[4] : j === 4 ? marble[2] : marble[3]));
        this.r(cx - 7, Y - 6, 15, 1, P.brass[3]);
        for (let j = 0; j < 30; j++) {
          const half = j < 6 ? 2 : j < 14 ? 3 + (j > 9 ? 1 : 0) : 4 + Math.floor((j - 14) / 6);
          for (let i = -half; i <= half; i++) this.s(cx + i, top + 6 + j, marble[i < -1 ? 5 : i > 1 ? 2 : (j + i) % 5 === 0 ? 2 : 4]);
        }
        this.r(cx - 2, top + 2, 5, 4, (i) => marble[i < 2 ? 5 : 3]);
        this.r(cx - 3, top + 1, 7, 1, P.brass[5]);
        this.r(cx + 6, top - 2, 1, 36, P.brass[3]);
        this.disc(cx - 7, top + 22, 4, P.brass);
        const ax = cx - 3, ay = base;
        this.r(ax, ay - 8, 7, 8, (i, j) => (j === 0 ? marble[5] : i === 0 ? marble[4] : marble[3]));
        this.flames.push({ x: ax + 3, y: ay - 10 });
        this.lights.push({ x: ax + 3, y: ay - 10, c: 0xffb050, rad: 30, k: 0.9, phase: q.seed % 70 });
        this.smoke.push({ x: ax + 3, y: ay - 12 });
        break;
      }
      case "mesopotamian": {
        // The god in the cella: a buttressed niche, the horned crown, the flounced robe, offerings on a table.
        const top = Y - 46, brick = P.clay;
        this.r(cx - 14, top, 29, 46, (i, j) => (i < 3 || i > 25 ? brick[(j % 4 === 0 ? 1 : 3) + (i % 3 === 0 ? -1 : 0)] : i < 6 || i > 22 ? brick[(j % 4 === 0 ? 1 : 2)] : 0x2a1a14));
        for (let j = 0; j < 28; j++) {
          const half = j < 7 ? 2 : j < 12 ? 4 : 4 + Math.floor((j - 12) / 4);
          for (let i = -half; i <= half; i++) this.s(cx + i, top + 12 + j, j < 4 ? 0xe0b890 : j < 8 ? lapis[3 + (i & 1)] : j < 12 ? 0xe0b890 : (j - 12) % 3 === 0 ? 0xc8b48a : 0xece0c4);
        }
        for (let k = 0; k < 4; k++) this.r(cx - 3 + (k & 1), top + 5 + k * 2, 7 - (k & 1) * 2, 1, P.brass[k % 2 ? 3 : 5]);
        this.s(cx - 1, top + 14, 0x1a1418);
        this.s(cx + 1, top + 14, 0x1a1418);
        const tw = Math.min(24, PW - 8), tx = table(tw, 10, P.clay);
        this.r(tx + 3, Y - 10, 6, 3, P.straw[4]);
        this.vase(tx + tw - 5, Y - 8, 7, (t) => 2.6 - Math.abs(t - 0.4) * 2, P.clay);
        break;
      }
      case "maya": {
        // A carved stela painted red, glyph blocks down its side, a copal censer smoking before it.
        const sw = 18, sx = cx - 9, top = Y - 44, R = red;
        this.r(sx, top, sw, 42, (i, j) => (j === 0 ? R[5] : i === 0 ? R[4] : i === sw - 1 ? R[1] : i > sw - 6 && (j % 6 === 0 || i === sw - 6) ? R[1] : i > sw - 6 ? R[3] : R[2]));
        for (let k = 0; k < 6; k++) this.r(sx + sw - 5, top + 2 + k * 6, 3, 4, (i, j) => (i === 1 && j === 1 ? 0x1a3a5a : R[4]));
        this.saint(sx + 6, top + 8, 26, [0x0e2a3a, 0x1a4a5a, 0x2a6a7a, 0x3a8a8a, 0x5aaaa0, 0x8acac0], false);
        for (let k = 0; k < 7; k++) this.s(sx + 2 + k, top + 7 - (k % 2) * 2, P.leaf[4]);
        this.vase(cx, base, 8, (t) => 3.4 - Math.abs(t - 0.5) * 2, P.clay);
        this.r(cx - 3, base - 8, 7, 1, 0xd0602a);
        this.lights.push({ x: cx, y: base - 9, c: 0xff8a3a, rad: 30, k: 0.9, phase: q.seed % 70 });
        for (let k = 0; k < 3; k++) this.smoke.push({ x: cx - 1 + k, y: base - 10 });
        break;
      }
      default: {
        // Gothic: a painted triptych on the altar's back, the crucifixion at its heart; a frontal and candles.
        const rw = Math.min(40, PW - 6), rx = cx - (rw >> 1), ry = Y - 40, rh = 28, gold = P.brass;
        const cw = Math.round(rw * 0.4), sw = (rw - cw - 4) >> 1;
        this.r(rx, ry, rw, rh, (i, j) => (i === 0 || j === 0 ? gold[5] : i === rw - 1 || j === rh - 1 ? gold[1] : gold[3]));
        const panel = (px: number, pw: number, py: number, ph: number) => {
          for (let j = 0; j < ph; j++)
            for (let i = 0; i < pw; i++) {
              if (j < pw / 2 && Math.abs(i - (pw - 1) / 2) > j + 0.5) continue;
              this.s(px + i, py + j, hash(i, j, 9) < 0.04 ? gold[5] : lapis[2 + (j > ph * 0.6 ? 0 : 1)]);
            }
        };
        panel(rx + 2, sw, ry + 5, rh - 7);
        panel(rx + rw - 2 - sw, sw, ry + 5, rh - 7);
        panel(cx - (cw >> 1), cw, ry + 2, rh - 4);
        for (let k = 0; k < 5; k++) this.s(rx + Math.round((k * (rw - 1)) / 4), ry - 1 - (k === 2 ? 3 : 1), gold[5]);
        this.r(cx, ry + 6, 1, rh - 9, W[2]);
        this.r(cx - 4, ry + 10, 9, 1, W[2]);
        this.r(cx, ry + 10, 1, 7, 0xe8d0b0);
        this.r(cx - 3, ry + 10, 7, 1, 0xe8d0b0);
        this.saint(rx + 2 + (sw >> 1), ry + 10, 14, lapis);
        this.saint(rx + rw - 2 - (sw >> 1) - 1, ry + 10, 14, red);
        const tw = Math.min(34, PW - 8), tx = table(tw, 13, P.stone);
        cloth(tx, tw, Y - 11, 9, red);
        this.r(cx, Y - 9, 1, 5, gold[5]);
        this.r(cx - 2, Y - 8, 5, 1, gold[5]);
        this.taper(tx + 3, Y - 11, 6, q.seed);
        this.taper(tx + tw - 4, Y - 11, 6, q.seed + 5);
      }
    }
  }
  /** A sake flask, white glaze with a blue band. */
  private tokkuri(x: number, base: number, k: number) {
    const R = [0x3a4050, 0x8a909a, 0xb8bcc0, 0xd8dad8, 0xecebe4, 0xffffff];
    this.vase(x, base, 7, (t) => 2.4 - Math.abs(t - 0.3) * 2.6 + (t > 0.85 ? 0.4 : 0), R);
    this.r(x - 1, base - 4, 3, 1, k % 2 ? 0x2f4a8a : 0x4a6aa8);
  }
  /** A thimble of a sake cup. */
  private choko(x: number, base: number) {
    this.r(x, base - 2, 3, 2, (i, j) => (j === 0 ? 0xf2f0e8 : i === 2 ? 0x9aa0a8 : 0xd8dad8));
  }
  /** A calligraphy panel in a gilt frame: gold strokes on dark green. */
  private levha(x: number, y: number, w: number, h: number, seed: number) {
    const { P } = this;
    this.r(x, y, w, h, (i, j) => (i === 0 || j === 0 ? P.brass[4] : i === w - 1 || j === h - 1 ? P.brass[1] : 0x1e3a2e));
    for (let i = 2; i < w - 2; i++) {
      const j = Math.round(h / 2 + Math.sin(i * 0.9 + seed) * (h / 4));
      this.s(x + i, y + j, P.brass[5]);
      if (i % 3 === 0) this.s(x + i, y + j - 2, P.brass[4]);
    }
  }
  /** What stands on a low table where drink is served: flasks and cups, or a tray of coffee. */
  private lowBoard(x0: number, y0: number, seed: number) {
    const { P } = this;
    if ((this.p.styles.bar ?? "ale") === "coffee") {
      this.r(x0 + 3, y0 + 1, 11, 3, (i, j) => (j === 0 ? P.brass[5] : i === 0 || i === 10 ? P.brass[2] : P.brass[4]));
      for (const dx of [5, 9]) this.r(x0 + dx, y0, 2, 2, (_i, j) => (j === 0 ? P.linen[5] : P.acc[3]));
      if (seed % 2) this.vase(x0 + 13, y0 + 2, 5, (t) => 1.8 - t * 0.6, P.brass);
      return;
    }
    this.tokkuri(x0 + 5, y0 + 4, seed);
    this.choko(x0 + 9, y0 + 3);
    this.r(x0 + 13, y0 - 3, 3, 5, (i, j) => (j === 0 || j === 4 ? P.wood[1] : i === 2 ? P.paper[3] : P.paper[5]));
    this.lights.push({ x: x0 + 14, y: y0 - 2, c: 0xffc070, rad: 34, k: 0.8, phase: seed % 70 });
    if (seed % 2) this.choko(x0 + 12, y0 + 4);
    this.r(x0 + 2, y0 + 3, 2, 1, 0x8a5a3a);
  }
  /** What stands on a tavern board: pots, a jug, the candle, a pipe, a spill. */
  private tavernBoard(X: number, ty: number, PW: number, seed: number) {
    const { P } = this;
    const slots = Math.floor((PW - 8) / 9);
    const lamp = Math.floor(slots / 2);
    for (let k = 0; k < slots; k++) {
      const x = X + 5 + k * 9 + Math.floor(hash(k, 1, seed) * 3), b = ty + 5 + (k & 1);
      const pick = hash(k, 2, seed);
      if (k === lamp) this.candle(x + 2, b, seed + k);
      else if (pick < 0.45) this.mug(x, b, pick < 0.3 ? 0 : 1);
      else if (pick < 0.6) this.jug(x + 3, b + 1);
      else if (pick < 0.75) {
        for (let i = 0; i < 7; i++) this.s(x + i, b - 1 - (i >> 2), P.linen[5]);
        this.s(x + 6, b - 3, P.linen[4]);
      } else if (pick < 0.85) this.dim(x, b - 3, 5, 2, 0.82);
    }
  }
  /** Blit a hand-drawn sprite at (x, y), its letters resolved to this room's ramps. */
  private sprite(name: string, x: number, y: number, over: Record<string, number[]> = {}, swap: Record<string, string> = {}) {
    const P = this.P as unknown as Record<string, number[]>;
    const band = this.p.finish === 0 ? this.P.straw : this.p.finish === 2 ? this.P.brass : this.P.iron;
    const rows = SPRITES[name] ?? WIDE.get(name)!;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = swap[row[i]] ?? row[i];
        if (ch === ".") continue;
        if (ch === "#") {
          this.s(x + i, y + j, 0x22161a);
          continue;
        }
        const [ramp, k] = LETTERS[ch];
        this.s(x + i, y + j, (over[ramp] ?? (ramp === "band" ? band : P[ramp]))[k]);
      }
    });
    return rows.length;
  }
  /** The top of the wall behind a piece: where a flue or a hanging line meets the ceiling. */
  private ceiling(q: Prop) {
    const { w } = this.plan;
    let y = q.y;
    while (y > 0 && this.mask[(y - 1) * w + q.x]) y--;
    return this.oy + y * T - WH;
  }
  /** The shape of someone asleep under the covers, their head (drawn by the
   * scene) on the bolster at (hx, hy): a lit ridge rising and falling as they
   * breathe, a shaded flank, the sheet turned down at the shoulder. */
  private sleeper(hx: number, hy: number, cover: number[], len: number) {
    const { P } = this;
    const breath = Math.sin(this.t * 1.7 + hx * 0.3) > 0.2 ? 1 : 0;
    for (let i = 0; i < len; i++) {
      const x = hx + 7 + i, chest = i < len * 0.45 ? breath : 0, taper = i > len - 3 ? 1 : 0;
      this.s(x, hy - 2 - chest + taper, cover[5]);
      this.s(x, hy - 1 - chest + taper, cover[4]);
      for (let j = hy - chest + taper; j <= hy + 3; j++) this.s(x, j, cover[j > hy + 2 ? 2 : 3]);
      this.s(x, hy + 4, cover[1]);
    }
    for (let j = -3; j <= 4; j++) {
      this.s(hx + 5, hy + j, P.linen[j === -3 ? 5 : 4]);
      this.s(hx + 6, hy + j, P.linen[j === 4 ? 2 : 3]);
    }
    this.zz.push({ x: hx + 3, y: hy - 13 });
  }
  /** A sprite rocked to one side, or lying where it fell. */
  private fallen(name: string, x: number, y: number, q: Prop) {
    const rows = SPRITES[name], h = rows.length, P = this.P as unknown as Record<string, number[]>;
    const side = q.lean ?? (q.seed % 2 ? 1 : -1);
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === ".") continue;
        const [ramp, k] = LETTERS[row[i]];
        // Fallen, the seat faces sideways and the legs point along the floor.
        const [px, py] = q.tipped
          ? [side > 0 ? x + 2 + j : x + row.length - 3 - j, y + h - row.length + i + 1]
          : [x + i + side * Math.round((h - 1 - j) / 4), y + j + (j < 3 ? 1 : 0)];
        this.s(px, py, P[ramp][k]);
      }
    });
  }
  /** What is left of a piece after the axe: boards, shards or a slumped heap. */
  private wreck(q: Prop) {
    const { P } = this, X = S + q.x * T, Y = this.oy + q.y * T, w = q.w * T, d = Math.max(1, q.d) * T;
    const clay = ["jars", "claybin", "plant"].includes(q.kind), soft = ["basket", "sacks", "pack"].includes(q.kind);
    const R = clay ? P.clay : soft ? P.straw : P.wood;
    this.dim(X + 1, Y + d - 9, w - 2, 7, 0.78);
    const n = clay ? 9 * q.w : soft ? 4 * q.w : 5 * q.w + 2;
    for (let k = 0; k < n; k++) {
      const cx = X + 3 + hash(k, 1, q.seed) * (w - 8), cy = Y + d - 10 + hash(k, 2, q.seed) * 7;
      if (clay) {
        // Curved shards, bright on the broken edge.
        const len = 2 + ((hash(k, 3, q.seed) * 3) | 0);
        for (let i = 0; i < len; i++) {
          this.s(cx + i, cy - (i === 0 || i === len - 1 ? 0 : 1), R[i === 0 ? 5 : 3]);
          this.s(cx + i, cy + 1, R[1]);
        }
        continue;
      }
      const a = (hash(k, 3, q.seed) - 0.5) * (soft ? 0.5 : 1.5), len = (soft ? 6 : 5) + hash(k, 4, q.seed) * (soft ? 5 : 7);
      for (let i = 0; i < len; i++) {
        const x = cx + Math.cos(a) * i, y = cy + Math.sin(a) * i * 0.6;
        this.s(x, y - 1, R[i < 1 ? 5 : 4]);
        this.s(x, y, R[soft ? 3 : 2 + (k % 2)]);
        this.s(x, y + 1, R[1]);
      }
      // A split end, paler where the wood tore.
      if (!soft) this.s(cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.6 - 1, P.linen[4]);
    }
  }
  private disc(cx: number, cy: number, rr: number, R: number[]) {
    for (let j = -rr; j <= rr; j++)
      for (let i = -rr; i <= rr; i++) {
        const q = i * i + j * j;
        if (q > rr * rr + rr * 0.6) continue;
        const k = (i + j) / (2 * rr + 0.01);
        this.s(cx + i, cy + j, R[q > (rr - 1) * (rr - 1) + 1 ? 1 : k < -0.35 ? 5 : k < 0 ? 4 : k < 0.4 ? 3 : 2]);
      }
  }

  private paint() {
    const { p, P, W, H, oy } = this;
    this.col.fill(0x120d16);
    this.ids.fill(-1);
    this.glow.fill(0);
    this.lights = [];
    this.fires = [];
    this.flames = [];
    this.beams = [];
    this.smoke = [];
    this.zz = [];
    this.notes = [];
    this.cur = -1;
    const { mask } = this, w = p.w, d = p.d;
    const inside = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < w && cy < d && mask[cy * w + cx] > 0;
    const solid = new Uint8Array(W * H);
    const { cells, rooms } = this.plan;
    for (const r of rooms) r.hour = p.hour;
    for (let cy = 0; cy < d; cy++)
      for (let cx = 0; cx < w; cx++) {
        if (!inside(cx, cy)) continue;
        const rp = rooms[Math.max(0, cells[cy * w + cx])], P = this.palettes[Math.max(0, cells[cy * w + cx])], court = courtParams(rp);
        const soft = rp.floorPattern === "carpet" || rp.floorPattern === "mat" || rp.floorPattern === "paper";
        const earthy = rp.floorPattern === "earth" || rp.floorPattern === "sand" || rp.floorPattern === "rushes";
        const n = !inside(cx, cy - 1), so = !inside(cx, cy + 1), we = !inside(cx - 1, cy), ea = !inside(cx + 1, cy);
        for (let j = 0; j < T; j++)
          for (let i = 0; i < T; i++) {
            const u = cx * T + i, v = cy * T + j;
            const open = mask[cy * w + cx] === 2;
            let c = floorColor(open ? court : rp, P, u, v);
            const wv = soft ? 0 : this.wearAt(u, v);
            if (wv > 0.04) c = mix(c, earthy ? P.floor[3] : P.floor[4], Math.min(0.25, wv * (0.12 + rp.wear * 0.25)));
            if (open) {
              // A kerb where the court meets the roofed floor, and the eave's shadow on it.
              const rn = cy > 0 && mask[(cy - 1) * w + cx] === 1, rs = cy < d - 1 && mask[(cy + 1) * w + cx] === 1;
              const rw = cx > 0 && mask[cy * w + cx - 1] === 1, re = cx < w - 1 && mask[cy * w + cx + 1] === 1;
              if ((rn && j < 2) || (rs && j > T - 3) || (rw && i < 2) || (re && i > T - 3)) c = mix(c, (rn && j === 0) || (rw && i === 0) ? P.stone[4] : P.stone[2], 0.4);
              else if (rn && j < 6) c = scale(c, 0.82);
            }
            const e = Math.min(n ? j : 9, so ? T - 1 - j : 9, we ? i : 9, ea ? T - 1 - i : 9);
            if (e < 4) c = scale(c, 0.72 + e * 0.07);
            this.s(S + u, oy + v, c);
            solid[(oy + v) * W + S + u] = 1;
          }
      }
    this.decals(inside);
    if (p.finish === 2 && ["tile", "terrazzo", "parquet", "plank", "flag"].includes(p.floorPattern)) this.inlay(inside);
    // A back wall stands on every floor cell with nothing behind it, so an L,
    // a round room or a room behind another gets its own stepped wall line;
    // its ends shade where the next column's wall differs.
    const walled = (cx: number, cy: number) => inside(cx, cy) && !inside(cx, cy - 1);
    for (let cy = 0; cy < d; cy++)
      for (let cx = 0; cx < w; cx++) {
        if (!walled(cx, cy)) continue;
        const ri = Math.max(0, cells[cy * w + cx]), rp = rooms[ri], P = this.palettes[ri];
        const base = oy + cy * T, lEdge = !walled(cx - 1, cy), rEdge = !walled(cx + 1, cy);
        for (let j = 0; j < WH; j++)
          for (let i = 0; i < T; i++) {
            let c = wallColor(rp, P, cx * T + i, j);
            if ((lEdge && i < 2) || (rEdge && i > T - 3)) c = scale(c, 0.55 + 0.35 * (j / WH));
            this.s(S + cx * T + i, base - 1 - j, c);
            solid[(base - 1 - j) * W + S + cx * T + i] = 1;
          }
      }
    this.threshold(solid);
    this.caps(solid);
    this.doorways();
    const sunNow = sun(p.hour);
    this.wallDamage(sunNow.strength);
    this.tileDamage();
    for (const q of this.props) if (q.kind === "rug") (this.inRoom(q.room), this.rug(q));
    for (const q of this.props)
      if (q.kind === "clutter") {
        this.cur = q.id;
        this.inRoom(q.room);
        this.clutterItem(q, S + q.x * T, oy + q.y * T);
      }
    this.cur = -1;
    this.outOfRoom();
    for (const f of this.floorSleepers) {
      const X = S + f.x * T, Y = oy + f.y * T;
      // A straw tick, longer than the tile: whoever lies on it is taller than one.
      this.dim(X - 3, Y + 13, T + 8, 3, 0.75);
      this.sprite("pallet", X - 4, Y + 6);
      const at = this.pillow(f);
      this.sleeper(at.x, at.y, P.pale, 13);
    }
    for (const q of this.props) if (q.kind === "hearth") (this.inRoom(q.room), this.hearthSlab(q));
    this.outOfRoom();
    for (const q of this.props) {
      if (q.wall || q.wrecked || q.kind === "rug" || q.kind === "cat" || q.kind === "clutter") continue;
      const X = S + q.x * T, Y = oy + (q.y + q.d) * T;
      if (this.lighting !== "smooth") {
        this.contact(X + (q.w * T) / 2, Y - 3, q.w * T * 0.46, 3.2);
        continue;
      }
      this.dim(X, Y - 4, q.w * T, 5, 0.72);
      this.dim(X + 1, Y - 6, q.w * T - 2, 2, 0.86);
    }
    for (const d of this.debris) if (d.rest) this.s(d.x, d.y, d.c);
    const order = this.props
      .filter((q) => q.kind !== "rug" && q.kind !== "clutter")
      .sort((a, b) => (a.wall === b.wall ? a.y + a.d - (b.y + b.d) || (a.kind === "cat" ? 1 : 0) - (b.kind === "cat" ? 1 : 0) : a.wall ? -1 : 1));
    for (const q of order) {
      this.cur = q.id;
      this.inRoom(q.room);
      if (q.wrecked) this.wreck(q);
      else this.draw(q, sunNow);
    }
    this.cur = -1;
    this.outOfRoom();
    for (const d of this.debris) if (!d.rest) this.s(d.x, d.y, d.c);
  }

  /** Wall tops: a band around the floor and the wall faces, cut where the
   * walls stand between room and viewer. */
  private wearAt(u: number, v: number) {
    const { p, worn } = this, gx = u / T - 0.5, gy = v / T - 0.5;
    const x0 = Math.max(0, Math.floor(gx)), y0 = Math.max(0, Math.floor(gy)), x1 = Math.min(p.w - 1, x0 + 1), y1 = Math.min(p.d - 1, y0 + 1);
    const fx = Math.min(1, Math.max(0, gx - x0)), fy = Math.min(1, Math.max(0, gy - y0));
    const a = worn[y0 * p.w + x0], b = worn[y0 * p.w + x1], c = worn[y1 * p.w + x0], d = worn[y1 * p.w + x1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  /** The way in, at the foot of the room as outside: a gap in the wall top
   * with a step down, posts either side, and a mat or a flap by the kind of door. */
  private threshold(solid: Uint8Array) {
    const [ex, ey] = this.plan.entrance;
    if (ex < 0) return;
    const ri = Math.max(0, this.plan.cells[ey * this.plan.w + ex]), rp = this.plan.rooms[ri], P = this.palettes[ri], W = P.wood;
    const X = S + ex * T, Y = this.oy + (ey + 1) * T;
    const step = rp.door === "door" ? P.stone : rp.door === "opening" ? P.floor : W;
    for (let j = 0; j < S; j++)
      for (let i = -1; i < T + 1; i++) {
        const x = X + i, y = Y + j;
        if (x < 0 || y >= this.H) continue;
        const c = i < 1 || i > T - 2 ? P.trim[i < 1 ? 4 : 1] : j === 0 ? step[5] : j < 3 ? step[3] : j < 6 ? step[2] : step[1];
        this.s(x, y, c);
        solid[y * this.W + x] = 1;
      }
    if (rp.door === "flap" || rp.door === "curtain") {
      // Hide or cloth tied back to either side of the opening.
      const C = rp.door === "flap" ? P.pale : P.acc;
      for (let j = 0; j < 9; j++) {
        this.r(X - 3, Y - 6 + j, 4 - (j >> 2), 1, C[j < 2 ? 4 : 3]);
        this.r(X + T - 1 + (j >> 2), Y - 6 + j, 4 - (j >> 2), 1, C[j < 2 ? 3 : 2]);
      }
    } else if (rp.door === "door") {
      // A rush mat inside the door.
      this.r(X + 2, Y - 8, T - 4, 6, (i, j) => (j === 0 || j === 5 || i === 0 || i === T - 5 ? P.straw[2] : (i + j) % 2 ? P.straw[3] : P.straw[4]));
    }
  }
  /** Doorways between rooms: posts and a lintel where one runs through a
   * wall, a curtain where the house hangs one, a door stood open onto a
   * private room. */
  private doorways() {
    for (const dw of this.plan.doorways) {
      const P = this.palettes[dw.to], rp = this.plan.rooms[dw.to], W = P.wood;
      const xs = dw.cells.map((c) => c[0]), ys = dw.cells.map((c) => c[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), wide = (Math.max(...xs) - x0 + 1) * T;
      const X = S + x0 * T, foot = this.oy + (y1 + 1) * T;
      // Through a back wall the frame is a wall's height; through a side wall, the doorway's own.
      const upright = new Set(xs).size > 1 || ys.length > 2;
      const tall = upright ? WH : (y1 - y0 + 1) * T, head = foot - tall;
      for (const jx of [X, X + wide - 2]) this.r(jx, head, 2, tall, (i) => P.trim[jx === X ? (i ? 3 : 4) : i ? 1 : 2]);
      this.r(X - 1, head - 3, wide + 2, 3, (_i, j) => P.trim[j === 0 ? 5 : j === 2 ? 1 : 3]);
      this.r(X + 2, foot - 2, wide - 4, 2, (_i, j) => P.stone[j ? 2 : 4]);
      if (dw.private) {
        // A plank door, swung open against the frame.
        this.r(X + 2, head + 1, 5, tall - 3, (i, j) => (j % 9 === 0 ? W[1] : W[i === 0 ? 4 : i === 4 ? 1 : 3]));
        this.s(X + 6, head + (tall >> 1), P.iron[4]);
      } else if (rp.door === "curtain" || rp.door === "flap" || rp.seating === "floor") {
        const C = rp.door === "flap" ? P.pale : P.acc;
        for (let j = 0; j < Math.min(tall - 4, 20); j++) {
          const pull = Math.round((j / 20) * 4);
          this.r(X + 2, head + j, 6 - pull, 1, C[j % 4 === 0 ? 4 : 3]);
          this.r(X + wide - 8 + pull, head + j, 6 - pull, 1, C[j % 4 === 0 ? 3 : 2]);
        }
      }
    }
  }
  private caps(solid: Uint8Array) {
    const { W, H, P } = this, R = 7;
    const near = new Uint8Array(W * H), row = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let hit = 0;
        for (let i = Math.max(0, x - R); i <= Math.min(W - 1, x + R) && !hit; i++) hit = solid[y * W + i];
        row[y * W + x] = hit;
      }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let hit = 0;
        for (let j = Math.max(0, y - R); j <= Math.min(H - 1, y + R) && !hit; j++) hit = row[j * W + x];
        near[y * W + x] = hit;
      }
    const at = (a: Uint8Array, x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && a[y * W + x] === 1;
    // A thick wall top, as in Stardew: a dark outer line, a bevel lit from the
    // upper left, a flat face, and a shadow where it meets the room.
    const rim = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (near[y * W + x] && !solid[y * W + x] && (!at(near, x - 1, y) || !at(near, x + 1, y) || !at(near, x, y - 1) || !at(near, x, y + 1))) rim[y * W + x] = 1;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (solid[i] || !near[i]) continue;
        const touch = at(solid, x - 1, y) || at(solid, x + 1, y) || at(solid, x, y - 1) || at(solid, x, y + 1);
        let c: number;
        if (rim[i]) c = mix(P.trim[0], 0x0c0810, 0.5);
        else if (touch) c = P.trim[1];
        else if (at(rim, x, y - 1) || at(rim, x - 1, y)) c = P.trim[5];
        else if (at(rim, x, y + 1) || at(rim, x + 1, y)) c = P.trim[2];
        else if (at(solid, x, y + 2) || at(solid, x, y - 2) || at(solid, x + 2, y) || at(solid, x - 2, y)) c = P.trim[2];
        else c = hash(x >> 1, y >> 1, 5) < 0.06 ? P.trim[2] : P.trim[3];
        this.s(x, y, c);
      }
  }
  /** Small deliberate things on natural floors: pebbles, twigs, strewn rush
   * stalks, a sprig of strewing herb. Each has its own lit side and shadow. */
  private decals(inside: (x: number, y: number) => boolean) {
    const { p, P, oy } = this, fp = p.floorPattern;
    if (fp !== "earth" && fp !== "rushes" && fp !== "sand") return;
    const F = P.floor, cell = fp === "rushes" ? 8 : 9;
    const at = (x: number, y: number, c: number) => {
      const cx = Math.floor(x / T), cy = Math.floor(y / T);
      if (inside(cx, cy) && this.mask[cy * p.w + cx] === 1) this.s(S + x, oy + y, c);
    };
    for (let gy = 0; gy < (p.d * T) / cell; gy++)
      for (let gx = 0; gx < (p.w * T) / cell; gx++) {
        const h = hash(gx, gy, p.seed + 21), x = gx * cell + Math.floor(hash(gx, gy, p.seed + 22) * cell), y = gy * cell + Math.floor(hash(gx, gy, p.seed + 23) * cell);
        // Rushes lie mostly one way, as if swept, with a few across them.
        if (fp === "rushes" && h < 0.09) {
          const a = (hash(gx, gy, p.seed + 24) - 0.5) * 0.7 + (h < 0.08 ? Math.PI / 2.2 : 0.35), len = 4 + Math.floor(hash(gx, gy, p.seed + 25) * 4);
          for (let k = 0; k < len; k++) {
            const px = Math.round(x + Math.cos(a) * k), py = Math.round(y + Math.sin(a) * k * 0.7);
            at(px, py + 1, mix(F[1], F[2], 0.5));
            at(px, py, mix(k < len / 2 ? P.straw[4] : P.straw[3], F[3], 0.35));
          }
          if (h < 0.04) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, -1]]) at(x + dx, y + dy, P.linen[5]);
        } else if (h > 0.16 && h < 0.172) {
          at(x, y, P.stone[4]);
          at(x + 1, y, P.stone[3]);
          at(x, y + 1, P.stone[2]);
          at(x + 1, y + 1, P.stone[2]);
          at(x + 1, y + 2, F[1]);
          at(x + 2, y + 1, F[1]);
        } else if (h > 0.2 && h < 0.205) {
          for (let k = 0; k < 5; k++) {
            at(x + k, y + (k >> 1), P.wood[k === 0 ? 4 : 2]);
            at(x + k, y + (k >> 1) + 1, F[1]);
          }
        } else if (h > 0.3 && h < 0.3 && fp !== "sand") {
          at(x, y, P.straw[4]);
          at(x + 1, y + 1, P.straw[4]);
          at(x + 2, y + 1, P.straw[3]);
        }
      }
  }
  /** Elite floors: a border inlaid a tile in from the walls. */
  private inlay(inside: (x: number, y: number) => boolean) {
    const { P, p, oy } = this;
    for (let cy = 0; cy < p.d; cy++)
      for (let cx = 0; cx < p.w; cx++) {
        if (!inside(cx, cy) || this.mask[cy * p.w + cx] === 2) continue;
        const ring = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([a, b]) => !inside(cx + a, cy + b));
        if (ring) continue;
        const nearWall = [[0, -2], [0, 2], [-2, 0], [2, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a, b]) => !inside(cx + a, cy + b));
        if (!nearWall) continue;
        for (let j = 0; j < T; j++)
          for (let i = 0; i < T; i++) {
            const e = (i + j) % 8;
            if ((j === 7 || i === 7) && e < 4) {
              const at = (oy + cy * T + j) * this.W + S + cx * T + i;
              this.s(S + cx * T + i, oy + cy * T + j, mix(this.col[at], e < 2 ? P.acc[3] : P.trim[4], 0.45));
            }
          }
      }
  }

  private wallDamage(day: number) {
    const { p } = this;
    const fw = p.w * T;
    for (const h of this.walls) {
      const chip = 2.5 + h.hits * 2.2, hole = h.hits >= 3 ? (h.hits - 2) * 3 : 0;
      for (let k = 0; k < 2 + h.hits * 2; k++) {
        let a = hash(k, 0, h.seed) * Math.PI * 2, x = h.u, y = h.v;
        const len = chip * (1.3 + hash(k, 1, h.seed) * 1.6);
        for (let s = 0; s < len; s++) {
          a += (hash(k, s, h.seed) - 0.5) * 0.9;
          x += Math.cos(a);
          y += Math.sin(a);
          if (x >= 0 && x < fw && y >= 0 && y < WH) this.dim(S + x, h.base - 1 - y, 1, 1, 0.55);
        }
      }
      const R = Math.ceil(chip + 2);
      for (let dv = -R; dv <= R; dv++)
        for (let du = -R; du <= R; du++) {
          const u = h.u + du, v = h.v + dv;
          if (u < 0 || u >= fw || v < 0 || v >= WH) continue;
          const d = Math.hypot(du, dv) + (hash(u, v, h.seed) - 0.5) * 2.2;
          const sx = S + u, sy = h.base - 1 - v;
          if (d < hole) this.g(sx, sy, v < 9 ? mix(0x1e2a1a, 0x6f9a4a, day) : sky(p.hour, 1 - v / WH));
          else if (hole && d < hole + 1.3) this.s(sx, sy, 0x241814);
          else if (d < chip) this.s(sx, sy, this.core(u, v, h.seed));
          else if (d < chip + 1) this.dim(sx, sy, 1, 1, 0.72);
        }
    }
  }
  /** What a wall is made of under its face: lath behind plaster, the brick
   * core behind brick, wattle behind a timber frame's infill. */
  private core(u: number, v: number, seed: number) {
    const { P, p } = this;
    if (p.wallPattern === "brick") {
      const row = v >> 2, bu = (u + (row & 1) * 4) & 7;
      return (v & 3) === 0 || bu === 0 ? P.stone[2] : P.clay[1 + (hash((u + (row & 1) * 4) >> 3, row, seed) < 0.5 ? 0 : 1)];
    }
    if (p.wallPattern === "timber") return ((u >> 1) + (v >> 1)) & 1 ? P.straw[2] : P.wood[1];
    return v % 3 === 0 ? 0x22160f : P.wood[2 + (hash(u >> 3, v, seed) < 0.4 ? 1 : 0)];
  }
  private tileDamage() {
    const { p, P, oy } = this;
    const bed = (u: number, v: number) =>
      p.floorPattern === "plank" ? (hash(u, v, 2) < 0.5 ? 0x1e140e : 0x2e2016)
        : p.floorPattern === "earth" ? scale(P.floor[1], 0.7)
          : p.floorPattern === "mat" ? P.straw[2 + (hash(u, v, 2) < 0.4 ? 1 : 0)]
            : hash(u, v, 2) < 0.25 ? P.stone[2] : P.pale[1];
    for (const h of this.tiles.values()) {
      const cu = h.u & ~7, cv = h.v & ~7;
      const inCell = (u: number, v: number) => u > cu && u < cu + 8 && v > cv && v < cv + 8;
      if (h.hits >= 3) {
        for (let v = cv + 1; v < cv + 8; v++)
          for (let u = cu + 1; u < cu + 8; u++) {
            const e = Math.min(u - cu, v - cv, cu + 8 - u, cv + 8 - v);
            // A pit: shadowed under its top and left rims, the far lip catching light.
            const shard = e === 1 && hash(u, v, h.seed) < 0.3;
            let c = shard ? P.floor[4] : hash(u, v, h.seed + 1) < 0.1 ? P.stone[4] : scale(bed(u, v), 0.62);
            if (!shard && (v <= cv + 2 || u <= cu + 1)) c = scale(c, 0.55);
            if (!shard && v === cv + 7) c = mix(c, 0xffffff, 0.18);
            this.s(S + u, oy + v, c);
          }
        continue;
      }
      for (let k = 0; k < h.hits * 2; k++) {
        let a = hash(k, 0, h.seed) * Math.PI * 2, x = h.u, y = h.v;
        for (let s = 0; s < 9; s++) {
          if (!inCell(Math.round(x), Math.round(y))) break;
          this.s(S + x, oy + y, 0x2a1810);
          if (inCell(Math.round(x), Math.round(y) + 1)) this.s(S + x, oy + y + 1, P.floor[5]);
          a += (hash(k, s, h.seed) - 0.5) * 0.8;
          x += Math.cos(a);
          y += Math.sin(a);
        }
      }
      if (h.hits >= 2) {
        const a = hash(0, 0, h.seed) * Math.PI * 2;
        for (let v = cv + 1; v < cv + 8; v++)
          for (let u = cu + 1; u < cu + 8; u++) {
            if ((u - h.u) * Math.cos(a) + (v - h.v) * Math.sin(a) > 0) this.dim(S + u, oy + v, 1, 1, 0.84);
            if (Math.hypot(u - h.u, v - h.v) < 1.6) this.s(S + u, oy + v, bed(u, v));
          }
      }
    }
  }

  private rug(q: Prop) {
    this.cur = q.id;
    const X = S + q.x * T + 2, Y = this.oy + q.y * T + 2, w = q.w * T - 4, h = q.d * T - 4;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if ((j === 0 || j === h - 1) && i % 2) continue;
        this.s(X + i, Y + j, carpetColor(i, j, w, h, q.seed));
      }
  }

  private hearthSlab(q: Prop) {
    const { P } = this, oy = this.oy + q.y * T;
    this.cur = q.id;
    const X = S + q.x * T - 3, w = q.w * T + 6;
    this.r(X, oy + 10, w, 11, (i, j) => {
      const sx = (i + (j >> 2) * 5) % 9, crack = sx === 0 || j % 4 === 0;
      return crack ? P.stone[1] : j === 0 ? P.stone[4] : P.stone[hash((i + (j >> 2) * 5) / 9 | 0, j >> 2, 3) < 0.5 ? 3 : 2];
    });
    for (let i = 0; i < 5; i++) this.s(X + 5 + hash(i, 1, q.seed) * (w - 10), oy + 12 + hash(i, 2, q.seed) * 7, P.stone[0]);
  }

  private draw(q: Prop, sunNow: ReturnType<typeof sun>) {
    const { P, p } = this;
    // Wall pieces sit on their own column's wall line.
    const oy = this.oy + (q.wall ? q.y * T : 0);
    const X = S + q.x * T, Y = this.oy + q.y * T, PW = q.w * T, PD = q.d * T;
    const pr = this.prog.get(q.id) ?? 0;
    const W = P.wood;
    switch (q.kind) {
      case "door": {
        if (p.door !== "door") {
          this.doorway(q, X + 1, oy, p.door === "opening" ? 1 : pr, sunNow);
          break;
        }
        const x0 = X + 1, top = oy - 33;
        this.r(x0 - 2, top - 3, 18, 36, (i, j) => (j < 3 ? P.trim[j === 0 ? 4 : 2] : i < 2 || i > 15 ? P.trim[i === 0 || i === 17 ? 1 : 3] : P.trim[1]));
        const day = sunNow.strength;
        for (let j = 0; j < 33; j++)
          for (let i = 0; i < 14; i++) {
            const v = j / 33, horizon = 18 + Math.round(2 * Math.sin((i + q.seed) * 0.7));
            let c = j < horizon ? sky(p.hour, v * 1.6) : mix(mix(0x20301c, 0x7fa150, day), 0xb89a6a, Math.abs(i - 7) < 3 - (j - horizon) * -0.2 ? 0.7 : 0);
            if (j < horizon && (p.hour > 20 || p.hour < 5) && hash(i, j, 77) < 0.03) c = 0xfff4d0;
            this.g(x0 + i, top + j, c);
          }
        const lw = Math.round(14 * (1 - pr));
        for (let j = 0; j < 33; j++)
          for (let i = 0; i < lw; i++) {
            const plank = ((i * 14) / Math.max(1, lw)) | 0;
            let c = plank % 4 === 3 ? W[1] : W[2 + (hash(plank, 0, q.seed) < 0.5 ? 0 : 1)];
            if (j === 6 || j === 26) c = i < lw - 2 ? P.iron[2] : c;
            if (hash(plank, j >> 2, q.seed) < 0.08) c = W[1];
            this.s(x0 + i, top + j, scale(c, 1 - pr * 0.4));
          }
        if (lw > 4) {
          this.s(x0 + lw - 3, top + 17, P.iron[4]);
          this.s(x0 + lw - 3, top + 18, P.iron[1]);
        }
        this.r(x0 - 1, oy - 1, 16, 2, P.stone[4]);
        if (pr > 0.02) {
          this.beams.push({ x0: x0, x1: x0 + 14, top: oy - 2, floor: oy, len: 38, skew: 0, k: pr * (0.25 + day * 0.9), c: mix(0x8aa0d8, sunNow.color, day) });
          this.lights.push({ x: x0 + 7, y: oy - 10, c: mix(0x5a6ab0, 0xfff0dc, day), rad: 40, k: pr * (0.15 + day * 0.5), phase: -1 });
        }
        break;
      }
      case "window": {
        if (p.windowStyle === "stained") {
          this.lancet(X + 3, oy - 44, 10, 34, q.seed, sunNow);
          break;
        }
        const x0 = X + 3, top = oy - 38, h = 22;
        const style = p.windowStyle === "lattice" ? 1 : p.windowStyle === "shoji" ? 2 : 0, open = style ? 1 : pr;
        this.r(x0 - 1, top - 1, 12, h + 2, P.trim[1]);
        for (let j = 0; j < h; j++)
          for (let i = 0; i < 10; i++) {
            const hill = 14 + Math.round(3 * Math.sin((i + q.seed % 7) * 0.5) + 2 * Math.sin(i * 1.3));
            let c = sky(p.hour, j / h);
            if (j > hill) c = mix(mix(0x1a2436, 0x6c8f5a, sunNow.strength), c, 0.25);
            if ((p.hour > 20 || p.hour < 5) && hash(i, j, q.seed) < 0.05 && j < hill) c = 0xfff2c8;
            if (!q.broken && (i - j + 40) % 9 < 1) c = mix(c, 0xffffff, 0.3);
            if (q.broken) {
              // Shards left in the corners of each pane, jagged toward the middle.
              const pi = i < 5 ? i : 9 - i, pj = j < 11 ? j : h - 1 - j;
              if (pi + pj < 2 + hash(i, j, q.seed) * 3) c = mix(c, 0xd8ecf4, 0.55);
            }
            if (style === 1 && ((i + j) % 3 === 0 || (i - j + 30) % 3 === 0)) this.s(x0 + i, top + j, W[(i + j) % 2 ? 2 : 3]);
            else if (style === 2) this.g(x0 + i, top + j, i % 5 === 0 || j % 6 === 0 ? P.trim[3] : mix(P.paper[5], c, 0.2));
            else if (i === 4 || i === 5 || j === 10) this.s(x0 + i, top + j, P.trim[j === 10 || i === 4 ? 4 : 2]);
            else this.g(x0 + i, top + j, c);
          }
        this.r(x0 - 2, top + h + 1, 14, 2, (_i, j) => P.trim[j === 0 ? 5 : 2]);
        this.r(x0 - 2, top - 2, 14, 1, P.trim[3]);
        if (q.seed % 3 === 0) {
          this.r(x0, top + h - 2, 10, 3, W[2]);
          for (let i = 0; i < 10; i++) {
            const f = hash(i, 0, q.seed);
            this.s(x0 + i, top + h - 3 - (f * 3 | 0), P.leaf[2 + (i & 1)]);
            if (f > 0.6) this.s(x0 + i, top + h - 5 - (f * 2 | 0), [P.acc[4], 0xf4e6f0, P.acc3[4]][i % 3]);
          }
        }
        const leaf = (lx: number) =>
          this.r(lx, top, 5, h, (i, j) => (i === 0 || i === 4 ? W[1] : j % 3 === 0 ? W[2] : W[3 + (hash(i, j, q.seed) < 0.1 ? 1 : 0)]));
        if (q.broken)
          for (const lx of [x0 - 7, x0 + 12])
            for (let j = 0; j < h; j++) if (hash(lx, j >> 2, q.seed) < 0.55) this.r(lx + (j % 3), top + j, 5 - (j % 3) - ((hash(j, 1, q.seed) * 3) | 0), 1, W[(j & 1) + 2]);
        if (q.broken) this.r(x0 - 1, top + h, 12, 1, 0xcfe4ee);
        if (!q.broken && style === 0) {
          leaf(Math.round(x0 - 7 * pr));
          leaf(Math.round(x0 + 5 + 7 * pr));
        }
        const moon = p.hour > 20 || p.hour < 4.5;
        if (open > 0.02 && moon && style !== 2) {
          const len = 44, skew = ((p.hour + 12) % 24 - 12) * -2.5;
          this.beams.push({ x0: x0, x1: x0 + 10, top, floor: oy, len, skew, k: open * 0.35, c: 0x9fb4f0, sill: top + h, style });
        }
        if (open > 0.02 && sunNow.strength > 0) {
          const len = 20 + (1 - sunNow.dir[2]) * 46, skew = (sunNow.dir[0] / Math.max(0.2, -sunNow.dir[1])) * len * -0.6;
          this.beams.push({ x0: x0, x1: x0 + 10, top, floor: oy, len, skew, k: open * sunNow.strength * [1.1, 0.55, 0.35][style], c: sunNow.color, sill: top + h, style });
        }
        this.lights.push({ x: x0 + 5, y: top + 11, c: mix(0x404a88, 0xbcd8ff, sunNow.strength), rad: 44, k: open * (0.1 + sunNow.strength * 0.35), phase: -1 });
        break;
      }
      case "hearth": {
        if (p.styles.hearth === "firebox") {
          // A firebox fed from outside: a low arched mouth in a patch of blackened stone, embers within.
          const fx = X + 6, fy = oy - 14, fw = PW - 12, fh = 13;
          this.r(X + 2, oy - 20, PW - 4, 20, (i, j) => (hash(i >> 2, j >> 2, q.seed) < 0.5 ? P.stone[1] : P.stone[2]));
          for (let j = 0; j < fh; j++)
            for (let i = 0; i < fw; i++)
              if (!(j < 3 && Math.abs(i - fw / 2 + 0.5) > fw / 2 - (3 - j) * 1.5)) this.s(fx + i, fy + j, j > fh - 4 ? (hash(i, j, q.seed) < 0.5 ? 0xd8582a : 0x8a2a1a) : 0x120a08);
          if (q.on) this.lights.push({ x: fx + fw / 2, y: fy + fh - 3, c: 0xff6a2a, rad: 50, k: 1.3, phase: q.seed % 100 });
          break;
        }
        const bodyTop = oy - 30;
        const stone = (i: number, j: number) => {
          const row = j >> 2, sx = (i + (row & 1) * 3) % 6;
          if (sx === 0 || (j & 3) === 0) return P.stone[1];
          return P.stone[2 + (hash((i + (row & 1) * 3) / 6 | 0, row, q.seed) < 0.55 ? 1 : 0) + ((j & 3) === 1 ? 1 : 0)];
        };
        const flue = this.ceiling(q);
        this.r(X + 5, flue, 22, bodyTop - flue, (i, j) => (i === 0 || i === 21 ? P.stone[1] : scale(stone(i, j), 0.95)));
        for (let j = 0; j < bodyTop - flue; j++) if (p.wear > 0.2) this.s(X + 14 + Math.round(Math.sin(j * 0.3) * 2), flue + j, scale(P.stone[1], 0.8));
        this.r(X, bodyTop, PW, 40, (i, j) => (i === 0 || i === PW - 1 ? P.stone[1] : stone(i, j)));
        this.r(X - 2, bodyTop - 3, PW + 4, 4, (i, j) => (j === 0 ? W[5] : j === 3 ? W[1] : i === 0 || i === PW + 3 ? W[1] : W[3]));
        this.vase(X + 5, bodyTop - 4, 5, (t) => 1.6 - t * 0.4, P.clay);
        this.r(X + PW - 8, bodyTop - 9, 2, 5, P.linen[5]);
        this.flames.push({ x: X + PW - 7, y: bodyTop - 11 });
        this.vase(X + PW - 13, bodyTop - 4, 4, () => 1.2, P.iron);
        const fx = X + 7, fy = oy - 14, fwid = PW - 14, fh = 22;
        for (let j = 0; j < fh; j++)
          for (let i = 0; i < fwid; i++) {
            const arch = j < 4 && Math.abs(i - fwid / 2 + 0.5) > fwid / 2 - (4 - j) * 1.4;
            if (arch) continue;
            this.s(fx + i, fy + j, mix(0x0d0808, 0x2a1a14, j / fh));
          }
        const lit = q.on;
        for (let i = 0; i < fwid - 2; i++) {
          this.s(fx + 1 + i, fy + fh - 3, W[i % 5 === 0 ? 4 : 2]);
          this.s(fx + 1 + i, fy + fh - 2, W[1]);
          if (i > 2 && i < fwid - 5) this.s(fx + 2 + i, fy + fh - 5, W[i % 4 === 0 ? 4 : 3]);
        }
        this.r(fx + fwid / 2, fy + 2, 1, 7, P.iron[1]);
        this.vase(fx + fwid / 2, fy + 13, 5, (t) => 3 - Math.abs(t - 0.4) * 2, P.iron, true);
        this.fires.push({ x: fx + 1, y: fy + fh - 4, w: fwid - 2, h: 12, lit });
        if (lit) {
          this.lights.push({ x: fx + fwid / 2, y: fy + fh - 8, c: 0xff8a3a, rad: 58, k: 1.6, phase: q.seed % 100 });
          this.smoke.push({ x: fx + fwid / 2, y: fy + 6 });
        }
        break;
      }
      case "shelf": {
        const x0 = X + 1, w = PW - 2, style = p.styles.shelf ?? "bookcase", dens = [0.45, 0.75, 1][p.finish];
        if (style === "niche") {
          // An arched recess in the wall itself, tile-framed in finer houses.
          const top = oy - 40, nw = w - 4, nx = x0 + 2, nh = 30;
          for (let j = -2; j < nh + 2; j++)
            for (let i = -2; i < nw + 2; i++) {
              const archY = j - Math.max(0, 6 - Math.round(Math.sqrt(Math.max(0, 36 - (i - nw / 2 + 0.5) ** 2 * (36 / (nw * nw / 4))))));
              const inside = i >= 0 && i < nw && j >= 0 && j < nh && archY >= 0;
              const rim = !inside && i >= -2 && i < nw + 2 && j < nh + 2 && archY >= -2;
              if (inside) this.s(nx + i, top + j, mix(0x2a1c16, P.wall[1], 0.4 + (j / nh) * 0.3));
              else if (rim) this.s(nx + i, top + j, p.finish === 2 ? ((i + j) & 1 ? P.acc[3] : P.linen[4]) : P.trim[(i + j) % 3 === 0 ? 2 : 3]);
            }
          for (const bj of [14, 29]) this.r(nx, top + bj, nw, 2, (_i, j) => W[j === 0 ? 4 : 2]);
          this.goods(nx + 1, top + 13, nw - 2, q.seed, dens);
          this.goods(nx + 1, top + 28, nw - 2, q.seed + 5, dens);
          break;
        }
        if (style === "tansu") {
          const h = 28;
          this.box(x0, oy, w, 6, h, W, W);
          const fy = oy + 6 - h + 2, rows = 3, cols = Math.max(1, Math.round(w / 12));
          for (let rr = 0; rr < rows; rr++)
            for (let cc = 0; cc < cols; cc++) {
              const dx = x0 + 1 + Math.round((cc * (w - 2)) / cols), dw = Math.round((w - 2) / cols) - 1, dyy = fy + rr * 8;
              this.r(dx, dyy, dw, 7, (i, j) => (i === 0 || j === 0 ? W[4] : i === dw - 1 || j === 6 ? W[1] : W[3]));
              this.r(dx + (dw >> 1) - 1, dyy + 3, 3, 1, P.iron[1]);
            }
          for (const cx of [x0, x0 + w - 2]) this.r(cx, oy + 6 - h, 2, 3, P.iron[2]);
          if (p.finish > 0) this.vase(x0 + 5, oy + 6 - h - 1, 5, (t) => 2 - t * 0.6, P.clay);
          break;
        }
        if (style === "open") {
          const h = 40;
          for (const lx of [x0, x0 + w - 2]) this.r(lx, oy + 5 - h, 2, h, (i) => W[i ? 1 : 3]);
          const boards = [oy + 3, oy - 9, oy - 21, oy - 33];
          for (const bb of boards) this.r(x0, bb, w, 2, (_i, j) => W[j === 0 ? 4 : 2]);
          boards.slice(1).forEach((bb, row) => this.goods(x0 + 2, bb, w - 4, q.seed + row * 17, Math.min(1, dens + 0.2)));
          break;
        }
        if (style === "hutch") {
          this.box(x0, oy, w, 6, 16, W, W);
          for (let k = 0; k < Math.max(1, Math.floor(w / 10)); k++) this.r(x0 + 2 + k * 10, oy - 7, 8, 10, (i, j) => (i === 0 || j === 0 ? W[4] : i === 7 || j === 9 ? W[1] : W[2]));
          this.r(x0 + 1, oy - 40, w - 2, 30, W[1]);
          for (const bb of [oy - 30, oy - 20]) this.r(x0, bb, w, 2, (_i, j) => W[j === 0 ? 4 : 2]);
          for (let i = 3; i < w - 4; i += 7) {
            this.plate(x0 + i + 2, oy - 35, q.seed + i);
            if (hash(i, 1, q.seed) < dens) this.vase(x0 + i + 2, oy - 21, 5, (t) => 2 - Math.abs(t - 0.5), P.acc);
          }
          this.r(x0 - 1, oy - 42, w + 2, 3, (_i, j) => W[j === 0 ? 5 : 3]);
          break;
        }
        if (q.w <= 2) {
          this.sprite(q.w === 1 ? "bookcase1" : "bookcase2", X, oy + 5 - 46);
          break;
        }
        const h = 42;
        this.box(x0, oy, w, 5, h, W, W);
        this.r(x0 + 2, oy + 5 - h + 2, w - 4, h - 4, W[0]);
        const boards = [oy + 3, oy - 8, oy - 19, oy - 30];
        for (const bb of boards) this.r(x0 + 1, bb, w - 2, 2, (_i, j) => W[j === 0 ? 4 : 2]);
        this.r(x0, oy + 5 - h, 2, h, W[2]);
        this.r(x0 + w - 2, oy + 5 - h, 2, h, W[1]);
        boards.slice(1).forEach((bb, row) => this.goods(x0 + 3, bb, w - 6, q.seed + row * 17, dens));
        if (p.finish === 2) this.r(x0 - 1, oy + 5 - h - 2, w + 2, 2, (_i, j) => W[j === 0 ? 5 : 3]);
        this.vase(x0 + w / 2, oy - h + 4, 5, (t) => 3 - t, P.straw, false);
        break;
      }
      case "tapestry": {
        const x0 = X + 1, top = oy - 44, w = 14, h = 28;
        this.r(x0 - 1, top - 2, w + 2, 2, W[3]);
        this.s(x0 - 2, top - 2, W[4]);
        this.s(x0 + w + 1, top - 2, W[4]);
        for (let j = 0; j < h; j++)
          for (let i = 0; i < w; i++) {
            const dm = Math.abs(i - 6.5) + Math.abs((j % 12) - 6);
            const c = i === 0 || i === w - 1 ? P.acc[1] : j % 12 === 0 ? P.trim[4] : dm < 3 ? P.acc3[4] : dm < 5 ? P.acc2[2] : dm === 6 ? P.trim[4] : P.acc[2 + ((i + j) & 1)];
            this.s(x0 + i, top + j, c);
          }
        for (let i = 0; i < w; i += 2) this.r(x0 + i, top + h, 1, 2 + (i % 4 === 0 ? 1 : 0), P.acc[3]);
        break;
      }
      case "plates": {
        this.r(X, oy - 36, PW, 2, W[3]);
        this.r(X, oy - 24, PW, 2, W[3]);
        for (let k = 0; k < 2; k++) this.plate(X + 4 + k * 8, oy - 31, q.seed + k);
        this.vase(X + 5, oy - 26, 5, (t) => 2 - t, P.clay);
        this.vase(X + 11, oy - 26, 6, (t) => 2.2 - Math.abs(t - 0.5) * 1.5, P.acc);
        break;
      }
      case "map": {
        const x0 = X + 1, top = oy - 40, w = 14, h = 14;
        for (let j = 0; j < h; j++)
          for (let i = 0; i < w; i++) {
            const land = hash(i >> 1, j >> 1, q.seed) + Math.sin(i * 0.5 + j * 0.3) * 0.3 > 0.55;
            this.s(x0 + i, top + j, i === 0 || j === 0 || i === w - 1 || j === h - 1 ? P.paper[2] : land ? P.paper[3] : mix(P.paper[4], 0x6aa0c0, 0.35));
          }
        for (let i = 2; i < 12; i += 2) this.s(x0 + i, top + 4 + Math.round(Math.sin(i) * 2 + i * 0.4), 0xa8302a);
        this.s(x0, top, P.brass[4]);
        this.s(x0 + w - 1, top, P.brass[4]);
        break;
      }
      case "pegs": {
        this.r(X, oy - 38, PW, 2, (_i, j) => W[j === 0 ? 4 : 2]);
        const kinds = this.p.trade === "weaver" ? [P.acc, P.acc2, P.acc3] : [P.leaf, P.straw, P.pale];
        for (let k = 0; k < 3; k++) {
          const bx = X + 3 + k * 5, len = 7 + (hash(k, 0, q.seed) * 5 | 0), R = kinds[(k + q.seed) % 3];
          this.s(bx, oy - 37, P.iron[3]);
          for (let j = 0; j < len; j++) {
            const wd = Math.round(Math.min(j + 1, len - j) * 0.6);
            for (let i = -wd; i <= wd; i++) this.s(bx + i, oy - 36 + j, R[(i + j) % 3 === 0 ? 4 : i > 0 ? 2 : 3]);
          }
        }
        break;
      }
      case "loom": {
        const bx0 = X + 3, bx1 = X + PW - 4, back = Y + 6, top = back - 44;
        const post = (x: number, y: number, h: number) => this.r(x, y - h, 4, h, (i, j) => (j === 0 ? W[5] : W[i === 0 ? 4 : i === 1 ? 3 : i === 2 ? 2 : 1]));
        post(bx0 - 2, back, 46);
        post(bx1 - 1, back, 46);
        // The cloth beam: a round roll with the finished cloth wound on it.
        this.r(bx0 - 3, top - 3, bx1 - bx0 + 7, 5, (i, j) => (i < 2 || i > bx1 - bx0 + 4 ? W[j === 0 ? 5 : j === 4 ? 1 : 3] : [P.acc[4], P.acc[3], P.acc2[3], P.acc[2], P.acc[1]][j]));
        const cloth = 17, weights = back - 6;
        for (let i = bx0 + 2; i < bx1 - 1; i++) {
          const u = i - bx0;
          for (let y = top + 2; y < top + 2 + cloth; y++) {
            const v = y - top, dm = Math.abs((u % 10) - 5) + Math.abs((v % 10) - 5);
            this.s(i, y, v === cloth - 1 ? P.linen[2] : dm === 4 ? P.acc3[4] : dm < 2 ? P.acc2[3] : v % 10 < 2 ? P.trim[3] : P.acc[(u + v) % 2 ? 3 : 2]);
          }
          if (u % 2 === 0) for (let y = top + 2 + cloth; y < weights; y++) this.s(i, y, P.linen[u % 4 === 0 ? 4 : 3]);
        }
        // Heddle bar and shed rod across the warp.
        this.r(bx0 - 1, top + 2 + cloth + 5, bx1 - bx0 + 3, 2, (_i, j) => W[j === 0 ? 4 : 2]);
        this.r(bx0 + 1, top + 2 + cloth + 10, bx1 - bx0 - 1, 1, W[3]);
        for (let i = bx0 + 2; i < bx1 - 2; i += 4) this.vase(i + 1, weights + 3, 4, (t) => 1.4 - t * 0.3, P.clay, false);
        this.r(bx0 + 4, top + 2 + cloth - 2, 6, 2, (_i, j) => (j === 0 ? W[5] : W[3]));
        this.box(X + PW / 2 - 9, Y + PD - 8, 18, 5, 8, W, W);
        this.r(X + PW / 2 - 7, Y + PD - 3, 2, 3, W[1]);
        this.r(X + PW / 2 + 5, Y + PD - 3, 2, 3, W[1]);
        break;
      }
      case "spinwheel": {
        // A Saxony wheel: a bench on three splayed legs, a rimmed wheel of eight
        // spokes turning when in use, the flyer and bobbin, and the distaff of fibre.
        const cx = X + 10, cy = Y + PD - 17, rr = 7, a = this.turn.get(q.id) ?? 0;
        this.r(X + 2, Y + PD - 9, 14, 3, (i, j) => (j === 0 ? W[5] : i === 0 ? W[4] : j === 2 ? W[1] : W[3]));
        for (const [lx, sk] of [[X + 3, -1], [X + 14, 1], [X + 9, 0]] as const)
          for (let j = 0; j < 5; j++) this.r(lx + Math.round(sk * j * 0.4), Y + PD - 6 + j, 2, 1, W[j < 2 ? 3 : 2]);
        this.r(X + 5, Y + PD - 2, 9, 1, W[2]);
        for (const px of [cx - 1, cx + 1]) this.r(px, cy, 1, Y + PD - 9 - cy, W[px < cx ? 4 : 2]);
        for (let k = 0; k < 64; k++) {
          const t = (k / 64) * Math.PI * 2, top = Math.sin(t) < 0;
          this.s(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, W[top ? 5 : 2]);
          this.s(cx + Math.cos(t) * (rr - 1), cy + Math.sin(t) * (rr - 1), W[top ? 3 : 1]);
        }
        for (let k = 0; k < 8; k++) {
          const t = a + (k / 8) * Math.PI * 2;
          for (let s2 = 1; s2 < rr - 1; s2++) this.s(cx + Math.cos(t) * s2, cy + Math.sin(t) * s2, W[s2 < 3 ? 4 : 3]);
        }
        this.disc(cx, cy, 1, P.brass);
        // Flyer and bobbin on the left, the drive band running to it.
        this.r(X + 2, cy - 3, 5, 3, (i, j) => (j === 1 ? P.linen[i % 2 ? 4 : 5] : W[j === 0 ? 4 : 2]));
        this.r(X + 4, cy - 2, cx - X - 4, 1, P.linen[3]);
        this.r(X + 4, cy - 1 + rr, cx - X - 4, 1, P.linen[2]);
        this.r(X + 4, cy - 1, 1, rr + 1, P.linen[3]);
        // The distaff, a cloud of fibre on a stick.
        this.r(X + 15, Y + PD - 26, 1, 17, W[2]);
        this.disc(X + 15, Y + PD - 27, 3, P.linen);
        this.s(X + 14, Y + PD - 29, P.linen[5]);
        break;
      }
      case "basket": {
        const cx = X + 8, base = Y + PD - 3;
        this.sprite("basket", cx - 6, base - 8);
        const balls = [P.acc, P.acc2, P.linen, P.acc3];
        this.disc(cx - 3, base - 11, 3, balls[q.seed % 4]);
        this.disc(cx + 2, base - 12, 3, balls[(q.seed + 1) % 4]);
        this.disc(cx, base - 10, 2, balls[(q.seed + 2) % 4]);
        break;
      }
      case "bolts": {
        const R = [P.acc, P.acc2, P.acc3, P.linen];
        for (let k = 0; k < 3; k++) {
          const yb = Y + PD - 4 - k * 5, R0 = R[(q.seed + k) % 4];
          this.r(X + 2 + (k === 2 ? 2 : 0), yb - 4, 12 - (k === 2 ? 4 : 0), 5, (i, j) => R0[j === 0 ? 5 : j === 4 ? 1 : i % 5 === 0 ? 2 : 3]);
          this.disc(X + 2 + (k === 2 ? 2 : 0), yb - 2, 2, R0);
          this.s(X + 2 + (k === 2 ? 2 : 0), yb - 2, R0[0]);
        }
        break;
      }
      case "vat": {
        const cx = X + 8, base = Y + PD - 3, dye = P.dye[q.seed % 3];
        this.vase(cx, base, 9, () => 6, W, false);
        this.r(cx - 6, base - 2, 13, 1, P.iron[2]);
        this.r(cx - 6, base - 6, 13, 1, P.iron[2]);
        for (let i = -5; i <= 5; i++) {
          const wave = Math.sin(this.t * 2 + i * 0.8 + q.seed) > 0.8;
          this.s(cx + i, base - 9, wave ? dye[5] : dye[2]);
          this.s(cx + i, base - 10, i === -5 || i === 5 ? W[4] : dye[3]);
        }
        this.r(cx + 6, base - 14, 1, 7, W[3]);
        break;
      }
      case "counter": {
        if (p.styles.counter === "deco") {
          const h = 18, y0 = Y + 3, d = PD - 5;
          this.box(X + 1, y0, PW - 2, d, h, P.stone, P.trim);
          for (let i = 3; i < PW - 4; i++) {
            const k = (i % 12) - 6;
            for (let j = 3; j < h - 3; j++) if (Math.abs(k) === ((j - 3) % 7)) this.s(X + 1 + i, y0 + d - h + j, P.brass[4]);
          }
          this.r(X + 1, y0 + d - h + 1, PW - 2, 1, P.brass[5]);
          this.disc(X + 10, y0 - h + 4, 2, P.brass);
          this.r(X + PW - 16, y0 - h + 3, 10, 5, (i, j) => (i === 5 ? P.paper[1] : j === 0 ? P.paper[5] : P.paper[4]));
          break;
        }
        const h = 18, y0 = Y + 3, d = PD - 5;
        this.box(X + 1, y0, PW - 2, d, h, W, W);
        for (let i = 6; i < PW - 6; i += 12) this.r(X + i, y0 + d - h + 4, 8, h - 7, (a, b) => (a === 0 || b === 0 ? W[1] : a === 7 || b === h - 8 ? W[4] : W[2]));
        const top = y0 - h + 2;
        this.r(X + 6, top + 1, 1, 7, P.brass[3]);
        this.r(X + 2, top, 9, 1, P.brass[4]);
        this.r(X + 1, top + 4, 3, 1, P.brass[2]);
        this.r(X + 8, top + 3, 3, 1, P.brass[2]);
        this.s(X + 2, top + 1, P.brass[3]);
        this.s(X + 9, top + 1, P.brass[3]);
        for (let k = 0; k < 3; k++) for (let j = 0; j <= k + 1; j++) this.r(X + 14 + k * 3, top + 6 - j, 2, 1, P.brass[j % 2 ? 5 : 3]);
        this.r(X + PW - 16, top + 3, 10, 5, (i, j) => (i === 5 ? P.paper[1] : j === 0 ? P.paper[5] : (j & 1) && i % 5 > 0 && i % 5 < 4 ? P.paper[2] : P.paper[4]));
        this.r(X + PW - 16, top + 8, 10, 1, P.acc[1]);
        break;
      }
      case "jars": {
        const n = q.w * 2, R = [P.clay, P.pale, P.clay, P.acc];
        for (let k = 0; k < n; k++) {
          const tall = hash(k, 1, q.seed) < 0.55, x = X + 1 + k * Math.floor((PW - 9) / Math.max(1, n - 1));
          this.sprite(tall ? "amphora" : "pot", x, Y + PD - (tall ? 17 : 11) - (k & 1) * 2, { clay: R[(k + q.seed) % 4] });
        }
        break;
      }
      case "crate": {
        this.sprite("crate", X, Y + PD - 15);
        if (q.seed % 2 === 0) this.sprite("barrel", X + 2, Y + PD - 26);
        break;
      }
      case "sacks": {
        this.sprite("sack", X, Y + PD - 16);
        this.sprite("sack", X + 7, Y + PD - 14, { straw: P.linen });
        for (let i = 0; i < 6; i++) this.s(X + 3 + hash(i, 1, q.seed) * 10, Y + PD - 1 - hash(i, 2, q.seed) * 2, P.straw[5]);
        break;
      }
      case "throw": {
        const cx = X + 8, base = Y + PD - 4, a = this.turn.get(q.id) ?? 0;
        this.box(X + 2, base - 4, 12, 4, 5, P.stone, P.stone);
        this.r(X + 3, base - 13, 10, 3, (i, j) => (j === 0 ? W[5] : W[(i + Math.floor(a * 3)) % 4 === 0 ? 4 : 2]));
        this.vase(cx, base - 13, 7, (t) => 2 + Math.sin(t * 3) * 1.4, P.pale);
        if (q.on) this.s(cx - 2 + (Math.floor(a * 4) % 5), base - 16, P.pale[5]);
        break;
      }
      case "claybin": {
        const cx = X + 8, base = Y + PD - 3;
        this.vase(cx, base, 7, () => 6, W, false);
        this.r(cx - 6, base - 3, 13, 1, P.iron[2]);
        for (let i = -5; i <= 5; i++) this.s(cx + i, base - 7 - Math.round(2 - Math.abs(i) * 0.4), P.pale[i < 0 ? 3 : 2]);
        this.r(cx - 5, base - 8, 11, 1, P.pale[1]);
        break;
      }
      case "potrack": {
        this.r(X + 2, Y + PD - 30, 2, 28, W[1]);
        this.r(X + PW - 4, Y + PD - 30, 2, 28, W[1]);
        for (const [by, R] of [[Y + PD - 6, P.clay], [Y + PD - 18, P.pale]] as const) {
          this.r(X + 1, by, PW - 2, 2, (_i, j) => W[j === 0 ? 4 : 2]);
          for (let k = 0; k < 4; k++) this.vase(X + 6 + k * 7, by - 1, 5 + (k % 2) * 3, (t) => 2.4 - t * 0.8 + (k % 2) * Math.sin(t * 3), R);
        }
        break;
      }
      case "desk": {
        const top = Y + 2, h = 13;
        this.r(X + 1, top - h, PW - 2, PD - 4, (i, j) => (j === 0 ? W[5] : i === 0 ? W[4] : W[3]));
        this.r(X + 1, top + PD - 4 - h, PW - 2, 3, W[2]);
        for (const lx of [X + 2, X + PW - 4]) this.r(lx, top + PD - 1 - h, 2, h - 2, W[1]);
        this.r(X + 9, top - h + 3, 13, 7, (i, j) => (i === 6 ? P.paper[1] : j === 0 ? P.paper[5] : j % 2 === 1 && i % 6 > 0 && i % 6 < 5 ? P.paper[2] : P.paper[4]));
        this.r(X + 4, top - h + 4, 3, 3, P.iron[1]);
        this.s(X + 5, top - h + 4, P.iron[4]);
        this.r(X + 7, top - h - 2, 1, 5, P.linen[5]);
        this.r(X + PW - 7, top - h - 3, 2, 6, P.linen[5]);
        this.r(X + PW - 8, top - h + 2, 4, 1, P.brass[3]);
        if (q.on) {
          this.flames.push({ x: X + PW - 7, y: top - h - 5 });
          this.lights.push({ x: X + PW - 6, y: top - h - 5, c: 0xffc070, rad: 28, k: 0.9, phase: q.seed % 50 });
        }
        for (let k = 0; k < 3; k++) this.r(X + PW - 20, top - h + 2 - k * 2, 7, 2, [P.acc, P.acc2, P.acc3][k][k === 1 ? 2 : 3]);
        break;
      }
      case "scrolls": {
        const cx = X + 8, base = Y + PD - 3;
        for (let k = 0; k < 5; k++) {
          const sx = cx - 4 + k * 2, h = 12 + (hash(k, 0, q.seed) * 5 | 0);
          this.r(sx, base - h, 2, h, (i, j) => (j === 0 ? P.paper[5] : P.paper[i ? 2 : 4]));
          this.s(sx, base - h + 3, [0xa8302a, P.acc[3], P.brass[3]][k % 3]);
        }
        this.vase(cx, base, 8, () => 6, P.straw, false);
        break;
      }
      case "bed": {
        const y0 = Y + 2, d = PD - 4, messy = pr, fin = p.finish;
        if (p.styles.bed === "charpai") {
          // A string cot: a wooden frame on turned legs, the webbing showing.
          for (const [lx, ly] of [[X + 2, y0 + d - 2], [X + PW - 4, y0 + d - 2]]) this.r(lx, ly - 8, 2, 8, W[1]);
          this.r(X + 1, y0 - 8, PW - 2, d, (i, j) => (i < 2 || j < 2 || i > PW - 5 || j > d - 3 ? W[i < 2 || j < 2 ? 4 : 2] : (i + j) % 3 === 0 || (i - j + 99) % 3 === 0 ? P.straw[2] : P.straw[4]));
          if (fin > 0) this.r(X + 12 + Math.round(messy * 4), y0 - 7, PW - 16, d - 3, (i, j) => (j === 0 ? P.acc[5] : (i >> 2) % 2 ? P.acc[3] : P.acc3[3]));
          this.r(X + 4, y0 - 7, 7, 5, (i, j) => (j === 0 ? P.linen[5] : i === 6 ? P.linen[2] : P.linen[4]));
          break;
        }
        // Humble: one plain wool blanket; elite: brass on the headboard.
        const plain: Record<string, string> = fin === 0 ? { f: "v", d: "x", g: "b", s: "z" } : {};
        this.sprite("bed", X, Y + PD - 26, {}, plain);
        if (fin === 2) {
          this.s(X + 1, Y + PD - 24, P.brass[5]);
          this.s(X + 4, Y + PD - 24, P.brass[4]);
        }
        if (messy > 0.5 && !q.sleepers) for (let i = 0; i < 12; i++) this.s(X + 16 + i, Y + PD - 16 + Math.round(Math.sin(i * 0.9) * 2), P.acc[1]);
        // Two in a bed lie one behind the other on the bolster.
        for (let k = Math.min(2, q.sleepers ?? 0) - 1; k >= 0; k--) {
          const at = this.pillow({ propId: q.id, k });
          this.sleeper(at.x, at.y, P.acc, 12);
        }
        void d;
        break;
      }
      case "chest": {
        const fin = p.finish, painted = p.styles.chest === "painted";
        const swap: Record<string, string> = painted ? { y: "h", t: "g", r: "f", e: "d", w: "s", q: "a" } : {};
        if (fin === 0) Object.assign(swap, { m: "e", M: "r" });
        const x0 = X, y0 = Y + PD - SPRITES.chest.length;
        if (pr > 0.05) this.r(x0 + 2, y0 - Math.round(7 * pr), 12, Math.round(7 * pr) + 1, (i, j) => (j === 0 ? W[5] : i === 0 ? W[4] : W[2]));
        this.sprite("chest", x0, y0, {}, swap);
        if (pr > 0.3) {
          this.r(x0 + 2, y0 + 1, 12, 3, W[0]);
          for (let i = 0; i < 2 + fin * 2; i++) this.s(x0 + 3 + i * 2, y0 + 2 + (i & 1), P.brass[4 + (i % 2)]);
          this.r(x0 + 4, y0 + 2, 4, 1, P.acc[3]);
        }
        if (painted) for (let i = 4; i < 12; i += 3) this.s(x0 + i, y0 + 7, P.acc2[4]);
        break;
      }
      case "table": {
        const top = Y + 3, h = 12, d = PD - 6, fin = p.finish;
        const style = p.styles.table ?? (fin === 0 ? "trestle" : "plain");
        if (style === "round") {
          const cx = X + PW / 2, cy = top - h + d / 2;
          this.r(cx - 1, cy + 2, 3, h, W[1]);
          this.r(cx - 5, top + d - 3, 11, 2, W[1]);
          for (let j = -5; j <= 5; j++)
            for (let i = -13; i <= 13; i++)
              if ((i * i) / 169 + (j * j) / 25 <= 1) this.s(cx + i, cy + j, (i * i) / 169 + (j * j) / 25 > 0.8 ? W[j < 0 ? 5 : 2] : W[3]);
          for (let i = -12; i <= 12; i++) this.s(cx + i, cy + 6, W[1]);
        } else if (q.w >= 2) {
          const name = style === "trestle" ? "trestle" : "table";
          this.sprite(this.stretch(name, PW), X, Y + PD - SPRITES[name].length);
        } else {
          this.r(X + 1, top - h, PW - 2, d, (i, j) => (j === 0 ? W[5] : i === 0 ? W[4] : style === "trestle" && j % 5 === 4 ? W[2] : W[3]));
          this.r(X + 1, top + d - h, PW - 2, 3, (_i, j) => W[j === 0 ? 3 : 1]);
          if (style === "trestle")
            for (const lx of [X + 4, X + PW - 7])
              for (let j = 0; j < h - 3; j++) {
                this.s(lx + Math.round(j * 0.35), top + d - h + 3 + j, W[1]);
                this.s(lx + 3 - Math.round(j * 0.35), top + d - h + 3 + j, W[2]);
              }
          else for (const lx of [X + 2, X + PW - 4]) this.r(lx, top + d - h + 3, 2, h - 3, (i) => W[i ? 1 : 2]);
          if (fin === 2) this.r(X + 4, top - h + 1, PW - 8, d - 2, (i, j) => (j === 0 || j === d - 3 ? P.trim[5] : (i + j) % 6 === 0 ? P.acc[4] : P.linen[4]));
        }
        const ty = top - h + 2;
        if (p.program === "serve") {
          this.tavernBoard(X, ty, PW, q.seed);
          break;
        }
        this.vase(X + 8, ty + 6, 4, (t) => 3.5 - t * 1.5 + (t > 0.9 ? 1.4 : 0), P.clay);
        if (fin > 0) this.r(X + 15, ty + 2, 7, 3, (i, j) => (j === 0 ? P.straw[5] : i % 3 === 0 && j === 1 ? P.straw[2] : P.straw[3]));
        if (fin > 0) this.vase(X + PW - 6, ty + 6, 8, (t) => 2.4 - Math.abs(t - 0.35) * 2 + (t > 0.85 ? 0.3 : 0), P.pale);
        if (fin === 2) {
          this.r(X + 20, ty - 2, 1, 5, P.linen[5]);
          this.flames.push({ x: X + 20, y: ty - 4 });
          this.lights.push({ x: X + 20, y: ty - 4, c: 0xffc070, rad: 26, k: 0.7, phase: q.seed % 50 });
        }
        this.s(X + 24, ty + 4, 0xb8302a);
        this.s(X + 25, ty + 5, 0xd84a3a);
        this.s(X + 22, ty + 5, P.leaf[4]);
        break;
      }
      case "stool": {
        const x0 = X + 1, base = Y + PD - 3, name = p.styles.stool === "chair" ? "chair" : "stool", top = base - SPRITES[name].length;
        if (q.tipped || q.lean) this.fallen(name, x0, top, q);
        else {
          this.sprite(name, x0, top);
          // A cushion on the good chairs.
          if (name === "chair" && p.finish === 2) this.r(x0 + 3, top + 12, 8, 2, (_i, j) => P.acc[j ? 3 : 5]);
        }
        break;
      }
      case "plant": {
        const cx = X + 8, base = Y + PD - 3;
        this.vase(cx, base, 7, (t) => 3.8 - t * 1.2 + (t > 0.85 ? 0.8 : 0), P.clay);
        // Fronds: a stem arching out and down, leaflets either side, the
        // upper side lit, the ones behind drawn first and darker.
        for (let f = 0; f < 9; f++) {
          const back = f % 2 === 0, a0 = -Math.PI / 2 + ((f / 8) - 0.5) * 2.8 + (hash(f, 0, q.seed) - 0.5) * 0.3;
          const len = 8 + hash(f, 1, q.seed) * 5, sway = Math.sin(this.t * 1.2 + f) * 0.04;
          for (let k = 0; k < len; k++) {
            const a = a0 + sway * k, x = cx + Math.cos(a) * k, y = base - 8 + Math.sin(a) * k + k * k * 0.05;
            const dim = back ? 1 : 0;
            this.s(x, y, P.leaf[2 - dim]);
            if (k > 1 && k % 2 === 0) {
              const nx = -Math.sin(a), ny = Math.cos(a);
              this.s(x + nx * 1.4, y + ny * 1.4, P.leaf[3 - dim]);
              this.s(x - nx * 1.4, y - ny * 1.4, P.leaf[(Math.cos(a) < 0 ? 5 : 4) - dim]);
            }
          }
        }
        break;
      }
      case "dresser": {
        const x0 = X + 1, w = PW - 2;
        for (const lx of [x0, x0 + w - 3]) this.r(lx, oy - 34, 3, 38, (i) => P.stone[i === 0 ? 4 : 2]);
        for (const [h, k] of [[4, 0], [16, 1], [28, 2]] as const) {
          this.r(x0 - 1, oy - h - 2, w + 2, 4, (i, j) => (j === 0 ? P.stone[5] : j === 3 ? P.stone[1] : P.stone[3 + ((i >> 2) % 2)]));
          for (let i = 3; i < w - 4; i += 5 + k) this.vase(x0 + i + 2, oy - h - 3, 4 + ((hash(i, k, q.seed) * 3) | 0), (t) => 2 - t * 0.5 + (t > 0.8 ? 0.5 : 0), [P.clay, P.pale][k % 2]);
        }
        break;
      }
      case "shrine": {
        const x0 = X + 2, top = oy - 40;
        this.r(x0 - 1, top - 3, 14, 26, (i, j) => (j < 3 ? P.trim[j === 0 ? 5 : 3] : i === 0 || i === 13 ? P.trim[2] : P.trim[1]));
        this.r(x0 + 1, top, 10, 18, (_i, j) => mix(0x1a1010, 0x3a2418, j / 18));
        this.r(x0 - 2, top + 18, 16, 3, (_i, j) => W[j === 0 ? 5 : 2]);
        this.r(x0 + 5, top + 8, 2, 10, (i) => P.brass[i ? 3 : 5]);
        this.disc(x0 + 6, top + 7, 1, P.brass);
        this.vase(x0 + 2, top + 17, 3, () => 1.2, P.clay);
        for (let i = 0; i < 3; i++) this.s(x0 + 9 + (i % 2), top + 15 - i, [P.acc[4], 0xf2d24a, P.acc3[4]][i]);
        if (q.on) {
          this.r(x0 + 9, top + 13, 1, 4, P.linen[5]);
          this.flames.push({ x: x0 + 9, y: top + 11 });
          this.lights.push({ x: x0 + 9, y: top + 11, c: 0xffc070, rad: 30, k: 0.8, phase: q.seed % 40 });
        }
        break;
      }
      case "horns": {
        const cx = X + 8, top = oy - 36;
        this.r(X + 1, top + 12, 14, 16, (i, j) => ((i + j) % 6 < 2 ? P.acc[3] : (i + j + 3) % 6 < 1 ? P.acc[1] : P.wall[4]));
        this.r(cx - 3, top + 2, 6, 9, (i, j) => (j > 6 ? P.linen[3] : i === 0 ? P.linen[5] : P.linen[4]));
        this.s(cx - 2, top + 5, P.linen[1]);
        this.s(cx + 1, top + 5, P.linen[1]);
        for (let j = 0; j < 7; j++) {
          this.s(cx - 4 - (j >> 1), top + 3 - j + (j > 4 ? 2 : 0), P.pale[j < 3 ? 2 : 1]);
          this.s(cx + 3 + (j >> 1), top + 3 - j + (j > 4 ? 2 : 0), P.pale[j < 3 ? 2 : 1]);
        }
        break;
      }
      case "mat": {
        const plain: Record<string, string> = p.finish === 0 ? { f: "v", d: "x", g: "b", s: "z" } : {};
        this.sprite(pr > 0.5 || q.sleepers ? "futon" : "bedroll", X, Y + PD - 15, {}, plain);
        if (q.sleepers) {
          const at = this.pillow({ propId: q.id, k: 0 });
          this.sleeper(at.x, at.y, P.acc, 13);
        }
        break;
      }
      case "boxbed": {
        const x0 = X + 1, y0 = Y + 2, w = PW - 2, d = PD - 4;
        this.box(x0, y0, w, d, 10, P.stone, P.stone);
        this.r(x0 + 3, y0 - 8, w - 6, d - 4, (i, j) => (hash(i, j, q.seed) < 0.3 ? P.straw[4] : P.straw[3 - (j & 1)]));
        this.r(x0 + 12, y0 - 8, w - 15, d - 4, (i, j) => P.fur[j === 0 ? 5 : (i + j) % 5 === 0 ? 2 : 3]);
        if (q.sleepers) {
          const at = this.pillow({ propId: q.id, k: 0 });
          this.sleeper(at.x, at.y, P.fur, 7);
        }
        for (const bx of [x0 + 9, x0 + w - 4]) this.r(bx, y0 - 10, 2, 11 + d - 10, P.stone[1]);
        break;
      }
      case "lowtable": {
        const x0 = X - 1, y0 = Y + PD - 13;
        this.sprite("lowtable", x0, y0);
        if (p.program === "serve") {
          this.lowBoard(x0, y0, q.seed);
          break;
        }
        this.vase(x0 + 7, y0 + 3, 5, (t) => 2.2 - Math.abs(t - 0.4) * 2, P.brass);
        this.s(x0 + 10, y0 + 1, P.brass[4]);
        this.r(x0 + 12, y0 + 2, 2, 2, P.linen[5]);
        this.r(x0 + 3, y0 + 3, 2, 2, P.linen[5]);
        break;
      }
      case "cushions": {
        if (p.program === "rows") {
          // A flat kneeling cushion, piped at the edge.
          const A = P.acc, y0 = Y + PD - 9;
          this.r(X + 2, y0, 12, 6, (i, j) => (j === 0 ? A[4] : j === 5 ? A[1] : i === 0 || i === 11 ? A[2] : j === 1 ? A[4] : A[3]));
          this.r(X + 2, y0 + 4, 12, 1, A[2]);
          this.s(X + 7, y0 + 2, A[1]);
          break;
        }
        if (p.styles.cushions === "petate") {
          // A palm mat to lie on.
          this.r(X + 1, Y + PD - 9, 14, 6, (i, j) => (i === 0 || j === 0 || i === 13 || j === 5 ? P.straw[1] : (i + j) % 2 ? P.straw[3] : P.straw[4]));
          break;
        }
        if (p.styles.cushions === "boughs") {
          // Sage and spruce strewn to sit on.
          for (let k = 0; k < 22; k++) {
            const a = hash(k, 1, q.seed) * 6.28, r0 = hash(k, 2, q.seed) * 6;
            const x = X + 8 + Math.cos(a) * r0, y = Y + PD - 7 + Math.sin(a) * r0 * 0.5;
            this.r(x, y, 3, 1, P.leaf[2 + ((k + q.seed) % 4)]);
            if (k % 5 === 0) this.s(x + 1, y - 1, mix(P.leaf[4], P.linen[5], 0.4));
          }
          break;
        }
        this.sprite("cushion", X, Y + PD - 16);
        this.sprite("cushion", X + 2, Y + PD - 10, { acc: P.acc2 });
        break;
      }
      case "divan": {
        const x0 = X + 1, y0 = Y + 2, w = PW - 2;
        this.box(x0, y0, w, PD - 5, 7, W, W);
        this.r(x0, y0 - 7, w, PD - 6, (i, j) => (j === 0 ? P.acc[5] : (i >> 3) % 2 ? P.acc[3] : P.acc[2 + (j === 1 ? 1 : 0)]));
        for (let k = 0; k < Math.floor(w / 12); k++) this.r(x0 + 2 + k * 12, y0 - 13, 10, 7, (i, j) => (j === 0 ? P.acc2[5] : i === 9 ? P.acc2[1] : P.acc2[3]));
        this.disc(x0 + 2, y0 - 5, 3, P.acc3);
        this.disc(x0 + w - 3, y0 - 5, 3, P.acc3);
        break;
      }
      case "lantern": {
        const cx = X + 8, base = Y + PD - 4;
        if (q.broken) {
          this.r(cx - 3, base - 2, 7, 2, P.iron[2]);
          this.r(cx + 2, base - 3, 4, 1, P.iron[3]);
          break;
        }
        this.r(cx - 3, base - 2, 7, 2, P.iron[2]);
        this.r(cx - 3, base - 11, 1, 9, P.iron[3]);
        this.r(cx + 3, base - 11, 1, 9, P.iron[1]);
        this.r(cx - 3, base - 12, 7, 2, P.iron[3]);
        this.r(cx - 1, base - 15, 3, 1, P.iron[3]);
        for (let j = 0; j < 8; j++) for (let i = -2; i <= 2; i++) (q.on ? this.g.bind(this) : this.s.bind(this))(cx + i, base - 10 + j, q.on ? mix(0xffd88a, 0xfff4d8, j / 8) : mix(P.linen[3], P.iron[4], 0.5));
        if (q.on) this.lights.push({ x: cx, y: base - 7, c: 0xffc070, rad: 42, k: 1, phase: q.seed % 60 });
        break;
      }
      case "firepit":
      case "irori": {
        const cx = X + PW / 2, cy = Y + PD / 2, rr = PW / 2 - 3;
        if (q.kind === "irori") {
          this.r(X + 2, Y + 2, PW - 4, PD - 4, (i, j) => (i < 3 || j < 3 || i > PW - 8 || j > PD - 8 ? W[i < 3 || j < 3 ? 3 : 1] : hash(i, j, q.seed) < 0.2 ? P.stone[3] : P.stone[4]));
          this.r(cx, Y - 40, 1, 40 + PD / 2 - 6, P.iron[1]);
          this.vase(cx, cy - 2, 6, (t) => 3.5 - t * 1.2, P.iron);
        } else {
          for (let j = -rr; j <= rr; j++)
            for (let i = -rr; i <= rr; i++) {
              const r0 = Math.hypot(i, j * 1.15);
              if (r0 > rr) continue;
              this.s(cx + i, cy + j, r0 < rr - 3 ? (hash(i, j, q.seed) < 0.15 ? 0x5a3a28 : mix(0x3a3432, 0x6a625c, hash(i >> 1, j >> 1, q.seed))) : P.stone[1]);
            }
          for (let a = 0; a < 14; a++) {
            const t = (a / 14) * Math.PI * 2;
            this.disc(Math.round(cx + Math.cos(t) * (rr - 1)), Math.round(cy + Math.sin(t) * (rr - 1) / 1.15), 2, P.stone);
          }
          if (p.styles.firepit === "stones") {
            // Stones heated outside and carried in, glowing; water on them is steam, not flame.
            for (let k = 0; k < 7; k++) {
              const a = (k / 7) * 6.28 + q.seed, r0 = k === 6 ? 0 : rr * 0.45;
              const hot = q.on ? [0x2a0e0a, 0x6a1e12, 0xa8341a, 0xd8582a, 0xf08a3a, 0xffc070] : P.stone;
              this.disc(Math.round(cx + Math.cos(a) * r0), Math.round(cy + Math.sin(a) * r0 * 0.8) - 1, 2, hot);
            }
            if (q.on) {
              this.lights.push({ x: cx, y: cy - 2, c: 0xff5a2a, rad: 46, k: 1.2, phase: q.seed % 100 });
              this.smoke.push({ x: cx, y: cy - 4 });
            }
            break;
          }
          this.r(cx - 5, cy - 1, 10, 2, W[2]);
          this.r(cx - 1, cy - 4, 2, 7, W[3]);
        }
        this.fire(cx, cy + 1, q.kind === "irori" ? 8 : Math.max(8, rr), q.on, q.seed, q.kind === "irori" ? 1.2 : 1.8);
        break;
      }
      case "brazier": {
        const cx = X + 8, base = Y + PD - 4;
        for (const lx of [cx - 4, cx + 3]) this.r(lx, base - 8, 1, 8, P.brass[2]);
        this.vase(cx, base - 7, 5, (t) => 5 - (1 - t) * 1.5, P.brass, true);
        for (let i = -3; i <= 3; i++) (q.on ? this.g.bind(this) : this.s.bind(this))(cx + i, base - 11, q.on ? [0xffb040, 0xff6a20, 0xffd060][(i + 9) % 3] : P.iron[1]);
        this.fire(cx, base - 11, 6, q.on, q.seed, 1.2);
        break;
      }
      case "stove": {
        // A pot-bellied iron stove on three short legs, its grate glowing when lit.
        const cx = X + 8, base = Y + PD - 3, I = P.iron;
        for (const lx of [cx - 5, cx, cx + 4]) this.r(lx, base - 3, 2, 3, (i) => I[i ? 1 : 3]);
        this.vase(cx, base - 3, 15, (t) => 3.5 + Math.sin(t * Math.PI) * 2.6, I, false);
        this.r(cx - 6, base - 18, 13, 2, (i, j) => (j === 0 ? I[5] : i === 0 || i === 12 ? I[1] : I[3]));
        this.r(cx - 5, base - 20, 11, 2, (_i, j) => (j === 0 ? I[4] : I[2]));
        this.r(cx - 5, base - 12, 11, 1, P.brass[p.finish ? 3 : 1]);
        const on = q.on, glow = on ? this.g.bind(this) : this.s.bind(this);
        for (let j = 0; j < 4; j++)
          for (let i = 0; i < 6; i++) glow(cx - 3 + i, base - 10 + j, on ? (i % 2 ? [0xffb040, 0xff8a30, 0xff6a20, 0xd84818][j] : I[0]) : i % 2 ? I[1] : I[0]);
        this.s(cx + 3, base - 8, P.brass[4]);
        // The flue: up to the top of the room's wall, banded where the joints are.
        const flue = this.ceiling(q);
        this.r(cx - 1, flue, 3, base - 20 - flue, (i, j) => ((base - 20 - flue - j) % 14 === 0 ? I[4] : I[i === 0 ? 4 : i === 1 ? 2 : 1]));
        if (p.finish > 0) this.vase(cx + 2, base - 20, 4, (t) => 2.4 - t * 0.6, p.finish === 2 ? P.brass : I);
        if (on) this.lights.push({ x: cx, y: base - 8, c: 0xff8a3a, rad: 42, k: 1.3, phase: q.seed % 80 });
        break;
      }
      case "pole":
        if (p.styles.pole) {
          this.column(X + 8, Y + PD - 4, p.styles.pole);
          break;
        }
        this.r(X + 7, Y + PD - 8 - 86, 3, 86, (i) => W[i === 0 ? 4 : i === 1 ? 3 : 1]);
        this.r(X + 5, Y + PD - 40, 7, 6, P.fur[2]);
        break;
      case "ladder":
        for (let j = 0; j < 44; j++) {
          const lx = X + 3 + Math.round(j / 12);
          this.s(lx, Y + PD - 4 - j, W[3]);
          this.s(lx + 8, Y + PD - 4 - j, W[2]);
          if (j % 6 === 3) this.r(lx + 1, Y + PD - 4 - j, 7, 1, W[4]);
        }
        break;
      case "quern":
        this.sprite("quern", X, Y + PD - 12);
        break;
      case "hides": {
        const x0 = X + 1, base = Y + PD - 3;
        for (let k = 0; k < 4; k++) {
          const R = [P.fur, P.pale, P.fur, P.straw][(k + q.seed) % 4];
          this.r(x0 + (k & 1), base - 4 - k * 3, 14 - (k & 1) * 2, 4, (i, j) => (j === 0 ? R[4] : i % 4 === 0 && j === 3 ? R[1] : R[3 - (j >> 1)]));
        }
        break;
      }
      case "coolamon": {
        const cx = X + 8, cy = Y + PD - 7;
        for (let j = -2; j <= 2; j++)
          for (let i = -7; i <= 7; i++) {
            if ((i * i) / 49 + (j * j) / 6 > 1) continue;
            const rim = (i * i) / 49 + (j * j) / 6 > 0.6;
            this.s(cx + i, cy + j, rim ? W[j < 0 ? 4 : 2] : hash(i, j, q.seed) < 0.4 ? [0xa8302a, 0x3a2a4a, P.straw[4]][(i + 9) % 3] : W[1]);
          }
        for (let i = 0; i < 16; i++) this.s(X + i, Y + PD - 3 - (i >> 2), W[3]);
        break;
      }
      case "screen": {
        for (let k = 0; k < 4; k++) {
          const x0 = X + 1 + k * 8, back = k % 2 === 0;
          this.r(x0, Y + PD - 32 - (back ? 2 : 0), 8, 28, (i, j) => {
            if (i === 0 || j === 0 || j === 27) return P.trim[2];
            const hill = 18 - Math.round(4 * Math.sin((x0 + i) * 0.25) + 2 * Math.sin((x0 + i) * 0.7));
            const c = j > hill ? P.acc2[2 + ((i + j) & 1)] : j < 5 ? P.paper[5] : P.paper[4];
            return back ? scale(c, 0.86) : c;
          });
        }
        break;
      }
      case "fountain": {
        const cx = X + PW / 2 - 0.5, cy = Y + PD / 2 - 0.5, rr = PW / 2 - 2;
        const oct = (i: number, j: number) => Math.max(Math.abs(i), Math.abs(j), (Math.abs(i) + Math.abs(j)) * 0.72);
        const water = mix(0x2a5a78, sky(p.hour, 0.3), 0.25);
        for (let j = -rr; j <= rr; j++)
          for (let i = -rr; i <= rr; i++) {
            const r0 = oct(i, j);
            if (r0 > rr) continue;
            let c: number;
            if (r0 > rr - 4) {
              // Rim: lit on its upper-left faces, a carved groove along the middle.
              const lit = i + j < 0;
              c = r0 > rr - 1 ? P.stone[lit ? 2 : 1] : r0 > rr - 2 ? P.stone[lit ? 5 : 3] : r0 > rr - 3 ? (p.finish === 2 ? ((i + j) & 1 ? P.acc[3] : P.linen[5]) : P.stone[2]) : P.stone[lit ? 4 : 3];
            } else {
              const depth = r0 / (rr - 4), ring = Math.sin(r0 * 1.1 - this.t * 3.2);
              c = mix(water, 0x10243a, depth * 0.45);
              if (ring > 0.86) c = mix(c, 0xcfeefa, 0.55);
              if (i + j < -rr * 0.6 && r0 > rr - 6) c = mix(c, 0x0e1c2c, 0.4);
            }
            this.s(cx + i, cy + j, c);
          }
        this.vase(Math.round(cx), Math.round(cy) + 3, 5, (t) => 1.3 + (t > 0.7 ? 1.5 : 0), P.stone, true);
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.4, ph = (this.t * 1.4 + k * 0.25) % 1;
          for (let s2 = 0; s2 < 7; s2++) {
            const tt = s2 / 7, x = cx + Math.cos(a) * tt * 7, y = cy - 2 + Math.sin(a) * tt * 5 - Math.sin(tt * Math.PI) * 5;
            if (Math.abs(tt - ph) < 0.2) this.g(x, y, s2 % 2 ? 0xffffff : 0xcfefff);
          }
        }
        this.g(Math.round(cx), Math.round(cy) - 3, 0xffffff);
        break;
      }
      case "pack": {
        const x0 = X + 3, base = Y + PD - 3;
        this.r(x0, base - 14, 10, 14, (i, j) => (j === 0 || i === 0 ? P.acc[4] : i === 9 || j === 13 ? P.acc[1] : j > 7 && i > 2 && i < 7 ? P.acc[2] : P.acc[3]));
        this.r(x0 - 1, base - 18, 12, 4, (i, j) => P.acc2[j === 0 ? 5 : i % 4 === 0 ? 2 : 3]);
        this.r(x0 + 2, base - 12, 1, 10, P.iron[3]);
        this.r(x0 + 7, base - 12, 1, 10, P.iron[3]);
        break;
      }
      case "armchair": {
        const U = p.finish === 0 ? P.acc2 : P.acc;
        this.sprite("armchair", X + (-2), Y + PD - 24, { acc: U });
        break;
      }
      case "sofa": {
        const U = p.finish === 0 ? P.acc2 : P.acc;
        this.sprite("sofa", X + (0), Y + PD - 24, { acc: U });
        break;
      }
      case "radio": {
        const x0 = X + 3, base = Y + PD - 3;
        this.box(x0 - 1, base - 6, 12, 5, 8, W, W);
        for (let j = 0; j < 14; j++)
          for (let i = 0; i < 10; i++) {
            const arch = j < 4 && Math.abs(i - 4.5) > 1 + j * 1.2;
            if (arch) continue;
            const edge = i === 0 || i === 9 || j === 0 || (j < 4 && Math.abs(i - 4.5) > j * 1.2 - 0.5);
            this.s(x0 + i, base - 22 + j, edge ? W[4] : j > 9 ? W[2] : (i + j) % 2 ? P.linen[2] : P.linen[3]);
          }
        (q.on ? this.g.bind(this) : this.s.bind(this))(x0 + 4, base - 11, q.on ? 0xffd070 : P.brass[2]);
        (q.on ? this.g.bind(this) : this.s.bind(this))(x0 + 5, base - 11, q.on ? 0xffe8a0 : P.brass[3]);
        if (q.on) this.notes.push({ x: x0 + 5, y: base - 24 });
        break;
      }
      case "range": {
        const x0 = X + 1, base = Y + PD - 3, w = PW - 2, E = P.linen;
        this.box(x0, base - 6, w, 6, 14, P.iron, P.iron);
        this.r(x0 + 2, base - 12, w - 4, 8, (i, j) => (i === 0 || j === 0 ? E[5] : j === 7 || i === w - 5 ? E[2] : E[4]));
        this.r(x0 + 4, base - 9, 8, 1, P.iron[4]);
        this.r(x0 + w - 12, base - 9, 8, 1, P.iron[4]);
        this.vase(x0 + 7, base - 21, 5, (t) => 3 - t * 0.8, P.iron);
        this.r(x0 + 10, base - 21, 3, 1, P.iron[3]);
        this.vase(x0 + w - 8, base - 21, 4, () => 3.4, P.iron);
        const flue = this.ceiling(q);
        this.r(x0 + w - 5, flue, 3, base - 20 - flue, (i) => P.iron[i === 0 ? 4 : 2]);
        for (let i = 0; i < 6; i++) (q.on ? this.g.bind(this) : this.s.bind(this))(x0 + w / 2 - 3 + i, base - 5, q.on ? [0xff8a30, 0xffb040][i % 2] : P.iron[0]);
        if (q.on) {
          this.lights.push({ x: x0 + w / 2, y: base - 5, c: 0xff8a3a, rad: 38, k: 1.1, phase: q.seed % 80 });
          this.smoke.push({ x: x0 + 7, y: base - 26 });
        }
        break;
      }
      case "icebox": {
        const x0 = X + 2, base = Y + PD - 3;
        this.box(x0, base - 6, 12, 6, 26, W, W);
        for (const [dy2, dh] of [[-28, 10], [-16, 12]]) this.r(x0 + 1, base + dy2, 10, dh, (i, j) => (i === 0 || j === 0 ? W[4] : i === 9 || j === dh - 1 ? W[1] : W[3]));
        for (const yy of [base - 24, base - 11]) this.r(x0 + 8, yy, 2, 3, P.brass[4]);
        break;
      }
      case "clock": {
        const cx = X + 8, top = oy - 44;
        this.r(cx - 5, top, 11, 30, (i, j) => (i === 0 || i === 10 ? W[1] : j < 2 ? W[5] : W[3]));
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 17) this.s(cx + i, top + 7 + j, i * i + j * j > 12 ? P.brass[4] : P.linen[5]);
        // The hands tell the room's hour.
        const ha = ((p.hour % 12) / 12) * Math.PI * 2, ma = ((p.hour % 1) * Math.PI * 2);
        for (let k = 1; k <= 2; k++) this.s(cx + Math.round(Math.sin(ha) * k), top + 7 - Math.round(Math.cos(ha) * k), P.iron[0]);
        for (let k = 1; k <= 3; k++) this.s(cx + Math.round(Math.sin(ma) * k), top + 7 - Math.round(Math.cos(ma) * k), P.iron[1]);
        const sw = Math.round(Math.sin(this.t * 3.1) * 2.5);
        for (let j = 13; j < 24; j++) this.s(cx + Math.round((sw * (j - 13)) / 11), top + j, P.brass[3]);
        this.disc(cx + sw, top + 25, 1, P.brass);
        break;
      }
      case "elevator": {
        const x0 = X + 1, top = oy - 38;
        this.r(x0 - 1, top - 8, 16, 46, (i, j) => (j < 8 ? (Math.abs(i - 7.5) < 8 - j * 0.9 ? P.brass[j % 2 ? 3 : 4] : P.trim[2]) : i < 2 || i > 13 ? P.brass[i % 13 === 0 ? 2 : 4] : P.trim[1]));
        for (let j = 0; j < 36; j++)
          for (let i = 2; i < 14; i++) {
            const k = Math.abs(((i - 2) % 6) - 3);
            this.s(x0 - 1 + i, top + j, i === 7 || i === 8 ? P.iron[0] : k === j % 7 ? P.brass[4] : P.iron[2 + ((i + j) & 1)]);
          }
        const a = Math.sin(this.t * 0.4) * 1.2;
        for (let k = 0; k < 5; k++) this.s(x0 + 7 + Math.round(Math.sin(a) * k), top - 3 - Math.round(Math.cos(a) * k * 0.6), P.iron[0]);
        this.g(x0 + 17, top + 18, 0xffd070);
        break;
      }
      case "frame": {
        const style = p.styles.frame ?? "painting", fin = p.finish;
        if (style === "levha") {
          this.levha(X + 1, oy - 42, 14, 12, q.seed);
          break;
        }
        if (style === "scroll") {
          // A hanging scroll: silk mount, a paper panel with an ink landscape, rollers.
          const x0 = X + 4, top = oy - 44, w = 8, h = 26;
          this.r(x0 - 1, top, w + 2, 2, W[2]);
          this.r(x0, top + 2, w, h, (i, j) => (i === 0 || i === w - 1 || j < 3 || j > h - 4 ? P.acc2[3] : P.paper[5]));
          for (let i = 1; i < w - 1; i++) {
            const m = 12 + Math.round(3 * Math.sin((i + q.seed) * 1.3));
            for (let j = m; j < h - 5; j++) this.s(x0 + i, top + 2 + j, mix(P.paper[4], P.iron[1], j === m ? 0.7 : 0.25));
          }
          this.s(x0 + 5, top + 8, 0xa8302a);
          this.r(x0 - 1, top + h + 2, w + 2, 2, W[2]);
          this.s(x0 - 2, top + h + 2, W[4]);
          this.s(x0 + w + 1, top + h + 2, W[4]);
          break;
        }
        const x0 = X + 1, top = oy - 40, w = 14, h = 12, F = fin === 2 || style === "miniature" ? P.brass : W;
        const portrait = hash(q.seed, 5, 1) < 0.35;
        for (let j = 0; j < h; j++)
          for (let i = 0; i < w; i++) {
            const e = Math.min(i, j, w - 1 - i, h - 1 - j);
            let c: number;
            if (e < 2) c = e === 0 ? F[1] : i < w / 2 && j < h / 2 ? F[4] : F[2];
            else if (portrait) {
              const dx = (i - w / 2 + 0.5) / 2.6, dy = (j - 5) / 2.6;
              c = dx * dx + dy * dy < 1 ? P.pale[3] : j > 7 && Math.abs(i - w / 2 + 0.5) < 4 ? P.acc[2] : mix(P.acc2[1], P.wood[1], 0.5);
            } else {
              const hill = 6 + Math.round(1.5 * Math.sin((i + q.seed) * 0.7));
              c = j < hill ? mix(P.acc2[4], P.linen[5], (j - 2) / 6) : j === hill ? P.leaf[3] : P.leaf[2 - (j > hill + 2 ? 1 : 0)];
              if (i === 9 && j >= hill - 2 && j <= hill) c = P.wood[1];
              if (Math.abs(i - 9) <= 1 && j === hill - 3) c = P.leaf[3];
            }
            if (style === "miniature" && e === 2) c = P.acc[3];
            this.s(x0 + i, top + j, c);
          }
        break;
      }
      case "clutter": {
        this.clutterItem(q, X, Y);
        break;
      }
      case "lamp": {
        const cx = X + 8, base = Y + PD - 4;
        this.r(cx - 3, base - 2, 7, 2, P.iron[2]);
        if (q.broken) {
          this.r(cx, base - 16, 1, 15, P.iron[3]);
          for (let j = 0; j < 7; j++) this.s(cx + 1 + (j >> 1), base - 16 - j, P.iron[3]);
          this.r(cx + 4, base - 1, 5, 2, (i) => P.brass[i < 2 ? 4 : 2]);
          this.s(cx + 9, base - 1, P.iron[1]);
          break;
        }
        this.r(cx, base - 30, 1, 29, P.iron[3]);
        this.r(cx - 3, base - 32, 7, 3, (i) => P.brass[i < 2 ? 5 : 3]);
        if (q.on) {
          this.flames.push({ x: cx, y: base - 34 });
          this.lights.push({ x: cx, y: base - 34, c: 0xffb45a, rad: 44, k: 1.1, phase: q.seed % 70 });
        }
        break;
      }
      case "firewood": {
        for (let row = 0; row < 3; row++)
          for (let k = 0; k < 3 - (row === 2 ? 1 : 0); k++) {
            const cx = X + 4 + k * 4 + (row === 2 ? 2 : 0), cy = Y + PD - 5 - row * 4;
            this.r(cx - 2, cy - 1, 5, 3, W[2]);
            this.s(cx, cy, W[5]);
            this.s(cx - 1, cy, W[4]);
            this.s(cx + 1, cy - 1, W[1]);
          }
        this.r(X + 12, Y + PD - 20, 1, 8, P.iron[2]);
        this.r(X + 11, Y + PD - 21, 3, 2, P.iron[3]);
        break;
      }
      case "broom": {
        for (let j = 0; j < 26; j++) this.s(X + 6 + (j >> 3), Y + PD - 12 - 26 + j, W[3]);
        for (let j = 0; j < 9; j++)
          for (let i = -2 - (j >> 2); i <= 2 + (j >> 2); i++) this.s(X + 9 + i, Y + PD - 12 + j, P.straw[(i + j) % 3 === 0 ? 2 : j === 0 ? 5 : 4]);
        this.r(X + 7, Y + PD - 12, 5, 1, 0xa8302a);
        break;
      }
      case "casks": {
        const base = Y + PD - 2, drink = p.styles.bar ?? "ale";
        if (drink === "sake") {
          // Komodaru: casks wrapped in straw matting, roped, the brewer's mark on the front.
          const cask = (x: number, b: number, k: number) => {
            this.r(x, b - 14, 13, 14, (i, j) => (i === 0 || i === 12 || j === 0 || j === 13 ? W[0] : j === 1 ? P.straw[5] : j === 4 || j === 11 ? P.wood[1] : i < 3 ? P.straw[4] : i > 9 ? P.straw[2] : P.straw[3]));
            this.r(x + 3, b - 10, 7, 6, (i, j) => (i === 0 || j === 0 || i === 6 || j === 5 ? P.acc[1] : P.linen[5]));
            const mark = (q.seed + k) % 3;
            if (mark === 0) this.disc(x + 6, b - 7, 1, [0, 0xa8302a, 0xa8302a, 0xc8402a, 0xc8402a, 0xd85a3a]);
            else this.r(x + 5 + (mark - 1), b - 9, 2, 4, P.iron[0]);
          };
          for (let k = 0; k < q.w; k++) cask(X + 2 + k * 15, base, k);
          for (let k = 0; k < q.w - 1; k++) cask(X + 9 + k * 15, base - 14, k + 5);
          break;
        }
        if (drink === "coffee") {
          // Shelves of small cups and the long-handled pots, sacks of beans below.
          for (const [j, row] of [[base - 26, 0], [base - 14, 1]] as const) {
            this.r(X + 1, j, PW - 2, 2, (_i, jj) => W[jj ? 1 : 4]);
            for (let k = 0; k < (PW - 6) / 5; k++) {
              const cx = X + 3 + k * 5;
              if ((k + row + q.seed) % 4 === 3) this.vase(cx + 1, j - 1, 6, (t) => 1.6 - t * 0.6, P.brass);
              else this.r(cx, j - 3, 3, 3, (i, jj) => (jj === 0 ? P.linen[5] : i === 2 ? P.acc[2] : (k + row) % 2 ? P.acc[4] : P.linen[4]));
            }
          }
          this.sprite("sack", X + 2, base - 12);
          this.sprite("sack", X + PW - 16, base - 12, { straw: P.linen });
          break;
        }
        // The stillage: two lit beams on squat legs.
        for (const lx of [X + 2, X + PW - 6]) this.r(lx, base - 3, 4, 3, (i) => W[i === 0 ? 0 : i === 1 ? 3 : i === 3 ? 0 : 2]);
        this.r(X + 1, base - 6, PW - 2, 3, (i, j) => (i === 0 || i === PW - 3 ? W[0] : j === 0 ? W[4] : j === 1 ? W[3] : W[1]));
        const n = q.w, r0 = 7;
        for (let k = 0; k < n; k++) this.caskEnd(X + 8 + k * 16, base - 6 - r0, r0, q.seed + k, true);
        for (let k = 0; k < n - 1; k++) this.caskEnd(X + 16 + k * 16, base - 6 - r0 * 2 - 5, 6, q.seed + 9 + k, false);
        // A pail under the taps catches the drip.
        const px = X + 8 + (q.seed % n) * 16;
        this.r(px - 3, base - 1, 7, 1, W[0]);
        this.r(px - 3, base - 5, 7, 4, (i, j) => (i === 0 || i === 6 ? W[0] : j === 0 ? W[5] : j === 2 ? P.iron[2] : W[2 + (i < 3 ? 1 : 0)]));
        break;
      }
      case "bar": {
        const h = 21, y0 = Y + 3, d = PD - 6, top = y0 - h;
        // The serving board: a lit edge, planks with seams, a thick lip.
        this.r(X, top - 1, PW, 1, W[0]);
        this.r(X, top, PW, d, (i, j) => (i === 0 || i === PW - 1 ? W[0] : j === 0 ? W[5] : i % 16 === 15 ? W[2] : i === 1 ? W[5] : hash(i >> 4, j, q.seed) < 0.06 ? W[3] : W[4]));
        this.r(X, top + d, PW, 2, (i, j) => (i === 0 || i === PW - 1 ? W[0] : j === 0 ? W[3] : W[1]));
        // Upright boards down the front, a rail under the lip, a dark kick at the foot.
        const fy = top + d + 2, fh = y0 + d - fy;
        this.r(X, fy, PW, fh, (i, j) => {
          if (i === 0 || i === PW - 1 || j === fh - 1) return W[0];
          if (j < 2) return W[j === 0 ? 1 : 3];
          if (j >= fh - 4) return W[j === fh - 4 ? 3 : 1];
          const b = (i - 1) % 5;
          return b === 0 ? W[1] : b === 1 ? W[3] : hash((i - 1) / 5 | 0, j >> 3, q.seed) < 0.2 ? W[1] : W[2];
        });
        // The flap at the room end, where the keeper comes through.
        const fx = q.seed % 2 ? X + PW - 13 : X + 12;
        this.r(fx, top, 1, d + 2, W[1]);
        this.r(fx, fy, 1, fh - 1, W[0]);
        const ty = top + 2, drink = p.styles.bar ?? "ale";
        if (drink === "coffee") {
          // The ocak: the coffee maker's hearth, charcoal glowing in a tiled box, the pots in the embers.
          this.r(X + 4, top + 1, PW - 8, d - 3, (i, j) => (j === 0 ? P.stone[1] : hash(i, j, q.seed) < 0.5 ? 0xd0542a : 0x8a2a1a));
          for (let k = 0; k < Math.floor((PW - 12) / 9); k++) {
            const cx = X + 9 + k * 9;
            this.vase(cx, ty + 4, 5, (t) => 2.4 - t * 0.8, P.brass);
            this.r(cx + 3, ty + 1, 4, 1, P.brass[2]);
          }
          this.r(X + 1, fy + 2, PW - 2, fh - 6, (i, j) => (i % 8 === 0 || j % 8 === 0 ? P.linen[4] : ((i >> 3) + (j >> 3)) % 2 ? P.acc[3] : P.linen[5]));
          this.lights.push({ x: X + PW / 2, y: ty + 2, c: 0xff8a3a, rad: 40, k: 0.9, phase: q.seed % 90 });
          break;
        }
        if (drink === "sake") {
          for (let k = 0; k < Math.floor((PW - 6) / 8); k++) {
            const x = X + 5 + k * 8;
            if (k % 2) this.choko(x, ty + 6);
            else this.tokkuri(x + 1, ty + 6, k);
          }
          this.r(X + PW - 14, ty + 2, 10, 4, (i, j) => (j === 0 ? 0x5a1a1a : i === 0 || i === 9 ? 0x2a0e0e : 0x8a2420));
          break;
        }
        this.mug(X + 5, ty + 5, 0);
        this.mug(X + 11, ty + 6, 1);
        if (PW > 48) this.mug(X + PW - 22, ty + 5, 0);
        this.jug(X + PW - 10, ty + 7);
        this.r(X + 19, ty + 3, 9, 3, (i, j) => (j === 0 ? P.linen[5] : i === 8 ? P.linen[2] : P.linen[4]));
        this.candle(X + PW / 2 + 4, ty + 4, q.seed);
        break;
      }
      case "bench": {
        const base = Y + PD - 3, top = base - 12;
        this.r(X + 1, top, PW - 2, 1, W[0]);
        this.r(X + 1, top + 1, PW - 2, 6, (i, j) =>
          i === 0 || i === PW - 3 ? W[0] : j === 0 ? W[5] : j < 3 ? (i === 1 ? W[5] : hash(i >> 3, j, q.seed) < 0.12 ? W[3] : W[4]) : j === 3 ? W[3] : j === 4 ? W[2] : W[1]);
        this.r(X + 1, top + 7, PW - 2, 1, W[0]);
        for (const lx of [X + 5, X + PW - 9]) {
          this.r(lx, top + 8, 4, 4, (i) => W[i === 0 || i === 3 ? 0 : i === 1 ? 3 : 2]);
          this.r(lx - 1, base - 1, 6, 1, W[0]);
        }
        this.r(X + 9, top + 9, PW - 18, 2, (_i, j) => W[j ? 1 : 2]);
        break;
      }
      case "settle": {
        const base = Y + PD - 3, top = base - 37, sy = base - 13, x1 = X + PW;
        // A hood over a back of raised panels, wings down either side, a box seat.
        this.r(X, top, PW, 5, (i, j) => (i === 0 || i === PW - 1 || j === 4 ? W[0] : j === 0 ? W[0] : j === 1 ? W[5] : j === 2 ? W[4] : W[2]));
        this.dim(X + 3, top + 5, PW - 6, 2, 0.7);
        for (const cx of [X, x1 - 4])
          this.r(cx, top + 5, 4, base - top - 5, (i, j) => (i === 0 || i === 3 ? W[0] : j > sy - top - 9 && j < sy - top - 5 ? W[i === 1 ? 5 : 4] : i === 1 && cx === X ? W[4] : i === 1 ? W[3] : W[2]));
        const bx = X + 4, bw = PW - 8, by = top + 5, bh = sy - by;
        this.r(bx, by, bw, bh, W[3]);
        const n = 2, gap = 2, pw = Math.floor((bw - gap * (n + 1)) / n);
        for (let k = 0; k < n; k++) {
          const px = bx + gap + k * (pw + gap), py = by + 3, ph = bh - 6;
          this.r(px, py, pw, ph, (i, j) => {
            if (j === 0 || i === 0) return W[1];
            if (j === ph - 1 || i === pw - 1) return W[5];
            const e = Math.min(i - 1, j - 1, pw - 2 - i, ph - 2 - j);
            if (e === 0) return i - 1 === 0 || j - 1 === 0 ? W[4] : W[2];
            return hash(i >> 1, j >> 2, q.seed) < 0.12 ? W[2] : W[3];
          });
        }
        this.r(X + 4, sy - 1, PW - 8, 1, W[0]);
        if (p.finish > 0) this.r(X + 4, sy - 3, PW - 8, 3, (i, j) => (j === 0 ? P.acc[4] : j === 2 ? P.acc[1] : i % 7 === 3 ? P.acc[2] : P.acc[3]));
        this.r(X + 4, sy, PW - 8, 3, (i, j) => (j === 0 ? W[5] : i === 0 ? W[5] : W[4]));
        this.r(X + 4, sy + 3, PW - 8, 1, W[0]);
        const fh = base - sy - 4;
        this.r(X + 4, sy + 4, PW - 8, fh, (i, j) => (j === fh - 1 ? W[0] : j === 0 ? W[3] : i === 2 || j === 2 ? W[1] : i === PW - 11 || j === fh - 3 ? W[4] : W[2]));
        break;
      }
      case "pool": {
        // A sunk basin: a lit marble kerb, the drop inside it, water lit from above.
        const tub = p.styles.pool === "tub", R = tub ? W : P.stone;
        const hot = p.styles.pool !== "cold";
        const water = (i: number, j: number) => {
          const deep = j / PD;
          const c = mix(tub ? 0x6a8a7a : 0x3a8a9a, tub ? 0x2a4a44 : 0x1a4a62, Math.min(1, deep * 1.4));
          return Math.sin(i * 0.45 + j * 0.9 + q.seed + this.t * 2) > 0.92 ? mix(c, 0xffffff, 0.35) : c;
        };
        this.r(X, Y, PW, PD, (i, j) => {
          const e = Math.min(i, j, PW - 1 - i, PD - 1 - j);
          if (e < 2) return j < 2 ? R[5 - j] : i < 2 ? R[4] : R[2 + (e === 0 ? -1 : 0)];
          if (e === 2 && j === 2) return R[1];
          return water(i, j);
        });
        if (hot) for (let k = 0; k < 3; k++) this.smoke.push({ x: X + 6 + k * Math.floor((PW - 12) / 2), y: Y + 6 });
        break;
      }
      case "slab": {
        // The göbek taşı: a raised marble platform heated from beneath.
        const h = 7, top = Y + 2;
        this.r(X + 1, top - h, PW - 2, PD - 3, (i, j) => (j === 0 ? P.linen[5] : i === 0 ? P.linen[5] : hash(i >> 2, j >> 2, q.seed) < 0.2 ? P.stone[4] : P.linen[4]));
        this.r(X + 1, top + PD - 3 - h, PW - 2, h, (_i, j) => (j === 0 ? P.stone[4] : j === h - 1 ? P.stone[1] : P.stone[3]));
        this.smoke.push({ x: X + PW / 2, y: top - h });
        break;
      }
      case "basin": {
        // A kurna or labrum against the wall, its spout above.
        const base = Y + PD - 3;
        this.r(X + 2, base - 8, 12, 8, (i, j) => (j === 0 ? P.linen[5] : j === 1 && i > 1 && i < 10 ? 0x3a8a9a : i === 0 ? P.linen[4] : j === 7 ? P.stone[1] : P.stone[3]));
        this.r(X + 7, base - 16, 2, 6, (i) => P.brass[i ? 2 : 4]);
        this.s(X + 7, base - 10, 0x9ad0e0);
        break;
      }
      case "altar":
        this.altar(p.styles.altar ?? "gothic", q, X, Y, PW, PD);
        break;
      case "pew": {
        // Seen from behind, as the congregation faces away: the back board, its rail, the ends.
        const base = Y + PD - 2, box = p.styles.pew === "box";
        const h = box ? 20 : 15;
        this.r(X + 1, base - 9, PW - 2, 3, (i, j) => (j === 0 ? W[4] : W[3 - (i === 0 ? 1 : 0)]));
        this.r(X + 1, base - h, PW - 2, h - 2, (i, j) => {
          if (j === 0) return W[5];
          if (j === 1) return W[3];
          if (i === 0 || i === PW - 3) return W[1];
          if (box) return (i - 2) % 14 === 0 || j === 4 || j === h - 5 ? W[1] : (i - 2) % 14 === 1 || j === 5 ? W[4] : W[2];
          return j === h - 3 ? W[1] : j > 2 && j < 5 ? W[3] : W[2];
        });
        for (const ex of [X + 1, X + PW - 3]) this.r(ex, base - h - 1, 2, h + 1, (i, j) => (j === 0 ? W[5] : i ? W[1] : W[3]));
        if (box) this.s(X + PW - 6, base - 9, P.brass[4]);
        break;
      }
      case "prayer": {
        // A prayer rug, its niche pointing to the qibla.
        for (let j = 0; j < 14; j++)
          for (let i = 0; i < 12; i++) if (!((j === 0 || j === 13) && i % 2)) this.s(X + 2 + i, Y + 1 + j, carpetColor(i, j, 12, 14, q.seed, "prayer"));
        break;
      }
      case "font": {
        // An octagonal stone bowl on a stem, a carved band round it, a lid.
        const cx = X + 8, base = Y + PD - 3;
        this.r(cx - 5, base - 3, 11, 3, (i, j) => (j === 0 ? P.stone[4] : i === 0 ? P.stone[3] : P.stone[1 + (j > 1 ? 0 : 1)]));
        this.r(cx - 2, base - 11, 5, 8, (i) => P.stone[i === 0 ? 4 : i === 4 ? 1 : 3]);
        this.r(cx - 6, base - 20, 13, 9, (i, j) => (j === 0 ? P.stone[5] : i === 0 || i === 12 ? P.stone[1] : j === 4 ? P.stone[2] : (i % 4 === 1 && j > 1 && j < 8) ? P.stone[2] : P.stone[i < 4 ? 4 : 3]));
        this.r(cx - 5, base - 22, 11, 2, (_i, j) => (j ? W[2] : W[4]));
        this.r(cx, base - 25, 1, 3, P.brass[4]);
        break;
      }
      case "pulpit":
        if (p.styles.pulpit === "minbar") this.minbar(X, Y + PD - 3);
        else this.pulpit(X, Y + PD - 3, q.seed);
        break;
      case "ledge": {
        // A plastered bench built against the wall, one tile of it.
        const top = Y + PD - 12;
        this.r(X, top, PW, 4, (i, j) => (j === 0 ? P.wall[5] : i === 0 ? P.wall[4] : P.wall[4 - (j >> 1)]));
        this.r(X, top + 4, PW, 7, (_i, j) => (j === 0 ? P.wall[2] : j === 6 ? P.wall[0] : P.wall[2 - (j > 3 ? 1 : 0)]));
        break;
      }
      case "sipapu": {
        const cx = X + 8, cy = Y + 8;
        for (let j = -3; j <= 3; j++)
          for (let i = -4; i <= 4; i++) {
            const e = Math.hypot(i, j * 1.3);
            if (e <= 2.2) this.s(cx + i, cy + j, j < 0 ? 0x0e0a0a : 0x1e1612);
            else if (e <= 3.4) this.s(cx + i, cy + j, j < 0 ? P.floor[1] : P.floor[4]);
          }
        break;
      }
      case "tankards": {
        const ry = oy - 33;
        this.r(X, ry, 16, 2, (_i, j) => W[j ? 1 : 4]);
        this.s(X, ry + 2, W[0]);
        this.s(X + 15, ry + 2, W[0]);
        for (let k = 0; k < 3; k++) {
          const hx = X + 2 + k * 5;
          this.s(hx + 1, ry + 2, W[0]);
          this.mug(hx, ry + 10 + (k & 1), (q.seed + k) % 3 === 2 ? 2 : (q.seed + k) % 2);
        }
        break;
      }
      case "tally": {
        const x0 = X + 2, y0 = oy - 36, drink = p.styles.bar ?? "ale";
        if (drink === "sake") {
          // Menu slips: the day's dishes brushed on paper and pinned up in a row.
          for (let k = 0; k < 3; k++) {
            const sx = X + 2 + k * 5, sy = oy - 40 + (k % 2);
            this.r(sx, sy, 4, 14, (i, j) => (j === 0 ? P.paper[3] : i === 3 ? P.paper[3] : P.paper[5]));
            for (let j = 2; j < 12; j += 2 + ((q.seed + k + j) % 2)) this.r(sx + 1, sy + j, 2, 1, P.iron[0]);
          }
          break;
        }
        if (drink === "coffee") {
          this.levha(X + 2, oy - 36, 12, 9, q.seed);
          break;
        }
        this.s(x0 + 6, y0 - 3, P.iron[2]);
        this.s(x0 + 4, y0 - 2, W[1]);
        this.s(x0 + 8, y0 - 2, W[1]);
        this.r(x0, y0, 12, 10, (i, j) => (i === 0 || j === 0 ? W[4] : i === 11 || j === 9 ? W[1] : i === 1 || j === 1 || i === 10 || j === 8 ? W[2] : hash(i, j, q.seed) < 0.1 ? 0x3a4046 : 0x2c3036));
        // Chalked reckonings: fives struck through, one score half-rubbed.
        const marks = 4 + (q.seed % 9);
        for (let m = 0; m < marks; m++) {
          const g = (m / 5) | 0, k = m % 5, mx = x0 + 3 + (g % 2) * 4 + (k < 4 ? k : 0), my = y0 + 2 + ((g / 2) | 0) * 3;
          const c = g === 1 ? P.linen[3] : P.linen[5];
          if (my > y0 + 7) break;
          if (k < 4) this.r(mx, my, 1, 2, c);
          else for (let t = 0; t < 4; t++) this.s(mx + t, my + 1 - (t >> 1), c);
        }
        break;
      }
      case "cat": {
        const perch = this.props.find((o) => o !== q && !o.wall && o.kind !== "rug" && o.kind !== "cat" && q.x >= o.x && q.x < o.x + o.w && q.y >= o.y && q.y < o.y + o.d);
        const lift = perch ? (perch.kind === "counter" ? 16 : 11) : 0;
        const cx = X + 8, base = Y + 10 - lift, F = P.fur;
        if (pr < 0.5) {
          for (let j = 0; j < 6; j++)
            for (let i = -5; i <= 5; i++) {
              if ((j === 0 && Math.abs(i) > 3) || (j === 1 && Math.abs(i) > 4)) continue;
              this.s(cx + i, base - j, (i + 9) % 4 === 0 && j > 1 ? F[2] : F[j > 3 ? 4 : 3]);
            }
          const breathe = Math.sin(this.t * 2) > 0 ? 1 : 0;
          this.s(cx - 5, base - 6 - breathe, F[3]);
          this.s(cx - 3, base - 6 - breathe, F[3]);
          this.r(cx - 5, base - 5, 3, 3, F[4]);
          for (let i = -4; i <= 5; i++) this.s(cx + i, base + 1, F[2]);
          this.zz.push({ x: cx - 4, y: base - 8 });
        } else {
          for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) if (!(j > 5 && Math.abs(i) > 2)) this.s(cx + i, base - j, F[j < 2 ? 2 : i < 0 ? 4 : 3]);
          this.r(cx - 2, base - 12, 5, 4, F[4]);
          this.s(cx - 2, base - 13, F[3]);
          this.s(cx + 2, base - 13, F[3]);
          const blink = (this.t % 3.2) < 0.15;
          this.s(cx - 1, base - 10, blink ? F[2] : 0x2a3a18);
          this.s(cx + 1, base - 10, blink ? F[2] : 0x2a3a18);
          const tail = Math.round(Math.sin(this.t * 3) * 2);
          for (let j = 0; j < 5; j++) this.s(cx + 4 + (j > 2 ? tail : 0), base - j, F[2]);
        }
        break;
      }
    }
  }

  /** Doorways without a hinged door: a hide flap, a hung curtain, a plain opening. */
  private doorway(q: Prop, x0: number, oy: number, open: number, sunNow: ReturnType<typeof sun>) {
    const { P, p } = this, top = oy - 33, day = sunNow.strength, flap = p.door === "flap";
    const half = (j: number) => (flap ? Math.max(1, Math.round((7 * (j + 2)) / 35)) : 7);
    for (let j = 0; j < 33; j++)
      for (let i = 7 - half(j); i < 7 + half(j); i++) {
        const v = j / 33, c = v < 0.55 ? sky(p.hour, v * 1.6) : mix(0x20301c, 0x7fa150, day);
        this.g(x0 + i, top + j, c);
      }
    for (let j = 0; j < 33; j++) {
      this.s(x0 + 6 - half(j), top + j, P.wall[0]);
      this.s(x0 + 7 + half(j), top + j, P.wall[0]);
    }
    if (p.door === "curtain") {
      const cw = Math.round(14 * (1 - open));
      for (let j = 0; j < 33; j++)
        for (let i = 0; i < cw; i++) this.s(x0 + i, top + j, (i + (j >> 3)) % 4 < 2 ? P.acc[3] : P.acc[2 - (i % 4 === 3 ? 1 : 0)]);
      if (open > 0.3) this.r(x0 - 1, top, 3, 33, (i, j) => P.acc[j % 5 === 0 ? 1 : 3 - i]);
      this.r(x0 - 2, top - 2, 18, 2, P.wood[3]);
    } else if (flap) {
      const shut = 1 - open;
      for (let j = 0; j < 33; j++) {
        const hw = half(j), reach = Math.round(hw * 2 * shut);
        for (let i = 0; i < reach; i++) this.s(x0 + 7 - hw + i, top + j, P.wall[(i + j) % 7 === 0 ? 2 : 3]);
        if (shut > 0.5) this.s(x0 + 7, top + j, j % 3 === 0 ? P.trim[1] : P.wall[2]);
        if (open > 0.3 && j > 10) this.r(x0 - 3 - Math.round((33 - j) / 8), top + j, 3, 1, P.wall[2]);
      }
    }
    if (open > 0.02) {
      this.beams.push({ x0: x0 + 2, x1: x0 + 12, top: oy - 2, floor: oy, len: 32, skew: 0, k: open * (0.2 + day * 0.8), c: mix(0x8aa0d8, sunNow.color, day) });
      this.lights.push({ x: x0 + 7, y: oy - 10, c: mix(0x5a6ab0, 0xfff0dc, day), rad: 40, k: open * (0.15 + day * 0.5), phase: -1 });
    }
    void q;
  }
  private fire(cx: number, base: number, w: number, lit: boolean, seed: number, k: number) {
    this.fires.push({ x: cx - (w >> 1), y: base, w, h: Math.round(w * 0.9), lit });
    if (!lit) return;
    this.lights.push({ x: cx, y: base - 4, c: 0xff8a3a, rad: 30 + w * 2.4, k, phase: seed % 100 });
    this.smoke.push({ x: cx, y: base - w });
    if (this.p.smokehole) {
      const day = sun(this.p.hour).strength;
      if (day > 0) this.lights.push({ x: cx, y: base - 6, c: sky(this.p.hour, 0.2), rad: 34, k: day * 0.55, phase: -1 });
    }
  }

  private clutterItem(q: Prop, X: number, Y: number) {
    const { P } = this, W = P.wood;
    const ox = X + 3 + Math.floor(hash(q.seed, 1, 3) * 8), oy = Y + 5 + Math.floor(hash(q.seed, 2, 3) * 7);
    switch (q.item) {
      case "shoes":
        for (const dx of [0, 4]) this.r(ox + dx, oy, 3, 5, (i, j) => (j === 0 ? P.fur[3] : i === 1 && j < 3 ? P.fur[0] : P.fur[1 + (j === 4 ? 0 : 1)]));
        break;
      case "grain":
        for (let k = 0; k < 14; k++) this.s(ox + hash(k, 0, q.seed) * 8, oy + hash(k, 1, q.seed) * 4 + (k % 3), P.straw[k % 3 ? 4 : 5]);
        break;
      case "bowl":
        this.r(ox, oy + 1, 6, 2, (i, j) => (j === 0 ? P.clay[4] : P.clay[i === 0 ? 3 : 2]));
        this.r(ox + 1, oy, 4, 1, P.clay[1]);
        this.s(ox + 2, oy, P.straw[4]);
        break;
      case "pot":
        this.vase(ox + 2, oy + 4, 5, (t) => 2.2 - Math.abs(t - 0.4) * 1.5, P.clay);
        break;
      case "cloth":
        this.r(ox, oy, 7, 4, (i, j) => (j === 0 ? P.acc2[5] : j === 3 ? P.acc2[1] : i % 3 === 0 ? P.acc2[4] : P.acc2[3]));
        break;
      case "cup":
        this.r(ox, oy, 3, 3, (i, j) => (j === 0 ? P.linen[5] : i === 2 ? P.linen[2] : P.linen[4]));
        this.s(ox + 3, oy + 1, P.linen[3]);
        break;
      case "toy":
        this.r(ox, oy + 1, 5, 2, W[3]);
        this.r(ox + 4, oy - 1, 2, 2, W[4]);
        this.s(ox, oy + 3, W[1]);
        this.s(ox + 4, oy + 3, W[1]);
        this.s(ox - 1, oy + 1, P.acc[3]);
        break;
      case "yarn":
        this.disc(ox + 2, oy + 2, 2, P.acc);
        for (let i = 0; i < 6; i++) this.s(ox + 4 + i, oy + 3 + Math.round(Math.sin(i) * 1), P.acc[3]);
        break;
      case "book":
        this.r(ox, oy, 6, 4, (i, j) => (j === 3 ? P.paper[3] : i === 0 ? P.acc[1] : P.acc[3]));
        break;
      case "shards":
        for (let k = 0; k < 5; k++) this.r(ox + hash(k, 0, q.seed) * 7, oy + hash(k, 1, q.seed) * 4, 2, 1, P.clay[2 + (k % 3)]);
        break;
      case "flowers":
        this.vase(ox + 2, oy + 4, 4, () => 1.3, P.clay);
        for (const [dx, dy, c] of [[0, -2, P.acc[4]], [2, -3, 0xf4e6f0], [4, -2, P.acc3[4]]] as const) {
          this.s(ox + dx, oy + dy + 1, P.leaf[3]);
          this.s(ox + dx, oy + dy, c);
        }
        break;
      case "pipe":
        for (let i = 0; i < 8; i++) this.s(ox + i, oy + 2 - (i >> 2), P.linen[i < 2 ? 4 : 5]);
        this.r(ox + 7, oy - 1, 2, 2, (i) => P.linen[i ? 3 : 5]);
        this.s(ox + 7, oy - 1, 0x3a2a22);
        break;
      case "paper":
        this.r(ox, oy, 5, 4, (i, j) => (j === 1 && i > 0 && i < 4 ? P.paper[2] : P.paper[5]));
        this.r(ox + 3, oy + 2, 5, 3, P.paper[4]);
        break;
      default:
        this.disc(ox + 2, oy + 2, 2, P.straw);
    }
  }

  private plate(cx: number, cy: number, seed: number) {
    const { P } = this;
    for (let j = -4; j <= 4; j++)
      for (let i = -4; i <= 4; i++) {
        const q = i * i + j * j;
        if (q > 18) continue;
        this.s(cx + i, cy + j, q > 12 ? P.clay[2] : q > 6 ? (seed % 2 ? P.acc[3] : P.acc2[3]) : q < 2 ? P.acc[4] : P.paper[4]);
      }
  }
  private goods(x: number, base: number, w: number, seed: number, dens = 1) {
    const { P } = this;
    let i = 0;
    const R = [P.acc, P.acc2, P.acc3, P.linen, P.clay, P.leaf];
    while (i < w - 1) {
      const k = hash(i, 0, seed);
      if (hash(i, 9, seed) > dens) {
        i += 4;
        continue;
      }
      switch (this.p.trade) {
        case "scholar": {
          const bw = 1 + (k * 2 | 0), h = 6 + (hash(i, 1, seed) * 4 | 0), c = R[(k * 6) | 0];
          if (k > 0.85) {
            this.r(x + i, base - 3, 5, 3, (a, b) => (a === 0 ? P.paper[5] : b === 0 ? P.paper[4] : P.paper[2]));
            i += 6;
          } else {
            this.r(x + i, base - h, bw, h, (a, b) => (b === 1 ? P.brass[4] : a === 0 ? c[4] : c[2]));
            i += bw + (k > 0.7 ? 1 : 0);
          }
          break;
        }
        case "potter": {
          const h = 4 + (k * 5 | 0), R0 = k > 0.5 ? P.clay : k > 0.25 ? P.acc : P.pale;
          this.vase(x + i + 2, base - 1, h, (t) => 2 - Math.abs(t - 0.4) * 1.5 + (t > 0.85 ? 0.5 : 0), R0);
          i += 5;
          break;
        }
        case "weaver": {
          if (k > 0.5) {
            const R0 = R[(k * 3) | 0];
            for (let l = 0; l < 3; l++) this.r(x + i, base - 2 - l * 2, 6, 2, (_a, b) => R0[b === 0 ? 5 - l : 2]);
            i += 7;
          } else {
            this.disc(x + i + 2, base - 3, 2, R[((k * 8) | 0) % 6]);
            i += 5;
          }
          break;
        }
        default: {
          if (k > 0.6) {
            this.r(x + i, base - 5, 5, 5, (a, b) => (b === 0 ? P.wood[5] : a === 0 ? P.wood[4] : P.wood[2]));
            i += 6;
          } else {
            const R0 = [P.pale, P.clay, P.leaf, P.acc2][(k * 4) | 0];
            this.vase(x + i + 1, base - 1, 5 + (k * 4 | 0), (t) => (t > 0.7 ? 0.6 : 1.6), R0);
            i += 4;
          }
        }
      }
    }
  }

  private shade() {
    const { W, H, col, glow, p } = this;
    const data = this.img!.data;
    const sunNow = sun(p.hour);
    const day = sunNow.strength;
    const amb = [0.2 + day * 0.32, 0.22 + day * 0.3, 0.34 + day * 0.24];
    const lights = this.lights.map((l) => {
      const f = l.phase < 0 ? 1 : 0.84 + 0.1 * Math.sin(this.t * 9 + l.phase) + 0.06 * Math.sin(this.t * 23 + l.phase * 2);
      return { ...l, f: l.k * f, r: ((l.c >> 16) & 255) / 255, g: ((l.c >> 8) & 255) / 255, b: (l.c & 255) / 255 };
    });
    const beams = this.beams.map((b) => ({ ...b, r: ((b.c >> 16) & 255) / 255, g: ((b.c >> 8) & 255) / 255, bl: (b.c & 255) / 255 }));
    const oy = this.oy;
    const sr = ((sunNow.color >> 16) & 255) / 255, sg = ((sunNow.color >> 8) & 255) / 255, sb = (sunNow.color & 255) / 255;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x, c = col[i], o = i * 4;
        if (glow[i]) {
          data[o] = (c >> 16) & 255;
          data[o + 1] = (c >> 8) & 255;
          data[o + 2] = c & 255;
          data[o + 3] = 255;
          continue;
        }
        let lr = amb[0], lg = amb[1], lb = amb[2];
        for (const l of lights) {
          const dx = x - l.x, dy = (y - l.y) * 1.2, d2 = dx * dx + dy * dy;
          const k = (l.f / (1 + d2 / (l.rad * l.rad * 0.35))) * Math.max(0, 1 - Math.sqrt(d2) / (l.rad * 2.4));
          lr += k * l.r;
          lg += k * l.g;
          lb += k * l.b;
        }
        const cx = (x - S) >> 4, cy = (y - oy) >> 4;
        if (y >= oy && x >= S && cx < p.w && cy < p.d && this.mask[cy * p.w + cx] === 2) {
          lr += day * 1.1 * sr;
          lg += day * 1.1 * sg;
          lb += day * 1.1 * sb;
        }
        for (const b of beams) {
          if (y >= b.floor && y < b.floor + b.len) {
            const t = (y - b.floor) / b.len, off = b.skew * t;
            const edge = Math.min(x - (b.x0 + off), b.x1 + off - x);
            if (edge > -1) {
              const k = b.k * Math.min(1, (edge + 1) / 2) * (1 - t * 0.35);
              lr += k * b.r;
              lg += k * b.g;
              lb += k * b.bl;
            }
          }
          if (y >= b.top && y < b.floor + b.len) {
            const t = (y - b.top) / (b.floor + b.len - b.top), off = b.skew * t;
            if (x >= b.x0 + off && x < b.x1 + off) {
              const k = b.k * 0.14 * (1 - t) * (0.8 + 0.2 * Math.sin(this.t * 0.7 + y * 0.2));
              lr += k * b.r;
              lg += k * b.g;
              lb += k * b.bl;
            }
          }
        }
        const th = BAYER[(y & 3) * 4 + (x & 3)];
        const q = (v: number) => Math.floor(Math.min(1.7, v) * 7 + th) / 7;
        data[o] = Math.min(255, ((c >> 16) & 255) * q(lr));
        data[o + 1] = Math.min(255, ((c >> 8) & 255) * q(lg));
        data[o + 2] = Math.min(255, (c & 255) * q(lb));
        data[o + 3] = 255;
      }
  }

  /** The drawn colours as they are, for a light layer to be laid over. */
  private albedo() {
    const { col } = this, data = this.img!.data;
    for (let i = 0, n = col.length; i < n; i++) {
      const c = col[i], o = i * 4;
      data[o] = (c >> 16) & 255;
      data[o + 1] = (c >> 8) & 255;
      data[o + 2] = c & 255;
      data[o + 3] = 255;
    }
  }
  /** Light as its own layer, the way Stardew lights a room: an ambient colour
   * for the hour, soft pools from fires and lamps, the sun's patch on the
   * floor, all multiplied over the crisp drawing; then a shaft of lit air
   * from each window and a small warm core at each flame, added on top; and
   * whatever gives its own light (flames, the sky in a window) drawn back
   * over at full strength. Nothing is blurred into the drawing itself. */
  private lightLayer() {
    const { W, H, p, ctx } = this;
    const make = () => document.createElement("canvas").getContext("2d")!;
    const own = !this.layers;
    const { light: L, add: A, glow: G } = this.layers ?? (this.ownLayers ??= { light: make(), add: make(), glow: make() });
    for (const c of [L, A, G]) if (c.canvas.width !== W || c.canvas.height !== H) (c.canvas.width = W), (c.canvas.height = H);
    const sunNow = sun(p.hour), day = sunNow.strength;
    const windows = this.props.filter((q) => q.kind === "window" && (q.on || p.windowStyle !== "shutter")).length;
    const dusk = Math.max(0, 1 - Math.abs(p.hour - 18.6) / 1.8) + Math.max(0, 1 - Math.abs(p.hour - 6.2) / 1.4);
    // Night is a deep blue-violet; dusk and dawn amber; day near white, dimmer with fewer windows.
    const bright = 0.72 + Math.min(3, windows) * 0.08;
    const dayCol = mix(0x282a62, mix(0xb8b0c8, 0xfff6ec, bright), Math.min(1, day * 1.4));
    const amb = mix(dayCol, 0xe8a070, Math.min(0.55, dusk * 0.45) * (0.4 + day));
    const hex = (c: number, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
    L.globalCompositeOperation = "source-over";
    L.filter = "none";
    L.fillStyle = hex(amb);
    L.fillRect(0, 0, W, H);
    L.globalCompositeOperation = "lighter";
    const t = this.t;
    for (const l of this.lights) {
      const flick = l.phase < 0 ? 1 : 0.9 + 0.07 * Math.sin(t * 7 + l.phase) + 0.03 * Math.sin(t * 19 + l.phase * 2);
      const r = l.rad * 1.6 * flick, a = Math.min(1, l.k * 0.6);
      const g = L.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      g.addColorStop(0, hex(l.c, a));
      g.addColorStop(0.3, hex(l.c, a * 0.6));
      g.addColorStop(0.65, hex(l.c, a * 0.18));
      g.addColorStop(1, hex(l.c, 0));
      L.fillStyle = g;
      L.save();
      // Pools lie on the floor: squashed a little, as the view looks down at an angle.
      L.translate(l.x, l.y);
      L.scale(1, 0.8);
      L.translate(-l.x, -l.y);
      L.fillRect(l.x - r, l.y - r, r * 2, r * 2);
      L.restore();
    }
    // An open court has the sky over it: full daylight, or the moon.
    L.globalCompositeOperation = "source-over";
    L.filter = "blur(3px)";
    L.fillStyle = hex(day > 0.05 ? mix(0xfff0dc, sunNow.color, 0.3) : 0x4a5690);
    for (let cy = 0; cy < p.d; cy++)
      for (let cx = 0; cx < p.w; cx++) if (this.mask[cy * p.w + cx] === 2) L.fillRect(S + cx * T, this.oy + cy * T, T, T);
    L.filter = "none";
    L.globalCompositeOperation = "lighter";
    // The sun on the floor: a soft-edged parallelogram, warm and bright.
    L.filter = "blur(1px)";
    for (const b of this.beams) {
      const near = b.floor + b.len * 0.2, far = b.floor + b.len;
      const s0 = b.skew * ((near - b.floor) / b.len), s1 = b.skew;
      L.fillStyle = hex(b.c, Math.min(1, b.k * 0.95));
      L.beginPath();
      L.moveTo(b.x0 + s0, near);
      L.lineTo(b.x1 + s0, near);
      L.lineTo(b.x1 + s1, far);
      L.lineTo(b.x0 + s1, far);
      L.closePath();
      L.fill();
    }
    L.filter = "none";
    // Added over the multiplied room: shafts of lit air and warm cores.
    A.clearRect(0, 0, W, H);
    A.globalCompositeOperation = "lighter";
    for (const b of this.beams) {
      const far = b.floor + b.len;
      const g = A.createLinearGradient(0, b.top, 0, far);
      g.addColorStop(0, hex(b.c, 0.3 * Math.min(1, b.k)));
      g.addColorStop(0.6, hex(b.c, 0.12 * Math.min(1, b.k)));
      g.addColorStop(1, hex(b.c, 0));
      A.fillStyle = g;
      A.beginPath();
      A.moveTo(b.x0, b.top);
      A.lineTo(b.x1, b.top);
      A.lineTo(b.x1 + b.skew, far);
      A.lineTo(b.x0 + b.skew, far);
      A.closePath();
      A.fill();
    }
    for (const l of this.lights) {
      if (l.phase < 0) continue;
      const r = l.rad * 0.45, g = A.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      g.addColorStop(0, hex(l.c, 0.28 * (1 - day * 0.6)));
      g.addColorStop(1, hex(l.c, 0));
      A.fillStyle = g;
      A.fillRect(l.x - r, l.y - r, r * 2, r * 2);
    }
    // What gives its own light keeps its colour: flames, embers, the sky in a window.
    const lit = G.createImageData(W, H), src = this.img!.data, dst = lit.data;
    for (let i = 0; i < this.glow.length; i++)
      if (this.glow[i]) {
        const o = i * 4;
        dst[o] = src[o];
        dst[o + 1] = src[o + 1];
        dst[o + 2] = src[o + 2];
        dst[o + 3] = 255;
      }
    G.putImageData(lit, 0, 0);
    if (!own) return;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(L.canvas, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(A.canvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(G.canvas, 0, 0);
  }

  /** Light in a few crisp bands. Brightness is summed from the day, the
   * fires and lamps and the sun on the floor, then snapped to a band, with a
   * Bayer dither only where two bands meet; the light's colour is kept, and
   * the darkest bands lean toward a cool plum. The sun through a window is a
   * hard-edged patch on the floor under a shaft of lit air. */
  private stepped() {
    const { W, H, col, glow, p, oy } = this;
    const data = this.img!.data;
    const sunNow = sun(p.hour), day = sunNow.strength;
    const windows = this.props.filter((q) => q.kind === "window" && (q.on || p.windowStyle !== "shutter")).length;
    const base = 0.22 + day * (0.3 + Math.min(3, windows) * 0.08), cool = 1 - day;
    const amb = [base * (1 - cool * 0.22), base * (1 - cool * 0.12), base];
    const lights = this.lights.map((l) => {
      const f = l.phase < 0 ? 1 : 0.86 + 0.1 * Math.sin(this.t * 7 + l.phase) + 0.04 * Math.sin(this.t * 19 + l.phase * 2);
      return { ...l, f: l.k * f, r: ((l.c >> 16) & 255) / 255, g: ((l.c >> 8) & 255) / 255, b: (l.c & 255) / 255 };
    });
    const sr = ((sunNow.color >> 16) & 255) / 255, sg = ((sunNow.color >> 8) & 255) / 255, sb = (sunNow.color & 255) / 255;
    // Where the sun falls: from a little out from the wall to the patch's far edge.
    const patches = this.beams.map((b) => ({ ...b, near: b.floor + Math.round(b.len * 0.2), far: b.floor + b.len }));
    const FACT = [0.3, 0.44, 0.58, 0.72, 0.86, 1, 1.12, 1.22];
    const shadow = [0.3, 0.2, 0.1, 0.04];
    const air = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x, c = col[i], o = i * 4;
        if (glow[i]) {
          data[o] = (c >> 16) & 255;
          data[o + 1] = (c >> 8) & 255;
          data[o + 2] = c & 255;
          data[o + 3] = 255;
          continue;
        }
        let lr = amb[0], lg = amb[1], lb = amb[2];
        for (const l of lights) {
          const dx = x - l.x, dy = (y - l.y) * 1.25, d2 = dx * dx + dy * dy;
          const k = (l.f / (1 + d2 / (l.rad * l.rad * 0.3))) * Math.max(0, 1 - Math.sqrt(d2) / (l.rad * 2.2));
          lr += k * l.r;
          lg += k * l.g;
          lb += k * l.b;
        }
        const cx = (x - S) >> 4, cy = (y - oy) >> 4;
        const court = y >= oy && x >= S && cx < p.w && cy < p.d && this.mask[cy * p.w + cx] === 2;
        if (court) (lr += day * sr), (lg += day * sg), (lb += day * sb);
        for (const b of patches) {
          if (y >= b.near && y < b.far) {
            const t = (y - b.floor) / b.len, off = b.skew * t;
            if (x >= b.x0 + off - 1 && x < b.x1 + off + 1) {
              // Lattice and shoji throw their pattern; glazed panes their mullions.
              const u = x - b.x0 - off, v = y - b.near;
              const bar = b.style === 1 ? (Math.round(u + v * 0.5) % 4 === 0) : b.style === 2 ? false : Math.abs(u - 5) < 0.6 || v === Math.round((b.far - b.near) * 0.45);
              const k = b.k * (bar ? 0.35 : 1) * (1 - t * 0.25);
              lr += k * sr;
              lg += k * sg;
              lb += k * sb;
            }
          }
          // The shaft: every row between the window and the far edge of its patch.
          if (y >= b.top && y < b.far) {
            const t = (y - b.top) / (b.far - b.top), off = b.skew * t;
            if (x >= b.x0 + off && x < b.x1 + off) air[i] = Math.max(air[i], b.k * (1 - t) * (y < (b.sill ?? b.top) ? 0.5 : 1));
          }
        }
        const lum = lr * 0.3 + lg * 0.5 + lb * 0.2;
        const th = BAYER[(y & 3) * 4 + (x & 3)];
        // Night's ambient lands on the second band, a two-window noon on the sixth (the drawn colour).
        const band = Math.max(0, Math.min(FACT.length - 1, Math.floor((lum - 0.3) * 9 + 2 + (th - 0.5) * 0.14)));
        // The light's own colour, softened so a fire tints rather than floods.
        const k = FACT[band], hue = (v: number) => k * (1 + (v / Math.max(0.05, lum) - 1) * 0.7);
        let r = ((c >> 16) & 255) * hue(lr), g = ((c >> 8) & 255) * hue(lg), bl = (c & 255) * hue(lb);
        const sh = shadow[band] ?? 0;
        if (sh) (r += (40 - r) * sh), (g += (26 - g) * sh), (bl += (58 - bl) * sh);
        data[o] = Math.min(255, r);
        data[o + 1] = Math.min(255, g);
        data[o + 2] = Math.min(255, bl);
        data[o + 3] = 255;
      }
    // Lit air over everything, in three steps of strength, so the shaft fades
    // from the window without a smear.
    for (let i = 0, n = W * H; i < n; i++) {
      const a = air[i];
      if (a < 0.08) continue;
      const k = a > 0.6 ? 0.2 : a > 0.3 ? 0.13 : 0.07, o = i * 4;
      data[o] = Math.min(255, data[o] + (255 * sr - data[o] * 0.4) * k);
      data[o + 1] = Math.min(255, data[o + 1] + (255 * sg - data[o + 1] * 0.4) * k);
      data[o + 2] = Math.min(255, data[o + 2] + (255 * sb - data[o + 2] * 0.4) * k);
    }
  }

  /** Hand-drawn albedo lit by the voxel scene's traced light. The top-down
   * voxel view shares this oblique, so pixel (x, y) sees the k×k voxel-screen
   * pixels at the offsets below. */
  private traced(F: LightField) {
    const { W, H, col, glow } = this;
    const data = this.img!.data, oy = this.oy, k = F.k;
    const sr = ((F.sun >> 16) & 255) / 255, sg = ((F.sun >> 8) & 255) / 255, sb = (F.sun & 255) / 255;
    const bloom = new Float32Array(W * H * 3);
    const light = new Float32Array(W * H * 3), haze = new Float32Array(W * H);
    let lr = 0.5, lg = 0.48, lb = 0.5;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const vx = k * (x - S) + 2 * k + F.offX, vy = k * (y - oy) + F.offY;
        let n = 0, ar = 0, ag = 0, ab = 0, hz = 0;
        for (let j = 0; j < k; j++)
          for (let m = 0; m < k; m++) {
            const px = vx + m, py = vy + j;
            if (px < 0 || py < 0 || px >= F.W || py >= F.H) continue;
            const q = py * F.W + px;
            hz += F.haze[q];
            if (F.light[q * 3] < 0) continue;
            ar += F.light[q * 3];
            ag += F.light[q * 3 + 1];
            ab += F.light[q * 3 + 2];
            n++;
          }
        if (x < S || x >= W - S || y < CAP || y >= H - S) (lr = 0.5), (lg = 0.48), (lb = 0.5);
        else if (n) (lr = ar / n), (lg = ag / n), (lb = ab / n);
        light[i * 3] = lr;
        light[i * 3 + 1] = lg;
        light[i * 3 + 2] = lb;
        haze[i] = hz / (k * k);
      }
    // Light varies voxel by voxel; a 3-px blur grades it across the drawing
    // instead of stamping each voxel's block onto the pixels.
    if (!this.dither) {
      boxBlur(light, W, H, 2, true);
      boxBlur(light, W, H, 2, false);
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x, c = col[i], o = i * 4;
        const cr = (c >> 16) & 255, cg = (c >> 8) & 255, cb = c & 255;
        if (glow[i]) {
          data[o] = cr;
          data[o + 1] = cg;
          data[o + 2] = cb;
          data[o + 3] = 255;
          bloom[i * 3] = cr;
          bloom[i * 3 + 1] = cg;
          bloom[i * 3 + 2] = cb;
          continue;
        }
        const th = BAYER[(y & 3) * 4 + (x & 3)];
        const q = (v: number) => (this.dither ? Math.floor(v * 12 + th) / 10 : v * 1.2);
        // Open courts take several times a window's light; compress it before
        // it meets the albedo, then roll off so sunlit stone keeps its colour.
        const tm = (v: number, a: number) => {
          const lc = (q(v) / (1 + q(v) * 0.5)) * 1.5;
          return (1 - Math.exp(-(a / 255) * lc * 1.6)) * 262;
        };
        const hz = haze[i] / (1 + haze[i] * 6);
        const r = tm(light[i * 3], cr) + hz * 255 * sr, g = tm(light[i * 3 + 1], cg) + hz * 255 * sg, b = tm(light[i * 3 + 2], cb) + hz * 255 * sb;
        data[o] = Math.min(255, r);
        data[o + 1] = Math.min(255, g);
        data[o + 2] = Math.min(255, b);
        data[o + 3] = 255;
        if (r + g + b > 650) {
          bloom[i * 3] = r * 0.5;
          bloom[i * 3 + 1] = g * 0.5;
          bloom[i * 3 + 2] = b * 0.5;
        }
      }
    for (let pass = 0; pass < 2; pass++) {
      boxBlur(bloom, W, H, 4, true);
      boxBlur(bloom, W, H, 4, false);
    }
    for (let i = 0, n = W * H; i < n; i++) {
      if (glow[i]) continue;
      const o = i * 4;
      data[o] = Math.min(255, data[o] + bloom[i * 3] * 0.32);
      data[o + 1] = Math.min(255, data[o + 1] + bloom[i * 3 + 1] * 0.3);
      data[o + 2] = Math.min(255, data[o + 2] + bloom[i * 3 + 2] * 0.26);
    }
  }

  /** Colour grading after the light: shadows sink toward plum instead of
   * grey, bright surfaces warm a little, and the room darkens and cools
   * toward its edges like a lit stage. */
  private grade() {
    const { W, H, glow } = this, d = this.img!.data;
    const cx = W / 2, cy = (this.oy + H) / 2 - T;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x, o = i * 4;
        let r = d[o], g = d[o + 1], b = d[o + 2];
        if (!glow[i]) {
          const lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
          const sh = (1 - lum) * (1 - lum) * 0.3;
          r += (46 - r) * sh;
          g += (24 - g) * sh;
          b += (60 - b) * sh;
          const hi = Math.max(0, lum - 0.55) * 0.3;
          r += (255 - r) * hi * 0.35;
          g += (216 - g) * hi * 0.3;
          b += (170 - b) * hi * 0.15;
        }
        const e = Math.hypot((x - cx) / (W * 0.55), (y - cy) / (H * 0.6));
        const v = 1 - 0.38 * Math.min(1, Math.max(0, (e - 0.45) / 0.75)) ** 1.5;
        d[o] = r * v;
        d[o + 1] = g * v;
        d[o + 2] = b * (v + (1 - v) * 0.35);
      }
  }

  private put(x: number, y: number, c: number, a = 1) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const o = (y * this.W + x) * 4, d = this.img!.data;
    d[o] = d[o] * (1 - a) + ((c >> 16) & 255) * a;
    d[o + 1] = d[o + 1] * (1 - a) + ((c >> 8) & 255) * a;
    d[o + 2] = d[o + 2] * (1 - a) + (c & 255) * a;
  }

  private particles(beamMotes: boolean) {
    const t = this.t;
    for (const f of this.fires) {
      if (!f.lit) {
        for (let i = 0; i < f.w; i += 3) if (Math.sin(t * 2 + i) > 0.2) this.put(f.x + i, f.y + 1, 0xc0401c);
        continue;
      }
      for (let i = 0; i < f.w; i++) {
        const u = i / f.w, env = Math.sin(u * Math.PI);
        const h = f.h * env * (0.55 + 0.3 * Math.sin(t * 11 + i * 1.7) + 0.15 * Math.sin(t * 17 - i * 0.9));
        for (let j = 0; j < h; j++) {
          const v = j / Math.max(1, h);
          const c = v < 0.25 ? 0xfff2b0 : v < 0.55 ? 0xffc040 : v < 0.8 ? 0xf06a1c : 0xa82a14;
          if (v > 0.8 && hash(i, j, (t * 12) | 0) < 0.5) continue;
          this.put(f.x + i, f.y - j, c);
        }
      }
      for (let k = 0; k < 6; k++) {
        const life = (t * 0.7 + k * 0.37) % 1;
        const x = f.x + f.w / 2 + Math.sin(k * 3.1 + t * 2) * 4 * life + (hash(k, 0, 1) - 0.5) * f.w * 0.6;
        this.put(x, f.y - f.h * 0.6 - life * 18, life < 0.6 ? 0xffd070 : 0xe0501c, 1 - life);
      }
    }
    for (const f of this.flames) {
      const fl = Math.sin(t * 13 + f.x) > 0.3 ? 1 : 0;
      this.put(f.x, f.y, 0xfff4c0);
      this.put(f.x, f.y - 1, 0xffc850);
      if (fl) this.put(f.x, f.y - 2, 0xff8a30);
      this.put(f.x + 1, f.y, 0xffb040, 0.6);
    }
    for (const s of this.smoke)
      for (let k = 0; k < 5; k++) {
        const life = (t * 0.35 + k / 5) % 1;
        this.put(s.x + Math.sin(life * 6 + k) * 2, s.y - life * 26, 0xd8d0c8, 0.35 * (1 - life));
      }
    for (const b of beamMotes ? this.beams : [])
      for (let k = 0; k < 14; k++) {
        const a = hash(k, 1, 7), v = (a + t * 0.02 * (1 + hash(k, 3, 7))) % 1;
        const y = b.top + v * (b.floor + b.len - b.top) * 0.9;
        const tt = (y - b.top) / (b.floor + b.len - b.top);
        const x = b.x0 + b.skew * tt + ((hash(k, 2, 7) + Math.sin(t * 0.5 + k) * 0.08 + 1) % 1) * (b.x1 - b.x0);
        this.put(x, y, 0xfff6dc, Math.min(1, b.k) * (0.4 + 0.4 * Math.sin(t * 2 + k)));
      }
    for (const [k, n] of this.notes.entries()) {
      const life = (t * 0.5 + k * 0.5) % 1;
      const x = n.x + Math.sin(life * 6) * 3 + life * 4, y = n.y - life * 16;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, -1], [2, 0], [2, -2], [2, -3], [3, -3]]) this.put(x + dx, y + dy, 0xfff0c0, 1 - life);
    }
    const Z = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [3, 1], [2, 2], [1, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4]];
    for (const [k, z] of this.zz.entries())
      for (const n of [0, 1]) {
        const life = (t * 0.35 + n * 0.5 + k * 0.23) % 1;
        const x = Math.round(z.x + life * 4 + Math.sin(life * 5) * 1.5), y = Math.round(z.y - life * 12);
        for (const [dx, dy] of Z) this.put(x + dx, y + dy, 0xf4f0ff, Math.min(1, (1 - life) * 1.4));
      }
  }

  private outline() {
    const { W, H, ids, img } = this;
    const d = img!.data;
    const rug = this.props.find((q) => q.kind === "rug")?.id ?? -9;
    const src = new Uint8ClampedArray(d);
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x, id = ids[i];
        if (id < 0 || id === rug || this.glow[i]) continue;
        const o = i * 4;
        // A dark hue-kept outline all round, heaviest underneath, and a lit
        // pixel just inside the top edge.
        const below = ids[i + W] !== id, side = ids[i - 1] !== id || ids[i + 1] !== id, above = ids[i - W] !== id;
        const t = below ? 0.72 : side || above ? 0.58 : 0;
        if (t) for (let c = 0; c < 3; c++) d[o + c] = src[o + c] * (1 - t) + [30, 16, 34][c] * t;
        else if (ids[i - 2 * W] !== id && y > 1) for (let c = 0; c < 3; c++) d[o + c] = Math.min(255, src[o + c] * 1.1);
      }
    if (this.hover < 0) return;
    const h = this.hover, pulse = 0.65 + 0.35 * Math.sin(this.t * 6);
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (ids[i] === h) continue;
        if (ids[i - 1] === h || ids[i + 1] === h || ids[i - W] === h || ids[i + W] === h) this.put(x, y, 0xfff0a0, pulse);
      }
  }
}

function boxBlur(a: Float32Array, W: number, H: number, r: number, horizontal: boolean) {
  const line = new Float32Array((horizontal ? W : H) * 3);
  const n = horizontal ? W : H, lines = horizontal ? H : W;
  for (let l = 0; l < lines; l++) {
    const at = (i: number) => (horizontal ? l * W + i : i * W + l) * 3;
    for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) line[i * 3 + c] = a[at(i) + c];
    let sr = 0, sg = 0, sb = 0;
    for (let i = -r; i <= r; i++) {
      const j = Math.max(0, Math.min(n - 1, i));
      sr += line[j * 3];
      sg += line[j * 3 + 1];
      sb += line[j * 3 + 2];
    }
    for (let i = 0; i < n; i++) {
      const o = at(i), w = 2 * r + 1;
      a[o] = sr / w;
      a[o + 1] = sg / w;
      a[o + 2] = sb / w;
      const add = Math.min(n - 1, i + r + 1), sub = Math.max(0, i - r);
      sr += line[add * 3] - line[sub * 3];
      sg += line[add * 3 + 1] - line[sub * 3 + 1];
      sb += line[add * 3 + 2] - line[sub * 3 + 2];
    }
  }
}
