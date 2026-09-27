import type { Part, Vignette } from "./task-view";

type RGB = [number, number, number];
type Pt = { x: number; y: number };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise(seed: number) {
  const h = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  return (x: number, y: number) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
function fbm(n: (x: number, y: number) => number, x: number, y: number, octaves: number) {
  let sum = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++, amp *= 0.5, f *= 2.03) sum += amp * n(x * f + i * 17.3, y * f - i * 9.1);
  return sum / (1 - 0.5 ** octaves);
}
const hex = (c: string): RGB => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as RGB;
const css = (c: RGB) => `rgb(${c.map((v) => Math.round(v)).join(",")})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const ease = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const RAD = Math.PI / 180;

type Look = {
  top: string; mid: string; low: string; glow: string;
  stars: number; clouds: number; cloud: string;
  sun?: { x: number; y: number; r: number; color: string };
  moon?: boolean;
  /** Where the light comes from: -1 left, 1 right, 0 overhead. */
  dir: -1 | 0 | 1;
  light: string;
  ridges: [body: string, rim: string][];
  figure: string;
  windows: boolean;
};
/** The same country at four times of day. */
const LOOKS: Record<Part, Look> = {
  morning: {
    top: "#1e2f6a", mid: "#6474b4", low: "#f0a884", glow: "#ffd9a6", stars: 0.25, clouds: 0.5, cloud: "#f6c3b0",
    sun: { x: 0.2, y: 0.73, r: 7, color: "#fff0c2" }, dir: -1, light: "#ffcf96",
    ridges: [["#55548c", "#a08fbc"], ["#35356a", "#72679e"], ["#1a1934", "#4a3f6c"]], figure: "#0b0a1a", windows: false,
  },
  midday: {
    top: "#3474c8", mid: "#79ade6", low: "#cfe5f4", glow: "#fff4d8", stars: 0, clouds: 0.8, cloud: "#ffffff",
    sun: { x: 0.72, y: 0.16, r: 8, color: "#fffbe8" }, dir: 0, light: "#fff1c8",
    ridges: [["#88a3c6", "#b7cce4"], ["#55709a", "#86a0c6"], ["#243250", "#4d6088"]], figure: "#121a2c", windows: false,
  },
  evening: {
    top: "#1b1848", mid: "#693d7c", low: "#ef8656", glow: "#ffbe66", stars: 0.45, clouds: 0.6, cloud: "#f39a78",
    sun: { x: 0.82, y: 0.79, r: 9, color: "#ffcf7a" }, dir: 1, light: "#ff9c5a",
    ridges: [["#4a2f5e", "#a4567c"], ["#2c1d44", "#70406a"], ["#120c22", "#44264c"]], figure: "#07040e", windows: true,
  },
  night: {
    top: "#030210", mid: "#0a0824", low: "#17123a", glow: "#16475a", stars: 1, clouds: 0.35, cloud: "#3c3a78",
    moon: true, dir: 1, light: "#9fb4ff",
    ridges: [["#1a1638", "#3d4a86"], ["#100d26", "#2c3564"], ["#06050f", "#1f2446"]], figure: "#03020a", windows: true,
  },
};

/** A figure, as joint angles in degrees. Limbs are [upper, lower]: 0 hangs
 * straight down, positive swings towards the way they face. */
type Pose = {
  lean: number;
  head: number;
  armF: [number, number];
  armB: [number, number];
  legF: [number, number];
  legB: [number, number];
  /** Seated on the ground: the hip rather than the feet bears the weight. */
  sit?: boolean;
};
const STAND: Pose = { lean: 0, head: 0, armF: [8, 8], armB: [-6, 8], legF: [4, 0], legB: [-4, 0] };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const blend = (a: Pose, b: Pose, t: number): Pose => ({
  lean: lerp(a.lean, b.lean, t),
  head: lerp(a.head, b.head, t),
  armF: [lerp(a.armF[0], b.armF[0], t), lerp(a.armF[1], b.armF[1], t)],
  armB: [lerp(a.armB[0], b.armB[0], t), lerp(a.armB[1], b.armB[1], t)],
  legF: [lerp(a.legF[0], b.legF[0], t), lerp(a.legF[1], b.legF[1], t)],
  legB: [lerp(a.legB[0], b.legB[0], t), lerp(a.legB[1], b.legB[1], t)],
  sit: t < 0.5 ? a.sit : b.sit,
});
/** A loop of held poses, eased between. */
function cycle(frames: [Pose, number][], t: number): { pose: Pose; frame: number; into: number } {
  const total = frames.reduce((n, [, d]) => n + d, 0);
  let m = t % total;
  for (let i = 0; i < frames.length; i++) {
    const [pose, d] = frames[i];
    if (m < d) {
      const next = frames[(i + 1) % frames.length][0];
      const k = m / d;
      return { pose: blend(pose, next, easeInOut(k)), frame: i, into: k };
    }
    m -= d;
  }
  return { pose: frames[0][0], frame: 0, into: 0 };
}
function walking(p: number, lean = 6, stride = 26): Pose {
  const s = Math.sin(p), c = Math.cos(p);
  return {
    lean,
    head: 0,
    legF: [stride * s, -22 * clamp((1 - c) / 2)],
    legB: [-stride * s, -22 * clamp((1 + c) / 2)],
    armF: [-18 * s, 18],
    armB: [18 * s, 18],
  };
}

type Joints = { hip: Pt; shoulder: Pt; head: Pt; handF: Pt; handB: Pt; elbowF: Pt; footF: Pt; footB: Pt; kneeF: Pt; kneeB: Pt; elbowB: Pt };
type Prop = (g: Painter, t: number) => void;

/** Draws into the stage: one unit is one art pixel, scaled up on screen. */
class Painter {
  mask: Uint8Array;
  constructor(public w: number, public h: number) {
    this.mask = new Uint8Array(w * h);
  }
  clear() {
    this.mask.fill(0);
  }
  set(x: number, y: number, v = 1) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.mask[y * this.w + x] = v;
  }
  rect(x: number, y: number, w: number, h: number, v = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, v);
  }
  line(a: Pt, b: Pt, width = 1, v = 1) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
    const r = (width - 1) / 2;
    for (let i = 0; i <= n; i++) {
      const x = a.x + ((b.x - a.x) * i) / n, y = a.y + ((b.y - a.y) * i) / n;
      for (let dy = -r; dy <= r + 0.01; dy++) for (let dx = -r; dx <= r + 0.01; dx++) this.set(x + dx, y + dy, v);
    }
  }
  disc(c: Pt, r: number, v = 1) {
    for (let dy = -Math.ceil(r); dy <= r; dy++)
      for (let dx = -Math.ceil(r); dx <= r; dx++) if (dx * dx + dy * dy <= r * r + 0.3) this.set(c.x + dx, c.y + dy, v);
  }
  ellipse(c: Pt, rx: number, ry: number, v = 1) {
    for (let dy = -Math.ceil(ry); dy <= ry; dy++)
      for (let dx = -Math.ceil(rx); dx <= rx; dx++) if ((dx / rx) ** 2 + (dy / ry) ** 2 <= 1.05) this.set(c.x + dx, c.y + dy, v);
  }
}

export type SceneSpec = {
  part: Part;
  vignette: Vignette;
  seed: number;
  /** Silhouettes of the settlement's own buildings, alpha masks at any size. */
  skyline: HTMLCanvasElement[];
  /** Someone watching, at this size. */
  companion?: number;
};

/** The task screen's close view: a sky for the hour, the country round the
 * settlement with its own roofs on the skyline, and the task done up close. */
export class TaskScene {
  px = 3;
  W = 1;
  H = 1;
  readonly still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private ctx: CanvasRenderingContext2D;
  private sky = document.createElement("canvas");
  private clouds = document.createElement("canvas");
  private layers: HTMLCanvasElement[] = [];
  private stage = document.createElement("canvas");
  private fadeFrom = document.createElement("canvas");
  private fade = 0;
  private U = 2;
  private SW = 1;
  private SHt = 1;
  private ground = 1;
  private look!: Look;
  private spec: SceneSpec;
  private painter = new Painter(1, 1);
  private lit: Uint8Array = new Uint8Array(1);
  private tilt = 1;
  private tiltGoal = 0;
  private born = performance.now();
  private last = performance.now();
  private raf = 0;
  private particles: { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; g: number }[] = [];
  private stars: { x: number; y: number; b: number; ph: number }[] = [];
  private lastStrike = -1;
  private birds?: { x: number; y: number; v: number };
  private scroll = 0;

  constructor(private canvas: HTMLCanvasElement, spec: SceneSpec) {
    this.ctx = canvas.getContext("2d")!;
    this.spec = spec;
    this.look = LOOKS[spec.part];
    if (this.still) this.tilt = 0;
    this.resize();
    this.raf = requestAnimationFrame(this.tick);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
  }
  /** A new task: the old picture stays on top and fades. */
  setSpec(spec: SceneSpec) {
    this.fadeFrom.width = this.W;
    this.fadeFrom.height = this.H;
    this.fadeFrom.getContext("2d")!.drawImage(this.canvas, 0, 0);
    this.fade = this.still ? 0 : 1;
    this.spec = spec;
    this.look = LOOKS[spec.part];
    this.particles = [];
    this.scroll = 0;
    this.paint();
  }
  /** 1 looks up at the sky, 0 down at the task. */
  setTilt(t: number, instant = false) {
    this.tiltGoal = t;
    if (instant || this.still) this.tilt = t;
  }

  resize() {
    const box = this.canvas.parentElement!.getBoundingClientRect();
    this.px = box.width < 700 ? 2 : 3;
    this.W = Math.max(1, Math.ceil(box.width / this.px));
    this.H = Math.max(1, Math.ceil(box.height / this.px));
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.canvas.style.width = `${this.W * this.px}px`;
    this.canvas.style.height = `${this.H * this.px}px`;
    this.ctx.imageSmoothingEnabled = false;
    // The figure's pixels are chunkier than the sky's, as in a sprite.
    this.U = Math.max(1, Math.round(this.H / 190));
    this.SW = Math.ceil(this.W / this.U);
    this.SHt = Math.ceil(this.H / this.U);
    this.stage.width = this.SW;
    this.stage.height = this.SHt;
    this.painter = new Painter(this.SW, this.SHt);
    this.lit = new Uint8Array(this.SW * this.SHt);
    this.ground = Math.round(this.SHt * 0.87);
    this.paint();
  }

  private paint() {
    this.paintSky();
    this.paintClouds();
    this.paintLand();
    const r = rng(this.spec.seed + 3);
    this.stars = Array.from({ length: Math.round((this.W * this.H) / 900) }, () => ({ x: r(), y: r() * 0.7, b: 0.3 + r() ** 3 * 0.7, ph: r() * 6.3 }));
  }

  /** Gradient, dithered to a few levels, with the sun or moon and its glow.
   * Taller than the screen: the camera starts up here and comes down. */
  private paintSky() {
    const L = this.look, W = this.W, H = Math.round(this.H * 1.6);
    this.sky.width = W;
    this.sky.height = H;
    const g = this.sky.getContext("2d")!;
    const img = g.createImageData(W, H);
    const top = hex(L.top), mid = hex(L.mid), low = hex(L.low), glow = hex(L.glow);
    const r = rng(this.spec.seed);
    const band = noise(this.spec.seed + 9);
    const horizon = this.H * 0.6 + this.H * 0.72;
    const sun = L.sun && { x: L.sun.x * W, y: this.H * 0.6 + L.sun.y * this.H };
    for (let y = 0; y < H; y++) {
      const v = y / horizon;
      let c = v < 0.55 ? mix(top, mid, clamp(v / 0.55)) : mix(mid, low, clamp((v - 0.55) / 0.45));
      c = mix(c, glow, Math.exp(-(((v - 1) / 0.12) ** 2)) * 0.8);
      for (let x = 0; x < W; x++) {
        let k = c;
        if (sun) {
          const d = Math.hypot(x - sun.x, (y - sun.y) * 1.3) / this.H;
          k = mix(k, glow, Math.exp(-((d / 0.22) ** 2)) * 0.55);
        }
        if (L.moon) {
          // The Milky Way as a faint diagonal wash.
          const d = Math.abs((x / W) * 0.55 + y / H - 0.75);
          k = mix(k, [70, 60, 150], Math.exp(-((d / 0.12) ** 2)) * fbm(band, x / 60, y / 60, 3) * 0.6);
        }
        if (L.stars && r() < 0.003 * L.stars * clamp(1.2 - v)) k = mix(k, [255, 244, 220], 0.4 + r() * 0.6);
        const t = BAYER[(x & 3) + (y & 3) * 4] / 16;
        const o = (y * W + x) * 4;
        for (let i = 0; i < 3; i++) img.data[o + i] = (Math.min(31, Math.floor((clamp(k[i], 0, 255) / 255) * 31 + t)) / 31) * 255;
        img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    if (sun && L.sun) {
      g.fillStyle = L.sun.color;
      const R = L.sun.r;
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= R * R) g.fillRect(Math.round(sun.x + dx), Math.round(sun.y + dy), 1, 1);
    }
    if (L.moon) {
      const mx = Math.round(W * 0.84), my = Math.round(this.H * 0.6 + this.H * 0.13), R = Math.max(5, Math.round(this.H * 0.028));
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > R * R) continue;
          const lit = Math.hypot(dx + R * 0.55, dy - R * 0.25) >= R;
          g.fillStyle = lit ? "#fbf1d6" : "#221e44";
          g.fillRect(mx + dx, my + dy, 1, 1);
        }
    }
  }
  /** A strip of cloud that drifts: dithered, so it keeps the pixel grain. */
  private paintClouds() {
    const L = this.look, W = this.W * 2, H = Math.round(this.H * 0.5);
    this.clouds.width = W;
    this.clouds.height = H;
    const g = this.clouds.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    if (!L.clouds) return;
    const n = noise(this.spec.seed + 21);
    g.fillStyle = L.cloud;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        // Wrap the noise so the strip tiles.
        const u = x / W;
        const d =
          fbm(n, Math.cos(u * Math.PI * 2) * 3 + 20, (y / H) * 3 + Math.sin(u * Math.PI * 2) * 3, 4) * (1 - (Math.abs(y / H - 0.45) * 2) ** 2);
        if (d * L.clouds * 16 - 7 > BAYER[(x & 3) + (y & 3) * 4]) g.fillRect(x, y, 1, 1);
      }
  }
  /** Far ridge, the skyline, the near ridge with trees, the ground. Twice the
   * screen wide and tiling, so a walk can scroll them. */
  private paintLand() {
    const L = this.look, W = this.W * 2, H = this.H;
    const r = rng(this.spec.seed + 5);
    this.layers = [0, 1, 2, 3].map(() => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      return c;
    });
    const ridge = (base: number, amp: number, seed: number) => {
      const q = rng(seed), p = [q() * 6, q() * 6, q() * 6];
      return (x: number) => {
        const u = (x / W) * Math.PI * 2;
        return Math.round(H * (base - amp * (Math.sin(u * 2 + p[0]) * 0.6 + Math.sin(u * 5 + p[1]) * 0.3 + Math.sin(u * 11 + p[2]) * 0.1)));
      };
    };
    const far = ridge(0.7, 0.05, this.spec.seed + 1);
    const near = ridge(0.79, 0.035, this.spec.seed + 2);
    const fill = (c: HTMLCanvasElement, f: (x: number) => number, [body, rim]: [string, string]) => {
      const g = c.getContext("2d")!;
      g.fillStyle = body;
      for (let x = 0; x < W; x++) g.fillRect(x, f(x), 1, H - f(x));
      g.fillStyle = rim;
      for (let x = 0; x < W; x++) g.fillRect(x, f(x), 1, 1);
      return g;
    };
    fill(this.layers[0], far, L.ridges[0]);
    // The skyline stands on the near ridge's crest, its feet hidden behind it.
    const sk = this.layers[1].getContext("2d")!;
    const body = css(mix(hex(L.ridges[0][0]), hex(L.ridges[1][0]), 0.55));
    const rim = L.ridges[1][1];
    const shapes = this.spec.skyline;
    if (shapes.length) {
      let x = Math.round(r() * 20);
      let i = 0;
      while (x < W - 10) {
        const s = shapes[i++ % shapes.length];
        const h = Math.round(H * (0.07 + r() * 0.06));
        const w = Math.max(4, Math.round((s.width / s.height) * h));
        if (x + w > W - 4) break;
        const foot = Math.min(near(x), near(x + w)) + Math.round(h * 0.18);
        this.silhouette(sk, s, x, foot - h, w, h, body, rim, L.windows, r);
        x += w + Math.round(2 + r() * (i % 3 === 0 ? 30 : 8));
      }
    }
    const g = fill(this.layers[2], near, L.ridges[1]);
    // Trees along the near ridge, clear of the middle where the task is.
    for (let i = 0; i < W / 11; i++) {
      const x = Math.round(r() * W);
      if (Math.abs((x % this.W) - this.W / 2) < this.W * 0.12) continue;
      const h = 4 + Math.round(r() * 8), foot = near(x) + 1;
      g.fillStyle = L.ridges[1][0];
      for (let k = 0; k < h; k++) {
        const half = Math.floor((h - k) * 0.42 * (k % 3 === 0 ? 0.8 : 1));
        g.fillRect(x - half, foot - k, half * 2 + 1, 1);
      }
      g.fillStyle = L.ridges[1][1];
      g.fillRect(x, foot - h, 1, 1);
    }
    // The ground the task stands on: flat through the middle.
    const gy = this.ground * this.U;
    const gg = this.layers[3].getContext("2d")!;
    const [gb, gr] = L.ridges[2];
    for (let x = 0; x < W; x++) {
      const y = gy + Math.round(Math.sin(x * 0.07 + 1) * 1.2);
      gg.fillStyle = gb;
      gg.fillRect(x, y, 1, H - y);
      gg.fillStyle = gr;
      gg.fillRect(x, y, 1, 1);
      if (r() < 0.12) gg.fillRect(x, y - 1 - Math.round(r() * 2), 1, 1);
    }
  }
  /** A building as a solid shape against the sky, lit along its top edge,
   * with a window or two burning after sunset. */
  private silhouette(g: CanvasRenderingContext2D, src: HTMLCanvasElement, x: number, y: number, w: number, h: number, body: string, rim: string, windows: boolean, r: () => number) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cg = c.getContext("2d")!;
    cg.imageSmoothingEnabled = false;
    cg.drawImage(src, 0, 0, w, h);
    const data = cg.getImageData(0, 0, w, h).data;
    const on = (i: number, j: number) => i >= 0 && j >= 0 && i < w && j < h && data[(j * w + i) * 4 + 3] > 140;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (!on(i, j)) continue;
        g.fillStyle = on(i, j - 1) ? body : rim;
        g.fillRect(x + i, y + j, 1, 1);
      }
    if (!windows) return;
    for (let k = 0; k < 2; k++) {
      const i = Math.round(w * (0.25 + r() * 0.5)), j = Math.round(h * (0.45 + r() * 0.3));
      if (r() < 0.6 && on(i, j) && on(i + 1, j) && on(i, j - 2) && on(i, j + 2)) {
        g.fillStyle = "#ffc86a";
        g.fillRect(x + i, y + j, 1, 1);
      }
    }
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const t = (now - this.born) / 1000;
    this.tilt += (this.tiltGoal - this.tilt) * (1 - Math.exp(-dt * 2.2));
    this.draw(dt, t);
  };

  private draw(dt: number, t: number) {
    const { ctx, W, H } = this;
    const k = ease(this.tilt);
    ctx.globalAlpha = 1;
    // Looking up, the sky's top is in view and the land has sunk away.
    ctx.drawImage(this.sky, 0, Math.round(-this.H * 0.6 * (1 - k)));
    const skyShift = Math.round(-this.H * 0.6 * (1 - k)) + Math.round(this.H * 0.6);
    const L = this.look;
    if (L.stars)
      for (const s of this.stars) {
        const a = s.b * L.stars * (0.55 + 0.45 * Math.sin(t * 1.7 + s.ph * 5));
        ctx.globalAlpha = a;
        ctx.fillStyle = "#fff4dc";
        ctx.fillRect(Math.round(s.x * W), Math.round(s.y * H + skyShift - this.H * 0.6 + k * this.H * 0.2), 1, 1);
      }
    ctx.globalAlpha = 0.85;
    const drift = this.still ? 0 : (t * 1.5) % this.clouds.width;
    const cy = Math.round(this.H * 0.06) + skyShift - Math.round(this.H * 0.6);
    ctx.drawImage(this.clouds, -drift, cy);
    ctx.drawImage(this.clouds, this.clouds.width - drift, cy);
    ctx.globalAlpha = 1;
    this.drawBirds(dt, t);
    const walker = ["haul", "herd", "play", "walk"].includes(this.spec.vignette);
    if (walker && !this.still) this.scroll += dt * (this.spec.vignette === "play" ? 20 : this.spec.vignette === "haul" ? 9 : 12);
    const speeds = [0.08, 0.2, 0.35, 1];
    this.layers.forEach((layer, i) => {
      const sink = Math.round(k * H * (0.55 + i * 0.08));
      const off = Math.round((this.scroll * speeds[i] * this.U) % layer.width);
      ctx.drawImage(layer, -off, sink);
      ctx.drawImage(layer, layer.width - off, sink);
    });
    this.drawStage(dt, t, Math.round(k * H * 0.79));
    if (this.fade > 0) {
      this.fade = Math.max(0, this.fade - dt * 1.6);
      ctx.globalAlpha = this.fade;
      ctx.drawImage(this.fadeFrom, 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  private drawBirds(dt: number, t: number) {
    if (this.still || this.look.stars > 0.5) return;
    if (!this.birds && Math.random() < dt * 0.08) this.birds = { x: -10, y: this.H * (0.2 + Math.random() * 0.25), v: 14 + Math.random() * 10 };
    const b = this.birds;
    if (!b) return;
    b.x += b.v * dt;
    this.ctx.fillStyle = this.look.ridges[2][0];
    for (let i = 0; i < 3; i++) {
      const x = Math.round(b.x - i * 7), y = Math.round(b.y + i * 3 + Math.sin(t * 3 + i) * 1.5);
      const up = Math.sin(t * 9 + i * 2) > 0 ? 1 : 0;
      this.ctx.fillRect(x - 2, y - up, 2, 1);
      this.ctx.fillRect(x, y, 1, 1);
      this.ctx.fillRect(x + 1, y - up, 2, 1);
    }
    if (b.x > this.W + 30) this.birds = undefined;
  }

  // ---- The stage: figures and what they work with --------------------------

  private drawStage(dt: number, t: number, sink: number) {
    const P = this.painter;
    P.clear();
    this.lit.fill(0);
    const cx = Math.round(this.SW / 2);
    const lights: { x: number; y: number; r: number; color: string; a: number }[] = [];
    const fire = (x: number) => {
      const y = this.ground;
      lights.push({ x, y: y - 3, r: 26, color: "#ff8a3c", a: 0.12 + 0.03 * Math.sin(t * 9) }, { x, y: y - 3, r: 10, color: "#ffb25c", a: 0.16 + 0.05 * Math.sin(t * 13) });
      return { x, y };
    };
    const fires: Pt[] = [];
    const figures: { pose: Pose; x: number; face: 1 | -1; scale?: number; tool?: (j: Joints) => void }[] = [];
    const props: Prop[] = [];
    const G = this.ground;
    const v = this.spec.vignette;
    const walkT = t * 7;
    switch (v) {
      case "craft": {
        const { pose, frame, into } = cycle([
          [{ ...STAND, lean: 8, armF: [150, 35], armB: [45, 70], legF: [10, 0], legB: [-8, 0] }, 0.5],
          [{ ...STAND, lean: 24, armF: [62, 8], armB: [48, 70], legF: [12, 0], legB: [-8, 0] }, 0.14],
          [{ ...STAND, lean: 22, armF: [66, 10], armB: [48, 70], legF: [12, 0], legB: [-8, 0] }, 0.3],
        ], t);
        if (frame === 1 && into > 0.8 && this.lastStrike !== Math.floor(t / 0.94)) {
          this.lastStrike = Math.floor(t / 0.94);
          this.burst(cx + 11, G - 7, 8, "#ffd06a");
        }
        figures.push({ pose, x: cx - 4, face: 1, tool: (j) => hammer(P, j) });
        props.push((g) => {
          g.rect(cx + 7, G - 6, 9, 2);
          g.rect(cx + 9, G - 4, 5, 4);
        });
        break;
      }
      case "tend": {
        const { pose, frame, into } = cycle([
          [{ ...STAND, lean: 20, armF: [120, 20], armB: [100, 30], legF: [14, -6], legB: [-10, 0] }, 0.5],
          [{ ...STAND, lean: 40, armF: [55, 5], armB: [40, 15], legF: [16, -10], legB: [-10, 0] }, 0.2],
          [{ ...STAND, lean: 38, armF: [58, 5], armB: [42, 15], legF: [16, -10], legB: [-10, 0] }, 0.35],
        ], t);
        if (frame === 1 && into > 0.85 && this.lastStrike !== Math.floor(t / 1.05)) {
          this.lastStrike = Math.floor(t / 1.05);
          this.burst(cx + 12, G - 1, 6, this.look.ridges[2][1]);
        }
        figures.push({ pose, x: cx - 6, face: 1, tool: (j) => hoe(P, j, G) });
        props.push((g) => {
          for (let i = 0; i < 5; i++) plant(g, cx + 16 + i * 7, G, 3 + (i % 2));
          for (let i = 0; i < 3; i++) plant(g, cx - 18 - i * 7, G, 3);
        });
        break;
      }
      case "haul":
        figures.push({ pose: walking(walkT * 0.8, 18, 20), x: cx, face: 1, tool: (j) => sack(P, j) });
        break;
      case "walk":
        figures.push({ pose: { ...walking(walkT, 6), armF: [30 + 4 * Math.sin(walkT), 30] }, x: cx, face: 1, tool: (j) => staff(P, j, G) });
        break;
      case "water": {
        const { pose } = cycle([
          [{ ...STAND, lean: -6, armF: [160, 10], armB: [95, 40], legF: [12, 0], legB: [-10, 0] }, 0.45],
          [{ ...STAND, lean: -10, armF: [95, 40], armB: [160, 10], legF: [12, 0], legB: [-10, 0] }, 0.45],
        ], t);
        const pull = ((t / 0.9) % 6) / 6;
        figures.push({ pose, x: cx - 9, face: 1, tool: (j) => P.line(j.handF, { x: cx + 14, y: G - 20 }) });
        props.push((g) => {
          const wx = cx + 8;
          g.rect(wx - 1, G - 5, 14, 5);
          g.rect(wx - 2, G - 6, 16, 1);
          g.rect(wx, G - 19, 1, 14);
          g.rect(wx + 11, G - 19, 1, 14);
          g.rect(wx - 1, G - 20, 14, 1);
          const by = G - 6 - Math.round(pull * 10);
          g.line({ x: wx + 6, y: G - 20 }, { x: wx + 6, y: by - 2 });
          if (pull > 0.1) g.rect(wx + 4, by - 2, 5, 3);
        });
        break;
      }
      case "gather": {
        const { pose, frame, into } = cycle([
          [{ ...STAND, lean: 62, armF: [95, 5], armB: [70, 10], legF: [28, -40], legB: [-6, -20] }, 0.7],
          [{ ...STAND, lean: 30, armF: [25, 70], armB: [15, 40], legF: [18, -20], legB: [-6, -10] }, 0.5],
        ], t);
        if (frame === 1 && into < 0.05) this.burst(cx - 9, G - 4, 3, "#c83a4a");
        figures.push({ pose, x: cx - 2, face: 1 });
        props.push((g) => {
          bush(g, cx + 13, G, 7);
          bush(g, cx + 24, G, 5);
          g.rect(cx - 12, G - 4, 6, 4);
          g.rect(cx - 13, G - 5, 8, 1);
        });
        break;
      }
      case "talk": {
        const a = { ...STAND, armF: [60 + 25 * Math.sin(t * 2.4), 50 + 20 * Math.sin(t * 3.1)] as [number, number], head: 4 * Math.sin(t * 2.4) };
        const b = { ...STAND, lean: 4 * Math.sin(t * 1.3), head: -8 + 6 * Math.max(0, Math.sin(t * 1.9)), armF: [20, 60] as [number, number], armB: [10, 70] as [number, number] };
        figures.push({ pose: a, x: cx - 8, face: 1 }, { pose: b, x: cx + 8, face: -1 });
        props.push((g) => house(g, cx + 14, G, 26, 18, true));
        break;
      }
      case "offer": {
        const bow = 0.5 + 0.5 * Math.sin(t * 0.9);
        const kneel: Pose = { lean: 10 + 45 * bow, head: 10 * bow, armF: [80 - 20 * bow, 10], armB: [70 - 20 * bow, 10], legF: [70, -150], legB: [70, -150], sit: true };
        figures.push({ pose: kneel, x: cx - 4, face: 1 });
        props.push((g) => {
          g.rect(cx + 9, G - 3, 11, 3);
          g.rect(cx + 10, G - 6, 9, 3);
          g.rect(cx + 12, G - 9, 5, 3);
          g.rect(cx + 13, G - 12, 3, 3);
        });
        lights.push({ x: cx + 14, y: G - 13, r: 8, color: "#ffc86a", a: 0.25 + 0.08 * Math.sin(t * 11) });
        if (!this.still && Math.random() < dt * 3) this.puff(cx + 14, G - 14, "#d8d0e8");
        this.flame(cx + 14, G - 13, 1, t);
        break;
      }
      case "market": {
        const buyer = { ...STAND, armF: [75 + 15 * Math.sin(t * 2), 20] as [number, number], head: 3 * Math.sin(t * 1.3) };
        const seller = { ...STAND, armF: [50 + 30 * Math.max(0, Math.sin(t * 2 + 1.5)), 40] as [number, number], armB: [30, 60] as [number, number] };
        figures.push({ pose: seller, x: cx + 14, face: -1 }, { pose: buyer, x: cx - 8, face: 1 });
        props.push((g) => {
          g.rect(cx, G - 8, 22, 2);
          g.rect(cx + 1, G - 6, 1, 6);
          g.rect(cx + 20, G - 6, 1, 6);
          g.rect(cx, G - 24, 1, 16);
          g.rect(cx + 21, G - 24, 1, 16);
          for (let i = 0; i < 24; i++) g.set(cx - 1 + i, G - 24 - Math.floor(i / 6));
          for (let i = 0; i < 24; i++) g.set(cx - 1 + i, G - 23 - Math.floor(i / 6));
          for (let i = 0; i < 4; i++) g.disc({ x: cx + 4 + i * 4, y: G - 10 }, 1.4);
        });
        break;
      }
      case "gathering": {
        const f = (ph: number, arm: number): Pose => ({ ...STAND, head: 5 * Math.sin(t * 1.7 + ph), lean: 3 * Math.sin(t * 1.1 + ph), armF: [arm + 20 * Math.max(0, Math.sin(t * 2.2 + ph)), 45] });
        figures.push({ pose: f(0, 40), x: cx - 14, face: 1 }, { pose: { ...f(2, 10), lean: -6 + 6 * Math.max(0, Math.sin(t * 3)) }, x: cx, face: -1 }, { pose: f(4, 25), x: cx + 12, face: -1 });
        if (this.look.windows) fires.push(fire(cx - 3));
        break;
      }
      case "herd": {
        figures.push({ pose: { ...walking(walkT * 0.7, 4, 18), armF: [40, 20] }, x: cx - 16, face: 1, tool: (j) => staff(P, j, G, 16) });
        props.push((g) => {
          for (let i = 0; i < 3; i++) sheep(g, cx + 2 + i * 13, G, walkT * 0.7 + i * 1.7, i === 1 && Math.sin(t * 0.7) > 0.6);
        });
        break;
      }
      case "play": {
        figures.push({ pose: walking(walkT * 1.6, 16, 38), x: cx + 6, face: 1, scale: 0.66 }, { pose: walking(walkT * 1.6 + 1.3, 18, 38), x: cx - 10 + 3 * Math.sin(t), face: 1, scale: 0.62 });
        props.push((g) => g.disc({ x: cx + 16 + Math.round(3 * Math.sin(t * 4)), y: G - 2 - Math.abs(Math.round(6 * Math.sin(t * 4))) }, 1.5));
        break;
      }
      case "cook": {
        const stir: Pose = { lean: 30, head: 10, armF: [70 + 14 * Math.sin(t * 3), 25 + 14 * Math.cos(t * 3)], armB: [40, 60], legF: [80, -155], legB: [60, -150] };
        figures.push({ pose: stir, x: cx - 6, face: 1 });
        fires.push(fire(cx + 8));
        props.push((g) => {
          g.line({ x: cx + 3, y: G }, { x: cx + 9, y: G - 14 });
          g.line({ x: cx + 15, y: G }, { x: cx + 9, y: G - 14 });
          g.line({ x: cx + 9, y: G - 14 }, { x: cx + 9, y: G - 10 });
          g.ellipse({ x: cx + 9, y: G - 7 }, 3.5, 2.5);
        });
        if (!this.still && Math.random() < dt * 4) this.puff(cx + 9, G - 10, "#e8e4f4");
        break;
      }
      case "warm": {
        const sit = (ph: number): Pose => ({ lean: 12 + 3 * Math.sin(t * 0.8 + ph), head: 4, armF: [80, 10 + 8 * Math.sin(t * 0.6 + ph)], armB: [60, 30], legF: [75, -115], legB: [70, -110], sit: true });
        figures.push({ pose: sit(0), x: cx - 7, face: 1 }, { pose: sit(2), x: cx + 22, face: -1 });
        fires.push(fire(cx + 8));
        break;
      }
      case "hang": {
        const { pose } = cycle([
          [{ ...STAND, lean: -4, armF: [165, 5], armB: [150, 15], legF: [6, 0], legB: [-6, 0] }, 0.9],
          [{ ...STAND, lean: 40, armF: [40, 20], armB: [30, 20], legF: [18, -18], legB: [-6, 0] }, 0.7],
        ], t);
        figures.push({ pose, x: cx - 4, face: 1 });
        props.push((g) => {
          g.rect(cx - 2, G - 22, 1, 22);
          g.rect(cx + 24, G - 22, 1, 22);
          g.rect(cx - 3, G - 23, 29, 1);
          for (let i = 0; i < 5; i++) fish(g, cx + 3 + i * 5, G - 22, Math.sin(t * 1.5 + i) * 0.6);
          g.rect(cx - 12, G - 4, 6, 4);
        });
        break;
      }
      case "rest": {
        const nod = Math.max(0, Math.sin(t * 0.5)) ** 3;
        figures.push({ pose: { lean: -4 + 10 * nod, head: 25 * nod, armF: [25, 50], armB: [15, 60], legF: [85, -85], legB: [80, -80], sit: true }, x: cx - 2, face: 1 });
        props.push((g) => {
          house(g, cx - 30, G, 22, 20, this.look.windows);
          g.rect(cx - 6, G - 5, 10, 1);
          g.rect(cx - 5, G - 4, 1, 4);
          g.rect(cx + 2, G - 4, 1, 4);
        });
        break;
      }
    }
    const c = this.spec.companion;
    if (c) {
      const moving = ["haul", "herd", "walk"].includes(v);
      figures.unshift({
        pose: moving ? walking(walkT + 1.4, 6, c < 1 ? 32 : 24) : { ...STAND, head: 6 + 4 * Math.sin(t * 0.9), lean: 3 * Math.sin(t * 0.7), armF: [c < 1 ? 5 : 30, c < 1 ? 5 : 60] },
        x: cx - (moving ? 12 : 20),
        face: 1,
        scale: c,
      });
    }
    // Whatever is behind the figures first, then them, then what is in front.
    const [behind, ...front] = props;
    behind?.(P, t);
    for (const f of figures) {
      const j = joints(f.pose, f.x, G, f.face, f.scale ?? 1);
      body(P, f.pose, j, f.scale ?? 1);
      f.tool?.(j);
    }
    for (const p of front) p(P, t);
    for (const f of fires) this.flame(f.x, f.y, 2, t);
    this.present(sink, lights, fires, t, dt);
  }

  /** Flames drawn straight into the lit layer. */
  private flame(x: number, y: number, size: number, t: number) {
    const cols = size === 1 ? 1 : 3;
    for (let c = 0; c < cols; c++) {
      const h = size * (2 + Math.round(1.5 + 1.5 * Math.sin(t * (13 + c * 3) + c * 2)));
      for (let i = 0; i < h; i++) this.setLit(x - Math.floor(cols / 2) + c, y - 1 - i, i >= h - 1 ? 3 : i >= h - 2 ? 2 : 1);
    }
    if (size > 1 && !this.still && Math.random() < 0.25)
      this.particles.push({ x, y: y - 4, vx: (Math.random() - 0.5) * 4, vy: -8 - Math.random() * 8, life: 1.4, max: 1.4, color: "#ffb85c", g: 0 });
  }
  private setLit(x: number, y: number, v: number) {
    if (x < 0 || y < 0 || x >= this.SW || y >= this.SHt) return;
    this.lit[y * this.SW + x] = v;
  }
  private burst(x: number, y: number, n: number, color: string) {
    if (this.still) return;
    for (let i = 0; i < n; i++)
      this.particles.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 25, life: 0.4 + Math.random() * 0.4, max: 0.8, color, g: 60 });
  }
  private puff(x: number, y: number, color: string) {
    this.particles.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: -4 - Math.random() * 3, life: 2.2, max: 2.2, color, g: 0 });
  }

  /** The stage mask to pixels: the figure colour, a rim where the light
   * falls, flames and glows, then scaled up by the art pixel. */
  private present(sink: number, lights: { x: number; y: number; r: number; color: string; a: number }[], fires: Pt[], t: number, dt: number) {
    const { SW, SHt, U } = this;
    const g = this.stage.getContext("2d")!;
    const img = g.createImageData(SW, SHt);
    const L = this.look;
    const fig = hex(L.figure), rimC = hex(L.light), fireRim = hex("#ffa24c");
    const m = this.painter.mask;
    const on = (x: number, y: number) => x >= 0 && y >= 0 && x < SW && y < SHt && m[y * SW + x] > 0;
    const flames = [hex("#ff7a30"), hex("#ffc94d"), hex("#fff0b0")];
    for (let y = 0; y < SHt; y++)
      for (let x = 0; x < SW; x++) {
        const o = y * SW + x, p = o * 4;
        const f = this.lit[o];
        if (f) {
          const c = flames[f - 1];
          img.data.set([c[0], c[1], c[2], 255], p);
          continue;
        }
        if (!m[o]) continue;
        let c = fig;
        // The side that faces the light catches it.
        const near = fires.find((q) => Math.abs(q.x - x) < 26 && Math.abs(q.y - y) < 24);
        if (near) {
          if (!on(x + Math.sign(near.x - x) || 1, y)) c = mix(fig, fireRim, 0.85);
        } else if (L.dir === 0 ? !on(x, y - 1) : !on(x + L.dir, y) || !on(x, y - 1)) c = mix(fig, rimC, L.dir === 0 ? 0.55 : 0.75);
        img.data.set([c[0], c[1], c[2], 255], p);
      }
    g.putImageData(img, 0, 0);
    const { ctx } = this;
    for (const l of lights) {
      const grad = ctx.createRadialGradient((l.x + 0.5) * U, l.y * U + sink, 0, (l.x + 0.5) * U, l.y * U + sink, l.r * U);
      grad.addColorStop(0, l.color);
      grad.addColorStop(1, "transparent");
      ctx.globalAlpha = l.a;
      ctx.fillStyle = grad;
      ctx.fillRect((l.x - l.r) * U, (l.y - l.r) * U + sink, l.r * 2 * U, l.r * 2 * U);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(this.stage, 0, sink, SW * U, SHt * U);
    this.particles = this.particles.filter((q) => {
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += (q.vx + Math.sin(t * 3 + q.y) * 2) * dt;
      q.y += q.vy * dt;
      ctx.globalAlpha = clamp(q.life / q.max) * 0.9;
      ctx.fillStyle = q.color;
      ctx.fillRect(Math.round(q.x) * U, Math.round(q.y) * U + sink, U, U);
      return q.life > 0 && q.y < this.ground + 2;
    });
    ctx.globalAlpha = 1;
  }
}

// ---- Rig ------------------------------------------------------------------

const TORSO = 9, UPPER_ARM = 5, FOREARM = 5, THIGH = 6, SHIN = 6, HEAD = 2.6;
function joints(p: Pose, x: number, ground: number, face: 1 | -1, s: number): Joints {
  const dir = (deg: number) => ({ x: face * Math.sin(deg * RAD), y: Math.cos(deg * RAD) });
  const add = (a: Pt, d: Pt, len: number) => ({ x: a.x + d.x * len * s, y: a.y + d.y * len * s });
  const hip0 = { x, y: 0 };
  const kneeF = add(hip0, dir(p.legF[0]), THIGH), footF = add(kneeF, dir(p.legF[0] + p.legF[1]), SHIN);
  const kneeB = add(hip0, dir(p.legB[0]), THIGH), footB = add(kneeB, dir(p.legB[0] + p.legB[1]), SHIN);
  // Stand the lowest point on the ground: the feet, or the hip when seated.
  const low = Math.max(footF.y, footB.y, kneeF.y, kneeB.y, p.sit ? 0 : -99);
  const dy = ground - 1 - low;
  const mv = (q: Pt) => ({ x: q.x, y: q.y + dy });
  const hip = mv(hip0);
  const up = { x: face * Math.sin(p.lean * RAD), y: -Math.cos(p.lean * RAD) };
  const shoulder = add(hip, up, TORSO);
  const headUp = { x: face * Math.sin((p.lean + p.head) * RAD), y: -Math.cos((p.lean + p.head) * RAD) };
  const head = add(shoulder, headUp, HEAD + 1.2);
  const arm = (a: [number, number]) => {
    const sh = add(shoulder, { x: -up.x, y: -up.y }, 1);
    const elbow = add(sh, dir(a[0]), UPPER_ARM);
    return { elbow, hand: add(elbow, dir(a[0] + a[1]), FOREARM) };
  };
  const af = arm(p.armF), ab = arm(p.armB);
  return { hip, shoulder, head, handF: af.hand, elbowF: af.elbow, handB: ab.hand, elbowB: ab.elbow, kneeF: mv(kneeF), kneeB: mv(kneeB), footF: mv(footF), footB: mv(footB) };
}
function body(P: Painter, p: Pose, j: Joints, s: number) {
  const w = Math.max(1, Math.round(2 * s));
  P.line(j.shoulder, j.elbowB, w);
  P.line(j.elbowB, j.handB, w);
  P.line(j.hip, j.kneeB, w);
  P.line(j.kneeB, j.footB, w);
  P.line(j.hip, j.kneeF, w);
  P.line(j.kneeF, j.footF, w);
  // The body as a tunic: narrow at the shoulders, wider to the knee.
  const hemY = (j.kneeF.y + j.kneeB.y) / 2;
  const hemX = (j.kneeF.x + j.kneeB.x) / 2;
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const a = { x: lerp(j.shoulder.x, j.hip.x, k), y: lerp(j.shoulder.y, j.hip.y, k) };
    P.line({ x: a.x - 2.1 * s, y: a.y }, { x: a.x + 2.1 * s, y: a.y }, 1);
    if (!p.sit) {
      const b = { x: lerp(j.hip.x, hemX, k), y: lerp(j.hip.y, hemY, k) };
      const half = (2.2 + 2.2 * k) * s;
      P.line({ x: b.x - half, y: b.y }, { x: b.x + half, y: b.y }, 1);
    }
  }
  P.disc(j.head, HEAD * s);
  P.line(j.shoulder, j.elbowF, w);
  P.line(j.elbowF, j.handF, w);
}

// ---- Tools and props -------------------------------------------------------

function along(a: Pt, b: Pt, len: number): Pt {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: b.x + ((b.x - a.x) / d) * len, y: b.y + ((b.y - a.y) / d) * len };
}
function hammer(P: Painter, j: Joints) {
  const tip = along(j.elbowF, j.handF, 3);
  P.line(j.handF, tip);
  const d = { x: tip.x - j.handF.x, y: tip.y - j.handF.y };
  P.line({ x: tip.x - d.y * 0.6, y: tip.y + d.x * 0.6 }, { x: tip.x + d.y * 0.6, y: tip.y - d.x * 0.6 }, 2);
}
function hoe(P: Painter, j: Joints, ground: number) {
  const tip = along(j.elbowF, j.handF, 9);
  P.line(j.handB, tip);
  P.line(tip, { x: tip.x + 1, y: Math.min(ground - 1, tip.y + 2) });
}
function staff(P: Painter, j: Joints, ground: number, h = 20) {
  P.line({ x: j.handF.x, y: j.handF.y - h * 0.35 }, { x: j.handF.x + 2, y: ground - 1 });
}
function sack(P: Painter, j: Joints) {
  const back = { x: j.shoulder.x - (j.head.x - j.shoulder.x) * 0.2 - 3, y: j.shoulder.y + 2 };
  P.ellipse(back, 3.2, 4.2);
  P.line(j.handF, back);
}
function plant(P: Painter, x: number, ground: number, h: number) {
  P.line({ x, y: ground - 1 }, { x, y: ground - h });
  P.set(x - 1, ground - h + 1);
  P.set(x + 1, ground - h);
  P.set(x - 1, ground - h - 1);
}
function bush(P: Painter, x: number, ground: number, r: number) {
  P.ellipse({ x, y: ground - r * 0.7 }, r, r * 0.75);
}
function house(P: Painter, x: number, ground: number, w: number, h: number, lit: boolean) {
  P.rect(x, ground - h, w, h);
  for (let i = 0; i <= w / 2 + 2; i++) P.rect(x - 2 + i, ground - h - i * 0.55, w + 4 - i * 2, 1);
  P.rect(x + Math.round(w * 0.2), ground - Math.round(h * 0.62), 4, Math.round(h * 0.62), lit ? 0 : 1);
}
function sheep(P: Painter, x: number, ground: number, p: number, grazing: boolean) {
  P.ellipse({ x, y: ground - 5 }, 4.5, 2.6);
  const hy = grazing ? ground - 3 : ground - 7;
  P.rect(x + 4, hy, 2, 2);
  for (const [dx, ph] of [[-3, 0], [-1, Math.PI], [2, Math.PI], [3, 0]] as const) {
    const s = Math.round(Math.sin(p + ph));
    P.line({ x: x + dx, y: ground - 3 }, { x: x + dx + s, y: ground - 1 });
  }
}
function fish(P: Painter, x: number, bar: number, swing: number) {
  const s = Math.round(swing);
  P.line({ x, y: bar + 1 }, { x: x + s, y: bar + 3 });
  P.ellipse({ x: x + s, y: bar + 6 }, 1, 2.6);
  P.set(x + s - 1, bar + 9);
  P.set(x + s + 1, bar + 9);
}
