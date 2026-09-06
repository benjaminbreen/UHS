import type { Point } from "./types";
/** Bounded A*: shared by the human runtime and headless adapter. */
export function findPath(
  start: Point,
  end: Point,
  blocked: (x: number, y: number) => boolean,
  maxNodes = 18000,
): Point[] {
  const key = (p: Point) => `${p.x},${p.y}`;
  const begin = key(start),
    goal = key(end);
  if (begin === goal) return [];
  const queue: [Point, number][] = [[start, 0]],
    prev = new Map<string, string>(),
    cost = new Map([[begin, 0]]);
  let found = false;
  for (
    let iterations = 0;
    queue.length && iterations < maxNodes;
    iterations++
  ) {
    let best = 0;
    for (let i = 1; i < queue.length; i++)
      if (queue[i][1] < queue[best][1]) best = i;
    const [p] = queue.splice(best, 1)[0];
    const k = key(p);
    if (k === goal) {
      found = true;
      break;
    }
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const next = { x: p.x + dx, y: p.y + dy };
      if (blocked(next.x, next.y)) continue;
      const nk = key(next),
        g = (cost.get(k) ?? 0) + 1;
      if (g >= (cost.get(nk) ?? Infinity)) continue;
      cost.set(nk, g);
      prev.set(nk, k);
      queue.push([
        next,
        g + Math.abs(end.x - next.x) + Math.abs(end.y - next.y),
      ]);
    }
  }
  if (!found) return [];
  const path: Point[] = [];
  let k = goal;
  while (k !== begin) {
    const [x, y] = k.split(",").map(Number);
    path.push({ x, y });
    const p = prev.get(k);
    if (!p) return [];
    k = p;
  }
  return path.reverse();
}
