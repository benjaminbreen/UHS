import { CYCLE_SEATS, CYCLE_SPECS, cyclePose, type CycleKind, type CycleLook, type CyclePose } from "../../core/cycles";

/** Every cycle frame is this size, wheels standing on row `CYCLE_GROUND`
 * about the column `CYCLE_W / 2`. */
export const CYCLE_W = 80;
export const CYCLE_H = 70;
export const CYCLE_GROUND = 60;
/** The machines are drawn to a chibi rider: geometry is authored small and laid
 * out this much larger, a motorcycle more so. Set for the machine being painted. */
let K = 1.3;
const OX = CYCLE_W / 2;

/** `quarter` heads toward the viewer on the diagonal, `quarter-back` away. */
export type CycleView = "side" | "quarter" | "quarter-back" | "front" | "back";
export interface CycleState {
  /** Eighths of a crank turn. */
  crank?: number;
  /** Sixteenths of the turn between two spokes. */
  spin?: number;
  /** Spokes smeared into a disc. */
  blur?: boolean;
  /** Standing on its stand, nobody aboard. */
  parked?: boolean;
  /** Lying on its side. */
  fallen?: boolean;
  /** Headlamp lit. */
  lit?: boolean;
  /** A soft ground shadow under the wheels, for a machine drawn on its own. */
  shadow?: boolean;
}
export interface CycleArt {
  /** RGBA, drawn behind the rider. */
  under: Uint8ClampedArray;
  /** RGBA, drawn in front of the rider. */
  over: Uint8ClampedArray;
  /** The rider image's bottom centre, in pixels right of and above the ground anchor. */
  rider: [number, number];
  pose: CyclePose;
  /** Where each tyre meets the ground, right of the anchor. */
  contact: [number, number];
}

type C = readonly [number, number, number, number];
const hex = (h: string, a = 255): C => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
};
const mix = (a: C, b: C, t: number): C => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3]];
const PLUM = hex("#33263f"), WARM = hex("#fff0c8");
const dark = (c: C, f = 0.66): C => mix([c[0] * f, c[1] * f, c[2] * f, c[3]], PLUM, 0.16);
const lite = (c: C, t = 0.32): C => mix(c, WARM, t);
const alpha = (c: C, a: number): C => [c[0], c[1], c[2], a];

const TYRES = { black: hex("#35313c"), gum: hex("#35313c"), white: hex("#35313c"), cream: hex("#a89f8c") };
const RIMS = { black: hex("#aeb4bd"), gum: hex("#c79a5e"), white: hex("#efece2"), cream: hex("#8d8778") };
const STEEL = hex("#aeb4bd"), STEEL_D = hex("#6c7380"), CHROME = hex("#e4e8ec"), IRON = hex("#3d3b46"), RUBBER = hex("#2a2730");
const WOOD = hex("#a8743c"), WOOD_D = hex("#70482a");
const WICKER = hex("#c89c58"), WICKER_D = hex("#8c6634");
const AMBER = hex("#f2a22e"), RED = hex("#d8382e"), LENS = hex("#fff2a8"), GLASS = hex("#bfe0ea");

class Layer {
  readonly data = new Uint8ClampedArray(CYCLE_W * CYCLE_H * 4);
  /** Flattened onto the ground for a fallen machine. */
  flat = false;
  /** Authored units to pixels. */
  k = K;
  /** Turned an eighth: 1 with the nose toward the viewer, -1 away. */
  quarter = 0;
  /** Whole pixels sideways after the turn. */
  nudge = 0;
  put(x: number, y: number, c: C) {
    if (this.flat) [x, y] = [x + y * 0.35, y * 0.42];
    if (this.quarter) {
      // Three columns become two and step one row: the two-to-one line of a diagonal.
      const q = Math.floor(x / 3);
      x = q * 2 + Math.min(1, x - q * 3) + this.nudge;
      y -= this.quarter * q;
    }
    const px = OX + Math.round(x), py = CYCLE_GROUND - Math.round(y);
    if (px < 0 || py < 0 || px >= CYCLE_W || py >= CYCLE_H) return;
    const i = (py * CYCLE_W + px) * 4, d = this.data;
    if (c[3] >= 255 || d[i + 3] === 0) {
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3];
    } else {
      const a = c[3] / 255;
      d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a;
      d[i + 3] = Math.max(d[i + 3], c[3]);
    }
  }
  set(x: number, y: number, c: C) {
    this.put(Math.round(x * this.k), Math.round(y * this.k), c);
  }
  /** `ox`, `oy` shift the whole line by whole pixels. */
  line(x0: number, y0: number, x1: number, y1: number, c: C, ox = 0, oy = 0) {
    x0 = Math.round(x0 * this.k) + ox; y0 = Math.round(y0 * this.k) + oy; x1 = Math.round(x1 * this.k) + ox; y1 = Math.round(y1 * this.k) + oy;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.put(x0, y0, c);
      if (x0 === x1 && y0 === y1) return;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  path(points: readonly (readonly [number, number])[], c: C) {
    for (let i = 1; i < points.length; i++) this.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], c);
  }
  /** A one-pixel circle in pixels, or the part of it between two angles (degrees, anticlockwise from east). */
  ring(cx: number, cy: number, r: number, c: C, from = 0, to = 360) {
    let x = r, y = 0, err = 1 - r;
    const put = (dx: number, dy: number) => {
      const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      if (to - from >= 360 || (a >= from && a <= to)) this.put(cx + dx, cy + dy, c);
    };
    while (x >= y) {
      for (const [dx, dy] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) put(dx, dy);
      y++;
      if (err < 0) err += 2 * y + 1;
      else { x--; err += 2 * (y - x) + 1; }
    }
  }
  disc(cx: number, cy: number, r: number, c: C) {
    cx = Math.round(cx * this.k); cy = Math.round(cy * this.k); r *= this.k;
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++)
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) if (Math.hypot(dx, dy) <= r + 0.3) this.put(cx + dx, cy + dy, c);
  }
  rect(x0: number, y0: number, x1: number, y1: number, c: C) {
    const k = this.k, ax = Math.round(x0 * k), ay = Math.round(y0 * k), bx = Math.round(x1 * k), by = Math.round(y1 * k);
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) this.put(x, y, c);
  }
  curve(a: readonly [number, number], ctrl: readonly [number, number], b: readonly [number, number], c: C, ox = 0, oy = 0) {
    let px = a[0], py = a[1];
    for (let i = 1; i <= 14; i++) {
      const t = i / 14, u = 1 - t;
      const x = u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0], y = u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1];
      this.line(px, py, x, y, c, ox, oy);
      [px, py] = [x, y];
    }
  }
  /** A filled shape with a darker rim and a lit top edge. */
  blob(shape: readonly (readonly [number, number])[], fill: C, rim: C = dark(fill), top: C | undefined = lite(fill)) {
    const points = shape.map(([x, y]) => [Math.round(x * this.k), Math.round(y * this.k)] as const);
    const ys = points.map((p) => p[1]);
    const cells: [number, number][] = [];
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length];
        if (y0 === y1) { if (y === y0) xs.push(x0, x1); continue; }
        if (y >= Math.min(y0, y1) && y <= Math.max(y0, y1)) xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
      }
      if (!xs.length) continue;
      for (let x = Math.round(Math.min(...xs)); x <= Math.round(Math.max(...xs)); x++) cells.push([x, y]);
    }
    const key = new Set(cells.map(([x, y]) => `${x},${y}`));
    for (const [x, y] of cells) {
      const edge = !key.has(`${x - 1},${y}`) || !key.has(`${x + 1},${y}`) || !key.has(`${x},${y - 1}`);
      const up = !key.has(`${x},${y + 1}`);
      this.put(x, y, up && top ? top : edge || up ? rim : fill);
    }
  }
}

