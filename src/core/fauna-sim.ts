import type { Point, Position } from "./types";
import type { TopographyCell } from "./topography";
import { aerialStates, type FaunaGroup, type FaunaMember } from "./fauna";
import { faunaProfile, type FaunaProfile } from "../content/fauna";

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

function nearestHuman(humans: readonly Position[], at: Point, radius: number) {
  let best: Position | undefined,
    bestD = radius;
  for (const h of humans) {
    if (h.space !== "outside") continue;
    const d = hyp(h, at);
    if (d < bestD) {
      best = h;
      bestD = d;
    }
  }
  return best;
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

/** A free cell within `radius` of `around`, or undefined after a few tries. */
function freeCellNear(
  world: FaunaWorld,
  around: Point,
  radius: number,
  purpose: string,
) {
  for (let i = 0; i < 6; i++) {
    const angle = world.rng(purpose) * Math.PI * 2,
      r = 1 + world.rng(purpose) * Math.max(1, radius - 1);
    const c = {
      x: Math.round(around.x + Math.cos(angle) * r),
      y: Math.round(around.y + Math.sin(angle) * r),
    };
    if (!world.blocked(c.x, c.y) && !world.occupied(c.x, c.y)) return c;
  }
  return undefined;
}

function decide(g: FaunaGroup, p: FaunaProfile, world: FaunaWorld, clock: number) {
  const bird = p.locomotion === "ground-and-flight";
  const calm = () =>
    clock + p.calmDecisionSeconds * (0.5 + world.rng(`fauna-${g.id}-wait`));
  g.target = undefined;
  if (g.gateId) {
    // Kept herds: out through the gate by day when the herder has opened it,
    // back to the pen for the night.
    const out = world.hour >= 8 && world.hour < 17 && world.gateOpen(g.gateId);
    const goal = out && g.pasture ? g.pasture : g.home;
    if (hyp(g.pos, goal) > 2.5) {
      g.state = "wander";
      g.target = { ...goal };
    } else if (out) {
      const local = freeCellNear(world, goal, 3, `fauna-${g.id}-graze`);
      g.state = pick(world, `fauna-${g.id}-state`, [
        ["graze", 5],
        ["idle", 2],
        ["wander", local ? 2 : 0],
      ]);
      if (g.state === "wander" && local) g.target = { ...local, space: "outside" };
    } else
      g.state = pick(world, `fauna-${g.id}-state`, [
        ["rest", resting(p, world.hour) ? 6 : 2],
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
      : freeCellNear(world, g.home, g.homeRadius, `fauna-${g.id}-hop`);
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
  const feed = p.art.graze ? "graze" : p.art.forage ? "forage" : "idle";
  const prowl = p.art.stalk ? "stalk" : "wander";
  const roam = freeCellNear(world, g.home, g.homeRadius, `fauna-${g.id}-roam`);
  const tired = resting(p, world.hour);
  g.state = pick(world, `fauna-${g.id}-state`, [
    ["rest", tired ? 7 : 1],
    ["idle", 2],
    [feed, tired ? 1 : 4],
    [roam ? (world.rng(`fauna-${g.id}-gait`) < 0.3 ? prowl : "wander") : "idle", tired ? 1 : 3],
  ]);
  if ((g.state === "wander" || g.state === "stalk") && roam)
    g.target = { ...roam, space: "outside" };
  g.nextDecisionAt = calm();
  g.since = clock;
}

/** The neighbour of `m` that best changes distance to `ref`: away when
 * `away`, toward otherwise. Undefined when no legal step helps. */
function bestStep(
  world: FaunaWorld,
  p: FaunaProfile,
  taken: Set<string>,
  m: FaunaMember,
  ref: Point,
  away: boolean,
) {
  const here = hyp(m, ref);
  let best: Point | undefined,
    bestD = here;
  let ties = 0;
  for (const n of NEIGHBOURS) {
    const to = { x: m.x + n.x, y: m.y + n.y };
    if (taken.has(`${to.x},${to.y}`) || world.occupied(to.x, to.y)) continue;
    if (!stepAllowed(world, p, m, to)) continue;
    const d = hyp(to, ref);
    const better = away ? d > bestD + 1e-6 : d < bestD - 1e-6;
    const tie = Math.abs(d - bestD) <= 1e-6 && best;
    if (better) {
      best = to;
      bestD = d;
      ties = 1;
    } else if (tie && world.rng("fauna-tie") * ++ties < 1) best = to;
  }
  return best;
}

function moveMember(
  m: FaunaMember,
  to: Point,
  taken: Set<string>,
  all = false,
) {
  taken.delete(`${m.x},${m.y}`);
  face(m, to.x - m.x, to.y - m.y, all);
  m.x = to.x;
  m.y = to.y;
  taken.add(`${m.x},${m.y}`);
}

/** One six-second step for every group near enough to matter. Groups are
 * visited in id order and draw from the shared counter, so replays agree. */
export function advanceFauna(
  groups: FaunaGroup[],
  world: FaunaWorld,
  clock: number,
) {
  const taken = new Set<string>();
  for (const g of groups) for (const m of g.members) taken.add(`${m.x},${m.y}`);
  for (const g of [...groups].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const p = faunaProfile(g.speciesId);
    if (!p || !g.members.length) continue;
    const bird = p.locomotion === "ground-and-flight";
    const kept = p.category !== "wild";
    const turns = Boolean(p.directions);
    const airborne = aerialStates.has(g.state);
    const threat = nearestHuman(world.humans, g.pos, alertRadius(p));

    if (threat && !airborne) {
      if (bird) {
        g.state = "takeoff";
        g.since = clock;
        // Off to a spot on the far side of home from whoever came too close.
        const away = {
          x: g.home.x + Math.sign(g.home.x - threat.x) * 3,
          y: g.home.y + Math.sign(g.home.y - threat.y) * 3,
        };
        const land = freeCellNear(world, away, g.homeRadius, `fauna-${g.id}-flee`);
        g.target = { ...(land ?? away), space: "outside" };
        g.nextDecisionAt = clock + TICK;
      } else if (!kept && g.state !== "flee") {
        g.state = "flee";
        g.since = clock;
        g.target = undefined;
      }
    } else if (
      g.state === "flee" &&
      clock - g.since >= 3 * TICK &&
      !nearestHuman(world.humans, g.pos, p.alertRadius * 1.5)
    ) {
      g.state = "idle";
      g.since = clock;
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
    if (
      clock >= g.nextDecisionAt &&
      g.state !== "flee" &&
      !aerialStates.has(g.state)
    )
      decide(g, p, world, clock);

    const fleeing = g.state === "flee";
    const flying = g.state === "flight";
    const boost = fleeing
      ? kept
        ? 1.5
        : 2
      : flying
        ? 3
        : g.state === "stalk"
          ? 0.5
          : 1;
    g.stride += p.pace * boost;
    let steps = Math.min(3, Math.floor(g.stride));
    g.stride -= steps;
    const leader = g.members[0];

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
        for (const m of g.members) {
          const to = bestStep(world, p, taken, m, threat, true);
          if (to) {
            moveMember(m, to, taken, turns);
            moved = true;
          } else face(m, threat.x - m.x, threat.y - m.y, turns);
        }
        // Cornered: nothing to do but face whoever is coming.
        if (!moved) steps = 0;
      } else if (kept && threat) {
        for (const m of g.members)
          if (hyp(m, threat) < alertRadius(p)) {
            const to = bestStep(world, p, taken, m, threat, true);
            if (to) moveMember(m, to, taken, turns);
          }
        steps = 0;
      } else if (g.target && !airborne) {
        const to = bestStep(world, p, taken, leader, g.target, false);
        if (to) moveMember(leader, to, taken, turns);
        if (!to || hyp(leader, g.target) < 1) {
          g.target = undefined;
          if (g.state === "wander" || g.state === "stalk") {
            g.state = "idle";
            g.nextDecisionAt = clock + 2 * TICK;
          }
          steps = 0;
        }
        const follow = Math.max(1.6, p.separationRadius + 0.6);
        for (const m of g.members.slice(1))
          if (hyp(m, leader) > follow) {
            const near = bestStep(world, p, taken, m, leader, false);
            if (near) moveMember(m, near, taken, turns);
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
          const n = NEIGHBOURS[Math.floor(world.rng(`fauna-${g.id}-drift`) * 8)];
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
  }
}
