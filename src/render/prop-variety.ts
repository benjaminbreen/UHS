import type Phaser from "phaser";
import { cellHash } from "../core/noise";
import { random } from "../core/random";
import { natureTreeSprites } from "../content/ecology/vegetation";

const WORKSITE_VARIANTS = new Set([
  "worksite-fish-mat",
  "worksite-fish-trays",
  "worksite-fish-table",
  "worksite-seine-pegs",
  "worksite-net-rail",
  "worksite-net-frame",
  "worksite-dye-racks",
  "worksite-pottery-rack",
  "worksite-tanner-rack",
  "worksite-loom-frame",
  "worksite-smith-bench",
  "worksite-carpenter-bench",
  "worksite-mason-bench",
  "worksite-press-yard",
  "worksite-paper-yard",
  "worksite-ropewalk",
  "worksite-foundry-yard",
  "worksite-soap-yard",
  "worksite-silk-yard",
  "worksite-charcoal-yard",
]);

/** Deterministic procedural variant for outdoor fishing and craft worksites (4 variants each). */
export function worksiteVariantFrame(
  sprite: string,
  roll: number,
  has?: (frame: string) => boolean,
): string {
  if (!WORKSITE_VARIANTS.has(sprite)) return sprite;
  const idx = Math.floor(Math.max(0, Math.min(0.9999, roll)) * 4);
  if (idx === 0) return sprite;
  const cand = `${sprite}-${idx}`;
  return !has || has(cand) ? cand : sprite;
}

export const fishingWorksiteFrame = worksiteVariantFrame;

export function reviewedPropFrame(sprite: string, roll: number): string {
  if (sprite === "well") return "study-propb-well-0";
  const basket = /^study-propb-open-basket-([0-2])$/.exec(sprite);
  return basket && roll >= 0.5 ? `nature-prop-basket-b-${basket[1]}` : sprite;
}

function mirrorable(sprite: string) {
  return (
    sprite === "rock" ||
    sprite.startsWith("rock-") ||
    (sprite.startsWith("nature-") && !sprite.includes("understory-ladder"))
  );
}

export type PropVariety = {
  flip: boolean;
  /** Multiply tint, at or below white: a tint can darken but never brighten. */
  tint: number;
};

/** Two free axes of variety for art that is placed hundreds of times: which
 * way it faces, and how deep its tone is. A field of two dozen boulders comes
 * from three frames, so without this it reads as three stamps repeated. */
export function propVariety(
  seed: string,
  sprite: string,
  x: number,
  y: number,
): PropVariety {
  if (!mirrorable(sprite)) return { flip: false, tint: 0xffffff };
  const roll = random(seed, "prop-variety", x, y);
  // A sixth of the range spent on tone, the rest on facing, so neighbours
  // rarely share both.
  const shade = random(seed, "prop-shade", x, y);
  const level = Math.round(255 * (0.88 + Math.floor(shade * 4) * 0.04));
  // Sand and stone warm slightly as they darken, rather than going grey.
  const warm = Math.min(255, Math.round(level * 1.03));
  // Trees carry side-lit highlights and have authored silhouette variants.
  const tree = natureTreeSprites.some(t => sprite === t || sprite.startsWith(`${t}-`));
  return {
    flip: !tree && roll < 0.5,
    tint: (warm << 16) | (level << 8) | Math.round(level * 0.98),
  };
}

/** Softens pure-black rock outlines to deep stone/sand shadow, harmonizes
 * coastal boulders with the beach tone, and tucks a damp-sand base collar. */
