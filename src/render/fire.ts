import type { LightingId } from "./lighting";
/** Animated fire props: frame `x` has siblings `x-f1..` in the atlas; the
 * count is read from the atlas, four for the braziers and ovens, eight for
 * the open fires. */
export const animatedBase = (frame: string) =>
  frame.replace(/-(f|m)\d+$/, "");
export const animatedFrames = (names: string[]) => {
  const counts = new Map<string, number>();
  for (const name of names) {
    const m = /-f(\d+)$/.exec(name);
    if (!m) continue;
    const base = animatedBase(name);
    counts.set(base, Math.max(counts.get(base) ?? 1, Number(m[1]) + 1));
  }
  return counts;
};
/** Props that move without being on fire: a hive with bees round it, a beam
 * scale settling. Frame `x` has siblings `x-m1..`; the count is read from the
 * atlas so a prop can take as many as its movement needs. */
export const motionFrames = (names: string[]) => {
  const counts = new Map<string, number>();
  for (const name of names) {
    const m = /-m(\d+)$/.exec(name);
    if (!m) continue;
    const base = animatedBase(name);
    counts.set(base, Math.max(counts.get(base) ?? 1, Number(m[1]) + 1));
  }
  return counts;
};
export const MOTION_FRAME_MS = 190;
/** More frames means a slower movement, not a faster one: a scale settling
 * takes a few seconds, a bee's round takes under one. */
export const motionPeriod = (frames: number) =>
  frames > 4 ? MOTION_FRAME_MS * 2 : MOTION_FRAME_MS;
export const FIRE_FRAME_MS = 105;
/** How strongly a fire lights the ground round it, over the night wash. */
export const lightAlpha: Record<LightingId, number> = {
  "early-morning": 0.35,
  morning: 0,
  midday: 0,
  afternoon: 0,
  dusk: 0.55,
  night: 1,
};
/** Three sizes of the pool, swapped in step with the flame. */
export const LIGHT_FLICKER = [0, 1, 0, 2, 1, 0, 2, 1];
/** A pool of firelight in whole-pixel rings, dithered where one ring meets
 * the next, flattened to the ground's perspective. Drawn additively over the
 * night wash, so it lights whatever stands in it. Three frames, each a little
 * smaller, for the flicker. */
export function ensureFireLight(scene: Phaser.Scene, radius: number) {
  const key = `fire-light-${radius}`;
  if (scene.textures.exists(key)) return key;
  const w = radius * 2,
    h = Math.round(radius * 1.3);
  const canvas = scene.textures.createCanvas(key, w * 3, h)!;
  const ctx = canvas.context;
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const rings = [
    "rgba(255,160,70,0.16)",
    "rgba(255,170,80,0.3)",
    "rgba(255,185,95,0.46)",
    "rgba(255,205,120,0.62)",
  ];
  for (let f = 0; f < 3; f++) {
    const scale = 1 - f * 0.07;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - w / 2) / (radius * scale),
          dy = (y + 0.5 - h / 2) / (radius * 0.65 * scale);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= 1) continue;
        const level = Math.floor(
          (1 - d) * 4.4 + bayer[(y & 3) * 4 + (x & 3)] / 16 - 0.5,
        );
        if (level < 0) continue;
        ctx.fillStyle = rings[Math.min(level, 3)];
        ctx.fillRect(f * w + x, y, 1, 1);
      }
    canvas.add(String(f), 0, f * w, 0, w, h);
  }
  canvas.refresh();
  return key;
}