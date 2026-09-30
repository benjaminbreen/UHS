export type Trade = "household" | "weaver" | "merchant" | "potter" | "scholar" | "hunter";
export type Shape = "rect" | "L" | "round" | "oval" | "apse" | "courtyard";
export type WallPattern =
  | "plaster" | "brick" | "timber" | "panel" | "stripe" | "zellige" | "mud" | "stone"
  | "bark" | "hide" | "felt" | "canvas" | "shoji" | "reed" | "deco" | "wallpaper";
export type FloorPattern =
  | "plank" | "tile" | "parquet" | "earth" | "mat" | "rushes" | "sand" | "flag" | "carpet" | "paper" | "terrazzo" | "linoleum";
export type Door = "door" | "flap" | "curtain" | "opening" | "none";
export type WindowStyle = "shutter" | "lattice" | "shoji" | "none";
export type Fire = "hearth" | "firepit" | "irori" | "brazier" | "stove" | "none";
/** 0 humble, 1 common, 2 elite: how finished the surfaces are. */
export type Finish = 0 | 1 | 2;
export type RoomParams = {
  seed: number;
  w: number;
  d: number;
  shape: Shape;
  finish: Finish;
  wall: string;
  trim: string;
  floor: string;
  wood: string;
  accent: string;
  wallPattern: WallPattern;
  floorPattern: FloorPattern;
  /** Lower-wall band on finished rooms; the plain wall pattern if unset. */
  dado?: WallPattern;
  door: Door;
  windows: number;
  windowStyle: WindowStyle;
  fire: Fire;
  /** A roof opening over the fire (or the room's middle) that lets smoke out and light in. */
  smokehole: boolean;
  seating: "chair" | "floor";
  sleep: "bed" | "mat" | "boxbed" | "none";
  pole: boolean;
  /** Storage, work and decor to place, most important first; humble rooms keep fewer. */
  furnish: Kind[];
  /** Which form a kind takes here: a shelf as a niche, a tansu or a bookcase; a bed as a charpai. */
  styles: Partial<Record<Kind, string>>;
  /** This household's work pieces, replacing the trade's default kit. */
  kit?: Kind[];
  /** Small things left about: which ones this household leaves. */
  clutter: string[];
  trade: Trade;
  hour: number;
  wear: number;
  soot: number;
};
export type Kind =
  | "door" | "window" | "hearth" | "shelf" | "tapestry" | "pegs" | "plates" | "map" | "shrine" | "horns" | "dresser"
  | "loom" | "spinwheel" | "basket" | "bolts" | "vat"
  | "counter" | "jars" | "crate" | "sacks"
  | "throw" | "claybin" | "potrack"
  | "desk" | "scrolls"
  | "firewood" | "broom"
  | "bed" | "mat" | "boxbed" | "chest" | "table" | "stool" | "lowtable" | "cushions" | "divan"
  | "plant" | "lamp" | "lantern" | "rug" | "cat"
  | "firepit" | "irori" | "brazier" | "stove" | "pole" | "ladder"
  | "quern" | "hides" | "coolamon" | "screen" | "fountain" | "pack"
  | "armchair" | "sofa" | "radio" | "range" | "icebox" | "clock" | "elevator" | "clutter" | "frame";
export type Prop = {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  w: number;
  d: number;
  wall: boolean;
  /** Open, lit, awake, spinning or unmade, depending on the kind. */
  on: boolean;
  broken?: boolean;
  /** For clutter: which small thing. */
  item?: string;
  seed: number;
};

const FIRE: [string, string] = ["Light the fire", "Let it burn down"];
export const interactive: Partial<Record<Kind, [string, string]>> = {
  door: ["Open the door", "Close the door"],
  window: ["Open the shutters", "Close the shutters"],
  hearth: ["Light the fire", "Bank the fire"],
  range: ["Stoke the range", "Let it cool"],
  radio: ["Switch on the radio", "Switch it off"],
  firepit: FIRE, irori: FIRE, brazier: FIRE, stove: FIRE,
  chest: ["Open the chest", "Close the chest"],
  lamp: ["Light the lamp", "Snuff the lamp"],
  lantern: ["Light the lantern", "Put it out"],
  shrine: ["Light a candle", "Snuff the candle"],
  desk: ["Light the candle", "Snuff the candle"],
  cat: ["Wake the cat", "Let it sleep"],
  bed: ["Unmake the bed", "Make the bed"],
  mat: ["Unroll the bedding", "Roll it up"],
  spinwheel: ["Spin", "Stop spinning"],
  throw: ["Turn the wheel", "Stop the wheel"],
};
/** Kinds that give light while on; the hammer can break the small ones. */
export const lit: Kind[] = ["range", "hearth", "firepit", "irori", "brazier", "stove", "lamp", "lantern", "shrine", "desk"];

export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(x: number, y: number, s = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Irregular stones: the nearest of a jittered grid of centres. `e` is the
 * distance to the next stone's border, `dx, dy` the offset from the centre. */
export function stones(u: number, v: number, cw: number, ch: number, s: number) {
  const gx = Math.floor(u / cw), gy = Math.floor(v / ch);
  let d1 = 1e9, d2 = 1e9, id = 0, sx = 0, sy = 0;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const cx = gx + i, cy = gy + j;
      const px = (cx + 0.2 + hash(cx, cy, s) * 0.6) * cw, py = (cy + 0.2 + hash(cx, cy, s + 1) * 0.6) * ch;
      const dd = (u + 0.5 - px) ** 2 + (v + 0.5 - py) ** 2;
      if (dd < d1) (d2 = d1), (d1 = dd), (id = cx * 7919 + cy), (sx = px), (sy = py);
      else if (dd < d2) d2 = dd;
    }
  return { e: Math.sqrt(d2) - Math.sqrt(d1), id, dx: u + 0.5 - sx, dy: v + 0.5 - sy };
}

