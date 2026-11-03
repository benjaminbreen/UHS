import type { Point, Position } from "./types";
import type { TopographyCell } from "./topography";
import {
  aerialStates,
  type FaunaGroup,
  type FaunaMember,
  type FaunaState,
} from "./fauna";
import {
  faunaCombat,
  faunaProfile,
  type FaunaCombat,
  type FaunaProfile,
} from "../content/fauna";
import { TIERS, type SignalInput } from "./combat";

/** What a group needs from the world to move: the engine supplies it once per tick. */
export type FaunaWorld = {
  blocked(x: number, y: number): boolean;
  canCross?(from: Point, to: Point): boolean;
  topography?(x: number, y: number): TopographyCell;
  /** A person or another animal already stands here. */
  occupied(x: number, y: number): boolean;
  gateOpen(id: string | undefined): boolean;
  /** People close enough to matter, the player first. */
  humans: readonly Position[];
  rng(purpose: string): number;
  hour: number;
  /** How well a cell suits a species, 0 to 1. The engine caches it; without
   * it animals wander without regard for the ground. */
  habitat?(speciesId: string, x: number, y: number): number;
  /** How well the player carries to an animal: 1 is a person walking in the
   * open, less is quieter. Other people are always 1. */
  noise?: number;
  /** The player is in the air this tick, and a charge goes under them. */
  dodging?: boolean;
  /** An animal has reached the player. `dir` is the way it was travelling. */
  onMaul?(g: FaunaGroup, m: FaunaMember, dir: Point, damage: number): void;
  /** Something for the renderer to play. */
  emit?(event: SignalInput): void;
  /** A hunter has pulled a member of `prey` down on `at`. */
  onKill?(hunter: FaunaGroup, prey: FaunaGroup, at: Point): void;
  /** A hunter home with what it carried: a fox eats it at the den, a cat
   * leaves it on the step. */
  onDrop?(hunter: FaunaGroup, prey: string, at: Point): void;
  /** Rain or snow falling: grazers stand bunched, rumps to the wind. */
  rain?: boolean;
  /** Carcasses lying out, for the scavengers. */
  carrion?: readonly Point[];
  /** Where the wind blows toward, in screen radians: 0 is east. */
  wind?: number;
  /** A crop sown or standing. Kept grazers are walked round it. */
  crop?(x: number, y: number): boolean;
  /** Ground an animal could dig: soil, not paving, water or a crop. */
  canDig?(x: number, y: number): boolean;
  /** It has been at it long enough to leave a hole. */
  onDig?(g: FaunaGroup, at: Point): void;
};

const NEIGHBOURS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: -1 },
];
const TICK = 6;
/** How far a hunter looks for prey, as a multiple of its alert radius. */
const HUNT_RADIUS = 2.5;
/** Inside this the hunter drops the stalk and runs. */
const POUNCE = 5;
/** Cells a cat or a fox springs from. */
const LEAP = 3;
/** Chance a pounce on an animal that has not seen it comes down on it. */
const STRIKE = 0.45;
/** Seconds a pouncer runs after one that got away before it gives up. */
const DASH = 3 * TICK;
/** Seconds after a missed pounce before it hunts again. */
const SULK = 90;
/** Chance per tick, at point blank, that prey spots a hunter creeping up. It
 * falls away to nothing at the edge of what the prey notices. */
const SPOT = 0.35;
/** Cells an egret flock will cross to join a grazing herd. */
const HERD_RANGE = 24;
/** Game seconds a kill keeps a hunter off the hunt. */
const FED = 10 * 3600;
/** Close enough to lay hold of one. */
const REACH = 1.5;
/** Chance per step that a hunter within reach actually brings its quarry
 * down. Most hunts fail: getting alongside is not the same as a kill. */
const HOLD = 0.35;
/** Inside this fraction of its alert radius an animal goes rather than
 * watches. Outside it, it has its head up but holds its ground. */
const ALERT_BAND = 0.7;
/** Seconds of hard running before an animal is blown. */
const STAMINA = 40;
/** What a blown animal has left. */
const WINDED = 0.55;
/** Cells from the player within which the fine work is done: cover, herd
 * spacing, crowding. Past it a group moves on the cheap rules, since nobody
 * is close enough to see the difference. */
const DETAIL = 36;
/** Seconds a hunter leaves off after its quarry has gone down a hole. */
const GONE_TO_GROUND = 3 * 3600;
/** Cells within which one animal bolting puts every other head up. */
const HEARD = 12;
/** How far one group's presence puts another off a patch of ground. */
const ELBOW = 8;
/** Where a flock settles round its leader's landing cell. */
const SPREAD: readonly [number, number][] = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [1, 1],
  [-1, 1],
  [0, -1],
  [1, -1],
  [-1, -1],
];
const hyp = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Stock let into the standing corn is the thing a herder is there to stop. */
const keptOff = (world: FaunaWorld, p: FaunaProfile, at: Point) =>
  p.category === "domestic" && !!p.art.graze && !!world.crop?.(at.x, at.y);

/** Cells a route search will open before giving up and walking straight. */
const ROUTE_SEARCH = 4000;

/** The way from `from` to `to` for stock that must not cross the crops, by
 * breadth-first search over cells it may step on. Undefined when there is no
 * way within the search, and the animal walks straight at it instead. */
function route(world: FaunaWorld, p: FaunaProfile, from: Point, to: Point) {
  const key = (c: Point) => `${c.x},${c.y}`;
  const came = new Map<string, Point | null>([[key(from), null]]);
  const queue: Point[] = [from];
  for (let i = 0; i < queue.length && came.size < ROUTE_SEARCH; i++) {
    const at = queue[i];
    if (at.x === to.x && at.y === to.y) {
      const path: Point[] = [];
      for (let c: Point | null = at; c && c !== from; c = came.get(key(c))!)
        path.unshift({ x: c.x, y: c.y });
      return path;
    }
    for (const n of NEIGHBOURS) {
      const next = { x: at.x + n.x, y: at.y + n.y };
      const k = key(next);
      if (came.has(k)) continue;
      const goal = next.x === to.x && next.y === to.y;
      if (!goal && keptOff(world, p, next)) continue;
      if (!stepAllowed(world, p, at, next)) continue;
      came.set(k, at);
      queue.push(next);
    }
  }
  return undefined;
}

/** Where the leader steps for next: the next cell of its route for kept
 * grazers, the target itself for everything else. */
function waypoint(world: FaunaWorld, p: FaunaProfile, g: FaunaGroup, leader: Point) {
  const target = g.target!;
  if (p.category !== "domestic" || !p.art.graze) return target;
  const end = g.route?.[g.route.length - 1];
  if (!end || end.x !== target.x || end.y !== target.y)
    g.route = route(world, p, leader, target);
  const r = g.route;
  if (!r?.length) return target;
  // Shoved off its line by the others, it picks the route up further on.
  let near = 0;
  for (let i = 0; i < Math.min(r.length, 8); i++)
    if (hyp(r[i], leader) < hyp(r[near], leader)) near = i;
  if (hyp(r[near], leader) > 3) {
    g.route = route(world, p, leader, target);
    return g.route?.[0] ?? target;
  }
  r.splice(0, hyp(r[near], leader) < 1 ? near + 1 : near);
  return r[0] ?? target;
}

/** The cells every animal's body covers this tick, so a buffalo cannot stand
 * in the one beside it, whichever herd either belongs to. */
