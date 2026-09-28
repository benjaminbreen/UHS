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
  life?: LifeSpec[];
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

/** Something that moves on a voxel building, as the art bakes it: frames
 * cropped from the building at `at`, and when to show them. */
export type LifeSpec = {
  k: "hours" | "event" | "loop";
  at: [number, number];
  f: string[];
  /** hours: the span it shows, wrapping past midnight. */
  on?: [number, number];
  /** hours: shown while the shop lit by `lights[shop]` is shut. */
  shop?: number;
  /** event: frame and milliseconds, in order. */
  seq?: [number, number][];
  /** event: seconds between one and the next. */
  every?: [number, number];
  /** event: the hours it can happen in. */
  when?: [number, number];
  /** loop: milliseconds a frame; `night` loops only show after dark. */
  ms?: number;
  night?: boolean;
};

const within = (hour: number, [a, b]: [number, number]) => (a <= b ? hour >= a && hour < b : hour >= a || hour < b);

/** When a shop opens and shuts, keyed as its lit window is, so the grille
 * comes down as the light goes out. */
export function shopOpen(seed: string, id: string, i: number, hour: number) {
  const r = (k: string) => random(seed, "voxel-light", id, i, k);
  return hour >= 7 + r("open") * 1.5 && hour < 19 + r("shut") * 3;
}

type Entry = {
  image: Phaser.GameObjects.Image;
  spec: LifeSpec;
  id: string;
  i: number;
  /** event: when the next one may start, and when the current began. */
  next: number;
  start: number;
  count: number;
  frame: number;
};

/** Plays every voxel building's life: shutters and grilles by the hour,
 * someone at a window now and then, washing and flags on a loop. */
export class VoxelLife {
  private entries: Entry[] = [];
  private seed = "";

  add(
    scene: Phaser.Scene,
    image: Phaser.GameObjects.Image,
    life: LifeSpec[] | undefined,
    seed: string,
    id: string,
    sheet: (frame: string) => string,
    tint: number,
  ) {
    if (!life) return [];
    this.seed = seed;
    const left = image.x - image.displayOriginX,
      top = image.y - image.displayOriginY;
    return life.map((spec, i) => {
      const overlay = scene.add
        .image(left + spec.at[0], top + spec.at[1], sheet(spec.f[0]), spec.f[0])
        .setOrigin(0, 0)
        .setDepth(image.depth + 0.6)
        .setTint(tint)
        .setVisible(false);
      const first = random(seed, "voxel-life", id, i, "first") * (spec.every?.[1] ?? 60) * 1000;
      this.entries.push({ image: overlay, spec, id, i, next: first, start: -1, count: 0, frame: -1 });
      return overlay;
    });
  }

  clear() {
    this.entries = [];
  }

  update(time: number, hour: number, lamps: number) {
    for (const e of this.entries) {
      const s = e.spec;
      let frame = -1;
      if (s.k === "hours")
        frame = (s.shop !== undefined ? !shopOpen(this.seed, e.id, s.shop, hour) : within(hour, s.on!)) ? 0 : -1;
      else if (s.k === "loop")
        frame = s.night && lamps <= 0 ? -1 : Math.floor(time / s.ms! + e.i * 1.7) % s.f.length;
      else {
        if (e.start < 0 && time >= e.next && within(hour, s.when!)) e.start = time;
        if (e.start >= 0) {
          let t = time - e.start;
          const step = s.seq!.find(([, ms]) => (t -= ms) < 0);
          if (step) frame = step[0];
          else {
            e.start = -1;
            e.count++;
            const [a, b] = s.every!;
            e.next = time + (a + random(this.seed, "voxel-life", e.id, e.i, e.count) * (b - a)) * 1000;
          }
        }
      }
      if (frame !== e.frame) {
        e.frame = frame;
        if (frame >= 0) e.image.setFrame(s.f[frame]);
        e.image.setVisible(frame >= 0);
      }
    }
  }
}
