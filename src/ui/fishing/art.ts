import type { CharacterAppearance } from "../../core/character";
import { drawGarmentIcon } from "../../render/garment-icons";
import { fishItemId, type FishKind } from "../../content/economy/fishing";
import type { CharacterPose } from "../../render/characters/poses";
import { drawCharacterG as drawCharacter } from "../../render/characters/doll/draw";
import { waterRamps } from "../../render/living-water/surface";
import { defaults, palettes } from "../../render/living-water/model";
import { voxelIcon } from "../../render/voxel-items";
import { H, SET_MAX, W, type FishingSim, type SetGear, type SetKind, type Setup } from "./sim";

export type WaterPaletteName = keyof typeof waterRamps;

type RGB = [number, number, number];
const rgb = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const css = (c: number, a = 1) => {
  const [r, g, b] = rgb(c);
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
};
const mix = (a: number, b: number, t: number) => {
  const x = rgb(a), y = rgb(b);
  return (Math.round(x[0] + (y[0] - x[0]) * t) << 16) | (Math.round(x[1] + (y[1] - x[1]) * t) << 8) | Math.round(x[2] + (y[2] - x[2]) * t);
};
const shade = (c: number, k: number) => mix(c, k < 1 ? 0x000000 : 0xffffff, k < 1 ? 1 - k : k - 1);

/** Deep to shallow, then the light on it, from the ramp the world's water uses for this river. */
type WaterLook = { ramp: RGB[]; bands: [number, number, number, number]; glint: number; foam: number; flow: number };
function waterLook(s: Setup, palette: WaterPaletteName): WaterLook {
  const hex = waterRamps[palette].map((c) => parseInt(c.slice(1), 16));
  return {
    ramp: hex.map(rgb),
    bands: [hex[7], hex[5], hex[3], hex[1]],
    glint: mix(hex[0], 0xffffff, 0.5),
    foam: parseInt(palettes[palette].foam.slice(1), 16),
    flow: s.water === "river" ? 10 : 0,
  };
}

type LandLook = { ground: number; ground2: number; rim: number; reed: number; reedTip: number; tree: number; tree2: number; kind: "grass" | "sand" | "rock" | "mud" };
function landLook(s: Setup, climate: string, season: string): LandLook {
  const autumn = season === "autumn", winter = season === "winter";
  if (s.water === "sea" && (climate === "tropical" || climate === "monsoon" || climate === "mediterranean" || climate === "arid"))
    return { ground: 0xd8c08a, ground2: 0xc8ac74, rim: 0xb89a66, reed: 0x6a8a3a, reedTip: 0x9ab04a, tree: 0x3a7a3a, tree2: 0x2c5e30, kind: "sand" };
  if (climate === "boreal" || climate === "tundra" || s.water === "sea")
    return { ground: winter ? 0xd8dee0 : 0x6c7a54, ground2: 0x7c7a6a, rim: 0x5a5a52, reed: 0x7a7a4a, reedTip: 0xa09860, tree: 0x2e4a38, tree2: 0x223a2c, kind: "rock" };
  if (climate === "arid")
    return { ground: 0x8a7a50, ground2: 0x7a6a44, rim: 0x5e5236, reed: 0x5a8a3a, reedTip: 0x8ab04a, tree: 0x4a7a3a, tree2: 0x3a6230, kind: "mud" };
  return {
    ground: winter ? 0xb8c0b0 : autumn ? 0x8a8a44 : 0x5e8a3e, ground2: winter ? 0xa0a898 : autumn ? 0x7a7638 : 0x4e7836,
    rim: 0x5a4e34, reed: autumn ? 0x9a8a44 : 0x5e7e34, reedTip: autumn ? 0xb08a40 : 0x8a6a3a,
    tree: autumn ? 0xb0702e : winter ? 0x5a5e54 : 0x3e6e34, tree2: autumn ? 0x8a4e24 : winter ? 0x4a4e46 : 0x2e5a2a, kind: "grass",
  };
}

/** Light by hour: a colour laid over the scene and how strongly. */
function light(hour: number): { tint: number; a: number; sun?: number } {
  if (hour < 4 || hour >= 21.5) return { tint: 0x1a2450, a: 0.5 };
  if (hour < 5) return { tint: 0x403a6a, a: 0.38 };
  if (hour < 7) return { tint: 0xf0a078, a: 0.22, sun: 0.15 };
  if (hour < 16.5) return { tint: 0xfff4e0, a: 0.04 };
  if (hour < 18.5) return { tint: 0xf0a050, a: 0.16, sun: 0.85 };
  if (hour < 20) return { tint: 0xd06048, a: 0.28, sun: 0.85 };
  return { tint: 0x403060, a: 0.4 };
}

const POSES: Record<FishingSim["pose"]["name"], { pose: CharacterPose; ms: number; loop: boolean }> = {
  idle: { pose: "idle", ms: 380, loop: true },
  cast: { pose: "cast", ms: 110, loop: false },
  tug: { pose: "tug", ms: 160, loop: true },
  "spear-thrust": { pose: "spear-thrust", ms: 70, loop: false },
  lift: { pose: "lift", ms: 130, loop: false },
};

