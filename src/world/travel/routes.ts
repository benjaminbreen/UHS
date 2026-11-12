import { trunkRoutes, type TrunkRoute } from "../../content/geography/routes";
import type { Point } from "../../core/types";
import { atlasSample, broadEnvironment } from "../geography/atlas";
import { fromAtlas, toAtlas } from "../geography/coordinates";
import { noise } from "../geography/noise";

/** A trunk route lives in atlas coordinates, the one frame every map and the
 * region map share. A map clips the line to its own square, so the two sides
 * of a border meet without any agreement between them. */

/** Routes are surveyed on a grid this many atlas tiles across, about 5 km. */
const GRID = 96;

/** What it costs to lay a kilometre here, as a multiple of open level
 * ground. Hills cost a railway more than a road; a river costs a bridge, and
 * its valley floor is the easy way through high country; the sea is crossed
 * only where nothing else joins the two ends. */
function going(gx: number, gy: number, kind: TrunkRoute["kind"]) {
  const x = gx * GRID,
    y = gy * GRID,
    here = atlasSample(x, y);
  if (here.coast < 0) return 40;
  const { lon, lat } = fromAtlas(x, y);
  const relief = broadEnvironment(lon, lat).relief + (noise("relief", x, y, 3000, "map") - 0.5) * 0.5;
  return (
    1 +
    Math.max(0, relief - 0.25) * (kind === "rail" ? 14 : 9) +
    (here.river < GRID * 0.6 ? 2.5 : here.river < GRID * 3 ? -0.25 : 0) +
    (here.coast < GRID ? 0.5 : 0) +
    // Old roads and railways read the ground alike and share its corridors;
    // a motorway is surveyed afresh.
    noise(`trunk-${kind === "motorway" ? kind : "road"}`, x, y, 900, "going") * 0.8
  );
}

const legs = new Map<string, Point[]>();

/** The cheapest way from one town to the next over the atlas. */
function leg(a: Point, b: Point, kind: TrunkRoute["kind"]): Point[] {
  // Surveyed once, from the end that sorts first, so both directions and
  // every route sharing the leg get the same line.
  if (`${a.x},${a.y}` > `${b.x},${b.y}`) return [...leg(b, a, kind)].reverse();
  const key = `${kind}:${a.x},${a.y}:${b.x},${b.y}`;
  const known = legs.get(key);
  if (known) return known;
  const cell = (p: Point) => ({ x: Math.round(p.x / GRID), y: Math.round(p.y / GRID) });
  const from = cell(a),
    to = cell(b),
    pad = Math.max(8, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * 0.35));
  const x0 = Math.min(from.x, to.x) - pad,
    y0 = Math.min(from.y, to.y) - pad,
    w = Math.abs(to.x - from.x) + pad * 2 + 1,
    h = Math.abs(to.y - from.y) + pad * 2 + 1;
  const index = (x: number, y: number) => (y - y0) * w + (x - x0);
  const cost = new Float32Array(w * h).fill(Infinity),
    came = new Int32Array(w * h).fill(-1),
    ground = new Float32Array(w * h);
  const groundAt = (x: number, y: number) => (ground[index(x, y)] ||= going(x, y, kind));
  // A binary heap of [priority, cell].
  const heap: [number, number][] = [];
  const push = (item: [number, number]) => {
    let i = heap.push(item) - 1;
    while (i > 0 && heap[(i - 1) >> 1][0] > item[0]) {
      heap[i] = heap[(i - 1) >> 1];
      i = (i - 1) >> 1;
    }
    heap[i] = item;
  };
  const pop = () => {
    const top = heap[0],
      last = heap.pop()!;
    let i = 0;
    while (heap.length) {
      let c = i * 2 + 1;
      if (c >= heap.length) break;
      if (c + 1 < heap.length && heap[c + 1][0] < heap[c][0]) c++;
      if (heap[c][0] >= last[0]) break;
      heap[i] = heap[c];
      i = c;
    }
    if (heap.length) heap[i] = last;
    return top;
  };
  cost[index(from.x, from.y)] = 0;
  push([0, index(from.x, from.y)]);
  const goal = index(to.x, to.y);
  while (heap.length) {
    const [, at] = pop();
    if (at === goal) break;
    const x = (at % w) + x0,
      y = Math.floor(at / w) + y0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx,
          ny = y + dy;
        if ((!dx && !dy) || nx < x0 || ny < y0 || nx >= x0 + w || ny >= y0 + h) continue;
        const n = index(nx, ny),
          next = cost[at] + Math.hypot(dx, dy) * (groundAt(x, y) + groundAt(nx, ny)) * 0.5;
        if (next >= cost[n]) continue;
        cost[n] = next;
        came[n] = at;
        // The cheapest ground costs three quarters of a step.
        push([next + Math.hypot(to.x - nx, to.y - ny) * 0.75, n]);
      }
  }
  const path: Point[] = [b];
  for (let at = came[goal]; at >= 0 && at !== index(from.x, from.y); at = came[at])
    path.push({ x: ((at % w) + x0) * GRID, y: (Math.floor(at / w) + y0) * GRID });
  path.push(a);
  path.reverse();
  // A railway keeps to one side of the road it follows, a field's width off;
  // a motorway is cut on the other side of the old road.
  const RAIL_ASIDE = kind === "rail" ? 16 : -26;
  if (kind !== "road")
    for (let i = 1; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i - 1].x,
        dy = path[i + 1].y - path[i - 1].y,
        length = Math.hypot(dx, dy) || 1;
      path[i] = { x: path[i].x - (dy / length) * RAIL_ASIDE, y: path[i].y + (dx / length) * RAIL_ASIDE };
    }
  legs.set(key, path);
  return path;
}

