import { propDefs } from "../content/props/catalog";
import { fairById, fairFind, type Fair } from "../content/fairs";
import { prisonAt } from "../content/prisons";
import { exitAt, N4, type AreaExit } from "../world/complex";
import { fairLevel, fairSolid, fairSpace, fairWalkable, parseFairSpace, type FairLevel } from "../world/fair";
import { areaTarget, arriveIn, cachedArea, complexRecord, takeFind, type ComplexHost } from "./complex";
import { prisonEnter } from "./prison";
import { folkDeal, folkTime } from "./tunnel-folk";
import type { Inspection, Inventory, Point } from "./types";

/** A day at a fair: which one, its first area, and the street cell the player came in from. */
export type FairRun = { kind: "fair"; fair: string; name: string; entry: string; out: Point; admitted?: boolean; warnings?: number; took?: { at: Point; items: Inventory; clock: number } };

const PRIVATE_ROOMS = new Set(["bedchamber", "closet", "bath", "tablinum"]);
const COURT_ROLES = /\b(?:ruler|king|queen|emperor|empress|prince|princess|duke|duchess|baron|baroness|count|countess|lord|lady|noble|courtier|aristocrat|minister|chancellor|vizier|satrap|wanax|pharaoh|shogun|mandarin|eunuch|senator|president|governor|ambassador|envoy|magistrate|judge|valet|chamberlain|steward|butler|secretary|scribe|guard|bodyguard|officer|captain|servant|maid|footman|retainer|attendant|priest|priestess|chaplain)\b/i;
const GUARD_ACTOR = /guard|sentry|doorkeeper|usher|footman|steward|officer|soldier/i;
const BRIBE = 5;
const bribeCost = (run: FairRun) => ((run.warnings ?? 0) >= 2 ? BRIBE * 2 : BRIBE);

function doorGuard(h: ComplexHost, space: string, at: Point) {
  const inRoom = h.state.actors.filter((a) => a.pos.space === space && !a.dead);
  const guards = inRoom.filter((a) => GUARD_ACTOR.test(`${a.role} ${a.underground?.person ?? ""}`));
  const pool = guards.length ? guards : inRoom;
  return pool.sort((a, b) => Math.hypot(a.pos.x - at.x, a.pos.y - at.y) - Math.hypot(b.pos.x - at.x, b.pos.y - at.y))[0];
}

function facePoint(from: Point, to: Point): 0 | 1 | 2 | 3 {
  return Math.abs(to.x - from.x) > Math.abs(to.y - from.y) ? (to.x > from.x ? 1 : 3) : to.y > from.y ? 2 : 0;
}

/** On third palace intrusion: march into the local prison if one exists for this culture/era, else throw out the gate. */
function ejectOrDetain(h: ComplexHost, run: FairRun, exit: AreaExit, guard?: (typeof h.state.actors)[number]) {
  const p = h.state.player;
  if (guard) {
    guard.direction = facePoint(guard.pos, p.pos);
    h.cue?.(guard.id, "shove", p.pos);
    h.say?.(guard.id, "Seize them!");
  }
  h.cue?.("player", "struck", guard?.pos ?? { x: exit.x, y: exit.y });
  h.hurt(8, "palace guard", "bruised shoulder");
  const fine = Math.min(3, p.inventory.coin ?? 0);
  if (fine > 0) p.inventory.coin = (p.inventory.coin ?? 0) - fine;
  h.advance(900);
  const s = h.world.pack.setting;
  const jail = s && prisonAt(s.lon, s.lat, s.year, s.culture);
  if (jail) {
    for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
    prisonEnter(h, jail, { kind: "fixed", daysLeft: 14, charge: `trespassing near ${exit.name}` }, run.out);
    return;
  }
  const coinName = fairById(run.fair)?.coin[fine === 1 ? 0 : 1] ?? "coins";
  leave(
    h,
    fine > 0
      ? `The guards seize you by the collar, relieve you of ${fine} ${coinName} for your trouble, and throw you back out the gate.`
      : "The guards seize you by the collar, march you back through the court, and throw you out the gate.",
  );
  h.cue?.("player", "struck");
}

