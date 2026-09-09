import type { CultureId } from "../../history/types";

/** How the street network is organised, independent of art or material. */
export type UrbanPlan = "orthogonal" | "radial" | "organic" | "linear";

/** A square is composed, not scattered: one centrepiece, four corners, and a
 * decision about the shared fire. Ids are keys of
 * `src/content/settlements/ornaments.ts`, plus `tree` for a planted bed. */
export type SquareSpec = {
  /** Centrepiece. Monuments stand on a stepped dais scaled to the square;
   * `tree`, `well` and `altar` bring their own ground. */
  focus?: string;
  /** Corner pieces in order; a short list repeats. `tree` takes a 3x3 bed
   * where the square is wide enough and falls back to a planter. */
  corners: readonly string[];
  /** What stands at the four corners of the dais: chain posts unless the
   * fabric says planters or nothing. */
  daisCorners?: "post" | "planter" | "none";
  /** A brazier stands in the square; hidden puts the fire behind the civic
   * range, where a town's shared fire actually was. */
  hearth: "brazier" | "hidden";
};

/** One part of a city with its own street pattern and block module. */
export type DistrictSpec = {
  plan: UrbanPlan;
  /** Target block size in cells. */
  block: readonly [number, number];
  /** 0 freely staggered and jittered, 1 snapped to a regular module. */
  regularity: number;
};

export type StreetFurniture = "lamp" | "tree" | "planter";

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
  /** Street width in cells for the arterial, street and lane tiers. One or
   * two cells is the norm; three for the roads that meet the square; four to
   * six only for the avenues of a large city, and the planner narrows the
   * arterial in a small town whatever the fabric asks. */
  tiers: readonly [number, number, number];
  /** Streets of beaten earth even in a town of city rank. Omitted, a
   * researched fabric paves its streets and square. */
  surface?: "paved" | "earth";
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
  /** How the public square is furnished. */
  square: SquareSpec;
  /** Districts composed side by side. The first is the core around the
   * square; each further one is an extension on another side of it with its
   * own pattern and module, so a city is an old core with newer quarters
   * rather than one shape. Omitted, the fabric is a single district using
   * `plan`, `block` and `regularity`. */
  districts?: readonly DistrictSpec[];
  /** Further public squares at street crossings away from the main square. */
  squares?: number;
  /** Diagonal avenues cut from the square's corners to the built edge. */
  diagonals?: number;
  /** Planted grass strip, in cells, between an arterial and its footway. */
  verge?: number;
  /** Share of untouched blocks reserved for pocket parks or vacant lots. */
  greenSpaces?: number;
  /** Street furniture this fabric places: lamps at block corners on the
   * arterials and the square, trees along the verges, planters by doors. */
  furniture?: readonly StreetFurniture[];
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
