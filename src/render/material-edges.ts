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
/** Connect neighboring route centers before rasterization. A diagonal is a
 * continuous corridor, never a sequence of independently rounded tile caps. */
export function pathCoverage(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    cell = sample(ix, iy)!;
  if (cell.pathArt?.length && !cell.feature && !cell.ramp && !cell.bridge) {
    let depth = -Infinity;
    for (const s of cell.pathArt) {
      const ax = ix + s.a[0],
        ay = iy + s.a[1],
        dx = s.b[0] - s.a[0],
        dy = s.b[1] - s.a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
      );
      depth = Math.max(
        depth,
        s.radius - Math.hypot(x - ax - t * dx, y - ay - t * dy),
      );
    }
    return Math.max(0, Math.min(1, 0.48 + depth / 0.65));
  }
  const eligible = (a: number, b: number) => {
    const n = sample(a, b);
    return (
      n?.surface === "soil" &&
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
    return 1;
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
    if (cache.size > 1024) cache.clear();
    cache.set(key, segments);
  }
  let distance = Infinity;
  for (const [ax, ay, bx, by] of segments) {
    const dx = bx - ax,
      dy = by - ay,
      t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
      );
    distance = Math.min(distance, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  // Very small long-wave margin variation; pixel stamps are placed separately.
  const radius =
    0.51 + (waterNoise((x + ox) * 16, (y + oy) * 16, 29, 363) - 0.5) * 0.09;
  return Math.max(0, Math.min(1, 0.48 + (radius - distance) / 0.65));
}
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
