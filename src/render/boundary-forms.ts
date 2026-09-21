import type { BoundaryStyle } from "../content/settlements/boundaries";
import { waterHash as hash, waterNoise as noise } from "./water-style";

/** How each form of standing boundary is drawn and what it casts. Everything
 * is keyed to world pixels, so a run drawn in pieces by neighbouring tiles
 * meets without a seam. `y` is always the ground line the boundary stands
 * on; a pixel `r` rows up is drawn at y - r. */

export type Rgb = number[];
export type Put = (wx: number, wy: number, c: Rgb) => void;
/** A solid column standing on ground point (fx, fy) from h0 to h1 pixels up. */
export type Emit = (fx: number, fy: number, h0: number, h1: number) => void;
export type PostRole = "mid" | "corner" | "end";

const mod = (n: number, d: number) => ((n % d) + d) % d;
const clamp = (n: number) => Math.max(0, Math.min(255, n));
const tone = (c: Rgb, v: number) => (v ? c.map((n) => clamp(n + v)) : c);
const mix = (a: Rgb, b: Rgb, t: number) =>
  a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
const decode = (s: string): Rgb => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];

const ramps = new WeakMap<BoundaryStyle, { r: Rgb[]; cap: Rgb[]; mortar: Rgb }>();
function palette(s: BoundaryStyle) {
  let p = ramps.get(s);
  if (!p) {
    const r = s.ramp.map(decode);
    p = {
      r,
      cap: (s.capRamp ?? s.ramp).map(decode),
      mortar: mix(r[4], [196, 188, 170], 0.55),
    };
    ramps.set(s, p);
  }
  return p;
}

/** Timber greys in stretches, as a length put up or mended at one time. */
const weather = (s: BoundaryStyle, x: number, y: number) =>
  Math.round(
    (hash(Math.floor(x / 96), Math.floor(y / 96), 977) - 0.5) *
      (s.form === "wall" ? 8 : 16),
  );

const half = (s: BoundaryStyle) => s.depth >> 1;
/** Ground row of a wall's or hedge's front face: the body is centred on y. */
const front = (s: BoundaryStyle, y: number) => y + ((s.depth - 1) >> 1);

// --- rail: posts with rails or wire --------------------------------------

function railEw(s: BoundaryStyle, xa: number, xb: number, y: number, put: Put) {
  const { r } = palette(s);
  const period = (s.pitch ?? 1) * 16;
  for (let x = xa; x < xb; x++) {
    const v = weather(s, x, y);
    for (const [i, hr] of s.rails!.entries()) {
      if (s.wire) {
        const d = mod(x - 8, period);
        const sag = d > 5 && d < period - 5 ? 1 : 0;
        put(x, y - hr + sag, hash(Math.floor(x / 3), y, 845) > 0.8 ? r[3] : r[1]);
        continue;
      }
      // Top rails rot out in stretches; the posts still read as a fence.
      if (!i && hash(Math.floor(x / 128), Math.floor(y / 128), 979) > 0.9) continue;
      put(x, y - hr, tone(r[3], v));
      put(x, y - hr + 1, tone(r[2], v));
      put(x, y - hr + 2, tone(r[0], v));
    }
  }
}

function railNs(s: BoundaryStyle, x: number, ya: number, yb: number, put: Put) {
  const { r } = palette(s);
  const rails = [...s.rails!].sort((a, b) => a - b);
  for (let g = ya; g < yb; g++) {
    const v = weather(s, x, g);
    for (const hr of rails) {
      if (s.wire) {
        put(x, g - hr, r[1]);
        continue;
      }
      put(x - 1, g - hr, tone(r[3], v));
      put(x, g - hr, tone(r[2], v));
    }
  }
}


function railPost(s: BoundaryStyle, x: number, y: number, role: PostRole, put: Put) {
  const { r } = palette(s);
  const w = s.post ?? 4;
  const H = s.height + (role === "mid" ? 0 : 1);
  // Some posts have settled a pixel. A lean shears the post into a step at
  // this size, so none lean.
  const sink = !s.wire && hash(x, y, 973) > 0.8 ? 1 : 0;
  const v = weather(s, x, y);
  const x0 = x - (w >> 1);
  for (let row = 0; row < H; row++) {
    for (let c = 0; c < w; c++) {
      let col: Rgb | undefined;
      if (w === 2) col = row === H - 1 ? r[4 - c] : c ? r[1] : r[3];
      else if (row === H - 1) col = c === 1 || c === 2 ? r[0] : undefined;
      else if (c === 0 || c === 3) col = r[0];
      else if (row === H - 2) col = c === 1 ? r[4] : r[3];
      else if (row === 0) col = r[1];
      else if (c === 1) col = r[3];
      else col = hash(x0 + c, y - row, 975) < 0.12 ? r[1] : r[2];
      if (col) put(x0 + c, y - row + sink, tone(col, v));
    }
  }
}

