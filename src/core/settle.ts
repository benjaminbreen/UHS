import type { HitClass, ReactionKind } from "./reactions";
import type { Point } from "./types";

/** What became of something that came down on a cell. The engine classifies;
 * the renderer owns the splash, the dust and the noise. */
export type LandingKind =
  | "sink"
  | "splash"
  | "shatter"
  | "burn"
  | "flatten"
  | "crush"
  | "thud";
export type Landing = {
  kind: LandingKind;
  reaction: ReactionKind;
  hit: HitClass;
  /** Whoever was standing there, and how badly. */
  victim?: string;
  damage?: number;
};
export type SettleWorld = {
  /** Standing water over the cell, in the same units as wading depth. */
  depth(x: number, y: number, space: string): number;
  groundHit(x: number, y: number, space: string): HitClass;
  actorAt(
    x: number,
    y: number,
    space: string,
  ): { id: string; name: string } | undefined;
  fireAt(x: number, y: number, space: string): boolean;
  cropAt(x: number, y: number, space: string): boolean;
};
/** Deeper than this and it is gone rather than merely wet. */
const SINK = 0.85;
/** Below this a thing has been put down, not dropped. */
const BRUISE = 2;
const REACTION: Record<LandingKind, ReactionKind> = {
  sink: "splash",
  splash: "splash",
  shatter: "shatter",
  burn: "ember",
  flatten: "swish",
  crush: "thwock",
  thud: "thud",
};
/** Weight times the height it came from: one number drives the whole table. */
export const energyOf = (mass: number, tiers: number) => mass * (1 + tiers);
export function settle(
  world: SettleWorld,
  breakable: boolean,
  cell: Point,
  space: string,
  energy: number,
): Landing {
  const hit = world.groundHit(cell.x, cell.y, space);
  const done = (kind: LandingKind, over: Partial<Landing> = {}): Landing => ({
    kind,
    reaction: REACTION[kind],
    hit,
    ...over,
  });
  const victim = world.actorAt(cell.x, cell.y, space);
  if (victim && energy >= BRUISE)
    return done("crush", {
      victim: victim.id,
      damage: Math.round(energy / 2),
      hit: "creature",
    });
  const depth = world.depth(cell.x, cell.y, space);
  if (depth > SINK) return done("sink", { hit: "water" });
  // Depth tells a puddle from a lake, but the surface alone is enough to know
  // there is water here at all: a world with no height field still splashes.
  if (depth > 0 || hit === "water") return done("splash", { hit: "water" });
  if (world.fireAt(cell.x, cell.y, space)) return done("burn", { hit: "fire" });
  // Soft ground catches a pot; paving and stone do not.
  if (
    breakable &&
    energy >= BRUISE &&
    ["stone", "rock", "timber", "metal"].includes(hit)
  )
    return done("shatter");
  if (world.cropAt(cell.x, cell.y, space))
    return done("flatten", { hit: "crop" });
  return done("thud");
}

/** A boulder let go on a slope runs to the bottom of it. */
export type RollWorld = {
  elevation(x: number, y: number): number;
  /** False when terrain, a prop or a person stops the roll here. */
  clear(x: number, y: number): boolean;
};
export type Roll = {
  /** Cells passed through, in order. Empty when it could not move at all. */
  path: Point[];
  /** Height tiers dropped over the whole run, for the landing's energy. */
  fell: number;
  /** The cell that stopped it, when something did. */
  against?: Point;
};
/** A run is capped so a bad height field cannot loop forever. */
const REACH = 20;
/** One shove is always worth one cell; a slope is worth the rest. Momentum
 * counts the cells still owed beyond the one in hand, so level ground spends
 * what the drop before it earned and then the stone comes to rest. */
export function rollPath(
  world: RollWorld,
  from: Point,
  dir: { dx: number; dy: number },
  step: number,
): Roll {
  const path: Point[] = [];
  let at = from,
    fell = 0,
    push = 0;
  for (let i = 0; i < REACH; i++) {
    const to = { x: at.x + dir.dx, y: at.y + dir.dy };
    if (!world.clear(to.x, to.y)) return { path, fell, against: to };
    const rise = world.elevation(to.x, to.y) - world.elevation(at.x, at.y);
    if (rise >= step) return { path, fell, against: to };
    path.push(to);
    at = to;
    if (rise <= -step) {
      push += 1;
      fell += 1;
    } else if (--push < 0) break;
  }
  return { path, fell };
}
