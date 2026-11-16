import type { Area, AreaThing } from "../world/complex";
import type { CaveLevel, CaveSite } from "../world/cave";
import type { SewerLevel, SewerSite } from "../world/sewer";
import { caveAct, caveGround, caveInspect, caveLevelOf, caveTime, caveVerb, type CaveRun } from "./cave";
import { sewerAct, sewerGround, sewerInspect, sewerLevelOf, sewerTime, sewerVerb, type SewerRun } from "./sewer";
import type { FolkHost } from "./tunnel-folk";
import type { GameEvent, Snapshot as GameState, Position, Point, WorldModel } from "./types";

/** The trip through a complex the player is on. */
export type ComplexRun = CaveRun | SewerRun;
/** What a complex remembers between visits: how far in, what was taken, what was killed. */
export type ComplexRecord = { deepest: number; done: string[]; slain: string[] };

export type ComplexHost = {
  state: GameState;
  world: WorldModel;
  event(text: string, kind?: GameEvent["kind"], at?: Position): void;
  advance(seconds: number): void;
  hurt(damage: number, cause: string, injury?: string): void;
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
    if (thing.solid && !f.keeps) {
      c.solid.delete(thing.y * level.w + thing.x);
      h.unblock(level.space, thing.x, thing.y);
    }
  }
  if (f.heal) p.health = Math.min(100, (p.health ?? 100) + f.heal);
  h.event(`${f.text}${got.length ? ` You take ${got.join(", ")}.` : ""}`, f.tier === "prize" || f.tier === "notable" ? "world" : "action");
}

const isCave = (space: string) => space.startsWith("cave:");
const isTunnel = (space: string) => space.startsWith("sewer:") || space.startsWith("mine:");

/** The area a space is, in whichever complex. */
export function complexArea(h: ComplexHost, space: string): Area | undefined {
  return isCave(space) ? caveLevelOf(h, space)?.level : isTunnel(space) ? sewerLevelOf(h, space)?.level : undefined;
}

/** Whether a cell of a complex's area is closed to feet; undefined when the space is not one. */
export function complexGround(h: ComplexHost, space: string, x: number, y: number) {
  return isCave(space) ? caveGround(h, space, x, y) : isTunnel(space) ? sewerGround(h, space, x, y) : undefined;
}

/** What the action key does at a way in, or beside something inside. */
export function complexVerb(h: ComplexHost) {
  const run = h.state.complex, outside = h.state.player.pos.space === "outside";
  return (outside || run?.kind === "cave" ? caveVerb(h) : undefined) ?? (outside || (run && run.kind !== "cave") ? sewerVerb(h) : undefined);
}

export function complexInspect(h: ComplexHost, id: string) {
  return id.startsWith("cave-") ? caveInspect(h, id) : id.startsWith("sewer-") ? sewerInspect(h, id) : undefined;
}

export function complexAct(h: ComplexHost, id: string) {
  const cave = id.startsWith("cave-") || (id.startsWith("folk-") && h.state.complex?.kind === "cave");
  return cave ? caveAct(h, id) : sewerAct(h, id);
}

export function complexTime(h: ComplexHost, elapsed: number) {
  const run = h.state.complex;
  if (run?.kind === "cave") caveTime(h, elapsed);
  else if (run) sewerTime(h, elapsed);
}