// --- paling: close upright stakes -----------------------------------------

function stakeHeight(s: BoundaryStyle, id: number) {
  const top = s.stake!.top;
  if (top === "ragged") return s.height + Math.floor(hash(id, 0, 811) * 3) - 1;
  return s.height - (hash(id, 0, 813) < 0.25 ? 1 : 0);
}

function palingEw(s: BoundaryStyle, xa: number, xb: number, y: number, put: Put) {
  const { r } = palette(s);
  const { width: sw, gap, top, nodes } = s.stake!;
  const p = sw + gap;
  for (let x = xa; x < xb; x++) {
    const u = mod(x, p),
      id = Math.floor(x / p),
      v = weather(s, x, y);
    if (u < sw) {
      const H = stakeHeight(s, id);
      const ring = nodes ? Math.floor(hash(id, 0, 815) * nodes) : 0;
      for (let row = 0; row < H; row++) {
        const tip = row === H - 1;
        if (tip && top === "point" && sw >= 2 && u !== (sw - 1) >> 1) continue;
        let c =
          sw === 1
            ? hash(id, 0, 817) < 0.5
              ? r[2]
              : r[3]
            : u === 0
              ? r[3]
              : u === sw - 1 && sw > 2
                ? r[1]
                : r[2];
        if (nodes && row > 1 && !tip && mod(row + ring, nodes) === 0)
          c = u === 0 ? r[4] : r[0];
        if (tip) c = r[4];
        else if (row === 0) c = r[1];
        put(x, y - row, tone(c, v));
      }
    } else {
      // The shadow side of the stake, then rails seen through the gap.
      const H = stakeHeight(s, id);
      for (const hr of s.rails ?? []) {
        put(x, y - hr, r[1]);
        put(x, y - hr + 1, r[0]);
      }
      if (u === sw)
        for (let row = 1; row < H - 1; row++) put(x, y - row, r[0]);
    }
    // Without gaps the rails are lashed across the front.
    if (!gap)
      for (const hr of s.rails ?? []) {
        put(x, y - hr, tone(r[3], v));
        put(x, y - hr + 1, tone(r[1], v));
      }
  }
}

function palingNs(
  s: BoundaryStyle,
  x: number,
  ya: number,
  yb: number,
  capB: boolean,
  put: Put,
) {
  const { r } = palette(s);
  const { width: sw, gap } = s.stake!;
  const p = sw + gap;
  const H = s.height;
  for (let g = ya; g < yb; g++) {
    const v = weather(s, x, g);
    const on = mod(g, p) < sw;
    put(x - 1, g - H, tone(on ? r[4] : r[1], v));
    put(x, g - H, tone(on ? r[3] : r[0], v));
    if (sw > 2) put(x + 1, g - H, tone(on ? r[2] : r[0], v));
  }
  if (capB)
    for (let row = 0; row < H; row++) {
      put(x - 1, yb - 1 - row, row === H - 1 ? r[4] : r[3]);
      put(x, yb - 1 - row, row === 0 ? r[1] : r[2]);
    }
}

// --- weave: wattle hurdles ------------------------------------------------

function weaveEw(s: BoundaryStyle, xa: number, xb: number, y: number, put: Put) {
  const { r } = palette(s);
  const H = s.height;
  for (let x = xa; x < xb; x++) {
    const seg = Math.floor(x / 6),
      u = mod(x, 6),
      v = weather(s, x, y);
    if (u === 0) {
      // The sail the rods are woven round, standing proud of the weave.
      for (let row = 0; row < H + 2; row++)
        put(x, y - row, tone(row === H + 1 ? r[3] : r[1], v));
      continue;
    }
    const top = H - 1 - (hash(x, 0, 821) < 0.25 ? 1 : 0);
    for (let row = 0; row <= top; row++) {
      const front = (((row >> 1) + seg) & 1) === 0;
      let c = row & 1 ? (front ? r[3] : r[2]) : front ? r[2] : r[1];
      if (!front && (u === 1 || u === 5)) c = r[1];
      if (row === 0) c = r[1];
      if (row === top) c = front ? r[4] : r[3];
      put(x, y - row, tone(c, v));
    }
  }
}