export function groundedRockTexture(
  scene: Phaser.Scene,
  texture: string,
  frame: string,
  coastal: boolean,
  sandRgb?: readonly number[],
  origX = 0.5,
  origY = 1,
): { key: string; originX: number; originY: number } | undefined {
  const f = scene.textures.getFrame(texture, frame);
  if (!f || !f.cutWidth || !f.cutHeight) return undefined;
  const w = f.cutWidth, h = f.cutHeight, padX = 1, padB = 2;
  const toneTag = coastal && sandRgb ? `${sandRgb[0] >> 4}-${sandRgb[1] >> 4}-${sandRgb[2] >> 4}` : coastal ? "c" : "i";
  const key = `rock-ground:${frame}:${toneTag}`;
  const originX = (origX * w + padX) / (w + padX * 2);
  const originY = (origY * h) / (h + padB);
  if (scene.textures.exists(key)) return { key, originX, originY };
  const read = document.createElement("canvas");
  read.width = w;
  read.height = h;
  const rctx = read.getContext("2d", { willReadFrequently: true })!;
  rctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, w, h, 0, 0, w, h);
  const px = rctx.getImageData(0, 0, w, h).data;
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && px[(y * w + x) * 4 + 3] > 180;
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] <= 180) continue;
    if (Math.max(px[i], px[i + 1], px[i + 2]) < 42) continue;
    sr += px[i]; sg += px[i + 1]; sb += px[i + 2]; n++;
  }
  const avg = n ? [sr / n, sg / n, sb / n] : [115, 108, 98];
  const sand = sandRgb ?? [192, 186, 172];
  const outline = [0, 1, 2].map((k) =>
    Math.max(34, Math.min(64, Math.round(avg[k] * 0.32 + (coastal ? sand[k] * 0.12 : 8)))),
  );
  const gw = w + padX * 2, gh = h + padB;
  const tex = scene.textures.createCanvas(key, gw, gh)!;
  const ctx = tex.getContext();
  const out = ctx.createImageData(gw, gh);
  const put = (gx: number, gy: number, rgba: number[]) => {
    if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) return;
    out.data.set(rgba, (gy * gw + gx) * 4);
  };
  const bottoms = new Int16Array(w).fill(-1);
  let left = w, right = -1, maxY = -1;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) if (solid(x, y)) bottoms[x] = y;
    if (bottoms[x] >= 0) {
      if (x < left) left = x;
      if (x > right) right = x;
      if (bottoms[x] > maxY) maxY = bottoms[x];
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = px[i + 3];
      if (a === 0) continue;
      let r = px[i], g = px[i + 1], b = px[i + 2];
      const darkOutline = a > 180 && r < 40 && g < 40 && b < 40;
      if (darkOutline) {
        r = outline[0]; g = outline[1]; b = outline[2];
      } else if (coastal && a > 180) {
        // Salt-weathered coastal boulders sit closer to the beach's muted mineral range.
        const luma = r * 0.3 + g * 0.59 + b * 0.11;
        const muted = [0, 1, 2].map((k) => luma * 0.62 + sand[k] * 0.38);
        r = Math.round(r * 0.72 + muted[0] * 0.28);
        g = Math.round(g * 0.72 + muted[1] * 0.28);
        b = Math.round(b * 0.72 + muted[2] * 0.28);
        // Dust the bottom-most ground-contact edge with a whisper of sand.
        if (y === bottoms[x] && y >= maxY - 2 && cellHash(x, y, 861) < 0.35) {
          r = Math.round(r * 0.68 + sand[0] * 0.26);
          g = Math.round(g * 0.68 + sand[1] * 0.26);
          b = Math.round(b * 0.68 + sand[2] * 0.26);
        }
      }
      put(x + padX, y, [r, g, b, a]);
    }
  // Damp-sand / embedded shadow collar tucked under the base silhouette.
  for (let x = left; x <= right; x++) {
    const b = bottoms[x];
    if (b < 0 || b < maxY - 3) continue;
    const inner = x > left && x < right;
    put(x + padX, b + 1, coastal ? [34, 30, 26, 108] : [26, 28, 24, 88]);
    if (inner) put(x + padX, b + 2, coastal ? [46, 42, 36, 48] : [32, 34, 28, 36]);
  }
  if (left < w && bottoms[left] >= maxY - 2)
    put(left + padX - 1, bottoms[left] + 1, coastal ? [44, 39, 33, 52] : [30, 32, 26, 42]);
  if (right >= 0 && bottoms[right] >= maxY - 2)
    put(right + padX + 1, bottoms[right] + 1, coastal ? [44, 39, 33, 52] : [30, 32, 26, 42]);
  ctx.putImageData(out, 0, 0);
  tex.refresh();
  return { key, originX, originY };
}

/** Wet-sand contact pool and delicate waterline lap tucked around mangrove prop-root tips. */
export function mangroveRootCollar(
  scene: Phaser.Scene,
  texture: string,
  frame: string,
  wetWater: boolean,
  origX = 0.5,
  origY = 1,
): { key: string; originX: number; originY: number } | undefined {
  const f = scene.textures.getFrame(texture, frame);
  if (!f || !f.cutWidth || !f.cutHeight) return undefined;
  const w = f.cutWidth, h = f.cutHeight, padX = 2, padB = 3;
  const key = `mangrove-collar:${frame}:${wetWater ? 1 : 0}`;
  const originX = (origX * w + padX) / (w + padX * 2);
  const originY = (origY * h) / (h + padB);
  if (scene.textures.exists(key)) return { key, originX, originY };
  const read = document.createElement("canvas");
  read.width = w;
  read.height = h;
  const rctx = read.getContext("2d", { willReadFrequently: true })!;
  rctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, w, h, 0, 0, w, h);
  const px = rctx.getImageData(0, 0, w, h).data;
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && px[(y * w + x) * 4 + 3] > 180;
  let maxY = -1;
  const bottoms = new Int16Array(w).fill(-1);
  for (let x = 0; x < w; x++) {
    for (let y = h - 1; y >= 0; y--)
      if (solid(x, y)) {
        bottoms[x] = y;
        if (y > maxY) maxY = y;
        break;
      }
  }
  if (maxY < 0) return undefined;
  const gw = w + padX * 2, gh = h + padB;
  const tex = scene.textures.createCanvas(key, gw, gh)!;
  const ctx = tex.getContext();
  const out = ctx.createImageData(gw, gh);
  const blend = (gx: number, gy: number, rgba: number[]) => {
    if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) return;
    const i = (gy * gw + gx) * 4;
    if (rgba[3] > out.data[i + 3]) out.data.set(rgba, i);
  };
  for (let x = 0; x < w; x++) {
    const b = bottoms[x];
    // Only ground prop-root tips near the bottom of the sprite.
    if (b < 0 || b < maxY - 7) continue;
    for (let dy = -1; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const d2 = dx * dx + dy * dy * 1.5;
        if (d2 > 4.5) continue;
        const inner = d2 <= 1.5;
        blend(
          x + padX + dx,
          b + dy,
          inner ? [22, 32, 30, 96] : [32, 44, 40, 44],
        );
      }
    if (wetWater && cellHash(x, b, 877) > 0.55)
      blend(x + padX, b + 2, [218, 236, 232, 108]);
  }
  ctx.putImageData(out, 0, 0);
  tex.refresh();
  return { key, originX, originY };
}