interface Geo {
  rR: number; rF: number; twR: number; twF: number;
  xr: number; xf: number;
  /** Centre of the pedal circle, or of the footrests. */
  bb: [number, number];
  spokesR: number; spokesF: number;
  /** Half the handlebar's width seen head-on. */
  bar: number;
}

const GEO: Readonly<Record<CycleKind, Geo>> = {
  draisine: { rR: 7, rF: 7, twR: 1, twF: 1, xr: -10, xf: 9, bb: [-2, 0], spokesR: 4, spokesF: 4, bar: 4 },
  boneshaker: { rR: 6, rF: 8, twR: 1, twF: 1, xr: -11, xf: 6, bb: [6, 8], spokesR: 4, spokesF: 4, bar: 5 },
  penny: { rR: 3, rF: 11, twR: 1, twF: 1, xr: -12, xf: 4, bb: [4, 11], spokesR: 2, spokesF: 6, bar: 6 },
  roadster: { rR: 7, rF: 7, twR: 1, twF: 1, xr: -10, xf: 9, bb: [-2, 6], spokesR: 3, spokesF: 3, bar: 6 },
  loop: { rR: 7, rF: 7, twR: 1, twF: 1, xr: -10, xf: 9, bb: [-2, 6], spokesR: 3, spokesF: 3, bar: 6 },
  cruiser: { rR: 7, rF: 7, twR: 2, twF: 2, xr: -10, xf: 10, bb: [-2, 6], spokesR: 3, spokesF: 3, bar: 7 },
  racer: { rR: 7, rF: 7, twR: 1, twF: 1, xr: -9, xf: 9, bb: [-1, 6], spokesR: 3, spokesF: 3, bar: 4 },
  chopper: { rR: 6, rF: 5, twR: 2, twF: 1, xr: -9, xf: 12, bb: [-2, 5], spokesR: 2, spokesF: 2, bar: 6 },
  bmx: { rR: 5, rF: 5, twR: 2, twF: 2, xr: -8, xf: 7, bb: [-2, 5], spokesR: 2, spokesF: 2, bar: 6 },
  mtb: { rR: 7, rF: 7, twR: 2, twF: 2, xr: -10, xf: 10, bb: [-2, 7], spokesR: 3, spokesF: 3, bar: 7 },
  folder: { rR: 4, rF: 4, twR: 1, twF: 1, xr: -8, xf: 8, bb: [-1, 5], spokesR: 2, spokesF: 2, bar: 5 },
  "moto-early": { rR: 7, rF: 7, twR: 1, twF: 1, xr: -11, xf: 10, bb: [-3, 4], spokesR: 4, spokesF: 4, bar: 6 },
  "moto-classic": { rR: 6, rF: 6, twR: 2, twF: 2, xr: -11, xf: 11, bb: [-4, 5], spokesR: 4, spokesF: 4, bar: 6 },
  scooter: { rR: 4, rF: 4, twR: 2, twF: 2, xr: -9, xf: 9, bb: [-2, 5], spokesR: 0, spokesF: 0, bar: 6 },
  cub: { rR: 6, rF: 6, twR: 1, twF: 1, xr: -10, xf: 10, bb: [-3, 5], spokesR: 4, spokesF: 4, bar: 6 },
  dirtbike: { rR: 6, rF: 7, twR: 2, twF: 2, xr: -11, xf: 11, bb: [-3, 6], spokesR: 4, spokesF: 4, bar: 7 },
  sportbike: { rR: 6, rF: 6, twR: 2, twF: 2, xr: -11, xf: 11, bb: [-4, 6], spokesR: 0, spokesF: 0, bar: 5 },
};

function seat(kind: CycleKind) {
  const g = GEO[kind], s = CYCLE_SEATS[cyclePose(kind)];
  // The rider's own measures are pixels; everything returned but `rider` is in authored units.
  const x = g.bb[0] * K - s.ahead, base = g.bb[1] * K - s.pedalUp;
  return { hip: [x / K, (base + s.hip) / K] as const, grip: [(x + s.reach) / K, (base + s.hand) / K] as const, rider: [Math.round(x), Math.round(base)] as [number, number], crank: s.crank / K };
}

function wheel(l: Layer, x: number, radius: number, tw: number, look: CycleLook, spokes: number, st: CycleState, o: { wood?: boolean; mag?: C; knobs?: boolean; disc?: C } = {}) {
  const cx = Math.round(x * K), r = Math.round(radius * K), cy = r;
  const tyre = o.wood ? IRON : TYRES[look.tyre], hi = lite(tyre, 0.22);
  if (l.quarter) {
    // The tread's width, showing past the far edge.
    l.nudge = 1;
    l.ring(cx, cy, r, dark(tyre, 0.8));
    if (tw >= 2) l.ring(cx, cy, r - 1, dark(tyre, 0.8));
    l.nudge = 0;
  }
  if (tw >= 2) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > r - 1.6 && d <= r + 0.45) l.put(cx + dx, cy + dy, tyre);
    }
    if (o.knobs) for (let a = 0; a < 360; a += 24) {
      const t = ((a + (st.spin ?? 0) * 6) * Math.PI) / 180;
      l.put(cx + Math.round(Math.cos(t) * (r + 0.3)), cy + Math.round(Math.sin(t) * (r + 0.3)), hi);
    }
  } else l.ring(cx, cy, r, tyre);
  l.ring(cx, cy, r, hi, 100, 150);
  const inner = r - tw;
  const rim = o.wood ? WOOD : RIMS[look.tyre];
  if (inner >= 3) l.ring(cx, cy, inner, rim);
  const reach = inner >= 3 ? inner - 1 : inner;
  const k = l.k;
  l.k = 1;
  if (o.disc) {
    l.disc(cx, cy, reach, o.disc);
    l.disc(cx, cy, 1.5, STEEL_D);
    l.put(cx, cy, STEEL);
    l.k = k;
    return;
  }
  const n = Math.max(1, spokes), base = (((st.spin ?? 0) % 16) / 16) * (Math.PI / n);
  if (st.blur && reach >= 3) l.disc(cx, cy, reach, alpha(STEEL, 70));
  else {
    const c = o.mag ?? (o.wood ? WOOD_D : alpha(STEEL, 165));
    for (let i = 0; i < n; i++) {
      const a = base + (i * Math.PI) / n, dx = Math.cos(a) * reach, dy = Math.sin(a) * reach;
      l.line(cx - dx, cy - dy, cx + dx, cy + dy, c);
    }
  }
  if (look.reflectors && reach >= 4) {
    const a = base * n + 0.6;
    l.put(cx + Math.round(Math.cos(a) * (reach - 1)), cy + Math.round(Math.sin(a) * (reach - 1)), AMBER);
    l.put(cx - Math.round(Math.cos(a) * (reach - 1)), cy - Math.round(Math.sin(a) * (reach - 1)), AMBER);
  }
  l.put(cx, cy, o.wood ? IRON : STEEL_D);
  l.k = k;
}

