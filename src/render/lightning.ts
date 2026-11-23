import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import type { Signal } from "../core/combat";

/** Within this many pixels the thunder cracks rather than rolls. */
const CLOSE = 200;

/** A storm's lightning: the whole view flashes, sometimes a bolt comes down
 * in sight, and the thunder follows by the distance. A strike the engine
 * lands (a `lightning` signal) comes down on its cell. */
export class Lightning {
  private storm = 0;
  private outdoors = false;
  private next = 0;
  private flash?: Phaser.GameObjects.Rectangle;
  private bolt?: Phaser.GameObjects.Graphics;
  private struck?: { at: number; peak: number };
  private boltUntil = 0;
  private seen = 0;

  constructor(private scene: Phaser.Scene) {}

  set(storm: number, outdoors: boolean) {
    this.storm = storm;
    this.outdoors = outdoors;
  }

  consume(signals: readonly Signal[], time: number) {
    for (const s of signals) {
      if (s.serial <= this.seen) continue;
      this.seen = s.serial;
      if (s.kind === "lightning") this.strike(s.at.x * 16 + 8, s.at.y * 16 + 16, time);
    }
  }

  update(time: number, frozen: boolean) {
    if (!frozen && this.storm > 0.05 && time >= this.next) {
      if (this.next) this.random(time);
      // A strike every half-minute or so in a full storm, rarer as it eases.
      this.next = time + (6000 + Math.random() * 30000) / this.storm;
    }
    if (this.storm <= 0.05) this.next = 0;
    this.draw(time);
  }

  private random(time: number) {
    const view = this.scene.cameras.main.worldView;
    if (this.outdoors && Math.random() < 0.35) {
      this.strike(view.x + view.width * (0.1 + Math.random() * 0.8), view.y + view.height * (0.3 + Math.random() * 0.6), time);
      return;
    }
    // Sheet lightning behind the cloud: a glow and a far roll.
    this.struck = { at: time, peak: (this.outdoors ? 0.22 : 0.08) + Math.random() * 0.12 };
    gameAudio()?.thunder(1.5 + Math.random() * 5, false);
  }

  private strike(x: number, y: number, time: number) {
    const cam = this.scene.cameras.main;
    const near = Math.hypot(x - cam.midPoint.x, y - cam.midPoint.y);
    this.struck = { at: time, peak: this.outdoors ? 0.55 : 0.12 };
    gameAudio()?.thunder(0.05 + near / 900, near < CLOSE);
    if (!this.outdoors) return;
    const g = (this.bolt ??= this.scene.add.graphics().setDepth(19001.5));
    g.clear();
    const top = cam.worldView.y - 24;
    const path = jag(x + (Math.random() - 0.5) * 60, top, x, y);
    const branches = [1, 2].map(() => {
      const from = path[Math.floor(path.length * (0.25 + Math.random() * 0.4))];
      const side = Math.random() < 0.5 ? -1 : 1;
      return jag(from.x, from.y, from.x + side * (20 + Math.random() * 30), from.y + 30 + Math.random() * 40);
    });
    for (const [width, colour, alpha] of [[6, 0x8fa8ff, 0.3], [2, 0xffffff, 1]] as const) {
      g.lineStyle(width, colour, alpha);
      g.strokePoints(path);
      g.lineStyle(Math.max(1, width - 2), colour, alpha * 0.7);
      for (const b of branches) g.strokePoints(b);
    }
    // Where it lands: a white burst on the ground.
    g.fillStyle(0xffffff, 0.9).fillEllipse(x, y, 14, 6);
    this.boltUntil = time + 170;
  }

  private draw(time: number) {
    const s = this.struck;
    // Two flickers and a fade: the leader, the return stroke, the afterglow.
    const t = s ? time - s.at : Infinity;
    const level = !s ? 0 : t < 50 ? s.peak * 0.7 : t < 90 ? s.peak * 0.15 : t < 140 ? s.peak : Math.max(0, s.peak * (1 - (t - 140) / 320));
    if (s && level <= 0) this.struck = undefined;
    if (level > 0) {
      const w = this.scene.scale.width * 6, h = this.scene.scale.height * 6;
      (this.flash ??= this.scene.add.rectangle(0, 0, 16, 16, 0xe8eeff).setOrigin(0).setScrollFactor(0).setDepth(19002))
        .setSize(w, h)
        .setPosition(-w / 2.4, -h / 2.4);
    }
    this.flash?.setVisible(level > 0).setAlpha(level);
    // The bolt shows only while the flash is lit, so it flickers with it.
    this.bolt?.setVisible(time < this.boltUntil && (t < 50 || t >= 90));
  }

  dispose() {
    this.flash?.destroy();
    this.bolt?.destroy();
  }
}

/** A jagged line from the cloud to the ground, on whole pixels. */
function jag(x0: number, y0: number, x1: number, y1: number) {
  const steps = Math.max(3, Math.round((y1 - y0) / 11));
  const points: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const wobble = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 14;
    points.push(new Phaser.Math.Vector2(Math.round(x0 + (x1 - x0) * k + wobble), Math.round(y0 + (y1 - y0) * k)));
  }
  return points;
}
