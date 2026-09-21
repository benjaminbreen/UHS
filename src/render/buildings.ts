import { buildingModel } from "../content/graphics/models";
import type { Place } from "../core/types";
export { buildingModel, buildingModels } from "../content/graphics/models";
export function buildingPlacement(place: Place) {
  const model = buildingModel(place.sprite);
  return {
    model,
    x: (place.x + place.w / 2) * 16,
    y: (place.y + place.h) * 16,
    originX: model.anchor[0] / model.bounds[2],
    originY: model.anchor[1] / model.bounds[3],
    // East over west on a shared row: the next house hides this one's side
    // wall, so only the end of a terrace shows one.
    depth: (place.y + place.h) * 16 - 2 + place.x * 0.001,
  };
}
export function multiplyTint(a: number, b: number) {
  const ch = (shift: number) =>
    Math.round((((a >> shift) & 255) * ((b >> shift) & 255)) / 255) << shift;
  return ch(16) | ch(8) | ch(0);
}
/** Pixel bounds belong to the visual model, not a hard-coded two-cell roof extension. */
export function buildingContains(place: Place, px: number, py: number) {
  const p = buildingPlacement(place);
  const [left, top, right, bottom] = p.model.occlusion;
  return (
    px >= p.x - p.model.anchor[0] + left &&
    px <= p.x - p.model.anchor[0] + right &&
    py >= p.y - p.model.anchor[1] + top &&
    py <= p.y - p.model.anchor[1] + bottom
  );
}