function weaveNs(
  s: BoundaryStyle,
  x: number,
  ya: number,
  yb: number,
  capB: boolean,
  put: Put,
) {
  const { r } = palette(s);
  const H = s.height;
  for (let g = ya; g < yb; g++) {
    const v = weather(s, x, g);
    const lit = (g >> 1) & 1;
    put(x - 1, g - H, tone(lit ? r[4] : r[3], v));
    put(x, g - H, tone(r[2], v));
    put(x + 1, g - H, tone(r[1], v));
  }
  for (let g = ya; g < yb; g++)
    if (mod(g, 6) === 0) {
      put(x, g - H - 1, r[1]);
      put(x, g - H - 2, r[3]);
    }
  if (capB)
    for (let row = 0; row < H; row++)
      for (let c = -1; c <= 1; c++) {
        const front = ((row >> 1) & 1) === 0;
        put(x + c, yb - 1 - row, row === 0 ? r[1] : front ? r[3 - (c + 1 >> 1)] : r[1]);
      }
}

/** A stout stake or post at a corner or the end of a run. */
function stoutPost(s: BoundaryStyle, x: number, y: number, put: Put) {
  const { r } = palette(s);
  const bamboo = !!s.stake?.nodes;
  const H = s.height + (s.form === "weave" ? 3 : 1);
  const v = weather(s, x, y);
  for (let row = 0; row < H; row++) {
    const tip = row === H - 1;
    const node = bamboo && row > 1 && !tip && row % 5 === 2;
    put(x - 1, y - row, tone(tip ? r[4] : node ? r[4] : r[3], v));
    put(x, y - row, tone(tip ? r[3] : node ? r[0] : r[2], v));
    put(x + 1, y - row, tone(tip ? r[2] : r[0], v));
  }
}

// --- wall: stone, brick and earth -----------------------------------------

/** Face pixel `row` up from the foot of a wall at world column x. */
function face(s: BoundaryStyle, x: number, row: number, y: number): Rgb {
  const { r, cap, mortar } = palette(s);
  const H = s.height;
  if (s.cap === "coping") {
    if (row === H - 1) return cap[2];
    if (row === H - 2) return r[0];
  }
  if (s.cap === "tile") {
    if (row === H - 1) return cap[0];
    if (row === H - 2) return r[1];
  }
  if (row === H - 1) return r[3];
  if (row === 0) return r[1];
  const v = weather(s, x, y);
  switch (s.bond) {
    case "rubble": {
      // Coursed stones of uneven length, each lit on top and shaded below.
      const course = Math.floor((row - 1) / 3),
        q = (row - 1) % 3;
      const lx = x + Math.floor(hash(course, 0, 831) * 6);
      const cell = Math.floor(lx / 6),
        u = mod(lx, 6);
      // Most stones span six pixels; some are split in two.
      const split = hash(cell, course, 833) < 0.4;
      if (u === 0 || (split && u === 3)) return tone(q === 1 ? r[0] : r[1], v);
      const stone = cell * 2 + (split && u > 3 ? 1 : 0);
      const t = Math.round((hash(stone, course, 835) - 0.5) * 22);
      return tone(q === 0 ? r[1] : q === 2 ? r[3] : r[2], t + v);
    }
    case "brick": {
      const course = Math.floor((row - 1) / 3),
        q = (row - 1) % 3;
      const lx = x + (course & 1) * 3;
      if (q === 0 || mod(lx, 6) === 0) return mortar;
      const t = Math.round((hash(Math.floor(lx / 6), course, 837) - 0.5) * 20);
      return tone(q === 2 ? r[3] : r[2], t);
    }
    case "block": {
      const course = Math.floor((row - 1) / 4),
        q = (row - 1) % 4;
      const lx = x + (course & 1) * 4;
      const worn = hash(x, row, 839);
      if ((q === 0 || mod(lx, 8) === 0) && worn > 0.2) return tone(r[1], v);
      const t = Math.round((hash(Math.floor(lx / 8), course, 841) - 0.5) * 12);
      if (worn > 0.92) return tone(r[1], t + v);
      return tone(q === 3 || worn < 0.1 ? r[3] : r[2], t + v);
    }
    case "rammed": {
      const lift = Math.floor((row - 1) / 4);
      const t = Math.round((hash(lift, Math.floor(x / 40), 843) - 0.5) * 12);
      if (hash(x, row, 845) < 0.05) return r[1];
      return tone((row - 1) % 4 === 3 ? r[3] : r[2], t + v);
    }
    default: {
      // Plaster: broad soft blotches, a splash line at the foot, a hairline
      // crack now and then, and a patch fallen away to the blocks beneath.
      if (row === 1) return tone(mix(r[2], r[1], 0.45), v);
      if (row === H - 2 && s.cap === "round") return tone(mix(r[3], r[2], 0.5), v);
      const patch = hash(Math.floor(x / 7), Math.floor(row / 4), 847) < 0.06;
      if (patch) return tone((row + (x >> 2)) % 3 === 0 ? r[1] : mix(r[2], r[1], 0.35), v);
      if (hash(x, row, 849) < 0.025) return mix(r[2], r[1], 0.6);
      const b = noise(x, row * 2 + y, 5, 851);
      return tone(b > 0.64 ? mix(r[2], r[3], 0.55) : b < 0.3 ? mix(r[2], r[1], 0.25) : r[2], v);
    }
  }
}