function fender(l: Layer, x: number, radius: number, c: C, from: number, to: number) {
  const cx = Math.round(x * K), r = Math.round(radius * K);
  l.ring(cx, r, r + 1, c, from, to);
  l.ring(cx, r, r + 1, lite(c, 0.35), Math.max(from, 70), Math.min(to, 110));
}

/** A frame tube: the colour over a line of its own shade, so it reads as round. */
function tube(l: Layer, a: readonly [number, number], b: readonly [number, number], c: C) {
  const flat = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
  l.line(a[0], a[1], b[0], b[1], dark(c), flat ? 0 : -1, flat ? -1 : 0);
  l.line(a[0], a[1], b[0], b[1], c);
}

function saddle(l: Layer, x: number, y: number, c: C, long = 0) {
  const hi = lite(c, 0.25);
  l.rect(x - 2 - long, y, x + 2, y, c);
  l.set(x - 2 - long, y + 1, c);
  l.set(x - 1 - long, y + 1, hi);
  l.set(x + 2, y, hi);
  l.set(x - 1, y - 1, dark(c));
  l.set(x, y - 1, dark(c));
}

function cranks(l: Layer, bb: readonly [number, number], len: number, st: CycleState) {
  if (!len) return;
  const a = (((st.parked ? 1 : (st.crank ?? 0)) % 8) / 8) * Math.PI * 2;
  const dx = Math.sin(a) * len, dy = Math.cos(a) * len;
  l.line(bb[0], bb[1], bb[0] - dx, bb[1] - dy, STEEL_D);
  l.rect(bb[0] - dx - 1, bb[1] - dy, bb[0] - dx + 1, bb[1] - dy, IRON);
  l.line(bb[0], bb[1], bb[0] + dx, bb[1] + dy, STEEL);
  l.rect(bb[0] + dx - 1, bb[1] + dy, bb[0] + dx + 1, bb[1] + dy, RUBBER);
}

function basket(l: Layer, x: number, y: number, look: CycleLook, w = 5) {
  const kind = look.front;
  if (!kind || kind === "lamp") return;
  const body = kind === "wicker" ? WICKER : kind === "wire" ? STEEL : hex("#4f7fb8"), rim = kind === "wicker" ? WICKER_D : kind === "wire" ? STEEL_D : hex("#345a8a");
  if (look.cargo === "flowers") {
    for (const [dx, c] of [[0, "#e8638f"], [2, "#f2d03a"], [4, "#f4f0ea"], [1, "#f2742c"]] as const) {
      l.set(x + dx, y + 5 + (dx & 1), hex(c));
      l.set(x + dx, y + 4, hex("#4f8f4a"));
    }
  } else if (look.cargo === "bread") {
    l.line(x + 1, y + 3, x + 5, y + 7, hex("#d8a25a"));
    l.line(x + 2, y + 3, x + 6, y + 7, hex("#b87c3a"));
  } else if (look.cargo === "greens") {
    l.rect(x, y + 4, x + w - 1, y + 4, hex("#4f8f4a"));
    l.set(x + 1, y + 5, hex("#7fb85a")); l.set(x + 3, y + 5, hex("#7fb85a"));
  } else if (look.cargo === "parcel") {
    l.rect(x + 1, y + 4, x + w - 2, y + 5, hex("#b8915e"));
    l.set(x + 2, y + 5, hex("#8a6238"));
  }
  l.rect(x, y, x + w - 1, y + 3, body);
  l.rect(x, y + 3, x + w - 1, y + 3, rim);
  l.rect(x, y, x + w - 1, y, rim);
  if (kind !== "crate") for (let dx = 1; dx < w - 1; dx += 2) { l.set(x + dx, y + 1, rim); l.set(x + dx + 1 < x + w ? x + dx + 1 : x + dx, y + 2, rim); }
}

function rearLoad(l: Layer, g: Geo, look: CycleLook, paint: C) {
  if (!look.rear) return;
  const top = g.rR * 2 + 2, x0 = g.xr - 4, x1 = g.xr + 3;
  l.line(x0, top, x1 + 1, top, STEEL_D);
  l.line(g.xr - 2, top, g.xr, g.rR, STEEL_D);
  if (look.rear === "box") {
    const box = CYCLE_SPECS[look.kind].motor ? hex("#e8e4d8") : hex("#a8743c");
    l.blob([[x0, top + 1], [x1, top + 1], [x1, top + 5], [x0, top + 5]], box);
    l.set(x0 + 2, top + 3, dark(box));
  } else if (look.rear === "panniers") {
    const bag = mix(paint, hex("#6b5a3a"), 0.75);
    l.blob([[x0 + 1, top - 5], [x1 - 1, top - 5], [x1 - 1, top - 1], [x0 + 1, top - 1]], bag);
    l.set(g.xr - 1, top - 3, lite(bag, 0.4));
  }
}

