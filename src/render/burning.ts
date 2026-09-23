import Phaser from "phaser";
import type { Fire } from "../core/types";
import { ensureFireLight } from "./fire";
import { makeBody, Scene, type Body } from "./materials/sim";

/** Room round the sprite for flame and smoke to rise into. */
const SIDE = 16,
  ABOVE = 48;
/** Automata run on the nearest fires only; the rest keep their art until a
 * nearer one goes out. */
const LIVE_LIMIT = 16;
const STEP_MS = 1000 / 30;

type Live = {
  sim: Scene;
  body: Body;
  key: string;
  texture: Phaser.Textures.CanvasTexture;
  pixels: ImageData;
  image: Phaser.GameObjects.Image;
  /** What the image showed before it caught, to put back if it is spared. */
  was: { key: string; frame: string; originX: number; originY: number; x: number; y: number; flipX: boolean };
  x: number;
  y: number;
  glow: Phaser.GameObjects.Image;
  acc: number;
  building: boolean;
};

const fireKey = (f: Fire) => (f.place ? `place:${f.place}` : `${f.x},${f.y}`);

/** The engine says what is alight and for how long; this draws it, running
 * the materials automaton over the sprite's own pixels so the flames eat
 * the tree or the thatch they are on. */
export class Burning {
  private live = new Map<string, Live>();
  private serial = 0;
  constructor(private scene: Phaser.Scene) {}

  update(
    fires: Fire[],
    imageFor: (f: Fire) => Phaser.GameObjects.Image | undefined,
    near: { x: number; y: number },
    delta: number,
    glowAlpha: number,
  ) {
    const wanted = new Map<string, Fire>();
    const order = [...fires].sort(
      (a, b) => Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y),
    );
    for (const f of order.slice(0, LIVE_LIMIT)) wanted.set(fireKey(f), f);
    for (const [key, live] of this.live)
      if (!wanted.has(key)) {
        this.release(live);
        this.live.delete(key);
      }
    for (const [key, f] of wanted) {
      const image = imageFor(f);
      let live = this.live.get(key);
      if (!image || !image.active) continue;
      if (!live) {
        const made = this.start(image, !!f.place);
        if (!made) continue;
        this.live.set(key, (live = made));
      }
      // A chunk rebuild makes a fresh image; the fire carries on in it.
      if (live.image !== image) {
        live.image = image;
        image.setTexture(live.key).setOrigin(0, 0).setPosition(live.x, live.y).setFlipX(false);
      }
      live.acc += delta;
      let stepped = false;
      while (live.acc >= STEP_MS) {
        live.acc -= STEP_MS;
        this.feed(live);
        live.sim.step();
        stepped = true;
      }
      if (stepped) {
        live.sim.render(live.pixels.data, []);
        live.texture.context.putImageData(live.pixels, 0, 0);
        live.texture.refresh();
      }
      live.glow.setAlpha(glowAlpha * (0.8 + Math.random() * 0.2));
    }
  }

  /** Keep it alight while the engine says it burns: a coal at the foot of a
   * tree, a patch of the roof on a house. */
  private feed(live: Live) {
    if (Math.random() > 0.04) return;
    const b = live.body;
    for (let tries = 0; tries < 20; tries++) {
      const i = Math.floor(Math.random() * b.w * b.h);
      const y = (i / b.w) | 0;
      if (!b.mat[i]) continue;
      if (live.building ? y > b.h * 0.6 : y < b.bottom - 12) continue;
      live.sim.heatAt(SIDE + (i % b.w), ABOVE + y, 1, 0.5);
      return;
    }
  }

  private start(image: Phaser.GameObjects.Image, building: boolean): Live | undefined {
    const frame = image.frame;
    const w = frame.cutWidth,
      h = frame.cutHeight;
    if (!w || !h) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    if (image.flipX) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, w, h, 0, 0, w, h);
    const src = ctx.getImageData(0, 0, w, h).data;
    const W = w + SIDE * 2,
      H = h + ABOVE;
    const sim = new Scene(W, H, false);
    const body = sim.add(makeBody(building ? "building" : "tree", w, h, src, SIDE, ABOVE));
    const key = `burning:${++this.serial}`;
    const texture = this.scene.textures.createCanvas(key, W, H)!;
    const tl = image.getTopLeft();
    const was = {
      key: image.texture.key,
      frame: image.frame.name,
      originX: image.originX,
      originY: image.originY,
      x: image.x,
      y: image.y,
      flipX: image.flipX,
    };
    const x = Math.round(tl.x - SIDE * image.scaleX),
      y = Math.round(tl.y - ABOVE * image.scaleY);
    image.setTexture(key).setOrigin(0, 0).setPosition(x, y).setFlipX(false);
    const glow = this.scene.add
      .image(x + W / 2, y + ABOVE + h * 0.7, ensureFireLight(this.scene, Math.max(32, Math.round(w / 4) * 4)), "0")
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(19001);
    const live: Live = {
      sim,
      body,
      key,
      texture,
      pixels: new ImageData(W, H),
      image,
      was,
      x,
      y,
      glow,
      acc: 0,
      building,
    };
    // Catch where the torch would: low on a trunk, high on a roof. The scene
    // finds pixels through its last render, so draw it once first.
    sim.render(live.pixels.data, []);
    sim.heatAt(SIDE + (w >> 1), ABOVE + (building ? h >> 2 : body.bottom - 6), 2, 0.8);
    return live;
  }

  /** The sprite goes back as it was; a spent fire's chunk rebuild then
   * draws the stump or the ruin in its place. */
  private release(live: Live) {
    live.glow.destroy();
    const was = live.was;
    if (live.image.active)
      live.image.setTexture(was.key, was.frame).setOrigin(was.originX, was.originY).setPosition(was.x, was.y).setFlipX(was.flipX);
    this.scene.textures.remove(live.key);
  }

  destroy() {
    for (const live of this.live.values()) this.release(live);
    this.live.clear();
  }
}

