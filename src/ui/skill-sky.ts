import type { SkillId } from "../core/skills";
import { CONSTELLATIONS, milestoneStars } from "./constellations";

export type MilestoneState = "chosen" | "waiting" | "unbuilt" | "locked";
export type SkyTheme = "dark" | "light";
export type SkyEntry = {
  skill: SkillId;
  group: string;
  lit: number;
  milestones: MilestoneState[];
};
type Look =
  | { kind: "overview" }
  /** Where on screen the constellation sits, as fractions, per orientation. */
  | { kind: "skill"; skill: SkillId; z: number; wide: [number, number]; tall: [number, number] };
type Spark = { sx: number; sy: number; ox: number; oy: number; vx: number; vy: number; life: number; max: number; color: string };
type RGB = [number, number, number];
type Hill = { base: number; amp: number; body: string; rim: string; seed: number; style: "solid" | "hatch" | "stipple" };

type Palette = {
  star: string;
  /** The background stars, which sit behind the constellations. */
  dust: string;
  faint: string;
  gold: string;
  hot: string;
  flash: string;
  thread: string;
  tint: Record<string, string>;
  hills: Hill[];
  figure: string;
  twinkle: boolean;
};
type SkyPaint = { top: string; mid: string; low: string; glow: string; nebula: [RGB, RGB, RGB]; cloud: number; heart: RGB; core: number; stars: number; moon: boolean };
const SKIES: Record<SkyTheme, SkyPaint> = {
  dark: { top: "#030210", mid: "#090720", low: "#151036", glow: "#16475a", nebula: [[36, 150, 172], [112, 62, 196], [214, 72, 150]], cloud: 0.55, heart: [255, 236, 240], core: 1, stars: 1, moon: true },
  // First light: the same sky going pale, the clouds turned to rose and lilac.
  light: { top: "#5f78c2", mid: "#9fb0e4", low: "#dcc6e4", glow: "#ffd9b8", nebula: [[150, 200, 240], [200, 170, 240], [255, 170, 200]], cloud: 0.35, heart: [255, 250, 250], core: 0.3, stars: 0.35, moon: false },
};
const PALETTES: Record<SkyTheme, Palette> = {
  dark: {
    star: "#fff4d8",
    dust: "#fff4d8",
    faint: "#9aa0dc",
    gold: "#ffd06a",
    hot: "#ffffff",
    flash: "#ffd06a",
    thread: "#fff4d8",
    tint: { Land: "#b8ec8c", Combat: "#ff9f7e", Craft: "#ffcb6e", People: "#ffb0d0", Road: "#8ff4e6" },
    hills: [
      { base: 0.8, amp: 0.05, body: "#1a1638", rim: "#3d4a86", seed: 3, style: "solid" },
      { base: 0.855, amp: 0.045, body: "#100d26", rim: "#2c3564", seed: 7, style: "solid" },
      { base: 0.915, amp: 0.03, body: "#06050f", rim: "#1f2446", seed: 11, style: "solid" },
    ],
    figure: "#03020a",
    twinkle: true,
  },
  light: {
    star: "#1c2452",
    dust: "#ffffff",
    faint: "#5a64a0",
    gold: "#d0860f",
    hot: "#ffffff",
    flash: "#ffffff",
    thread: "#1c2452",
    tint: { Land: "#2f6a1c", Combat: "#b0381e", Craft: "#9a5a06", People: "#95265e", Road: "#0d6a62" },
    hills: [
      { base: 0.8, amp: 0.05, body: "#aab0e0", rim: "#c9cdf0", seed: 3, style: "solid" },
      { base: 0.855, amp: 0.045, body: "#8286c4", rim: "#a4a8dc", seed: 7, style: "solid" },
      { base: 0.915, amp: 0.03, body: "#44477f", rim: "#6a6ea8", seed: 11, style: "solid" },
    ],
    figure: "#1e2050",
    twinkle: false,
  },
};

// A figure sitting with their knees up, looking at the sky: # is body.
const FIGURE = ["..##..", ".####.", ".####.", "..##..", ".###..", "#####.", "######", ".#####", "##..##"];
// Constellation data is drawn a little larger than it is written.
const FIGURE_SCALE = 1.2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// Star colours by temperature, blue giants to red dwarfs.
const STAR_HUES: RGB[] = [[170, 200, 255], [220, 230, 255], [255, 246, 226], [255, 226, 170], [255, 190, 150]];

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
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const ease = (x: number) => 1 - (1 - x) ** 3;
const frac = (x: number) => x - Math.floor(x);

