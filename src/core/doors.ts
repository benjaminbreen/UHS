import type { Place, Point, WorldObject } from "./types";

/** A door is a gate in a wall.
 *
 * `place.entrance` is the cell out on the street that a visitor stands on, so
 * the door itself is the wall cell beside it — the one the footprint already
 * made solid. Opening a door therefore only ever opens the map up; it never
 * takes a cell away from the street.
 */
export function doorCell(place: Place): Point {
  // A back-on building is still drawn front-on, and the art puts its door on
  // that front wall. The doorway follows the art rather than the street, so
  // the leaf always swings on the opening the player is looking at.
  if (place.sprite.endsWith("-north"))
    return {
      x: place.x + Math.floor(place.w / 2),
      y: place.y + place.h - 1,
    };
  const { entrance: e } = place;
  const inside =
    e.x >= place.x &&
    e.x < place.x + place.w &&
    e.y >= place.y &&
    e.y < place.y + place.h;
  if (inside) return { ...e };
  const dx = place.x + place.w / 2 - e.x,
    dy = place.y + place.h / 2 - e.y;
  return Math.abs(dx) > Math.abs(dy)
    ? { x: e.x + Math.sign(dx), y: e.y }
    : { x: e.x, y: e.y + Math.sign(dy) };
}

/** The cell a caller stands in to use this door. */
export function doorApproach(place: Place): Point {
  const d = doorCell(place);
  const dx = d.x - (place.x + (place.w - 1) / 2),
    dy = d.y - (place.y + (place.h - 1) / 2);
  return Math.abs(dx) > Math.abs(dy)
    ? { x: d.x + Math.sign(dx), y: d.y }
    : { x: d.x, y: d.y + Math.sign(dy) };
}

export function doorId(place: Place) {
  return `${place.id}-door`;
}

export function makeDoor(place: Place): WorldObject {
  return {
    id: doorId(place),
    name: `Door of ${place.name}`,
    kind: "door",
    placeId: place.id,
    pos: { ...doorCell(place), space: "outside" },
    sprite: "door-open",
    inventory: {},
    open: false,
    owner: place.owner,
  };
}

/** Gates and doors both stop movement while shut. */
export function isShutBarrier(o: WorldObject) {
  return (o.kind === "gate" || o.kind === "door") && !o.open;
}

export type DoorVerdict = "open" | "knock" | "barred";

/** Whether this door opens for this caller, right now.
 *
 * The one place the rules live: everything that needs to know — the player's
 * prompt, the route cost, an NPC arriving at their own threshold — asks here.
 */
export function doorAccess(ctx: {
  access: Place["access"];
  /** A resident, a household member, or someone holding permission. */
  invited: boolean;
  /** Anyone at all inside the place. */
  occupied: boolean;
  /** Local hour, 0–24. */
  hour: number;
}): DoorVerdict {
  if (ctx.invited) return "open";
  if (ctx.access === "public")
    return ctx.hour >= 6 && ctx.hour < 20 ? "open" : "barred";
  // A household door is answered, not opened: an empty house stays shut.
  return ctx.occupied ? "knock" : "barred";
}

/** The one cell of a building's footprint that is a doorway, not wall. */
export function isDoorway(place: Place, x: number, y: number) {
  const d = doorCell(place);
  return d.x === x && d.y === y;
}