function bicycle(l: Layer, look: CycleLook, st: CycleState) {
  const kind = look.kind, g = GEO[kind], s = seat(kind);
  const paint = hex(look.paint), accent = hex(look.accent), sh = dark(paint), back = dark(accent, 0.8);
  const [hx, hy] = s.hip, [gx, gy] = s.grip, bb = g.bb;
  const R: [number, number] = [g.xr, g.rR], F: [number, number] = [g.xf, g.rF];
  const wood = kind === "draisine" || kind === "boneshaker";
  const stand = () => { if (st.parked) l.line(bb[0] - 3, bb[1] - 1, bb[0] - 6, 0, STEEL_D); };

  if (look.flag) {
    l.curve([g.xr, g.rR], [g.xr - 2, 18], [g.xr - 4, 31], STEEL_D);
    l.blob([[g.xr - 4, 31], [g.xr - 9, 29], [g.xr - 4, 27]], hex("#f2742c"), hex("#c9521c"), undefined);
  }
  wheel(l, R[0], g.rR, g.twR, look, g.spokesR, st, { wood, knobs: kind === "mtb", mag: kind === "bmx" && look.accent !== look.paint ? accent : undefined });
  wheel(l, F[0], g.rF, g.twF, look, g.spokesF, st, { wood, knobs: kind === "mtb", mag: kind === "bmx" && look.accent !== look.paint ? accent : undefined });
  if (look.fenders) {
    fender(l, R[0], g.rR, paint, 20, 170);
    fender(l, F[0], g.rF, paint, 40, 150);
  }

  if (kind === "penny") {
    const head: [number, number] = [gx - 1, g.rF * 2 + 1.6];
    l.line(head[0], head[1] - 1, F[0], F[1], STEEL_D);
    l.curve([head[0], head[1]], [-9, head[1]], [R[0], R[1]], sh, -1, -1);
    l.curve([head[0], head[1]], [-9, head[1]], [R[0], R[1]], paint);
    l.rect(-8, 9, -7, 9, STEEL_D);
    saddle(l, hx - 0.5, hy - 1, hex(look.saddle));
    l.line(head[0], head[1], head[0], gy, STEEL_D);
    l.line(head[0] - 1, gy, gx + 1, gy, STEEL);
    l.set(gx + 1, gy - 1, RUBBER); l.set(gx + 1, gy, RUBBER);
    cranks(l, bb, s.crank, st);
    return;
  }
  if (kind === "boneshaker") {
    const head: [number, number] = [gx - 1, 18];
    l.line(head[0], head[1], F[0], F[1], IRON);
    l.curve([head[0], head[1]], [-2, 19], [R[0], R[1]], sh, 0, -1);
    l.curve([head[0], head[1]], [-2, 19], [R[0], R[1]], paint);
    l.curve([hx + 3, hy - 3], [hx, hy - 1], [hx - 4, hy - 3], IRON);
    saddle(l, hx, hy - 1, hex(look.saddle));
    l.line(head[0], head[1], head[0], gy, IRON);
    l.line(head[0] - 1, gy, gx + 1, gy, WOOD);
    l.set(gx + 1, gy, WOOD_D);
    cranks(l, bb, s.crank, st);
    return;
  }
  if (kind === "draisine") {
    // A wooden beam between two cart wheels, steered by a tiller.
    tube(l, R, [R[0] + 2, 10], WOOD);
    tube(l, F, [F[0] - 1, 13], WOOD);
    l.blob([[R[0] - 2, 12], [F[0] - 2, 12], [F[0], 9], [R[0], 9]], paint, dark(paint), lite(paint, 0.35));
    l.blob([[hx - 3, hy - 2], [hx + 2, hy - 2], [hx + 2, hy - 1], [hx - 3, hy - 1]], hex(look.saddle), dark(hex(look.saddle)), lite(hex(look.saddle), 0.3));
    l.line(F[0] - 1, 13, gx, gy, WOOD);
    l.line(gx - 1, gy, gx + 1, gy, WOOD_D);
    l.line(hx + 4, 12, hx + 4, 14, WOOD_D); l.rect(hx + 3, 15, hx + 5, 15, WOOD);
    return;
  }

  // Seat cluster, head tube top and bottom.
  const S: [number, number] = [hx - 0.5, hy - 3];
  let HT: [number, number], HB: [number, number];
  if (kind === "chopper") { HT = [3, 14]; HB = [5, 11]; }
  else if (kind === "bmx") { HT = [3, 11]; HB = [4, 9]; }
  else if (kind === "folder") { HT = [5, 10]; HB = [6, 8]; }
  else if (kind === "racer") { HT = [5, 14]; HB = [6, 11]; }
  else if (kind === "mtb") { HT = [5, 15]; HB = [6, 12]; }
  else { HT = [5, 14]; HB = [6, 11]; }

  // Rear triangle first, so the main tubes lie over it.
  l.line(bb[0], bb[1] - 1, R[0], R[1] - 1, IRON);
  l.line(bb[0], bb[1], R[0], R[1], back);
  if (kind === "bmx") S[1] = 11;
  if (kind === "folder") {
    l.line(R[0], R[1], bb[0] - 2, 9, back);
    l.line(HB[0], HB[1], bb[0], bb[1], paint);
    l.line(bb[0] - 2, 9, HB[0] - 1, HB[1], paint);
    l.set(1, 8, STEEL);
    l.line(bb[0], bb[1], S[0], S[1], STEEL);
  } else {
    l.line(S[0], S[1], R[0], R[1], back);
    tube(l, S, bb, paint);
  }
  if (kind === "loop") {
    l.curve([HB[0], HB[1]], [1, 6], [bb[0], bb[1]], dark(paint), 0, -1);
    l.curve([HB[0], HB[1]], [1, 6], [bb[0], bb[1]], paint);
    l.curve([HT[0], HT[1] - 1], [1, 8], [S[0] + 2, bb[1] + 4], paint);
  } else if (kind === "cruiser") {
    l.curve([S[0] + 1, S[1] - 3], [1, 11], [HB[0], HB[1]], dark(paint));
    l.blob([[-1, 11], [4, 11], [4, 14], [0, 14]], accent, dark(accent), lite(accent, 0.4));
    l.curve([S[0], S[1]], [0, 16], [HT[0], HT[1]], paint);
    tube(l, HB, bb, paint);
  } else if (kind === "chopper") {
    tube(l, [S[0], S[1] - 2], HT, paint);
    tube(l, HB, bb, paint);
    l.set(1, 13, STEEL); l.set(1, 14, RUBBER);
  } else if (kind !== "folder") {
    tube(l, S, [HT[0], HT[1] - (kind === "mtb" ? 1 : 0)], paint);
    tube(l, HB, bb, paint);
    if (kind === "bmx") l.rect(-1, 11, 2, 11, accent);
  }
  l.line(HT[0], HT[1], HB[0], HB[1], lite(paint, 0.2));

  // Fork.
  const forkC = kind === "mtb" ? IRON : look.accent !== look.paint ? accent : paint;
  if (kind === "mtb") {
    l.line(HB[0], HB[1], HB[0] + 2, HB[1] - 2, accent);
    l.line(HB[0] + 2, HB[1] - 2, F[0], F[1], IRON);
    l.line(HB[0] + 1, HB[1] - 1, F[0] - 1, F[1] + 1, IRON);
  } else if (kind === "chopper") l.line(HB[0], HB[1], F[0], F[1], CHROME);
  else l.path([HB, [F[0] - 1, F[1] + 2], F], forkC);

  // Seat post and saddle.
  if (kind === "chopper") {
    l.blob([[hx - 5, hy - 2], [hx + 2, hy - 2], [hx + 2, hy - 1], [hx - 4, hy]], hex(look.saddle), dark(hex(look.saddle)), accent);
    l.line(hx - 5, hy - 2, hx - 6, hy + 5, CHROME);
    l.line(hx - 6, hy + 5, R[0], R[1], CHROME);
  } else if (kind === "bmx") {
    saddle(l, S[0], 12, hex(look.saddle));
  } else {
    l.line(S[0], S[1], hx, hy - 2, STEEL);
    saddle(l, hx, hy - 1, hex(look.saddle));
  }

  // Stem and bars.
  if (kind === "racer") {
    l.line(HT[0], HT[1], gx, gy, STEEL);
    l.path([[gx, gy], [gx + 2, gy], [gx + 2, gy - 2], [gx + 1, gy - 3]], look.tyre === "gum" ? hex("#efece2") : RUBBER);
  } else if (kind === "chopper") {
    l.path([HT, [HT[0] - 1, gy], [gx, gy]], CHROME);
    l.set(gx, gy, RUBBER); l.set(gx - 1, gy, RUBBER);
  } else if (kind === "bmx") {
    l.path([HT, [HT[0], gy], [gx - 1, gy]], CHROME);
    l.set(HT[0] - 1, gy - 2, CHROME);
    l.set(gx - 1, gy, RUBBER);
  } else if (kind === "folder") {
    l.path([HT, [HT[0] - 1, gy], [gx, gy]], STEEL);
    l.set(gx, gy, RUBBER);
  } else {
    l.path([HT, [HT[0], gy], [gx, gy]], STEEL);
    l.set(gx, gy, RUBBER); l.set(gx - 1, gy, kind === "mtb" ? STEEL : RUBBER);
  }
  if (look.streamers) { l.set(gx - 1, gy - 1, hex("#e8438f")); l.set(gx - 2, gy - 2, hex("#f2d03a")); l.set(gx - 1, gy - 3, hex("#3fa3e8")); }

  l.disc(bb[0], bb[1], 1, STEEL_D);
  if (look.fenders) l.line(bb[0] - 4, bb[1] + 1, bb[0] + 1, bb[1] + 1, sh);
  cranks(l, bb, s.crank, st);
  rearLoad(l, g, look, paint);
  if (look.front === "lamp") { l.set(HT[0] + 1, HT[1] - 1, STEEL_D); l.set(HT[0] + 2, HT[1] - 1, st.lit ? LENS : hex("#e8dca0")); }
  else basket(l, HT[0] + 2, gy - 4, look);
  l.set(R[0] - (look.fenders ? g.rR + 1 : 0), look.fenders ? g.rR + 2 : R[1] + 3, look.fenders || look.rear ? RED : STEEL_D);
  stand();
}

