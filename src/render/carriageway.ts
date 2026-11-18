import { PARKING, STALL } from "../content/settlements/streets/markings";
import type { Lane } from "../world/v3/types";
import { cellHash as hash, valueNoise } from "../core/noise";
import { asphaltPixel, SAND, sandBank, sunAndSand } from "./paving-stones";

type RGB = readonly number[];
type Color = readonly [number, number, number];
const mod = (n: number, d: number) => ((n % d) + d) % d;
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const tint = (c: RGB, v: number): RGB => [clamp(c[0] + v), clamp(c[1] + v), clamp(c[2] + v * 1.1)];
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t);

const WHITE: RGB = [226, 224, 210];
const YELLOW: RGB = [228, 178, 50];
/** Poured gutter pan and its lip where it meets the binder. */
const PAN: RGB = [134, 134, 127];
// Wide enough to show past the kerb's own shadow, which takes up to eight.
const GUTTER = 13;

/** A two-lane country road outside the kerbed town: asphalt graded to a
 * straight edge, a white edge line, one centre line and a gravel shoulder.
 * Undefined past the shoulder, where the verge's own ground shows. */
export function blacktopPixel(
  f: { radius: number; side?: number; along?: number; paved?: "yellow" | "white" | "none" | "gravel" },
  wx: number,
  wy: number,
  dust = 0,
): RGB | undefined {
  const d = Math.abs(f.side ?? 0),
    r = f.radius * 16,
    along = f.along ?? 0;
  if (f.paved === "gravel") {
    if (d >= r) return;
    const g = hash(wx, wy, 791);
    let gravel: RGB = g < 0.3 ? [124, 117, 102] : g < 0.85 ? [146, 138, 121] : [168, 160, 140];
    // Two wheel tracks packed pale, loose stone thrown to the edges.
    if (Math.abs(d - r * 0.45) <= 2.5) gravel = tint(gravel, 9);
    else if (d >= r - 3) gravel = tint(gravel, -12);
    return dust ? sunAndSand(gravel as Color, dust, wx, wy, false) : gravel;
  }
  // A ditch either side, a grassy trough with water standing in its bottom;
  // in dry country a shallow scrape the sand fills.
  if (d >= r + 6) return;
  if (d >= r + 2) {
    const depth = 1 - Math.abs(d - (r + 4)) / 2;
    if (dust >= 0.5)
      return depth > 0.6 ? tint(SAND, -12) : depth > 0.2 ? tint(SAND, -6) : undefined;
    if (depth > 0.6 && hash(wx >> 1, wy >> 1, 793) < 0.07) return [72, 98, 112];
    return depth > 0.6 ? [44, 62, 40] : depth > 0.2 ? [56, 78, 46] : [70, 96, 54];
  }
  if (d >= r + 1) return;
  if (d >= r - 2) {
    const g = hash(wx, wy, 791);
    const gravel: RGB = g < 0.3 ? [104, 98, 86] : g < 0.8 ? [134, 127, 112] : [158, 150, 132];
    return dust ? sunAndSand(gravel as Color, dust, wx, wy, false) : gravel;
  }
  // Sand blown off the desert lies along the edge of the blacktop.
  if (dust) {
    const out = d - (r - 2);
    const bank = sandBank(sunAndSand(asphaltPixel(wx, wy), dust, wx, wy, true), dust, -out, along, 7);
    if (-out < 9) return bank;
  }
  let base: RGB = dust ? sunAndSand(asphaltPixel(wx, wy), dust, wx, wy, true) : asphaltPixel(wx, wy);
  // Tyres run a lane's width either side of the line.
  if (Math.abs(d - r * 0.45) <= 2) base = tint(base, 5);
  const flake = valueNoise(wx, wy, 2.5, 792);
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
  const stain = valueNoise(v, u + edge, 9, 802);
  if (stain > 0.62) c = tint(c, -Math.round((stain - 0.62) * 45));
  // A bay that has settled cracks from a corner.
  if (pour < 0.12) {
    const x = half ? u - W / 2 : u;
    if (Math.abs(along - x * (pour < 0.06 ? 1.3 : 0.8)) < 0.7) return [96, 97, 94];
  }
  if (hash(v, u, 803) > 0.97) return tint(c, -10);
  return c;
}

