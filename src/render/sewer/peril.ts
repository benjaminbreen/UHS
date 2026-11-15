import Phaser from "phaser";
import { FALL_WARN, TUB_CELL, perilField, perilReach, type Peril } from "../../core/mine-peril";
import type { SewerLevel } from "../../world/sewer";
import { paintSewerObject } from "./art";
import { paletteOf } from "./terrain";
import type { SewerFrame, SewerSound } from "./view";

const WARN: Record<Peril["kind"], string> = {
  fall: "THE ROOF IS COMING IN · RUN",
  tub: "RUNAWAY · GET OFF THE RAILS",
  afterdamp: "AFTERDAMP · GET TO THE SHAFT",
  inrush: "WATER · GET OUT",
};

/** A mine accident on screen: the roof's shadow and dust before it falls,
 * the runaway on the rails, the afterdamp and the flood spreading through the
 * roads, and a banner saying what to do. */
export class PerilView {
  private g: Phaser.GameObjects.Graphics;
  private tub: Phaser.GameObjects.Image;
  private banner: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Graphics;
  private live = new Set<Phaser.GameObjects.GameObject>();
  private was?: Peril;
  private knocks = 0;
  private next = { dust: 0, crack: 0, shake: 0, tub: 0 };
  sound?: (what: SewerSound, volume: number) => void;

  constructor(private scene: Phaser.Scene, private level: SewerLevel) {
    // Above the darkness, so a warning reads beyond the lamp.
    this.g = scene.add.graphics().setDepth(3002);
    const key = `mine-runaway-${level.kind}`;
    if (!scene.textures.exists(key)) {
      const t = scene.textures.createCanvas(key, 16, 24)!;
      paintSewerObject(t.context, "tub", 0, 8, paletteOf(level), 0.9);
      t.refresh();
    }
    this.tub = scene.add.image(0, 0, key).setOrigin(0.5, 1).setVisible(false);
    const font = { fontFamily: "Silkscreen, monospace", fontSize: "12px", color: "#ffd8a0", stroke: "#1a0806", strokeThickness: 4 };
    this.banner = scene.add.text(0, 0, "", font).setDepth(1e7).setOrigin(0.5, 0.5).setVisible(false);
    this.arrow = scene.add.graphics().setDepth(1e7);
  }

  /** How thick the bad air is where the player stands, 0 to 1, to choke the lamp. */
  choke(f: SewerFrame) {
    const p = f.run.peril;
    if (p?.kind !== "afterdamp" || p.space !== this.level.space) return 0;
    const d = perilField(this.level, p.cells[0], f.solid)[Math.floor((f.y - 1) / 16) * this.level.w + Math.floor(f.x / 16)];
    return d >= 0 && d <= perilReach(p, f.clock) ? 1 : 0;
  }

