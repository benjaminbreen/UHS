import type { TopographyCell, TopographySample } from "../core/topography";
import type { Ecology } from "../content/ecology/profiles";
import { WEED_H, WEED_W, weedGlyphs } from "../content/graphics/weed-glyphs";
import { waterHash as hash, waterNoise as noise } from "./water-style";

type Rgb = number[];
const decode = (s: string): Rgb => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
const mix = (a: Rgb, b: Rgb, t: number): Rgb =>
  a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
const shade = (c: Rgb, v: number): Rgb => c.map((n) => n + v);

/** Trodden headland: outline, base, light, fleck. Warm sand everywhere;
 * cold ecologies only a little greyer. */
const headlandRamps: Record<Ecology, string[]> = {
  grassland: ["#8e6539", "#d2b57c", "#dfc78f", "#b9975d"],
  tundra: ["#7f6a4a", "#bfab84", "#cdbb95", "#a68f66"],
  "boreal-woodland": ["#836040", "#c4a97a", "#d3ba8b", "#a98b5c"],
  "temperate-woodland": ["#8a6238", "#cdb078", "#dbc28b", "#b4925a"],
  "tropical-woodland": ["#93653a", "#d4b47a", "#e1c68f", "#bb955a"],
  wetland: ["#7e6444", "#bfa87c", "#ccb88d", "#a48c62"],
  "dry-scrub": ["#a07240", "#dcbe82", "#e9cf97", "#c5a063"],
  desert: ["#a97d4a", "#e0c388", "#edd59d", "#caa566"],
};
export const headlandRamp = Object.fromEntries(
  Object.entries(headlandRamps).map(([k, v]) => [k, v.map(decode)]),
) as Record<Ecology, Rgb[]>;

/** Round a field, from the last furrow outward: a strip of the field's
 * own edge cells left untilled, then on the ground outside a wider
 * trodden buffer and a low bank of thrown-up earth. Depths wander on two
 * slow noises and nothing else, so every edge is one continuous line that
 * bends rather than a dither. */
export function headlandDepths(wx: number, wy: number) {
  const inner = 6 + (noise(wx, wy, 11, 901) - 0.5) * 4;
  const buffer =
    6.5 + (noise(wx, wy, 9, 903) - 0.5) * 3 + (noise(wx, wy, 27, 905) - 0.5) * 2;
  const fence = 11;
  return { inner, buffer, fence };
}
/** Bank thickness in pixels: crest row then outline row. */
export const BANK = 2.2;

/** Corner radius of the soil patch, in pixels. */
const ROUND = 5;

/** How far a field-cell pixel lies inside its enclosure edges, with the
 * soil corner rounded: at most `m` counts as headland. */
export function innerDistance(fence: number, px: number, py: number, m: number) {
  const dx = Math.min(fence & 8 ? px + 0.5 : 99, fence & 2 ? 15.5 - px : 99);
  const dy = Math.min(fence & 1 ? py + 0.5 : 99, fence & 4 ? 15.5 - py : 99);
  const q = Math.hypot(Math.max(0, m + ROUND - dx), Math.max(0, m + ROUND - dy));
  return m + ROUND - q;
}

export type NearField = {
  /** Pixel distance to the field cell's edge. */
  d: number;
  /** Offset of that field cell from the pixel's cell. */
  dx: number;
  dy: number;
  field: NonNullable<TopographyCell["field"]>;
};

/** Field cells within two of a non-field cell, found once per tile. */
export function fieldsNear(sample: TopographySample, x: number, y: number) {
  const out: { dx: number; dy: number; field: NonNullable<TopographyCell["field"]> }[] = [];
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      if (!dx && !dy) continue;
      const f = sample(x + dx, y + dy)?.field;
      if (f && !f.ditch) out.push({ dx, dy, field: f });
    }
  return out;
}

/** The nearest of those field cells to a pixel. */
export function nearestField(
  near: ReturnType<typeof fieldsNear>,
  px: number,
  py: number,
): NearField | undefined {
  let best: NearField | undefined;
  const cx = px + 0.5,
    cy = py + 0.5;
  for (const n of near) {
    const ex = Math.max(n.dx * 16 - cx, 0, cx - (n.dx * 16 + 16));
    const ey = Math.max(n.dy * 16 - cy, 0, cy - (n.dy * 16 + 16));
    const d = Math.hypot(ex, ey);
    if (!best || d < best.d) best = { d, ...n };
  }
  return best;
}