/** The sky behind the skills screen, drawn at a fraction of the screen's
 * resolution and scaled up so every star is a real pixel. Dark is the night
 * itself; light is the same sky as an old printed star atlas. */
export class SkyRenderer {
  px = 3;
  W = 1;
  H = 1;
  portrait = false;
  hover?: SkillId;
  focus?: SkillId;
  /** Star to plate threads while choosing, in CSS pixels. */
  threads: { x: number; y: number; hot: boolean }[] = [];
  threadStar?: { skill: SkillId; star: number };
  onFrame?: () => void;
  readonly still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  private ctx: CanvasRenderingContext2D;
  private theme: SkyTheme;
  private pal: Palette;
  private SW = 1000;
  private SH = 560;
  private base = 1;
  private cam = { x: 500, y: 280, z: 1 };
  private goal = { x: 500, y: 280, z: 1 };
  private look: Look = { kind: "overview" };
  private sky = document.createElement("canvas");
  private hills = document.createElement("canvas");
  private fadeFrom = document.createElement("canvas");
  private fade = 0;
  private margin = 12;
  private fire = { x: 0, y: 0 };
  private dust: { x: number; y: number; b: number; ph: number; sp: number }[] = [];
  private bright: { x: number; y: number; c: string; ph: number; len: number }[] = [];
  private entries: SkyEntry[] = [];
  private sparks: Spark[] = [];
  private rings: { sx: number; sy: number; life: number; max: number; r: number }[] = [];
  private embers: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  private meteor?: { x: number; y: number; vx: number; vy: number; life: number };
  private nextMeteor = 3;
  private flame = [3, 5, 2];
  private flameAt = 0;
  private emberAt = 0;
  private flash = 0;
  private active?: SkillId;
  private activeAt = 0;
  private born = performance.now();
  private last = performance.now();
  private raf = 0;

  constructor(private canvas: HTMLCanvasElement, theme: SkyTheme) {
    this.ctx = canvas.getContext("2d")!;
    this.theme = theme;
    this.pal = PALETTES[theme];
    this.resize();
    this.raf = requestAnimationFrame(this.tick);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
  }
  set(entries: SkyEntry[]) {
    this.entries = entries;
  }
  /** Turn the sky over: the old one stays on top and fades out. */
  setTheme(theme: SkyTheme) {
    if (theme === this.theme) return;
    this.fadeFrom.width = this.W;
    this.fadeFrom.height = this.H;
    this.fadeFrom.getContext("2d")!.drawImage(this.canvas, 0, 0);
    this.fade = 1;
    this.theme = theme;
    this.pal = PALETTES[theme];
    this.paint();
  }
  setLook(look: Look, instant = false) {
    this.look = look;
    this.aim(instant);
  }
  at(skill: SkillId) {
    const def = CONSTELLATIONS[skill];
    return this.portrait ? def.tall : def.wide;
  }
  starAt(skill: SkillId, i: number): [number, number] {
    const [x, y] = this.at(skill);
    const [dx, dy] = CONSTELLATIONS[skill].stars[i];
    return [x + dx * FIGURE_SCALE, y + dy * FIGURE_SCALE];
  }
  /** Sky units to CSS pixels. */
  css(x: number, y: number): [number, number] {
    const [a, b] = this.project(x, y);
    return [a * this.px, b * this.px];
  }
  /** Sky units to CSS pixels at the current zoom. */
  span(units: number) {
    return units * this.base * this.cam.z * this.px;
  }
  /** A star catching: sparks, two rings, and the whole sky brightening. */
  ignite(skill: SkillId, star: number, big = true) {
    const [sx, sy] = this.starAt(skill, star);
    const tint = this.pal.tint[this.entries.find((e) => e.skill === skill)?.group ?? ""] ?? this.pal.star;
    const r = rng(performance.now() | 0);
    for (let i = 0; i < (big ? 80 : 30); i++) {
      const a = r() * Math.PI * 2, v = (big ? 30 : 16) + r() * (big ? 80 : 30);
      const max = 0.6 + r() * (big ? 1.2 : 0.6);
      this.sparks.push({ sx, sy, ox: 0, oy: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, color: [this.pal.gold, this.pal.star, tint][i % 3] });
    }
    this.rings.push({ sx, sy, life: 0.9, max: 0.9, r: big ? 34 : 18 });
    if (big) this.rings.push({ sx, sy, life: 1.5, max: 1.5, r: 64 });
    this.flash = big ? 1 : 0.4;
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
    this.portrait = box.height > box.width * 1.05;
    [this.SW, this.SH] = this.portrait ? [600, 1000] : [1000, 560];
    this.base = Math.min(this.W / this.SW, this.H / this.SH) * 0.94;
    this.ctx.imageSmoothingEnabled = false;
    this.paint();
    this.aim(true);
  }
  private paint() {
    this.paintSky(SKIES[this.theme]);
    this.paintHills();
    const r = rng(29);
    this.dust = Array.from({ length: Math.round((this.W * this.H) / (this.theme === "dark" ? 240 : 700)) }, () => ({
      x: r(),
      y: r() * 0.85,
      b: 0.25 + r() ** 3 * 0.75,
      ph: r() * 6.3,
      sp: 0.6 + r() * 2.2,
    }));
    this.bright = Array.from({ length: this.portrait ? 5 : 8 }, () => {
      const c = STAR_HUES[Math.floor(r() * STAR_HUES.length)];
      return { x: r(), y: r() * 0.72, c: this.theme === "dark" ? `rgb(${c.join(",")})` : this.pal.dust, ph: r() * 6.3, len: 2 + Math.floor(r() * 3) };
    });
  }

