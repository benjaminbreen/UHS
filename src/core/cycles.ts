import { rngOf } from "./random";

export const CYCLE_KINDS = [
  "draisine",
  "boneshaker",
  "penny",
  "roadster",
  "loop",
  "cruiser",
  "racer",
  "chopper",
  "bmx",
  "mtb",
  "folder",
  "moto-early",
  "moto-classic",
  "scooter",
  "cub",
  "dirtbike",
  "sportbike",
] as const;
export type CycleKind = (typeof CYCLE_KINDS)[number];

export interface CycleLook {
  kind: CycleKind;
  /** Frame or bodywork. */
  paint: string;
  /** Fork, rear triangle, tank stripe or leg shield. */
  accent: string;
  tyre: "black" | "gum" | "white" | "cream";
  saddle: string;
  front?: "wicker" | "wire" | "crate" | "lamp";
  cargo?: "flowers" | "bread" | "greens" | "parcel";
  rear?: "rack" | "box" | "panniers";
  fenders?: boolean;
  /** Amber reflectors in the spokes. */
  reflectors?: boolean;
  /** A child's safety flag on a whip. */
  flag?: boolean;
  /** Tassels from the grips. */
  streamers?: boolean;
}

export interface CycleSpec {
  noun: string;
  from: number;
  to?: number;
  motor?: boolean;
  /** Cells per second: what steady pedalling holds, and what a sprint reaches. */
  cruise: number;
  sprint: number;
  /** Cells per second gained per second of effort. */
  accel: number;
  /** Share of speed kept over a second of coasting. */
  coast: number;
  /** Share of speed kept through a right-angle turn. */
  grip: number;
  /** Speed factor off paved or packed ground. */
  rough: number;
  /** Cells cleared by a hop at speed. */
  hop: 0 | 1 | 2 | 3;
  /** Tricks in the air. */
  tricks?: boolean;
  /** High over the front wheel: a sudden stop pitches the rider over the bars. */
  tall?: boolean;
}

export const CYCLE_SPECS: Readonly<Record<CycleKind, CycleSpec>> = {
  draisine: { noun: "running machine", from: 1817, to: 1868, cruise: 8, sprint: 10, accel: 5, coast: 0.6, grip: 0.6, rough: 0.6, hop: 0 },
  boneshaker: { noun: "velocipede", from: 1864, to: 1885, cruise: 8.5, sprint: 11, accel: 5, coast: 0.62, grip: 0.6, rough: 0.55, hop: 0 },
  penny: { noun: "penny-farthing", from: 1871, to: 1898, cruise: 11, sprint: 15, accel: 5, coast: 0.8, grip: 0.5, rough: 0.6, hop: 0, tall: true },
  roadster: { noun: "bicycle", from: 1886, cruise: 10, sprint: 14, accel: 7, coast: 0.78, grip: 0.72, rough: 0.75, hop: 1 },
  loop: { noun: "town bicycle", from: 1893, cruise: 9.2, sprint: 12.5, accel: 6.5, coast: 0.78, grip: 0.75, rough: 0.72, hop: 1 },
  cruiser: { noun: "cruiser", from: 1933, cruise: 9.5, sprint: 12.5, accel: 6, coast: 0.84, grip: 0.7, rough: 0.82, hop: 1 },
  racer: { noun: "racing bicycle", from: 1903, cruise: 12.5, sprint: 19, accel: 9, coast: 0.88, grip: 0.66, rough: 0.5, hop: 1 },
  chopper: { noun: "chopper bicycle", from: 1963, to: 1986, cruise: 9, sprint: 12, accel: 7, coast: 0.74, grip: 0.7, rough: 0.75, hop: 2, tricks: true },
  bmx: { noun: "BMX", from: 1972, cruise: 9.6, sprint: 13.5, accel: 10, coast: 0.74, grip: 0.92, rough: 0.92, hop: 3, tricks: true },
  mtb: { noun: "mountain bike", from: 1981, cruise: 10.5, sprint: 15, accel: 8, coast: 0.8, grip: 0.86, rough: 0.97, hop: 3, tricks: true },
  folder: { noun: "folding bicycle", from: 1976, cruise: 9, sprint: 12, accel: 7.5, coast: 0.74, grip: 0.8, rough: 0.65, hop: 1 },
  "moto-early": { noun: "motorcycle", from: 1903, to: 1934, motor: true, cruise: 13, sprint: 19, accel: 7, coast: 0.6, grip: 0.6, rough: 0.7, hop: 1 },
  "moto-classic": { noun: "motorcycle", from: 1932, motor: true, cruise: 15, sprint: 24, accel: 11, coast: 0.62, grip: 0.68, rough: 0.72, hop: 1 },
  scooter: { noun: "scooter", from: 1947, motor: true, cruise: 12.5, sprint: 18, accel: 9, coast: 0.6, grip: 0.8, rough: 0.6, hop: 1 },
  cub: { noun: "moped", from: 1958, motor: true, cruise: 12.5, sprint: 18, accel: 9, coast: 0.62, grip: 0.78, rough: 0.75, hop: 1 },
  dirtbike: { noun: "dirt bike", from: 1968, motor: true, cruise: 15, sprint: 23, accel: 13, coast: 0.6, grip: 0.84, rough: 1, hop: 3, tricks: true },
  sportbike: { noun: "sports motorcycle", from: 1984, motor: true, cruise: 17, sprint: 28, accel: 15, coast: 0.66, grip: 0.7, rough: 0.5, hop: 1 },
};

