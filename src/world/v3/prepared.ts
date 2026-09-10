import type { WorldModel } from "../../core/types";
import type { TopographyCell } from "../../core/topography";
import type { Road, SettlementPlan, Site } from "./types";

export type PreparedSite = Omit<Site, "accepts">;
export const preparedSite = ({
  accepts: _accepts,
  ...site
}: Site): PreparedSite => site;
/** Disposable structured-clone data, never a save format. Geometry is identical to
 * synchronous generation; functions are reconstructed by the receiving world. */
/** Bump when generation output changes shape or content, so a cached
 * prepared settlement from an older build is not reused. */
export const PREPARED_VERSION = 1;
export type PreparedSettlement = {
  /** The starting town's daily routines, built where the plan was, and the
   * residents the routine budget left at home. */
  routines?: [string, import("../../core/itinerary").Itinerary | undefined][];
  dormant?: string[];
  sites: [string, PreparedSite | null][];
  regionalSites?: [string, PreparedSite[]][];
  plans: [string, Omit<SettlementPlan, "site"> & { site: PreparedSite }][];
  links: [string, Road[]][];
  roads: [string, Map<string, import("../../core/types").Terrain>][];
  relief: [string, TopographyCell][];
  active: string[];
  initial: Pick<
    WorldModel,
    | "spawn"
    | "settlements"
    | "places"
    | "initialActors"
    | "initialObjects"
    | "enclosures"
    | "households"
  >;
};
