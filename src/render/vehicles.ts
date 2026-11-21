import type Phaser from "phaser";
import { crewHands } from "./characters/doll/draw";
import type { Actor } from "../core/types";
import art from "../content/graphics/conveyances.generated.json" with { type: "json" };
import { vehicleAt, type Vehicle } from "../world/v3/conveyances";

type Art = { size: [number, number]; anchor: [number, number]; crew: Record<string, [number, number, number, string, boolean][]> };
const models = art as unknown as Record<string, Art>;

/** Where a vehicle is drawn: its anchor in world pixels, its facing, and the
 * depth its crew are sorted about -- the back layer just under, the front
 * just over. */
export type VehiclePose = { x: number; y: number; facing: number; depth: number };

export function ploughStep(work: Actor["plough"], clock: number) {
  if (!work || !work.step) return 0;
  return work.step - Math.min(1, Math.max(0, 1 - (clock - work.at) / 6));
}

export function vehiclePose(v: Vehicle, clock: number, step?: number): VehiclePose {
  const at = vehicleAt(v, clock, step);
  const angle = at.heading, lead = v.rowLength ? 17 : 0;
  const y = at.y * 16 + 12 - Math.cos(angle) * lead * 0.5;
  return { x: at.x * 16 + 8 + Math.sin(angle) * lead, y, facing: at.facing, depth: y + 2 };
}

/** A crew place in world pixels for the vehicle's current facing: where the
 * person's feet go, whether they sit, and how near the viewer they are. */
export function crewPlace(v: Vehicle, pose: VehiclePose, place: number) {
  const slot = models[v.model]?.crew[String(pose.facing)]?.[place];
  if (!slot) return undefined;
  const [dx, dy, near, posture] = slot;
  const role: "guide-plough" | "drive-cart" | "sit-seat" | "idle" = posture === "walk" ? "guide-plough" : posture === "sit" ? (place === 0 ? "drive-cart" : "sit-seat") : "idle";
  return { x: pose.x + dx, y: pose.y + dy + (posture === "sit" ? 10 : 3), role, depth: pose.depth - near * 0.01 };
}

export function crewFrame(role: string, along: number, moving: boolean) {
  return moving ? Math.floor(along * 5) % (role === "guide-plough" ? 8 : 4) : 0;
}

/** The vehicles of the settlement the player is in, each as the layer behind
 * its crew and the layer in front of them. The crew are the scene's own
 * people, drawn between. */
export class VehicleLayer {
  private images = new Map<string, {
    gear: Phaser.GameObjects.Image[];
    animals: Phaser.GameObjects.Image[];
    contact: Phaser.GameObjects.Graphics;
    tack: Phaser.GameObjects.Graphics;
  }>();
  constructor(
    private scene: Phaser.Scene,
    private texture: (frame: string) => string,
  ) {}

