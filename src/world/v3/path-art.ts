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
export function pathArt(
  roads: readonly Road[],
  shared = false,
  ruts?: false,
  dung?: false,
  /** Motor-age roads are blacktop, painted with this centre line. */
  paved?: PathStroke["paved"],
) {
  if (shared) roads = uniqueRoads(roads);
  const index = new Map<string, PathStroke[]>();
  for (const road of roads) {
    if (road.kind === "bridge" || road.points.length < 2) continue;
    const points = road.points,
      keep = new Set([0, points.length - 1]);
    const work = [[0, points.length - 1]];
    while (work.length) {
      const [a, b] = work.pop()!;
      let max = 1.1,
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
    // Round the corners: two rounds of corner cutting on the simplified
    // line, endpoints fixed. The route cells underneath are untouched, so a
    // bend strays at most about a cell from the walked line.
    let selected = [...keep].sort((a, b) => a - b).map((i) => points[i]);
    for (let round = 0; round < 2 && selected.length > 2; round++) {
      const out: Point[] = [selected[0]];
      for (let i = 0; i < selected.length - 1; i++) {
        const a = selected[i],
          b = selected[i + 1];
        if (i > 0) out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
        if (i < selected.length - 2)
          out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
      }
      out.push(selected[selected.length - 1]);
      selected = out;
    }
    // A blacktop road is two car lanes wide whatever the track under it was.
    const blacktop = paved && road.width >= 1;
    // A farm road off it is graded gravel, a truck wide.
    const gravel = blacktop && isGravel(road);
    for (let i = 1; i < selected.length; i++) {
      const a = selected[i - 1],
        b = selected[i],
        stroke: PathStroke = {
          a: [a.x + 0.5, a.y + 0.5],
          b: [b.x + 0.5, b.y + 0.5],
          // Art half-width only; the route's reserved cells are unchanged. A
          // cart road at the generated width painted a 48px ribbon through a
          // village, roughly twice what the reference art carries.
          radius: gravel
            ? 1.5
            : blacktop
            ? 2.6
            : road.width
              ? road.width * 0.72 + 0.44
              : (shared ? 0.6 : 0.8) * wear(road.loads?.[0]),
          ...(ruts === false && { ruts }),
          ...(dung === false && { dung }),
          ...(blacktop && { paved: gravel ? ("gravel" as const) : paved }),
        };
      const count = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2),
        seen = new Set<string>(),
        pad = blacktop ? 4 : road.width + 1;
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

const isGravel = (road: Road) => road.kind === "lane" && road.width >= 1 && road.id.includes("-field");

/** A footpath fed by a few households wears a little wider, not a lane's width. */
const wear = (load = 1) => 1 + 0.14 * Math.min(4, load - 1);

/** Union cardinal edges before simplification, stopping at every junction. A
 * shared segment has one owner and the widest road wins, regardless of order. */
export function uniqueRoads(roads: readonly Road[]): Road[] {
  type Edge = { a: Point; b: Point; width: number; load: number; key: string; gravel: boolean };
  const key = (p: Point) => `${p.x},${p.y}`;
  const edges = new Map<string, Edge>();
  for (const road of roads) {
    if (road.kind === "bridge") continue;
    for (let i = 1; i < road.points.length; i++) {
      const [a, b] = [road.points[i - 1], road.points[i]];
      if (key(a) === key(b)) continue;
      const k = [key(a), key(b)].sort().join(":"),
        load = Math.min(road.loads?.[i - 1] ?? 1, road.loads?.[i] ?? 1),
        old = edges.get(k);
      if (!old || old.width < road.width)
        edges.set(k, { a, b, width: road.width, load, key: k, gravel: isGravel(road) });
      else if (old.width === road.width) old.load = Math.max(old.load, load);
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
  const stop = (p: Point, width: number, load: number, first = false) => {
    const list = adjacency.get(key(p))!;
    return list.length !== 2 || list.some((e) => e.width !== width || e.load !== load || e.gravel !== first);
  };
  const walk = (first: Edge, start: Point) => {
    let edge = first,
      p = start;
    const points = [p];
    while (!seen.has(edge.key)) {
      seen.add(edge.key);
      p = key(edge.a) === key(p) ? edge.b : edge.a;
      points.push(p);
      if (stop(p, first.width, first.load, first.gravel)) break;
      const next = adjacency.get(key(p))!.find((e) => !seen.has(e.key));
      if (!next) break;
      edge = next;
    }
    out.push({
      id: `network${first.gravel ? "-field" : ""}-${out.length}`,
      points,
      width: first.width,
      kind: first.gravel ? "lane" : first.width ? "street" : "path",
      cost: 0,
      ...(!first.width && { loads: [first.load] }),
    });
  };
  for (const edge of edges.values()) {
    if (seen.has(edge.key)) continue;
    if (stop(edge.a, edge.width, edge.load, edge.gravel)) walk(edge, edge.a);
    else if (stop(edge.b, edge.width, edge.load, edge.gravel)) walk(edge, edge.b);
  }
  for (const edge of edges.values())
    if (!seen.has(edge.key)) walk(edge, edge.a);
  return out;
}