/** Smooth value noise on a `cell`-sized lattice, 0–1. */
export function vnoise(x: number, y: number, cell: number, s: number) {
  const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export const pack = (r: number, g: number, b: number) =>
  (Math.max(0, Math.min(255, Math.round(r))) << 16) |
  (Math.max(0, Math.min(255, Math.round(g))) << 8) |
  Math.max(0, Math.min(255, Math.round(b)));
export const mix = (a: number, b: number, t: number) =>
  pack(
    ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t,
    ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t,
    (a & 255) * (1 - t) + (b & 255) * t,
  );
export const scale = (c: number, k: number) =>
  pack(((c >> 16) & 255) * k, ((c >> 8) & 255) * k, (c & 255) * k);

function hsl(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b), l = (hi + lo) / 2;
  if (hi === lo) return [0, 0, l];
  const dd = hi - lo, s = l > 0.5 ? dd / (2 - hi - lo) : dd / (hi + lo);
  const h = hi === r ? (g - b) / dd + (g < b ? 6 : 0) : hi === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
  return [h / 6, s, l];
}
function fromHsl(h: number, s: number, l: number) {
  h = ((h % 1) + 1) % 1;
  const f = (n: number) => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return pack(f(0), f(8), f(4));
}
const toward = (h: number, target: number) => ((((target - h) % 1) + 1.5) % 1) - 0.5;

/** Six steps, darkest first. Shadows lean violet and highlights lean gold,
 * the hue shift that keeps a pixel ramp from reading as grey-and-white. */
export function ramp(hex: string) {
  const [h, s, l] = hsl(hex);
  const out: number[] = [];
  for (let i = 0; i < 6; i++) {
    const t = (i / 5) * 2 - 1;
    const hh = t < 0 ? h + toward(h, 0.7) * -t * 0.16 : h + toward(h, 0.12) * t * 0.1;
    const ll = t < 0 ? l * (1 + t * 0.6) : l + (0.94 - l) * t * 0.52;
    const ss = Math.min(1, t < 0 ? s * (1 - t * 0.12) : s * (1 - t * 0.22));
    out.push(fromHsl(hh, ss, ll));
  }
  return out;
}
export function shiftHue(hex: string, dh: number, dl = 0) {
  const [h, s, l] = hsl(hex);
  const c = fromHsl(h + dh, s, Math.max(0.05, Math.min(0.9, l + dl)));
  return "#" + c.toString(16).padStart(6, "0");
}

export type Palette = ReturnType<typeof palette>;
export function palette(p: RoomParams) {
  return {
    wall: ramp(p.wall), trim: ramp(p.trim), floor: ramp(p.floor), wood: ramp(p.wood),
    acc: ramp(p.accent), acc2: ramp(shiftHue(p.accent, 0.36, 0.04)), acc3: ramp(shiftHue(p.accent, -0.22, 0.08)),
    stone: ramp("#8f877d"), iron: ramp("#5f6470"), brass: ramp("#c99a3a"), clay: ramp("#b4643b"),
    pale: ramp("#cfae88"), leaf: ramp("#5f8e3a"), paper: ramp("#e4d6b2"), fur: ramp("#d98a3c"),
    linen: ramp("#d6ccb8"), straw: ramp("#c4a257"), dye: [ramp("#2d418f"), ramp("#a3302c"), ramp("#d4b23a")],
  };
}

export function sky(hour: number, v: number) {
  const day = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const dusk = Math.max(0, 1 - Math.abs(hour - 18.5) / 1.6) + Math.max(0, 1 - Math.abs(hour - 6) / 1.4);
  const top = mix(mix(0x141a36, 0x6fb3e6, day), 0xe0784a, Math.min(0.7, dusk * 0.6));
  const low = mix(mix(0x27315a, 0xc6e4f2, day), 0xf2b36a, Math.min(0.85, dusk * 0.8));
  return mix(top, low, v);
}
/** Daylight strength and a unit vector toward the sun, room-space: x across
 * the back wall, y from the back wall toward the viewer, z up. */
export function sun(hour: number) {
  const up = Math.sin(((hour - 6) / 12) * Math.PI);
  const az = ((hour - 12) / 6) * 0.95;
  const el = 0.22 + Math.max(0, up) * 0.75;
  return {
    strength: Math.max(0, up) ** 0.6,
    dir: [Math.sin(az) * Math.cos(el), -Math.cos(az) * Math.cos(el), Math.sin(el)] as [number, number, number],
    color: mix(0xffa860, 0xfff2d8, Math.min(1, Math.max(0, up) * 1.6)),
  };
}


/** Which tiles are floor: 0 outside, 1 roofed floor, 2 floor open to the sky. */
export function roomMask(p: Pick<RoomParams, "w" | "d" | "shape">) {
  const { w, d } = p, m = new Uint8Array(w * d);
  const cx = w / 2, cy = d / 2;
  for (let y = 0; y < d; y++)
    for (let x = 0; x < w; x++) {
      const ex = (x + 0.5 - cx) / cx, ey = (y + 0.5 - cy) / cy;
      let inside = true;
      switch (p.shape) {
        case "L":
          inside = !(x >= Math.ceil(w * 0.58) && y < Math.max(3, Math.floor(d * 0.42)));
          break;
        case "round": {
          const r = Math.min(w, d) / 2;
          inside = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * (w / d > 1 ? 1 : 1)) <= r + 0.15 && Math.abs(x + 0.5 - cx) <= r;
          break;
        }
        case "oval":
          inside = ex * ex + ey * ey <= 1.08;
          break;
        case "apse": {
          const r = w / 2;
          inside = y + 0.5 >= r || Math.hypot(x + 0.5 - cx, y + 0.5 - r) <= r + 0.1;
          break;
        }
      }
      if (!inside) continue;
      const court = p.shape === "courtyard" && w >= 9 && d >= 8 && x >= 3 && x < w - 3 && y >= 3 && y < d - 2;
      m[y * w + x] = court ? 2 : 1;
    }
  return m;
}

/** Wall and floor texture in 16-px-per-tile units: u across, v up the wall
 * from the floor (or down the floor from the back wall). Both renderers
 * sample these, so a pattern change reads the same in pixels and voxels. */
