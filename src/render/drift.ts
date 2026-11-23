import type Phaser from "phaser";
import type { DriftStyle } from "./season-art";
import { gustAt, wind, windVector } from "./wind";

const SIZE = 5;
const FRAMES = 4;
const SLANTS = 5;

// Four spin frames: a leaf turns edge-on and back as it falls. Blossom, seed
// and snow keep the same shape and use the frames as sizes.
const shapes: Record<string, string[][]> = {
  leaf: [
    [".XXX.", "XXXX.", ".XXX.", ".....", "....."],
    [".XX..", ".XXX.", ".XXX.", ".XX..", "....."],
    ["..XX.", ".XXX.", ".XXX.", "..XX.", "....."],
    [".....", "XXXXX", ".XXX.", ".....", "....."],
  ],
  blossom: [
    [".X...", "XXX..", ".X...", ".....", "....."],
    [".XX..", ".XX..", ".....", ".....", "....."],
    [".X...", ".XX..", ".....", ".....", "....."],
    ["..X..", ".XX..", ".X...", ".....", "....."],
  ],
  snow: [
    [".X...", "XXX..", ".X...", ".....", "....."],
    [".XX..", ".XX..", ".....", ".....", "....."],
    [".X...", ".....", ".....", ".....", "....."],
    [".XX..", ".X...", ".....", ".....", "....."],
  ],
  // A stone and the streak the eye leaves behind it; not spun, so each mote
  // keeps one of the four.
  hail: [
    ["..X..", "..X..", ".XX..", ".XX..", "....."],
    [".....", "..X..", ".XX..", ".XX..", "....."],
    ["..X..", "..X..", "..X..", ".XX..", ".XX.."],
    [".....", "..X..", "..X..", "..X..", "....."],
  ],
  dust: [
    ["XX...", ".....", ".....", ".....", "....."],
    ["X....", ".....", ".....", ".....", "....."],
    ["XXX..", ".....", ".....", ".....", "....."],
    ["X....", ".X...", ".....", ".....", "....."],
  ],
};

const RAIN_H = 7;
const SPLASH = "drift-splash";
const BOUNCE = "drift-bounce";
const STONE = "drift-stone";
const HOP_MS = 55;
/** A hailstone lies this long, in ms, and is gone over the last of it. */
const LIES = 26000;
const MELT = 6000;

function atlasKey(style: DriftStyle) {
  return `drift-${style.kind}-${style.colors.join("")}`;
}

function ensureAtlas(scene: Phaser.Scene, style: DriftStyle) {
  const key = atlasKey(style);
  if (scene.textures.exists(key)) return key;
  const rain = style.kind === "rain";
  const cols = rain ? SLANTS : FRAMES;
  const cell = rain ? RAIN_H : SIZE;
  const w = cols * SIZE,
    h = style.colors.length * cell;
  const atlas = scene.textures.createCanvas(key, w, h)!;
  const ctx = atlas.getContext();
  ctx.clearRect(0, 0, w, h);
  style.colors.forEach((color, row) => {
    ctx.fillStyle = color;
    for (let frame = 0; frame < cols; frame++) {
      if (rain) {
        // A streak drawn at the slant the wind is blowing it, so the drop
        // never has to be rotated at render time.
        const slant = frame - (SLANTS - 1) / 2;
        for (let y = 0; y < RAIN_H; y++) {
          const x = 2 + Math.round((slant * (y / (RAIN_H - 1) - 0.5)) * 1.6);
          ctx.fillRect(frame * SIZE + x, row * cell + y, 1, 1);
        }
      } else {
        shapes[style.kind][frame].forEach((line, y) =>
          [...line].forEach((pixel, x) => {
            if (pixel === "X")
              ctx.fillRect(frame * SIZE + x, row * cell + y, 1, 1);
          }),
        );
      }
      atlas.add(`${row}-${frame}`, 0, frame * SIZE, row * cell, SIZE, cell);
    }
  });
  atlas.refresh();
  return key;
}

const FADE = 0.5;

