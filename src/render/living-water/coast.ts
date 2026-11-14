import { valueNoise } from "../../core/noise";
import type { ShorePolish } from "./polish";
export { coastDistance } from "../../core/water-field";
export function coastBeachWidth(
  width: number,
  x: number,
  y: number,
  settings?: ShorePolish,
) {
  return (
    width *
    (1 +
      (settings?.beachVariation ?? 0.5) *
        (valueNoise(x, y, 11, 919) - 0.5) *
        1.4)
  );
}
