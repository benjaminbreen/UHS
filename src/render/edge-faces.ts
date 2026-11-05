import type { EdgeStyle } from "../content/settlements/terraces";
import type { Rock } from "../content/geography/rock";

/** Faces for steps in the ground that are not plain earth: a settlement's
 * retaining walls, and bare rock on tall natural drops. Pure functions of
 * world position, shared by the south face and the east/west returns. */
type Color = readonly number[];

const hash = (x: number, y: number, salt: number) => {
  let h =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(salt, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const mod = (n: number, m: number) => ((n % m) + m) % m;
const mul = (c: Color, f: number) => [c[0] * f, c[1] * f, c[2] * f];
const mix = (a: Color, b: Color, t: number) =>
  [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t);

type Masonry = {
  stones: Color[];
  mortar: Color;
  /** Dressed capping course; absent on a dry-laid wall. */
  coping?: Color;
  course: number;
  block: number;
  /** Block length varies course to course. */
  irregular?: boolean;
  /** Share of local stone colour taken by the wall. */
  local: number;
};
const masonry: Record<Exclude<EdgeStyle, "timber" | "adobe">, Masonry> = {
  drystone: {
    stones: [
      [124, 120, 108],
      [144, 138, 122],
      [104, 102, 94],
    ],
    mortar: [62, 60, 54],
    course: 4,
    block: 6,
    irregular: true,
    local: 0.6,
  },
  rubble: {
    stones: [
      [132, 126, 112],
      [150, 144, 128],
      [116, 112, 102],
    ],
    mortar: [84, 80, 72],
    coping: [196, 190, 170],
    course: 4,
    block: 7,
    irregular: true,
    local: 0.45,
  },
  ashlar: {
    stones: [
      [190, 180, 150],
      [204, 194, 164],
      [178, 168, 140],
    ],
    mortar: [140, 130, 106],
    coping: [226, 218, 192],
    course: 5,
    block: 10,
    local: 0.25,
  },
  brick: {
    stones: [
      [150, 78, 58],
      [166, 90, 66],
      [134, 68, 52],
    ],
    mortar: [104, 58, 46],
    coping: [200, 196, 184],
    course: 3,
    block: 6,
    local: 0,
  },
  concrete: {
    stones: [
      [168, 168, 162],
      [172, 172, 166],
      [164, 164, 158],
    ],
    mortar: [132, 132, 128],
    coping: [198, 198, 192],
    course: 99,
    block: 32,
    local: 0,
  },
};

/** Walls with a dressed cap also carry a low parapet. */
export const hasParapet = (style: EdgeStyle) =>
  style === "ashlar" || style === "brick" || style === "concrete";

/** Colour of the capping course, which is also the rim of the terrace. */
export function copingColor(style: EdgeStyle, stone: Color): number[] {
  if (style === "timber") return [134, 94, 56];
  if (style === "adobe") return [214, 182, 134];
  const m = masonry[style];
  return m.coping ? [...m.coping] : mix(mul(m.stones[1], 1.12), stone, m.local);
}

/** One pixel of a wall face. `r` counts down from the rim, `wx` runs along
 * the wall, and `stone` is the ecology's own rock for locally quarried walls. */
export function wallPixel(
  style: EdgeStyle,
  r: number,
  drop: number,
  wx: number,
  stone: Color,
): number[] {
  if (style === "timber") {
    // Plank revetment: uprights, a waler under the top, a dark foot.
    if (r === 0) return [150, 108, 66];
    if (r === 3 || r === drop - 4) return [74, 48, 30];
    const plank =
      mod(wx, 5) === 0
        ? [74, 48, 30]
        : hash(Math.floor(wx / 5), 0, 3) < 0.5
          ? [112, 76, 46]
          : [134, 94, 56];
    return r >= drop - 2 ? mul(plank, 0.7) : plank;
  }
  if (style === "adobe") {
    if (r < 2) return r ? [204, 172, 124] : [214, 182, 134];
    let c: number[] = [190, 156, 108];
    if (hash(wx, 0, 5) < 0.1 && r < drop * 0.6) c = mul(c, 0.9);
    if (hash(Math.floor(wx / 3), Math.floor(r / 4), 7) < 0.08) c = mul(c, 0.82);
    return r >= drop - 2 ? mul(c, 0.72) : c;
  }
  const m = masonry[style];
  const top = m.coping ? 3 : 0;
  if (m.coping) {
    if (r < 2) return r ? mul(m.coping, 0.9) : [...m.coping];
    if (r === 2) return mul(m.stones[2], 0.6);
  } else if (r === 0) return copingColor(style, stone);
  const course = Math.floor((r - top) / m.course);
  const block = m.irregular
    ? m.block - 2 + Math.floor(hash(course, Math.floor(wx / 40), 7) * 4)
    : m.block;
  const jx = wx + (course % 2 ? block >> 1 : 0);
  let c: number[];
  if (m.course < 99 && mod(r - top, m.course) === m.course - 1)
    c = [...m.mortar];
  else if (mod(jx, block) === 0) c = [...m.mortar];
  else
    c = mix(
      m.stones[Math.floor(hash(Math.floor(jx / block), course, 8) * 3)],
      stone,
      m.local,
    );
  // Weathering streaks under the cap of a cast wall.
  if (style === "concrete" && r < drop * 0.6 && hash(wx, 0, 9) < 0.12)
    c = mul(c, 0.88);
  return r >= drop - 1 ? mul(c, 0.72) : c;
}

type RockLook = {
  /** Seven tones, deepest shadow to highlight, the shadows leaning cool. */
  ramp: readonly Color[];
  /** Mean width of one buttress of rock. */
  pillar: number;
  /** Height and mean width of the blocks a buttress is jointed into; 0 for none. */
  course: number;
  block: number;
  /** How deep the gap between buttresses reads, 0 to 1. */
  notch: number;
  /** Laterite's holes. */
  pitted?: boolean;
  /** Chalk's rows of flint nodules. */
  flint?: boolean;
  /** Shale's thin beds, alternately harder and softer. */
  beds?: boolean;
};
const rocks: Record<Rock, RockLook> = {
  sandstone: {
    ramp: [[48, 30, 34], [78, 46, 40], [108, 66, 48], [136, 88, 58], [164, 112, 70], [192, 140, 88], [218, 172, 114]],
    pillar: 16, course: 10, block: 12, notch: 1,
  },
  redstone: {
    ramp: [[56, 26, 30], [96, 40, 36], [136, 60, 44], [174, 86, 56], [202, 114, 72], [226, 146, 96], [242, 182, 130]],
    pillar: 20, course: 9, block: 14, notch: 0.8,
  },
  basalt: {
    ramp: [[22, 22, 30], [38, 40, 50], [56, 58, 68], [74, 76, 86], [94, 96, 104], [118, 120, 126], [146, 148, 150]],
    pillar: 7, course: 26, block: 0, notch: 1,
  },
  granite: {
    ramp: [[52, 50, 60], [80, 78, 86], [108, 104, 108], [136, 130, 130], [162, 156, 152], [188, 182, 174], [212, 206, 196]],
    pillar: 24, course: 13, block: 18, notch: 0.7,
  },
  limestone: {
    ramp: [[86, 80, 76], [122, 114, 104], [154, 146, 130], [180, 172, 154], [202, 194, 174], [222, 216, 196], [240, 234, 216]],
    pillar: 26, course: 5, block: 20, notch: 0.6,
  },
  laterite: {
    ramp: [[56, 24, 24], [92, 40, 32], [128, 60, 40], [160, 82, 50], [188, 108, 64], [210, 136, 84], [230, 168, 112]],
    pillar: 14, course: 6, block: 8, notch: 0.9, pitted: true,
  },
  shale: {
    ramp: [[40, 38, 42], [60, 56, 58], [82, 76, 74], [104, 96, 90], [126, 118, 106], [150, 140, 124], [174, 164, 144]],
    pillar: 30, course: 3, block: 0, notch: 0.5, beds: true,
  },
  chalk: {
    ramp: [[110, 112, 116], [150, 152, 150], [186, 188, 182], [210, 210, 202], [228, 228, 218], [240, 240, 232], [250, 250, 244]],
    pillar: 36, course: 0, block: 0, notch: 0.35, flint: true,
  },
};
/** A soft bank, where the ground is too wet to stand as rock. */
const earth: RockLook = {
  ramp: [[44, 30, 28], [70, 46, 36], [96, 64, 46], [122, 84, 56], [148, 106, 68], [172, 130, 84], [196, 158, 106]],
  pillar: 22, course: 0, block: 0, notch: 0.45,
};
const STAINS = {
  moss: [72, 98, 50],
  varnish: [50, 36, 30],
  lichen: [184, 164, 98],
} as const;
export type Stain = keyof typeof STAINS;

/** Which run of a regular stride, each nudged by up to `spread` of its width,
 * holds `x`: the run's index, the offset into it and its width. */
function runAt(x: number, stride: number, spread: number, salt: number) {
  const start = (k: number) => k * stride + Math.floor(hash(k, salt, 31) * stride * spread);
  let k = Math.floor(x / stride);
  while (x < start(k)) k--;
  while (x >= start(k + 1)) k++;
  return { k, u: x - start(k), w: start(k + 1) - start(k) };
}

/** Bare rock, for natural drops too tall to stand as an earth bank: a row of
 * buttresses, each a rounded mass lit from the left with a dark gap beside
 * it, jointed into low-contrast blocks. `turf` is the ground on top, which
 * drapes over the brink in a cushion; without it the rock runs to the rim. */
export function cliffPixel(
  rock: Rock | "earth",
  r: number,
  drop: number,
  wx: number,
  wy: number,
  turf?: ArrayLike<number>,
  stain?: Stain,
): number[] {
  const look = rock === "earth" ? earth : rocks[rock];
  const ramp = look.ramp;
  // Keyed to the world, not to the rim: on a diagonal brink every column has
  // its own rim height, and a pattern hung from it shatters into speckle.
  const salt = 0,
    ay = wy + r;
  // Buttress outlines bow a pixel either way down the face.
  const bow = Math.round(Math.sin(r * 0.21 + (wx >> 4)) * 0.8);
  const { k, u, w } = runAt(wx + bow, look.pillar, 0.6, salt);
  const edge = Math.min(u, w - 1 - u);
  const hk = hash(k, salt, 91);
  let top = 0;
  if (turf) {
    // A cushion of rounded clumps, thickest over a buttress and dipping into
    // the gaps, with the odd blade hanging below.
    const clump = runAt(wx, 5, 0.7, salt + 1);
    const x = ((clump.u + 0.5) / clump.w) * 2 - 1;
    const bulge = Math.sqrt(Math.max(0, 1 - x * x));
    const blade = hash(wx, 0, 63);
    const lip =
      (drop > 24 ? 5 : 3) + Math.round(hk * 2 + bulge * (1.5 + hash(clump.k, 0, 61) * 2)) + (edge < 2 ? 3 - edge : 0) +
      (blade < 0.07 ? 2 + Math.floor(blade * 50) : 0);
    if (r < lip) {
      const [dark, shade, base, lit, top] = grassRamp(turf);
      const tip = hash(wx, r, 65);
      if (r === 0) return tip < 0.5 ? top : lit;
      if (r === lip - 1) return dark;
      if (r === lip - 2) return shade;
      // Light on the upper face of each clump, shade under it.
      const sunny = r / (lip - 2) < 0.5 - x * 0.3;
      if (turf[1] > turf[0] && tip > 0.985) return [236, 206, 86];
      if (sunny) return tip < 0.25 ? base : tip > 0.8 ? top : lit;
      return tip < 0.25 ? shade : base;
    }
    top = lip;
  } else if (r === 0) return [...ramp[6]];
  const rr = r - top,
    height = Math.max(1, drop - top);
  let f: number;
  if (u >= w - 1) f = (1 - look.notch) * 2;
  else if (u === w - 2) f = 1 + (1 - look.notch) * 2;
  else {
    const across = u / (w - 2);
    f = 5 - across * 2.2 + (u === 0 ? 0.8 : 0) + (hk - 0.5) * 0.6;
    if (look.beds) {
      const c = Math.floor((ay + Math.round(Math.sin(wx * 0.15) * 1.2)) / look.course);
      f += hash(k >> 1, c, 99) < 0.4 ? -0.9 : hash(k >> 1, c, 98) < 0.3 ? 0.5 : 0;
    } else if (look.course) {
      // Each buttress is stacked from chunky blocks of its own, rounded at
      // the corners, lit on their upper left and shaded below.
      const course = runAt(ay + Math.floor(hk * 9), look.course, 0.7, k * 3 + salt);
      const block = look.block
        ? runAt(u + Math.round(Math.sin(ay * 0.5 + k) * 0.6) + course.k * 5, look.block, 0.7, course.k + k * 13)
        : { k: 0, u: u, w: w - 2 };
      const left = block.u,
        right = block.w - 1 - block.u,
        up = course.u,
        down = course.w - 1 - course.u;
      const hb = hash(k * 31 + block.k, course.k, 97);
      f += (hb - 0.5) * 0.9;
      if ((right === 0 || down === 0) && hb < 0.85) f -= 1.3;
      else if (Math.min(left, right) + Math.min(up, down) === 0) f -= 0.9;
      else if (up === 0 || left === 0) f += 0.7;
      else if (down === 1 || right === 1) f -= 0.4;
    }
  }
  // Light falls off down the face and gathers in shade at the foot.
  f -= Math.pow(rr / height, 1.4) * (drop > 24 ? 1.9 : 1.1);
  if (rr < 2 && turf) f -= 1.6 - rr * 0.6;
  const grain = hash(wx, r, 41);
  if (grain < 0.02) f -= 0.7;
  if (look.pitted && grain > 0.95) f -= 1.5;
  if (look.flint && ay % 11 === 0 && hash(wx >> 1, r, 55) < 0.4) f = 0.5;
  if (r >= drop - 3) f = Math.min(f, r >= drop - 1 ? 0 : 1);
  let c = [...ramp[Math.max(0, Math.min(6, Math.round(f)))]];
  if (stain) {
    const s = hash(wx >> 1, wy, 67);
    const run = height * (0.25 + hash(wx >> 1, wy, 69) * 0.55);
    if (stain === "lichen") {
      if (hash(wx >> 1, r >> 1, 71) < 0.04) c = mix(c, STAINS.lichen, 0.6);
    } else if (s < 0.12 && rr < run) c = mix(c, STAINS[stain], 0.35 * (1 - rr / run / 2));
  }
  return c;
}

/** Five greens from one ground colour, the shadows turned toward blue and
 * the lights toward yellow, as a painter would rather than by darkening. */
export function grassRamp(turf: ArrayLike<number>): number[][] {
  const [r, g, b] = [turf[0], turf[1], turf[2]];
  const at = (k: number, lift: readonly number[]) =>
    [r * k + lift[0], g * k + lift[1], b * k + lift[2]].map((v) => Math.max(0, Math.min(255, Math.round(v))));
  return [
    at(0.42, [0, 4, 14]),
    at(0.66, [0, 4, 10]),
    at(0.9, [0, 2, 0]),
    at(1.08, [18, 16, -6]),
    at(1.18, [42, 34, -14]),
  ];
}

/** Height of a grass tuft standing at this column, 0 for none: clumps of
 * blades, tallest in the middle, every other blade shorter. */
export function tuftHeight(wx: number, wy: number, density: number, tall: number): number {
  const { k, u, w } = runAt(wx, 9, 0.8, wy & 63);
  if (hash(k, wy, 101) >= density) return 0;
  const width = 4 + Math.floor(hash(k, wy, 103) * 4);
  const x = u - Math.floor((w - width) / 2);
  if (x < 0 || x >= width) return 0;
  const centre = 1 - Math.abs(((x + 0.5) / width) * 2 - 1);
  const h = tall * (0.4 + centre * 0.6) * (0.75 + hash(k, wy, 105) * 0.5);
  return Math.max(0, Math.round(h) - (x % 2 ? 2 : 0) - (hash(wx, wy, 107) < 0.3 ? 1 : 0));
}

/** One pixel of a tuft, `j` up from its base: dark at the root, light at the tip. */
export function tuftPixel(turf: ArrayLike<number>, j: number, h: number, wx: number): number[] {
  const [dark, shade, base, lit, top] = grassRamp(turf);
  if (j >= h - 1) return top;
  if (j === 0) return dark;
  if (j === 1) return shade;
  return wx % 2 ? base : lit;
}
