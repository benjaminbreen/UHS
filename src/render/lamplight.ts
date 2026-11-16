import Phaser from "phaser";

/** Lightmap samples per cell edge. */
const SUB = 2;

type Grid = { w: number; h: number; cells: Uint8Array };

export type LampFrame = {
  /** The player's feet, in world pixels. */
  x: number;
  y: number;
  facing: number;
  delta: number;
  /** How far the carried light reaches, in cells; 0 for none. */
  reach: number;
  flick: number;
  /** The light's colour, as multipliers. */
  color: readonly number[];
  /** A torch beam that looks where the player looks, rather than a flame lit all round. */
  beam: boolean;
  /** Torches and lamps carried by other people, in world pixels. */
  carried: readonly { x: number; y: number }[];
  daylit: boolean;
};

/** The dark of an area lit by what is carried through it: a multiply map
 * drawn from two samples a cell, light stopped by walls, still light baked
 * in, and cells once seen kept faintly. Area cell 0 is wall. */
export class Lamplight {
  readonly vis: Uint8Array;
  readonly seen: Uint8Array;
  /** Light that does not move (daylight, fixed lamps), per sample, as rgb. */
  readonly still: Float32Array;
  readonly halo: Phaser.GameObjects.Image;
  readonly image: Phaser.GameObjects.Image;
  private map: Phaser.Textures.CanvasTexture;
  private small: CanvasRenderingContext2D;
  private data: ImageData;
  private cur: Float32Array;
  private at = -1;
  private aim = 0;