export const isCycleKind = (kind: string | undefined): kind is CycleKind => !!kind && kind in CYCLE_SPECS;

const ENAMEL = ["#2b2d33", "#2b2d33", "#2f4a3a", "#5a2a2c", "#2c3a5c"];
const MIDCENTURY = ["#b83a36", "#2f5f9e", "#e8dcc0", "#6f9a78", "#2b2d33", "#c9853a", "#7fb4c4"];
const SEVENTIES = ["#d9722c", "#c9a227", "#7a4a2c", "#8fb23a", "#b83a36", "#2f5f9e", "#6b3f7a"];
const NEON = ["#e8438f", "#2fb5a8", "#7a4fc9", "#f2d03a", "#f2742c", "#3fa3e8", "#9fd43a"];
const MODERN = ["#2b2d33", "#f0f0ea", "#7fd0c0", "#c9402f", "#3b5fb0", "#e8a23a", "#6f7a84", "#3f8f5a"];
const PASTEL = ["#a8d8c8", "#f2c4b0", "#f0e2a0", "#b8cfe8", "#e8e2d2", "#d98a8a"];
const MOTO = ["#2b2d33", "#7a2428", "#2f4a3a", "#2c3a5c", "#6b6f58", "#b83a36"];
const SADDLES = ["#6b4226", "#3a2a22", "#2b2d33", "#8a5a34"];

function paints(kind: CycleKind, year: number) {
  if (kind === "scooter") return PASTEL;
  if (kind === "cub") return ["#c9402f", "#2f5f9e", "#3f8f5a", "#e8dcc0", "#2b2d33"];
  if (kind === "dirtbike") return ["#e8c22a", "#c9402f", "#3fa35a", "#3b5fb0", "#f2742c"];
  if (kind === "sportbike") return ["#c9402f", "#3b5fb0", "#3fb35a", "#f0f0ea", "#e8c22a", "#2b2d33"];
  if (kind.startsWith("moto")) return MOTO;
  if (kind === "draisine" || kind === "boneshaker") return ["#6b4226", "#7a2428", "#2f4a3a", "#2c3a5c", "#3a2a22"];
  if (kind === "chopper") return ["#c9402f", "#e8c22a", "#7a4fc9", "#f2742c", "#3fa3e8"];
  if (kind === "bmx" || kind === "mtb") return year < 1998 ? NEON : [...MODERN, ...NEON.slice(0, 3)];
  if (year < 1925) return ENAMEL;
  if (year < 1965) return MIDCENTURY;
  if (year < 1984) return SEVENTIES;
  return MODERN;
}

