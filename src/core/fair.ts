import { fairById, fairFind, type Fair } from "../content/fairs";
import { arrivalFrom, exitAt, landing } from "../world/complex";
import { fairLevel, fairSolid, fairSpace, fairWalkable, parseFairSpace, type FairLevel } from "../world/fair";
import { complexRecord, nearest, takeFind, type ComplexHost } from "./complex";
import { folkArrive, folkTime } from "./tunnel-folk";
import type { Inspection, Inventory, Point } from "./types";

/** A day at a fair: which one, and the street cell the player came in from. */
export type FairRun = { kind: "fair"; fair: string; out: Point; took?: { at: Point; items: Inventory; clock: number } };

export const fairRun = (h: ComplexHost) => (h.state.complex?.kind === "fair" ? h.state.complex : undefined);
const cheb = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export function fairLevelOf(h: ComplexHost, space: string) {
  const known = h.fairLevels.get(space);
  if (known) return known;
  const at = parseFairSpace(space), fair = at && fairById(at.fair);
  const level = fair && fairLevel(h.state.manifest.seed, fair, at.area);
  if (!level) return undefined;
  const entry = { level, solid: fairSolid(level) };
  h.fairLevels.set(space, entry);
  return entry;
}

export function fairGround(h: ComplexHost, space: string, x: number, y: number) {
  const c = fairLevelOf(h, space);
  if (!c) return undefined;
  const { level, solid } = c;
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  return !fairWalkable(level.cells[y * level.w + x]) || solid.has(y * level.w + x);
}

function arrive(h: ComplexHost, space: string, from?: string) {
  const c = fairLevelOf(h, space), p = h.state.player;
  if (!c) return undefined;
  const { level } = c, blocked = (x: number, y: number) => fairGround(h, space, x, y);
  const lift = from && level.lifts.find((l) => l.to === from);
  const spot = lift ? landing(lift, blocked, level.entry) : (from && arrivalFrom(level, from)) || level.entry;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...spot, space };
  p.direction = lift ? 2 : p.direction;
  folkArrive(h.folk, space, level.folk);
  return level;
}

/** In at the gate, paying unless `free`. */
export function fairEnter(h: ComplexHost, fair: Fair, free = false) {
  const p = h.state.player;
  if (!free && (p.inventory.coin ?? 0) < fair.ticket) return void h.event(`A franc at the turnstile, and you don't have it.`);
  if (!free) p.inventory.coin = (p.inventory.coin ?? 0) - fair.ticket;
  h.state.complex = { kind: "fair", fair: fair.id, out: { x: p.pos.x, y: p.pos.y } };
  const level = arrive(h, fairSpace(fair.id, fair.entry));
  if (!level) return void delete h.state.complex;
  complexRecord(h.state, `fair:${fair.id}`);
  h.event(`${free ? "" : "You push through the turnstile. "}${fair.name}: ${level.name}, and the crowd, and the Tower over everything.`, "world");
}

function leave(h: ComplexHost) {
  const run = fairRun(h)!, p = h.state.player;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...run.out, space: "outside" };
  delete h.state.complex;
  h.event("You go out through the gate into the ordinary street.");
}

const thingOf = (level: FairLevel, id: string) => level.things.find((t) => `fair-thing:${t.id}` === id);

function targetNear(h: ComplexHost) {
  const run = fairRun(h), p = h.state.player, c = run && fairLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const options: [Point, string, number?][] = [];
  c.level.lifts.forEach((l, i) => void (cheb(l, p.pos) <= 1 && options.push([l, `fair-lift:${i}`, -0.2])));
  for (const t of c.level.things) {
    const near = t.wall ? p.pos.y === t.y + 1 && p.pos.x >= t.x - 1 && p.pos.x <= t.x + (t.w ?? 1) : p.pos.x >= t.x - 1 && p.pos.x <= t.x + (t.w ?? 1) && p.pos.y >= t.y - 1 && p.pos.y <= t.y + (t.h ?? 1);
    if (near) options.push([t, `fair-thing:${t.id}`]);
  }
  return nearest(p, options);
}

