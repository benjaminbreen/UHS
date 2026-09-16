import type Phaser from "phaser";
import { windVector, wind } from "./wind";

const KEY = "weather-mist";
const TILE = 192;

/** A seamless field of soft blobs. Each is drawn nine times, once per wrap
 * offset, so the texture tiles without a visible seam. */
function ensureTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(KEY)) return;
  const canvas = scene.textures.createCanvas(KEY, TILE, TILE)!;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < 26; i++) {
    const x = rnd() * TILE,
      y = rnd() * TILE,
      r = 22 + rnd() * 46;
    for (const dx of [-TILE, 0, TILE])
      for (const dy of [-TILE, 0, TILE]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        g.addColorStop(0, "rgba(233,240,247,0.5)");
        g.addColorStop(1, "rgba(233,240,247,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  canvas.refresh();
}

/** Two sheets of fog over the view, drifting downwind at different speeds so
 * the field keeps changing shape without any per-particle work. */
export class Mist {
  private sheets: Phaser.GameObjects.TileSprite[] = [];
  private intensity = 0;

  constructor(private scene: Phaser.Scene) {}

  set(intensity: number) {
    this.intensity = intensity;
    if (!intensity) {
      for (const sheet of this.sheets) sheet.setVisible(false);
      return;
    }
    if (!this.sheets.length) {
      ensureTexture(this.scene);
      for (let i = 0; i < 2; i++)
        this.sheets.push(
          this.scene.add
            .tileSprite(0, 0, 16, 16, KEY)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(18900 + i)
            .setTileScale(i ? 1.7 : 1),
        );
    }
    // Camera-fixed, but the camera still zooms what it draws, so the sheet is
    // cut far larger than the view and hung off its top-left corner.
    const w = this.scene.scale.width * 6,
      h = this.scene.scale.height * 6;
    this.sheets.forEach((sheet, i) => {
      sheet.setVisible(true).setAlpha(this.intensity * (i ? 0.55 : 1));
      sheet.setSize(w, h);
      sheet.setPosition(-w / 2.4, -h / 2.4);
    });
  }

  update(time: number, frozen = false) {
    if (!this.intensity || frozen) return;
    const v = windVector();
    const speed = 6 + wind().strength * 26;
    this.sheets.forEach((sheet, i) => {
      const rate = (i ? 0.55 : 1) * speed * (time / 1000);
      sheet.tilePositionX = v.x * rate;
      sheet.tilePositionY = v.y * rate;
    });
  }
}
