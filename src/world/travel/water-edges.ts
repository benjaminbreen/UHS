import type { BoundarySeam } from "./seams";

export type WaterCrossing = { at: number; width: number; flow: number };
export type EdgeRange = Pick<BoundarySeam, "side" | "start" | "end">;
export function edgePoint(
  size: number,
  edge: EdgeRange,
  t: number,
  depth = 0,
): [number, number] {
  const along =
    -size / 2 + (edge.start + t * (edge.end - edge.start)) * (size - 1);
  return edge.side === "N"
    ? [along, -size / 2 + depth]
    : edge.side === "S"
      ? [along, size / 2 - 1 - depth]
      : edge.side === "W"
        ? [-size / 2 + depth, along]
        : [size / 2 - 1 - depth, along];
}
export const outward = (side: EdgeRange["side"]): [number, number] =>
  side === "N"
    ? [0, -1]
    : side === "S"
      ? [0, 1]
      : side === "W"
        ? [-1, 0]
        : [1, 0];
