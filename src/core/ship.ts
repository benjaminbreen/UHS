import { hullById, hullFor, mediumWords, shipName, shipNation, voyageDays } from "../content/ships";
import { DECK, parseShipSpace, RAIL, shipLevel, shipSolid, shipSpace, type ShipLevel, type ShipThing } from "../world/ship";
import { folkArrive, folkDeal, folkTime, type FolkHost } from "./tunnel-folk";
import type { GameEvent, Inspection, Point, Position, Snapshot as GameState, WorldModel } from "./types";

/** A life that starts at sea: the ship, and when she makes her landfall. */
export type Voyage = {
  hull: string;
  name: string;
  /** The clock at landfall. */
  lands: number;
  landed?: boolean;
  /** Where the player steps ashore. */
  shore: Point;
  fed?: number;
  sick?: boolean;
  seen?: number;
};

export type ShipHost = {
  state: GameState;
  world: WorldModel;
  event(text: string, kind?: GameEvent["kind"], at?: Position): void;
  advance(seconds: number): void;
  folk: FolkHost;
  levels: Map<string, { level: ShipLevel; solid: Set<number> }>;
};

const cheb = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const placeOf = (h: ShipHost) => {
  const s = h.world.pack.setting!;
  return { lon: s.lon, lat: s.lat, year: s.year };
};

export function shipLevelOf(h: ShipHost, space: string) {
  const known = h.levels.get(space);
  if (known) return known;
  const deck = parseShipSpace(space), voyage = h.state.voyage, hull = voyage && hullById.get(voyage.hull);
  if (deck === undefined || !hull || !h.world.pack.setting || deck > hull.below.length) return undefined;
  const level = shipLevel(h.state.manifest.seed, hull, deck, placeOf(h));
  const entry = { level, solid: shipSolid(level) };
  h.levels.set(space, entry);
  return entry;
}

export function shipGround(h: ShipHost, space: string, x: number, y: number) {
  const c = shipLevelOf(h, space);
  if (!c) return undefined;
  const { level, solid } = c;
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  return level.cells[y * level.w + x] !== DECK || solid.has(y * level.w + x);
}

function arrive(h: ShipHost, deck: number, from?: number) {
  const c = shipLevelOf(h, shipSpace(deck));
  if (!c) return;
  const { level } = c, p = h.state.player;
  const way = from === undefined ? undefined : level.things.find((t) => t.to === from);
  const spot = way ? beside(h, level, way) : level.entry;
  p.pos = { ...spot, space: level.space };
  p.direction = 2;
  folkArrive(h.folk, level.space, level.folk);
}

function beside(h: ShipHost, level: ShipLevel, t: ShipThing): Point {
  for (let r = 1; r < 4; r++)
    for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0], [-1, 1], [1, 1], [-1, -1], [1, -1]])
      for (let k = 0; k < Math.max(t.w, t.h); k++) {
        const x = t.x + Math.min(k, t.w - 1) + dx * r, y = t.y + Math.min(k, t.h - 1) + dy * r;
        if (!shipGround(h, level.space, x, y) && !(x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h)) return { x, y };
      }
  return level.entry;
}

/** A new life aboard: put the player on the weather deck of whatever sails these waters. */
export function shipStart(h: ShipHost) {
  const place = placeOf(h), seed = h.state.manifest.seed;
  const hull = hullFor(place, seed, h.world.pack.setting?.ship);
  if (!hull) return false;
  const p = h.state.player;
  const days = voyageDays(hull, seed);
  // Landfall in the morning, a few days on.
  const lands = (Math.floor(h.state.clock / 86400) + days) * 86400 + 9 * 3600;
  h.state.voyage = { hull: hull.id, name: shipName(hull, place, seed), lands, shore: { x: p.pos.x, y: p.pos.y } };
  arrive(h, 0);
  return true;
}