/** A mudguard: a band of bodywork hugging the tyre. */
function guard(l: Layer, x: number, radius: number, c: C, from: number, to: number) {
  const cx = Math.round(x * K), r = Math.round(radius * K);
  l.ring(cx, r, r + 2, c, from, to);
  l.ring(cx, r, r + 1, dark(c, 0.8), from, to);
  l.ring(cx, r, r + 2, lite(c, 0.35), Math.max(from, 75), Math.min(to, 115));
}

function motorcycle(l: Layer, look: CycleLook, st: CycleState) {
  const kind = look.kind, g = GEO[kind], s = seat(kind);
  const paint = hex(look.paint), accent = hex(look.accent), sd = hex(look.saddle);
  const [hx, hy] = s.hip, [gx, gy] = s.grip;
  const R: [number, number] = [g.xr, g.rR], F: [number, number] = [g.xf, g.rF];
  const lens = st.lit ? LENS : hex("#f0e6b0");
  const lamp = (x: number, y: number) => { l.disc(x, y, 1.2, STEEL_D); l.rect(x + 1, y - 1, x + 1, y + 1, lens); l.set(x, y + 1, CHROME); };
  const grips = () => { l.set(gx - 2, gy, RUBBER); l.set(gx - 3, gy, RUBBER); };
  const pad = (x0: number, x1: number, c = sd) => l.blob([[x0, hy - 3], [x1, hy - 3], [x1, hy - 1], [x0, hy - 1]], c, dark(c), lite(c, 0.3));
  const disc = kind === "scooter" ? hex("#d8d8d2") : kind === "sportbike" ? IRON : undefined;
  wheel(l, R[0], g.rR, g.twR, look, g.spokesR, st, { knobs: kind === "dirtbike", disc });
  wheel(l, F[0], g.rF, g.twF, look, g.spokesF, st, { knobs: kind === "dirtbike", disc });
  const stand = () => { if (st.parked) { l.line(-2, 3, -5, 0, STEEL_D); l.set(-6, 0, STEEL_D); } };
  const engine = (x0: number, x1: number, y0: number, y1: number) => {
    l.blob([[x0, y0], [x1, y0], [x1 + 1, y1], [x0, y1]], STEEL_D, IRON, STEEL);
    for (let y = y1 - 2; y > y0 + 1; y -= 2) l.line(x0 + 1, y, x1 - 1, y, IRON);
    l.disc((x0 + x1) / 2, y0 + 1, 1, STEEL);
  };

  if (kind === "moto-early") {
    // A heavy bicycle frame with the tank slung under the top tube and a leather belt to the back wheel.
    guard(l, R[0], g.rR, dark(paint, 0.8), 35, 165);
    guard(l, F[0], g.rF, dark(paint, 0.8), 55, 140);
    l.line(-3, 4, R[0], R[1], IRON);
    l.line(-7, 12, R[0], R[1], IRON);
    l.line(-7, 12, -3, 4, IRON);
    l.line(-7, 13, 6, 14, IRON);
    l.line(7, 11, -3, 4, IRON);
    l.path([[7, 13], [F[0] - 1, F[1] + 2], F], IRON);
    l.line(8, 13, F[0], F[1] + 2, STEEL_D);
    l.blob([[-6, 13], [5, 13], [5, 10], [-5, 10]], paint, dark(paint), lite(paint, 0.4));
    l.set(-2, 11, accent); l.set(-1, 11, accent); l.set(0, 11, accent);
    engine(-3, 1, 3, 9);
    l.line(-2, 3, R[0] + 1, R[1], hex("#8a6238"));
    l.rect(-9, 2, 0, 2, CHROME);
    saddle(l, hx, hy - 1, sd, 1);
    l.line(hx - 1, hy - 2, hx - 2, hy - 4, STEEL_D);
    l.path([[6, 14], [6, gy], [gx - 2, gy]], STEEL);
    grips();
    lamp(8, 15);
    stand();
    return;
  }
  if (kind === "moto-classic") {
    guard(l, R[0], g.rR, paint, 25, 165);
    guard(l, F[0], g.rF, paint, 45, 150);
    l.line(-9, 9, R[0], R[1], IRON);
    l.line(-3, 3, R[0], R[1], IRON);
    l.line(8, 14, F[0], F[1], CHROME);
    l.line(9, 14, F[0] + 1, F[1] + 1, STEEL_D);
    // Finned cylinders over the crankcase; the pipe sweeps back to a long silencer.
    engine(-5, 4, 2, 9);
    l.path([[5, 7], [5, 3], [-5, 3]], CHROME);
    l.rect(-16, 4, -6, 4, CHROME); l.rect(-16, 3, -6, 3, STEEL_D);
    l.blob([[-3, 10], [-2, 14], [5, 15], [8, 13], [7, 10]], paint, dark(paint), lite(paint, 0.5));
    l.rect(0, 12, 5, 12, accent);
    pad(hx - 6, hx + 2);
    l.set(hx - 6, hy, dark(sd));
    l.path([[7, 15], [7, gy], [gx - 2, gy]], CHROME);
    grips();
    lamp(10, 14);
    l.set(R[0] - g.rR - 2, g.rR + 2, RED);
    stand();
    return;
  }
  if (kind === "scooter") {
    // Pressed-steel body: a cowl over the back wheel, a flat footboard, a leg shield up to the headset.
    guard(l, F[0], g.rF, paint, 25, 170);
    l.line(F[0], F[1], 7, 9, STEEL_D);
    l.blob([[-15, 5], [-14, 10], [-9, 12], [-2, 11], [0, 6], [0, 3], [-13, 3]], paint, dark(paint), lite(paint, 0.45));
    l.rect(-10, 7, -6, 7, dark(paint)); l.rect(-10, 9, -7, 9, lite(paint, 0.3));
    l.blob([[0, 5], [5, 5], [5, 3], [0, 3]], dark(paint, 0.85), dark(paint), dark(paint, 0.85));
    l.blob([[4, 3], [8, 4], [8, 15], [5, 16], [4, 6]], paint, dark(paint), lite(paint, 0.45));
    pad(hx - 5, hx + 3);
    l.blob([[5, 16], [8, 16], [8, gy + 1], [5, gy + 1]], paint, dark(paint), lite(paint, 0.4));
    l.line(5, gy, gx - 2, gy, STEEL);
    grips();
    l.rect(9, gy - 1, 9, gy, lens);
    l.set(-15, 8, RED);
    l.set(6, 8, accent); l.set(6, 9, accent);
    rearLoad(l, { ...g, rR: 5 }, look, paint);
    stand();
    return;
  }
  if (kind === "cub") {
    guard(l, R[0], g.rR, paint, 25, 170);
    guard(l, F[0], g.rF, accent, 35, 150);
    l.line(-3, 5, R[0], R[1], IRON);
    l.rect(-14, 4, -5, 4, CHROME); l.rect(-14, 3, -6, 3, STEEL_D);
    engine(-4, 1, 3, 7);
    // The pressed backbone, and the white leg shield that kept a rider's clothes clean.
    l.blob([[-11, 12], [-3, 12], [5, 14], [6, 11], [0, 8], [-9, 9]], paint, dark(paint), lite(paint, 0.45));
    l.blob([[2, 13], [6, 14], [8, 6], [4, 4], [2, 8]], accent, dark(accent, 0.78), lite(accent, 0.2));
    l.path([[7, 13], [F[0] - 1, F[1] + 2], F], paint);
    pad(hx - 4, hx + 3);
    l.blob([[5, 14], [8, 14], [8, gy + 1], [5, gy + 1]], paint, dark(paint), lite(paint, 0.4));
    l.line(5, gy, gx - 2, gy, STEEL);
    grips();
    l.rect(9, gy - 1, 9, gy, lens);
    l.set(R[0] - g.rR - 2, g.rR + 2, RED);
    rearLoad(l, g, look, paint);
    stand();
    return;
  }
  if (kind === "dirtbike") {
    l.line(-3, 5, R[0], R[1], IRON);
    l.line(-3, 6, R[0], R[1] + 1, STEEL_D);
    // Long forks, high mudguards, a number plate on the side.
    l.line(6, 17, F[0], F[1], CHROME);
    l.line(7, 17, F[0] + 1, F[1] + 1, STEEL_D);
    l.blob([[6, 17], [16, 17], [17, 15], [7, 15]], paint, dark(paint), lite(paint, 0.45));
    engine(-3, 2, 4, 10);
    l.path([[3, 9], [-2, 11], [-13, 12]], CHROME);
    l.blob([[-2, 11], [-1, 15], [5, 16], [7, 13], [3, 11]], paint, dark(paint), lite(paint, 0.5));
    l.blob([[-17, 17], [-9, 14], [-2, 14], [-2, 12], [-9, 12], [-17, 15]], paint, dark(paint), lite(paint, 0.45));
    l.blob([[hx - 5, hy - 1], [hx + 4, hy - 1], [hx + 4, hy - 3], [hx - 5, hy - 3]], sd, dark(sd), lite(sd, 0.3));
    l.blob([[-10, 12], [-5, 12], [-5, 8], [-10, 8]], hex("#f4f0e4"), hex("#b8b4a8"), undefined);
    l.rect(-8, 9, -7, 11, IRON);
    l.path([[6, 17], [6, gy], [gx - 2, gy]], CHROME);
    grips();
    stand();
    return;
  }
  // Sports machine: a full fairing from nose to belly, the tail kicked up.
  l.line(-4, 6, R[0], R[1], STEEL_D);
  l.line(-4, 5, R[0], R[1] - 1, IRON);
  l.line(9, 12, F[0], F[1], IRON);
  l.rect(-14, 6, -5, 6, CHROME); l.rect(-15, 7, -10, 7, STEEL_D);
  l.blob([[-4, 2], [6, 2], [11, 9], [11, 13], [6, 16], [0, 15], [-4, 10]], paint, dark(paint), lite(paint, 0.5));
  l.blob([[6, 16], [9, 18], [11, 14]], GLASS, hex("#7fa8b8"), undefined);
  l.line(-2, 6, 7, 6, accent); l.line(-1, 7, 8, 7, accent);
  l.blob([[-15, 15], [-9, 14], [-4, 13], [-4, 10], [-10, 10], [-15, 13]], paint, dark(paint), lite(paint, 0.5));
  l.blob([[hx - 3, hy - 3], [hx + 2, hy - 3], [hx + 2, hy - 1], [hx - 3, hy - 1]], sd, dark(sd), lite(sd, 0.3));
  l.set(gx - 2, gy, RUBBER); l.set(gx - 3, gy, RUBBER); l.set(gx - 2, gy - 1, STEEL);
  l.rect(12, 11, 12, 12, lens);
  l.set(-16, 14, RED);
  stand();
}