function palaceRoomRestricted(h: ComplexHost, run: FairRun, toSpace: string) {
  if (run.admitted) return false;
  const s = h.world.pack.setting;
  if (s?.below === "fair" && s.venue === run.fair) return false;
  const at = parseFairSpace(toSpace), fair = at && fairById(at.fair);
  if (!at || !fair?.palace) return false;
  const area = fair.areas.find((a) => a.id === at.area);
  const room = area?.palace?.room ?? fair.palace.room;
  if (!room || !PRIVATE_ROOMS.has(room)) return false;
  const role = `${h.state.player.role} ${s?.role ?? ""} ${s?.brief?.work ?? ""}`;
  return !COURT_ROLES.test(role);
}

function barredExitNear(h: ComplexHost, run: FairRun, level: FairLevel): AreaExit | undefined {
  const { x, y } = h.state.player.pos;
  return level.exits.find(
    (e) =>
      e.to !== "outside" &&
      x >= e.x - 1 &&
      x <= e.x + e.w &&
      y >= e.y - 1 &&
      y <= e.y + e.h &&
      palaceRoomRestricted(h, run, e.to),
  );
}

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
export function fairEnter(h: ComplexHost, fair: Fair, free = false, room = fair.entry) {
  const p = h.state.player;
  if (!free && (p.inventory.coin ?? 0) < fair.ticket) return void h.event(fair.words.short);
  if (!free) p.inventory.coin = (p.inventory.coin ?? 0) - fair.ticket;
  h.state.complex = { kind: "fair", fair: fair.id, name: fair.name, entry: fairSpace(fair.id, fair.entry), out: { x: p.pos.x, y: p.pos.y } };
  const level = arrive(h, fairSpace(fair.id, room));
  if (!level) return void delete h.state.complex;
  h.event(`${free ? "" : `${fair.words.gate ?? "You push through the turnstile."} `}${fair.name[0].toUpperCase()}${fair.name.slice(1)}: ${level.name}, ${fair.words.enter}`, "world");
}

function leave(h: ComplexHost, message?: string) {
  const run = fairRun(h)!, p = h.state.player;
  const isPalace = !!fairById(run.fair)?.palace;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...run.out, space: "outside" };
  delete h.state.complex;
  h.event(message ?? (isPalace ? "You step back outside." : "You go out through the gate into the street."), message ? "world" : "action");
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
  const run = fairRun(h)!;
  if (id === "fair-bribe") {
    const barred = barredExitNear(h, run, level);
    if (!barred) return undefined;
    const cost = bribeCost(run);
    const coinName = fairById(level.fair)?.coin[1] ?? "coins";
    return {
      id, name: "Palace guard", kind: "place", pos: { x: barred.x, y: barred.y, space: level.space },
      description: `The doorway to ${barred.name} is kept for the household and those with rank.`,
      affordances: [act(`Slip the guard ${cost} ${coinName}`, (p.inventory.coin ?? 0) >= cost, "Not enough money")],
    };
  }
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
  const run = fairRun(h), c = run && fairLevelOf(h, h.state.player.pos.space);
  if (!run || !c) return undefined;
  const id = areaTarget(h.state.player, c.level, "fair", (t) => !!t.prop || fairFind(t.find)?.on === "table" || !!fairFind(t.find)?.catalog);
  const offer = id ? fairInspect(h, id)?.affordances[0] : undefined;
  if (offer?.enabled && offer.command.type === "interact") return { label: offer.label, target: offer.command.target };
  const bribe = barredExitNear(h, run, c.level) ? fairInspect(h, "fair-bribe")?.affordances[0] : undefined;
  return bribe?.enabled && bribe.command.type === "interact" ? { label: bribe.label, target: bribe.command.target } : undefined;
}

