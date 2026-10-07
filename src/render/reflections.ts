import type Phaser from "phaser";
import { TERRAIN_CHUNK_SIZE } from "./terrain-region";
import { openWaterMask } from "./living-water/game";

/** Water lies under the ground layers and the ground is opaque on land, so a
 * double drawn between them shows only where there is water. Each streamed
 * chunk's water is lifted by its own row, so a double sits just over the water
 * of the lowest chunk it reaches into. */
const depthOver = (bottom: number) =>
  -9999 + Math.floor(bottom / 16 / TERRAIN_CHUNK_SIZE) * TERRAIN_CHUNK_SIZE * 16 + 0.5;

/** Upside-down doubles of whatever stands at the water's edge: trees, houses
 * and people mirrored in the river and pond beside them, darkened toward the
 * water and stirred by it. */
export class Reflections {
  private mirrors = new Map<Phaser.GameObjects.Image, Phaser.GameObjects.Image>();
  private wetCells = new Map<number, boolean>();

  constructor(
    private scene: Phaser.Scene,
    private water: (cx: number, cy: number) => boolean,
  ) {}

  private wet(left: number, feet: number, width: number, height: number) {
    const x0 = Math.floor(left / 16),
      x1 = Math.floor((left + width) / 16),
      y0 = Math.floor(feet / 16),
      y1 = Math.floor((feet + height * 0.8) / 16);
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const k = cx * 100003 + cy;
        let w = this.wetCells.get(k);
        if (w === undefined) this.wetCells.set(k, (w = this.water(cx, cy)));
        if (w) return true;
      }
    return false;
  }

  update(sources: Iterable<Phaser.GameObjects.Image>, tint: number, time: number) {
    const view = this.scene.cameras.main.worldView;
    const seen = new Set<Phaser.GameObjects.Image>();
    for (const im of sources) {
      if (!im.active || !im.visible || im.alpha < 0.5 || seen.has(im)) continue;
      const w = im.displayWidth,
        h = im.displayHeight,
        left = im.x - im.originX * w,
        feet = im.y + (1 - im.originY) * h;
      if (left > view.right || left + w < view.x || feet > view.bottom || feet + h < view.y) continue;
      if (!this.wet(left, feet, w, h)) continue;
      // Clipped to the open water of the chunk it falls in, so a figure on
      // the bank does not show in the sand at the water's edge.
      const mask = openWaterMask(this.scene, im.x, feet + Math.min(h * 0.5, 24));
      if (!mask) continue;
      seen.add(im);
      let m = this.mirrors.get(im);
      if (!m) {
        m = this.scene.add.image(0, 0, im.texture.key);
        this.mirrors.set(im, m);
      }
      // A slow sway, out of step from one double to the next, stands in for
      // the ripple that breaks a real reflection.
      const sway = Math.round(Math.sin(time / 900 + (im.x + im.y) * 0.05));
      m.setTexture(im.texture.key, im.frame.name)
        .setOrigin(im.originX, 0)
        .setFlipX(im.flipX)
        .setFlipY(true)
        .setScale(im.scaleX, im.scaleY)
        .setPosition(im.x + sway, feet)
        .setTint(tint)
        .setAlpha(0.45)
        .setDepth(depthOver(feet + h))
        .setMask(mask)
        .setVisible(true);
    }
    for (const [im, m] of this.mirrors)
      if (!seen.has(im)) {
        m.destroy();
        this.mirrors.delete(im);
      }
  }

  /** A new map, or the player gone indoors. */
  clear() {
    for (const m of this.mirrors.values()) m.destroy();
    this.mirrors.clear();
    this.wetCells.clear();
  }
}