/** Head-on or from behind: the machine as a narrow upright, the rider between its layers. */
function endOn(under: Layer, over: Layer, look: CycleLook, st: CycleState, back: boolean) {
  const kind = look.kind, s = seat(kind), spec = CYCLE_SPECS[kind];
  const paint = hex(look.paint), accent = hex(look.accent), sd = hex(look.saddle);
  // Drawn straight in pixels: only the wheels and the rider's measures set its size.
  under.k = over.k = 1;
  const hy = Math.round(s.hip[1] * K), gy = Math.round(s.grip[1] * K);
  const g = { ...GEO[kind], rR: Math.round(GEO[kind].rR * K), rF: Math.round(GEO[kind].rF * K), bar: GEO[kind].bar + 1, bb: [0, Math.round(GEO[kind].bb[1] * K)] };
  const crank = Math.round(s.crank * K);
  const wood = kind === "draisine" || kind === "boneshaker";
  const tyre = wood ? IRON : TYRES[look.tyre], tread = lite(tyre, 0.25);
  const lens = st.lit ? LENS : hex("#f0e6b0");
  const fat = spec.motor || (back ? g.twR : g.twF) >= 2;
  const half = fat ? 2 : 1;
  const tyreUp = (l: Layer, r: number) => {
    for (let y = 0; y <= r * 2; y++) {
      const inset = y === 0 || y === r * 2 ? 1 : 0;
      for (let x = -half + inset; x <= half - inset; x++) l.set(x, y, tyre);
      if (inset || (y + (st.spin ?? 0)) % 3) continue;
      if (fat) { l.set(-1, y, tread); l.set(1, y, tread); }
      else l.set(0, y, tread);
    }
    if (look.tyre === "white" && !wood) for (let y = 2; y < r * 2 - 1; y++) { l.set(-half, y, RIMS.white); l.set(half, y, RIMS.white); }
  };
  const flag = (l: Layer, sx: number) => {
    if (!look.flag) return;
    l.line(sx * 3, g.rR, sx * 4, 31, STEEL_D);
    l.blob([[sx * 4, 31], [sx * 8, 29], [sx * 4, 27]], hex("#f2742c"), hex("#c9521c"), undefined);
  };
  const load = (l: Layer, top: number) => {
    if (!look.rear) return;
    l.line(-4, top + 2, 4, top + 2, STEEL_D);
    if (look.rear === "box") l.blob([[-4, top + 3], [4, top + 3], [4, top + 7], [-4, top + 7]], spec.motor ? hex("#e8e4d8") : WOOD);
    if (look.rear === "panniers") for (const sx of [-1, 1]) l.blob([[sx * 3, top - 4], [sx * 5, top - 4], [sx * 5, top + 1], [sx * 3, top + 1]], mix(paint, hex("#6b5a3a"), 0.75));
  };
  const bars = (l: Layer) => {
    const w = g.bar, steel = wood ? WOOD : spec.motor || kind === "chopper" || kind === "bmx" ? CHROME : STEEL;
    if (kind === "racer") {
      l.line(-w, gy, w, gy, STEEL);
      const tape = look.tyre === "gum" ? hex("#efece2") : RUBBER;
      for (const sx of [-1, 1]) { l.set(sx * w, gy - 1, tape); l.set(sx * w, gy - 2, tape); l.set(sx * (w - 1), gy - 3, tape); }
      return;
    }
    if (kind === "chopper" || kind === "bmx") {
      for (const sx of [-1, 1]) l.path([[sx, gy - 5], [sx * (w - 2), gy], [sx * w, gy]], steel);
      if (kind === "bmx") l.rect(-2, gy - 2, 2, gy - 2, accent);
    } else l.line(-w, gy, w, gy, steel);
    for (const sx of [-1, 1]) { l.set(sx * w, gy, RUBBER); l.set(sx * (w - 1), gy, RUBBER); }
    if (look.streamers) for (const sx of [-1, 1]) { l.set(sx * (w + 1), gy - 1, hex("#e8438f")); l.set(sx * (w + 1), gy - 2, hex("#f2d03a")); }
    if (spec.motor && kind !== "dirtbike" && kind !== "moto-early")
      for (const sx of [-1, 1]) { l.set(sx * (w - 1), gy + 1, STEEL_D); l.rect(sx * w, gy + 2, sx * (w + (sx > 0 ? 1 : -1)), gy + 3, CHROME); }
  };
  const pedals = (l: Layer, y: number) => {
    if (!crank) return;
    const a = (((st.crank ?? 0) % 8) / 8) * Math.PI * 2;
    for (const sx of [-1, 1]) { const dy = Math.round(Math.cos(a) * crank) * sx; l.rect(sx * (half + 2), y + dy, sx * (half + 3), y + dy, RUBBER); }
  };

  if (!back) {
    // Facing the viewer: what rides behind shows only past the rider's edges.
    load(under, g.rR * 2);
    flag(under, 1);
    const r = g.rF, top = r * 2;
    if (spec.motor) {
      const tube = kind === "scooter" || kind === "cub" || kind === "sportbike" ? paint : CHROME;
      if (kind === "moto-classic") for (const sx of [-1, 1]) over.blob([[sx * 3, 4], [sx * 6, 4], [sx * 6, 8], [sx * 3, 8]], STEEL_D, IRON, STEEL);
      if (kind === "scooter" || kind === "cub") {
        const shield = kind === "cub" ? accent : paint;
        over.blob([[-6, 4], [6, 4], [7, gy - 3], [-7, gy - 3]], shield, dark(shield, 0.8), lite(shield, 0.3));
        over.rect(-1, 6, 1, gy - 4, dark(shield, 0.86));
      } else if (kind === "sportbike") {
        over.blob([[-5, 7], [5, 7], [7, 13], [4, 17], [-4, 17], [-7, 13]], paint, dark(paint), lite(paint, 0.45));
        over.blob([[-3, 17], [3, 17], [2, 20], [-2, 20]], GLASS, hex("#7fa8b8"), undefined);
        over.rect(-4, 13, -2, 14, lens); over.rect(2, 13, 4, 14, lens);
        over.rect(-1, 8, 1, 11, IRON);
      }
      tyreUp(over, kind === "sportbike" ? r - 1 : r);
      for (const sx of [-1, 1]) over.line(sx * 3, r, sx * 3, kind === "scooter" || kind === "cub" ? top : gy - 2, tube);
      const fenderC = kind === "cub" ? accent : kind === "moto-early" ? dark(paint, 0.8) : paint;
      if (kind === "dirtbike") {
        over.blob([[-3, top + 2], [3, top + 2], [3, top + 4], [-3, top + 4]], paint, dark(paint), lite(paint, 0.4));
        over.blob([[-3, gy - 5], [3, gy - 5], [3, gy - 1], [-3, gy - 1]], hex("#f4f0e4"), hex("#b8b4a8"), undefined);
        over.rect(0, gy - 4, 0, gy - 2, IRON);
      } else if (kind !== "sportbike") {
        over.blob([[-3, top - 2], [3, top - 2], [3, top + 1], [-3, top + 1]], fenderC, dark(fenderC, 0.8), lite(fenderC, 0.4));
        const ly = kind === "scooter" || kind === "cub" ? gy : gy - 3;
        if (kind === "scooter" || kind === "cub") over.blob([[-4, gy - 2], [4, gy - 2], [4, gy + 1], [-4, gy + 1]], paint, dark(paint), lite(paint, 0.4));
        else over.rect(-1, top + 2, 1, gy - 6, IRON);
        over.disc(0, ly, 2, CHROME);
        over.disc(0, ly, 1, lens);
      }
      bars(over);
      return;
    }
    const fork = wood ? WOOD_D : kind === "mtb" ? IRON : look.accent !== look.paint ? accent : paint;
    tyreUp(over, r);
    for (const sx of [-1, 1]) over.line(sx * (half + 1), r - 1, sx * (half + 1), top + 1, fork);
    if (look.fenders) {
      over.blob([[-half - 1, top - 3], [half + 1, top - 3], [half + 1, top + 1], [-half - 1, top + 1]], paint, dark(paint), lite(paint, 0.4));
    }
    over.rect(-half - 1, top + 2, half + 1, top + 2, fork);
    const head = wood ? WOOD : paint;
    for (let y = top + 3; y < gy; y++) { over.set(-1, y, dark(head, 0.85)); over.set(0, y, lite(head, 0.25)); over.set(1, y, dark(head, 0.85)); }
    if (kind === "penny" || kind === "boneshaker") pedals(over, r);
    bars(over);
    if (look.front === "lamp") { over.rect(-1, gy - 4, 1, gy - 2, STEEL_D); over.set(0, gy - 3, lens); }
    else if (look.front) {
      const side = new Layer();
      side.k = 1;
      basket(side, 0, 0, look, 9);
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
        const i = ((CYCLE_GROUND - y) * CYCLE_W + OX + x) * 4;
        if (side.data[i + 3]) over.set(x - 4, gy - 5 + y, [side.data[i], side.data[i + 1], side.data[i + 2], 255]);
      }
    }
    return;
  }

  // From behind: the bars and front of the machine behind the rider, the back wheel in front.
  bars(under);
  const r = g.rR, top = r * 2;
  for (let y = top + 1; y < gy; y++) under.set(0, y, spec.motor ? IRON : lite(paint, 0.1));
  under.blob([[-2, hy - 3], [2, hy - 3], [2, hy - 1], [-2, hy - 1]], sd, dark(sd), lite(sd, 0.3));
  if (spec.motor) {
    if (kind === "scooter") over.blob([[-6, 3], [6, 3], [7, 9], [5, 12], [-5, 12], [-7, 9]], paint, dark(paint), lite(paint, 0.45));
    if (kind === "moto-classic") for (const sx of [-1, 1]) over.blob([[sx * 3, 4], [sx * 5, 4], [sx * 5, 7], [sx * 3, 7]], STEEL_D, IRON, STEEL);
    tyreUp(over, kind === "scooter" ? r - 1 : r);
    const fenderC = kind === "moto-early" ? dark(paint, 0.8) : paint;
    if (kind === "sportbike" || kind === "dirtbike") over.blob([[-2, top], [2, top], [3, top + 4], [-3, top + 4]], paint, dark(paint), lite(paint, 0.45));
    else if (kind !== "scooter") over.blob([[-3, top - 3], [3, top - 3], [3, top + 1], [-3, top + 1]], fenderC, dark(fenderC, 0.8), lite(fenderC, 0.4));
    const ty = kind === "scooter" ? 10 : kind === "sportbike" || kind === "dirtbike" ? top + 3 : top;
    over.rect(-1, ty, 1, ty, RED);
    if (kind !== "dirtbike") { over.rect(-2, ty - 3, 2, ty - 2, hex("#efece2")); over.set(-1, ty - 3, IRON); over.set(1, ty - 2, IRON); }
    const pipes = kind === "moto-classic" || kind === "sportbike" ? [-1, 1] : kind === "scooter" ? [] : [1];
    for (const sx of pipes) { over.disc(sx * 5, 4, 1, CHROME); over.set(sx * 5, 4, IRON); }
  } else {
    tyreUp(over, r);
    const stay = wood ? WOOD_D : dark(look.accent !== look.paint ? accent : paint, 0.8);
    for (const sx of [-1, 1]) over.line(sx * (half + 1), r - 1, sx * (half + 1), Math.min(top + 1, hy - 3), stay);
    if (look.fenders) {
      over.blob([[-half - 1, top - 3], [half + 1, top - 3], [half + 1, top + 1], [-half - 1, top + 1]], paint, dark(paint), lite(paint, 0.4));
      over.set(0, top - 1, RED);
    } else if (look.reflectors) over.set(0, top + 2, RED);
    if (kind === "chopper") { for (const sx of [-1, 1]) over.line(sx * 2, hy - 1, sx * 2, hy + 5, CHROME); over.line(-2, hy + 5, 2, hy + 5, CHROME); }
    if (kind !== "penny" && kind !== "boneshaker") pedals(over, g.bb[1]);
    flag(over, -1);
  }
  load(over, top);
}

