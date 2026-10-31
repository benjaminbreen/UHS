import { carryKit } from "../../content/economy/carrying";
import { characterLivelihood, generateCharacter } from "../../content/characters/generate";
import { resolveCharacterContext, workAt } from "../../content/characters/resolve";
import { proceduralName } from "../../content/geography/character";
import { wayfarersAt, type Wayfarer } from "../../content/wayfarers";
import { DAY_MINUTES, PACE, type Itinerary, type StationActivity } from "../../core/itinerary";
import { random } from "../../core/random";
import { route } from "../../core/routing";
import type { Actor, Pack, Point, WorldModel } from "../../core/types";
import type { MapEntrance } from "../travel/entrances";
import { habitatTagsAt } from "./fauna";
import { faunaProfiles } from "../../content/fauna";
import { matchesCharacterScope } from "../../content/characters/resolve";
import { DIRECTIONS, endowmentFor, resourceName, tradeOf, type Resource } from "../../content/economy/endowments";
import { stallSeller } from "../../content/economy/market";

/** A border crossing as a passer-by sees it: where it is, and what lies past it. */
export type Way = MapEntrance & { point: Point };
/** `animals` are the pack train's own walks, one per beast, behind the party. */
export type Passing = { actor: Actor; itinerary: Itinerary; animals?: Itinerary[] };
type Segment = Itinerary["segments"][number];

export const isWayfarer = (id: string) => id.startsWith("wayfarer-");
export const isStallholder = (id: string) => id.startsWith("wayfarer-stall-");

/** Parties a day, by how many people live round here. */
const DAILY = { settled: 3, sparse: 2, none: 1 } as const;
/** And by what lies over the border: a town draws traffic past an empty map. */
const DRAW: Record<string, number> = { city: 2, town: 1.2, village: 0.6 };
/** Kinds of country each sort of work in the wild goes looking for. */
const COVER: [RegExp, string[]][] = [
  [/wood|timber|charcoal|bee|honey|hunt|trap/, ["woodland", "scrub"]],
  [/fowl|shell|reed|peat/, ["wetland", "shore"]],
  [/root|forag|gather|herb/, ["scrub", "open-grass", "woodland"]],
];

/** The day's passers-by: people who come in over one border and go out over
 * another, and people from a neighbouring place out working the country here.
 * Same seed, same day, same people. */
export function wayfarerDay(
  world: WorldModel,
  seed: string,
  pack: Pack,
  ways: Way[],
  day: number,
): Passing[] {
  const setting = pack.setting;
  if (!setting?.environment) return [];
  const stalls = stallholders(world, seed, setting, day);
  if (!ways.length) return stalls;
  const roll = (...k: (string | number)[]) => random(seed, "wayfarers", day, ...k);
  const population = setting.environment.population ?? "none";
  const deep = setting.year < -10000 ? 0.6 : 1;
  const expected =
    (DAILY[population] + ways.reduce((n, w) => n + (DRAW[w.settlement ?? ""] ?? 0), 0)) *
    deep *
    Math.min(1.5, ways.length / 3);
  const count = Math.floor(expected + roll("count"));
  const kinds = wayfarersAt(setting);
  const context = setting.characterRevision ? resolveCharacterContext(setting) : undefined;
  const kit = carryKit(pack);
  const out: Passing[] = [];
  for (let n = 0; n < count; n++) {
    const id = `wayfarer-${day}-${n}`;
    const r = (...k: (string | number)[]) => roll(n, ...k);
    // A town's own people work its woods; a stranger out cutting wood comes
    // from somewhere with none of its own.
    const wild = !world.settlements.length && r("wild") < 0.45;
    const party = wild
      ? wildParty(world, seed, setting, context, ways, id, day, r, kit)
      : roadParty(world, seed, setting, kinds, ways, id, day, r, kit);
    if (party) out.push(...party);
  }
  const caravan = kinds.filter(trades);
  if (caravan.length && roll("caravan") < 0.7)
    out.push(...(roadParty(world, seed, setting, caravan, ways, `wayfarer-${day}-c`, day, (...k) => roll("c", ...k), kit) ?? []));
  if (context)
    for (let d = day - 4; d <= day; d++)
      for (let n = 0; n < 2; n++)
        out.push(...(trip(world, seed, setting, context, ways, d, n, day, kit) ?? []));
  return [...stalls, ...out];
}

/** A seller at each market stall most days, selling what the stall is set
 * up for: walks up at seven or so, sells till late afternoon, packs up and
 * goes. The town's own people are mostly past the routine budget, so the
 * market keeps its own. */
