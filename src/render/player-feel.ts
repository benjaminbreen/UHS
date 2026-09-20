import Phaser from "phaser";
import type { HitClass } from "../core/reactions";
import type { CharacterPose } from "./characters/poses";

type Sprite = Phaser.GameObjects.Image;

/** What each surface shows of someone crossing it. `print` is a mark left
 * behind and how long it lasts; `puff` is what a running foot throws up. */
const SURFACES: Partial<
  Record<
    HitClass,
    { print?: { color: number; alpha: number; ms: number }; puff?: number[] }
  >
> = {
  snow: {
    print: { color: 0x6f86a6, alpha: 0.65, ms: 9000 },
    puff: [0xffffff, 0xe3ecf5],
  },
  sand: {
    print: { color: 0x6b5a36, alpha: 0.4, ms: 5000 },
    puff: [0xd9c79a, 0xc0ab7c],
  },
  marsh: { print: { color: 0x2e3a26, alpha: 0.4, ms: 6000 } },
  soil: { puff: [0x9c8c6a, 0xbcae8c, 0x7d7054] },
  grass: { puff: [0x8fb45c, 0x6f8f46] },
};
/** Rain turns bare earth to mud, which takes a print. */
const MUD = { color: 0x3a2c1c, alpha: 0.4, ms: 6000 };
const MAX_PRINTS = 90;
const STRIDE_PX = 5;

export type Fidget = {
  /** A pose to play through once, or none when it is only a look. */
  pose?: CharacterPose;
  /** Eighths of a turn to look aside by. */
  look?: number;
  /** One-pixel tremble, for the cold. */
  shiver?: boolean;
  from: number;
  until: number;
};

/** The small things a body does that nobody asked it to: the give in the
 * knees on landing, the slide at the end of a run, the marks it leaves, and
 * what it gets up to when left standing. All of it is drawn over the engine's
 * state and changes none of it. */
export class PlayerFeel {
  private prints: Phaser.GameObjects.Rectangle[] = [];
  private foot = 1;
  private fidget?: Fidget;
  private nextFidget = 0;
  /** Until when a squash owns the sprite's scale, so nothing resets it. */
  springUntil = 0;
  constructor(private scene: Phaser.Scene) {}

  /** Squash now, and spring back past square before settling. */
  spring(im: Sprite, sx: number, sy: number, ms = 200) {
    im.setScale(sx, sy);
    this.springUntil = this.scene.time.now + ms + 20;
    // Through a stand-in: a tween on the sprite itself reads as walking.
    const s = { x: sx, y: sy };
    this.scene.tweens.add({
      targets: s,
      x: 1,
      y: 1,
      duration: ms,
      ease: "Back.easeOut",
      easeParams: [2.6],
      onUpdate: () => im.active && im.setScale(s.x, s.y),
      onComplete: () => im.active && im.setScale(1, 1),
    });
  }

