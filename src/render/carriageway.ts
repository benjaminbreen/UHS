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
  // A ditch either side, a grassy trough with water standing in its bottom.
  if (d >= r + 6) return;
  if (d >= r + 2) {
    const depth = 1 - Math.abs(d - (r + 4)) / 2;
    if (depth > 0.6 && hash(wx >> 1, wy >> 1, 793) < 0.07) return [72, 98, 112];
    return depth > 0.6 ? [44, 62, 40] : depth > 0.2 ? [56, 78, 46] : [70, 96, 54];
  }
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

/** Poured concrete in bays: a transverse joint every few metres, a joint
 * down the middle, each bay its own pour, sealed joints and corner cracks. */
export function concreteRoadPixel(lane: Lane, u: number, v: number, ax: number): RGB {
  const W = lane.span * 16;
  const bay = Math.floor(v / 72),
    half = u < W / 2 ? 0 : 1;
  const edge = ax - u;
  const pour = hash(bay, half * 7 + edge, 801);
  const along = mod(v, 72);
  if (along === 0 || Math.abs(u - W / 2) < 1) return [74, 76, 74];
  if (along === 1) return [174, 174, 164];
  let c: RGB = tint([150, 150, 141], Math.round((pour - 0.5) * 12));
  const stain = waterNoise(v, u + edge, 9, 802);
  if (stain > 0.62) c = tint(c, -Math.round((stain - 0.62) * 45));
  // A bay that has settled cracks from a corner.
  if (pour < 0.12) {
    const x = half ? u - W / 2 : u;
    if (Math.abs(along - x * (pour < 0.06 ? 1.3 : 0.8)) < 0.7) return [96, 97, 94];
  }
  if (hash(v, u, 803) > 0.97) return tint(c, -10);
  return c;
}

/** Grooved rails set flush in the carriageway, one track each way, each
 * track laid in its own band of setts between and just beside the rails. */
function tramRail(u: number, v: number, W: number): RGB | undefined {
  const c = W / 2;
  for (const track of [c - 14, c + 14]) {
    for (const rail of [track - 6, track + 6]) {
      const d = u - rail;
      if (d === 0) return [168, 170, 166];
      if (d === 1) return [34, 34, 36];
    }
    const d = u - track;
    if (Math.abs(d) <= 8) {
      const row = Math.floor(v / 4);
      const x = mod(d + 8 + (row % 2) * 3, 6),
        y = mod(v, 4);
      if (x === 0 || y === 0) return [70, 72, 74];
      const tone = Math.floor(hash(Math.floor((d + 8 + (row % 2) * 3) / 6), row, 811) * 14) - 7;
      return tint([112, 116, 118], tone + (y === 1 ? 6 : 0));
    }
  }
  return undefined;
}

const TRACKS = [18, 46];
const GAUGE = 6;

/** A double-track railway: ballast, timber sleepers and rails. `u` runs
 * across the formation from its west or north edge, `v` along it. */
export function railPixel(u: number, v: number, wx: number, wy: number): RGB {
  const g = hash(wx, wy, 821);
  let c: RGB = g < 0.25 ? [84, 79, 71] : g < 0.6 ? [104, 98, 88] : g < 0.9 ? [122, 115, 103] : [146, 138, 124];
  // Weeds creep in at the edges of the formation.
  if ((u < 3 || u > 60) && hash(wx >> 1, wy >> 1, 822) < 0.3) c = [78, 104, 56];
  for (const tc of TRACKS) {
    const d = u - tc;
    if (Math.abs(d) > GAUGE + 4) continue;
    // Oil and rust darken the ballast under each track.
    c = tint(c, -10);
    const sleeper = mod(v, 7);
    if (sleeper < 3) {
      const age = hash(Math.floor(v / 7), tc, 823);
      const wood: RGB = age < 0.3 ? [58, 46, 36] : age < 0.8 ? [76, 60, 44] : [92, 76, 58];
      c = sleeper === 0 ? tint(wood, 8) : sleeper === 2 ? tint(wood, -10) : wood;
    }
    for (const r of [tc - GAUGE, tc + GAUGE]) {
      if (u === r) return [184, 186, 180];
      if (u === r + 1) return [82, 82, 80];
      // The tie plate under the rail on each sleeper.
      if ((u === r - 1 || u === r + 2) && sleeper < 3) return [52, 50, 48];
    }
  }
  return c;
}

/** Rails set flush where a street crosses the line on the level, with
 * timber planking between them. */
export function levelCrossing(base: RGB, u: number, v: number, planks: boolean): RGB {
  for (const tc of TRACKS) {
    const d = u - tc;
    if (Math.abs(d) > GAUGE + 1) continue;
    for (const r of [tc - GAUGE, tc + GAUGE]) {
      if (u === r) return [178, 180, 174];
      if (u === r + 1) return [34, 34, 36];
    }
    if (planks && Math.abs(d) < GAUGE) {
      const plank = mod(v, 5);
      return plank === 0 ? [62, 50, 38] : tint([112, 90, 66], plank === 1 ? 6 : 0);
    }
  }
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
  /** A smooth surface gets a poured gutter; setts and brick run to the kerb. */
  pan = true,
): RGB {
  const m = lane.marks;
  const W = lane.span * 16;
  if (lane.tram) {
    const rail = tramRail(u, v, W);
    if (rail) return rail;
  }
  if (lane.junction) return base;
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
    if (!pan) return base;
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
    if (flake > (tyred ? 0.82 : 0.9) || hash(v, u, 782) < 0.006)
      return mix(colour, base, 0.45);
    return mix(colour, base, Math.max(0, flake - 0.3) * 0.3);
  };
  const inside = u >= GUTTER && u < W - GUTTER;

  if (toJunction < 32 && inside && lane.crossing !== false && m.crossing !== "none") {
    const bars = m.crossing === "zebra" || m.crossing === "ladder";
    const edges = m.crossing === "ladder" || m.crossing === "lines";
    if (edges && (toJunction <= 3 && toJunction >= 2 || toJunction >= 27 && toJunction <= 28))
      return paint(WHITE);
    if (bars && toJunction >= 5 && toJunction <= 25 && mod(u - GUTTER, 8) < 5)
      return paint(WHITE);
    return base;
  }
  if (toJunction < 32) return base;
  if (m.stopLine && lane.stopLine !== false && toJunction >= 33 && toJunction <= 35 && inside) {
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
