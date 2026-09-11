import { waterNoise } from "../water-style";
import type { ShorePolish } from "./polish";
export function coastDistance(
  distance: number,
  x: number,
  y: number,
  settings?: ShorePolish,
) {
  const amplitude = settings?.coastScallop ?? 1.4,
    scale = Math.max(4, settings?.coastScale ?? 18);
  const scallop =
    (waterNoise(x, y, scale, 912) - 0.5) * 1.4 +
    (waterNoise(x, y, scale * 0.37, 913) - 0.5) * 0.6;
  const fade = Math.max(0, Math.min(1, (12 - Math.abs(distance)) / 6));
  return distance + amplitude * scallop * fade;
}
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
