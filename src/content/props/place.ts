import type { WorldModel, WorldObject, Position } from "../../core/types";
import { random } from "../../core/random";
import { propDefs, propKit, type PropContext } from "./catalog";
import { techFor } from "./selection";
import { doorwayFor } from "../settlements/ornaments";
import { venueOfClaim } from "../venues";
import bFamilies from "../../render/generated/props-b.json" with { type: "json" };

const redrawn = new Set<string>(bFamilies);
/** The one fitting a trade cannot work without. Keyed off the building's own
 * name, which is where the generator records the household's trade. */
function tradeFitting(name: string, year: number, balance: boolean) {
  // Everything an Old World market sold went over a balance first. A
  // redistributive economy without markets had no use for one.
  if (balance && /market|grocer|trader|merchant|shop|apothec|spice/i.test(name))
    return "beamScale";
  if (/smith|forge|founder|farrier/i.test(name))
    return year >= -1199 ? "anvil" : undefined;
  if (/weav|loom|spin|cloth|draper|fuller/i.test(name))
    return year >= -5999 ? "loom" : undefined;
  return undefined;
}
/** Which shop board this street hangs, if it hangs one. */
function signRegion(culture?: string) {
  return culture === "east-asian"
    ? 0
    : culture === "south-asian"
      ? 1
      : culture === "southeast-asian"
        ? 2
        : undefined;
}
/** Work premises: a spade leans here, a chest does not. */
const worksite = /farm|field|herd|garden|workshop|shop|stores|yard|smith|mason|potter|tann|brew|mill|weav|carpent/i;

/** Versioned content overlay: neither old terrain nor district RNG is changed.
 * Existing storage locations become real props; extra work objects hug buildings.
 * This runs for initial districts and each newly activated district. */
