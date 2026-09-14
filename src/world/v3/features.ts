import { random } from "../../core/random";
import { noise } from "../geography/noise";
import type { Colorway, Ecology } from "../../content/ecology/profiles";

/** Landscape features: small deterministic structures laid over the shared
 * fields so a scene reads as a place rather than a carpet. Streams (creeks,
 * arroyos, trails) are polylines walked downhill from a seed point and
 * queried by distance; the rest are masks. Nothing here enters saves. */
export type LandscapeKind =
  | "arroyo"
  | "trail"
  | "trample"
  | "outcrop"
  | "pan"
  | "gravel-bar"
  | "creek-pool";
export type Landscape = {
  kind: LandscapeKind;
  strength: number;
  /** Arroyo only: this cell is the low cut bank on the uphill side. */
  cut?: boolean;
};

export type Stream = {
  points: number[][];
  /** Tier of each vertex, never rising downstream. */
  tiers: number[];
  /** Index of vertices where the water drops a tier; a fall sits just below. */
  falls: number[];
  /** The walk ended in a hollow rather than at open water. */
  pond: boolean;
  bounds: number[];
};
type Height = (x: number, y: number) => number;
type Reaches = (x: number, y: number) => boolean;

const STEP = 3;
const dirs = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

/** Walk downhill from `start`, wandering a little, until open water, a
 * hollow with no way down, or the step budget. Returns undefined for a walk
 * too short to read as a stream. */
export function walkStream(
  seed: string,
  salt: string,
  start: number[],
  height: Height,
  reachesWater: Reaches,
  tierOf: (h: number) => number,
  steps = 44,
  /** Turn and wander weights, in height units per step. */
  bias = 0.006,
  /** Distance to the water the stream drains to; on flat ground the walk
   * follows this gradient so a plain tributary still finds its river. */
  toWater?: (x: number, y: number) => number,
  addMeanders = true,
): Stream | undefined {
  const points = [start];
  const falls: number[] = [];
  const tiers = [tierOf(height(start[0], start[1]))];
  let [x, y] = start;
  let h = height(x, y);
  let pond = true;
  let stuck = 0;
  let overshoot = 0;
  for (let i = 0; i < steps; i++) {
    if (reachesWater(x, y)) {
      pond = false;
      // One more step so the mouth opens into the water it reached.
      if (overshoot++ >= 1) break;
    }
    const wander = noise(seed, x, y, 17, `${salt}-wander`) - 0.5;
    let best: number[] | undefined,
      // A little tolerance for flat ground, but never a climb of a tier's
      // worth: a walk that climbs keeps its low tier and digs a trench.
      bestH = h + (toWater ? 0.015 : 0.004);
    for (let d = 0; d < 8; d++) {
      const [dx, dy] = dirs[d];
      const nx = x + dx * STEP,
        ny = y + dy * STEP;
      // Bias toward continuing straight and toward the wander side.
      const prev = points.length > 1 ? points[points.length - 2] : undefined;
      const turn = prev
        ? Math.abs(Math.atan2(dy, dx) - Math.atan2(y - prev[1], x - prev[0]))
        : 0;
      const bend = turn > Math.PI ? 2 * Math.PI - turn : turn;
      const nh = height(nx, ny);
      // Stay on the terrace while it still descends; drop a tier only when
      // nothing on this one leads down. Falls then sit at real edges.
      const dropCost = tierOf(nh) < tiers[tiers.length - 1] ? bias * 6 : 0;
      // A gentle pull toward the river, so flat ground drains somewhere
      // instead of stalling.
      // Near the channel the pull dominates, so a creek joins the river
      // instead of running along its floodplain.
      const here = toWater ? toWater(x, y) : Infinity;
      const pull = toWater ? (toWater(nx, ny) - here) * bias * (here < 10 ? 2.5 : 0.45) : 0;
      const score = nh + bend * bias + (d % 2) * wander * bias * 1.6 + dropCost + pull;
      if (score < bestH) {
        bestH = score;
        best = [nx, ny];
      }
    }
    if (!best) {
      // Try a straight drop off the terrace before giving up.
      for (let d = 0; d < 8 && !best; d++) {
        const [dx, dy] = dirs[d];
        const nx = x + dx * STEP,
          ny = y + dy * STEP;
        if (height(nx, ny) < h - 0.002) best = [nx, ny];
      }
    }
    if (!best) {
      if (++stuck > 1) break;
      // One flat step allowed so a shallow saddle does not end every creek.
      const [dx, dy] = dirs[Math.floor(random(seed, `${salt}-flat`, x, y) * 8)];
      best = [x + dx * STEP, y + dy * STEP];
    } else stuck = 0;
    const nh = height(best[0], best[1]);
    const tier = Math.min(tiers[tiers.length - 1], tierOf(nh));
    if (tier < tiers[tiers.length - 1]) falls.push(points.length);
    tiers.push(tier);
    points.push(best);
    [x, y] = best;
    h = nh;
  }
  if (points.length < 6) return undefined;
  // One round of corner cutting: the walk's three-cell zigzag would
  // otherwise crenellate every bank and wall along the stream.
  const smoothPoints: number[][] = [points[0]];
  const smoothTiers: number[] = [tiers[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i],
      [bx, by] = points[i + 1];
    if (i > 0) {
      smoothPoints.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
      smoothTiers.push(tiers[i]);
    }
    if (i < points.length - 2) {
      smoothPoints.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
      smoothTiers.push(tiers[i + 1]);
    }
  }
  smoothPoints.push(points[points.length - 1]);
  smoothTiers.push(tiers[tiers.length - 1]);
  // Meander: on smooth ground the walk runs dead straight, so each vertex
  // slides sideways by a slow noise along the stream, growing downstream
  // where a real stream has more water to cut with. Ends stay put so the
  // spring and the mouth keep their places.
  for (let i = 1; addMeanders && i < smoothPoints.length - 1; i++) {
    const [ax, ay] = smoothPoints[i - 1],
      [bx, by] = smoothPoints[i + 1];
    const dx = bx - ax,
      dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const t = i / (smoothPoints.length - 1);
    const amp = 2 + t * 5.5;
    const sway =
      (noise(seed, i * 3, 0, 9, `${salt}-meander`) - 0.5) * 2 * amp +
      (noise(seed, i * 3, 7, 3.5, `${salt}-meander-2`) - 0.5) * 1.6;
    smoothPoints[i] = [
      smoothPoints[i][0] - (dy / len) * sway,
      smoothPoints[i][1] + (dx / len) * sway,
    ];
  }
  const smoothFalls: number[] = [];
  for (let i = 1; i < smoothTiers.length; i++)
    if (smoothTiers[i] < smoothTiers[i - 1]) smoothFalls.push(i);
  const xs = smoothPoints.map((p) => p[0]),
    ys = smoothPoints.map((p) => p[1]);
  return {
    points: smoothPoints,
    tiers: smoothTiers,
    falls: smoothFalls,
    pond,
    bounds: [
      Math.min(...xs) - 4,
      Math.min(...ys) - 4,
      Math.max(...xs) + 4,
      Math.max(...ys) + 4,
    ],
  };
}