/** Three frames of a drop landing: a dot, a spreading tick, a faint ring. */
function ensureSplash(scene: Phaser.Scene) {
  if (scene.textures.exists(SPLASH)) return;
  const atlas = scene.textures.createCanvas(SPLASH, 3 * 7, 4)!;
  const ctx = atlas.getContext();
  ctx.clearRect(0, 0, 21, 4);
  const rows = [
    ["...X...", "..XXX..", ".......", "......."],
    ["..X.X..", ".XX.XX.", "..XXX..", "......."],
    [".X...X.", "X.....X", ".X...X.", "..XXX.."],
  ];
  ctx.fillStyle = "#dfeaf4";
  rows.forEach((shape, frame) => {
    shape.forEach((line, y) =>
      [...line].forEach((pixel, x) => {
        if (pixel === "X") ctx.fillRect(frame * 7 + x, y, 1, 1);
      }),
    );
    atlas.add(`${frame}`, 0, frame * 7, 0, 7, 4);
  });
  atlas.refresh();
}

/** Six frames of a stone landing: the hit, a hop to one side, and at rest.
 * And the stone it leaves: three sizes, white over its own small shadow. */
function ensureStones(scene: Phaser.Scene) {
  if (scene.textures.exists(BOUNCE)) return;
  const hop = scene.textures.createCanvas(BOUNCE, 6 * 9, 7)!;
  const ctx = hop.getContext();
  // Where the stone's top-left corner is in each frame; the first has the
  // chips it knocks up either side.
  const path = [[3, 5], [4, 2], [5, 0], [6, 1], [6, 4], [6, 5]];
  path.forEach(([x, y], frame) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(frame * 9 + x, y, 2, 2);
    ctx.fillStyle = "#cfe2f2";
    if (frame === 0) {
      ctx.fillRect(1, 5, 1, 1);
      ctx.fillRect(6, 4, 1, 1);
    } else if (frame < 5) ctx.fillRect(frame * 9 + x, y + 2, 1, 1);
    hop.add(`${frame}`, 0, frame * 9, 0, 9, 7);
  });
  hop.refresh();
  const lie = scene.textures.createCanvas(STONE, 3 * 3, 3)!;
  const c = lie.getContext();
  [[2, 2], [2, 1], [1, 1]].forEach(([w, h], frame) => {
    c.fillStyle = "rgba(70,86,104,0.5)";
    c.fillRect(frame * 3, h, w, 1);
    c.fillStyle = "#ffffff";
    c.fillRect(frame * 3, 0, w, h);
    if (w + h === 4) {
      c.fillStyle = "#cfe2f2";
      c.fillRect(frame * 3 + 1, 1, 1, 1);
    }
    lie.add(`${frame}`, 0, frame * 3, 0, 3, 3);
  });
  lie.refresh();
}

type Mote = {
  x: number;
  y: number;
  fall: number;
  phase: number;
  row: number;
  spin: number;
  /** Seconds left of a fall from a tree, or of the wait before the next. */
  life: number;
  span: number;
};
type Splash = { x: number; y: number; at: number; left?: boolean };

/** Ambient weather and debris blown across the view. World-space, so it
 * scales with zoom and sits in the scene's own perspective; motes recycle
 * round the camera rather than being placed per terrain chunk, so the cost is
 * fixed however far the player walks. */
export class Drift {
  private layer?: Phaser.GameObjects.Container;
  private sprites: Phaser.GameObjects.Image[] = [];
  private motes: Mote[] = [];
  private splashLayer?: Phaser.GameObjects.Container;
  private splashes: { sprite: Phaser.GameObjects.Image; state: Splash }[] = [];
  private key = "";
  private style?: DriftStyle;
  private last = 0;
  private seed = 0;
  private area = 0;

  /** Hailstones on the ground. They outlive the hail, so `clear` leaves them. */
  private lying: { sprite: Phaser.GameObjects.Image; at: number }[] = [];
  private laid = 0;

  private trees: Phaser.GameObjects.Image[] = [];
  private treesAt = -1e9;

  constructor(
    private scene: Phaser.Scene,
    private canopies: () => Phaser.GameObjects.Image[] = () => [],
    /** How far the ground at a world pixel is drawn above its cell, or
     * undefined where nothing would lie: open water. */
    private ground: (x: number, y: number) => number | undefined = () => 0,
  ) {}

  set(style: DriftStyle | undefined, seed: number) {
    if (!style) return this.clear();
    const key = atlasKey(style);
    if (key === this.key && style.density === this.style?.density) return;
    this.clear();
    this.key = key;
    this.style = style;
    this.seed = seed;
    this.fill();
  }

