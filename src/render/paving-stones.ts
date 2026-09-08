import type { StreetMaterial } from "../content/settlements/streets";
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

/** Native-pixel broken flagstones, continuously addressed in world coordinates.
 * Short edge accents describe individual stones without outlining every face.
 * Row offsets vary independently, avoiding both tile seams and a regular brick grid.
 */
export function pavingStonePixel(
  wx: number,
  wy: number,
  material: StreetMaterial,
): Color {
  // Rounded fieldstones and dressed granite blocks have different silhouettes,
  // not merely different tints of the flagstone texture.
  if (material === "cobble" || material === "sett") {
    const rounded = material === "cobble";
    const w = rounded ? 7 : 8,
      h = rounded ? 6 : 5;
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
    if (joint) return rounded ? [128, 126, 111] : [115, 124, 125];
    const light = y === 1 ? 12 : y === h - 1 ? -11 : 0;
    const base = rounded ? [169, 167, 148] : [155, 164, 165];
    const v = variation + light;
    return [base[0] + v, base[1] + v, base[2] + v];
  }
  const height = 8;
  const row = Math.floor(wy / height);
  const width = 9 + Math.floor(hash(row, 0, 701) * 3);
  const offset = Math.floor(hash(row, 0, 702) * width);
  const column = Math.floor((wx + offset) / width);
  const x = mod(wx + offset, width),
    y = mod(wy, height);
  const id = hash(column, row, 703),
    palette = material === "basalt" ? basalt : limestone;
  const face = palette[Math.floor(id * palette.length)];
  const joint: Color =
    material === "basalt" ? [105, 119, 117] : [150, 149, 130];
  // Stepped corners follow the original authored polygon, with occasional chips.
  if (
    (x === 0 && (y === 0 || y >= height - 2)) ||
    (x === width - 1 && (y === 0 || y === height - 1)) ||
    (y === height - 1 && x >= width - 3) ||
    (x === 0 && y === 3 && id > 0.72)
  )
    return joint;
  if (y === 1 && x >= 2 && x <= Math.min(width - 4, 5) && id < 0.87)
    return material === "basalt" ? [176, 183, 170] : [203, 196, 173];
  if (y === height - 1 && x >= 2 && x <= 5)
    return material === "basalt" ? [114, 128, 123] : [162, 160, 141];
  if (x === Math.floor(id * 4) + 2 && y === height - 3 && id < 0.25)
    return palette[(Math.floor(id * 4) + 1) % palette.length];
  return face;
}
