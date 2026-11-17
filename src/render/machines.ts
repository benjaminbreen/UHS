import { Raster } from "./ship/raster";

/** Working machinery drawn in side elevation on a plinth or platform, as a loop
 * of frames: for an exhibition hall, a factory floor, an engine house. */
export type MachineKind = "mill-engine" | "engine" | "dynamo" | "line-shaft" | "pump";
/** The frames of one turn, and where the footprint's top-left cell corner lies in them. */
export type Machine = { frames: Raster[]; fps: number; ox: number; oy: number };

const IRON = ["#7a869a", "#525e72", "#394252", "#262d3a", "#161b24"];
const GREEN = ["#96d48e", "#62b066", "#418c4c", "#2c6838", "#1b4426"];
const RED = ["#f29080", "#d85c4c", "#b03c36", "#822a2a", "#561c20"];
const BRASS = ["#fff4b8", "#f2ca62", "#c69032", "#8c5e24", "#583a18"];
const COPPER = ["#fac8a0", "#e2966a", "#ba6e46", "#8a4c2e", "#5a321e"];
const STEEL = ["#ffffff", "#dde4ee", "#a8b2c2", "#748092"];
const STONE = ["#f8f2e4", "#e6ddca", "#c8beaa", "#a09684", "#787062"];
const WOOD = ["#e2b680", "#c69660", "#a27246", "#7a5030", "#50321e"];
const LEATHER = ["#b08458", "#86603c", "#5c3e26"];
const TAU = Math.PI * 2;

