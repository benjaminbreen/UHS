import type { StreetMaterial } from "../content/settlements/streets";
import type { Pavement } from "../world/v3/types";
import { waterHash as hash, waterNoise } from "./water-style";
import { shade } from "./palette";
const mod = (n: number, d: number) => ((n % d) + d) % d;
type Color = readonly [number, number, number];
// The accepted v1 flagstone ramp: broad warm-gray faces with quiet value changes.
const limestone: readonly Color[] = [
  [186, 182, 160],
  [180, 176, 155],
  [170, 169, 149],
  [191, 185, 162],
];
const basalt: readonly Color[] = [
  [143, 150, 147],
  [126, 137, 136],
  [158, 162, 153],
  [139, 146, 143],
];

/** Stone size and jointing by what the paving is for. A square is laid in
 * broad dressed slabs with pale mortar; a lane in small stones with dark
 * joints; a dais in the largest, palest slabs so it reads as one platform. */
export type PavingGrade = "fine" | "street" | "broad" | "dais";
export function pavingGrade(pavement?: Pavement): PavingGrade {
  return pavement === "dais"
    ? "dais"
    : pavement === "square"
      ? "broad"
      : // One stone for streets, lanes and footways: the smaller "fine" grade
        // read as a second material laid in patches.
        "street";
}
const grades: Record<
  PavingGrade,
  { w: number; h: number; lift: number; lightJoint: boolean }
> = {
  fine: { w: 10, h: 8, lift: -2, lightJoint: false },
  street: { w: 13, h: 9, lift: 2, lightJoint: false },
  broad: { w: 12, h: 10, lift: 4, lightJoint: true },
  dais: { w: 14, h: 11, lift: 12, lightJoint: true },
};
const tint = (c: Color, v: number): Color => {
  const s = shade(c, v);
  return [s[0], s[1], s[2]];
};

/** Asphalt: a mottled binder with aggregate showing through, the square
 * scars of trenches dug and filled since it was laid, and cracks run with
 * sealant that catches the light along one edge. */
export function asphaltPixel(wx: number, wy: number): Color {
  const mottle = waterNoise(wx, wy, 11, 741) * 0.6 + waterNoise(wx, wy, 4, 742) * 0.4;
  let c: Color = tint([56, 60, 63], Math.round((mottle - 0.5) * 9));
  const grain = hash(wx, wy, 720);
  if (grain > 0.978) c = grain > 0.996 ? [98, 99, 94] : tint(c, 12);
  else if (grain < 0.04) c = tint(c, -8);
  // Utility cuts: rectangles of newer, blacker binder with a sealed seam.
  const px = Math.floor(wx / 40),
    py = Math.floor(wy / 32);
  const cut = hash(px, py, 743);
  if (cut < 0.16) {
    const x0 = px * 40 + 4 + Math.floor(hash(px, py, 744) * 14),
      y0 = py * 32 + 3 + Math.floor(hash(px, py, 745) * 10),
      w = 10 + Math.floor(hash(px, py, 746) * 18),
      h = 6 + Math.floor(hash(px, py, 747) * 12);
    const ix = wx - x0,
      iy = wy - y0;
    if (ix >= 0 && iy >= 0 && ix < w && iy < h) {
      if (ix === 0 || iy === 0 || ix === w - 1 || iy === h - 1)
        return iy === 0 || ix === 0 ? [42, 45, 49] : [64, 67, 69];
      return grain > 0.985 ? tint(c, 8) : tint([49, 52, 57], Math.round((mottle - 0.5) * 5));
    }
  }
  // Sealed cracks follow one contour of a slow field, broken into runs.
  const crack = waterNoise(wx, wy, 23, 748);
  if (Math.abs(crack - 0.5) < 0.008 && waterNoise(wx, wy, 37, 749) > 0.62) {
    const above = waterNoise(wx, wy - 1, 23, 748);
    return (above - 0.5) * (crack - 0.5) < 0 && above > crack ? [92, 96, 102] : [30, 32, 36];
  }
  return c;
}