class Bodies {
  private count = new Map<string, number>();
  private reach = new Map<FaunaMember, readonly [number, number]>();
  place(m: FaunaMember, body: readonly [number, number] = [0, 0]) {
    this.reach.set(m, body);
    this.mark(m, 1);
  }
  lift(m: FaunaMember) {
    this.mark(m, -1);
  }
  put(m: FaunaMember) {
    this.mark(m, 1);
  }
  /** Whether `m` standing on `to` would overlap anyone else. */
  blocks(m: FaunaMember, to: Point) {
    const [rx, ry] = this.reach.get(m) ?? [0, 0];
    for (let dy = -ry; dy <= 0; dy++)
      for (let dx = -rx; dx <= rx; dx++) {
        const x = to.x + dx,
          y = to.y + dy;
        const own = Math.abs(x - m.x) <= rx && y <= m.y && y >= m.y - ry ? 1 : 0;
        if ((this.count.get(`${x},${y}`) ?? 0) > own) return true;
      }
    return false;
  }
  private mark(m: FaunaMember, d: number) {
    const [rx, ry] = this.reach.get(m) ?? [0, 0];
    for (let dy = -ry; dy <= 0; dy++)
      for (let dx = -rx; dx <= rx; dx++) {
        const k = `${m.x + dx},${m.y + dy}`;
        const n = (this.count.get(k) ?? 0) + d;
        if (n > 0) this.count.set(k, n);
        else this.count.delete(k);
      }
  }
}

/** Ground rules for one step. A person scrambles up a terrace and drops off
 * any edge; most animals keep to their level unless a slope joins the two.
 * A climber (the wolf) takes the person's rule. */
export function stepAllowed(
  world: Pick<FaunaWorld, "blocked" | "canCross" | "topography">,
  profile: Pick<FaunaProfile, "climbs" | "swims">,
  from: Point,
  to: Point,
) {
  const swim = !!profile.swims && afloat(world, to);
  if (!swim && world.blocked(to.x, to.y)) return false;
  if (world.canCross && !world.canCross(from, to)) return false;
  if (!world.topography || profile.climbs) return true;
  const a = world.topography(from.x, from.y),
    b = world.topography(to.x, to.y);
  // Off the water a duck scrambles up a bank a step high.
  if (profile.swims && (swim || afloat(world, from))) return Math.abs(a.height - b.height) <= 1;
  return a.height === b.height || !!a.ramp || !!b.ramp;
}

function afloat(world: Pick<FaunaWorld, "topography">, at: Point) {
  const cell = world.topography?.(at.x, at.y);
  return cell?.surface === "water" && !cell.bridge && !cell.solid;
}

/** Face the way the step went. Four-direction species use all four; the rest
 * keep their east/west facing through a purely vertical step. */
function face(m: FaunaMember, dx: number, dy: number, all: boolean) {
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0) m.direction = 1;
    else if (dx < 0) m.direction = 3;
    else if (all && dy) m.direction = dy > 0 ? 2 : 0;
  } else if (all) m.direction = dy > 0 ? 2 : 0;
  else if (dx > 0) m.direction = 1;
  else if (dx < 0) m.direction = 3;
}

/** Tolerance for people: a wild animal starts at its alert radius, a kept one
 * only moves when someone is on top of it. Birds hop off a little earlier. */
function alertRadius(p: FaunaProfile) {
  if (p.category === "wild") return p.alertRadius;
  return p.locomotion === "ground-and-flight" ? 2 : 1.2;
}

/** `noise` applies to the first threat only, which is the player. */
function nearestThreat(
  threats: readonly Position[],
  at: Point,
  radius: number,
  noise = 1,
) {
  let best: Position | undefined,
    bestD = radius;
  for (const [i, h] of threats.entries()) {
    if (h.space !== "outside") continue;
    const d = hyp(h, at) / (i ? 1 : noise);
    if (d < bestD) {
      best = h;
      bestD = d;
    }
  }
  return best;
}

/** States in which an animal is already still, so a fright need not change it. */
function standing(p: FaunaProfile, state: FaunaState) {
  return (
    (state === "idle" || state === "rest" || state === "perch") &&
    !!p.art[state]
  );
}

/** Hens go in to roost as the light goes, and keep still there till morning. */
const roosting = (p: FaunaProfile, hour: number) =>
  p.category === "domestic" && p.social === "flock" && !p.swims && (hour >= 18.5 || hour < 5.5);

/** Grazing stock eat morning and evening and lie up through the heat. */
const midday = (hour: number) => hour >= 11 && hour < 15;
/** Cells a scavenger winds remains from. */
const SCENT = 24;
/** Game seconds a wallow's mud takes to dry off. */
export const MUD_DRIES = 3 * 3600;

/** Mud or water shallow enough for a buffalo to lie down in. */
export function wallowable(cell: TopographyCell | undefined) {
  return (
    !!cell &&
    (cell.waterDepth === "shallow" ||
      cell.surface === "damp" ||
      !!cell.field?.wet ||
      cell.habitat?.ecology === "wetland")
  );
}

/** The nearest wallow within a short walk of `from`, ring by ring. */
function wallowNear(world: FaunaWorld, p: FaunaProfile, from: Point) {
  if (!world.topography) return undefined;
  for (let r = 0; r <= 12; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const c = { x: from.x + dx, y: from.y + dy };
        if (
          wallowable(world.topography(c.x, c.y)) &&
          !keptOff(world, p, c) &&
          (r === 0 || !world.blocked(c.x, c.y))
        )
          return c;
      }
  return undefined;
}

function resting(p: FaunaProfile, hour: number) {
  const night = hour < 6 || hour >= 20;
  const twilight = (hour >= 5 && hour < 8) || (hour >= 17 && hour < 20);
  switch (p.activity) {
    case "diurnal":
      return night;
    case "nocturnal":
      return !night;
    case "crepuscular":
      return !twilight;
    default:
      return false;
  }
}

function pick<T>(world: FaunaWorld, purpose: string, options: [T, number][]) {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let r = world.rng(purpose) * total;
  for (const [value, w] of options) {
    r -= w;
    if (r <= 0) return value;
  }
  return options[options.length - 1][0];
}

/** A free cell within `radius` of `around`, or undefined if six throws all
 * land somewhere solid. With a species and a crowd the throws are scored
 * rather than taken first-come: ground the animal likes, clear of the other
 * groups, so a herd works along its own habitat instead of drifting onto bare
 * rock and standing in the next herd's lap. */