/** Where bicycles were how ordinary people got about, not a pastime. */
const CYCLING_LANDS = new Set(["east-asia", "south-asia", "southeast-asia", "japan"]);

/** Kinds in use at a place and year, with how common each is. */
export function cycleKindsFor(year: number, region: string, motorFrom = 1905): [CycleKind, number][] {
  const out: [CycleKind, number][] = [];
  const add = (kind: CycleKind, weight: number) => {
    const s = CYCLE_SPECS[kind];
    if (weight > 0 && year >= s.from && (s.to === undefined || year <= s.to) && (!s.motor || year >= motorFrom)) out.push([kind, weight]);
  };
  const asia = CYCLING_LANDS.has(region);
  const west = region === "north-america" || region === "western-europe" || region === "britain" || region === "australasia";
  // The first machines were a European and American craze.
  if (west || region === "eastern-europe") {
    add("draisine", year < 1830 ? 1 : 0.15);
    add("boneshaker", year < 1874 ? 3 : 0.4);
    add("penny", year < 1890 ? 4 : 1);
  }
  add("roadster", year < 1900 ? 3 : 6);
  add("loop", asia || region === "western-europe" ? 5 : 2.5);
  add("racer", year < 1950 ? 0.6 : west ? 2 : 0.8);
  if (region === "north-america" || region === "latin-america" || region === "australasia") add("cruiser", year < 1970 || year > 1992 ? 3 : 1);
  if (west) add("chopper", 2);
  add("bmx", west ? 2 : 0.6);
  add("mtb", year < 1990 ? 1.5 : west ? 5 : 2.5);
  add("folder", region === "japan" || region === "britain" ? 1.2 : 0.4);
  add("moto-early", 0.7);
  add("moto-classic", year < 1975 ? 1.4 : 0.6);
  add("scooter", region === "western-europe" || region === "south-asia" ? 2.5 : 0.8);
  // By the 1980s the moped had taken over the streets of south-east Asia.
  add("cub", region === "southeast-asia" && year >= 1985 ? 14 : asia || region === "sub-saharan-africa" || region === "latin-america" ? 5 : 0.7);
  add("dirtbike", 0.6);
  add("sportbike", 0.8);
  return out;
}

export function cycleLookOf(kind: CycleKind, year: number, region: string, key: string): CycleLook {
  const r = rngOf("cycle-look", key, kind);
  const pick = <T>(list: readonly T[]) => list[Math.floor(r() * list.length)];
  const spec = CYCLE_SPECS[kind];
  const palette = paints(kind, year);
  const paint = pick(palette);
  const chrome = "#c8ccd2";
  const two = r() < (kind === "mtb" || kind === "bmx" ? 0.6 : 0.2);
  const look: CycleLook = {
    kind,
    paint,
    accent: spec.motor || kind === "racer" ? (r() < 0.5 ? chrome : pick(palette)) : two ? pick(palette) : paint,
    tyre:
      year < 1915 && !spec.motor
        ? pick(["cream", "cream", "black"] as const)
        : kind === "cruiser" || (kind === "scooter" && r() < 0.5) || (kind === "moto-classic" && year < 1960 && r() < 0.3)
          ? "white"
          : (kind === "racer" || kind === "bmx" || kind === "loop") && r() < 0.4
            ? "gum"
            : "black",
    saddle: kind === "chopper" || kind === "bmx" ? "#2b2d33" : pick(SADDLES),
  };
  if (spec.motor) {
    if (kind === "cub" || kind === "scooter") {
      if (r() < 0.45) look.rear = r() < 0.6 ? "box" : "rack";
      if (kind === "cub") look.accent = "#f0ece0";
    }
    return look;
  }
  const utility = kind === "roadster" || kind === "loop" || kind === "cruiser" || kind === "folder";
  if (utility) {
    look.fenders = kind !== "folder" || r() < 0.5;
    const basket = kind === "loop" ? 0.7 : kind === "cruiser" ? 0.35 : 0.25;
    if (r() < basket) {
      look.front = year < 1950 || r() < 0.4 ? "wicker" : r() < 0.75 ? "wire" : "crate";
      if (r() < 0.45) look.cargo = pick(["flowers", "bread", "greens", "parcel"] as const);
    } else if (year >= 1895 && r() < 0.5) look.front = "lamp";
    if (r() < (CYCLING_LANDS.has(region) ? 0.6 : 0.35)) look.rear = r() < 0.6 ? "rack" : r() < 0.6 ? "box" : "panniers";
  }
  if (year >= 1970 && kind !== "racer" && r() < 0.35) look.reflectors = true;
  if ((kind === "chopper" || kind === "cruiser") && r() < 0.5) look.streamers = true;
  if ((kind === "chopper" || kind === "bmx") && year < 1990 && r() < 0.3) look.flag = true;
  return look;
}

