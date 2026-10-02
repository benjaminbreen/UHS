import {
  courtParams, floorColor, hash, mix, palette, roomMask, scale, sky, sun, wallColor,
  type Prop, type RoomParams,
} from "./room";

const V = 8, WALL = 24, ZN = 27;
type Light = { x: number; y: number; z: number; c: number; k: number; phase: number };
type Flame = { x: number; y: number; z: number; h: number };
export type LightField = { W: number; H: number; k: number; offX: number; offY: number; light: Float32Array; haze: Float32Array; sun: number };
export type VoxelOptions = { rot: number; top: boolean; detail: 1 | 2 | 4; bevel: boolean; haze: boolean; posterize: boolean };

// Per voxel column: what stands there, which decides whether the roof covers it.
const OUT = 0, ROOM = 1, WALLED = 2, OPEN = 3;

class Grid {
  c: Int32Array;
  id: Int16Array;
  col: Uint8Array;
  constructor(public X: number, public Y: number, public Z: number) {
    this.c = new Int32Array(X * Y * Z).fill(-1);
    this.id = new Int16Array(X * Y * Z).fill(-1);
    this.col = new Uint8Array(X * Y);
  }
  inRoom(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.X || y >= this.Y) return false;
    const t = this.col[y * this.X + x];
    return t === ROOM || t === OPEN;
  }
  i(x: number, y: number, z: number) {
    return (z * this.Y + y) * this.X + x;
  }
  solid(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.X && y < this.Y && z < this.Z && this.c[this.i(x, y, z)] >= 0;
  }
  set(x: number, y: number, z: number, c: number, id: number) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    if (x < 0 || y < 0 || z < 0 || x >= this.X || y >= this.Y || z >= this.Z) return;
    const k = this.i(x, y, z);
    this.c[k] = c;
    this.id[k] = c < 0 ? -1 : id;
  }
  top(x: number, y: number) {
    for (let z = this.Z - 1; z > 0; z--) if (this.solid(x, y, z) && x > 0 && y > 0) return z;
    return 0;
  }
  /** A quarter turn: cell (x, y) goes to (Y-1-y, x). */
  rot() {
    const o = new Grid(this.Y, this.X, this.Z);
    for (let z = 0; z < this.Z; z++)
      for (let y = 0; y < this.Y; y++)
        for (let x = 0; x < this.X; x++) {
          const k = this.i(x, y, z), j = o.i(this.Y - 1 - y, x, z);
          o.c[j] = this.c[k];
          o.id[j] = this.id[k];
          if (z === 0) o.col[x * o.X + this.Y - 1 - y] = this.col[y * this.X + x];
        }
    return o;
  }
}

