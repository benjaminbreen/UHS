import type Phaser from "phaser";
import art from "../content/graphics/conveyances.generated.json" with { type: "json" };
import { vehicleAt, type Vehicle } from "../world/v3/conveyances";

type Art = { size: [number, number]; anchor: [number, number]; crew: Record<string, [number, number, number, string, boolean][]> };
const models = art as unknown as Record<string, Art>;

/** Where a vehicle is drawn: its anchor in world pixels, its facing, and the
 * depth its crew are sorted about -- the back layer just under, the front
 * just over. */
export type VehiclePose = { x: number; y: number; facing: number; depth: number };

export function vehiclePose(v: Vehicle, clock: number): VehiclePose {
  const at = vehicleAt(v, clock);
  const y = at.y * 16 + 12;
  return { x: at.x * 16 + 8, y, facing: at.facing, depth: y + 2 };
}

/** A crew place in world pixels for the vehicle's current facing: where the
 * person's feet go, whether they sit, and how near the viewer they are. */
export function crewPlace(v: Vehicle, pose: VehiclePose, place: number) {
  const slot = models[v.model]?.crew[String(pose.facing)]?.[place];
  if (!slot) return undefined;
  const [dx, dy, near, posture] = slot;
  return { x: pose.x + dx, y: pose.y + dy, seated: posture === "sit", depth: pose.depth - near * 0.01 };
}

/** The vehicles of the settlement the player is in, each as the layer behind
 * its crew and the layer in front of them. The crew are the scene's own
 * people, drawn between. */
export class VehicleLayer {
  private images = new Map<string, [Phaser.GameObjects.Image, Phaser.GameObjects.Image]>();
  constructor(
    private scene: Phaser.Scene,
    private texture: (frame: string) => string,
  ) {}

  update(vehicles: Vehicle[], clock: number, view: Phaser.Geom.Rectangle, tint: number,
    /** Ground height at a world pixel, as the scene lifts its people. */
    lift: (x: number, y: number) => number) {
    const seen = new Set<string>();
    for (const v of vehicles) {
      const spec = models[v.model];
      if (!spec) continue;
      const at = vehicleAt(v, clock);
      const pose = vehiclePose(v, clock);
      if (pose.x < view.x - 120 || pose.x > view.right + 120 || pose.y < view.y - 60 || pose.y > view.bottom + 160) continue;
      seen.add(v.id);
      // A stride's worth of ground to the eight frames: longer at the trot.
      const stride = v.gait === "trot" ? 2 : 1.4;
      const n = at.moving ? Math.floor(at.along / (stride / 8)) % 8 : 0;
      const gait = at.moving ? v.gait : "walk";
      let pair = this.images.get(v.id);
      if (!pair) {
        const make = () => this.scene.add.image(0, 0, "__DEFAULT").setOrigin(spec.anchor[0] / spec.size[0], spec.anchor[1] / spec.size[1]);
        pair = [make(), make()];
        this.images.set(v.id, pair);
      }
      for (const [i, layer] of (["back", "front"] as const).entries()) {
        const frame = `vv-${v.model}-${gait}-${pose.facing}-${n}-${layer}`;
        const image = pair[i];
        if (image.frame.name !== frame || image.texture.key === "__DEFAULT") image.setTexture(this.texture(frame), frame);
        image
          .setPosition(Math.round(pose.x), Math.round(pose.y - lift(pose.x, pose.y + 4)))
          .setDepth(pose.depth + (i ? 0.5 : -0.5))
          .setTint(tint);
      }
    }
    for (const [id, pair] of this.images)
      if (!seen.has(id)) {
        pair[0].destroy();
        pair[1].destroy();
        this.images.delete(id);
      }
  }

  dispose() {
    for (const pair of this.images.values()) pair.forEach((image) => image.destroy());
    this.images.clear();
  }
}