const FLAME = [0xfff4b0, 0xffc43d, 0xf07a1c, 0xb8321a];

/** The flame on a torch in hand: a few pixels a frame rising off the head,
 * and a pool of light that goes where the player goes. */
export class TorchFlame {
  private glow?: Phaser.GameObjects.Image;
  private bits: { r: Phaser.GameObjects.Rectangle; life: number; max: number; vx: number }[] = [];
  constructor(private scene: Phaser.Scene) {}

  update(holder: Phaser.GameObjects.Image | undefined, lit: boolean, facing: number, glowAlpha: number) {
    const x = holder ? holder.x + [3, 6, -3, -6][facing] : 0,
      y = holder ? holder.y - holder.displayHeight * 0.62 : 0;
    if (lit && holder) {
      this.glow ??= this.scene.add
        .image(x, y, ensureFireLight(this.scene, 40), "0")
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(19001);
      this.glow.setPosition(x, y + 6).setAlpha(glowAlpha * (0.85 + Math.random() * 0.15));
      for (let k = 0; k < 2; k++) {
        const max = 8 + Math.random() * 10;
        const r = this.scene.add
          .rectangle(x + (Math.random() - 0.5) * 3, y, 1, 1, FLAME[0])
          .setOrigin(0, 0)
          .setDepth(holder.depth + 1);
        this.bits.push({ r, life: max, max, vx: (Math.random() - 0.5) * 0.3 });
      }
    } else if (this.glow) {
      this.glow.destroy();
      this.glow = undefined;
    }
    this.bits = this.bits.filter((b) => {
      b.life--;
      if (b.life <= 0) {
        b.r.destroy();
        return false;
      }
      b.r.y -= 0.45;
      b.r.x += b.vx;
      b.r.fillColor = FLAME[Math.min(3, Math.floor((1 - b.life / b.max) * 4))];
      return true;
    });
  }
}
