import Phaser from "phaser";
import { prisonStyle } from "../../content/prisons";
import type { PrisonLevel } from "../../world/prison";
import {
  paintEmptyKeyRack,
  paintOpenDrain,
  paintPrisonGround,
  paintSpoon,
  paintWallCrack,
  prisonLooks,
  prisonSprites,
  type PrisonLook,
} from "./tiles";

export type PrisonFrame = {
  done: readonly string[];
  pry: number;
  grate: number;
  hasKey: boolean;
  clock: number;
  time: number;
};

/** One continuous procedural prison dungeon rendered via tiles.ts (forced-perspective walls, barred cells, skylights, lamps, and interactive escape cues). */
export class PrisonView {
  readonly space: string;
  readonly bounds: { x: number; y: number; w: number; h: number };
  private keys: string[] = [];
  private objects: Phaser.GameObjects.GameObject[] = [];
  private glows: Phaser.GameObjects.Image[] = [];
  private loose = new Map<string, Phaser.GameObjects.Image>();
  private crack?: { im: Phaser.GameObjects.Image; last: number };
  private keyCover?: Phaser.GameObjects.Image;
  private drainCover?: Phaser.GameObjects.Image;
  private shade: Phaser.GameObjects.Rectangle;
  private banner: Phaser.GameObjects.Text;
  private born = 0;

  constructor(private scene: Phaser.Scene, readonly level: PrisonLevel) {
    this.space = level.space;
    const style = prisonStyle(level.style)!;
    const look = prisonLooks[level.layout];
    const W = level.w * 16, H = level.h * 16;
    this.bounds = { x: -32, y: -32, w: W + 64, h: H + 64 };
    ensureGlow(scene);

    const tex = (name: string, canvas: HTMLCanvasElement) => {
      const k = `prison-${level.space}-${name}`;
      if (scene.textures.exists(k)) scene.textures.remove(k);
      scene.textures.addCanvas(k, canvas);
      this.keys.push(k);
      return k;
    };

    // Seamless outer roof surround aligned on tiles.ts's 8px stipple grid
    const roofTex = tex("roof", makeRoofTile(look.roof));
    this.objects.push(scene.add.tileSprite(-800, -608, W + 1600, H + 1216, roofTex).setOrigin(0, 0).setDepth(-99993));
    this.objects.push(scene.add.image(0, 0, tex("ground", paintPrisonGround(level.plan, look).canvas())).setOrigin(0, 0).setDepth(-99990));

    const [gr, gg, gb] = look.glow;
    const glowTint = (gr << 16) | (gg << 8) | gb;
    const addGlow = (x: number, y: number) => {
      const g = scene.add.image(x, y, "prison-glow").setDepth(49900).setBlendMode(Phaser.BlendModes.ADD).setTint(glowTint).setAlpha(0.2);
      this.glows.push(g);
      this.objects.push(g);
    };

    // Standing Y-sorted sprites from tiles.ts (barred cell fronts, lamps, beds, buckets, desks, stocks, wells)
    prisonSprites(level.plan, look).forEach((s, i) => {
      const im = scene.add.image(s.x, s.y, tex(`sp-${i}`, s.r.canvas())).setOrigin(0, 0).setDepth(s.sort || -99980);
      this.objects.push(im);
      for (const [gx, gy] of s.glow ?? []) addGlow(gx, gy);
    });

    // Interactive escape overlays: ALttP wall-crack, hidden spoon, stolen key rack cover, open drain grate
    for (const t of level.things) {
      if (t.art === "wall-crack") {
        const im = scene.add
          .image(t.x * 16 - 22, t.y * 16 - 2, tex("crack-0", paintWallCrack(look, 0).canvas()))
          .setOrigin(0, 0)
          .setDepth(-99982);
        this.objects.push(im);
        this.crack = { im, last: 0 };
      } else if (t.art === "spoon") {
        const im = scene.add
          .image(t.x * 16 + 1, t.y * 16 + 2, tex("spoon", paintSpoon(look).canvas()))
          .setOrigin(0, 0)
          .setDepth(-99982);
        this.objects.push(im);
        this.loose.set(t.id, im);
      } else if (t.art === "key-rack") {
        const im = scene.add
          .image(t.x * 16, t.y * 16 - 6, tex("keys-empty", paintEmptyKeyRack(look).canvas()))
          .setOrigin(0, 0)
          .setDepth(-99982)
          .setVisible(false);
        this.objects.push(im);
        this.keyCover = im;
      } else if (t.art === "grate") {
        const im = scene.add
          .image(t.x * 16, t.y * 16, tex("drain-open", paintOpenDrain(look).canvas()))
          .setOrigin(0, 0)
          .setDepth(-99982)
          .setVisible(false);
        this.objects.push(im);
        this.drainCover = im;
      }
    }

    this.shade = scene.add.rectangle(-800, -608, W + 1600, H + 1216, 0x161428, 0).setOrigin(0, 0).setDepth(49890);
    this.objects.push(this.shade);

    this.banner = scene.add
      .text(scene.cameras.main.width / 2, 54, `${style.label} — ${level.name}`, {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#f8ebd2",
        stroke: "#1c1624",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(60000);
    this.objects.push(this.banner);
  }

  update(f: PrisonFrame) {
    const done = new Set(f.done);
    for (const [id, im] of this.loose) im.setVisible(!done.has(id));
    if (this.keyCover) this.keyCover.setVisible(f.hasKey);
    if (this.drainCover) this.drainCover.setVisible(f.grate >= 1);
    if (this.crack && f.pry !== this.crack.last) {
      this.crack.last = f.pry;
      const look = prisonLooks[this.level.layout];
      const k = `prison-${this.level.space}-crack-${f.pry}`;
      if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
      this.scene.textures.addCanvas(k, paintWallCrack(look, f.pry).canvas());
      this.keys.push(k);
      this.crack.im.setTexture(k);
    }
    const t = f.time / 1000;
    this.glows.forEach((g, i) => {
      g.setAlpha(0.18 + 0.04 * Math.sin(t * 7.5 + i * 1.9) + 0.02 * Math.sin(t * 18.7 + i));
    });
    const hour = (((f.clock / 3600) % 24) + 24) % 24;
    const night = hour < 6 || hour >= 20 ? 0.22 : hour < 8 || hour >= 18 ? 0.1 : 0.02;
    this.shade.setAlpha(night);
    if (!this.born) this.born = f.time;
    const age = (f.time - this.born) / 1000;
    this.banner.setAlpha(age < 2.5 ? 1 : Math.max(0, 1 - (age - 2.5) / 1.2));
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
  }
}

function makeRoofTile([bg, dot]: PrisonLook["roof"]) {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillStyle = dot;
  ctx.fillRect(1, 1, 1, 1);
  ctx.fillRect(5, 5, 1, 1);
  return c;
}

function ensureGlow(scene: Phaser.Scene) {
  if (scene.textures.exists("prison-glow")) return;
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(48, 48, 2, 48, 48, 46);
  g.addColorStop(0, "rgba(255,244,205,1)");
  g.addColorStop(0.42, "rgba(255,204,115,0.42)");
  g.addColorStop(1, "rgba(255,170,70,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 96);
  scene.textures.addCanvas("prison-glow", c);
}
