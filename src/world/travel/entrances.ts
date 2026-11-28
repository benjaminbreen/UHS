import { routeSteps } from "../../core/routing";
import type { WorldModel } from "../../core/types";
export type EntranceSpec = {
  seam?: import("./seams").BoundarySeam;
  id: string;
  to: string;
  bearing: string;
  mode: string;
  /** The map past this border, and whether anyone lives there. */
  name?: string;
  settlement?: string;
  neighbor?: NonNullable<import("../../content/geography/types").WorldSetting["playableMap"]>["exits"][number]["neighbor"];
};
export type MapEntrance = EntranceSpec & {
  point?: { x: number; y: number };
  path: { x: number; y: number }[];
  shore: boolean;
  /** The border cell is dry ground the player can walk out through. A crossing
   * is decided by the terrain at the border, not by the long-distance route. */
  walkable: boolean;
};
export function entranceSearch(
  world: WorldModel,
  size: number,
  exits: EntranceSpec[],
) {
  const half = size / 2,
    index = (x: number, y: number) => (y + half) * size + x + half;
  const point = (i: number) => ({
    x: (i % size) - half,
    y: Math.floor(i / size) - half,
  });
  const previous = new Int32Array(size * size).fill(-2),
    queue: number[] = [];
  const start = world.spawn;
  const first = index(start.x, start.y);
  previous[first] = -1;
  queue.push(first);
  const water = new Int8Array(size * size), passable = new Int8Array(size * size);
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const edge: number[] = [],
    shore: number[] = [];
  const passableAt = (x: number, y: number) => {
    const k = index(x, y);
    return (passable[k] ||= world.blocked(x, y, "outside") ? -1 : 1) > 0;
  };
  let explored = false;
  const flood = (function* () {
    for (let head = 0; head < queue.length; head++) {
      if (head % 8 === 0) yield;
      const i = queue[head],
        p = point(i);
      if (p.x === -half || p.y === -half || p.x === half - 1 || p.y === half - 1)
        edge.push(i);
      let coastal = false;
      for (const [dx, dy] of steps) {
        const q = { x: p.x + dx, y: p.y + dy };
        if (q.x < -half || q.y < -half || q.x >= half || q.y >= half) continue;
        const k = index(q.x, q.y);
        water[k] ||= world.terrain(q.x, q.y) === "water" ? 1 : -1;
        if (water[k] > 0) coastal = true;
        if (previous[k] !== -2) continue;
        if (!passableAt(q.x, q.y) || (world.canCross && !world.canCross(p, q))) continue;
        previous[k] = i;
        queue.push(k);
      }
      if (coastal) shore.push(i);
    }
    explored = true;
  })();
  const border: number[] = [];
  for (let t = -half; t < half; t++) {
    border.push(index(t, -half), index(t, half - 1));
    if (t > -half && t < half - 1)
      border.push(index(-half, t), index(half - 1, t));
  }
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  function* find(exit: EntranceSpec, used: Set<number>): Generator<void, MapEntrance> {
    if (start.x < -half || start.x >= half || start.y < -half || start.y >= half)
      return { ...exit, path: [], shore: false, walkable: false };
    const angle = (directions.indexOf(exit.bearing) * Math.PI) / 4;
    const target = { x: Math.sin(angle) * half, y: -Math.cos(angle) * half };
    if (exit.seam) {
      const t =
        -half +
        (exit.seam.start +
          (exit.seam.end - exit.seam.start) * exit.seam.roadAt) *
          (size - 1);
      target.x =
        exit.seam.side === "W" ? -half : exit.seam.side === "E" ? half - 1 : t;
      target.y =
        exit.seam.side === "N" ? -half : exit.seam.side === "S" ? half - 1 : t;
    }
    // Dry ground on this stretch of border is the crossing, whatever the
    // long-distance route thought. Only fall back to a boarding point when
    // the whole stretch is water.
    const onSide = (i: number) => {
      const p = point(i);
      if (exit.seam) {
        const u =
          ((exit.seam.side === "N" || exit.seam.side === "S" ? p.x : p.y) +
            half) /
          (size - 1);
        if (u < exit.seam.start || u > exit.seam.end) return false;
      }
      const direction = exit.seam?.side ?? exit.bearing;
      return (
        (direction.includes("N") && p.y === -half) ||
        (direction.includes("S") && p.y === half - 1) ||
        (direction.includes("E") && p.x === half - 1) ||
        (direction.includes("W") && p.x === -half)
      );
    };
    const compare = (a: number, b: number) => {
      const p = point(a), q = point(b);
      return Number(used.has(a)) - Number(used.has(b)) ||
        Math.hypot(p.x - target.x, p.y - target.y) -
          Math.hypot(q.x - target.x, q.y - target.y) || a - b;
    };
    let best: number | undefined;
    for (const i of border.filter(onSide).sort(compare)) {
      const p = point(i);
      if (passableAt(p.x, p.y)) { best = i; break; }
      yield;
    }
    if (best !== undefined) {
      const goal = point(best);
      // Search backward, but test crossings in the traveller's forward direction.
      const found = yield* routeSteps(goal, start, (to, from) =>
        ((to.x === start.x && to.y === start.y) || passableAt(to.x, to.y)) && (!world.canCross || world.canCross(to, from)) ? 1 : Infinity,
        { maxNodes: size * 32, heuristicWeight: 1.2,
          bounds: { x: -half, y: -half, w: size - 1, h: size - 1 } },
      );
      if (found.status === "found") {
        used.add(best);
        return { ...exit, point: goal, path: [goal, ...found.path].reverse(), shore: false, walkable: true };
      }
    }
    // A blocked approach or exhausted search must not turn a land exit into a boat trip.
    while (!explored) { flood.next(); yield; }
    const walkable = edge.some(onSide);
    const coastal = !walkable && shore.length > 0;
    let end: number | undefined;
    for (const i of coastal ? shore : edge)
      if ((coastal || onSide(i)) && (end === undefined || compare(i, end) < 0)) end = i;
    const path: { x: number; y: number }[] = [];
    if (end !== undefined) {
      used.add(end);
      for (let i = end; i >= 0; i = previous[i]) path.push(point(i));
      path.reverse();
    }
    return {
      ...exit,
      point: end === undefined ? undefined : point(end),
      path,
      shore: coastal,
      walkable: walkable && end !== undefined,
    };
  }
  // Keep exits sharing a seam in their authored order when another side takes priority.
  const pending = exits.map(exit => ({
    exit, side: exit.seam?.side ?? exit.bearing, job: undefined as Generator<void, MapEntrance> | undefined,
  }));
  const usedBySide = new Map<string, Set<number>>();
  return (preferred?: string) => {
    const next = pending.find(p => p.side === preferred) ?? pending[0];
    if (!next) return;
    if (!next.job) {
      const used = usedBySide.get(next.side) ?? new Set<number>();
      usedBySide.set(next.side, used);
      next.job = find(next.exit, used);
    }
    const result = next.job.next();
    if (!result.done) return;
    pending.splice(pending.indexOf(next), 1);
    return result.value;
  };
}

export function mapEntrances(world: WorldModel, size: number, exits: EntranceSpec[]): MapEntrance[] {
  if (!exits.length) return [];
  const next = entranceSearch(world, size, exits), routes: MapEntrance[] = [];
  while (routes.length < exits.length) {
    const route = next();
    if (route) routes.push(route);
  }
  return routes;
}

export function surveyEntrances(
  world: WorldModel & { atOpeningTerrain?(read: () => void): void }, size: number, exits: EntranceSpec[],
  receive: (route: MapEntrance) => void, preferred: () => string | undefined,
) {
  const step = entranceSearch(world, size, exits);
  let remaining = exits.length, timer: ReturnType<typeof setTimeout>;
  const advance = () => {
    const until = performance.now() + 3;
    do {
      const route = step(preferred());
      if (route) { remaining--; receive(route); }
    } while (remaining && performance.now() < until);
  };
  const run = () => {
    if (world.atOpeningTerrain) world.atOpeningTerrain(advance);
    else advance();
    if (remaining) timer = setTimeout(run, 8);
  };
  if (remaining) timer = setTimeout(run, 0);
  return () => { remaining = 0; clearTimeout(timer); };
}