  update(f: SewerFrame) {
    const { level, scene, g } = this, { w } = level, cam = scene.cameras.main, v = cam.worldView;
    const p = f.run.peril?.space === level.space ? f.run.peril : undefined;
    const now = f.time;
    g.clear();
    this.tub.setVisible(false);
    if (p && p !== this.was && p.start !== this.was?.start) this.begin(p);
    if (this.was && (!p || p.start !== this.was.start)) this.end(this.was, f);
    this.was = p;
    const knocks = f.run.trapped?.knocks ?? 0;
    if (knocks > this.knocks) {
      this.sound?.("knock", 1);
      scene.time.delayedCall(1400, () => this.sound?.("knock", 0.45));
    }
    this.knocks = knocks;
    const banner = p ? WARN[p.kind] : f.run.trapped ? "SHUT IN · KNOCK ON THE RAILS" : "";
    this.banner.setVisible(!!banner).setText(banner).setPosition(v.centerX, v.y + v.height * 0.16)
.setAlpha(p ? 0.75 + 0.25 * Math.sin(now / 90) : 0.8);
    this.arrow.clear();
    if (!p) return;
    const cell = (i: number) => ({ x: (i % w) * 16, y: Math.floor(i / w) * 16 });
    const seen = (x: number, y: number) => x > v.x - 32 && x < v.right + 16 && y > v.y - 32 && y < v.bottom + 16;
    if (p.kind === "fall") {
      const u = Math.max(0, Math.min(1, (f.clock - p.start) / FALL_WARN));
      // The roof's shadow on the floor, darkening as it lets go.
      for (const i of p.cells.slice(1)) {
        const c = cell(i);
        if (!seen(c.x, c.y)) continue;
        g.fillStyle(0x140806, 0.18 + 0.4 * u).fillRect(c.x + 1, c.y + 1, 14, 14);
        if (u > 0.6 && Math.floor(now / 120) % 2) g.lineStyle(1, 0xff6a3a, 0.5).strokeRect(c.x + 1.5, c.y + 1.5, 13, 13);
      }
      if (now > this.next.dust) {
        this.next.dust = now + 140 - u * 100;
        for (let k = 0; k < 1 + Math.floor(u * 3); k++) {
          const c = cell(p.cells[1 + Math.floor(Math.random() * (p.cells.length - 1))]);
          const x = c.x + Math.random() * 16, y = c.y + Math.random() * 12;
          this.drop(x, y - 34, y, Math.random() < 0.2 + u * 0.3 ? 2 : 1, 0xb8a890);
        }
      }
      if (now > this.next.crack) {
        this.next.crack = now + 900 - u * 650;
        this.sound?.(u > 0.5 ? "crack" : "creak", 0.6 + u * 0.4);
      }
      if (now > this.next.shake) {
        this.next.shake = now + 350;
        cam.shake(300, 0.0008 + u * 0.003);
      }
      return;
    }
    if (p.kind === "tub") {
      const t = (f.clock - p.start) / TUB_CELL, k = Math.min(p.cells.length - 1, Math.floor(t)), fr = Math.min(1, t - k);
      const a = cell(p.cells[Math.max(0, k)]), b = cell(p.cells[Math.min(p.cells.length - 1, k + 1)]);
      const x = a.x + (b.x - a.x) * fr + 8, y = a.y + (b.y - a.y) * fr + 16;
      this.tub.setVisible(true).setPosition(x, y).setDepth(3003).setTint(0xc8beae);
      // Chevrons along the rails ahead of it.
      for (let n = 1; n <= 6; n++) {
        const i = p.cells[k + n];
        if (i === undefined) break;
        const c = cell(i);
        if (Math.floor(now / 100 - n) % 3 === 0) g.fillStyle(0xff8a3a, 0.55).fillRect(c.x + 5, c.y + 6, 6, 4);
      }
      const near = Math.max(0, 1 - Math.hypot(x - f.x, y - f.y) / 220);
      if (now > this.next.tub) {
        this.next.tub = now + 90;
        this.spark(x + (Math.random() < 0.5 ? -5 : 4), y - 2, 0xffd890, 200);
        if (near > 0.3) cam.shake(120, 0.0015 + near * 0.004);
      }
      return;
    }
    const reach = perilReach(p, f.clock), dist = perilField(level, p.cells[0], f.solid);
    const water = p.kind === "inrush";
    const x0 = Math.max(0, Math.floor(v.x / 16) - 1), x1 = Math.min(w, Math.ceil(v.right / 16) + 1);
    const y0 = Math.max(0, Math.floor(v.y / 16) - 1), y1 = Math.min(level.h, Math.ceil(v.bottom / 16) + 1);
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const d = dist[y * w + x];
        if (d < 0 || d > reach) continue;
        const edge = reach - d < 1.4;
        const wave = Math.sin(now / 260 + x * 0.7 + y * 0.4);
        if (water) {
          g.fillStyle(0x2c3430, edge ? 0.35 : 0.55).fillRect(x * 16, y * 16 + 2, 16, 14);
          const r = (x * 7 + y * 13) % 9;
          g.fillStyle(0x7e8c84, 0.3 + 0.2 * wave).fillRect(x * 16 + r, y * 16 + 6 + (r % 3) * 3, 5, 1);
          if (edge) g.fillStyle(0xb8c0b0, 0.35 + 0.25 * wave).fillRect(x * 16 + ((r + Math.floor(now / 180)) % 12), y * 16 + 4 + (r % 4) * 2, 3, 1);
        } else g.fillStyle(0x1a1a16, (edge ? 0.25 : 0.5) + 0.08 * wave).fillRect(x * 16, y * 16 - 6, 16, 22);
      }
    // Spray from the face before it bursts.
    if (water && reach === 0) {
      const c = cell(p.cells[0]);
      for (let k = 0; k < 2; k++) this.spark(c.x + 4 + Math.random() * 8, c.y + 4, 0xd8e8f0, 300, 10 + Math.random() * 10);
    }
    this.pointOut(f);
  }

  /** An arrow at the edge of the screen toward the way out. */
  private pointOut(f: SewerFrame) {
    const s = this.level.shafts.find((q) => q.to === "street") ?? this.level.shafts[0];
    if (!s) return;
    const cam = this.scene.cameras.main, v = cam.worldView;
    const tx = s.x * 16 + 8, ty = s.y * 16 + 8;
    if (tx > v.x && tx < v.right && ty > v.y && ty < v.bottom) return;
    const a = Math.atan2(ty - f.y, tx - f.x), r = Math.min(v.width, v.height) * 0.38;
    const x = v.centerX + Math.cos(a) * r, y = v.centerY + Math.sin(a) * r, k = 6 / cam.zoom * 2;
    this.arrow.fillStyle(0xffd8a0, 0.6 + 0.4 * Math.sin(f.time / 120)).fillTriangle(
      x + Math.cos(a) * k * 1.6, y + Math.sin(a) * k * 1.6,
      x + Math.cos(a + 2.4) * k, y + Math.sin(a + 2.4) * k,
      x + Math.cos(a - 2.4) * k, y + Math.sin(a - 2.4) * k);
  }

  private begin(p: Peril) {
    this.sound?.(p.kind === "fall" ? "crack" : p.kind === "tub" ? "runaway" : p.kind === "afterdamp" ? "blast" : "rush", 1);
    if (p.kind === "afterdamp") this.scene.cameras.main.shake(600, 0.006);
  }

  /** The moment it ends: the roof down in a cloud, the runaway off the rails. */
  private end(p: Peril, f: SewerFrame) {
    const { w } = this.level;
    if (p.kind === "fall") {
      this.sound?.("fall", 1);
      this.scene.cameras.main.shake(550, 0.014);
      for (const i of p.cells.slice(1)) {
        const x = (i % w) * 16 + 8, y = Math.floor(i / w) * 16 + 8;
        for (let k = 0; k < 4; k++) {
          const puff = this.scene.add.ellipse(x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 10, 8, 6, 0x9a8c76, 0.4).setDepth(2995);
          this.live.add(puff);
          this.scene.tweens.add({ targets: puff, scale: 3 + Math.random() * 2, alpha: 0, x: `+=${(Math.random() - 0.5) * 40}`, y: `-=${6 + Math.random() * 18}`, duration: 900 + Math.random() * 900, ease: "Quad.easeOut", onComplete: () => (this.live.delete(puff), puff.destroy()) });
        }
        // Stones bouncing out of the fall.
        for (let k = 0; k < 2; k++) this.spark(x + (Math.random() - 0.5) * 12, y + 4, 0x3a342c, 500, -6 - Math.random() * 8, 2);
      }
    }
    if (p.kind === "tub" && p.hit === undefined) {
      const i = p.cells[p.cells.length - 1], x = (i % w) * 16 + 8, y = Math.floor(i / w) * 16 + 10;
      this.sound?.("fall", Math.max(0.2, 1 - Math.hypot(x - f.x, y - f.y) / 300));
      for (let k = 0; k < 14; k++) this.spark(x + (Math.random() - 0.5) * 12, y, 0x1c1a18, 600, -12 - Math.random() * 14, 2);
    }
  }

  private drop(x: number, from: number, to: number, size: number, color: number) {
    const r = this.scene.add.rectangle(x, from, size, size, color).setDepth(2996).setAlpha(0.9);
    this.live.add(r);
    this.scene.tweens.add({ targets: r, y: to, duration: 260 + Math.random() * 120, ease: "Quad.easeIn", onComplete: () => (this.live.delete(r), r.destroy()) });
  }

  private spark(x: number, y: number, color: number, life: number, vy = 0, size = 1) {
    const r = this.scene.add.rectangle(x, y, size, size, color).setDepth(2997);
    this.live.add(r);
    this.scene.tweens.add({ targets: r, alpha: 0, y: y + vy, duration: life, onComplete: () => (this.live.delete(r), r.destroy()) });
  }

  destroy() {
    for (const o of [this.g, this.tub, this.banner, this.arrow, ...this.live]) o.destroy();
  }
}
