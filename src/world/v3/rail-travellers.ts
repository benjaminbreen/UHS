import type { Actor, Pack, Point } from "../../core/types";
import { DAY_MINUTES, PACE, type Itinerary, type StationActivity } from "../../core/itinerary";
import { random } from "../../core/random";
import { generateCharacter } from "../../content/characters/generate";
import { proceduralName } from "../../content/geography/character";
import { platformDoors, timetable, type Run } from "./railway";
import type { SettlementPlan } from "./types";

/** People the railway brings: residents who go up to the city by the morning
 * train and come back by an evening one, and visitors who come in for the day
 * and leave again. Each day is fitted to the timetable, so a commuter is on
 * the platform when the train draws in and steps off the one that brings them
 * home; between the two they are simply not in town. */

export const isVisitor = (id: string) => id.includes("-traveller-");

/** Season tickets came in with the suburbs: a few clerks in the 1850s, a
 * good share of a town's working men by 1900, more after. */
export function commutes(plan: SettlementPlan, seed: string, year: number, actor: Actor | undefined) {
  if (!plan.railway?.station || !actor || actor.kind !== "human" || year < 1850) return false;
  const age = actor.age ?? 34;
  if (age < 18 || age > 64) return false;
  const share = year < 1890 ? 0.05 : year < 1940 ? 0.1 : 0.14;
  return random(seed, "commute", actor.id) < share;
}

const ROLES = [
  ["Commercial traveller", 1840],
  ["Visitor", 1840],
  ["Market trader", 1840],
  ["Day tripper", 1870],
  ["Inspector", 1860],
] as const;

/** A handful of visitors a day, more for a bigger town. */
export function railVisitors(plan: SettlementPlan, seed: string, pack: Pack) {
  const station = plan.railway?.station;
  const setting = pack.setting;
  if (!station || !setting || setting.year < 1840) return;
  const n = 2 + Math.min(5, Math.floor(plan.site.profile.radius / 20));
  const roles = ROLES.filter(([, from]) => setting.year >= from);
  const at = { x: station.door.x, y: station.door.y, space: "outside" as const };
  for (let i = 0; i < n; i++) {
    const id = `${plan.site.id}-traveller-${i}`;
    const roll = (k: string) => random(seed, id, k);
    const role = roles[Math.floor(roll("role") * roles.length)][0];
    const age = 20 + Math.floor(roll("age") * 40);
    const actor: Actor = {
      id,
      name: proceduralName(setting, seed, id),
      role,
      kind: "human",
      pos: { ...at },
      home: { ...at },
      work: { ...at },
      sprite: `human-${i % 3}-${Math.floor(roll("sprite") * 6)}`,
      inventory: { water: 1 },
      activity: "Travelling",
      fatigue: 0,
      hunger: 5,
      trust: 1,
      memories: [],
      direction: 2,
    };
    if (setting.characterRevision) {
      Object.assign(actor, generateCharacter(setting, seed, id, age, role));
      actor.role = role;
    }
    plan.actors.push(actor);
    const there = destinations(plan, seed, id)[0]?.pos ?? station.door;
    plan.work.set(id, {
      home: station.door,
      work: there,
      water: station.door,
      social: there,
      label: "Visiting",
      offset: 0,
    });
    // Two stations so the planner treats them as residents; the day itself is
    // built against the timetable by railDay.
    plan.stations.set(id, [
      { pos: there, activity: "visit", label: "Visiting", minutes: 60 },
      { pos: station.door, activity: "rest", label: "Away", minutes: 600 },
    ]);
  }
}

/** The station's own people: a stationmaster between the booking office and
 * the platform, and a porter or two working the platform. They live at the
 * station as far as the town can see, and are out on the platform much of
 * the day. */