export function fairAct(h: ComplexHost, id: string) {
  const run = fairRun(h), p = h.state.player, c = run && fairLevelOf(h, p.pos.space);
  if (!run || !c) return;
  if (id.startsWith("folk-")) return void folkDeal(h.folk, id);
  if (id === "fair-bribe") {
    const barred = barredExitNear(h, run, c.level);
    if (!barred) return;
    const cost = bribeCost(run);
    const guard = doorGuard(h, c.level.space, p.pos);
    if ((p.inventory.coin ?? 0) < cost) {
      if (guard) h.cue?.(guard.id, "refuse", p.pos);
      return void h.event("The guard shakes his head. \"Not enough.\"");
    }
    p.inventory.coin = (p.inventory.coin ?? 0) - cost;
    run.admitted = true;
    run.warnings = 0;
    if (guard) {
      guard.direction = facePoint(guard.pos, p.pos);
      h.cue?.("player", "pay", guard.pos);
      h.cue?.(guard.id, "take-coin", p.pos);
      h.say?.(guard.id, "Keep out of sight.");
    }
    h.advance(15);
    h.event("The guard pockets the coin and steps aside. \"Keep out of sight.\"", "social");
    return;
  }
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
    if (palaceRoomRestricted(h, run, exit.to)) {
      const [dx, dy] = N4[exit.inward];
      p.pos.x += dx;
      p.pos.y += dy;
      const guard = doorGuard(h, c.level.space, p.pos);
      if (guard) {
        guard.direction = facePoint(guard.pos, p.pos);
        // Step the guard closer to the doorway so the FF6 confrontation plays right in front of the player.
        const gx = guard.pos.x + Math.sign(p.pos.x - guard.pos.x);
        const gy = guard.pos.y + Math.sign(p.pos.y - guard.pos.y);
        if (Math.hypot(guard.pos.x - p.pos.x, guard.pos.y - p.pos.y) > 2 && !fairGround(h, c.level.space, gx, gy)) {
          guard.pos = { x: gx, y: gy, space: c.level.space };
        }
      }
      run.warnings = (run.warnings ?? 0) + 1;
      if (run.warnings >= 3) return ejectOrDetain(h, run, exit, guard);
      if (run.warnings === 2) {
        if (guard) {
          h.cue?.(guard.id, "fury", p.pos);
          h.say?.(guard.id, "I said BACK OFF!");
        }
        h.cue?.("player", "alarm", guard?.pos ?? { x: exit.x, y: exit.y });
        h.event(
          `The guard stamps forward, red in the face. "I told you once! One more step toward ${exit.name} and we throw you out."`,
          "social",
        );
        return;
      }
      if (guard) {
        h.cue?.(guard.id, "halt", p.pos);
        h.say?.(guard.id, "Hold it!");
      }
      h.cue?.("player", "alarm", guard?.pos ?? { x: exit.x, y: exit.y });
      h.event(
        guard
          ? `The guard bars the doorway to ${exit.name}. "Private quarters — only the household and those with rank may pass."`
          : `A steward stops you at the doorway to ${exit.name}. "Only the household and those with rank beyond this point."`,
        "social",
      );
      return;
    }
    const next = arrive(h, exit.to, c.level.space);
    if (next) h.event(next.name[0].toUpperCase() + next.name.slice(1) + ".", "action");
    return;
  }
  // People walk round furniture that has been moved as they do round what was built in.
  const inWay = new Set(h.state.objects.filter((o) => o.pos.space === c.level.space && !o.carriedBy && !o.broken && propDefs[o.prop ?? ""]?.solid).map((o) => o.pos.y * c.level.w + o.pos.x));
  folkTime(h.folk, c.level.space, (x, y) => !fairGround(h, c.level.space, x, y) && !inWay.has(y * c.level.w + x));
}
