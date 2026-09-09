import { prefix, randomFrom } from "../../core/random";
import { trimCache } from "../../core/cache";
const smooth = (t: number) => t * t * (3 - 2 * t);
type Lattice = { state: number; corners: Map<number, number> };
const lattices = new Map<string, Map<string, Lattice>>();
// Neighbouring cells share three of four corners, and the seed and domain
// strings are the same for every call, so both are folded once per domain.
function lattice(seed: string, domain: string): Lattice {
  let bySeed = lattices.get(seed);
  if (!bySeed) {
    trimCache(lattices, 8);
    lattices.set(seed, (bySeed = new Map()));
  }
  let l = bySeed.get(domain);
  if (!l) {
    l = { state: prefix(seed, domain), corners: new Map() };
    trimCache(bySeed, 256);
    bySeed.set(domain, l);
  }
  return l;
}
function corner(l: Lattice, ix: number, iy: number): number {
  // Packed key; exact while |ix| and |iy| stay under 2^20, which world
  // coordinates divided by any noise scale do.
  const k = ix * 2097152 + iy;
  let v = l.corners.get(k);
  if (v === undefined) {
    v = randomFrom(l.state, ix, iy);
    trimCache(l.corners, 65536);
    l.corners.set(k, v);
  }
  return v;
}
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
  const l = lattice(seed, domain);
  const a = corner(l, ix, iy),
    b = corner(l, ix + 1, iy),
    c = corner(l, ix, iy + 1),
    d = corner(l, ix + 1, iy + 1);
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