/** Side view of a fish, for a leap, a catch and the tally: drawn, not stamped. */
const fishCache = new Map<string, HTMLCanvasElement>();
export function fishSprite(k: FishKind, len: number) {
  const key = `${k.name}:${len}`;
  const hit = fishCache.get(key);
  if (hit) return hit;
  if (k.rarity === "legendary") {
    const original = document.createElement("canvas");
    original.width = original.height = 24;
    drawGarmentIcon(original.getContext("2d")!, fishItemId(k), 0, 0);
    const c = document.createElement("canvas");
    c.width = len; c.height = Math.round(len * 18 / 24);
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(original, 0, 2, 24, 18, 0, 0, c.width, c.height);
    fishCache.set(key,c);
    return c;
  }
  if (k.shape === "crab" || k.shape === "claw" || k.shape === "squid" || k.shape === "frog") {
    const c = critter(k, len);
    fishCache.set(key, c);
    return c;
  }
  const h = Math.max(3, Math.round(len * (k.shape === "deep" ? 0.42 : k.shape === "long" ? 0.16 : k.shape === "flat" ? 0.5 : 0.28)));
  const c = document.createElement("canvas");
  c.width = len + 2;
  c.height = h + 4;
  const g = c.getContext("2d")!;
  const tail = Math.max(2, Math.round(len * 0.2));
  const body = len - tail;
  const outline = shade(k.back, 0.55);
  for (let x = 0; x < body; x++) {
    const u = x / body;
    // Blunt head, widest a third back, tapering to the wrist.
    const half = (h / 2) * Math.sin(Math.PI * Math.min(1, (u + 0.08) / 1.02)) ** (k.shape === "long" ? 0.3 : 0.7);
    const top = Math.round(h / 2 + 2 - half), bot = Math.round(h / 2 + 2 + half);
    for (let y = top; y <= bot; y++) {
      const v = (y - top) / Math.max(1, bot - top);
      let col = v < 0.45 ? k.back : v < 0.6 ? mix(k.back, k.belly, 0.5) : k.belly;
      if (k.mark === "bars" && v < 0.6 && Math.floor(x / Math.max(2, len / 7)) % 2 === 0 && u > 0.2) col = shade(k.back, 0.7);
      if (k.mark === "spots" && v < 0.55 && (x * 7 + y * 13) % 11 === 0) col = shade(k.back, 0.6);
      if (k.mark === "stripe" && Math.abs(v - 0.5) < 0.1 && u > 0.15) col = shade(k.back, 0.65);
      if (y === top || y === bot) col = outline;
      g.fillStyle = css(col);
      g.fillRect(len - x, y, 1, 1);
    }
  }
  // Tail, dorsal fin, eye and a glint on the head.
  g.fillStyle = css(k.fin);
  for (let i = 0; i < tail; i++) {
    const spread = Math.round((i / tail) * (h / 2 + 1)) + 1;
    g.fillRect(tail - i, h / 2 + 2 - spread, 1, spread * 2);
  }
  g.fillRect(Math.round(len * 0.45), Math.round(h / 2 + 2 - h / 2) - 1, Math.max(2, Math.round(len * 0.18)), 1);
  g.fillStyle = "#151515";
  g.fillRect(len - Math.max(2, Math.round(len * 0.12)), Math.round(h / 2 + 1), 1, 1);
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.fillRect(len - Math.max(3, Math.round(len * 0.2)), Math.round(h / 2), 2, 1);
  fishCache.set(key, c);
  return c;
}
/** Side views of the things that aren't fish-shaped, head to the right like the fish. */
function critter(k: FishKind, len: number) {
  const c = document.createElement("canvas"), h = Math.max(5, Math.round(len * (k.shape === "crab" ? 0.6 : k.shape === "frog" ? 0.55 : 0.32)));
  c.width = len + 4;
  c.height = h + 4;
  const g = c.getContext("2d")!, px = (col: number, x: number, y: number, w = 1, hh = 1) => {
    g.fillStyle = css(col);
    g.fillRect(Math.round(x), Math.round(y), w, hh);
  };
  const out = shade(k.back, 0.55), eye = 0x151515;
  if (k.shape === "crab") {
    const cx = c.width / 2, top = 3, bw = Math.round(len * 0.7);
    for (let i = 0; i < 3; i++) {
      px(k.fin, cx - bw / 2 - 2 - i, top + h * 0.5 + i * 1.5, 2, 1);
      px(k.fin, cx + bw / 2 + i, top + h * 0.5 + i * 1.5, 2, 1);
    }
    for (let y = 0; y < h * 0.6; y++) {
      const half = (bw / 2) * Math.sqrt(1 - ((y - h * 0.3) / (h * 0.32)) ** 2 || 0);
      px(y < 1 || y >= h * 0.6 - 1 ? out : y < h * 0.35 ? k.back : k.belly, cx - half, top + 2 + y, Math.max(1, Math.round(half * 2)), 1);
    }
    px(k.fin, cx - bw / 2 - 3, top, 3, 3);
    px(k.fin, cx + bw / 2, top, 3, 3);
    px(eye, cx - 2, top + 1);
    px(eye, cx + 1, top + 1);
  } else if (k.shape === "claw") {
    const mid = Math.round(h / 2 + 2), body = Math.round(len * 0.75);
    for (let x = 0; x < body; x++) {
      const half = Math.max(1, (h / 2.6) * (x < body * 0.3 ? 0.6 + x / (body * 0.75) : 1));
      px(Math.floor(x / 3) % 2 && x < body * 0.55 ? shade(k.back, 0.8) : k.back, x + 1, mid - half, 1, Math.round(half * 2));
      px(out, x + 1, mid + half, 1, 1);
    }
    px(k.fin, 0, mid - 2, 2, 5);
    px(k.fin, body, mid - h / 2, Math.round(len * 0.22), 2);
    px(k.fin, body, mid + h / 2 - 2, Math.round(len * 0.22), 2);
    px(k.fin, body + Math.round(len * 0.18), mid - h / 2 - 1, 2, 2);
    px(shade(k.fin, 1.2), body - 2, mid - 1, Math.round(len * 0.2), 1);
    px(eye, body - 1, mid - 2);
  } else if (k.shape === "squid") {
    const mid = Math.round(h / 2 + 2), mantle = Math.round(len * 0.6);
    for (let x = 0; x < mantle; x++) {
      const half = Math.max(1, (h / 2) * Math.min(1, (x + 1) / (mantle * 0.5)));
      px(x === 0 ? out : k.back, x + 1, mid - half, 1, Math.round(half * 2));
      px(k.belly, x + 1, mid + half - 1, 1, 1);
    }
    px(k.fin, 0, mid - h / 2, 3, h);
    for (let i = 0; i < 4; i++) px(k.fin, mantle + 2, mid - 2 + i * 1.3, Math.round(len * 0.35) - (i % 2) * 2, 1);
    px(0xffffff, mantle - 2, mid - 2, 2, 2);
    px(eye, mantle - 1, mid - 1);
  } else {
    const base = h + 2, bw = Math.round(len * 0.55), x0 = Math.round(len * 0.3);
    for (let x = 0; x < bw; x++) {
      const top = Math.round(base - h * 0.7 * Math.sin(Math.PI * (0.15 + 0.7 * (x / bw))));
      px(k.back, x0 + x, top, 1, base - top - 1);
      px(k.belly, x0 + x, base - 1, 1, 1);
      if (k.mark === "spots" && (x * 7) % 5 === 0) px(shade(k.back, 0.65), x0 + x, top + 2, 1, 1);
    }
    px(k.fin, 1, base - 1, x0, 1);
    px(k.fin, 1, base - 3, 2, 2);
    px(k.fin, x0 + bw - 2, base, 4, 1);
    px(0xf2e080, x0 + bw - 4, base - h * 0.75, 2, 2);
    px(eye, x0 + bw - 3, base - h * 0.75);
  }
  return c;
}

export const fishLength = (kg: number) => Math.round(Math.min(26, 8 + Math.log(kg + 1) * 4.2));

export type Look = { climate: string; season: string; culture: string; palette: WaterPaletteName; appearance?: CharacterAppearance };

// Value noise that wraps across the width, so a drifting river reads it by offset.
function smoothNoise(r: () => number, cw: number, ch: number) {
  const gw = W / cw, gh = Math.ceil(H / ch) + 1, lattice = Array.from({ length: gw * gh }, r), out = new Float32Array(W * H);
  const at = (i: number, j: number) => lattice[j * gw + (i % gw)];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = Math.floor(x / cw), j = Math.floor(y / ch), u = x / cw - i, v = y / ch - j;
      const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
      const top = at(i, j) + (at(i + 1, j) - at(i, j)) * su, low = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * su;
      out[y * W + x] = top + (low - top) * sv;
    }
  return out;
}

export class FishingArt {
  private water: WaterLook;
  private land: LandLook;
  private img: ImageData;
  private detail: Float32Array;
  private bed: Float32Array;
  private frames = new Map<string, { c: HTMLCanvasElement; x0: number; y0: number; w: number; h: number }>();
  private glints: { x: number; y: number; p: number; len: number }[] = [];
  private floaters: { x: number; y: number; c: number; kind: "leaf" | "petal" | "pad" }[] = [];
  private flies: { x: number; y: number; p: number }[] = [];
  private bank: HTMLCanvasElement | undefined;
  private far: HTMLCanvasElement | undefined;

  private catCoat: number;
  constructor(readonly sim: FishingSim, readonly look: Look) {
    const s = sim.setup;
    this.catCoat = s.seed.length % 4;
    this.water = waterLook(s, look.palette);
    this.land = landLook(s, look.climate, look.season);
    this.img = new ImageData(W, H);
    const r = sim.rand;
    this.detail = smoothNoise(r, 16, 8);
    const broad = smoothNoise(r, 40, 40), fine = smoothNoise(r, 20, 20);
    this.bed = broad.map((b, i) => b * 1.4 + fine[i] * 0.5);
    for (let i = 0; i < 44; i++) this.glints.push({ x: r() * W, y: r() * H, p: r() * 10, len: 2 + Math.floor(r() * 3) });
    const autumn = look.season === "autumn" && (look.climate === "temperate" || look.climate === "boreal"), spring = look.season === "spring";
    if (s.water !== "sea") {
      const n = autumn ? 7 : spring && look.culture === "east-asian" ? 9 : look.climate === "tropical" || look.climate === "monsoon" ? 5 : 2;
      for (let i = 0; i < n; i++)
        this.floaters.push({
          x: r() * W, y: sim.farY + 8 + r() * (sim.shoreY - sim.farY - 20),
          c: autumn ? [0xc8702a, 0xd8a03a, 0xa8402a][i % 3] : spring && look.culture === "east-asian" ? 0xf2c0cc : 0x4e8a3a,
          kind: autumn ? "leaf" : spring && look.culture === "east-asian" ? "petal" : look.climate === "tropical" || look.climate === "monsoon" ? "pad" : "leaf",
        });
      if (look.season === "summer") for (let i = 0; i < 2; i++) this.flies.push({ x: r() * W, y: 60 + r() * 60, p: r() * 10 });
    }
  }

