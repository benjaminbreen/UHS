import { propDefs } from "../content/props/catalog";
import { caveLight } from "../content/caves";
import { arrivalFrom, landing, N4, type Area, type AreaThing } from "../world/complex";
import type { CaveLevel, CaveSite } from "../world/cave";
import type { SewerLevel, SewerSite } from "../world/sewer";
import { fairAct, fairGround, fairInspect, fairLevelOf, fairTime, fairVerb, type FairRun } from "./fair";
import { caveAct, caveGround, caveInspect, caveLevelOf, caveTime, caveVerb, type CaveRun } from "./cave";
import { sewerAct, sewerGround, sewerInspect, sewerLevelOf, sewerTime, sewerVerb, type SewerRun } from "./sewer";
import { tombAct, tombGround, tombInspect, tombLevelOf, tombTime, tombVerb, type TombRun } from "./tomb";
import { prisonAct, prisonGround, prisonInspect, prisonLevelOf, prisonTime, prisonVerb, type PrisonRun } from "./prison";
import { folkArrive, type FolkHost } from "./tunnel-folk";
import type { CueKind } from "./combat";
import type { GameEvent, Snapshot as GameState, Position, Point, WorldModel } from "./types";

/** The trip through a complex the player is on. */
export type ComplexRun = CaveRun | SewerRun | FairRun | TombRun | PrisonRun;
/** What a complex remembers between visits: how far in, what was taken, what was killed, which areas were walked. */
export type ComplexRecord = { deepest: number; done: string[]; slain: string[]; seen?: string[]; /** Areas whose props have been put in the world. */ stocked?: string[] };
/** An area as the game holds it: the level, and the cells closed to feet right now. */
export type Cached<L extends Area = Area> = { level: L; solid: Set<number> };

export type ComplexHost = {
  state: GameState;
  world: WorldModel;
  event(text: string, kind?: GameEvent["kind"], at?: Position): void;
  advance(seconds: number): void;
  hurt(damage: number, cause: string, injury?: import("../content/health/injuries").InjuryId): void;
  cue?(who: string, kind: CueKind, toward?: Point): void;
  say?(who: string, text: string): void;
  itemName(id: string): string;
  /** Forget what was known about a cell's collision. */
  unblock(space: string, x: number, y: number): void;
  /** How hard it is raining in the open, 0 to 1. */
  rain(): number;
  folk: FolkHost;
  /** In the middle of the day's work, when nothing new should start. */
  busy(): boolean;
  /** A line kept for the evening's account of the day. */
  remember(line: string): void;
  caveSites: Map<string, CaveSite | null>;
  caveLevels: Map<string, { level: CaveLevel; solid: Set<number> }>;
  sewerSites: Map<string, SewerSite>;
  sewerLevels: Map<string, { level: SewerLevel; solid: Set<number> }>;
  /** Areas of the kinds that need only the seed and the space: fairs, tombs. */
  areas: Map<string, Cached>;
};

/** A complex's record, by its kind and site: "cave:12,-4". */
export const complexRecord = (state: GameState, key: string) => ((state.complexes ??= {})[key] ??= { deepest: 1, done: [], slain: [] });

/** The best of `options` for the action key: the cell faced, then the one stood on, then the nearest. */
export function nearest(p: GameState["player"], options: [Point, string, number?][]) {
  const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.direction];
  const front = { x: p.pos.x + d[0], y: p.pos.y + d[1] };
  const score = (q: Point) => (q.x === front.x && q.y === front.y ? 0 : q.x === p.pos.x && q.y === p.pos.y ? 0.5 : 1 + Math.hypot(q.x - p.pos.x, q.y - p.pos.y));
  return options.map(([q, id, bias = 0]) => [score(q) + bias, id] as const).sort((a, b) => a[0] - b[0])[0]?.[1];
}

type Find = { time?: number; text: string; heal?: number; keeps?: boolean; fuel?: number; tier: string };

