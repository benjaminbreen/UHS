import Phaser from "phaser";
import { windVector, wind } from "./wind";

const KEY = "weather-cloud-shadows";
const TILE = 512;
/** Each texel is three world pixels: a cloud's shadow is soft and far bigger than a house. */
const SCALE = 3;

/** A seamless field of cumulus shadows: a few big lobed masses with a long soft
 * edge. Smooth, not dithered: a dither pattern this large drifting over the
 * art read as a moving checkerboard. */
function ensureTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(KEY)) return;
  let seed = 11;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const lobes: { x: number; y: number; r: number }[] = [];
  for (let c = 0; c < 4; c++) {
    const cx = (c % 2) * TILE * 0.5 + rnd() * TILE * 0.4,
      cy = Math.floor(c / 2) * TILE * 0.5 + rnd() * TILE * 0.4,
      size = 34 + rnd() * 30;
    for (let i = 0; i < 6 + Math.floor(rnd() * 4); i++)
      lobes.push({ x: cx + (rnd() - 0.5) * size * 2.6, y: cy + (rnd() - 0.5) * size * 1.1, r: size * (0.5 + rnd() * 0.45) });
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
      const t = Math.min(1, Math.max(0, (v - 0.02) / 0.45));
      if (!t) continue;
      const i = (y * TILE + x) * 4;
      img.data.set([126, 142, 178, Math.round(255 * t * t * (3 - 2 * t))], i);
    }
  ctx.putImageData(img, 0, 0);
  canvas.refresh();
  // Sampled smoothly, unlike the art: stretched nearest, its edge came out in steps.
  canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
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
