import Phaser from "phaser";
import type { SmokeForm } from "../content/characters/smoking";
import type { CharacterPose } from "./characters/poses";

type Sprite = Phaser.GameObjects.Image;
type Pose = { pose: CharacterPose; from: number; until: number };

/** Each pipe as [along the stem, up from it, colour]; `slope` is the stem's
 * droop per pixel out from the mouth. The last entry is where it burns. */
const PIPES: Partial<Record<SmokeForm, { slope: number; px: [number, number, number][] }>> = {
  "clay-pipe": { slope: 0.3, px: [[1, 0, 0xeee8da], [2, 0, 0xeee8da], [3, 0, 0xe2dac8], [4, 0, 0xeee8da], [5, 0, 0xe2dac8], [6, 0, 0xeee8da], [6, 1, 0xe2dac8], [6, 2, 0x3a2a20]] },
  "long-pipe": { slope: 0.45, px: [[1, 0, 0x5a3a22], [2, 0, 0x5a3a22], [3, 0, 0x4a2e1a], [4, 0, 0x5a3a22], [5, 0, 0x4a2e1a], [6, 0, 0x5a3a22], [7, 0, 0x8a8478], [7, 1, 0x3a2a20]] },
  kiseru: { slope: 0.35, px: [[1, 0, 0xb89a4a], [2, 0, 0x3a2a1c], [3, 0, 0x3a2a1c], [4, 0, 0x3a2a1c], [5, 0, 0xb89a4a], [5, 1, 0x3a2a20]] },
  cigar: { slope: 0.1, px: [[1, 0, 0x6a4424], [2, 0, 0x5a3a1e], [3, 0, 0x6a4424], [4, 0, 0x8a8478]] },
  cigarette: { slope: 0.15, px: [[1, 0, 0xf4f2ec], [2, 0, 0xf4f2ec], [3, 0, 0xf4f2ec], [4, 0, 0x8a8478]] },
  chillum: { slope: 1, px: [[1, 0, 0xc49a6c], [2, 0, 0xb08454], [2, 1, 0xc49a6c], [3, 1, 0x3a2a20]] },
};
const EMBER = [0xff6a24, 0xffa040, 0xd04818];

/** People taking their tobacco, betel or snuff: in spells of a minute or two
 * a few times an hour, never at work or asleep. Drawn over the figure and
 * changing nothing in the engine. */
export class Smokers {
  private pipes = new Map<string, Phaser.GameObjects.Graphics>();
  private spells = new Map<string, { on: boolean; until: number; puff: number; draw: number }>();
  private seen = new Map<string, number>();
  private swept = 0;
  constructor(
    private scene: Phaser.Scene,
    private sneeze: (im: Sprite, x: number, y: number, dx: number, depth: number) => void,
    private stain: (x: number, y: number) => void,
  ) {}

  /** `free` is false while working, asleep or in the water. Returns a pose
   * to hold while standing: the hand to the mouth. */
  update(id: string, form: SmokeForm | undefined, im: Sprite, direction: number, free: boolean, glow: number, time: number): Pose | undefined {
    if (time - this.swept > 1000) this.sweep(time);
    if (!form || !free) return this.hide(id);
    let spell = this.spells.get(id);
    if (!spell) this.spells.set(id, (spell = { on: false, until: time + Math.random() * 120000, puff: 0, draw: 0 }));
    if (time >= spell.until) {
      spell.on = !spell.on;
      // Betel is chewed most of the day; a pipe is a few spells an hour.
      spell.until = time + (spell.on ? (form === "betel" ? 300000 : 40000 + Math.random() * 50000) : 90000 + Math.random() * 150000);
      spell.draw = time + 1500 + Math.random() * 2500;
    }
    if (!spell.on) return this.hide(id);
    this.seen.set(id, time);
    const dx = [0, 1, 0, -1][direction];
    const mx = im.x + dx * 4, my = im.y - 26;
    const front = direction !== 0;
    const depth = im.depth + (front ? 0.1 : -0.1);
    if (form === "snuff" || form === "betel") {
      this.hide(id);
      if (time < spell.draw) return undefined;
      spell.draw = time + (form === "betel" ? 25000 + Math.random() * 40000 : 60000 + Math.random() * 120000);
      if (form === "betel") this.spit(mx, my, dx, im.y, depth);
      else if (Math.random() < 0.35) this.scene.time.delayedCall(700, () => im.active && this.sneeze(im, mx, my, dx, depth));
      return { pose: "touch-face", from: time, until: time + 640 };
    }
    const pipe = PIPES[form]!;
    let g = this.pipes.get(id);
    if (!g) this.pipes.set(id, (g = this.scene.add.graphics()));
    g.clear().setDepth(depth).setVisible(front);
    let tip = { x: mx, y: my - 6 };
    pipe.px.forEach(([a, u, color], i) => {
      // Facing the viewer, the stem hangs down and a little aside.
      const x = dx ? Math.round(mx + dx * a) : Math.round(mx + 1 + a / 3);
      const y = Math.round(my + (dx ? a * pipe.slope : 1 + a * 0.7) - u);
      const last = i === pipe.px.length - 1;
      const drawing = time - spell!.draw > -900 && time - spell!.draw < 300;
      // A dark underside, so a pale stem still reads against a pale face.
      if (!last && !u) g!.fillStyle(0x3a2e26, 0.55).fillRect(x, y + 1, 1, 1);
      g!.fillStyle(last ? EMBER[drawing ? 1 : Math.floor(time / 180) % 3 === 0 ? 2 : 0] : color, last && !drawing ? 0.85 : 1).fillRect(x, y, 1, 1);
      if (last) {
        tip = { x, y };
        if (glow > 0.2) g!.fillStyle(0xff8a30, 0.25 * glow * (drawing ? 1.6 : 1)).fillRect(x - 1, y - 1, 3, 3);
      }
    });
    if (time >= spell.puff) {
      spell.puff = time + 450 + Math.random() * 450;
      this.wisp(tip.x, tip.y - 1, depth);
    }
    if (time >= spell.draw) {
      spell.draw = time + 4000 + Math.random() * 4000;
      this.exhale(mx, my, dx, depth);
      if (form === "chillum") return { pose: "touch-face", from: time - 300, until: time + 600 };
    }
    return undefined;
  }

