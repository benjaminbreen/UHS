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
import { TIERS, type CombatEventInput } from "./combat";

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
  emit?(event: CombatEventInput): void;
  /** A hunter has pulled a member of `prey` down on `at`. */
  onKill?(hunter: FaunaGroup, prey: FaunaGroup, at: Point): void;
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

/** Ground rules for one step. A person scrambles up a terrace and drops off
 * any edge; most animals keep to their level unless a slope joins the two.
 * A climber (the wolf) takes the person's rule. */
export function stepAllowed(
  world: Pick<FaunaWorld, "blocked" | "canCross" | "topography">,
  profile: Pick<FaunaProfile, "climbs">,
  from: Point,
  to: Point,
) {
  if (world.blocked(to.x, to.y)) return false;
  if (world.canCross && !world.canCross(from, to)) return false;
  if (!world.topography || profile.climbs) return true;
  const a = world.topography(from.x, from.y),
    b = world.topography(to.x, to.y);
  return a.height === b.height || !!a.ramp || !!b.ramp;
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
    if (world.blocked(c.x, c.y) || world.occupied(c.x, c.y)) continue;
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
  const feed = p.art.graze ? "graze" : p.art.forage ? "forage" : "idle";
  const doze = p.art.rest ? "rest" : "idle";
  if (g.gateId) {
    // Kept herds: out through the gate by day when the herder has opened it,
    // back to the pen for the night.
    const out = world.hour >= 8 && world.hour < 17 && world.gateOpen(g.gateId);
    const goal = out && g.pasture ? g.pasture : g.home;
    if (hyp(g.pos, goal) > 2.5) {
      g.state = "wander";
      g.target = { ...goal };
    } else if (out) {
      const local = freeCellNear(world, goal, 3, `fauna-${g.id}-graze`, p.id);
      g.state = pick(world, `fauna-${g.id}-state`, [
        [feed, 5],
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
  g.state = pick(world, `fauna-${g.id}-state`, [
    [doze, tired ? 7 : 1],
    ["idle", 2],
    [feed, tired ? 1 : 4],
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
  taken: Set<string>,
  m: FaunaMember,
  ref: Point,
  away: boolean,
  refuge?: Refuge,
) {
  const pull = refuge && world.habitat ? refuge : undefined;
  const score = (at: Point) => {
    const d = away ? hyp(at, ref) : -hyp(at, ref);
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
    if (taken.has(`${to.x},${to.y}`) || world.occupied(to.x, to.y)) continue;
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

/** Followers keep station: give way when a neighbour is on top of them, close
 * up when the leader gets ahead. A herd holds its shape instead of trailing
 * the leader in a line. Only run for groups near the player; further off the
 * cheap follow does. */
function keepStation(
  world: FaunaWorld,
  p: FaunaProfile,
  g: FaunaGroup,
  taken: Set<string>,
  turns: boolean,
) {
  const leader = g.members[0];
  for (const m of g.members) {
    if (m === leader) continue;
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
    const to = crowdedBy
      ? bestStep(world, p, taken, m, crowdedBy, true)
      : hyp(m, leader) > p.cohesionRadius * 0.7
        ? bestStep(world, p, taken, m, leader, false)
        : undefined;
    if (to) moveMember(m, to, taken, turns);
  }
}

/** The tick being run, so a move can tell whether the animal is still reeling. */
let now = 0;

function moveMember(
  m: FaunaMember,
  to: Point,
  taken: Set<string>,
  all = false,
) {
  if ((m.stun ?? 0) > now) return;
  taken.delete(`${m.x},${m.y}`);
  face(m, to.x - m.x, to.y - m.y, all);
  m.x = to.x;
  m.y = to.y;
  taken.add(`${m.x},${m.y}`);
}

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
  taken: Set<string>,
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
      taken.has(`${next.x},${next.y}`) ||
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
  taken: Set<string>,
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
  if (nearestThreat(world.humans, g.pos, p.alertRadius)) return undefined;
  const range = p.alertRadius * HUNT_RADIUS;
  const edible = herds.filter(
    (h) =>
      h.group.members.length &&
      h.group.id !== g.id &&
      h.profile.prey &&
      p.preyTags!.includes(h.profile.prey) &&
      hyp(h.group.pos, g.pos) <= range,
  );
  const held = edible.find((h) => h.group.id === g.quarry);
  // A blown pack gives up. This is what a rabbit lives on: it need only stay
  // ahead until the wolves have nothing left.
  const blown = g.state === "chase" && (g.hard ?? 0) >= STAMINA * 1.4;
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

/** One six-second step for every group near enough to matter. Groups are
 * visited in id order and draw from the shared counter, so replays agree. */
export function advanceFauna(
  groups: FaunaGroup[],
  world: FaunaWorld,
  clock: number,
) {
  now = clock;
  const taken = new Set<string>();
  for (const g of groups) for (const m of g.members) taken.add(`${m.x},${m.y}`);
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
  /** Hunters on the move that eat an animal of this kind. */
  const stalkers = (p: FaunaProfile) =>
    p.prey
      ? herds
          .filter(
            (h) =>
              hunts.has(h.group.id) && h.profile.preyTags?.includes(p.prey!),
          )
          .map((h) => ({ ...h.group.pos }))
      : [];
  const player = world.humans[0];
  const crowd = groups.map((o) => o.pos);
  for (const g of [...groups].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const p = faunaProfile(g.speciesId);
    if (!p || !g.members.length) continue;
    if (g.provoked !== undefined && fight(g, p, world, clock, taken)) {
      const lead = g.members[0];
      g.pos = { x: lead.x, y: lead.y, space: "outside" };
      continue;
    }
    const near = !player || hyp(player, g.pos) <= DETAIL;
    const chasers = stalkers(p);
    const menaces = chasers.length
      ? [...world.humans, ...chasers]
      : world.humans;
    const bird = p.locomotion === "ground-and-flight";
    const kept = p.category !== "wild";
    const turns = Boolean(p.directions);
    const airborne = aerialStates.has(g.state);
    // Struck by a person: even a kept animal runs, and from further off.
    const hurt = (g.hurtUntil ?? 0) > clock;
    const radius = hurt ? Math.max(p.alertRadius, 10) : alertRadius(p);
    // A hurt animal is past being crept up on.
    const noise = hurt ? 1 : (world.noise ?? 1);
    const threat = nearestThreat(menaces, g.pos, radius, noise);
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
    const quarry = hunts.get(g.id);
    if (quarry) {
      g.quarry = quarry.id;
      const want: FaunaState =
        hyp(g.pos, quarry.pos) <= POUNCE || quarry.state === "flee"
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
    )
      decide(g, p, world, clock, near ? crowd : undefined);

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
        for (const m of bolting!) {
          const to = bestStep(world, p, taken, m, threat, true, refuge);
          if (to) {
            moveMember(m, to, taken, turns);
            moved = true;
          } else face(m, threat.x - m.x, threat.y - m.y, turns);
        }
        // Cornered: nothing to do but face whoever is coming.
        if (!moved) steps = 0;
      } else if (kept && threat && breaking) {
        for (const m of g.members)
          if (hyp(m, threat) < radius) {
            const to = bestStep(world, p, taken, m, threat, true);
            if (to) moveMember(m, to, taken, turns);
          }
        steps = 0;
      } else if (watching) {
        steps = 0;
      } else if (g.target && !airborne) {
        const to = bestStep(world, p, taken, leader, g.target, false);
        if (to) moveMember(leader, to, taken, turns);
        if (!quarry && (!to || hyp(leader, g.target) < 1)) {
          g.target = undefined;
          if (g.state === "wander" || g.state === "stalk") {
            g.state = "idle";
            g.nextDecisionAt = clock + 2 * TICK;
          }
          steps = 0;
        }
        if (near) keepStation(world, p, g, taken, turns);
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
        for (const m of g.members) {
          if (world.rng(`fauna-${g.id}-drift`) >= drift) continue;
          const n =
            NEIGHBOURS[Math.floor(world.rng(`fauna-${g.id}-drift`) * 8)];
          const to = { x: m.x + n.x, y: m.y + n.y };
          if (
            hyp(to, leader) <= p.cohesionRadius &&
            hyp(to, g.home) <= g.homeRadius + 1 &&
            !taken.has(`${to.x},${to.y}`) &&
            !world.occupied(to.x, to.y) &&
            stepAllowed(world, p, m, to)
          )
            moveMember(m, to, taken, turns);
        }
        steps = 0;
      } else steps = 0;
    }
    g.pos = { x: leader.x, y: leader.y, space: "outside" };
    if (quarry && g.state === "chase") {
      const hit = quarry.members.findIndex((m) =>
        g.members.some((h) => hyp(h, m) <= REACH),
      );
      if (hit >= 0 && world.rng(`fauna-${g.id}-hold`) < HOLD) {
        const [dead] = quarry.members.splice(hit, 1);
        taken.delete(`${dead.x},${dead.y}`);
        const next = quarry.members[0];
        if (next) quarry.pos = { x: next.x, y: next.y, space: "outside" };
        quarry.target = undefined;
        g.fedUntil = clock + FED;
        g.quarry = undefined;
        g.target = undefined;
        g.state = p.art.rest ? "rest" : "idle";
        g.since = clock;
        g.nextDecisionAt = clock + p.calmDecisionSeconds;
        world.onKill?.(g, quarry, dead);
      }
    }
  }
}