  private aim(instant: boolean) {
    const l = this.look;
    if (l.kind === "overview") this.goal = { x: this.SW / 2, y: this.SH / 2, z: 1 };
    else {
      const [x, y] = this.at(l.skill);
      const [fx, fy] = this.portrait ? l.tall : l.wide;
      this.goal = {
        x: x - ((fx - 0.5) * this.W) / (this.base * l.z),
        y: y - ((fy - 0.5) * this.H) / (this.base * l.z),
        z: l.z,
      };
    }
    if (instant || this.still) this.cam = { ...this.goal };
  }
  private project(x: number, y: number): [number, number] {
    const s = this.base * this.cam.z;
    return [(x - this.cam.x) * s + this.W / 2, (y - this.cam.y) * s + this.H / 2];
  }
  /** The Milky Way's line across the sky, as fractions of the canvas. */
  private band() {
    return this.portrait ? [0.08, 0.95, 0.92, 0.02] : [0.0, 0.82, 1.0, 0.04];
  }

  /** Deep space: nebulae warped out of noise, dust lanes through the band, a
   * glowing core, coloured stars, and a glow at the horizon. */
  private paintSky(p: SkyPaint) {
    const M = this.margin, W = this.W + M * 2, H = this.H + M * 2;
    this.sky.width = W;
    this.sky.height = H;
    const g = this.sky.getContext("2d")!;
    const img = g.createImageData(W, H);
    const [n1, n2, n3, n4, n5, n6] = [1, 2, 3, 4, 5, 6].map(noise);
    const r = rng(5);
    const S = 1 / Math.min(W, H);
    const [ax, ay, bx, by] = this.band();
    const lx = (bx - ax) * W, ly = (by - ay) * H, len = Math.hypot(lx, ly);
    const core: RGB = [255, 206, 150], [teal, violet, magenta] = p.nebula;
    const top = hex(p.top), mid = hex(p.mid), low = hex(p.low), glow = hex(p.glow);
    const cx = (ax + (bx - ax) * 0.62) * W, cy = (ay + (by - ay) * 0.62) * H, cr = Math.min(W, H) * 0.16;
    // Clouds are smooth, so they are worked out once per 2×2 block.
    const BW = Math.ceil(W / 2), BH = Math.ceil(H / 2);
    const cloudRGB = new Float32Array(BW * BH * 3), laneK = new Float32Array(BW * BH), bandK = new Float32Array(BW * BH);
    for (let by2 = 0; by2 < BH; by2++)
      for (let bx2 = 0; bx2 < BW; bx2++) {
        const x = bx2 * 2 + 1, y = by2 * 2 + 1, v = (y - M) / this.H;
        const fadeLow = clamp((0.86 - v) / 0.25);
        const nx = x * S, ny = y * S;
        const d = Math.abs((x - ax * W) * ly - (y - ay * H) * lx) / len * S;
        const band = Math.exp(-((d / 0.2) ** 2));
        const wx = fbm(n1, nx * 2.2, ny * 2.2, 4), wy = fbm(n2, nx * 2.2 + 5.2, ny * 2.2 + 1.3, 4);
        const cloud = fbm(n3, nx * 3 + wx * 2.4, ny * 3 + wy * 2.4, 5);
        const patch = clamp((fbm(n4, nx * 1.6 + 11, ny * 1.6 + 3, 4) - 0.56) * 3) * 0.75;
        const dens = Math.max(clamp((cloud - 0.4) * 2.5) * (0.15 + 0.85 * band), patch * (1 - band * 0.4)) * fadeLow;
        const hue = fbm(n5, nx * 1.1 + 30, ny * 1.1 + 8, 3);
        const neb = hue < 0.5 ? mix(teal, violet, clamp(hue * 2)) : mix(violet, magenta, clamp((hue - 0.5) * 2.2));
        const hot = Math.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / cr ** 2)) * fadeLow * p.core;
        let c: RGB = [neb[0] * dens * p.cloud + core[0] * hot * 0.55, neb[1] * dens * p.cloud + core[1] * hot * 0.5, neb[2] * dens * p.cloud + core[2] * hot * 0.42];
        // The brightest folds of a cloud go white at the heart.
        c = mix(c, p.heart, clamp((dens - 0.62) * 2.5) * 0.35);
        const o = by2 * BW + bx2;
        cloudRGB.set(c, o * 3);
        // Dust lanes follow the cloud's own folds, so they read as filaments.
        laneK[o] = clamp((fbm(n6, nx * 5 + wx * 3.5, ny * 5 + wy * 3.5, 5) - 0.55) * 2.2) * clamp(dens * 1.8) * band * fadeLow;
        bandK[o] = band * fadeLow;
      }
    for (let y = 0; y < H; y++) {
      const v = (y - M) / this.H;
      const sky = v < 0.5 ? mix(top, mid, clamp(v / 0.5)) : mix(mid, low, clamp((v - 0.5) / 0.35));
      const base = mix(sky, glow, Math.exp(-(((v - 0.8) / (p.moon ? 0.08 : 0.16)) ** 2)) * 0.9);
      for (let x = 0; x < W; x++) {
        const o = (y >> 1) * BW + (x >> 1);
        const lane = laneK[o];
        const shade = 1 - lane * (p.moon ? 0.6 : 0.25);
        let c: RGB = p.moon
          ? [(base[0] + cloudRGB[o * 3]) * shade, (base[1] + cloudRGB[o * 3 + 1]) * shade, (base[2] + cloudRGB[o * 3 + 2]) * shade]
          : mix(base, [cloudRGB[o * 3], cloudRGB[o * 3 + 1], cloudRGB[o * 3 + 2]].map((k) => Math.min(255, k * 2.2)) as RGB, clamp((cloudRGB[o * 3] + cloudRGB[o * 3 + 2]) / 260) * shade);
        if (r() < (0.0022 + bandK[o] * 0.03 * (1 - lane) + 0.0008) * p.stars * (p.moon ? 1 : clamp(1.2 - v * 1.6))) c = mix(c, STAR_HUES[Math.floor(r() * STAR_HUES.length)], 0.25 + r() ** 2 * 0.75);
        this.put(img, x, y, W, c, 31);
      }
    }
    g.putImageData(img, 0, 0);
    if (p.moon) this.paintMoon(g);
  }

  /** Quantise to `levels` per channel with ordered dither: the pixel grain. */
  private put(img: ImageData, x: number, y: number, W: number, c: RGB, levels: number) {
    const t = BAYER[(x & 3) + (y & 3) * 4] / 16;
    const o = (y * W + x) * 4;
    for (let i = 0; i < 3; i++) {
      const v = (clamp(c[i], 0, 255) / 255) * levels;
      img.data[o + i] = (Math.min(levels, Math.floor(v + t)) / levels) * 255;
    }
    img.data[o + 3] = 255;
  }

  private paintMoon(g: CanvasRenderingContext2D) {
    const M = this.margin;
    const mx = M + Math.round(this.W * (this.portrait ? 0.8 : 0.93)), my = M + Math.round(this.H * (this.portrait ? 0.13 : 0.1));
    const mr = Math.max(5, Math.round(Math.min(this.W, this.H) * 0.03));
    for (let dy = -mr * 4; dy <= mr * 4; dy++)
      for (let dx = -mr * 4; dx <= mr * 4; dx++) {
        const d = Math.hypot(dx, dy);
        const t = BAYER[((mx + dx) & 3) + ((my + dy) & 3) * 4];
        const lit = Math.hypot(dx + mr * 0.55, dy - mr * 0.25) >= mr;
        if (d <= mr) {
          // Lit crescent shaded towards the terminator; earthshine on the rest.
          const shade = clamp((dx - dy + mr) / (mr * 2.4));
          g.globalAlpha = 1;
          g.fillStyle = lit ? (shade * 16 > t ? "#fbf1d6" : "#dccb9e") : "#221e44";
          g.fillRect(mx + dx, my + dy, 1, 1);
        } else if (d < mr * 4 && Math.exp(-(d - mr) / (mr * 0.9)) * 7 > t) {
          g.globalAlpha = 0.35;
          g.fillStyle = "#6a62b0";
          g.fillRect(mx + dx, my + dy, 1, 1);
        }
      }
    g.globalAlpha = 1;
  }
  /** Three ridges, pines on the nearer two, and a flat spot for the fire. */
  private paintHills() {
    const { W, H } = this;
    const c = this.hills;
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    const fireX = Math.round(W * (this.portrait ? 0.62 : 0.52));
    for (const [n, layer] of this.pal.hills.entries()) {
      const r = rng(layer.seed);
      const p = [r() * 6, r() * 6, r() * 6];
      const ridge = (x: number) => {
        const u = (x / W) * Math.PI * 2;
        let y = H * (layer.base - layer.amp * (Math.sin(u * 1.3 + p[0]) * 0.6 + Math.sin(u * 3.1 + p[1]) * 0.3 + Math.sin(u * 7.7 + p[2]) * 0.1));
        if (n === 2) {
          const w = clamp(1 - Math.abs(x - fireX) / 16);
          y = y * (1 - w) + (H * layer.base - 2) * w;
        }
        return Math.round(y);
      };
      const fill = (x: number, y: number) => {
        if (layer.style === "hatch" && y % 2 && (x + y) % 5) return;
        if (layer.style === "stipple" && BAYER[(x & 3) + (y & 3) * 4] > 6) return;
        g.fillRect(x, y, 1, 1);
      };
      g.fillStyle = layer.body;
      for (let x = 0; x < W; x++) {
        const top = ridge(x);
        if (layer.style === "solid") g.fillRect(x, top, 1, H - top);
        else for (let y = top + 1; y < H; y++) fill(x, y);
      }
      g.fillStyle = layer.rim;
      for (let x = 0; x < W; x++) g.fillRect(x, ridge(x), 1, 1);
      if (n > 0)
        for (let i = 0; i < W / (n === 1 ? 9 : 14); i++) {
          const x = Math.round(r() * W);
          if (Math.abs(x - fireX) < 22) continue;
          const h = 4 + Math.round(r() * (n === 1 ? 6 : 9));
          const foot = ridge(x) + 1;
          g.fillStyle = n === 2 ? layer.body : layer.rim;
          for (let k = 0; k < h; k++) {
            const half = Math.floor((h - k) * 0.45 * (k % 3 === 0 ? 0.8 : 1));
            g.fillRect(x - half, foot - k, half * 2 + 1, 1);
          }
        }
      if (n === 2) this.fire = { x: fireX, y: ridge(fireX) };
    }
  }

  private dot(x: number, y: number, color: string, alpha: number) {
    if (alpha <= 0.01) return;
    this.ctx.globalAlpha = Math.min(1, alpha);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  /** A pixel line; `glow` adds a faint pixel either side of it. */
  private line(x0: number, y0: number, x1: number, y1: number, color: string, alpha: number, o: { dotted?: number; upto?: number; gap?: number; offset?: number; glow?: number } = {}) {
    const dx = x1 - x0, dy = y1 - y0;
    const n = Math.round(Math.max(Math.abs(dx), Math.abs(dy)));
    if (n < 2) return;
    const gap = n > (o.gap ?? 0) * 3 ? (o.gap ?? 0) : 0;
    const end = Math.floor((n - gap) * (o.upto ?? 1));
    const across = Math.abs(dx) > Math.abs(dy) ? [0, 1] : [1, 0];
    for (let i = gap; i <= end; i++) {
      if (o.dotted && (i + (o.offset ?? 0)) % o.dotted) continue;
      const x = x0 + (dx * i) / n, y = y0 + (dy * i) / n;
      this.dot(x, y, color, alpha);
      if (o.glow) {
        this.dot(x + across[0], y + across[1], color, alpha * o.glow);
        this.dot(x - across[0], y - across[1], color, alpha * o.glow);
      }
    }
  }
  private cross(x: number, y: number, len: number, color: string, alpha: number) {
    this.dot(x, y, color, alpha);
    for (let d = 1; d <= len; d++) {
      const a = alpha * (1 - (d - 1) / (len + 0.5));
      this.dot(x + d, y, color, a);
      this.dot(x - d, y, color, a);
      this.dot(x, y + d, color, a);
      this.dot(x, y - d, color, a);
    }
  }
  private ring(x: number, y: number, r: number, color: string, alpha: number) {
    const n = Math.max(12, Math.round(r * 7));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.dot(x + Math.cos(a) * r, y + Math.sin(a) * r, color, alpha);
    }
  }
  private halo(x: number, y: number, r: number, color: string, alpha: number) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= r) this.dot(x + dx, y + dy, color, alpha * (1 - d / (r + 1)));
      }
  }

  private milestone(x: number, y: number, state: MilestoneState, a: number, t: number, flare: number) {
    const { gold, star, faint } = this.pal;
    const arm = Math.round(2 + Math.min(3, this.cam.z) + flare * 2);
    const dark = this.theme === "dark";
    if (state === "chosen") {
      if (dark) this.halo(x, y, arm + 1, gold, 0.22 * a);
      else this.cross(x, y, arm + 2, star, 0.5 * a);
      this.cross(x, y, arm + 1, gold, a);
      this.dot(x, y, dark ? "#ffffff" : star, a);
    } else if (state === "waiting") {
      const p = (t * 0.9) % 1;
      this.ring(x, y, 2 + p * (arm + 5), dark ? gold : this.pal.hot, (1 - p) * 0.9 * a);
      if (dark) this.halo(x, y, arm, gold, (0.12 + 0.08 * Math.sin(t * 4)) * a);
      this.cross(x, y, arm, dark ? star : this.pal.hot, (0.75 + 0.25 * Math.sin(t * 5)) * a);
    } else if (state === "unbuilt") {
      this.cross(x, y, Math.max(1, arm - 2), star, 0.7 * a);
    } else {
      for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]])
        this.dot(x + dx, y + dy, faint, 0.65 * a);
    }
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const t = now / 1000;
    const k = 1 - Math.exp(-dt * 3.6);
    this.cam.x += (this.goal.x - this.cam.x) * k;
    this.cam.y += (this.goal.y - this.cam.y) * k;
    this.cam.z = Math.exp(Math.log(this.cam.z) + (Math.log(this.goal.z) - Math.log(this.cam.z)) * k);
    const active = this.focus ?? this.hover;
    if (active !== this.active) (this.active = active), (this.activeAt = now);
    const { ctx, W, H, pal } = this;
    const dark = this.theme === "dark";

    // The deep sky slides a little against the constellations as the eye moves.
    const M = this.margin;
    const par = (this.cam.x - this.SW / 2) * this.base * 0.04, parY = (this.cam.y - this.SH / 2) * this.base * 0.04;
    ctx.globalAlpha = 1;
    ctx.drawImage(this.sky, Math.round(-M - clamp(par, -M, M)), Math.round(-M - clamp(parY, -M, M)));

    const zx = (this.cam.x - this.SW / 2) * this.base * 0.08, zy = (this.cam.y - this.SH / 2) * this.base * 0.08;
    const spread = 1 + (this.cam.z - 1) * 0.06;
    const wrap = (v: number, n: number) => ((v % n) + n) % n;
    for (const s of this.dust) {
      const x = wrap((s.x * W - zx - W / 2) * spread + W / 2, W);
      const y = wrap((s.y * H - zy - H / 2) * spread + H / 2, H);
      const a = pal.twinkle ? s.b * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph)) : s.b * 0.8;
      this.dot(x, y, pal.dust, a * clamp(1.15 - y / H) * (dark ? 1 : 0.7));
    }
    for (const b of this.bright) {
      const x = wrap(b.x * W - zx * 1.4, W), y = wrap(b.y * H - zy * 1.4, H);
      const tw = pal.twinkle ? 0.55 + 0.25 * Math.sin(t * 1.3 + b.ph) : 0.7;
      if (dark) this.halo(x, y, 2, b.c, 0.12 * tw);
      this.cross(x, y, Math.round((b.len - 1) * tw), b.c, tw);
      if (dark && tw > 0.85) for (const [dx, dy] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) this.dot(x + dx, y + dy, b.c, 0.35);
    }
    if (dark) this.shootingStar(dt, t);

    const since = now - this.born;
    for (const [ci, e] of this.entries.entries()) {
      const def = CONSTELLATIONS[e.skill];
      const appear = this.still ? 1 : ease(clamp((since - 350 - ci * 110) / 900));
      if (appear <= 0) continue;
      const on = active === e.skill;
      const dim = this.focus && !on ? 0.22 : 1;
      const lift = on ? 1 : 0.72;
      const a = appear * dim;
      // Seconds since this constellation was pointed at: drives the retrace.
      const tr = on && !this.still ? (now - this.activeAt) / 1000 : 99;
      const [cx, cy] = this.at(e.skill);
      const pts = def.stars.map(([x, y]) => this.project(cx + x * FIGURE_SCALE, cy + y * FIGURE_SCALE));
      const bright = def.stars.map((_, i) => clamp(e.lit - i));
      const tint = pal.tint[e.group] ?? pal.star;
      const gap = this.cam.z > 1.5 ? 3 : 2;
      def.lines.forEach(([i, j], li) => {
        const lit = bright[i] >= 1 && bright[j] >= 1;
        const drawn = on ? ease(clamp(tr * 2.4 - li * 0.1)) : appear;
        const base = lit ? 0.9 : on ? (dark ? 0.55 : 0.6) : dark ? 0.34 : 0.45;
        this.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], lit ? tint : pal.star, base * lift * a, {
          dotted: lit ? 0 : 2,
          upto: drawn,
          gap,
          glow: on && dark ? (lit ? 0.22 : 0.1) : 0,
        });
        // The pen's point while it traces, then a slow current along the line.
        if (on && drawn < 1 && drawn > 0) {
          const f = drawn;
          this.halo(pts[i][0] + (pts[j][0] - pts[i][0]) * f, pts[i][1] + (pts[j][1] - pts[i][1]) * f, 1, pal.hot, 0.9 * a);
        } else if (on && tr > 1.2) {
          const f = frac(t * 0.35 + li * 0.37);
          for (let k = 0; k < 5; k++) {
            const g = f - k * 0.025;
            if (g < 0) break;
            this.dot(pts[i][0] + (pts[j][0] - pts[i][0]) * g, pts[i][1] + (pts[j][1] - pts[i][1]) * g, k ? tint : pal.hot, (1 - k / 5) * (lit ? 0.9 : 0.5) * a);
          }
        }
      });
      const ms = milestoneStars(def.stars.length);
      pts.forEach(([x, y], i) => {
        // A ripple of flares passing through the stars in order.
        const flare = on ? Math.exp(-(((tr - 0.2 - i * 0.07) / 0.14) ** 2)) : 0;
        const tier = ms.indexOf(i);
        if (tier >= 0) return this.milestone(x, y, e.milestones[tier], a * (0.6 + 0.4 * lift), t + i, flare);
        const b = bright[i];
        if (b <= 0) {
          if (on || flare > 0.1) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) this.dot(x + dx, y + dy, pal.faint, (0.55 + flare) * a);
          else this.dot(x, y, pal.faint, 0.7 * a);
          if (flare > 0.1) this.cross(x, y, 1 + Math.round(flare * 2), pal.star, flare * a);
          return;
        }
        const tw = pal.twinkle ? 0.8 + 0.2 * Math.sin(t * 2.1 + i * 1.7 + ci) : 1;
        if (on && dark) this.halo(x, y, 2 + Math.round(flare * 2), tint, (0.14 + flare * 0.3) * a);
        this.dot(x, y, pal.star, (0.35 + 0.65 * b) * tw * a);
        if (b >= 1) this.cross(x, y, (this.cam.z > 1.8 ? 2 : 1) + Math.round(flare * 3), flare > 0.3 ? pal.hot : pal.star, (0.5 + flare * 0.5) * tw * a * lift);
      });
    }

    this.drawThreads(t);
    this.drawHills(dt, t);
    this.drawSparks(dt);
    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.14;
      ctx.fillStyle = pal.flash;
      ctx.fillRect(0, 0, W, H);
      this.flash = Math.max(0, this.flash - dt * 2.2);
    }
    if (this.fade > 0) {
      ctx.globalAlpha = ease(this.fade);
      ctx.drawImage(this.fadeFrom, 0, 0);
      this.fade = this.still ? 0 : Math.max(0, this.fade - dt * 1.4);
    }
    ctx.globalAlpha = 1;
    this.onFrame?.();
    this.raf = requestAnimationFrame(this.tick);
  };

  private shootingStar(dt: number, t: number) {
    if (this.still) return;
    this.nextMeteor -= dt;
    if (!this.meteor && this.nextMeteor <= 0) {
      const r = rng((t * 1000) | 0);
      const dir = r() < 0.5 ? -1 : 1;
      this.meteor = { x: this.W * (0.2 + r() * 0.6), y: this.H * (0.05 + r() * 0.3), vx: dir * (70 + r() * 50), vy: 30 + r() * 20, life: 0.9 };
      this.nextMeteor = 7 + r() * 9;
    }
    const m = this.meteor;
    if (!m) return;
    m.life -= dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    const fade = clamp(m.life / 0.9);
    const n = Math.hypot(m.vx, m.vy);
    for (let i = 0; i < 14; i++) this.dot(m.x - (m.vx / n) * i, m.y - (m.vy / n) * i, i < 2 ? "#ffffff" : this.pal.star, fade * (1 - i / 14));
    if (m.life <= 0) this.meteor = undefined;
  }

  private drawThreads(t: number) {
    if (!this.threadStar || !this.threads.length) return;
    const [x0, y0] = this.project(...this.starAt(this.threadStar.skill, this.threadStar.star));
    const run = -Math.floor(t * 18);
    for (const th of this.threads) {
      const x1 = th.x / this.px, y1 = th.y / this.px;
      // Light running up the thread towards the star.
      this.line(x1, y1, x0, y0, th.hot ? this.pal.gold : this.pal.thread, th.hot ? 0.85 : 0.45, { dotted: th.hot ? 0 : 3, gap: 4, offset: run, glow: th.hot ? 0.25 : 0 });
      if (th.hot) this.line(x1, y1, x0, y0, this.pal.hot, 0.9, { dotted: 7, gap: 4, offset: run });
    }
  }

  private drawHills(dt: number, t: number) {
    const { ctx, H } = this;
    const sink = Math.round(ease(clamp((this.cam.z - 1) / 1.5)) * H * 0.6);
    if (sink >= H) return;
    ctx.globalAlpha = 1;
    ctx.drawImage(this.hills, 0, sink);
    const fx = this.fire.x, fy = this.fire.y + sink;
    if (fy - 12 > H) return;
    const dark = this.theme === "dark";
    // The fire's light on the ground and on the one watching it.
    this.halo(fx + 1, fy - 2, 16, "#ff8a3c", (dark ? 0.06 : 0.03) + 0.02 * Math.sin(t * 9));
    this.halo(fx + 1, fy - 2, 7, "#ffb25c", (dark ? 0.1 : 0.06) + 0.04 * Math.sin(t * 13));
    const gx = fx - 9, gy = fy - FIGURE.length;
    FIGURE.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch !== "#") return;
        this.dot(gx + x, gy + y, this.pal.figure, 1);
        if (row[x + 1] !== "#") this.dot(gx + x, gy + y, "#e08a45", 0.35 + 0.25 * Math.sin(t * 11 + y));
      }),
    );
    if (!this.still && t - this.flameAt > 0.09) {
      this.flameAt = t;
      this.flame = [2 + ((Math.random() * 3) | 0), 3 + ((Math.random() * 3) | 0), 2 + ((Math.random() * 2) | 0)];
    }
    this.flame.forEach((h, c) => {
      for (let k = 0; k < h; k++) this.dot(fx + c, fy - 1 - k, k === h - 1 ? "#fff0b0" : k >= h - 2 ? "#ffc94d" : "#ff8a3a", 1);
      this.dot(fx + c, fy, "#9a3a1c", 1);
    });
    if (!this.still && t - this.emberAt > 0.14) {
      this.emberAt = t;
      this.embers.push({ x: fx + 1 + (Math.random() - 0.5) * 2, y: fy - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), life: 1.2 + Math.random() });
    }
    this.embers = this.embers.filter((e) => {
      e.life -= dt;
      e.x += (e.vx + Math.sin(t * 3 + e.y) * 3) * dt;
      e.y += e.vy * dt;
      this.dot(e.x, e.y, dark ? "#ffb85c" : "#c8501e", clamp(e.life));
      return e.life > 0;
    });
  }

  private drawSparks(dt: number) {
    for (const r of this.rings) {
      r.life -= dt;
      const p = 1 - r.life / r.max;
      const [x, y] = this.project(r.sx, r.sy);
      this.ring(x, y, ease(p) * r.r, this.pal.gold, (1 - p) * 0.85);
    }
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const s of this.sparks) {
      s.life -= dt;
      s.ox += s.vx * dt;
      s.oy += s.vy * dt;
      s.vx *= 1 - dt * 1.8;
      s.vy *= 1 - dt * 1.8;
      const [x, y] = this.project(s.sx, s.sy);
      this.dot(x + s.ox, y + s.oy, s.color, clamp(s.life / s.max) * 1.2);
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  }
}