function stallholders(world: WorldModel, seed: string, setting: NonNullable<Pack["setting"]>, day: number): Passing[] {
  const ground = { ...setting, ecology: setting.environment?.ecology };
  return (world.initialObjects ?? [])
    .filter((o) => o.prop === "marketCounter" && o.sells)
    .slice(0, 24)
    .flatMap((o, k) => {
      const r = (...key: (string | number)[]) => random(seed, "stalls", day, o.id, ...key);
      const who = stallSeller(o.sells!, ground);
      // Beside the counter, opposite its sign, where they are not hidden behind it.
      const stand = [{ x: o.pos.x - 2, y: o.pos.y }, { x: o.pos.x - 2, y: o.pos.y + 1 }, { x: o.pos.x, y: o.pos.y + 1 }].find((p) => !world.blocked(p.x, p.y, "outside"));
      if (!who || !stand || r("open") > 0.85) return [];
      const from = [[0, 9], [9, 2], [-9, 2], [0, 12]].map(([dx, dy]) => ({ x: stand.x + dx, y: stand.y + dy }))
        .find((p) => !world.blocked(p.x, p.y, "outside"));
      const there = (from && across(world, from, stand)) ?? [stand];
      const open = (7 + r("open-at")) * 60, close = (16 + r("close-at") * 1.5) * 60;
      const start = day * DAY_MINUTES + open;
      const selling = close - open - there.length * PACE * 2;
      const itinerary = journey(
        [
          { path: there, label: `Bringing ${who.noun} to market` },
          { path: [stand], label: `Selling ${who.noun}`, stop: { activity: "work", label: `Selling ${who.noun}`, minutes: Math.max(60, selling) } },
          { path: [...there].reverse(), label: "Packing up and going home" },
        ],
        start,
        PACE,
      );
      const done = itinerary.segments[itinerary.segments.length - 1].from;
      const sex = who.dress === "smith" ? "male" : r("sex") < 0.5 ? "female" : "male";
      const actor = person(seed, setting, `wayfarer-stall-${day}-${k}`, who.dress, who.seller, sex, 20 + Math.floor(r("age") * 35), there[0], (start + done + 10) * 60);
      return [{ actor, itinerary }];
    });
}

const GOODS = /(?<!small )goods/;
const trades = (k: Wayfarer) => k.halt === "trade" || (!!k.going && (GOODS.test(k.going) || /caravan/.test(k.going)));
/** What a merchant on this road carries: what the country behind them has
 * plenty of and the country ahead has none of. */
const CARGO: Resource[] = ["salt", "ore", "oil", "timber", "fish", "herds", "grain"];
function cargoOf(setting: NonNullable<Pack["setting"]>, from: Way, to: Way) {
  if (!from.neighbor || !to.neighbor) return;
  const a = endowmentFor({ ...from.neighbor, year: setting.year }), b = endowmentFor({ ...to.neighbor, year: setting.year });
  const g = { ...from.neighbor, year: setting.year };
  // Failing that, what the country behind is known for, where the country
  // ahead has less of it or is a town, which buys from all round.
  const market = to.settlement === "town" || to.settlement === "city";
  const r = CARGO.find((r) => a[r] === 2 && !b[r] && (r !== "ore" || setting.year >= -1200)) ??
    tradeOf(g).known.find((r) => CARGO.includes(r) && (market || b[r] < 2));
  if (!r) return;
  return r === "fish" ? "salt fish" : r === "herds" ? "wool and hides" : r === "ore" && resourceName(r, g) === "ore" ? "iron" : resourceName(r, g);
}

/** What each kind of work in the wild goes out for, and comes back with. */
const TRIPS: [RegExp, { doing: string; with: string; carry: string; eco: string[] }][] = [
  [/snar|falcon|fowl|bird|rabbit|hare/, { doing: "hunting", with: "game and skins", carry: "hide", eco: ["grassland", "savanna", "dry-scrub", "wetland"] }],
  [/hunt|trap|stalk/, { doing: "hunting", with: "hides and meat", carry: "hide", eco: ["temperate-woodland", "boreal-woodland", "tropical-woodland", "grassland", "savanna"] }],
  [/charcoal/, { doing: "burning charcoal", with: "charcoal", carry: "wood", eco: ["temperate-woodland", "boreal-woodland", "tropical-woodland"] }],
  [/wood|timber/, { doing: "cutting timber", with: "timber", carry: "wood", eco: ["temperate-woodland", "boreal-woodland", "tropical-woodland"] }],
];
const DAYS = ["", "", "two", "three", "four"];

