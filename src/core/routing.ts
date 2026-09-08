import type { Point } from "./types";
export type RouteResult = {
  status: "found" | "unreachable" | "budget";
  path: Point[];
  visited: number;
  cost: number;
};
type Entry = { p: Point; g: number; f: number; order: number };
/** Weighted A* with stable heap ordering. Costs must be >= 1; Infinity forbids an edge.
 * V1/v2 retain their original pathfinder for replay compatibility. */
export function route(
  start: Point,
  goal: Point,
  cost: (to: Point, from: Point) => number,
  options: {
    maxNodes?: number;
    minCost?: number;
    /** Above one trades optimality for a faster, directed search. Used only when laying out country roads. */
    heuristicWeight?: number;
    step?: number;
    /** Generation only; runtime movement retains its existing crossing rules. */
    diagonal?: boolean;
    bounds?: { x: number; y: number; w: number; h: number };
  } = {},
): RouteResult {
  const step = options.step ?? 1,
    max = options.maxNodes ?? 18000;
  const key = (p: Point) => `${p.x},${p.y}`;
  const heap: Entry[] = [],
    scores = new Map<string, number>(),
    parents = new Map<string, Point>();
  let serial = 0,
    visited = 0;
  const less = (a: Entry, b: Entry) =>
    a.f < b.f || (a.f === b.f && a.order < b.order);
  const push = (e: Entry) => {
    let i = heap.length;
    heap.push(e);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!less(e, heap[p])) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = e;
  };
  const pop = () => {
    const root = heap[0],
      last = heap.pop()!;
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < heap.length && less(heap[c + 1], heap[c])) c++;
        if (!less(heap[c], last)) break;
        heap[i] = heap[c];
        i = c;
      }
      heap[i] = last;
    }
    return root;
  };
  scores.set(key(start), 0);
  push({ p: start, g: 0, f: 0, order: serial++ });
  while (heap.length && visited < max) {
    const current = pop(),
      k = key(current.p);
    if (current.g !== scores.get(k)) continue;
    visited++;
    if (current.p.x === goal.x && current.p.y === goal.y) {
      const path: Point[] = [];
      let p = current.p;
      while (p.x !== start.x || p.y !== start.y) {
        path.push(p);
        p = parents.get(key(p))!;
      }
      return {
        status: "found",
        path: path.reverse(),
        visited,
        cost: current.g,
      };
    }
    for (const [dx, dy] of [
      [0, -step],
      [step, 0],
      [0, step],
      [-step, 0],
      ...(options.diagonal
        ? [
            [step, step],
            [step, -step],
            [-step, step],
            [-step, -step],
          ]
        : []),
    ]) {
      const p = { x: current.p.x + dx, y: current.p.y + dy },
        b = options.bounds;
      if (b && (p.x < b.x || p.y < b.y || p.x > b.x + b.w || p.y > b.y + b.h))
        continue;
      const edge = cost(p, current.p);
      if (!Number.isFinite(edge)) continue;
      if (edge < 1) throw Error("Routing costs must be at least one.");
      const g = current.g + edge,
        nk = key(p);
      if (g >= (scores.get(nk) ?? Infinity)) continue;
      scores.set(nk, g);
      parents.set(nk, current.p);
      push({
        p,
        g,
        f:
          g +
          ((options.diagonal
            ? Math.hypot(goal.x - p.x, goal.y - p.y)
            : Math.abs(goal.x - p.x) + Math.abs(goal.y - p.y)) /
            step) *
            (options.minCost ?? 1) *
            (options.heuristicWeight ?? 1),
        order: serial++,
      });
    }
  }
  return {
    status: heap.length ? "budget" : "unreachable",
    path: [],
    visited,
    cost: Infinity,
  };
}