  update(vehicles: Vehicle[], progress: (v: Vehicle) => number | undefined, stock: (v: Vehicle, index: number) => string | undefined, clock: number, view: Phaser.Geom.Rectangle, tint: number,
    /** Ground height at a world pixel, as the scene lifts its people. */
    lift: (x: number, y: number) => number, cast: readonly number[], opacity: number, shadows: boolean,
    cartClock: (id: string, clock: number) => number, operator: (v: Vehicle) => Actor | undefined) {
    const seen = new Set<string>();
    for (const v of vehicles) {
      const spec = models[v.model];
      if (!spec) continue;
      const step = progress(v);
      const t = cartClock(v.id, clock);
      const at = vehicleAt(v, t, step);
      const pose = vehiclePose(v, t, step);
      if (pose.x < view.x - 120 || pose.x > view.right + 120 || pose.y < view.y - 60 || pose.y > view.bottom + 160) continue;
      seen.add(v.id);
      // A stride's worth of ground to the eight frames: longer at the trot.
      const stride = v.gait === "trot" ? 2 : 1.4;
      const n = at.moving ? Math.floor(at.along / (stride / 8)) % 8 : 0;
      const gait = at.moving ? v.gait : "walk";
      const ox = v.model === "ox-plough";
      const pair = ox && v.seedCrop !== "rice";
      const species = ox && !pair ? "water-buffalo" : ox ? "cattle" : v.model === "farm-cart-pony" ? "pony" : v.model === "buffalo-cart" ? "water-buffalo" : undefined;
      let parts = this.images.get(v.id);
      if (!parts) {
        const make = () => this.scene.add.image(0, 0, "__DEFAULT");
        parts = {
          gear: [make(), make()].map(im => im.setOrigin(spec.anchor[0] / spec.size[0], spec.anchor[1] / spec.size[1])),
          animals: Array.from({ length: pair ? 2 : species ? 1 : 0 }, make),
          contact: this.scene.add.graphics(), tack: this.scene.add.graphics(),
        };
        this.images.set(v.id, parts);
      }
      const angle = at.heading;
      const dx = Math.sin(angle), dy = -Math.cos(angle);
      const point = (forward: number, across: number) => {
        const x = Math.round(pose.x + dx * forward - dy * across);
        const ground = pose.y + (dy * forward + dx * across) * 0.5;
        return { x, y: Math.round(ground - lift(x, ground + 4)), depth: ground };
      };
      const shade = parts.contact.clear().setVisible(shadows).setDepth(pose.depth - 46);
      const shadow = (x: number, y: number, w: number, h: number) => {
        shade.fillStyle(0x272833, opacity * 0.64).fillEllipse(x + Math.round(cast[0] * 7), y + Math.round(cast[1] * 7), w + 3, h + 2);
        shade.fillStyle(0x28252a, 0.22).fillEllipse(x, y, w, h);
      };
      const bed = point(ox ? -17 : -21, 0);
      shadow(bed.x, bed.y, ox ? 12 : 27, ox ? 5 : 11);
      if (!ox) for (const side of [-1, 1]) {
        const wheel = point(-21, side * 13);
        shade.fillStyle(0x28252a, 0.32).fillEllipse(wheel.x, wheel.y, 5, 2);
      }
      const tack = parts.tack.clear().setDepth(pose.depth + 0.35);
      const facing = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"][pose.facing];
      parts.animals.forEach((animal, i) => {
        const art = stock(v, i);
        animal.setVisible(!!art);
        if (!animal.visible) return;
        const side = pair ? (i ? 10 : -10) : 0;
        const hoof = point(ox ? (i ? 13 : 10) : 12, side);
        const scale = species === "pony" ? 0.92 : 1;
        const dir4 = ["north", "east", "east", "east", "south", "west", "west", "west"][pose.facing];
        const pref = `faunac-${art}-${at.moving ? "wander" : "idle"}-${facing}-${(n + i * 3) % 8}`;
        const frame = this.scene.textures.get(this.texture(pref)).has(pref)
          ? pref
          : `faunac-${art}-${at.moving ? "wander" : "idle"}-${dir4}-${(n + i * 3) % 8}`;
        const key = this.texture(frame);
        if (animal.frame.name !== frame || animal.texture.key !== key) animal.setTexture(key, frame);
        animal.setOrigin(0.5, animal.frame.pivotY || 0.92).setScale(scale)
          .setPosition(hoof.x, hoof.y).setTint(tint).setDepth(pose.depth + Math.sign(dy * 12 + dx * side) * 0.8 + dx * side * 0.01);
        shadow(hoof.x, hoof.y - 1, 17 + 14 * Math.abs(dx), 7 + 4 * Math.abs(dy));
        if (ox && !pair) {
          const spread = at.moving ? 3 + n % 4 : 3;
          shade.lineStyle(1, 0xb1c6ad, 0.72).lineBetween(hoof.x - spread - 5, hoof.y, hoof.x - spread, hoof.y + 1);
          shade.lineBetween(hoof.x + 2, hoof.y + 2, hoof.x + spread + 3, hoof.y + 1);
        }
        const neck = point(18, side);
        if (species === "pony") {
          tack.setDepth(animal.depth + 0.02).lineStyle(2, 0x504237).lineBetween(neck.x - dy * 4, neck.y - 20, neck.x + dy * 4 - dx * 3, neck.y - 12);
        }
      });
      if (parts.animals[0]?.visible && (ox || species === "water-buffalo")) {
        const width = pair ? 20 : 8, left = point(17, -width), right = point(17, width);
        tack.setDepth(pose.depth + 1.4).lineStyle(3, 0x5b4129).lineBetween(left.x, left.y - 25, right.x, right.y - 25);
        tack.lineStyle(1, 0xb79864).lineBetween(left.x, left.y - 26, right.x, right.y - 26);
      }
      const driver = species ? operator(v) : undefined, seat = crewPlace(v, pose, 0);
      if (driver?.appearance && seat && parts.animals[0]?.visible) {
        const role = ox ? "guide-plough" : "drive-cart";
        const index = crewFrame(role, at.along, at.moving);
        const hands = crewHands(driver.appearance, role, pose.facing, index);
        const height = lift(seat.x, seat.y);
        tack.setDepth(Math.max(seat.depth + 0.04, pose.depth + 0.36));
        for (const [i, hand] of hands.entries()) {
          const x = Math.round(seat.x + hand.x), y = Math.round(seat.y + hand.y - height);
          const end = point(ox ? -17 : 26, i ? 3 : -3);
          const ey = end.y - (ox ? 6 : 23);
          const mx = Math.round((x + end.x) / 2), my = Math.round((y + ey) / 2) + (ox ? 0 : 2);
          tack.lineStyle(ox ? 2 : 1, ox ? 0x77583a : 0x49392d).lineBetween(x, y, mx, my).lineBetween(mx, my, end.x, ey);
        }
      }
      for (const [i, layer] of (["back", "front"] as const).entries()) {
        const frame = `vv-${v.model}-${gait}-${pose.facing}-${n}-${layer}`;
        const image = parts.gear[i];
        if (image.frame.name !== frame || image.texture.key === "__DEFAULT") image.setTexture(this.texture(frame), frame);
        image
          .setPosition(Math.round(pose.x), Math.round(pose.y - lift(pose.x, pose.y + 4)))
          .setDepth(pose.depth + (i ? 0.5 : -0.5))
          .setTint(tint);
      }
    }
    for (const [id, pair] of this.images)
      if (!seen.has(id)) {
        this.destroy(pair);
        this.images.delete(id);
      }
  }

  private destroy(parts: { gear: Phaser.GameObjects.Image[]; animals: Phaser.GameObjects.Image[]; contact: Phaser.GameObjects.Graphics; tack: Phaser.GameObjects.Graphics }) {
    for (const part of [...parts.gear, ...parts.animals, parts.contact, parts.tack]) part.destroy();
  }

  dispose() {
    for (const pair of this.images.values()) this.destroy(pair);
    this.images.clear();
  }
}
