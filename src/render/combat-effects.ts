import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import { strike } from "../audio/sfx";
import type { Signal, CreatureHit } from "../core/combat";
import { flightMs, type SwingEffect, type ThrowEffect } from "./tool-effects";

/** The contact frame of the swing pose, as in `ToolEffects`. */
const CONTACT_MS = 140;
const HIT_STOP_MS = 70;
const BLOOD = [0x9c2f2a, 0x7a1f1f, 0xc24a3a];
const DUST = [0xe6d5c0, 0xc9b199, 0xffffff];
const FEATHER = [0xffffff, 0xe8e2d4, 0xcfc8b8];
const STARS = [0xffe06a, 0xfff4b8, 0xffffff];
const DROP: Record<string, number> = {
  meat: 0xc24a3a,
  hide: 0x8a5a36,
  feathers: 0xf4f0e6,
  wool: 0xe8e0cc,
};
// 3x5 digits, one bit per pixel, rows top to bottom.
export const DIGITS = [
  0b111101101101111, 0b010110010010111, 0b111001111100111, 0b111001111001111,
  0b101101111001001, 0b111100111001111, 0b111100111101111, 0b111001001001001,
  0b111101111101111, 0b111101111001111,
];

/** Two tints multiplied, channel by channel. */
export function mixTint(a: number, b: number) {
  const ch = (shift: number) =>
    Math.round((((a >> shift) & 255) * ((b >> shift) & 255)) / 255) << shift;
  return ch(16) | ch(8) | ch(0);
}
export const faunaSpriteId = (group: string, n: number) => `${group}-${n}`;

type Sprite = Phaser.GameObjects.Image;
/** An animal about to come: the mark over it, and where it stood so the
 * shake can be undone. */
type Tell = { mark: Phaser.GameObjects.Graphics; x: number; until: number };
type Bar = {
  g: Phaser.GameObjects.Graphics;
  id: string;
  ratio: number;
  until: number;
};

/** What a blow does to an animal on screen: the freeze, the flash, the hop
 * backwards, the number, and the body going over. The engine has already
 * settled the outcome; this only plays it, on the swing's contact frame. */