/** A poured sidewalk scored into squares: a tooled joint with a lit lip on
 * its far side, a broom finish, panels a shade apart where they were poured on
 * different days, the odd crack and the grime of feet. */
export function sidewalkPixel(wx: number, wy: number): Color {
  const S = 12;
  const col = Math.floor(wx / S),
    row = Math.floor(wy / S);
  const x = mod(wx, S),
    y = mod(wy, S);
  const pour = hash(col, row, 761);
  if (x === 0 || y === 0) return x === 0 && y === 0 ? [118, 119, 114] : [132, 134, 128];
  let face: Color = tint([174, 175, 167], Math.round((pour - 0.5) * 9));
  if (x === 1 || y === 1) face = tint(face, 5);
  else if (x === S - 1 || y === S - 1) face = tint(face, -3);
  // Broom lines run across the pour.
  if (mod(wy, 2) === 0 && hash(wx >> 1, wy, 762) < 0.35) face = tint(face, -2);
  const grime = waterNoise(wx, wy, 9, 763);
  if (grime > 0.68) face = tint(face, -Math.round((grime - 0.68) * 30));
  // One panel in twenty-five has settled and cracked corner to corner.
  if (pour < 0.04) {
    const d = pour < 0.02 ? x - y : x + y - S;
    if (d === Math.floor(hash(col, row, 764) * 3) - 1) return [120, 121, 116];
  }
  if (hash(wx, wy, 765) > 0.994) return [138, 136, 128];
  return face;
}

/** Native-pixel broken flagstones, continuously addressed in world coordinates.
 * Short edge accents describe individual stones without outlining every face.
 * Row offsets vary independently, avoiding both tile seams and a regular brick grid.
 */
