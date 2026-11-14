import { broadEnvironment } from "../geography/atlas";
import {
  cellPoint,
  kilometers,
  isWater,
  neighborsOf,
  passable,
} from "./geography";
import type { TravelMode } from "./types";
class Queue {
  items: { id: string; score: number }[] = [];
  push(id: string, score: number) {
    const v = { id, score };
    let i = this.items.length;
    this.items.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p].score <= score) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = v;
  }
  pop() {
    const root = this.items[0],
      last = this.items.pop()!;
    if (this.items.length) {
      let i = 0;
      while (i * 2 + 1 < this.items.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < this.items.length &&
          this.items[child + 1].score < this.items[child].score
        )
          child++;
        if (this.items[child].score >= last.score) break;
        this.items[i] = this.items[child];
        i = child;
      }
      this.items[i] = last;
    }
    return root;
  }
}
const edges = new Map<string, boolean>();
export function edgeOpen(a: string, b: string, mode: TravelMode) {
  const k = [mode, ...[a, b].sort()].join(":");
  let open = edges.get(k);
  if (open === undefined) {
    open = passable(cellPoint(a), cellPoint(b), mode);
    if (edges.size > 250000) edges.clear();
    edges.set(k, open);
  }
  return open;
}
const routeCache = new Map<string, { path: string[]; expanded: number }>();
export function findTravelPath(
  start: string,
  goal: string,
  mode: TravelMode,
  maxKm = Infinity,
) {
  const reverse = start > goal,
    [a, b] = [start, goal].sort(),
    key = `${mode}:${a}:${b}:${maxKm}`;
  const cached = routeCache.get(key);
  if (cached)
    return {
      path: reverse ? [...cached.path].reverse() : [...cached.path],
      expanded: 0,
    };
  const q = new Queue(),
    cost = new Map([[a, 0]]),
    previous = new Map<string, string>(),
    closed = new Set<string>();
  q.push(a, 0);
  while (q.items.length) {
    const current = q.pop().id;
    if (closed.has(current)) continue;
    if (current === b) {
      const path = [b];
      while (path.at(-1) !== a) path.push(previous.get(path.at(-1)!)!);
      path.reverse();
      const result = { path, expanded: closed.size };
      if (routeCache.size > 80) routeCache.clear();
      routeCache.set(key, result);
      return {
        path: reverse ? [...path].reverse() : [...path],
        expanded: closed.size,
      };
    }
    closed.add(current);

    const p = cellPoint(current);
    for (const next of neighborsOf(current)) {
      if (closed.has(next) || !edgeOpen(current, next, mode)) continue;
      const n = cellPoint(next);
      if (kilometers(cellPoint(a), n) + kilometers(n, cellPoint(b)) > maxKm)
        continue;
      const relief =
        !isWater(p) && !isWater(n)
          ? (broadEnvironment(p.lon, p.lat).relief +
              broadEnvironment(n.lon, n.lat).relief) /
            2
          : 0;
      const nextCost =
        cost.get(current)! +
        kilometers(p, n) * (1 + relief * 0.9) +
        (isWater(p) !== isWater(n) ? 75 : 0);
      if (nextCost >= (cost.get(next) ?? Infinity)) continue;
      cost.set(next, nextCost);
      previous.set(next, current);
      q.push(next, nextCost + kilometers(n, cellPoint(b)));
    }
  }
  throw Error(
    `No ${mode} connection at the atlas routing resolution. Islands require a sea journey; narrow crossings may need finer geographic data.`,
  );
}
