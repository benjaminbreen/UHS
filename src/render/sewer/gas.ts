import Phaser from "phaser";
import type { SewerLevel, SewerRoom } from "../../world/sewer";

const PUFF = 40, PUFFS = 4;
type Ink = { key: string; outline: number[]; shade: number[]; base: number[]; light: number[]; glow: number; pop: number; alpha: number };
/** Sewer gas is green; firedamp a pale blue shimmer that hangs at the roof; blackdamp dark and low. */
const INKS: Record<"sewer" | "fire" | "black", Ink> = {
  sewer: { key: "sewer-gas", outline: [58, 96, 30], shade: [112, 176, 52], base: [160, 222, 72], light: [222, 250, 140], glow: 0x8ad040, pop: 0xd4f080, alpha: 1 },
  fire: { key: "mine-firedamp", outline: [92, 112, 168], shade: [150, 172, 220], base: [190, 208, 240], light: [236, 244, 255], glow: 0x6080e0, pop: 0xe0ecff, alpha: 0.6 },
  black: { key: "mine-blackdamp", outline: [16, 14, 24], shade: [42, 38, 56], base: [62, 58, 78], light: [96, 92, 116], glow: 0x302a48, pop: 0x8a84a0, alpha: 0.85 },
};

/** Lumpy cartoon clouds: a few circles merged, outlined, lit from the top left. */
function paintPuffs(scene: Phaser.Scene, ink: Ink) {
  if (scene.textures.exists(ink.key)) return;
  const { outline: OUTLINE, shade: SHADE, base: BASE, light: LIGHT } = ink;
  const t = scene.textures.createCanvas(ink.key, PUFF * PUFFS + 8, PUFF)!;
  const img = t.context.createImageData(PUFF * PUFFS + 8, PUFF);
  for (let n = 0; n < PUFFS; n++) {
    let s = n * 977 + 13;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const blobs = Array.from({ length: 4 + n % 2 }, (_, k) => ({ x: 9 + k * 5 + rnd() * 4, y: 22 - rnd() * 8 - (k % 2) * 3, r: 6 + rnd() * 4 }));
    const inside = (x: number, y: number) => blobs.some((b) => (x - b.x) ** 2 + ((y - b.y) * 1.15) ** 2 < b.r * b.r);
    for (let y = 0; y < PUFF; y++)
      for (let x = 0; x < PUFF; x++) {
        if (!inside(x, y)) continue;
        const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
        const col = edge ? OUTLINE : !inside(x - 2, y - 3) ? LIGHT : !inside(x + 2, y + 3) ? SHADE : BASE;
        const i = (y * (PUFF * PUFFS + 8) + n * PUFF + x) * 4;
        img.data.set([col[0], col[1], col[2], edge ? 230 : 200], i);
      }
    t.add(`puff-${n}`, 0, n * PUFF, 0, PUFF, PUFF);
  }
  // A bubble: a ring with a glint.
  const bx = PUFF * PUFFS;
  for (const [x, y, c] of [[2, 0, OUTLINE], [3, 0, OUTLINE], [1, 1, OUTLINE], [4, 1, OUTLINE], [0, 2, OUTLINE], [5, 2, OUTLINE], [0, 3, OUTLINE], [5, 3, OUTLINE], [1, 4, OUTLINE], [4, 4, OUTLINE], [2, 5, OUTLINE], [3, 5, OUTLINE], [2, 1, LIGHT], [1, 2, LIGHT]] as const) img.data.set([c[0], c[1], c[2], 255], (y * (PUFF * PUFFS + 8) + bx + x) * 4);
  for (let y = 2; y < 4; y++) for (let x = 2; x < 5; x++) img.data.set([BASE[0], BASE[1], BASE[2], 120], (y * (PUFF * PUFFS + 8) + bx + x) * 4);
  img.data.set([BASE[0], BASE[1], BASE[2], 120], (1 * (PUFF * PUFFS + 8) + bx + 3) * 4);
  img.data.set([BASE[0], BASE[1], BASE[2], 120], (4 * (PUFF * PUFFS + 8) + bx + 2) * 4);
  t.context.putImageData(img, 0, 0);
  t.add("bubble", 0, bx, 0, 6, 6);
  t.refresh();
}

type Cloud = { im: Phaser.GameObjects.Image; x: number; y: number; phase: number; room: SewerRoom; ink: Ink };
type Glow = { im: Phaser.GameObjects.Image; room: SewerRoom };

/** Poison gas over the foul rooms and pockets, drawn above the darkness so it
 * glows a little, once the player has seen where it lies. */
export class Gas {
  private clouds: Cloud[] = [];
  private glows: Glow[] = [];
  private bubbles = new Set<Phaser.GameObjects.GameObject>();
  private next = 0;
  private shown = new Map<SewerRoom, number>();