  /** Pool sized to the view, so a zoomed-out camera is not left with a dozen
   * motes scattered over a whole valley. */
  private fill() {
    const style = this.style!;
    const view = this.scene.cameras.main.worldView;
    this.area = Math.max(3e5, view.width * view.height);
    const count = Math.min(600, Math.round((style.density * this.area) / 1e6));
    ensureAtlas(this.scene, style);
    this.layer = this.scene.add.container(0, 0).setDepth(18500);
    const rnd = (n: number) => {
      const v = Math.sin(this.seed * 12.9898 + n * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x: view.x + rnd(i) * (view.width || 1200),
        y: view.y + rnd(i + 0.5) * (view.height || 900),
        fall: style.fall[0] + rnd(i + 1.5) * (style.fall[1] - style.fall[0]),
        phase: rnd(i + 4.5) * 6.28,
        row: Math.floor(rnd(i + 5.5) * style.colors.length),
        spin: style.spin ? style.spin * (0.6 + rnd(i + 6.5)) : 0,
        life: rnd(i + 7.5) * 3,
        span: 0,
      });
      const image = this.scene.add
        .image(0, 0, this.key, `${this.motes[i].row}-${style.kind === "hail" || style.kind === "dust" ? i % FRAMES : 0}`)
        .setOrigin(0)
        .setAlpha(style.alpha);
      this.layer.add(image);
      this.sprites.push(image);
    }
    if (style.splash || style.bounce) {
      if (style.bounce) ensureStones(this.scene);
      else ensureSplash(this.scene);
      this.splashLayer = this.scene.add.container(0, 0).setDepth(18400);
      for (let i = 0; i < Math.ceil(count / (style.bounce ? 2 : 4)); i++) {
        const sprite = this.scene.add
          .image(0, 0, style.bounce ? BOUNCE : SPLASH, "0")
          .setOrigin(0.5, 1)
          .setAlpha(style.bounce ? 1 : 0.5);
        this.splashLayer.add(sprite);
        this.splashes.push({
          sprite,
          state: { x: 0, y: 0, at: -rnd(i + 9.5) * 500 },
        });
      }
    }
    this.scene.game.canvas.dataset.drift = `${style.kind}:${count}`;
  }

  clear() {
    // Two drifts share the canvas: one with nothing in the air leaves the other's note alone.
    if (this.layer && this.scene.game?.canvas) this.scene.game.canvas.dataset.drift = "none";
    this.layer?.destroy(true);
    this.splashLayer?.destroy(true);
    this.layer = this.splashLayer = undefined;
    this.sprites = [];
    this.motes = [];
    this.splashes = [];
    this.key = "";
    this.style = undefined;
    this.area = 0;
  }

  /** Takes the lying stones away at once: the view has left the ground they were on. */
  sweep() {
    for (const stone of this.lying) stone.sprite.destroy();
    this.lying = [];
  }
  /** Stones on the ground fade out; the oldest make room. */
  private melt(time: number) {
    while (this.lying.length && (time - this.lying[0].at > LIES || this.lying.length > 260))
      this.lying.shift()!.sprite.destroy();
    for (const stone of this.lying) {
      const left = LIES - (time - stone.at);
      if (left < MELT) stone.sprite.setAlpha(left / MELT);
    }
  }
  private lay(x: number, y: number, time: number) {
    const lift = this.ground(x, y);
    if (lift === undefined) return;
    this.lying.push({
      at: time,
      sprite: this.scene.add
        .image(Math.round(x), Math.round(y - lift), STONE, `${this.laid++ % 3}`)
        .setOrigin(0.5, 1)
        .setDepth(y - 12),
    });
  }

  update(time: number, frozen = false) {
    if (this.lying.length && !frozen) this.melt(time);
    if (!this.layer || !this.style) return;
    const dt = Math.min(0.05, this.last ? (time - this.last) / 1000 : 0);
    this.last = time;
    const view = this.scene.cameras.main.worldView;
    if (!view.width) return;
    if (
      this.area &&
      Math.abs(view.width * view.height - this.area) > this.area * 0.4
    ) {
      const style = this.style;
      this.layer.destroy(true);
      this.splashLayer?.destroy(true);
      this.sprites = [];
      this.motes = [];
      this.splashes = [];
      this.style = style;
      this.fill();
      return;
    }
    const style = this.style;
    const w = view.width + 32,
      h = view.height + 32;
    const t = time / 1000;
    const air = wind();
    const v = windVector();
    const push = style.windPull * air.strength;
    const slant =
      2 + Math.max(-2, Math.min(2, Math.round(v.x * air.strength * 3.2)));
    if (style.perTree) return this.fromTrees(time, dt, frozen, push, v, view);
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i];
      if (!frozen) {
        m.y += (m.fall + push * v.y) * dt;
        m.x += push * v.x * dt;
      }
      // Wrapping in view-relative space keeps the field dense wherever the
      // camera goes without ever allocating another mote.
      const x = view.x - 16 + ((((m.x - view.x) % w) + w) % w);
      const y = view.y - 16 + ((((m.y - view.y) % h) + h) % h);
      const sprite = this.sprites[i];
      sprite.setPosition(
        Math.round(x + gustAt(time, m.x, m.y, m.phase) * style.sway),
        Math.round(y),
      );
      if (m.spin)
        sprite.setFrame(`${m.row}-${Math.floor(t * m.spin + m.phase) % FRAMES}`);
      else if (style.kind === "rain") sprite.setFrame(`${m.row}-${slant}`);
    }
    if (!this.splashes.length) return;
    const rnd = (n: number) => {
      const s = Math.sin(n * 91.7 + this.seed * 31.3) * 43758.5453;
      return s - Math.floor(s);
    };
    for (let i = 0; i < this.splashes.length; i++) {
      const { sprite, state } = this.splashes[i];
      const age = time - state.at;
      if (style.bounce) {
        if (age > HOP_MS * 6 && !frozen) {
          if (state.at > 0) this.lay(state.x + (state.left ? -3 : 3), state.y, time);
          state.at = time + rnd(time * 0.001 + i) * 500;
          state.x = view.x + rnd(i + time * 0.0013) * view.width;
          state.y = view.y + rnd(i + 0.7 + time * 0.0017) * view.height;
          state.left = rnd(i + 1.3 + time * 0.0011) < 0.5;
          sprite.setPosition(Math.round(state.x), Math.round(state.y)).setFlipX(state.left);
        }
        const frame = age < 0 ? -1 : Math.floor(age / HOP_MS);
        sprite.setVisible(frame >= 0 && frame < 6);
        if (frame >= 0 && frame < 6) sprite.setFrame(`${frame}`);
        continue;
      }
      if (age > 340 && !frozen) {
        state.at = time + rnd(time * 0.001 + i) * 380;
        state.x = view.x + rnd(i + time * 0.0013) * view.width;
        state.y = view.y + rnd(i + 0.7 + time * 0.0017) * view.height;
        sprite.setPosition(Math.round(state.x), Math.round(state.y));
      }
      const frame = age < 0 ? -1 : Math.floor(age / 110);
      sprite.setVisible(frame >= 0 && frame < 3);
      if (frame >= 0 && frame < 3) sprite.setFrame(`${frame}`);
    }
  }

  /** Leaves and petals let go from a canopy in view, fall a body's height or
   * two with the wind, and fade on the ground; each then waits and goes again
   * from another tree. */
  private fromTrees(
    time: number,
    dt: number,
    frozen: boolean,
    push: number,
    v: { x: number; y: number },
    view: Phaser.Geom.Rectangle,
  ) {
    const style = this.style!;
    if (time - this.treesAt > 500) {
      this.treesAt = time;
      this.trees = this.canopies().filter(
        (t) =>
          t.visible &&
          t.x > view.x - 40 &&
          t.x < view.right + 40 &&
          t.y > view.y - 40 &&
          t.y < view.bottom + 80,
      );
    }
    const t = time / 1000;
    const active = Math.round(this.trees.length * style.perTree!);
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i];
      const sprite = this.sprites[i];
      if (!frozen) m.life -= dt;
      if (m.life <= 0) {
        if (i >= active) {
          m.span = 0;
          m.life = 0.5 + Math.random();
        } else {
          const tree = this.trees[Math.floor(Math.random() * this.trees.length)];
          const box = tree.getBounds();
          m.x = box.x + box.width * (0.15 + Math.random() * 0.7);
          m.y = box.y + box.height * (0.25 + Math.random() * 0.35);
          m.span = m.life = (24 + Math.random() * 40) / m.fall;
        }
      }
      if (!m.span) {
        sprite.setVisible(false);
        continue;
      }
      if (!frozen) {
        m.y += (m.fall + push * v.y * 0.4) * dt;
        m.x += push * v.x * 0.4 * dt;
      }
      const age = m.span - m.life;
      sprite
        .setVisible(true)
        .setAlpha(style.alpha * Math.min(1, age / FADE, m.life / FADE))
        .setPosition(Math.round(m.x + gustAt(time, m.x, m.y, m.phase) * style.sway), Math.round(m.y))
        .setFrame(`${m.row}-${Math.floor(t * m.spin + m.phase) % FRAMES}`);
    }
  }
}
