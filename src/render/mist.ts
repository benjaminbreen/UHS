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

const STREAKS = "weather-streaks";
/** Long thin runs of blown snow or sand, all lying along +x: the sheet is
 * turned to the wind. Hard-edged, three steps of alpha each, and seamless. */
function ensureStreaks(scene: Phaser.Scene) {
  if (scene.textures.exists(STREAKS)) return;
  const canvas = scene.textures.createCanvas(STREAKS, TILE, TILE)!;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, TILE, TILE);
  let seed = 23;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(rnd() * TILE),
      y = Math.floor(rnd() * TILE),
      length = 6 + Math.floor(rnd() * rnd() * 44),
      thick = rnd() < 0.12 ? 2 : 1,
      alpha = 0.3 + rnd() * 0.6;
    for (const dx of [-TILE, 0])
      for (const dy of [-TILE, 0]) {
        // A faint tail, the body, and a bright head on the downwind end.
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.4})`;
        ctx.fillRect(x + dx, y + dy, length, thick);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.75})`;
        ctx.fillRect(x + dx + Math.floor(length * 0.4), y + dy, Math.ceil(length * 0.6), thick);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(x + dx + Math.floor(length * 0.8), y + dy, Math.ceil(length * 0.2), 1);
      }
  }
  canvas.refresh();
  // Crisp at any turn: a smoothed streak is a smear, not a pixel line.
  canvas.setFilter(1);
}

type Tone = readonly [number, number, number];
const FOG: Tone = [233, 240, 247];

/** Two sheets of fog over the view, fixed to the ground rather than the lens,
 * drifting downwind at different speeds so the field keeps changing shape
 * without any per-particle work. Drawn over the night wash, not under it,
 * where the multiply turned the fog to grime. In a blizzard or a dust storm
 * two more sheets of streaks race through it on the wind. */
export class Mist {
  private sheets: Phaser.GameObjects.TileSprite[] = [];
  private streaks: Phaser.GameObjects.TileSprite[] = [];
  private intensity = 0;
  private night = 0;
  private golden = 0;
  private tone: Tone = FOG;
  private blown = 0;

  constructor(private scene: Phaser.Scene) {}

  /** `tone` colours the banks (fog is pale, dust ochre); `blown`, 0 to 1,
   * is how hard snow or sand is being driven through them. */
  set(intensity: number, tone: Tone = FOG, blown = 0) {
    this.intensity = intensity;
    this.tone = tone;
    this.blown = intensity ? blown : 0;
    if (this.blown && !this.streaks.length) {
      ensureStreaks(this.scene);
      for (let i = 0; i < 2; i++)
        this.streaks.push(
          this.scene.add
            .tileSprite(0, 0, 16, 16, STREAKS)
            .setScrollFactor(0)
            .setDepth(19000.1 + i * 0.1)
            .setTileScale(i ? 2 : 1),
        );
    }
    // Square and far larger than the view, so it covers at any turn and zoom.
    const side = Math.max(this.scene.scale.width, this.scene.scale.height) * 6;
    for (const sheet of this.streaks)
      sheet
        .setVisible(this.blown > 0)
        .setSize(side, side)
        .setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
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
    this.tint(this.night, this.golden);
  }

  /** Pale by day; warm rose-blushed at dawn and dusk; dim blue by night. */
  tint(night: number, golden = 0) {
    this.night = night;
    this.golden = golden;
    const fog = this.tone === FOG;
    const warm = [246, 222, 204],
      // Dust keeps its own colour at any hour and only loses light.
      dark = fog ? [150, 165, 196] : this.tone.map((c) => c * 0.45);
    const [r, g, b] = this.tone.map((c, k) => {
      const lit = fog ? c + (warm[k] - c) * Math.min(1, golden * 0.75) : c;
      return Math.round(lit + (dark[k] - lit) * night);
    });
    const tint = (r << 16) | (g << 8) | b;
    this.sheets.forEach((sheet, i) =>
      sheet.setTint(tint).setAlpha(this.intensity * (i ? 0.55 : 1) * (1 - 0.15 * night)),
    );
    // Streaks are lighter than the bank they run through, or they vanish in it.
    const pale = [r, g, b].map((c) => Math.round(c + (255 - c) * 0.45 * (1 - night)));
    this.streaks.forEach((sheet, i) =>
      sheet
        .setTint((pale[0] << 16) | (pale[1] << 8) | pale[2])
        .setAlpha(Math.min(1, this.blown * (i ? 0.5 : 0.8)) * (1 - 0.4 * night)),
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
      // A tile position is where the view sits on the texture: it goes down
      // for the fog to move downwind.
      sheet.tilePositionX = cam.scrollX * ground - v.x * rate;
      sheet.tilePositionY = cam.scrollY * ground - v.y * rate;
    });
    if (!this.blown) return;
    const angle = wind().angle;
    // The camera's scroll in the turned sheet's own axes, so the streaks
    // stay over the ground they cross while the player walks.
    const along = cam.scrollX * v.x + cam.scrollY * v.y,
      across = -cam.scrollX * v.y + cam.scrollY * v.x;
    this.streaks.forEach((sheet, i) => {
      const run = frozen ? 0 : (i ? 190 : 300) * (0.5 + this.blown * 0.5) * (time / 1000);
      sheet.setRotation(angle);
      sheet.tilePositionX = (along - run) / sheet.tileScaleX;
      sheet.tilePositionY = across / sheet.tileScaleY;
    });
  }
}