const lines = new Map<string, Point[]>();

/** The route as a smooth line through its towns, each leg surveyed over the
 * atlas's coast, rivers and high ground. */
export function routeLine(route: TrunkRoute): Point[] {
  let line = lines.get(route.id);
  if (line) return line;
  const towns = route.via.map(([lon, lat]) => toAtlas(lon, lat));
  let points: Point[] = [towns[0]];
  for (let i = 1; i < towns.length; i++) points.push(...leg(towns[i - 1], towns[i], route.kind).slice(1));
  // Corner cutting, ends fixed: the grid's steps become curves.
  for (let round = 0; round < 3; round++) {
    const out: Point[] = [points[0]];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1];
      out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    out.push(points[points.length - 1]);
    points = out;
  }
  lines.set(route.id, (line = points));
  return line;
}

export const routesOpen = (year: number) =>
  trunkRoutes.filter((r) => year >= r.from && (r.to === undefined || year < r.to));

/** The stretches of each open route that cross a rectangle of the atlas, as
 * unbroken runs of points; a run starts and ends just outside it. */
export function routesIn(x0: number, y0: number, x1: number, y1: number, year: number) {
  const found: { route: TrunkRoute; run: Point[] }[] = [];
  for (const route of routesOpen(year)) {
    // Surveying a route is the slow part; one whose towns lie well clear of
    // the rectangle is never surveyed for it.
    const towns = route.via.map(([lon, lat]) => toAtlas(lon, lat)),
      xs = towns.map((p) => p.x),
      ys = towns.map((p) => p.y),
      slack = 0.4 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 8 * GRID;
    if (Math.max(...xs) + slack < x0 || Math.min(...xs) - slack > x1 || Math.max(...ys) + slack < y0 || Math.min(...ys) - slack > y1) continue;
    const line = routeLine(route);
    let run: Point[] | undefined;
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1],
        b = line[i];
      const near = Math.max(a.x, b.x) >= x0 && Math.min(a.x, b.x) <= x1 && Math.max(a.y, b.y) >= y0 && Math.min(a.y, b.y) <= y1;
      if (!near) {
        run = undefined;
        continue;
      }
      if (!run) found.push({ route, run: (run = [a]) });
      run.push(b);
    }
  }
  return found;
}
