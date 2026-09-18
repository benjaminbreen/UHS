import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import type { EffectId } from "../audio/synth";
import type { Hit, HitClass, ReactionKind, ToolClass } from "../core/reactions";

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
/** One swing: where it came from, and what each cell of the arc found. */
export type SwingEffect = {
  serial: number;
  from: { x: number; y: number };
  facing: number;
  tool: ToolClass;
  /** The held prop's sprite, for tinting the chips it throws. */
  sprite?: string;
  hits: Hit[];
};
/** A thrown prop in the air, and what it found where it came down. */
export type ThrowEffect = {
  serial: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  sprite?: string;
  hit: Hit;
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
/** What each surface throws off when it is struck. */
const DEBRIS: Record<HitClass, number[]> = {
  rock: GRIT,
  stone: GRIT,
  metal: [0xd8dce0, 0xa9b0b8, 0xf4f0d8],
  tree: [0x8a6a44, 0x6d5233, 0xa8854f],
  trunk: CHIP,
  timber: CHIP,
  brush: LEAF,
  grass: LEAF,
  crop: [0xd9c173, 0xb9a253, 0xefe0a4],
  fiber: [0xc8ab74, 0xa78d5c, 0xe0cb9c],
  pottery: [0xc9b096, 0xa8876a, 0xe8d8c0],
  water: [0x8fc3d9, 0xbfe2ef, 0x5f97b4],
  marsh: [0x7d9468, 0x5d7350, 0xa8b98c],
  sand: [0xd9c79a, 0xc0ab7c, 0xefe2bd],
  soil: SOIL,
  snow: [0xf2f6fb, 0xd6e0ea, 0xffffff],
  fire: [0xffb648, 0xff7a2f, 0xffe08a],
  creature: [0xe6d5c0, 0xc9b199],
  air: [0xffffff],
};
const REACTION_SOUND: Record<ReactionKind, EffectId | undefined> = {
  shatter: "shatter",
  crack: "shatter",
  topple: "thud",
  thwock: "thwock",
  thud: "thud",
  knock: "thud",
  swish: "swish",
  splash: "splash",
  scuff: "dig",
  ember: "thud",
  flinch: "thud",
  whoosh: "whoosh",
};
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
  private playedSwing = 0;
  private playedThrow = 0;
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
  /** A swing: the arc, and whatever each cell of the cone had to say about
   * it. Timed to the contact frame, like a tool blow. */
  consumeSwing(effect: SwingEffect | undefined) {
    if (!effect || effect.serial === this.playedSwing) return;
    this.playedSwing = effect.serial;
    const generation = this.generation;
    this.scene.time.delayedCall(140, () => {
      if (generation === this.generation) this.playSwing(effect);
    });
  }
  private playSwing(effect: SwingEffect) {
    const from = this.point(effect.from);
    const [facing, ...corners] = effect.hits;
    if (facing) this.arc(from, this.point(facing.at));
    // One sound per swing: the heaviest thing the arc found, so three cells
    // never play a chord.
    const loudest =
      effect.hits.find((h) => h.damaged) ??
      effect.hits.find((h) => h.solid) ??
      facing;
    const id = loudest && REACTION_SOUND[loudest.kind];
    if (id) void gameAudio()?.effect(id);
    if (facing) this.react(facing, 1);
    // The corners rattle rather than break: half the debris, no sound.
    for (const hit of corners) if (hit.solid || hit.kind === "swish") this.react(hit, 0.45);
    if (loudest?.kind === "shatter" || loudest?.kind === "topple")
      this.scene.cameras.main.shake(110, 0.0022);
    else if (loudest?.damaged) this.scene.cameras.main.shake(70, 0.0011);
  }
  /** A thrown thing crossing the ground, then landing. */
  consumeThrow(effect: ThrowEffect | undefined) {
    if (!effect || effect.serial === this.playedThrow) return;
    this.playedThrow = effect.serial;
    const from = this.point(effect.from),
      to = this.point(effect.to);
    const span = Math.max(
      Math.abs(effect.to.x - effect.from.x),
      Math.abs(effect.to.y - effect.from.y),
    );
    const flight = 90 + span * 55;
    const land = () => {
      const id = REACTION_SOUND[effect.hit.kind];
      if (id) void gameAudio()?.effect(id);
      this.react(effect.hit, 1.2);
      if (effect.hit.damaged) this.scene.cameras.main.shake(110, 0.0022);
    };
    const frame = effect.sprite;
    if (!frame || !span) {
      this.scene.time.delayedCall(flight, land);
      return;
    }
    const image = this.scene.add
      .image(from.x, from.y - 10, this.view.texture(frame), this.view.frame(frame))
      .setOrigin(0.5, 1)
      .setTint(this.view.tint())
      .setDepth(to.y * 16 + 4600);
    this.live.add(image);
    const generation = this.generation;
    this.scene.tweens.add({
      targets: image,
      x: to.x,
      // The rise and fall is the tween's own curve; the sprite spins as it goes.
      y: { value: to.y, ease: "Quad.easeIn" },
      rotation: Math.sign(to.x - from.x || 1) * 3.4,
      duration: flight,
      ease: "Linear",
      onComplete: () => {
        this.live.delete(image);
        image.destroy();
        if (generation === this.generation) land();
      },
    });
  }
  /** One cell's answer to a blow. */
  private react(hit: Hit, weight: number) {
    const at = this.point(hit.at);
    const palette = DEBRIS[hit.hit] ?? SOIL;
    const count = Math.max(2, Math.round((hit.solid ? 8 : 5) * weight));
    if (hit.kind === "splash") {
      this.ring(at, palette[0]);
      this.burst(at, palette, count, 1.1);
    } else if (hit.kind === "scuff") {
      this.burst({ x: at.x, y: at.y }, palette, count, 0.9);
    } else if (hit.kind === "swish") {
      this.burst({ x: at.x, y: at.y - 5 }, palette, count, 1.3);
    } else if (hit.hit === "tree" || hit.hit === "trunk") {
      // Dust off the bark at the strike point, and leaves shaken loose above.
      this.burst({ x: at.x, y: at.y - 9 }, palette, count, 1.2);
      if (hit.hit === "tree") this.burst({ x: at.x, y: at.y - 22 }, LEAF, 3, 1.6);
    } else if (hit.kind === "shatter") {
      this.burst({ x: at.x, y: at.y - 6 }, palette, count + 5, 2.3);
    } else {
      this.burst({ x: at.x, y: at.y - 7 }, palette, count, 1.5);
    }
    if (hit.solid) this.shake(hit.at);
  }
  /** An expanding ring, for a blow that lands on water. */
  private ring(at: { x: number; y: number }, color: number) {
    const g = this.scene.add.graphics().setDepth(at.y * 16 + 4200);
    g.lineStyle(1, color, 0.9);
    g.strokeEllipse(0, 0, 10, 5);
    g.setPosition(at.x, at.y - 1);
    this.live.add(g);
    this.scene.tweens.add({
      targets: g,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 380,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.live.delete(g);
        g.destroy();
      },
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