  private frame(name: CharacterPose, i: number) {
    const key = `${name}:${i}`;
    const hit = this.frames.get(key);
    if (hit) return hit;
    const a = this.look.appearance;
    if (!a) return undefined;
    const c = document.createElement("canvas");
    c.width = c.height = 80;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    try {
      drawCharacter(g, a, 0, name, i);
    } catch {
      return undefined;
    }
    const px = g.getImageData(0, 0, 80, 80).data;
    let x0 = 80, y0 = 80, x1 = 0, y1 = 0;
    for (let y = 0; y < 80; y++) for (let x = 0; x < 80; x++) if (px[(y * 80 + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const f = { c, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    this.frames.set(key, f);
    return f;
  }

  draw(g: CanvasRenderingContext2D) {
    const sim = this.sim, t = sim.t;
    const shake = sim.shake > 0 ? Math.round((sim.rand() - 0.5) * 3 * sim.shake * 6) : 0;
    g.save();
    g.translate(shake, 0);
    this.drawWater(g, t);
    this.drawFloaters(g, t);
    this.drawFar(g);
    this.drawFishShadows(g);
    this.drawRings(g);
    this.drawSets(g, t);
    this.drawGear(g, t);
    this.drawLeaps(g);
    this.drawNear(g, t);
    this.drawPlayer(g, t);
    this.drawCat(g, t);
    this.drawLanded(g);
    this.drawDrops(g);
    this.drawBirds(g);
    this.drawAimAndMeters(g, t);
    this.drawWeather(g, t);
    this.drawLight(g, t);
    this.drawNightLife(g, t);
    g.restore();
  }

  private drawWater(g: CanvasRenderingContext2D, t: number) {
    // The world's water shader (living-water/shader.ts) at one texel per pixel:
    // a tone from depth and the bed, rippled by two crossed sines, with the caustic net lighter.
    const sim = this.sim, d = this.img.data, ramp = this.water.ramp, sea = sim.setup.water === "sea";
    const top = Math.max(0, Math.floor(sim.farY)), bottom = Math.min(H, Math.ceil(sim.shoreY) + 10);
    const flow = this.water.flow, drift = t * flow * 1.3, steps = sea ? 8 : 2, w = t * 0.5;
    for (let y = top; y < bottom; y++) {
      const depth = sim.depthAt(y) * (sea ? 4.2 : 5.5);
      const range = sea ? 1 - Math.min(1, Math.max(0, (depth - 1) / 2)) : depth < 6 ? 1 : 0;
      for (let x = 0; x < W; x++) {
        const qx = sea ? x + Math.sin(w * 0.55 + y / 100) * 2 : x - drift, qy = sea ? y + Math.cos(w * 0.43 + x / 110) * 2 : y;
        const det = this.detail[y * W + ((Math.floor(qx) % W) + W) % W];
        const warp = Math.sin(qy / 19 + w * 0.35) * 5 + Math.sin(qx / 33 - qy / 27) * 5;
        const a = Math.sin((qx + warp) / 12 + Math.sin(qy / 16) * 1.3), b = Math.sin(qy / 8 + Math.sin(qx / 23 + w * 0.2) * 1.7);
        const wave = sea ? Math.sin(depth * 2.2 + w * 1.6) : Math.sin(x / 17 - w * 1.6 + Math.sin(x / 32) * 0.7);
        const tone = Math.min(6.8, Math.max(0, depth * (sea ? 0.58 : 0.95) + this.bed[y * W + x] - 0.8));
        const z = tone * 0.82 + (a + b) * (sea ? 0.08 : 0.18) + wave * (sea ? 0.2 : 0.35) + (det - 0.5) * (sea ? 0.18 : 0.4);
        const net = Math.abs(Math.sin((qx + warp + (det - 0.5) * 12) / 7) + Math.sin(qy / 7 + Math.sin(qx / 16) + (det - 0.5) * 2));
        const caustic = (net < 0.1 ? 0.5 : net < 0.2 ? 0.2 : 0) * defaults.clarity * Math.min(1, depth * 2) * range;
        const k = Math.min(8, Math.max(0, Math.floor(z + 1))), f = Math.floor((Math.max(0, z + 1) % 1) * steps) / steps;
        const c0 = ramp[k], c1 = ramp[Math.min(8, k + 1)], cl = ramp[Math.max(0, k - 3)], i = (y * W + x) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const base = c0[ch] + (c1[ch] - c0[ch]) * f;
          d[i + ch] = base + (cl[ch] - base) * caustic;
        }
        d[i + 3] = 255;
      }
    }
    g.putImageData(this.img, 0, 0, 0, top, W, bottom - top);
    // Glints twinkle and ride the current.
    for (const gl of this.glints) {
      const x = ((gl.x + t * (flow || 3)) % (W + 10) + W + 10) % (W + 10) - 5;
      const y = sim.farY + 4 + ((gl.y - sim.farY) % Math.max(1, sim.shoreY - sim.farY - 8));
      const tw = Math.sin(t * 1.7 + gl.p);
      if (tw < 0.35 || !sim.wet(x, y)) continue;
      g.fillStyle = css(this.water.glint, 0.15 + (tw - 0.35) * 0.6);
      g.fillRect(Math.round(x), Math.round(y), gl.len, 1);
    }
    if (flow) {
      g.fillStyle = css(this.water.glint, 0.12);
      for (let i = 0; i < 14; i++) {
        const y = sim.farY + 10 + ((i * 37) % Math.max(1, sim.shoreY - sim.farY - 16));
        const x = ((i * 53 + t * flow * 2.2) % (W + 60)) - 30;
        g.fillRect(Math.round(x), Math.round(y), 14 + (i % 3) * 6, 1);
      }
    }
  }

  private drawFloaters(g: CanvasRenderingContext2D, t: number) {
    const flow = this.water.flow || 2;
    for (const f of this.floaters) {
      const x = f.kind === "pad" ? f.x : ((f.x + t * flow * 0.8) % (W + 20) + W + 20) % (W + 20) - 10;
      const y = f.y + Math.sin(t + f.x) * 0.6;
      g.fillStyle = css(f.c);
      if (f.kind === "pad") {
        g.fillRect(Math.round(x) - 3, Math.round(y) - 1, 7, 3);
        g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
        g.fillStyle = css(shade(f.c, 0.7));
        g.fillRect(Math.round(x), Math.round(y) - 2, 1, 3);
      } else if (f.kind === "petal") {
        g.fillRect(Math.round(x), Math.round(y), 2, 1);
        g.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1);
      } else {
        g.fillRect(Math.round(x), Math.round(y), 3, 2);
        g.fillStyle = css(shade(f.c, 0.7));
        g.fillRect(Math.round(x) + 1, Math.round(y) + 2, 1, 1);
      }
    }
  }

  private drawFar(g: CanvasRenderingContext2D) {
    const sim = this.sim;
    if (sim.farY <= 0) return;
    if (!this.far) {
      const c = (this.far = document.createElement("canvas"));
      c.width = W;
      c.height = Math.ceil(sim.farY) + 10;
      const f = c.getContext("2d")!, L = this.land, r = sim.rand;
      f.fillStyle = css(L.ground);
      f.fillRect(0, 0, W, sim.farY + 2);
      for (let x = 0; x < W; x += 1) {
        const edge = Math.round(sim.farY + 1 + Math.sin(x * 0.13) * 1.2 + Math.sin(x * 0.041) * 1.5);
        f.fillStyle = css(L.ground);
        f.fillRect(x, 0, 1, edge);
        f.fillStyle = css(L.rim);
        f.fillRect(x, edge, 1, 1);
        f.fillStyle = css(shade(this.water.bands[2], 0.85), 0.6);
        f.fillRect(x, edge + 1, 1, 2);
      }
      // A line of trees or scrub along the far bank, and reeds at its foot.
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(r() * W), rad = 4 + Math.floor(r() * 5);
        f.fillStyle = css(L.tree2);
        f.beginPath(); f.ellipse(x, rad - 3, rad, rad * 0.75, 0, 0, Math.PI * 2); f.fill();
        f.fillStyle = css(L.tree);
        f.beginPath(); f.ellipse(x - 1, rad - 4, rad - 1, rad * 0.6, 0, 0, Math.PI * 2); f.fill();
      }
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(r() * W), h = 3 + Math.floor(r() * 4);
        f.fillStyle = css(L.reed);
        f.fillRect(x, sim.farY + 1 - h, 1, h);
      }
    }
    g.drawImage(this.far, 0, 0);
  }