export function railStaff(plan: SettlementPlan, seed: string, pack: Pack) {
  const station = plan.railway?.station;
  const setting = pack.setting;
  if (!station?.building || !setting || setting.year < 1840) return;
  const p = station.platform;
  const alongX = plan.railway!.axis === "x";
  const edge = station.side < 0 ? (alongX ? p.y + p.h - 1 : p.x + p.w - 1) : alongX ? p.y : p.x;
  const back = station.side < 0 ? (alongX ? p.y : p.x) : alongX ? p.y + p.h - 1 : p.x + p.w - 1;
  const length = alongX ? p.w : p.h;
  const start = alongX ? p.x : p.y;
  const at = (t: number, across: number): Point =>
    alongX ? { x: start + Math.round(t * (length - 1)), y: across } : { x: across, y: start + Math.round(t * (length - 1)) };
  const bed = {
    x: station.building.x + (station.building.w >> 1),
    y: station.building.y + (station.building.h >> 1),
  };
  const staff = [
    ["stationmaster", "Stationmaster", 45],
    ...Array.from({ length: plan.site.profile.radius >= 60 ? 2 : 1 }, () => ["porter", "Porter", 30] as const),
  ] as const;
  staff.forEach(([wanted, role, age], i) => {
    const id = `${plan.site.id}-railstaff-${i}`;
    const roll = (k: string) => random(seed, id, k);
    const pos = { ...station.door, space: "outside" as const };
    const actor: Actor = {
      id,
      name: proceduralName(setting, seed, id),
      role,
      kind: "human",
      pos: { ...pos },
      home: { ...pos },
      work: { ...at(0.5, edge), space: "outside" },
      sprite: `human-${i % 3}-${Math.floor(roll("sprite") * 6)}`,
      inventory: { water: 1 },
      activity: role === "Porter" ? "Carrying a load" : "Keeping the record",
      fatigue: 0,
      hunger: 5,
      trust: 1,
      memories: [],
      direction: 2,
    };
    if (setting.characterRevision) {
      Object.assign(actor, generateCharacter(setting, seed, id, age + Math.floor(roll("age") * 15), wanted));
      actor.role = role;
    }
    plan.actors.push(actor);
    plan.work.set(id, {
      home: station.door,
      work: at(0.5, edge),
      water: station.door,
      social: station.door,
      label: role === "Porter" ? "Carrying luggage" : "Keeping the station",
      offset: Math.floor(roll("offset") * 120),
    });
    const s = roll("side");
    plan.stations.set(id, role === "Porter"
      ? [
          { pos: at(0.2 + s * 0.2, edge), activity: "haul", label: "Carrying a trunk along the platform", toward: "the platform", minutes: 10 },
          { pos: station.door, activity: "haul", label: "Fetching luggage from the booking hall", toward: "the booking hall", minutes: 8 },
          { pos: at(0.6 + s * 0.3, edge), activity: "haul", label: "Carrying a trunk along the platform", toward: "the platform", minutes: 10 },
          { pos: at(0.5, back), activity: "work", label: "Sweeping the platform", toward: "the platform", minutes: 14 },
          { pos: bed, activity: "rest", label: "In the porters' room", minutes: 480, share: 0.55 },
        ]
      : [
          { pos: station.door, activity: "work", label: "At the booking office", toward: "the booking office", minutes: 25 },
          { pos: at(0.5, edge), activity: "work", label: "Seeing the trains in and out", toward: "the platform", minutes: 25 },
          { pos: at(s < 0.5 ? 0 : 1, edge), activity: "work", label: "Watching the line", toward: "the platform end", minutes: 12 },
          { pos: bed, activity: "rest", label: "In the stationmaster's office", minutes: 480, share: 0.45 },
        ]);
  });
}

