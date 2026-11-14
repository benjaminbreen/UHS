import Phaser from "phaser";
import { DEEP, GRATE, WATER, type SewerLevel } from "../../world/sewer";

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

type Sprite = { rows: string[]; ink: Record<string, string>; weight: number; since?: number };

const SPRITES: Record<string, Sprite> = {
  bottle: {
    weight: 4,
    ink: { ".": "#1c3420", g: "#3f7a3a", G: "#8cd07a", c: "#c8b48a" },
    rows: ["   .......  ", " ..GGGGGg.cc", ".gggggggggcc", " ..gggggg.  ", "   .......  "],
  },
  poop: {
    weight: 4,
    ink: { ".": "#2a170c", b: "#6b4423", B: "#a06a3a" },
    rows: ["    ..    ", "   .Bb.   ", "  ..bbb.  ", " .BBbbbb. ", ".bBbbbbbb.", ".bbbbbbbb.", " ........ "],
  },
  paper: {
    weight: 4,
    ink: { ".": "#6a6a5e", w: "#cfcab8", W: "#f2eee0" },
    rows: ["  ....  ", " .WWww. ", ".WwWwww.", ".wwwWww.", " .wWww. ", "  ....  "],
  },
  can: {
    weight: 2,
    since: 1935,
    ink: { ".": "#2a2020", r: "#b83a2a", R: "#e8664c", m: "#b0b4b8" },
    rows: [" ....... ", ".mRRRRRm.", ".mrrrrrm.", " ....... "],
  },
  stick: {
    weight: 2,
    ink: { ".": "#2a1c10", k: "#6a4a2a", K: "#9a7048" },
    rows: ["..........  ", ".kkkKkkkkk..", " .......... "],
  },
  suds: {
    weight: 3,
    ink: { ".": "#8a8e78", f: "#c8ccb4", F: "#f0f2de" },
    rows: ["  ..  ..  ", " .FF..Ff. ", ".FffFFfff.", " .ff..ff. ", "  ..  ..  "],
  },
  duck: {
    weight: 0.3,
    since: 1950,
    ink: { ".": "#3a2a10", Y: "#f6d846", y: "#c89a20", k: "#1a1a1a", o: "#e8822a" },
    rows: ["  ...   ", " .YYY.  ", " .YkYoo.", "..YYY.. ", ".YyYYYY.", ".yyyyyy.", " ...... "],
  },
};
const W = 12, H = 8;

type Float = { im: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; lane: number; age: number; bob: number; gone: number };

/** Rubbish riding the current: spawned upstream of the view, carried cell to
 * cell along the flow, held to the middle of the channel, lost at a grating. */
export class Flotsam {
  private floats: Float[] = [];
  private wake: Phaser.GameObjects.Graphics;
  private kinds: string[];
  private wet: number[] = [];
  private next = 0;

  constructor(private scene: Phaser.Scene, private level: SewerLevel, year: number) {
    if (!scene.textures.exists("sewer-flotsam")) {
      const names = Object.keys(SPRITES);
      const t = scene.textures.createCanvas("sewer-flotsam", W * names.length, H)!;
      names.forEach((name, n) => {
        const { rows, ink } = SPRITES[name];
        const oy = H - rows.length;
        rows.forEach((row, y) => [...row].forEach((ch, x) => {
          if (ch === " ") return;
          t.context.fillStyle = ink[ch];
          t.context.fillRect(n * W + x, oy + y, 1, 1);
        }));
        t.add(name, 0, n * W, 0, W, H);
      });
      t.refresh();
    }
    this.kinds = Object.keys(SPRITES).filter((k) => (SPRITES[k].since ?? -1e9) <= year);
    for (let i = 0; i < level.w * level.h; i++) if ((level.cells[i] === WATER || level.cells[i] === DEEP) && level.flow[i] >= 0) this.wet.push(i);
    this.wake = scene.add.graphics().setDepth(-99979.5);
  }

  private wetAt(x: number, y: number) {
    const { w, h, cells } = this.level;
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const c = cells[y * w + x];
    return c === WATER || c === DEEP;
  }

  /** The channel's middle across the flow, in pixels, so floats keep off the banks. */
  private middle(cx: number, cy: number, dir: number) {
    const across = dir === 1 || dir === 3 ? [0, 1] : [1, 0];
    let lo = 0, hi = 0;
    while (lo < 4 && this.wetAt(cx - across[0] * (lo + 1), cy - across[1] * (lo + 1))) lo++;
    while (hi < 4 && this.wetAt(cx + across[0] * (hi + 1), cy + across[1] * (hi + 1))) hi++;
    return ((across[0] ? cx : cy) + (hi - lo) / 2) * 16 + 8;
  }