export function pavingStonePixel(
  wx: number,
  wy: number,
  material: StreetMaterial,
  grade: PavingGrade = "street",
  /** Boards run north-south, across a street that runs east-west. */
  across = false,
): Color {
  const g = grades[grade];
  if (material === "plank") {
    const u = across ? wx : wy,
      v = across ? wy : wx;
    const board = Math.floor(u / 4),
      i = mod(u, 4);
    const tone = Math.floor(hash(board, 0, 731) * 25) - 12;
    // Timbers are relaid piecemeal: each board breaks at its own place.
    const cut = mod(v + Math.floor(hash(board, 0, 733) * 29), 29);
    if (i === 0 || cut === 0) return [58, 45, 33];
    const wood: Color = hash(board, Math.floor(v / 29), 735) < 0.2
      ? [118, 110, 96]
      : [128, 96, 64];
    const grain = hash(Math.floor(v / 3), board * 4 + i, 737) > 0.8 ? -9 : 0;
    const edge = i === 1 ? 10 : i === 3 ? -12 : 0;
    // A peg where the board is fixed to the sleeper beneath.
    if (i === 2 && (cut === 2 || cut === 27)) return [70, 56, 42];
    return tint(wood, tone + grain + edge + g.lift);
  }
  if (material === "asphalt") return asphaltPixel(wx, wy);
  if (material === "concrete" && grade === "street") return sidewalkPixel(wx, wy);
  // Rounded fieldstones and dressed granite blocks have different silhouettes,
  // not merely different tints of the flagstone texture.
  if (material === "cobble" || material === "sett") {
    const rounded = material === "cobble";
    // A square keeps the street's stone size: a second scale read as a seam.
    const scale = grade === "fine" ? 0 : grade === "dais" ? 2 : 1;
    const w = (rounded ? 6 : 7) + scale,
      h = (rounded ? 5 : 4) + scale;
    const row = Math.floor(wy / h),
      offset = mod(row, 2) * Math.floor(w / 2);
    const col = Math.floor((wx + offset) / w);
    const x = mod(wx + offset, w),
      y = mod(wy, h);
    const variation = Math.floor(hash(col, row, 711) * 33) - 16;
    const cast = hash(col, row, 712);
    const joint =
      x === 0 ||
      y === 0 ||
      (rounded && (x === 1 || x === w - 1) && (y === 1 || y === h - 1));
    if (joint)
      return g.lightJoint
        ? rounded
          ? [176, 172, 154]
          : [168, 176, 176]
        : rounded
          ? [101, 99, 92]
          : [96, 104, 106];
    const light = y === 1 ? 12 : y === h - 1 ? -13 : 0;
    const base: Color = rounded ? [160, 158, 146] : [150, 158, 160];
    const stone = tint(base, variation + light + g.lift);
    // A few stones run warm or cool so the field is not one grey.
    return cast < 0.14
      ? [stone[0] + 7, stone[1] + 2, stone[2] - 6]
      : cast > 0.88
        ? [stone[0] - 6, stone[1] - 1, stone[2] + 5]
        : stone;
  }
  const height = g.h;
  const row = Math.floor(wy / height);
  const width = g.w + Math.floor(hash(row, 0, 701) * 3);
  const offset = Math.floor(hash(row, 0, 702) * width);
  const column = Math.floor((wx + offset) / width);
  const x = mod(wx + offset, width),
    y = mod(wy, height);
  const id = hash(column, row, 703),
    palette =
      material === "basalt"
        ? basalt
        : material === "concrete"
          ? ([
              [160, 164, 158],
              [173, 176, 168],
              [184, 184, 173],
              [151, 157, 153],
            ] as readonly Color[])
          : limestone;
  // Dressed slabs are matched stone: half the quarry variation of a street.
  const pick = palette[Math.floor(id * palette.length)];
  const face: Color = g.lightJoint
    ? tint(
        [
          Math.round((pick[0] + palette[0][0]) / 2),
          Math.round((pick[1] + palette[0][1]) / 2),
          Math.round((pick[2] + palette[0][2]) / 2),
        ],
        g.lift,
      )
    : tint(pick, g.lift);
  const joint: Color = g.lightJoint
    ? material === "basalt"
      ? tint([176, 184, 176], g.lift)
      : material === "concrete"
        ? tint([198, 201, 193], g.lift)
        : tint([214, 208, 188], g.lift)
    : material === "basalt"
      ? tint([88, 97, 97], g.lift)
      : material === "concrete"
        ? tint([142, 147, 142], g.lift)
        : tint([138, 131, 110], g.lift);
  // Dressed slabs: straight joints a shade darker than the face, a lit top and
  // left bevel, a shaded bottom and right edge, so every stone has thickness.
  if (g.lightJoint) {
    const bevel = tint(face, 11),
      shade = tint(face, -12);
    if (x === 0 || y === 0) return tint(face, grade === "dais" ? -14 : -20);
    if (y === 1 && x < width - 1) return bevel;
    if (x === 1 && y < height - 1) return bevel;
    if (y === height - 1 || x === width - 1) return shade;
    if (
      x === Math.floor(id * 7) + 3 &&
      y === Math.floor(id * 5) + 3 &&
      id > 0.55
    )
      return tint(face, -6);
    return face;
  }
  // Street flagstones: dark joints, a lit top and left edge, a shaded bottom
  // and right, and each stone a shade off its neighbours.
  const tone = Math.floor(hash(column, row, 704) * 19) - 9;
  const stone = tint(face, tone);
  if (x === 0 || y === 0) return joint;
  // A nicked corner now and then keeps the grid from reading as brickwork.
  if (x === 1 && y === 1 && id > 0.78) return joint;
  if (y === 1 && x < width - 1) return tint(stone, 10);
  if (x === 1 && y < height - 1) return tint(stone, 8);
  if (y === height - 1 || x === width - 1) return tint(stone, -9);
  if (x === Math.floor(id * 4) + 2 && y === height - 3 && id < 0.25)
    return tint(
      palette[(Math.floor(id * 4) + 1) % palette.length],
      g.lift + tone,
    );
  return stone;
}