/** The handlebar seen across a machine turned an eighth: the near grip a pixel lower than the far one. */
function crossBars(l: Layer, look: CycleLook, turn: number) {
  const kind = look.kind, spec = CYCLE_SPECS[kind], s = seat(kind);
  if (kind === "draisine") return;
  const gx = Math.round(s.grip[0] * K) - (spec.motor ? 3 : 0), gy = Math.round(s.grip[1] * K);
  const x = Math.round((gx * 2) / 3), y = gy - turn * Math.floor(gx / 3), w = Math.round((GEO[kind].bar + 1) * 0.7);
  const steel = kind === "boneshaker" ? WOOD : spec.motor || kind === "chopper" || kind === "bmx" ? CHROME : STEEL;
  const grip = kind === "racer" && look.tyre === "gum" ? hex("#efece2") : kind === "boneshaker" ? WOOD_D : RUBBER;
  l.k = 1;
  // The near end is the left one heading toward the viewer, the right one heading away.
  const at = (dx: number) => [x + dx, y + Math.round((dx * turn) / w)] as const;
  for (let dx = -w; dx <= w; dx++) l.put(...at(dx), Math.abs(dx) >= w - 1 ? grip : steel);
  if (kind === "racer") for (const dx of [-w, w]) { l.put(at(dx)[0], at(dx)[1] - 1, grip); l.put(at(dx)[0], at(dx)[1] - 2, grip); }
  if (kind === "chopper" || kind === "bmx") for (const dx of [-w + 2, w - 2]) for (let up = 1; up <= 3; up++) l.put(at(dx)[0] + (dx < 0 ? 1 : -1) * Math.min(up, 2), at(dx)[1] - up, steel);
  if (look.streamers) for (const dx of [-w, w]) { l.put(at(dx)[0] + Math.sign(dx), at(dx)[1] - 1, hex("#e8438f")); l.put(at(dx)[0] + Math.sign(dx), at(dx)[1] - 2, hex("#f2d03a")); }
  l.k = K;
}