/** A cylinder lying on its side: lit along the top, dark underneath. */
function lying(r: Raster, x0: number, x1: number, cy: number, rad: number, pal: string[]) {
  for (let j = -rad; j <= rad; j++) {
    const t = (j + rad) / (rad * 2);
    r.fill(x0, cy + j, x1 - x0, 1, pal[t < 0.1 ? 1 : t < 0.3 ? 0 : t < 0.6 ? 1 : t < 0.86 ? 2 : 3]);
  }
}
/** A cylinder standing up: lit down the left, dark down the right. */
function standing(r: Raster, cx: number, y0: number, y1: number, rad: number, pal: string[]) {
  for (let i = -rad; i <= rad; i++) {
    const t = (i + rad) / (rad * 2);
    r.fill(cx + i, y0, 1, y1 - y0, pal[t < 0.12 ? 1 : t < 0.34 ? 0 : t < 0.64 ? 1 : t < 0.88 ? 2 : 3]);
  }
  r.fill(cx - rad, y0, rad * 2 + 1, 1, pal[0]);
}
/** A block seen from in front and a little above. */
function slab(r: Raster, x: number, y: number, w: number, top: number, front: number, pal: string[]) {
  r.fill(x, y, w, top, pal[1]);
  r.fill(x, y, w, 1, pal[0]);
  r.fill(x, y + top, w, front, pal[2]);
  r.fill(x, y + top + front - 1, w, 1, pal[3]);
  r.fill(x + w - 1, y + top, 1, front, pal[3]);
}
function line(r: Raster, x0: number, y0: number, x1: number, y1: number, wide: number, top: string, under: string) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5);
  for (let k = 0; k <= n; k++) {
    const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
    for (let j = 0; j < wide; j++) r.set(Math.round(x), Math.round(y - wide / 2 + j + 0.5), j === wide - 1 && wide > 1 ? under : top);
  }
}
function disc(r: Raster, cx: number, cy: number, rad: number, col: (d: number, a: number) => string | undefined) {
  for (let j = -Math.ceil(rad); j <= Math.ceil(rad); j++) for (let i = -Math.ceil(rad); i <= Math.ceil(rad); i++) {
    const d = Math.hypot(i, j);
    if (d <= rad + 0.3) r.set(cx + i, cy + j, col(d, Math.atan2(j, i)));
  }
}
/** A spoked wheel turned to `th`: a rim lit from the upper left, tapering spokes, a hub with a bright centre. */
function wheel(r: Raster, cx: number, cy: number, rad: number, rim: number, spokes: number, th: number, pal: string[], hub = Math.max(2, rad * 0.2)) {
  const half = rad > 24 ? 1.7 : rad > 9 ? 1.1 : 0.7;
  disc(r, cx, cy, rad, (d, a) => {
    if (d > rad - rim) return d > rad - 0.8 || d < rad - rim + 0.8 ? pal[4] : pal[Math.cos(a + 2.2) > 0.35 ? 0 : Math.cos(a + 2.2) > -0.4 ? 1 : 2];
    if (d <= hub) return d < hub * 0.45 ? BRASS[1] : d > hub - 0.9 ? pal[4] : pal[1];
    const turn = (((a - th) / (TAU / spokes)) % 1 + 1) % 1, off = Math.sin((turn > 0.5 ? turn - 1 : turn) * (TAU / spokes)) * d;
    return Math.abs(off) <= half ? (off < 0 ? pal[1] : pal[3]) : undefined;
  });
}
/** A belt between two pulleys, its lacing marks running along it. */
function belt(r: Raster, x0: number, y0: number, r0: number, x1: number, y1: number, r1: number, phase: number) {
  for (const side of [-1, 1]) {
    const ax = x0 + side * r0, bx = x1 + side * r1, n = Math.ceil(Math.hypot(bx - ax, y1 - y0));
    for (let k = 0; k <= n; k++) {
      const x = Math.round(ax + ((bx - ax) * k) / n), y = Math.round(y0 + ((y1 - y0) * k) / n);
      const mark = ((k * side + phase * 6) % 6 + 6) % 6 < 1;
      r.set(x, y, mark ? LEATHER[2] : LEATHER[0]);
      r.set(x + side, y, LEATHER[1]);
    }
  }
}
/** A stone plinth filling the footprint; returns the line its machine stands on. */
function plinth(r: Raster, X: number, Y: number, W: number, H: number, pal = STONE) {
  const deep = Math.min(30, H - 8), top = Y + H - 9 - deep;
  r.shadow(X + W / 2 + 3, Y + H - 2, W / 2 + 2, 5, 0.28);
  slab(r, X + 1, top, W - 2, deep, 8, pal);
  return Y + H - 9 - Math.round(deep * 0.36);
}
/** Brass posts and a red rope along the front of a plinth. */
function rope(r: Raster, X: number, W: number, y: number) {
  const gaps = Math.max(1, Math.round((W - 4) / 34)), step = (W - 4) / gaps;
  for (let k = 0; k < gaps; k++) for (let i = 0; i <= step; i++) r.set(X + 2 + k * step + i, y - 9 + Math.round(Math.sin((i / step) * Math.PI) * 4), i % 5 === 0 ? RED[3] : RED[1]);
  for (let k = 0; k <= gaps; k++) {
    const x = Math.round(X + 2 + k * step);
    r.fill(x - 1, y - 11, 2, 12, BRASS[2]); r.fill(x - 1, y - 11, 1, 12, BRASS[1]); r.fill(x - 2, y - 13, 4, 2, BRASS[0]); r.fill(x - 2, y, 4, 1, BRASS[3]);
  }
}

/** A horizontal steam engine: cylinder, crosshead, connecting rod and crank, a
 * governor, and a flywheel `rad` across turning in `th`. `x` is the bed's left
 * end, `base` the line it stands on. */
