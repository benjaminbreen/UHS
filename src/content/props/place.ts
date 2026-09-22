import type { WorldModel, WorldObject, Position } from "../../core/types";
import { random } from "../../core/random";
import { plantClass } from "../ecology/vegetation";
import {
  propDefs,
  propKit,
  propVisualCells,
  type PropContext,
} from "./catalog";
import { techFor } from "./selection";
import { doorwayFor } from "../settlements/ornaments";
import { venueOfClaim } from "../venues";
import bFamilies from "../../render/generated/props-b.json" with { type: "json" };
import { buildingRoofCells } from "../graphics/models";

import { signFor, emblemFor, signLabels } from "./signage";
import { rareScale } from "./settlement-details";
import { placeSettlementDetails } from "./settlement-details/place";

const redrawn = new Set<string>(bFamilies);
/** The one fitting a trade cannot work without. Keyed off the building's own
 * name, which is where the generator records the household's trade. */
function tradeFitting(name: string, year: number, scale: boolean) {
  if (scale) return "beamScale";
  if (/smith|forge|founder|farrier/i.test(name))
    return year >= -1199 ? "anvil" : undefined;
  if (/weav|loom|spin|cloth|draper|fuller/i.test(name))
    return year >= -5999 ? "loom" : undefined;
  return undefined;
}
/** Work premises: a spade leans here, a chest does not. */
const worksite =
  /farm|field|herd|garden|workshop|shop|stores|yard|smith|mason|potter|tann|brew|mill|weav|carpent/i;

/** Pick from a list by each prop's rarity rather than evenly. */
function weighted(list: string[], roll: number) {
  let total = 0;
  for (const key of list) total += propDefs[key]?.rarity ?? 1;
  let at = roll * total;
  for (const key of list) {
    at -= propDefs[key]?.rarity ?? 1;
    if (at <= 0) return key;
  }
  return list[list.length - 1];
}
/** Which colourway. The first is the plain one every household had; the rest
 * are the glazed, painted or faded ones, and they share what is left. */
function variantOf(variants: number, roll: number) {
  if (variants <= 1) return 0;
  const plain = 0.58;
  if (roll < plain) return 0;
  return 1 + Math.floor(((roll - plain) / (1 - plain)) * (variants - 1));
}

/** Versioned content overlay: neither old terrain nor district RNG is changed.
 * Existing storage locations become real props; extra work objects hug buildings.
 * This runs for initial districts and each newly activated district. */
