export type LandSample = {
  drainage?: import("../v3/drainage").Drainage;
  ecologyParts?: import("../../content/ecology/landscapes").EcologyPart[];
  /** Optional dry shoreline width in local cells, supplied by regional terrain. */
  shoreWidth?: number;
  /** Distance from the water to the first step up off the valley floor. */
  floodplain?: number;
  waterFlow?: readonly [number, number];
  elevation: number;
  /** Highest elevation the place can reach, so consumers can judge a cell
   * by how far up its own relief it sits rather than by raw units. */
  summit?: number;
  moisture: number;
  water: number;
  kind: "sea" | "river" | "lake";
  snow: boolean;
  /** Perennial ice: above the summer snowline, or on an ice cap. */
  glacier?: boolean;
  /** A dry channel or trail through this cell; see world/v3/features. */
  landscape?: import("../v3/features").Landscape;
  /** A creek drops a tier here: the cell just below the lip. */
  fall?: boolean;
  /** Unit gradient of the water distance at this cell, where the source is
   * a narrow stream: lets the shoreline be reconstructed per pixel rather
   * than interpolated between cell centres a channel wide apart. */
  waterGradient?: readonly [number, number];
  /** Width in tiles of the intertidal shelf, on a tidal sea. */
  shelf?: number;
  /** Sea inside a reef: "lagoon" is an atoll's enclosed water. */
  reef?: "outer" | "lagoon";
  /** `water` in spring, summer, autumn and winter, where a flood or a playa
   * changes it; `water` itself is the driest season's. */
  seasonal?: readonly number[];
};
