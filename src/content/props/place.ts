import type { Pack, WorldModel, WorldObject, Position } from "../../core/types";
import { random } from "../../core/random";
import { plantClass } from "../ecology/vegetation";
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
/** What a board says: the trade of the house it hangs outside.
 *
 * Seven emblems cover the shops a town has enough of to be worth drawing.
 * A house that sells nothing hangs nothing, so anything unmatched returns
 * undefined and no sign is placed. Matched against the livelihood id the
 * character generator gives the owner, and against the role label for the
 * older packs, which carry no livelihood.
 */
const TRADE_EMBLEMS: string[][] = [
  // Drink. Matched whole word: "swineherd" contains "wine", and a swineherd
  // keeps no tavern.
  ["brewer", "brewster", "alewife", "taverner", "innkeeper", "vintner",
   "distiller", "publican", "tapster", "ale", "beer", "wine", "cider", "mead",
   "tavern", "inn", "alehouse", "beerseller"],
  ["weaver", "spinner", "dyer", "fuller", "tailor", "draper", "mercer",
   "milliner", "dressmaker", "seamstress", "embroiderer", "hatter", "clothier",
   "silk", "wool", "linen", "cloth", "weaving", "felter", "carder"],
  ["blacksmith", "smith", "farrier", "armourer", "armorer", "cutler",
   "founder", "tinsmith", "whitesmith", "nailer", "locksmith", "forge",
   "smithy", "bladesmith", "coppersmith"],
  ["baker", "miller", "confectioner", "pastrycook", "bakehouse", "bakery"],
  ["cobbler", "shoemaker", "leatherworker", "tanner", "saddler", "currier",
   "glover", "cordwainer", "harness", "leather"],
  ["potter", "grocer", "apothecary", "pharmacist", "chandler", "spicer",
   "merchant", "shopkeeper", "pedlar", "peddler", "fishmonger", "ironmonger",
   "salter", "oilman", "trader", "spice", "spicer"],
];
const TRADE_INDEX = new Map(
  TRADE_EMBLEMS.flatMap((words, index) =>
    words.map((word) => [word, index] as const),
  ),
);
/** The venue kinds that sell something over a counter. The rest of the
 * archetypes — a school, a bath, a lodge — get the bell, which is what a
 * street hung outside anything that was not a shop. */
const VENUE_EMBLEMS: Record<string, number> = {
  tavern: 0,
  "coffee-house": 5,
  market: 5,
};
function emblemFor(venueKind: string | undefined, ...trades: (string | undefined)[]) {
  if (venueKind) return VENUE_EMBLEMS[venueKind] ?? 6;
  // In order of authority: where the generator gave the owner a livelihood
  // that is the answer, and a generic pack role is not consulted over it.
  for (const trade of trades) {
    if (!trade) continue;
    for (const word of trade.toLowerCase().split(/[^a-z]+/)) {
      const index = word ? TRADE_INDEX.get(word) : undefined;
      if (index !== undefined) return index;
    }
    return undefined;
  }
  return undefined;
}
/** Which shop sign this street hangs, if it hangs one at all.
 *
 * Signage is a market's habit, not a human universal: it wants a street of
 * premises competing for the same passer-by. A hamlet has neither, and a
 * Neolithic one has nothing to write a board in, so it gets nothing. The
 * three families are three regions' answers, and the form within each is
 * mostly the date. Where no sign was drawn, none is hung.
 */