export class CombatEffects {
  private played = 0;
  /** Set once the contact frame has run. Until then the scene leaves the
   * struck sprites where they stood. */
  private landed = 0;
  private orphans = new Map<string, { image: Sprite; shade?: Sprite }>();
  private bars = new Map<string, Bar>();
  private tells = new Map<string, Tell>();
  private seen = 0;
  private live = new Set<Phaser.GameObjects.GameObject>();
  constructor(
    private scene: Phaser.Scene,
    private view: {
      tint: () => number;
      lift: (x: number, y: number) => number;
      entityAt: (id: string) => Sprite | undefined;
      shadowOf: (id: string) => Sprite | undefined;
      /** The player has been hit: the scene plays the flinch. */
      hurt: () => void;
    },
  ) {}
  /** Animals whose sprites this class is about to move: the scene must not
   * slide them to their new cell, or sweep up the dead, before the blow lands. */
  pending(swing: SwingEffect | undefined, thrown?: ThrowEffect) {
    const out = new Map<string, CreatureHit>();
    if (swing?.creatures && swing.serial !== this.landed)
      for (const c of swing.creatures) out.set(faunaSpriteId(c.group, c.n), c);
    const c = thrown?.creature;
    if (c && thrown.serial !== this.landedThrow)
      out.set(faunaSpriteId(c.group, c.n), c);
    return out;
  }
  private playedThrow = 0;
  private landedThrow = 0;
  /** A thrown thing that found an animal: the blow lands when it does. */
  consumeThrow(effect: ThrowEffect | undefined) {
    if (!effect?.creature || effect.serial === this.playedThrow) return;
    this.playedThrow = effect.serial;
    const span = Math.max(
      Math.abs(effect.to.x - effect.from.x),
      Math.abs(effect.to.y - effect.from.y),
    );
    this.scene.time.delayedCall(flightMs(span, effect.straight), () => {
      this.landedThrow = effect.serial;
      this.land(effect.creature!, effect.to.x < effect.from.x ? 3 : 1);
      this.hitStop(effect.creature!.killed);
    });
  }
  private hitStop(hard: boolean) {
    this.scene.cameras.main.shake(hard ? 140 : 90, hard ? 0.004 : 0.002);
    void gameAudio()?.sound(
      strike("blunt", "creature", "flinch", hard),
      "hurt",
    );
    // Everything holds for a beat, then flies.
    this.scene.tweens.timeScale = 0;
    this.scene.time.delayedCall(HIT_STOP_MS, () => {
      this.scene.tweens.timeScale = 1;
    });
  }
  /** The wide swing itself: a half ring in front, or a whole one. */
  private sweep(effect: SwingEffect) {
    const player = this.view.entityAt("player");
    if (!player) return;
    const g = this.scene.add
      .graphics()
      .setPosition(player.x, player.y - 5)
      .setDepth(player.y + 4300);
    this.live.add(g);
    // Screen angles: 0 east, a quarter turn south.
    const facing = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][effect.facing] ?? 0;
    const half = effect.power === 2 ? Math.PI : Math.PI * 0.6;
    const ring = { r: 10, a: 1 };
    this.scene.tweens.add({
      targets: ring,
      r: 30,
      a: 0,
      duration: effect.power === 2 ? 300 : 230,
      ease: "Quad.easeOut",
      onUpdate: () => {
        g.clear();
        for (const [width, color, alpha] of [
          [5, 0xfff4c8, 0.35],
          [2, 0xffffff, 0.95],
        ]) {
          g.lineStyle(width, color, alpha * ring.a);
          g.beginPath();
          g.arc(0, 0, ring.r, facing - half, facing + half);
          g.strokePath();
        }
        g.setScale(1, 0.62);
      },
      onComplete: () => {
        this.live.delete(g);
        g.destroy();
      },
    });
    void gameAudio()?.sound(strike("blunt", "air", "whoosh"), "air");
  }
  private aimMark?: Phaser.GameObjects.Graphics;
  /** Where the throw will come down: dots along the way, a ring at the end
   * that turns red over an animal. */
  aiming(path: readonly { x: number; y: number }[] | undefined, time: number) {
    if (!path?.length) {
      this.aimMark?.destroy();
      this.aimMark = undefined;
      return;
    }
    const g = (this.aimMark ??= this.scene.add.graphics()).clear();
    const end = this.cell(path.at(-1)!);
    g.setDepth(end.y + 4200);
    for (const c of path.slice(0, -1)) {
      const at = this.cell(c);
      g.fillStyle(0xffffff, 0.55).fillRect(at.x - 1, at.y - 9, 2, 2);
    }
    const pulse = 1 + Math.sin(time / 90) * 0.12;
    g.lineStyle(2, 0x1a1410, 0.7).strokeEllipse(
      end.x,
      end.y - 7,
      15 * pulse,
      8 * pulse,
    );
    g.lineStyle(1, 0xffd34d, 1).strokeEllipse(
      end.x,
      end.y - 7,
      15 * pulse,
      8 * pulse,
    );
  }
  private dazeMark?: Phaser.GameObjects.Graphics;
  /** Three stars going round the head of anything knocked silly. */
  dazed(ids: ReadonlySet<string>, time: number) {
    if (!ids.size) {
      this.dazeMark?.destroy();
      this.dazeMark = undefined;
      return;
    }
    const g = (this.dazeMark ??= this.scene.add.graphics()).clear();
    for (const id of ids) {
      const image = this.view.entityAt(id);
      if (!image) continue;
      g.setDepth(image.y + 4520);
      const top = image.y - image.displayHeight - 2;
      for (let k = 0; k < 3; k++) {
        const angle = time / 160 + (k * Math.PI * 2) / 3;
        g.fillStyle(Math.sin(angle) > 0 ? 0xffe06a : 0xc9a63c, 1).fillRect(
          Math.round(image.x + Math.cos(angle) * 6) - 1,
          Math.round(top + Math.sin(angle) * 2) - 1,
          2,
          2,
        );
      }
    }
  }
  private chargeRing?: Phaser.GameObjects.Graphics;
  private chargeStage = 0;
  /** The wind-up under the player's feet: it fills, and flashes at each stage. */
  charging(charge: { at: number; half: number; full: number } | undefined) {
    const player = this.view.entityAt("player");
    if (!charge || !player) {
      this.chargeRing?.destroy();
      this.chargeRing = undefined;
      this.chargeStage = 0;
      return;
    }
    const held = performance.now() - charge.at;
    // A tap should not flicker a ring on.
    if (held < 160) return;
    const stage = held >= charge.full ? 2 : held >= charge.half ? 1 : 0;
    if (stage > this.chargeStage) {
      this.chargeStage = stage;
      this.burst(player.x, player.y - 2, STARS, stage * 5);
      void gameAudio()?.event("select");
    }
    const t = Math.min(1, held / charge.full);
    const g = (this.chargeRing ??= this.scene.add.graphics());
    const pulse = stage === 2 ? 1 + Math.sin(held / 45) * 0.12 : 1;
    g.clear()
      .setPosition(player.x, player.y - 1)
      .setScale(pulse, 0.5 * pulse)
      .setDepth(player.depth - 1)
      .lineStyle(2, [0xffffff, 0xffd34d, 0xff8a3c][stage], 0.9)
      .beginPath()
      .arc(0, 0, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t)
      .strokePath();
  }
  /** Takes over a dead animal's sprite, which the scene would otherwise destroy. */
  adopt(id: string, image: Sprite, shade?: Sprite) {
    this.orphans.set(id, { image, shade });
  }
  consume(effect: SwingEffect | undefined) {
    if (!effect || effect.serial === this.played) return;
    this.played = effect.serial;
    if (!effect.creatures?.length && !effect.power) return;
    this.scene.time.delayedCall(CONTACT_MS, () => {
      this.landed = effect.serial;
      if (effect.power && !effect.thrust) this.sweep(effect);
      if (!effect.creatures?.length) return;
      for (const c of effect.creatures) this.land(c, effect.facing);
      this.hitStop(effect.creatures.some((c) => c.killed || c.crit));
    });
  }
  /** What the animals did on their own account: the tell before a charge,
   * the run, the wall, and the player going over. */
  consumeEvents(events: readonly Signal[]) {
    // A new map is a new engine, and its count starts again.
    if ((events.at(-1)?.serial ?? this.seen) < this.seen) this.seen = 0;
    for (const e of events) {
      if (e.serial <= this.seen) continue;
      this.seen = e.serial;
      // How people took things is `CueEffects`' business.
      if (e.kind === "cue" || e.kind === "bump") continue;
      const id = faunaSpriteId(e.group, e.n);
      const image = this.view.entityAt(id);
      if (e.kind === "windup") this.tell(id, e.seconds);
      else if (e.kind === "charge" || e.kind === "lunge") {
        this.endTell(id);
        if (image) this.burst(image.x, image.y - 2, DUST, 8);
        void gameAudio()?.sound(strike("blunt", "air", "whoosh"), "air");
      } else if (e.kind === "slam") {
        this.endTell(id);
        const at = this.cell(e.at);
        this.burst(at.x, at.y - 8, STARS, 10);
        this.scene.cameras.main.shake(160, 0.005);
        void gameAudio()?.sound(strike("blunt", "soil", "thud", true), "slam");
      } else if (e.kind === "dodged")
        void gameAudio()?.sound(strike("haft", "air", "whoosh"), "air");
      else if (e.kind === "mauled") this.mauled(e.damage);
    }
  }
  private mauled(damage: number) {
    this.view.hurt();
    const player = this.view.entityAt("player");
    this.scene.cameras.main.shake(200, 0.007);
    this.scene.cameras.main.flash(90, 150, 20, 10);
    void gameAudio()?.event("hurt");
    if (!player) return;
    this.burst(player.x, player.y - 10, BLOOD, 6);
    this.number(player.x, player.y - 30, String(damage), 0xff6a55, 2);
    this.scene.tweens.timeScale = 0;
    this.scene.time.delayedCall(HIT_STOP_MS, () => {
      this.scene.tweens.timeScale = 1;
    });
  }
  private tell(id: string, seconds: number) {
    const image = this.view.entityAt(id);
    if (!image || this.tells.has(id)) return;
    // Game seconds run at about twenty to the real one; the run cancels the
    // mark itself, so this only has to outlast it.
    const mark = this.scene.add.graphics();
    this.tells.set(id, {
      mark,
      x: image.x,
      until: this.scene.time.now + seconds * 80 + 600,
    });
  }
  private endTell(id: string) {
    const t = this.tells.get(id);
    if (!t) return;
    t.mark.destroy();
    this.tells.delete(id);
    const image = this.view.entityAt(id);
    if (image) image.x = t.x;
  }
  private cell(p: { x: number; y: number }) {
    const x = p.x * 16 + 8,
      y = p.y * 16 + 16;
    return { x, y: y - this.view.lift(x, y) };
  }
  private land(c: CreatureHit, facing: number) {
    const id = faunaSpriteId(c.group, c.n);
    // Or the wind-up shake drags it back to where it stood.
    this.endTell(id);
    const orphan = this.orphans.get(id);
    this.orphans.delete(id);
    const image = orphan?.image ?? this.view.entityAt(id);
    const shade = orphan?.shade ?? this.view.shadowOf(id);
    const to = this.cell(c.to);
    // The number rises from where the blow landed, not where the animal ends up.
    const struck = image ?? this.cell(c.from);
    this.number(
      struck.x,
      struck.y - (image?.displayHeight ?? 12) - 2,
      String(c.damage),
      c.crit ? 0xffd34d : c.killed ? 0xff6a55 : 0xffffff,
      c.crit ? 2 : 1,
    );
    if (!image) return;
    this.scene.tweens.killTweensOf(image);
    if (shade) this.scene.tweens.killTweensOf(shade);
    image.setTintFill(0xffffff);
    this.scene.time.delayedCall(HIT_STOP_MS + 40, () => {
      if (image.active) image.clearTint().setTint(this.view.tint());
    });
    const sx = image.scaleX,
      sy = image.scaleY;
    this.scene.tweens.add({
      targets: image,
      scaleX: sx * 1.25,
      scaleY: sy * 0.75,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    const cells = Math.max(
      Math.abs(c.to.x - c.from.x),
      Math.abs(c.to.y - c.from.y),
    );
    const flight = 90 + cells * 60;
    const from = { x: image.x, y: image.y };
    const gore = c.feathered ? FEATHER : BLOOD;
    this.burst(
      from.x,
      from.y - 6,
      c.killed || c.feathered ? gore : DUST,
      c.killed ? 12 : 6,
      c.feathered,
    );
    // The hop: x and y travel straight, the arc rides on top of y.
    const hop = { t: 0 };
    this.scene.tweens.add({
      targets: hop,
      t: 1,
      duration: flight,
      ease: "Quad.easeOut",
      onUpdate: () => {
        if (!image.active) return;
        const rise = Math.sin(Math.PI * hop.t) * (4 + cells * 3);
        image.setPosition(
          from.x + (to.x - from.x) * hop.t,
          from.y + (to.y - from.y) * hop.t - rise,
        );
        shade?.setPosition(
          from.x + (to.x - from.x) * hop.t,
          from.y + (to.y - from.y) * hop.t,
        );
      },
      onComplete: () => {
        if (c.slammed && cells) {
          this.burst(to.x, to.y - 6, DUST, 5);
          this.scene.cameras.main.shake(80, 0.003);
        }
        if (c.killed) {
          this.die(image, shade, to, facing, c.feathered);
          this.spill(to, c.drops);
        }
      },
    });
    if (!c.killed) this.bar(id, c.hp / c.maxHp);
    else this.dropBar(id);
  }
  /** Over on its side, a pop of red, and a stain that fades. */
  private die(
    image: Sprite,
    shade: Sprite | undefined,
    at: { x: number; y: number },
    facing: number,
    feathered: boolean,
  ) {
    this.live.add(image);
    shade?.destroy();
    this.burst(at.x, at.y - 5, feathered ? FEATHER : BLOOD, 14, feathered);
    const stain = this.scene.add
      .ellipse(
        at.x,
        at.y - 1,
        12,
        5,
        feathered ? FEATHER[2] : BLOOD[1],
        feathered ? 0.55 : 0.75,
      )
      .setDepth(at.y - 1);
    this.live.add(stain);
    this.scene.tweens.add({
      targets: stain,
      alpha: 0,
      delay: 6000,
      duration: 4000,
      onComplete: () => {
        this.live.delete(stain);
        stain.destroy();
      },
    });
    this.scene.tweens.add({
      targets: image,
      rotation: (facing === 3 ? -1 : 1) * (Math.PI / 2),
      duration: 140,
      ease: "Quad.easeIn",
      onComplete: () =>
        this.scene.tweens.add({
          targets: image,
          alpha: 0,
          scaleX: image.scaleX * 1.4,
          scaleY: image.scaleY * 1.4,
          delay: 500,
          duration: 260,
          onComplete: () => {
            this.live.delete(image);
            image.destroy();
          },
        }),
    });
  }
  /** What the body gave up: out in a scatter, a beat on the ground, then into
   * the player's hands. The inventory already has it; this is the show. */
  private spill(at: { x: number; y: number }, drops: CreatureHit["drops"]) {
    const pieces = drops.flatMap((d) =>
      Array.from({ length: Math.min(3, d.count) }, () => d.item),
    );
    pieces.slice(0, 8).forEach((item, i) => {
      const chunk = this.scene.add
        .rectangle(at.x, at.y - 6, 4, 4, DROP[item] ?? 0xd8c890)
        .setStrokeStyle(1, 0x1a1410)
        .setDepth(at.y + 4100);
      this.live.add(chunk);
      const angle = (i / pieces.length) * Math.PI * 2 + Math.random();
      const rest = {
        x: at.x + Math.cos(angle) * (10 + Math.random() * 8),
        y: at.y - 2 + Math.sin(angle) * 6,
      };
      this.scene.tweens.add({
        targets: chunk,
        x: rest.x,
        duration: 420,
        ease: "Quad.easeOut",
      });
      this.scene.tweens.add({
        targets: chunk,
        y: rest.y,
        duration: 420,
        ease: "Bounce.easeOut",
        onComplete: () => this.gather(chunk, 260 + i * 60),
      });
    });
  }
  /** Homes on the player wherever they have got to by then. */
  private gather(chunk: Phaser.GameObjects.Rectangle, delay: number) {
    const from = { x: chunk.x, y: chunk.y };
    const pull = { t: 0 };
    this.scene.tweens.add({
      targets: pull,
      t: 1,
      delay,
      duration: 260,
      ease: "Quad.easeIn",
      onUpdate: () => {
        const player = this.view.entityAt("player");
        if (!player) return;
        chunk.setPosition(
          from.x + (player.x - from.x) * pull.t,
          from.y + (player.y - 12 - from.y) * pull.t,
        );
      },
      onComplete: () => {
        this.live.delete(chunk);
        chunk.destroy();
        void gameAudio()?.event("pickup");
      },
    });
  }
  private burst(
    x: number,
    y: number,
    palette: number[],
    count: number,
    /** Feathers hang in the air where blood and dust drop. */
    floaty = false,
  ) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add
        .rectangle(
          x + (Math.random() - 0.5) * 6,
          y - Math.random() * 4,
          i % 3 ? 2 : 3,
          i % 3 ? 2 : 3,
          palette[i % palette.length],
        )
        .setDepth(y + 4000);
      this.live.add(p);
      const dx = (Math.random() - 0.5) * 36;
      this.scene.tweens.add({
        targets: p,
        x: p.x + dx,
        y: p.y - 8 - Math.random() * 12,
        duration: 170,
        ease: "Quad.easeOut",
        onComplete: () =>
          this.scene.tweens.add({
            targets: p,
            x: p.x + (floaty ? (Math.random() - 0.5) * 14 : 0),
            y: y + 7,
            alpha: 0,
            duration: floaty ? 900 : 280,
            ease: floaty ? "Sine.easeInOut" : "Quad.easeIn",
            onComplete: () => {
              this.live.delete(p);
              p.destroy();
            },
          }),
      });
    }
  }
  /** Running into something that will not give: stars, a thud, a jolt. */
  bonk(x: number, y: number) {
    this.burst(x, y, STARS, 8);
    this.scene.cameras.main.shake(140, 0.0045);
    void gameAudio()?.sound(strike("blunt", "stone", "thud", true), "slam");
    // Three stars circling the head for a moment.
    for (let i = 0; i < 3; i++) {
      const star = this.scene.add
        .rectangle(x, y, 2, 2, STARS[i % STARS.length])
        .setDepth(y + 4800);
      this.live.add(star);
      const spin = { a: (i / 3) * Math.PI * 2 };
      this.scene.tweens.add({
        targets: spin,
        a: spin.a + Math.PI * 3,
        duration: 600,
        onUpdate: () => {
          const player = this.view.entityAt("player");
          const cx = player?.x ?? x,
            cy = (player?.y ?? y + 18) - 26;
          star.setPosition(
            cx + Math.cos(spin.a) * 7,
            cy + Math.sin(spin.a) * 2.5,
          );
        },
      });
      this.scene.tweens.add({
        targets: star,
        alpha: 0,
        delay: 420,
        duration: 180,
        onComplete: () => {
          this.live.delete(star);
          star.destroy();
        },
      });
    }
  }
  /** The damage, in pixel digits that pop up and drift off. */
  private number(
    x: number,
    y: number,
    text: string,
    color: number,
    px: number,
  ) {
    const g = this.scene.add.graphics().setDepth(y + 4600);
    const width = (text.length * 4 - 1) * px;
    const draw = (color: number, ox: number, oy: number) => {
      g.fillStyle(color, 1);
      [...text].forEach((ch, i) => {
        const bits = DIGITS[Number(ch)];
        for (let b = 0; b < 15; b++)
          if (bits & (1 << (14 - b)))
            g.fillRect(
              (i * 4 + (b % 3)) * px + ox - width / 2,
              Math.floor(b / 3) * px + oy,
              px,
              px,
            );
      });
    };
    for (const [ox, oy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ])
      draw(0x1a1410, ox, oy);
    draw(color, 0, 0);
    g.setPosition(Math.round(x), Math.round(y));
    this.live.add(g);
    this.scene.tweens.add({
      targets: g,
      y: y - 14,
      duration: 260,
      ease: "Back.easeOut",
      onComplete: () =>
        this.scene.tweens.add({
          targets: g,
          y: y - 20,
          alpha: 0,
          delay: 260,
          duration: 260,
          onComplete: () => {
            this.live.delete(g);
            g.destroy();
          },
        }),
    });
  }
  private bar(id: string, ratio: number) {
    const old = this.bars.get(id);
    const g = old?.g ?? this.scene.add.graphics();
    this.bars.set(id, { g, id, ratio, until: this.scene.time.now + 2600 });
  }
  private dropBar(id: string) {
    this.bars.get(id)?.g.destroy();
    this.bars.delete(id);
  }
  /** Health bars ride above the animals they belong to. */
  update(time: number) {
    for (const [id, t] of this.tells) {
      const image = this.view.entityAt(id);
      if (!image || time > t.until) {
        this.endTell(id);
        continue;
      }
      // Trembling on the spot, with a red mark that beats faster as it nears.
      image.x = t.x + (Math.floor(time / 45) % 2 ? 1 : -1);
      const beat = Math.floor(time / 120) % 2;
      const x = Math.round(t.x),
        // Clear of the health bar, which sits just above the back.
        y = Math.round(image.y - image.displayHeight) - 16 - beat;
      t.mark
        .clear()
        .setDepth(image.y + 4550)
        .fillStyle(0x1a1410, 1)
        .fillRect(x - 2, y - 1, 4, 9)
        .fillStyle(beat ? 0xff5a3c : 0xffd34d, 1)
        .fillRect(x - 1, y, 2, 4)
        .fillRect(x - 1, y + 5, 2, 2);
      if (Math.floor(time / 16) % 14 === 0)
        this.burst(t.x, image.y - 1, DUST, 2);
    }
    for (const bar of this.bars.values()) {
      const image = this.view.entityAt(bar.id);
      if (!image || time > bar.until) {
        this.dropBar(bar.id);
        continue;
      }
      const x = Math.round(image.x) - 6,
        y = Math.round(image.y - image.displayHeight) - 4;
      bar.g
        .clear()
        .setDepth(image.y + 4500)
        .fillStyle(0x1a1410, 1)
        .fillRect(x - 1, y - 1, 14, 4)
        .fillStyle(
          bar.ratio > 0.5 ? 0x8fd05a : bar.ratio > 0.25 ? 0xe8b84a : 0xd9523f,
          1,
        )
        .fillRect(x, y, Math.max(1, Math.round(12 * bar.ratio)), 2);
    }
  }
  dispose() {
    this.scene.tweens.timeScale = 1;
    for (const o of this.orphans.values()) {
      o.image.destroy();
      o.shade?.destroy();
    }
    this.orphans.clear();
    for (const bar of this.bars.values()) bar.g.destroy();
    this.bars.clear();
    for (const t of this.tells.values()) t.mark.destroy();
    this.tells.clear();
    this.chargeRing?.destroy();
    this.chargeRing = undefined;
    this.aimMark?.destroy();
    this.aimMark = undefined;
    this.dazeMark?.destroy();
    this.dazeMark = undefined;
    for (const o of this.live) o.destroy();
    this.live.clear();
  }
}
