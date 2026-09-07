import { propDefs } from "../content/props/catalog";
import {
  distance,
  type Affordance,
  type Snapshot,
  type WorldObject,
  type Position,
  type PlayerCommand,
} from "./types";
export function propAffordances(
  s: Snapshot,
  o: WorldObject,
  close: boolean,
): Affordance[] {
  const d = propDefs[o.prop ?? ""];
  if (!d) return [];
  const actions: Affordance[] = [];
  const add = (
    action: Extract<PlayerCommand, { type: "interact" }>["action"],
    label: string,
    condition = true,
    reason = "Walk closer",
  ) =>
    actions.push({
      label,
      command: { type: "interact", target: o.id, action },
      enabled: close && condition,
      reason: close && !condition ? reason : !close ? "Walk closer" : undefined,
    });
  if (o.carriedBy) add("drop", "Put down", true);
  else if (d.portable && !o.broken)
    add(
      "pickup",
      "Pick up",
      !s.player.held,
      "Your hands are full. Put down the held object first.",
    );
  if (d.container) {
    add("look", o.broken ? "Look through spilled contents" : "Look inside");
    if (o.open && Object.values(o.inventory).some((n) => n! > 0))
      add(
        "take",
        o.owner && o.owner !== "player"
          ? "Take contents (owned)"
          : "Take contents",
      );
  }
  if (d.drink) add("drink", "Drink water");
  const held = s.objects.find((p) => p.id === s.player.held);
  if (d.breakable && !o.broken && !o.carriedBy)
    add(
      "strike",
      "Strike with held object",
      !!propDefs[held?.prop ?? ""]?.strike,
      "Equip a stout stick first.",
    );
  return actions;
}
export function heldObject(s: Snapshot) {
  return s.objects.find(
    (o) => o.id === s.player.held && o.carriedBy === "player",
  );
}
/** Target is facing-first, then distance and stable ID. Selection does not let
 * keyboard actions reach an object across the map or behind a wall. */
export function nearbyProp(
  s: Snapshot,
  visible: (p: Position) => boolean,
  accept: (o: WorldObject) => boolean = () => true,
): WorldObject | undefined {
  const p = s.player,
    dir = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][p.direction];
  const score = (o: WorldObject) => {
    const dx = o.pos.x - p.pos.x,
      dy = o.pos.y - p.pos.y;
    return distance(p.pos, o.pos) + (dx * dir[0] + dy * dir[1] > 0 ? -1 : 0);
  };
  return s.objects
    .filter(
      (o) =>
        o.prop &&
        !o.carriedBy &&
        accept(o) &&
        distance(p.pos, o.pos) <= 2.5 &&
        visible(o.pos),
    )
    .sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id))[0];
}
