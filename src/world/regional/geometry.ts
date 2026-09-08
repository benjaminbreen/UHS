import type { Coordinate, Bounds } from "../../content/geography/regions/types";
import type { Point } from "../../core/types";
export const inBounds = (lon: number, lat: number, b: Bounds) =>
  lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];
export function inPolygon(x: number, y: number, points: readonly Coordinate[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
export function nearestSegment(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return {
    distance: Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy),
    flow: [
      dx / (Math.hypot(dx, dy) || 1),
      dy / (Math.hypot(dx, dy) || 1),
    ] as const,
  };
}
