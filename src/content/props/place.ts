import type { WorldModel, WorldObject, Position } from "../../core/types";
import { random } from "../../core/random";
import { propDefs, propKit, type PropContext } from "./catalog";

/** Versioned content overlay: neither old terrain nor district RNG is changed.
 * Existing storage locations become real props; extra work objects hug buildings.
 * This runs for initial districts and each newly activated district. */
export function withProps(world: WorldModel, seed: string): WorldModel {
  const kit = propKit(world.pack),
    done = new Set<string>(),
    places = new Set<string>();
  const pick = (id: string, context: PropContext) => {
    const list = kit.contexts[context];
    return list[Math.floor(random(seed, "props-1", id, context) * list.length)];
  };
  const stamp = (o: WorldObject, key: string) => {
    const def = propDefs[key];
    o.prop = key;
    o.name = def.name;
    o.sprite = `study-prop-${def.family}-${key === "stick" ? 0 : Math.floor(random(seed, "prop-color", o.id) * 3)}`;
    o.kind = def.drink ? "well" : "container";
    o.open = false;
    if (def.contents) o.inventory = { ...def.contents };
  };
  const occupied = (p: Position, ignore?: string) =>
    world.initialObjects.some(
      (o) =>
        o.id !== ignore &&
        o.pos.space === p.space &&
        Math.hypot(o.pos.x - p.x, o.pos.y - p.y) < 1.8,
    );
  const usable = (p: Position, ignore?: string) =>
    !world.blocked(p.x, p.y, p.space) &&
    !(p.space === "outside" && world.protectedCell?.(p.x, p.y)) &&
    !occupied(p, ignore) &&
    !world.initialActors.some(
      (a) => a.pos.space === p.space && a.pos.x === p.x && a.pos.y === p.y,
    ) &&
    !world.places.some(
      (b) =>
        p.space === "outside" &&
        Math.hypot(b.entrance.x - p.x, b.entrance.y - p.y) < 2,
    ) &&
    [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ].some(([x, y]) => !world.blocked(p.x + x, p.y + y, p.space));
  const populate = () => {
    for (const o of [...world.initialObjects]) {
      if (done.has(o.id)) continue;
      done.add(o.id);
      if (o.prop && world.generatorVersion === 3) {
        /* Explicit settlement furniture retains its function. */
      } else if (o.kind === "container")
        stamp(o, pick(o.id, o.pos.space === "outside" ? "yard" : "household"));
      else if (o.kind === "well") stamp(o, pick(o.id, "water"));
      if (o.prop && !usable(o.pos, o.id)) {
        const original = { ...o.pos };
        const choices: Position[] = [];
        for (let r = 1; r <= 6; r++)
          for (let dy = -r; dy <= r; dy++)
            for (let dx = -r; dx <= r; dx++) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) === r)
                choices.push({
                  ...original,
                  x: original.x + dx,
                  y: original.y + dy,
                });
            }
        const free = choices.find((p) => usable(p, o.id));
        if (free) o.pos = free;
      }
    }
    for (const b of world.places) {
      if (places.has(b.id)) continue;
      places.add(b.id);
      // Side-of-house and yard pockets, never entrance tiles or street centers.
      const planned = world.propSlots?.(b.id);
      const candidates: Position[] = planned
        ? [...planned.work, ...planned.yard].map((p) => ({
            ...p,
            space: "outside",
          }))
        : [
            { x: b.x - 2, y: b.y + b.h - 1, space: "outside" },
            { x: b.x + b.w + 2, y: b.y + b.h - 1, space: "outside" },
            { x: b.x - 2, y: b.y + b.h + 2, space: "outside" },
            { x: b.x + b.w + 2, y: b.y + b.h + 2, space: "outside" },
          ];
      for (
        let slot = 0;
        slot < (random(seed, "yard-density", b.id) < 0.3 ? 2 : 1);
        slot++
      ) {
        const pos = candidates.find((p) => usable(p));
        if (!pos) break;
        const o: WorldObject = {
          id: `${b.id}-prop${slot}`,
          name: "",
          kind: "container",
          pos,
          sprite: "",
          inventory: {},
          owner: slot === 0 ? b.owner : undefined,
        };
        stamp(o, pick(o.id, slot === 1 ? "yard" : "work"));
        world.initialObjects.push(o);
        done.add(o.id);
      }
    }
    // An unowned fallen stick near the arrival point makes the initial interaction
    // discoverable without giving every character a historically specific weapon.
    if (!done.has("prop-arrival-stick")) {
      done.add("prop-arrival-stick");
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [2, 0],
      ]) {
        const pos = {
          ...world.spawn,
          x: world.spawn.x + dx,
          y: world.spawn.y + dy,
        };
        if (!usable(pos)) continue;
        const o: WorldObject = {
          id: "prop-arrival-stick",
          name: "",
          kind: "container",
          pos,
          sprite: "",
          inventory: {},
        };
        stamp(o, "stick");
        world.initialObjects.push(o);
        break;
      }
    }
  };
  const activate = world.activate?.bind(world),
    restore = world.restoreDistricts?.bind(world);
  populate();
  return {
    ...world,
    activate: activate
      ? (x, y) => {
          activate(x, y);
          populate();
        }
      : undefined,
    restoreDistricts: restore
      ? (ids) => {
          restore(ids);
          populate();
        }
      : undefined,
  };
}
