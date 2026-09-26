import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import { projectileImpact, projectileRelease, scrape, strike, work } from "../audio/sfx";
import type { Hit, HitClass, ToolClass } from "../core/reactions";
import type { CreatureHit } from "../core/combat";
import type { Point } from "../core/types";
import { spritePalette } from "./sprite-palette";
import { LootEffects } from "./loot-effects";

/** The freeze on a blow that lands on scenery. */
const HIT_STOP_MS = 55;
const FLASH_MS = 70;

export type ToolEffectKind =
  | "hit"
  | "fell"
  | "cut"
  | "buck"
  | "dig"
  | "reap"
  | "mine"
  | "shatter"
  | "douse"
  | "fill"
  /** A swing that found nothing: the arc, and nothing else. */
  | "miss";
export type ToolEffect = {
  serial: number;
  kind: ToolEffectKind;
  /** The worked cell, and the cell the player swung from. */
  at: { x: number; y: number };
  cells?: Point[];
  contactMs?: number;
  from: { x: number; y: number };
  /** The plant as it stood, before the blow landed. */
  sprite?: string;
  /** Which way the player is facing, for work done on their own cell. */
  facing?: number;
  /** The rock carries a metal vein: iron on stone throws sparks. */
  ore?: boolean;
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
  /** Animals the arc caught. Played by `CombatEffects`, on the same beat. */
  creatures?: CreatureHit[];
  /** 1 a half circle, 2 all the way round. */
  power?: number;
  /** A spear: straight in, not round. */
  thrust?: boolean;
  knife?: boolean;
  contactMs?: number;
};
/** A thrown prop in the air, and what it found where it came down. */
export type ThrowEffect = {
  serial: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  sprite?: string;
  hit: Hit;
  creature?: CreatureHit;
  bounce?: { x: number; y: number };
  straight?: boolean;
  arrow?: boolean;
  sling?: boolean;
  /** The thrown object, hidden from the scene until it lands. */
  id?: string;
  /** An item from the hand rather than a prop. */
  small?: boolean;
  launchMs?: number;
};
/** A pile shifting one cell, or refusing to. */
export type ShoveEffect = {
  serial: number;
  /** The cell the leading object left, and the one it entered. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** The surface being scraped over, for the colour of the dust. */
  ground: HitClass;
  ids: string[];
  /** Cells a rolling stone ran through, so the dust follows it. */
  path?: { x: number; y: number }[];
  /** What it found where it stopped: the splash, the crack, the person. */
  hit?: Hit;
  refused?: "wheels" | "heavy" | "wall";
};
/** Milliseconds in the air. A spear goes flat and fast. */
export const flightMs = (span: number, straight?: boolean) =>
  straight ? 70 + span * 32 : 110 + span * 55;
