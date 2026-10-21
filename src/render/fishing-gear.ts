import type Phaser from "phaser";
import type { FishingMethod } from "../content/economy/fishing";

export type Gear = FishingMethod | "rope";

const CORK = 0xd9b26a, CORK_DARK = 0x6b4a26, ROPE = 0xb08850, MESH = 0x22383a, FOAM = 0xe4f5f2;
const BASKET = 0xa8864f, BASKET_DARK = 0x5f472b, STAKE = 0x4f3b2a, SILVER = 0xd3dde0;

/** What is in the water round someone fishing: the seine's float arc, a net's
 * float line, a hand line's bobber, trap stakes, a spearman's ripples, and the
 * rope a shore party hauls. Plain pixel marks, redrawn each frame. */
export class FishingGear {
  private drawn = new Map<string, Phaser.GameObjects.Graphics>();
  constructor(private scene: Phaser.Scene) {}

  draw(id: string, gear: Gear, x: number, y: number, toward: { x: number; y: number } | undefined, depth: number, time: number, salt: number) {
    let g = this.drawn.get(id);
    if (!g) this.drawn.set(id, (g = this.scene.add.graphics()));
    g.clear().setVisible(true).setDepth(depth - 0.6);
    const len = toward ? Math.hypot(toward.x - x, toward.y - y) : 0;
    // Toward the shore, and across it: the gear lies out on the open side.
    const ux = len ? (toward!.x - x) / len : 0, uy = len ? (toward!.y - y) / len : 1;
    const side = salt % 2 ? 1 : -1, px = -uy * side, py = ux * side;
    // Ground-plane offsets, `a` across the shore line and `b` toward it,
    // flattened for the oblique view.
    const at = (a: number, b: number): [number, number] => [x + px * a + ux * b, y - 2 + (py * a + uy * b) * 0.6];
    const dot = (ax: number, ay: number, w: number, h: number, color: number, alpha = 1) =>
      g!.fillStyle(color, alpha).fillRect(Math.round(ax), Math.round(ay), w, h);
    const float = (ax: number, ay: number, i: number) => {
      const bob = Math.round(Math.sin(time / 520 + i * 0.9 + salt) * 0.7);
      dot(ax - 2, ay + bob + 1, 4, 1, CORK_DARK);
      dot(ax - 2, ay + bob - 1, 4, 2, CORK);
      dot(ax - 1, ay + bob - 1, 1, 1, 0xf6e2ad);
    };
    const ring = (ax: number, ay: number, period: number, phase: number) => {
      const t = ((time + phase) % period) / period;
      if (t > 0.45) return;
      const r = 2 + t * 12, a = 0.8 * (1 - t / 0.45);
      for (let k = 0; k < 10; k++) dot(ax + Math.cos(k * 0.63) * r, ay + Math.sin(k * 0.63) * r * 0.5, 1, 1, FOAM, a);
    };
    const rope = (ax: number, ay: number, bx: number, by: number, sag: number, alpha = 1) => {
      const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay)));
      for (let i = 0; i <= n; i++) {
        const t = i / n, rx = ax + (bx - ax) * t, ry = ay + (by - ay) * t + Math.sin(t * Math.PI) * sag;
        dot(rx + 1, ry + 1, 1, 1, MESH, alpha * 0.35);
        dot(rx, ry, 1, 1, ROPE, alpha * (1 - t * 0.3));
      }
    };
    if (gear === "seine") {
      // A horseshoe of floats out on the open side, its mouth to the shore
      // where the two hauling ropes run in; the net shades the water inside.
      const arc: [number, number][] = [];
      for (let i = 0; i <= 22; i++) {
        const t = (-60 + (i / 22) * 300) * Math.PI / 180;
        arc.push(at(46 + Math.cos(t) * 54, -Math.sin(t) * 40 - 8));
      }
      g.fillStyle(MESH, 0.14).fillPoints(arc.map(([ax, ay]) => ({ x: ax, y: ay })), true);
      for (const [ax, ay] of arc) dot(ax, ay + 3, 1, 1, MESH, 0.45);
      for (const [i, [ax, ay]] of arc.entries()) float(ax, ay, i);
      for (const [ax, ay] of [arc[0], arc[arc.length - 1]]) {
        const [bx, by] = [ax + ux * 40, ay + uy * 24];
        rope(ax, ay, bx, by, 2, 0.9);
      }
      const [cx, cy] = at(46, -10);
      ring(cx, cy, 1700, salt * 37);
      ring(cx + px * 18, cy - 4, 2300, salt * 11 + 600);
      ring(cx - px * 14, cy + 3, 2900, salt * 5 + 1200);
    } else if (gear === "net") {
      for (let i = 1; i <= 10; i++) {
        const [ax, ay] = at(14 + i * 9, -4 - i * 1.5);
        dot(ax, ay + 3, 1, 1, MESH, 0.45);
        float(ax, ay, i);
      }
      // Every so often the near end comes up over the side, fish in the mesh.
      const lift = Math.sin(time / 1400 + salt);
      if (lift > 0.3) {
        const [bx, by] = at(12, 0);
        for (let i = 0; i < 6; i++) dot(bx - 5 + i * 2, by - 12, 1, 10, MESH, 0.75);
        for (let j = 0; j < 5; j++) dot(bx - 5, by - 12 + j * 2, 12, 1, MESH, 0.75);
        dot(bx - 2, by - 8, 3, 1, SILVER);
        if (lift > 0.65) dot(bx + 2, by - 5, 3, 1, SILVER);
        dot(bx, by - 1 + ((time / 90) % 4), 1, 1, FOAM, 0.9);
        dot(bx - 4, by + ((time / 110) % 4), 1, 1, FOAM, 0.9);
      }
    } else if (gear === "line") {
      const [bx, by] = at(30, -14);
      const dip = Math.sin(time / 260 + salt) > 0.9 ? 2 : 0;
      g.lineStyle(1, 0xe2dccb, 0.8).lineBetween(Math.round(x + px * 6), Math.round(y - 16), Math.round(bx), Math.round(by + dip - 2));
      dot(bx - 1, by + dip - 1, 3, 2, 0xc8452e);
      dot(bx - 1, by + dip - 3, 3, 2, 0xf2efe2);
      ring(bx, by + 1, dip ? 700 : 2600, salt * 3);
    } else if (gear === "trap") {
      for (let i = 0; i < 4; i++) {
        const [sx, sy] = at(18 + i * 12, -6 - i * 4);
        dot(sx, sy - 9, 2, 10, STAKE);
        dot(sx, sy - 9, 2, 1, 0x8a6a4a);
        dot(sx - 2, sy + 1, 6, 1, FOAM, 0.6);
      }
      if (Math.sin(time / 1700 + salt) > 0.25) {
        const [bx, by] = at(12, 0);
        dot(bx - 5, by - 14, 10, 7, BASKET_DARK);
        dot(bx - 4, by - 14, 8, 5, BASKET);
        for (let i = 0; i < 4; i++) dot(bx - 4 + i * 2, by - 14, 1, 5, BASKET_DARK);
        dot(bx - 1, by - 6, 3, 1, SILVER);
        dot(bx, by - 5 + ((time / 80) % 4), 1, 1, FOAM, 0.9);
      }
    } else if (gear === "spear") {
      const [ax, ay] = at(18, -6), [bx, by] = at(28, -16);
      ring(ax, ay, 1300, salt * 13);
      ring(bx, by, 1900, salt * 7 + 500);
    } else if (gear === "rope" && toward) {
      // Hand over hand from the bank, the rope out to the seine's floats.
      const reach = Math.max(len, 110), ex = x + ux * reach, ey = y - 6 + uy * reach * 0.8;
      const pull = Math.sin(time / 600 + salt) * 1.5;
      rope(x + ux * 3, y - 9, ex, ey, 3 + pull);
      for (let i = 0; i < 4; i++) float(ex + px * (i - 1.5) * 8, ey + py * (i - 1.5) * 4 - Math.abs(i - 1.5) * 2, i);
    }
  }
  hide(id: string) {
    this.drawn.get(id)?.setVisible(false);
  }
  remove(id: string) {
    this.drawn.get(id)?.destroy();
    this.drawn.delete(id);
  }
  dispose() {
    this.drawn.forEach((g) => g.destroy());
    this.drawn.clear();
  }
}
