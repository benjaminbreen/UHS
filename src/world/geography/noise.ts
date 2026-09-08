import { random } from "../../core/random";
const smooth = (t: number) => t * t * (3 - 2 * t);
export function noise(
  seed: string,
  x: number,
  y: number,
  scale: number,
  domain = "land",
) {
  x /= scale;
  y /= scale;
  const ix = Math.floor(x),
    iy = Math.floor(y),
    u = smooth(x - ix),
    v = smooth(y - iy);
  const a = random(seed, domain, ix, iy),
    b = random(seed, domain, ix + 1, iy),
    c = random(seed, domain, ix, iy + 1),
    d = random(seed, domain, ix + 1, iy + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
export function segmentDistance(
  x: number,
  y: number,
  a: readonly number[],
  b: readonly number[],
) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    t = Math.max(
      0,
      Math.min(
        1,
        ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}