/** Someone off for days to country past the border: seen leaving on the day
 * they set out, and coming back loaded a few days later. Rolled from the day
 * they left, so both walks are the same people. */
function trip(
  world: WorldModel,
  seed: string,
  setting: NonNullable<Pack["setting"]>,
  context: ReturnType<typeof resolveCharacterContext>,
  ways: Way[],
  left: number,
  n: number,
  today: number,
  kit: ReturnType<typeof carryKit>,
): Passing[] | undefined {
  const r = (...k: (string | number)[]) => random(seed, "trips", left, n, ...k);
  const away = 2 + Math.floor(r("days") * 3);
  if ((today !== left && today !== left + away) || r("go") > (world.settlements.length ? 0.6 : 0.4)) return;
  const sex = r("sex") < 0.85 ? "male" : "female";
  const open = workAt(context, "wild", sex).filter((l) => TRIPS.some(([re]) => re.test(l.id)));
  if (!open.length) return;
  const work = pick(open, (l) => l.weight ?? 1, r("work"));
  const livelihood = characterLivelihood(setting, seed, `wayfarer-trip-${left}-${n}-0`, work.id, context, sex);
  const what = TRIPS.find(([re]) => re.test(`${work.id} ${livelihood.label}`.toLowerCase()))![1];
  const town = world.settlements[0];
  const home = town ? undefined : pick(ways, () => 1, r("from"));
  const choices = ways.filter((w) => w !== home);
  if (!choices.length) return;
  const to = pick(choices, (w) => (w.neighbor && what.eco.includes(w.neighbor.ecology) ? 3 : 1) * (w.settlement === "city" || w.settlement === "town" ? 0.3 : 1), r("to"));
  const path = home ? road(world, home, to) ?? joined(home, to) : to.path;
  if (path.length < 8) return;
  const homeName = home ? (home.settlement && home.settlement !== "none" ? home.name : undefined) : town && !/ km /.test(town.name) ? town.name : undefined;
  const where = DIRECTIONS[to.bearing] ?? to.bearing.toLowerCase();
  const back = today !== left;
  const label = back
    ? `${homeName ? `Coming home to ${homeName}` : "Coming home"} after ${DAYS[away]} days ${what.doing}, with ${what.with}`
    : `Off ${what.doing} to the ${where}${homeName ? ` from ${homeName}` : ""}, for ${DAYS[away]} days`;
  const walk = back ? [...path].reverse() : path;
  const leave = ((back ? 13 : 5.5) + r(back ? "home" : "out") * 3) * 60;
  const party = r("party") < 0.6 ? 1 : 2;
  return Array.from({ length: party }, (_, i) => {
    const start = today * DAY_MINUTES + leave + 2 * i * PACE;
    const itinerary = journey([{ path: walk, label, carry: back ? what.carry : kit.bundle }], start, PACE);
    const done = itinerary.segments[itinerary.segments.length - 1].from;
    const actor = person(seed, setting, `wayfarer-trip-${left}-${n}-${i}`, livelihood.id, livelihood.label, sex, 20 + Math.floor(r(i, "age") * 30), walk[0], (start + done + 10) * 60);
    return { actor, itinerary };
  });
}

function pick<T>(items: readonly T[], weight: (t: T) => number, u: number) {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let x = u * total;
  for (const t of items) if ((x -= weight(t)) < 0) return t;
  return items[items.length - 1];
}

function across(world: WorldModel, from: Point, to: Point) {
  const result = route(
    from,
    to,
    (p, q) =>
      world.blocked(p.x, p.y, "outside") || (world.canCross && !world.canCross(q, p))
        ? Infinity
        : (world.navigationCost?.(p.x, p.y, "wayfarer") ?? 1),
    { maxNodes: 4000, minCost: 1 },
  );
  return result.status === "found" ? [from, ...result.path] : undefined;
}

const STEP = 3;
const routes = new WeakMap<WorldModel, Map<string, Point[] | null>>();
/** Border to border, keeping to the roads where there are any, once per pair
 * of borders. Searched on a three-cell lattice, about twenty times cheaper
 * than cell by cell. */