  /** `memory` is how bright a cell once seen stays, and one never seen; `floor`, the share of reach a beam keeps behind it. */
  constructor(private scene: Phaser.Scene, private key: string, private grid: Grid, private memory: [number, number], private floor: number) {
    const { w, h } = grid;
    const small = document.createElement("canvas");
    small.width = w * SUB;
    small.height = h * SUB;
    this.small = small.getContext("2d")!;
    // The game samples textures nearest-neighbour, so the light is smoothed
    // here, on the way from two samples a cell to eight pixels a cell.
    this.map = scene.textures.createCanvas(`${key}-light`, w * 8, h * 8)!;
    this.map.context.imageSmoothingEnabled = true;
    this.map.context.imageSmoothingQuality = "high";
    this.data = this.small.createImageData(w * SUB, h * SUB);
    this.cur = new Float32Array(w * SUB * h * SUB * 3);
    this.still = new Float32Array(w * SUB * h * SUB * 3);
    this.vis = new Uint8Array(w * h);
    this.seen = new Uint8Array(w * h);
    this.image = scene.add.image(0, 0, `${key}-light`).setOrigin(0, 0).setScale(2).setDepth(3000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    if (!scene.textures.exists("lamp-halo")) {
      const t = scene.textures.createCanvas("lamp-halo", 128, 128)!;
      const g = t.context.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(0.35, "rgba(255,255,255,0.2)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      t.context.fillStyle = g;
      t.context.fillRect(0, 0, 128, 128);
      t.refresh();
    }
    this.halo = scene.add.image(0, 0, "lamp-halo").setBlendMode(Phaser.BlendModes.ADD).setDepth(3001).setAlpha(0);
  }

  /** Adds a still light at a cell position, seen round walls as the player would see it. */
  addStill(cx: number, cy: number, radius: number, rgb: readonly number[], power: number, falloff = (d: number) => (1 - d * d) ** 1.4) {
    const { w, h } = this.grid, gw = w * SUB, st = this.still;
    const lit = new Uint8Array(w * h);
    fov(this.grid, Math.floor(cx), Math.floor(cy), Math.ceil(radius) + 1, lit);
    for (let gy = Math.max(0, Math.floor((cy - radius) * SUB)); gy < Math.min(h * SUB, (cy + radius) * SUB); gy++)
      for (let gx = Math.max(0, Math.floor((cx - radius) * SUB)); gx < Math.min(gw, (cx + radius) * SUB); gx++) {
        if (!lit[(gy >> 1) * w + (gx >> 1)]) continue;
        const d = Math.hypot((gx + 0.5) / SUB - cx, (gy + 0.5) / SUB - cy) / radius;
        if (d >= 1) continue;
        const L = falloff(d) * power, i = (gy * gw + gx) * 3;
        st[i] += L * rgb[0];
        st[i + 1] += L * rgb[1];
        st[i + 2] += L * rgb[2];
        this.seen[(gy >> 1) * w + (gx >> 1)] = 1;
      }
  }

  /** What the player can see from where they stand, out to `radius` cells. */
  look(x: number, y: number, radius: number) {
    const { w, h, cells } = this.grid;
    const cx = Math.max(0, Math.min(w - 1, Math.floor(x / 16))), cy = Math.max(0, Math.min(h - 1, Math.floor((y - 1) / 16)));
    if (cy * w + cx === this.at) return;
    this.at = cy * w + cx;
    fov(this.grid, cx, cy, radius, this.vis);
    // A back wall stands three cells tall over the floor it is seen from.
    for (let gy = 3; gy < h - 1; gy++) for (let gx = 0; gx < w; gx++)
      if (this.vis[gy * w + gx] && cells[gy * w + gx] === 0 && cells[(gy + 1) * w + gx] !== 0) this.vis[(gy - 1) * w + gx] = this.vis[(gy - 2) * w + gx] = 1;
  }

  update(f: LampFrame) {
    const { w, h } = this.grid;
    const want = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][f.facing] ?? 0;
    let turn = want - this.aim;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    this.aim += turn * Math.min(1, f.delta / 140);
    const px = f.x / 16, py = (f.y - 7) / 16, [seenMem, darkMem] = this.memory, fall = 1 - this.floor;
    const k = 1 - Math.exp(-f.delta / 80);
    const gw = w * SUB, out = this.data.data, cur = this.cur, st = this.still;
    // Only the samples near the camera change; the rest settle to what they were.
    const cam = this.scene.cameras.main.worldView;
    const x0 = Math.max(0, Math.floor((cam.x / 16 - 2) * SUB)), x1 = Math.min(gw, Math.ceil((cam.right / 16 + 2) * SUB));
    const y0 = Math.max(0, Math.floor((cam.y / 16 - 3) * SUB)), y1 = Math.min(h * SUB, Math.ceil((cam.bottom / 16 + 2) * SUB));
    for (let gy = y0; gy < y1; gy++)
      for (let gx = x0; gx < x1; gx++) {
        const cell = (gy >> 1) * w + (gx >> 1);
        const sx = (gx + 0.5) / SUB, sy = (gy + 0.5) / SUB;
        const dx = sx - px, dy = sy - py;
        const d = Math.hypot(dx, dy);
        let L = 0;
        if (f.daylit) L = 1;
        else if (f.reach > 0 && this.vis[cell]) {
          let r = f.reach;
          if (f.beam && d > 1.2) {
            let off = Math.abs(Math.atan2(dy, dx) - this.aim);
            if (off > Math.PI) off = Math.PI * 2 - off;
            r *= off < 0.55 ? 1 : off < 1.1 ? 1 - ((off - 0.55) / 0.55) * fall : this.floor;
          }
          const u = d / r;
          L = u >= 1 ? 0 : (1 - u * u) ** 0.8 * f.flick;
          if (L > 0.06) this.seen[cell] = 1;
        }
        let fr = 0;
        for (const c of f.carried) {
          const u = Math.hypot(sx - c.x / 16, sy - (c.y - 10) / 16) / 5;
          if (u < 1) fr += (1 - u * u) * 0.7;
        }
        const mem = this.seen[cell] ? seenMem : darkMem;
        const i = (gy * gw + gx) * 3, o = (gy * gw + gx) * 4;
        cur[i] += (Math.min(1, L * f.color[0] * 1.08 + st[i] + fr + mem * 0.62) - cur[i]) * k;
        cur[i + 1] += (Math.min(1, L * f.color[1] * 1.04 + st[i + 1] + fr * 0.8 + mem * 0.72) - cur[i + 1]) * k;
        cur[i + 2] += (Math.min(1, L * f.color[2] + st[i + 2] + fr * 0.55 + mem) - cur[i + 2]) * k;
        out[o] = cur[i] * 255;
        out[o + 1] = cur[i + 1] * 255;
        out[o + 2] = cur[i + 2] * 255;
        out[o + 3] = 255;
      }
    this.small.putImageData(this.data, 0, 0);
    this.map.context.drawImage(this.small.canvas, 0, 0, w * 8, h * 8);
    this.map.refresh();
  }

  destroy() {
    this.image.destroy();
    this.halo.destroy();
    if (this.scene.textures.exists(`${this.key}-light`)) this.scene.textures.remove(`${this.key}-light`);
  }
}

/** The lamp gauge in the corner, the label beside it, and the area's name fading in. */
export class LampHud {
  private g: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private banner: Phaser.GameObjects.Text;
  private born = 0;

