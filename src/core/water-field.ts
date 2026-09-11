import type { TopographySample } from "./topography";
/** Integer world-coordinate noise: no per-frame random draws or chunk-local seeds. */
export function waterHash(x: number, y: number, salt = 0) {
  let n =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(salt, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
/** Smooth world-anchored fields; field sampling never depends on chunk boundaries. */
export function waterNoise(x: number, y: number, scale: number, salt: number) {
  const ix = Math.floor(x / scale),
    iy = Math.floor(y / scale);
  const sx = x / scale - ix,
    sy = y / scale - iy;
  const fx = sx * sx * (3 - 2 * sx),
    fy = sy * sy * (3 - 2 * sy);
  return (
    (waterHash(ix, iy, salt) * (1 - fx) + waterHash(ix + 1, iy, salt) * fx) *
      (1 - fy) +
    (waterHash(ix, iy + 1, salt) * (1 - fx) +
      waterHash(ix + 1, iy + 1, salt) * fx) *
      fy
  );
}
/** Bilinear reconstruction of the continuous bed at native-pixel centers. */
export function waterDistance(sample: TopographySample, x: number, y: number) {
  const ix = Math.floor(x - 0.5),
    iy = Math.floor(y - 0.5);
  const fx = x - 0.5 - ix,
    fy = y - 0.5 - iy;
  const d = (a: number, b: number) => {
    const c = sample(a, b);
    // A canal draws its own lips and gives its neighbours no shoreline.
    if (c?.surface === "water" && c.waterVisual?.kind === "canal") return 4;
    return (
      c?.waterVisual?.distance ??
      (c?.surface === "water" || c?.bridge
        ? c.waterDepth === "deep"
          ? -4
          : -1
        : 1)
    );
  };
  return (
    (d(ix, iy) * (1 - fx) + d(ix + 1, iy) * fx) * (1 - fy) +
    (d(ix, iy + 1) * (1 - fx) + d(ix + 1, iy + 1) * fx) * fy
  );
}
export function coastDistance(
  distance: number,
  x: number,
  y: number,
  settings?: { coastScallop?: number; coastScale?: number },
) {
  const amplitude = settings?.coastScallop ?? 1.4,
    scale = Math.max(4, settings?.coastScale ?? 18);
  const scallop =
    (waterNoise(x, y, scale, 912) - 0.5) * 1.4 +
    (waterNoise(x, y, scale * 0.37, 913) - 0.5) * 0.6;
  const fade = Math.max(0, Math.min(1, (12 - Math.abs(distance)) / 6));
  return distance + amplitude * scallop * fade;
}

export function shoreDistance(
  sample: TopographySample,
  x: number,
  y: number,
  ox = 0,
  oy = 0,
) {
  const c = sample(Math.floor(x), Math.floor(y));
  const d = waterDistance(sample, x, y);
  if (c && c.height > 0 && c.surface !== "water") return Math.max(0.08, d);
  return d + (waterNoise((x + ox) * 16, (y + oy) * 16, 7, 319) - 0.5) * 0.14;
}
export function waterContactDistance(
  sample: TopographySample,
  x: number,
  y: number,
  ox = 0,
  oy = 0,
  polish?: { enabled: boolean; coastScallop?: number; coastScale?: number },
) {
  let d = shoreDistance(sample, x, y, ox, oy);
  if (sample(Math.floor(x), Math.floor(y))?.waterVisual?.kind === "sea")
    d = coastDistance(d, x + ox, y + oy, polish);
  if (polish?.enabled)
    d +=
      (waterNoise((x + ox) * 16 - 0.5, (y + oy) * 16 - 0.5, 9, 482) - 0.5) *
      0.24;
  return d;
}
export const MAX_WADING_DEPTH = 0.85;
export function waterDepthAt(sample: TopographySample, x: number, y: number) {
  const c = sample(Math.floor(x), Math.floor(y));
  if (
    !c ||
    c.bridge ||
    c.ramp ||
    c.feature === "paving" ||
    c.surface === "soil"
  )
    return 0;
  // Legacy terrain keeps its original collision contract.
  if (!c.waterVisual) return c.surface === "water" ? Infinity : 0;
  if (c.waterVisual.kind === "canal") return Infinity;
  if (c.waterVisual.distance > 3) return 0;
  const d = Math.max(
    0,
    -waterContactDistance(sample, x, y, 0, 0, { enabled: true }),
  );
  return d <= 2 ? d * 0.35 : 0.7 + (d - 2) * 0.8;
}
export const wadingCost = (depth: number) =>
  1 + Math.min(MAX_WADING_DEPTH, depth) * 1.8;
