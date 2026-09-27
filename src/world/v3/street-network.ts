import type { Point } from "../../core/types";
import type { Segment } from "./blocks";
import { line } from "./roads";

const bounds = (s: Segment) => [Math.min(s.a.x, s.b.x), Math.min(s.a.y, s.b.y), Math.max(s.a.x, s.b.x), Math.max(s.a.y, s.b.y)];

export function streetComponents(streets: readonly Segment[]): number[] {
  const parent = streets.map((_, i) => i);
  const root = (i: number): number => parent[i] === i ? i : parent[i] = root(parent[i]);
  const boxes = streets.map(bounds);
  for (let i = 0; i < streets.length; i++)
    for (let j = 0; j < i; j++) {
      const a = boxes[i], b = boxes[j];
      if (a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]) parent[root(i)] = root(j);
    }
  return parent.map((_, i) => root(i));
}

/** Join isolated district fragments before parcels claim the intervening ground. */
export function connectStreetComponents(streets: Segment[], allowed: (p: Point) => boolean) {
  for (let pass = 0; pass < 32; pass++) {
    const groups = streetComponents(streets);
    if (new Set(groups).size < 2) return;
    const candidates: { a: Point; b: Point; distance: number }[] = [];
    for (let i = 0; i < streets.length; i++)
      for (let j = 0; j < i; j++) {
        if (groups[i] === groups[j]) continue;
        for (const [from, to] of [[i, j], [j, i]]) {
          const box = bounds(streets[to]);
          for (const a of [streets[from].a, streets[from].b]) {
            const b = { x: Math.max(box[0], Math.min(box[2], a.x)), y: Math.max(box[1], Math.min(box[3], a.y)) };
            const distance = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            if (distance <= 48) candidates.push({ a, b, distance });
          }
        }
      }
    let joined = false;
    for (const { a, b } of candidates.sort((a, b) => a.distance - b.distance)) {
      for (const turn of [{ x: a.x, y: b.y }, { x: b.x, y: a.y }]) {
        const path = [...line(a, turn), ...line(turn, b)];
        if (!path.every(allowed)) continue;
        if (a.x !== turn.x || a.y !== turn.y) streets.push({ a: { ...a }, b: turn, tier: 1 });
        if (b.x !== turn.x || b.y !== turn.y) streets.push({ a: turn, b: { ...b }, tier: 1 });
        joined = true;
        break;
      }
      if (joined) break;
    }
    if (!joined) return;
  }
}
