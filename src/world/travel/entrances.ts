import { route } from "../../core/routing";
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
export function mapEntrances(
  world: WorldModel,
  size: number,
  exits: EntranceSpec[],
): MapEntrance[] {
  if (!exits.length) return [];
  const half = size / 2,
    index = (x: number, y: number) => (y + half) * size + x + half;
  const point = (i: number) => ({
    x: (i % size) - half,
    y: Math.floor(i / size) - half,
  });
  const previous = new Int32Array(size * size).fill(-2),
    queue: number[] = [];
  const start = world.spawn;
  if (start.x < -half || start.x >= half || start.y < -half || start.y >= half)
    return exits.map((e) => ({
      ...e,
      path: [],
      shore: false,
      walkable: false,
    }));
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
  const explore = () => {
    if (explored) return;
    explored = true;
    for (let head = 0; head < queue.length; head++) {
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
  };
  const border: number[] = [];
  for (let t = -half; t < half; t++) {
    border.push(index(t, -half), index(t, half - 1));
    if (t > -half && t < half - 1)
      border.push(index(-half, t), index(half - 1, t));
  }
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const used = new Set<number>();
  return exits.map((exit) => {
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
    if (!explored) {
      const best = border.filter(onSide).sort(compare).find((i) => {
        const p = point(i);
        return passableAt(p.x, p.y);
      });
      if (best !== undefined) {
        const goal = point(best);
        // Search backward, but test crossings in the traveller's forward direction.
        const found = route(goal, start, (to, from) =>
          ((to.x === start.x && to.y === start.y) || passableAt(to.x, to.y)) && (!world.canCross || world.canCross(to, from)) ? 1 : Infinity,
          { maxNodes: size * 32, heuristicWeight: 1.2,
            bounds: { x: -half, y: -half, w: size - 1, h: size - 1 } },
        );
        if (found.status === "found") {
          used.add(best);
          return { ...exit, point: goal, path: [goal, ...found.path].reverse(), shore: false, walkable: true };
        }
      }
    }
    // A blocked approach or exhausted search must not turn a land exit into a boat trip.
    explore();
    const walkable = edge.some(onSide);
    const coastal = !walkable && shore.length > 0;
    const candidates = (coastal ? shore : edge).filter((i) => coastal || onSide(i)).sort(compare);
    const end = candidates[0],
      path: { x: number; y: number }[] = [];
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
  });
}
