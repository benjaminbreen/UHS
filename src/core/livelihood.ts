import {
  distance,
  type Actor,
  type ItemDef,
  type ItemId,
  type Position,
  type Snapshot,
  type WorldObject,
} from "./types";
export function seasonAt(initial: string, clock: number) {
  const seasons = ["spring", "summer", "autumn", "winter"];
  return seasons[
    (Math.max(0, seasons.indexOf(initial)) +
      Math.floor(Math.max(0, clock - 32400) / (28 * 86400))) %
      4
  ];
}
export function refreshResource(o: WorldObject, clock: number, season: string) {
  if (!o.resource) return;
  const r = o.resource;
  if (!r.seasons.includes(season)) {
    o.inventory[r.item] = 0;
    o.depleted = true;
    return;
  }
  if (o.depleted && clock >= r.readyAt) {
    o.inventory[r.item] = r.capacity;
    o.depleted = false;
  }
}
/** The same finite transfer is used by player harvesting and NPC work. */
export function harvestResource(a: Actor, o: WorldObject, clock: number) {
  if (o.depleted || distance(a.pos, o.pos) > 2.2) return false;
  let amount = 0;
  for (const [key, n] of Object.entries(o.inventory)) {
    const item = key as ItemId;
    a.inventory[item] = (a.inventory[item] ?? 0) + (n ?? 0);
    amount += n ?? 0;
    o.inventory[item] = 0;
  }
  if (!amount) return false;
  o.depleted = true;
  if (o.resource) o.resource.readyAt = clock + o.resource.regrowSeconds;
  return true;
}
export function householdActivity(
  a: Actor,
  s: Snapshot,
  items: Record<ItemId, ItemDef>,
  move: (p: Position) => void,
  reachable: (p: Position) => boolean = () => true,
): boolean {
  const h = s.households?.find((h) => h.id === a.householdId);
  if (!h) return false;
  const store = s.objects.find((o) => o.id === h.storeId);
  if (!store) return false;
  const hour = (s.clock / 3600) % 24;
  const home = { ...h.home };
  if (hour < 7 || hour >= 18) {
    a.task = undefined;
    a.activity = "Returning home";
    if (distance(a.pos, home) < 2.2 && h.residence) {
      a.pos = {
        x: 3 + (h.members.indexOf(a.id) % 4),
        y: 3,
        space: h.residence,
      };
      a.activity = "Sleeping at home";
      a.fatigue = Math.max(0, a.fatigue - 0.1);
    } else if (a.pos.space !== "outside") a.activity = "Sleeping at home";
    else move(home);
    return true;
  }
  if (a.pos.space !== "outside") {
    a.pos = { ...home };
    a.activity = "Leaving home";
    return true;
  }
  // Only learn resource locations actually encountered within sight.
  a.knownResources ??= [];
  for (const o of s.objects)
    if (
      o.resource &&
      distance(a.pos, o.pos) < 19 &&
      !a.knownResources.includes(o.id)
    )
      a.knownResources.push(o.id);
  const carried = (Object.keys(a.inventory) as ItemId[]).filter(
    (k) =>
      !["tool", "water", "coin", "obsidian"].includes(k) &&
      (a.inventory[k] ?? 0) > 0,
  );
  if (carried.length) {
    a.activity = "Bringing supplies home";
    if (distance(a.pos, store.pos) > 2.2) move(store.pos);
    else depositSupplies(a, store, false);
    return true;
  }
  const food = (Object.keys(store.inventory) as ItemId[]).find(
    (k) => items[k]?.edible && (store.inventory[k] ?? 0) > 0,
  );
  if (a.hunger > 40 && food) {
    a.activity = "Eating with the household";
    if (distance(a.pos, store.pos) > 2.2) move(store.pos);
    else {
      store.inventory[food]!--;
      if ((store.inventory.water ?? 0) > 0) store.inventory.water!--;
      a.hunger = Math.max(0, a.hunger - (items[food].edible ?? 0));
    }
    return true;
  }
  if ((a.age ?? 30) < 16) {
    a.activity = "Near the household";
    if (distance(a.pos, home) > 3) move(home);
    return true;
  }
  const foodStock = (Object.keys(store.inventory) as ItemId[]).reduce(
    (sum, k) => sum + (items[k]?.edible ? (store.inventory[k] ?? 0) : 0),
    0,
  );
  if ((store.inventory.water ?? 0) < h.members.length && (a.age ?? 30) >= 16) {
    const well = s.objects
      .filter((o) => o.kind === "well" && distance(a.pos, o.pos) < 19)
      .sort((u, v) => distance(a.pos, u.pos) - distance(a.pos, v.pos))[0];
    if (well && (a.inventory.water ?? 0) < 2) {
      a.activity = "Fetching household water";
      if (distance(a.pos, well.pos) > 2.2) move(well.pos);
      else a.inventory.water = 2;
      return true;
    }
    if ((a.inventory.water ?? 0) >= 2) {
      a.activity = "Carrying water home";
      if (distance(a.pos, store.pos) > 2.2) move(store.pos);
      else {
        store.inventory.water = (store.inventory.water ?? 0) + 2;
        a.inventory.water! -= 2;
      }
      return true;
    }
  }
  const needFood = foodStock < h.members.length * 4;
  const needWood = (store.inventory.wood ?? 0) < h.members.length * 2;
  if (!needFood && !needWood) {
    a.task = undefined;
    return false;
  }
  let target = a.task
    ? s.objects.find((o) => o.id === a.task!.target && !o.depleted)
    : undefined;
  if (!target) {
    a.task = undefined;
    target = s.objects
      .filter(
        (o) =>
          !o.depleted &&
          o.resource &&
          a.knownResources!.includes(o.id) &&
          (!o.owner || h.members.includes(o.owner)) &&
          (needFood
            ? !!items[o.resource.item]?.edible
            : o.resource.item === "wood"),
      )
      .sort(
        (a1, b) =>
          distance(a.pos, a1.pos) - distance(a.pos, b.pos) ||
          a1.id.localeCompare(b.id),
      )
      .find((o) => reachable(o.pos));
  }
  if (!target) {
    a.activity = "Looking for household supplies";
    return false;
  }
  a.activity = `Gathering ${target.name.toLowerCase()}`;
  if (distance(a.pos, target.pos) > 2.2) {
    a.task = { target: target.id, until: 0 };
    move(target.pos);
  } else if (!a.task?.until)
    a.task = { target: target.id, until: s.clock + 180 };
  else if (s.clock >= a.task.until) {
    harvestResource(a, target, s.clock);
    a.task = undefined;
  }
  return true;
}
/** Grazers consume the same finite patches a person can gather as fodder. */
export function grazeActivity(
  a: Actor,
  s: Snapshot,
  move: (p: Position) => void,
): boolean {
  if (
    !s.households ||
    (a.kind !== "sheep" && a.kind !== "goat") ||
    a.hunger < 9 ||
    distance(a.pos, s.player.pos) < 2
  )
    return false;
  const patch = s.objects
    .filter(
      (o) =>
        o.resource?.item === "fodder" &&
        !o.depleted &&
        distance(a.pos, o.pos) < 19,
    )
    .sort((u, v) => distance(a.pos, u.pos) - distance(a.pos, v.pos))[0];
  if (!patch) return false;
  a.activity = "Seeking grazing";
  if (distance(a.pos, patch.pos) > 2.2) {
    move(patch.pos);
    return true;
  }
  a.activity = "Grazing";
  if (s.clock % 60 === 0) {
    patch.inventory.fodder = Math.max(0, (patch.inventory.fodder ?? 0) - 1);
    a.hunger = Math.max(0, a.hunger - 5);
    if (!patch.inventory.fodder) {
      patch.depleted = true;
      patch.resource!.readyAt = s.clock + patch.resource!.regrowSeconds;
    }
  }
  return true;
}
export function depositSupplies(
  a: Actor,
  store: WorldObject,
  includeWater = true,
) {
  if (distance(a.pos, store.pos) > 2.2) return 0;
  let total = 0;
  for (const key of Object.keys(a.inventory) as ItemId[]) {
    if (
      ["tool", "coin", "obsidian"].includes(key) ||
      (!includeWater && key === "water")
    )
      continue;
    const n = a.inventory[key] ?? 0;
    store.inventory[key] = (store.inventory[key] ?? 0) + n;
    a.inventory[key] = 0;
    total += n;
  }
  if (total) store.depleted = false;
  return total;
}
