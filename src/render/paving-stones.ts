import type { StreetMaterial } from "../content/settlements/streets";
import type { Pavement } from "../world/v3/types";
import { waterHash as hash } from "./water-style";
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
const tint = (c: Color, v: number): Color => [c[0] + v, c[1] + v, c[2] + v];

/** Native-pixel broken flagstones, continuously addressed in world coordinates.
 * Short edge accents describe individual stones without outlining every face.
 * Row offsets vary independently, avoiding both tile seams and a regular brick grid.
 */
export function pavingStonePixel(
  wx: number,
  wy: number,
  material: StreetMaterial,
  grade: PavingGrade = "street",
): Color {
  const g = grades[grade];
  // Rounded fieldstones and dressed granite blocks have different silhouettes,
  // not merely different tints of the flagstone texture.
  if (material === "cobble" || material === "sett") {
    const rounded = material === "cobble";
    const scale = grade === "fine" ? 0 : grade === "street" ? 1 : 2;
    const w = (rounded ? 6 : 7) + scale,
      h = (rounded ? 5 : 4) + scale;
    const row = Math.floor(wy / h),
      offset = mod(row, 2) * Math.floor(w / 2);
    const col = Math.floor((wx + offset) / w);
    const x = mod(wx + offset, w),
      y = mod(wy, h);
    const variation = Math.floor(hash(col, row, 711) * 27) - 13;
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
          ? [128, 126, 111]
          : [115, 124, 125];
    const light = y === 1 ? 12 : y === h - 1 ? -11 : 0;
    const base: Color = rounded ? [169, 167, 148] : [155, 164, 165];
    return tint(base, variation + light + g.lift);
  }
  const height = g.h;
  const row = Math.floor(wy / height);
  const width = g.w + Math.floor(hash(row, 0, 701) * 3);
  const offset = Math.floor(hash(row, 0, 702) * width);
  const column = Math.floor((wx + offset) / width);
  const x = mod(wx + offset, width),
    y = mod(wy, height);
  const id = hash(column, row, 703),
    palette = material === "basalt" ? basalt : limestone;
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
      : tint([214, 208, 188], g.lift)
    : material === "basalt"
      ? tint([168, 178, 174], g.lift)
      : tint([206, 199, 176], g.lift);
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
  // Street flagstones: pale joints, a lit top and left edge, a shaded bottom
  // and right, and each stone a shade off its neighbours.
  const tone = Math.floor(hash(column, row, 704) * 13) - 6;
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
