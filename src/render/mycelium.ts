import Phaser from "phaser";
import { random } from "../core/random";

type Pt = { x: number; y: number };
type Thread = { pts: Pt[]; root: boolean; phase: number };
type Image = Phaser.GameObjects.Image;

const ROOT = 0x7a4e2c,
  ROOT_LIGHT = 0xa8764a,
  HYPHA = 0xf2e8c8,
  PULSE = 0xfff0a8;
const REACH = 170;
const GROW_MS = 1400;

/** A selected tree's roots and the fungal threads joining it to its
 * neighbours, drawn on the ground under the sprites. Pixels, not smooth
 * lines, and seeded by the tree so it is the same web every time. */
export class Mycelium {
  private web: Phaser.GameObjects.Graphics;
  private pulses: Phaser.GameObjects.Graphics;
  private threads: Thread[] = [];
  private target?: Phaser.GameObjects.Image;
  private since = 0;
  private drawn = -1;

  constructor(scene: Phaser.Scene, depth: number) {
    this.web = scene.add.graphics().setDepth(depth);
    this.pulses = scene.add
      .graphics()
      .setDepth(depth + 0.1)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  update(time: number, seed: string, tree: Image | undefined, trees: Image[]) {
    if (!tree || !tree.visible) {
      if (this.target) this.hide();
      return;
    }
    if (tree !== this.target) {
      this.target = tree;
      this.drawn = -1;
      this.since = time;
      this.threads = weave(seed, tree, trees);
    }
    const grown = Math.min(1, (time - this.since) / GROW_MS);
    if (grown !== this.drawn) this.drawWeb((this.drawn = grown));
    this.drawPulses(time, grown);
  }

  private hide() {
    this.target = undefined;
    this.drawn = -1;
    this.web.clear().setVisible(false);
    this.pulses.clear().setVisible(false);
  }

  private drawWeb(grown: number) {
    const g = this.web.clear().setVisible(true);
    for (const t of this.threads) {
      // Roots show first; the fungus follows them out.
      const share = t.root
        ? Math.min(1, grown * 2)
        : Math.max(0, grown * 1.6 - 0.5);
      const n = Math.floor(t.pts.length * share);
      for (let i = 0; i < n; i++) {
        const p = t.pts[i];
        if (t.root) {
          const thick = i < t.pts.length * 0.4;
          g.fillStyle(ROOT, 0.85).fillRect(p.x, p.y, thick ? 2 : 1, 1);
          if (thick) g.fillStyle(ROOT_LIGHT, 0.9).fillRect(p.x, p.y - 1, 1, 1);
        } else g.fillStyle(HYPHA, 0.5).fillRect(p.x, p.y, 1, 1);
      }
    }
  }

  private drawPulses(time: number, grown: number) {
    const g = this.pulses.clear().setVisible(grown >= 1);
    if (grown < 1) return;
    for (const t of this.threads) {
      if (t.root) continue;
      // Sugar out along the threads, one bead each way, slow as sap.
      for (const dir of [1, -1]) {
        const f = (time / 2600 + t.phase + (dir < 0 ? 0.5 : 0)) % 1;
        const i = Math.floor((dir > 0 ? f : 1 - f) * (t.pts.length - 1));
        const p = t.pts[i];
        const a = Math.sin(f * Math.PI);
        g.fillStyle(PULSE, 0.9 * a).fillRect(p.x, p.y, 1, 1);
        g.fillStyle(PULSE, 0.35 * a).fillRect(p.x - 1, p.y, 3, 1);
      }
    }
  }
}

/** Rasterise a wandering path from a to b: one pixel per step. */
function wander(a: Pt, b: Pt, rand: () => number, sway: number): Pt[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const steps = Math.max(2, Math.round(len));
  const nx = -(b.y - a.y) / len,
    ny = (b.x - a.x) / len;
  const f1 = 1 + rand() * 2,
    f2 = 3 + rand() * 4,
    p1 = rand() * 6.3,
    p2 = rand() * 6.3;
  const out: Pt[] = [];
  let last = "";
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const env = Math.sin(t * Math.PI);
    const off =
      env *
      sway *
      (Math.sin(t * f1 * Math.PI + p1) +
        0.35 * Math.sin(t * f2 * Math.PI + p2));
    const x = Math.round(a.x + (b.x - a.x) * t + nx * off);
    const y = Math.round(a.y + (b.y - a.y) * t + ny * off);
    const key = `${x},${y}`;
    if (key !== last) out.push({ x, y });
    last = key;
  }
  return out;
}

function weave(seed: string, tree: Image, trees: Image[]): Thread[] {
  const foot = { x: Math.round(tree.x), y: Math.round(tree.y) - 2 };
  let n = 0;
  const rand = () => random(seed, "mycelium", foot.x, foot.y, n++);
  const threads: Thread[] = [];
  // The ground is seen at a slant, so a root's spread is squashed north-south.
  const tips: Pt[] = [];
  const roots = 7 + Math.floor(rand() * 4);
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * Math.PI * 2 + rand() * 0.5;
    const len = 16 + rand() * 20;
    const tip = {
      x: foot.x + Math.cos(a) * len,
      y: foot.y + Math.sin(a) * len * 0.5,
    };
    threads.push({ pts: wander(foot, tip, rand, 3), root: true, phase: 0 });
    const mid = { x: (foot.x + tip.x) / 2, y: (foot.y + tip.y) / 2 };
    const b = a + (rand() < 0.5 ? -0.7 : 0.7);
    threads.push({
      pts: wander(
        mid,
        {
          x: mid.x + Math.cos(b) * len * 0.4,
          y: mid.y + Math.sin(b) * len * 0.2,
        },
        rand,
        1.5,
      ),
      root: true,
      phase: 0,
    });
    tips.push(tip);
  }
  const neighbours = trees
    .filter((t) => t !== tree && t.active)
    .map((t) => ({ t, d: Math.hypot(t.x - tree.x, t.y - tree.y) }))
    .filter(({ d }) => d > 8 && d < REACH)
    .sort((a, b) => a.d - b.d)
    .slice(0, 10);
  for (const { t } of neighbours) {
    const to = { x: Math.round(t.x), y: Math.round(t.y) - 2 };
    const from = tips.reduce((best, p) =>
      Math.hypot(p.x - to.x, p.y - to.y) <
      Math.hypot(best.x - to.x, best.y - to.y)
        ? p
        : best,
    );
    for (let k = 0; k < 2; k++)
      threads.push({
        pts: wander(from, to, rand, 5 + rand() * 6),
        root: false,
        phase: rand(),
      });
  }
  // Loose hyphae feeling out into the soil, joined to nothing yet.
  for (const tip of tips)
    for (let k = 0; k < 3; k++) {
      const a = rand() * Math.PI * 2;
      const len = 14 + rand() * 26;
      threads.push({
        pts: wander(
          tip,
          { x: tip.x + Math.cos(a) * len, y: tip.y + Math.sin(a) * len * 0.5 },
          rand,
          2,
        ),
        root: false,
        phase: rand(),
      });
    }
  return threads.filter((t) => t.pts.length > 1);
}