export function wallColor(p: RoomParams, P: Palette, u: number, v: number) {
  const Tr = P.trim;
  if (v < 3) return v === 2 ? Tr[4] : Tr[2];
  let c = wallPattern(p.wallPattern, p, P, u, v);
  if (p.finish >= 1 && p.dado && v < 17) c = v >= 15 ? Tr[v === 16 ? 5 : 3] : wallPattern(p.dado, p, P, u, v);
  if (p.finish === 2 && v >= 40) {
    const band = v - 40;
    if (band === 0 || band === 7) c = Tr[4];
    else if (band === 1) c = Tr[1];
    else {
      const k = (((u + band * 2) % 8) + 8) % 8;
      c = k < 2 ? P.acc[4] : k < 4 ? Tr[3] : k === 4 ? P.acc2[3] : Tr[2];
    }
  }
  if (p.soot > 0 && v > 26) c = scale(c, 1 - Math.min(0.6, ((v - 26) / 22) * p.soot * (0.75 + hash(u >> 2, v >> 3, p.seed + 4) * 0.5)));
  if (p.wear > 0) {
    if (v < 12 && hash(u >> 3, 0, p.seed + 5) < p.wear * 0.9 && v < 4 + 9 * hash(u >> 1, 1, p.seed)) c = scale(c, 0.82);
    if (hash(u >> 1, v >> 1, p.seed + 9) < p.wear * 0.03) c = scale(c, 0.7);
  }
  return c;
}

function wallPattern(pat: WallPattern, p: RoomParams, P: Palette, u: number, v: number) {
  const W = P.wall, Tr = P.trim, A = P.acc;
  const blot = vnoise(u, v, 11, p.seed + 1), n = hash(u, v, p.seed);
  // A soft limewash-like drift of tone, never square blotches.
  const wash = mix(W[3], blot > 0.5 ? W[4] : W[2], Math.min(1, Math.abs(blot - 0.5) * 1.6) * 0.4);
  switch (pat) {
    case "brick": {
      const row = v >> 2, bu = (u + (row & 1 ? 4 : 0)) & 7, bv = (v - 3) & 3;
      if (bv === 3 || bu === 0) return mix(Tr[4], W[3], 0.3);
      return W[1 + Math.floor(hash((u + (row & 1 ? 4 : 0)) >> 3, row, p.seed) * 3) + (bv === 0 ? 1 : 0)];
    }
    case "timber": {
      const pu = ((u % 32) + 32) % 32;
      const beam = pu < 3 || (v >= 25 && v < 28) || v >= 45;
      const brace = v > 28 && v < 45 && ((u >> 5) & 1) === 0 && Math.abs(pu - (v - 28) * 1.9) < 2.2;
      return beam || brace ? Tr[pu === 0 || v === 25 ? 3 : 1 + (n < 0.3 ? 1 : 0)] : wash;
    }
    case "panel": {
      if (v < 18) return v >= 16 ? Tr[4] : u % 8 === 0 ? Tr[1] : u % 8 === 1 ? Tr[3] : Tr[2];
      const mu = ((u % 16) + 16) % 16, mv = (v - 18) % 16, dm = Math.abs(mu - 8) + Math.abs(mv - 8);
      return dm === 4 ? A[3] : dm === 1 ? A[4] : wash;
    }
    case "stripe": {
      if (v > 39) return Math.abs((((u % 8) + 8) % 8) - 4) === (v - 40) % 5 ? A[4] : Tr[2];
      return u % 8 === 0 ? Tr[3] : ((u >> 3) & 1) === 1 ? A[3 + (n < 0.2 ? 1 : 0)] : W[4];
    }
    case "zellige": {
      const cu = u & 7, cv = v & 7;
      if (cu === 0 || cv === 0) return P.linen[4];
      const k = hash(u >> 3, v >> 3, p.seed + 2), dm = Math.abs(cu - 4) + Math.abs(cv - 4);
      const tile = k < 0.3 ? A : k < 0.55 ? P.acc2 : k < 0.75 ? Tr : P.linen;
      return dm <= 1 ? P.linen[5] : dm <= 3 ? tile[3] : tile[2 + (cu + cv) % 2];
    }
    case "mud": {
      const arc = Math.abs(Math.sin(u * 0.21 + Math.sin(v * 0.13) * 2 + (u >> 5)) ) > 0.985;
      if (n < 0.006) return mix(wash, P.straw[3], 0.5);
      return arc ? mix(wash, W[4], 0.4) : wash;
    }
    case "stone": {
      // Rubble walling: rounded stones in dark mortar, each lit on its upper left.
      const st = stones(u, v, 9, 6, p.seed + 40);
      if (st.e < 1.2) return scale(W[1], 0.75);
      const base = mix(P.stone[2 + Math.floor(hash(st.id, 1, p.seed) * 3)], W[3], 0.35);
      if (st.e < 2.2) return st.dy < 0 || st.dx < -1 ? mix(base, P.stone[5], 0.4) : mix(base, W[0], 0.4);
      return base;
    }
    case "bark": {
      if (v === 18 || v === 36) return Tr[1];
      const sheet = Math.floor((u + hash(v >> 4, 0, p.seed) * 5) / 12);
      const su = u + Math.floor(hash(v >> 4, 0, p.seed) * 5) - sheet * 12;
      if (su === 0) return W[0];
      return W[1 + Math.floor(hash(u, v >> 2, p.seed + sheet) * 3) + (su === 1 ? 1 : 0)];
    }
    case "hide": {
      const pv = Math.floor(v / 12), pu = (u + (pv & 1) * 8) % 16;
      if ((pu === 0 || v % 12 === 0) && ((u + v) & 1)) return Tr[1];
      return wash;
    }
    case "felt": {
      const lattice = v > 4 && v < 40 && ((((u + v) % 10) + 10) % 10 === 0 || (((u - v) % 10) + 10) % 10 === 0);
      if (lattice) return Tr[3];
      return wash;
    }
    case "canvas": {
      if (u % 24 === 0) return W[1];
      if (v < 6) return A[2 + (v === 5 ? 1 : 0)];
      return W[3 + (v > 26 ? 1 : 0) - (u % 24 > 20 ? 1 : 0)];
    }
    case "shoji": {
      if (v < 8) return Tr[v === 7 ? 4 : 2];
      if (u % 16 === 0 || u % 16 === 15) return Tr[3];
      if ((u % 16) % 5 === 0 || (v - 8) % 8 === 0) return Tr[4];
      return P.paper[n < 0.1 ? 4 : 5];
    }
    case "deco": {
      if (v < 30) {
        const f = ((u % 6) + 6) % 6;
        return v === 29 ? Tr[5] : v === 28 ? Tr[2] : f === 0 ? Tr[1] : f === 1 ? W[4] : f === 5 ? W[2] : W[3];
      }
      const k = ((u % 16) + 16) % 16, h = v - 30;
      return Math.abs(k - 8) === (h % 9) ? P.brass[4] : Math.abs(k - 8) === (h % 9) + 1 ? P.brass[2] : W[3 + (h > 12 ? 1 : 0)];
    }
    case "wallpaper": {
      const row = Math.floor(v / 12), mu = (((u + (row & 1) * 6) % 12) + 12) % 12, mv = v % 12;
      if (u % 12 === 11 && (v & 1)) return W[3];
      if (mu === 6 && mv > 4 && mv < 10) return P.leaf[2];
      if ((mu === 5 || mu === 7) && mv === 7) return P.leaf[3];
      if (Math.abs(mu - 6) + Math.abs(mv - 4) <= 1) return mu === 6 && mv === 4 ? P.acc[5] : P.acc[3];
      return wash;
    }
    case "reed": {
      if (v % 12 === 0) return P.straw[4];
      return u % 2 === 0 ? W[2] : W[3 + (hash(u, v >> 3, p.seed) < 0.3 ? 1 : 0)];
    }
    default:
      return wash;
  }
}

