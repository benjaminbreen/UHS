import Phaser from "phaser";

/** A water tile's length along the current and its width across it. */
export const L = 128, A = 64;

/** A seamless water tile, painted once along x and stored turned as well,
 * for water running north or south. */
export function waterTexture(scene: Phaser.Scene, name: string, across: boolean, paint: () => Uint8ClampedArray) {
  const key = `${name}-${across ? "y" : "x"}`;
  if (scene.textures.exists(key)) return key;
  const src = paint();
  const tw = across ? A : L, th = across ? L : A;
  const t = scene.textures.createCanvas(key, tw, th)!;
  const img = t.context.createImageData(tw, th);
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      const at = ((across ? x : y) * L + (across ? y : x)) * 4;
      img.data.set(src.subarray(at, at + 4), (y * tw + x) * 4);
    }
  t.context.putImageData(img, 0, 0);
  t.refresh();
  return key;
}

export type FloatSprite = { rows: string[]; ink: Record<string, string>; weight: number; since?: number };

type Strip = { im: Phaser.GameObjects.TileSprite; x: number; y: number; dir: number; deep: boolean; drift: number };

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

/** Water that moves: runs of cells that flow the same way, each a strip of a
 * tile scrolled downstream, so the water itself is seen to move. `depth`
 * says of each cell 0 dry, 1 wet, 2 deep. */
export class WaterSurface {
  private strips: Strip[] = [];

  constructor(
    scene: Phaser.Scene,
    field: { w: number; h: number; flow: Int8Array },
    depth: (i: number) => number,
    tile: (deep: boolean, across: boolean) => string,
    layer: number,
    into?: Phaser.GameObjects.Container,
  ) {
    const { w, h, flow } = field;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; ) {
        const i = y * w + x, d = depth(i);
        if (!d) {
          x++;
          continue;
        }
        const dir = flow[i];
        let n = 1;
        while (x + n < w && depth(i + n) === d && flow[i + n] === dir) n++;
        const deep = d === 2, across = dir === 0 || dir === 2;
        const im = scene.add.tileSprite(x * 16, y * 16, n * 16, 16, tile(deep, across)).setOrigin(0, 0).setDepth(layer);
        into?.add(im);
        this.strips.push({ im, x: x * 16, y: y * 16, dir, deep, drift: (i * 0.618) % 1 });
        x += n;
      }
  }

  update(time: number, speed: number) {
    const t = time / 1000;
    for (const s of this.strips) {
      let ox: number, oy: number;
      if (s.dir < 0) (ox = t * 1.5 + Math.sin(t * 0.4 + s.drift * 6) * 3), (oy = Math.cos(t * 0.3) * 2);
      else {
        const v = t * speed * (s.deep ? 1.5 : 1);
        (ox = DIRS[s.dir][0] * v), (oy = DIRS[s.dir][1] * v);
      }
      // Keyed to the world, so neighbouring strips stay seamless.
      s.im.setTilePosition(Math.round(s.x - ox), Math.round(s.y - oy));
    }
  }

  destroy() {
    for (const s of this.strips) s.im.destroy();
  }
}

const W = 12, H = 8;

type Float = { im: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; lane: number; age: number; bob: number; gone: number };

/** Things riding the current: spawned upstream of the view, carried cell to
 * cell along the flow, held to the middle of the channel, lost where the
 * water goes into the rock or down a grating. */
export class Flotsam {
  private floats: Float[] = [];
  private wake: Phaser.GameObjects.Graphics;
  private kinds: string[];
  private cells: number[] = [];
  private next = 0;

  constructor(
    private scene: Phaser.Scene,
    private level: { w: number; h: number; flow: Int8Array },
    private wet: (i: number) => boolean,
    private sprites: Record<string, FloatSprite>,
    private key: string,
    year: number,
    private layer: number,
  ) {
    if (!scene.textures.exists(key)) {
      const names = Object.keys(sprites);
      const t = scene.textures.createCanvas(key, W * names.length, H)!;
      names.forEach((name, n) => {
        const { rows, ink } = sprites[name];
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
    this.kinds = Object.keys(sprites).filter((k) => (sprites[k].since ?? -1e9) <= year);
    for (let i = 0; i < level.w * level.h; i++) if (wet(i) && level.flow[i] >= 0) this.cells.push(i);
    this.wake = scene.add.graphics().setDepth(layer - 0.5);
  }

  private wetAt(x: number, y: number) {
    const { w, h } = this.level;
    return x >= 0 && y >= 0 && x < w && y < h && this.wet(y * w + x);
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
    const near = this.cells.filter((i) => {
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
    for (const k of this.kinds) total += this.sprites[k].weight;
    let r = Math.random() * total, kind = this.kinds[0];
    for (const k of this.kinds) if ((r -= this.sprites[k].weight) <= 0) { kind = k; break; }
    const x = (i % w) * 16 + 8, y = Math.floor(i / w) * 16 + 8;
    const im = this.scene.add.image(x, y, this.key, kind).setOrigin(0.5, 0.75).setDepth(this.layer).setAlpha(0);
    this.floats.push({ im, x, y, vx: 0, vy: 0, lane: (Math.random() - 0.5) * 8, age: 0, bob: Math.random() * 6, gone: 0 });
  }

  update(time: number, delta: number, surge: number, cam: Phaser.Geom.Rectangle) {
    const dt = Math.min(0.1, delta / 1000), { w, flow } = this.level;
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
      if (f.gone || dir < 0 || !this.wetAt(cx, cy) || f.age > 60) f.gone += dt;
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