/** Taking or using a find: loot to the pack, the find marked done, a solid one out of the way. */
export function takeFind(h: ComplexHost, run: ComplexRun, c: { level: Area; solid: Set<number> }, thing: AreaThing, f: Find, done: string[], first: { refuel(fuel: number): void; taken?(): void }) {
  const p = h.state.player, { level } = c;
  const again = done.includes(thing.id);
  h.advance(f.time ?? 30);
  if (again && !f.heal) return void h.event(f.text);
  const got: string[] = [];
  if (!again) {
    for (const [item, n] of Object.entries(thing.loot)) {
      if (!n) continue;
      p.inventory[item] = (p.inventory[item] ?? 0) + n;
      got.push(`${n} ${h.itemName(item).toLowerCase()}`);
    }
    if (f.fuel) first.refuel(f.fuel);
    done.push(thing.id);
    if (Object.keys(thing.loot).length) first.taken?.(), (run.took = { at: { x: thing.x, y: thing.y }, items: { ...thing.loot }, clock: h.state.clock });
    if (thing.solid && !f.keeps)
      for (let y = thing.y; y < thing.y + (thing.h ?? 1); y++) for (let x = thing.x; x < thing.x + (thing.w ?? 1); x++) {
        c.solid.delete(y * level.w + x);
        h.unblock(level.space, x, y);
      }
  }
  if (f.heal) p.health = Math.min(100, (p.health ?? 100) + f.heal);
  h.event(`${f.text}${got.length ? ` You take ${got.join(", ")}.` : ""}`, f.tier === "prize" || f.tier === "notable" ? "world" : "action");
}

/** An area built once from its space and kept. */
export function cachedArea<L extends Area>(h: ComplexHost, space: string, build: () => L | undefined, solid: (level: L) => Set<number>): Cached<L> | undefined {
  const known = h.areas.get(space) as Cached<L> | undefined;
  if (known) return known;
  const level = build();
  if (!level) return undefined;
  const entry = { level, solid: solid(level) };
  h.areas.set(space, entry);
  return entry;
}

/** Puts the player in an area: beside the exit or lift that leads back to `from`, or at its entry.
 * The complex's record, by `key`, notes the area as walked. */
export function arriveIn(h: ComplexHost, level: Area, key: string, from?: string) {
  const p = h.state.player;
  const lift = from ? level.lifts?.find((l) => l.to === from) : undefined;
  const spot = lift ? landing(lift, (x, y) => complexGround(h, level.space, x, y), level.entry) : (from && arrivalFrom(level, from)) || level.entry;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...spot, space: level.space };
  if (lift) p.direction = 2;
  const rec = complexRecord(h.state, key);
  if (!(rec.seen ??= []).includes(level.space)) rec.seen.push(level.space);
  if (level.props?.length && !(rec.stocked ??= []).includes(level.space)) {
    rec.stocked.push(level.space);
    level.props.forEach((q, i) => {
      const def = propDefs[q.key];
      if (def) h.state.objects.push({ id: `${level.space}:prop${i}`, prop: q.key, name: def.name, kind: "container", sprite: q.sprite, description: q.description, inventory: { ...def.contents }, open: false, pos: { x: q.x, y: q.y, space: level.space } });
    });
  }
  folkArrive(h.folk, level.space, level.folk);
}

/** What is in reach in an area: its lifts as `<kind>-lift:<n>`, its things as `<kind>-thing:<id>`. */
export function areaTarget(p: GameState["player"], level: Area, kind: string, skip?: (t: AreaThing) => boolean) {
  const options: [Point, string, number?][] = [];
  level.lifts?.forEach((l, i) => void (Math.max(Math.abs(l.x - p.pos.x), Math.abs(l.y - p.pos.y)) <= 1 && options.push([l, `${kind}-lift:${i}`, -0.2])));
  for (const t of level.things) {
    if (skip?.(t)) continue;
    const across = p.pos.x >= t.x - 1 && p.pos.x <= t.x + (t.w ?? 1);
    if (t.wall ? across && p.pos.y === t.y + 1 : across && p.pos.y >= t.y - 1 && p.pos.y <= t.y + (t.h ?? 1)) options.push([t, `${kind}-thing:${t.id}`]);
  }
  return nearest(p, options);
}

