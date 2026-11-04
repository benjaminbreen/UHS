import type Phaser from "phaser";
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
/** Hoar frost on the ground, 0 to 1: a clear cold dawn, gone by mid-morning. */
let frost = 0;
export function setFrost(n: number) {
  frost = n;
}
export const frostCover = () => frost;

// Haunted Chocolatier's snow: near white, every shade a clear cornflower
// blue rather than grey, so it stays snow under a warm or dull grade.
export const white = [236, 242, 252],
  lip = [250, 252, 255],
  shade = [140, 170, 228],
  midShade = [172, 196, 240],
  underShade = [204, 220, 247],
  dimple = [212, 225, 248],
  packed = [204, 213, 232],
  packedShade = [164, 180, 216],
  slush = [138, 136, 146];

export const snowShades = { lip, shade, midShade, underShade };

// Below this depth a patch is a thin crust the ground shows through.
const THIN = 0.025;

const driftAt = (wx: number, wy: number) =>
  noise(wx, wy, 41, 811) * 0.7 + noise(wx, wy, 9, 813) * 0.3;
const depthAt = (wx: number, wy: number) => 0.2 + cover * 0.75 - driftAt(wx, wy);

/** Well inside a drift, clear of its edges: where the sun catches a glint. */
export const openSnow = (wx: number, wy: number) => cover > 0 && depthAt(wx, wy) > THIN + 0.08;

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
  if (cell.surface === "snow" || cell.surface === "water") return;
  if (!cover) {
    if (frost && cell.feature !== "paving") rime(pixels);
    return;
  }
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
      // A wandering threshold, or the trodden strip is a ruled rectangle.
      const trodden = tread > 0.55 + (noise(wx, wy, 5, 821) - 0.5) * 0.3;
      const out = snowPixel([pixels[i], pixels[i + 1], pixels[i + 2]], wx, wy, trodden);
      for (let c = 0; c < 3; c++) pixels[i + c] = out[c];
    }
}

/** Frost greys the grass toward a cool white and catches the blades' tips;
 * bare earth and paths keep their colour. */
function rime(pixels: Uint8ClampedArray) {
  // Bottom up, so the row above is still unfrosted when compared.
  for (let py = 15; py >= 0; py--)
    for (let px = 0; px < 16; px++) {
      const i = (py * 16 + px) * 4;
      if (!pixels[i + 3]) continue;
      const r = pixels[i],
        g = pixels[i + 1],
        b = pixels[i + 2];
      const green = g >= r - 4 && g > b + 6;
      // A tip is a blade pixel lighter than the one above it.
      const tip = green && g > (py ? pixels[i - 64 + 1] : g) + 4;
      // Even over the grass: patches read as camouflage, loose crystals as static.
      const k = tip ? 0.9 : green ? frost * 0.6 : 0;
      const out = mix([r, g, b], rimeColour, k);
      for (let c = 0; c < 3; c++) pixels[i + c] = out[c];
    }
}
const rimeColour = [208, 224, 250];

/** One ground pixel under the current snow. Also used for ramps and slopes,
 * which the contour pass paints itself. */
export function snowPixel(
  rgb: readonly number[],
  wx: number,
  wy: number,
  trodden = false,
): readonly number[] {
  if (!cover) return rgb;
  const depth = depthAt(wx, wy);
  // Flat steps with a shaded south lip, not a blend: a soft wash read as fog.
  if (depth <= 0) {
    // Meltwater darkens the bare ground, most of all at a patch's edge.
    const k = depth > -0.03 ? 0.66 : 0.8;
    return [rgb[0] * k, rgb[1] * k, rgb[2] * k + 6].map(Math.round);
  }
  if (depth < THIN) return mix(rgb, trodden ? slush : underShade, 0.6);
  if (trodden) {
    // Feet and wheels pack it grey and churn slush through it; the thinner
    // the fall, the more of the street shows.
    // Patches, not a per-block coin toss: a 2 px hash read as a checkerboard.
    // Deep cold packs it hard: the churned patches go blue, not brown.
    if (noise(wx, wy, 5, 819) < 0.5 - cover * 0.35)
      return mix(rgb, mix(slush, packedShade, cover), 0.85);
    return depthAt(wx, wy + 1) < THIN ? packedShade : packed;
  }
  // The drift's lip: a blue band under its south edge, a pale rim round the
  // sides, a bright line along the top.
  if (depthAt(wx, wy + 1) < THIN) return shade;
  if (depthAt(wx, wy + 2) < THIN) return midShade;
  if (depthAt(wx, wy + 3) < THIN) return underShade;
  if (depthAt(wx - 1, wy) < THIN || depthAt(wx + 1, wy) < THIN) return underShade;
  if (depthAt(wx, wy - 1) < THIN) return lip;
  return dimpled(wx, wy) ? dimple : white;
}

/** Sparse short dashes in the open snow, the soft footing marks HC scatters
 * over a field: one per few cells, thicker where the drift field clusters. */
function dimpled(wx: number, wy: number) {
  const cx = Math.floor(wx / 7),
    cy = Math.floor(wy / 6);
  if (hash(cx, cy, 831) > 0.12 + noise(wx, wy, 60, 835) * 0.2) return false;
  const dx = wx - cx * 7 - Math.floor(hash(cx, cy, 832) * 4),
    dy = wy - cy * 6 - Math.floor(hash(cx, cy, 833) * 5);
  return dy === 0 && dx >= 0 && dx < 3;
}

const mix = (a: readonly number[], b: readonly number[], k: number) =>
  a.map((v, c) => Math.round(v * (1 - k) + b[c] * k));

/** Bare wet ground where heat has melted the snow: an oval of `w` by `h`
 * with the snow's own blue lip along its top and a bright rim below, on a
 * canvas two pixels wider each side and three taller, so it sits in the
 * drift rather than on it. */
export function meltPatch(scene: Phaser.Scene, w: number, h: number) {
  const key = `snow-melt-${w}x${h}`;
  if (scene.textures.exists(key)) return key;
  const cw = w + 4,
    ch = h + 6;
  const tex = scene.textures.createCanvas(key, cw, ch)!;
  const ctx = tex.getContext();
  const out = ctx.createImageData(cw, ch);
  const bare = (x: number, y: number) => {
    const dx = (x - cw / 2 + 0.5) / (w / 2),
      dy = (y - 3 - h / 2 + 0.5) / (h / 2);
    // A ragged edge, by the angle round the oval.
    const a = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 14);
    return dx * dx + dy * dy < 0.82 + hash(a, w * 7 + h, 841) * 0.18;
  };
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) {
      const rgb = bare(x, y)
        ? !bare(x - 1, y) || !bare(x + 1, y) || !bare(x, y - 1) || !bare(x, y + 1)
          ? slush
          : hash(x, y, 843) < 0.2
            ? [104, 90, 74]
            : [82, 70, 58]
        : bare(x, y + 1)
          ? shade
          : bare(x, y + 2)
            ? midShade
            : bare(x, y - 1)
              ? lip
              : undefined;
      if (rgb) out.data.set([...rgb, 255], (y * cw + x) * 4);
    }
  ctx.putImageData(out, 0, 0);
  tex.refresh();
  return key;
}
