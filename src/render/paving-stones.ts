import type { StreetMaterial } from "../content/settlements/streets";
import type { Pavement } from "../world/v3/types";
import { waterHash as hash, waterNoise } from "./water-style";
import { shade } from "./palette";
const mod = (n: number, d: number) => ((n % d) + d) % d;
type Color = readonly [number, number, number];
const limestone: readonly Color[] = [
  [181, 176, 151], [175, 172, 150], [187, 180, 155], [177, 173, 156],
];
const basalt: readonly Color[] = [
  [132, 141, 139], [138, 146, 140], [128, 136, 138], [143, 148, 140],
];
const cobble: readonly Color[] = [
  [161, 153, 132], [153, 150, 134], [166, 156, 136], [155, 149, 137],
];
const sett: readonly Color[] = [
  [149, 149, 141], [143, 147, 146], [155, 151, 140], [145, 143, 141],
];
const brick: readonly Color[] = [
  [162, 112, 78], [153, 105, 76], [165, 117, 84], [157, 109, 81],
];
export type PavingGrade = "fine" | "street" | "broad" | "dais" | "court" | "yard";
export function pavingGrade(pavement?: Pavement): PavingGrade {
  return pavement === "dais" ? "dais"
    : pavement === "square" ? "broad"
    : pavement === "court" ? "court"
    : pavement === "yard" ? "yard" : "street";
}
const grades: Record<PavingGrade, { w: number; h: number; lift: number }> = {
  fine: { w: 18, h: 12, lift: 0 },
  street: { w: 18, h: 12, lift: 0 },
  broad: { w: 26, h: 16, lift: 3 },
  court: { w: 22, h: 14, lift: 2 },
  yard: { w: 18, h: 12, lift: -3 },
  dais: { w: 26, h: 16, lift: 8 },
};
const tint = (c: Color, v: number): Color => {
  const s = shade(c, v);
  return [s[0], s[1], s[2]];
};

/** How much sun and blown sand a town's paving takes, from the ecology its
 * ground lies in. */
export function dustOf(biome?: string): number {
  return biome === "desert"
    ? 1
    : biome === "dry-scrub"
      ? 0.7
      : biome === "savanna"
        ? 0.45
        : biome === "grassland"
          ? 0.15
          : 0;
}
export const SAND: Color = [206, 188, 150];
const mixC = (a: Color, b: Color, t: number): Color => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/** Paving in a dry country: dark binder bleached by the sun to a warm grey,
 * every surface taking the ground's colour into its pores, and a fine grit
 * of blown sand over it that gathers where feet and wheels do not sweep. */
export function sunAndSand(c: Color, dust: number, wx: number, wy: number, asphalt: boolean): Color {
  if (!dust) return c;
  let out = c;
  // Paint and pale aggregate are already bleached; only the binder fades.
  if (asphalt && c[0] + c[1] + c[2] < 330) {
    const k = dust * 0.9;
    out = [
      Math.round(c[0] + (c[0] * 0.4 + 48) * k),
      Math.round(c[1] + (c[1] * 0.34 + 42) * k),
      Math.round(c[2] + (c[2] * 0.22 + 32) * k),
    ];
  }
  out = mixC(out, SAND, 0.18 * dust);
  // Blown sand lies in soft patches where feet and wheels do not sweep, in
  // two steps with a dithered edge, and a stray grain here and there.
  const lie = waterNoise(wx, wy, 14, 581) + (hash(wx, wy, 583) - 0.5) * 0.06;
  const deep = 0.84 - 0.1 * dust,
    thin = 0.72 - 0.1 * dust;
  if (lie > deep) return mixC(out, SAND, 0.42);
  if (lie > thin) return mixC(out, SAND, 0.2);
  if (hash(wx, wy, 584) < 0.012 * dust) return mixC(out, SAND, 0.5);
  return out;
}

/** Sand the wind has dropped against a kerb or a wall, `d` pixels out from
 * it: a bank that swells and thins along the street, rippled, with a pale
 * feathered lip where it runs out over the paving. */