function road(world: WorldModel, a: Way, b: Way) {
  let cache = routes.get(world);
  if (!cache) routes.set(world, (cache = new Map()));
  const key = `${a.id}>${b.id}`;
  if (cache.has(key)) return cache.get(key) ?? undefined;
  const back = cache.get(`${b.id}>${a.id}`);
  if (back !== undefined) return back ? [...back].reverse() : undefined;
  const open = (p: Point, q: Point) =>
    !world.blocked(p.x, p.y, "outside") && (!world.canCross || world.canCross(q, p));
  const along = (from: Point, to: Point) => {
    const cells: Point[] = [];
    let p = from;
    while (p.x !== to.x || p.y !== to.y) {
      const q = p.x !== to.x ? { x: p.x + Math.sign(to.x - p.x), y: p.y } : { x: p.x, y: p.y + Math.sign(to.y - p.y) };
      if (!open(q, p)) return undefined;
      cells.push(q);
      p = q;
    }
    return cells;
  };
  // Nobody walks the map's own edge: it is a line on a map, not a road.
  const edge = Math.max(Math.abs(a.point.x), Math.abs(a.point.y)) - 8;
  const goal = b.point;
  // The lattice point nearest the far crossing: a goal test instead would
  // switch off the search's heuristic.
  const snap = (v: number, o: number) => o + Math.round((v - o) / STEP) * STEP;
  const near = { x: snap(goal.x, a.point.x), y: snap(goal.y, a.point.y) };
  const result = route(
    a.point,
    near,
    (p, q) => {
      const cells = along(q, p);
      return cells
        ? cells.reduce((n, c) => n + (world.navigationCost?.(c.x, c.y, "wayfarer") ?? 1) + (Math.max(Math.abs(c.x), Math.abs(c.y)) > edge ? 3 : 0), 0)
        : Infinity;
    },
    {
      // A route that is there is found in a few hundred; past this it is cliffs
      // or a lake, and the border paths will do.
      maxNodes: 3000,
      minCost: STEP,
      heuristicWeight: 1.4,
    },
  );
  let path: Point[] | undefined;
  if (result.status === "found") {
    path = [a.point];
    for (const p of result.path) path.push(...along(path[path.length - 1], p)!);
    const rest = along(path[path.length - 1], goal);
    path = rest ? [...path, ...rest] : undefined;
  }
  cache.set(key, path ?? null);
  return path;
}

/** Two border paths, which both start at the spawn, joined where they part. */
function joined(a: Way, b: Way) {
  let shared = 0;
  while (
    shared < a.path.length - 1 &&
    shared < b.path.length - 1 &&
    a.path[shared + 1].x === b.path[shared + 1].x &&
    a.path[shared + 1].y === b.path[shared + 1].y
  )
    shared++;
  return [...a.path.slice(shared).reverse(), ...b.path.slice(shared + 1)];
}

/** One member of a party: a walk, maybe a stop, and gone. `lag` puts them
 * that many tiles behind whoever leads. */
function journey(
  legs: { path: Point[]; label: string; carry?: string; stop?: { activity: StationActivity; label: string; minutes: number } }[],
  start: number,
  pace: number,
): Itinerary {
  const segments: Segment[] = [];
  let at = 0;
  let last: Point = legs[0].path[0];
  for (const leg of legs) {
    const [from, ...path] = leg.path;
    if (path.length) {
      segments.push({ from: at, to: at + path.length * pace, pos: from, path, activity: "visit", label: leg.label, carry: leg.carry });
      at += path.length * pace;
    }
    last = leg.path[leg.path.length - 1];
    if (leg.stop) {
      segments.push({ from: at, to: at + leg.stop.minutes, pos: last, activity: leg.stop.activity, label: leg.stop.label, carry: leg.carry });
      at += leg.stop.minutes;
    }
  }
  // Past the border they are nobody's business: resting, and so not drawn.
  segments.push({ from: at, to: Number.MAX_SAFE_INTEGER, pos: last, activity: "rest", label: "Gone on" });
  return { segments, start, period: Number.MAX_SAFE_INTEGER };
}

function person(
  seed: string,
  setting: NonNullable<Pack["setting"]>,
  id: string,
  dress: string,
  label: string,
  sex: "male" | "female",
  age: number,
  at: Point,
  until: number,
): Actor {
  const pos = { ...at, space: "outside" as const };
  const actor: Actor = {
    id,
    name: proceduralName(setting, seed, id),
    role: label,
    kind: "human",
    pos: { ...pos },
    home: { ...pos },
    work: { ...pos },
    sprite: `human-${Math.floor(random(seed, id, "sprite") * 3)}-${Math.floor(random(seed, id, "shade") * 6)}`,
    inventory: { water: 1 },
    activity: label,
    fatigue: 0,
    hunger: 5,
    trust: 1,
    memories: [],
    direction: 2,
    wayfarer: { until },
  };
  if (setting.characterRevision) {
    Object.assign(actor, generateCharacter(setting, seed, id, age, dress, undefined, undefined, sex));
    actor.role = label;
    const origin = (actor as { origin?: { roleLabel?: string } }).origin;
    if (origin) origin.roleLabel = label;
  }
  return actor;
}