  private hide(id: string) {
    this.pipes.get(id)?.destroy();
    this.pipes.delete(id);
    return undefined;
  }

  /** Off screen or gone: drop what was drawn for them. */
  private sweep(time: number) {
    this.swept = time;
    for (const [id, at] of this.seen)
      if (time - at > 1000) {
        this.hide(id);
        this.seen.delete(id);
      }
  }

  /** A thread of smoke off the bowl, wavering up. */
  private wisp(x: number, y: number, depth: number) {
    const bit = this.scene.add.rectangle(x, y, 1, 1, 0xd8d8d4).setAlpha(0.7).setDepth(depth);
    const t = { v: 0 }, phase = Math.random() * 6, lean = (Math.random() - 0.3) * 3;
    this.scene.tweens.add({
      targets: t,
      v: 1,
      duration: 1500 + Math.random() * 500,
      onUpdate: () => bit.setPosition(x + Math.sin(phase + t.v * 7) * 1.2 + lean * t.v, y - 13 * t.v).setScale(1 + t.v * 1.5).setAlpha(0.7 * (1 - t.v)),
      onComplete: () => bit.destroy(),
    });
  }

  /** The draw let out: a grey cloud from the mouth that rolls forward and up. */
  private exhale(x: number, y: number, dx: number, depth: number) {
    for (let i = 0; i < 4; i++) {
      const rect = this.scene.add
        .rectangle(x + dx * (2 + i), y + (i % 2), i ? 3 : 2, 2, i % 2 ? 0xc8c8c4 : 0xdcdcd8)
        .setAlpha(0.8)
        .setDepth(depth);
      this.scene.tweens.add({
        targets: rect,
        x: rect.x + (dx ? dx * (6 + i * 3) : (i - 1.5) * 4),
        y: rect.y - 6 - i * 2,
        scaleX: 2,
        scaleY: 1.6,
        alpha: 0,
        delay: i * 90,
        duration: 1300 + i * 200,
        ease: "Sine.easeOut",
        onComplete: () => rect.destroy(),
      });
    }
  }

  /** Betel spit: a red arc to the ground, and the stain it leaves. */
  private spit(x: number, y: number, dx: number, ground: number, depth: number) {
    const drop = this.scene.add.rectangle(x, y, 1, 1, 0xa8201c).setDepth(depth);
    const out = dx || (Math.random() < 0.5 ? -1 : 1), t = { v: 0 };
    this.scene.tweens.add({
      targets: t,
      v: 1,
      duration: 420,
      onUpdate: () => drop.setPosition(x + out * 9 * t.v, y + (ground - y + 2) * t.v * t.v - 4 * t.v),
      onComplete: () => {
        drop.destroy();
        this.stain(x + out * 9, ground + 2);
      },
    });
  }

  dispose() {
    for (const id of [...this.pipes.keys()]) this.hide(id);
    this.spells.clear();
    this.seen.clear();
  }
}