export function fairInspect(h: ComplexHost, id: string): Inspection | undefined {
  const p = h.state.player, c = fairRun(h) && fairLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c;
  const act = (label: string, enabled = true, reason?: string) => ({ label, enabled, reason, command: { type: "interact" as const, target: id, action: "complex" as const } });
  const lift = /^fair-lift:(\d+)$/.exec(id);
  if (lift) {
    const l = level.lifts[Number(lift[1])];
    if (!l) return undefined;
    const to = fairLevelOf(h, l.to)?.level.name ?? "the next platform";
    const ticket = level.area === "tower" && (p.inventory["tower-ticket"] ?? 0) < 1;
    return {
      id, name: l.up ? "Lift up" : "Lift down", kind: "place", pos: { x: l.x, y: l.y, space: level.space },
      description: l.up ? `A lift car on its rails, climbing the curve of the leg to ${to}. An operator stands at the gate.` : `The car down to ${to}.`,
      affordances: [act(l.up ? `Ride up to ${to}` : `Ride down to ${to}`, !ticket, "You need a ticket from the office")],
    };
  }
  const thing = thingOf(level, id), f = thing && fairFind(thing.find);
  if (!thing || !f) return undefined;
  const done = complexRecord(h.state, `fair:${level.fair}`).done.includes(thing.id);
  const broke = !!f.price && (p.inventory.coin ?? 0) < f.price;
  const spent = done && !f.keeps && !f.price;
  return {
    id, name: thing.name, kind: "object", pos: { x: thing.x, y: thing.wall ? thing.y + 1 : thing.y, space: level.space },
    description: `${f.look}${f.price ? ` ${f.price} franc${f.price === 1 ? "" : "s"}.` : ""}`,
    affordances: spent ? [] : [act(f.verb, !broke, "Not enough money")],
  };
}

export function fairVerb(h: ComplexHost) {
  const id = targetNear(h), offer = id ? fairInspect(h, id)?.affordances[0] : undefined;
  return offer?.enabled && offer.command.type === "interact" ? { label: offer.label, target: offer.command.target } : undefined;
}

export function fairAct(h: ComplexHost, id: string) {
  const run = fairRun(h), p = h.state.player, c = run && fairLevelOf(h, p.pos.space);
  if (!run || !c) return;
  const { level } = c;
  const lift = /^fair-lift:(\d+)$/.exec(id);
  if (lift) {
    const l = level.lifts[Number(lift[1])];
    if (!l) return;
    if (level.area === "tower") {
      if ((p.inventory["tower-ticket"] ?? 0) < 1) return void h.event("The operator holds out a hand for your ticket.");
      p.inventory["tower-ticket"] = (p.inventory["tower-ticket"] ?? 0) - 1;
    }
    h.advance(l.up ? 420 : 300);
    const next = arrive(h, l.to, level.space);
    if (next) h.event(l.up ? `The car grinds up the curve of the leg, Paris dropping away under the girders, and opens onto ${next.name}.` : `The car carries you down to ${next.name}.`, "world");
    return;
  }
  const thing = thingOf(level, id), f = thing && fairFind(thing.find);
  if (!thing || !f) return;
  if (!f.price) return takeFind(h, run, c, { ...thing, loot: lootOf(f) }, f, complexRecord(h.state, `fair:${level.fair}`).done, { refuel() {} });
  if ((p.inventory.coin ?? 0) < f.price) return void h.event("You don't have the money.");
  p.inventory.coin = (p.inventory.coin ?? 0) - f.price;
  const got: string[] = [];
  for (const [item, n] of Object.entries(lootOf(f))) {
    p.inventory[item] = (p.inventory[item] ?? 0) + (n ?? 0);
    got.push(`${n} ${h.itemName(item).toLowerCase()}`);
  }
  if (f.heal) p.health = Math.min(100, (p.health ?? 100) + f.heal);
  h.advance(f.time ?? 60);
  h.event(`${f.text}${got.length ? ` You take ${got.join(", ")}.` : ""}`, f.tier === "common" ? "action" : "world");
}

const lootOf = (f: { loot?: Readonly<Record<string, number | readonly [number, number]>> }): Inventory =>
  Object.fromEntries(Object.entries(f.loot ?? {}).map(([k, n]) => [k, typeof n === "number" ? n : n[0]]));

/** Crossing into the next area on reaching an edge or a doorway; the people going about. */
export function fairTime(h: ComplexHost) {
  const run = fairRun(h), p = h.state.player;
  if (!run) return;
  const c = fairLevelOf(h, p.pos.space);
  if (!c) {
    if (p.pos.space === "outside") delete h.state.complex;
    return;
  }
  const exit = exitAt(c.level, p.pos.x, p.pos.y);
  if (exit?.to === "outside") return leave(h);
  if (exit) {
    const next = arrive(h, exit.to, c.level.space);
    if (next) h.event(next.name[0].toUpperCase() + next.name.slice(1) + ".", "action");
    return;
  }
  folkTime(h.folk, c.level.space, (x, y) => !fairGround(h, c.level.space, x, y));
}
