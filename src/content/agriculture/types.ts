import type { CultureId } from "../history/types";
import type { ItemId } from "../../core/types";
import type { climates } from "../geography/types";

export type Climate = (typeof climates)[number];
export type Season = "spring" | "summer" | "autumn" | "winter";

/** What a parcel grows. `pasture` and `fallow` are crops too, so a system's
 * rotation can be expressed as one list of shares. */
export type CropId =
  | "wheat"
  | "barley"
  | "rye"
  | "oats"
  | "millet"
  | "sorghum"
  | "teff"
  | "rice"
  | "dry-rice"
  | "maize"
  | "beans"
  | "squash"
  | "potato"
  | "quinoa"
  | "yam"
  | "cassava"
  | "taro"
  | "sugarcane"
  | "olive"
  | "vine"
  | "date"
  | "orchard"
  | "flax"
  | "cotton"
  | "vegetables"
  | "pasture"
  | "fallow";

/** Growth as drawn. A stage is what the ground looks like, not a biology. */
export type CropStage = "bare" | "sown" | "green" | "ripe" | "stubble";

export type Crop = {
  id: CropId;
  label: string;
  kind: "grain" | "root" | "tree" | "vine" | "vegetable" | "fibre" | "pasture" | "fallow";
  /** Item harvested, where the sim has one. */
  yields?: ItemId;
  /** Drawn height: low is a mat, mid a waist-high crop, tall stands over a person. */
  height: "low" | "mid" | "tall";
  /** Grown standing in water, on a bunded basin. */
  wet?: boolean;
  climates: readonly Climate[];
  /** Stage by season for a northern-hemisphere calendar; the south is
   * shifted by two seasons at resolution. */
  calendar: Record<Season, CropStage>;
  /** Palette hint for the ripe crop, as a hex colour, for the art build. */
  hue: string;
  evidence: {
    status: "documented" | "inferred" | "fictional";
    note: string;
    sources: readonly string[];
  };
};

/** How parcels are cut. */
export type ParcelGeometry =
  /** Long narrow strips bundled into furlongs at right angles to a lane. */
  | "strip"
  /** Rectangular fields between lanes, each its own boundary. */
  | "block"
  /** Long lots running back from a river or road frontage. */
  | "ribbon"
  /** Bands following the elevation contours on a slope. */
  | "terrace"
  /** Level basins bounded by bunds, flooded from a channel. */
  | "basin"
  /** Irregular clearings in woodland, shifting with fallow. */
  | "clearing"
  /** Large regular fields of one crop, machine or estate scale. */
  | "plantation";

export type Boundary =
  | "hedge"
  | "wall"
  | "fence"
  | "bund"
  | "ditch"
  /** An unploughed grass balk between open-field strips. */
  | "baulk"
  | "none";

export type Outbuilding =
  | "barn"
  | "granary"
  | "mill"
  | "shrine"
  | "well"
  | "threshing-floor"
  | "hayrick"
  | "dovecote"
  | "press";

export type FarmSystem = {
  id: string;
  label: string;
  geometry: ParcelGeometry;
  /** Parcel module in cells: along the lane, and back from it. */
  module: readonly [number, number];
  /** 0 ragged, 1 surveyed. */
  regularity: number;
  boundary: Boundary;
  irrigation: "none" | "river" | "canal" | "flood" | "well";
  /** Shares over parcels; include `fallow` and `pasture` here. Sums near 1. */
  crops: readonly { id: CropId; share: number }[];
  /** Share of the nearest ring given to orchards and gardens. */
  orchard: number;
  /** Steepest slope farmed, as elevation bands crossed per 8 cells. */
  slopeLimit: number;
  /** Pull toward river and lake margins: 0 indifferent, 1 only there. */
  riverside: number;
  /** How far out the fields reach, as a multiple of the built radius. */
  reach: number;
  /** A common grazing or woodland at the margin. */
  commons: boolean;
  outbuildings: readonly Outbuilding[];
  evidence: {
    status: "documented" | "inferred" | "fictional";
    note: string;
    sources: readonly string[];
  };
};

export type FarmSystemRule = FarmSystem & {
  culture: CultureId;
  from: number;
  to: number;
  /** West, south, east, north degrees. */
  bounds: readonly [number, number, number, number];
  /** Omitted, any climate in the bounds. */
  climates?: readonly Climate[];
};
