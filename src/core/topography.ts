import { waterDepthAt, MAX_WADING_DEPTH } from "./water-field";
/** Shared opt-in terrain contract for the study and v3 terrain revision 1. */
/** Altitude step. Zero is the lowest ground; the ceiling is set per place by
 * its relief rather than by this type. */
export type HeightTier = number;
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
  /** False where no carts ran; absent, wide roads are rutted. */
  ruts?: false;
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
  pavement?: import("../world/v3/types").Pavement;
  streetMaterial?: import("../content/settlements/streets").StreetMaterial;
  habitat?: import("../world/v3/habitats").Habitat;
  /** Presentation-only landscape feature painted by the ground raster. */
  landscape?: import("../world/v3/features").Landscape;
  surface: GroundSurface;
  /** Continuous gravel ground versus the legacy shallow drainage overlay. */
  feature?: "bank" | "paving" | "field";
  /** A farmed cell. Stage is already resolved for the season. `edges` is a
   * bitmask of parcel ends: north 1, east 2, south 4, west 8. A `ditch` cell
   * is a one-cell irrigation channel beside a lane. */
  field?: {
    parcel: number;
    crop: import("../content/agriculture/types").CropId;
    axis: "x" | "y";
    edges: number;
    boundary: import("../content/agriculture/types").Boundary;
    wet: boolean;
    /** Enclosure edges, same bits as `edges`: where the fence or hedge runs. */
    fence: number;
    /** Era enclosure drawn on the fence edges when `boundary` has none. */
    enclosure?: import("../content/agriculture/types").Boundary;
    ditch?: boolean;
    /** Inside a household's or church's yard rather than the farmland. */
    yard?: boolean;
    garden?: boolean;
    /** Whose ground it is. Absent is common ground nobody minds you picking. */
    owner?: string;
    stage: import("../content/agriculture/types").CropStage;
  };
  /** An irrigation channel standing empty: dug and banked, but with no water
   * in it. Walkable, and drawn by the canal raster with a dry bed. */
  dryChannel?: boolean;
  waterDepth?: "shallow" | "deep";
  /** Presentation metadata only: does not change water collision or simulation. */
  waterVisual?: {
    distance: number;
    kind: "river" | "sea" | "lake" | "canal";
    ecology: import("../content/ecology/profiles").Ecology;
    shoreWidth: number;
    flow: readonly [number, number];
    frozenMargin: boolean;
    /** Unit gradient of `distance` at the cell centre, for narrow streams. */
    gradient?: readonly [number, number];
  };
  /** On the lower tile, pointing toward its one-tier-higher neighbor. */
  ramp?: Direction;
  /** How the ramp is drawn; movement does not read it. */
  rampStyle?: "cut" | "slope" | "steps" | "sand" | "timber" | "graded";
  /** How a settlement walls a step below this cell; absent, an earth bank.
   * Presentation only. */
  edge?: import("../content/settlements/terraces").EdgeStyle;
  bridge?: boolean;
  solid?: boolean;
  /** Knee-high: a jump passes over it, but nobody lands on it. A pot in a
   * doorway should cost a hop, not a detour. */
  over?: boolean;
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
    waterDepthAt(sample, from.x + 0.5, from.y + 0.5) > MAX_WADING_DEPTH ||
    waterDepthAt(sample, to.x + 0.5, to.y + 0.5) > MAX_WADING_DEPTH
  )
    return {
      allowed: false,
      reason: "Too deep to wade — find a shallower crossing or bridge.",
    };
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
  // One step up is a scramble anyone can manage, and you may always walk off
  // an edge however far it falls. Only climbing two or more is barred.
  if (b.height < a.height)
    return {
      allowed: true,
      reason:
        a.height - b.height > 1
          ? "Dropping off the edge."
          : "Stepping down a bank.",
    };
  if (b.height === a.height + 1)
    return { allowed: true, reason: "Scrambling up a bank." };
  return {
    allowed: false,
    reason: "Too high to climb — find a slope.",
  };
}

export type LeapKind = "hop" | "climb" | "drop" | "leap";
export type LeapResult = {
  kind: LeapKind;
  /** Tiles travelled along the direction. */
  distance: 1 | 2 | 3 | 4;
  seconds: number;
  reason: string;
  /** Tiers fallen, when the landing is lower than the take-off. */
  drop?: number;
  /** The jump came up a tier short and ended hanging from the edge. */
  caught?: boolean;
};
/** Legacy traversal retained for existing commands:
 * a plain hop on open ground, a scramble up one tier, a drop down, or a leap
 * clearing one impassable tile onto level ground beyond. */