export function shipTargetNear(h: ShipHost): string | undefined {
  const p = h.state.player, v = h.state.voyage;
  const c = v && shipLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c;
  const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.direction];
  const front = { x: p.pos.x + d[0], y: p.pos.y + d[1] };
  const touches = (t: ShipThing, q: Point) => q.x >= t.x - 1 && q.x <= t.x + t.w && q.y >= t.y - 1 && q.y <= t.y + t.h;
  const ways = level.things.filter((t) => t.verb && touches(t, p.pos));
  const best = ways.find((t) => touches(t, front) && cheb(front, { x: Math.max(t.x, Math.min(front.x, t.x + t.w - 1)), y: Math.max(t.y, Math.min(front.y, t.y + t.h - 1)) }) === 0) ?? ways[0];
  if (best) return `ship-thing:${best.id}`;
  if (level.deck !== 0) return undefined;
  if (v.landed) return "ship-ashore";
  const rail = [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => level.cells[(p.pos.y + dy) * level.w + p.pos.x + dx] === RAIL);
  return rail ? "ship-rail" : undefined;
}

const NAMES: Record<string, [string, string]> = {
  hatch: ["Main hatch", "A square hole in the deck with a ladder going down into the dark. Warm air comes up, smelling of tar, bilge and people."],
  "engine-door": ["Engine room door", "A steel door in the deckhouse. Behind it a ladder drops into heat, noise and the red light of the furnaces."],
  ladder: ["Ladder", "A steep wooden ladder up through the hatch. Daylight and fresh air at the top."],
  "ladder-down": ["Ladder down", "A ladder going down to the deck below."],
};

export function shipInspect(h: ShipHost, id: string): Inspection | undefined {
  const p = h.state.player, v = h.state.voyage;
  const c = v && shipLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c, hull = level.hull;
  const act = (label: string) => ({ label, enabled: true, command: { type: "interact" as const, target: id, action: "ship" as const } });
  const words = hull.medium && mediumWords[hull.medium];
  if (words && (id === "ship-ashore" || id === "ship-rail"))
    return { id, name: id === "ship-ashore" ? "The way out" : "Outside", kind: "place", pos: { ...p.pos }, description: seaView(h, level), affordances: [act(id === "ship-ashore" ? words.out : "Look out")] };
  if (id === "ship-ashore")
    return {
      id, name: "The shore", kind: "place", pos: { ...p.pos },
      description: hull.kind === "steamer" ? "The gangway is down to the quay. Porters are already shouting for luggage." : "The boat is alongside to row people in to the beach and the landing place.",
      affordances: [act("Go ashore")],
    };
  if (id === "ship-rail")
    return {
      id, name: "The rail", kind: "place", pos: { ...p.pos },
      description: seaView(h, level),
      affordances: [act("Watch the sea a while")],
    };
  const thing = level.things.find((t) => `ship-thing:${t.id}` === id);
  if (!thing?.verb) return undefined;
  const [name, description] = NAMES[thing.art] ?? [thing.art, ""];
  return { id, name, kind: "place", pos: { x: thing.x, y: thing.y, space: level.space }, description, affordances: [act(thing.verb)] };
}

/** The label for the key, without building a whole inspection. */
export function shipVerb(h: ShipHost) {
  const id = shipTargetNear(h);
  const offer = id ? shipInspect(h, id)?.affordances[0] : undefined;
  return offer && offer.command.type === "interact" ? { label: offer.label, target: offer.command.target } : undefined;
}

function seaView(h: ShipHost, level: ShipLevel) {
  const { lat } = placeOf(h), hour = ((h.state.clock / 3600) % 24 + 24) % 24, night = hour < 5.5 || hour > 19.5;
  const v = h.state.voyage!;
  if (level.hull.medium) return v.landed ? mediumWords[level.hull.medium].arrive : mediumWords[level.hull.medium].view;
  if (v.landed) return "The coast is close now: surf on the beach, roofs, smoke going up.";
  const days = Math.max(1, Math.ceil((v.lands - h.state.clock) / 86400));
  const land = days > 1 ? `Nothing but sea all round. The mate reckons ${days} more days to landfall.` : "The mate says you'll see land by tomorrow morning.";
  if (night) return `${land} The sea is black. ${Math.abs(lat) < 30 ? "Where the hull cuts it, the water glows green." : "The ship's lantern swings over the wake."}`;
  return `${land} ${Math.abs(lat) < 28 ? "Flying fish skip away from the bow and drop back in." : Math.abs(lat) > 38 ? "Grey swells come up from the south-west, long and slow." : "Dolphins are playing in the bow wave."}${level.hull.kind === "steamer" ? " The deck shakes with the engines." : ""}`;
}

