import type { Position, WorldObject } from "./types";
import {
  REMAINS_HOURS,
  remainsLook,
  type RemainsKind,
} from "../content/fauna/remains";

/** Most remains a map keeps before the oldest are let go. */
export const REMAINS_CAP = 40;

const hoursOf = (o: WorldObject, clock: number) =>
  (clock - (o.laid ?? clock)) / 3600;

export function remainsObject(
  kind: RemainsKind,
  prey: string,
  hunter: string | undefined,
  pos: Position,
  laid: number,
  id: string,
): WorldObject {
  // Feathers can be picked up and kept; the rest is left where it lies.
  const o: WorldObject = {
    id,
    name: "",
    kind: kind === "feathers" ? "item" : "monument",
    sprite: "",
    pos,
    inventory: {},
    ...(kind === "feathers" ? { item: "feathers" } : {}),
  };
  o.remains = kind;
  o.from = prey;
  o.by = hunter;
  o.laid = laid;
  ageRemains(o, laid);
  return o;
}

export function ageRemains(o: WorldObject, clock: number) {
  if (!o.remains) return;
  Object.assign(
    o,
    remainsLook(o.remains, o.from ?? "", o.by, hoursOf(o, clock)),
  );
}

/** A carcass in its first day draws flies, and crows. */
export const freshCarcass = (o: WorldObject, clock: number) =>
  o.remains === "carcass" && hoursOf(o, clock) < 24;

/** Drops what time has taken, and past the cap the oldest. */
export function pruneRemains(objects: WorldObject[], clock: number) {
  const gone = new Set(
    objects.filter(
      (o) =>
        o.remains &&
        !o.carriedBy &&
        hoursOf(o, clock) >= REMAINS_HOURS[o.remains],
    ),
  );
  const lying = objects
    .filter((o) => o.remains && !o.carriedBy && !gone.has(o))
    .sort((a, b) => (a.laid ?? 0) - (b.laid ?? 0));
  for (const o of lying.slice(0, Math.max(0, lying.length - REMAINS_CAP)))
    gone.add(o);
  return gone.size ? objects.filter((o) => !gone.has(o)) : objects;
}
