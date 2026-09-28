import catalog from "../../content/graphics/trains.generated.json" with { type: "json" };
import { modernity } from "../../content/settlements/modernity";
import type { WorldSetting } from "../../content/geography/types";
import { random } from "../../core/random";
import type { Point } from "../../core/types";
import type { Rect } from "./types";

/** A town's railway: the formation of `span` cells from `level`, run from `lo`
 * to `hi` along `axis`, and the station's platform beside it. */
export type Railway = {
  axis: "x" | "y";
  level: number;
  lo: number;
  hi: number;
  span: number;
  station?: {
    door: Point;
    platform: Rect;
    /** -1: the platform is on the formation's west or north side. */
    side: -1 | 1;
    building?: Rect;
  };
};

export type TrainPart = {
  kind: "steam" | "tender" | "diesel" | "coach" | "wagon" | "brake";
  length: number;
  height: number;
  width: number;
  sideHeight: number;
  steam: boolean;
  smoke?: number[];
  doors?: number[];
};
const sets = catalog as unknown as Record<string, Record<string, TrainPart>>;

/** One working of a train past the station, the same every day: timetables
 * were printed and kept. `at` is the second of the day its head stops at the
 * platform, or passes the station's door on a train that does not stop. */
export type Run = {
  id: string;
  at: number;
  dwell: number;
  dir: 1 | -1;
  /** 0 is the road beside the platform, 1 the far one. */
  track: 0 | 1;
  set: string;
  /** Part keys from the leading vehicle back. */
  cars: string[];
  /** Line speed in tiles per game second. */
  speed: number;
  kind: "stopping" | "express" | "freight";
};

export const DAY = 86400;

/** A journey's average by train, stops and changes included, in km/h: a
 * Stephenson line's thirty, an express age's sixty, a high-speed line's
 * hundred and more. */
export function railSpeed(year: number) {
  return year < 1860 ? 30 : year < 1900 ? 42 : year < 1940 ? 55 : year < 1970 ? 70 : year < 2000 ? 95 : 130;
}
/** Tiles per game second squared. At line speed a stopping train starts
 * braking some eighty tiles out and takes three minutes of game time to stop. */
const BRAKE = 0.006;

/** What a railway of this region ran in this period. */
export function railSet(s: Pick<WorldSetting, "lon" | "lat" | "year">) {
  const region = modernity(s).id;
  const y = s.year;
  const set =
    region === "north-america"
      ? y < 1885
        ? "american"
        : y < 1945
          ? "american-late"
          : y < 1995
            ? "streamline-us"
            : "modern"
      : region === "eastern-europe" && y >= 1950 && y < 1995
        ? "soviet"
        : y < 1855
          ? "early"
          : y < 1905
            ? region === "britain" && s.lon < -1.5
              ? "victorian"
              : "victorian-crimson"
            : y < 1950
              ? region === "britain"
                ? "edwardian"
                : "interwar-black"
              : y < 1968
                ? "diesel"
                : y < 1995
                  ? "blue"
                  : "modern";
  return sets[set] ? set : "victorian";
}

export function trainPart(set: string, key: string): TrainPart | undefined {
  return sets[set]?.[key];
}

/** Leading vehicle back: the engine, its tender, then the train. */
function makeUp(set: string, kind: Run["kind"], n: number, roll: () => number) {
  const parts = sets[set];
  const head = parts.tender ? ["loco", "tender"] : ["loco"];
  const coaches = Object.keys(parts).filter((k) => k.startsWith("coach"));
  const wagons = Object.keys(parts).filter((k) => k.startsWith("wagon"));
  const body =
    kind === "freight"
      ? Array.from({ length: n }, () => wagons[Math.floor(roll() * wagons.length)])
      : Array.from({ length: n }, (_, i) => coaches[i % coaches.length]);
  return [...head, ...body, ...(kind === "freight" && parts.brake ? ["brake"] : [])];
}

/** The day's workings past one station. Service thickens with the period:
 * a handful of trains a day each way in the 1840s, one an hour by 1900, more
 * at the rush once towns had suburbs. Goods run on the far road, day and
 * night; stopping trains keep the platform road in both directions. */
export function timetable(
  seed: string,
  key: string,
  s: Pick<WorldSetting, "lon" | "lat" | "year">,
  line: Railway,
): Run[] {
  const set = railSet(s);
  const roll = (...k: (string | number)[]) => random(seed, "timetable", key, ...k);
  const y = s.year;
  const each = y < 1850 ? 4 : y < 1880 ? 7 : y < 1920 ? 11 : y < 1960 ? 13 : 16;
  const runs: Run[] = [];
  // Stopping trains alternate direction at a regular interval, the first at
  // about six, the last before eleven; the platform road is never shared.
  const first = 6 * 3600 + Math.floor(roll("first") * 1800);
  const last = 22.5 * 3600;
  const step = Math.floor((last - first) / (each * 2 - 1) / 60) * 60;
  // As many coaches as the platform takes; the engine stands past its end.
  const p = line.station?.platform;
  const room = p ? (line.axis === "x" ? p.w : p.h) * 16 : 400;
  const coachLength = Object.entries(sets[set]).find(([k]) => k.startsWith("coach"))?.[1].length ?? 100;
  const coaches = Math.max(2, Math.min(5, Math.floor(room / coachLength)));
  for (let i = 0; i < each * 2; i++) {
    let k = 0;
    const next = () => roll("stop", i, k++);
    runs.push({
      id: `${key}-s${i}`,
      at: first + i * step,
      dwell: 150 + Math.floor(next() * 5) * 30,
      dir: i % 2 ? -1 : 1,
      track: 0,
      set,
      cars: makeUp(set, "stopping", coaches, next),
      speed: 1,
      kind: "stopping",
    });
  }
  // Goods and the expresses on the far road, spread over the whole day and
  // kept ten minutes apart so no two meet on it.
  const through = (y < 1860 ? 3 : y < 1920 ? 7 : 9) + (y >= 1880 ? 3 : 0);
  let t = Math.floor(roll("goods") * 3600);
  for (let i = 0; i < through; i++) {
    let k = 0;
    const next = () => roll("through", i, k++);
    const express = y >= 1880 && next() < 0.3 && t > 7 * 3600 && t < 22 * 3600;
    runs.push({
      id: `${key}-t${i}`,
      at: t,
      dwell: 0,
      dir: next() < 0.5 ? 1 : -1,
      track: 1,
      set,
      cars: express
        ? makeUp(set, "express", coaches + 2, next)
        : makeUp(set, "freight", 6 + Math.floor(next() * 8), next),
      speed: express ? 1.5 : 0.7,
      kind: express ? "express" : "freight",
    });
    t += Math.floor(DAY / through * (0.7 + next() * 0.5));
    if (t >= DAY) break;
  }
  return runs.sort((a, b) => a.at - b.at);
}