export function paintCycle(look: CycleLook, view: CycleView, st: CycleState = {}): CycleArt {
  K = CYCLE_SPECS[look.kind].motor ? 1.45 : 1.3;
  const under = new Layer(), over = new Layer(), g = GEO[look.kind], s = seat(look.kind);
  if (st.shadow) {
    const x0 = Math.round(g.xr * K) - Math.round(g.rR * K), x1 = Math.round(g.xf * K) + Math.round(g.rF * K);
    under.k = 1;
    for (let y = -2; y <= (st.fallen ? 4 : 1); y++)
      for (let x = (view === "side" || st.fallen ? x0 : -4) + Math.abs(y); x <= (view === "side" || st.fallen ? x1 : 4) - Math.abs(y) + (st.fallen ? 4 : 0); x++) under.put(x, y, [28, 22, 40, 62]);
    under.k = K;
  }
  under.flat = over.flat = !!st.fallen;
  const turn = st.fallen || view === "side" ? 0 : view === "quarter" ? 1 : view === "quarter-back" ? -1 : undefined;
  if (turn === undefined) endOn(under, over, look, st, view === "back");
  else {
    under.quarter = turn;
    (CYCLE_SPECS[look.kind].motor ? motorcycle : bicycle)(under, look, st);
    under.quarter = 0;
    if (turn) crossBars(turn > 0 ? over : under, look, turn);
  }
  const across = (x: number) => (turn ? Math.round((x * 2) / 3) : x);
  return {
    under: under.data,
    over: over.data,
    rider: turn === undefined ? [0, s.rider[1]] : [across(s.rider[0]), s.rider[1] - Math.round(((turn ?? 0) * s.rider[0]) / 3)],
    pose: cyclePose(look.kind),
    contact: [across(Math.round(g.xr * K)), across(Math.round(g.xf * K))],
  };
}
