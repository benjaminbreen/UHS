import { valueNoise } from "./noise";
import type { TopographyCell, TopographySample } from "./topography";
import { iceDistance } from "./water-field";

type Visual = NonNullable<TopographyCell["waterVisual"]>;
/** Under OPEN the water never closed over; under THIN the ice bears a person
 * for a step or two and then goes. */
export const ICE_OPEN = 0.14;
export const ICE_THIN = 0.34;
const unit = (n: number) => Math.max(0, Math.min(1, n));
/** How well frozen water bears at a pixel `d` cells inside the shore: the
 * winter's frost, less the current in mid-river and the swell at the edge of
 * sea ice, in slow patches. The raster draws what this says, so thin ice is
 * the dark ice. */
export function iceStrength(v: Visual, d: number, wx: number, wy: number) {
  let s = v.frost ?? 0.7;
  if (v.kind === "river") s -= 0.3 * unit((-d - 1) / 2);
  else if (v.kind === "sea") s -= 0.4 * unit((-d - 4) / 2.3);
  else if (v.kind === "lake") s -= 0.1 * unit((-d - 2) / 6);
  return (
    s +
    0.15 * unit(1 + d / 1.2) +
    (valueNoise(wx, wy, 80, 631) - 0.5) * 0.36 +
    (valueNoise(wx, wy, 26, 632) - 0.5) * 0.1
  );
}
/** The strength of the ice a cell is walked on, or nothing where there is
 * none to walk on. Shore-fast sea ice is cut off by distance, not strength. */
export function iceAt(sample: TopographySample, x: number, y: number) {
  const c = sample(x, y), v = c?.waterVisual;
  if (!c || !v || v.ice !== "solid" || c.bridge || c.ramp || c.surface !== "water") return undefined;
  const d = iceDistance(sample, x + 0.5, y + 0.5);
  if (d > -0.3) return undefined;
  const s = iceStrength(v, d, x * 16 + 8, y * 16 + 8);
  // The drawn edge wanders about -7; a cell bears only if all of it is inside.
  if (v.kind === "sea") return d > -5.4 ? Math.max(s, ICE_OPEN + 0.05) : undefined;
  return s >= ICE_OPEN + 0.04 ? s : undefined;
}
