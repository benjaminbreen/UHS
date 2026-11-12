import Phaser from "phaser";
import { SWIM_IMMERSION } from "./doll/draw";

type Ripple = {
  x: number;
  y: number;
  at: number;
  side: number;
  entry: boolean;
};
type Contact = {
  submerged: Phaser.GameObjects.Image;
  back: Phaser.GameObjects.Graphics;
  front: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  travel: number;
  foot: number;
  ripples: Ripple[];
  wake: { x: number; y: number; at: number; dx: number; dy: number }[];
  stroke: number;
};

const WAKE_MS = 1100;

export class WadingEffects {
  private contacts = new Map<string, Contact>();
  constructor(private scene: Phaser.Scene) {}

  frame(id: string) {
    const c = this.contacts.get(id);
    return c ? c.foot * 2 + (c.travel >= 3.5 ? 1 : 0) : 0;
  }

  update(
    id: string,
    body: Phaser.GameObjects.Image,
    depth: number,
    time: number,
    moving: boolean,
    flow: readonly [number, number] = [0, 0],
    /** The stroke's frame for a swimmer, who floats at a fixed waterline. */
    stroke?: number,
  ) {
    let c = this.contacts.get(id);
    const wet = depth > 0.025;
    if (!wet) {
      body.setCrop();
      body.setData("waterDepth", 0).setData("immersion", 0).setData("swimming", false);
      if (c) this.remove(id);
      return;
    }
    const swim = stroke !== undefined;
    const immersion = swim ? SWIM_IMMERSION : Math.max(1, Math.min(16, Math.round(depth * 19)));
    const waterline = Math.round(body.y - immersion);
    if (!c) {
      c = {
        submerged: this.scene.add
          .image(body.x, body.y, body.texture.key)
          .setOrigin(0.5, 1),
        back: this.scene.add.graphics(),
        front: this.scene.add.graphics(),
        x: body.x,
        y: body.y,
        travel: 0,
        foot: 0,
        ripples: [
          { x: body.x, y: waterline, at: time, side: 0, entry: moving },
        ],
        wake: [],
        stroke: -1,
      };
      this.contacts.set(id, c);
    }
    const distance = Math.hypot(body.x - c.x, body.y - c.y);
    if (moving && distance < 12) c.travel += distance;
    if (swim && moving && distance > 0.05 && distance < 12 && time - (c.wake.at(-1)?.at ?? -Infinity) > 70)
      c.wake.push({ x: body.x, y: waterline, at: time, dx: (body.x - c.x) / distance, dy: (body.y - c.y) / distance });
    c.x = body.x;
    c.y = body.y;
    if (swim) {
      c.travel = 0;
      // A splash as the hands sweep out through the surface; treading water rings slowly.
      if (stroke !== c.stroke && stroke === 1)
        c.ripples.push({ x: body.x, y: waterline + 1, at: time, side: 0, entry: moving });
      c.stroke = stroke;
    } else if (c.travel >= 7) {
      c.travel %= 7;
      c.foot = 1 - c.foot;
      c.ripples.push({
        x: body.x + (c.foot ? 3 : -3),
        y: waterline + 1,
        at: time,
        side: c.foot ? 1 : -1,
        entry: false,
      });
    }
    c.ripples = c.ripples.filter((r) => time - r.at < 850).slice(-8);
    c.wake = c.wake.filter((w) => time - w.at < WAKE_MS);
    body.setCrop(0, 0, 80, 80 - immersion);
    c.submerged
      .setTexture(body.texture.key)
      .setPosition(body.x, body.y)
      .setCrop(0, 80 - immersion, 80, immersion)
      .setTint(0x4cbcc4)
      .setAlpha(swim ? 0.22 : 0.38)
      .setDepth(body.depth - 0.02)
      .setVisible(body.visible);
    c.back
      .clear()
      .setDepth(body.depth - 0.03)
      .setVisible(body.visible);
    c.front
      .clear()
      .setDepth(body.depth + 0.03)
      .setVisible(body.visible);
    const arc = (
      g: Phaser.GameObjects.Graphics,
      x: number,
      y: number,
      rx: number,
      ry: number,
      start: number,
      end: number,
      alpha: number,
      color: number,
    ) => {
      g.fillStyle(color, alpha);
      for (let i = start; i <= end; i++) {
        const a = (i * Math.PI) / 16;
        g.fillRect(
          Math.round(x + Math.cos(a) * rx),
          Math.round(y + Math.sin(a) * ry),
          1,
          1,
        );
      }
    };
    for (const r of c.ripples) {
      const age = (time - r.at) / 850;
      const x = r.x + flow[0] * age * 3,
        y = r.y + flow[1] * age * 3;
      arc(
        c.back,
        x,
        y,
        4 + age * 10,
        1 + age * 4,
        16,
        31,
        (1 - age) * 0.5,
        0xc3f2e5,
      );
      arc(
        c.front,
        x,
        y,
        4 + age * 10,
        1 + age * 4,
        0,
        15,
        (1 - age) * 0.65,
        0xc3f2e5,
      );
      if (age < 0.32 && moving) {
        const t = age / 0.32;
        c.front.fillStyle(0xe3fff0, 1 - t);
        for (let k = 0; k < (r.entry ? 5 : 3); k++) {
          const spread = (k - (r.entry ? 2 : 1)) * (2 + t * 4);
          c.front.fillRect(
            Math.round(x + spread),
            Math.round(y - Math.sin(t * Math.PI) * (3 + (k % 2) * 2)),
            1,
            2 - Math.floor(t),
          );
        }
      }
    }
    // A V wake: each point left behind spreads both ways off the line of travel.
    for (const w of c.wake) {
      const age = (time - w.at) / WAKE_MS,
        spread = 2 + age * 9;
      const x = w.x + flow[0] * age * 4,
        y = w.y + flow[1] * age * 4;
      for (const side of [1, -1]) {
        const px = Math.round(x - w.dy * spread * side - w.dx * 2),
          py = Math.round(y + w.dx * spread * side * 0.5 - w.dy);
        const g = py > waterline ? c.front : c.back;
        g.fillStyle(0xc3f2e5, (1 - age) * 0.55);
        g.fillRect(px, py, 2, 1);
      }
    }
    const lap = Math.sin(time / 310 + body.x * 0.13);
    arc(c.back, body.x, waterline, 6, 2, 17, 31, 0.55, 0x319daf);
    arc(
      c.front,
      body.x,
      waterline + (lap > 0.5 ? 1 : 0),
      5 + (lap > 0 ? 1 : 0),
      1,
      1,
      14,
      0.65 + lap * 0.15,
      0xd8f8e8,
    );
    body.setData("waterDepth", depth).setData("immersion", immersion).setData("swimming", swim);
  }

  remove(id: string) {
    const c = this.contacts.get(id);
    if (!c) return;
    c.submerged.destroy();
    c.back.destroy();
    c.front.destroy();
    this.contacts.delete(id);
  }
  destroy() {
    for (const id of this.contacts.keys()) this.remove(id);
  }
}