export function shipAct(h: ShipHost, id: string) {
  const p = h.state.player, v = h.state.voyage;
  if (id.startsWith("folk-")) return void folkDeal(h.folk, id);
  const c = v && shipLevelOf(h, p.pos.space);
  if (!v || !c) return;
  if (id === "ship-ashore") return void ashore(h);
  if (id === "ship-rail") {
    h.event(seaView(h, c.level));
    h.advance(2 * 3600);
    return;
  }
  const thing = c.level.things.find((t) => `ship-thing:${t.id}` === id);
  if (thing?.to === undefined) return;
  h.advance(20);
  arrive(h, thing.to, c.level.deck);
  const to = shipLevelOf(h, shipSpace(thing.to))!.level;
  h.event(thing.to === 0 ? "You climb up into the wind and the light." : to.use === "stokehold" ? "You go down the iron ladder into the heat. The stokers don't look up." : `You go down into ${to.name}. It's dark, and it smells of tar and people.`);
}

function ashore(h: ShipHost) {
  const v = h.state.voyage!, p = h.state.player;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...v.shore, space: "outside" };
  p.direction = 2;
  delete h.state.voyage;
  h.advance(30 * 60);
  const medium = hullById.get(v.hull)?.medium;
  h.event(medium ? mediumWords[medium].leave : "You step ashore. The ground seems to roll under your feet for the first hour.");
}

const RATION: Record<string, [string, string] | undefined> = {
  "square-rigger": ["ships-biscuit", "The cook hands out biscuit and a lump of salt meat."],
  junk: ["ship-rice", "Bowls of rice and salt fish come round from the galley."],
  dhow: ["dates", "Coffee and dates go round the crew sitting on the deck."],
  steamer: ["ships-biscuit", "A bell rings for meals. The steward hands round bread and stew."],
};

export function shipTime(h: ShipHost) {
  const v = h.state.voyage, p = h.state.player;
  if (!v) return;
  const c = shipLevelOf(h, p.pos.space);
  if (!c) {
    if (p.pos.space === "outside") {
      for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
      delete h.state.voyage;
    }
    return;
  }
  const clock = h.state.clock, hour = ((clock / 3600) % 24 + 24) % 24, day = Math.floor(clock / 86400);
  const medium = c.level.hull.medium;
  if (!v.sick && !medium && clock > (v.seen ?? clock) + 1800 && c.level.hull.kind !== "steamer") {
    v.sick = true;
    h.event("The deck heaves up and drops away again. Your stomach goes with it. Look at the horizon, the sailors say, not at the deck.", "world");
  }
  v.seen ??= clock;
  // Two meals a day, morning and late afternoon.
  const meal = day * 2 + (hour >= 16.5 ? 1 : 0);
  if ((hour >= 7.5 && hour < 9) || (hour >= 16.5 && hour < 18)) {
    if (v.fed !== meal && !v.landed) {
      v.fed = meal;
      const ration = RATION[c.level.hull.kind];
      if (ration) {
        p.inventory[ration[0]] = (p.inventory[ration[0]] ?? 0) + 1;
        h.event(ration[1], "world");
      }
    }
  }
  if (!v.landed && clock >= v.lands) {
    v.landed = true;
    h.event(medium ? mediumWords[medium].arrive : c.level.hull.kind === "steamer" ? "The engines slow, then stop. The ship slides in to her berth. You can go ashore." : "\"Land!\" A shout from aloft. By noon the anchor goes down off the coast. You can go ashore.", "world");
  }
  folkTime(h.folk, c.level.space, (x, y) => !shipGround(h, c.level.space, x, y));
}

/** Which ship a voyage is on, and the flag she flies, for the view. */
export function voyageLook(h: ShipHost) {
  const v = h.state.voyage, hull = v && hullById.get(v.hull);
  return hull && { hull, nation: shipNation(hull, placeOf(h)), name: v.name, lands: v.lands, landed: !!v.landed };
}
