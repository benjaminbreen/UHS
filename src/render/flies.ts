import type Phaser from "phaser";

/** Something flies gather on: its foot in world pixels, and how many it draws
 * when the day is warm. */
export type FlySource = { id: string; x: number; y: number; n: number };

type Fly = {
  /** Offset from the source on the ground, and height above it. */
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  tx: number;
  ty: number;
  tz: number;
  /** Seconds left sitting, or until the next turn in flight. */
  rest: number;
  turn: number;
};
type Swarm = { source: FlySource; flies: Fly[]; scared: number };

/** Flies lift off a source when a walker's feet come this close, in pixels. */
const STARTLE = 14;
const SPEED = 55;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** A handful of flies round each source: they sit, lift, jink about in short
 * loops and settle again, and scatter when someone walks through them. */
export class Flies {
  private swarms = new Map<string, Swarm>();
  private g?: Phaser.GameObjects.Graphics;
  private share = 0;

  constructor(private scene: Phaser.Scene) {}

  /** `share` is how many of each source's flies are about, 0 to 1: none in
   * the cold, the rain or the dark. */
  set(sources: FlySource[], share: number) {
    this.share = share;
    const keep = new Set<string>();
    for (const s of sources) {
      const n = Math.round(s.n * share);
      if (!n) continue;
      keep.add(s.id);
      const swarm = this.swarms.get(s.id) ?? { source: s, flies: [], scared: 0 };
      swarm.source = s;
      while (swarm.flies.length < n) swarm.flies.push(this.fly());
      swarm.flies.length = n;
      this.swarms.set(s.id, swarm);
    }
    for (const id of this.swarms.keys()) if (!keep.has(id)) this.swarms.delete(id);
    if (this.swarms.size && !this.g)
      this.g = this.scene.add.graphics().setDepth(18440);
    this.g?.clear();
  }

  private fly(): Fly {
    const x = rand(-3, 3),
      y = rand(-1, 1);
    return { x, y, z: 0, vx: 0, vy: 0, vz: 0, tx: x, ty: y, tz: 0, rest: rand(0, 3), turn: 0 };
  }

  update(dt: number, walkers: { x: number; y: number }[], frozen = false) {
    const g = this.g;
    if (!g) return;
    g.clear();
    if (!this.swarms.size || !this.share) return;
    const view = this.scene.cameras.main.worldView;
    const step = frozen ? 0 : Math.min(dt, 0.05);
    for (const swarm of this.swarms.values()) {
      const s = swarm.source;
      if (
        s.x < view.x - 40 || s.x > view.right + 40 ||
        s.y < view.y - 40 || s.y > view.bottom + 40
      )
        continue;
      let from: { x: number; y: number } | undefined;
      for (const w of walkers)
        if (Math.abs(w.x - s.x) < STARTLE && Math.abs(w.y - s.y) < STARTLE * 0.7) {
          from = w;
          break;
        }
      if (from) {
        // Up and away from the feet, each its own way, not as a flock.
        if (swarm.scared <= 0)
          for (const f of swarm.flies) {
            const ax = s.x + f.x - from.x || rand(-1, 1),
              ay = s.y + f.y - from.y || rand(-1, 1);
            const d = Math.hypot(ax, ay) || 1;
            f.vx = (ax / d) * SPEED * 1.8 + rand(-20, 20);
            f.vy = (ay / d) * SPEED * 1.2 + rand(-15, 15);
            f.vz = rand(40, 70);
            f.rest = 0;
            f.turn = rand(0.15, 0.4);
            f.tx = f.x + (ax / d) * rand(14, 26);
            f.ty = f.y + (ay / d) * rand(8, 14);
            f.tz = rand(8, 16);
          }
        swarm.scared = rand(1.5, 3);
      } else swarm.scared -= step;
      g.fillStyle(0x1c1c16, 1);
      for (const f of swarm.flies) {
        this.move(f, step, swarm.scared > 0);
        g.fillRect(Math.round(s.x + f.x), Math.round(s.y + f.y - f.z), 1, 1);
      }
    }
  }

  private move(f: Fly, dt: number, scared: boolean) {
    if (f.rest > 0 && !scared && f.z === 0) {
      f.rest -= dt;
      // A sitting fly shuffles a pixel now and then.
      if (Math.random() < dt * 0.6) f.x += Math.random() < 0.5 ? -1 : 1;
      if (f.rest <= 0) {
        f.vz = rand(20, 40);
        this.aim(f, scared);
      }
      return;
    }
    f.turn -= dt;
    // A fly does not curve, it jinks: a straight dart, a sharp new heading.
    if (f.turn <= 0) {
      this.aim(f, scared);
      const dx = f.tx - f.x,
        dy = f.ty - f.y,
        dz = f.tz - f.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const v = SPEED * rand(0.6, 1.2);
      f.vx = (dx / d) * v;
      f.vy = (dy / d) * v * 0.7;
      f.vz = (dz / d) * v;
    }
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.z = Math.max(0, f.z + f.vz * dt);
    const home = Math.hypot(f.x, f.y) < 3;
    if (f.z === 0 && !scared && home && f.tz === 0) {
      f.vx = f.vy = f.vz = 0;
      f.rest = rand(0.8, 4);
    }
  }

  private aim(f: Fly, scared: boolean) {
    f.turn = rand(0.08, 0.25);
    if (scared) {
      // Keep off, circling wide and high until the ground is quiet.
      const a = rand(0, Math.PI * 2);
      f.tx = Math.cos(a) * rand(10, 22);
      f.ty = Math.sin(a) * rand(6, 12);
      f.tz = rand(6, 14);
      return;
    }
    const settle = Math.random() < 0.18;
    f.tx = settle ? rand(-3, 3) : rand(-7, 7);
    f.ty = settle ? rand(-1, 1) : rand(-3, 3);
    f.tz = settle ? 0 : rand(2, 9);
  }

  clear() {
    this.swarms.clear();
    this.g?.destroy();
    this.g = undefined;
  }
}
