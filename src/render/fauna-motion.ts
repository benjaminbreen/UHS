import type { FaunaFacing } from "../content/fauna";

export type Gait = "walk" | "hop" | "scurry";

type Body = {
  x: number;
  /** Ground pixel row, before terrain rise and altitude. */
  y: number;
  tx: number;
  ty: number;
  alt: number;
  /** Seconds before it sets off. */
  wait: number;
  speed: number;
  moving: boolean;
  travelled: number;
  /** Seconds into the current hop-and-pause cycle. */
  cycle: number;
  heading?: FaunaFacing;
  heldUntil: number;
  /** Per-animal amble, px/s, so a herd does not keep step. */
  amble: number;
  /** A startled hop: seconds in, seconds long, px high. */
  leap?: { t: number; span: number; height: number };
};

export type FaunaPose = {
  x: number;
  y: number;
  alt: number;
  /** Rise of a hop, on top of altitude. */
  hop: number;
  moving: boolean;
  travelled: number;
  heading?: FaunaFacing;
  /** Squash and stretch through a startled hop; 1 otherwise. */
  sx: number;
  sy: number;
};

const SNAP = 16 * 12;
/** Seconds per hop-and-pause, the share of it spent moving, and the rise in px. */
const HOP: Record<Gait, readonly [number, number, number] | undefined> = {
  walk: undefined,
  hop: [0.34, 0.55, 2.5],
  scurry: [0.5, 0.6, 0],
};

/** Where each animal is drawn. The simulation moves whole cells on a shared
 * tick; this walks each sprite to its cell in its own time, so the herd does
 * not step as one. Presentation only. */
export class FaunaMotion {
  private bodies = new Map<string, Body>();

  /** `delay` is how long an urgent animal takes to get going: the ones
   * nearest the fright go first and the rest follow. */
  aim(
    id: string,
    tx: number,
    ty: number,
    urgent: boolean,
    snap: boolean,
    delay = 0,
  ) {
    const b = this.bodies.get(id);
    if (!b || snap || Math.hypot(b.x - tx, b.y - ty) > SNAP) {
      this.bodies.set(id, {
        x: tx,
        y: ty,
        tx,
        ty,
        alt: b?.alt ?? 0,
        wait: 0,
        speed: 0,
        moving: false,
        travelled: b?.travelled ?? 0,
        cycle: 0,
        heading: b?.heading,
        heldUntil: b?.heldUntil ?? 0,
        amble: b?.amble ?? 20 + Math.random() * 14,
      });
      return;
    }
    if (b.tx === tx && b.ty === ty) return;
    b.tx = tx;
    b.ty = ty;
    // Already walking, or already about to: a new cell is only a new heading.
    if (b.moving || b.wait > 0) {
      if (urgent) b.wait = Math.min(b.wait, 0.12);
      return;
    }
    b.wait = urgent ? delay + Math.random() * 0.1 : 0.15 + Math.random() * 0.9;
  }

  /** Jump on the spot, or into the step it is about to take. */
  leap(id: string, height: number, span: number) {
    const b = this.bodies.get(id);
    if (b && !b.leap) b.leap = { t: 0, span, height };
  }

  /** Set off now rather than when it gets round to it. */
  hurry(id: string) {
    const b = this.bodies.get(id);
    if (b) b.wait = 0;
  }

  /** Something else is moving the sprite: a blow's knockback. */
  hold(id: string, until: number) {
    const b = this.bodies.get(id);
    if (b) b.heldUntil = until;
  }

  held(id: string, now: number) {
    return (this.bodies.get(id)?.heldUntil ?? 0) > now;
  }

  /** Take the sprite's position as it was left by whoever held it. */
  adopt(id: string, x: number, y: number) {
    const b = this.bodies.get(id);
    if (!b) return;
    b.x = x;
    b.y = y;
    b.heldUntil = 0;
    b.moving = false;
    b.speed = 0;
  }

  released(id: string, now: number) {
    const b = this.bodies.get(id);
    return !!b && b.heldUntil > 0 && b.heldUntil <= now;
  }

  step(
    id: string,
    dt: number,
    urgent: boolean,
    gait: Gait,
    altitude: number,
    sideView: boolean,
    /** Close enough to the player to be walked into: be where the simulation
     * says, because that is the cell that is solid. */
    close = false,
  ): FaunaPose | undefined {
    const b = this.bodies.get(id);
    if (!b) return undefined;
    b.alt += (altitude - b.alt) * Math.min(1, dt / 0.25);
    if (Math.abs(altitude - b.alt) < 0.1) b.alt = altitude;
    let hop = 0;
    const dx = b.tx - b.x,
      dy = b.ty - b.y,
      left = Math.hypot(dx, dy);
    if (left < 0.5) {
      b.x = b.tx;
      b.y = b.ty;
      b.moving = false;
      b.speed = 0;
      b.cycle = 0;
    } else if (b.wait > 0 && !close) b.wait -= dt;
    else {
      b.moving = true;
      if (left > 3) {
        if (sideView) {
          if (Math.abs(dx) > 1) b.heading = dx < 0 ? "west" : "east";
        } else
          b.heading =
            Math.abs(dx) >= Math.abs(dy)
              ? dx < 0
                ? "west"
                : "east"
              : dy < 0
                ? "north"
                : "south";
      }
      // Never slower than it takes to keep up with the simulation.
      const cruise = urgent
        ? Math.max(90, left / 0.3)
        : close
          ? Math.max(b.amble * 1.6, left / 0.22)
          : Math.max(b.amble, left / 1.5);
      const want = Math.min(cruise, Math.max(12, left * (urgent ? 10 : 6)));
      b.speed += (want - b.speed) * Math.min(1, dt / 0.12);
      let pace = b.speed;
      const shape = b.alt > 0.5 ? undefined : HOP[gait];
      if (shape) {
        const [period, air, rise] = shape;
        const span = urgent ? period * 0.6 : period;
        b.cycle = (b.cycle + dt) % span;
        const t = b.cycle / (span * air);
        pace = t < 1 ? b.speed / air : 0;
        if (t < 1) hop = Math.sin(Math.PI * t) * rise;
      }
      const move = Math.min(left, pace * dt);
      b.x += (dx / left) * move;
      b.y += (dy / left) * move;
      b.travelled += move;
    }
    let sx = 1,
      sy = 1;
    if (b.leap) {
      b.leap.t += dt;
      const u = b.leap.t / b.leap.span;
      if (u >= 1) b.leap = undefined;
      else {
        hop += Math.sin(Math.PI * u) * b.leap.height;
        // gathers, stretches through the air, and sits into the landing
        [sx, sy] =
          u < 0.15 ? [1.12, 0.86] : u < 0.8 ? [0.94, 1.08] : [1.08, 0.92];
      }
    }
    return {
      sx,
      sy,
      x: b.x,
      y: b.y,
      alt: b.alt,
      hop,
      moving: b.moving,
      travelled: b.travelled,
      heading: b.moving ? b.heading : undefined,
    };
  }

  keep(ids: { has(id: string): boolean }) {
    for (const id of this.bodies.keys())
      if (!ids.has(id)) this.bodies.delete(id);
  }
}