function build(p: RoomParams, props: Prop[], holes: Set<number>) {
  const P = palette(p);
  const X = p.w * V + 2, Y = p.d * V + 2;
  const g = new Grid(X, Y, ZN);
  const lights: Light[] = [];
  const flames: Flame[] = [];
  let id = -1, dy = 0;
  const put = (x: number, y: number, z: number, c: number) => g.set(x, y + dy, z, c, id);
  const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: number | ((x: number, y: number, z: number) => number)) => {
    for (let z = z0; z <= z1; z++)
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) put(x, y, z, typeof c === "number" ? c : c(x, y, z));
  };
  const lathe = (cx: number, cy: number, z0: number, h: number, prof: (t: number) => number, R: number[], hollow = false) => {
    for (let k = 0; k < h; k++) {
      const rr = prof(k / Math.max(1, h - 1)), n = Math.ceil(rr);
      for (let dy = -n; dy <= n; dy++)
        for (let dx = -n; dx <= n; dx++) {
          const d = Math.hypot(dx, dy);
          if (d > rr + 0.35) continue;
          if (hollow && k === h - 1 && d < rr - 0.8) {
            put(cx + dx, cy + dy, z0 + k - 1, R[0]);
            continue;
          }
          const s = (dx + dy) / (rr * 1.5 + 0.01);
          put(cx + dx, cy + dy, z0 + k, R[k === h - 1 ? 4 : Math.max(1, Math.min(4, Math.round(2.6 - s * 1.6)))]);
        }
    }
  };
  const ball = (cx: number, cy: number, cz: number, r: number, R: number[]) => {
    const n = Math.ceil(r);
    for (let dz = -n; dz <= n; dz++)
      for (let dy = -n; dy <= n; dy++)
        for (let dx = -n; dx <= n; dx++)
          if (dx * dx + dy * dy + dz * dz <= r * r + 0.3) put(cx + dx, cy + dy, cz + dz, R[Math.max(1, Math.min(5, 3 + dz - Math.round((dx + dy) * 0.4)))]);
  };

  const mask = roomMask(p), court = courtParams(p);
  const cell = (x: number, y: number) => {
    const cx = Math.floor((x - 1) / V), cy = Math.floor((y - 1) / V);
    return x < 1 || y < 1 || cx >= p.w || cy >= p.d ? 0 : mask[cy * p.w + cx];
  };
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const m = cell(x, y);
      if (m) g.col[y * X + x] = m === 2 ? OPEN : ROOM;
    }
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      if (g.col[y * X + x]) continue;
      let near = false;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (g.inRoom(x + i, y + j)) near = true;
      if (near) g.col[y * X + x] = WALLED;
    }
  // Smoke goes out over the fire, or the room's middle.
  if (p.smokehole) {
    const f = props.find((q) => q.kind === "firepit" || q.kind === "irori" || q.kind === "stove" || q.kind === "brazier");
    const cx = f ? 1 + (f.x + f.w / 2) * V : X / 2, cy = f ? 1 + (f.y + f.d / 2) * V : Y / 2;
    for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) if (g.col[y * X + x] === ROOM && Math.hypot(x - cx, y - cy) < V * 0.75) g.col[y * X + x] = OPEN;
  }
  for (let y = 0; y < Y; y++)
    for (let x = 0; x < X; x++) {
      const t = g.col[y * X + x];
      put(x, y, 0, t === ROOM || t === OPEN ? floorColor(t === OPEN && mask[Math.floor((y - 1) / V) * p.w + Math.floor((x - 1) / V)] === 2 ? court : p, P, (x - 1) * 2, (y - 1) * 2) : mix(0x3e3428, 0x4c5a34, hash(x >> 1, y >> 1, 7)));
      if (t !== WALLED) continue;
      const across = g.inRoom(x, y + 1) || g.inRoom(x, y - 1);
      for (let z = 1; z <= WALL; z++) put(x, y, z, z === WALL ? P.trim[4] : wallColor(p, P, ((across ? x : y) - 1) * 2, (z - 1) * 2));
    }
  const top = Array.from({ length: p.w }, (_, cx) => {
    for (let cy = 0; cy < p.d; cy++) if (mask[cy * p.w + cx]) return cy;
    return 0;
  });

  const cat = props.find((q) => q.kind === "cat");
  for (const q of props) {
    if (q.wrecked) continue;
    if (q === cat) continue;
    id = q.id;
    // Wall pieces are written as if their wall were row 0; dy moves them to it.
    dy = q.wall ? q.y * V : 0;
    const nl = lights.length, nf = flames.length;
    const bx = 1 + q.x * V, by = 1 + q.y * V - dy, ex = bx + q.w * V - 1, ey = by + q.d * V - 1;
    const W = P.wood;
    switch (q.kind) {
      case "rug": {
        const w = ex - bx - 1, h = ey - by - 1;
        box(bx + 1, by + 1, 1, ex - 1, ey - 1, 1, (x, y) => {
          const i = x - bx - 1, j = y - by - 1, e = Math.min(i, j, w - i, h - j);
          if (e === 0) return P.acc[1];
          if (e < 2) return (i + j) % 2 ? P.trim[4] : P.acc[2];
          const dm = Math.abs(i - w / 2) / (w / 2) + Math.abs(j - h / 2) / (h / 2);
          return dm < 0.34 ? (dm < 0.16 ? P.trim[5] : P.acc2[3]) : dm < 0.42 ? P.trim[4] : Math.abs(((i + j) % 6) - 3) === 1 ? P.acc[4] : P.acc[3];
        });
        for (let y = by + 2; y < ey - 1; y += 2) {
          put(bx, y, 1, P.linen[4]);
          put(ex, y, 1, P.linen[4]);
        }
        break;
      }
      case "door": {
        if (p.door !== "door") {
          const open = q.on || p.door === "opening";
          for (let z = 1; z <= 16; z++) {
            const inset = p.door === "flap" ? Math.floor((z - 1) / 5) : 0;
            for (let x = bx + 1 + inset; x <= bx + 6 - inset; x++) put(x, 0, z, open ? -1 : p.door === "flap" ? P.wall[2] : P.acc[(x + z) % 4 < 2 ? 3 : 2]);
          }
          if (open && p.door !== "opening") box(bx + 1, 1, 1, bx + 1, 2, 16, p.door === "flap" ? P.wall[3] : P.acc[3]);
          break;
        }
        box(bx, 0, 1, bx + 7, 0, 17, P.trim[2]);
        box(bx, 1, 17, bx + 7, 1, 17, P.trim[3]);
        box(bx + 1, 0, 1, bx + 6, 0, 16, -1);
        if (q.on) box(bx + 1, 1, 1, bx + 1, 6, 16, (_x, y, z) => (z === 4 || z === 13 ? P.iron[2] : W[2 + ((y + (hash(y, 0, q.seed) < 0.5 ? 0 : 1)) & 1)]));
        else {
          box(bx + 1, 0, 1, bx + 6, 0, 16, (x, _y, z) => (z === 4 || z === 13 ? P.iron[2] : W[(x - bx) % 3 === 0 ? 1 : 2 + (hash(x, z >> 2, q.seed) < 0.5 ? 0 : 1)]));
          put(bx + 5, 1, 8, P.iron[4]);
        }
        box(bx, 1, 1, bx + 7, 1, 1, P.stone[4]);
        break;
      }
      case "window": {
        box(bx, 0, 8, bx + 6, 0, 17, P.trim[2]);
        box(bx + 1, 0, 9, bx + 5, 0, 16, -1);
        box(bx + 3, 0, 9, bx + 3, 0, 16, P.trim[3]);
        box(bx + 1, 0, 13, bx + 5, 0, 13, P.trim[3]);
        box(bx - 1, 1, 8, bx + 7, 2, 8, P.trim[4]);
        box(bx, 1, 17, bx + 6, 1, 17, P.trim[3]);
        if (q.broken) break;
        // A lattice breaks the light into dapples; paper screens are left open.
        if (p.windowStyle === "lattice") {
          box(bx + 1, 0, 9, bx + 5, 0, 16, (x, _y, z) => ((x + z) % 2 === 0 ? W[3] : -1));
          break;
        }
        if (p.windowStyle === "shoji") break;
        if (!q.on) box(bx + 1, 0, 9, bx + 5, 0, 16, (_x, _y, z) => W[z % 2 ? 2 : 3]);
        else {
          box(bx - 2, 1, 9, bx - 1, 1, 16, (_x, _y, z) => W[z % 2 ? 2 : 3]);
          box(bx + 7, 1, 9, bx + 8, 1, 16, (_x, _y, z) => W[z % 2 ? 2 : 3]);
        }
        if (q.seed % 3 === 0)
          for (let x = bx; x <= bx + 6; x++) {
            put(x, 2, 9, P.leaf[2 + (x & 1)]);
            if (hash(x, 1, q.seed) > 0.5) put(x, 2, 10, [P.acc[4], 0xf4e6f0, P.acc3[4]][x % 3]);
          }
        break;
      }
      case "hearth": {
        const stone = (x: number, _y: number, z: number) => {
          const row = z >> 1, sx = (x + (row & 1) * 2) % 4;
          return sx === 0 || (z & 1) === 0 && hash(x, z, 3) < 0.3 ? P.stone[1] : P.stone[2 + (hash((x + (row & 1) * 2) >> 2, row, q.seed) < 0.5 ? 1 : 0)];
        };
        box(bx, 1, 1, ex, 5, 9, stone);
        box(bx + 4, 2, 1, ex - 4, 5, 6, -1);
        box(bx + 5, 2, 7, ex - 5, 4, 7, -1);
        box(bx + 4, 1, 1, ex - 4, 1, 6, (x, _y, z) => mix(0x140c0a, 0x2a1810, hash(x, z, 1)));
        for (let z = 10; z < WALL; z++) {
          const inset = Math.min(4, 2 + ((z - 10) >> 2));
          box(bx + inset, 1, z, ex - inset, 3, z, stone);
        }
        box(bx - 1, 1, 10, ex + 1, 6, 10, (_x, y) => W[y === 6 ? 4 : 3]);
        box(bx - 1, 6, 1, ex + 1, 10, 1, (x, y) => ((x + y * 3) % 5 === 0 ? P.stone[1] : P.stone[3 + (hash(x >> 1, y >> 1, 9) < 0.4 ? 1 : 0)]));
        box(bx + 5, 3, 1, ex - 5, 3, 2, (x) => W[x % 3 === 0 ? 4 : 2]);
        box(bx + 6, 4, 1, ex - 6, 4, 1, W[1]);
        lathe(bx + 2, 3, 11, 3, (t) => 1.2 - t * 0.3, P.clay);
        box(ex - 2, 3, 11, ex - 2, 3, 12, P.linen[5]);
        flames.push({ x: ex - 2, y: 3, z: 13, h: 0 });
        if (q.on) {
          for (let x = bx + 5; x <= ex - 5; x++) for (let y = 2; y <= 4; y++) for (let z = 3; z <= 7; z++) flames.push({ x, y, z, h: (z - 3) / 4 + Math.abs(x - (bx + ex) / 2) / 6 });
          lights.push({ x: (bx + ex + 1) / 2, y: 4.5, z: 4, c: 0xff8a3a, k: 3.2, phase: q.seed % 100 });
        }
        break;
      }
      case "shelf": {
        const x0 = bx + 1, x1 = ex - 1;
        box(x0, 1, 1, x1, 1, 21, W[1]);
        box(x0, 2, 1, x0, 4, 21, W[3]);
        box(x1, 2, 1, x1, 4, 21, W[2]);
        for (const z of [1, 6, 11, 16, 21]) box(x0, 2, z, x1, 4, z, (_x, y) => W[y === 4 ? 4 : 3]);
        for (const z of [6, 11, 16]) {
          let x = x0 + 1;
          while (x < x1 - 1) {
            const k = hash(x, z, q.seed);
            if (p.trade === "scholar") {
              const h = 2 + ((k * 3) | 0), c = [P.acc, P.acc2, P.acc3, P.linen, P.clay][(k * 5) | 0];
              box(x, 2, z + 1, x, 3, z + h, c[2 + (x & 1)]);
              x += k > 0.8 ? 2 : 1;
            } else if (p.trade === "potter") {
              lathe(x + 1, 3, z + 1, 2 + ((k * 2) | 0), () => 1, k > 0.5 ? P.clay : P.acc);
              x += 3;
            } else if (p.trade === "weaver") {
              const c = [P.acc, P.acc2, P.acc3][(k * 3) | 0];
              for (let l = 0; l < 3; l++) box(x, 2, z + 1 + l, Math.min(x1 - 1, x + 2), 3, z + 1 + l, c[4 - l]);
              x += 4;
            } else {
              if (k > 0.5) box(x, 2, z + 1, Math.min(x1 - 1, x + 1), 3, z + 2, W[4]);
              else lathe(x, 3, z + 1, 3, (t) => (t > 0.6 ? 0.4 : 1), [P.pale, P.leaf, P.acc2][(k * 6) % 3 | 0]);
              x += 3;
            }
          }
        }
        break;
      }
      case "tapestry": {
        box(bx, 1, 21, ex, 2, 21, W[3]);
        box(bx + 1, 1, 7, ex - 1, 1, 20, (x, _y, z) => {
          const u = x - bx - 1, v = 20 - z, dm = Math.abs(u - 2.5) + Math.abs((v % 7) - 3);
          return u === 0 || u === 5 ? P.acc[1] : v % 7 === 0 ? P.trim[4] : dm < 2 ? P.acc3[4] : dm < 3 ? P.acc2[2] : P.acc[2 + ((u + v) & 1)];
        });
        break;
      }
      case "pegs": {
        box(bx, 1, 18, ex, 1, 18, W[3]);
        const kinds = p.trade === "weaver" ? [P.acc, P.acc2, P.acc3] : [P.leaf, P.straw, P.pale];
        for (let k = 0; k < 3; k++) {
          const R = kinds[(k + q.seed) % 3], x = bx + 1 + k * 3, len = 3 + ((hash(k, 0, q.seed) * 3) | 0);
          for (let j = 0; j < len; j++) {
            put(x, 2, 17 - j, R[3 + (j & 1)]);
            if (j > 0 && j < len - 1) put(x, 3, 17 - j, R[2]);
          }
        }
        break;
      }
      case "plates": {
        box(bx, 1, 11, ex, 3, 11, W[3]);
        for (let k = 0; k < 2; k++) {
          const cx = bx + 2 + k * 4;
          for (let dz = -2; dz <= 2; dz++)
            for (let dx = -2; dx <= 2; dx++) {
              const r2 = dx * dx + dz * dz;
              if (r2 <= 5) put(cx + dx, 1, 14 + dz, r2 > 3 ? P.clay[2] : r2 > 1 ? (k ? P.acc[3] : P.acc2[3]) : P.paper[4]);
            }
        }
        break;
      }
      case "map": {
        box(bx + 1, 1, 11, ex - 1, 1, 18, (x, _y, z) => (hash(x >> 1, z >> 1, q.seed) > 0.5 ? P.paper[3] : mix(P.paper[4], 0x6aa0c0, 0.4)));
        break;
      }
      case "loom": {
        const py = by + 4, x0 = bx + 1, x1 = ex - 1;
        box(x0, py - 1, 1, x0 + 1, py, 21, W[2]);
        box(x1 - 1, py - 1, 1, x1, py, 21, W[3]);
        box(x0, py, 20, x1, py, 21, W[4]);
        for (let x = x0 + 2; x <= x1 - 2; x++) {
          const u = x - x0;
          for (let z = 13; z <= 19; z++) {
            const v = 19 - z, dm = Math.abs((u % 6) - 3) + Math.abs((v % 6) - 3);
            put(x, py, z, dm === 3 ? P.acc3[4] : dm < 1 ? P.acc2[3] : v % 6 === 0 ? P.trim[3] : P.acc[(u + v) % 2 ? 3 : 2]);
          }
          if (u % 2 === 0) {
            for (let z = 4; z <= 12; z++) put(x, py, z, P.linen[4]);
            box(x, py, 2, x, py + 1, 3, P.clay[3]);
          }
        }
        box(x0 + 2, py + 1, 9, x1 - 2, py + 1, 9, W[3]);
        box(bx + 6, ey - 4, 1, ex - 6, ey - 2, 4, (x, y, z) => (z === 4 ? W[4] : (x === bx + 6 || x === ex - 6) && (y === ey - 4 || y === ey - 2) ? W[1] : -1));
        break;
      }
      case "spinwheel": {
        const cx = bx + 4, cz = 8, wy = by + 4;
        for (let a = 0; a < 40; a++) {
          const t = (a / 40) * Math.PI * 2;
          put(cx + Math.cos(t) * 3.5, wy, cz + Math.sin(t) * 3.5, W[3]);
        }
        for (let k = 0; k < 6; k++) for (let s = 1; s < 3; s++) put(cx + Math.cos(k) * s, wy, cz + Math.sin(k) * s, W[2]);
        box(cx, wy, 1, cx, wy, cz, W[1]);
        box(bx + 1, by + 3, 3, bx + 7, by + 5, 3, W[4]);
        for (const x of [bx + 1, bx + 7]) box(x, by + 4, 1, x, by + 4, 2, W[1]);
        box(bx + 1, by + 2, 1, bx + 1, by + 2, 10, W[2]);
        ball(bx + 1, by + 2, 11, 1.4, P.linen);
        break;
      }
      case "basket": {
        const cx = bx + 4, cy = by + 4;
        lathe(cx, cy, 1, 5, (t) => 3 - t * 0.3, P.straw, true);
        const balls = [P.acc, P.acc2, P.linen, P.acc3];
        ball(cx - 1, cy, 6, 1.2, balls[q.seed % 4]);
        ball(cx + 1, cy - 1, 6, 1.2, balls[(q.seed + 1) % 4]);
        ball(cx, cy + 1, 7, 1, balls[(q.seed + 2) % 4]);
        break;
      }
      case "bolts": {
        const R = [P.acc, P.acc2, P.acc3, P.linen];
        for (let k = 0; k < 3; k++) {
          const cy = by + 2 + (k % 2) * 3, cz = 2 + (k === 2 ? 2 : 0), R0 = R[(q.seed + k) % 4];
          const cyy = k === 2 ? by + 3 : cy;
          for (let x = bx + 1; x <= ex - 1; x++)
            for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) if (dy * dy + dz * dz <= 1.5) put(x, cyy + dy, cz + dz, R0[3 + dz - (x === bx + 1 ? 1 : 0)]);
        }
        break;
      }
      case "vat": {
        const cx = bx + 4, cy = by + 4, dye = P.dye[q.seed % 3];
        lathe(cx, cy, 1, 5, () => 3, W, true);
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) put(cx + dx, cy + dy, 4, dye[2 + ((dx + dy) & 1)]);
        for (const z of [2, 4]) for (let a = 0; a < 24; a++) put(cx + Math.cos(a / 3.8) * 3.2, cy + Math.sin(a / 3.8) * 3.2, z, P.iron[2]);
        box(cx + 1, cy, 5, cx + 1, cy, 9, W[3]);
        break;
      }
      case "counter": {
        box(bx + 1, by + 2, 1, ex - 1, by + 5, 7, (x, y, z) => (y === by + 5 && (x - bx) % 6 === 0 ? W[1] : z === 7 ? W[3] : W[2]));
        box(bx, by + 1, 8, ex, by + 6, 8, (x, y) => (y === by + 6 ? W[5] : hash(x >> 2, y, q.seed) < 0.15 ? W[3] : W[4]));
        box(bx + 3, by + 3, 9, bx + 3, by + 3, 12, P.brass[3]);
        box(bx + 1, by + 3, 12, bx + 5, by + 3, 12, P.brass[4]);
        box(bx + 1, by + 2, 10, bx + 2, by + 4, 10, P.brass[2]);
        box(bx + 4, by + 2, 10, bx + 5, by + 4, 10, P.brass[2]);
        for (let k = 0; k < 3; k++) box(bx + 8 + k * 2, by + 3, 9, bx + 8 + k * 2, by + 3, 9 + k, P.brass[4 + (k & 1)]);
        box(ex - 6, by + 2, 9, ex - 2, by + 5, 9, (x) => (x === ex - 4 ? P.paper[1] : P.paper[4]));
        break;
      }
      case "jars": {
        const n = q.w * 2;
        for (let k = 0; k < n; k++) {
          const cx = bx + 3 + Math.round(k * ((ex - bx - 6) / Math.max(1, n - 1))), cy = by + 3 + (k & 1) * 2;
          const h = 6 + ((hash(k, 1, q.seed) * 5) | 0), R = [P.clay, P.pale, P.acc, P.clay][(k + q.seed) % 4];
          lathe(cx, cy, 1, h, (t) => 0.9 + Math.sin(Math.min(1, t * 1.15) * Math.PI) * 1.9 - (t > 0.85 ? 1 : 0), R, true);
        }
        break;
      }
      case "crate": {
        box(bx + 1, by + 1, 1, ex - 1, ey - 1, 5, (_x, _y, z) => W[z % 2 ? 2 : 3]);
        box(bx + 1, by + 1, 5, ex - 1, ey - 1, 5, (x, y) => (hash(x, y, q.seed) < 0.3 ? P.straw[4] : W[4]));
        if (q.seed % 2 === 0) box(bx + 2, by + 2, 6, ex - 2, ey - 2, 9, (_x, _y, z) => W[z % 2 ? 3 : 2]);
        break;
      }
      case "sacks": {
        for (let k = 0; k < 2; k++) {
          const cx = bx + 2 + k * 4, cy = by + 3 + k, R = k ? P.linen : P.straw;
          for (let z = 1; z <= 6; z++) {
            const rr = 2.4 - Math.abs(z - 2.6) * 0.45 + hash(z, k, q.seed) * 0.3;
            for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= rr * rr) put(cx + dx, cy + dy, z, R[Math.max(1, Math.min(4, 3 - Math.round((dx + dy) * 0.5)))]);
          }
          put(cx, cy, 7, P.iron[2]);
          put(cx, cy, 8, R[4]);
        }
        for (let k = 0; k < 6; k++) put(bx + 1 + hash(k, 1, q.seed) * 7, by + 6 + hash(k, 2, q.seed) * 2, 1, P.straw[5]);
        break;
      }
      case "throw": {
        const cx = bx + 4, cy = by + 4;
        box(cx - 2, cy - 2, 1, cx + 2, cy + 2, 2, P.stone[3]);
        box(cx, cy, 3, cx, cy, 3, P.iron[2]);
        lathe(cx, cy, 4, 1, () => 3, W);
        lathe(cx, cy, 5, 4, (t) => 1.2 + Math.sin(t * 3) * 0.8, P.pale, true);
        break;
      }
      case "claybin": {
        const cx = bx + 4, cy = by + 4;
        lathe(cx, cy, 1, 4, () => 3, W, true);
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) put(cx + dx, cy + dy, 4 + (dx * dx + dy * dy < 2 ? 1 : 0), P.pale[2]);
        break;
      }
      case "potrack": {
        for (const x of [bx + 1, ex - 1]) for (const y of [by + 2, by + 5]) box(x, y, 1, x, y, 12, W[1]);
        for (const [z, R] of [[4, P.clay], [9, P.pale]] as const) {
          box(bx + 1, by + 2, z, ex - 1, by + 5, z, W[3]);
          for (let x = bx + 3; x < ex - 1; x += 3) lathe(x, by + 3, z + 1, 2 + ((x >> 1) % 2), () => 1, R, true);
        }
        break;
      }
      case "desk": {
        box(bx, by + 1, 7, ex, by + 5, 7, (x, y) => (y === by + 5 ? W[5] : hash(x >> 2, y, q.seed) < 0.2 ? W[3] : W[4]));
        for (const x of [bx + 1, ex - 1]) for (const y of [by + 2, by + 4]) box(x, y, 1, x, y, 6, W[1]);
        box(bx + 4, by + 2, 8, bx + 9, by + 4, 8, (x) => (x === bx + 6 ? P.paper[1] : P.paper[4]));
        box(bx + 2, by + 2, 8, bx + 2, by + 2, 8, P.iron[1]);
        box(bx + 2, by + 3, 8, bx + 2, by + 3, 10, P.linen[5]);
        box(ex - 2, by + 3, 8, ex - 2, by + 3, 9, P.linen[5]);
        for (let k = 0; k < 3; k++) box(ex - 7, by + 2, 8 + k, ex - 4, by + 4, 8 + k, [P.acc, P.acc2, P.acc3][k][3]);
        if (q.on) {
          flames.push({ x: ex - 2, y: by + 3, z: 10, h: 0 });
          lights.push({ x: ex - 1.5, y: by + 3.5, z: 11, c: 0xffc070, k: 0.9, phase: q.seed % 50 });
        }
        break;
      }
      case "scrolls": {
        const cx = bx + 4, cy = by + 4;
        lathe(cx, cy, 1, 4, () => 3, P.straw, true);
        for (let k = 0; k < 5; k++) box(cx - 2 + k, cy + (k % 2) - 1, 2, cx - 2 + k, cy + (k % 2) - 1, 6 + ((hash(k, 0, q.seed) * 3) | 0), P.paper[3 + (k & 1)]);
        break;
      }
      case "bed": {
        box(bx, by + 1, 1, ex, ey - 1, 3, W[2]);
        box(bx, by + 1, 1, bx + 1, ey - 1, 8, (_x, _y, z) => W[z === 8 ? 4 : 3]);
        box(bx + 2, by + 1, 4, ex, ey - 1, 4, P.linen[4]);
        box(bx + 2, by + 2, 5, bx + 4, ey - 2, 6, P.linen[5]);
        box(bx + 6 + (q.on ? 2 : 0), by + 1, 5, ex, ey - 1, 5, (x, y) => (((x >> 1) + (y >> 1)) & 1 ? P.acc[3] : P.trim[4]));
        if (q.on) for (let x = bx + 8; x <= ex; x += 3) box(x, by + 2, 6, x, ey - 2, 6, P.acc[4]);
        break;
      }
      case "chest": {
        box(bx + 1, by + 2, 1, ex - 1, ey - 2, 4, (x) => (x === bx + 2 || x === ex - 2 ? P.iron[2] : W[2]));
        if (q.on) {
          box(bx + 2, by + 3, 4, ex - 2, ey - 3, 4, (x, y) => (hash(x, y, 4) < 0.5 ? P.brass[4] : P.acc[3]));
          box(bx + 1, by + 1, 5, ex - 1, by + 1, 8, W[3]);
        } else {
          box(bx + 1, by + 2, 5, ex - 1, ey - 2, 5, (x) => (x === bx + 2 || x === ex - 2 ? P.iron[3] : W[4]));
          put((bx + ex) >> 1, ey - 1, 4, P.brass[4]);
        }
        break;
      }
      case "bar":
        box(bx, by + 2, 1, ex, ey - 1, 8, (_x, y, z) => (z === 8 ? W[4] : y === ey - 1 ? W[2] : W[3]));
        break;
      case "casks":
        for (let x = bx + 1; x < ex; x += 8) lathe(x + 3, by + 3, 1, 6, () => 3, W, false);
        break;
      case "slab":
        box(bx, by + 1, 1, ex, ey - 1, 4, P.stone[4]);
        break;
      case "basin":
        box(bx + 1, by + 2, 1, ex - 1, ey - 2, 4, P.stone[3]);
        break;
      case "ledge":
        box(bx, by, 1, ex, ey, 3, P.wall[3]);
        break;
      case "bench":
        box(bx, by + 2, 3, ex, ey - 2, 3, W[4]);
        for (const x of [bx + 1, ex - 1]) box(x, by + 2, 1, x, ey - 2, 2, W[1]);
        break;
      case "settle":
        box(bx, by + 1, 1, ex, by + 2, 11, W[3]);
        box(bx, by + 3, 1, ex, ey - 1, 3, (_x, _y, z) => (z === 3 ? W[4] : W[2]));
        break;
      case "table": {
        box(bx, by + 1, 6, ex, ey - 1, 6, (x, y) => (y === ey - 1 ? W[5] : hash(x >> 2, y, q.seed) < 0.1 ? W[3] : W[4]));
        for (const x of [bx + 1, ex - 1]) for (const y of [by + 2, ey - 2]) box(x, y, 1, x, y, 5, W[1]);
        lathe(bx + 3, by + 4, 7, 2, (t) => 1.6 + t * 0.6, P.clay, true);
        box(bx + 7, by + 3, 7, bx + 9, by + 4, 8, (_x, _y, z) => P.straw[z === 8 ? 4 : 3]);
        lathe(ex - 3, by + 4, 7, 4, (t) => 1.2 - Math.abs(t - 0.4) * 0.8, P.pale, true);
        put(bx + 11, by + 5, 7, 0xb8302a);
        put(bx + 12, by + 4, 7, 0xd84a3a);
        break;
      }
      case "stool": {
        const cx = bx + 4, cy = by + 4;
        box(cx - 2, cy - 2, 4, cx + 1, cy + 1, 4, W[4]);
        for (const [dx, dy] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) box(cx + dx, cy + dy, 1, cx + dx, cy + dy, 3, W[1]);
        break;
      }
      case "plant": {
        const cx = bx + 4, cy = by + 4;
        lathe(cx, cy, 1, 4, (t) => 2 - t * 0.4 + (t > 0.8 ? 0.4 : 0), P.clay, true);
        for (let k = 0; k < 70; k++) {
          const a = hash(k, 0, q.seed) * Math.PI * 2, rr = hash(k, 1, q.seed) * 3.2, z = 5 + hash(k, 2, q.seed) * 5;
          put(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z - rr * 0.4, P.leaf[1 + ((hash(k, 3, q.seed) * 5) | 0)]);
        }
        break;
      }
      case "firewood": {
        for (let z = 1; z <= 4; z++)
          for (let k = 0; k < 3 - (z === 4 ? 1 : 0); k++)
            box(bx + 1, by + 1 + k * 2 + (z & 1), z, ex - 1, by + 1 + k * 2 + (z & 1), z, (x) => (x === ex - 1 ? W[5] : W[2 + ((x + k) & 1)]));
        break;
      }
      case "broom": {
        for (let z = 1; z <= 14; z++) put(bx + 3, by + 1 + Math.floor(z / 5), z + 3, W[3]);
        for (let z = 1; z <= 4; z++) box(bx + 2 - (z < 3 ? 1 : 0), by + 1, z, bx + 4 + (z < 3 ? 1 : 0), by + 2, z, P.straw[z === 4 ? 2 : 4]);
        break;
      }
      case "dresser": {
        for (const x of [bx + 1, ex - 1]) box(x, 1, 1, x, 3, 15, P.stone[2]);
        for (const z of [5, 10, 15]) box(bx + 1, 1, z, ex - 1, 4, z, (x) => P.stone[3 + (x % 3 === 0 ? 1 : 0)]);
        for (let x = bx + 3; x < ex - 2; x += 4) lathe(x, 3, 11, 3, (t) => 1.4 - t * 0.3, P.clay, true);
        break;
      }
      case "shrine": {
        box(bx + 1, 1, 7, ex - 1, 3, 7, W[3]);
        box(bx + 1, 1, 8, bx + 1, 2, 17, P.trim[3]);
        box(ex - 1, 1, 8, ex - 1, 2, 17, P.trim[3]);
        box(bx + 1, 1, 17, ex - 1, 3, 18, P.trim[4]);
        box(bx + 3, 2, 8, bx + 4, 2, 11, P.brass[4]);
        lathe(ex - 3, 2, 8, 1, () => 1, P.clay);
        if (q.on) {
          box(bx + 6, 2, 8, bx + 6, 2, 9, P.linen[5]);
          flames.push({ x: bx + 6, y: 2, z: 10, h: 0 });
          lights.push({ x: bx + 6.5, y: 2.5, z: 11, c: 0xffc070, k: 0.8, phase: q.seed % 40 });
        }
        break;
      }
      case "horns": {
        box(bx + 3, 1, 12, bx + 4, 2, 16, P.linen[5]);
        for (let i = 0; i < 4; i++) {
          put(bx + 2 - (i >> 1), 1, 16 + i, P.pale[1]);
          put(bx + 5 + (i >> 1), 1, 16 + i, P.pale[1]);
        }
        box(bx + 1, 1, 6, ex - 1, 1, 11, (x, _y, z) => ((x + z) % 3 === 0 ? P.acc[3] : -1));
        break;
      }
      case "mat": {
        box(bx + 1, by + 1, 1, ex - 1, ey - 1, 1, (x, y) => ((x + y) % 2 ? P.straw[3] : P.straw[2]));
        if (q.on) box(bx + 4, by + 1, 2, ex - 1, ey - 1, 2, (x, y) => (((x >> 1) + (y >> 1)) & 1 ? P.acc[3] : P.acc[2]));
        else for (let y = by + 1; y <= ey - 1; y++) for (const [a, b] of [[0, 2], [1, 2], [0, 3], [1, 3]]) put(bx + 4 + a, y, b, P.acc[3]);
        box(bx + 1, by + 2, 2, bx + 2, ey - 2, 2, P.linen[5]);
        break;
      }
      case "boxbed": {
        box(bx, by + 1, 1, ex, ey - 1, 4, (x, y) => (x === bx || x === ex || y === by + 1 || y === ey - 1 ? P.stone[3] : -1));
        box(bx + 1, by + 2, 1, ex - 1, ey - 2, 2, P.straw[3]);
        box(bx + 4, by + 2, 3, ex - 1, ey - 2, 3, (x, y) => P.fur[(x + y) % 3 === 0 ? 2 : 3]);
        break;
      }
      case "lowtable": {
        box(bx + 1, by + 1, 3, ex - 1, ey - 1, 3, W[4]);
        for (const [x, y] of [[bx + 1, by + 1], [ex - 1, by + 1], [bx + 1, ey - 1], [ex - 1, ey - 1]]) box(x, y, 1, x, y, 2, W[1]);
        lathe(bx + 4, by + 4, 4, 3, (t) => 1.5 - t * 0.6, P.brass);
        break;
      }
      case "cushions":
        box(bx + 1, by + 1, 1, bx + 4, by + 4, 2, P.acc[3]);
        box(bx + 4, by + 4, 1, ex - 1, ey - 1, 2, P.acc2[3]);
        break;
      case "divan":
        box(bx, by + 1, 1, ex, ey - 2, 3, W[2]);
        box(bx, by + 1, 4, ex, ey - 2, 4, (x) => P.acc[(x >> 1) % 2 ? 3 : 2]);
        for (let x = bx; x <= ex; x++) for (const [a, b] of [[0, 5], [0, 6], [1, 5]]) put(x, by + 1 + a, b, P.acc2[(x >> 2) % 2 ? 3 : 4]);
        break;
      case "lantern": {
        const cx = bx + 4, cy = by + 4;
        box(cx - 1, cy - 1, 1, cx + 1, cy + 1, 1, P.iron[2]);
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(cx + a, cy + b, 2, cx + a, cy + b, 5, P.iron[3]);
        box(cx - 1, cy - 1, 6, cx + 1, cy + 1, 6, P.iron[2]);
        if (q.on && !q.broken) {
          flames.push({ x: cx, y: cy, z: 3, h: 0 });
          lights.push({ x: cx + 0.5, y: cy + 0.5, z: 4, c: 0xffc070, k: 1.1, phase: q.seed % 60 });
        }
        break;
      }
      case "firepit":
      case "irori":
      case "brazier": {
        const cx = (bx + ex) / 2, cy = (by + ey) / 2, rr = (ex - bx) / 2 - 1;
        if (q.kind === "irori") box(bx + 1, by + 1, 1, ex - 1, ey - 1, 1, (x, y) => (x === bx + 1 || x === ex - 1 || y === by + 1 || y === ey - 1 ? W[1] : P.stone[4]));
        else if (q.kind === "brazier") {
          for (const [a, b] of [[-2, -2], [2, -2], [0, 2]]) box(cx + a, cy + b, 1, cx + a, cy + b, 3, P.brass[2]);
          lathe(Math.round(cx), Math.round(cy), 4, 2, (t) => 2 + t, P.brass, true);
        } else
          for (let a = 0; a < 20; a++) {
            const t = (a / 20) * Math.PI * 2;
            box(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, 1, cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, 1 + (a % 2), P.stone[2 + (a % 3)]);
          }
        if (q.kind === "irori") {
          box(Math.round(cx), Math.round(cy), 5, Math.round(cx), Math.round(cy), WALL - 1, P.iron[1]);
          lathe(Math.round(cx), Math.round(cy), 3, 3, (t) => 2 - t * 0.5, P.iron);
        }
        const z0 = q.kind === "brazier" ? 6 : 2;
        if (q.kind !== "brazier") box(Math.round(cx) - 2, Math.round(cy), 1, Math.round(cx) + 2, Math.round(cy), 1, W[2]);
        if (q.on) {
          const fr = q.kind === "brazier" ? 1 : Math.max(1, Math.floor(rr * 0.6));
          for (let y = Math.round(cy - fr); y <= Math.round(cy + fr); y++)
            for (let x = Math.round(cx - fr); x <= Math.round(cx + fr); x++)
              for (let z = z0; z <= z0 + 3; z++) flames.push({ x, y, z, h: (z - z0) / 3 + Math.hypot(x - cx, y - cy) / (fr * 2 + 1) });
          lights.push({ x: cx + 0.5, y: cy + 0.5, z: z0 + 2, c: 0xff8a3a, k: q.kind === "brazier" ? 1.8 : 3, phase: q.seed % 100 });
        }
        break;
      }
      case "stove": {
        const cx = bx + 4, cy = by + 4;
        box(cx - 2, cy - 2, 1, cx + 2, cy + 2, 5, P.iron[2]);
        box(cx - 1, cy - 1, 6, cx, cy, WALL + 1, P.iron[3]);
        if (q.on) lights.push({ x: cx + 0.5, y: cy + 3.2, z: 3, c: 0xff8a3a, k: 1.6, phase: q.seed % 80 });
        break;
      }
      case "pole":
        box(bx + 3, by + 3, 1, bx + 4, by + 4, WALL, W[3]);
        break;
      case "ladder":
        for (let z = 1; z <= 22; z++) {
          const y = Math.round(ey - 1 - (z / 22) * 5);
          put(bx + 2, y, z, W[3]);
          put(bx + 5, y, z, W[3]);
          if (z % 3 === 0) box(bx + 3, y, z, bx + 4, y, z, W[2]);
        }
        break;
      case "quern":
        box(bx + 1, by + 2, 1, ex - 1, by + 5, 2, P.stone[3]);
        box(bx + 3, by + 3, 3, bx + 4, by + 4, 3, P.stone[4]);
        break;
      case "hides":
        for (let z = 1; z <= 4; z++) box(bx + 1 + (z & 1), by + 1, z, ex - 1, ey - 1 - (z & 1), z, [P.fur, P.pale, P.fur][z % 3][2 + (z & 1)]);
        break;
      case "coolamon":
        for (let y = by + 2; y <= ey - 2; y++) {
          const half = Math.round(3 * Math.sin(((y - by - 1.5) / (ey - by - 3)) * Math.PI));
          box(bx + 4 - half, y, 1, bx + 3 + half, y, 1, W[3]);
        }
        break;
      case "screen":
        for (let k = 0; k < 4; k++) box(bx + k * 4, by + 2 + (k % 2) * 2, 1, bx + k * 4 + 3, by + 2 + (k % 2) * 2, 12, (x, _y, z) => (z === 12 || x === bx + k * 4 ? P.trim[2] : P.paper[4]));
        break;
      case "fountain": {
        const cx = (bx + ex) / 2, cy = (by + ey) / 2;
        for (let y = by + 1; y < ey; y++)
          for (let x = bx + 1; x < ex; x++) {
            const r0 = Math.hypot(x - cx, y - cy);
            if (r0 > (ex - bx) / 2 - 1) continue;
            box(x, y, 1, x, y, r0 > (ex - bx) / 2 - 2.5 ? 3 : 1, r0 > (ex - bx) / 2 - 2.5 ? P.stone[4] : mix(0x3a6f9a, P.acc2[3], 0.3));
          }
        box(Math.round(cx), Math.round(cy), 2, Math.round(cx), Math.round(cy), 6, P.stone[4]);
        break;
      }
      case "pack":
        box(bx + 2, by + 2, 1, ex - 2, ey - 3, 5, P.acc[3]);
        box(bx + 2, by + 2, 6, ex - 2, by + 3, 7, P.acc2[3]);
        break;
      case "armchair":
        box(bx + 1, by + 2, 1, ex - 1, ey - 1, 3, P.acc[3]);
        box(bx + 1, by + 1, 4, ex - 1, by + 2, 8, P.acc[2]);
        box(bx + 1, by + 2, 4, bx + 1, ey - 1, 5, P.acc[2]);
        box(ex - 1, by + 2, 4, ex - 1, ey - 1, 5, P.acc[2]);
        break;
      case "sofa":
        box(bx, by + 2, 1, ex, ey - 1, 3, P.acc[3]);
        box(bx, by + 1, 4, ex, by + 2, 7, P.acc[2]);
        break;
      case "radio":
        box(bx + 2, by + 3, 1, ex - 2, ey - 2, 3, W[2]);
        box(bx + 2, by + 3, 4, ex - 2, by + 4, 9, W[3]);
        break;
      case "range":
        box(bx + 1, by + 1, 1, ex - 1, by + 5, 6, P.iron[2]);
        box(ex - 2, by + 1, 7, ex - 1, by + 2, WALL, P.iron[3]);
        if (q.on) lights.push({ x: (bx + ex) / 2, y: by + 6, z: 2, c: 0xff8a3a, k: 1.2, phase: q.seed % 80 });
        break;
      case "icebox":
        box(bx + 1, by + 1, 1, ex - 1, by + 5, 13, W[3]);
        break;
      case "frame":
        box(bx + 1, 1, 12, ex - 1, 1, 18, W[2]);
        break;
      case "clock":
        box(bx + 2, 1, 8, ex - 2, 2, 22, W[3]);
        break;
      case "elevator":
        box(bx, 1, 1, ex, 1, 20, P.brass[3]);
        box(bx + 1, 1, 1, ex - 1, 1, 18, P.iron[2]);
        break;
      case "lamp": {
        const cx = bx + 4, cy = by + 4;
        box(cx - 1, cy - 1, 1, cx + 1, cy + 1, 1, P.iron[2]);
        if (q.broken) {
          box(cx, cy, 2, cx, cy, 6, P.iron[3]);
          box(cx + 2, cy, 1, cx + 3, cy + 1, 1, P.brass[3]);
          break;
        }
        box(cx, cy, 2, cx, cy, 11, P.iron[3]);
        box(cx - 1, cy - 1, 12, cx + 1, cy + 1, 12, P.brass[4]);
        if (q.on) {
          flames.push({ x: cx, y: cy, z: 13, h: 0 });
          lights.push({ x: cx + 0.5, y: cy + 0.5, z: 14, c: 0xffb45a, k: 1.5, phase: q.seed % 70 });
        }
        break;
      }
    }
    for (let i = nl; i < lights.length; i++) lights[i].y += dy;
    for (let i = nf; i < flames.length; i++) flames[i].y += dy;
  }
  if (cat) {
    dy = 0;
    id = cat.id;
    const cx = 1 + cat.x * V + 4, cy = 1 + cat.y * V + 4, z0 = Math.max(g.top(cx, cy), g.top(cx - 1, cy)) + 1;
    const F = P.fur;
    if (!cat.on) {
      for (let dz = 0; dz < 2; dz++)
        for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) if (!(dz === 1 && Math.abs(dx) === 2)) put(cx + dx, cy + dy, z0 + dz, (dx + 9) % 2 ? F[3] : F[2 + dz]);
      put(cx - 2, cy - 1, z0 + 2, F[3]);
      put(cx - 2, cy + 1, z0 + 2, F[3]);
      for (let dx = -2; dx <= 2; dx++) put(cx + dx, cy + 2, z0, F[2]);
    } else {
      box(cx - 1, cy - 1, z0, cx + 1, cy + 1, z0 + 2, (x) => F[x === cx - 1 ? 4 : 3]);
      box(cx - 1, cy, z0 + 3, cx + 1, cy + 1, z0 + 4, F[4]);
      put(cx - 1, cy, z0 + 5, F[3]);
      put(cx + 1, cy, z0 + 5, F[3]);
      put(cx, cy + 2, z0 + 4, 0x2a3a18);
      box(cx + 2, cy + 1, z0, cx + 2, cy + 1, z0 + 3, F[2]);
    }
  }
  for (const k of holes) {
    const x = k % 4096, cx = Math.floor((x - 1) / V);
    if (x > 0 && x < X - 1) g.set(x, (top[cx] ?? 0) * V, Math.floor(k / 4096), -1, -1);
  }
  return { g, lights, flames, P };
}

