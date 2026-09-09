import type { CultureId } from "../../history/types";

/** How the street network is organised, independent of art or material. */
export type UrbanPlan = "orthogonal" | "radial" | "organic" | "linear";

export type UrbanForm = {
  id: string;
  label: string;
  plan: UrbanPlan;
  /** Target block size in cells; subdivision stops near it. */
  block: readonly [number, number];
  /** 0 freely staggered and jittered, 1 snapped to a regular module. */
  regularity: number;
  /** Share of blocks that enclose a walkable interior court. */
  courts: number;
  /** Share of interior streets replaced by a dead end, merging two blocks. */
  deadEnds: number;
  /** Cell half-widths for the arterial, street and lane tiers. */
  tiers: readonly [number, number, number];
  /** Tallest ordinary house this fabric builds, in storeys. Caps which
   * building models the planner may use, so a single-storey fabric never
   * gets a three-storey urban range. */
  storeys: number;
  /** How many ways lead in through the built edge. */
  gates: number;
  /** A defensive circuit around the built edge, where one is attested. "none"
   * means this fabric is not described as walled, not that it was undefended. */
  wall: "none" | "earth" | "masonry";
  /** Where the main public space sits relative to the arterials. */
  plaza: "crossing" | "offset" | "gate" | "waterfront";
  /** Plaza extent as a share of the settlement half-extent. */
  plazaScale: number;
  /** Which side of the plaza the civic range occupies. */
  civic: "head" | "side";
  /** What stands in the public square, in the order it is placed. Keys of
   * `src/content/settlements/ornaments.ts`. */
  ornaments: readonly string[];
  evidence: {
    status: "inferred" | "fictional";
    sources: string[];
    note: string;
  };
};

export type UrbanFormRule = UrbanForm & {
  from: number;
  to: number;
  /** West, south, east, north degrees. */
  bounds: readonly [number, number, number, number];
  culture: CultureId;
};
