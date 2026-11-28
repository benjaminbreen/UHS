import Phaser from "phaser";
import type { CaveLight } from "../../content/caves";
import { tombFind, tombStyle } from "../../content/tombs";
import type { TombLevel } from "../../world/tomb";
import { LampHud, Lamplight } from "../lamplight";
import { paintTombDecor, paintTombGround, paintTombThing, type TombSprite } from "./paint";

export type TombFrame = {
  /** The player's feet, in world pixels. */
  x: number;
  y: number;
  facing: number;
  light: CaveLight;
  /** Game seconds of light left. */
  left: number;
  done: readonly string[];
  /** Local hour, for the daylight on the stair. */
  hour: number;
  time: number;
  delta: number;
};

/** One area of a tomb on screen: the painted rock, what stands in it, and the
 * lamp's light stopped by the walls. */
export class TombView {
  readonly space: string;
  readonly bounds: { x: number; y: number; w: number; h: number };
  /** Review switch: every cell fully lit, to look at the painting itself. */
  static daylit = false;
  private keys: string[] = [];
  private objects: Phaser.GameObjects.GameObject[] = [];
  /** Things that go when they are taken or pulled down. */
  private loose = new Map<string, Phaser.GameObjects.Image>();
  private lamp: Lamplight;
  private hud: LampHud;
  private noon = -1;

  constructor(private scene: Phaser.Scene, readonly level: TombLevel) {
    this.space = level.space;
    const W = level.w * 16, H = level.h * 16, key = `tomb-${level.space}`, style = tombStyle(level.style);
    this.bounds = { x: 0, y: 0, w: W, h: H };
    const tex = (name: string, canvas: HTMLCanvasElement) => {
      const k = `${key}-${name}`;
      if (scene.textures.exists(k)) scene.textures.remove(k);
      scene.textures.addCanvas(k, canvas);
      this.keys.push(k);
      return k;
    };
    this.objects.push(scene.add.rectangle(-800, -600, W + 1600, H + 1200, 0x0d0a09).setOrigin(0, 0).setDepth(-99993));
    this.objects.push(scene.add.image(0, 0, tex("ground", paintTombGround(level).canvas())).setOrigin(0, 0).setDepth(-99990));
    const put = (s: TombSprite, x: number, y: number, name: string, depth: number) => {
      const im = scene.add.image(x - s.ox, y - s.oy, tex(name, s.r.canvas())).setOrigin(0, 0).setDepth(depth);
      this.objects.push(im);
      return im;
    };
    for (const t of level.things) {
      if (t.prop) continue;
      const s = paintTombThing(t.art, t.w ?? 1, t.h ?? 1, ((t.x * 7 + t.y * 3) % 10) / 10, style?.look, t.find);
      if (!s) continue;
      const flat = !t.wall && !t.solid;
      const im = put(s, t.x * 16, (t.wall ? t.y + 1 : t.y) * 16, t.id, t.wall || flat ? -99980 : (t.y + (t.h ?? 1) - 1) * 16 + 13);
      if (style && !tombFind(style, t.find)?.keeps) this.loose.set(t.id, im);
    }
    level.decor.forEach((d, i) => {
      const s = d.solid && paintTombDecor(d.type, d.v, style?.look);
      if (s) put(s, d.x * 16, d.y * 16, `decor-${i}`, d.y * 16 + 13);
    });
    for (const [i, l] of level.lifts.entries()) {
      const s = paintTombDecor(l.up ? "rope-up" : "rope-down", 0);
      if (s) put(s, l.up || !level.pit ? l.x * 16 : level.pit.x0 * 16 - 6, l.y * 16 + (l.up ? 0 : 2), `lift-${i}`, l.up ? l.y * 16 + 13 : -99979);
    }
    this.lamp = new Lamplight(scene, key, level, [0.15, 0], 0.38);
    this.hud = new LampHud(scene, level.name, { text: "#ffe6c0", stroke: "#120e0c" });
  }

  update(f: TombFrame) {
    const { level } = this, done = new Set(f.done);
    for (const [id, im] of this.loose) im.setVisible(!done.has(id));
    const lit = f.left > 0, low = lit ? Math.min(1, f.left / (f.light.burns * 0.2)) : 0, t = f.time / 1000;
    const flick = !lit ? 1 : f.light.flame ? 0.9 + 0.06 * Math.sin(t * 9.1) + 0.04 * Math.sin(t * 23.7 + 1.3) - (1 - low) * 0.12 * (0.5 + 0.5 * Math.sin(t * 31)) : 1;
    const reach = lit ? f.light.reach * (0.6 + 0.4 * low) : 1.7;
    const hue = parseInt(f.light.color.slice(1), 16);
    const color = lit ? [16, 8, 0].map((s) => 0.5 + (((hue >> s) & 255) / 255) * 0.5) : [0.3, 0.36, 0.5];
    const noon = Math.max(0.1, Math.min(1, 1.25 - Math.abs(f.hour - 12.5) / 6));
    if (level.role === "entrance" && Math.round(noon * 20) !== this.noon) {
      // Daylight down the stair, by the hour.
      this.noon = Math.round(noon * 20);
      this.lamp.still.fill(0);
      this.lamp.addStill(level.entry.x + 0.5, level.h - 0.5, 11, [1, 0.96, 0.86], noon, (d) => (1 - d) ** 1.3);
    }
    this.lamp.look(f.x, f.y, Math.ceil(f.light.reach) + 2);
    this.lamp.update({ x: f.x, y: f.y, facing: f.facing, delta: f.delta, reach, flick, color, beam: lit && !f.light.flame, carried: [], daylit: TombView.daylit });
    this.lamp.halo.setPosition(f.x, f.y - 10).setScale((reach * 16 * 1.5) / 64).setTint(hue).setAlpha(lit ? (f.light.flame ? 0.2 : 0.1) * flick : 0);
    this.hud.flame(f.time, lit, Math.max(0, Math.min(1, f.left / f.light.burns)), `${f.light.name.toUpperCase()}  ·  ${level.name.toUpperCase()}`);
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    this.lamp.destroy();
    this.hud.destroy();
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
  }
}
