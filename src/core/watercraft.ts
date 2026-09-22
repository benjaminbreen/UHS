import type { Actor, WorldModel } from "./types";

export function afloatAt(
  world: WorldModel,
  actor: Actor,
  x: number,
  y: number,
) {
  if (
    !actor.afloat ||
    actor.pos.space !== "outside" ||
    world.terrain(x, y) !== "water"
  )
    return false;
  const cell = world.topography?.(x, y);
  return !!cell && !cell.solid;
}