/** A carried light burning down. Says so once when a fifth is left, and when it goes out. */
export function burnLight(h: ComplexHost, run: { light: string; left: number; low?: boolean }, elapsed: number, out: string, low: (flame: boolean) => string) {
  if (run.left <= 0) return;
  const light = caveLight(run.light);
  run.left -= elapsed;
  if (run.left <= 0) {
    run.left = 0;
    h.event(`${light.out} ${out}`.trim());
  } else if (!run.low && run.left < light.burns * 0.2) {
    run.low = true;
    h.event(low(light.flame));
  }
}

type Kind = {
  /** Its spaces start "<space>:"; its things' ids start "<id>-"; its runs have one of these kinds. */
  spaces: readonly string[];
  id: string;
  runs: readonly ComplexRun["kind"][];
  /** Has ways in from the open world that the action key should find. */
  outside?: boolean;
  /** The record key and the first area of the run, for kinds with a map. */
  root?(run: ComplexRun): { key: string; space: string; title: string } | undefined;
  area(h: ComplexHost, space: string): Cached | undefined;
  ground(h: ComplexHost, space: string, x: number, y: number): boolean | undefined;
  verb(h: ComplexHost): { label: string; target: string } | undefined;
  inspect(h: ComplexHost, id: string): ReturnType<typeof caveInspect>;
  act(h: ComplexHost, id: string): void;
  time(h: ComplexHost, elapsed: number): void;
};
/** Every kind of complex. A new one is a row here, a generator in `world/`, and a view. */
const KINDS: readonly Kind[] = [
  {
    spaces: ["tomb"], id: "tomb", runs: ["tomb"], outside: true, area: (h, s) => tombLevelOf(h, s), ground: (h, s, x, y) => tombGround(h, s, x, y), verb: (h) => tombVerb(h), inspect: (h, id) => tombInspect(h, id), act: (h, id) => tombAct(h, id), time: (h, t) => tombTime(h, t),
    root: (run) => (run.kind === "tomb" ? { key: `tomb:${run.site}`, space: run.entry, title: run.name } : undefined),
  },
  { spaces: ["cave"], id: "cave", runs: ["cave"], outside: true, area: (h, s) => caveLevelOf(h, s), ground: (h, s, x, y) => caveGround(h, s, x, y), verb: (h) => caveVerb(h), inspect: (h, id) => caveInspect(h, id), act: (h, id) => caveAct(h, id), time: (h, t) => caveTime(h, t) },
  { spaces: ["sewer", "mine"], id: "sewer", runs: ["sewer", "mine"], outside: true, area: (h, s) => sewerLevelOf(h, s), ground: (h, s, x, y) => sewerGround(h, s, x, y), verb: (h) => sewerVerb(h), inspect: (h, id) => sewerInspect(h, id), act: (h, id) => sewerAct(h, id), time: (h, t) => sewerTime(h, t) },
  {
    spaces: ["fair"], id: "fair", runs: ["fair"], area: (h, s) => fairLevelOf(h, s), ground: (h, s, x, y) => fairGround(h, s, x, y), verb: (h) => fairVerb(h), inspect: (h, id) => fairInspect(h, id), act: (h, id) => fairAct(h, id), time: (h) => fairTime(h),
    root: (run) => (run.kind === "fair" ? { key: `fair:${run.fair}`, space: run.entry, title: run.name } : undefined),
  },
  {
    spaces: ["prison"], id: "prison", runs: ["prison"], area: (h, s) => prisonLevelOf(h, s), ground: (h, s, x, y) => prisonGround(h, s, x, y), verb: (h) => prisonVerb(h), inspect: (h, id) => prisonInspect(h, id), act: (h, id) => prisonAct(h, id), time: (h) => prisonTime(h),
    root: (run) => (run.kind === "prison" ? { key: `prison:${run.site}`, space: run.entry, title: run.name } : undefined),
  },
];
const ofSpace = (space: string) => KINDS.find((k) => k.spaces.some((s) => space.startsWith(`${s}:`)));
const ofId = (id: string) => KINDS.find((k) => id.startsWith(`${k.id}-`));
const ofRun = (h: ComplexHost) => KINDS.find((k) => h.state.complex && k.runs.includes(h.state.complex.kind));

/** Whether an id names something in a complex. */
export const isComplexId = (id: string) => !!ofId(id);

/** The area a space is, in whichever complex. */
export function complexArea(h: ComplexHost, space: string): Area | undefined {
  return ofSpace(space)?.area(h, space)?.level;
}

