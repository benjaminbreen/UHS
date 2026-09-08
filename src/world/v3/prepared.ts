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
export type PreparedSettlement = {
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