/** One machine of the kinds in use at a place and year, or none before there were any. */
export function cycleLookFor(year: number, region: string, key: string, motorFrom?: number, want?: "pedal" | "motor"): CycleLook | undefined {
  const kinds = cycleKindsFor(year, region, motorFrom).filter(([k]) => !want || !!CYCLE_SPECS[k].motor === (want === "motor"));
  const total = kinds.reduce((n, [, w]) => n + w, 0);
  if (!total) return undefined;
  let roll = rngOf("cycle-kind", key)() * total;
  const [kind] = kinds.find(([, w]) => (roll -= w) < 0) ?? kinds[0];
  return cycleLookOf(kind, year, region, key);
}

export function cycleLabel(look: CycleLook) {
  return CYCLE_SPECS[look.kind].noun;
}


export type CyclePose = "cycle" | "cycle-tuck" | "cycle-high" | "cycle-ape" | "cycle-scoot" | "cycle-stand" | "moto";

/** How the rider sits in each pose, in pixels, shared by the doll and the
 * painter: hip height above the rider image's foot line, the pedal circle's
 * centre above that line and ahead of the hip, the crank length, and where
 * the hands hold (ahead of the hip, above the foot line). */
export const CYCLE_SEATS: Readonly<Record<CyclePose, { hip: number; pedalUp: number; ahead: number; crank: number; reach: number; hand: number }>> = {
  cycle: { hip: 13, pedalUp: 4, ahead: 2.5, crank: 2.5, reach: 8, hand: 14 },
  "cycle-tuck": { hip: 13, pedalUp: 4, ahead: 2.5, crank: 2.5, reach: 9.5, hand: 12 },
  "cycle-stand": { hip: 13, pedalUp: 2, ahead: 0.5, crank: 2.5, reach: 6, hand: 12 },
  "cycle-ape": { hip: 13, pedalUp: 4, ahead: 3.5, crank: 2.5, reach: 7, hand: 18 },
  "cycle-high": { hip: 15, pedalUp: 2, ahead: 1.5, crank: 2, reach: 5.5, hand: 17 },
  "cycle-scoot": { hip: 12, pedalUp: 0, ahead: 0, crank: 0, reach: 7.5, hand: 14 },
  moto: { hip: 13, pedalUp: 5, ahead: 1, crank: 0, reach: 8.5, hand: 15 },
};

export function cyclePose(kind: CycleKind): CyclePose {
  if (CYCLE_SPECS[kind].motor) return "moto";
  if (kind === "racer") return "cycle-tuck";
  if (kind === "penny" || kind === "boneshaker") return "cycle-high";
  if (kind === "chopper") return "cycle-ape";
  if (kind === "draisine") return "cycle-scoot";
  if (kind === "bmx") return "cycle-stand";
  return "cycle";
}