export function terrainLeap(
  sample: TopographySample,
  from: TerrainPoint,
  to: TerrainPoint,
): LeapResult | { kind: "blocked"; reason: string } {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (!dx && !dy))
    return { kind: "blocked", reason: "Jump one step at a time." };
  const a = sample(from.x, from.y),
    b = sample(to.x, to.y);
  if (!a || !b) return { kind: "blocked", reason: "Edge of the study." };
  if (a.solid) return { kind: "blocked", reason: "No room to push off." };
  if (terrainStep(sample, from, to).allowed)
    return {
      kind: "hop",
      distance: 1,
      seconds: 3,
      reason: "You hop forward.",
    };
  // Diagonals may clear a corner but never a ledge or a gap.
  if (dx && dy) return { kind: "blocked", reason: "Jump straight at it." };
  const water = (c: TopographyCell) => c.surface === "water" && !c.bridge;
  if (!b.solid && !water(b) && b.height === a.height + 1)
    return {
      kind: "climb",
      distance: 1,
      seconds: 25,
      reason: "You scramble up the ledge.",
    };
  if (!b.solid && !water(b) && b.height < a.height)
    return {
      kind: "drop",
      distance: 1,
      seconds: 2,
      reason: "You drop down.",
      drop: a.height - b.height,
    };
  // Clearing a stream or a ditch: the landing must be level with the takeoff.
  // Only water is a gap. A wall or a trunk is climbed or not passed at all.
  const c = sample(to.x + dx, to.y + dy);
  if (water(b) && c && !c.solid && !water(c) && c.height === a.height)
    return {
      kind: "leap",
      distance: 2,
      seconds: 4,
      reason: "You leap the water.",
    };
  return {
    kind: "blocked",
    reason: b.solid
      ? "There is no way over that."
      : water(b)
        ? "Too wide to leap."
        : "The ledge is too high to climb.",
  };
}

export function terrainJump(
  sample: TopographySample,
  from: TerrainPoint,
  to: TerrainPoint,
  power: "short" | "long",
  running = false,
): LeapResult | { kind: "blocked"; reason: string } {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    return { kind: "blocked", reason: "Jump in one direction." };
  const start = sample(from.x, from.y);
  const water = (c: TopographyCell) => c.surface === "water" && !c.bridge;
  if (!start || start.solid || water(start))
    return { kind: "blocked", reason: "No room to push off." };
  // A run adds a tile of reach: standing 2/3, running 3/4.
  const reach = (power === "long" ? 3 : 2) + (running ? 1 : 0);
  const rise = power === "long" ? 2 : 1;
  let landing: LeapResult | undefined;
  for (let step = 1; step <= reach; step++) {
    const at = { x: from.x + dx * step, y: from.y + dy * step };
    const cell = sample(at.x, at.y);
    // One tier too high is a near miss: straight on, the hands reach the edge.
    if (
      cell &&
      !cell.solid &&
      !water(cell) &&
      !(dx && dy) &&
      cell.height === start.height + rise + 1
    ) {
      landing = {
        kind: "climb",
        distance: step as 1 | 2 | 3 | 4,
        seconds: 12,
        reason: "You catch the edge and haul yourself up.",
        caught: true,
      };
      break;
    }
    if (!cell || cell.solid || cell.height > start.height + rise) break;
    if (dx && dy) {
      const corners = [sample(at.x - dx, at.y), sample(at.x, at.y - dy)];
      if (
        corners.some(
          (c) =>
            !c ||
            c.solid ||
            (water(c) && !c.over) ||
            c.height > start.height + rise,
        )
      )
        break;
    }
    if (water(cell) || cell.over) continue;
    landing = {
      kind:
        cell.height > start.height
          ? "climb"
          : cell.height < start.height
            ? "drop"
            : "leap",
      distance: step as 1 | 2 | 3 | 4,
      seconds: power === "long" ? 3 : 2,
      reason: power === "long" ? "You make a long jump." : "You jump forward.",
      ...(cell.height < start.height
        ? { drop: start.height - cell.height }
        : {}),
    };
  }
  return (
    landing ?? { kind: "blocked", reason: "No clear landing within reach." }
  );
}
