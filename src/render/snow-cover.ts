import type { TopographyCell, TopographySample } from "../core/topography";
import { waterHash as hash, waterNoise as noise } from "../core/water-field";
import { pathField } from "./material-edges";

/** Lying snow, 0 to 1, shared by the main thread and the terrain worker. Set
 * in steps so a thaw re-rasters a handful of times a day, not every frame. */
let cover = 0;
export const snowSteps = (n: number) => Math.round(n * 6) / 6;
export function setSnowCover(n: number) {
  cover = n;
}
export const snowCover = () => cover;

const white = [238, 243, 248],
  shade = [210, 221, 236],
  packed = [200, 203, 206],
  slush = [148, 140, 128];

/** Lay the current snow over a finished ground tile. Drifts fill from the
 * hollows of the noise field outward, so a light fall is patches and a heavy
 * one is a blanket, with the streets trodden to packed snow and slush. */
export function snowOver(
  pixels: Uint8ClampedArray,
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  cell: TopographyCell,
) {
  if (!cover || cell.surface === "snow" || cell.surface === "water") return;
  const paved = cell.feature === "paving";
  const routed = !paved && !!cell.pathArt?.length;
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const i = (py * 16 + px) * 4;
      if (!pixels[i + 3]) continue;
      const wx = (x + ox) * 16 + px,
        wy = (y + oy) * 16 + py;
      const tread = paved
        ? 0.6
        : routed
          ? pathField(sample, x + (px + 0.5) / 16, y + (py + 0.5) / 16, ox, oy).coverage
          : 0;
      const out = snowPixel([pixels[i], pixels[i + 1], pixels[i + 2]], wx, wy, tread > 0.55);
      for (let c = 0; c < 3; c++) pixels[i + c] = out[c];
    }
}

/** One ground pixel under the current snow. Also used for ramps and slopes,
 * which the contour pass paints itself. */
export function snowPixel(
  rgb: readonly number[],
  wx: number,
  wy: number,
  trodden = false,
): readonly number[] {
  if (!cover) return rgb;
  const drift =
    noise(wx, wy, 23, 811) * 0.6 + noise(wx, wy, 7, 813) * 0.3 + hash(wx, wy, 815) * 0.1;
  const depth = cover * 1.35 - drift * 0.55;
  if (depth <= 0) return rgb;
  let base: readonly number[], k: number;
  if (trodden) {
    // Feet and wheels pack it grey and churn slush through it; the thinner
    // the fall, the more of the street shows.
    const churned = hash(Math.floor(wx / 2), Math.floor(wy / 2), 819) < 0.5 - cover * 0.35;
    base = churned ? slush : packed;
    k = Math.min(0.85, depth * 1.4);
  } else {
    base = hash(wx, wy, 817) > 0.93 || drift > 0.72 ? shade : white;
    // A thin fall lets the ground's own texture read through it.
    k = Math.min(1, depth * 3.5);
  }
  return rgb.map((v, c) => Math.round(v * (1 - k) + base[c] * k));
}