// Upper hemisphere, spread by a golden-angle spiral.
/** Splits each voxel into k³. Walls and floor stay square and re-sample their
 * pattern at the finer grain; everything else loses cells whose trilinear
 * occupancy falls under 0.3, which rounds corners without thinning a thread. */
function upsample(g: Grid, k: number, p: RoomParams, P: ReturnType<typeof palette>) {
  const o = new Grid(g.X * k, g.Y * k, g.Z * k), mask = roomMask(p), court = courtParams(p);
  for (let y = 0; y < o.Y; y++) for (let x = 0; x < o.X; x++) o.col[y * o.X + x] = g.col[Math.floor(y / k) * g.X + Math.floor(x / k)];
  for (let z = 0; z < o.Z; z++)
    for (let y = 0; y < o.Y; y++)
      for (let x = 0; x < o.X; x++) {
        const cx = Math.floor(x / k), cy = Math.floor(y / k), cz = Math.floor(z / k);
        const ci = g.i(cx, cy, cz), c = g.c[ci];
        if (c < 0) continue;
        const u = Math.floor(((x / k) - 1) * 2), v = Math.floor(((z / k) - 1) * 2);
        if (cz === 0 && g.inRoom(cx, cy)) {
          const open = g.col[cy * g.X + cx] === OPEN && mask[Math.floor((cy - 1) / V) * p.w + Math.floor((cx - 1) / V)] === 2;
          o.set(x, y, z, floorColor(open ? court : p, P, u, Math.floor(((y / k) - 1) * 2)), -1);
          continue;
        }
        if (g.col[cy * g.X + cx] === WALLED && cz < WALL && g.id[ci] < 0) {
          const across = g.inRoom(cx, cy + 1) || g.inRoom(cx, cy - 1);
          o.set(x, y, z, wallColor(p, P, Math.floor(((across ? x : y) / k - 1) * 2), v), -1);
          continue;
        }
        const fx = (x + 0.5) / k - 0.5, fy = (y + 0.5) / k - 0.5, fz = (z + 0.5) / k - 0.5;
        const x0 = Math.floor(fx), y0 = Math.floor(fy), z0 = Math.floor(fz);
        let occ = 0;
        for (let dz = 0; dz < 2; dz++)
          for (let dy = 0; dy < 2; dy++)
            for (let dx = 0; dx < 2; dx++)
              if (g.solid(x0 + dx, y0 + dy, z0 + dz))
                occ += (dx ? fx - x0 : 1 - fx + x0) * (dy ? fy - y0 : 1 - fy + y0) * (dz ? fz - z0 : 1 - fz + z0);
        if (occ < 0.3) continue;
        const i = o.i(x, y, z);
        o.c[i] = c;
        o.id[i] = g.id[ci];
      }
  return o;
}

