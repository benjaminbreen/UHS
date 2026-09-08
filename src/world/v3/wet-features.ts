import { random } from "../../core/random";
import { noise } from "../v2/noise";
import type { Ecology } from "../../content/ecology/profiles";
/** Sparse independently shaped coves/bars. Long quiet bank sections remain. */
export function bankOffset(seed: string, along: number, side: number) {
  const block = Math.floor(along / 32);
  let offset = 0;
  for (let b = block - 1; b <= block + 1; b++) {
    if (random(seed, "bank-feature", b, side) < 0.42) continue;
    const center = b * 32 + 8 + random(seed, "bank-center", b, side) * 16;
    const radius = 5 + random(seed, "bank-radius", b, side) * 6;
    const t = Math.abs(along - center) / radius;
    if (t < 1)
      offset +=
        (random(seed, "bank-sign", b, side) > 0.35 ? 1 : -0.65) *
        (1 - t * t) ** 2 *
        (1.8 + random(seed, "bank-size", b, side) * 2.6);
  }
  return offset;
}
/** A bounded basin candidate, admitted only in a moist lowland by the caller. */
export function marshBasin(
  seed: string,
  x: number,
  y: number,
  ecology: Ecology,
) {
  if (ecology === "desert" || ecology === "dry-scrub") return undefined;
  const bx = Math.floor(x / 24),
    by = Math.floor(y / 24);
  if (
    random(seed, "basin-present", bx, by) > (ecology === "wetland" ? 0.7 : 0.36)
  )
    return undefined;
  const cx = bx * 24 + 6 + random(seed, "basin-x", bx, by) * 12,
    cy = by * 24 + 6 + random(seed, "basin-y", bx, by) * 12;
  const rx = 1.3 + random(seed, "basin-rx", bx, by) * 2.1,
    ry = 1 + random(seed, "basin-ry", bx, by) * 1.5;
  const d = (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
  return {
    distance: d,
    x: cx,
    y: cy,
    wet: noise(seed, cx, cy, 22, "habitat-drainage"),
  };
}