  constructor(private scene: Phaser.Scene, name: string, ink: { text: string; stroke: string }) {
    this.g = scene.add.graphics().setDepth(1e7);
    const font = { fontFamily: "Silkscreen, monospace", fontSize: "8px", color: ink.text, stroke: ink.stroke, strokeThickness: 3 };
    this.label = scene.add.text(0, 0, "", font).setDepth(1e7).setOrigin(0, 0.5);
    this.banner = scene.add.text(0, 0, name[0].toUpperCase() + name.slice(1), { ...font, fontSize: "16px", strokeThickness: 4 }).setDepth(1e7).setOrigin(0.5, 0.5).setAlpha(0);
  }

  /** `paint` draws the gauge's own marks at its origin and returns the label. */
  update(time: number, paint: (g: Phaser.GameObjects.Graphics, x: number, y: number) => string) {
    if (!this.born) this.born = time;
    const cam = this.scene.cameras.main, v = cam.worldView;
    const x = v.x + 10, y = v.bottom - 62 / cam.zoom;
    this.g.clear();
    this.label.setPosition(x + 64, y).setText(paint(this.g, x, y));
    const age = time - this.born;
    this.banner.setPosition(v.centerX, v.y + v.height * 0.2).setAlpha(age < 600 ? age / 600 : age < 2600 ? 1 : Math.max(0, 1 - (age - 2600) / 900));
  }

  /** A flame's gauge: the wick, lit or dead, and the bar of what is left. */
  flame(time: number, lit: boolean, frac: number, label: string) {
    this.update(time, (g, x, y) => {
      g.fillStyle(0x120e0c, 0.85).fillRect(x - 2, y - 5, 62, 10);
      g.fillStyle(lit ? 0xffb040 : 0x5a5650).fillRect(x + 1, y - 2, 3, 4);
      if (lit) g.fillStyle(0xfff0a0).fillRect(x + 2, y - 3 - (Math.floor(time / 120) % 2), 1, 3);
      g.fillStyle(0x3a302a).fillRect(x + 7, y - 2, 50, 4);
      g.fillStyle(frac < 0.2 ? (Math.floor(time / 300) % 2 ? 0xe04a2a : 0xff8a4a) : 0xffc060).fillRect(x + 7, y - 2, Math.round(50 * frac), 4);
      g.fillStyle(0xfff0c0, 0.5).fillRect(x + 7, y - 2, Math.round(50 * frac), 1);
      return label;
    });
  }

  destroy() {
    for (const o of [this.g, this.label, this.banner]) o.destroy();
  }
}

/** Recursive shadowcasting: the cells seen from one cell, walls included. */
export function fov(grid: Grid, ox: number, oy: number, radius: number, out: Uint8Array) {
  const { w, h, cells } = grid;
  out.fill(0);
  if (ox < 0 || oy < 0 || ox >= w || oy >= h) return;
  out[oy * w + ox] = 1;
  const opaque = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || cells[y * w + x] === 0;
  const cast = (row: number, start: number, end: number, xx: number, xy: number, yx: number, yy: number) => {
    if (start < end) return;
    let next = 0, blocked = false;
    for (let dist = row; dist <= radius && !blocked; dist++) {
      const dy = -dist;
      for (let dx = -dist; dx <= 0; dx++) {
        const x = ox + dx * xx + dy * xy, y = oy + dx * yx + dy * yy;
        const l = (dx - 0.5) / (dy + 0.5), r = (dx + 0.5) / (dy - 0.5);
        if (start < r) continue;
        if (end > l) break;
        if (dx * dx + dy * dy <= radius * radius && x >= 0 && y >= 0 && x < w && y < h) out[y * w + x] = 1;
        if (blocked) {
          if (opaque(x, y)) next = r;
          else (blocked = false), (start = next);
        } else if (opaque(x, y) && dist < radius) {
          blocked = true;
          cast(dist + 1, start, l, xx, xy, yx, yy);
          next = r;
        }
      }
    }
  };
  const m = [[1, 0, 0, -1, -1, 0, 0, 1], [0, 1, -1, 0, 0, -1, 1, 0], [0, 1, 1, 0, 0, -1, -1, 0], [1, 0, 0, 1, -1, 0, 0, -1]];
  for (let o = 0; o < 8; o++) cast(1, 1, 0, m[0][o], m[1][o], m[2][o], m[3][o]);
}