export function sandBank(c: Color, dust: number, d: number, along: number, seed: number): Color {
  const swell = waterNoise(along, seed, 23, 591);
  const reach = dust * (1 + 9 * Math.max(0, swell - 0.3));
  if (d >= reach + 1.5) return c;
  if (d >= reach) return hash(along, d, 592) < 0.5 ? mixC(c, SAND, 0.45) : c;
  const ripple = mod(along + Math.round(d) * 2, 6) === 0 ? -6 : 0;
  return tint(SAND, ripple + (d < 1 ? -8 : d < 2 ? -3 : 3));
}

/** Asphalt: a mottled binder with aggregate showing through, the square
 * scars of trenches dug and filled since it was laid, and cracks run with
 * sealant that catches the light along one edge. */
export function asphaltPixel(wx: number, wy: number): Color {
  const mottle = waterNoise(wx, wy, 11, 741) * 0.6 + waterNoise(wx, wy, 4, 742) * 0.4;
  let c: Color = tint([56, 60, 63], Math.round((mottle - 0.5) * 9));
  const grain = hash(wx, wy, 720);
  if (grain > 0.994) c = tint(c, 7);
  else if (grain < 0.02) c = tint(c, -4);
  // Utility cuts: rectangles of newer, blacker binder with a sealed seam.
  const px = Math.floor(wx / 40),
    py = Math.floor(wy / 32);
  const cut = hash(px, py, 743);
  if (cut < 0.045) {
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
    return (above - 0.5) * (crack - 0.5) < 0 && above > crack ? [66, 70, 73] : [43, 46, 49];
  }
  return c;
}

/** Water-bound macadam: crushed stone rolled into a warm buff crust, the
 * aggregate showing as small lit and shaded chips, two worn tracks where the
 * wheels run, and the dark of old wet patches. */
