import type { Engine } from "../core/engine";
import { forageTable, TIRED } from "../core/intents";
import { forageByCover, forageByTerrain } from "../content/ecology/forage";
import { findPath } from "../core/pathfinding";
import { distance, type Actor, type ItemId, type Place, type Point } from "../core/types";
import { doorApproach, doorId } from "../core/doors";

/**
 * Something the player has been set to do that outlasts one command: roam and
 * gather, walk somewhere far, or put in the day's work. The runtime asks for
 * the next step whenever its route runs out; every step is still an ordinary
 * command, so the record and the replay are unchanged.
 */
export type Plan =
  | { kind: "forage"; item?: ItemId }
  | { kind: "go"; to: Point; label: string }
  | { kind: "workday" }
  | { kind: "roam"; run: boolean }
  | { kind: "seek"; actor: string; label: string };

/** What the runtime should do next: walk a route, run one command, hold
 * still a tick so a pose can be seen, or stop with a line saying why. */
export type Step =
  | { route: Point[] }
  | { command: Parameters<import("./session").Runtime["command"]>[0] }
  | { wait: true }
  | { done: string };

const LEG = 40;
const HOURS_LIGHT = [6, 20];

export class Autopilot {
  private found = 0;
  private legs = 0;
  private stuck = 0;
  private pause = 0;
  private arrived = false;
  private gather = false;
  private visited = new Set<string>();
  private sources?: Point[];
  private start: Record<string, number>;
  private origin: Point;
  constructor(
    readonly plan: Plan,
    private engine: Engine,
  ) {
    this.start = { ...engine.state.player.inventory } as Record<string, number>;
    this.origin = { ...engine.state.player.pos };
  }

  next(): Step {
    const e = this.engine,
      p = e.state.player;
    if (this.pause > 0) {
      this.pause--;
      return { wait: true };
    }
    if (this.stuck > 4) return { done: "You cannot find a way on." };
    if (p.fatigue >= TIRED) return { done: "You are too tired to go on." };
    switch (this.plan.kind) {
      case "go":
        return this.go(this.plan.to, this.plan.label);
      case "forage":
        return this.forage(this.plan.item);
      case "workday":
        return this.work();
      case "roam":
        return this.roam(this.plan.run);
      case "seek":
        return this.seek(this.plan.actor, this.plan.label);
    }
  }
  /** The route the runtime was handed was refused partway. */
  blocked() {
    this.stuck++;
  }

  private go(to: Point, label: string): Step {
    const p = this.engine.state.player.pos;
    if (p.space !== "outside") return this.leave();
    const left = Math.hypot(to.x - p.x, to.y - p.y);
    // Walked past it counts: a leg may end a few cells beyond.
    const past = (to.x - p.x) * (to.x - this.origin.x) + (to.y - p.y) * (to.y - this.origin.y) <= 0;
    if (left <= 2 || past) return { done: `You reach ${label}.` };
    // Long walks go in legs, one search across a whole region being too slow.
    // A leg that ends in a river or a wall swings aside and tries again.
    const k = Math.min(1, LEG / left),
      heading = Math.atan2(to.y - p.y, to.x - p.x);
    for (const turn of k < 1 ? [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3] : [0]) {
      const aim = {
        x: Math.round(p.x + Math.cos(heading + turn) * left * k),
        y: Math.round(p.y + Math.sin(heading + turn) * left * k),
      };
      const route = this.routeNear(aim, k < 1 ? 4 : 2);
      if (route.length) {
        this.stuck = 0;
        return { route };
      }
    }
    return { done: `There is no way through to ${label}.` };
  }

