import { noise } from "../geography/noise";
import { route } from "../../core/routing";
import type { Point } from "../../core/types";
import type { LandSample } from "../geography/landscape";
import { cellKey, type Rect, type Road } from "./types";
export type Sample = (x: number, y: number) => LandSample;
export function line(a: Point, b: Point): Point[] {
  const out: Point[] = [];
  let x = a.x,
    y = a.y;
  out.push({ x, y });
  // Four-connected rasterization keeps every route traversable with cardinal steps.
  while (x !== b.x || y !== b.y) {
    if (x !== b.x) {
      x += Math.sign(b.x - x);
      out.push({ x, y });
    }
    if (y !== b.y) {
      y += Math.sign(b.y - y);
      out.push({ x, y });
    }
  }
  return out;
}
export function roadCells(r: Road, visit: (x: number, y: number) => void) {
  for (const p of r.points)
    for (let dy = -r.width; dy <= r.width; dy++)
      for (let dx = -r.width; dx <= r.width; dx++) visit(p.x + dx, p.y + dy);
}
/** Straight proportional line with cardinal rasterization, used by new roads. */
export function directLine(a: Point, b: Point): Point[] {
  const points: Point[] = [{ ...a }];
  const dx = b.x - a.x,
    dy = b.y - a.y,
    count = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 1; i <= count; i++) {
    const next = {
      x: Math.round(a.x + (dx * i) / count),
      y: Math.round(a.y + (dy * i) / count),
    };
    points.push(...line(points.at(-1)!, next).slice(1));
  }
  return points;
}
/** Select one short crossing with dry, accessible approaches; never bridge open sea. */
export function crossing(
  id: string,
  center: Point,
  sample: Sample,
  reach = 110,
): Road | undefined {
  let best: Road | undefined,
    score = Infinity;
  for (const vertical of [true, false])
    for (let across = -reach; across <= reach; across += 12)
      for (let along = -reach; along <= reach; along += 8) {
        const p = {
          x: center.x + (vertical ? across : along),
          y: center.y + (vertical ? along : across),
        };
        const water = sample(p.x, p.y);
        if (water.kind !== "river" || water.water >= 0) continue;
        const ends: Point[] = [];
        for (const sign of [-1, 1]) {
          for (let d = 1; d <= 56; d++) {
            const q = {
                x: p.x + (vertical ? 0 : sign * d),
                y: p.y + (vertical ? sign * d : 0),
              },
              f = sample(q.x, q.y);
            if (f.kind === "sea" && f.water < 0) break;
            if (f.water > 4) {
              ends.push(q);
              break;
            }
          }
        }
        if (ends.length !== 2) continue;
        const length =
          Math.abs(ends[0].x - ends[1].x) + Math.abs(ends[0].y - ends[1].y);
        if (length > 56 || length < 5) continue;
        const points = line(ends[0], ends[1]);
        if (
          points.some((q) =>
            [-1, 0, 1].some((d) => {
              const f = sample(
                q.x + (vertical ? d : 0),
                q.y + (vertical ? 0 : d),
              );
              return f.water < 0 && f.kind !== "river";
            }),
          )
        )
          continue;
        const value = length * 3 + Math.hypot(p.x - center.x, p.y - center.y);
        if (value < score) {
          score = value;
          best = { id, points, width: 1, kind: "bridge", cost: value };
        }
      }
  return best;
}
export function planRoad(
  id: string,
  a: Point,
  b: Point,
  sample: Sample,
  roads: Set<string>,
  bridges: Set<string>,
  solid: Set<string>,
  bounds: Rect,
  width = 1,
  step = 2,
  organicSeed?: string,
): Road | undefined {
  const snap = (p: Point) => ({
    x: Math.round(p.x / step) * step,
    y: Math.round(p.y / step) * step,
  });
  const preferenceCache = new Map<string, number>();
  const start = snap(a),
    end = snap(b);
  const result = route(
    start,
    end,
    (to, from) => {
      let slope = 0;
      for (const p of line(from, to)) {
        if (solid.has(cellKey(p.x, p.y))) return Infinity;
        const f = sample(p.x, p.y);
        if (f.water < 0 && !bridges.has(cellKey(p.x, p.y))) return Infinity;
        for (const [dx, dy] of [
          [width, 0],
          [-width, 0],
          [0, width],
          [0, -width],
        ]) {
          const k = cellKey(p.x + dx, p.y + dy),
            edge = sample(p.x + dx, p.y + dy);
          if (solid.has(k) || (edge.water < 0 && !bridges.has(k)))
            return Infinity;
        }
        slope = Math.max(
          slope,
          Math.abs(f.elevation - sample(from.x, from.y).elevation),
        );
      }
      const onRoad = roads.has(cellKey(to.x, to.y));
      // Discourage a new corridor beside an existing one; crossing or joining
      // remains possible, and obstacles/water still use the checks above.
      const nearRoad =
        !onRoad &&
        Math.hypot(to.x - a.x, to.y - a.y) > 4 &&
        Math.hypot(to.x - b.x, to.y - b.y) > 4 &&
        [
          [-3, 0],
          [3, 0],
          [0, -3],
          [0, 3],
          [-2, -2],
          [2, 2],
          [-2, 2],
          [2, -2],
        ].some(([dx, dy]) => roads.has(cellKey(to.x + dx, to.y + dy)));
      const base =
        (onRoad ? 1 : 4) +
        (nearRoad ? 4 : 0) +
        slope * 1.3 +
        (sample(to.x, to.y).water < 7 ? 2 : 0);
      let preference = 0;
      if (organicSeed && !roads.has(cellKey(to.x, to.y))) {
        const key = cellKey(to.x, to.y),
          old = preferenceCache.get(key);
        preference =
          old ??
          noise(organicSeed, to.x, to.y, 23, "route-ground") * 1.6 +
            Math.max(0, sample(to.x, to.y).moisture - 0.65) * 5;
        if (old === undefined) preferenceCache.set(key, preference);
      }
      return (
        (base + preference) *
        (to.x !== from.x && to.y !== from.y ? Math.SQRT2 : 1)
      );
    },
    {
      step,
      diagonal: !!organicSeed,
      bounds,
      maxNodes: organicSeed ? 5000 : step > 2 ? 5000 : 12000,
      minCost: roads.size ? 1 : 4,
      heuristicWeight: roads.size ? 1 : organicSeed ? 1.8 : step > 2 ? 2 : 1,
    },
  );
  if (result.status !== "found") return;
  const points: Point[] = [];
  let previous = a;
  for (const p of [start, ...result.path, b]) {
    points.push(...line(previous, p).slice(points.length ? 1 : 0));
    previous = p;
  }
  if (
    points.some(
      (p) =>
        solid.has(cellKey(p.x, p.y)) ||
        (sample(p.x, p.y).water < 0 && !bridges.has(cellKey(p.x, p.y))),
    )
  )
    return;
  let valid = true;
  roadCells({ id, points, width, kind: "street", cost: 0 }, (x, y) => {
    if (
      solid.has(cellKey(x, y)) ||
      (sample(x, y).water < 0 && !bridges.has(cellKey(x, y)))
    )
      valid = false;
  });
  if (!valid) return;
  return {
    id,
    points,
    width,
    kind: width ? "street" : "path",
    cost: result.cost,
  };
}