/** Open-air floor is paved whatever the rooms around it are floored with. */
export const courtParams = (p: RoomParams): RoomParams => ({ ...p, floorPattern: p.floorPattern === "tile" ? "tile" : "flag", wear: p.wear * 0.5 });

export function floorColor(p: RoomParams, P: Palette, u: number, v: number) {
  // Floors stay quiet so the people on them read: every variation is within
  // one ramp step, seams are a single soft pixel, nothing is scattered.
  const F = P.floor, n = hash(u, v, p.seed + 3);
  const soft = (t: number) => mix(F[2], F[3], t);
  let c: number;
  switch (p.floorPattern) {
    case "tile": {
      const lu = ((u % 16) + 16) % 16, lv = ((v % 16) + 16) % 16, tu = Math.floor(u / 16), tv = Math.floor(v / 16);
      if (lu === 0 || lv === 0) c = mix(F[1], F[2], 0.45);
      else {
        c = soft((tu + tv) & 1 ? 0.35 : 0.7);
        if (hash(tu, tv, p.seed) < 0.07) c = mix(c, P.acc[3], 0.3);
        if (lu === 1 || lv === 1) c = mix(c, F[4], 0.18);
        else if (lu === 15 || lv === 15) c = mix(c, F[1], 0.12);
      }
      break;
    }
    case "parquet": {
      const hz = (((u >> 4) + (v >> 4)) & 1) === 0, lu = u & 15, lv = v & 15;
      if (lu === 0 || lv === 0) c = mix(F[1], F[2], 0.5);
      else if (hz ? lv % 4 === 0 : lu % 4 === 0) c = mix(F[1], F[2], 0.7);
      else c = soft(0.3 + hash(hz ? lv >> 2 : lu >> 2, (u >> 4) * 31 + (v >> 4), p.seed) * 0.4);
      break;
    }
    case "earth":
    case "rushes":
      c = soft(0.2 + vnoise(u, v, 30, p.seed + 7) * 0.45 + vnoise(u, v, 9, p.seed + 8) * 0.12);
      break;
    case "mat": {
      const mu = u % 32, mv = v % 16, border = mv < 2 || mv > 13;
      c = border ? mix(P.acc[1], F[1], 0.35) : (mv & 1) === 0 ? mix(F[3], F[4], 0.35) : F[3];
      if (!border && mu === 0) c = mix(F[1], F[2], 0.5);
      break;
    }
    case "sand":
      c = mix(F[3], F[4], vnoise(u, v, 24, p.seed) * 0.35);
      if (Math.sin(u * 0.22 + v * 0.5 + Math.sin(u * 0.05) * 3) > 0.95) c = mix(c, F[4], 0.25);
      break;
    case "flag": {
      const st = stones(u, v, 17, 13, p.seed + 30);
      if (st.e < 1.1) c = mix(F[1], F[2], 0.5);
      else {
        c = soft(0.25 + hash(st.id, 0, p.seed) * 0.5);
        if (st.e < 2.2) c = st.dx + st.dy < 0 ? mix(c, F[4], 0.2) : mix(c, F[1], 0.15);
      }
      break;
    }
    case "carpet": {
      // Large rugs over felt: a flat field, one border, one medallion.
      const row = Math.floor(v / 44), off = Math.floor(hash(row, 3, p.seed) * 30), cu = Math.floor((u + off) / 60);
      const lu = (u + off) % 60, lv = v % 44;
      const e = Math.min(lu - 2, lv - 2, 57 - lu, 41 - lv);
      if (hash(cu, row, p.seed + 5) < 0.2 || e < 0) {
        c = soft(0.4);
        break;
      }
      const R = [P.acc, P.acc2, P.acc3][Math.floor(hash(cu, row, p.seed) * 3)];
      const dm = Math.abs(lu - 30) / 28 + Math.abs(lv - 22) / 20;
      c = e === 0 ? R[1] : e < 3 ? mix(R[3], P.linen[4], 0.35) : e === 3 ? R[1] : dm < 0.22 ? mix(R[3], P.linen[4], 0.3) : dm < 0.27 ? R[1] : R[2];
      break;
    }
    case "paper":
      c = u % 16 === 0 || v % 16 === 0 ? mix(F[2], F[3], 0.4) : mix(F[3], F[4], ((u + v) % 16) < 3 ? 0.35 : 0.15);
      break;
    case "terrazzo": {
      c = mix(F[3], F[4], vnoise(u, v, 24, p.seed) * 0.4);
      const chip = hash(u >> 1, v >> 1, p.seed + 4);
      if (chip < 0.05) c = mix(c, [P.linen[5], P.stone[2], P.acc[3], F[1]][Math.floor(chip * 80) % 4], 0.35);
      const dd = Math.abs((((u + 32) % 64) + 64) % 64 - 32) + Math.abs((((v + 32) % 64) + 64) % 64 - 32);
      if (dd === 26 || dd === 20) c = mix(P.brass[4], c, 0.2);
      break;
    }
    case "linoleum": {
      const k = (((u >> 3) + (v >> 3)) & 1) === 0;
      c = k ? F[3] : mix(F[3], P.linen[5], 0.55);
      break;
    }
    default: {
      // Long boards, a soft seam, a faint lit edge, the odd grain line.
      const row = Math.floor(v / 7), lv = v % 7, su = u + Math.floor(hash(row, 0, p.seed) * 96);
      const j = (i: number) => Math.floor((hash(i, row, p.seed + 3) - 0.5) * 30);
      let b = Math.floor(su / 88);
      if (su < b * 88 + j(b)) b--;
      const le = b * 88 + j(b);
      if (lv === 0 || su === le) c = mix(F[1], F[2], 0.35);
      else {
        c = soft(0.25 + hash(b, row, p.seed) * 0.5);
        if (lv === 1) c = mix(c, F[4], 0.12);
        if (lv === 4 && hash(b, row, p.seed + 9) < 0.4 && ((su - le) % 40) > 6 && ((su - le) % 40) < 30) c = mix(c, F[1], 0.14);
      }
    }
  }
  if (p.wear > 0) c = mix(c, F[1], vnoise(u, v, 40, p.seed + 11) * p.wear * 0.18);
  void n;
  return c;
}