export function macadamPixel(wx: number, wy: number): Color {
  const mottle = waterNoise(wx, wy, 13, 861) * 0.6 + waterNoise(wx, wy, 5, 862) * 0.4;
  let c: Color = tint([164, 150, 124], Math.round((mottle - 0.5) * 10));
  const chip = hash(wx >> 1, wy >> 1, 863);
  if (chip > 0.93) c = tint(c, 10);
  else if (chip < 0.07) c = tint(c, -9);
  else if (hash(wx, wy, 864) > 0.97) c = tint(c, -14);
  const wet = waterNoise(wx, wy, 31, 865);
  if (wet > 0.7) c = [c[0] - 16, c[1] - 14, c[2] - 8];
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

/** Fitted volcanic stones have polygonal joints, rather than dressed courses. */
function basaltPixel(wx: number, wy: number, lift: number): Color {
  const w = 14, h = 11;
  const col = Math.floor(wx / w), row = Math.floor(wy / h);
  let first = Infinity, second = Infinity, ax = 0, ay = 0, bx = 0, by = 0, pick = 0;
  for (let j = row - 1; j <= row + 1; j++)
    for (let i = col - 1; i <= col + 1; i++) {
      const sx = i * w + 3 + Math.floor(hash(i, j, 701) * 8),
        sy = j * h + 2 + Math.floor(hash(i, j, 702) * 7);
      const d = (wx - sx) ** 2 + (wy - sy) ** 2;
      if (d < first) {
        second = first; bx = ax; by = ay;
        first = d; ax = sx; ay = sy; pick = Math.floor(hash(i, j, 703) * basalt.length);
      } else if (d < second) {
        second = d; bx = sx; by = sy;
      }
    }
  const face = tint(basalt[pick], lift);
  const edge = (second - first) / (2 * Math.hypot(bx - ax, by - ay));
  if (edge < 0.45) return tint(face, -17);
  if (edge < 1.25 && bx + by < ax + ay) return tint(face, 6);
  if (edge < 1 && bx + by > ax + ay) return tint(face, -5);
  return face;
}

/** World-addressed surfaces: narrow joints and short accents keep paving flat. */
export function pavingStonePixel(
  wx: number,
  wy: number,
  material: StreetMaterial,
  grade: PavingGrade = "street",
  across = false,
): Color {
  const g = grades[grade];
  if (material === "asphalt") return asphaltPixel(wx, wy);
  if (material === "macadam") return macadamPixel(wx, wy);
  if (material === "basalt") return basaltPixel(wx, wy, g.lift);
  if (material === "plank") {
    const u = across ? wx : wy, v = across ? wy : wx;
    const board = Math.floor(u / 5), i = mod(u, 5);
    const cut = mod(v + Math.floor(hash(board, 0, 733) * 37), 37);
    const tone = Math.floor(hash(board, Math.floor((v + Math.floor(hash(board, 0, 733) * 37)) / 37), 735) * 3) * 4 - 4;
    const face: Color = [139 + tone, 111 + tone, 78 + tone];
    if (i === 0 || cut === 0) return [101, 83, 65];
    if (i === 2 && (cut === 2 || cut === 35)) return [111, 91, 68];
    if (i === 1) return tint(face, 5);
    if (i === 3 && mod(v, 13) > 4 && mod(v, 13) < 9) return tint(face, -4);
    return face;
  }
  if (material === "concrete") {
    if (grade === "street" || grade === "fine") return sidewalkPixel(wx, wy);
    const row = Math.floor(wy / 18), col = Math.floor(wx / 26);
    const x = mod(wx, 26), y = mod(wy, 18);
    const tone = Math.floor(hash(col, row, 766) * 3) * 3 - 3;
    const face: Color = [172 + tone, 174 + tone, 163 + tone];
    if (x === 0 || y === 0) return tint(face, -15);
    if (y === 1 && x > 2 && x < 16) return tint(face, 3);
    return face;
  }
  if (material === "cobble" || material === "sett" || material === "brick") {
    const rounded = material === "cobble", fired = material === "brick";
    const w = rounded ? 8 : fired ? 10 : 9, h = rounded ? 7 : fired ? 6 : 8;
    const row = Math.floor(wy / h);
    const offset = mod(row, 2) * Math.floor(w / 2) + (rounded ? Math.floor(hash(row, 0, 713) * 3) : 0);
    const col = Math.floor((wx + offset) / w), x = mod(wx + offset, w), y = mod(wy, h);
    const id = hash(col, row, 711), palette = rounded ? cobble : fired ? brick : sett;
    const face = tint(palette[Math.floor(id * palette.length)], g.lift);
    const corner = (x === 1 || x === w - 1) && (y === 1 || y === h - 1);
    const joint: Color = fired ? [134, 118, 94] : rounded ? [128, 125, 110] : [119, 123, 121];
    if (x === 0 || y === 0 || (corner && (rounded || (!fired && id < 0.35)))) return tint(joint, g.lift);
    if (y === 1 && x > 1 && x < w - 2) return tint(face, rounded ? 8 : 5);
    if (rounded && y === 2 && x === 2 && id > 0.65) return tint(face, 6);
    if ((y === h - 1 && x > 2) || (x === w - 1 && y > 2)) return tint(face, -5);
    return face;
  }
  const row = Math.floor(wy / g.h);
  const width = g.w + Math.floor(hash(row, 0, 701) * 3);
  const offset = Math.floor(hash(row, 0, 702) * width);
  const col = Math.floor((wx + offset) / width), x = mod(wx + offset, width), y = mod(wy, g.h);
  const id = hash(col, row, 703);
  const face = tint(limestone[Math.floor(id * limestone.length)], g.lift);
  const joint = tint(face, -20);
  if (x === 0 || y === 0) return joint;
  if (x === 1 && y === 1 && id > 0.75) return joint;
  if (y === 1 && x > 2 && x < width - 5) return tint(face, 5);
  if (x === 1 && y > 2 && y < g.h - 4 && id < 0.45) return tint(face, 3);
  if (y === g.h - 1 && x > width / 2) return tint(face, -4);
  if (id < 0.16 && y === g.h - 4 && x >= 4 && x <= 6) return tint(face, -5);
  return face;
}