/** The area a space is, for the kinds walked from area to area by their exits: a fair, a tomb. */
export function walkedArea(h: ComplexHost, space: string) {
  const kind = ofSpace(space);
  return kind?.root ? kind.area(h, space)?.level : undefined;
}

/** Whether a cell of a complex's area is closed to feet; undefined when the space is not one. */
export function complexGround(h: ComplexHost, space: string, x: number, y: number) {
  return ofSpace(space)?.ground(h, space, x, y);
}

/** What the action key does at a way in, or beside something inside. */
export function complexVerb(h: ComplexHost) {
  if (h.state.player.pos.space !== "outside") return ofRun(h)?.verb(h);
  for (const k of KINDS) {
    const verb = k.outside && k.verb(h);
    if (verb) return verb;
  }
}

export function complexInspect(h: ComplexHost, id: string) {
  return ofId(id)?.inspect(h, id);
}

export function complexAct(h: ComplexHost, id: string) {
  (ofId(id) ?? ofRun(h) ?? KINDS.find((k) => k.id === "sewer")!).act(h, id);
}

export function complexTime(h: ComplexHost, elapsed: number) {
  ofRun(h)?.time(h, elapsed);
}

export type ComplexMap = {
  title: string;
  /** Areas walked, and the unwalked ones their ways lead to. Small ones are indoors, or up or down. */
  nodes: { space: string; name: string; x: number; y: number; seen: boolean; here: boolean; small: boolean }[];
  links: [number, number][];
};

/** The map of the complex the player is in, as far as they have walked it: each
 * area set out by the side its way leaves from. Undefined for kinds that are a
 * plain stack of levels. */
export function complexMap(h: ComplexHost): ComplexMap | undefined {
  const run = h.state.complex, root = run && ofRun(h)?.root?.(run);
  if (!root) return undefined;
  const seen = new Set(complexRecord(h.state, root.key).seen), here = h.state.player.pos.space;
  const nodes: ComplexMap["nodes"] = [], links: [number, number][] = [];
  const index = new Map<string, number>(), taken = new Set<string>();
  const add = (space: string, name: string, x: number, y: number, small: boolean) => {
    index.set(space, nodes.length);
    taken.add(`${x},${y}`);
    nodes.push({ space, name, x, y, seen: seen.has(space), here: space === here, small });
    return nodes.length - 1;
  };
  const start = seen.has(root.space) ? root.space : here;
  add(start, complexArea(h, start)?.name ?? "", 0, 0, false);
  for (let q = 0; q < nodes.length; q++) {
    const n = nodes[q], level = n.seen ? complexArea(h, n.space) : undefined;
    if (!level) continue;
    const ways: { to: string; name: string; step: readonly [number, number]; small: boolean }[] = [];
    for (const e of level.exits ?? []) {
      if (e.to === "outside") continue;
      const edge = e.x === 0 || e.y === 0 || e.x + e.w === level.w || e.y + e.h === level.h;
      const [dx, dy] = N4[(e.inward + 2) % 4];
      ways.push({ to: e.to, name: e.name, step: edge ? [dx * 2, dy * 2] : [0, -1], small: !edge });
    }
    for (const l of level.lifts ?? []) ways.push({ to: l.to, name: "", step: l.up ? [1, -1] : [1, 1], small: true });
    for (const way of ways) {
      let i = index.get(way.to);
      if (i === undefined) {
        // The first free place that way; a small one may also sit to either side.
        let x = n.x + way.step[0], y = n.y + way.step[1];
        for (let k = 1; taken.has(`${x},${y}`); k++) {
          if (way.small) x = n.x + way.step[0] + (k % 2 ? 1 : -1) * Math.ceil(k / 2);
          else (x += Math.sign(way.step[0])), (y += Math.sign(way.step[1]));
        }
        i = add(way.to, way.name || (seen.has(way.to) ? complexArea(h, way.to)?.name ?? "" : ""), x, y, way.small || n.small);
      }
      if (!links.some(([a, b]) => (a === q && b === i) || (a === i && b === q))) links.push([q, i]);
    }
  }
  return { title: root.title, nodes, links };
}