  private drawFishShadows(g: CanvasRenderingContext2D) {
    const sim = this.sim, dark = shade(this.water.bands[0], 0.55);
    for (const f of sim.fish) {
      const sh = sim.shoals.find((s) => s.id === f.shoal);
      const fade = sh ? sh.fade : 1;
      const a = (0.9 - f.depth * 0.4) * fade;
      if (a <= 0.03) continue;
      const len = Math.round(Math.min(24, 7 + Math.log(f.kg + 1) * 4));
      const wide = f.kind.shape === "deep" || f.kind.shape === "flat" ? 0.42 : f.kind.shape === "long" ? 0.2 : 0.3;
      let hx = f.vx, hy = f.vy * 1.6;
      if (Math.hypot(hx, hy) < 0.5) { hx = Math.cos(f.id); hy = Math.sin(f.id) * 0.5; }
      const m = Math.hypot(hx, hy);
      const ux = hx / m, uy = hy / m;
      g.fillStyle = css(dark, a);
      for (let i = 0; i < len; i++) {
        const u = i / len;
        const half = Math.max(0.5, (len * wide / 2) * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)));
        const wag = u > 0.6 ? Math.sin(f.phase) * (u - 0.6) * 4 : 0;
        const cx = f.x - ux * (i - len * 0.4) - uy * wag, cy = f.y - uy * (i - len * 0.4) * 0.6 + ux * wag * 0.6;
        g.fillRect(Math.round(cx - uy * half * 0.3), Math.round(cy - half * 0.5), 1, Math.max(1, Math.round(half)));
      }
      if (f.kind.rarity === "legendary" && Math.sin(sim.t * 1.7 + f.phase) > .92) {
        g.fillStyle = css(f.kind.belly, .65 * fade);
        g.fillRect(Math.round(f.x), Math.round(f.y - 1), 2, 1);
        g.fillRect(Math.round(f.x + ux * 4), Math.round(f.y - uy * 2), 1, 1);
      }
    }
  }

  private drawRings(g: CanvasRenderingContext2D) {
    for (const r of this.sim.rings) {
      const a = (1 - r.age / r.life) * (r.light ? 0.5 : 0.8);
      g.strokeStyle = css(this.water.foam, a);
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(Math.round(r.x) + 0.5, Math.round(r.y) + 0.5, Math.max(1, r.r), Math.max(0.5, r.r * 0.45), 0, 0, Math.PI * 2);
      g.stroke();
    }
  }

  private line(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, sag: number, color: string) {
    const n = Math.max(4, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    g.fillStyle = color;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  private drawGear(g: CanvasRenderingContext2D, t: number) {
    const sim = this.sim, p = sim.phase, h = sim.hand;
    const lineCol = "rgba(236,228,200,0.85)";
    if (p.kind === "fly") {
      const u = Math.min(1, p.t / p.dur);
      const x = p.x0 + (p.x1 - p.x0) * u, y = p.y0 + (p.y1 - p.y0) * u - Math.sin(u * Math.PI) * Math.hypot(p.x1 - p.x0, p.y1 - p.y0) * 0.3;
      if (sim.gear === "line") {
        this.line(g, h.x, h.y, x, y, 3, lineCol);
        this.float(g, x, y, 0);
      } else this.netDisc(g, x, y, (sim.gear === "seine" ? 36 : 20) * (0.35 + u * 0.55), t * 9, 0.9);
      // Its shadow runs along the water below it.
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(Math.round(p.x0 + (p.x1 - p.x0) * u), Math.round(p.y0 + (p.y1 - p.y0) * u), 2, 1);
    } else if (p.kind === "wait") {
      if (!p.stripped) {
        this.line(g, h.x, h.y, p.x, p.y, 6, lineCol);
        const bob = p.bite !== undefined ? 3 : p.dip > 0 ? 1 : Math.round(Math.sin(t * 2.2) * 0.6 + 0.2);
        this.float(g, p.x, p.y, bob);
      } else this.line(g, h.x, h.y, p.x, p.y, 9, "rgba(236,228,200,0.45)");
    } else if (p.kind === "reel") {
      this.line(g, h.x, h.y, p.x, p.y, 4, lineCol);
      this.float(g, p.x, p.y, 0);
    } else if (p.kind === "fight") {
      const tense = p.tension;
      const col = tense > 0.8 ? `rgba(255,${Math.round(200 - tense * 120)},${Math.round(180 - tense * 140)},0.95)` : lineCol;
      const buzz = tense > 0.6 ? Math.sin(t * 90) * (tense - 0.6) * 3 : 0;
      this.line(g, h.x, h.y, p.x, p.y, (1 - tense) * 8 + buzz, col);
      // The fish under the surface, thrashing on a run, or clear of the water in a leap.
      const k = p.fish.kind, len = fishLength(p.fish.kg);
      if (p.air !== undefined) {
        const u = p.air / 0.6, s = fishSprite(k, len);
        g.save();
        g.translate(Math.round(p.x), Math.round(p.y - Math.sin(u * Math.PI) * (10 + len * 0.6)));
        g.rotate((u - 0.5) * 2.2);
        g.drawImage(s, -s.width / 2, -s.height / 2);
        g.restore();
        g.fillStyle = "rgba(220,236,240,0.85)";
        for (let i = 0; i < 4; i++) g.fillRect(Math.round(p.x - 6 + i * 4 + Math.sin(t * 20 + i) * 2), Math.round(p.y - 1 - Math.sin(u * Math.PI) * (2 + i)), 1, 1);
      } else if (p.run > 0 && Math.sin(t * 30) > 0.3) {
        const s = fishSprite(k, len);
        g.save();
        g.globalAlpha = 0.85;
        g.translate(Math.round(p.x), Math.round(p.y) - 2);
        if (Math.sin(t * 13) > 0) g.scale(-1, 1);
        g.drawImage(s, -s.width / 2, -s.height / 2);
        g.restore();
      } else {
        g.fillStyle = css(shade(this.water.bands[0], 0.5), 0.7);
        g.fillRect(Math.round(p.x - len / 3), Math.round(p.y), Math.round(len * 0.66), 2);
      }
    } else if (p.kind === "net") {
      const sink = p.hauling === undefined ? Math.min(1, p.age / 1.1) : 0;
      const k = p.hauling === undefined ? 0 : Math.min(1, p.hauling / (sim.gear === "seine" ? 1.5 : 0.9));
      const x = p.x + (h.x - p.x) * k * k, y = p.y + (h.y + 8 - p.y) * k * k;
      this.line(g, h.x, h.y, x, y, 2, lineCol);
      this.netDisc(g, x, y, p.r * (1 - k * 0.75), 0, 0.85 - sink * 0.45);
      for (const [i, f] of p.caught.entries()) {
        if ((Math.floor(t * 12) + i) % 3 === 0) continue;
        g.fillStyle = "rgba(220,232,236,0.9)";
        g.fillRect(Math.round(f.x), Math.round(f.y), 2, 1);
      }
    } else if (p.kind === "thrust") {
      const u = Math.min(1, p.t / 0.1), back = p.t > 0.3 ? Math.min(1, (p.t - 0.3) / 0.25) : 0;
      const sx = sim.px + 2, sy = sim.py - 18;
      const x = sx + (p.x - sx) * u * (1 - back), y = sy + (p.y - sy) * u * (1 - back);
      this.spear(g, sx, sy, x, y);
      if (p.hit && u >= 1) {
        const s = fishSprite(p.hit.kind, fishLength(p.hit.kg));
        g.drawImage(s, Math.round(x - s.width / 2 + Math.sin(t * 40)), Math.round(y - s.height));
      }
    }
  }

  private float(g: CanvasRenderingContext2D, x: number, y: number, under: number) {
    const X = Math.round(x), Y = Math.round(y);
    if (under >= 3) {
      g.fillStyle = "rgba(200,60,40,0.5)";
      g.fillRect(X - 1, Y, 2, 1);
      return;
    }
    g.fillStyle = "#e9dcb4";
    g.fillRect(X - 1, Y - 2 + under, 3, 1);
    g.fillStyle = "#c8442e";
    g.fillRect(X - 1, Y - 3 + under, 3, 1);
    g.fillRect(X, Y - 4 + under, 1, 1);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(X - 1, Y, 3, 1);
  }

  private netDisc(g: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number, a: number) {
    if (r < 1) return;
    g.save();
    g.beginPath();
    g.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = `rgba(40,56,58,${a * 0.18})`;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.fillStyle = `rgba(214,206,176,${a * 0.55})`;
    const step = 3, off = Math.round(spin) % step;
    for (let i = -r; i <= r; i += step) {
      g.fillRect(Math.round(x + i + off), Math.round(y - r), 1, Math.round(r * 2));
      g.fillRect(Math.round(x - r), Math.round(y + (i + off) * 0.5), Math.round(r * 2), 1);
    }
    g.restore();
    // Lead weights round the rim.
    g.fillStyle = `rgba(70,70,74,${a})`;
    const n = Math.max(8, Math.round(r * 0.8));
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + spin * 0.2;
      g.fillRect(Math.round(x + Math.cos(ang) * r), Math.round(y + Math.sin(ang) * r * 0.5), 1, 1);
    }
  }

  private spear(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    // The shaft reaches back past the hand, then the head.
    this.line(g, x0 - ux * 14, y0 - uy * 14, x1, y1, 0, "#8a6a42");
    g.fillStyle = "#c9cfd2";
    g.fillRect(Math.round(x1), Math.round(y1), 1, 1);
    g.fillRect(Math.round(x1 - ux * 2), Math.round(y1 - uy * 2), 1, 1);
  }

  private drawLeaps(g: CanvasRenderingContext2D) {
    for (const l of this.sim.leaps) {
      const u = Math.min(1, l.age / l.dur);
      const x = l.x0 + (l.x1 - l.x0) * u, y = l.y0 + (l.y1 - l.y0) * u - Math.sin(u * Math.PI) * l.h;
      const s = fishSprite(l.fish, 9);
      g.save();
      g.translate(Math.round(x), Math.round(y));
      if (l.x1 < l.x0) g.scale(-1, 1);
      g.rotate((u - 0.5) * 1.6);
      g.drawImage(s, -s.width / 2, -s.height / 2);
      g.restore();
    }
  }

  private drawNear(g: CanvasRenderingContext2D, t: number) {
    const sim = this.sim, L = this.land;
    if (sim.setup.afloat) return this.drawBoat(g, t);
    if (!this.bank) {
      const c = (this.bank = document.createElement("canvas"));
      c.width = W;
      c.height = H - sim.shoreY + 8;
      const b = c.getContext("2d")!, r = sim.rand;
      for (let x = 0; x < W; x++) {
        const edge = Math.round(4 + Math.sin(x * 0.09) * 1.4 + Math.sin(x * 0.023 + 1) * 2);
        // Wet margin, a darker lip, then the bank catching the light along its edge.
        b.fillStyle = css(mix(this.water.bands[3], L.ground, 0.45));
        b.fillRect(x, edge - 1, 1, 2);
        b.fillStyle = css(shade(L.ground, 0.78));
        b.fillRect(x, edge + 1, 1, 1);
        b.fillStyle = css(L.ground);
        b.fillRect(x, edge + 2, 1, c.height);
        if ((x * 7) % 5 < 3) {
          b.fillStyle = css(shade(L.ground, 1.12));
          b.fillRect(x, edge + 2, 1, 1);
        }
      }
      for (let i = 0; i < 160; i++) {
        const x = Math.floor(r() * W), y = 9 + Math.floor(r() * (c.height - 9));
        b.fillStyle = css(r() < 0.5 ? L.ground2 : shade(L.ground, 1.12));
        if (L.kind === "rock") b.fillRect(x, y, 3, 2);
        else if (L.kind === "sand") b.fillRect(x, y, 1, 1);
        else { b.fillRect(x, y, 1, 2); b.fillRect(x + 1, y - 1, 1, 2); }
      }
      if (L.kind === "rock")
        for (let i = 0; i < 9; i++) {
          const x = Math.floor(r() * W), y = 6 + Math.floor(r() * 10), w = 5 + Math.floor(r() * 8);
          b.fillStyle = css(0x6e6e66);
          b.fillRect(x, y, w, 4);
          b.fillStyle = css(0x8e8e84);
          b.fillRect(x + 1, y, w - 2, 1);
          b.fillStyle = css(0x4a4a44);
          b.fillRect(x, y + 4, w, 1);
        }
    }
    // Water laps at the foot of the bank.
    const lap = Math.sin(t * 1.3) * 0.8;
    g.fillStyle = css(this.water.foam, 0.55);
    for (let x = 0; x < W; x += 2) {
      const y = sim.shoreY + 2 + Math.round(Math.sin(x * 0.09) * 1.4 + Math.sin(x * 0.023 + 1) * 2 + lap);
      if ((x + Math.floor(t * 4)) % 9 < 6) g.fillRect(x, y, 2, 1);
    }
    g.drawImage(this.bank, 0, sim.shoreY - 2);
    // Reeds sway at both ends of the bank.
    for (const side of [0, 1]) {
      for (let i = 0; i < 16; i++) {
        const bx = side ? W - 8 - i * 3 - (i % 3) * 2 : 4 + i * 3 + (i % 3) * 2;
        if (bx > 70 && bx < W - 70) continue;
        const hgt = 10 + ((i * 7) % 9) + (L.kind === "mud" ? 8 : 0);
        const sway = Math.sin(t * 1.4 + i * 0.7) * (1 + this.sim.setup.wind * 2);
        for (let y = 0; y < hgt; y++) {
          const x = Math.round(bx + (sway * y) / hgt);
          g.fillStyle = css(y > hgt - 3 ? L.reedTip : L.reed);
          g.fillRect(x, sim.shoreY + 6 - y, 1, 1);
        }
        if (L.kind === "mud" && i % 2 === 0) {
          // Papyrus heads: a little burst of green at the top.
          const x = Math.round(bx + sway);
          g.fillStyle = css(L.reedTip);
          g.fillRect(x - 2, sim.shoreY + 6 - hgt, 5, 1);
          g.fillRect(x - 1, sim.shoreY + 5 - hgt, 3, 1);
        }
      }
    }
    this.basket(g, sim.px + 24, sim.py + 2);
    for (const f of this.flies) {
      const x = f.x + Math.sin(t * 2.3 + f.p) * 30 + Math.sin(t * 7 + f.p) * 3;
      const y = f.y + Math.cos(t * 1.7 + f.p) * 12;
      g.fillStyle = "#4aa8d8";
      g.fillRect(Math.round(x), Math.round(y), 3, 1);
      if (Math.floor(t * 20 + f.p) % 2) { g.fillStyle = "rgba(230,240,255,0.7)"; g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1); }
    }
  }

  /** A wicker creel that fills: tails stand up over the rim as the catch grows. */
  private basket(g: CanvasRenderingContext2D, x: number, y: number) {
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(x - 6, y, 13, 2);
    const tails = this.sim.caught.slice(-7);
    for (const [i, c] of tails.entries()) {
      const tx = x - 4 + ((i * 5) % 9), ty = y - 13 - (i % 3);
      g.fillStyle = css(c.kind.back);
      g.fillRect(tx, ty + 1, 1, 3);
      g.fillStyle = css(c.kind.fin);
      g.fillRect(tx - 1, ty, 3, 1);
    }
    // Rounded wicker body, darker at the base, with the weave in alternate rows.
    const rows = [9, 11, 11, 11, 11, 11, 10, 9];
    for (const [r, w] of rows.entries()) {
      const left = x - Math.floor(w / 2);
      g.fillStyle = r < 2 ? "#a07a44" : r > 5 ? "#5e4224" : "#7e5a32";
      g.fillRect(left, y - 9 + r, w, 1);
      g.fillStyle = r < 2 ? "#c09a5a" : "#9a7444";
      for (let i = (r % 2) * 2; i < w; i += 4) g.fillRect(left + i, y - 9 + r, 2, 1);
    }
    g.fillStyle = "#4a321c";
    g.fillRect(x - 4, y - 10, 9, 1);
    g.fillStyle = "#c09a5a";
    g.fillRect(x - 3, y - 11, 7, 1);
  }

  private drawBoat(g: CanvasRenderingContext2D, t: number) {
    const sim = this.sim, hull = sim.setup.hull ?? "plank";
    const bob = Math.round(Math.sin(t * 1.6) * 0.8), cx = sim.px, top = sim.py - 46 + bob, bottom = H + 6;
    const look: Record<string, { side: number; inner: number; rim: number; w: number; bow: number }> = {
      plank: { side: 0x7a5432, inner: 0xa47a4c, rim: 0x4a2e1a, w: 46, bow: 26 },
      dugout: { side: 0x6a4a2c, inner: 0x94704a, rim: 0x3e2a18, w: 26, bow: 20 },
      reed: { side: 0xb4a45c, inner: 0xcab86c, rim: 0x7a6a38, w: 36, bow: 30 },
      bark: { side: 0xe4e0d0, inner: 0xa8805a, rim: 0x3a2e24, w: 30, bow: 24 },
      hide: { side: 0x5a4030, inner: 0x86644a, rim: 0x2e2014, w: 34, bow: 20 },
      raft: { side: 0x8a6a40, inner: 0xa4844e, rim: 0x4e3a22, w: 46, bow: 0 },
    };
    const L = look[hull] ?? look.plank;
    const half = (y: number) => {
      const u = (y - top) / Math.max(1, L.bow);
      if (hull === "raft" || u >= 1) return L.w / 2;
      // Reed bundles run to a long, thin, upturned point.
      return Math.max(0, Math.round((L.w / 2) * Math.pow(Math.max(0, u), hull === "reed" ? 1.1 : 0.6)));
    };
    g.fillStyle = "rgba(0,0,0,0.2)";
    for (let y = top + 3; y < bottom; y++) {
      const w = half(y - 3);
      if (w > 0) g.fillRect(cx - w + 3, y, w * 2, 1);
    }
    for (let y = top; y < bottom; y++) {
      const w = half(y);
      if (w <= 0) continue;
      const wall = hull === "raft" ? 0 : hull === "reed" ? 4 : 2;
      g.fillStyle = css(L.rim);
      g.fillRect(cx - w, y, w * 2, 1);
      g.fillStyle = css(L.side);
      g.fillRect(cx - w + 1, y, w * 2 - 2, 1);
      if (w - wall - 1 > 0 && y > top + 3) {
        g.fillStyle = css(shade(L.rim, 1.3));
        g.fillRect(cx - w + wall + 1, y, 1, 1);
        g.fillStyle = css(L.inner);
        g.fillRect(cx - w + wall + 2, y, (w - wall - 2) * 2, 1);
      }
      // Light along the gunwale.
      g.fillStyle = css(shade(L.side, 1.25));
      g.fillRect(cx - w + 1, y, 1, 1);
    }
    const W2 = L.w / 2;
    if (hull === "plank" || hull === "dugout" || hull === "hide") {
      // Floorboards along the length, a thwart, and the oars shipped along the sides.
      g.fillStyle = css(shade(L.inner, 0.86));
      for (let x = cx - W2 + 8; x < cx + W2 - 6; x += 5) g.fillRect(x, top + L.bow, 1, bottom - top - L.bow);
      g.fillStyle = css(L.rim);
      g.fillRect(cx - W2 + 2, top + L.bow + 4, L.w - 4, 3);
      g.fillStyle = css(shade(L.side, 1.15));
      g.fillRect(cx - W2 + 2, top + L.bow + 4, L.w - 4, 1);
      if (hull === "plank") {
        g.fillStyle = "#b8925e";
        for (const sx of [-1, 1]) {
          g.fillRect(cx + sx * (W2 - 4), top + L.bow - 2, 1, 40);
          g.fillRect(cx + sx * (W2 - 4) - 1, top + L.bow + 34, 3, 8);
        }
      }
    } else if (hull === "reed") {
      g.fillStyle = css(L.rim);
      for (let y = top + 8; y < bottom; y += 7) g.fillRect(cx - half(y), y, half(y) * 2, 1);
      // The upturned prow, tied off.
      g.fillStyle = css(L.side);
      g.fillRect(cx - 1, top - 8, 3, 9);
      g.fillStyle = css(L.rim);
      g.fillRect(cx - 1, top - 5, 3, 1);
      g.fillRect(cx - 1, top - 2, 3, 1);
    } else if (hull === "raft") {
      g.fillStyle = css(L.rim);
      for (let x = cx - W2 + 6; x < cx + W2; x += 6) g.fillRect(x, top, 1, bottom - top);
      g.fillRect(cx - W2, top + 8, L.w, 2);
      g.fillRect(cx - W2, top + 40, L.w, 2);
    } else if (hull === "bark") {
      g.fillStyle = css(0x3a2e24);
      for (let y = top + 6; y < bottom; y += 6) for (const sx of [-1, 1]) g.fillRect(cx + sx * (half(y) - 1) - (sx > 0 ? 2 : 0), y, 3, 1);
    }
    // The catch in the bottom of the boat, behind the fisher.
    for (const [i, c] of this.sim.caught.slice(-12).entries()) {
      const s = fishSprite(c.kind, 9);
      g.drawImage(s, cx - 14 + (i % 4) * 7, sim.py + 4 + Math.floor(i / 4) * 4);
    }
    g.fillStyle = css(this.water.foam, 0.6);
    for (let y = top + 2; y < bottom; y += 3) {
      if ((y + Math.floor(t * 5)) % 4) continue;
      const w = half(y);
      if (w <= 0) continue;
      g.fillRect(cx - w - 2, y, 1, 1);
      g.fillRect(cx + w + 1, y, 1, 1);
    }
  }

  private drawPlayer(g: CanvasRenderingContext2D, t: number) {
    const sim = this.sim, spec = POSES[sim.pose.name];
    const elapsed = (t - sim.pose.at) * 1000;
    const i = spec.loop ? Math.floor(elapsed / spec.ms) % 4 : Math.min(3, Math.floor(elapsed / spec.ms));
    const f = this.frame(spec.pose, i) ?? this.frame("idle", 0);
    const bob = sim.setup.afloat ? Math.round(Math.sin(t * 1.6) * 0.8) : 0;
    if (!f) {
      g.fillStyle = "#3a2e2a";
      g.fillRect(sim.px - 4, sim.py - 26 + bob, 8, 26);
      return;
    }
    if (!sim.setup.afloat) {
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.beginPath(); g.ellipse(sim.px, sim.py, 7, 2, 0, 0, Math.PI * 2); g.fill();
    }
    g.drawImage(f.c, f.x0, f.y0, f.w, f.h, Math.round(sim.px - f.w / 2), Math.round(sim.py - f.h + bob), f.w, f.h);
  }

  private drawLanded(g: CanvasRenderingContext2D) {
    const sim = this.sim;
    const to = sim.setup.afloat ? { x: sim.px - 4, y: sim.py + 12 } : { x: sim.px + 24, y: sim.py - 10 };
    for (const l of sim.landed) {
      if (l.age < 0) continue;
      const u = Math.min(1, l.age / l.dur);
      const x = l.x + (to.x - l.x) * u, y = l.y + (to.y - l.y) * u - Math.sin(u * Math.PI) * 26;
      const icon = l.find && voxelIcon(l.find), s = icon || fishSprite(l.kind, fishLength(l.kg));
      g.save();
      g.translate(Math.round(x), Math.round(y));
      g.rotate(l.spin * u * Math.PI * 2);
      if (icon) g.drawImage(icon, -7, -7, 14, 14);
      else g.drawImage(s, -s.width / 2, -s.height / 2);
      g.restore();
      for (let i = 0; i < (l.stars ?? 0); i++) this.star(g, Math.round(x) - 3 + i * 7, Math.round(y) - 10 - Math.round(Math.sin(l.age * 8 + i) * 1.5));
      // Sparkle on the way.
      if (Math.floor(l.age * 20) % 2) {
        g.fillStyle = "#fff7d0";
        g.fillRect(Math.round(x) + 4, Math.round(y) - 5, 1, 1);
        g.fillRect(Math.round(x) - 5, Math.round(y) + 3, 1, 1);
      }
    }
  }

  private star(g: CanvasRenderingContext2D, x: number, y: number) {
    g.fillStyle = "#7a5410";
    g.fillRect(x - 2, y, 5, 1);
    g.fillRect(x, y - 2, 1, 5);
    g.fillStyle = "#f8d860";
    g.fillRect(x - 1, y, 3, 1);
    g.fillRect(x, y - 1, 1, 3);
    g.fillStyle = "#fffbe0";
    g.fillRect(x, y, 1, 1);
  }

  /** Traps, weirs and nets the player has set, a ghost of the one being placed, and the rope of a haul. */
  private drawSets(g: CanvasRenderingContext2D, t: number) {
    const sim = this.sim, h = sim.hand;
    for (const s of sim.sets) {
      const k = s.haul === undefined ? 0 : Math.min(1, s.haul / 1.1) ** 2;
      const x = s.x + (h.x - s.x) * k, y = s.y + (h.y + 6 - s.y) * k;
      if (s.haul !== undefined) this.line(g, h.x, h.y, x, y, 1, "rgba(200,180,140,0.9)");
      this.setPiece(g, s.kind, x, y, t, s, 1);
    }
    if (sim.placing && sim.pointer) {
      const at = sim.spot(sim.placing, sim.pointer.x, sim.pointer.y);
      g.save();
      g.globalAlpha = 0.45 + Math.sin(t * 6) * 0.12;
      this.setPiece(g, sim.placing, at.x, at.y, t, undefined, at.ok ? 1 : 0);
      g.restore();
    }
  }

  private setPiece(g: CanvasRenderingContext2D, kind: SetKind, x: number, y: number, t: number, s: SetGear | undefined, ok: number) {
    const X = Math.round(x), Y = Math.round(y), tw = s ? s.twitch : 0, full = s && s.holds.length >= SET_MAX[kind];
    const bob = Math.round(Math.sin(t * 2 + X) * 0.6 + tw * Math.sin(t * 30) * 1.5);
    const wood = ok ? "#7a5530" : "#a03a2a", light = ok ? "#b08850" : "#d06050";
    // What it holds flickers under the surface.
    for (const [i, f] of (s?.holds ?? []).entries()) {
      if ((Math.floor(t * 9 + f.ph) + i) % 4 === 0) continue;
      g.fillStyle = f.find ? "rgba(190,180,150,0.8)" : "rgba(226,238,240,0.85)";
      g.fillRect(X + Math.round(f.dx + Math.sin(t * 7 + f.ph)), Y + Math.round(f.dy) + 1, 2, 1);
    }
    if (kind === "pot") {
      g.fillStyle = "rgba(0,0,0,0.2)";
      g.fillRect(X - 2, Y + 2, 6, 1);
      g.fillStyle = wood;
      g.fillRect(X - 2, Y - 2 + bob, 5, 4);
      g.fillStyle = light;
      g.fillRect(X - 1, Y - 3 + bob, 3, 1);
      g.fillRect(X - 2, Y - 1 + bob, 1, 1);
      g.fillStyle = "#e8dcc0";
      g.fillRect(X, Y - 5 + bob, 1, 2);
    } else if (kind === "weir") {
      // A V of stakes and wattle pointing out from the bank, a basket at the point.
      for (let i = -12; i <= 12; i += 2) {
        const top = Math.round(Y - 2 + Math.abs(i) * 0.7);
        g.fillStyle = wood;
        g.fillRect(X + i, top - 3, 1, 5);
        if (i % 4 === 0) {
          g.fillStyle = light;
          g.fillRect(X + i, top - 4, 1, 1);
        }
      }
      g.fillStyle = light;
      for (let i = -12; i < 12; i++) g.fillRect(X + i, Math.round(Y - 3 + Math.abs(i + 0.5) * 0.7), 1, 1);
      g.fillStyle = "#5e4224";
      g.fillRect(X - 3, Y - 6, 7, 5);
      g.fillStyle = "#9a7444";
      for (let i = 0; i < 7; i += 2) g.fillRect(X - 3 + i, Y - 6, 1, 5);
      g.fillStyle = "rgba(230,240,240,0.6)";
      g.fillRect(X - 13, Y + 2, 26, 1);
    } else {
      g.fillStyle = "rgba(220,214,190,0.5)";
      for (let i = -22; i <= 22; i++) g.fillRect(X + i, Y + Math.round(Math.sin(t * 1.5 + i * 0.3) * 0.5), 1, 1);
      for (let i = -22; i <= 22; i += 6) {
        const yy = Y + Math.round(Math.sin(t * 1.5 + i * 0.3) * 0.5 + (tw && Math.abs(i) < 8 ? Math.sin(t * 30) : 0));
        g.fillStyle = ok ? "#c89a4a" : "#d06050";
        g.fillRect(X + i - 1, yy - 1, 3, 2);
        g.fillStyle = ok ? "#f0d090" : "#f09080";
        g.fillRect(X + i - 1, yy - 1, 2, 1);
      }
    }
    if (full && s.haul === undefined) {
      const hop = Math.round(Math.abs(Math.sin(t * 5)) * 2);
      g.fillStyle = "#2a1a08";
      g.fillRect(X - 1, Y - 13 - hop, 3, 6);
      g.fillStyle = "#f8d860";
      g.fillRect(X, Y - 12 - hop, 1, 3);
      g.fillRect(X, Y - 8 - hop, 1, 1);
    }
  }

  /** The bank cat, in a coat picked by the day's seed. */
  private drawCat(g: CanvasRenderingContext2D, t: number) {
    const c = this.sim.cat;
    if (!c) return;
    const coat = [[0xd8873a, 0xf0b070], [0x6a6a70, 0x9a9aa4], [0x2a2622, 0x4a4440], [0x8a6a4a, 0xc8a878]][this.catCoat];
    const X = Math.round(c.x), Y = Math.round(c.y), d = c.dir < 0 ? -1 : 1;
    const px = (col: number, x: number, y: number, w = 1, h = 1) => {
      g.fillStyle = css(col);
      g.fillRect(d > 0 ? X + x : X - x - w + 1, Y + y, w, h);
    };
    g.fillStyle = "rgba(0,0,0,0.22)";
    g.fillRect(X - 5, Y, 11, 1);
    const [fur, pale] = coat;
    if (c.mode === "walk" || c.mode === "run") {
      const step = Math.floor(t * (c.mode === "run" ? 16 : 8)) % 2;
      px(fur, -4, -5, 8, 3);
      px(pale, -3, -3, 6, 1);
      px(fur, -4, -2 + step, 1, 2 - step);
      px(fur, -2, -2 + (1 - step), 1, 1 + step);
      px(fur, 1, -2 + step, 1, 2 - step);
      px(fur, 3, -2 + (1 - step), 1, 1 + step);
      px(fur, 3, -8, 4, 3);
      px(fur, 3, -9);
      px(fur, 6, -9);
      px(0x151515, 5, -7);
      px(fur, -6, -7 + Math.round(Math.sin(t * 6)), 2, 1);
      px(fur, -5, -6, 1, 1);
    } else if (c.mode === "sleep") {
      px(fur, -4, -4, 9, 4);
      px(pale, -3, -2, 7, 1);
      px(fur, 3, -5, 3, 2);
      px(fur, 5, -6);
      px(pale, -5, -2, 9, 1);
      const z = (t * 0.6) % 1;
      g.fillStyle = `rgba(240,240,255,${1 - z})`;
      g.fillRect(X + 4 + Math.round(z * 4), Y - 9 - Math.round(z * 8), 3, 1);
      g.fillRect(X + 6 + Math.round(z * 4), Y - 10 - Math.round(z * 8), 1, 1);
      g.fillRect(X + 4 + Math.round(z * 4), Y - 11 - Math.round(z * 8), 3, 1);
    } else {
      const eat = c.mode === "eat", nod = eat ? Math.round(Math.abs(Math.sin(t * 8))) : 0;
      px(fur, -2, -7, 5, 7);
      px(pale, 0, -5, 2, 4);
      px(fur, -4, -1, 3, 1);
      px(fur, -5, -3 + Math.round(Math.sin(t * 2)), 1, 3);
      px(fur, -1, -11 + (eat ? 3 + nod : 0), 5, 4);
      px(fur, -1, -12 + (eat ? 3 + nod : 0));
      px(fur, 3, -12 + (eat ? 3 + nod : 0));
      if (!eat) {
        const blink = Math.sin(t * 0.9) > 0.97;
        px(blink ? fur : 0x9ad040, 0, -10, 1, 1);
        px(blink ? fur : 0x9ad040, 2, -10, 1, 1);
      } else {
        px(0xb8c8d0, 3, -2, 4, 1);
        const up = (t * 0.7) % 1;
        g.fillStyle = `rgba(240,110,130,${1 - up})`;
        const hx = X + 2 * d, hy = Y - 14 - Math.round(up * 8);
        g.fillRect(hx - 1, hy, 1, 1);
        g.fillRect(hx + 1, hy, 1, 1);
        g.fillRect(hx - 1, hy + 1, 3, 1);
        g.fillRect(hx, hy + 2, 1, 1);
      }
    }
  }

  /** Fireflies on a summer evening, and a lantern's glow round the player after dark. */
  private drawNightLife(g: CanvasRenderingContext2D, t: number) {
    const sim = this.sim, h = ((sim.hour % 24) + 24) % 24, dark = h >= 20 || h < 5, dusk = h >= 18.5 && h < 23.5;
    if (dark) {
      const lx = sim.px + 6, ly = sim.py - 12, flick = 1 + Math.sin(t * 9) * 0.04 + Math.sin(t * 23) * 0.03;
      g.save();
      g.globalCompositeOperation = "lighter";
      const glow = g.createRadialGradient(lx, ly, 1, lx, ly, 46 * flick);
      glow.addColorStop(0, "rgba(255,190,90,0.45)");
      glow.addColorStop(0.4, "rgba(255,150,60,0.14)");
      glow.addColorStop(1, "rgba(255,140,60,0)");
      g.fillStyle = glow;
      g.fillRect(lx - 50, ly - 50, 100, 100);
      g.restore();
      g.fillStyle = "#3a2a18";
      g.fillRect(Math.round(lx) - 1, Math.round(ly) - 2, 3, 4);
      g.fillStyle = "#ffe0a0";
      g.fillRect(Math.round(lx), Math.round(ly) - 1, 1, 2);
    }
    if (dusk && sim.setup.season === "summer" && !sim.setup.snow) {
      for (let i = 0; i < 14; i++) {
        const on = Math.sin(t * (0.7 + (i % 5) * 0.13) + i * 2.1);
        if (on < 0.4) continue;
        const x = (i * 71 + Math.sin(t * 0.3 + i) * 18 + 400) % W, y = sim.shoreY + 4 + ((i * 37) % Math.max(8, H - sim.shoreY - 10)) + Math.sin(t * 0.8 + i * 3) * 5;
        g.fillStyle = `rgba(220,255,140,${(on - 0.4) * 1.6})`;
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
        g.fillStyle = `rgba(200,255,120,${(on - 0.4) * 0.35})`;
        g.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
        g.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
      }
    }
  }

  private drawDrops(g: CanvasRenderingContext2D) {
    for (const d of this.sim.drops) {
      g.fillStyle = css(d.color, 0.9);
      g.fillRect(Math.round(d.x), Math.round(d.y - d.z * 0.5), 1, 1);
    }
  }

  private drawBirds(g: CanvasRenderingContext2D) {
    for (const b of this.sim.birds) {
      if (b.standing) {
        const x = Math.round(b.x), y = Math.round(b.y), dir = b.x < W / 2 ? 1 : -1;
        const egret = b.kind === "egret";
        const body = egret ? "#f2f0e8" : "#8a949c", dark = egret ? "#c8c4b8" : "#5a646c";
        g.fillStyle = "#3a3a30";
        g.fillRect(x, y - 6, 1, 6);
        g.fillRect(x + 2, y - 6, 1, 6);
        g.fillStyle = body;
        g.fillRect(x - 2, y - 11, 7, 5);
        g.fillStyle = dark;
        g.fillRect(x - 2, y - 7, 6, 1);
        const reach = b.strike !== undefined ? Math.sin(Math.min(1, b.strike / 0.25) * Math.PI) * 6 : 0;
        const nx = x + 2 + dir * (2 + reach), ny = y - 15 + reach;
        g.fillStyle = body;
        g.fillRect(nx, ny, 2, 5);
        g.fillRect(nx - dir, ny - 1, 3, 2);
        g.fillStyle = "#d8b040";
        g.fillRect(nx + dir * 2, ny, 3 * dir, 1);
        continue;
      }
      const x = Math.round(b.x), y = Math.round(b.y - b.z);
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(Math.round(b.x) - 1, Math.round(b.y), 3, 1);
      const up = Math.sin(b.phase) > 0;
      g.fillStyle = b.kind === "gull" ? "#e8eaea" : "#f6f6f2";
      if (b.dive !== undefined && b.dive < 0.35) {
        g.fillRect(x, y - 2, 1, 3);
        g.fillRect(x - 1, y - 2, 3, 1);
      } else {
        g.fillRect(x, y, 1, 1);
        g.fillRect(x - 2, y + (up ? -1 : 0), 2, 1);
        g.fillRect(x + 1, y + (up ? -1 : 0), 2, 1);
        g.fillStyle = "#2a2a2a";
        g.fillRect(x, y - 1, 1, 1);
      }
    }
  }

  private drawAimAndMeters(g: CanvasRenderingContext2D, t: number) {
    const sim = this.sim, p = sim.phase;
    if (p.kind === "aim" && sim.gear !== "spear") {
      const power = sim.power();
      const to = sim.target(p.charging === undefined ? 0.5 : power);
      const h = sim.hand;
      // A dotted arc to where it would land.
      for (let i = 1; i < 12; i++) {
        const u = i / 12;
        const x = h.x + (to.x - h.x) * u, y = h.y + (to.y - h.y) * u - Math.sin(u * Math.PI) * Math.hypot(to.x - h.x, to.y - h.y) * 0.3;
        if ((i + Math.floor(t * 8)) % 2) continue;
        g.fillStyle = "rgba(255,248,220,0.55)";
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      const r = sim.gear === "line" ? 3 : sim.gear === "seine" ? 36 : 20;
      g.strokeStyle = `rgba(255,248,220,${0.45 + Math.sin(t * 6) * 0.15})`;
      g.beginPath(); g.ellipse(Math.round(to.x) + 0.5, Math.round(to.y) + 0.5, r, r * 0.5, 0, 0, Math.PI * 2); g.stroke();
      if (p.charging !== undefined) {
        // The power bar beside the player; the top notch is a perfect cast.
        const bx = sim.px - 18, by = sim.py - 34, bh = 26;
        g.fillStyle = "#1d1410";
        g.fillRect(bx - 1, by - 1, 5, bh + 2);
        g.fillStyle = "#3a2c24";
        g.fillRect(bx, by, 3, bh);
        const fill = Math.round(power * bh);
        g.fillStyle = power > 0.92 ? "#fff3a0" : power > 0.66 ? "#e8b040" : "#7ac050";
        g.fillRect(bx, by + bh - fill, 3, fill);
        g.fillStyle = "#fff3a0";
        g.fillRect(bx - 1, by + 1, 5, 1);
      }
    }
    if (p.kind === "aim" && sim.gear === "spear") {
      const at = sim.spearPoint();
      g.fillStyle = "rgba(255,248,220,0.8)";
      const x = Math.round(at.x), y = Math.round(at.y);
      g.fillRect(x - 3, y, 2, 1); g.fillRect(x + 2, y, 2, 1);
      g.fillRect(x, y - 2, 1, 1); g.fillRect(x, y + 2, 1, 1);
      this.spear(g, sim.px + 2, sim.py - 18, sim.px + 2 + (at.x - sim.px) * 0.18, sim.py - 18 + (at.y - sim.py + 18) * 0.18);
    }
    if (p.kind === "fight") {
      // Tension, over the player's head: green is safe, red snaps.
      const bx = sim.px - 14, by = sim.py - 50, bw = 28;
      const wob = p.tension > 0.8 ? Math.round(Math.sin(t * 60)) : 0;
      g.fillStyle = "#1d1410";
      g.fillRect(bx - 1 + wob, by - 1, bw + 2, 5);
      g.fillStyle = "#3a2c24";
      g.fillRect(bx + wob, by, bw, 3);
      const fill = Math.round(Math.min(1, p.tension) * bw);
      g.fillStyle = p.tension > 0.8 ? "#e04a3a" : p.tension > 0.55 ? "#e8b040" : "#7ac050";
      g.fillRect(bx + wob, by, fill, 3);
      // How much fight is left in it.
      const left = Math.max(0, Math.min(1, p.stamina / (0.6 + p.fish.kind.fight * 3.2 + Math.log(p.fish.kg + 1) * 1.1)));
      g.fillStyle = "#a8d8e8";
      g.fillRect(bx + wob, by + 4, Math.round(left * bw), 1);
    }
    if (sim.shout && sim.t - sim.shout.at < 1.1) {
      const age = sim.t - sim.shout.at;
      const y = sim.py - 52 - Math.min(6, age * 20);
      if (sim.shout.tone === "bite") {
        const pop = age < 0.12 ? 1 + (0.12 - age) * 6 : 1;
        g.fillStyle = "#1d1410";
        g.fillRect(sim.px - 3, y - 2, 7, Math.round(11 * pop));
        g.fillStyle = "#fff3a0";
        g.fillRect(sim.px - 2, y - 1, 5, Math.round(6 * pop));
        g.fillRect(sim.px - 2, y + 6, 5, 2);
        g.fillStyle = "#e04a3a";
        g.fillRect(sim.px - 1, y, 3, Math.round(4 * pop));
        g.fillRect(sim.px - 1, y + 6, 3, 1);
      }
    }
  }

  private drawWeather(g: CanvasRenderingContext2D, t: number) {
    const s = this.sim.setup;
    if (s.rain > 0) {
      g.fillStyle = `rgba(210,224,236,${0.25 + s.rain * 0.3})`;
      const n = Math.round(30 + s.rain * 120);
      for (let i = 0; i < n; i++) {
        const x = (i * 73 + t * 40 * (1 + s.wind)) % W, y = (i * 131 + t * 260) % H;
        g.fillRect(Math.round(x), Math.round(y), 1, 3);
      }
    }
    if (s.snow) {
      g.fillStyle = "rgba(246,248,250,0.85)";
      for (let i = 0; i < 60; i++) {
        const x = (i * 59 + Math.sin(t + i) * 6 + t * 8) % W, y = (i * 97 + t * 22) % H;
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    if (s.mist) {
      for (let i = 0; i < 4; i++) {
        g.fillStyle = "rgba(226,232,232,0.12)";
        g.fillRect(0, Math.round(20 + i * 30 + Math.sin(t * 0.2 + i) * 6), W, 14);
      }
    }
  }

  private drawLight(g: CanvasRenderingContext2D, t: number) {
    const L = light(this.sim.hour);
    if (L.sun !== undefined) {
      // A road of broken light on the water, widening toward the viewer.
      const sx = W * L.sun, top = Math.max(2, this.sim.farY + 4);
      for (let y = top; y < this.sim.shoreY - 4; y++) {
        const spread = 6 + (y - top) * 0.35;
        for (let k = 0; k < 3; k++) {
          const seed = Math.sin(y * 12.9898 + k * 78.233 + Math.floor(t * 2.5 + k) * 3.1) * 43758.5453;
          const u = seed - Math.floor(seed);
          if (u > 0.55) continue;
          const w = 1 + Math.floor(u * 7);
          g.fillStyle = `rgba(255,${200 + Math.floor(u * 40)},140,${0.12 + (1 - u) * 0.22})`;
          g.fillRect(Math.round(sx + (u * 2 - 1) * spread - w / 2), y, w, 1);
        }
      }
    }
    g.save();
    g.globalCompositeOperation = "multiply";
    g.fillStyle = css(L.tint, L.a * 2 > 1 ? 1 : L.a * 2);
    if (L.a > 0.05) g.fillRect(0, 0, W, H);
    g.restore();
    if (L.a >= 0.38) {
      // A little moonlight on the water.
      g.fillStyle = "rgba(220,230,255,0.2)";
      for (const gl of this.glints.slice(0, 20)) if (Math.sin(t * 1.3 + gl.p) > 0.6) g.fillRect(Math.round(gl.x), Math.round(this.sim.farY + 6 + (gl.y % 100)), gl.len, 1);
    }
  }
}
