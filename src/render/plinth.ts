import type { Rock } from "../content/geography/rock";
import type { PlinthFace } from "../content/settlements/yards";
import type { TopographySample } from "../core/topography";
import { waterHash as hash, waterNoise as noise } from "./water-style";

type Rgb = readonly number[];
const mod = (n: number, d: number) => ((n % d) + d) % d;
const mix = (a: Rgb, b: Rgb, t: number) => a.map((v, k) => v * (1 - t) + b[k] * t);
const lit = (c: Rgb, f: number) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));

/** Pixels of south face showing under the platform's front edge. */
const RISE: Record<PlinthFace, number> = { plaster: 7, dressed: 4, drystone: 5, mud: 4, earth: 6 };
/** The stair's first and last column in its cell. */
const STAIR = [2, 13] as const;

/** Building stone as it weathers in a wall, by the country rock. */
const stone: Record<Rock, Rgb> = {
  basalt: [98, 96, 104],
  granite: [156, 150, 146],
  limestone: [182, 172, 148],
  chalk: [204, 200, 186],
  sandstone: [184, 156, 116],
  redstone: [174, 128, 102],
  laterite: [168, 118, 92],
  shale: [130, 124, 120],
};

/** Where joints fall along a course of field stone, in a run that repeats. */
const COURSES = [
  { period: 14, joints: [0, 5, 9] },
  { period: 15, joints: [3, 7, 13] },
];

type Kit = { top: Rgb; rim: Rgb; face: Rgb };

function kitOf(face: PlinthFace, soil: number[][], turf: number[][], rock?: Rock): Kit {
  const r = rock ? stone[rock] : stone.limestone;
  if (face === "mud") {
    const top = mix(soil[3], [196, 170, 128], 0.5);
    return { top, rim: top, face: lit(top, 0.8) };
  }
  // Base, light and dark of the sward: a bank grassed over, capped in clay.
  if (face === "earth") return { top: mix(soil[3], [226, 204, 160], 0.4), rim: soil[2], face: turf[0] };
  if (face === "plaster") {
    const top = mix(soil[3], [238, 230, 210], 0.86);
    return { top, rim: top, face: lit(r, 0.84) };
  }
  if (face === "dressed") {
    const cut = mix(r, [188, 184, 176], 0.55);
    return { top: mix(soil[3], [212, 198, 168], 0.5), rim: cut, face: lit(cut, 0.8) };
  }
  return { top: mix(lit(r, 1.2), soil[3], 0.42), rim: lit(r, 1.06), face: lit(r, 0.84) };
}

/** The platform's upper surface, away from its edges. */
function floorPixel(face: PlinthFace, k: Kit, wx: number, wy: number): Rgb {
  if (face === "plaster")
    // Relaid in layers; a hairline where a layer has split.
    return lit(k.top, Math.abs(noise(wx, wy, 13, 923) - 0.5) < 0.012 ? 0.9 : noise(wx, wy, 37, 921) > 0.72 ? 0.97 : 1);
  if (face === "mud" || face === "earth")
    // Smeared by hand; the sweeps dry a shade apart.
    return lit(k.top, noise(wx, wy, 19, 943) > 0.66 ? 1.05 : hash(wx, wy, 945) < 0.02 ? 0.88 : 1);
  if (face === "dressed")
    // Rammed earth, trodden hard; a little grit on it.
    return lit(k.top, hash(wx, wy, 925) < 0.025 ? 0.86 : noise(wx, wy, 23, 927) > 0.7 ? 1.04 : 1);
  // Water-worn pebbles laid as a floor, two pixels to a stone.
  const p = hash(wx >> 1, wy >> 1, 929);
  return lit(k.top, p < 0.14 ? (wy & 1 ? 0.8 : 0.9) : p > 0.88 ? 1.1 : 1);
}

/** The kerb round a stone-edged platform, `along` its run and `d` in from the edge. */
function kerbPixel(face: PlinthFace, k: Kit, along: number, d: number): Rgb {
  const unit = face === "dressed" ? 8 : 6;
  if (d === 2) return lit(k.rim, 0.74);
  if (mod(along, unit) === 0) return lit(k.rim, 0.7);
  const tone = 1 + (hash(Math.floor(along / unit), 0, 931) - 0.5) * 0.1;
  return lit(k.rim, tone * (d === 0 ? 1.08 : 1));
}

/** One row of a field-stone course: its lit top, its body or its shaded foot. */
function coursePixel(k: Kit, wx: number, course: number, part: 0 | 1 | 2): Rgb {
  const { period, joints } = COURSES[course],
    at = mod(wx, period);
  // Stones are rounded: the joint opens at the top and closes at the foot.
  if (joints.includes(at)) return lit(k.face, part === 1 ? 0.56 : 0.66);
  const id = joints.filter((j) => j <= at).length + Math.floor(wx / period) * 3;
  const tone = 1 + (hash(id, course, 937) - 0.5) * 0.2;
  return lit(k.face, tone * [1.14, 0.96, 0.74][part]);
}