  constructor(private scene: Phaser.Scene, private level: SewerLevel) {
    for (const ink of Object.values(INKS)) paintPuffs(scene, ink);
    let n = 0;
    for (const room of level.rooms) {
      if (!room.foul) continue;
      const ink = INKS[room.damp ?? "sewer"];
      this.shown.set(room, 0);
      // A sickly light of its own, so the gas shows in the dark.
      const glow = scene.add.image((room.x + room.w / 2) * 16, (room.y + room.h / 2) * 16, "sewer-halo").setDisplaySize(room.w * 16 + 64, room.h * 16 + 48).setTint(ink.glow).setBlendMode(Phaser.BlendModes.ADD).setDepth(3001.5).setAlpha(0);
      this.glows.push({ im: glow, room });
      for (let y = 0; y < room.h; y += 2)
        for (let x = 0; x < room.w; x += 2.5) {
          // Firedamp is lighter than air and gathers under the roof; blackdamp lies along the floor.
          const cx = (room.x + x + 0.5 + ((n * 37) % 10) / 10) * 16, cy = (room.y + y + 0.5) * 16 + (room.damp === "fire" ? -14 : room.damp === "black" ? 6 : 0);
          const im = scene.add.image(cx, cy, ink.key, `puff-${n % PUFFS}`).setDepth(3002 + cy / 1e5).setAlpha(0).setFlipX(n % 3 === 0);
          this.clouds.push({ im, x: cx, y: cy, phase: n * 1.7, room, ink });
          n++;
        }
    }
  }

  inside(px: number, py: number) {
    return this.level.rooms.find((r) => r.foul && px >= (r.x - 1) * 16 && px < (r.x + r.w + 1) * 16 && py >= (r.y - 1) * 16 && py < (r.y + r.h + 1) * 16);
  }

  /** `seen` says whether a cell has been lit; gas not yet found stays hidden. */
  update(time: number, delta: number, seen: (x: number, y: number) => boolean, player: { x: number; y: number }) {
    const t = time / 1000, k = Math.min(1, delta / 400);
    for (const [room, a] of this.shown) {
      let any = false;
      for (let y = room.y; y < room.y + room.h && !any; y++) for (let x = room.x; x < room.x + room.w && !any; x++) any = seen(x, y);
      this.shown.set(room, a + ((any ? 1 : 0) - a) * k);
    }
    for (const g of this.glows) g.im.setAlpha(this.shown.get(g.room)! * (0.45 + Math.sin(t * 1.3 + g.room.x) * 0.08));
    for (const c of this.clouds) {
      const a = this.shown.get(c.room)!;
      const breathe = 1 + Math.sin(t * 0.9 + c.phase) * 0.07;
      c.im
        .setPosition(Math.round(c.x + Math.sin(t * 0.35 + c.phase) * 7), Math.round(c.y + Math.cos(t * 0.28 + c.phase * 1.3) * 3))
        .setScale(Math.round(breathe * 20) / 20)
        .setAlpha(a * c.ink.alpha * (0.8 + Math.sin(t * 0.6 + c.phase * 2) * 0.1));
    }
    if (time > this.next) {
      this.next = time + 180;
      const lit = this.clouds.filter((c) => this.shown.get(c.room)! > 0.5);
      const c = lit[Math.floor(Math.random() * lit.length)];
      if (c) this.bubble(c.im.x + (Math.random() - 0.5) * 24, c.im.y + 6, 1, c.ink);
      // Someone in the gas breathes it: a green cough at the mouth.
      const room = this.inside(player.x, player.y);
      if (room && Math.random() < 0.3) this.bubble(player.x + (Math.random() - 0.5) * 6, player.y - 24, 0.7, INKS[room.damp ?? "sewer"]);
    }
  }

  private bubble(x: number, y: number, scale: number, ink: Ink) {
    const b = this.scene.add.image(Math.round(x), Math.round(y), ink.key, "bubble").setDepth(3003).setScale(scale).setAlpha(0.9);
    this.bubbles.add(b);
    this.scene.tweens.add({
      targets: b,
      y: y - 14 - Math.random() * 12,
      x: x + (Math.random() - 0.5) * 8,
      duration: 900 + Math.random() * 700,
      ease: "Sine.easeOut",
      onComplete: () => {
        // Pop: a few pixels flung out.
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + 0.6;
          const p = this.scene.add.rectangle(b.x, b.y, 1, 1, ink.pop).setDepth(3003);
          this.bubbles.add(p);
          this.scene.tweens.add({ targets: p, x: b.x + Math.cos(a) * 4, y: b.y + Math.sin(a) * 4, alpha: 0, duration: 220, onComplete: () => (this.bubbles.delete(p), p.destroy()) });
        }
        this.bubbles.delete(b);
        b.destroy();
      },
    });
  }

  destroy() {
    for (const c of this.clouds) c.im.destroy();
    for (const g of this.glows) g.im.destroy();
    for (const b of this.bubbles) b.destroy();
  }
}
