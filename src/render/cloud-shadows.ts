import Phaser from "phaser";
import { windVector, wind } from "./wind";

const KEY = "weather-cloud-shadows";
const TILE = 384;
/** Each texel is two world pixels: big enough to dither, small enough to sit in the art. */
const SCALE = 2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A seamless field of cumulus shadows: lobed blobs with a dithered rim, drawn
 * once per wrap offset so the tile has no seam. */
function ensureTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(KEY)) return;
  let seed = 11;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const lobes: { x: number; y: number; r: number }[] = [];
  for (let c = 0; c < 7; c++) {
    const cx = rnd() * TILE,
      cy = rnd() * TILE,
      size = 22 + rnd() * 26;
    for (let i = 0; i < 5 + Math.floor(rnd() * 5); i++)
      lobes.push({ x: cx + (rnd() - 0.5) * size * 2.4, y: cy + (rnd() - 0.5) * size, r: size * (0.45 + rnd() * 0.5) });
  }
  const canvas = scene.textures.createCanvas(KEY, TILE, TILE)!;
  const ctx = canvas.getContext();
  const img = ctx.createImageData(TILE, TILE);
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      let v = 0;
      for (const l of lobes) {
        const dx = Math.abs(x - l.x) % TILE,
          dy = Math.abs(y - l.y) % TILE;
        v = Math.max(v, 1 - Math.hypot(Math.min(dx, TILE - dx), Math.min(dy, TILE - dy)) / l.r);
      }
      // A solid core and one dithered band at the edge, never a gradient.
      const rim = (v - 0.05) / 0.12;
      if (rim <= 0 || (rim < 1 && BAYER[(y % 4) * 4 + (x % 4)] / 16 >= rim)) continue;
      const i = (y * TILE + x) * 4;
      img.data.set([112, 132, 168, 255], i);
    }
  ctx.putImageData(img, 0, 0);
  canvas.refresh();
}

/** Shadows of passing cloud, fixed to the ground and carried downwind. */
export class CloudShadows {
  private sheet?: Phaser.GameObjects.TileSprite;
  private strength = 0;

  constructor(private scene: Phaser.Scene) {}

  set(strength: number) {
    this.strength = strength;
    if (!strength) return void this.sheet?.setVisible(false);
    if (!this.sheet) {
      ensureTexture(this.scene);
      this.sheet = this.scene.add
        .tileSprite(0, 0, 16, 16, KEY)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(18800)
        .setTileScale(SCALE)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }
    // Camera-fixed and cut far larger than the view, as the mist is, because
    // the camera still zooms what it draws.
    const w = this.scene.scale.width * 6,
      h = this.scene.scale.height * 6;
    this.sheet.setVisible(true).setAlpha(strength).setSize(w, h).setPosition(-w / 2.4, -h / 2.4);
  }

  update(time: number, frozen = false) {
    if (!this.strength || !this.sheet) return;
    const c = this.scene.cameras.main;
    const v = windVector();
    const drift = frozen ? 0 : (8 + wind().strength * 30) * (time / 1000);
    // Scroll in step with the camera so the shadow stays on the ground under it.
    this.sheet.tilePositionX = (c.scrollX + this.sheet.x - v.x * drift) / SCALE;
    this.sheet.tilePositionY = (c.scrollY + this.sheet.y - v.y * drift) / SCALE;
  }
}