/** Where a visitor spends the day: the square, a venue, a shop door. */
function destinations(plan: SettlementPlan, seed: string, id: string) {
  const places: { pos: Point; label: string; toward: string }[] = [
    ...(plan.gatherings ?? []).map((pos) => ({ pos, label: "Taking in the town", toward: "the square" })),
    ...(plan.venues ?? []).map((v) => ({ pos: v.pos, label: `At the ${v.venue.label.toLowerCase()}`, toward: `the ${v.venue.label.toLowerCase()}` })),
    ...plan.places
      .filter((p) => p.access === "public" && p.entrance)
      .map((p) => ({ pos: { x: p.entrance.x, y: p.entrance.y + 1 }, label: `Calling at ${p.name.toLowerCase()}`, toward: p.name.toLowerCase() })),
  ];
  return places
    .map((p, i) => ({ p, k: random(seed, id, "destination", i) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 2)
    .map(({ p }) => p);
}

const clock = (minute: number) => {
  const m = Math.round(minute) % DAY_MINUTES;
  return `${Math.floor(m / 60)}.${String(m % 60).padStart(2, "0")}`;
};

type Leg = (from: Point, to: Point) => Point[] | undefined;
type Segment = Itinerary["segments"][number];

/** One traveller's day, or undefined if the walks will not fit the trains. */
export function railDay(
  plan: SettlementPlan,
  seed: string,
  pack: Pack,
  id: string,
  home: Point,
  leg: Leg,
): Itinerary | undefined {
  const line = plan.railway;
  const station = line?.station;
  if (!line || !station || !pack.setting) return;
  const runs = timetable(seed, plan.site.id, pack.setting, line).filter((r) => r.kind === "stopping");
  const roll = (...k: (string | number)[]) => random(seed, "rail-day", id, ...k);
  const pick = (from: number, to: number, key: string) => {
    const open = runs.filter((r) => r.at >= from * 3600 && r.at <= to * 3600);
    return open[Math.floor(roll(key) * open.length)];
  };
  const doorOf = (run: Run, key: string) => {
    const doors = platformDoors(line, run);
    return doors[Math.floor(roll(key) * doors.length)] ?? station.door;
  };
  const visitor = isVisitor(id);
  const inbound = visitor ? pick(7.5, 11, "in") : pick(17, 20.5, "in");
  const outbound = visitor ? pick(15.5, 20, "out") : pick(6.5, 9, "out");
  if (!inbound || !outbound) return;
  const alight = doorOf(inbound, "alight");
  const board = doorOf(outbound, "board");
  // Off a few moments after the train stops; aboard a few before it goes.
  const offAt = inbound.at / 60 + 0.4 + roll("off") * 0.8;
  const leave = (outbound.at + outbound.dwell) / 60 - 0.3;
  const away = visitor && station.building
    ? {
        x: station.building.x + (station.building.w >> 1),
        y: station.building.y + (station.building.h >> 1),
      }
    : home;
  const segments: Segment[] = [];
  let at = 0;
  const stay = (pos: Point, until: number, activity: StationActivity, label: string) => {
    if (until < at) return false;
    segments.push({ from: at, to: until, pos, activity, label });
    at = until;
    return true;
  };
  const walk = (from: Point, to: Point, label: string) => {
    const path = leg(from, to);
    if (!path) return false;
    if (path.length)
      segments.push({ from: at, to: at + path.length * PACE, path, pos: from, activity: "visit", label });
    at += path.length * PACE;
    return true;
  };
  const waiting = `Waiting for the ${clock(leave + 0.3)} train`;
  const ok = visitor
    ? (() => {
        const stops = destinations(plan, seed, id);
        if (!stops.length) return false;
        // Walk the round once in the head to see how long the day is.
        const route = [alight, ...stops.map((s) => s.pos), board];
        const walks = route.slice(1).map((p, i) => leg(route[i], p));
        if (walks.some((w) => !w)) return false;
        const walking = walks.reduce((n, w) => n + w!.length * PACE, 0);
        const wait = 4 + roll("wait") * 6;
        const spare = leave - wait - offAt - walking;
        if (spare < 30) return false;
        if (!stay(away, offAt, "rest", "Away")) return false;
        let from = alight;
        for (const s of stops) {
          if (!walk(from, s.pos, `Walking to ${s.toward}`)) return false;
          if (!stay(s.pos, at + spare / stops.length, "visit", s.label)) return false;
          from = s.pos;
        }
        return walk(from, board, "Walking to the station") &&
          stay(board, leave, "visit", waiting) &&
          stay(away, DAY_MINUTES, "rest", "Away");
      })()
    : (() => {
        const there = leg(home, board);
        if (!there) return false;
        const set = leave - (4 + roll("wait") * 6) - there.length * PACE;
        return set > 0 &&
          stay(home, set, "rest", "At home") &&
          walk(home, board, "Walking to the station") &&
          stay(board, leave, "visit", waiting) &&
          stay(home, offAt, "rest", "Away on the train") &&
          walk(alight, home, "Walking home from the station") &&
          stay(home, DAY_MINUTES, "rest", "At home");
      })();
  if (!ok || Math.abs(at - DAY_MINUTES) > 1e-6) return;
  return { segments, start: 0, period: DAY_MINUTES };
}
