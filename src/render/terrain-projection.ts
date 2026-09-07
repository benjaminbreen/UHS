import style from "./generated/topography-style.json";
import type { TerrainPoint, TopographySample } from "../core/topography";
/** One shared presentation transform for tops, feet, shadows and pointer picking. */
export const TERRAIN_RISE = style.rise;
export function surfaceElevation(
  sample: TopographySample,
  x: number,
  y: number,
) {
  const tx = Math.floor(x + 0.5),
    ty = Math.floor(y + 0.5),
    c = sample(tx, ty);
  if (!c) return 0;
  const fx = x + 0.5 - tx,
    fy = y + 0.5 - ty;
  return (
    c.height + (c.ramp ? { n: 1 - fy, e: fx, s: fy, w: 1 - fx }[c.ramp] : 0)
  );
}
export function terrainFoot(sample: TopographySample, p: TerrainPoint) {
  return {
    x: p.x * 16 + 8,
    y: p.y * 16 + 8 - surfaceElevation(sample, p.x, p.y) * TERRAIN_RISE,
  };
}
/** Search in painter order: the highest visible front tile owns an overlapping
 * pixel. Face pixels are not mistaken for a walkable surface. */
export function pickTerrain(
  sample: TopographySample,
  width: number,
  height: number,
  px: number,
  py: number,
): TerrainPoint | undefined {
  const x = Math.floor(px / 16);
  if (x < 0 || x >= width) return;
  for (let y = height - 1; y >= 0; y--) {
    const c = sample(x, y);
    if (!c) continue;
    for (let row = 0; row < 16; row++) {
      const rise =
        c.height +
        (c.ramp
          ? {
              n: 1 - row / 16,
              e: (px - x * 16) / 16,
              s: row / 16,
              w: 1 - (px - x * 16) / 16,
            }[c.ramp]
          : 0);
      const top = y * 16 + row - rise * TERRAIN_RISE;
      if (py >= top && py < top + (c.ramp === "n" ? 2 : 1)) return { x, y };
    }
  }
}
