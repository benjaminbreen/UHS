import { trimCache } from "../core/cache";
import type { TopographyCell, TopographySample } from "../core/topography";
import {
  waterDistance,
  waterNoise,
  waterHash,
  waterStyle,
  waterBand,
} from "./water-style";

export function paintedGround(c: TopographyCell) {
  return (
    !!c.habitat &&
    !c.ramp &&
    !c.bridge &&
    c.surface !== "water" &&
    c.feature !== "field"
  );
}
export const rgb = (c: string) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];
/** Shared native-pixel shoreline used for bank colors, wet lips and moving wash.
 * Land at a different height retains its hard cliff footprint. */
export function shoreDistance(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
) {
  const c = sample(Math.floor(x), Math.floor(y))!;
  const d = waterDistance(sample, x, y);
  if (c.height > 0 && c.surface !== "water") return Math.max(0.08, d);
  const jitter =
    (waterNoise((x + ox) * 16, (y + oy) * 16, 7, 319) - 0.5) * 0.14;
  return d + jitter;
}
/** Bilinear beach width keeps the outer bank as continuous as the water edge. */
export function shoreWidth(sample: TopographySample, x: number, y: number) {
  const ix = Math.floor(x - 0.5),
    iy = Math.floor(y - 0.5),
    u = x - 0.5 - ix,
    v = y - 0.5 - iy;
  const value = (a: number, b: number) =>
    sample(a, b)?.waterVisual?.shoreWidth ?? 3;
  return (
    (value(ix, iy) * (1 - u) + value(ix + 1, iy) * u) * (1 - v) +
    (value(ix, iy + 1) * (1 - u) + value(ix + 1, iy + 1) * u) * v
  );
}
/** Reconstruct scalar material membership from four cell centers. Different
 * height tiers, bridge decks and paving never donate their material across an edge. */
export function materialCoverage(
  sample: TopographySample,
  x: number,
  y: number,
  height: number,
  predicate: (c: TopographyCell) => boolean,
) {
  const ix = Math.floor(x - 0.5),
    iy = Math.floor(y - 0.5),
    u = x - 0.5 - ix,
    v = y - 0.5 - iy;
  const value = (a: number, b: number) => {
    const c = sample(a, b);
    return c &&
      c.height === height &&
      !c.bridge &&
      !c.ramp &&
      c.feature !== "paving" &&
      c.feature !== "field" &&
      predicate(c)
      ? 1
      : 0;
  };
  return (
    (value(ix, iy) * (1 - u) + value(ix + 1, iy) * u) * (1 - v) +
    (value(ix, iy + 1) * (1 - u) + value(ix + 1, iy + 1) * u) * v
  );
}
/** Crisp, irregular pixel steps instead of full-cell corner staircases. */
type PathSegment = readonly [number, number, number, number];
const routeCaches = new WeakMap<TopographySample, Map<string, PathSegment[]>>();
export type PathField = {
  /** Wear bands. 0.48 is the material boundary the raster thresholds against. */
  coverage: number;
  /** Distance from the corridor center over its local radius; 0 is the center. */
  cross: number;
  /** Local half-width in cells, after breathing. */
  radius: number;
};
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
/** A worn road is not a constant-width ribbon. One slow wave sampled on the
 * center line rather than at the pixel widens and narrows the whole corridor
 * along its length, so both margins move together instead of fraying. */
function breathe(cx: number, cy: number, ox: number, oy: number) {
  const wx = (cx + ox) * 16,
    wy = (cy + oy) * 16;
  return (
    1 +
    (waterNoise(wx, wy, 112, 517) - 0.5) * 0.3 +
    (waterNoise(wx, wy, 37, 519) - 0.5) * 0.13
  );
}
/** Lateral drift of the corridor itself, sampled on the center line so the
 * whole road snakes and both margins move together. Width variation alone
 * still left a ruled line; a route follows the ground it was worn into. */
function wander(cx: number, cy: number, ox: number, oy: number) {
  return (waterNoise((cx + ox) * 16, (cy + oy) * 16, 74, 523) - 0.5) * 0.84;
}
/** Two octaves of margin nibble. One octave left the edge straight enough to
 * expose the route's underlying 45-degree staircase. */
function margin(x: number, y: number, ox: number, oy: number) {
  const wx = (x + ox) * 16,
    wy = (y + oy) * 16;
  return (
    (waterNoise(wx, wy, 27, 421) - 0.5) * 0.085 +
    (waterNoise(wx, wy, 9, 431) - 0.5) * 0.05
  );
}
/** Connect neighboring route centers before rasterization. A diagonal is a
 * continuous corridor, never a sequence of independently rounded tile caps. */
