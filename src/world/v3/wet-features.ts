import { random } from "../../core/random";
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
