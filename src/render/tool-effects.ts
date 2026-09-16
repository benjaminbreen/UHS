import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import type { EffectId } from "../audio/synth";

export type ToolEffectKind =
  | "hit"
  | "fell"
  | "cut"
  | "buck"
  | "dig"
  | "reap"
  | "mine"
  | "shatter"
  /** A swing that found nothing: the arc, and nothing else. */
  | "miss";
export type ToolEffect = {
  serial: number;
  kind: ToolEffectKind;
  /** The worked cell, and the cell the player swung from. */
  at: { x: number; y: number };
  from: { x: number; y: number };
  /** The plant as it stood, before the blow landed. */
  sprite?: string;
  /** Which way the player is facing, for work done on their own cell. */
  facing?: number;
};
type Shake = {
  image: Phaser.GameObjects.Image;
  until: number;
  ox: number;
  wind: boolean;
};
const LEAF = [0x8fb45c, 0xa8c46c, 0x6f8f46, 0xc8d98a];
const CHIP = [0xdcc292, 0xb08a5c, 0xf0e0b8];
const SOIL = [0x8d6e47, 0xb08a5c, 0x61472c];
const GRIT = [0x8a9199, 0xadb3ba, 0x697179, 0xd8dce0];
const sound: Partial<Record<ToolEffectKind, EffectId>> = {
  hit: "chop",
  buck: "chop",
  fell: "timber",
  cut: "chop",
  dig: "dig",
  reap: "reap",
  mine: "pick",
  shatter: "shatter",
};
/** Everything a tool throws off: chips, dust, the arc of the swing and the
 * tree going over. Sprites here are owned by this class, not by the scenery
 * layer, so a rebuild in the same frame does not sweep them away mid-fall. */
