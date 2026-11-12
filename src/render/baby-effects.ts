import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import { baby as voice } from "../audio/sfx";
import type { Baby, BabyMood } from "../core/baby";

/** Which side of the carrier the baby's head shows on, by the way they face
 * (north, east, south, west), and how far above the feet. */
const SIDE: Record<string, number[]> = { back: [5, -6, -8, 6], board: [0, -5, 0, 5], hip: [-6, 6, 6, -6], arms: [0, 5, -4, -5], pram: [0, 13, 0, -13] };
const HEAD: Record<string, number> = { back: 27, board: 31, hip: 22, arms: 21, pram: 13 };
const EVERY: Record<BabyMood, number> = { asleep: 0, watching: 9000, fussing: 3600, crying: 2700 };

/** The marks and sounds of a carried baby: a small z asleep, a note when it
 * coos, squiggles when it fusses, tears when it cries. The sprite holds the
 * pose; this is everything that moves. */
export class BabyEffects {
  private g?: Phaser.GameObjects.Graphics;
  private mood?: BabyMood;
  private next = 0;
  private note = -1e9;
  private played: number | undefined | null = null;
  constructor(private scene: Phaser.Scene, private entityAt: (id: string) => Phaser.GameObjects.Image | undefined) {}

  update(b: Baby | undefined, direction: number, time: number, carry = "back") {
    const image = b && this.entityAt(b.with);
    if (!b || !image?.active || !image.visible) {
      this.g?.destroy();
      this.g = undefined;
      this.mood = undefined;
      return;
    }
    const g = (this.g ??= this.scene.add.graphics()).clear();
    g.setDepth(image.y + 4700);
    const x = Math.round(image.x + SIDE[carry][direction & 3]), y = Math.round(image.y - HEAD[carry]);
    const near = b.with === "player" ? 1 : 0.5;
    const say = (kind: keyof typeof voice) =>
      void gameAudio()?.sound(voice[kind]().map((l) => ({ ...l, gain: l.gain * near })), `baby-${kind}`);

    if (b.mood !== this.mood) {
      if (this.mood && b.mood === "asleep") say("sigh");
      if (this.mood === "asleep" && b.mood === "watching") this.note = time;
      this.mood = b.mood;
      this.next = time + (b.mood === "watching" ? 2500 : 300);
    }
    if (b.played !== this.played) {
      if (this.played !== null && b.played !== undefined) {
        say("laugh");
        this.note = time;
        this.next = time + EVERY.watching;
      }
      this.played = b.played;
    }
    if (EVERY[b.mood] && time >= this.next) {
      this.next = time + EVERY[b.mood] * (0.8 + Math.random() * 0.5);
      say(b.mood === "watching" ? "coo" : b.mood === "fussing" ? "fuss" : "cry");
      if (b.mood === "watching") this.note = time;
    }

    if (b.mood === "asleep") {
      const t = (time / 2600) % 1;
      g.fillStyle(0xf0e6cf, 0.9 * (1 - t));
      const zx = x + Math.round(t * 4), zy = y - 4 - Math.round(t * 7);
      g.fillRect(zx, zy, 2, 1).fillRect(zx, zy + 1, 2, 1).fillRect(zx + 1, zy + 1, 1, 1);
      g.fillRect(zx, zy + 2, 2, 1);
    }
    const sung = (time - this.note) / 1100;
    if (sung >= 0 && sung < 1) {
      const nx = x + Math.round(Math.sin(sung * 6) * 2), ny = y - 5 - Math.round(sung * 9);
      g.fillStyle(0x2a2030, 1 - sung).fillRect(nx - 1, ny - 1, 5, 7);
      g.fillStyle(0xffe9a8, 1 - sung * sung);
      g.fillRect(nx + 2, ny, 1, 4).fillRect(nx, ny + 3, 2, 2).fillRect(nx + 2, ny, 2, 1);
    }
    if (b.mood === "fussing") {
      const beat = Math.floor(time / 260) % 2;
      g.fillStyle(0x2a2030, 1);
      for (const [dx, dy] of [[-4, -3], [4, -4]]) {
        const sx = x + dx, sy = y + dy - beat;
        g.fillRect(sx, sy, 1, 1).fillRect(sx + 1, sy - 1, 1, 1).fillRect(sx + 2, sy, 1, 1);
      }
    }
    if (b.mood === "crying") {
      // Short shout lines, then tears thrown out to either side.
      const pulse = Math.floor(time / 180) % 3;
      g.fillStyle(0x2a2030, 1);
      for (const [dx, dy] of [[-5, -4], [0, -7], [5, -4]])
        g.fillRect(x + dx + Math.sign(dx) * pulse, y + dy - pulse, 1, dx ? 1 : 2);
      for (let i = 0; i < 4; i++) {
        const t = ((time / 700 + i * 0.25) % 1), side = i % 2 ? 1 : -1;
        const tx = x + side * (3 + t * 6), ty = y + 1 - Math.sin(t * Math.PI) * 5 + t * 5;
        g.fillStyle(0xbfe6ff, 1 - t * 0.6).fillRect(Math.round(tx), Math.round(ty), 1, 2);
      }
    }
  }
  dispose() {
    this.g?.destroy();
    this.g = undefined;
  }
}
