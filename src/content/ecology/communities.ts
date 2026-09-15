import type { Ecology, Colorway } from "./profiles";
import type { LandSample } from "../../world/geography/landscape";

export type Community =
  | "water"
  | "shore"
  | "rocky"
  | "barren"
  | "grassland"
  | "scrub"
  | "woodland"
  | "riparian-woodland"
  | "marsh"
  | "swamp"
  | "bog";
export type HabitatSite = {
  primary: Community;
  landUse?: "natural" | "cultivated" | "built";
  weights: Partial<Record<Community, number>>;
  region: { ecology: Ecology; colorway?: Colorway };
  conditions: {
    moisture: number;
    saturation: number;
    slope: number;
    canopy: number;
    exposure: number;
    freshwater: boolean;
    inundated: boolean;
  };
};
export const communityLabels: Record<Community, string> = {
  water: "Open water",
  shore: "Shore",
  rocky: "Rocky ground",
  barren: "Barren ground",
  grassland: "Grassland",
  scrub: "Scrub",
  woodland: "Woodland",
  "riparian-woodland": "Riparian woodland",
  marsh: "Freshwater marsh",
  swamp: "Swamp forest",
  bog: "Bog",
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ramp = (n: number, lo: number, hi: number) => {
  const t = clamp((n - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
export function classifyCommunity(
  region: HabitatSite["region"],
  land: LandSample,
  canopy: number,
  exposure: number,
): HabitatSite {
  const d = land.drainage!;
  const freshwater = land.kind !== "sea";
  const mangrove = region.colorway === "mangrove";
  const conditions = {
    moisture: land.moisture,
    saturation: d.saturation,
    slope: d.slope,
    canopy,
    exposure,
    freshwater,
    inundated: land.water < 0,
  };
  const weights: HabitatSite["weights"] = {};
  const finish = (): HabitatSite => ({
    region,
    conditions,
    weights,
    primary: (Object.entries(weights) as [Community, number][]).sort(
      (a, b) => b[1] - a[1],
    )[0][0],
  });
  if (land.water < -1.2 || (!freshwater && land.water < 0)) {
    weights.water = 1;
    return finish();
  }
  if (!freshwater && !mangrove && land.water < (land.shoreWidth ?? 3)) {
    weights.shore = 1;
    return finish();
  }
  const wet =
    freshwater || mangrove
      ? land.water < 0
        ? 1
        : ramp(d.saturation, 0.32, 0.65)
      : 0;
  const wetType: Community =
    region.colorway === "bog" || region.ecology === "boreal-woodland"
      ? "bog"
      : canopy > 0.46
        ? "swamp"
        : "marsh";
  const mineral = ramp(exposure, 0.42, 0.75) * (1 - wet);
  const forest = ramp(canopy, 0.38, 0.72);
  const shrubs = ramp(
    canopy,
    region.ecology === "dry-scrub" ? 0.08 : 0.12,
    0.36,
  );
  const riparian = freshwater
    ? ramp(1 - Math.max(0, land.water) / 22, 0.2, 0.85)
    : 0;
  const vegetation = Math.max(0, 1 - wet - mineral);
  weights[wetType] = wet;
  weights[region.ecology === "desert" ? "barren" : "rocky"] = mineral;
  weights["riparian-woodland"] = vegetation * forest * riparian;
  weights.woodland = vegetation * forest * (1 - riparian);
  weights.scrub = vegetation * (1 - forest) * shrubs;
  weights.grassland = vegetation * (1 - forest) * (1 - shrubs);
  return finish();
}
export type HabitatResource = "reeds" | "timber" | "stone";
export function supportsHabitatResource(
  site: HabitatSite,
  resource: HabitatResource,
): boolean {
  if (site.landUse && site.landUse !== "natural") return false;
  if (resource === "reeds")
    return site.primary === "marsh" && site.conditions.freshwater;
  if (resource === "timber")
    return ["woodland", "riparian-woodland", "swamp"].includes(site.primary);
  return site.primary === "rocky";
}
