import { waterNoise } from "../water-style";
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
        (waterNoise(x, y, 11, 919) - 0.5) *
        1.4)
  );
}