/** How long a rolling stone spends on each cell it crosses. */
export const ROLL_MS = 110;
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
const SPARK = [0xfffad2, 0xffd060, 0xffa030];
const WATER = [0x5e8ec8, 0x8ab8e0, 0xc8e0f0];
const STEAM = [0xe8ecef, 0xd0d6da, 0xf6f8fa];
const METAL = [0xc4c4cc, 0x9a5634, 0xc87a44];
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
export function projectileArrowTexture(scene: Phaser.Scene) {
  if (!scene.textures.exists("projectile-arrow")) {
    const ink = scene.make.graphics({ x: 0, y: 0 });
    ink.fillStyle(0x392d22).fillRect(1, 2, 10, 2);
    ink.fillStyle(0xb9955c).fillRect(2, 2, 9, 1);
    ink.fillStyle(0xded9bd).fillRect(10, 1, 3, 3);
    ink.fillStyle(0xeee9d4).fillRect(12, 2, 2, 1);
    ink.fillStyle(0xb9a4a0).fillRect(0, 0, 2, 2).fillRect(0, 3, 2, 2);
    ink.generateTexture("projectile-arrow", 14, 5);
    ink.destroy();
  }
  return "projectile-arrow";
}
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
  private playedShove = 0;
  /** Bumped when the world changes, so a swing scheduled against the old one
   * does not land in the new. */
  private generation = 0;
  private loot?: LootEffects;
  constructor(
    private scene: Phaser.Scene,
    private view: {
      tint: () => number;
      lift: (x: number, y: number) => number;
      /** The images standing on a cell, so a blow can rock them. */
      plantAt: (x: number, y: number) => Phaser.GameObjects.Image[];
      /** A world object's sprite, so a shove can rock what will not move. */
      entityAt: (id: string) => Phaser.GameObjects.Image | undefined;
      texture: (frame: string) => string;
      frame: (frame: string) => string | number;
      /** The scene draws the thrown object once it has landed. */
      redraw: () => void;
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
    if (effect.kind === "fell") this.hide(effect.at, (effect.contactMs ?? 150) + 640);
    const generation = this.generation;
    this.scene.time.delayedCall(effect.contactMs ?? 150, () => {
      if (generation === this.generation) this.play(effect);
    });
  }
  /** A swing: the arc, and whatever each cell of the cone had to say about
   * it. Timed to the contact frame, like a tool blow. */
  consumeSwing(effect: SwingEffect | undefined) {
    if (!effect || effect.serial === this.playedSwing) return;
    this.playedSwing = effect.serial;
    const generation = this.generation;
    this.scene.time.delayedCall(effect.contactMs ?? 140, () => {
      if (generation === this.generation) this.playSwing(effect);
    });
  }
  private playSwing(effect: SwingEffect) {
    const from = this.point(effect.from);
    const [facing, ...corners] = effect.hits;
    // A wound-up swing draws its own ring; see CombatEffects.
    if (facing && !effect.power) {
      if (effect.knife) this.slice(from, this.point(facing.at));
      else if (effect.thrust)
        this.thrust(from, this.point((effect.hits.find((hit) => hit.solid) ?? effect.hits.at(-1)!).at));
      else this.arc(from, this.point(facing.at));
    }
    // One sound per swing: the heaviest thing the arc found, so three cells
    // never play a chord.
    const loudest =
      effect.hits.find((h) => h.damaged) ??
      effect.hits.find((h) => h.solid) ??
      facing;
    if (loudest)
      void gameAudio()?.sound(
        strike(effect.tool, loudest.hit, loudest.kind, loudest.damaged),
        "strike",
      );
    const landed = effect.hits.filter(
      (h) => h.hit !== "creature" && (h.damaged || h.solid),
    );
    for (const h of landed) this.flash(h);
    const rest = () => {
      if (facing) this.react(facing, 1);
      // The corners rattle rather than break: half the debris, no sound.
      for (const hit of corners)
        if (hit.solid || hit.kind === "swish") this.react(hit, 0.45);
      for (const h of effect.hits)
        if (h.loot?.length) this.spill(this.point(h.at), h.loot);
      if (loudest?.kind === "shatter" || loudest?.kind === "topple")
        this.scene.cameras.main.shake(110, 0.0022);
      else if (loudest?.damaged) this.scene.cameras.main.shake(70, 0.0011);
    };
    if (!landed.length) return rest();
    // Hitstop: everything tweened holds for a beat, then the debris flies.
    const tweens = this.scene.tweens;
    tweens.timeScale = 0;
    const generation = this.generation;
    this.scene.time.delayedCall(HIT_STOP_MS, () => {
      tweens.timeScale = 1;
      if (generation === this.generation) rest();
    });
  }
  spill(at: { x: number; y: number }, loot: NonNullable<Hit["loot"]>) {
    this.loot ??= new LootEffects(this.scene, {
      entityAt: this.view.entityAt,
    });
    this.loot.spill(at, loot);
  }
  /** The struck thing goes white for a frame or two. */
  private flash(hit: Hit) {
    const entity = hit.id ? this.view.entityAt(hit.id) : undefined;
    const images = entity ? [entity] : this.view.plantAt(hit.at.x, hit.at.y);
    for (const image of images) {
      const tint = image.tintTopLeft;
      image.setTintFill(0xffffff);
      this.scene.time.delayedCall(FLASH_MS, () => {
        if (image.active) image.setTint(tint);
      });
    }
  }
  /** A shove: dust off the trailing edge, or the thing rocking in place.
   * The slide itself is the entity tween — this only dresses it. */
  consumeShove(effect: ShoveEffect | undefined) {
    if (!effect || effect.serial === this.playedShove) return;
    this.playedShove = effect.serial;
    if (effect.refused) {
      // Nothing moved, so the only thing to read is the object shrugging.
      const now = this.scene.time.now;
      for (const id of effect.ids) {
        const image = this.view.entityAt(id);
        if (image)
          this.shakes.push({
            image,
            until: now + 200,
            ox: image.x,
            wind: !!image.getData("wind"),
          });
      }
      void gameAudio()?.sound(scrape(effect.ground, effect.refused), "scrape");
      return;
    }
    void gameAudio()?.sound(scrape(effect.ground), "scrape");
    // Dust rises where the load left, not where it arrived.
    this.burst(this.point(effect.from), DEBRIS[effect.ground] ?? SOIL, 5, 0.7);
    const run = effect.path ?? [];
    // A rolling stone throws dust off each cell as it passes, on the same
    // clock as the sprite crossing them.
    const generation = this.generation;
    run.forEach((cell, i) => {
      if (i === run.length - 1) return;
      this.scene.time.delayedCall(ROLL_MS * (i + 1), () => {
        if (generation !== this.generation) return;
        this.burst(this.point(cell), DEBRIS[effect.ground] ?? SOIL, 3, 0.6);
      });
    });
    if (effect.hit) {
      const hit = effect.hit;
      this.scene.time.delayedCall(ROLL_MS * Math.max(1, run.length), () => {
        if (generation !== this.generation) return;
        void gameAudio()?.sound(
          strike("thrown", hit.hit, hit.kind, hit.damaged),
          "strike",
        );
        this.react(hit, 1.3);
        if (hit.damaged) this.scene.cameras.main.shake(130, 0.003);
      });
    }
  }
  private landedThrow = 0;
  /** The object a throw still has in the air, which the scene must not draw
   * sitting where it is going to land. */
  flying(effect: ThrowEffect | undefined) {
    return effect && effect.serial !== this.landedThrow ? effect.id : undefined;
  }
  /** A thrown thing in the air, then landing. It rises and falls over its
   * own shadow, tumbling unless it is a spear, and a stone skips on a pace. */
  consumeThrow(effect: ThrowEffect | undefined) {
    if (!effect || effect.serial === this.playedThrow) return;
    this.playedThrow = effect.serial;
    const generation = this.generation;
    this.scene.time.delayedCall(effect.launchMs ?? 0, () => {
      if (generation === this.generation) this.playThrow(effect);
    });
  }
  private playThrow(effect: ThrowEffect) {
    const from = this.point(effect.from),
      to = this.point(effect.to);
    const span = Math.max(
      Math.abs(effect.to.x - effect.from.x),
      Math.abs(effect.to.y - effect.from.y),
    );
    const flight = effect.sling
      ? Math.round(flightMs(span, true) * 0.75)
      : flightMs(span, effect.straight);
    const generation = this.generation;
    const land = () => {
      if (generation !== this.generation) return;
      void gameAudio()?.sound(
        effect.arrow || effect.straight
          ? projectileImpact(effect.arrow ? "arrow" : "spear", effect.hit.hit)
          : strike("thrown", effect.hit.hit, effect.hit.kind, effect.hit.damaged),
        "strike",
      );
      this.react(effect.hit, effect.arrow || effect.straight ? 0.65 : 1.2);
      if (effect.hit.loot?.length) this.spill(to, effect.hit.loot);
      if (effect.arrow || effect.straight) {
        if (effect.hit.hit !== "creature" && effect.hit.hit !== "water")
          this.burst({ x: to.x, y: to.y - 2 }, DEBRIS[effect.hit.hit] ?? SOIL, 3, 0.35);
      } else this.impact(to);
      if (effect.hit.damaged) this.scene.cameras.main.shake(110, 0.0022);
    };
    const frame = effect.sprite;
    if (!frame || !span) {
      this.landedThrow = effect.serial;
      this.scene.time.delayedCall(flight, land);
      return;
    }
    void gameAudio()?.sound(effect.arrow ? projectileRelease("arrow") :
      effect.sling ? projectileRelease("stone") :
      effect.straight ? projectileRelease("spear") : strike("haft", "air", "whoosh"), "throw");
    const image = this.scene.add
      .image(
        from.x,
        from.y - 12,
        effect.arrow ? projectileArrowTexture(this.scene) : this.view.texture(frame),
        effect.arrow ? undefined : this.view.frame(frame),
      )
      .setOrigin(0.5, 0.5)
      .setTint(this.view.tint())
      .setDepth(to.y + 4600);
    // A long thing is thrown at body scale, not at the height it stands in a yard.
    if (effect.small && !effect.arrow) image.setScale(effect.sling ? 0.3 : 0.4);
    else if (image.height > 24) image.setScale(24 / image.height);
    const shade = this.scene.add
      .ellipse(from.x, from.y - 1, 9, 4, 0x000000, 0.28)
      .setDepth(to.y * 16 + 5);
    this.live.add(image).add(shade);
    const heading = Math.atan2(to.y - from.y, to.x - from.x);
    if (effect.straight || effect.arrow)
      image.setRotation(heading + (effect.arrow ? 0 : Math.PI / 2));
    const animal = effect.creature && this.view.entityAt(`${effect.creature.group}-${effect.creature.n}`);
    const reach = effect.arrow ? 4 : 8;
    const arrival = animal
      ? {
          x: animal.x - Math.cos(heading) * reach,
          y: animal.y - animal.displayHeight * 0.53 - Math.sin(heading) * reach * 0.5 + 3,
        }
      : to;
    const spin = Math.sign(to.x - from.x || 1) * (3 + span * 0.8);
    let streak = 0;
    const leg = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      ms: number,
      height: number,
      done: () => void,
      ground = b,
    ) => {
      const t = { v: 0 };
      this.scene.tweens.add({
        targets: t,
        v: 1,
        duration: ms,
        ease: "Linear",
        onUpdate: () => {
          const x = a.x + (b.x - a.x) * t.v,
            y = a.y + (b.y - a.y) * t.v;
          const rise = Math.sin(Math.PI * t.v) * height;
          // Leaves the hand at chest height and comes down to the ground.
          image.setPosition(x, y - rise - 12 * (a === from ? 1 - t.v : 0) - 3);
          shade.setPosition(a.x + (ground.x - a.x) * t.v,
            a.y + (ground.y - a.y) * t.v - 1).setScale(1 - rise / 60);
          if (!effect.straight) image.setRotation(spin * t.v);
          // A slung stone is too quick to see; what shows is the streak it leaves.
          if (effect.sling && a === from && ++streak % 2) this.streak(image.x, image.y, image.depth);
        },
        onComplete: done,
      });
    };
    const finish = () => {
      this.landedThrow = effect.serial;
      this.view.redraw();
      this.live.delete(image);
      this.live.delete(shade);
      image.destroy();
      shade.destroy();
    };
    leg(from, arrival, flight, effect.straight ? 5 : effect.sling ? 3 + span * 0.6 : 9 + span * 3, () => {
      land();
      const skip = effect.bounce && this.point(effect.bounce);
      if (!skip || generation !== this.generation) return finish();
      leg(to, skip, 170, 7, () => {
        this.burst(skip, DEBRIS[effect.hit.hit] ?? SOIL, 3, 0.7);
        finish();
      });
    }, to);
  }
  private streak(x: number, y: number, depth: number) {
    const dot = this.scene.add.rectangle(Math.round(x), Math.round(y), 2, 1, 0xf6efdc, 0.7).setDepth(depth - 1);
    this.live.add(dot);
    this.scene.tweens.add({
      targets: dot,
      alpha: 0,
      scaleX: 0.5,
      duration: 160,
      onComplete: () => {
        this.live.delete(dot);
        dot.destroy();
      },
    });
  }
  /** Four short rays where something thrown comes down: the comic-book knock. */
  private impact(at: { x: number; y: number }) {
    const g = this.scene.add
      .graphics()
      .setPosition(at.x, at.y - 5)
      .setDepth(at.y + 4650);
    this.live.add(g);
    const ray = { r: 2, a: 1 };
    this.scene.tweens.add({
      targets: ray,
      r: 9,
      a: 0,
      duration: 180,
      ease: "Quad.easeOut",
      onUpdate: () => {
        g.clear().lineStyle(1, 0xffffff, ray.a);
        for (let k = 0; k < 4; k++) {
          const angle = Math.PI / 4 + (k * Math.PI) / 2;
          g.lineBetween(
            Math.cos(angle) * ray.r * 0.5,
            Math.sin(angle) * ray.r * 0.5,
            Math.cos(angle) * ray.r,
            Math.sin(angle) * ray.r,
          );
        }
      },
      onComplete: () => {
        this.live.delete(g);
        g.destroy();
      },
    });
  }
  /** One cell's answer to a blow. */
  private react(hit: Hit, weight: number) {
    const at = this.point(hit.at);
    const base = DEBRIS[hit.hit] ?? SOIL;
    const drawn = this.drawnPalette(hit);
    // Trees keep bark dust at the trunk; the drawn colours go to the crown.
    const palette =
      hit.hit === "tree" || hit.hit === "creature" ? base : (drawn ?? base);
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
      if (hit.hit === "tree")
        this.burst(
          { x: at.x, y: at.y - 22 },
          drawn ?? LEAF,
          Math.round(6 * weight) + 1,
          1.6,
        );
    } else if (hit.kind === "shatter") {
      this.burst({ x: at.x, y: at.y - 6 }, palette, count + 5, 2.3);
    } else {
      this.burst({ x: at.x, y: at.y - 7 }, palette, count, 1.5);
    }
    if (hit.solid) this.shake(hit.at);
  }
  /** The colours of what was struck, read off its sprite. */
  private drawnPalette(hit: Hit) {
    if (hit.hit === "creature") return undefined;
    const got =
      hit.sprite &&
      spritePalette(
        this.scene,
        this.view.texture(hit.sprite),
        this.view.frame(hit.sprite),
      );
    if (got) return got;
    const image = this.view.plantAt(hit.at.x, hit.at.y)[0];
    return image
      ? spritePalette(this.scene, image.texture.key, image.frame.name)
      : undefined;
  }
  /** An expanding ring, for a blow that lands on water. */
  private ring(at: { x: number; y: number }, color: number) {
    const g = this.scene.add.graphics().setDepth(at.y + 4200);
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
      .setDepth(y + 4000);
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
    void gameAudio()?.sound(
      effect.kind === "miss"
        ? strike("haft", "air", "whoosh")
        : work(effect.kind),
      "work",
    );
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
    if (effect.kind === "dig")
      for (const cell of effect.cells ?? [effect.at])
        this.burst(this.point(cell), SOIL, 6, 1.1);
    if (effect.kind === "reap" || effect.kind === "cut")
      for (const cell of effect.cells ?? [effect.at]) {
        const cut = this.point(cell);
        this.burst({ x: cut.x, y: cut.y - 4 }, LEAF, 7, 1.3);
      }
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
    if (effect.ore && (effect.kind === "mine" || effect.kind === "shatter")) {
      this.sparks({ x: (target.x + from.x) / 2, y: target.y - 8 }, 14);
      this.burst({ x: target.x, y: target.y - 6 }, METAL, 5, 1.2);
    }
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
    if (effect.kind === "douse") {
      this.burst({ x: target.x, y: target.y - 4 }, WATER, 14, 1.8);
      this.burst({ x: target.x, y: target.y - 14 }, STEAM, 10, 0.8);
    }
    if (effect.kind === "fill") this.burst({ x: target.x, y: target.y }, WATER, 6, 0.7);
    if (effect.kind === "hit") this.shake(effect.at);
    if (effect.kind === "fell") this.fell(effect, target);
    // A blow that bites holds for a beat, as a swing that lands does.
    if (["hit", "buck", "mine", "shatter", "fell"].includes(effect.kind)) {
      const tweens = this.scene.tweens;
      tweens.timeScale = 0;
      this.scene.time.delayedCall(
        effect.kind === "hit" || effect.kind === "buck"
          ? HIT_STOP_MS
          : HIT_STOP_MS + 35,
        () => (tweens.timeScale = 1),
      );
    }
  }
  /** A quick crescent in the direction of the blow. */
  private arc(from: { x: number; y: number }, to: { x: number; y: number }) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const g = this.scene.add.graphics().setDepth(to.y + 5000);
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
  /** A knife leaves no arc, only a thin bright cut drawn across the air. */
  private slice(from: { x: number; y: number }, to: { x: number; y: number }) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const g = this.scene.add.graphics().setDepth(to.y + 5000);
    g.lineStyle(3, 0x2a211a, 0.35).lineBetween(-6, -4, 6, 4);
    g.lineStyle(1, 0xffffff, 1).lineBetween(-6, -5, 6, 3);
    g.fillStyle(0xffffff, 1).fillRect(5, 2, 2, 2);
    g.setPosition(
      from.x + (to.x - from.x) * 0.55,
      from.y + (to.y - from.y) * 0.55 - 12,
    );
    g.setRotation(angle).setScale(0.2, 1);
    this.live.add(g);
    this.scene.tweens.chain({
      targets: g,
      tweens: [
        { scaleX: 1.1, duration: 45, ease: "Cubic.easeOut" },
        { alpha: 0, scaleY: 0.3, duration: 130, ease: "Quad.easeIn" },
      ],
      onComplete: () => {
        this.live.delete(g);
        g.destroy();
      },
    });
  }
  private thrust(from: { x: number; y: number }, to: { x: number; y: number }) {
    const dx = to.x - from.x,
      dy = to.y - from.y;
    const g = this.scene.add.graphics().setDepth(to.y + 5000);
    const x = Math.round(from.x + dx * 0.42),
      y = Math.round(from.y + dy * 0.42 - 11),
      tipX = Math.round(to.x - dx * 0.08),
      tipY = Math.round(to.y - dy * 0.08 - 11);
    g.lineStyle(2, 0xffe6a6, 0.8).lineBetween(x, y, tipX, tipY);
    g.lineStyle(1, 0xffffff, 1).lineBetween(x + 1, y - 1, tipX, tipY - 1);
    g.fillStyle(0xffffff, 1).fillRect(tipX - 1, tipY - 1, 3, 3);
    this.live.add(g);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 150,
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
  /** Bright, fast and short: they fly further than grit and do not land. */
  private sparks(at: { x: number; y: number }, count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.pixel(at.x, at.y, 1, SPARK[i % SPARK.length]);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const reach = 10 + Math.random() * 22;
      this.scene.tweens.add({
        targets: p,
        x: at.x + Math.cos(angle) * reach,
        y: at.y + Math.sin(angle) * reach + 8,
        alpha: 0,
        duration: 180 + Math.random() * 200,
        ease: "Quad.easeOut",
        onComplete: () => {
          this.live.delete(p);
          p.destroy();
        },
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
      .setDepth(target.y + 4500);
    this.live.add(image);
    this.scene.tweens.add({
      targets: image,
      rotation: (away * Math.PI) / 2.1,
      x: target.x + away * 6,
      duration: 620,
      ease: "Back.easeIn",
      onComplete: () => {
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
    // Anything caught mid-flight is on the ground as far as the scene goes.
    this.landedThrow = this.playedThrow;
    this.generation++;
    this.hidden = [];
    for (const object of this.live) object.destroy();
    this.live.clear();
    this.loot?.clear();
    this.scene.tweens.timeScale = 1;
    this.shakes = [];
  }
}