function freeCellNear(
  world: FaunaWorld,
  around: Point,
  radius: number,
  purpose: string,
  species?: string,
  crowd?: readonly Point[],
) {
  const scored = Boolean(species && world.habitat) || Boolean(crowd?.length);
  let best: Point | undefined,
    bestScore = -Infinity;
  for (let i = 0; i < 6; i++) {
    const angle = world.rng(purpose) * Math.PI * 2,
      r = 1 + world.rng(purpose) * Math.max(1, radius - 1);
    const c = {
      x: Math.round(around.x + Math.cos(angle) * r),
      y: Math.round(around.y + Math.sin(angle) * r),
    };
    if (
      (world.blocked(c.x, c.y) && !(species && faunaProfile(species)?.swims && afloat(world, c))) ||
      world.occupied(c.x, c.y)
    )
      continue;
    const profile = species ? faunaProfile(species) : undefined;
    if (profile && keptOff(world, profile, c)) continue;
    if (!scored) return c;
    let score = species && world.habitat ? world.habitat(species, c.x, c.y) : 0;
    if (crowd)
      for (const o of crowd) {
        const d = hyp(o, c);
        if (d < ELBOW) score -= (1 - d / ELBOW) * 0.6;
      }
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}

function decide(
  g: FaunaGroup,
  p: FaunaProfile,
  world: FaunaWorld,
  clock: number,
  crowd?: readonly Point[],
) {
  const bird = p.locomotion === "ground-and-flight";
  const calm = () =>
    clock + p.calmDecisionSeconds * (0.5 + world.rng(`fauna-${g.id}-wait`));
  g.target = undefined;
  // Scared off the way home, it takes up the way home again.
  if (g.carrying) {
    g.state = "carry";
    g.target = { ...g.home };
    g.since = clock;
    g.nextDecisionAt = clock + 10 * TICK;
    return;
  }
  const feed = p.art.graze ? "graze" : p.art.forage ? "forage" : "idle";
  const doze = p.art.rest ? "rest" : "idle";
  if (g.gateId) {
    // Kept herds: out through the gate by day when the herder has opened it,
    // back to the pen for the night. The player's go out whenever they open it.
    // Rain brings them in early.
    const out = !g.fold && (g.owner === "player" || (world.hour >= 8 && world.hour < 17 && !world.rain)) && world.gateOpen(g.gateId);
    const goal = out && g.pasture ? g.pasture : g.home;
    if (out && soak(g, p, world, clock)) return;
    if (hyp(g.pos, goal) > 2.5) {
      g.state = "wander";
      g.target = { ...goal };
    } else if (out) {
      const local = freeCellNear(world, goal, 3, `fauna-${g.id}-graze`, p.id);
      g.state = pick(world, `fauna-${g.id}-state`, [
        [feed, midday(world.hour) ? 2 : 5],
        // Lying up through the heat, chewing the cud.
        [doze, midday(world.hour) ? 4 : 0],
        ["idle", 2],
        ["wander", local ? 2 : 0],
      ]);
      if (g.state === "wander" && local)
        g.target = { ...local, space: "outside" };
    } else
      g.state = pick(world, `fauna-${g.id}-state`, [
        [doze, resting(p, world.hour) ? 6 : 2],
        ["idle", 2],
      ]);
    g.nextDecisionAt = calm();
    g.since = clock;
    return;
  }
  if (bird) {
    const night = world.hour < 5 || world.hour >= 20;
    const hop = night
      ? undefined
      : freeCellNear(
          world,
          g.home,
          g.homeRadius,
          `fauna-${g.id}-hop`,
          p.id,
          crowd,
        );
    g.state = pick(world, `fauna-${g.id}-state`, [
      ["perch", night ? 8 : 3],
      ["forage", night ? 0 : 4],
      ["takeoff", hop ? 3 : 0],
    ]);
    if (g.state === "takeoff" && hop) g.target = { ...hop, space: "outside" };
    g.nextDecisionAt = g.state === "takeoff" ? clock + TICK : calm();
    g.since = clock;
    return;
  }
  if (roosting(p, world.hour)) {
    if (hyp(g.pos, g.home) > 1.5) {
      g.state = "wander";
      g.target = { ...g.home };
    } else g.state = "idle";
    g.nextDecisionAt = calm();
    g.since = clock;
    return;
  }
  if (world.rain && p.art.graze && p.locomotion === "ground") {
    g.state = "idle";
    g.nextDecisionAt = calm();
    g.since = clock;
    return;
  }
  if (soak(g, p, world, clock)) return;
  if (scavenge(g, p, world, clock)) return;
  const prowl = p.art.stalk ? "stalk" : "wander";
  const roam = freeCellNear(
    world,
    g.home,
    g.homeRadius,
    `fauna-${g.id}-roam`,
    p.id,
    crowd,
  );
  const tired = resting(p, world.hour);
  const lying = p.category === "domestic" && !!p.art.graze && midday(world.hour);
  g.state = pick(world, `fauna-${g.id}-state`, [
    [doze, tired ? 7 : lying ? 4 : 1],
    ["idle", 2],
    [feed, tired ? 1 : 4],
    // A dog after a smell, a wolf opening a den or a cache.
    [
      "dig",
      p.art.dig && !tired && world.canDig?.(g.members[0].x, g.members[0].y)
        ? 0.7
        : 0,
    ],
    [
      roam
        ? world.rng(`fauna-${g.id}-gait`) < 0.3
          ? prowl
          : "wander"
        : "idle",
      tired ? 1 : 3,
    ],
  ]);
  if ((g.state === "wander" || g.state === "stalk") && roam)
    g.target = { ...roam, space: "outside" };
  g.nextDecisionAt = calm();
  g.since = clock;
}

/** Through the heat a wallower makes for mud and lies down in it. True when
 * that is what it has decided. */
function soak(g: FaunaGroup, p: FaunaProfile, world: FaunaWorld, clock: number) {
  if (!p.wallows || !midday(world.hour)) return false;
  const leader = g.members[0];
  const wet = wallowNear(world, p, leader);
  if (!wet) return false;
  if (wet.x === leader.x && wet.y === leader.y) g.state = p.art.rest ? "rest" : "idle";
  else {
    g.state = "wander";
    g.target = { ...wet, space: "outside" };
  }
  g.nextDecisionAt = clock + p.calmDecisionSeconds;
  g.since = clock;
  return true;
}

/** After dark a jackal or coyote slips in to remains nobody is standing over.
 * True when that is what it has decided. */
function scavenge(g: FaunaGroup, p: FaunaProfile, world: FaunaWorld, clock: number) {
  if (!p.scavenges || !world.carrion?.length || (world.hour >= 6 && world.hour < 18)) return false;
  const leader = g.members[0];
  const meal = world.carrion
    .filter((c) => hyp(c, leader) <= SCENT && !world.humans.some((h) => hyp(h, c) <= p.alertRadius))
    .sort((a, b) => hyp(a, leader) - hyp(b, leader))[0];
  if (!meal) return false;
  if (hyp(meal, leader) <= 1.5) g.state = p.art.forage ? "forage" : "idle";
  else {
    g.state = "wander";
    g.target = { ...meal, space: "outside" };
  }
  g.nextDecisionAt = clock + p.calmDecisionSeconds;
  g.since = clock;
  return true;
}

/** Ground an animal running for its life prefers: cover it can put between
 * itself and whatever is behind, and the patch it knows. */
type Refuge = { cover: number; home: Point };

/** The neighbour of `m` that best changes distance to `ref`: away when
 * `away`, toward otherwise. Undefined when no legal step helps. With a
 * `refuge` the distance is traded off against the ground, so a bolting deer
 * makes for the treeline rather than straight out across the open. */
function bestStep(
  world: FaunaWorld,
  p: FaunaProfile,
  taken: Bodies,
  m: FaunaMember,
  ref: Point,
  away: boolean,
  refuge?: Refuge,
) {
  const pull = refuge && world.habitat ? refuge : undefined;
  const score = (at: Point) => {
    // Going round a field is a few steps; through it, more than it is worth.
    const d = (away ? hyp(at, ref) : -hyp(at, ref)) - (keptOff(world, p, at) ? 2 : 0);
    if (!pull) return d;
    return (
      d +
      pull.cover * world.habitat!(p.id, at.x, at.y) -
      0.08 * hyp(at, pull.home)
    );
  };
  let best: Point | undefined,
    bestD = score(m);
  let ties = 0;
  for (const n of NEIGHBOURS) {
    const to = { x: m.x + n.x, y: m.y + n.y };
    if (taken.blocks(m, to) || world.occupied(to.x, to.y)) continue;
    if (!stepAllowed(world, p, m, to)) continue;
    const d = score(to);
    const better = d > bestD + 1e-6;
    const tie = Math.abs(d - bestD) <= 1e-6 && best;
    if (better) {
      best = to;
      bestD = d;
      ties = 1;
    } else if (tie && world.rng("fauna-tie") * ++ties < 1) best = to;
  }
  return best;
}

/** Followers keep station: give way when a neighbour is on top of them, and
 * on the move fall in behind the leader, staggered, the way stock walks a
 * lane. Only run for groups near the player; further off the cheap follow
 * does. */
function keepStation(
  world: FaunaWorld,
  p: FaunaProfile,
  g: FaunaGroup,
  taken: Bodies,
  turns: boolean,
  ahead?: Point,
) {
  const leader = g.members[0];
  const [rx, ry] = p.body ?? [0, 0];
  const len = ahead ? hyp(ahead, leader) : 0;
  const ux = len ? (ahead!.x - leader.x) / len : 0,
    uy = len ? (ahead!.y - leader.y) / len : 0;
  // Nose to tail: a body's length across, its depth up and down.
  const gap = Math.max(2, Math.abs(ux) * (2 * rx + 1) + Math.abs(uy) * (ry + 2));
  g.members.forEach((m, i) => {
    if (m === leader) return;
    let crowdedBy: FaunaMember | undefined,
      nearest = p.separationRadius;
    for (const o of g.members) {
      if (o === m) continue;
      const d = hyp(o, m);
      if (d < nearest) {
        crowdedBy = o;
        nearest = d;
      }
    }
    const side = i % 2 ? 0.6 : -0.6;
    const slot = len
      ? {
          x: Math.round(leader.x - ux * gap * i - uy * side),
          y: Math.round(leader.y - uy * gap * i + ux * side),
        }
      : undefined;
    const to = crowdedBy
      ? bestStep(world, p, taken, m, crowdedBy, true)
      : slot
        ? hyp(m, slot) > 1.5
          ? bestStep(world, p, taken, m, slot, false)
          : undefined
        : hyp(m, leader) > p.cohesionRadius * 0.7
          ? bestStep(world, p, taken, m, leader, false)
          : undefined;
    if (to) moveMember(m, to, taken, turns);
  });
}

/** The tick being run, so a move can tell whether the animal is still reeling. */
let now = 0;

function moveMember(
  m: FaunaMember,
  to: Point,
  taken: Bodies,
  all = false,
) {
  if ((m.stun ?? 0) > now) return;
  // A body takes a moment to clear the cell it leaves. The oldest trail is
  // kept, because the sprite is still coming from there.
  if (!m.trail || m.trail.until <= now)
    m.trail = { x: m.x, y: m.y, until: now + TRAIL };
  taken.lift(m);
  face(m, to.x - m.x, to.y - m.y, all);
  m.x = to.x;
  m.y = to.y;
  taken.put(m);
}

/** A mark over one animal's head: "!" when it bolts or is struck, "?" when
 * something catches its eye. The renderer finds the sprite by this id. */
function cue(world: FaunaWorld, g: FaunaGroup, m: FaunaMember, kind: "alarm" | "notice" | "anger", toward?: Point) {
  const n = m.n ?? g.members.indexOf(m);
  world.emit?.({ kind: "cue", who: `${g.id}-${n}`, cue: kind, toward: toward && { x: toward.x, y: toward.y } });
}
const nearestTo = (g: FaunaGroup, at: Point) =>
  g.members.reduce((a, b) => (hyp(b, at) < hyp(a, at) ? b : a));

/** Game seconds a vacated cell stays solid: about one step of the player's. */
const TRAIL = 8;
/** How far a jostled animal goes before it settles. */
const SHY_REACH = 4.5;
/** Seconds an animal paws the ground before it comes. Long enough to read. */
const WINDUP = 18;
/** Cells a charge carries before the animal pulls up. */
const CHARGE_RUN = 9;
/** How far a pack stands off while it circles. */
const RING = 3.2;
/** Past this the quarrel is over. */
const LOSE_INTEREST = 18;

function endAttack(g: FaunaGroup) {
  g.attack = undefined;
  for (const m of g.members) m.pose = undefined;
}

/** The running part of a charge or a lunge: straight down the line fixed when
 * it started, so whoever was standing there has until then to be elsewhere. */
function run(
  g: FaunaGroup,
  m: FaunaMember,
  p: FaunaProfile,
  combat: FaunaCombat,
  world: FaunaWorld,
  clock: number,
  taken: Bodies,
  target: Point,
  reach: number,
) {
  const a = g.attack!,
    dir = a.dir!,
    tier = TIERS[m.tier ?? "ordinary"];
  const from = a.from!;
  let steps = Math.ceil(3 * tier.speed);
  const rest = (seconds: number) => {
    a.phase = "recover";
    a.until = clock + seconds;
    m.pose = p.art.idle ? "idle" : undefined;
  };
  while (steps-- > 0) {
    const ran = (a.ran ?? 0) + 1;
    const next = {
      x: from.x + Math.round(dir.x * ran),
      y: from.y + Math.round(dir.y * ran),
    };
    a.ran = ran;
    if (next.x === m.x && next.y === m.y) continue;
    if (next.x === target.x && next.y === target.y) {
      face(m, next.x - m.x, next.y - m.y, Boolean(p.directions));
      if (world.dodging) {
        world.emit?.({ kind: "dodged", group: g.id, n: m.n! });
        return rest(12);
      }
      world.onMaul?.(
        g,
        m,
        { x: Math.sign(dir.x), y: Math.sign(dir.y) },
        Math.max(1, Math.round(combat.damage * tier.damage)),
      );
      return rest(12);
    }
    if (
      taken.blocks(m, next) ||
      world.occupied(next.x, next.y) ||
      !stepAllowed(world, p, m, next)
    ) {
      // Ran into something. That is the opening.
      if (ran > 2) {
        m.stun = clock + 18;
        world.emit?.({ kind: "slam", group: g.id, n: m.n!, at: next });
        return rest(24);
      }
      return rest(12);
    }
    moveMember(m, next, taken, Boolean(p.directions));
    if (ran >= reach) {
      if (hyp(m, target) <= 2.5)
        world.emit?.({ kind: "dodged", group: g.id, n: m.n! });
      return rest(12);
    }
  }
}

/** A provoked group's tick. Returns false when it has no fight left in it and
 * the ordinary rules should take over. */
function fight(
  g: FaunaGroup,
  p: FaunaProfile,
  world: FaunaWorld,
  clock: number,
  taken: Bodies,
) {
  const target = world.humans[0];
  const lead = g.members[0];
  if (
    (g.provoked ?? 0) <= clock ||
    !target ||
    target.space !== "outside" ||
    hyp(lead, target) > LOSE_INTEREST
  ) {
    g.provoked = undefined;
    endAttack(g);
    return false;
  }
  const combat = faunaCombat(p);
  const turns = Boolean(p.directions);
  const pack = combat.temper === "pack";
  g.target = undefined;
  g.alarm = undefined;
  if (g.state !== "idle" && p.art.idle) {
    g.state = "idle";
    g.since = clock;
  }
  let a = g.attack;
  let m = a && g.members.find((o) => o.n === a!.n);
  if (a && !m) a = g.attack = undefined;
  if (pack) {
    // The ring turns an eighth a tick; each wolf makes for its own place on it.
    g.ring = ((g.ring ?? 0) + 1) % 64;
    g.members.forEach((o, i) => {
      if (o === m) return;
      const angle = (g.ring! / 8 + i / g.members.length) * Math.PI * 2;
      const goal = {
        x: Math.round(target.x + Math.cos(angle) * RING),
        y: Math.round(target.y + Math.sin(angle) * RING),
      };
      o.pose = p.art.stalk ? "stalk" : undefined;
      for (let step = 0; step < 2; step++) {
        if (hyp(o, goal) < 1) break;
        const to = bestStep(world, p, taken, o, goal, false);
        if (!to || (to.x === target.x && to.y === target.y)) break;
        moveMember(o, to, taken, turns);
      }
      face(o, target.x - o.x, target.y - o.y, turns);
    });
  } else
    for (const o of g.members)
      if (o !== m) face(o, target.x - o.x, target.y - o.y, turns);
  if (!a || !m) {
    const ready = g.members
      .filter((o) => (o.stun ?? 0) <= clock)
      .sort((x, y) => hyp(x, target) - hyp(y, target))[0];
    if (!ready) return true;
    if (hyp(ready, target) > (pack ? RING + 2 : CHARGE_RUN - 1)) {
      // Too far to come from here: close the distance first.
      if (!pack) {
        ready.pose = p.art.wander ? "wander" : undefined;
        const to = bestStep(world, p, taken, ready, target, false);
        if (to) moveMember(ready, to, taken, turns);
      }
      return true;
    }
    const seconds = pack ? 12 : WINDUP;
    g.attack = { n: ready.n!, phase: "windup", until: clock + seconds };
    ready.pose =
      pack && p.art.stalk ? "stalk" : p.art.idle ? "idle" : undefined;
    face(ready, target.x - ready.x, target.y - ready.y, turns);
    world.emit?.({ kind: "windup", group: g.id, n: ready.n!, seconds });
    return true;
  }
  if ((m.stun ?? 0) > clock) return true;
  if (a.phase === "windup") {
    face(m, target.x - m.x, target.y - m.y, turns);
    if (clock < a.until) return true;
    const d = hyp(m, target) || 1;
    a.phase = "charge";
    a.dir = { x: (target.x - m.x) / d, y: (target.y - m.y) / d };
    a.ran = 0;
    a.from = { x: m.x, y: m.y };
    m.pose = p.art.chase ? "chase" : p.art.flee ? "flee" : undefined;
    world.emit?.({ kind: pack ? "lunge" : "charge", group: g.id, n: m.n! });
  }
  if (a.phase === "charge")
    run(g, m, p, combat, world, clock, taken, target, pack ? 5 : CHARGE_RUN);
  else if (clock >= a.until) {
    m.pose = undefined;
    g.attack = undefined;
  }
  return true;
}

/** The group a hunter is after this tick, or undefined when it is fed, has
 * lost its quarry, or has a person to worry about instead. A pack holds its
 * quarry between ticks so it does not swap whenever another herd drifts by. */
function chooseQuarry(
  g: FaunaGroup,
  p: FaunaProfile,
  world: FaunaWorld,
  clock: number,
  herds: readonly { group: FaunaGroup; profile: FaunaProfile }[],
) {
  if (!p.preyTags?.length) return undefined;
  if (clock < (g.fedUntil ?? 0)) return undefined;
  if (aerialStates.has(g.state)) return undefined;
  // A house cat hunts under people's feet; a wolf does not.
  const shy = p.category === "wild" ? p.alertRadius : 1;
  if (nearestThreat(world.humans, g.pos, shy)) return undefined;
  // A kept hunter works its whole round, not just what it can see from the step.
  const range = Math.max(
    p.alertRadius * HUNT_RADIUS,
    p.category === "wild" ? 0 : g.homeRadius,
  );
  const edible = herds.filter(
    (h) =>
      h.group.members.length &&
      h.group.id !== g.id &&
      (h.group.burrowed ?? 0) <= clock &&
      h.profile.prey &&
      p.preyTags!.includes(h.profile.prey) &&
      hyp(h.group.pos, g.pos) <= range,
  );
  const held = edible.find((h) => h.group.id === g.quarry);
  // A blown pack gives up. This is what a rabbit lives on: it need only stay
  // ahead until the wolves have nothing left.
  // A cat or a fox that missed makes a dash, not a chase.
  const blown =
    g.state === "chase" &&
    (g.hard ?? 0) >= (p.art.pounce ? DASH : STAMINA * 1.4);
  if (held && !blown) return held.group;
  if (g.quarry) {
    // A run that has gone this long has failed. Give it up and lie down
    // rather than turning straight round onto the next herd.
    g.quarry = undefined;
    if (blown) g.fedUntil = clock + FED / 4;
    return undefined;
  }
  let best: FaunaGroup | undefined,
    bestD = range;
  for (const h of edible) {
    const d = hyp(h.group.pos, g.pos);
    if (d < bestD) {
      best = h.group;
      bestD = d;
    }
  }
  return best;
}

/** The spring: it lands beside the nearest one, and either has it pinned or
 * has missed and scattered the lot. What it pinned is taken next tick. */
function pounce(
  g: FaunaGroup,
  p: FaunaProfile,
  quarry: FaunaGroup,
  victim: FaunaMember,
  world: FaunaWorld,
  clock: number,
  taken: Bodies,
  turns: boolean,
) {
  const lead = g.members[0];
  const land = NEIGHBOURS.map((n) => ({ x: victim.x + n.x, y: victim.y + n.y }))
    .filter(
      (c) =>
        !taken.blocks(lead, c) &&
        !world.occupied(c.x, c.y) &&
        stepAllowed(world, p, lead, c),
    )
    .sort((a, b) => hyp(a, lead) - hyp(b, lead))[0];
  if (land) moveMember(lead, land, taken, turns);
  face(lead, victim.x - lead.x, victim.y - lead.y, turns);
  const prey = faunaProfile(quarry.speciesId);
  // Something already looking its way, or with wings, is harder to pin.
  const odds =
    STRIKE *
    (quarry.alarm !== undefined ? 0.4 : 1) *
    (prey?.locomotion === "ground-and-flight" ? 0.5 : 1);
  g.state = "pounce";
  g.since = clock;
  g.target = undefined;
  g.quarry = undefined;
  g.nextDecisionAt = clock + TICK;
  if (world.rng(`fauna-${g.id}-strike`) < odds) {
    victim.stun = clock + TICK + 1;
    g.catching = {
      group: quarry.id,
      n: victim.n ?? quarry.members.indexOf(victim),
    };
    // One mouse is not a meal.
    g.fedUntil = clock + (prey?.prey === "rodent" ? FED / 4 : FED);
  } else g.fedUntil = clock + SULK;
}

function take(
  g: FaunaGroup,
  p: FaunaProfile,
  groups: FaunaGroup[],
  world: FaunaWorld,
  clock: number,
  taken: Bodies,
) {
  const { group, n } = g.catching!;
  g.catching = undefined;
  const held = groups.find((o) => o.id === group);
  const i = held ? held.members.findIndex((m, k) => (m.n ?? k) === n) : -1;
  if (held && i >= 0) {
    const [dead] = held.members.splice(i, 1);
    taken.lift(dead);
    const next = held.members[0];
    if (next) held.pos = { x: next.x, y: next.y, space: "outside" };
    held.target = undefined;
    world.onKill?.(g, held, dead);
  }
  settle(g, p, held?.speciesId, clock);
}

/** After a kill: something small that has art for it is carried home in the
 * jaws; anything else is eaten where it fell, and then a rest. */
function settle(
  g: FaunaGroup,
  p: FaunaProfile,
  prey: string | undefined,
  clock: number,
) {
  g.since = clock;
  if (prey && p.art.carry && faunaProfile(prey)?.prey !== "ungulate") {
    g.state = "carry";
    g.carrying = prey;
    g.target = { ...g.home };
    g.nextDecisionAt = clock + 10 * TICK;
    return;
  }
  g.state = p.art.rest ? "rest" : "idle";
  g.nextDecisionAt = clock + p.calmDecisionSeconds;
}

/** One six-second step for every group near enough to matter. Groups are
 * visited in id order and draw from the shared counter, so replays agree. */
export function advanceFauna(
  groups: FaunaGroup[],
  world: FaunaWorld,
  clock: number,
) {
  now = clock;
  const taken = new Bodies();
  for (const g of groups) {
    const body = faunaProfile(g.speciesId)?.body;
    for (const m of g.members) taken.place(m, m.young ? [0, 0] : body);
  }
  const herds = groups
    .map((group) => ({ group, profile: faunaProfile(group.speciesId) }))
    .filter(
      (h): h is { group: FaunaGroup; profile: FaunaProfile } => !!h.profile,
    );
  // Who is hunting whom is settled before anything moves, so a herd sees the
  // pack whichever order the groups come in.
  const hunts = new Map<string, FaunaGroup>();
  for (const h of herds) {
    const quarry = chooseQuarry(h.group, h.profile, world, clock, herds);
    if (quarry) hunts.set(h.group.id, quarry);
    else h.group.quarry = undefined;
  }
  /** Hunters on the move that eat an animal of this kind. One creeping up is
   * only seen by luck, and more likely the closer it gets. */
  const stalkers = (p: FaunaProfile, g: FaunaGroup) =>
    p.prey
      ? herds
          .filter(
            (h) =>
              (hunts.has(h.group.id) || h.group.state === "pounce") &&
              h.profile.preyTags?.includes(p.prey!) &&
              (h.group.state !== "stalk" ||
                world.rng(`fauna-${g.id}-spot`) <
                  SPOT *
                    Math.max(0, 1 - hyp(h.group.pos, g.pos) / alertRadius(p))),
          )
          .map((h) => ({ ...h.group.pos }))
      : [];
  /** Meat-eaters this animal keeps clear of even when they are not hunting:
   * a herd does not graze among a sleeping pack, nor hens around a dog. */
  const wary = (p: FaunaProfile, g: FaunaGroup) =>
    p.prey
      ? herds
          .filter(
            (h) =>
              h.group.speciesId !== g.speciesId &&
              h.group.members.length &&
              // A hunter is seen, or not, through the stalking rules.
              !hunts.has(h.group.id) &&
              h.group.state !== "pounce" &&
              (h.profile.preyTags?.includes(p.prey!) ||
                (p.category !== "wild" &&
                  p.prey === "small-animal" &&
                  !!h.profile.preyTags?.length)),
          )
          .map((h) => ({ ...h.group.pos }))
      : [];
  const player = world.humans[0];
  const crowd = groups.map((o) => o.pos);
  // Whatever was already running when the tick began: the alarm calls and
  // the crash of it going carry to everything round about.
  const startled = groups
    .filter((o) => o.state === "flee" || o.state === "takeoff")
    .map((o) => ({ id: o.id, x: o.pos.x, y: o.pos.y }));
  for (const g of [...groups].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const p = faunaProfile(g.speciesId);
    if (!p || !g.members.length) continue;
    if (g.burrowed !== undefined) {
      // It does not come up while whatever sent it down is still about.
      const about =
        nearestThreat(world.humans, g.pos, p.alertRadius) ||
        groups.some((o) => !!faunaProfile(o.speciesId)?.preyTags?.length && hyp(o.pos, g.pos) < p.alertRadius * 2);
      if (g.burrowed > clock || about) {
        if (about) g.burrowed = Math.max(g.burrowed, clock + 30);
        continue;
      }
      g.burrowed = undefined;
    }
    // A gander does not wait to be struck: come onto its ground and it comes for you.
    if (
      p.defends &&
      g.provoked === undefined &&
      player?.space === "outside" &&
      (g.hurtUntil ?? 0) <= clock &&
      g.members.some((m) => hyp(m, player) <= p.defends!)
    ) {
      g.provoked = clock + 30;
      cue(world, g, nearestTo(g, player), "anger", player);
    }
    if (g.provoked !== undefined && fight(g, p, world, clock, taken)) {
      const lead = g.members[0];
      g.pos = { x: lead.x, y: lead.y, space: "outside" };
      continue;
    }
    if (g.catching && clock > g.since) take(g, p, groups, world, clock, taken);
    const near = !player || hyp(player, g.pos) <= DETAIL;
    const chasers = stalkers(p, g);
    const shunned = wary(p, g);
    const menaces =
      chasers.length || shunned.length
        ? [...world.humans, ...chasers, ...shunned]
        : world.humans;
    const bird = p.locomotion === "ground-and-flight";
    const kept = p.category !== "wild";
    const turns = Boolean(p.directions);
    const airborne = aerialStates.has(g.state);
    // Struck by a person: even a kept animal runs, and from further off.
    const hurt = (g.hurtUntil ?? 0) > clock;
    const heard = p.preyTags?.length
      ? undefined
      : startled.find((s) => s.id !== g.id && hyp(s, g.pos) < HEARD);
    const radius = (hurt ? Math.max(p.alertRadius, 10) : alertRadius(p)) * (heard && !kept ? 2 : 1);
    // A hurt animal is past being crept up on.
    const noise = hurt ? 1 : (world.noise ?? 1);
    // A kept animal's shove-width radius is too tight for a dog in the flock.
    const threat =
      nearestThreat(menaces, g.pos, radius, noise) ??
      (kept && shunned.length ? nearestThreat(shunned, g.pos, 3) : undefined);
    // How close the trouble is as a share of the radius: 0 on top of the
    // animal, 1 at the edge of what it notices.
    const close = threat
      ? Math.min(
          1,
          hyp(threat, g.pos) / (threat === player ? noise : 1) / radius,
        )
      : 1;
    // A kept animal's radius is already the width of a shove, so there is no
    // watching band inside it: anything it notices, it steps away from.
    const band = kept || hurt ? 1 : ALERT_BAND;

    // A thing that is hunting you is not a shape on the skyline: it is seen
    // at once and run from flat out.
    const hunted = !!threat && chasers.includes(threat);
    if (threat && close <= band)
      g.panic = Math.max(g.panic ?? 0, hunted ? 1 : 1 - close);
    else if (!threat) g.panic = Math.max(0, (g.panic ?? 0) - 0.05);
    if (!threat) g.alarm = undefined;
    else if (!airborne && g.alarm === undefined) {
      // Heads up first. How long an animal watches before it goes depends on
      // how close the thing is and on the animal: this is what stops a herd
      // breaking on the same tick, all together, every time.
      const beat = Math.floor(
        (hunted ? 0 : close * 3) + world.rng(`fauna-${g.id}-notice`) * 2,
      );
      g.alarm = clock + beat * TICK;
      g.target = undefined;
      // A kept animal steps round a person without a second look.
      if (near && (!kept || hurt || threat !== player))
        cue(world, g, nearestTo(g, threat), hunted ? "alarm" : "notice", threat);
      // Stop where it is. A species without idle art stands in whatever it
      // does stand in, so a sparrow watches from its perch.
      if (
        g.state !== "flee" &&
        !aerialStates.has(g.state) &&
        !standing(p, g.state)
      ) {
        g.state = p.art.idle ? "idle" : p.art.perch ? "perch" : "rest";
        g.since = clock;
      }
    }
    // Nothing in sight, but something nearby went: heads come up toward it.
    if (heard && !threat && !airborne && (g.state === "graze" || g.state === "forage") && p.art.idle) {
      g.state = "idle";
      g.since = clock;
      g.nextDecisionAt = Math.max(g.nextDecisionAt, clock + 2 * TICK);
      for (const m of g.members) face(m, heard.x - m.x, heard.y - m.y, turns);
      if (near) cue(world, g, nearestTo(g, heard), "notice", heard);
    }
    // Watching: the group holds still with its head turned. It only breaks
    // once the thing is inside the band, and only after its own beat.
    const watching = threat && g.alarm !== undefined && clock < g.alarm;
    const breaking =
      threat && g.alarm !== undefined && clock >= g.alarm && close <= band;
    if (watching || (threat && !breaking))
      for (const m of g.members)
        face(m, threat!.x - m.x, threat!.y - m.y, turns);

    if (breaking && !airborne) {
      if (bird) {
        g.state = "takeoff";
        g.since = clock;
        if (near) cue(world, g, nearestTo(g, threat), "alarm", threat);
        // Off to a spot on the far side of home from whoever came too close.
        const away = {
          x: g.home.x + Math.sign(g.home.x - threat.x) * 3,
          y: g.home.y + Math.sign(g.home.y - threat.y) * 3,
        };
        const land = freeCellNear(
          world,
          away,
          g.homeRadius,
          `fauna-${g.id}-flee`,
          p.id,
        );
        g.target = { ...(land ?? away), space: "outside" };
        g.nextDecisionAt = clock + TICK;
      } else if (
        (!kept || hurt || chasers.includes(threat)) &&
        g.state !== "flee"
      ) {
        g.state = "flee";
        g.since = clock;
        g.target = undefined;
        if (near && !hurt) cue(world, g, nearestTo(g, threat), "alarm", threat);
      }
    } else if (
      g.state === "flee" &&
      clock - g.since >= 3 * TICK &&
      !nearestThreat(menaces, g.pos, p.alertRadius * 1.5)
    ) {
      g.state = "idle";
      g.since = clock;
      // Wary afterwards: it goes back to feeding sooner than it would
      // otherwise have looked up.
      g.nextDecisionAt = clock + p.urgentDecisionSeconds;
    }

    if (g.state === "takeoff" && clock - g.since >= TICK) {
      g.state = "flight";
      g.since = clock;
    }
    if (g.state === "landing" && clock - g.since >= TICK) {
      g.state = "perch";
      g.since = clock;
      g.nextDecisionAt = clock + p.urgentDecisionSeconds;
    }
    // A hunter with quarry in view creeps or runs at it; either way it has
    // nothing to decide until the chase is over.
    // Settled before anything moved: another hunter may since have taken the last of it.
    const sought = hunts.get(g.id);
    const quarry = sought?.members.length ? sought : undefined;
    const victim = quarry?.members.reduce((a, b) =>
      hyp(b, g.members[0]) < hyp(a, g.members[0]) ? b : a,
    );
    // A cat or a fox creeps in and springs; anything else runs its quarry down.
    const springs =
      !!p.art.pounce &&
      !!victim &&
      quarry!.state !== "flee" &&
      hyp(victim, g.members[0]) <= LEAP;
    if (quarry && springs)
      pounce(g, p, quarry, victim!, world, clock, taken, turns);
    else if (quarry) {
      if (near && g.quarry !== quarry.id)
        cue(world, g, g.members[0], "notice", quarry.pos);
      g.quarry = quarry.id;
      const want: FaunaState =
        quarry.state === "flee" ||
        (!p.art.pounce && hyp(g.pos, quarry.pos) <= POUNCE)
          ? "chase"
          : "stalk";
      if (g.state !== want) {
        g.state = want;
        g.since = clock;
      }
      g.target = { ...quarry.pos };
      g.nextDecisionAt = clock + p.urgentDecisionSeconds;
    }
    if (
      clock >= g.nextDecisionAt &&
      g.state !== "flee" &&
      !quarry &&
      !watching &&
      !aerialStates.has(g.state)
    ) {
      if (g.follows) {
        const mother = groups.find((o) => o.id === g.follows);
        if (mother?.members.length) {
          g.home = { ...mother.pos, space: "outside" };
          g.homeRadius = 2;
        }
      }
      if (p.followsHerds) {
        const herd = herds
          .filter(
            (h) =>
              h.profile.art.graze &&
              h.profile.locomotion === "ground" &&
              hyp(h.group.pos, g.pos) <= HERD_RANGE,
          )
          .sort((a, b) => hyp(a.group.pos, g.pos) - hyp(b.group.pos, g.pos))[0];
        if (herd) {
          g.home = { ...herd.group.pos, space: "outside" };
          g.homeRadius = 3;
        }
      }
      // Predators go in twice: new ground is chosen well clear of them.
      const avoid = near ? [...crowd, ...shunned, ...shunned] : shunned;
      decide(g, p, world, clock, avoid.length ? avoid : undefined);
    }

    if (
      g.state === "dig" &&
      clock - g.since >= 2 * TICK &&
      clock - g.since < 3 * TICK
    )
      world.onDig?.(g, { x: g.members[0].x, y: g.members[0].y });
    const fleeing = g.state === "flee";
    const flying = g.state === "flight";
    const running = fleeing || g.state === "chase";
    // Hard running is banked and paid back at half rate. A blown animal keeps
    // going but not at the pace it started at, which is how a chase ends.
    g.hard = Math.max(
      0,
      Math.min(STAMINA * 1.5, (g.hard ?? 0) + (running ? TICK : -TICK / 2)),
    );
    const winded = g.hard >= STAMINA ? WINDED : 1;
    const boost =
      (fleeing
        ? // Graded: a shape at the edge of what it notices is a trot, a person
          // on top of it is a bolt.
          (kept ? 1 : 1.2) + (kept ? 0.6 : 1) * (g.panic ?? 1)
        : flying
          ? 3
          : g.state === "chase"
            ? // Short of a fleeing deer, behind a rabbit with a head start.
              1.8
            : g.state === "stalk"
              ? 0.5
              : 1) *
      (running ? winded : 1) *
      TIERS[g.members[0].tier ?? "ordinary"].speed;
    g.stride += p.pace * boost;
    let steps = Math.min(3, Math.floor(g.stride));
    g.stride -= steps;
    const leader = g.members[0];
    const bolting =
      fleeing && threat
        ? [...g.members].sort((a, b) => hyp(a, threat) - hyp(b, threat))
        : undefined;
    // Only worth weighing cover for animals the player can see running.
    const refuge: Refuge | undefined =
      fleeing && near && world.habitat
        ? { cover: 1.6, home: g.home }
        : undefined;

    while (steps-- > 0) {
      if (flying && g.target) {
        // In the air nothing on the ground is in the way.
        for (const [i, m] of g.members.entries()) {
          const [ox, oy] = SPREAD[i % SPREAD.length];
          const goal = { x: g.target.x + ox, y: g.target.y + oy };
          const dx = Math.sign(goal.x - m.x),
            dy = Math.sign(goal.y - m.y);
          if (dx || dy)
            moveMember(m, { x: m.x + dx, y: m.y + dy }, taken, turns);
        }
        if (hyp(leader, g.target) < 1) {
          g.state = "landing";
          g.since = clock;
          g.target = undefined;
          steps = 0;
        }
      } else if (fleeing && threat) {
        let moved = false;
        // Nearest first: the animal with the thing on its heels picks its cell
        // before the ones behind take the ground it needed.
        // A rabbit makes for its hole unless the trouble is between them.
        const hole = p.burrows && hyp(g.home, threat) > hyp(leader, threat) ? g.home : undefined;
        for (const m of bolting!) {
          const to = hole
            ? bestStep(world, p, taken, m, hole, false)
            : bestStep(world, p, taken, m, threat, true, refuge);
          if (to) {
            moveMember(m, to, taken, turns);
            moved = true;
          } else face(m, threat.x - m.x, threat.y - m.y, turns);
        }
        // Cornered: nothing to do but face whoever is coming.
        if (!moved) steps = 0;
      } else if (kept && threat && breaking) {
        for (const m of g.members)
          if (hyp(m, threat) < (world.humans.includes(threat) ? radius : 3)) {
            const to = bestStep(world, p, taken, m, threat, true);
            if (to) moveMember(m, to, taken, turns);
          }
        steps = 0;
      } else if (watching) {
        steps = 0;
      } else if (g.target && !airborne) {
        const ahead = waypoint(world, p, g, leader);
        const to = bestStep(world, p, taken, leader, ahead, false);
        if (to) moveMember(leader, to, taken, turns);
        if (!quarry && (!to || hyp(leader, g.target) < 1)) {
          g.target = undefined;
          g.route = undefined;
          if (g.carrying) {
            world.onDrop?.(g, g.carrying, { x: leader.x, y: leader.y });
            g.carrying = undefined;
            g.state = p.art.rest ? "rest" : "idle";
            g.nextDecisionAt = clock + p.calmDecisionSeconds;
          }
          if (g.state === "wander" || g.state === "stalk") {
            g.state = "idle";
            g.nextDecisionAt = clock + 2 * TICK;
          }
          steps = 0;
        }
        if (near) keepStation(world, p, g, taken, turns, ahead);
        else {
          const follow = Math.max(1.6, p.separationRadius + 0.6);
          for (const m of g.members.slice(1))
            if (hyp(m, leader) > follow) {
              const up = bestStep(world, p, taken, m, leader, false);
              if (up) moveMember(m, up, taken, turns);
            }
        }
      } else if (
        (g.state === "forage" || g.state === "graze" || g.state === "idle") &&
        !airborne
      ) {
        // Grazing shuffle: each animal drifts on its own account, so a feeding
        // group mills about instead of one of them twitching per tick.
        const drift = g.state === "idle" ? 0.1 : 0.25;
        const wet = !!world.rain && !!p.art.graze;
        for (const m of g.members) {
          // Walked into: it keeps going, away from whoever did it, a step a
          // tick until it has put some ground between them.
          if (m.shy && m.shy.until > clock) {
            const from = m.shy;
            const away = NEIGHBOURS.map((n) => ({ x: m.x + n.x, y: m.y + n.y }))
              .filter(
                (to) =>
                  hyp(to, from) > hyp(m, from) &&
                  hyp(to, g.home) <= g.homeRadius + 2 &&
                  !taken.blocks(m, to) &&
                  !world.occupied(to.x, to.y) &&
                  stepAllowed(world, p, m, to),
              )
              .sort((a, b) => hyp(b, from) - hyp(a, from))[0];
            if (away && hyp(m, from) < SHY_REACH)
              moveMember(m, away, taken, turns);
            continue;
          }
          // Off the crop first, then back to the others if the walk strung
          // them out; only then the idle shuffle.
          // A calf keeps to its mother; in the rain the herd closes up.
          const mother = m.young ? g.members.find((o) => o.n === m.mother) : undefined;
          const back = keptOff(world, p, m)
            ? bestStep(world, p, taken, m, g.home, false)
            : mother && hyp(m, mother) > (p.body?.[0] ? 2.3 : 1.5)
              ? bestStep(world, p, taken, m, mother, false)
              : p.social === "herd" && hyp(m, leader) > (wet ? p.separationRadius + 1.5 : p.cohesionRadius + 1)
                ? bestStep(world, p, taken, m, leader, false)
                : undefined;
          if (back) {
            moveMember(m, back, taken, turns);
            continue;
          }
          if (wet) {
            if (world.wind !== undefined) face(m, Math.cos(world.wind), Math.sin(world.wind), turns);
            continue;
          }
          // At first light the calves kick up their heels: a dash out and
          // round, never far from the mother.
          if (mother && world.hour >= 5.5 && world.hour < 8 && world.rng(`fauna-${g.id}-play`) < 0.08) {
            const n = NEIGHBOURS[Math.floor(world.rng(`fauna-${g.id}-play`) * 8)];
            for (let i = 0; i < 2; i++) {
              const to = { x: m.x + n.x, y: m.y + n.y };
              if (
                hyp(to, mother) > 4 ||
                keptOff(world, p, to) ||
                taken.blocks(m, to) ||
                world.occupied(to.x, to.y) ||
                !stepAllowed(world, p, m, to)
              )
                break;
              moveMember(m, to, taken, turns);
            }
            continue;
          }
          // Each on its own beat and its own period, off the shared rng so
          // nothing else shifts and no two turn in step.
          const period = 13 + (((m.n ?? 0) * 5) % 11);
          const beat = Math.floor(clock / TICK) + (m.n ?? 0) * 7;
          if (beat % period === 0)
            m.direction = turns
              ? (Math.floor(beat / period) % 4 as FaunaMember["direction"])
              : Math.floor(beat / period) % 2
                ? 1
                : 3;
          if (roosting(p, world.hour) || world.rng(`fauna-${g.id}-drift`) >= drift) continue;
          const n =
            NEIGHBOURS[Math.floor(world.rng(`fauna-${g.id}-drift`) * 8)];
          const to = { x: m.x + n.x, y: m.y + n.y };
          if (
            hyp(to, leader) <= p.cohesionRadius &&
            hyp(to, g.home) <= g.homeRadius + 1 &&
            !keptOff(world, p, to) &&
            !taken.blocks(m, to) &&
            !world.occupied(to.x, to.y) &&
            stepAllowed(world, p, m, to)
          )
            moveMember(m, to, taken, turns);
        }
        steps = 0;
      } else steps = 0;
    }
    if (p.burrows && g.state === "flee" && hyp(leader, g.home) <= 1.5) {
      g.burrowed = clock + 120 + world.rng(`fauna-${g.id}-burrow`) * 180;
      // Gone to ground: whatever was after it gives up and goes elsewhere.
      for (const o of groups)
        if (o.quarry === g.id) {
          o.quarry = undefined;
          o.fedUntil = Math.max(o.fedUntil ?? 0, clock + GONE_TO_GROUND);
        }
      g.state = "rest";
      g.panic = 0;
      g.alarm = undefined;
      g.since = clock;
      g.nextDecisionAt = g.burrowed;
    }
    if (p.wallows && world.topography && (g.state === "rest" || g.state === "idle"))
      for (const m of g.members)
        if (wallowable(world.topography(m.x, m.y))) m.muddy = clock + MUD_DRIES;
    g.pos = { x: leader.x, y: leader.y, space: "outside" };
    if (quarry && g.state === "chase") {
      const hit = quarry.members.findIndex((m) =>
        g.members.some((h) => hyp(h, m) <= REACH),
      );
      if (hit >= 0 && world.rng(`fauna-${g.id}-hold`) < HOLD) {
        const [dead] = quarry.members.splice(hit, 1);
        taken.lift(dead);
        const next = quarry.members[0];
        if (next) quarry.pos = { x: next.x, y: next.y, space: "outside" };
        quarry.target = undefined;
        // One mouse is not a meal.
        g.fedUntil =
          clock +
          (faunaProfile(quarry.speciesId)?.prey === "rodent" ? FED / 4 : FED);
        g.quarry = undefined;
        g.target = undefined;
        world.onKill?.(g, quarry, dead);
        settle(g, p, quarry.speciesId, clock);
      }
    }
  }
}