/** Length of a train in tiles, head to tail. */
export function trainLength(run: Run) {
  return run.cars.reduce((n, k) => n + (sets[run.set][k]?.length ?? 0), 0) / 16;
}

/** Where along the line a stopping train's head stands at the platform:
 * drawn up to its far end in the direction of travel. */
export function stopAt(line: Railway, run: Run) {
  const p = line.station?.platform;
  if (!p) return (line.lo + line.hi) / 2;
  const [a, b] = line.axis === "x" ? [p.x, p.x + p.w] : [p.y, p.y + p.h];
  if (!run.dwell) return (a + b) / 2;
  // Drawn up so the coaches stand along the platform, centred on it, and the
  // engine past its end.
  const engine = run.cars
    .filter((k) => !k.startsWith("coach"))
    .reduce((n, k) => n + (sets[run.set][k]?.length ?? 0), 0) / 16;
  const coaches = trainLength(run) - engine;
  const centre = (a + b) / 2 + run.dir * coaches / 2;
  return centre + run.dir * engine;
}

/** Tiles from the stop a train has still to run (negative after it leaves),
 * `t` seconds after its time. Braking and starting at a steady rate to and
 * from line speed; a through train runs at line speed throughout. */
function travelled(run: Run, t: number) {
  const v = run.speed;
  if (!run.dwell) return v * t;
  const T = v / BRAKE;
  if (t < 0) {
    const d = -t;
    return -(d < T ? (BRAKE * d * d) / 2 : v * d - (v * T) / 2);
  }
  if (t <= run.dwell) return 0;
  const d = t - run.dwell;
  return d < T ? (BRAKE * d * d) / 2 : v * d - (v * T) / 2;
}

export type TrainState = {
  run: Run;
  /** Along-line coordinate of the head, in tiles. */
  head: number;
  /** Tiles per game second, for the wheels and the exhaust. */
  speed: number;
  standing: boolean;
};

/** Every train on the line at `clock`, with its head's position. Pure: the
 * same clock gives the same trains, so saves and replays need nothing. */
export function trainsAt(line: Railway, runs: Run[], clock: number): TrainState[] {
  const day = Math.floor(clock / DAY);
  const out: TrainState[] = [];
  for (const d of [day - 1, day, day + 1])
    for (const run of runs) {
      const t = clock - (d * DAY + run.at);
      // Nothing on the line is more than an hour from its time here.
      if (t < -3600 || t > 3600 + run.dwell) continue;
      const base = stopAt(line, run);
      const head = base + run.dir * travelled(run, t);
      const length = trainLength(run);
      const tail = head - run.dir * length;
      if (Math.max(head, tail) < line.lo - 2 || Math.min(head, tail) > line.hi + 2) continue;
      const dt = 1;
      const speed = Math.abs(travelled(run, t + dt) - travelled(run, t)) / dt;
      out.push({ run, head, speed, standing: !!run.dwell && t >= 0 && t <= run.dwell });
    }
  return out;
}

/** Cross-line coordinate of a track's centre, in tiles: the rails are drawn
 * at 18 and 46 pixels into the four-cell formation. */
export function trackCentre(line: Railway, track: 0 | 1) {
  const near = line.station?.side ?? -1;
  // The platform road is the one beside the platform.
  const which = (track === 0) === (near < 0) ? 0 : 1;
  return line.level + (which === 0 ? 18 : 46) / 16;
}

/** The standing train's doors, as tiles on the platform edge: where people
 * waiting stand, and where those getting off appear. */
export function platformDoors(line: Railway, run: Run): Point[] {
  const p = line.station?.platform;
  if (!p || !run.dwell) return [];
  const head = stopAt(line, run);
  const edge = line.station!.side < 0
    ? (line.axis === "x" ? p.y + p.h - 1 : p.x + p.w - 1)
    : line.axis === "x" ? p.y : p.x;
  const out: Point[] = [];
  let at = 0;
  for (const key of run.cars) {
    const part = sets[run.set][key];
    if (!part) continue;
    if (part.kind === "coach")
      for (const door of part.doors ?? []) {
        const along = Math.round(head - run.dir * (at + (part.length - door) / 16));
        const [lo, hi] = line.axis === "x" ? [p.x, p.x + p.w - 1] : [p.y, p.y + p.h - 1];
        if (along < lo || along > hi) continue;
        out.push(line.axis === "x" ? { x: along, y: edge } : { x: edge, y: along });
      }
    at += part.length / 16;
  }
  return out;
}
