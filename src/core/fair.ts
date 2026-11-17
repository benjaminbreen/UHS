import { propDefs } from "../content/props/catalog";
import { fairById, fairFind, type Fair } from "../content/fairs";
import { exitAt } from "../world/complex";
import { fairLevel, fairSolid, fairSpace, fairWalkable, parseFairSpace, type FairLevel } from "../world/fair";
import { areaTarget, arriveIn, cachedArea, complexRecord, takeFind, type ComplexHost } from "./complex";
import { folkDeal, folkTime } from "./tunnel-folk";
import type { Inspection, Inventory, Point } from "./types";

/** A day at a fair: which one, its first area, and the street cell the player came in from. */
export type FairRun = { kind: "fair"; fair: string; name: string; entry: string; out: Point; took?: { at: Point; items: Inventory; clock: number } };

export const fairRun = (h: ComplexHost) => (h.state.complex?.kind === "fair" ? h.state.complex : undefined);

export function fairLevelOf(h: ComplexHost, space: string) {
  const at = parseFairSpace(space), fair = at && fairById(at.fair);
  return fair ? cachedArea(h, space, () => fairLevel(h.state.manifest.seed, fair, at.area), fairSolid) : undefined;
}

export function fairGround(h: ComplexHost, space: string, x: number, y: number) {
  const c = fairLevelOf(h, space);
  if (!c) return undefined;
  const { level, solid } = c;
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  return !fairWalkable(level.cells[y * level.w + x]) || solid.has(y * level.w + x);
}

function arrive(h: ComplexHost, space: string, from?: string) {
  const level = fairLevelOf(h, space)?.level;
  if (level) arriveIn(h, level, `fair:${level.fair}`, from);
  return level;
}

/** In at the gate, paying unless `free`. */
export function fairEnter(h: ComplexHost, fair: Fair, free = false) {
  const p = h.state.player;
  if (!free && (p.inventory.coin ?? 0) < fair.ticket) return void h.event(fair.words.short);
  if (!free) p.inventory.coin = (p.inventory.coin ?? 0) - fair.ticket;
  h.state.complex = { kind: "fair", fair: fair.id, name: fair.name, entry: fairSpace(fair.id, fair.entry), out: { x: p.pos.x, y: p.pos.y } };
  const level = arrive(h, fairSpace(fair.id, fair.entry));
  if (!level) return void delete h.state.complex;
  h.event(`${free ? "" : `${fair.words.gate ?? "You push through the turnstile."} `}${fair.name[0].toUpperCase()}${fair.name.slice(1)}: ${level.name}, ${fair.words.enter}`, "world");
}

function leave(h: ComplexHost) {
  const run = fairRun(h)!, p = h.state.player;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...run.out, space: "outside" };
  delete h.state.complex;
  h.event("You go out through the gate into the street.");
}

const thingOf = (level: FairLevel, id: string) => level.things.find((t) => `fair-thing:${t.id}` === id);

