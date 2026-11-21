import type Phaser from "phaser";
import { cellHash as hash, valueNoise as noise } from "../core/noise";
import { snowShades, white } from "./snow-cover";

// How readily moss takes on roofs and damp creeps up walls, by climate.
const damp: Record<string, number> = {
  temperate: 0.8,
  boreal: 0.6,
  tropical: 1,
  monsoon: 0.9,
  mediterranean: 0.25,
  tundra: 0.3,
  arid: 0,
};

/** Weathering laid over a building's own art: moss on the upper roof and damp
 * at the foot of the walls in wet climates, soot streaked down from where the
 * smoke leaves, and a forge's blackened lintel. Undefined when there is none. */
export function buildingWear(
  scene: Phaser.Scene,
  texture: string,
  frame: string,
  options: {
    climate?: string;
    /** 0 sound to 1 neglected. */
    neglect: number;
    smoke: readonly (readonly [number, number, string])[];
    forge?: number[];
    /** Grass grows at the wall foot on bare ground; a paved street has none. */
    weeds?: boolean;
    door?: number[];
  },
) {
  const moss = Math.round((damp[options.climate ?? ""] ?? 0.5) * options.neglect * 4);
  const dry = options.climate === "arid" || options.climate === "mediterranean";
  const growth = options.weeds ? Math.round((0.35 + options.neglect * 0.5) * 4) : 0;
  const key = `wear:${frame}:${moss}:${options.forge ? 1 : 0}:${growth}:${dry ? 1 : 0}`;
  if (scene.textures.exists(key)) return key;
  const f = scene.textures.getFrame(texture, frame);
  if (!f) return undefined;
  const w = f.cutWidth,
    h = f.cutHeight,
    padBottom = 2;
  const read = document.createElement("canvas");
  read.width = w;
  read.height = h;
  const rctx = read.getContext("2d", { willReadFrequently: true })!;
  rctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, w, h, 0, 0, w, h);
  const px = rctx.getImageData(0, 0, w, h).data;
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && px[(y * w + x) * 4 + 3] > 200;
  const tex = scene.textures.createCanvas(key, w, h + padBottom)!;
  const ctx = tex.getContext();
  const out = ctx.createImageData(w, h + padBottom);
  const put = (x: number, y: number, rgba: number[]) => {
    if (x < 0 || y < 0 || x >= w || y >= h + padBottom) return;
    out.data.set(rgba, (y * w + x) * 4);
  };
  const seed = frame.length * 31 + frame.charCodeAt(0);
  let ground = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 200) ground = Math.max(ground, Math.floor(i / 4 / w));
  const tops = new Int16Array(w).fill(-1);
  const bottoms = new Int16Array(w).fill(-1);
  let footLeft = w, footRight = -1;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++)
      if (solid(x, y)) {
        if (tops[x] < 0) tops[x] = y;
        bottoms[x] = y;
      }
    if (bottoms[x] >= ground - 14) {
      if (x < footLeft) footLeft = x;
      if (x > footRight) footRight = x;
    }
  }
  const [dx0, , dw] = options.door ?? [-99, 0, 0];
  for (let x = 0; x < w; x++) {
    const top = tops[x],
      bottom = bottoms[x];
    if (top < 0) continue;
    const span = bottom - top;
    const onGround = bottom >= ground - 14;
    const clearDoor = x < dx0 - 1 || x > dx0 + dw;
    for (let y = top; y <= bottom; y++) {
      if (!solid(x, y)) continue;
      const speck = hash(x + seed, y, 811);
      // Moss grows in cushions on the upper roof, where water sits longest.
      if (moss && y - top < span * 0.4) {
        const clump = hash(Math.floor((x + seed) / 5), Math.floor(y / 4), 813);
        if (clump < moss * 0.05 && speck < 0.75)
          put(x, y, speck < 0.3 ? [128, 142, 70, 210] : [84, 102, 50, 200]);
      }
      // Subtle ambient occlusion along the bottom wall sill where masonry/timber meets earth.
      if (onGround && clearDoor && bottom - y <= 2) {
        const dy = bottom - y;
        if (dy === 0) put(x, y, [24, 20, 16, 92]);
        else if (dy === 1) put(x, y, [28, 24, 18, speck < 0.7 ? 50 : 32]);
        else if (speck < 0.45) put(x, y, [32, 28, 22, 24]);
      }
      // Rain splashes back up the wall foot and keeps it green-dark.
      if (moss >= 2 && bottom - y < 3 && speck < 0.5 + moss * 0.08)
        put(x, y, [44, 58, 32, 70 + moss * 12]);
    }
    // Soft two-pixel ground-contact shadow directly below the standing wall sill.
    if (onGround && clearDoor) {
      put(x, bottom + 1, [26, 22, 18, 80]);
      if (hash(x + seed, 1, 823) < 0.78) put(x, bottom + 2, [26, 22, 18, 36]);
    }
    // Grass and weeds in clumps along the wall foot, thickest near the corners,
    // so the house sits in the ground rather than on it. Never across the doorway.
    if (growth && onGround && clearDoor) {
      const g = Math.floor((x + seed) / 5),
        within = (x + seed) % 5;
      const clump = hash(g, 0, 821);
      const nearCorner = x - footLeft < 9 || footRight - x < 9;
      const chance = Math.min(0.76, 0.24 + growth * 0.16 + (nearCorner ? 0.16 : 0));
      if (clump < chance && within < 4) {
        // Taller at the middle of the clump, ragged at its ends.
        const crown = within === 1 || within === 2 ? 2 : 0;
        const tall = 1 + crown + Math.floor(hash(x + seed, 2, 825) * (2 + growth * 0.4));
        const ramp = dry
          ? [[104, 92, 46], [150, 132, 66], [204, 184, 112]]
          : [[38, 76, 34], [70, 124, 46], [138, 182, 74]];
        for (let k = 0; k < tall && bottom - k >= top; k++)
          put(x, bottom - k, [...ramp[k === 0 ? 0 : k === tall - 1 ? 2 : 1], 255]);
        // Root pixel steps 1px into the ground so the horizontal sill breaks up.
        if (within === 1 || within === 2) put(x, bottom + 1, [...ramp[0], 220]);
        // Now and then a flower on top of the tallest.
        if (!dry && tall >= 3 && hash(x + seed, 3, 827) < 0.12)
          put(x, bottom - tall, hash(x, 4, 829) < 0.5 ? [236, 230, 196, 255] : [232, 196, 72, 255]);
      }
    }
  }
  const smudge = (cx: number, cy: number, width: number, length: number, alpha: number) => {
    for (let dy = 0; dy < length; dy++)
      for (let dx = -width; dx <= width; dx++) {
        const x = Math.round(cx + dx),
          y = Math.round(cy + dy);
        if (!solid(x, y)) continue;
        const fade = (1 - dy / length) * (1 - Math.abs(dx) / (width + 1));
        if (hash(x + seed, y, 815) > fade * 1.3) continue;
        put(x, y, [22, 18, 16, Math.round(alpha * (0.5 + fade * 0.5))]);
      }
  };
  // Soot runs down the roof from the stack, wider where it is only a vent.
  for (const [x, y, kind] of options.smoke)
    smudge(x, y + 2, kind === "chimney" ? 2 : 3, kind === "chimney" ? 9 : 7, 150);
  if (options.forge) {
    const [dx, dy, dw] = options.forge;
    smudge(dx + dw / 2, dy - 7, Math.ceil(dw / 2) + 1, 8, 170);
    for (const [x, y] of options.smoke) smudge(x, y + 2, 4, 14, 190);
  }
  ctx.putImageData(out, 0, 0);
  tex.refresh();
  return key;
}

