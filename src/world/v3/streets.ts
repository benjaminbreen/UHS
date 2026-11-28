import { route } from "../../core/routing";
import type { Point } from "../../core/types";
import { roadCells } from "./roads";
import type { Road, SettlementPlan } from "./types";

/** A plan's roads as a graph of walkable centre lines: nodes where roads meet
 * or end, edges the cells between. Residents' trips search this rather than
 * every cell, and a bridge is an edge like any other. */
export type StreetGraph = {
  nodes: Point[];
  /** Cells from node `a` to node `b`, both included, and the footway line
   * either side of them where the street has one. */
  edges: { a: number; b: number; cells: Point[]; sides: Point[][] }[];
  adjacent: number[][];
  node: Map<number, number>;
  /** Every centre-line cell: an edge and the cell's index along it. */
  on: Map<number, { edge: number; i: number }>;
  /** Node pair (lower first) to the edges between them; null for no way. */
  middles: Map<number, number[] | null>;
};

const key = (x: number, y: number) => (x + 32768) * 65536 + (y + 32768);
const graphs = new WeakMap<SettlementPlan, StreetGraph>();
/** Built the first time a routine needs it; it depends only on the plan, so
 * who asks first never changes a route. Kept off the plan itself so prepared
 * worlds do not carry it. */
export const streetsOf = (plan: SettlementPlan) => {
  let g = graphs.get(plan);
  if (!g)
    graphs.set(plan, (g = streetGraph(plan.roads, (x, y) => plan.pavement?.get(`${x},${y}`) === "footway")));
  return g;
};

/** The footway line each side of a centre line: the nearest footway cell
 * square across from each cell. Where a side street's mouth or a gap breaks
 * it, the last offset holds, so the walk carries straight on across. */
function footways(chain: Point[], footway: (x: number, y: number) => boolean): Point[][] {
  const sides: Point[][] = [];
  for (const sign of [1, -1]) {
    const offsets = chain.map((c, i) => {
      const a = chain[Math.max(0, i - 1)], b = chain[Math.min(chain.length - 1, i + 1)];
      const [nx, ny] = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? [0, sign] : [sign, 0];
      for (let k = 1; k <= 6; k++) if (footway(c.x + nx * k, c.y + ny * k)) return [nx * k, ny * k];
    });
    const first = offsets.findIndex(Boolean);
    if (first < 0) continue;
    let held = offsets[first]!;
    sides.push(chain.map((c, i) => {
      held = offsets[i] ?? held;
      return { x: c.x + held[0], y: c.y + held[1] };
    }));
  }
  return sides;
}

/** Steps one cell at a time, x before y, so every chain is 4-connected. */
function walk(chain: Point[], to: Point) {
  const last = chain.at(-1);
  if (!last) return void chain.push({ x: to.x, y: to.y });
  let { x, y } = last;
  while (x !== to.x) chain.push({ x: (x += Math.sign(to.x - x)), y });
  while (y !== to.y) chain.push({ x, y: (y += Math.sign(to.y - y)) });
}

export function streetGraph(roads: Road[], footway: (x: number, y: number) => boolean = () => false): StreetGraph {
  const walked = roads.filter((r) => r.kind !== "rail" && r.points.length);
  const chains = walked.map((r) => {
    const chain: Point[] = [];
    for (const p of r.points) walk(chain, p);
    return chain;
  });
  const seen = new Map<number, number>();
  const cover = new Map<number, number[]>();
  chains.forEach((chain, c) => {
    for (const p of chain) seen.set(key(p.x, p.y), (seen.get(key(p.x, p.y)) ?? 0) + 1);
    roadCells(walked[c], (x, y) => {
      const list = cover.get(key(x, y));
      if (!list) cover.set(key(x, y), [c]);
      else if (list.at(-1) !== c) list.push(c);
    });
  });
  const ends = new Set<number>();
  for (const chain of chains)
    for (const p of [chain[0], chain.at(-1)!]) ends.add(key(p.x, p.y));
  // A road that stops on or beside another's carriageway (a door path at the
  // kerb, a lane at the high street) joins its centre line by the nearest cell.
  const links: Point[][] = [];
  chains.forEach((chain, c) => {
    for (const e of [chain[0], chain.at(-1)!]) {
      const near = new Set<number>();
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]])
        for (const o of cover.get(key(e.x + dx, e.y + dy)) ?? []) if (o !== c) near.add(o);
      for (const o of near) {
        let best: Point | undefined, d = Infinity;
        for (const p of chains[o]) {
          const m = Math.abs(p.x - e.x) + Math.abs(p.y - e.y);
          if (m < d) (d = m), (best = p);
        }
        if (!best || d === 0 || d > walked[o].width + (walked[o].span ?? 0) + 3) continue;
        const link: Point[] = [{ ...e }];
        walk(link, best);
        links.push(link);
        ends.add(key(best.x, best.y));
      }
    }
  });
  for (const link of links)
    for (const p of link.slice(1, -1)) seen.set(key(p.x, p.y), (seen.get(key(p.x, p.y)) ?? 0) + 1);
  const g: StreetGraph = { nodes: [], edges: [], adjacent: [], node: new Map(), on: new Map(), middles: new Map() };
  const nodeOf = (p: Point) => {
    const k = key(p.x, p.y);
    let n = g.node.get(k);
    if (n === undefined) {
      g.node.set(k, (n = g.nodes.length));
      g.nodes.push(p);
      g.adjacent.push([]);
    }
    return n;
  };
  const isNode = (p: Point) => ends.has(key(p.x, p.y)) || (seen.get(key(p.x, p.y)) ?? 0) > 1;
  for (const chain of [...chains, ...links]) {
    const sides = footways(chain, footway);
    let start = 0;
    for (let i = 1; i < chain.length; i++) {
      if (i < chain.length - 1 && !isNode(chain[i])) continue;
      const cells = chain.slice(start, i + 1);
      const a = nodeOf(cells[0]), b = nodeOf(cells.at(-1)!), e = g.edges.length;
      g.edges.push({ a, b, cells, sides: sides.map((side) => side.slice(start, i + 1)) });
      g.adjacent[a].push(e);
      if (b !== a) g.adjacent[b].push(e);
      cells.forEach((p, j) => {
        const k = key(p.x, p.y);
        if (!g.on.has(k)) g.on.set(k, { edge: e, i: j });
      });
      start = i;
    }
    if (chain.length === 1) nodeOf(chain[0]);
  }
  return g;
}

