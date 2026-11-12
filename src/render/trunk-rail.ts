import { levelCrossing, railPixel } from "./carriageway";
import { waterHash as hash } from "./water-style";

/** Half the ballast bed, in pixels, and where `railPixel` centres a track. */
const BED = 12;
const TRACK = 18;
/** How far a platform stands out from the bed, in pixels. */
const PLATFORM = 22;

/** Lay a single running line over a finished ground tile: the track follows
 * its segments at any angle, sampled from the same ballast, sleepers and
 * rails the stations use. */
export function railOver(
  pixels: Uint8ClampedArray,
  rail: readonly (readonly [number, number, number, number])[],
  x: number,
  y: number,
  ox: number,
  oy: number,
  /** A road crosses here: rails set flush between planks, no ballast. */
  crossing = false,
  /** A platform stands on the side this points to. */
  platform?: readonly [number, number],
) {
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const cx = (px + 0.5) / 16,
        cy = (py + 0.5) / 16;
      let best = Infinity,
        across = 0,
        along = 0,
        townward = 0;
      for (const [ax, ay, bx, by] of rail) {
        const dx = bx - ax,
          dy = by - ay,
          len = Math.hypot(dx, dy) || 1,
          ux = dx / len,
          uy = dy / len;
        const t = Math.max(0, Math.min(len, (cx - ax) * ux + (cy - ay) * uy));
        const d = Math.hypot(cx - ax - ux * t, cy - ay - uy * t);
        if (d >= best) continue;
        best = d;
        across = ((cx - ax) * -uy + (cy - ay) * ux) * 16;
        // Counted in world pixels along the heading, so sleepers keep their
        // spacing from one segment and one tile to the next.
        along = ((x + ox + cx) * ux + (y + oy + cy) * uy) * 16;
        townward = platform ? Math.sign(-uy * platform[0] + ux * platform[1]) : 0;
      }
      const wx = (x + ox) * 16 + px,
        wy = (y + oy) * 16 + py;
      const i = (py * 16 + px) * 4;
      // The platform: a dark face to the track, a pale coping, then flags.
      const out = Math.round(across * townward) - BED;
      if (townward && out > 0 && out <= PLATFORM) {
        const flag = Math.round(along) % 9 === 0 || out === 12;
        pixels.set(out <= 2 ? [66, 62, 58, 255] : out <= 4 ? [206, 200, 184, 255] : out === PLATFORM ? [112, 106, 96, 255] : flag ? [146, 140, 128, 255] : [172, 166, 152, 255], i);
        continue;
      }
      if (crossing) {
        if (Math.abs(across) > BED) continue;
        const c = levelCrossing([pixels[i], pixels[i + 1], pixels[i + 2]], Math.round(across) + TRACK, Math.round(along), true);
        pixels.set([c[0], c[1], c[2], 255], i);
        continue;
      }
      // The bed's edge is loose stone, not a ruled line.
      if (Math.abs(across) > BED - (hash(wx, wy, 961) < 0.4 ? 1 : 0)) continue;
      const c = railPixel(Math.round(across) + TRACK, Math.round(along), wx, wy);
      pixels.set([c[0], c[1], c[2], 255], i);
    }
}
