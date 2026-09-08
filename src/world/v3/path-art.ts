import type { Road } from "./types";
import type { Point } from "../../core/types";
import type { PathStroke } from "../../core/topography";
const distance = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
/** Simplify four-connected route steps for art only, with less than one cell of
 * deviation. The generated route, reservations and movement rules stay intact. */
export function pathArt(roads: readonly Road[], shared = false) {
  if (shared) roads = uniqueRoads(roads);
  const index = new Map<string, PathStroke[]>();
  for (const road of roads) {
    if (road.kind === "bridge" || road.points.length < 2) continue;
    const points = road.points,
      keep = new Set([0, points.length - 1]);
    const work = [[0, points.length - 1]];
    while (work.length) {
      const [a, b] = work.pop()!;
      let max = 0.75,
        at = -1;
      for (let i = a + 1; i < b; i++) {
        const d = distance(points[i], points[a], points[b]);
        if (d > max) {
          max = d;
          at = i;
        }
      }
      if (at >= 0) {
        keep.add(at);
        work.push([a, at], [at, b]);
      }
    }
    const selected = [...keep].sort((a, b) => a - b).map((i) => points[i]);
    for (let i = 1; i < selected.length; i++) {
      const a = selected[i - 1],
        b = selected[i],
        stroke: PathStroke = {
          a: [a.x + 0.5, a.y + 0.5],
          b: [b.x + 0.5, b.y + 0.5],
          radius: road.width + (shared && !road.width ? 0.32 : 0.5),
        };
      const count = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2),
        seen = new Set<string>(),
        pad = road.width + 1;
      for (let j = 0; j <= count; j++) {
        const x = Math.floor(a.x + ((b.x - a.x) * j) / (count || 1)),
          y = Math.floor(a.y + ((b.y - a.y) * j) / (count || 1));
        for (let dy = -pad; dy <= pad; dy++)
          for (let dx = -pad; dx <= pad; dx++) {
            const key = `${x + dx},${y + dy}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const list = index.get(key) ?? [];
            list.push(stroke);
            index.set(key, list);
          }
      }
    }
  }
  return index;
}

/** Union cardinal edges before simplification, stopping at every junction. A
 * shared segment has one owner and the widest road wins, regardless of order. */
export function uniqueRoads(roads: readonly Road[]): Road[] {
  type Edge = { a: Point; b: Point; width: number; key: string };
  const key = (p: Point) => `${p.x},${p.y}`;
  const edges = new Map<string, Edge>();
  for (const road of roads) {
    if (road.kind === "bridge") continue;
    for (let i = 1; i < road.points.length; i++) {
      const [a, b] = [road.points[i - 1], road.points[i]];
      if (key(a) === key(b)) continue;
      const k = [key(a), key(b)].sort().join(":");
      if (!edges.has(k) || edges.get(k)!.width < road.width)
        edges.set(k, { a, b, width: road.width, key: k });
    }
  }
  const adjacency = new Map<string, Edge[]>();
  for (const edge of edges.values())
    for (const p of [edge.a, edge.b]) {
      const list = adjacency.get(key(p)) ?? [];
      list.push(edge);
      adjacency.set(key(p), list);
    }
  const seen = new Set<string>(),
    out: Road[] = [];
  const stop = (p: Point, width: number) => {
    const list = adjacency.get(key(p))!;
    return list.length !== 2 || list.some((e) => e.width !== width);
  };
  const walk = (first: Edge, start: Point) => {
    let edge = first,
      p = start;
    const points = [p];
    while (!seen.has(edge.key)) {
      seen.add(edge.key);
      p = key(edge.a) === key(p) ? edge.b : edge.a;
      points.push(p);
      if (stop(p, first.width)) break;
      const next = adjacency.get(key(p))!.find((e) => !seen.has(e.key));
      if (!next) break;
      edge = next;
    }
    out.push({
      id: `network-${out.length}`,
      points,
      width: first.width,
      kind: first.width ? "street" : "path",
      cost: 0,
    });
  };
  for (const edge of edges.values()) {
    if (seen.has(edge.key)) continue;
    if (stop(edge.a, edge.width)) walk(edge, edge.a);
    else if (stop(edge.b, edge.width)) walk(edge, edge.b);
  }
  for (const edge of edges.values())
    if (!seen.has(edge.key)) walk(edge, edge.a);
  return out;
}