/** Grooved rails set flush in the carriageway, one track each way. */
function tramRail(u: number, W: number): RGB | undefined {
  const c = W / 2;
  for (const track of [c - 14, c + 14]) {
    for (const rail of [track - 6, track + 6]) {
      const d = u - rail;
      // Rails lie flush in the street's own stone: a polished head and the
      // dark groove beside it.
      if (d === 0) return [176, 178, 176];
      if (d === 1) return [46, 46, 52];
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
export function levelCrossing(base: RGB, u: number, v: number, planks: boolean | "wharf"): RGB {
  for (const tc of TRACKS) {
    const d = u - tc;
    const wharf = planks === "wharf";
    if (Math.abs(d) > GAUGE + (wharf ? 4 : 1)) continue;
    if (!planks || wharf) {
      const side=Math.sign(d), flange=Math.abs(d)-GAUGE;
      const joint=mod(v+(side<0 ? 0 : 23),61);
      if (flange===0) return joint===0 ? [83,75,68] : [190,180,156];
      if (flange===-1) return [66,59,55];
      if (flange===1) return joint<4 ? [94,77,62] : [130,102,79];
      if (flange===-2 && joint<4) return [93,80,68];
      if (wharf) {
        const tie = mod(v, 8);
        if (tie < 3) {
          if (flange === 2) return tie === 0 ? [160,143,117] : [69,62,54];
          const grain = hash(Math.floor(v/8),tc,823);
          return tint([102,83,65], (grain>.6 ? 8 : 0) + (tie===0 ? 9 : tie===2 ? -15 : 0));
        }
        if (flange < 0) return tint(base,-14);
      }
      return base;
    }
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

/** Whether a travel lane carries a manhole lid in this cell along the street. */
const lidded = (cell: number, index: number, edge: number) => hash(cell, index * 131 + edge, 775) < 0.045;

/** The manhole lids whose centres fall in this cell of a grid street, in
 * world pixels: the same lids `carriagewayPixel` paints. */
export function laneLids(lane: Lane, x: number, y: number): { cx: number; cy: number }[] {
  if (lane.junction) return [];
  const alongX = lane.axis === "x";
  const W = lane.span * 16;
  const P = lane.marks.parking && lane.span >= 6 ? PARKING * 16 : 0;
  const lanes = Math.max(1, Math.round((W - 2 * P) / 40));
  const laneW = (W - 2 * P) / lanes;
  const near = lane.toJunction;
  if (near !== undefined && (Math.abs(near) - 1) * 16 + 7 <= 20) return [];
  const across = alongX ? y : x, cell = alongX ? x : y;
  const edge = (across - lane.at) * 16;
  const out: { cx: number; cy: number }[] = [];
  for (let i = 0; i < lanes; i++) {
    const u = P + (i + 0.5) * laneW - 0.5;
    if (Math.floor(u / 16) !== lane.at || !lidded(cell, i, edge)) continue;
    const a = cell * 16 + 8, b = edge + u + 0.5;
    out.push(alongX ? { cx: a, cy: b } : { cx: b, cy: a });
  }
  return out;
}

/** Which sides of this cell are kerbed. */
export type Kerbs = { low: boolean; high: boolean };

/** The channel at a kerb's foot: `d` pixels out from the kerb line, `v`
 * along it, `side` a key for which kerb. Undefined past the channel. A sett
 * or brick street drains along one course of its own stone; a smooth one has
 * a poured pan. `drains` allows a grate every few lengths. */
export function gutterPixel(base: RGB, d: number, v: number, side: number, gutter: "concrete" | "sett", pan: boolean, drains: boolean): RGB | undefined {
  if (d < 0 || d >= GUTTER) return undefined;
  if (drains && hash(Math.floor(v / 16), side, 771) < 0.13) {
    const along = mod(v, 16);
    if (along >= 2 && along <= 13 && d >= 6 && d <= 11) {
      if (along === 2 || along === 13 || d === 6 || d === 11)
        return d === 6 || along === 2 ? [96, 98, 96] : [54, 56, 58];
      return mod(along, 2) ? [20, 22, 26] : d === 7 ? [104, 106, 104] : [82, 84, 84];
    }
    // Dark silt washed out below the grate.
    if (along >= 3 && along <= 12 && d === 12) return tint(base, -10);
  }
  if (!pan || gutter === "sett") {
    // One course, in the road's own stone a little lighter, so the channel
    // is a line at the kerb's foot and not a second pavement.
    if (d >= 7) return undefined;
    const y = mod(v, 12);
    if (d === 6 || y === 0) return tint(base, -14);
    const wet = valueNoise(v, side, 6, 772) > 0.55;
    return tint(base, (wet ? -6 : 6) + Math.floor(hash(Math.floor(v / 12), 0, 772) * 6) - 3 + (y === 1 ? 5 : 0));
  }
  if (d === GUTTER - 1) return [84, 86, 86];
  if (d >= 8) {
    // Leaves, grit and wet where the pan meets the binder.
    const silt = valueNoise(v, side, 5, 773);
    if (silt > 0.6) return tint(PAN, -22 - (silt > 0.72 ? 10 : 0));
  }
  if (mod(v, 24) === 0) return tint(PAN, -24);
  return tint(PAN, (d === 0 ? -14 : d === 1 ? -6 : 0) + (hash(v, d, 774) < 0.2 ? -4 : 0));
}
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
    const rail = tramRail(u, W);
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
  // A lane too narrow for a cart to pass another has no channel to speak of.
  if ((low || high) && m.gutter !== "none" && W >= 28) {
    const g = gutterPixel(base, low ? u : W - 1 - u, v, edge + (low ? 0 : W), m.gutter, pan, toJunction > 40);
    if (g) return g;
  }

  const lanes = Math.max(1, Math.round((W - 2 * P) / 40));
  const laneW = (W - 2 * P) / lanes;
  const index = Math.min(lanes - 1, Math.max(0, Math.floor((u - P) / laneW)));
  const centre = P + (index + 0.5) * laneW;
  if (toJunction > 20 && u >= P && u < W - P) {
    const cell = Math.floor(v / 16);
    if (lidded(cell, index, edge)) {
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
    else if (off <= 3 && valueNoise(v, u, 7, 776) > 0.52) base = tint(base, -7);
  } else if (P && valueNoise(v, ax, 9, 777) > 0.63) base = tint(base, -8);

  // Paint wears in flakes, worst where tyres run over it.
  const tyred = u >= P && Math.abs(Math.abs(u - centre) - laneW * 0.28) <= 3;
  const paint = (colour: RGB): RGB => {
    const flake = valueNoise(v, u, 2.5, 781);
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

  // A back street carries no paint.
  if (lane.span >= 5) {
    const c = W / 2;
    const dash = mod(v, 48) < 20;
    switch (m.centre) {
      case "yellow-double":
        // A side street carries one line, not the main road's pair.
        if (lane.span < 5 ? u === c - 1 || u === c : u === c - 3 || u === c - 2 || u === c + 1 || u === c + 2) return paint(YELLOW);
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
    // Stalls marked with a tick across the lane.
    const lowSide = u < P;
    const d = lowSide ? P - 1 - u : u - (W - P);
    const s = mod(v, STALL * 16);
    if (d >= 0 && d < P - GUTTER && (s === 0 || s === 1) && d < 14) return paint(WHITE);
  }
  return base;
}
