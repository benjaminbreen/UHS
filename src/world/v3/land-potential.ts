import { ecologyProfiles } from "../../content/ecology/profiles";
import type {
  LandPotential,
  LandResourcePotential,
} from "../../core/geography";
import type { LandSample } from "../geography/landscape";
import type { Habitat } from "./habitats";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const bell = (n: number, ideal: number, reach: number) =>
  clamp(1 - Math.abs(n - ideal) / reach);
const round = (n: number) => Math.round(clamp(n) * 1000) / 1000;

/**
 * Physical opportunity, not an assertion of production or market value.
 * Culture, technology, access and demand belong in the later valuation step.
 */
export function landPotential(
  land: LandSample,
  habitat: Habitat,
): LandPotential {
  const conditions = habitat.site?.conditions,
    slope = conditions?.slope ?? land.drainage?.slope ?? 0,
    saturation = conditions?.saturation ?? land.drainage?.saturation ?? 0,
    freshwater = (conditions?.freshwater ?? land.kind !== "sea") ? 1 : 0,
    inundated = land.water < 0,
    dryGround = inundated ? 0 : 1,
    moisture = clamp(land.moisture * 0.55 + habitat.wet * 0.45),
    open = clamp(1 - habitat.cover),
    level = clamp(1 - slope * 1.7),
    resources = ecologyProfiles[habitat.ecology].resources,
    nearWater = clamp(1 - Math.max(0, land.water) / 28),
    aquatic = inundated ? 1 : nearWater * 0.35;

  const yields: LandResourcePotential = {
    arable: round(
      dryGround *
        level *
        bell(moisture, 0.58, 0.52) *
        (1 - clamp(saturation - 0.52) * 1.5) *
        (land.snow ? 0.12 : 1),
    ),
    pasture: round(
      dryGround * level * open * bell(moisture, 0.46, 0.58) * 0.95,
    ),
    fish: round(aquatic * (land.kind === "sea" ? 0.82 : 1)),
    "wild-food": round(
      (resources.includes("fruit") || resources.includes("berries")
        ? 0.35 + habitat.cover * 0.65
        : 0.12 * open) * (land.snow ? 0.35 : 1),
    ),
    timber: round(habitat.cover * (resources.includes("wood") ? 1 : 0.45)),
    reeds: round(
      freshwater *
        Math.max(nearWater, saturation) *
        (resources.includes("reeds") ? 1 : 0.55),
    ),
    clay: round(
      freshwater *
        dryGround *
        level *
        clamp(moisture * 0.55 + saturation * 0.75 - habitat.exposed * 0.4),
    ),
    stone: round(dryGround * clamp(habitat.exposed * 0.9 + slope * 0.35)),
    // Exposure is only prospectivity. Authored geology must decide an ore body.
    mineral: round(dryGround * clamp(habitat.exposed * 0.42 + slope * 0.12)),
  };
  const subsistence = round(
      yields.arable * 0.4 +
        yields.pasture * 0.22 +
        yields.fish * 0.2 +
        yields["wild-food"] * 0.18,
    ),
    materials = round(
      yields.timber * 0.3 +
        yields.reeds * 0.14 +
        yields.clay * 0.18 +
        yields.stone * 0.24 +
        yields.mineral * 0.14,
    ),
    buildability = round(
      dryGround * level * (1 - saturation * 0.65) * (1 - habitat.cover * 0.2),
    );
  return { yields, subsistence, materials, buildability };
}