/** Top surface of a wall. `across` counts from the front (or west) edge,
 * `along` is the world coordinate along the run. */
function top(
  s: BoundaryStyle,
  across: number,
  along: number,
  alongAxisX: boolean,
): Rgb {
  const { r, cap } = palette(s);
  const t = s.depth;
  switch (s.cap) {
    case "tile": {
      // Pantiles laid across the wall, ridges along the run.
      const q = mod(alongAxisX ? along : across + along, 3);
      if (across === 0 && alongAxisX) return q === 0 ? cap[4] : cap[2];
      return q === 0 ? cap[3] : q === 1 ? cap[2] : cap[1];
    }
    case "coping":
      if (mod(along, 8) === 0) return cap[1];
      return across === 0 ? cap[4] : across === t - 1 ? cap[2] : cap[3];
    case "round":
      if (across === 0) return r[3];
      if (across === t - 1) return r[2];
      return hash(along, across, 851) < 0.18 ? r[3] : r[4];
    default: {
      const v = hash(Math.floor(along / 3), (across >> 1) + Math.floor(along / 6), 853);
      if (v < 0.14) return r[1];
      if (across === 0) return r[4];
      return v < 0.62 ? r[3] : r[4];
    }
  }
}

function wallEw(
  s: BoundaryStyle,
  xa: number,
  xb: number,
  y: number,
  capA: boolean,
  capB: boolean,
  put: Put,
) {
  const { r } = palette(s);
  const t = s.depth,
    H = s.height,
    yf = front(s, y);
  for (let x = xa; x < xb; x++) {
    const west = capA && x === xa,
      east = capB && x === xb - 1;
    for (let row = 0; row < H; row++)
      put(x, yf - row, east ? r[1] : west ? r[3] : face(s, x, row, y));
    for (let k = 0; k < t; k++) {
      const back = k === t - 1;
      put(
        x,
        yf - H - k,
        back
          ? s.cap === "round"
            ? r[1]
            : r[0]
          : east
            ? r[2]
            : west
              ? r[4]
              : top(s, k, x, true),
      );
    }
  }
}

function wallNs(
  s: BoundaryStyle,
  x: number,
  ya: number,
  yb: number,
  capA: boolean,
  capB: boolean,
  put: Put,
) {
  const { r } = palette(s);
  const t = s.depth,
    H = s.height,
    xl = x - half(s);
  for (let g = ya; g < yb; g++)
    for (let k = 0; k < t; k++) {
      const edge = k === 0 ? r[1] : k === t - 1 ? r[0] : undefined;
      const end = capA && g === ya;
      put(xl + k, g - H, end ? (s.cap === "round" ? r[1] : r[0]) : edge ?? top(s, k, g, false));
    }
  if (capB)
    for (let row = 0; row < H; row++)
      for (let k = 0; k < t; k++)
        put(xl + k, yb - 1 - row, k === t - 1 ? r[1] : k === 0 ? r[3] : face(s, xl + k, row, yb));
}

// --- hedge: clipped or brush ----------------------------------------------

const hedgeTop = (s: BoundaryStyle, a: number, b: number) =>
  s.height + Math.round((noise(a, b, 7, 861) - 0.5) * 4);

/** Leaves grow in clumps: each pixel belongs to the nearest clump centre on
 * a jittered lattice, lit on its upper left, shaded underneath, with a dark
 * seam where clumps meet. */
