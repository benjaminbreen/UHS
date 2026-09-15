import { classifyCommunity, type HabitatSite } from "../../content/ecology/communities";
import { landscapeRecipe } from "../../content/ecology/landscapes";
import type { Colorway, Ecology } from "../../content/ecology/profiles";
import { habitatLayout } from "../../content/ecology/variants";
import type { LandSample } from "../geography/landscape";
import { noise } from "../geography/noise";
import { random } from "../../core/random";

export type HabitatKind =
  | "open"
  | "meadow"
  | "hollow"
  | "scrub"
  | "woodland"
  | "exposed";
export type VegetationPattern = "savanna" | "steppe" | "alpine";
export type Habitat = {
  site?: HabitatSite;
  blend?: { ecology: Ecology; colorway?: Colorway; weight: number }[];
  vegetation?: VegetationPattern;
  layeredForest?: boolean;
  ecology: Ecology;
  colorway?: Colorway;
  kind: HabitatKind;
  wet: number;
  cover: number;
  exposed: number;
  season: string;
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
/** Local plant communities within an envelope, never a substitute climate.
 * Correlated broad patches and smaller colonies use absolute world coordinates.
 * Wet hollows follow low terrain; exposed mineral ground favors higher tiers. */
export function habitatAt(
  ecology: Ecology,
  season: string,
  seed: string,
  x: number,
  y: number,
  land: LandSample,
  colorway?: Colorway,
): Habitat {
  if (land.drainage && land.ecologyParts) {
    const dominant = land.ecologyParts.reduce((a,b) => b.weight > a.weight ? b : a);
    const region = { ecology: dominant.ecology, colorway: dominant.colorway };
    const recipe = landscapeRecipe(land.ecologyParts);
    const d = land.drainage;
    const patch = noise(seed, x, y, 42, "habitat-stand");
    const wet = clamp(d.saturation + recipe.moisture * 0.15);
    const riparian = land.kind !== "sea" ? clamp(1 - Math.max(0, land.water) / 24) : 0;
    const cover = clamp(recipe.canopy + (patch - 0.5) * 0.7 + riparian * (.25 + .45 * (1-recipe.canopy)) + d.lowland * .08 - d.slope * .2);
    const exposed = clamp(recipe.mineral + d.slope * 0.45 + (noise(seed, x, y, 31, "habitat-substrate") - 0.5) * 0.22 - wet * 0.4);
    const flooded = clamp((d.saturation - 0.3) / 0.3);
    let blend = land.ecologyParts;
    if (flooded > 0 && land.kind !== "sea" && d.waterDistance >= 0) {
      const woodland = recipe.canopy > 0.45;
      const wetColorway = woodland ? (ecology === "boreal-woodland" ? "bog" : "swamp") : "marsh";
      blend = [...blend.map((p) => ({ ...p, weight: p.weight * (1 - flooded) })), { ecology: "wetland", colorway: wetColorway, weight: flooded }];
      if (flooded > 0.5) { ecology = "wetland"; colorway = wetColorway; }
    }
    const kind: HabitatKind = exposed > 0.58 ? "exposed" : wet > 0.62 ? "hollow" : cover > 0.5 ? "woodland" : cover > 0.28 ? "scrub" : wet > 0.3 ? "meadow" : "open";
    return { ecology, colorway, season, wet, cover, exposed, kind, blend, site: classifyCommunity(region, land, cover, exposed) };
  }
  const layout = habitatLayout(colorway);
  const warp = (noise(seed, x, y, 65, "habitat-warp") - 0.5) * 17;
  const drainage = noise(seed, x + warp, y - warp, 22, "habitat-drainage");
  // Braided ground folds the drainage field so its wet band is a thin
  // connected thread rather than a round pocket.
  const hollow = layout.braided ? 1 - Math.abs(drainage * 2 - 1) : drainage;
  const broad = noise(seed, x, y, 48, "habitat-cover");
  const colony = noise(seed, x + warp, y, 9, "habitat-colony");
  const riparian = clamp(
    1 - Math.max(0, land.water - (land.shoreWidth ?? 3)) / 13,
  );
  // Altitude as a share of the place's own relief: a floodplain's second
  // step is not a mountain's. The valley floor gets a little extra lushness.
  const alt = clamp(land.elevation / (land.summit ?? 126));
  const lush = land.elevation === 0 ? 0.08 : 0;
  // A wet layout shifts the field rather than scaling it: scaling pushed a
  // whole monsoon scene over the hollow threshold and painted it one tone.
  const wet = clamp(
    (colorway === "swamp" ? 0.2 : 0) +
    (hollow - 0.39) * 2.5 +
      (land.moisture - 0.5) * 0.9 +
      riparian * 0.38 -
      alt * 0.5 +
      lush +
      (layout.wet - 1) * 0.3,
  );
  const substrateWeight =
    ecology === "wetland" ? 0.68 : ecology === "tropical-woodland" ? 0.82 : 1;
  // Dune fields: exposure follows long parallel ridges across the wind.
  const mineral = layout.banded
    ? Math.abs(
        noise(seed, x * 0.35 + y * 0.12, y * 0.06 - warp, 14, "habitat-dune") *
          2 -
          1,
      ) *
        0.6 +
      noise(seed, x - warp, y + warp, 29, "habitat-mineral") * 0.4
    : noise(seed, x - warp, y + warp, 29, "habitat-mineral");
  const exposed =
    substrateWeight *
    clamp(((mineral - 0.45) * 2.8 + alt * 0.55 - wet * 0.55) * layout.exposed);
  const cover = clamp(
    ((broad - 0.3) * 0.9 +
      (colony - 0.4) * 1.5 +
      wet * 0.12 -
      exposed * 0.3 -
      alt * 0.3 +
      lush) *
      layout.cover +
      (layout.gallery ?? 0) * riparian,
  );
  const forest = ecology.includes("woodland") || colorway === "swamp";
  const kind: HabitatKind =
    exposed > 0.63
      ? "exposed"
      : wet > 0.62
        ? "hollow"
        : cover > 0.55
          ? forest
            ? "woodland"
            : "scrub"
          : wet > 0.3
            ? "meadow"
            : "open";
  return { ecology, colorway, season, wet, cover, exposed, kind };
}
/** One jittered candidate per 2x2 cell, admitted in connected habitat colonies.
 * Independent hashes avoid coupling tree selection to sprite/rock selection. */
export function habitatTree(
  h: Habitat,
  seed: string,
  x: number,
  y: number,
  density: number,
  ecologyAware = false,
): boolean {
  const bx = Math.floor(x / 2),
    by = Math.floor(y / 2);
  if (
    x !== bx * 2 + Math.floor(random(seed, "tree-x", bx, by) * 2) ||
    y !== by * 2 + Math.floor(random(seed, "tree-y", bx, by) * 2)
  )
    return false;
  const grouping = treeGrouping(h, ecologyAware);
  return random(seed, "tree-presence", bx, by) < density * grouping * (h.colorway === "swamp" ? 2.4 : 1);
}

/** Revision 5 gives the same wetness/exposure field a visible canopy effect. */
export function treeGrouping(h: Habitat, ecologyAware = false) {
  if (h.site) {
    const w = h.site.weights;
    return (w.woodland ?? 0) * 2.4 + (w["riparian-woodland"] ?? 0) * 2.6 + (w.swamp ?? 0) * 2 + (w.scrub ?? 0) * .22 + (w.bog ?? 0) * .12;
  }
  const base = Math.max(0, h.cover - 0.22) * 2.6;
  if (!ecologyAware) return base;
  if (h.vegetation === "alpine") return 0;
  if (h.vegetation === "steppe") return h.wet > 0.65 ? base * 0.22 : 0;
  if (h.vegetation === "savanna")
    return Math.min(0.7, base * 0.3 + Math.max(0, h.wet - 0.4) * 0.8);
  const wetLift = Math.max(0, h.wet - 0.45) * 1.45;
  const exposurePenalty = h.exposed * 1.15;
  return Math.min(2.6, Math.max(0.12, base + wetLift - exposurePenalty));
}
