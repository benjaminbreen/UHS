import { nameRegions } from "../characters/profiles/name-regions.generated";
import type { CultureId } from "../history/types";

/**
 * A map label for a coordinate. The naming atlas already divides the world into
 * named regions with boxes, so it doubles as the region layer; the narrowest
 * box containing the point wins, and a tie falls to the earlier id.
 */
const byArea = [...nameRegions].sort(
  (a, b) =>
    (a.bounds[2] - a.bounds[0]) * (a.bounds[3] - a.bounds[1]) -
      (b.bounds[2] - b.bounds[0]) * (b.bounds[3] - b.bounds[1]) ||
    a.id.localeCompare(b.id),
);
export function regionAt(
  lon: number,
  lat: number,
): { id: string; label: string; culture: CultureId } | undefined {
  return byArea.find(
    (r) =>
      lon >= r.bounds[0] &&
      lon <= r.bounds[2] &&
      lat >= r.bounds[1] &&
      lat <= r.bounds[3],
  );
}
