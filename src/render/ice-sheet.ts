import { cellHash, valueNoise } from "../core/noise";
import { ICE_OPEN, ICE_THIN, iceStrength } from "../core/ice";
import type { TopographyCell } from "../core/topography";

type Visual = NonNullable<TopographyCell["waterVisual"]>;
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
/** Frozen water, or the bank of it: a shoreline wanders across cell borders,
 * so the land cell beside the ice paints its share of the sheet. Not by the
 * sign of `distance`: the worker's paint cells carry a scalloped one. */
export const sheeted = (v: Visual | undefined): boolean => !!v && (v.ice === "solid" || (!v.ice && v.frost !== undefined));
// The frozen sheet: bluer than the snow beside it, so its edge can be read.
const SHEET = Object.fromEntries(Object.entries({
  snow: "#fafeff", shade: "#d3e9f7", glare: "#f4fdff", sheen: "#c0effa", body: "#a0e0f4",
  deep: "#84cdee", rim: "#4f9fe0", thin: "#6db7ec", dark: "#4c97e0", vein: "#2f73c8",
}).map(([k, c]) => [k, hex(c)])) as Record<"snow" | "shade" | "glare" | "sheen" | "body" | "deep" | "rim" | "thin" | "dark" | "vein", number[]>;
export const SNOW_BANK = SHEET.snow;
/** 1 at a point of a loose 9px lattice, falling to 0 six pixels off: summed
 * onto a shoreline's distance it pushes the line out in round lobes. */
function lobe(wx: number, wy: number, seed: number) {
  const gx = Math.floor(wx / 9), gy = Math.floor(wy / 9);
  let best = 7;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const cx = (gx + i + 0.2 + 0.6 * cellHash(gx + i, gy + j, seed)) * 9,
        cy = (gy + j + 0.2 + 0.6 * cellHash(gx + i, gy + j, seed + 1)) * 9;
      best = Math.min(best, Math.hypot(wx - cx, wy - cy));
    }
  return Math.max(0, 1 - best / 6.5);
}
/** One ellipse in some cells of a lattice, kept whole inside its cell: 1 inside it. */
function oval(wx: number, wy: number, step: number, seed: number, chance: number, rx0: number, rx1: number, ry0: number, ry1: number) {
  const gx = Math.floor(wx / step), gy = Math.floor(wy / step);
  if (cellHash(gx, gy, seed) >= chance) return 0;
  const rx = rx0 + (rx1 - rx0) * cellHash(gx, gy, seed + 1), ry = ry0 + (ry1 - ry0) * cellHash(gx, gy, seed + 2);
  const cx = gx * step + rx + 1 + cellHash(gx, gy, seed + 3) * (step - 2 * rx - 2),
    cy = gy * step + ry + 3 + cellHash(gx, gy, seed + 4) * (step - 2 * ry - 6);
  return ((wx + 0.5 - cx) / rx) ** 2 + ((wy + 0.5 - cy) / ry) ** 2 < 1 ? 1 : 0;
}
/** A four-point sparkle, five pixels across, in some cells of a lattice. */
function star(wx: number, wy: number, step: number, seed: number, chance: number) {
  const gx = Math.floor(wx / step), gy = Math.floor(wy / step);
  if (cellHash(gx, gy, seed) >= chance) return false;
  const dx = Math.abs(wx - gx * step - 3 - Math.floor(cellHash(gx, gy, seed + 1) * (step - 6))),
    dy = Math.abs(wy - gy * step - 3 - Math.floor(cellHash(gx, gy, seed + 2) * (step - 6)));
  return (dx === 0 && dy <= 2) || (dy === 0 && dx <= 2);
}
/** The colour of the frozen sheet at a pixel `d` cells inside the shore
 * (`iceDistance`), or nothing where the water is open. */
export function iceSheet(v: Visual, d: number, wx: number, wy: number): number[] | undefined {
  if (d >= 0) return;
  const sea = v.kind === "sea";
  const s = iceStrength(v, d, wx, wy);
  // Where the sheet ends on open water: the sea's ragged limit, or a river's unfrozen channel.
  const out = sea ? d + 7 - (valueNoise(wx, wy, 14, 615) - 0.5) * 1.4 : (s - ICE_OPEN) * 6;
  if (out < 0.7) {
    const edge = out + (sea ? 0.32 * lobe(wx, wy, 616) : 0);
    if (edge < 0) return;
    if (edge < 0.16) return SHEET.snow;
    if (edge < 0.23) return SHEET.rim;
    if (edge < 0.4) return SHEET.sheen;
  }
  // The bank: a snow lip in round lobes, a blue line under it, then a pale band.
  if (d > -0.9) {
    const lip = d + 0.34 * lobe(wx, wy, 606);
    if (lip > -0.14) return SHEET.snow;
    if (lip > -0.21) return SHEET.rim;
    if (lip > -0.38) return SHEET.sheen;
  }
  // Thin ice is a flat dark pool with its own outline, as plain as a hole.
  if (s < ICE_THIN) {
    if (s > ICE_THIN - 0.022) return SHEET.vein;
    if (s > ICE_THIN - 0.05) return SHEET.thin;
    return star(wx, wy, 34, 612, 0.4) ? SHEET.sheen : SHEET.dark;
  }
  if (s < ICE_THIN + 0.02) return SHEET.sheen;
  // Snow pillows: lit top, shaded foot, and a shadow on the ice below.
  const snow = oval(wx, wy, 56, 609, 0.3, 5, 11, 3, 5);
  if (snow === 1) return oval(wx, wy + 2, 56, 609, 0.3, 5, 11, 3, 5) === 1 ? SHEET.snow : SHEET.shade;
  if (oval(wx, wy - 2, 56, 609, 0.3, 5, 11, 3, 5) === 1) return SHEET.deep;
  if (star(wx, wy, 44, 611, 0.3)) return SHEET.glare;
  // Glare: two short strokes on the same diagonal, set well apart.
  const u = wx + wy, w = wx - wy;
  const gu = Math.floor(u / 60), gw = Math.floor(w / 52);
  if (cellHash(gu, gw, 613) < 0.3) {
    const lu = u - gu * 60, lw = Math.abs(w - gw * 52 - 26);
    if ((lu === 9 && lw < 8) || (lu === 13 && lw < 4)) return SHEET.glare;
  }
  // Wide polished patches, a shade lighter, so the sheet is not one flat fill.
  return oval(wx, wy, 88, 601, 0.6, 18, 30, 7, 11) === 1 ? SHEET.sheen : SHEET.body;
}
