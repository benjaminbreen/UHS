import Phaser from "phaser";
import { random } from "../core/random";

/** What a voxel building publishes about its lit rooms: a rect of its glow
 * frame per household floor (kind 0) and per shop (kind 1). */
export type VoxelLight = [x: number, y: number, w: number, h: number, kind: 0 | 1];
export type VoxelModel = {
  glow?: string;
  lampFrame?: string;
  lights?: VoxelLight[];
  snowFrame?: string;
  wetFrame?: string;
};

/** Whether a light is on at `hour`. A household's lamps come on through the
 * dusk and go out one floor at a time across the evening, and a few are lit
 * again before dawn; a shop keeps its window lit until it shuts. */
export function lightOn(kind: 0 | 1, seed: string, id: string, i: number, hour: number) {
  const r = (k: string) => random(seed, "voxel-light", id, i, k);
  const on = 17.3 + r("on") * 1.8;
  if (kind === 1) return hour >= on && hour < 19 + r("shut") * 3;
  const off = 21 + r("off") * 3.5;
  const evening = hour >= on && hour < Math.min(off, 24);
  const late = off > 24 && hour < off - 24;
  const early = r("early") < 0.3 && hour >= 5.2 + r("wake") * 1.3 && hour < 7.6;
  return evening || late || early;
}

/** One image of the glow frame per lit room, cropped to it, and the lamps
 * whole; the caller shows each as its hour comes. */
export function voxelLamps(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  model: VoxelModel,
  seed: string,
  id: string,
) {
  const at = (frame: string, depth: number) =>
    scene.add
      .image(image.x, image.y, image.texture.key, frame)
      .setOrigin(image.originX, image.originY)
      .setDepth(depth)
      .setVisible(false);
  const lamps: {
    pane: Phaser.GameObjects.Image;
    halo: Phaser.GameObjects.Image;
    lit?: (hour: number) => boolean;
  }[] = [];
  (model.lights ?? []).forEach(([x, y, w, h, kind], i) => {
    const pane = at(model.glow!, image.depth + 0.5).setCrop(x, y, w, h);
    const halo = at(model.glow!, 19001).setCrop(x, y, w, h).setBlendMode(Phaser.BlendModes.ADD);
    lamps.push({ pane, halo, lit: (hour) => lightOn(kind, seed, id, i, hour) });
  });
  if (model.lampFrame)
    lamps.push({
      pane: at(model.lampFrame, image.depth + 0.5),
      halo: at(model.lampFrame, 19001).setBlendMode(Phaser.BlendModes.ADD),
    });
  return lamps;
}

/** Snow lying on the building's ledges and roofs, or the same surfaces wet,
 * as a layer over it. Undefined in fair weather. */
export function voxelWeather(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  model: VoxelModel,
  snow: number,
  wetness: number,
  sheet: (frame: string) => string,
) {
  const frame = snow > 0.05 ? model.snowFrame : wetness > 0.15 ? model.wetFrame : undefined;
  if (!frame) return undefined;
  return scene.add
    .image(image.x, image.y, sheet(frame), frame)
    .setOrigin(image.originX, image.originY)
    .setDepth(image.depth + 0.2)
    .setAlpha(Math.min(1, snow > 0.05 ? snow * 1.5 : wetness));
}
