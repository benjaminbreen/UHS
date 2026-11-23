import type Phaser from "phaser";
import { cellHash } from "../core/noise";

type Break = { x: number; y: number; hole: boolean; at: number };
type Mark = { x: number; y: number; dx: number; dy: number; born: number };
type Glint = { x: number; y: number; born: number };

const GLINT_MS = 520;
const MARK_MS = 24000;

/** What moves on frozen water: glints that come and go, the scratches feet
 * and blades leave, the cracks of thin ice and the holes people go through. */
export class IceEffects {
  private g?: Phaser.GameObjects.Graphics;
  private marks: Mark[] = [];
  private glints: Glint[] = [];
  private nextGlint = 0;

  constructor(private scene: Phaser.Scene) {}

  /** A scratch along a step, at a foot in world pixels. */
  scratch(x: number, y: number, dx: number, dy: number, time: number) {
    this.marks.push({ x: Math.round(x), y: Math.round(y), dx, dy, born: time });
    if (this.marks.length > 160) this.marks.shift();
  }

  update(time: number, breaks: Iterable<Break>, iced: (x: number, y: number) => boolean, frozen = false) {
    const view = this.scene.cameras.main.worldView;
    if (!frozen && time >= this.nextGlint) {
      this.nextGlint = time + 90;
      const x = Math.floor((view.x + Math.random() * view.width) / 16),
        y = Math.floor((view.y + Math.random() * view.height) / 16);
      if (iced(x, y)) this.glints.push({ x: x * 16 + 2 + Math.floor(Math.random() * 12), y: y * 16 + 2 + Math.floor(Math.random() * 12), born: time });
    }
    this.glints = this.glints.filter((s) => time - s.born < GLINT_MS);
    this.marks = this.marks.filter((m) => time - m.born < MARK_MS);
    let any = this.glints.length + this.marks.length > 0;
    const shown: Break[] = [];
    for (const b of breaks) {
      any = true;
      if (b.x * 16 > view.x - 32 && b.x * 16 < view.right + 32 && b.y * 16 > view.y - 32 && b.y * 16 < view.bottom + 32) shown.push(b);
    }
    if (!any) return void this.g?.clear();
    const g = (this.g ??= this.scene.add.graphics().setDepth(-9998.3));
    g.clear();
    for (const m of this.marks) {
      g.fillStyle(0xf2fdff, 0.85 * (1 - (time - m.born) / MARK_MS));
      for (let i = 0; i < 7; i++) g.fillRect(m.x - m.dx * i, m.y - m.dy * i, 1, 1);
    }
    for (const b of shown) (b.hole ? this.hole : this.crack).call(this, g, b, time);
    for (const s of this.glints) {
      const t = (time - s.born) / GLINT_MS, r = t < 0.25 || t > 0.75 ? 0 : t < 0.4 || t > 0.6 ? 1 : 2;
      g.fillStyle(0xffffff, 1);
      g.fillRect(s.x, s.y, 1, 1);
      if (r) (g.fillRect(s.x - r, s.y, r * 2 + 1, 1), g.fillRect(s.x, s.y - r, 1, r * 2 + 1));
    }
  }

  /** Thin ice that took a step and held: white fractures running out from it. */
  private crack(g: Phaser.GameObjects.Graphics, b: Break) {
    const cx = b.x * 16 + 8, cy = b.y * 16 + 9;
    for (let arm = 0; arm < 6; arm++) {
      let x = cx, y = cy;
      const a = (arm / 6) * Math.PI * 2 + cellHash(b.x, b.y, 700 + arm) * 0.9;
      const reach = 5 + Math.floor(cellHash(b.x, b.y, 710 + arm) * 7);
      for (let i = 0; i < reach; i++) {
        const bend = (cellHash(b.x * 7 + i, b.y * 5 + arm, 720) - 0.5) * 1.1;
        x += Math.cos(a + bend);
        y += Math.sin(a + bend) * 0.75;
        g.fillStyle(i < 2 ? 0x3a7ccb : 0xf2fdff, 1);
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
  }

  /** A hole: black water, a broken white rim, and shards rocking in it. */
  private hole(g: Phaser.GameObjects.Graphics, b: Break, time: number) {
    const cx = b.x * 16 + 8, cy = b.y * 16 + 8;
    const rows = [6, 9, 11, 12, 13, 13, 13, 13, 12, 12, 11, 9, 6];
    const at = (i: number) => [Math.round((cellHash(b.x + i, b.y, 730) - 0.5) * 4), cy - 6 + i] as const;
    // Rim, outline, then water: each pass a pixel inside the last.
    for (const [grow, color] of [[3, 0xf6fcff], [1, 0x3a7ccb], [0, 0x24508c]] as const)
      rows.forEach((half, i) => {
        const [jag, y] = at(i);
        g.fillStyle(color, 1);
        g.fillRect(cx - half - grow + jag, y - (grow > 1 ? 1 : 0), (half + grow) * 2, grow > 1 ? 3 : 1);
      });
    g.fillStyle(0x1c3f73, 1);
    rows.slice(0, 4).forEach((half, i) => g.fillRect(cx - half + at(i)[0], at(i)[1], half * 2, 1));
    g.fillStyle(0xf6fcff, 1);
    for (let n = 0; n < 4; n++) {
      const bob = Math.round(Math.sin(time / 420 + n * 1.9));
      g.fillRect(cx - 9 + Math.floor(cellHash(b.x, b.y, 740 + n) * 16), cy - 2 + Math.floor(cellHash(b.x, b.y, 750 + n) * 6) + bob, 2 + (n & 1), 1 + ((n >> 1) & 1));
    }
  }
}