/** Snow banked against the foot of the walls, as the wind leaves it: a
 * lumpy white drift three to nine pixels up the wall, a bright crest and a blue
 * underside, broken at the doorway where it is shovelled clear. */
export function buildingSnowBank(
  scene: Phaser.Scene,
  texture: string,
  frame: string,
  door?: number[],
) {
  const key = `snow-bank:${frame}`;
  if (scene.textures.exists(key)) return key;
  const f = scene.textures.getFrame(texture, frame);
  if (!f) return undefined;
  const w = f.cutWidth,
    h = f.cutHeight;
  const read = document.createElement("canvas");
  read.width = w;
  read.height = h;
  const rctx = read.getContext("2d", { willReadFrequently: true })!;
  rctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, w, h, 0, 0, w, h);
  const px = rctx.getImageData(0, 0, w, h).data;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  const out = ctx.createImageData(w, h);
  const seed = frame.length * 31 + frame.charCodeAt(0);
  let ground = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 200) ground = Math.max(ground, Math.floor(i / 4 / w));
  const [dx0, , dw] = door ?? [-99, 0, 0];
  const foot = (x: number) => {
    for (let y = h - 1; y >= 0; y--) if (px[(y * w + x) * 4 + 3] > 200) return y;
    return -1;
  };
  const heightAt = (x: number) => {
    const bottom = foot(x);
    // Only where the wall stands on the ground, and never across the door.
    if (bottom < ground - 14 || (x >= dx0 - 1 && x <= dx0 + dw)) return 0;
    return Math.round(3 + noise(x + seed, 0, 11, 851) * 5 + noise(x + seed, 0, 3, 853) * 1.5);
  };
  for (let x = 0; x < w; x++) {
    const t = heightAt(x);
    if (!t) continue;
    const bottom = foot(x);
    for (let k = 0; k < t; k++) {
      const y = bottom - k;
      if (y < 0) break;
      // A white crest over a face turned to us, which goes blue as
      // every south face of the snow does, deepest at its foot.
      const rgb =
        k === t - 1
          ? snowShades.lip
          : k === t - 2
            ? white
            : k === 0
              ? snowShades.shade
              : k < t / 2
                ? snowShades.midShade
                : snowShades.underShade;
      out.data.set([...rgb, 255], (y * w + x) * 4);
    }
  }
  ctx.putImageData(out, 0, 0);
  tex.refresh();
  return key;
}