const SKY = Array.from({ length: 10 }, (_, i) => {
  const z = 0.08 + (i / 10) * 0.9, r = Math.sqrt(1 - z * z), a = i * 2.39996;
  return [Math.cos(a) * r, Math.sin(a) * r, z];
});

export class VoxelRoom {
  W = 0;
  H = 0;
  hover = -1;
  props: Prop[] = [];
  buildMs = 0;
  private ctx: CanvasRenderingContext2D;
  private img?: ImageData;
  private t = 0;
  private k = 1;
  private opts: VoxelOptions = { rot: 0, top: false, detail: 1, bevel: true, haze: true, posterize: false };
  private p!: RoomParams;
  private g!: Grid;
  private lights: Light[] = [];
  private flames: Flame[] = [];
  private nf = 0;
  private faces: number[] = [];
  private albedo = new Int32Array(0);
  private base = new Float32Array(0);
  private lk = new Float32Array(0);
  private fcol = new Int32Array(0);
  private pixFace = new Int32Array(0);
  private pixMul = new Float32Array(0);
  private pixId = new Int16Array(0);
  private zb = new Float32Array(0);
  private sky = new Uint8Array(0);
  private haze = new Float32Array(0);
  private motes: { x: number; y: number; z: number }[] = [];
  private offX = 0;
  private offY = 0;
  private sunNow = sun(12);

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  set(p: RoomParams, props: Prop[], opts: VoxelOptions, holes = new Set<number>()) {
    const t0 = performance.now();
    this.p = p;
    this.props = props;
    this.opts = opts;
    const b = build(p, props, holes), k = (this.k = opts.detail);
    let g = k > 1 ? upsample(b.g, k, p, b.P) : b.g;
    let lights = b.lights.map((l) => ({ ...l, x: l.x * k, y: l.y * k, z: l.z * k }));
    let flames = b.flames.flatMap((f) => {
      const out: Flame[] = [];
      for (let l = 0; l < k; l++) for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) out.push({ x: f.x * k + i, y: f.y * k + j, z: f.z * k + l, h: f.h + (l / k) * 0.2 });
      return out;
    });
    this.sunNow = sun(p.hour);
    let sd = [...this.sunNow.dir];
    for (let r = 0; r < ((opts.rot % 4) + 4) % 4; r++) {
      const Y0 = g.Y;
      lights = lights.map((l) => ({ ...l, x: Y0 - l.y, y: l.x }));
      flames = flames.map((f) => ({ ...f, x: Y0 - 1 - f.y, y: f.x }));
      sd = [-sd[1], sd[0], sd[2]];
      g = g.rot();
    }
    this.g = g;
    this.lights = lights;
    this.flames = flames;
    this.light(sd);
    this.raster();
    this.buildMs = performance.now() - t0;
  }

  /** Walls between the room and the viewer come down to a stub. */
  private cut(x: number, y: number, z: number) {
    const k = this.k, g = this.g;
    if (z <= 2 * k || g.col[y * g.X + x] !== WALLED) return false;
    for (let d = 1; d <= k; d++)
      if (g.inRoom(x, y - d) || (!this.opts.top && (g.inRoom(x - d, y) || g.inRoom(x - d, y - d)))) return true;
    return false;
  }
  // Top-down is the pixel room's oblique: 2 px a voxel, so 16 px a tile.
  private px(x: number, y: number) {
    return (this.opts.top ? x * 2 : (x - y) * 4) + this.offX;
  }
  private py(x: number, y: number, z: number) {
    return (this.opts.top ? (y - z) * 2 : (x + y) * 2 - z * 4) + this.offY;
  }
  private depth(x: number, y: number, z: number) {
    return this.opts.top ? y + z : x + y + z;
  }
  private visible(x: number, y: number, z: number) {
    const g = this.g;
    return x >= 0 && y >= 0 && z >= 0 && x < g.X && y < g.Y && z < g.Z && g.c[g.i(x, y, z)] >= 0 && !this.cut(x, y, z);
  }

  /** 0 blocked, 1 escaped the room through an opening, 2 reached maxT. */
  private march(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, step = 0.6) {
    const g = this.g;
    for (let t = 0.4; t < maxT; t += step) {
      const x = Math.floor(ox + dx * t), y = Math.floor(oy + dy * t), z = Math.floor(oz + dz * t);
      if (z < 0) return 0;
      if (x < 0 || y < 0 || x >= g.X || y >= g.Y) return 1;
      // The roof sits on the wall tops of roofed columns; the sky is above the rest.
      if (z > WALL * this.k) {
        const t = g.col[y * g.X + x];
        return t === OUT || t === OPEN ? 1 : 0;
      }
      if (g.c[g.i(x, y, z)] >= 0) return 0;
    }
    return 2;
  }

  private light(sd: number[]) {
    const g = this.g, L = this.lights.length;
    const faces: number[] = [];
    for (let z = 0; z < g.Z; z++)
      for (let y = 0; y < g.Y; y++)
        for (let x = 0; x < g.X; x++) {
          if (!this.visible(x, y, z)) continue;
          if (!this.visible(x, y, z + 1)) faces.push(x, y, z, 0);
          if (!this.opts.top && !this.visible(x + 1, y, z)) faces.push(x, y, z, 1);
          if (!this.visible(x, y + 1, z)) faces.push(x, y, z, 2);
        }
    const n = faces.length / 4;
    this.nf = n;
    this.albedo = new Int32Array(n * 2);
    this.base = new Float32Array(n * 3);
    this.lk = new Float32Array(n * Math.max(1, L));
    this.fcol = new Int32Array(n);
    const day = this.sunNow.strength;
    const skyC = mix(0x3a4a8a, 0xcfe4ff, day);
    const sr = ((this.sunNow.color >> 16) & 255) / 255, sg = ((this.sunNow.color >> 8) & 255) / 255, sb = (this.sunNow.color & 255) / 255;
    const kr = ((skyC >> 16) & 255) / 255, kg = ((skyC >> 8) & 255) / 255, kb = (skyC & 255) / 255;
    const dirK = [1, 0.66, 0.82];
    // Coarser steps at finer detail keep a relight near a second; threads stay 2+ cells thick.
    const k = this.k, st = Math.max(1, k * 0.6);
    for (let f = 0; f < n; f++) {
      const x = faces[f * 4], y = faces[f * 4 + 1], z = faces[f * 4 + 2], t = faces[f * 4 + 3];
      const nx = t === 1 ? 1 : 0, ny = t === 2 ? 1 : 0, nz = t === 0 ? 1 : 0;
      const px = x + 0.5 + nx * 0.55, py = y + 0.5 + ny * 0.55, pz = z + 0.5 + nz * 0.55;
      let occ = 0;
      const ax = [nz ? [1, 0, 0] : [0, 0, 1], nz ? [0, 1, 0] : nx ? [0, 1, 0] : [1, 0, 0]];
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const r = Math.max(1, this.k >> 1);
        const cx = x + nx + (ax[0][0] * a + ax[1][0] * b) * r, cy = y + ny + (ax[0][1] * a + ax[1][1] * b) * r, cz = z + nz + (ax[0][2] * a + ax[1][2] * b) * r;
        if (g.solid(cx, cy, cz)) occ += a && b ? 0.6 : 1;
      }
      const ao = 1 - occ * 0.075;
      let open = 0, tot = 0;
      for (const [si, d] of SKY.entries()) {
        if (si % k) continue;
        for (const e of [d, [-d[0], -d[1], d[2]], [d[0], -d[1], d[2] * 0.4]]) {
          const de = e[0] * nx + e[1] * ny + e[2] * nz;
          if (de <= 0.05) continue;
          tot += de;
          if (this.march(px, py, pz, e[0], e[1], e[2], 70 * k, 0.8 * st) === 1) open += de;
        }
      }
      const skyK = tot ? (open / tot) * 3.4 : 0;
      let sunK = 0;
      const sdot = sd[0] * nx + sd[1] * ny + sd[2] * nz;
      if (day > 0 && sdot > 0 && this.march(px, py, pz, sd[0], sd[1], sd[2], 160 * k, 0.5 * st) === 1) sunK = sdot * day * 2.6;
      const amb = (0.2 + day * 0.14) * dirK[t] * ao;
      this.base[f * 3] = amb + skyK * kr * ao * 0.55 + sunK * sr;
      this.base[f * 3 + 1] = amb + skyK * kg * ao * 0.55 + sunK * sg;
      this.base[f * 3 + 2] = amb * 1.2 + skyK * kb * ao * 0.6 + sunK * sb;
      this.lights.forEach((l, li) => {
        const dx = l.x - px, dy = l.y - py, dz = l.z - pz, d = Math.hypot(dx, dy, dz);
        const lam = (dx * nx + dy * ny + dz * nz) / d;
        if (lam <= 0) return;
        // Light scatters round a room, so shadowed faces keep a share of it
        // and small obstacles cast soft shade rather than hard spokes.
        const lit = this.march(px, py, pz, dx / d, dy / d, dz / d, d - 0.9 * k, 0.45 * st) === 0 ? 0.32 : 1;
        this.lk[f * L + li] = lit * (lam * 0.5 + 0.5) * l.k * ao / (1 + (d * d) / (90 * k * k));
      });
      const i = g.i(x, y, z), c = g.c[i];
      this.albedo[f * 2] = scale(c, 0.965 + hash(x * 7 + y, z, 31) * 0.07);
      this.albedo[f * 2 + 1] = g.id[i];
    }
    this.faces = faces;
  }

  private raster() {
    const g = this.g;
    const top = this.opts.top;
    this.offX = top ? 4 : g.Y * 4 + 6;
    this.offY = top ? g.Z * 2 + 4 : g.Z * 4 + 8;
    this.W = top ? g.X * 2 + 8 : (g.X + g.Y) * 4 + 12;
    this.H = this.offY + (top ? g.Y * 2 + 6 : (g.X + g.Y) * 2 + 8);
    const masks = top ? TOP_MASK : MASK, hex = top ? TOP_HEX : HEX, blob = (top ? 0.8 : 1) * this.k;
    const N = this.W * this.H;
    this.ctx.canvas.width = this.W;
    this.ctx.canvas.height = this.H;
    this.img = this.ctx.createImageData(this.W, this.H);
    this.pixFace = new Int32Array(N).fill(-1);
    this.pixMul = new Float32Array(N).fill(1);
    this.pixId = new Int16Array(N).fill(-1);
    this.zb = new Float32Array(N).fill(-1e9);
    this.sky = new Uint8Array(N);
    const faces = this.faces;
    for (let f = 0; f < this.nf; f++) {
      const x = faces[f * 4], y = faces[f * 4 + 1], z = faces[f * 4 + 2], t = faces[f * 4 + 3];
      const sx = this.px(x, y), sy = this.py(x, y, z), depth = this.depth(x, y, z);
      for (const [dx, dy, m] of masks[t]) {
        const px = sx + dx, py = sy + dy;
        if (px < 0 || py < 0 || px >= this.W || py >= this.H) continue;
        const k = py * this.W + px;
        if (depth < this.zb[k]) continue;
        this.zb[k] = depth;
        this.pixFace[k] = f;
        this.pixMul[k] = this.opts.bevel && this.k === 1 ? m : 1;
        this.pixId[k] = this.albedo[f * 2 + 1];
      }
    }
    const k = this.k;
    for (let z = 1; z < WALL * k; z++)
      for (let y = 0; y < g.Y; y++)
        for (let x = 0; x < g.X; x++) {
          if (g.col[y * g.X + x] !== WALLED || g.c[g.i(x, y, z)] >= 0) continue;
          const sx = this.px(x, y), sy = this.py(x, y, z);
          for (const [dx, dy] of hex) {
            const k = (sy + dy) * this.W + sx + dx;
            if (k >= 0 && k < N && this.pixFace[k] < 0) this.sky[k] = z < 6 * this.k ? 2 : 1;
          }
        }
    this.haze = new Float32Array(N);
    this.motes = [];
    const sd = this.sunDir();
    if (this.opts.haze && this.sunNow.strength > 0) {
      for (let z = k; z < (WALL - 1) * k; z += 2 * k)
        for (let y = k; y < g.Y - k; y += 2 * k)
          for (let x = k; x < g.X - k; x += 2 * k) {
            if (!g.inRoom(x, y) || g.c[g.i(x, y, z)] >= 0 || this.march(x + 0.5, y + 0.5, z + 0.5, sd[0], sd[1], sd[2], 160 * k, 0.7 * k) !== 1) continue;
            if (hash(x, y * 31 + z, 5) < 0.04) this.motes.push({ x, y, z });
            const sx = this.px(x, y), sy = this.py(x, y, z), depth = this.depth(x, y, z);
            for (let dy = -6 * blob; dy <= 6 * blob; dy++)
              for (let dx = -8 * blob; dx <= 8 * blob; dx++) {
                const k = (sy + dy) * this.W + sx + dx;
                if (k < 0 || k >= N || this.zb[k] > depth) continue;
                this.haze[k] += 0.02 * Math.max(0, 1 - (dx * dx) / (72 * blob * blob) - (dy * dy) / (40 * blob * blob));
              }
          }
    }
  }
  private sunDir() {
    let sd = [...this.sunNow.dir];
    for (let r = 0; r < ((this.opts.rot % 4) + 4) % 4; r++) sd = [-sd[1], sd[0], sd[2]];
    return sd;
  }

  pick(x: number, y: number) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return -1;
    const id = this.pixId[y * this.W + x];
    return id >= 0 && this.props[id]?.kind !== "rug" ? id : -1;
  }

  /** Per-pixel light, no albedo: -1 where no voxel face is seen. The hybrid
   * room multiplies its hand-drawn pixels by this. */
  lightField(dt: number): LightField | undefined {
    if (!this.img) return;
    this.t += dt;
    const t = this.t, L = this.lights.length, N = this.W * this.H;
    const flick = this.lights.map((l) => 0.82 + 0.12 * Math.sin(t * 8 + l.phase) + 0.06 * Math.sin(t * 21 + l.phase * 2));
    const lc = this.lights.map((l) => [((l.c >> 16) & 255) / 255, ((l.c >> 8) & 255) / 255, (l.c & 255) / 255]);
    const fl = new Float32Array(this.nf * 3);
    for (let f = 0; f < this.nf; f++) {
      let r = this.base[f * 3], g = this.base[f * 3 + 1], b = this.base[f * 3 + 2];
      for (let li = 0; li < L; li++) {
        const k = this.lk[f * L + li] * flick[li];
        r += k * lc[li][0];
        g += k * lc[li][1];
        b += k * lc[li][2];
      }
      fl[f * 3] = r;
      fl[f * 3 + 1] = g;
      fl[f * 3 + 2] = b;
    }
    const out = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) {
      const f = this.pixFace[k];
      if (f < 0) out[k * 3] = -1;
      else {
        out[k * 3] = fl[f * 3];
        out[k * 3 + 1] = fl[f * 3 + 1];
        out[k * 3 + 2] = fl[f * 3 + 2];
      }
    }
    return { W: this.W, H: this.H, k: this.k, offX: this.offX, offY: this.offY, light: out, haze: this.haze, sun: this.sunNow.color };
  }

  frame(dt: number) {
    if (!this.img) return;
    this.t += dt;
    const t = this.t, L = this.lights.length, d = this.img.data;
    const flick = this.lights.map((l) => 0.82 + 0.12 * Math.sin(t * 8 + l.phase) + 0.06 * Math.sin(t * 21 + l.phase * 2));
    const lc = this.lights.map((l) => [((l.c >> 16) & 255) / 255, ((l.c >> 8) & 255) / 255, (l.c & 255) / 255]);
    const post = this.opts.posterize;
    for (let f = 0; f < this.nf; f++) {
      let r = this.base[f * 3], g = this.base[f * 3 + 1], b = this.base[f * 3 + 2];
      for (let li = 0; li < L; li++) {
        const k = this.lk[f * L + li] * flick[li];
        r += k * lc[li][0];
        g += k * lc[li][1];
        b += k * lc[li][2];
      }
      const c = this.albedo[f * 2];
      const tm = (v: number, a: number) => {
        const x = (a / 255) * v;
        return (x / (1 + x * 0.55)) * 1.55 * 255;
      };
      this.fcol[f] = pack3(tm(r, (c >> 16) & 255), tm(g, (c >> 8) & 255), tm(b, c & 255));
    }
    const skyTop = sky(this.p.hour, 0.1), skyLow = sky(this.p.hour, 0.9);
    const ground = mix(0x1c2a1c, 0x6f9a4a, this.sunNow.strength);
    const W = this.W;
    for (let k = 0, n = W * this.H; k < n; k++) {
      const o = k * 4, f = this.pixFace[k];
      let r: number, g: number, b: number;
      if (f >= 0) {
        const c = this.fcol[f], m = this.pixMul[k];
        r = ((c >> 16) & 255) * m;
        g = ((c >> 8) & 255) * m;
        b = (c & 255) * m;
      } else if (this.sky[k]) {
        const c = this.sky[k] === 2 ? ground : mix(skyTop, skyLow, (k / W / this.H) * 1.4);
        r = (c >> 16) & 255;
        g = (c >> 8) & 255;
        b = c & 255;
      } else {
        const v = k / W / this.H;
        r = 16 + v * 10;
        g = 12 + v * 8;
        b = 22 + v * 14;
      }
      const h = this.haze[k];
      if (h > 0) {
        const s = h * (0.9 + 0.1 * Math.sin(t * 0.8 + (k % W) * 0.05)) * 255;
        const sc = this.sunNow.color;
        r += s * (((sc >> 16) & 255) / 255);
        g += s * (((sc >> 8) & 255) / 255);
        b += s * ((sc & 255) / 255);
      }
      if (post) {
        const th = BAYER[((k / W) & 3) * 4 + (k % W & 3)] * 24 - 12;
        r = Math.round((r + th) / 24) * 24;
        g = Math.round((g + th) / 24) * 24;
        b = Math.round((b + th) / 24) * 24;
      }
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = b;
      d[o + 3] = 255;
    }
    const tick = Math.floor(t * 14);
    this.flames.forEach((fl, i) => {
      if (fl.h > 0 && hash(i, tick, 3) < fl.h * 0.85) return;
      const c = fl.h < 0.3 ? 0xfff0b0 : fl.h < 0.6 ? 0xffb238 : fl.h < 0.9 ? 0xf2621a : 0xa82a14;
      this.sprite(fl.x, fl.y, fl.z, c, 1);
    });
    const sd = this.sunDir();
    for (const [i, m] of this.motes.entries()) {
      const drift = (t * 0.25 + hash(i, 0, 9) * 10) % 10;
      const s = this.k;
      const x = m.x + (Math.sin(t * 0.3 + i) * 0.8 - sd[0] * drift * 0.2) * s, y = m.y + (Math.cos(t * 0.27 + i) * 0.8 - sd[1] * drift * 0.2) * s;
      const z = m.z + Math.sin(t * 0.2 + i * 2) * 1.5 * s;
      const sx = Math.round(this.px(x, y)), sy = Math.round(this.py(x, y, z));
      const k = sy * W + sx;
      if (k < 0 || k >= W * this.H || this.zb[k] > this.depth(x, y, z)) continue;
      const a = 0.5 + 0.5 * Math.sin(t * 2.3 + i);
      d[k * 4] += (255 - d[k * 4]) * a;
      d[k * 4 + 1] += (246 - d[k * 4 + 1]) * a;
      d[k * 4 + 2] += (220 - d[k * 4 + 2]) * a;
    }
    if (this.hover >= 0) {
      const h = this.hover, pulse = 0.65 + 0.35 * Math.sin(t * 6), id = this.pixId;
      for (let y = 1; y < this.H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const k = y * W + x;
          if (id[k] === h) continue;
          if (id[k - 1] === h || id[k + 1] === h || id[k - W] === h || id[k + W] === h) {
            d[k * 4] += (255 - d[k * 4]) * pulse;
            d[k * 4 + 1] += (240 - d[k * 4 + 1]) * pulse;
            d[k * 4 + 2] += (160 - d[k * 4 + 2]) * pulse;
          }
        }
    }
    this.ctx.putImageData(this.img, 0, 0);
  }

  private sprite(x: number, y: number, z: number, c: number, a: number) {
    const sx = this.px(x, y), sy = this.py(x, y, z), depth = this.depth(x, y, z), d = this.img!.data;
    for (const [dx, dy] of this.opts.top ? TOP_HEX : HEX) {
      const px = sx + dx, py = sy + dy;
      if (px < 0 || py < 0 || px >= this.W || py >= this.H) continue;
      const k = py * this.W + px;
      if (this.zb[k] > depth + 0.5) continue;
      d[k * 4] = d[k * 4] * (1 - a) + ((c >> 16) & 255) * a;
      d[k * 4 + 1] = d[k * 4 + 1] * (1 - a) + ((c >> 8) & 255) * a;
      d[k * 4 + 2] = d[k * 4 + 2] * (1 - a) + (c & 255) * a;
    }
  }
}