export function fairInspect(h: ComplexHost, id: string): Inspection | undefined {
  const p = h.state.player, c = fairRun(h) && fairLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c;
  if (id.startsWith("fair-case:")) {
    const [caseId, slot] = id.split("#");
    const display = level.cases.find((d) => d.id === caseId);
    if (!display) return undefined;
    const pos = { x: display.x + Math.floor(display.w / 2), y: display.y + 1, space: level.space };
    if (slot === undefined) return {
      id, name: display.name, kind: "object", pos, description: "", affordances: [],
      exhibits: display.finds.map((f, i) => ({ id: `${caseId}#${i}`, name: f.name })),
    };
    const f = display.finds[Number(slot)];
    if (!f || id !== `${caseId}#${Number(slot)}`) return undefined;
    return { id, name: f.name, kind: "object", pos, description: f.look, source: f.source, affordances: [] };
  }
  const act = (label: string, enabled = true, reason?: string) => ({ label, enabled, reason, command: { type: "interact" as const, target: id, action: "complex" as const } });
  const lift = /^fair-lift:(\d+)$/.exec(id);
  if (lift) {
    const l = level.lifts[Number(lift[1])];
    if (!l) return undefined;
    const to = fairLevelOf(h, l.to)?.level.name ?? "the next platform";
    const fair = fairById(level.fair), pass = fair?.areas.find((a) => a.id === level.area)?.liftTicket;
    const ticket = !!pass && (p.inventory[pass] ?? 0) < 1;
    return {
      id, name: l.up ? "Lift up" : "Lift down", kind: "place", pos: { x: l.x, y: l.y, space: level.space },
      description: l.up ? `${fair?.words.liftLook ?? "A lift"} to ${to}. An operator stands at the gate.` : `The car down to ${to}.`,
      affordances: [act(l.up ? `Ride up to ${to}` : `Ride down to ${to}`, !ticket, "You need a ticket from the office")],
    };
  }
  const thing = thingOf(level, id), f = thing && fairFind(thing.find);
  if (!thing || !f) return undefined;
  if (f.on === "table" || f.catalog) return {
    id, name: thing.name, kind: "object", pos: { x: thing.x + Math.floor((thing.w ?? 1) / 2), y: thing.y + (thing.h ?? 1), space: level.space },
    description: f.look, source: f.source, affordances: [],
  };
  const done = complexRecord(h.state, `fair:${level.fair}`).done.includes(thing.id);
  const broke = !!f.price && (p.inventory.coin ?? 0) < f.price;
  const spent = done && !f.keeps && !f.price;
  return {
    id, name: thing.name, kind: "object", pos: { x: thing.x, y: thing.wall ? thing.y + 1 : thing.y, space: level.space },
    description: `${f.look}${f.price ? ` ${f.price} ${fairById(level.fair)?.coin[f.price === 1 ? 0 : 1] ?? "coins"}.` : ""}`,
    affordances: spent ? [] : [act(f.verb, !broke, "Not enough money")],
  };
}

export function fairVerb(h: ComplexHost) {
  const c = fairRun(h) && fairLevelOf(h, h.state.player.pos.space);
  const id = c && areaTarget(h.state.player, c.level, "fair", (t) => !!t.prop || fairFind(t.find)?.on === "table" || !!fairFind(t.find)?.catalog), offer = id ? fairInspect(h, id)?.affordances[0] : undefined;
  return offer?.enabled && offer.command.type === "interact" ? { label: offer.label, target: offer.command.target } : undefined;
}

export function fairAct(h: ComplexHost, id: string) {
  const run = fairRun(h), p = h.state.player, c = run && fairLevelOf(h, p.pos.space);
  if (!run || !c) return;
  if (id.startsWith("folk-")) return void folkDeal(h.folk, id);
  const { level } = c;
  const lift = /^fair-lift:(\d+)$/.exec(id);
  if (lift) {
    const l = level.lifts[Number(lift[1])];
    if (!l) return;
    const fair = fairById(level.fair), pass = fair?.areas.find((a) => a.id === level.area)?.liftTicket;
    if (pass) {
      if ((p.inventory[pass] ?? 0) < 1) return void h.event("The operator holds out a hand for your ticket.");
      p.inventory[pass] = (p.inventory[pass] ?? 0) - 1;
    }
    h.advance(l.up ? 420 : 300);
    const next = arrive(h, l.to, level.space);
    if (next) h.event(l.up ? `${fair?.words.liftUp ?? "The lift carries you up to"} ${next.name}.` : `The car carries you down to ${next.name}.`, "world");
    return;
  }
  const thing = thingOf(level, id), f = thing && fairFind(thing.find);
  if (!thing || !f || f.on === "table" || f.catalog) return;
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
  // People walk round furniture that has been moved as they do round what was built in.
  const inWay = new Set(h.state.objects.filter((o) => o.pos.space === c.level.space && !o.carriedBy && !o.broken && propDefs[o.prop ?? ""]?.solid).map((o) => o.pos.y * c.level.w + o.pos.x));
  folkTime(h.folk, c.level.space, (x, y) => !fairGround(h, c.level.space, x, y) && !inWay.has(y * c.level.w + x));
}