/** Whether the enclosure on `bit` of the field cell at (cx, cy) stands.
 * Era enclosures run in broken lengths of a few cells; a system's own
 * hedge, wall or bund is continuous. */
export function fenceStands(
  field: NonNullable<TopographyCell["field"]>,
  bit: number,
  cx: number,
  cy: number,
) {
  if (!(field.fence & bit)) return false;
  if (!field.enclosure) return true;
  const along = bit === 1 || bit === 4 ? cx : cy;
  const fixed = bit === 1 || bit === 4 ? cy : cx;
  return hash(Math.floor(along / 5), fixed, 915 + bit) > 0.35;
}

export type HeadlandStyle = {
  ecology: Ecology;
  /** Grass palette: 0 base. */
  palette: Rgb[];
};

/** A line is broken where a block of a few pixels drops out. */
const broken = (wx: number, wy: number, salt: number, gap = 0.12) =>
  hash(Math.floor(wx / 5), Math.floor(wy / 5), salt) < gap;

/** Trodden earth of the buffer: flat warm sand, a light patch here and
 * there, sparse two-pixel flecks in loose clusters, and weeds. `out` is
 * 0 at the soil and 1 at the bank. */
export function troddenPixel(
  wx: number,
  wy: number,
  out: number,
  style: HeadlandStyle,
): Rgb {
  const ramp = headlandRamp[style.ecology];
  const weed = weedPixel(wx, wy, out > 0.45 ? 0.62 : 0.3, style);
  if (weed) return weed;
  const patch = noise(wx, wy, 16, 909);
  let rgb = patch > 0.64 ? ramp[2] : patch < 0.3 ? shade(ramp[1], -6) : ramp[1];
  const cluster = noise(wx, wy, 10, 911) > 0.58;
  if (cluster && hash(Math.floor(wx / 2), wy, 913) < 0.16) rgb = ramp[3];
  return rgb;
}

/** A weed glyph pixel at (wx, wy), or undefined. Weeds sit on a 12px
 * lattice, one per cell at most, jittered, present with `density`. */
export function weedPixel(
  wx: number,
  wy: number,
  density: number,
  style: HeadlandStyle,
): Rgb | undefined {
  const base = mix(style.palette[0], [118, 140, 70], 0.5);
  const tones = [shade(base, -30), base, shade(base, 22), headlandRamp[style.ecology][0]];
  const STEP = 12;
  for (let by = Math.floor((wy - 1) / STEP); by <= Math.floor((wy + WEED_H) / STEP); by++)
    for (let bx = Math.floor((wx - WEED_W) / STEP); bx <= Math.floor((wx + WEED_W) / STEP); bx++) {
      if (hash(bx, by, 925) > density) continue;
      const g = weedGlyphs[Math.floor(hash(bx, by, 927) * weedGlyphs.length)];
      // Anchor: bottom centre of the glyph, jittered inside the lattice cell.
      const ax = bx * STEP + 2 + Math.floor(hash(bx, by, 929) * (STEP - 4));
      const ay = by * STEP + 4 + Math.floor(hash(bx, by, 931) * (STEP - 4));
      const gx = wx - (ax - (WEED_W >> 1)),
        gy = wy - (ay - WEED_H + 1);
      if (gx < 0 || gx >= WEED_W || gy < 0 || gy >= WEED_H) continue;
      const ink = +g[gy][gx];
      if (ink) return tones[ink - 1];
    }
  return undefined;
}

/** The bank: a lit crest with a dark outline on its outer side, the
 * outline breaking now and then. `r` is depth into the bank. */
export function bankPixel(wx: number, wy: number, r: number, style: HeadlandStyle): Rgb {
  const ramp = headlandRamp[style.ecology];
  if (r < 1.1) return ramp[2];
  return broken(wx, wy, 933) ? ramp[1] : ramp[0];
}