export function withProps(world: WorldModel, seed: string): WorldModel {
  const kit = propKit(world.pack),
    done = new Set<string>(),
    places = new Set<string>();
  const tech = techFor(world.pack);
  const region = signRegion(world.pack.setting?.culture);
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
    // Nothing in this kit belongs here: leave the corner empty rather than
    // putting a washing line on the market square.
    if (!list.length) return allow ? undefined : context === "water" ? "spring" : "stick";
    return list[Math.floor(random(seed, "props-1", id, context) * list.length)];
  };
  const stamp = (o: WorldObject, key: string | undefined) => {
    const def = key ? propDefs[key] : undefined;
    if (!key || !def) return;
    o.prop = key;
    o.name = def.name;
    const variants = key === "stick" ? 1 : (def.variants ?? 3);
    o.sprite = `study-prop${redrawn.has(def.family) ? "b" : ""}-${def.family}-${Math.floor(random(seed, "prop-color", o.id) * variants)}`;
    o.kind = def.drink ? "well" : def.fire ? "fire" : "container";
    o.open = false;
    if (def.contents) o.inventory = { ...def.contents };
  };
  // Indexed by cell: a city has a thousand objects and asks about each one.
  const at = (p: Position) => `${p.space}:${p.x},${p.y}`;
  const objectsAt = new Map<string, WorldObject[]>();
  const index = (o: WorldObject) => {
    const k = at(o.pos),
      list = objectsAt.get(k) ?? [];
    list.push(o);
    objectsAt.set(k, list);
  };
  const unindex = (o: WorldObject) => {
    const list = objectsAt.get(at(o.pos));
    if (list) list.splice(list.indexOf(o), 1);
  };
  for (const o of world.initialObjects) index(o);
  const actorsAt = new Set(world.initialActors.map((a) => at(a.pos)));
  const doorsAt = new Set<string>();
  for (const b of world.places)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        doorsAt.add(
          at({ x: b.entrance.x + dx, y: b.entrance.y + dy, space: "outside" }),
        );
  const occupied = (p: Position, ignore?: string) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const o of objectsAt.get(
          at({ x: p.x + dx, y: p.y + dy, space: p.space }),
        ) ?? [])
          if (o.id !== ignore) return true;
    return false;
  };
  const usable = (p: Position, ignore?: string) =>
    !world.blocked(p.x, p.y, p.space) &&
    !(p.space === "outside" && world.protectedCell?.(p.x, p.y)) &&
    !occupied(p, ignore) &&
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
        far = Math.max(far, Math.hypot(b.x - world.spawn.x, b.y - world.spawn.y));
      inner = Math.max(14, far * 0.45);
    }
    for (const o of [...world.initialObjects]) {
      if (done.has(o.id)) continue;
      done.add(o.id);
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
      else if (false && o.kind === "fire" && o.sprite === "fire")
        stamp(o, pick(o.id, "fire", o.pos));
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
        if (free) {
          unindex(o);
          o.pos = free;
          index(o);
        }
      }
    }
    const bare = urbanPack ? 0.55 : 0.2;
    for (const b of world.places) {
      if (places.has(b.id)) continue;
      places.add(b.id);
      // Half the buildings in a town get nothing in the yard at all. Every
      // house with its own bin and washing line is what made a street read as
      // a back yard. The frontage below is placed either way.
      const bareYard = random(seed, "yard-empty", b.id) < bare;
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
      const domestic = b.access === "household";
      for (
        let slot = 0;
        !bareYard && slot < (random(seed, "yard-density", b.id) < 0.3 ? 2 : 1);
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
        // The trade's own fitting goes in the work slot when the building
        // names a trade that needs one; otherwise tools, otherwise the yard.
        const fitting =
          slot === 0
            ? tradeFitting(b.name, world.pack.year, tech.balance)
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
        stamp(o, chosen);
        world.initialObjects.push(o);
        index(o);
        done.add(o.id);
      }
      // At the door: a board if the place trades, a pair of lanterns if it
      // does not. One or the other, never both on the same frontage. A venue
      // says which in its own row and always gets one — until each archetype
      // has a building of its own, the mark at the door is how a tavern is
      // told from the house beside it.
      const venue = venueOfClaim(b.claim);
      if (region !== undefined || venue || doorway !== undefined) {
        const trades = /shop|market|grocer|trader|merchant|stall|apothec|tea/i.test(
          b.name,
        );
        const wanted = venue
          ? venue.sign === "board"
            ? "shopSign"
            : venue.sign === "lantern"
              ? "doorLantern"
              : undefined
          : trades && region !== undefined
            ? "shopSign"
            : doorway !== undefined && random(seed, "lantern", b.id) < 0.5
              ? "doorLantern"
              : undefined;
        const beside = wanted
          ? [
              [1, 0], [-1, 0], [1, 1], [-1, 1], [0, 1], [2, 0], [-2, 0],
            ]
              .map(([dx, dy]) => ({
                x: b.entrance.x + dx,
                y: b.entrance.y + dy,
                space: "outside" as const,
              }))
              .find((p) => freeAtDoor(p))
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
          stamp(o, wanted);
          if (venue) o.name = venue.label;
          // A board takes the region's script; a doorway marker takes
          // whatever that culture and date actually hung there.
          o.sprite =
            wanted === "shopSign"
              ? `study-propb-shop-sign-${region ?? 1}`
              : `study-propb-door-lantern-${doorway ?? 0}`;
          world.initialObjects.push(o);
          index(o);
          done.add(o.id);
        }
      }
      // One privy per household, at the far end of the yard and at least half
      // a dozen paces from the water. Downwind is not modelled; distance is.
      if (domestic && random(seed, "privy-here", b.id) < 0.55) {
        const drink = waters();
        // The planned slots are few and the yard ones get used first, so this
        // looks at the ground round the back of the house as well.
        const around: Position[] = [...candidates];
        for (let dy = -3; dy <= 4; dy++)
          for (let dx = -3; dx <= 3; dx++)
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
        const key = kit.contexts.privy[0];
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
          done.add(o.id);
        }
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