function clump(x: number, y: number) {
  const gx = Math.floor(x / 5),
    gy = Math.floor(y / 4);
  let best = 99,
    next = 99,
    ox = 0,
    oy = 0;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const cx = (gx + i) * 5 + hash(gx + i, gy + j, 881) * 5,
        cy = (gy + j) * 4 + hash(gx + i, gy + j, 883) * 4;
      const d = Math.hypot((x - cx) * 0.8, y - cy);
      if (d < best) {
        next = best;
        best = d;
        ox = x - cx;
        oy = y - cy;
      } else if (d < next) next = d;
    }
  return { seam: next - best < 0.7, lit: ox * 0.5 + oy, d: best };
}

function leaf(s: BoundaryStyle, x: number, y: number, up: number): Rgb {
  const { r } = palette(s);
  const c = clump(x, y);
  if (up < 0.15) return c.seam || c.lit > 0 ? r[0] : r[1];
  if (c.seam) return r[1];
  if (c.lit < -1.6) return hash(x, y, 869) > 0.9 ? r[4] : r[3];
  if (c.lit > 1.2) return up < 0.4 ? r[0] : r[1];
  return r[2];
}

function crown(s: BoundaryStyle, x: number, y: number): Rgb {
  const { r } = palette(s);
  const c = clump(x, y);
  if (c.seam) return r[2];
  if (c.lit < -1.2) return hash(x, y, 871) > 0.85 ? r[4] : r[3];
  if (c.lit > 1.4) return r[2];
  return r[3];
}

function hedgeEw(s: BoundaryStyle, xa: number, xb: number, y: number, put: Put) {
  const { r } = palette(s);
  const t = s.depth,
    yf = front(s, y);
  for (let x = xa; x < xb; x++) {
    const ht = hedgeTop(s, x, y);
    for (let row = 0; row < ht; row++) {
      const wy = yf - row;
      if (s.sparse && row < ht - 2 && hash(x, wy, 863) < s.sparse) {
        if (hash(x, wy, 873) < 0.3) put(x, wy, r[0]);
        continue;
      }
      put(x, wy, row === ht - 1 ? r[3] : leaf(s, x, wy, row / ht));
    }
    const back = t - 1 - (hash(x, y, 865) < 0.35 ? 1 : 0);
    for (let k = 0; k <= back; k++)
      put(x, yf - ht - k, k === back ? r[1] : crown(s, x, yf - ht - k));
  }
}

function hedgeNs(
  s: BoundaryStyle,
  x: number,
  ya: number,
  yb: number,
  capB: boolean,
  put: Put,
) {
  const { r } = palette(s);
  const t = s.depth,
    xl = x - half(s);
  for (let g = ya; g < yb; g++) {
    const ht = hedgeTop(s, x, g);
    const l = hash(0, g >> 1, 875) < 0.3 ? 1 : 0,
      w = t - (hash(1, g >> 1, 875) < 0.3 ? 1 : 0);
    for (let k = l; k < w; k++)
      for (let d = 0; d < 2; d++)
        put(
          xl + k,
          g - ht + d,
          k === l ? r[3] : k === w - 1 ? r[1] : crown(s, xl + k, g - ht + d),
        );
  }
  if (capB) {
    const ht = hedgeTop(s, x, yb);
    for (let row = 0; row < ht; row++)
      for (let k = 0; k < t; k++)
        put(xl + k, yb - 1 - row, row === ht - 1 ? r[3] : leaf(s, xl + k, yb - 1 - row, row / ht));
  }
}

// --- dispatch -------------------------------------------------------------

export function drawEw(
  s: BoundaryStyle,
  xa: number,
  xb: number,
  y: number,
  capA: boolean,
  capB: boolean,
  put: Put,
) {
  switch (s.form) {
    case "rail":
      return railEw(s, xa, xb, y, put);
    case "paling":
      return palingEw(s, xa, xb, y, put);
    case "weave":
      return weaveEw(s, xa, xb, y, put);
    case "wall":
      return wallEw(s, xa, xb, y, capA, capB, put);
    case "hedge":
      return hedgeEw(s, xa, xb, y, put);
  }
}

export function drawNs(
  s: BoundaryStyle,
  x: number,
  ya: number,
  yb: number,
  capA: boolean,
  capB: boolean,
  put: Put,
) {
  switch (s.form) {
    case "rail":
      return railNs(s, x, ya, yb, put);
    case "paling":
      return palingNs(s, x, ya, yb, capB, put);
    case "weave":
      return weaveNs(s, x, ya, yb, capB, put);
    case "wall":
      return wallNs(s, x, ya, yb, capA, capB, put);
    case "hedge":
      return hedgeNs(s, x, ya, yb, capB, put);
  }
}