  /** The end of a jump. A long one, or a drop, comes down harder. */
  land(im: Sprite, height: number, x: number, y: number) {
    const weight = Math.min(1, height / 40);
    this.spring(im, 1 + 0.2 * weight + 0.06, 1 - 0.22 * weight - 0.06);
    const ring = this.scene.add
      .ellipse(x, y - 1, 8, 3)
      .setStrokeStyle(1, 0xd8ccb0, 0.8)
      .setDepth(y * 16 + 3900);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.2 + weight * 1.6,
      scaleY: 2.2 + weight * 1.6,
      alpha: 0,
      duration: 260,
      ease: "Quad.easeOut",
      onComplete: () => ring.destroy(),
    });
    if (height > 26) this.scene.cameras.main.shake(70, 0.0016);
  }

  private lastPrint = { x: 0, y: 0 };
  /** Called while walking. Prints go down by ground covered, a stride apart,
   * not by animation frame: a walk cycle is slower than the feet it draws. */
  track(
    im: Sprite,
    surface: HitClass,
    direction: number,
    wet: boolean,
    depth: number,
  ) {
    const print = surface === "soil" && wet ? MUD : SURFACES[surface]?.print;
    if (
      Math.hypot(im.x - this.lastPrint.x, im.y - this.lastPrint.y) < STRIDE_PX
    )
      return;
    this.lastPrint = { x: im.x, y: im.y };
    this.foot = -this.foot;
    if (print) {
      // Left and right of the line of travel, turn about.
      const across = direction % 2 ? [0, 2] : [2, 0];
      const mark = this.scene.add
        .rectangle(
          Math.round(im.x + across[0] * this.foot),
          Math.round(im.y - 1 + across[1] * this.foot),
          direction % 2 ? 3 : 2,
          direction % 2 ? 2 : 3,
          print.color,
          print.alpha,
        )
        .setDepth(depth);
      this.prints.push(mark);
      this.scene.tweens.add({
        targets: mark,
        alpha: 0,
        delay: print.ms * 0.5,
        duration: print.ms * 0.5,
        onComplete: () => {
          this.prints = this.prints.filter((p) => p !== mark);
          mark.destroy();
        },
      });
      if (this.prints.length > MAX_PRINTS) this.prints.shift()?.destroy();
    }
  }
  /** A running foot coming down throws up a little of what it lands on. */
  step(im: Sprite, surface: HitClass) {
    const puff = SURFACES[surface]?.puff;
    if (puff) this.puff(im.x, im.y, puff, 2, 0.5);
  }

  puff(x: number, y: number, palette: number[], count: number, spread = 1) {
    for (let i = 0; i < count; i++) {
      const size = i % 3 ? 2 : 3;
      const rect = this.scene.add
        .rectangle(
          x + (Math.random() - 0.5) * 8,
          y - 1 - Math.random() * 3,
          size,
          size,
          palette[i % palette.length],
        )
        .setDepth(y * 16 + 4000);
      this.scene.tweens.add({
        targets: rect,
        x: rect.x + (Math.random() - 0.5) * 22 * spread,
        y: rect.y - 4 - Math.random() * 7,
        alpha: 0,
        duration: 260 + Math.random() * 120,
        ease: "Quad.easeOut",
        onComplete: () => rect.destroy(),
      });
    }
  }

  /** True on the frame a run comes to rest. */
  stoppedRun(running: boolean, moving: boolean, time: number) {
    // Shift usually comes up a moment before the last step finishes.
    if (moving && running) this.ranAt = time;
    const stopped = !moving && this.ranAt > 0 && time - this.ranAt < 220;
    if (!moving) this.ranAt = 0;
    return stopped;
  }
  private ranAt = 0;
  /** A run does not stop dead: the feet slide on a few pixels and come back. */
  skid(
    im: Sprite,
    shade: Sprite | undefined,
    direction: number,
    dust: number[],
  ) {
    const d = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][direction];
    this.puff(im.x, im.y, dust, 5, 0.6);
    this.spring(im, 1.08, 0.94, 160);
    // Out and back as an offset, so a step taken mid-slide is not fought.
    const slide = { v: 0 };
    let last = 0;
    this.scene.tweens.add({
      targets: slide,
      v: 1,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut",
      onUpdate: () => {
        const by = slide.v - last;
        last = slide.v;
        for (const o of [im, shade])
          if (o?.active)
            o.setPosition(o.x + d[0] * 4 * by, o.y + d[1] * 3 * by);
      },
    });
  }

  /** Left standing, a person does something. What depends on how they are. */
  idle(
    time: number,
    still: boolean,
    state: { injured: boolean; tired: boolean; cold: boolean },
    roll: () => number,
  ): Fidget | undefined {
    if (!still) {
      this.fidget = undefined;
      this.nextFidget = 0;
      return undefined;
    }
    if (this.fidget && time < this.fidget.until) return this.fidget;
    this.fidget = undefined;
    if (!this.nextFidget) this.nextFidget = time + 5000 + roll() * 4000;
    if (time < this.nextFidget) return undefined;
    this.nextFidget = 0;
    const r = roll();
    this.fidget = state.injured
      ? { pose: "hurt", from: time, until: time + 640 }
      : state.cold && r < 0.6
        ? { shiver: true, from: time, until: time + 800 }
        : state.tired && r < 0.7
          ? { pose: "stoop", from: time, until: time + 1600 }
          : r < 0.55
            ? // A look one way, then the other.
              { look: roll() < 0.5 ? 1 : -1, from: time, until: time + 1500 }
            : { pose: "sway", from: time, until: time + 1280 };
    return this.fidget;
  }

  /** Knocked about: the figure blinks for a moment, the way a hit reads in
   * every game that has ever had one. */
  blink(im: Sprite) {
    const b = { a: 1 };
    this.scene.tweens.add({
      targets: b,
      a: 0.25,
      duration: 70,
      yoyo: true,
      repeat: 4,
      onUpdate: () => im.active && im.setAlpha(b.a),
      onComplete: () => im.active && im.setAlpha(1),
    });
  }

  dispose() {
    for (const p of this.prints) p.destroy();
    this.prints = [];
  }
}