  private forage(item?: ItemId): Step {
    const e = this.engine,
      p = e.state.player;
    if (p.pos.space !== "outside") return this.leave();
    const hour = (e.state.clock / 3600) % 24;
    if (hour < HOURS_LIGHT[0] || hour >= HOURS_LIGHT[1])
      return { done: `It is getting dark. ${this.tally()}` };
    if (p.hunger >= 85) return { done: `You are too hungry to go on. ${this.tally()}` };
    if (this.found >= 12) return { done: `Your hands are full. ${this.tally()}` };

    const plant = e.state.objects.find(
      (o) =>
        o.resource &&
        !o.depleted &&
        !o.owner &&
        (!item || o.resource.item === item) &&
        distance(o.pos, p.pos) <= 2.2,
    );
    if (plant) {
      this.found++;
      this.pause = 2;
      return { command: { type: "interact", target: plant.id, action: "harvest" } };
    }
    if (this.arrived) {
      this.arrived = false;
      // Beat the brush first, if nobody is close enough to take it amiss.
      const alone = !e.state.actors.some(
        (a) => a.kind === "human" && a.id !== "player" && distance(a.pos, p.pos) < 4,
      );
      if (alone) {
        this.gather = true;
        this.pause = 1;
        return { command: { type: "swing" } };
      }
      this.gather = true;
    }
    if (this.gather) {
      this.gather = false;
      const table = forageTable(e, p.pos);
      if (table.size && (!item || table.has(item))) {
        this.found++;
        this.pause = 3;
        return { command: { type: "narrate", intents: [{ type: "forage", item: item ?? "" }] } };
      }
    }

    const nearby = e.state.objects
      .filter(
        (o) =>
          o.resource &&
          !o.depleted &&
          !o.owner &&
          o.pos.space === "outside" &&
          (!item || o.resource.item === item) &&
          distance(o.pos, p.pos) < 30,
      )
      .sort((a, b) => distance(a.pos, p.pos) - distance(b.pos, p.pos))[0];
    if (nearby) {
      const route = this.routeNear(nearby.pos, 1);
      if (route.length) return { route };
    }
    const spot = this.roamSpot(item);
    if (!spot)
      return {
        done: `${this.found ? "There is no more" : "There is no"} ${item ? (e.item(item)?.name.toLowerCase() ?? item) : "gathering"} to be had round here. ${this.tally()}`,
      };
    const route = this.routeNear(spot, 1);
    if (!route.length) {
      this.stuck++;
      return { wait: true };
    }
    this.stuck = 0;
    this.arrived = true;
    return { route };
  }

  /** Goes to a person wherever they are, through their door if they are in. */
  private seek(id: string, label: string): Step {
    const e = this.engine,
      p = e.state.player.pos;
    const a = e.state.actors.find((x) => x.id === id);
    if (!a) return { done: `${label} is nowhere about.` };
    if (a.pos.space === p.space) {
      if (distance(a.pos, p) <= 1.8) return { done: `You find ${label}.` };
      if (p.space === "outside" && distance(a.pos, p) > LEG) return this.go(a.pos, label);
      // A few steps at a time: they may be walking too.
      const route = this.routeNear(a.pos, 1).slice(0, 6);
      if (!route.length) return { done: `You cannot get to ${label}.` };
      return { route };
    }
    if (p.space !== "outside") return this.leave();
    const place = e.world.places.find((pl) => pl.id === a.pos.space);
    if (!place) return { done: `${label} is somewhere you cannot follow.` };
    return this.door(place, label);
  }

  /** Walks to a building's door and goes in. */
  private door(place: Place, label: string): Step {
    const p = this.engine.state.player.pos,
      at = doorApproach(place);
    if (Math.hypot(at.x - p.x, at.y - p.y) > 1.5) {
      const route = this.routeNear(at, 1);
      if (!route.length) return { done: `You cannot get to ${label}.` };
      return { route };
    }
    const shut = this.engine.state.objects.find((o) => o.id === doorId(place) && !o.open);
    if (shut) return { command: { type: "interact", target: shut.id, action: "open" } };
    return { command: { type: "interact", target: place.id, action: "enter" } };
  }