  private spawn(cam: Phaser.Geom.Rectangle) {
    const { w, flow } = this.level;
    const near = this.wet.filter((i) => {
      const x = (i % w) * 16, y = Math.floor(i / w) * 16;
      return x > cam.x - 120 && x < cam.right + 120 && y > cam.y - 120 && y < cam.bottom + 120;
    });
    if (!near.length) return;
    // Walk upstream a little, so most things drift in rather than appear.
    let i = near[Math.floor(Math.random() * near.length)];
    for (let k = 0; k < 8; k++) {
      const x = i % w, y = Math.floor(i / w);
      const from = DIRS.map(([dx, dy], d) => ({ j: (y - dy) * w + x - dx, d })).find(({ j, d }) => this.wetAt(j % w, Math.floor(j / w)) && flow[j] === d);
      if (!from) break;
      i = from.j;
    }
    let total = 0;
    for (const k of this.kinds) total += SPRITES[k].weight;
    let r = Math.random() * total, kind = this.kinds[0];
    for (const k of this.kinds) if ((r -= SPRITES[k].weight) <= 0) { kind = k; break; }
    const x = (i % w) * 16 + 8, y = Math.floor(i / w) * 16 + 8;
    const im = this.scene.add.image(x, y, "sewer-flotsam", kind).setOrigin(0.5, 0.75).setDepth(-99979).setAlpha(0);
    this.floats.push({ im, x, y, vx: 0, vy: 0, lane: (Math.random() - 0.5) * 8, age: 0, bob: Math.random() * 6, gone: 0 });
  }

  update(time: number, delta: number, surge: number, cam: Phaser.Geom.Rectangle) {
    const dt = Math.min(0.1, delta / 1000), { w, flow, cells } = this.level;
    if (time > this.next) {
      this.next = time + (3600 - surge * 2400) * (0.5 + Math.random());
      if (this.floats.length < 5 + surge * 10) this.spawn(cam);
    }
    const speed = 14 + surge * 40;
    const g = this.wake.clear();
    this.floats = this.floats.filter((f) => {
      f.age += dt;
      const cx = Math.floor(f.x / 16), cy = Math.floor(f.y / 16), i = cy * w + cx;
      const dir = flow[i] ?? -1;
      if (f.gone || dir < 0 || cells[i] === GRATE || !this.wetAt(cx, cy) || f.age > 60) f.gone += dt;
      else {
        const [dx, dy] = DIRS[dir];
        const mid = this.middle(cx, cy, dir) + f.lane;
        const tx = dx * speed + (dx ? 0 : (mid - f.x) * 1.5), ty = dy * speed + (dy ? 0 : (mid - f.y) * 1.5);
        f.vx += (tx - f.vx) * Math.min(1, dt * 1.5);
        f.vy += (ty - f.vy) * Math.min(1, dt * 1.5);
      }
      f.x += f.vx * dt * (f.gone ? 0.4 : 1);
      f.y += f.vy * dt * (f.gone ? 0.4 : 1);
      const bob = Math.sin(time / 420 + f.bob) > 0.3 ? 1 : 0;
      const alpha = f.gone ? 1 - f.gone / 0.8 : Math.min(1, f.age / 0.6);
      if (alpha <= 0) return f.im.destroy(), false;
      f.im.setPosition(Math.round(f.x), Math.round(f.y) + bob).setAlpha(alpha).setFlipX(f.vx < -1);
      // A small V of ripples pushed ahead and trailing behind.
      const v = Math.hypot(f.vx, f.vy);
      if (v > 3 && !f.gone) {
        const ux = f.vx / v, uy = f.vy / v;
        for (let k = 1; k <= 3; k++) {
          const back = 4 + k * 3, spread = 2 + k * 1.6;
          g.fillStyle(0xd8e8c8, (0.42 - k * 0.11) * alpha);
          for (const s of [1, -1]) g.fillRect(Math.round(f.x - ux * back - uy * spread * s), Math.round(f.y - uy * back + ux * spread * s * 0.6) + 1, 2, 1);
        }
        g.fillStyle(0xe8f4d8, 0.35 * alpha);
        g.fillRect(Math.round(f.x + ux * 5) - 1, Math.round(f.y + uy * 3) + 1, 3, 1);
      }
      return true;
    });
  }

  destroy() {
    for (const f of this.floats) f.im.destroy();
    this.wake.destroy();
  }
}
