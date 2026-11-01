import type Phaser from "phaser";
import { windVector, wind } from "./wind";

const KEY = "weather-mist";
const TILE = 256;

/** A seamless field of soft banks, wider than tall as fog lies. Each is drawn
 * nine times, once per wrap offset, so the texture tiles without a visible seam. */
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
  for (let i = 0; i < 14; i++) {
    const x = rnd() * TILE,
      y = rnd() * TILE,
      r = 50 + rnd() * 70;
    for (const dx of [-TILE, 0, TILE])
      for (const dy of [-TILE, 0, TILE]) {
        ctx.save();
        ctx.translate(x + dx, y + dy);
        ctx.scale(1, 0.5);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, "rgba(255,255,255,0.42)");
        g.addColorStop(0.6, "rgba(255,255,255,0.16)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
  }
  canvas.refresh();
}

/** Two sheets of fog over the view, fixed to the ground rather than the lens,
 * drifting downwind at different speeds so the field keeps changing shape
 * without any per-particle work. Drawn over the night wash, not under it,
 * where the multiply turned the fog to grime. */
export class Mist {
  private sheets: Phaser.GameObjects.TileSprite[] = [];
  private intensity = 0;
  private night = 0;

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
            .setDepth(19000.3 + i * 0.3)
            .setTileScale(i ? 2.4 : 1.5),
        );
    }
    // Camera-fixed, but the camera still zooms what it draws, so the sheet is
    // cut far larger than the view and hung off its top-left corner.
    const w = this.scene.scale.width * 6,
      h = this.scene.scale.height * 6;
    this.sheets.forEach((sheet) => {
      sheet.setVisible(true);
      sheet.setSize(w, h);
      sheet.setPosition(-w / 2.4, -h / 2.4);
    });
    this.tint(this.night);
  }

  /** Pale by day; by night a dim blue that glows a little over the dark. */
  tint(night: number) {
    this.night = night;
    const day = [233, 240, 247],
      dark = [150, 165, 196];
    const [r, g, b] = day.map((c, k) => Math.round(c + (dark[k] - c) * night));
    this.sheets.forEach((sheet, i) =>
      sheet.setTint((r << 16) | (g << 8) | b).setAlpha(this.intensity * (i ? 0.55 : 1) * (1 - 0.15 * night)),
    );
  }

  update(time: number, frozen = false) {
    if (!this.intensity) return;
    const v = windVector();
    const speed = 6 + wind().strength * 26;
    const cam = this.scene.cameras.main;
    this.sheets.forEach((sheet, i) => {
      const rate = frozen ? 0 : (i ? 0.55 : 1) * speed * (time / 1000);
      // Tile offsets are in texture pixels, which the tile scale enlarges; the
      // upper sheet runs a little ahead of the ground for depth.
      const ground = (i ? 1.15 : 1) / sheet.tileScaleX;
      sheet.tilePositionX = cam.scrollX * ground + v.x * rate;
      sheet.tilePositionY = cam.scrollY * ground + v.y * rate;
    });
  }
}