function members(r: (...k: (string | number)[]) => number, w: Pick<Wayfarer, "party" | "women" | "youth">) {
  const u = r("party");
  const count = u < w.party[0] ? 1 : u < w.party[0] + w.party[1] ? 2 : 3;
  return Array.from({ length: count }, (_, i) => {
    const young = i > 0 && r(i, "young") < (w.youth ?? 0);
    return {
      sex: (r(i, "sex") < w.women ? "female" : "male") as "male" | "female",
      age: young ? 8 + Math.floor(r(i, "age") * 9) : 18 + Math.floor(r(i, "age") ** 1.4 * 45),
    };
  });
}

function roadParty(
  world: WorldModel,
  seed: string,
  setting: NonNullable<Pack["setting"]>,
  kinds: readonly Wayfarer[],
  ways: Way[],
  id: string,
  day: number,
  r: (...k: (string | number)[]) => number,
  kit: ReturnType<typeof carryKit>,
): Passing[] | undefined {
  if (ways.length < 2 || !kinds.length) return;
  const kind = pick(kinds, (w) => w.weight, r("kind"));
  // Travellers make for places: a border with a town past it draws more of them.
  const toward = (w: Way) => (w.settlement && w.settlement !== "none" ? 3 : 1);
  const from = pick(ways, toward, r("from"));
  const to = pick(ways.filter((w) => w !== from), toward, r("to"));
  const path = road(world, from, to) ?? joined(from, to);
  if (path.length < 8) return;
  const named = to.name && to.settlement && to.settlement !== "none";
  const cargo = trades(kind) ? cargoOf(setting, from, to) : undefined;
  const origin = from.name && from.settlement && from.settlement !== "none" ? ` from ${from.name}` : "";
  const label = named && kind.going
    ? GOODS.test(kind.going)
      ? kind.going.replace("{to}", to.name!).replace(GOODS, cargo ? `${cargo}${origin}` : "goods")
      : `${kind.going.replace("{to}", to.name!)}${cargo && !/small goods/.test(kind.going) ? `, carrying ${cargo}` : ""}`
    : kind.doing;
  // A seller stops where there are buyers: the place on this map, if the road
  // passes near it.
  let stopAt = Math.floor(path.length * (0.35 + r("halt") * 0.3));
  let stopLabel = kind.halt === "trade" ? "Showing their goods" : kind.halt === "talk" ? "Stopping to talk" : "Resting by the road";
  const town = world.settlements[0];
  if (kind.halt === "trade" && town) {
    let best = Infinity;
    path.forEach((p, i) => {
      const d = Math.hypot(p.x - town.x, p.y - town.y);
      if (d < best) [best, stopAt] = [d, i];
    });
    // A camp or hamlet is named after the map, which is no name to say.
    const named = town.name !== setting.playableMap?.name && !/ km /.test(town.name);
    if (best < town.size + 12) stopLabel = named ? `Selling at ${town.name}` : "Selling to the people here";
  }
  const stop = kind.halt && {
    activity: (kind.halt === "rest" ? "warm" : "visit") as StationActivity,
    label: stopLabel,
    minutes: (kind.halt === "trade" ? 40 : 15) + r("minutes") * 40,
  };
  const carry = kind.carry && kit[kind.carry];
  const pace = PACE / (kind.speed ?? 1);
  const arrive = (6 + r("arrive") * 10) * 60;
  /** `lag` tiles behind whoever leads, and halting that much short of them. */
  const walk = (lag: number) => {
    const halt = Math.max(1, stopAt - lag);
    const start = day * DAY_MINUTES + arrive + lag * pace;
    const itinerary = journey(
      stop
        ? [
            { path: path.slice(0, halt + 1), label, carry },
            { path: [path[halt]], label, carry, stop },
            { path: path.slice(halt), label, carry },
          ]
        : [{ path, label, carry }],
      start,
      pace,
    );
    return { itinerary, done: start + itinerary.segments[itinerary.segments.length - 1].from };
  };
  const party = members(r, kind);
  const beast = kind.animal;
  const known =
    beast &&
    faunaProfiles.find((p) => p.id === beast.species)?.presence.some((scope) => matchesCharacterScope(scope, setting, "*"));
  const animals = known
    ? Array.from({ length: beast.count[0] + Math.floor(r("animals") * (beast.count[1] - beast.count[0] + 1)) }, (_, k) =>
        walk(2 * party.length + k).itinerary,
      )
    : [];
  return party.map((m, i) => {
    const { itinerary, done } = walk(2 * i);
    const actor = person(seed, setting, `${id}-${i}`, kind.dress, kind.label, m.sex, m.age, path[0], (done + 10) * 60);
    if (i || !animals.length) return { actor, itinerary };
    actor.wayfarer!.train = { species: beast!.species, count: animals.length };
    return { actor, itinerary, animals };
  });
}

