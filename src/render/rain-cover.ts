import Phaser from "phaser";
import type { WorldSetting } from "../content/geography/types";

export type Cover = "umbrella" | "leaf" | "cloth";
type Sprite = Phaser.GameObjects.Image;

const TROPICS = new Set(["southeast-asian", "south-asian", "west-central-african", "east-southern-african", "australian-pacific", "mesoamerican", "other-indigenous-american", "andean"]);

/** What someone puts over their head in the rain, if anything. China had
 * oiled-paper umbrellas from the Han; Europe's townsfolk took them up from the
 * 1770s (Hanway's London) and nearly all had one by the 1850s; in the tropics
 * a banana or taro leaf does; elsewhere a shawl, sack or coat pulled up. */
export function coverFor(setting: WorldSetting | undefined, year: number, roll: number, child: boolean): Cover | undefined {
  if (!setting) return undefined;
  const culture = setting.culture ?? "";
  let umbrella = 0;
  if (culture === "east-asian") umbrella = year >= -200 ? 0.55 : 0;
  else if (culture === "european") umbrella = year < 1770 ? 0 : Math.min(0.55, 0.1 + ((year - 1770) / 80) * 0.45);
  else if (year >= 1850 && (culture === "south-asian" || culture === "southeast-asian")) umbrella = 0.3;
  if (year >= 1920) umbrella = Math.max(umbrella, 0.5);
  if (child) umbrella *= 0.3;
  if (roll < umbrella) return "umbrella";
  const tropical = TROPICS.has(culture) && Math.abs(setting.lat) < 25;
  if (tropical && year < 1950) return roll < umbrella + 0.45 ? "leaf" : undefined;
  return roll < umbrella + 0.4 ? "cloth" : undefined;
}

const SHAWL = [0x8a7a5a, 0x6a5a4a, 0x9a8a70, 0x7a5a48];

const shade = (c: number, k: number) => {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return (f(r) << 16) | (f(g) << 8) | f(b);
};

/** Rain off umbrellas and leaves, which the figures hold, and shawls pulled
 * over heads. Drawn over the figure; changes nothing in the engine. */
export class RainCovers {
  private drawn = new Map<string, Phaser.GameObjects.Graphics>();
  private drip = new Map<string, number>();
  private seen = new Map<string, number>();
  private swept = 0;
  constructor(private scene: Phaser.Scene) {}

  update(id: string, cover: Cover | undefined, tint: number, im: Sprite, head: number, direction: number, time: number) {
    if (time - this.swept > 1000) this.sweep(time);
    if (!cover) return this.hide(id);
    this.seen.set(id, time);
    let g = this.drawn.get(id);
    if (!g) this.drawn.set(id, (g = this.scene.add.graphics()));
    const dx = [0, 1, 0, -1][direction], away = direction === 0;
    const x = Math.round(im.x), y = head;
    g.clear().setDepth(im.depth + 0.2);
    const px = (c: number, a: number, b: number, w = 1, h = 1) => g!.fillStyle(c, 1).fillRect(a, b, w, h);
    if (cover !== "cloth") {
      // The figure holds it; only the drip off its rim is drawn here.
      g.clear();
      if (time >= (this.drip.get(id) ?? 0)) {
        this.drip.set(id, time + (cover === "umbrella" ? 160 + Math.random() * 300 : 400 + Math.random() * 500));
        this.fall(x + (Math.random() < 0.5 ? -12 : 12) + dx * 2, y + 6, im.depth + 0.2);
      }
    } else {
      // A shawl or sack pulled up over the head, hanging to the shoulders.
      const dark = shade(tint, 0.78);
      px(tint, x - 3, y - 1, 7, 1);
      px(tint, x - 4, y, 9, 2);
      if (away) px(tint, x - 4, y + 2, 9, 5);
      else if (dx) px(dark, x - dx * 3 - 1, y + 2, 3, 6);
      else {
        px(dark, x - 4, y + 2, 2, 6);
        px(dark, x + 3, y + 2, 2, 6);
      }
    }
    return undefined;
  }

  private fall(x: number, y: number, depth: number) {
    const drop = this.scene.add.rectangle(x, y, 1, 2, 0xb8d0e4).setAlpha(0.85).setDepth(depth);
    this.scene.tweens.add({ targets: drop, y: y + 9, alpha: 0, duration: 260, ease: "Quad.easeIn", onComplete: () => drop.destroy() });
  }

  hide(id: string) {
    this.drawn.get(id)?.destroy();
    this.drawn.delete(id);
    return undefined;
  }

  private sweep(time: number) {
    this.swept = time;
    for (const [id, at] of this.seen)
      if (time - at > 500) {
        this.hide(id);
        this.seen.delete(id);
      }
  }

  dispose() {
    for (const id of [...this.drawn.keys()]) this.hide(id);
    this.seen.clear();
    this.drip.clear();
  }
}

/** The shawl's colour, or which umbrella: oiled paper in Asia before 1920, cloth elsewhere. */
export function coverItem(cover: Cover, culture: string | undefined, year: number) {
  if (cover === "leaf") return "banana-leaf";
  if (cover === "umbrella") return year < 1920 && /east-asian|south-asian|southeast-asian/.test(culture ?? "") ? "paper-umbrella" : "umbrella";
  return undefined;
}

export const shawlTint = (roll: number) => SHAWL[Math.floor(roll * SHAWL.length) % SHAWL.length];