/** Shortest edges from node `s` to node `t`, cached for the plan. Always
 * searched from the lower id so ties break the same whichever end asks. */
function middle(g: StreetGraph, s: number, t: number): number[] | null {
  if (s === t) return [];
  const lo = Math.min(s, t), hi = Math.max(s, t), k = lo * 1048576 + hi;
  let found = g.middles.get(k);
  if (found === undefined) {
    found = search(g, lo, hi);
    g.middles.set(k, found);
  }
  return found && s > t ? [...found].reverse() : found;
}

function search(g: StreetGraph, s: number, t: number): number[] | null {
  const dist = new Map<number, number>([[s, 0]]), via = new Map<number, number>();
  const goal = g.nodes[t];
  const h = (n: number) => Math.abs(g.nodes[n].x - goal.x) + Math.abs(g.nodes[n].y - goal.y);
  const heap: [number, number, number][] = [[h(s), 0, s]];
  let order = 0;
  const less = (a: [number, number, number], b: [number, number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  while (heap.length) {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= heap.length) break;
        if (c + 1 < heap.length && less(heap[c + 1], heap[c])) c++;
        if (!less(heap[c], last)) break;
        heap[i] = heap[c];
        i = c;
      }
      heap[i] = last;
    }
    const n = top[2], d = dist.get(n)!;
    if (top[0] !== d + h(n)) continue;
    if (n === t) {
      const edges: number[] = [];
      for (let at = t; at !== s; ) {
        const e = via.get(at)!;
        edges.push(e);
        at = g.edges[e].a === at ? g.edges[e].b : g.edges[e].a;
      }
      return edges.reverse();
    }
    for (const e of g.adjacent[n]) {
      const edge = g.edges[e], m = edge.a === n ? edge.b : edge.a;
      const nd = d + edge.cells.length - 1;
      if (nd >= (dist.get(m) ?? Infinity)) continue;
      dist.set(m, nd);
      via.set(m, e);
      const entry: [number, number, number] = [nd + h(m), ++order, m];
      let i = heap.length;
      heap.push(entry);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (!less(entry, heap[p])) break;
        heap[i] = heap[p];
        i = p;
      }
      heap[i] = entry;
    }
  }
  return null;
}

type Join = { at: Point; path: Point[] };
/** A short search from a door or stop to the nearest centre-line cell; null
 * when the search ran out of cells, so the stop is walled in. */
function join(g: StreetGraph, from: Point, cost: (p: Point) => number): Join | null | undefined {
  if (g.on.has(key(from.x, from.y))) return { at: from, path: [] };
  const r = route(from, from, cost, { isGoal: (p) => g.on.has(key(p.x, p.y)), maxNodes: 10000 });
  return r.status === "found" ? { at: r.path.at(-1)!, path: r.path } : r.status === "unreachable" ? null : undefined;
}

type Run = { edge: number; from: number; to: number };
/** The ways out of a centre-line cell along its edge: to each end node, with
 * the run of the edge from here to it. */