  /** Loops about the ground nearby, for no reason but the going. */
  private roam(run: boolean): Step {
    const e = this.engine,
      p = e.state.player.pos;
    if (this.legs++ >= 6)
      return { done: run ? "You pull up, out of breath." : "You have walked about a while." };
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2,
        r = 5 + Math.random() * 7;
      const x = Math.round(p.x + Math.cos(a) * r),
        y = Math.round(p.y + Math.sin(a) * r);
      if (e.playerBlocked(x, y) || e.world.terrain(x, y, p.space) === "water") continue;
      const route = this.routeNear({ x, y }, 1);
      if (route.length) return { route };
    }
    return { done: "There is no room to move about here." };
  }

  private work(): Step {
    const e = this.engine,
      p = e.state.player;
    const station = e.workStation();
    if (station === "done") return { done: "Today's work is done." };
    if (!station) return { done: "You have no trade to work at here." };
    if (station.pos.space !== p.pos.space) {
      if (p.pos.space !== "outside") return this.leave();
      const place = e.world.places.find((pl) => pl.id === station.pos.space);
      if (!place) return { done: "You cannot get to your work." };
      return this.door(place, "your work");
    }
    if (distance(station.pos, p.pos) > 1.5) {
      const route = this.routeNear(station.pos, 1);
      if (!route.length) return { done: "You cannot get to your work." };
      return { route };
    }
    this.pause = 6;
    return { command: { type: "interact", target: station.id, action: "work" } };
  }

  private leave(): Step {
    const e = this.engine,
      p = e.state.player;
    const exit = e.state.objects.find(
      (o) => o.kind === "exit" && o.pos.space === p.pos.space,
    );
    if (!exit) return { done: "You cannot find the way out." };
    if (distance(exit.pos, p.pos) > 1.5) {
      const route = this.routeNear(exit.pos, 1);
      if (route.length) return { route };
    }
    return { command: { type: "interact", target: exit.id, action: "exit" } };
  }

  /** A spot a short walk off and clear of houses: the nearest ground that
   * gives what is wanted, or anywhere with something to gather. */
  private roamSpot(item?: ItemId): Point | undefined {
    const e = this.engine,
      p = e.state.player.pos;
    if (item) {
      this.sources ??= this.findSources(item);
      const open = this.sources
        .filter((c) => !this.visited.has(`${c.x},${c.y}`) && Math.hypot(c.x - p.x, c.y - p.y) >= 3)
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      const best = open.find((c) => !e.playerBlocked(c.x, c.y));
      if (best) this.visited.add(`${best.x},${best.y}`);
      return best;
    }
    let best: Point | undefined,
      score = 0;
    for (let reach = 8; reach <= 48 && !best; reach *= 2)
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2,
          r = reach * (0.6 + Math.random() * 0.6);
        const x = Math.round(p.x + Math.cos(a) * r),
          y = Math.round(p.y + Math.sin(a) * r);
        if (e.playerBlocked(x, y) || e.world.terrain(x, y) === "water") continue;
        if (this.inTown(x, y)) continue;
        const s = forageTable(e, { x, y, space: "outside" }).size;
        if (s > score) {
          score = s;
          best = { x, y };
        }
      }
    return best;
  }

  /** Every cell near where the errand began whose ground or cover gives the
   * item. Found once: the scan is the slow part of an errand. */
  private findSources(item: ItemId): Point[] {
    const e = this.engine,
      o = this.origin;
    const covers = forageByCover.filter(([, rows]) => rows.some(([id]) => id === item)).map(([re]) => re);
    const grounds = Object.entries(forageByTerrain)
      .filter(([, rows]) => rows!.some(([id]) => id === item))
      .map(([t]) => t);
    const out: Point[] = [];
    for (const t of e.state.objects)
      if (t.kind === "tree" && t.pos.space === "outside" && covers.some((re) => re.test(t.sprite)))
        out.push({ x: t.pos.x, y: t.pos.y + 1 });
    for (let y = o.y - 40; y <= o.y + 40; y += 2)
      for (let x = o.x - 40; x <= o.x + 40; x += 2) {
        const sprite = e.world.decoration(x, y)?.sprite;
        if (grounds.includes(e.world.terrain(x, y)) || (sprite && covers.some((re) => re.test(sprite))))
          out.push({ x, y });
      }
    return out.filter((c) => !this.inTown(c.x, c.y));
  }

  private inTown(x: number, y: number) {
    const pad = 5;
    return this.engine.world.places.some(
      (pl) =>
        x >= pl.x - pad && x < pl.x + pl.w + pad && y >= pl.y - pad && y < pl.y + pl.h + pad,
    );
  }

  /** A route to the spot, or to the nearest open cell within `slack` of it. */
  private routeNear(to: Point, slack: number): Point[] {
    const e = this.engine,
      p = e.state.player.pos;
    const ends: Point[] = [];
    for (let dy = -slack; dy <= slack; dy++)
      for (let dx = -slack; dx <= slack; dx++) ends.push({ x: to.x + dx, y: to.y + dy });
    ends.sort((a, b) => Math.hypot(a.x - to.x, a.y - to.y) - Math.hypot(b.x - to.x, b.y - to.y));
    let tries = 0;
    for (const end of ends) {
      if (e.playerBlocked(end.x, end.y) || (end.x === p.x && end.y === p.y)) continue;
      if (tries++ >= 3) break;
      const path =
        e.state.manifest.simulation === 2
          ? e.findRoute(p, end).path
          : findPath(p, end, (x, y) => e.playerBlocked(x, y));
      if (path.length) return path;
    }
    return [];
  }

  private tally() {
    const inv = this.engine.state.player.inventory as Record<string, number>;
    const got = Object.entries(inv)
      .map(([id, n]) => [id, n - (this.start[id] ?? 0)] as const)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${n} ${this.engine.item(id)?.name.toLowerCase() ?? id}`);
    return got.length ? `You gathered ${got.join(", ")}.` : "You found nothing.";
  }
}

const EDGE = /\b(?:edge|end|border|boundary|limits?) of (?:the )?(?:map|world|land|region)\b/i;
const COMPASS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] } as const;
const GATHER =
  /\b(?:forag\w*|gather\w*|pick(?:ing)?|collect\w*|look(?:ing)? for|search(?:ing)? for|berry|berries)\b/i;
const ROAM =
  /\b(?:(?:run|jog|sprint|walk|wander|stroll|pace|roam|dash)\w* (?:a?round|about)|stretch (?:my|your) legs|go (?:for )?a (?:walk|run|stroll|jog)|^\s*(?:wander|roam|run|jog)\s*$)/i;
const SEEK =
  /^\s*(?:find|look for|search for|go (?:and )?(?:to|see|find)|visit|see|where(?:'s| is))\s+(.+?)[?.!]*\s*$/i;
const KIN: Record<string, SocialRelationKind> = {
  husband: "partner", wife: "partner", spouse: "partner", partner: "partner",
  mother: "parent", father: "parent", mum: "parent", mom: "parent", dad: "parent", parent: "parent",
  son: "child", daughter: "child", child: "child", kid: "child",
  friend: "friend", master: "master", apprentice: "apprentice",
};
type SocialRelationKind = NonNullable<Actor["relations"]>[number]["kind"];

/** The person a phrase names: kin by relation ("my husband"), anyone by name. */
export function personNamed(phrase: string, engine: Engine): Actor | undefined {
  const s = engine.state,
    p = s.player;
  const words = phrase.toLowerCase().split(/[^a-z\u00c0-\u024f]+/).filter((w) => w.length > 1);
  const word = words.find((w) => KIN[w] ?? KIN[w.replace(/s$/, "")]);
  const kin = word && (KIN[word] ?? KIN[word.replace(/s$/, "")]);
  const sex = word && (/^(?:husband|father|dad|son)/.test(word) ? "male" : /^(?:wife|mother|mum|mom|daughter)/.test(word) ? "female" : undefined);
  if (kin) {
    const ids = (p.relations ?? []).filter((r) => r.kind === kin).map((r) => r.other);
    const found = s.actors.find((a) => ids.includes(a.id));
    if (found) return found;
    // Many households record only "co-resident"; guess the kin from age.
    const age = p.age ?? 30;
    const home = (p.relations ?? [])
      .filter((r) => r.kind === "co-resident")
      .map((r) => s.actors.find((a) => a.id === r.other))
      .filter((a): a is Actor => !!a && a.age !== undefined && (!sex || a.origin?.sex === sex));
    const gap = (a: Actor) => a.age! - age;
    const fits =
      kin === "partner"
        ? home.filter((a) => a.age! >= 16 && Math.abs(gap(a)) <= 15).sort((a, b) => Math.abs(gap(a)) - Math.abs(gap(b)))
        : kin === "parent"
          ? home.filter((a) => gap(a) >= 15).sort((a, b) => gap(a) - gap(b))
          : kin === "child"
            ? home.filter((a) => gap(a) <= -15).sort((a, b) => gap(b) - gap(a))
            : [];
    if (fits[0]) return fits[0];
  }
  const named = s.actors.filter(
    (a) =>
      a.kind === "human" &&
      a.id !== "player" &&
      words.some((w) => a.name.toLowerCase().split(/\s+/).includes(w)),
  );
  // Your own people first, then whoever is nearest.
  const mine = new Set((p.relations ?? []).map((r) => r.other));
  return named.sort(
    (a, b) =>
      Number(mine.has(b.id)) - Number(mine.has(a.id)) ||
      Math.hypot(a.pos.x - p.pos.x, a.pos.y - p.pos.y) - Math.hypot(b.pos.x - p.pos.x, b.pos.y - p.pos.y),
  )[0];
}

const WORK =
  /\b(?:(?:go|get|set|back) (?:to|about) work|work (?:for )?(?:the|all) day|day'?s work|do (?:my|the|some) (?:job|work|chores|tasks)|(?:my|the) (?:trade|daily tasks|chores)|^\s*work\s*$)/i;

/** Reads a typed line as a plan, or returns undefined to let the narrator
 * have it. Keywords only; a model can stand in front of this later. */
export function parsePlan(input: string, engine: Engine): Plan | undefined {
  const seek = SEEK.exec(input);
  const who = seek && personNamed(seek[1], engine);
  if (who) return { kind: "seek", actor: who.id, label: who.name };
  if (WORK.test(input)) return { kind: "workday" };
  const edge = EDGE.test(input);
  const heading = (Object.keys(COMPASS) as (keyof typeof COMPASS)[]).find((d) =>
    new RegExp(`\\b(?:go|walk|head|travel|wander)\\b.*\\b${d}\\b|\\b${d}\\b.*\\bedge\\b`, "i").test(input),
  );
  if (edge || (heading && !GATHER.test(input))) return edgePlan(engine, heading);
  if (GATHER.test(input)) return { kind: "forage", item: wantedItem(input, engine) };
  if (ROAM.test(input)) return { kind: "roam", run: /\b(?:run|jog|sprint|dash)/i.test(input) };
  return undefined;
}

/** A walk to one edge of the playable map, or the nearest edge. */
export function edgePlan(engine: Engine, heading?: keyof typeof COMPASS): Plan {
  const p = engine.state.player.pos;
  const half =
    (engine.world.pack.setting?.playableMap?.size ?? 2 * (engine.world.regionExtent ?? 320)) / 2 - 3;
  const dir =
    heading ??
    (Object.entries({
      west: p.x + half,
      east: half - p.x,
      north: p.y + half,
      south: half - p.y,
    }).sort((a, b) => a[1] - b[1])[0][0] as keyof typeof COMPASS);
  const [dx, dy] = COMPASS[dir];
  return {
    kind: "go",
    to: { x: dx ? dx * half : p.x, y: dy ? dy * half : p.y },
    label: `the ${dir}ern edge of the land`,
  };
}

/** The plan a narrator turn asked for, if it names one the world allows. */
export function planOf(
  errand: NonNullable<import("./schema").NarratorReply["errand"]>,
  engine: Engine,
): Plan | undefined {
  switch (errand.kind) {
    case "roam":
      return { kind: "roam", run: !!errand.run };
    case "workday":
      return { kind: "workday" };
    case "forage":
      return { kind: "forage", item: errand.item && engine.item(errand.item) ? errand.item : undefined };
    case "seek": {
      const who =
        engine.state.actors.find((a) => a.id === errand.target) ??
        (errand.target ? personNamed(errand.target, engine) : undefined);
      return who && { kind: "seek", actor: who.id, label: who.name };
    }
    case "go": {
      if (errand.direction) return edgePlan(engine, errand.direction);
      const place = engine.world.places.find((pl) => pl.id === errand.target);
      if (place) return { kind: "go", to: doorApproach(place), label: place.name };
      const seen = errand.target ? engine.inspect(errand.target) : undefined;
      if (seen?.pos.space === "outside") return { kind: "go", to: seen.pos, label: seen.name ?? "it" };
      return undefined;
    }
  }
}

function wantedItem(input: string, engine: Engine): ItemId | undefined {
  const words = input.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const stems = (w: string) => [w, w.replace(/ies$/, "y"), w.replace(/(?:es|s)$/, "")];
  const ids = new Set<string>([
    ...Object.keys(engine.items),
    ...engine.state.objects.flatMap((o) => (o.resource ? [o.resource.item] : [])),
  ]);
  for (const w of words)
    for (const id of ids) {
      const name = engine.item(id)?.name.toLowerCase() ?? id;
      const last = name.split(" ").at(-1)!;
      if (stems(w).some((s) => s === id || s === last || s === name)) return id;
    }
  return undefined;
}
