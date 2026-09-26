import { PARKING, STALL } from "../content/settlements/streets/markings";
import type { Lane } from "../world/v3/types";
import { waterHash as hash, waterNoise } from "./water-style";
import { asphaltPixel } from "./paving-stones";

type RGB = readonly number[];
const mod = (n: number, d: number) => ((n % d) + d) % d;
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const tint = (c: RGB, v: number): RGB => [clamp(c[0] + v), clamp(c[1] + v), clamp(c[2] + v * 1.1)];
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t);

const WHITE: RGB = [226, 224, 210];
const YELLOW: RGB = [228, 178, 50];
/** Poured gutter pan and its lip where it meets the binder. */
const PAN: RGB = [134, 134, 127];
const SETT: RGB = [118, 124, 127];
// Wide enough to show past the kerb's own shadow, which takes up to eight.
const GUTTER = 13;

/** A two-lane country road outside the kerbed town: asphalt graded to a
 * straight edge, a white edge line, one centre line and a gravel shoulder.
 * Undefined past the shoulder, where the verge's own ground shows. */
export function blacktopPixel(
  f: { radius: number; side?: number; along?: number; paved?: "yellow" | "white" | "none" },
  wx: number,
  wy: number,
): RGB | undefined {
  const d = Math.abs(f.side ?? 0),
    r = f.radius * 16,
    along = f.along ?? 0;
  if (d >= r + 1) return;
  if (d >= r - 2) {
    const g = hash(wx, wy, 791);
    return g < 0.3 ? [104, 98, 86] : g < 0.8 ? [134, 127, 112] : [158, 150, 132];
  }
  let base: RGB = asphaltPixel(wx, wy);
  // Tyres run a lane's width either side of the line.
  if (Math.abs(d - r * 0.45) <= 2) base = tint(base, 5);
  const flake = waterNoise(wx, wy, 2.5, 792);
  const paint = (c: RGB) => (flake > 0.74 ? mix(c, base, 0.72) : mix(c, base, Math.max(0, flake - 0.3) * 0.3));
  if (d >= r - 6 && d < r - 4) return paint(WHITE);
  if (f.paved === "yellow" && d < 3 && d >= 1) return paint(YELLOW);
  if (f.paved === "white" && d < 1 && mod(along, 48) < 20) return paint(WHITE);
  return base;
}

/** Which sides of this cell are kerbed. */
export type Kerbs = { low: boolean; high: boolean };

/** One pixel of a marked carriageway. `u` runs across the road from its west
 * or north kerb, `v` along it in world pixels; `ax` is the world coordinate
 * across the road, so two parallel streets do not repeat each other. */