function wildParty(
  world: WorldModel,
  seed: string,
  setting: NonNullable<Pack["setting"]>,
  context: ReturnType<typeof resolveCharacterContext> | undefined,
  ways: Way[],
  id: string,
  day: number,
  r: (...k: (string | number)[]) => number,
  kit: ReturnType<typeof carryKit>,
): Passing[] | undefined {
  if (!context) return;
  const sex = r("sex") < 0.5 ? "female" : "male";
  const open = workAt(context, "wild", sex);
  if (!open.length) return;
  const work = pick(open, (l) => l.weight ?? 1, r("work"));
  const livelihood = characterLivelihood(setting, seed, `${id}-0`, work.id, context, sex);
  const home = pick(ways, () => 1, r("from"));
  // In from the border a way, then off the path into the kind of country the
  // work wants.
  const inward = [...home.path].reverse();
  if (inward.length < 30) return;
  const turn = inward[Math.min(inward.length - 1, 20 + Math.floor(r("depth") * 60))];
  const wants = COVER.find(([re]) => re.test(work.id))?.[1] ?? ["woodland", "scrub", "open-grass"];
  let site: Point | undefined;
  for (let i = 0; i < 24 && !site; i++) {
    const a = r("site", i, "a") * Math.PI * 2,
      d = 8 + r("site", i, "d") * 18;
    const p = { x: Math.round(turn.x + Math.cos(a) * d), y: Math.round(turn.y + Math.sin(a) * d) };
    if (world.blocked(p.x, p.y, "outside")) continue;
    const tags = habitatTagsAt(world, p.x, p.y);
    if (tags.has("field") || tags.has("settlement")) continue;
    if (i < 16 && !wants.some((t) => tags.has(t as never))) continue;
    site = p;
  }
  if (!site) return;
  const there = across(world, turn, site);
  if (!there) return;
  const back = [...there].reverse();
  const to = inward.slice(0, inward.indexOf(turn) + 1);
  const named = home.name && home.settlement && home.settlement !== "none";
  const working = livelihood.activity ?? work.activity;
  const carry = /wood|timber|charcoal/.test(work.id) ? "wood" : kit.basket;
  const hours = 2.5 + r("hours") * 2.5;
  const arrive = (6.5 + r("arrive") * 3) * 60;
  const kind = { party: [0.55, 0.35, 0.1] as const, women: livelihood.sex === "male" ? 0 : livelihood.sex === "female" ? 1 : 0.4, youth: 0.3 };
  return members(r, kind).map((m, i) => {
    const start = day * DAY_MINUTES + arrive + 2 * i * PACE;
    // Each works a few paces from the others.
    const spot = { x: site!.x + (i % 2 ? 2 : -2) * Math.sign(i), y: site!.y + (i === 2 ? 2 : 0) };
    const stand = world.blocked(spot.x, spot.y, "outside") ? site! : spot;
    const itinerary = journey(
      [
        { path: to, label: `Walking out ${named ? `from ${home.name} ` : ""}to work` },
        { path: [...there.slice(0, -1), stand], label: "Walking out to work", stop: { activity: "gather", label: working, minutes: hours * 60 } },
        { path: [stand, ...back.slice(1)], label: named ? `Walking home to ${home.name}` : "Walking home", carry },
        { path: [...to].reverse(), label: named ? `Walking home to ${home.name}` : "Walking home", carry },
      ],
      start,
      PACE,
    );
    const done = itinerary.segments[itinerary.segments.length - 1].from;
    const actor = person(seed, setting, `${id}-${i}`, livelihood.id, livelihood.label, m.sex, m.age, to[0], (start + done + 10) * 60);
    return { actor, itinerary };
  });
}