/** The south face, `r` rows down from the arris and `rise` rows tall. */
function facePixel(face: PlinthFace, k: Kit, wx: number, r: number, rise: number, soil: number[][], turf: number[][]): Rgb {
  // A tall platform goes up in two tiers with a ledge between.
  if (rise >= 9 && face !== "earth") {
    const upper = (rise - 2) >> 1;
    if (r === upper || r === upper + 1) return lit(k.rim, r === upper ? 1.02 : 0.86);
    return r < upper
      ? facePixel(face, k, wx, r, upper, soil, turf)
      : facePixel(face, k, wx + 5, r - upper - 2, rise - upper - 2, soil, turf);
  }
  if (face === "earth") {
    // Turf lit along the crest and darkening down the bank, with tufts.
    const t = r / (rise - 1),
      tuft = hash(wx, r >> 1, 947);
    if (r === rise - 1) return mix(turf[2], soil[0], 0.35);
    return tuft < 0.1 ? turf[1] : tuft > 0.9 || t > 0.6 ? turf[2] : r === 0 ? turf[1] : turf[0];
  }
  if (r === rise - 1) return mix(lit(k.face, 0.5), soil[0], 0.3);
  if (face === "mud")
    // Rounded over at the top; cracked where the smear has dried.
    return lit(k.face, r === 0 ? 1.14 : hash(wx >> 1, r, 949) < 0.06 ? 0.84 : 1);
  if (face === "dressed") {
    if (mod(wx + (r < 2 ? 0 : 4), 8) === 0) return lit(k.face, 0.68);
    return lit(k.face, r === 1 ? 0.8 : r === 0 ? 1.06 : 0.96);
  }
  if (face === "plaster") {
    // The floor's plaster turns down over the edge; below it the retaining
    // wall of field stone shows.
    if (r < 2) return lit(k.top, r ? 0.78 : 0.92);
    r -= 2;
  }
  return coursePixel(k, wx, r < 3 ? 0 : 1, (r < 3 ? r : r - 3) as 0 | 1 | 2);
}

/** Draw house platforms over a finished ground tile: floor, kerb, the south
 * face with its stair, and the shadow they throw south and east. */
export function plinthOver(
  pixels: Uint8ClampedArray,
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  soil: number[][],
  turf: number[][],
) {
  const at = (dx: number, dy: number) => sample(x + dx, y + dy)?.plinth;
  const here = at(0, 0),
    above = at(0, -1),
    beside = at(-1, 0),
    corner = at(-1, -1);
  if (!here && !above && !beside && !corner) return;
  const set = (px: number, py: number, c: Rgb) => {
    const i = (py * 16 + px) * 4;
    pixels[i] = c[0];
    pixels[i + 1] = c[1];
    pixels[i + 2] = c[2];
    pixels[i + 3] = 255;
  };
  const dim = (px: number, py: number, f: number) => {
    const i = (py * 16 + px) * 4;
    // Shadow on sunlit ground cools as it darkens.
    pixels[i] = pixels[i] * f * 0.97;
    pixels[i + 1] = pixels[i + 1] * f;
    pixels[i + 2] = Math.min(255, pixels[i + 2] * f * 1.04);
  };
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  const rock = sample(x, y)?.rock;
  if (!here) {
    const rise = above ? above.rise ?? RISE[above.face] : 0;
    // The stair runs on down from the face above in whole steps of three rows.
    const run = above?.steps ? Math.ceil((rise + 2) / 3) * 3 - rise : 0;
    const k = above && kitOf(above.face, soil, turf, rock);
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const onStair = px >= STAIR[0] && px <= STAIR[1];
        if (k && onStair && py < run) {
          const r = (rise + py) % 3;
          set(px, py, r === 2 ? lit(k.face, 0.58) : lit(k.rim, r ? 0.96 : 1.06));
        } else if (above) {
          // The stair throws its own shadow past its foot and to the east.
          const from = onStair || (run && px > STAIR[1] && px <= STAIR[1] + 2) ? run : 0;
          if (py - from < 3) dim(px, py, [0.64, 0.78, 0.9][Math.max(0, py - from)]);
        } else if (beside ? px < 3 : corner && px < 3 && py < 3) dim(px, py, [0.7, 0.82, 0.92][corner && !beside ? Math.max(px, py) : px]);
      }
    return;
  }
  const { face } = here,
    k = kitOf(face, soil, turf, rock),
    rise = here.rise ?? RISE[face];
  const north = !above,
    south = !at(0, 1),
    west = !beside,
    east = !at(1, 0);
  const kerbed = face === "dressed" || face === "drystone";
  const front = south ? 16 - rise : 16;
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = gx + px,
        wy = gy + py;
      const onStair = !!here.steps && px >= STAIR[0] && px <= STAIR[1];
      if (py >= front) {
        const r = py - front;
        if (onStair) set(px, py, r % 3 === 2 ? lit(k.face, 0.58) : lit(k.rim, r % 3 ? 0.96 : 1.06));
        else {
          const c = facePixel(face, k, wx, r, rise, soil, turf);
          // The corners catch and lose the light.
          set(px, py, west && px === 0 ? lit(c, 1.1) : east && px === 15 ? lit(c, 0.8) : c);
        }
        continue;
      }
      const dn = north ? py : 99,
        ds = south ? front - 1 - py : 99,
        dw = west ? px : 99,
        de = east ? 15 - px : 99,
        d = Math.min(dn, ds, dw, de);
      if (kerbed && d <= 2 && !(onStair && ds === d && d > 0)) {
        const along = d === dn || d === ds ? wx : wy;
        set(px, py, kerbPixel(face, k, along + (d === dn || d === ds ? 0 : 3), d));
        continue;
      }
      const floor = floorPixel(face, k, wx, wy);
      // Plaster turns down over the edge: a lit arris in front, a dark seam
      // against the ground elsewhere, a pale line just inside it.
      if (ds === 0) set(px, py, onStair ? floor : lit(k.top, 1.07));
      else if (d === 0) set(px, py, mix(lit(k.top, 0.7), soil[1], 0.25));
      else if (dn === 1 || dw === 1) set(px, py, lit(k.top, 1.05));
      else set(px, py, floor);
    }
}
