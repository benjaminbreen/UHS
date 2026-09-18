import type { Point, WorldObject } from "./types";

/** How a thing answers to a shoulder. `free` goes any cardinal way; `axle`
 * runs only along the axis its wheels are drawn on. */
export type ShoveDef = {
  as: "free" | "axle";
  /** Which way the wheels point. Required for `axle`. */
  axis?: "x" | "y";
  /** Empty weight. 1 is a crate: a shove anyone can manage. */
  mass?: number;
  /** It does not stop where you stop pushing: a boulder runs downhill. */
  rolls?: boolean;
};
export type ShovePlan = {
  /** Far end first, so each cell is clear before the next thing enters it. */
  moves: { id: string; to: Point }[];
  seconds: number;
  load: number;
};
export type ShoveRefusal = {
  reason: string;
  /** What to show for it: the wheels binding, the weight, or a dead stop. */
  refused: "wheels" | "heavy" | "wall";
};
export type ShoveWorld = {
  /** Terrain alone. Props are asked about separately. */
  ground(x: number, y: number, space: string): boolean;
  /** Any solid prop standing on the cell, shovable or not. */
  propAt(x: number, y: number, space: string): WorldObject | undefined;
  actorAt(x: number, y: number, space: string): boolean;
  crossable(from: Point, to: Point, space: string): boolean;
  shoveOf(o: WorldObject): ShoveDef | undefined;
};
/** Two deep. A row of three is a wall, which is the rule Zelda settled on. */
const CHAIN = 2;
export const isRefusal = (r: ShovePlan | ShoveRefusal): r is ShoveRefusal =>
  "refused" in r;
/** Anyone shifts an empty crate; a loaded cart wants a strong back. */
export const shoveCapacity = (strength: number) => 1 + strength / 45;
/** A full barrel is worse than an empty one, up to a limit. */
export function shoveMass(o: WorldObject, def: ShoveDef) {
  const carried = Object.values(o.inventory ?? {}).reduce<number>(
    (n, q) => n + (q ?? 0),
    0,
  );
  return (def.mass ?? 1) + Math.min(1, carried * 0.15);
}
export function planShove(
  world: ShoveWorld,
  first: WorldObject,
  dir: { dx: number; dy: number },
  strength: number,
): ShovePlan | ShoveRefusal {
  if ((dir.dx !== 0) === (dir.dy !== 0))
    return { reason: "Push it straight, not cornerwise.", refused: "wall" };
  const space = first.pos.space;
  const moves: { id: string; to: Point }[] = [];
  let load = 0;
  let o: WorldObject = first;
  for (let depth = 0; ; depth++) {
    const def = world.shoveOf(o);
    if (!def) return { reason: `${o.name} will not budge.`, refused: "heavy" };
    if (def.as === "axle" && (def.axis === "x" ? !dir.dx : !dir.dy))
      return {
        reason: "The wheels will not turn that way.",
        refused: "wheels",
      };
    if (depth >= CHAIN)
      return {
        reason: "There is too much stacked up to shift.",
        refused: "heavy",
      };
    load += shoveMass(o, def);
    const from = { x: o.pos.x, y: o.pos.y };
    const to = { x: from.x + dir.dx, y: from.y + dir.dy };
    if (!world.crossable(from, to, space) || world.ground(to.x, to.y, space))
      return { reason: `${o.name} is up against something.`, refused: "wall" };
    if (world.actorAt(to.x, to.y, space))
      return { reason: "Someone is standing in the way.", refused: "wall" };
    moves.unshift({ id: o.id, to });
    const next = world.propAt(to.x, to.y, space);
    if (!next) break;
    o = next;
  }
  if (load > shoveCapacity(strength))
    return { reason: `${first.name} is too heavy to shift.`, refused: "heavy" };
  return { moves, load, seconds: Math.ceil(2 + load * 2) };
}