/** Signed-ish distance from a point to a stream's centre line, with the
 * fraction of the way along it and whether a fall is within reach. */
export function streamDistance(s: Stream, x: number, y: number, radius = 4) {
  const [x0, y0, x1, y1] = s.bounds;
  if (x < x0 || y < y0 || x > x1 || y > y1) return undefined;
  let best = Infinity,
    at = 0,
    seg = 0,
    cx = x,
    cy = y,
    tx = 1,
    ty = 0;
  for (let i = 1; i < s.points.length; i++) {
    const [ax, ay] = s.points[i - 1],
      [bx, by] = s.points[i];
    const vx = bx - ax,
      vy = by - ay;
    const len2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len2));
    const px = ax + vx * t,
      py = ay + vy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best) {
      best = d;
      at = i - 1 + t;
      seg = i;
      cx = px;
      cy = py;
      const len = Math.sqrt(len2);
      tx = vx / len;
      ty = vy / len;
    }
  }
  if (best > radius) return undefined;
  const end = s.points.length - 1;
  // Outward unit normal from the centre line at this point: the gradient
  // of the distance field, so a cell can carry a first-order model of it.
  const gradient: [number, number] =
    best > 1e-6 ? [(x - cx) / best, (y - cy) / best] : [-ty, tx];
  return {
    distance: best,
    gradient,
    along: at / end,
    /** Nearest vertex index, for per-vertex data such as tier. */
    vertex: Math.round(at),
    /** Distance to the end point, for the pond that closes a blind creek. */
    toEnd: Math.hypot(x - s.points[end][0], y - s.points[end][1]),
    nearFall: s.falls.some((f) => Math.abs(f - seg) <= 1),
  };
}

export const STREAM_BLOCK = 192;
/** Dry colourways carry arroyos instead of creeks. */
export function streamKind(
  ecology: Ecology,
  colorway?: Colorway,
): "creek" | "arroyo" | undefined {
  if (ecology === "desert") return colorway === "atacama" ? undefined : "arroyo";
  if (ecology === "dry-scrub" || ecology === "savanna") return "arroyo";
  if (colorway === "steppe") return "arroyo";
  if (ecology === "tundra") return undefined;
  return "creek";
}

/** Shrub colonies: whole patches of scrub with a bare heart, and little
 * between them. Returns a density multiplier for understory placement. */
export function shrubColony(seed: string, x: number, y: number) {
  const c = noise(seed, x, y, 11, "shrub-colony");
  if (c > 0.8) return 0.15;
  if (c > 0.62) return 3.2;
  return 0.12;
}

/** Rock outcrops: tight clusters on high exposed ground. */
export function outcrop(seed: string, x: number, y: number, exposed: number, alt: number) {
  if (exposed < 0.62 || alt < 0.3) return 0;
  const n = noise(seed, x, y, 7, "outcrop");
  return n > 0.68 ? (n - 0.68) / 0.32 : 0;
}

/** Salt pans: pale flats in closed dry basins. */
export function saltPan(seed: string, x: number, y: number, colorway: Colorway | undefined, low: boolean, wet: number, water: number) {
  if (!low || water < 20 || wet > 0.25) return 0;
  if (!["atacama", "highland", "sahara", "kalahari"].includes(colorway ?? "")) return 0;
  const n = noise(seed, x, y, 38, "salt-pan");
  return n > 0.66 ? Math.min(1, (n - 0.66) / 0.2) : 0;
}

/** Gravel bars along river shores, in stretches rather than everywhere. */
export function gravelBar(seed: string, x: number, y: number) {
  return noise(seed, x, y, 23, "gravel-bar") > 0.6;
}
