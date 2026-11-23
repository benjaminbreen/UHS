import { fishItems } from "../content/economy/fishing";
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
  if (o.curing) {
    const batch = o.curing;
    if (batch.fish) {
      if (batch.keeper === "player") add("gather-fish", `Collect ${batch.count} salt-dried ${fishItems[batch.fish].name.toLowerCase()}`, s.clock >= batch.ready!, "Still drying");
    } else {
      for (const [id,n] of Object.entries(s.player.inventory)) {
        if (!n || !id.startsWith("fish-") || !fishItems[id]) continue;
        const salt = (o.inventory.salt ?? 0) + (s.player.inventory.salt ?? 0);
        actions.push({label:`Salt and hang ${Math.min(3,n)} ${fishItems[id].name.toLowerCase()}`,command:{type:"interact",target:o.id,action:"salt-fish",item:id},
          enabled:close && salt>0,reason:!close ? "Walk closer" : !salt ? "Bring one measure of salt" : undefined});
      }
    }
  }
  if (s.player.deliveryLoad === o.id) add("unload", o.prop==="grainHoist" ? "Hoist the sack and collect your fee" : "Stack the bale and collect your fee");
  else if (o.prop === "clothCounter") {
    if (!s.player.deliveryLoad && !o.broken)
      add("unload", "Open a bale and measure out three bolts", (o.inventory.cloth ?? 0) > 0, "Waiting for a tied bale");
  }
  if (o.carriedBy) add("drop", "Put down", true);
  else if (d.portable && !o.broken)
    // Full hands swap rather than refuse: a dead end is worse than a juggle.
    add("pickup", s.player.held ? "Swap for this" : "Pick up");
  if (d.container) {
    const [lift, shut] = Array.isArray(d.lid) ? d.lid : ["Lift the lid", "Put the lid back on"];
    add("look", o.broken ? "Look through spilled contents" : d.lid && !o.open && !o.tipped ? lift : "Look inside");
    if (d.lid && o.open && !o.broken && !o.tipped && !o.carriedBy) add("close", shut);
    if (o.open && Object.values(o.inventory).some((n) => n! > 0))
      add(
        "take",
        o.owner && o.owner !== "player"
          ? "Take contents (owned)"
          : "Take contents",
      );
  }
  if (d.door && !o.broken) add(o.open ? "close" : "open", o.open ? "Shut the door" : "Open the door");
  if (d.drink) add("drink", "Drink water");
  // `open` on a thing with an act means the act has been done; only once-only acts end there.
  if (d.act && !o.carriedBy && !o.broken && !(d.act.once && o.open)) add("attend", d.act.verb, (s.player.inventory.coin ?? 0) >= (d.act.price ?? 0), "Not enough money");
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
  if ((d.tips || d.topples) && !o.broken && !o.tipped && !o.carriedBy)
    add("topple", "Knock it over");
  if ((o.tipped || o.lean) && !o.broken && !o.carriedBy) add("right", "Set it upright");
  return actions;
}
/** Knee-high enough to step over: the vessels, baskets and tools that clutter
 * a yard. A loom, a well or a cart stops you and should. */
export function lowProp(o: WorldObject) {
  const d = propDefs[o.prop ?? ""];
  return !!d && !o.carriedBy && !o.broken && (!!d.portable || !!d.tips || !!o.tipped);
}
export function heldObject(s: Snapshot) {
  // Called several times a frame; empty hands should not scan every object.
  if (!s.player.held) return undefined;
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
