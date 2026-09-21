import type { EdgeStyle } from "../content/settlements/terraces";

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

/** Bare rock, for natural drops too tall to stand as an earth bank. */
export function cragPixel(
  stone: Color,
  r: number,
  drop: number,
  wx: number,
  wy: number,
): number[] {
  const tones = [
    mul(stone, 0.52),
    mul(stone, 0.76),
    [...stone],
    mul(stone, 1.16),
  ];
  if (r === 0) return tones[3];
  // Vertical fractures wander a little as they fall.
  if (
    hash(
      Math.floor((wx + Math.sin(r * 0.4 + wx) * 1.2) / 3),
      Math.floor(wy / 48),
      77,
    ) < 0.16
  )
    return tones[0];
  const ledge = mod(r + Math.floor(hash(Math.floor(wx / 9), 0, 5) * 5), 7);
  let tone =
    2.2 -
    (r / drop) * 1.6 +
    (hash(Math.floor(wx / 4), Math.floor(r / 3), 13) - 0.5) * 1.6;
  if (ledge === 0) tone += 1;
  if (ledge === 1) tone -= 1;
  return tones[Math.max(0, Math.min(3, Math.round(tone)))];
}