export interface CycleMotion {
  /** Cells per second. */
  speed: number;
  dir?: readonly [number, number];
}
export type CycleBeat = "start" | "coast" | "skid" | "stop" | "drift";

const START = 4.5, COAST_MIN = 4.2, SKID_MIN = 6.5;

/** One cell of riding: momentum that builds while the way is held, rolls on
 * when it is let go, scrubs off in a turn and locks into a skid when the way
 * back is pressed. `ground` is how well the surface runs (1 on a road),
 * `fall` the drop in ground height into the next cell in terrace steps. */
export function cycleStep(
  m: CycleMotion,
  input: readonly [number, number],
  spec: CycleSpec,
  env: { sprint?: boolean; surge?: boolean; ground?: number; fall?: number } = {},
): { speed: number; dir?: readonly [number, number]; move?: readonly [number, number]; pedalling: boolean; beat?: CycleBeat } {
  const [ix, iy] = input, ground = env.ground ?? 1, fall = env.fall ?? 0;
  let { speed, dir } = m;
  const limit = spec.sprint * 1.3;
  if (!ix && !iy) {
    if (!dir || speed < COAST_MIN) return { speed: 0, pedalling: false, beat: speed > 0 ? "stop" : undefined };
    speed = Math.min(limit, speed * spec.coast * (ground < 0.8 ? 0.9 : 1) + fall * 3);
    return speed < COAST_MIN ? { speed: 0, pedalling: false, beat: "stop" } : { speed, dir, move: dir, pedalling: false, beat: "coast" };
  }
  if (!dir || speed <= 0) return { speed: START, dir: input, move: input, pedalling: true, beat: "start" };
  let beat: CycleBeat | undefined;
  if (ix === -dir[0] && iy === -dir[1]) {
    // Slow enough to simply turn round; otherwise the wheels lock.
    if (speed < SKID_MIN) return { speed: START, dir: input, move: input, pedalling: true, beat: "start" };
    speed *= 0.5;
    return speed < SKID_MIN ? { speed: 0, pedalling: false, beat: "skid" } : { speed, dir, move: dir, pedalling: false, beat: "skid" };
  }
  if (ix !== dir[0] || iy !== dir[1]) {
    const cos = (ix * dir[0] + iy * dir[1]) / (Math.hypot(ix, iy) * Math.hypot(dir[0], dir[1]));
    const keep = cos > 0.5 ? 1 - (1 - spec.grip) * 0.4 : cos > -0.1 ? spec.grip : spec.grip * 0.6;
    if (cos < 0.5 && speed > spec.cruise * 0.8) beat = "drift";
    speed = Math.max(START, speed * keep);
    dir = input;
  }
  const top = (env.surge ? spec.sprint * 1.12 : env.sprint ? spec.sprint : spec.cruise) * ground;
  speed = speed < top ? Math.min(top, speed + spec.accel / speed) : Math.max(top, speed * 0.93);
  speed = Math.min(limit, Math.max(3.5, speed + fall * 3));
  return { speed, dir, move: dir, pedalling: true, beat };
}

export interface CycleTrick {
  name: string;
  points: number;
  /** How the scene plays it. */
  move: "flip-back" | "flip-front" | "whip" | "spin";
}

/** The trick a key asks for in the air: `along` is the key against the way of
 * travel (1 with it, -1 against, 0 across), `again` the jump key pressed a second time. */
export function cycleTrick(spec: CycleSpec, along: -1 | 0 | 1, again = false): CycleTrick | undefined {
  if (!spec.tricks) return undefined;
  if (again) return { name: "360", points: 200, move: "spin" };
  if (along === 0) return { name: spec.motor ? "whip" : "tabletop", points: 100, move: "whip" };
  return along < 0 ? { name: "backflip", points: 300, move: "flip-back" } : { name: "front flip", points: 400, move: "flip-front" };
}
