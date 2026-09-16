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
  seed: [
    [".X...", "XXX..", ".X...", ".....", "....."],
    [".X...", ".X...", ".....", ".....", "....."],
    [".X...", ".....", ".....", ".....", "....."],
    ["XX...", ".X...", ".....", ".....", "....."],
  ],
  snow: [
    [".X...", "XXX..", ".X...", ".....", "....."],
    [".XX..", ".XX..", ".....", ".....", "....."],
    [".X...", ".....", ".....", ".....", "....."],
    [".XX..", ".X...", ".....", ".....", "....."],
  ],
};

const RAIN_H = 7;
const SPLASH = "drift-splash";

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

type Mote = {
  x: number;
  y: number;
  fall: number;
  phase: number;
  row: number;
  spin: number;
};
type Splash = { x: number; y: number; at: number };

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

  constructor(private scene: Phaser.Scene) {}

  set(style: DriftStyle | undefined, seed: number) {
    if (!style) return this.clear();
    const key = atlasKey(style);
    if (key === this.key) return;
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
      });
      const image = this.scene.add
        .image(0, 0, this.key, `${this.motes[i].row}-0`)
        .setOrigin(0)
        .setAlpha(style.alpha);
      this.layer.add(image);
      this.sprites.push(image);
    }
    if (style.splash) {
      ensureSplash(this.scene);
      this.splashLayer = this.scene.add.container(0, 0).setDepth(18400);
      for (let i = 0; i < Math.ceil(count / 4); i++) {
        const sprite = this.scene.add
          .image(0, 0, SPLASH, "0")
          .setOrigin(0.5, 1)
          .setAlpha(0.5);
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
    this.layer?.destroy(true);
    this.splashLayer?.destroy(true);
    this.layer = this.splashLayer = undefined;
    this.sprites = [];
    this.motes = [];
    this.splashes = [];
    this.key = "";
    this.style = undefined;
    this.area = 0;
    if (this.scene.game?.canvas) this.scene.game.canvas.dataset.drift = "none";
  }

  update(time: number, frozen = false) {
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
}