/** Whether a node of this form gets a post, and of what kind. */
export function postAt(
  s: BoundaryStyle,
  role: PostRole,
  along: number,
): boolean {
  if (s.form === "rail") return role !== "mid" || mod(along, s.pitch ?? 1) === 0;
  return !!s.corners && role !== "mid";
}

export function drawPost(s: BoundaryStyle, x: number, y: number, role: PostRole, put: Put) {
  if (s.form === "rail") railPost(s, x, y, role, put);
  else stoutPost(s, x, y, put);
}

/** Half the width of a post, so a run's last post stands inside its cell. */
export const postHalf = (s: BoundaryStyle) =>
  s.form === "rail" ? (s.post ?? 4) >> 1 : 1;

/** Solid bodies spread into the corner they turn; rails and stakes meet at
 * the post. */
export const bodied = (s: BoundaryStyle) => s.form === "wall" || s.form === "hedge";

export function castEw(s: BoundaryStyle, xa: number, xb: number, y: number, emit: Emit) {
  const H = s.height;
  for (let x = xa; x < xb; x++)
    switch (s.form) {
      case "rail":
        for (const hr of s.rails!) emit(x, y, s.wire ? hr : hr - 2, hr);
        break;
      case "paling": {
        const { width: sw, gap } = s.stake!;
        if (mod(x, sw + gap) < sw) emit(x, y, 0, stakeHeight(s, Math.floor(x / (sw + gap))));
        else for (const hr of s.rails ?? []) emit(x, y, hr - 1, hr);
        break;
      }
      case "weave":
        emit(x, y, 0, mod(x, 6) ? H : H + 2);
        break;
      default: {
        const t = s.depth,
          yf = front(s, y);
        const h = s.form === "hedge" ? hedgeTop(s, x, y) + t - 1 : H;
        for (let g = yf - t + 1; g <= yf; g++)
          if (!s.sparse || hash(x, g, 877) >= s.sparse * 0.6) emit(x, g, 0, h);
      }
    }
}

export function castNs(s: BoundaryStyle, x: number, ya: number, yb: number, emit: Emit) {
  for (let g = ya; g < yb; g++)
    switch (s.form) {
      case "rail":
        for (const hr of s.rails!) emit(x, g, s.wire ? hr : hr - 2, hr);
        break;
      case "paling":
      case "weave":
        emit(x, g, 0, s.height);
        break;
      default: {
        const xl = x - half(s);
        const h = s.form === "hedge" ? hedgeTop(s, x, g) : s.height;
        for (let k = 0; k < s.depth; k++)
          if (!s.sparse || hash(xl + k, g, 877) >= s.sparse * 0.6) emit(xl + k, g, 0, h);
      }
    }
}

export function castPost(s: BoundaryStyle, x: number, y: number, role: PostRole, emit: Emit) {
  const w = s.form === "rail" ? s.post ?? 4 : 3;
  const H = s.height + (role === "mid" ? 0 : 1);
  for (let c = 0; c < w; c++) emit(x - (w >> 1) + c, y, 0, H);
}

/** Contact shadow at the foot, darkest right against the body. */
export function footShadow(
  s: BoundaryStyle,
  kind: "ew" | "ns" | "post",
  a: number,
  b: number,
  c: number,
  dark: (wx: number, wy: number, v: number) => void,
) {
  if (kind === "post") {
    const w = s.form === "rail" ? s.post ?? 4 : 3;
    for (let k = 0; k < w; k++) dark(a - (w >> 1) + k, b + 1, 26);
    dark(a - 1, b + 2, 10);
    dark(a, b + 2, 10);
    return;
  }
  if (s.form === "rail") return;
  const solid = bodied(s);
  if (kind === "ew") {
    const yf = solid ? front(s, b) : b;
    for (let x = a; x < c; x++) {
      dark(x, yf + 1, solid ? 30 : 22);
      dark(x, yf + 2, 10);
    }
  } else {
    const w = solid ? half(s) + 1 : 2;
    for (let g = b; g < c; g++) {
      dark(a - w, g, 14);
      dark(a + w - (solid ? 1 - (s.depth & 1) : 0), g, 18);
    }
  }
}
