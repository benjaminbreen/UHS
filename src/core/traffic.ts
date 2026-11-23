import type { Lane } from "../world/v3/types";
import type { Point } from "./types";

export interface TrafficCar {
  id: number;
  model: string;
  paint: number;
  /** Cell coordinates of its middle; it rides the line between the two cells of its lane. */
  x: number;
  y: number;
  dx: number;
  dy: number;
  /** Cells per second, and what it holds on a clear road. */
  speed: number;
  cruise: number;
  /** In a junction's box, and the turn it has chosen there. */
  inJunction?: boolean;
  turn?: { dx: number; dy: number; line: number };
  /** Seconds of swinging round left, and the way it was going before. */
  turning: number;
  was: readonly [number, number];
  /** Seconds it has stood behind something. */
  stuck: number;
  hornAt: number;
  /** Seconds it sits shaken after being hit. */
  stunned: number;
  /** A police car after the player: it picks its turnings toward them. */
  police?: boolean;
  turnedAt?: number;
}

const key = (x: number, y: number) => `${x},${y}`;
const WAYS: readonly (readonly [number, number])[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

/** The line a car going `dx, dy` rides on the street a lane cell at `x, y` belongs to. */
export function laneLine(lane: Lane, x: number, y: number, dx: number, dy: number) {
  const kerb = (lane.axis === "x" ? y : x) - lane.at, mid = lane.span / 2, out = lane.boulevard ? 1 : 0;
  // On a road that keeps right, eastbound is the south side and southbound the west.
  const far = (lane.axis === "x" ? dx > 0 : dy < 0) === (lane.marks.drive === "right");
  return kerb + (far ? mid + 0.5 + out : mid - 1.5 - out);
}
const travels = (lane: Lane | undefined, axis: "x" | "y") => !!lane && lane.axis === axis && lane.span >= 4;

/** Motor traffic on a town's lanes, in real time and only near where it is
 * watched from. Not part of the saved world: it is weather, not history. */
export class Traffic {
  cars: TrafficCar[] = [];
  private cells = new Set<string>();
  private serial = 0;
  private open: Point[];
  private clock = 0;
  constructor(
    private lanes: Map<string, Lane>,
    private pick: (roll: number, paint: number) => { model: string; paint: number } | undefined,
    private random: () => number = Math.random,
  ) {
    this.open = [];
    for (const [k, l] of lanes) {
      if (l.junction || l.span < 4 || l.toJunction !== undefined) continue;
      const parked = l.marks.parking && l.span >= 8 && (l.at < 2 || l.at >= l.span - 2);
      if (parked) continue;
      const [x, y] = k.split(",").map(Number);
      this.open.push({ x, y });
    }
  }

  /** A cell of open travel lane between `min` and `max` cells from a point, with the kerb beside it. */
  kerbNear(focus: Point, min: number, max: number) {
    for (let i = 0; i < 40; i++) {
      const p = this.open[Math.floor(this.random() * this.open.length)];
      const far = p ? Math.max(Math.abs(p.x - focus.x), Math.abs(p.y - focus.y)) : 0;
      if (!p || far < min || far > max) continue;
      const lane = this.lanes.get(key(p.x, p.y))!, out = lane.at < lane.span / 2 ? -1 : 1;
      let { x, y } = p;
      for (let n = 0; n < 8 && this.lanes.has(key(x, y)); n++) lane.axis === "x" ? (y += out) : (x += out);
      return { road: p, kerb: { x, y } };
    }
  }
  occupied(x: number, y: number) {
    return this.cells.has(key(x, y));
  }
  /** The car standing on a cell. */
  at(x: number, y: number) {
    return this.cars.find((c) => bodyOf(c).some((p) => p.x === x && p.y === y));
  }
  /** Send a police car after whoever `step` is centred on, or call it off. */
  pursue(on: boolean, focus?: Point, hidden?: (x: number, y: number) => boolean) {
    const out = this.cars.find((c) => c.police);
    if (!on) {
      if (out) out.police = false;
      return undefined;
    }
    if (out || !focus) return out;
    const before = this.cars.length;
    for (let i = 0; i < 30 && this.cars.length === before; i++) this.spawn(focus, hidden, 16, 40);
    const car = this.cars[before];
    if (car) Object.assign(car, { police: true, cruise: 11.5 });
    return car;
  }
  bump(car: TrafficCar) {
    car.speed = 0;
    car.stunned = 1.6;
    car.hornAt = this.clock;
  }

  /** `obstacle` is anything in the road that is not traffic. Returns the cars that sounded their horns. */
  private target: Point = { x: 0, y: 0 };
  step(dt: number, focus: Point, o: { want: number; obstacle: (x: number, y: number) => boolean; hidden?: (x: number, y: number) => boolean }) {
    this.clock += dt;
    this.target = focus;
    const horns: TrafficCar[] = [];
    this.cars = this.cars.filter((c) => Math.abs(c.x - focus.x) < 78 && Math.abs(c.y - focus.y) < 78 && this.lanes.has(key(Math.round(c.x), Math.round(c.y))));
    for (let tries = 0; this.cars.length < o.want && tries < 4; tries++) this.spawn(focus, o.hidden);
    for (const c of this.cars) {
      const lane = this.lanes.get(key(Math.round(c.x), Math.round(c.y)))!;
      if (lane.junction) {
        if (!c.inJunction) {
          c.inJunction = true;
          this.decide(c);
        }
      } else if (c.inJunction && !c.turn) c.inJunction = false;
      else if (!c.turn && !this.lanes.has(key(Math.round(c.x + c.dx * 3), Math.round(c.y + c.dy * 3)))) this.turnBack(c, lane);
      // Going the wrong way down the street its quarry is on: swing round.
      else if (c.police && !c.turn && (focus.x - c.x) * c.dx + (focus.y - c.y) * c.dy < -5 && this.clock - (c.turnedAt ?? -9) > 3) {
        c.turnedAt = this.clock;
        this.turnBack(c, lane);
      }

      let want = c.turn ? Math.min(c.cruise, 3.6) : c.cruise, held = false;
      // Whatever is in the road ahead, across both cells of the lane.
      const px = -c.dy, py = c.dx;
      let gap = 9;
      for (let d = 2; d <= 6 && gap === 9; d++)
        for (const side of [-0.5, 0.5]) {
          const x = Math.round(c.x + c.dx * d + px * side), y = Math.round(c.y + c.dy * d + py * side);
          if (o.obstacle(x, y)) {
            gap = d - 1.5;
            held = true;
          }
        }
      for (const other of this.cars) {
        if (other === c) continue;
        const rx = other.x - c.x, ry = other.y - c.y, along = rx * c.dx + ry * c.dy, across = Math.abs(rx * px + ry * py);
        if (along > 0 && along < 9 && across < 1.3) gap = Math.min(gap, along - 5.4);
        // About to swing into a lane someone is already coming down: wait for them.
        else if (c.turn && other.dx === c.turn.dx && other.dy === c.turn.dy && c.stuck < 5) {
          const sx = c.dx ? c.turn.line : c.x, sy = c.dx ? c.y : c.turn.line;
          const on = (other.x - sx) * c.turn.dx + (other.y - sy) * c.turn.dy, off = Math.abs((other.x - sx) * c.turn.dy - (other.y - sy) * c.turn.dx);
          if (off < 1.3 && on > -7 && on < 5) gap = Math.min(gap, 0);
        }
        // Give way to whoever is already in the junction ahead and crossing.
        else if (!c.police && !c.inJunction && other.inJunction && (other.dx !== c.dx || other.dy !== c.dy || other.turn) && along > 0 && along < 7 && across < 7 && c.stuck < 4) gap = Math.min(gap, along - 4);
      }
      if (gap < 9) want = gap < 1.1 ? 0 : Math.min(want, (gap - 1) * 2.6);
      // Pulls up beside whoever it is after.
      if (c.police && Math.hypot(focus.x - c.x, focus.y - c.y) < 5) want = 0;
      if (c.stunned > 0) {
        c.stunned -= dt;
        want = 0;
      }
      c.speed = c.speed < want ? Math.min(want, c.speed + 6 * dt) : Math.max(want, c.speed - 16 * dt);
      c.stuck = c.speed < 0.3 ? c.stuck + dt : 0;
      if (held && c.stuck > 2.2 && this.clock - c.hornAt > 3.5) {
        c.hornAt = this.clock;
        horns.push(c);
      }
      if (c.turning > 0) c.turning -= dt;
      const move = c.speed * dt;
      c.x += c.dx * move;
      c.y += c.dy * move;
      const t = c.turn;
      if (t) {
        const reached = c.dx ? (t.line - c.x) * c.dx <= 0 : (t.line - c.y) * c.dy <= 0;
        if (reached) {
          c.was = [c.dx, c.dy];
          if (c.dx) c.x = t.line;
          else c.y = t.line;
          c.dx = t.dx;
          c.dy = t.dy;
          c.turning = 0.45;
          c.turn = undefined;
        }
      }
    }
    this.cells.clear();
    for (const c of this.cars) for (const p of bodyOf(c)) this.cells.add(key(p.x, p.y));
    return horns;
  }

  private spawn(focus: Point, hidden?: (x: number, y: number) => boolean, min = 24, max = 70) {
    const p = this.open[Math.floor(this.random() * this.open.length)];
    if (!p) return;
    const far = Math.max(Math.abs(p.x - focus.x), Math.abs(p.y - focus.y));
    if (far < min || far > max || (hidden && !hidden(p.x, p.y))) return;
    const lane = this.lanes.get(key(p.x, p.y))!, near = lane.at < lane.span / 2;
    const right = lane.marks.drive === "right";
    // The north side of a street that keeps right runs west, its west side south.
    const [dx, dy] = lane.axis === "x" ? [near === right ? -1 : 1, 0] : [0, near === right ? 1 : -1];
    const line = laneLine(lane, p.x, p.y, dx, dy);
    const x = lane.axis === "x" ? p.x : line, y = lane.axis === "x" ? line : p.y;
    if (this.cars.some((c) => Math.abs(c.x - x) + Math.abs(c.y - y) < 9)) return;
    const car = this.pick(this.random(), this.random());
    if (!car) return;
    const cruise = 5 + this.random() * 3.5;
    this.cars.push({ id: ++this.serial, ...car, x, y, dx, dy, speed: cruise, cruise, turning: 0, was: [dx, dy], stuck: 0, hornAt: -9, stunned: 0 });
  }

  /** At a junction: the ways out that are streets, straight on preferred. */
  private decide(c: TrafficCar) {
    const exits: { dx: number; dy: number; line: number; straight: boolean }[] = [];
    for (const [dx, dy] of WAYS) {
      if (dx === -c.dx && dy === -c.dy) continue;
      let x = Math.round(c.x), y = Math.round(c.y), found: Lane | undefined;
      for (let i = 0; i < 16; i++) {
        x += dx;
        y += dy;
        const l = this.lanes.get(key(x, y));
        if (!l) break;
        if (l.junction) continue;
        if (travels(l, dx ? "x" : "y")) found = l;
        break;
      }
      if (found) exits.push({ dx, dy, line: laneLine(found, x, y, dx, dy), straight: dx === c.dx && dy === c.dy });
    }
    const turns = exits.filter((e) => !e.straight), straight = exits.find((e) => e.straight);
    const reach = (e: { dx: number; dy: number }) => Math.hypot(c.x + e.dx * 10 - this.target.x, c.y + e.dy * 10 - this.target.y);
    const go = c.police ? [...exits].sort((a, b) => reach(a) - reach(b))[0] : straight && (!turns.length || this.random() < 0.6) ? straight : turns[Math.floor(this.random() * turns.length)];
    if (!go || go.straight) return;
    c.turn = { dx: go.dx, dy: go.dy, line: go.line };
  }

  /** The street ends: swing round into the lane going back. */
  private turnBack(c: TrafficCar, lane: Lane) {
    const line = laneLine(lane, Math.round(c.x), Math.round(c.y), -c.dx, -c.dy);
    c.was = [c.dx, c.dy];
    if (c.dx) c.y = line;
    else c.x = line;
    c.dx = -c.dx;
    c.dy = -c.dy;
    c.turning = 0.6;
    c.speed = 1;
  }
}

/** The cells a traffic car stands on: both cells of its lane, three long. */
export function bodyOf(c: Pick<TrafficCar, "x" | "y" | "dx" | "dy">) {
  const out: Point[] = [];
  for (let d = -1; d <= 1; d++)
    for (const side of [-0.5, 0.5]) out.push({ x: Math.round(c.x + c.dx * d - c.dy * side), y: Math.round(c.y + c.dy * d + c.dx * side) });
  return out;
}

/** The facing to draw, 0 north and clockwise by eighths: a diagonal while it swings through a turn. */
export function trafficFacing(c: Pick<TrafficCar, "dx" | "dy" | "turning" | "was">) {
  const of = (dx: number, dy: number) => (dy < 0 ? 0 : dx > 0 ? 2 : dy > 0 ? 4 : 6);
  const now = of(c.dx, c.dy);
  if (c.turning <= 0) return now;
  const before = of(c.was[0], c.was[1]), swing = ((now - before + 12) % 8) - 4;
  return (before + (Math.abs(swing) === 4 ? 2 : Math.sign(swing)) + 8) % 8;
}
