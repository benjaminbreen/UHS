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
  const actions: Affordance[] = [];
  if (o.kind === "item") {
    actions.push({
      label: s.player.heldItem ? "Swap for this" : "Pick up",
      command: { type: "interact", target: o.id, action: "pickup" },
      enabled: close,
      reason: close ? undefined : "Walk closer",
    });
    return actions;
  }
  if (!d) return [];
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
    // Full hands swap rather than refuse: a dead end is worse than a juggle.
    add("pickup", s.player.held ? "Swap for this" : "Pick up");
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
  if (d.fire && !o.carriedBy)
    add(
      "cook",
      "Cook meat",
      (s.player.inventory.meat ?? 0) > 0,
      "You have no raw meat",
    );
  if (d.breakable && !o.broken && !o.carriedBy) add("strike", "Strike it");
  // Shoving something over needs no tool, and does not break it. A stick to
  // a basket still breaks the basket; a shoulder to it only lays it down.
  if (d.tips && !o.broken && !o.tipped && !o.carriedBy)
    add("topple", "Knock it over");
  if (o.tipped && !o.broken && !o.carriedBy) add("right", "Set it upright");
  return actions;
}
/** Knee-high enough to step over: the vessels, baskets and tools that clutter
 * a yard. A loom, a well or a cart stops you and should. */
export function lowProp(o: WorldObject) {
  const d = propDefs[o.prop ?? ""];
  return !!d && !o.carriedBy && !o.broken && (!!d.portable || !!d.tips);
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
        (o.prop || o.kind === "item") &&
        !o.carriedBy &&
        accept(o) &&
        distance(p.pos, o.pos) <= 2.5 &&
        visible(o.pos),
    )
    .sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id))[0];
}