const pack3 = (r: number, g: number, b: number) =>
  (Math.min(255, Math.max(0, r | 0)) << 16) | (Math.min(255, Math.max(0, g | 0)) << 8) | Math.min(255, Math.max(0, b | 0));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

// Screen pixels of one voxel's top, +x and +y faces, relative to the
// projection of its (x, y, z) corner, with a bevel multiplier per pixel.
const FACES = [
  [[0, -4], [4, -2], [0, 0], [-4, -2]],
  [[4, -2], [4, 2], [0, 4], [0, 0]],
  [[-4, -2], [0, 0], [0, 4], [-4, 2]],
];
function inside(poly: number[][], x: number, y: number) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (c === 0) continue;
    if (sign === 0) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}
const MASK: [number, number, number][][] = FACES.map((poly, fi) => {
  const px: [number, number][] = [];
  for (let y = -4; y < 4; y++) for (let x = -4; x < 4; x++) if (inside(poly, x + 0.5, y + 0.5)) px.push([x, y]);
  const has = new Set(px.map(([x, y]) => `${x},${y}`));
  return px.map(([x, y]) => {
    let m = 1;
    if (fi === 0 && !has.has(`${x},${y - 1}`)) m = 1.16;
    else if (fi > 0 && !has.has(`${x},${y + 1}`)) m = 0.86;
    return [x, y, m] as [number, number, number];
  });
});
const HEX = MASK.flat().map(([x, y]) => [x, y]);
const TOP_MASK: [number, number, number][][] = [
  [[0, -2, 1.16], [1, -2, 1.16], [0, -1, 1], [1, -1, 1]],
  [],
  [[0, 0, 1], [1, 0, 1], [0, 1, 0.86], [1, 1, 0.86]],
];
const TOP_HEX = TOP_MASK.flat().map(([x, y]) => [x, y]);
