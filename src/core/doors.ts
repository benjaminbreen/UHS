import { buildingModels } from "../content/graphics/models";
import type { Place, Point, WorldObject } from "./types";

/** A door is a gate in a wall.
 *
 * `place.entrance` is the cell out on the street that a visitor stands on, so
 * the door itself is the wall cell beside it — the one the footprint already
 * made solid. Opening a door therefore only ever opens the map up; it never
 * takes a cell away from the street.
 */
/** The footprint cell under the door the building's art paints, if it paints
 * one there. The art is what the player aims at, so where it has a door the
 * doorway is that cell, on the front wall, whatever side the street is on. */
export function paintedDoor(place: Place): Point | undefined {
  const model = buildingModels[place.sprite] as { door?: number[]; anchor: number[] } | undefined;
  const rect = model?.door;
  if (!model || !rect) return undefined;
  const x = Math.floor(((place.x + place.w / 2) * 16 - model.anchor[0] + rect[0] + rect[2] / 2) / 16);
  const y = Math.floor(((place.y + place.h) * 16 - model.anchor[1] + rect[1] + rect[3] - 1) / 16);
  if (x < place.x || x >= place.x + place.w || y < place.y || y >= place.y + place.h) return undefined;
  return { x, y };
}

export function doorCell(place: Place): Point {
  if (place.door) return place.door;
  // Without one, the wall beside the street entrance.
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
  // A chosen door is on the front wall: it is approached from below.
  if (place.door) return { x: place.door.x, y: place.door.y + 1 };
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

/** Stable per-place hash, so which doors stand open replays the same. */
function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++)
    h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  return h / 4294967296;
}

/** A shop or temple stands open through the day; so does a minority of
 * households, which is what makes a street look lived in rather than sealed. */
export function startsOpen(place: Place) {
  return place.access === "public" || hash(place.id) < 0.3;
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
    open: startsOpen(place),
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

/** Nothing stands on a doorstep: a household's store, a pot or a counter set
 * out on one is moved to the nearest free cell beside it. */
export function clearDoorsteps(objects: WorldObject[], places: Place[], blocked: (x: number, y: number) => boolean) {
  const key = (x: number, y: number) => `${x},${y}`;
  const steps = new Set(places.flatMap((p) => (p.door ? [key(p.door.x, p.door.y + 1)] : [])));
  if (!steps.size) return;
  const taken = new Set(objects.filter((o) => o.pos.space === "outside").map((o) => key(o.pos.x, o.pos.y)));
  for (const o of objects) {
    if (o.kind === "door" || o.kind === "tree" || o.carriedBy || o.pos.space !== "outside" || !steps.has(key(o.pos.x, o.pos.y))) continue;
    for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, 1], [-2, 0], [2, 0], [0, 2]]) {
      const x = o.pos.x + dx, y = o.pos.y + dy;
      if (steps.has(key(x, y)) || taken.has(key(x, y)) || blocked(x, y)) continue;
      taken.delete(key(o.pos.x, o.pos.y));
      taken.add(key(x, y));
      o.pos = { ...o.pos, x, y };
      break;
    }
  }
}
