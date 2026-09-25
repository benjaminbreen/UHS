import type Phaser from "phaser";
import { gustAt, wind, windVector } from "./wind";

/** Remains that move: feathers the wind takes one at a time, and a carcass
 * the crows come down to. Foot position in world pixels. */
export type RemainsSource = {
  id: string;
  x: number;
  y: number;
  kind: "feathers" | "carcass";
  /** Feather colour, 0xRRGGBB. */
  colour?: number;
};

type Feather = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  age: number;
  spin: number;
};
type Crow = {
  /** Offset from the carcass, and height when flying. */
  x: number;
  y: number;
  z: number;
  face: 1 | -1;
  /** Seconds left in what it is doing. */
  wait: number;
  mode: "peck" | "look" | "hop" | "away" | "back";
  tx: number;
  ty: number;
  flap: number;
};
type Site = {
  source: RemainsSource;
  feathers: Feather[];
  crows: Crow[];
  scared: number;
  lift: number;
};

const STARTLE = 30;
const CROW_INK: Record<string, number> = {
  X: 0x17161b,
  s: 0x3b3b47,
  b: 0x2c2a28,
  l: 0x2c2a28,
};
// A carrion crow, facing right: s the sheen along the back, b the beak.
const CROW_STAND = [
  "......XX.",
  ".....XXXb",
  "XX..sssX.",
  ".XXXXXXX.",
  "..XXXXX..",
  "...l.l...",
];
const CROW_PECK = ["XX.sssX..", ".XXXXXXXX", "..XXXXXXb", "...l.l..."];
const CROW_WINGS_UP = ["..XX.....", "...XX....", "XXXXXXXXb", ".XXXXX..."];
const CROW_WINGS_DOWN = ["XXXXXXXXb", ".XXXXX...", "...XX....", "..XX....."];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class RemainsLife {
  private sites = new Map<string, Site>();
  private g?: Phaser.GameObjects.Graphics;
  private day = true;

  constructor(private scene: Phaser.Scene) {}

  /** `day`: crows keep to the daylight. */
  set(sources: RemainsSource[], day: boolean) {
    this.day = day;
    const keep = new Set<string>();
    for (const s of sources) {
      keep.add(s.id);
      const site = this.sites.get(s.id) ?? {
        source: s,
        feathers: [],
        crows: [],
        scared: 0,
        lift: rand(2, 8),
      };
      site.source = s;
      if (s.kind === "carcass" && !site.crows.length && day) {
        const n = 2 + Math.floor(Math.random() * 3);
        // They arrive, not appear: each drops in from somewhere off to the side.
        for (let i = 0; i < n; i++)
          site.crows.push(
            this.crow(rand(-60, 60), rand(-40, -20), rand(20, 40), "back"),
          );
      }
      if (!day) site.crows = [];
      this.sites.set(s.id, site);
    }
    for (const id of this.sites.keys())
      if (!keep.has(id)) this.sites.delete(id);
    if (this.sites.size && !this.g)
      this.g = this.scene.add.graphics().setDepth(18430);
  }

  private crow(x: number, y: number, z: number, mode: Crow["mode"]): Crow {
    const [tx, ty] = [rand(-13, 13), rand(-3, 6)];
    return {
      x,
      y,
      z,
      face: Math.random() < 0.5 ? 1 : -1,
      wait: rand(0.5, 3),
      mode,
      tx,
      ty,
      flap: 0,
    };
  }

  update(
    time: number,
    dt: number,
    walkers: { x: number; y: number }[],
    frozen = false,
  ) {
    const g = this.g;
    if (!g) return;
    g.clear();
    const view = this.scene.cameras.main.worldView;
    const step = frozen ? 0 : Math.min(dt, 0.05);
    for (const site of this.sites.values()) {
      const s = site.source;
      if (
        s.x < view.x - 80 ||
        s.x > view.right + 80 ||
        s.y < view.y - 80 ||
        s.y > view.bottom + 80
      )
        continue;
      const near = walkers.find(
        (w) =>
          Math.abs(w.x - s.x) < STARTLE && Math.abs(w.y - s.y) < STARTLE * 0.7,
      );
      if (s.kind === "feathers") this.feathers(g, site, time, step, !!near);
      else this.crows(g, site, step, near);
    }
  }

  /** Now and then a gust lifts one feather and carries it off, turning, and
   * lets it down again somewhere downwind. A foot through them lifts several. */
  private feathers(
    g: Phaser.GameObjects.Graphics,
    site: Site,
    time: number,
    dt: number,
    stirred: boolean,
  ) {
    const s = site.source;
    const w = wind(),
      v = windVector();
    site.lift -=
      dt *
      (0.4 + w.strength * 2) *
      (gustAt(time, s.x / 16, s.y / 16) > 0.3 ? 3 : 1);
    if ((site.lift <= 0 || stirred) && site.feathers.length < 3) {
      site.lift = rand(4, 12);
      site.feathers.push({
        x: rand(-5, 5),
        y: rand(-2, 2),
        z: 0,
        vx: 0,
        vz: rand(14, 24),
        age: 0,
        spin: rand(0, 6),
      });
    }
    const colour = s.colour ?? 0xe8e4da;
    for (const f of site.feathers) {
      f.age += dt;
      const push = 8 + w.strength * 30;
      f.vx += (v.x * push - f.vx) * dt * 1.5;
      f.vz -= 16 * dt;
      // A feather falls like a leaf, sideways and back, never straight down.
      f.vz = Math.max(f.vz, -5 + Math.sin(f.age * 4 + f.spin) * 3);
      f.x += f.vx * dt + Math.sin(f.age * 3 + f.spin) * 6 * dt;
      f.y += v.y * push * 0.5 * dt;
      f.z = Math.max(0, f.z + f.vz * dt);
      const x = Math.round(s.x + f.x),
        y = Math.round(s.y + f.y - f.z);
      const flat = Math.sin(f.age * 5 + f.spin) > 0;
      const fade = f.z === 0 ? Math.max(0, 1 - (f.age - 2) / 2) : 1;
      g.fillStyle(colour, fade);
      g.fillRect(x, y, flat ? 2 : 1, flat ? 1 : 2);
    }
    // Once down, it lies a moment and is part of the grass.
    site.feathers = site.feathers.filter((f) => f.z > 0 || f.age < 4);
  }

  /** Two to four crows walk about on it, pecking, hopping, looking up. A
   * person coming close puts them up; they circle off and drift back. */
  private crows(
    g: Phaser.GameObjects.Graphics,
    site: Site,
    dt: number,
    near?: { x: number; y: number },
  ) {
    const s = site.source;
    if (near && site.scared <= 0 && this.day) {
      site.scared = rand(6, 12);
      for (const c of site.crows) {
        const ax = c.x - (near.x - s.x) || rand(-1, 1),
          ay = c.y - (near.y - s.y) || rand(-1, 1);
        const d = Math.hypot(ax, ay) || 1;
        c.mode = "away";
        c.tx = (ax / d) * rand(45, 70);
        c.ty = (ay / d) * rand(20, 35);
        c.wait = rand(0, 0.3);
      }
    } else if (!near) site.scared -= dt;
    for (const c of site.crows) {
      this.moveCrow(c, dt, site.scared > 0);
      this.drawCrow(g, Math.round(s.x + c.x), Math.round(s.y + c.y), c);
    }
  }

  private moveCrow(c: Crow, dt: number, scared: boolean) {
    c.wait -= dt;
    if (c.mode === "away" || c.mode === "back") {
      if (c.wait > 0) return;
      const dx = c.tx - c.x,
        dy = c.ty - c.y;
      const d = Math.hypot(dx, dy);
      const speed = 45;
      c.flap += dt * 10;
      if (Math.abs(dx) > 1) c.face = dx > 0 ? 1 : -1;
      if (d > 1.5) {
        c.x += (dx / d) * speed * dt;
        c.y += (dy / d) * speed * dt;
        // Up off the ground, then gliding down onto where it is going.
        c.z =
          c.mode === "away"
            ? Math.min(24, c.z + 30 * dt)
            : Math.max(0, Math.min(c.z, d * 0.5));
      } else if (c.mode === "away") {
        if (!scared) {
          c.mode = "back";
          c.tx = rand(-13, 13);
          c.ty = rand(-3, 6);
          c.wait = rand(0.5, 4);
        }
      } else {
        c.z = 0;
        c.mode = "look";
        c.wait = rand(0.6, 2);
      }
      return;
    }
    if (c.wait > 0) return;
    // On the ground: peck, look about, a two-footed hop to another spot.
    const r = Math.random();
    if (r < 0.5) {
      c.mode = "peck";
      c.wait = rand(0.25, 0.6);
    } else if (r < 0.8) {
      c.mode = "look";
      c.wait = rand(0.5, 1.8);
      if (Math.random() < 0.4) c.face = c.face === 1 ? -1 : 1;
    } else {
      c.mode = "hop";
      const nx = Math.max(-15, Math.min(15, c.x + rand(-5, 5)));
      c.face = nx > c.x ? 1 : -1;
      c.x = nx;
      c.y = Math.max(-5, Math.min(6, c.y + rand(-2, 2)));
      c.wait = rand(0.15, 0.3);
    }
  }

  private drawCrow(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    c: Crow,
  ) {
    const flying = c.z > 0.5 || c.mode === "away";
    const shape = flying
      ? Math.sin(c.flap) > 0
        ? CROW_WINGS_UP
        : CROW_WINGS_DOWN
      : c.mode === "peck"
        ? CROW_PECK
        : CROW_STAND;
    const z = Math.round(c.z) + (c.mode === "hop" ? 1 : 0);
    if (flying) {
      g.fillStyle(0x000000, 0.18);
      g.fillRect(x - 2, y, 5, 1);
    }
    const w = shape[0].length;
    for (const [row, line] of shape.entries())
      for (let i = 0; i < w; i++) {
        const ch = line[i];
        if (ch === ".") continue;
        g.fillStyle(CROW_INK[ch], 1);
        // Drawn facing right; a crow facing left is the row read backwards.
        const dx = c.face === 1 ? i - 4 : 4 - i;
        g.fillRect(x + dx, y - shape.length + row - z, 1, 1);
      }
  }

  clear() {
    this.sites.clear();
    this.g?.destroy();
    this.g = undefined;
  }
}
