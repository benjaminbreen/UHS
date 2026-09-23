import type { CharacterAppearance } from "../../core/character";
import type { CharacterPose } from "./poses";
import type { CarriedArt } from "./props";
import { drawCharacter as drawA } from "./draw";
import { drawCharacter as drawB } from "./v2/draw";
import { lightKey } from "./v2/pixels";
export type CharacterRenderer = (
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  direction: number,
  pose: CharacterPose,
  frame: number,
  prop?: CarriedArt,
  /** Eight-way facing; renderers that only have four views ignore it. */
  facing?: number,
) => void;
export const rendererIds = ["a", "b"] as const;
export type RendererId = (typeof rendererIds)[number];
export const renderers: Record<
  RendererId,
  { label: string; draw: CharacterRenderer }
> = {
  a: { label: "A · legacy", draw: drawA },
  b: { label: "B · default", draw: drawB },
};
/** The renderer the game draws with. The lab can select either; everything
 * else should import `drawCharacter` from here rather than a variant directly,
 * so switching back is one line. */
export const defaultRenderer: RendererId = "b";
export const drawCharacter = renderers[defaultRenderer].draw;
/** A dark line around the outside of a finished frame, taken from what it
 * borders, so a figure separates from ground of the same value. Full dark on
 * the shadow side and underfoot; on the lit side only the material's own
 * shade, or the figure reads as a sticker. */
export function outlineCharacter(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = ctx.canvas;
  const image = ctx.getImageData(0, 0, w, h),
    src = image.data,
    out = new Uint8ClampedArray(src),
    key = lightKey();
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] >= 128;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3] >= 128) continue;
      // A one-pixel gap between arm and body, or between the legs, stays open.
      if (
        (solid(x - 1, y) && solid(x + 1, y)) ||
        (solid(x, y - 1) && solid(x, y + 1))
      )
        continue;
      let r = 0,
        g = 0,
        b = 0,
        n = 0,
        lit = 0;
      for (const [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        if (!solid(x + dx, y + dy)) continue;
        const j = ((y + dy) * w + x + dx) * 4;
        r += src[j];
        g += src[j + 1];
        b += src[j + 2];
        n++;
        // The figure lies below or away from the light: this is its lit edge.
        if (dy === 1 || dx === -key) lit++;
      }
      if (!n) continue;
      // Already dark (hair, boots, the garment's own contour): a second dark
      // pixel only thickens it into a blob.
      if (0.3 * r + 0.59 * g + 0.11 * b < n * 60) continue;
      // Lit: 80% of the neighbour. Shadow: 55%, nudged toward the palette's #241c38.
      const [k, c] = lit === n ? [0.8, 0] : [0.55, 0.15];
      out[i] = (r / n) * k + 0x24 * c;
      out[i + 1] = (g / n) * k + 0x1c * c;
      out[i + 2] = (b / n) * k + 0x38 * c;
      out[i + 3] = 255;
    }
  image.data.set(out);
  ctx.putImageData(image, 0, 0);
}
