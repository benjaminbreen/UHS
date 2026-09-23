import Phaser from "phaser";
import type { Fire } from "../core/types";
import { gameAudio } from "../audio/director";
import { fire as fireSound } from "../audio/sfx";
import { ensureFireLight } from "./fire";
import { alight, makeBody, Mat, retype, Scene, type Body } from "./materials/sim";
import { addPlume } from "./smoke";

/** Room round the sprite for flame, glow and smoke to rise into. */
const SIDE = 24,
  ABOVE = 96;
/** Automata run on the nearest fires only; the rest keep their art until a
 * nearer one goes out. */
const LIVE_LIMIT = 16;
const STEP_MS = 1000 / 30;
/** A building's roof is its top part, whatever the atlas drew it in. */
const ROOF = 0.45;
/** How far away, in world pixels, a fire can still be heard. */
const EARSHOT = 260;

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
  plume: Phaser.GameObjects.GameObject[];
  acc: number;
  steps: number;
  building: boolean;
  roof: number;
  crackleAt: number;
  fallen: boolean;
};

const fireKey = (f: Fire) => (f.place ? `place:${f.place}` : `${f.x},${f.y}`);

/** The engine says what is alight and how far it has gone; this draws it,
 * running the materials automaton over the sprite's own pixels so the flames
 * eat the tree or the roof they are on, spreading from where they already
 * burn rather than appearing in patches. */
export class Burning {
  private live = new Map<string, Live>();
  private serial = 0;
  constructor(private scene: Phaser.Scene) {}

  update(
    fires: Fire[],
    imageFor: (f: Fire) => Phaser.GameObjects.Image | undefined,
    /** 0 to 1: how much of a building the engine has let burn. */
    progressFor: (f: Fire) => number | undefined,
    near: { x: number; y: number },
    time: number,
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
        this.release(live, !fires.some((f) => fireKey(f) === key));
        this.live.delete(key);
      }
    const ear = { x: near.x * 16 + 8, y: near.y * 16 + 8 };
    for (const [key, f] of wanted) {
      const image = imageFor(f);
      let live = this.live.get(key);
      if (!image || !image.active) continue;
      if (!live) {
        const made = this.start(image, !!f.place);
        if (!made) continue;
        this.live.set(key, (live = made));
        if (this.heard(made, ear) > 0) void gameAudio()?.sound(fireSound.catch(), "fire-catch");
      }
      // A chunk rebuild makes a fresh image, and nothing else may repaint it
      // while it burns.
      if (live.image !== image || image.texture.key !== live.key) {
        live.image = image;
        image.setTexture(live.key).setOrigin(0, 0).setPosition(live.x, live.y).setFlipX(false);
      }
      const progress = progressFor(f);
      live.acc += delta;
      let stepped = false;
      while (live.acc >= STEP_MS) {
        live.acc -= STEP_MS;
        if (live.steps++ % 12 === 0) this.feed(live, progress);
        live.sim.step();
        stepped = true;
      }
      if (stepped) {
        live.sim.render(live.pixels.data, []);
        live.texture.context.putImageData(live.pixels, 0, 0);
        live.texture.refresh();
      }
      live.glow.setAlpha(glowAlpha * (0.75 + Math.random() * 0.25));
      const loud = this.heard(live, ear);
      if (loud > 0 && time >= live.crackleAt) {
        live.crackleAt = time + 90 + Math.random() * 260;
        void gameAudio()?.sound(fireSound.crackle(loud * (live.building ? 1 : 0.7)), `fire-crackle-${key}`);
      }
      if (live.building && !live.fallen && (progress ?? 0) > 0.97) {
        live.fallen = true;
        if (loud > 0) void gameAudio()?.sound(fireSound.collapse(), "fire-collapse");
      }
    }
  }

  private heard(live: Live, ear: { x: number; y: number }) {
    const d = Math.hypot(live.x + live.pixels.width / 2 - ear.x, live.y + live.pixels.height - ear.y);
    return Math.max(0, 1 - d / EARSHOT);
  }

  /** Keep the fire going from its own edge. A building is held to the pace
   * of the engine's roof loss: behind it, the flames reach into the next
   * pixels; ahead of it, they are left to spread by themselves. */
  private feed(live: Live, progress: number | undefined) {
    const b = live.body;
    const burning: number[] = [];
    let spent = 0;
    for (let i = 0; i < b.w * b.h; i++) {
      if (live.building && i / b.w >= b.h * ROOF) continue;
      if (!b.mat[i] || b.mat[i] === Mat.Char) spent++;
      else if (alight(b, i)) {
        spent++;
        burning.push(i);
      }
    }
    const behind = live.building ? spent / Math.max(1, live.roof) < (progress ?? 0) : burning.length < 12;
    if (!behind) return;
    for (let k = 0; k < 4; k++) {
      const from = burning.length
        ? burning[Math.floor(Math.random() * burning.length)]
        : Math.floor(Math.random() * b.w * (live.building ? b.h * ROOF : b.h));
      const x = (from % b.w) + Math.round((Math.random() - 0.5) * 5),
        y = ((from / b.w) | 0) + Math.round((Math.random() - 0.7) * 4);
      live.sim.heatAt(SIDE + x, ABOVE + y, 1, 0.45);
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
    let roof = 0;
    // Tile and stone on a roof lie on timbers, and come down when they burn.
    if (building)
      for (let i = 0; i < w * h * ROOF; i++) {
        if (!body.mat[i]) continue;
        roof++;
        if (body.mat[i] !== Mat.Thatch && body.mat[i] !== Mat.Leaf) retype(body, i, Mat.Wood);
      }
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
      .image(x + W / 2, y + ABOVE + h * 0.6, ensureFireLight(this.scene, Math.max(40, Math.round((w * 1.2) / 4) * 4)), "0")
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(19001);
    // Past the automaton's own margin the smoke is the game's: a column that
    // leans with the wind and climbs out of view.
    const plume = building
      ? addPlume(this.scene, Math.round(x + W / 2), Math.round(y + ABOVE), "fire", 2, image.depth + 2, 0xffffff)
      : [];
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
      plume,
      acc: 0,
      steps: 0,
      building,
      roof,
      crackleAt: 0,
      fallen: false,
    };
    // Catch where the torch would: low on a trunk, high on a roof. The scene
    // finds pixels through its last render, so draw it once first.
    sim.render(live.pixels.data, []);
    sim.heatAt(SIDE + (w >> 1), ABOVE + (building ? h >> 2 : body.bottom - 6), 2, 0.8);
    return live;
  }

  /** Spared, the sprite goes back as it was. Spent, the last burnt frame
   * stays until the chunk rebuild draws the stump or the ruin over it. */
  private release(live: Live, spent: boolean) {
    live.glow.destroy();
    for (const puff of live.plume) puff.destroy();
    const was = live.was;
    if (spent && live.image.active) {
      live.image.once(Phaser.GameObjects.Events.DESTROY, () => this.scene.textures.remove(live.key));
      return;
    }
    if (live.image.active)
      live.image.setTexture(was.key, was.frame).setOrigin(was.originX, was.originY).setPosition(was.x, was.y).setFlipX(was.flipX);
    this.scene.textures.remove(live.key);
  }

  destroy() {
    for (const live of this.live.values()) this.release(live, false);
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
      if (!this.glow) void gameAudio()?.sound(fireSound.catch(), "torch-lit");
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