function signFor(pack: Pack): { key: string; form: number } | undefined {
  const culture = pack.setting?.culture,
    year = pack.year,
    settlement = pack.setting?.settlement;
  // A market village with a fair and an inn is late; before that a board
  // belongs to a town.
  const market =
    settlement === "city" ||
    settlement === "port" ||
    (settlement === "village" && year >= 1200);
  if (!market) return undefined;
  if (culture === "east-asian" || culture === "southeast-asian")
    return year >= 599
      ? { key: "shopSign", form: culture === "east-asian" ? 0 : 2 }
      : undefined;
  if (culture === "south-asian")
    return year >= 599 ? { key: "shopSign", form: 1 } : undefined;
  // Painted shop signs are a Greek and Roman street habit; the wrought
  // bracket and the ale-stake are the medieval town's.
  // It stops at 1800 because what comes next is lettering, painted across
  // the fascia by people who expect to be read. A hanging trade board on a
  // street of shopfronts is a heritage pub, not a city.
  if (culture === "european")
    return year >= -299 && year < 1800
      ? { key: "shopSignEuro", form: year >= 1100 ? 1 : 0 }
      : undefined;
  // A plaque where there are glazed tiles to make one; otherwise the wares
  // hung at the front, which is what a bazaar mostly did. The pennant belongs
  // to the caravan towns.
  // The open-fronted shop with its stock on show is as old as the bazaar;
  // the form is the trade's, not the century's.
  if (culture === "north-african-west-asian")
    return year >= -999 ? { key: "shopSignSouk", form: 0 } : undefined;
  if (culture === "inner-eurasian")
    return year >= 399 ? { key: "shopSignSouk", form: 0 } : undefined;
  return undefined;
}
/** Work premises: a spade leans here, a chest does not. */
const worksite = /farm|field|herd|garden|workshop|shop|stores|yard|smith|mason|potter|tann|brew|mill|weav|carpent/i;

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
  return def && `study-prop${redrawn.has(def.family) ? "b" : ""}-${def.family}-${variantOf(1, 0)}`;
}
export function withProps(world: WorldModel, seed: string): WorldModel {
  const kit = propKit(world.pack),
    done = new Set<string>(),
    places = new Set<string>(),
    privies: Position[] = [];
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
    if (!list.length) return allow ? undefined : context === "water" ? "spring" : "stick";
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
  const actorById = new Map(world.initialActors.map((a) => [a.id, a]));
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
      else if (o.kind === "fire" && o.sprite === "fire")
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
    // Seats round a big fire: logs or stones at the back and sides, one in
    // front, each kept a step clear of the next.
    for (const o of [...world.initialObjects]) {
      const def = o.prop ? propDefs[o.prop] : undefined;
      if (!def?.seats || done.has(`${o.id}-seats`)) continue;
      done.add(`${o.id}-seats`);
      const reach = (def.span?.[0] ?? 0) + 2;
      const spots: [number, number, number][] = [
        [-reach, 0, 2],
        [reach, 0, 2],
        [-2, -2, 0],
        [2, -2, 1],
        [0, 2, 0],
      ];
      const key =
        def.seats === "log"
          ? "seatLog"
          : def.seats === "stone"
            ? "seatStone"
            : "seatMat";
      spots.forEach(([dx, dy, variant], n) => {
        const at = { ...o.pos, x: o.pos.x + dx, y: o.pos.y + dy };
        if (!usable(at) || random(seed, "seat", o.id, n) < 0.15) return;
        const seat: WorldObject = {
          id: `${o.id}-seat-${n}`,
          name: "",
          kind: "container",
          pos: at,
          sprite: "",
          inventory: {},
        };
        stamp(seat, key);
        // A log turns its end to the fire at the sides; the stones and mats
        // take whichever shape they rolled.
        if (key === "seatLog")
          seat.sprite = `study-propb-seat-log-${variant}`;
        world.initialObjects.push(seat);
        index(seat);
        done.add(seat.id);
      });
    }
    const bare = urbanPack ? 0.75 : 0.2;
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
      // The owner's own trade, which is what the board is for. A livelihood
      // where the generator set one, the role label where it did not.
      const owner = actorById.get(b.owner);
      const emblem = emblemFor(
        venue?.kind,
        owner?.origin?.livelihood,
        owner?.role,
        b.name,
      );
      if (sign || venue || doorway !== undefined) {
        // A board goes up where there is a trade to advertise. On the
        // European street that is the emblem's whole job, so no emblem means
        // no board; the other families still hang one for a shop by name.
        // Not every craftsman's house on the street put a board up, and a
        // street where they all did is a street of wallpaper. A venue always
        // gets its own mark; a trade house takes its chances.
        // A fifth of the frontages, not half: most premises on any street
        // are somebody's front room, and a board on every one of them is
        // wallpaper again.
        const trades =
          (emblem !== undefined && random(seed, "board", b.id) < 0.2) ||
          // Whole words: "workshop" is not a shop, and a board on every
          // craftsman's back room is how a street becomes wallpaper.
          /\b(shop|market|grocer|trader|merchant|stall|apothecary|tea)\b/i.test(
            b.name,
          );
        // Both the European board and the souk's hung stock say a trade, so
        // neither goes up without one. The Asian board is still keyed to the
        // region and the date.
        const byTrade =
          sign?.key === "shopSignEuro" || sign?.key === "shopSignSouk";
        const boardable = sign && (!byTrade || emblem !== undefined);
        const wanted = venue
          ? venue.sign === "board"
            ? boardable
              ? sign?.key
              : undefined
            : venue.sign === "lantern"
              ? "doorLantern"
              : undefined
          : trades && boardable
            ? sign?.key
            : // A doorway marker is a marker: on half the houses in a town it
              // stops telling you anything and becomes wallpaper. The variant
              // is the culture's, so the only thing to vary is how many.
              doorway !== undefined && random(seed, "lantern", b.id) < 0.07
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
          // The region sets the script, but not every board on a street was
          // made by the same hand: a third take one of the other two forms, so
          // a row of shopfronts is not one sprite repeated.
          const signForm = byTrade
            ? (emblem ?? 6)
            : random(seed, "sign-form", b.id) < 0.66
              ? (sign?.form ?? 0)
              : Math.floor(random(seed, "sign-alt", b.id) * 3);
          o.sprite = sign && wanted === sign.key
              ? `study-propb-${propDefs[sign.key].family}-${signForm}`
              : `study-propb-door-lantern-${doorway ?? 0}`;
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
