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
export function pathArt(roads: readonly Road[]) {
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
          radius: road.width + 0.5,
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