function steam(r: Raster, x: number, base: number, len: number, rad: number, th: number, body: string[], wheelPal: string[], big: boolean) {
  const axis = base - rad + (big ? 6 : 0), fx = x + len - rad - 2, crank = Math.round(rad * 0.36), rodLen = Math.round(rad * (big ? 1.5 : 1));
  const cr = big ? 15 : Math.max(4, Math.round(rad * 0.42)), ce = fx - crank - rodLen - (big ? 6 : 2), cl = Math.min(x + (big ? 8 : 2), ce - 7);
  // The bed, and the slot the wheel's foot turns in.
  slab(r, x, base - (big ? 7 : 4), len, 2, big ? 5 : 2, IRON);
  if (big) r.fill(fx - rad + 3, base - 2, rad * 2 - 6, 9, STONE[4]), r.fill(fx - rad + 3, base - 2, rad * 2 - 6, 1, "#4a443c");
  wheel(r, fx, axis, rad, big ? 7 : Math.max(2, Math.round(rad * 0.2)), 6, th, wheelPal);
  // The cylinder on its saddles, banded in brass, the valve chest on top.
  for (const sx of big ? [cl + 5, ce - 12] : [cl + 1]) r.fill(sx, axis + cr - 2, big ? 9 : 3, base - (big ? 7 : 4) - axis - cr + 2, IRON[2]), r.fill(sx, axis + cr - 2, 1, base - (big ? 7 : 4) - axis - cr + 2, IRON[1]);
  lying(r, cl, ce, axis, cr, body);
  r.fill(cl - 2, axis - cr + 2, 2, cr * 2 - 3, body[3]);
  r.fill(ce, axis - cr - 1, big ? 3 : 2, cr * 2 + 3, body[1]); r.fill(ce, axis - cr - 1, big ? 3 : 2, 1, body[0]);
  for (const bx of big ? [cl + 2, Math.round((cl + ce) / 2) - 1, ce - 5] : [cl + 1, ce - 3]) r.fill(bx, axis - cr, 2, cr * 2 + 1, BRASS[2]), r.fill(bx, axis - cr, 2, Math.ceil(cr * 0.6), BRASS[1]), r.set(bx, axis - cr + Math.round(cr * 0.4), BRASS[0]);
  const chest = Math.round((ce - cl) * 0.6), chx = cl + Math.round((ce - cl) * 0.2);
  slab(r, chx, axis - cr - (big ? 9 : 4), chest, big ? 3 : 1, big ? 6 : 3, body === IRON ? IRON : body);
  for (let k = 0; k < (big ? 3 : 1); k++) {
    const ox = chx + Math.round(((k + 0.5) * chest) / (big ? 3 : 1));
    r.fill(ox - 1, axis - cr - (big ? 15 : 7), 3, big ? 6 : 3, BRASS[2]); r.fill(ox - 1, axis - cr - (big ? 15 : 7), 1, big ? 6 : 3, BRASS[0]); r.fill(ox - 2, axis - cr - (big ? 16 : 8), 5, 1, BRASS[1]);
  }
  if (big) {
    // The steam pipe up from the chest, and a pressure gauge.
    standing(r, chx + 6, axis - cr - 30, axis - cr - 9, 3, IRON);
    r.fill(chx + 2, axis - cr - 32, 9, 3, IRON[1]); r.fill(chx + 2, axis - cr - 32, 9, 1, IRON[0]);
    disc(r, chx + chest - 8, axis - cr - 22, 4, (d) => (d > 3 ? BRASS[2] : d > 2.4 ? IRON[4] : "#f6f2e6"));
    r.set(chx + chest - 8, axis - cr - 22, IRON[4]); r.set(chx + chest - 7, axis - cr - 23, RED[2]);
    r.fill(chx + chest - 9, axis - cr - 17, 2, 8, BRASS[2]);
  }
  // The governor: two balls flung round a spindle, faster than the wheel.
  const gx = ce - (big ? 8 : 3), gt = axis - cr - (big ? 34 : 13), swing = Math.cos(th * 3) * (big ? 9 : 4), behind = Math.sin(th * 3) < 0;
  const balls = () => { for (const s of [-1, 1]) {
    const bx = Math.round(gx + s * swing), by = gt + (big ? 9 : 4);
    line(r, gx, gt + 1, bx, by, 1, BRASS[2], BRASS[2]);
    disc(r, bx, by, big ? 3 : 1.5, (d, a) => (d < 1.2 && Math.cos(a + 2.2) > 0 ? BRASS[0] : Math.cos(a + 2.2) > -0.3 ? BRASS[1] : BRASS[3]));
  } };
  if (behind) balls();
  r.fill(gx, gt, 1, axis - cr - gt - (big ? 9 : 4), STEEL[2]); r.fill(gx - 1, gt - 1, 3, 2, BRASS[1]);
  if (!behind) balls();
  // Piston rod, crosshead in its guides, the connecting rod to the crank pin.
  const pinX = fx + Math.cos(th) * crank, pinY = axis + Math.sin(th) * crank, headX = Math.round(pinX - Math.sqrt(rodLen * rodLen - (pinY - axis) ** 2));
  const g0 = ce + 2, g1 = fx - crank - rodLen + crank * 2 + (big ? 8 : 3);
  if (big) for (const gy of [axis - 7, axis + 6]) r.fill(g0, gy, g1 - g0, 2, IRON[1]), r.fill(g0, gy, g1 - g0, 1, IRON[0]);
  if (big) for (const sx of [g0 + 2, g1 - 4]) r.fill(sx, axis + 8, 3, base - 7 - axis - 8, IRON[2]);
  r.fill(ce + 2, axis - 1, headX - ce - 2, big ? 2 : 1, STEEL[1]); if (big) r.fill(ce + 2, axis, headX - ce - 2, 1, STEEL[3]);
  if (big) r.fill(ce + 3, axis - 3, 3, 6, BRASS[2]), r.fill(ce + 3, axis - 3, 3, 2, BRASS[0]);
  r.fill(headX - (big ? 4 : 1), axis - (big ? 5 : 2), big ? 9 : 3, big ? 11 : 4, STEEL[2]); r.fill(headX - (big ? 4 : 1), axis - (big ? 5 : 2), big ? 9 : 3, 1, STEEL[0]);
  disc(r, fx, axis, crank + (big ? 4 : 1.5), (d, a) => {
    let off = Math.abs(a - th); if (off > Math.PI) off = TAU - off;
    return d < (big ? 5 : 2) ? IRON[1] : off < (big ? 0.5 : 0.8) ? (d > crank + (big ? 3 : 1) ? IRON[4] : IRON[0]) : undefined;
  });
  line(r, headX, axis, pinX, pinY, big ? 3 : 2, STEEL[1], STEEL[3]);
  disc(r, Math.round(pinX), Math.round(pinY), big ? 3.4 : 1.6, (d) => (d < (big ? 1.6 : 0.8) ? STEEL[0] : BRASS[d > (big ? 2.8 : 1.2) ? 3 : 1]));
  disc(r, fx, axis, big ? 3 : 1.5, (d) => (d < 1.3 ? BRASS[0] : BRASS[2]));
}