/** The first colourway of a prop's sprite, for a prop made outside placement. */
export function propSprite(key: string) {
  const def = propDefs[key];
  return (
    def &&
    `study-prop${redrawn.has(def.family) ? "b" : ""}-${def.family}-${variantOf(1, 0)}`
  );
}
export function withProps(world: WorldModel, seed: string): WorldModel {
  if (world.pack.setting?.situation) return world;
  const kit = propKit(world.pack),
    done = new Set<string>(),
    places = new Set<string>(),
    privies: Position[] = [],
    scales: Position[] = [];
  const tech = techFor(world.pack);
  const sign = signFor(world.pack);
  const doorway = doorwayFor(world.pack);
  const urbanPack =
    world.pack.setting?.settlement === "city" ||
    world.pack.setting?.settlement === "port";
  // How far out the middle of town reaches, from how far the buildings spread.
  let inner = 14;
  const regionalKits = new WeakMap<object, ReturnType<typeof propKit>>();
  const pick = (
    id: string,
    context: PropContext,
    pos: Position,
    allow?: (key: string) => boolean,
    /** The object already exists and must get something: fall back to the
     * props that belong anywhere rather than leaving it without a sprite. */
    required = false,
  ) => {
    const entrance =
      pos.space === "outside" ? pos : world.place(pos.space)?.entrance;
    const localPack =
      entrance && world.geography?.packAt(entrance.x, entrance.y);
    let selected = kit;
    if (localPack) {
      selected = regionalKits.get(localPack) ?? propKit(localPack);
      regionalKits.set(localPack, selected);
    }
    const all = selected.contexts[context];
    let list = allow ? all.filter(allow) : all;
    if (!list.length && required)
      list = all.filter(
        (k) => !propDefs[k]?.where && (!allow || !!propDefs[k]?.container),
      );
    if (!list.length && required) list = all;
    // A siting rule that leaves one candidate is not a rule, it is a stamp:
    // the 1950s city yard kit reduces to the plastic bucket alone. Take back
    // what belongs at a house — a bin, a tub — but not the works crates.
    if (list.length < 3 && required)
      list = all.filter(
        (k) =>
          !!propDefs[k]?.container &&
          (!propDefs[k]?.where || propDefs[k]?.where === "backyard"),
      );
    // Nothing in this kit belongs here: leave the corner empty rather than
    // putting a washing line on the market square.
    if (!list.length)
      return allow ? undefined : context === "water" ? "spring" : "stick";
    return weighted(list, random(seed, "props-1", id, context));
  };
  const stamp = (o: WorldObject, key: string | undefined) => {
    const def = key ? propDefs[key] : undefined;
    if (!key || !def) return;
    o.prop = key;
    o.name = def.name;
    const variants = def.family === "stick" ? 1 : (def.variants ?? 3);
    o.sprite = `study-prop${redrawn.has(def.family) ? "b" : ""}-${def.family}-${variantOf(variants, random(seed, "prop-color", o.id))}`;
    o.kind = def.drink ? "well" : def.fire ? "fire" : "container";
    o.open = false;
    if (def.contents) o.inventory = { ...def.contents };
  };
  // Indexed by cell: a city has a thousand objects and asks about each one.
  const at = (p: Position) => `${p.space}:${p.x},${p.y}`;
  const objectsAt = new Map<string, WorldObject[]>();
  const visualAt = new Map<string, WorldObject[]>();
  const visualKeys = (o: WorldObject) =>
    (o.prop ? propVisualCells(o.prop, o.pos) : [o.pos]).map((p) =>
      at({ ...p, space: o.pos.space }),
    );
  const index = (o: WorldObject) => {
    const k = at(o.pos),
      list = objectsAt.get(k) ?? [];
    list.push(o);
    objectsAt.set(k, list);
    for (const visual of visualKeys(o)) {
      const occupants = visualAt.get(visual) ?? [];
      occupants.push(o);
      visualAt.set(visual, occupants);
    }
  };
  const unindex = (o: WorldObject) => {
    const list = objectsAt.get(at(o.pos));
    const anchorIndex = list?.indexOf(o) ?? -1;
    if (list && anchorIndex >= 0) list.splice(anchorIndex, 1);
    for (const visual of visualKeys(o)) {
      const occupants = visualAt.get(visual);
      const visualIndex = occupants?.indexOf(o) ?? -1;
      if (occupants && visualIndex >= 0) occupants.splice(visualIndex, 1);
    }
  };
  for (const o of world.initialObjects) index(o);
  const roofCells = new Set(
    world.places.flatMap((b) =>
      buildingRoofCells(b.sprite, b).map((p) => at({ ...p, space: "outside" })),
    ),
  );
  const actorsAt = new Set(world.initialActors.map((a) => at(a.pos)));
  const actorById = new Map(world.initialActors.map((a) => [a.id, a]));
  const doorsAt = new Set<string>();
  for (const b of world.places)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        doorsAt.add(
          at({ x: b.entrance.x + dx, y: b.entrance.y + dy, space: "outside" }),
        );
  const occupied = (p: Position, ignore?: string, prop?: string) => {
    const footprint = prop ? propVisualCells(prop, p) : [p];
    for (const q of footprint) {
      if (p.space === "outside" && roofCells.has(at({ ...q, space: p.space })))
        return true;
      if (
        (visualAt.get(at({ ...q, space: p.space })) ?? []).some(
          (o) => o.id !== ignore,
        )
      )
        return true;
    }
    return false;
  };
  const reserved = new Set<string>();
  const usable = (p: Position, ignore?: string, prop?: string) =>
    !world.blocked(p.x, p.y, p.space) &&
    !reserved.has(at(p)) &&
    !(p.space === "outside" && world.protectedCell?.(p.x, p.y)) &&
    !occupied(p, ignore, prop) &&
    !actorsAt.has(at(p)) &&
    !doorsAt.has(at(p)) &&
    [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ].some(([x, y]) => !world.blocked(p.x + x, p.y + y, p.space));
  /** Everything the settlement drinks from. A privy is kept away from these,
   * which is the one siting rule people actually observed. */
  const waters = () =>
    world.initialObjects
      .filter((o) => o.kind === "well" && o.pos.space === "outside")
      .map((o) => o.pos);
  /** Whether a prop with a `where` rule belongs at this spot. */
  const belongs = (key: string, at: Position, works: boolean) => {
    const where = propDefs[key]?.where;
    if (!where) return true;
    const central =
      Math.hypot(at.x - world.spawn.x, at.y - world.spawn.y) < inner;
    if (where === "backyard") return !central;
    return works || !urbanPack;
  };
  /** A cell beside a doorway. The general test refuses anything within a step
   * of an entrance, which is precisely where a sign or a lantern hangs. */
  const freeAtDoor = (p: Position) =>
    !world.blocked(p.x, p.y, p.space) &&
    // A board hangs over the street and a lantern above the step, so neither
    // needs the cell kept clear the way a barrel does.
    !objectsAt.get(at(p))?.length &&
    !actorsAt.has(at(p));
  const populate = () => {
    if (world.places.length) {
      let far = 0;
      for (const b of world.places)
        far = Math.max(
          far,
          Math.hypot(b.x - world.spawn.x, b.y - world.spawn.y),
        );
      inner = Math.max(14, far * 0.45);
    }
    for (const o of [...world.initialObjects]) {
      if (done.has(o.id)) continue;
      done.add(o.id);
      unindex(o);
      if (o.prop && world.generatorVersion === 3) {
        /* Explicit settlement furniture retains its function. */
      } else if (o.kind === "container")
        stamp(
          o,
          pick(
            o.id,
            o.pos.space === "outside" ? "yard" : "household",
            o.pos,
            // This object is a container: it can become a barrel or a bin,
            // never a washing line.
            (key) => !!propDefs[key]?.container && belongs(key, o.pos, false),
            true,
          ),
        );
      // A square's fountain keeps its own sprite; only the plain well is a prop.
      else if (o.kind === "well" && o.sprite === "well")
        stamp(o, pick(o.id, "water", o.pos));
      // The shared fire takes its period form the same way.
      else if (o.kind === "fire" && o.sprite === "fire")
        stamp(o, pick(o.id, "fire", o.pos));
      index(o);
      if (o.prop && !usable(o.pos, o.id, o.prop)) {
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
        const free = choices.find((p) => usable(p, o.id, o.prop));
        if (free) {
          unindex(o);
          o.pos = free;
          index(o);
        }
      }
    }
    // Seats round a big fire: a log behind and one in front, a stump or a
    // stone at each side. Close to the ring, so the general one-step clearance
    // does not apply; only the seat's own cell has to be free.
    const seatFree = (p: Position) =>
      !world.blocked(p.x, p.y, p.space) &&
      !(p.space === "outside" && world.protectedCell?.(p.x, p.y)) &&
      !objectsAt.get(at(p))?.length &&
      !actorsAt.has(at(p)) &&
      !doorsAt.has(at(p));
    for (const o of [...world.initialObjects]) {
      const def = o.prop ? propDefs[o.prop] : undefined;
      if (!def?.seats || done.has(`${o.id}-seats`)) continue;
      done.add(`${o.id}-seats`);
      const side = (def.span?.[0] ?? 0) + 1;
      const spots: [number, number, number][] = [
        [-side, 0, 2],
        [side, 0, 2],
        [0, -2, 0],
        [0, 2, 1],
      ];
      const key =
        def.seats === "log"
          ? "seatLog"
          : def.seats === "stone"
            ? "seatStone"
            : "seatMat";
      spots.forEach(([dx, dy, variant], n) => {
        const spot = { ...o.pos, x: o.pos.x + dx, y: o.pos.y + dy };
        if (!seatFree(spot) || random(seed, "seat", o.id, n) < 0.1) return;
        const seat: WorldObject = {
          id: `${o.id}-seat-${n}`,
          name: "",
          kind: "container",
          pos: spot,
          sprite: "",
          inventory: {},
        };
        stamp(seat, key);
        // A log turns its end to the fire at the sides; the stones and mats
        // take whichever shape they rolled.
        if (key === "seatLog") seat.sprite = `study-propb-seat-log-${variant}`;
        world.initialObjects.push(seat);
        index(seat);
        done.add(seat.id);
      });
    }
    const bare = urbanPack ? 0.75 : 0.2;
    for (const b of world.places) {
      if (places.has(b.id) || b.structure) continue;
      places.add(b.id);
      // Half the buildings in a town get nothing in the yard at all. Every
      // house with its own bin and washing line is what made a street read as
      // a back yard. The frontage below is placed either way.
      const bareYard = random(seed, "yard-empty", b.id) < bare;
      // Side-of-house and yard pockets, never entrance tiles or street centers.
      const planned = world.propSlots?.(b.id);
      const pockets: Position[] = planned
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
      // A broad prop may not fit on the slot's anchor even though the same
      // work pocket has clear ground a few steps away. Search outward inside
      // that local zone before dropping the object from the composition.
      const seenCandidates = new Set<string>();
      const candidates: Position[] = [];
      for (const pocket of pockets)
        for (let r = 0; r <= 4; r++)
          for (let dy = -r; dy <= r; dy++)
            for (let dx = -r; dx <= r; dx++) {
              if (r && Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
              const p = { ...pocket, x: pocket.x + dx, y: pocket.y + dy };
              const key = at(p);
              if (seenCandidates.has(key)) continue;
              seenCandidates.add(key);
              candidates.push(p);
            }
      const domestic = b.access === "household";
      for (
        let slot = 0;
        !bareYard && slot < (random(seed, "yard-density", b.id) < 0.3 ? 2 : 1);
        slot++
      ) {
        const o: WorldObject = {
          id: `${b.id}-prop${slot}`,
          name: "",
          kind: "container",
          pos: candidates[0],
          sprite: "",
          inventory: {},
          owner: slot === 0 ? b.owner : undefined,
        };
        // The trade's own fitting goes in the work slot when the building
        // names a trade that needs one; otherwise tools, otherwise the yard.
        const fitting =
          slot === 0
            ? tradeFitting(
                b.name,
                world.pack.year,
                tech.balance &&
                  rareScale(b.name, random(seed, "scale", b.id)) &&
                  scales.every((p) => Math.hypot(p.x - b.x, p.y - b.y) >= 24),
              )
            : undefined;
        const works = worksite.test(`${b.name} ${b.entranceLabel}`);
        const tools =
          slot !== 1 && (works || random(seed, "tool-slot", o.id) < 0.16);
        const chosen = fitting
          ? fitting
          : pick(
              o.id,
              slot === 1 ? "yard" : tools ? "tool" : "work",
              o.pos,
              // A back yard is a household's own ground away from the middle
              // of town; crates and tins belong to a trade or the countryside.
              (key) =>
                belongs(key, o.pos, works) &&
                (propDefs[key]?.where !== "backyard" || domestic),
            );
        if (!chosen) break;
        const pos = candidates.find((p) => usable(p, undefined, chosen));
        if (!pos) break;
        o.pos = pos;
        stamp(o, chosen);
        if (chosen === "beamScale") scales.push(pos);
        world.initialObjects.push(o);
        index(o);
        done.add(o.id);
      }
      const venue = venueOfClaim(b.claim);
      const owner = actorById.get(b.owner);
      const emblem = emblemFor(
        venue?.kind,
        owner?.origin?.livelihood,
        owner?.role,
        b.name,
      );
      if (sign || venue || doorway !== undefined) {
        // Most household workshops stay unsigned; a named shop is signed only
        // when its trade has a mark of its own.
        const trades =
          emblem !== undefined &&
          random(seed, "board", b.id) <
            // Whole words: "workshop" is not a shop.
            (/\b(shop|market|stall|apothecary|tea)\b/i.test(b.name) ? 0.5 : 0.15);
        const boardable = !!sign && emblem !== undefined;
        // Signs keep apart, and the same mark further apart still: a row
        // of identical tea boards reads as wallpaper.
        const nearbySign = world.initialObjects.some((o) => {
          if (!o.prop?.startsWith("signpost-")) return false;
          const d = Math.hypot(o.pos.x - b.entrance.x, o.pos.y - b.entrance.y);
          return d < 4 || (d < 14 && o.sprite.endsWith(`-${emblem}`));
        });
        const wanted = venue?.marker
          ? "marker"
          : venue && !venue.open && boardable
            ? sign!.key
            : venue?.sign === "lantern" && doorway !== undefined
              ? "doorLantern"
              : !venue && trades && boardable && !nearbySign
                ? sign!.key
                : undefined;
        const beside = wanted
          ? [
              [1, 0],
              [-1, 0],
              [1, 1],
              [-1, 1],
              [0, 1],
              [2, 0],
              [-2, 0],
            ]
              .map(([dx, dy]) => ({
                x: b.entrance.x + dx,
                y: b.entrance.y + dy,
                space: "outside" as const,
              }))
              .find(
                (p) =>
                  freeAtDoor(p) &&
                  (!wanted.startsWith("signpost-") ||
                    (p.x !== b.entrance.x &&
                      !world.places.some(
                        (place) =>
                          place.entrance.x === p.x &&
                          Math.abs(place.entrance.y - p.y) <= 1,
                      ) &&
                      !occupied(p, undefined, wanted) &&
                      !world.blocked(p.x + 1, p.y, p.space))),
              )
          : undefined;
        if (wanted && beside) {
          const o: WorldObject = {
            id: `${b.id}-frontage`,
            name: "",
            kind: "container",
            pos: beside,
            sprite: "",
            inventory: {},
            owner: b.owner,
          };
          if (wanted === "marker" && venue?.marker) {
            o.kind = "monument";
            o.name = venue.marker.name;
            o.description = venue.marker.description;
            o.sprite = `study-propb-sacred-marker-${venue.marker.variant}`;
          } else {
            stamp(o, wanted);
            if (venue)
              o.description = `Hung at the door of ${venue.label.replace(/^The /, "the ")}.`;
            o.sprite =
              sign && wanted === sign.key
                ? `study-propb-${propDefs[sign.key].family}-${emblem}`
                : `study-propb-door-lantern-${doorway}`;
          }
          if (wanted.startsWith("signpost-")) {
            o.name = `${signLabels[emblem!]} sign · ${b.name}`;
            o.description = `A small freestanding sign beside the entrance to ${b.name}.`;
          }
          world.initialObjects.push(o);
          index(o);
          done.add(o.id);
        }
      }
      // One privy per household, at the far end of the yard and at least half
      // a dozen paces from the water. Downwind is not modelled; distance is.
      // A terrace shares one, which is what a town actually had; a farmstead
      // builds its own. Spacing does the sharing: the first house on a block
      // to roll one takes it, and its neighbours find the ground taken.
      const spacing = urbanPack ? 11 : 5;
      if (
        domestic &&
        random(seed, "privy-here", b.id) < (urbanPack ? 0.4 : 0.55) &&
        !privies.some((p) => Math.hypot(p.x - b.x, p.y - b.y) < spacing)
      ) {
        const drink = waters();
        // The planned slots are the household's own ground. Off them the
        // search stays tight to the wall, or a privy ends up in the street.
        const around: Position[] = [...candidates];
        const reach = urbanPack ? 1 : 3;
        for (let dy = -reach; dy <= reach + 1; dy++)
          for (let dx = -reach; dx <= reach; dx++)
            around.push({
              x: b.x + (dx < 0 ? dx : b.w + dx),
              y: b.y + (dy < 0 ? dy : b.h + dy),
              space: "outside",
            });
        const fromWater = (p: Position) =>
          Math.min(
            ...drink.map((q) => Math.hypot(q.x - p.x, q.y - p.y)),
            Infinity,
          );
        const far = around
          .filter((p) => usable(p))
          // Furthest from the water first, and from the door after that: a
          // privy belongs at the bottom of the yard, not beside the well.
          .sort(
            (p, q) =>
              Math.min(fromWater(q), 12) - Math.min(fromWater(p), 12) ||
              Math.hypot(q.x - b.entrance.x, q.y - b.entrance.y) -
                Math.hypot(p.x - b.entrance.x, p.y - b.entrance.y),
          )[0];
        // A yard has one of whatever this place does; where the kit offers
        // both a midden and a muck heap, which one is the household's.
        const kinds = kit.contexts.privy;
        const key = kinds.length
          ? weighted(kinds, random(seed, "privy-kind", b.id))
          : undefined;
        if (far && key) {
          const o: WorldObject = {
            id: `${b.id}-privy`,
            name: "",
            kind: "container",
            pos: far,
            sprite: "",
            inventory: {},
            owner: b.owner,
          };
          stamp(o, key);
          world.initialObjects.push(o);
          index(o);
          privies.push(far);
          done.add(o.id);
        }
      }
    }
    placeSettlementDetails(world, seed, {
      free: (p, prop) => usable(p, undefined, prop),
      add: (o) => {
        world.initialObjects.push(o);
        index(o);
        done.add(o.id);
      },
      reserve: (cells) => cells.forEach((p) => reserved.add(at(p))),
    });
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
    // Deadwood under the trees: something to pick up and swing wherever the
    // player wanders, not just at the spawn point.
    if (!done.has("prop-branches")) {
      done.add("prop-branches");
      let dropped = 0;
      for (let dy = -24; dy <= 24 && dropped < 10; dy++)
        for (let dx = -24; dx <= 24 && dropped < 10; dx++) {
          const pos = {
            ...world.spawn,
            x: world.spawn.x + dx,
            y: world.spawn.y + dy,
          };
          if (pos.space !== "outside" || !usable(pos)) continue;
          const wooded = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
          ].some(([x, y]) =>
            ["small", "medium", "large"].includes(
              plantClass(world.decoration(pos.x + x, pos.y + y)?.sprite),
            ),
          );
          if (!wooded) continue;
          const id = `prop-branch-${pos.x},${pos.y}`;
          if (random(seed, "branch", id) > 0.3) continue;
          const o: WorldObject = {
            id,
            name: "",
            kind: "container",
            pos,
            sprite: "",
            inventory: {},
          };
          stamp(o, "branch");
          world.initialObjects.push(o);
          index(o);
          dropped++;
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