type Rule = { w: number; d: number; place: "wall" | "corner" | "centre" | "any" | "fire" | "side" };
const RULES: Partial<Record<Kind, Rule>> = {
  chest: { w: 1, d: 1, place: "wall" }, jars: { w: 2, d: 1, place: "wall" }, basket: { w: 1, d: 1, place: "any" },
  crate: { w: 1, d: 1, place: "wall" }, sacks: { w: 1, d: 1, place: "corner" }, plant: { w: 1, d: 1, place: "corner" },
  lamp: { w: 1, d: 1, place: "any" }, lantern: { w: 1, d: 1, place: "any" }, quern: { w: 1, d: 1, place: "fire" },
  hides: { w: 1, d: 1, place: "side" }, coolamon: { w: 1, d: 1, place: "fire" }, screen: { w: 2, d: 1, place: "wall" },
  divan: { w: 3, d: 1, place: "side" }, cushions: { w: 1, d: 1, place: "any" }, pack: { w: 1, d: 1, place: "side" },
  vat: { w: 1, d: 1, place: "wall" }, bolts: { w: 1, d: 1, place: "wall" }, firewood: { w: 1, d: 1, place: "fire" },
  scrolls: { w: 1, d: 1, place: "wall" }, stool: { w: 1, d: 1, place: "any" }, broom: { w: 1, d: 1, place: "corner" },
  potrack: { w: 2, d: 1, place: "wall" },
  armchair: { w: 1, d: 1, place: "any" }, sofa: { w: 3, d: 1, place: "side" }, radio: { w: 1, d: 1, place: "wall" },
  range: { w: 2, d: 1, place: "wall" }, icebox: { w: 1, d: 1, place: "wall" }, counter: { w: 3, d: 1, place: "centre" },
  loom: { w: 3, d: 2, place: "wall" }, spinwheel: { w: 1, d: 1, place: "any" }, throw: { w: 1, d: 1, place: "any" },
  claybin: { w: 1, d: 1, place: "wall" }, desk: { w: 2, d: 1, place: "wall" }, table: { w: 2, d: 1, place: "centre" },
};
const HUNG: Kind[] = ["tapestry", "pegs", "plates", "map", "shrine", "horns", "clock", "elevator", "frame"];