/** One machine's frames. `w` and `h` are its cells; `v` picks a variant. */
export function paintMachine(kind: MachineKind, w: number, h: number, v: number): Machine {
  const W = w * 16, H = h * 16, pad = 8;
  const frame = (rise: number, n: number, fps: number, draw: (r: Raster, X: number, Y: number, k: number, th: number) => void): Machine => ({
    frames: Array.from({ length: n }, (_, k) => {
      const r = new Raster(W + pad * 2, H + rise + 6);
      draw(r, pad, rise, k, (k / n) * TAU);
      return r.finish();
    }),
    fps, ox: pad, oy: rise,
  });
  if (kind === "mill-engine") return frame(72, 16, 11, (r, X, Y, _, th) => {
    const base = plinth(r, X, Y, W, H), rad = Math.min(40, Math.round(W * 0.19));
    steam(r, X + 12, base, W - 24, rad, th, IRON, IRON, true);
    rope(r, X, W, Y + H - 2);
  });
  if (kind === "engine") return frame(64, 16, 14, (r, X, Y, _, th) => {
    // A vertical engine: the cylinder up on an A-frame, its rod working straight
    // down to the crank, and the flywheel on the same shaft.
    const base = plinth(r, X, Y, W, H), body = v < 0.5 ? GREEN : IRON, rad = Math.min(14, Math.round(W * 0.29)), fx = X + (W >> 1) + 2, axis = base - rad - 2;
    const crank = Math.round(rad * 0.4), rodLen = rad + 6, foot = axis - crank - rodLen - 3;
    slab(r, fx - rad - 6, base - 4, rad * 2 + 12, 2, 2, body);
    wheel(r, fx, axis, rad, Math.max(2, Math.round(rad * 0.22)), 6, th, RED);
    for (const s of [-1, 1]) line(r, fx + s * 6, foot, fx + s * (rad + 4), base - 4, 3, body[1], body[3]);
    r.fill(fx - rad - 1, axis - 1, rad * 2 + 3, 3, body[2]); r.fill(fx - rad - 1, axis - 1, rad * 2 + 3, 1, body[1]);
    standing(r, fx, foot - 15, foot, 7, body);
    r.fill(fx - 8, foot - 1, 17, 2, body[3]); r.fill(fx - 8, foot - 16, 17, 2, body[3]); r.fill(fx - 8, foot - 16, 6, 1, body[1]);
    for (const y of [foot - 12, foot - 5]) r.fill(fx - 7, y, 15, 1, BRASS[2]), r.fill(fx - 5, y, 4, 1, BRASS[0]);
    slab(r, fx - 13, foot - 13, 6, 2, 9, body);
    r.fill(fx - 1, foot - 21, 3, 5, BRASS[2]); r.fill(fx - 1, foot - 21, 1, 5, BRASS[0]); r.fill(fx - 2, foot - 22, 5, 1, BRASS[1]);
    // The governor on a bracket at the side.
    const gx = fx + 12, gt = foot - 14, swing = Math.cos(th * 3) * 4;
    r.fill(gx, gt, 1, 12, STEEL[2]); r.fill(fx + 7, foot - 3, 6, 1, body[2]);
    for (const sd of [-1, 1]) {
      line(r, gx, gt + 1, gx + sd * swing, gt + 5, 1, BRASS[2], BRASS[2]);
      disc(r, Math.round(gx + sd * swing), gt + 5, 1.6, (d) => (d < 0.8 ? BRASS[0] : BRASS[2]));
    }
    r.fill(gx - 1, gt - 1, 3, 1, BRASS[1]);
    const pinX = fx + Math.cos(th) * crank, pinY = axis + Math.sin(th) * crank, headY = Math.round(pinY - Math.sqrt(rodLen * rodLen - (pinX - fx) ** 2));
    r.fill(fx, foot, 1, headY - foot, STEEL[1]);
    r.fill(fx - 2, headY - 2, 5, 3, STEEL[2]); r.fill(fx - 2, headY - 2, 5, 1, STEEL[0]);
    line(r, fx, headY, pinX, pinY, 2, STEEL[1], STEEL[3]);
    disc(r, fx, axis, 2.6, (d) => (d < 1.2 ? BRASS[0] : IRON[2]));
    disc(r, Math.round(pinX), Math.round(pinY), 1.8, (d) => (d < 0.9 ? STEEL[0] : BRASS[2]));
  });
  if (kind === "dynamo") return frame(34, 8, 16, (r, X, Y, k, th) => {
    // Two field magnets wound in copper under an iron yoke, the armature between
    // their feet turned by a belt pulley, sparks at the brushes.
    const base = plinth(r, X, Y, W, H), cx = X + (W >> 1);
    slab(r, X + 4, base - 5, W - 8, 2, 3, IRON);
    for (const mx of [cx - 7, cx + 7]) {
      standing(r, mx, base - 27, base - 5, 5, COPPER);
      for (let y = base - 25; y < base - 6; y += 3) r.fill(mx - 5, y, 11, 1, COPPER[3]);
    }
    slab(r, cx - 14, base - 33, 28, 2, 5, IRON);
    standing(r, cx, base - 39, base - 33, 3, BRASS);
    lying(r, cx - 5, cx + 5, base - 9, 4, COPPER);
    r.fill(cx + 5, base - 12, 2, 7, BRASS[1]);
    if (k % 2 === 0) r.set(cx + 7, base - 13 + (k % 4), "#dff4ff"), r.set(cx + 8, base - 12 + (k % 4), "#8fd0ff");
    wheel(r, X + W - 7, base - 9, 5, 1.5, 4, th / 4, IRON);
  });
  if (kind === "line-shaft") return frame(64, 8, 12, (r, X, Y, k, th) => {
    // A shaft on two trestles over a wooden platform, belted down to a lathe, a
    // drill and a grindstone.
    r.shadow(X + W / 2 + 3, Y + H - 2, W / 2 + 2, 5, 0.28);
    slab(r, X + 1, Y + H - 34, W - 2, 24, 8, WOOD);
    for (let x = X + 13; x < X + W - 2; x += 12) r.fill(x, Y + H - 33, 1, 23, WOOD[2]);
    const base = Y + H - 20, shaft = base - 62, turn = th / 2;
    for (const ax of [X + 16, X + W - 16]) {
      for (const s of [-1, 1]) line(r, ax, shaft, ax + s * 11, base, 3, IRON[1], IRON[3]);
      r.fill(ax - 6, base - 22, 13, 2, IRON[2]);
      r.fill(ax - 3, shaft - 3, 7, 6, IRON[1]); r.fill(ax - 3, shaft - 3, 7, 1, IRON[0]);
    }
    r.fill(X + 10, shaft - 1, W - 20, 3, STEEL[2]); r.fill(X + 10, shaft - 1, W - 20, 1, STEEL[0]);
    for (let x = X + 12 + ((k * 3) % 12); x < X + W - 12; x += 12) r.set(x, shaft, STEEL[3]);
    const third = (W - 60) / 2;
    [0, 1, 2].forEach((m) => {
      const mx = Math.round(X + 30 + m * third), low = base - (m === 1 ? 30 : 16);
      belt(r, mx, shaft, 6, mx, low, 4, k / 8);
      wheel(r, mx, shaft, 7, 2, 4, turn, IRON);
      if (m === 0) {
        // A lathe: bed on two legs, headstock under the belt, the work turning between centres.
        slab(r, mx - 8, base - 9, 44, 2, 4, IRON);
        for (const lx of [mx - 5, mx + 30]) r.fill(lx, base - 3, 4, 3, IRON[2]);
        slab(r, mx - 7, base - 21, 14, 2, 10, GREEN);
        lying(r, mx + 7, mx + 28, base - 15, 2, STEEL.slice(0, 4).concat(STEEL[3]));
        slab(r, mx + 28, base - 18, 6, 2, 7, GREEN);
      } else if (m === 1) {
        // A pillar drill: column, head, the table under the bit.
        standing(r, mx + 9, base - 40, base - 2, 2, IRON);
        slab(r, mx - 6, base - 37, 18, 2, 5, GREEN);
        r.fill(mx, base - 26, 1, 10, STEEL[k % 2 ? 1 : 2]);
        slab(r, mx - 6, base - 15, 14, 2, 2, IRON);
        slab(r, mx - 2, base - 4, 16, 2, 2, IRON);
      } else {
        // A grindstone in its trough, throwing a spark now and then.
        slab(r, mx - 12, base - 8, 24, 2, 6, GREEN);
        wheel(r, mx + 12, base - 14, 9, 3, 4, turn, ["#e4dccc", "#c8bea8", "#a89e8a", "#887e6c", "#5e564a"]);
        if (k % 3 === 0) r.set(mx + 22 + (k % 2), base - 16 - (k % 4), "#ffe08a");
      }
      wheel(r, mx, low, 5, 1.5, 4, turn * 1.5, IRON);
    });
  });
  return frame(44, 16, 12, (r, X, Y, _, th) => {
    // A steam pump: the tall water cylinder and its air vessel, the delivery pipe
    // arched over to the steam end, and the rod working between them.
    const base = plinth(r, X, Y, W, H), lift = Math.round(Math.sin(th) * 4), ax = X + 14, bx = X + W - 14;
    slab(r, X + 5, base - 5, W - 10, 2, 3, GREEN);
    standing(r, ax, base - 30, base - 5, 7, GREEN);
    disc(r, ax, base - 31, 7, (d, a) => (Math.sin(a) > 0.1 ? undefined : GREEN[Math.cos(a + 2.2) > 0.2 ? 0 : d > 5.5 ? 2 : 1]));
    for (const y of [base - 24, base - 11]) r.fill(ax - 8, y, 17, 2, GREEN[3]), r.fill(ax - 8, y, 6, 1, GREEN[1]);
    standing(r, bx, base - 22, base - 5, 5, GREEN);
    r.fill(bx - 6, base - 23, 13, 2, GREEN[3]);
    // The arch of pipe between the two.
    const mid = (ax + bx) / 2, half = (bx - ax) / 2;
    for (let t = 0; t <= Math.PI; t += 0.01) for (let k = -2; k <= 2; k++) r.set(mid - Math.cos(t) * (half + k), base - 30 - Math.sin(t) * (10 + k), GREEN[k < -1 ? 3 : k < 0 ? 2 : k < 2 ? 1 : 0]);
    for (const fxp of [ax, bx]) r.fill(fxp - 4, base - 31, 9, 2, GREEN[3]);
    r.fill(Math.round(mid) - 1, base - 44, 3, 3, BRASS[1]);
    // The rod and its crosshead rising and falling, and a small wheel to carry it over the dead centre.
    r.fill(Math.round(mid), base - 26 + lift, 1, 21 - lift, STEEL[1]);
    r.fill(Math.round(mid) - 3, base - 27 + lift, 7, 3, STEEL[2]); r.fill(Math.round(mid) - 3, base - 27 + lift, 7, 1, STEEL[0]);
    wheel(r, Math.round(mid), base - 10, 4, 1.5, 4, th, RED);
  });
}