function exits(g: StreetGraph, p: Point): { n: number; run?: Run; steps: number }[] {
  const n = g.node.get(key(p.x, p.y));
  if (n !== undefined) return [{ n, steps: 0 }];
  const { edge, i } = g.on.get(key(p.x, p.y))!, last = g.edges[edge].cells.length - 1;
  return [
    { n: g.edges[edge].a, run: { edge, from: i, to: 0 }, steps: i },
    { n: g.edges[edge].b, run: { edge, from: i, to: last }, steps: last - i },
  ];
}

/** A walk from `from` to `to` by the streets: onto the network, along it, off
 * it. The ends use the walker's own cost, so yards and gates still count.
 * Null when either end is walled in; undefined when an end has no street
 * close by or the streets do not join, and the caller searches cells
 * instead. Excludes `from`, ends at `to`. */
export function streetWalk(g: StreetGraph, from: Point, to: Point, cost: (p: Point) => number): Point[] | null | undefined {
  const onto = join(g, from, cost), off = onto && join(g, to, cost);
  if (onto === null || off === null) return null;
  if (!onto || !off) return;
  let best: Run[] | undefined, length = Infinity;
  const a = g.on.get(key(onto.at.x, onto.at.y))!, b = g.on.get(key(off.at.x, off.at.y))!;
  if (a.edge === b.edge && !g.node.has(key(onto.at.x, onto.at.y)) && !g.node.has(key(off.at.x, off.at.y))) {
    best = [{ edge: a.edge, from: a.i, to: b.i }];
    length = Math.abs(a.i - b.i);
  }
  for (const out of exits(g, onto.at))
    for (const into of exits(g, off.at)) {
      const edges = middle(g, out.n, into.n);
      if (!edges) continue;
      let steps = out.steps + into.steps;
      for (const e of edges) steps += g.edges[e].cells.length - 1;
      if (steps >= length) continue;
      const runs = out.run ? [out.run] : [];
      let at = out.n;
      for (const e of edges) {
        const edge = g.edges[e], last = edge.cells.length - 1, forward = edge.a === at;
        runs.push({ edge: e, from: forward ? 0 : last, to: forward ? last : 0 });
        at = forward ? edge.b : edge.a;
      }
      if (into.run) runs.push({ ...into.run, from: into.run.to, to: into.run.from });
      best = runs;
      length = steps;
    }
  if (!best) return;
  // Along each edge on the footway nearer where the walker already is.
  const anchors: Point[] = [...onto.path];
  let near = onto.path.at(-2) ?? from;
  for (const run of best) {
    const edge = g.edges[run.edge], dir = Math.sign(run.to - run.from) || 1;
    const line = edge.sides.length
      ? edge.sides.reduce((x, y) =>
          Math.abs(y[run.from].x - near.x) + Math.abs(y[run.from].y - near.y) <
          Math.abs(x[run.from].x - near.x) + Math.abs(x[run.from].y - near.y) ? y : x)
      : edge.cells;
    for (let i = run.from; i !== run.to + dir; i += dir) anchors.push(line[i]);
    near = anchors.at(-1)!;
  }
  anchors.push(...[...off.path].reverse(), to);
  const path: Point[] = [from];
  for (const p of anchors) walk(path, p);
  return patch(unloop(from, path.slice(1)), from, cost);
}

/** Cuts out any stretch that comes back to a cell already walked: a door
 * path walked out and straight back, a corner overshot. */
function unloop(from: Point, path: Point[]) {
  const out: Point[] = [], at = new Map<number, number>([[key(from.x, from.y), -1]]);
  for (const p of path) {
    const k = key(p.x, p.y), i = at.get(k);
    if (i !== undefined) {
      for (const q of out.splice(i + 1)) at.delete(key(q.x, q.y));
      continue;
    }
    at.set(k, out.length);
    out.push(p);
  }
  return out;
}

/** A stall, cart or lamp on the centre line: a small search round it between
 * the clear cells either side. */
function patch(path: Point[], from: Point, cost: (p: Point) => number) {
  const out: Point[] = [];
  for (let i = 0; i < path.length; i++) {
    if (Number.isFinite(cost(path[i]))) {
      out.push(path[i]);
      continue;
    }
    let j = i;
    while (j < path.length && !Number.isFinite(cost(path[j]))) j++;
    if (j === path.length) return;
    const a = out.at(-1) ?? from, b = path[j];
    const r = route(a, b, cost, {
      maxNodes: 1200,
      minCost: 1,
      bounds: { x: Math.min(a.x, b.x) - 8, y: Math.min(a.y, b.y) - 8, w: Math.abs(a.x - b.x) + 16, h: Math.abs(a.y - b.y) + 16 },
    });
    if (r.status !== "found") return;
    out.push(...r.path);
    i = j;
  }
  return unloop(from, out);
}