export function planRoom(p: RoomParams): Prop[] {
  const r = rng(p.seed * 7919 + ["household", "weaver", "merchant", "potter", "scholar", "hunter"].indexOf(p.trade));
  const { w, d } = p;
  const mask = roomMask(p);
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < d && mask[y * w + x] > 0;
  const props: Prop[] = [];
  const add = (kind: Kind, x: number, y: number, pw: number, pd: number, wall = false, on = false) => {
    const pr: Prop = { id: props.length, kind, x, y, w: pw, d: pd, wall, on, seed: Math.floor(r() * 1e9) };
    props.push(pr);
    return pr;
  };
  // Each column's back wall: the first floor tile from the top.
  const top = Array.from({ length: w }, (_, x) => {
    for (let y = 0; y < d; y++) if (inside(x, y)) return y;
    return -1;
  });
  const used: boolean[] = top.map((t) => t < 0);
  // 0 free, 1 blocked, 2 kept clear for walking.
  const occ = Array.from({ length: d }, (_, y) => Array.from({ length: w }, (_, x) => (inside(x, y) ? (mask[y * w + x] === 2 ? 2 : 0) : 1)));
  const onWall = (pw: number, score: (x: number) => number) => {
    let best = -1, bs = -Infinity;
    for (let x = 0; x + pw <= w; x++) {
      if (used.slice(x, x + pw).some(Boolean) || top.slice(x, x + pw).some((t) => t !== top[x])) continue;
      const s = score(x) + r() * 0.8;
      if (s > bs) (bs = s), (best = x);
    }
    for (let i = 0; i < pw && best >= 0; i++) used[best + i] = true;
    return best;
  };
  const cols = top.filter((t) => t >= 0).length;
  const edge = (x: number) => (x <= 0 || x >= w - 1 || top[x - 1] !== top[x] || top[x + 1] !== top[x] ? -3 : 0);
  let doorX = -1;
  if (p.door !== "none") {
    doorX = onWall(1, (x) => edge(x) + (p.shape === "round" || p.shape === "oval" ? -Math.abs(x + 0.5 - w / 2) * 0.3 : 0));
    add("door", doorX, top[doorX], 1, 0, true, p.door === "opening");
    occ[top[doorX]][doorX] = 2;
    if (inside(doorX, top[doorX] + 1)) occ[top[doorX] + 1][doorX] = 2;
  }
  const fromDoor = (x: number) => (doorX < 0 ? 2 : Math.min(Math.abs(x - doorX), 4));

  let hearth: Prop | undefined;
  if (p.fire === "hearth" && cols >= 4) {
    const hx = onWall(2, (x) => -Math.abs(x + 1 - w / 2) * 0.4 + fromDoor(x) * 0.5);
    if (hx >= 0) {
      const ty = top[hx];
      hearth = add("hearth", hx, ty, 2, 1, true, true);
      occ[ty][hx] = occ[ty][hx + 1] = 1;
      if (inside(hx, ty + 1) && inside(hx + 1, ty + 1)) occ[ty + 1][hx] = occ[ty + 1][hx + 1] = 2;
    }
  }
  const windows: Prop[] = [];
  const nWin = p.windowStyle === "none" ? 0 : Math.min(p.windows, Math.max(1, Math.floor(cols / 5)));
  for (let i = 0; i < nWin; i++) {
    const x = onWall(1, (x) =>
      fromDoor(x) * 0.6 + edge(x) * 0.3 + (hearth ? Math.min(Math.abs(x - hearth.x), 3) * 0.3 : 0) +
      windows.reduce((s, o) => s + Math.min(Math.abs(x - o.x), 4) * 0.5, 0));
    if (x >= 0) windows.push(add("window", x, top[x], 1, 0, true, true));
  }
  const win = windows[0]?.x ?? w / 2;

  const fits = (x: number, y: number, pw: number, pd: number) => {
    if (x < 0 || y < 0 || x + pw > w || y + pd > d) return false;
    for (let j = y; j < y + pd; j++) for (let i = x; i < x + pw; i++) if (occ[j][i] !== 0) return false;
    return true;
  };
  const start = (() => {
    if (doorX >= 0) return top[doorX] * w + doorX;
    for (let i = 0; i < w * d; i++) if (mask[i]) return i;
    return 0;
  })();
  const connected = () => {
    const seen = new Set([start]);
    const q = [start];
    while (q.length) {
      const c = q.pop()!, x = c % w, y = (c / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= d || seen.has(k) || occ[ny][nx] === 1) continue;
        seen.add(k);
        q.push(k);
      }
    }
    let open = 0;
    for (const row of occ) for (const o of row) if (o !== 1) open++;
    return seen.size === open;
  };
  const place = (kind: Kind, pw: number, pd: number, score: (x: number, y: number) => number, on = false) => {
    const cands: [number, number, number][] = [];
    for (let y = 0; y < d; y++)
      for (let x = 0; x < w; x++) if (fits(x, y, pw, pd)) cands.push([score(x, y) + r() * 0.7, x, y]);
    cands.sort((a, b) => b[0] - a[0]);
    for (const [, x, y] of cands) {
      for (let j = y; j < y + pd; j++) for (let i = x; i < x + pw; i++) occ[j][i] = 1;
      if (connected()) return add(kind, x, y, pw, pd, false, on);
      for (let j = y; j < y + pd; j++) for (let i = x; i < x + pw; i++) occ[j][i] = 0;
    }
  };
  const near = (x: number, y: number, pw: number, pd: number, t?: { x: number; y: number; w: number; d: number }) =>
    t ? -Math.hypot(x + pw / 2 - (t.x + t.w / 2), y + pd / 2 - (t.y + t.d / 2)) : 0;
  // How many sides of the footprint touch a wall, the back one counting most.
  const walls = (x: number, y: number, pw: number, pd: number) => {
    let s = 0;
    for (let i = x; i < x + pw; i++) {
      if (!inside(i, y - 1)) s += 1 / pw;
      if (!inside(i, y + pd)) s += 0.3 / pw;
    }
    for (let j = y; j < y + pd; j++) if (!inside(x - 1, j) || !inside(x + pw, j)) s += 1 / pd;
    return s;
  };
  const centre = { x: w / 2 - 1, y: d / 2 - 1, w: 2, d: 2 };
  const underWindow = (x: number, y: number, pw: number) => -Math.abs(x + pw / 2 - (win + 0.5)) * 0.8 - Math.abs(y - (top[Math.floor(win)] ?? 0)) * 1.5;

  let fire: Prop | undefined = hearth;
  if (p.fire === "firepit" || p.fire === "irori" || p.fire === "brazier" || p.fire === "stove") {
    const big = p.fire !== "brazier" && p.fire !== "stove" && w * d >= 30;
    const s = big ? 2 : 1;
    // Without a smoke hole a stove's pipe needs a wall to go up through.
    const byWall = p.fire === "stove" && !p.smokehole;
    fire = place(p.fire, s, s, (x, y) => (byWall ? (inside(x, y - 1) ? -9 : 3) - Math.abs(x + 0.5 - w / 2) * 0.3 : near(x, y, s, s, centre) * 1.5), true);
    if (fire) for (let j = fire.y - 1; j <= fire.y + fire.d; j++) for (let i = fire.x - 1; i <= fire.x + fire.w; i++) if (inside(i, j) && occ[j][i] === 0) occ[j][i] = 2;
  }
  if (p.pole) {
    const off = fire ? { x: fire.x + fire.w, y: fire.y - 1, w: 1, d: 1 } : centre;
    place("pole", 1, 1, (x, y) => near(x, y, 1, 1, off) * 2);
  }
  if (p.door === "none") place("ladder", 1, 1, (x, y) => near(x, y, 1, 1, fire ?? centre) * 1.2 + walls(x, y, 1, 1) * 0.5);

  const hanging: Record<Trade, Kind> = { household: "pegs", weaver: "tapestry", merchant: "pegs", potter: "plates", scholar: "map", hunter: "pegs" };
  const hungFromProfile = p.furnish.filter((k) => HUNG.includes(k));
  for (const k of [...hungFromProfile, hanging[p.trade]].slice(0, 1 + p.finish)) {
    const hx = onWall(1, (x) => -Math.abs(x - win) * 0.2);
    if (hx >= 0) add(k, hx, top[hx], 1, 0, true, k === "shrine");
  }
  // Finer households hang more on their walls: pictures, plates, hangings.
  const decor = hungFromProfile.filter((k) => k === "frame" || k === "plates" || k === "tapestry" || k === "pegs");
  for (let i = 0; decor.length && i < Math.floor(cols / 4) * p.finish; i++) {
    const hx = onWall(1, () => 0);
    if (hx >= 0) add(decor[i % decor.length], hx, top[hx], 1, 0, true);
  }
  const has = (k: Kind) => p.furnish.includes(k);
  if (has("dresser") || has("shelf") || p.trade === "merchant" || p.trade === "scholar") {
    const nShelf = has("dresser") ? 1 : p.trade === "merchant" || p.trade === "scholar" ? 3 : p.finish + 1;
    for (let i = 0; i < nShelf; i++) {
      const span = r() < 0.6 ? 2 : 1;
      const sx = onWall(span, (x) => (occ[top[x]].slice(x, x + span).every((o) => o === 0) ? 0 : -99));
      if (sx < 0) continue;
      const ty = top[sx];
      if (occ[ty].slice(sx, sx + span).some((o) => o !== 0)) {
        for (let k = 0; k < span; k++) used[sx + k] = false;
        continue;
      }
      add(p.furnish.includes("dresser") ? "dresser" : "shelf", sx, ty, span, 1, true);
      for (let k = 0; k < span; k++) occ[ty][sx + k] = 1;
    }
  }

  if (p.kit) {
    for (const k of p.kit) {
      const rule = RULES[k] ?? { w: 1, d: 1, place: "any" };
      place(k, rule.w, rule.d, (x, y) => (rule.place === "wall" ? walls(x, y, rule.w, rule.d) * 1.5 : rule.place === "centre" ? near(x, y, rule.w, rule.d, centre) : underWindow(x, y, rule.w) * 0.3), lit.includes(k));
    }
  } else if (p.trade === "weaver") {
    const lw = w >= 7 ? 3 : 2;
    // In front of the window, not under it: the light falls on the cloth.
    const loom = place("loom", lw, 2, (x, y) => underWindow(x, y, lw) + (y === (top[x] ?? 0) + 1 ? 3 : 0));
    place("spinwheel", 1, 1, (x, y) => near(x, y, 1, 1, loom) * 0.8);
    place("basket", 1, 1, (x, y) => near(x, y, 1, 1, loom) * 0.6);
    place("bolts", 1, 1, (x, y) => walls(x, y, 1, 1));
    place("vat", 1, 1, (x, y) => walls(x, y, 1, 1) * 1.2);
  } else if (p.trade === "merchant") {
    const cw = Math.max(2, Math.min(4, w - 3));
    const row = Math.min(d - 2, Math.max(1, Math.round(d * 0.55)));
    place("counter", cw, 1, (x, y) => -Math.abs(y - row) * 2 - Math.abs(x + cw / 2 - w / 2) * 0.5);
    place("jars", 2, 1, (x, y) => walls(x, y, 2, 1) * 1.4);
    place("crate", 1, 1, (x, y) => walls(x, y, 1, 1));
    place("sacks", 1, 1, (x, y) => walls(x, y, 1, 1));
  } else if (p.trade === "potter") {
    const wheel = place("throw", 1, 1, (x, y) => underWindow(x, y, 1), true);
    place("claybin", 1, 1, (x, y) => near(x, y, 1, 1, wheel) * 0.7);
    place("potrack", 2, 1, (x, y) => walls(x, y, 2, 1) * 1.5);
  } else if (p.trade === "scholar") {
    const desk = place("desk", 2, 1, (x, y) => underWindow(x, y, 2) + 1, true);
    place("scrolls", 1, 1, (x, y) => near(x, y, 1, 1, desk) * 0.6);
    if (p.seating === "chair") place("stool", 1, 1, (x, y) => (desk && y === desk.y + 1 && x >= desk.x && x <= desk.x + 1 ? 5 : -9));
  } else if (p.trade === "hunter") {
    place("hides", 1, 1, (x, y) => walls(x, y, 1, 1));
    place("hides", 1, 1, (x, y) => walls(x, y, 1, 1));
  }

  const sleepKind = p.sleep as Kind;
  const bed = d >= 4 && p.sleep !== "none" ? place(sleepKind, 2, 1, (x, y) => walls(x, y, 2, 1) * 1.5 + y * 0.3 - near(x, y, 2, 1, fire) * 0.1) : undefined;
  if (bed && p.finish >= 1 && has("chest")) place("chest", 1, 1, (x, y) => near(x, y, 1, 1, bed) * 0.8 + walls(x, y, 1, 1) * 0.3);
  if (p.finish === 2 && bed && w * d > 90 && p.sleep !== "none") place(sleepKind, 2, 1, (x, y) => walls(x, y, 2, 1) * 1.5 + near(x, y, 2, 1, bed) * 0.2);
  let table: Prop | undefined;
  if (p.seating === "chair") {
    table = place("table", 2, 1, (x, y) => -Math.abs(x + 1 - w * 0.55) * 0.3 - Math.abs(y - d * 0.62) * 0.35);
    if (table) {
      place("stool", 1, 1, (x, y) => (y === table!.y && (x === table!.x - 1 || x === table!.x + 2) ? 5 : -9));
      place("stool", 1, 1, (x, y) => (y === table!.y + 1 && (x === table!.x || x === table!.x + 1) ? 4 : -9));
    }
  } else if (has("lowtable")) {
    table = place("lowtable", 1, 1, (x, y) => near(x, y, 1, 1, fire ?? centre) * 0.4 - Math.abs(y - d * 0.6) * 0.3);
    if (table) {
      place("cushions", 1, 1, (x, y) => (Math.abs(x - table!.x) + Math.abs(y - table!.y) === 1 ? 5 : -9));
      if (p.finish === 2) place("cushions", 1, 1, (x, y) => (Math.abs(x - table!.x) + Math.abs(y - table!.y) === 1 ? 5 : -9));
    }
  }
  const pool = p.furnish.filter((k) => RULES[k] && k !== "lowtable" && !(k === "chest" && bed));
  const keep = Math.ceil(pool.length * [0.5, 0.8, 1][p.finish]);
  // Large rooms furnish again from the same list rather than stay bare.
  const rounds = Math.max(1, Math.round((w * d) / 75));
  for (const k of Array.from({ length: rounds }, () => pool.slice(0, keep)).flat()) {
    const rule = RULES[k]!;
    const score = (x: number, y: number) => {
      const wl = walls(x, y, rule.w, rule.d);
      switch (rule.place) {
        case "wall": return wl * 1.5;
        case "corner": return wl * 1.2 + (wl > 1.2 ? 1 : 0);
        case "side": return wl * 1.2 - y * 0.05;
        case "centre": return near(x, y, rule.w, rule.d, centre);
        case "fire": return near(x, y, rule.w, rule.d, fire ?? centre) * 0.8;
        default: return r();
      }
    };
    place(k, rule.w, rule.d, score, lit.includes(k));
  }
  if (p.finish === 2) {
    if (has("plant")) place("plant", 1, 1, (x, y) => walls(x, y, 1, 1) * 1.4);
    if (p.furnish.includes("lamp") || p.furnish.includes("lantern")) place(p.furnish.includes("lamp") ? "lamp" : "lantern", 1, 1, (x, y) => near(x, y, 1, 1, table ?? bed) * 0.5, true);
  }
  if (hearth) {
    const h = hearth;
    place("firewood", 1, 1, (x, y) => (y === h.y && (x === h.x - 1 || x === h.x + 2) ? 5 : y === h.y + 1 ? -Math.abs(x - h.x) : -9));
  }
  if (doorX >= 0 && p.door === "door") place("broom", 1, 1, (x, y) => (y === top[doorX] && Math.abs(x - doorX) === 1 ? 5 : -9));
  if (p.shape === "courtyard") {
    const court = { x: Math.floor(w / 2) - 1, y: Math.floor((3 + d - 2) / 2) - 1, w: 2, d: 2 };
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) if (inside(court.x + i, court.y + j)) occ[court.y + j][court.x + i] = 0;
    add("fountain", court.x, court.y, 2, 2);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) occ[court.y + j][court.x + i] = 1;
  }
  if (p.finish > 0 && d >= 4 && has("rug")) {
    const t = table ?? fire;
    if (t) {
      const x0 = Math.max(0, t.x - 1), y0 = Math.max(0, t.y - 1), x1 = Math.min(w, t.x + t.w + 1), y1 = Math.min(d, t.y + t.d + 1);
      let ok = true;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (!inside(x, y) || mask[y * w + x] === 2) ok = false;
      if (ok && t !== fire) props.unshift({ id: -1, kind: "rug", x: x0, y: y0, w: x1 - x0, d: y1 - y0, wall: false, on: false, seed: Math.floor(r() * 1e9) });
    }
  }
  if (has("cat")) {
    if (hearth && inside(hearth.x, hearth.y + 1)) add("cat", hearth.x + (r() < 0.5 ? 0 : 1), hearth.y + 1, 1, 1);
    else if (fire && fire !== hearth) {
      const cx = fire.x + fire.w, cy = fire.y;
      if (inside(cx, cy) && occ[cy][cx] !== 1) add("cat", cx, cy, 1, 1);
    } else {
      const perch = props.find((q) => q.kind === "sacks" || q.kind === "counter");
      if (perch) add("cat", perch.x, perch.y, 1, 1);
    }
  }
  // Clutter lies near what it belongs to and never blocks a path.
  const near1 = (item: string) => {
    const want: Record<string, Kind[]> = {
      shoes: ["door"], grain: ["sacks", "quern", "basket"], bowl: ["firepit", "irori", "hearth", "brazier", "range"],
      pot: ["firepit", "irori", "hearth", "range", "stove"], cloth: [sleepKind, "chest"], cup: ["table", "lowtable"],
      toy: [sleepKind, "cushions"], yarn: ["loom", "spinwheel", "basket"], book: ["desk", "armchair", "shelf"],
      shards: ["throw", "potrack"], flowers: ["table", "lowtable", "window"], paper: ["desk", "counter", "radio"],
    };
    return props.find((q) => (want[item] ?? []).includes(q.kind));
  };
  const taken = new Set<number>();
  const items = p.clutter.length ? p.clutter : ["bowl", "cloth", "cup"];
  const nClutter = [5, 3, 2][p.finish] + Math.floor((w * d) / 70);
  for (let i = 0; i < nClutter; i++) {
    const item = items[Math.floor(r() * items.length)], a = near1(item);
    const ax = a ? a.x + a.w / 2 : r() * w, ay = a ? a.y + (a.wall ? 0.5 : a.d / 2) : r() * d;
    let best = -1, bs = -Infinity;
    for (let y = 0; y < d; y++)
      for (let x = 0; x < w; x++) {
        const k = y * w + x;
        if (!inside(x, y) || occ[y][x] === 1 || taken.has(k)) continue;
        const s = -Math.hypot(x + 0.5 - ax, y + 0.5 - ay) + r() * 1.5;
        if (s > bs) (bs = s), (best = k);
      }
    if (best < 0 || bs < -3.5) continue;
    taken.add(best);
    const q = add("clutter", best % w, Math.floor(best / w), 1, 1);
    q.item = item;
  }
  props.forEach((q, i) => (q.id = i));
  return props;
}