export class ToolEffects {
  private shakes: Shake[] = [];
  /** Cells whose scenery is held out of sight while a tree falls over them. */
  private hidden: { x: number; y: number; until: number }[] = [];
  private live = new Set<Phaser.GameObjects.GameObject>();
  private played = 0;
  /** Bumped when the world changes, so a swing scheduled against the old one
   * does not land in the new. */
  private generation = 0;
  constructor(
    private scene: Phaser.Scene,
    private view: {
      tint: () => number;
      lift: (x: number, y: number) => number;
      /** The images standing on a cell, so a blow can rock them. */
      plantAt: (x: number, y: number) => Phaser.GameObjects.Image[];
      texture: (frame: string) => string;
      frame: (frame: string) => string | number;
    },
  ) {}
  /** Plays once per effect serial, on the frame of the pose where the tool
   * actually reaches the ground rather than as the swing begins. */
  consume(effect: ToolEffect | undefined) {
    if (!effect || effect.serial === this.played) return;
    this.played = effect.serial;
    // The cell was rebuilt as logs the moment the engine felled the tree, so
    // hide it now rather than when the swing lands, or the logs show up under
    // a tree that is still standing.
    if (effect.kind === "fell") this.hide(effect.at, 150 + 640);
    const generation = this.generation;
    this.scene.time.delayedCall(150, () => {
      if (generation === this.generation) this.play(effect);
    });
  }
  private pixel(x: number, y: number, size: number, color: number) {
    const rect = this.scene.add
      .rectangle(x, y, size, size, color)
      .setDepth(y * 16 + 4000);
    this.live.add(rect);
    return rect;
  }
  /** A cell's centre in world pixels, standing on the ground. */
  private point(cell: { x: number; y: number }) {
    const x = cell.x * 16 + 8,
      y = cell.y * 16 + 16;
    return { x, y: y - this.view.lift(x, y) };
  }
  private play(effect: ToolEffect) {
    const id = sound[effect.kind];
    if (id) void gameAudio()?.effect(id);
    const target = this.point(effect.at);
    const from = this.point(effect.from);
    // Work underfoot has no direction of its own; take it from the player.
    if (target.x === from.x && target.y === from.y) {
      const [dx, dy] = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][effect.facing ?? 2];
      from.x -= dx * 10;
      from.y -= dy * 10;
    }
    if (effect.kind !== "dig") this.arc(from, target);
    if (effect.kind === "miss") return;
    if (effect.kind === "dig") this.burst(target, SOIL, 6, 1.1);
    if (effect.kind === "reap" || effect.kind === "cut")
      this.burst({ x: target.x, y: target.y - 4 }, LEAF, 7, 1.3);
    if (effect.kind === "hit" || effect.kind === "buck")
      this.burst(
        {
          x: (target.x + from.x) / 2,
          y: target.y - (effect.kind === "buck" ? 3 : 11),
        },
        CHIP,
        9,
        1.6,
      );
    if (effect.kind === "mine") {
      this.burst({ x: (target.x + from.x) / 2, y: target.y - 6 }, GRIT, 8, 1.5);
      this.shake(effect.at);
    }
    // A boulder coming apart: grit thrown wide and a puff of dust off the
    // ground, so the last blow does not look like the three before it.
    if (effect.kind === "shatter") {
      this.burst({ x: target.x, y: target.y - 6 }, GRIT, 14, 2.4);
      this.burst({ x: target.x, y: target.y }, SOIL, 5, 1.8);
    }
    if (effect.kind === "hit") this.shake(effect.at);
    if (effect.kind === "fell") this.fell(effect, target);
  }
  /** A quick crescent in the direction of the blow. */
  private arc(from: { x: number; y: number }, to: { x: number; y: number }) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const g = this.scene.add.graphics().setDepth(to.y * 16 + 5000);
    g.lineStyle(3, 0xfdfaec, 0.95);
    g.beginPath();
    g.arc(0, 0, 16, -0.95, 0.95);
    g.strokePath();
    g.lineStyle(2, 0xffffff, 0.75);
    g.beginPath();
    g.arc(0, 0, 11, -0.7, 0.7);
    g.strokePath();
    g.setPosition(
      from.x + (to.x - from.x) * 0.62,
      from.y + (to.y - from.y) * 0.62 - 11,
    );
    g.setScale(0.8);
    g.setRotation(angle);
    this.live.add(g);
    this.scene.tweens.add({
      targets: g,
      scaleX: 1.45,
      scaleY: 1.45,
      alpha: 0,
      duration: 240,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.live.delete(g);
        g.destroy();
      },
    });
  }
  /** Chips, leaves or clods thrown out of the cut. */
  private burst(
    at: { x: number; y: number },
    palette: number[],
    count: number,
    spread: number,
  ) {
    for (let i = 0; i < count; i++) {
      const size = i % 3 ? 2 : 3;
      const p = this.pixel(
        at.x + (Math.random() - 0.5) * 6,
        at.y - 2 - Math.random() * 4,
        size,
        palette[i % palette.length],
      );
      const dx = (Math.random() - 0.5) * 26 * spread;
      const rise = 8 + Math.random() * 12;
      this.scene.tweens.add({
        targets: p,
        x: p.x + dx,
        y: p.y - rise,
        duration: 160,
        ease: "Quad.easeOut",
        onComplete: () =>
          this.scene.tweens.add({
            targets: p,
            y: at.y + 1,
            alpha: 0,
            duration: 260,
            ease: "Quad.easeIn",
            onComplete: () => {
              this.live.delete(p);
              p.destroy();
            },
          }),
      });
    }
  }
  /** The blow rocks whatever is standing there. */
  private shake(cell: { x: number; y: number }) {
    const now = this.scene.time.now;
    for (const image of this.view.plantAt(cell.x, cell.y))
      this.shakes.push({
        image,
        until: now + 260,
        ox: image.x,
        wind: !!image.getData("wind"),
      });
  }
  /** The tree goes over as a copy of itself: the scenery behind it has
   * already been rebuilt into a felled cell. */
  private fell(effect: ToolEffect, target: { x: number; y: number }) {
    const frame = effect.sprite;
    if (!frame) return;
    const away = Math.sign(effect.at.x - effect.from.x) || 1;
    const image = this.scene.add
      .image(
        target.x,
        target.y,
        this.view.texture(frame),
        this.view.frame(frame),
      )
      .setOrigin(0.5, 1)
      .setTint(this.view.tint())
      .setDepth(target.y * 16 + 4500);
    this.live.add(image);
    this.scene.tweens.add({
      targets: image,
      rotation: (away * Math.PI) / 2.1,
      x: target.x + away * 6,
      duration: 620,
      ease: "Back.easeIn",
      onComplete: () => {
        void gameAudio()?.effect("timber");
        this.burst({ x: target.x + away * 14, y: target.y }, LEAF, 9, 2);
        this.burst({ x: target.x + away * 8, y: target.y }, SOIL, 5, 1.6);
        this.scene.tweens.add({
          targets: image,
          alpha: 0,
          duration: 180,
          delay: 90,
          onComplete: () => {
            this.live.delete(image);
            image.destroy();
          },
        });
      },
    });
  }
  private hide(cell: { x: number; y: number }, ms: number) {
    this.hidden.push({ x: cell.x, y: cell.y, until: this.scene.time.now + ms });
    for (const image of this.view.plantAt(cell.x, cell.y))
      image.setVisible(false);
  }
  /** Runs after the wind pass, which owns the same x on a swaying tree. */
  update(time: number) {
    if (this.hidden.length)
      this.hidden = this.hidden.filter((h) => {
        const done = time >= h.until;
        for (const image of this.view.plantAt(h.x, h.y)) image.setVisible(done);
        return !done;
      });
    if (!this.shakes.length) return;
    this.shakes = this.shakes.filter((s) => {
      if (!s.image.active) return false;
      if (time >= s.until) {
        if (!s.wind) s.image.setX(s.ox);
        s.image.setRotation(0);
        return false;
      }
      const left = (s.until - time) / 260;
      const offset = Math.sin(time / 22) * 2.2 * left;
      s.image.setX((s.wind ? s.image.x : s.ox) + offset);
      s.image.setRotation((offset / 60) * left);
      return true;
    });
  }
  dispose() {
    this.generation++;
    this.hidden = [];
    for (const object of this.live) object.destroy();
    this.live.clear();
    this.shakes = [];
  }
}
