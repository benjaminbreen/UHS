/** Shared opt-in terrain contract for the study and v3 terrain revision 1. */
export type HeightTier = 0 | 1 | 2 | 3;
export type GroundSurface =
  | "grass"
  | "damp"
  | "dry"
  | "soil"
  | "gravel"
  | "water"
  | "sand"
  | "snow";
export type Direction = "n" | "e" | "s" | "w";
export type TerrainPoint = { x: number; y: number };
export type PathStroke = {
  a: readonly [number, number];
  b: readonly [number, number];
  radius: number;
};
export type TopographyCell = {
  pathArt?: PathStroke[];
  height: HeightTier;
  biome?:
    | "wetland"
    | "grassland"
    | "dry-upland"
    | import("../content/ecology/profiles").Ecology;
  moisture?: number;
  streetMaterial?: import("../content/settlements/streets").StreetMaterial;
  habitat?: import("../world/v3/habitats").Habitat;
  surface: GroundSurface;
  /** Continuous gravel ground versus the legacy shallow drainage overlay. */
  feature?: "bank" | "paving" | "field";
  waterDepth?: "shallow" | "deep";
  /** Presentation metadata only: does not change water collision or simulation. */
  waterVisual?: {
    distance: number;
    kind: "river" | "sea" | "lake";
    ecology: import("../content/ecology/profiles").Ecology;
    shoreWidth: number;
    flow: readonly [number, number];
    frozenMargin: boolean;
  };
  /** On the lower tile, pointing toward its one-tier-higher neighbor. */
  ramp?: Direction;
  bridge?: boolean;
  solid?: boolean;
};
export type TopographySample = (
  x: number,
  y: number,
) => TopographyCell | undefined;
export const directions: Record<Direction, TerrainPoint> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};
export const neighbors = [
  [0, -1, 1],
  [1, 0, 2],
  [0, 1, 4],
  [-1, 0, 8],
  [1, -1, 16],
  [1, 1, 32],
  [-1, 1, 64],
  [-1, -1, 128],
] as const;
export function contourMask(
  sample: TopographySample,
  x: number,
  y: number,
  matches: (cell: TopographyCell) => boolean,
) {
  let mask = 0;
  for (const [dx, dy, bit] of neighbors) {
    const c = sample(x + dx, y + dy);
    if (c && matches(c)) mask |= bit;
  }
  // Diagonals already covered by a cardinal edge need no extra atlas variant.
  for (const [bit, adj] of [
    [16, 3],
    [32, 6],
    [64, 12],
    [128, 9],
  ])
    if (mask & adj) mask &= ~bit;
  return mask;
}
/** Movement is an edge property. Ramps admit entry only along their axis, and
 * never grant access through their side wall or across a multi-tier drop. */
export function terrainStep(
  sample: TopographySample,
  from: TerrainPoint,
  to: TerrainPoint,
): { allowed: boolean; reason: string } {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
    // Both ways around the corner must be legal. In particular a diagonal
    // cannot hop over a ledge, water tile, or the side of a ramp.
    for (const via of [
      { x: to.x, y: from.y },
      { x: from.x, y: to.y },
    ]) {
      for (const [a, b] of [
        [from, via],
        [via, to],
      ]) {
        const step = terrainStep(sample, a, b);
        if (!step.allowed) return step;
      }
    }
    return { allowed: true, reason: "Walking diagonally on clear ground." };
  }
  if (Math.abs(dx) + Math.abs(dy) !== 1)
    return { allowed: false, reason: "Take one cardinal step." };
  const a = sample(from.x, from.y),
    b = sample(to.x, to.y);
  if (!a || !b) return { allowed: false, reason: "Edge of the study." };
  if (a.solid || b.solid)
    return { allowed: false, reason: "A building or tree blocks this tile." };
  if (
    (a.surface === "water" && !a.bridge) ||
    (b.surface === "water" && !b.bridge)
  )
    return { allowed: false, reason: "Water — use the bridge." };
  for (const cell of [a, b]) {
    if (cell.ramp) {
      const axis = directions[cell.ramp];
      if ((axis.x !== 0 && dy !== 0) || (axis.y !== 0 && dx !== 0))
        return {
          allowed: false,
          reason: "Enter the slope from its upper or lower end.",
        };
    }
  }
  if (a.height === b.height)
    return {
      allowed: true,
      reason:
        b.surface === "damp"
          ? "Walking through damp meadow."
          : "Walking on level ground.",
    };
  const lower = a.height < b.height ? a : b;
  const sign = a.height < b.height ? 1 : -1;
  const ramp = lower.ramp && directions[lower.ramp];
  const allowed =
    Math.abs(a.height - b.height) === 1 &&
    !!ramp &&
    ramp.x === dx * sign &&
    ramp.y === dy * sign;
  return {
    allowed,
    reason: allowed
      ? "Crossing a one-tier slope."
      : "A ledge blocks the way — find a slope.",
  };
}