/** How much each tile is walked: shortest paths from the way in to where the
 * household spends its day, summed and scaled to 0–1. */
export function wornTiles(p: RoomParams, props: Prop[]) {
  const { w, d } = p, mask = roomMask(p), out = new Float32Array(w * d);
  const block = new Uint8Array(w * d);
  for (const q of props)
    if (!q.wall && q.kind !== "rug" && q.kind !== "cat" && q.kind !== "clutter")
      for (let y = q.y; y < q.y + q.d; y++) for (let x = q.x; x < q.x + q.w; x++) block[y * w + x] = 1;
  const entry = props.find((q) => q.kind === "door" || q.kind === "ladder");
  if (!entry) return out;
  const start = entry.kind === "door" ? entry.y * w + entry.x : entry.y * w + entry.x;
  const prev = new Int32Array(w * d).fill(-1), seen = new Uint8Array(w * d), q = [start];
  seen[start] = 1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], x = c % w, y = (c / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * w + nx;
      if (nx < 0 || ny < 0 || nx >= w || ny >= d || seen[k] || !mask[k]) continue;
      seen[k] = 1;
      prev[k] = c;
      if (!block[k]) q.push(k);
    }
  }
  const goals: Kind[] = ["hearth", "firepit", "irori", "brazier", "stove", "range", "table", "lowtable", "bed", "mat", "boxbed", "loom", "counter", "desk", "throw", "sofa", "armchair", "divan"];
  for (const g of props.filter((q) => goals.includes(q.kind))) {
    let k = g.y * w + g.x;
    for (let steps = 0; k >= 0 && steps < w * d; steps++) {
      out[k] += 1;
      k = prev[k];
    }
  }
  let m = 0;
  for (const v of out) m = Math.max(m, v);
  if (m) for (let i = 0; i < out.length; i++) out[i] = Math.min(1, out[i] / Math.max(2, m * 0.6));
  return out;
}
