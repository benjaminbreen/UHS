import type { Point } from "./types";
/** Named errands rather than free-form strings: the renderer maps each to a
 * pose, so a routine reads at a distance without any per-actor state. */
export const stationActivities = [
  "rest",
  "work",
  "tend",
  "haul",
  "draw-water",
  "gather",
  "visit",
  "graze",
  "play",
] as const;
export type StationActivity = (typeof stationActivities)[number];
export type Station = {
  pos: Point;
  activity: StationActivity;
  label: string;
  /** Requested dwell in minutes. Padded or trimmed to make the day close. */
  minutes: number;
  /** On the night station only: this resident's share of the day out of
   * doors. Defaults to OUTDOOR_SHARE. */
  share?: number;
  /** On the night station only: minutes per tile. Defaults to PACE. */
  pace?: number;
};
type Segment = {
  from: number;
  to: number;
  /** Absent on a stay. */
  path?: Point[];
  pos: Point;
  activity: StationActivity;
  label: string;
};
export type Itinerary = {
  segments: Segment[];
  /** Minute of the day the first station begins. */
  start: number;
  /** Minutes covered before the schedule repeats. */
  period: number;
};
export type Ambient = {
  x: number;
  y: number;
  activity: StationActivity;
  label: string;
  moving: boolean;
  direction: number;
};
export const DAY_MINUTES = 1440;
/** Minutes to cross one tile on foot. Matches the 18-second step the simulated
 * fallback uses, so an actor keeps the same pace whichever path drives it. */
export const PACE = 0.3;
const length = (path: Point[]) => path.length;
/** Longest a person stands at one errand before moving on. A day made of a
 * single pass over the stations would leave everyone standing for hours; the
 * circuit is walked several times instead. Methodical work — a row of crops, a
 * stand of trees — gets the shortest dwell, because the point of it is the
 * moving between one plant and the next. */
const dwellCap: Record<StationActivity, number> = {
  rest: 560,
  work: 30,
  tend: 11,
  haul: 8,
  "draw-water": 8,
  gather: 13,
  visit: 26,
  graze: 45,
  play: 3,
};
const MIN_NIGHT = 300;
const MAX_NIGHT = 480;
/** Share of the day a resident is out of doors. The rest is spent indoors,
 * where nobody is drawn. */
const OUTDOOR_SHARE = 0.18;
/** A day of errands walked as round trips from the house, with time at home
 * between them and the night at the end. */
export function buildItinerary(
  stations: Station[],
  startMinute: number,
  path: (from: Point, to: Point) => Point[],
  /** 0..1. Rotates the outings within the waking day, so the settlement does
   * not empty and fill in one wave. */
  phase = 0,
): Itinerary | undefined {
  if (stations.length < 3) return undefined;
  const night = stations[stations.length - 1];
  if (night.activity !== "rest") return undefined;
  const errands = stations.slice(0, -1);
  const between = errands
    .slice(0, -1)
    .map((s, i) => path(s.pos, errands[i + 1].pos));
  const toBed = path(errands[errands.length - 1].pos, night.pos);
  const fromBed = path(night.pos, errands[0].pos);
  const pace = night.pace ?? PACE;
  const walk = (legs: Point[][]) =>
    legs.reduce((n, leg) => n + length(leg) * pace, 0);
  const dwells = errands.map((s) => Math.min(dwellCap[s.activity], s.minutes));
  const dwellSum = dwells.reduce((n, d) => n + d, 0);
  // Out of the door, round the errands, back through it.
  const outing = dwellSum + walk(between) + walk([toBed, fromBed]);
  if (outing <= 0 || outing > DAY_MINUTES - MIN_NIGHT) return undefined;
  // Time inside another building is not time seen outdoors.
  const hidden = errands.reduce(
    (n, s, i) => n + (s.activity === "rest" ? dwells[i] : 0),
    0,
  );
  const rounds = Math.max(
    1,
    Math.min(
      Math.floor((DAY_MINUTES - MIN_NIGHT) / outing),
      Math.round(
        (DAY_MINUTES * (night.share ?? OUTDOOR_SHARE)) /
          Math.max(1, outing - hidden),
      ),
    ),
  );
  const indoors = DAY_MINUTES - rounds * outing;
  // Night and gaps must sum to the indoor hours, or the period drifts against
  // the clock.
  const nightMinutes = Math.min(MAX_NIGHT, Math.max(MIN_NIGHT, indoors * 0.55));
  // The leading gap borrows from the trailing one, sliding the whole day.
  const share = (indoors - nightMinutes) / rounds;
  const lead = Math.min(1, Math.max(0, phase)) * share;
  const gap = (i: number) =>
    i === 0 ? lead : i === rounds ? share - lead : share;
  const segments: Segment[] = [];
  let at = 0;
  const stay = (s: Station, minutes: number, label = s.label) => {
    segments.push({
      from: at,
      to: at + minutes,
      pos: s.pos,
      activity: s.activity,
      label,
    });
    at += minutes;
  };
  const travel = (leg: Point[], from: Station, to: Station) => {
    if (!leg.length) return;
    segments.push({
      from: at,
      to: at + leg.length * pace,
      path: leg,
      pos: from.pos,
      // A leg out of the house belongs to the errand: marked "rest" it would
      // count as time indoors and never be drawn.
      activity: from.activity === "rest" ? to.activity : from.activity,
      label: `Walking to ${to.label.toLowerCase()}`,
    });
    at += leg.length * pace;
  };
  stay(night, nightMinutes);
  for (let r = 0; r < rounds; r++) {
    stay(night, gap(r));
    travel(fromBed, night, errands[0]);
    for (let i = 0; i < errands.length; i++) {
      stay(errands[i], dwells[i]);
      if (i < errands.length - 1)
        travel(between[i], errands[i], errands[i + 1]);
      else travel(toBed, errands[i], night);
    }
  }
  stay(night, gap(rounds));
  const period = at;
  if (period <= 0) return undefined;
  return { segments, start: startMinute, period };
}
/** Where the routine puts an actor at `clock` seconds. Pure: no per-tick state,
 * so the renderer can sample it every frame and the engine once a tick. */
export function itineraryAt(itinerary: Itinerary, clock: number): Ambient {
  const { segments, period } = itinerary;
  let m = (clock / 60 - itinerary.start) % period;
  if (m < 0) m += period;
  let lo = 0,
    hi = segments.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segments[mid].from <= m) lo = mid;
    else hi = mid - 1;
  }
  const seg = segments[lo];
  if (!seg.path) {
    return {
      x: seg.pos.x,
      y: seg.pos.y,
      activity: seg.activity,
      label: seg.label,
      moving: false,
      direction: 2,
    };
  }
  const span = Math.max(1e-6, seg.to - seg.from);
  const t = Math.min(1, Math.max(0, (m - seg.from) / span)) * seg.path.length;
  const i = Math.min(seg.path.length - 1, Math.floor(t));
  const a = i === 0 ? seg.pos : seg.path[i - 1],
    b = seg.path[i];
  const f = t - i;
  const dx = b.x - a.x,
    dy = b.y - a.y;
  return {
    x: a.x + dx * f,
    y: a.y + dy * f,
    activity: seg.activity,
    label: seg.label,
    moving: true,
    direction: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0,
  };
}