export function carriagewayPixel(
  base: RGB,
  lane: Lane,
  u: number,
  v: number,
  ax: number,
  kerbs: Kerbs,
): RGB {
  if (lane.junction) return base;
  const m = lane.marks;
  const W = lane.span * 16;
  const edge = ax - u;
  const P = m.parking && lane.span >= 6 ? PARKING * 16 : 0;
  const near = lane.toJunction;
  // Pixels to the edge of the junction, counted back from it.
  const t = mod(v, 16);
  const toJunction =
    near === undefined ? Infinity : (Math.abs(near) - 1) * 16 + (near > 0 ? 15 - t : t);

  const low = kerbs.low && u < GUTTER,
    high = kerbs.high && u >= W - GUTTER;
  if ((low || high) && m.gutter !== "none") {
    const d = low ? u : W - 1 - u;
    const side = edge + (low ? 0 : W);
    // A drain every few lengths of kerb, never at a crossing.
    const slot = Math.floor(v / 16);
    if (toJunction > 40 && hash(slot, side, 771) < 0.13) {
      const along = mod(v, 16);
      if (along >= 2 && along <= 13 && d >= 6 && d <= 11) {
        if (along === 2 || along === 13 || d === 6 || d === 11)
          return d === 6 || along === 2 ? [96, 98, 96] : [54, 56, 58];
        return mod(along, 2) ? [20, 22, 26] : d === 7 ? [104, 106, 104] : [82, 84, 84];
      }
      // Dark silt washed out below the grate.
      if (along >= 3 && along <= 12 && d === 12) return tint(base, -10);
    }
    if (m.gutter === "sett") {
      const y = mod(v + (d > 8 ? 2 : 0), 4);
      if (d === 8 || d === 12 || y === 0) return [78, 84, 88];
      return tint(SETT, Math.floor(hash(Math.floor((v + (d > 8 ? 2 : 0)) / 4), d > 8 ? 1 : 0, 772) * 12) - 6 + (y === 1 ? 5 : 0));
    }
    if (d === GUTTER - 1) return [84, 86, 86];
    if (d >= 8) {
      // Leaves, grit and wet where the pan meets the binder.
      const silt = waterNoise(v, side, 5, 773);
      if (silt > 0.6) return tint(PAN, -22 - (silt > 0.72 ? 10 : 0));
    }
    if (mod(v, 24) === 0) return tint(PAN, -24);
    return tint(PAN, (d === 0 ? -14 : d === 1 ? -6 : 0) + (hash(v, d, 774) < 0.2 ? -4 : 0));
  }

  const lanes = Math.max(1, Math.round((W - 2 * P) / 40));
  const laneW = (W - 2 * P) / lanes;
  const index = Math.min(lanes - 1, Math.max(0, Math.floor((u - P) / laneW)));
  const centre = P + (index + 0.5) * laneW;
  if (toJunction > 20 && u >= P && u < W - P) {
    const cell = Math.floor(v / 16);
    if (hash(cell, index * 131 + edge, 775) < 0.045) {
      const dx = v - (cell * 16 + 7.5),
        dy = u - centre + 0.5;
      const r2 = dx * dx + dy * dy;
      if (r2 <= 30) {
        if (r2 > 19) return dx + dy < -1 ? [124, 126, 120] : dx + dy > 1 ? [30, 32, 36] : [88, 90, 88];
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return [30, 32, 36];
        return mod(Math.round(dx) + Math.round(dy), 3) === 0
          ? [100, 102, 100]
          : mod(Math.round(dx) - Math.round(dy), 3) === 0
            ? [60, 62, 64]
            : [78, 80, 80];
      }
      if (r2 <= 38 && dx + dy > 0) base = tint(base, -8);
    }
  }

  if (u >= P && u < W - P) {
    const off = Math.abs(u - centre);
    const track = Math.abs(off - laneW * 0.28) <= 2.2;
    if (track) base = tint(base, 5);
    else if (off <= 3 && waterNoise(v, u, 7, 776) > 0.52) base = tint(base, -7);
  } else if (P && waterNoise(v, ax, 9, 777) > 0.63) base = tint(base, -8);

  // Paint wears in flakes, worst where tyres run over it.
  const tyred = u >= P && Math.abs(Math.abs(u - centre) - laneW * 0.28) <= 3;
  const paint = (colour: RGB): RGB => {
    const flake = waterNoise(v, u, 2.5, 781);
    if (flake > (tyred ? 0.66 : 0.78) || hash(v, u, 782) < 0.025)
      return mix(colour, base, 0.72);
    return mix(colour, base, Math.max(0, flake - 0.3) * 0.3);
  };
  const inside = u >= GUTTER && u < W - GUTTER;

  if (toJunction < 32 && inside && m.crossing !== "none") {
    const bars = m.crossing === "zebra" || m.crossing === "ladder";
    const edges = m.crossing === "ladder" || m.crossing === "lines";
    if (edges && (toJunction <= 3 && toJunction >= 2 || toJunction >= 27 && toJunction <= 28))
      return paint(WHITE);
    if (bars && toJunction >= 5 && toJunction <= 25 && mod(u - GUTTER, 8) < 5)
      return paint(WHITE);
    return base;
  }
  if (toJunction < 32) return base;
  if (m.stopLine && toJunction >= 33 && toJunction <= 35 && inside) {
    const toward = near! > 0 ? 1 : -1;
    const high = lane.axis === "x" ? toward > 0 : toward < 0;
    const half = (m.drive === "right") === high ? u >= W / 2 : u < W / 2;
    if (half && u >= P && u < W - P) return paint(WHITE);
  }

  if (lane.span >= 4) {
    const c = W / 2;
    const dash = mod(v, 48) < 20;
    switch (m.centre) {
      case "yellow-double":
        if (u === c - 3 || u === c - 2 || u === c + 1 || u === c + 2) return paint(YELLOW);
        break;
      case "yellow-dashed":
        if ((u === c - 1 || u === c) && dash) return paint(YELLOW);
        break;
      case "white-solid":
        if (u === c - 1 || u === c) return paint(WHITE);
        break;
      case "white-dashed":
        if ((u === c - 1 || u === c) && dash) return paint(WHITE);
        break;
    }
    if (m.lanes && lanes > 2)
      for (let i = 1; i < lanes; i++) {
        const at = Math.round(P + i * laneW);
        if (Math.abs(at - c) > 4 && (u === at - 1 || u === at) && mod(v, 40) < 12)
          return paint(WHITE);
      }
  }
  if (P) {
    // Stalls marked with a tick across the lane and a short foot along it.
    const lowSide = u < P;
    const d = lowSide ? P - 1 - u : u - (W - P);
    const s = mod(v, STALL * 16);
    if (d >= 0 && d < P - GUTTER && (s === 0 || s === 1) && d < 14) return paint(WHITE);
    if ((d === 0 || d === 1) && (s <= 6 || s >= STALL * 16 - 5)) return paint(WHITE);
  }
  return base;
}
