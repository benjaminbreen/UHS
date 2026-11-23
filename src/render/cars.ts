import type Phaser from "phaser";
import catalog from "../content/graphics/vehicles.generated.json" with { type: "json" };
import { CAR_HEADINGS, CAR_WAYS } from "../core/cars";

type Image = Phaser.GameObjects.Image;
type Entry = { car: Image; shade: Phaser.GameObjects.Ellipse; beams?: Phaser.GameObjects.Triangle; frame: string; cx: number; cy: number };
const models = catalog as Record<string, { cells: { x: number }; wide: number }>;

export interface CarPose {
  /** `vehicle-<model>-<paint>-<heading>`. */
  frame: string;
  /** The middle of the ground it stands on. */
  x: number;
  y: number;
  tint: number;
  /** Degrees of body roll. */
  roll?: number;
  /** Headlamps on. */
  lit?: boolean;
  dents?: number;
}

/** Cars that have left their stalls: the one being driven, ones left where
 * they were parked, and the traffic. A stall-parked car is an ordinary object. */
export class CarLayer {
  private entries = new Map<string, Entry>();
  constructor(
    private scene: Phaser.Scene,
    private texture: (frame: string) => string,
  ) {}

  /** Pixels a frame's footprint covers across and down the screen. */
  static plan(frame: string) {
    const [, model, , heading] = /^vehicle-(.+)-(\d+)-([a-z]+)$/.exec(frame) ?? [];
    const m = models[model] ?? { cells: { x: 4.5 }, wide: 1.8 }, long = m.cells.x * 16, wide = m.wide * 16;
    return heading === "e" || heading === "w" ? { w: long, h: wide / 2, turned: false }
      : heading === "n" || heading === "s" ? { w: wide * 1.18, h: long / 2, turned: false }
      : { w: (long + wide) * 0.72, h: (long + wide) * 0.36, turned: true };
  }

  has(id: string) {
    return this.entries.has(id);
  }
  image(id: string) {
    return this.entries.get(id)?.car;
  }

  pose(id: string, o: CarPose, fresh?: (im: Image) => void) {
    let e = this.entries.get(id);
    const plan = CarLayer.plan(o.frame);
    if (!e) {
      const car = this.scene.add.image(o.x, o.y, this.texture(o.frame), o.frame);
      e = { car, shade: this.scene.add.ellipse(o.x, o.y, 8, 8, 0x12161a, 0.34), frame: "", cx: o.x, cy: o.y };
      this.entries.set(id, e);
      fresh?.(car);
    }
    if (e.frame !== o.frame) {
      e.frame = o.frame;
      e.car.setTexture(this.texture(o.frame), o.frame);
      // A diagonal stands on the middle of its plan; a square-on frame is kerb-anchored, so place it by its size.
      if (plan.turned) e.car.setOriginFromFrame();
      else e.car.setOrigin(0.5, (e.car.height - 2 - plan.h / 2) / e.car.height);
      e.shade.setSize(plan.w * 0.96, plan.h * 1.15).setOrigin(0.5);
    }
    e.cx = o.x;
    e.cy = o.y;
    const x = Math.round(o.x), y = Math.round(o.y);
    e.car.setPosition(x, y).setDepth(y + plan.h / 2 + 2).setAngle(o.roll ?? 0).setVisible(true);
    const worn = Math.min(6, o.dents ?? 0), dim = (c: number) => Math.round(c * (1 - worn * 0.045));
    e.car.setTint(worn ? ((dim((o.tint >> 16) & 255) << 16) | (dim((o.tint >> 8) & 255) << 8) | dim(o.tint & 255)) : o.tint);
    e.shade.setPosition(x, y + 2).setDepth(y - plan.h / 2 - 4).setVisible(true);
    if (o.lit) {
      const facing = Math.max(0, CAR_HEADINGS.indexOf(o.frame.slice(o.frame.lastIndexOf("-") + 1) as "n"));
      const [fx, fy] = CAR_WAYS[facing], n = Math.hypot(fx, fy), ux = fx / n, uy = (fy / n) * 0.5;
      const nose = plan.turned ? plan.w * 0.36 : fx ? plan.w / 2 : plan.h;
      e.beams ??= this.scene.add.triangle(0, 0, 0, 0, 0, 0, 0, 0, 0xffe9a8, 0.16).setOrigin(0).setBlendMode("ADD");
      const ax = x + ux * nose, ay = y + uy * nose, far = 70;
      e.beams.setTo(ax, ay, ax + ux * far - uy * 44, ay + uy * far + ux * 22, ax + ux * far + uy * 44, ay + uy * far - ux * 22);
      e.beams.setDepth(y - plan.h / 2 - 3).setVisible(true);
    } else e.beams?.setVisible(false);
    return e.car;
  }

  sweep(seen: Set<string>) {
    for (const [id, e] of this.entries)
      if (!seen.has(id)) {
        e.car.destroy();
        e.shade.destroy();
        e.beams?.destroy();
        this.entries.delete(id);
      }
  }
  dispose() {
    this.sweep(new Set());
  }
}