export function pathField(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): PathField {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    cell = sample(ix, iy)!;
  if (cell.pathArt?.length && !cell.feature && !cell.ramp && !cell.bridge) {
    let best: PathField = { coverage: 0, cross: 1.5, radius: 0 };
    const wobble = margin(x, y, ox, oy);
    for (const s of cell.pathArt) {
      const ax = ix + s.a[0],
        ay = iy + s.a[1],
        dx = s.b[0] - s.a[0],
        dy = s.b[1] - s.a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
      );
      const cx = ax + t * dx,
        cy = ay + t * dy,
        len = Math.hypot(dx, dy) || 1;
      const radius = s.radius * breathe(cx, cy, ox, oy);
      const drift = wander(cx, cy, ox, oy) * Math.min(1.2, s.radius);
      const distance = Math.hypot(
        x - cx + (drift * dy) / len,
        y - cy - (drift * dx) / len,
      );
      const coverage = clamp01(
        0.48 + (0.6 * (radius - distance + wobble)) / Math.min(1.4, radius),
      );
      if (coverage > best.coverage)
        best = { coverage, cross: distance / (radius || 1), radius };
    }
    return best;
  }

  const eligible = (a: number, b: number) => {
    const n = sample(a, b);
    return (
      n?.surface === "soil" &&
      !n.pathArt?.length &&
      n.height === cell.height &&
      !n.bridge &&
      !n.ramp &&
      !n.feature
    );
  };
  if (
    cell.surface === "soil" &&
    [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([dx, dy]) => {
      const n = sample(ix + dx, iy + dy);
      return n?.bridge || n?.ramp;
    })
  )
    return { coverage: 1, cross: 0, radius: 1 };
  let cache = routeCaches.get(sample);
  if (!cache) {
    cache = new Map();
    routeCaches.set(sample, cache);
  }
  const key = `${ix},${iy}`;
  let segments = cache.get(key);
  if (!segments) {
    segments = [];
    for (let yy = iy - 1; yy <= iy + 1; yy++)
      for (let xx = ix - 1; xx <= ix + 1; xx++)
        if (eligible(xx, yy)) {
          segments.push([xx + 0.5, yy + 0.5, xx + 0.5, yy + 0.5]);
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
            [1, 1],
            [-1, 1],
          ])
            if (eligible(xx + dx, yy + dy))
              segments.push([xx + 0.5, yy + 0.5, xx + dx + 0.5, yy + dy + 0.5]);
        }
    trimCache(cache, 1024);
    cache.set(key, segments);
  }
  let distance = Infinity,
    nx = x,
    ny = y;
  for (const [ax, ay, bx, by] of segments) {
    const dx = bx - ax,
      dy = by - ay,
      t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
      );
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < distance) {
      distance = d;
      nx = ax + t * dx;
      ny = ay + t * dy;
    }
  }
  if (!Number.isFinite(distance)) return { coverage: 0, cross: 1.5, radius: 0 };
  // Half breathing on the legacy reconstruction: it has no authored center
  // line, so a full-amplitude wave would swell isolated cells into blobs.
  const radius =
    (0.51 + margin(x, y, ox, oy) * 0.55) *
    (1 + (breathe(nx, ny, ox, oy) - 1) * 0.3);
  return {
    coverage: clamp01(0.48 + (radius - distance) / 0.65),
    cross: distance / (radius || 1),
    radius,
  };
}
export const pathCoverage = (
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
) => pathField(sample, x, y, ox, oy).coverage;
export function shorePixel(
  cell: TopographyCell,
  distance: number,
  wx: number,
  wy: number,
) {
  const p = waterStyle(cell);
  const pool =
    cell.waterVisual?.kind === "lake" && (cell.waterVisual.shoreWidth ?? 3) < 1;
  if (pool) {
    if (distance < -0.15)
      return distance < -0.8 ? [99, 145, 144] : [121, 163, 154];
    return distance < 0.15 ? [112, 126, 94] : [131, 140, 101];
  }

  if (distance < 0) {
    const i = waterBand(
      distance,
      cell.waterVisual?.kind ?? "river",
      cell.waterVisual?.shoreWidth ?? 3,
      wx,
      wy,
    );
    return rgb(distance > -0.1 ? p.bank[0] : p.depths[i]);
  }
  const gravel =
    cell.surface === "gravel" ||
    cell.waterVisual?.kind === "river" ||
    ["tundra", "boreal-woodland"].includes(cell.habitat?.ecology ?? "");
  const bx = Math.floor(wx / 8),
    by = Math.floor(wy / 7);
  const px = ((wx % 8) + 8) % 8,
    py = ((wy % 7) + 7) % 7;
  const sx = 1 + Math.floor(waterHash(bx, by, 329) * 4),
    sy = 1 + Math.floor(waterHash(bx, by, 330) * 3);
  const stone = gravel && waterHash(bx, by, 325) > 0.58;
  const wide = waterHash(bx, by, 326) > 0.6 ? 3 : 2;
  if (stone && px >= sx && px < sx + wide && py >= sy && py <= sy + 1)
    return rgb(p.stone[py === sy ? 2 : 0]);
  if (distance < 0.16) return rgb(p.bank[0]);
  return rgb(p.bank[1]).map(
    (v) =>
      v +
      (waterHash(Math.floor(wx / 3), Math.floor(wy / 2), 327) > 0.84 ? 5 : 0),
  );
}