/** One bounded search reaches the nearest accessible network cell. No per-goal
 * sorting or repeated failed searches; cardinal edges preserve obstacle clearance. */
export function joinNetwork(
  id: string,
  access: Point,
  sample: Sample,
  roads: Set<string>,
  bridges: Set<string>,
  solid: Set<string>,
  bounds: Rect,
  width = 0,
): Road | undefined {
  if (!roads.size) return;
  const result = route(
    access,
    access,
    (to, from) => {
      for (let dy = -width; dy <= width; dy++)
        for (let dx = -width; dx <= width; dx++) {
          const k = cellKey(to.x + dx, to.y + dy);
          if (
            solid.has(k) ||
            (sample(to.x + dx, to.y + dy).water < 0 && !bridges.has(k))
          )
            return Infinity;
        }
      return (
        1 +
        Math.abs(
          sample(to.x, to.y).elevation - sample(from.x, from.y).elevation,
        ) *
          1.3
      );
    },
    { bounds, maxNodes: 5000, isGoal: (p) => roads.has(cellKey(p.x, p.y)) },
  );
  if (result.status !== "found") return;
  let points = [access, ...result.path];
  // Ease the final approach into the shared centerline on clear level ground.
  // The authoritative cells change with the art; never smooth through obstacles.
  const tail = Math.max(0, points.length - 9),
    end = points.at(-1)!;
  const approach = directLine(points[tail], end),
    level = sample(end.x, end.y).elevation;
  const clear = approach.every((p) => {
    for (let dy = -width; dy <= width; dy++)
      for (let dx = -width; dx <= width; dx++) {
        const x = p.x + dx,
          y = p.y + dy,
          f = sample(x, y);
        if (solid.has(cellKey(x, y)) || f.water < 0 || f.elevation !== level)
          return false;
      }
    return true;
  });
  if (clear) {
    points = [...points.slice(0, tail), ...approach];
    const join = points.findIndex((p) => roads.has(cellKey(p.x, p.y)));
    if (join >= 0) points = points.slice(0, join + 1);
  }
  return {
    id,
    points,
    width,
    kind: width ? "street" : "path",
    cost: result.cost,
  };
}

/** Access routes terminate at the first existing road they reach. They do not
 * make a second trip all the way to the village center alongside that road. */
export function planAccess(
  id: string,
  access: Point,
  sample: Sample,
  roads: Set<string>,
  bridges: Set<string>,
  solid: Set<string>,
  bounds: Rect,
): Road | undefined {
  if (roads.has(cellKey(access.x, access.y)))
    return { id, points: [access], width: 0, kind: "path", cost: 0 };
  const candidates = [...roads]
    .map((k) => {
      const [x, y] = k.split(",").map(Number);
      return { x, y };
    })
    .filter(
      (p) =>
        p.x >= bounds.x &&
        p.y >= bounds.y &&
        p.x < bounds.x + bounds.w &&
        p.y < bounds.y + bounds.h &&
        !solid.has(cellKey(p.x, p.y)),
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - access.x, a.y - access.y) -
          Math.hypot(b.x - access.x, b.y - access.y) ||
        a.y - b.y ||
        a.x - b.x,
    );
  const tried: Point[] = [];
  for (const goal of candidates) {
    if (tried.some((p) => Math.hypot(p.x - goal.x, p.y - goal.y) < 3)) continue;
    tried.push(goal);
    const result = planRoad(
      id,
      access,
      goal,
      sample,
      roads,
      bridges,
      solid,
      bounds,
      0,
      1,
      "access",
    );
    if (result) {
      const join = result.points.findIndex((p) => roads.has(cellKey(p.x, p.y)));
      if (join >= 0) result.points = result.points.slice(0, join + 1);
      return result;
    }
    if (tried.length >= 8) break;
  }
}
