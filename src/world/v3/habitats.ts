import type { DesertColorway, Ecology } from "../../content/ecology/profiles";
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
  vegetation?: VegetationPattern;
  layeredForest?: boolean;
  ecology: Ecology;
  colorway?: DesertColorway;
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
): Habitat {
  const warp = (noise(seed, x, y, 65, "habitat-warp") - 0.5) * 17;
  const hollow = noise(seed, x + warp, y - warp, 22, "habitat-drainage");
  const broad = noise(seed, x, y, 48, "habitat-cover");
  const colony = noise(seed, x + warp, y, 9, "habitat-colony");
  const riparian = clamp(
    1 - Math.max(0, land.water - (land.shoreWidth ?? 3)) / 13,
  );
  // Altitude as a share of the place's own relief: a floodplain's second
  // step is not a mountain's. The valley floor gets a little extra lushness.
  const alt = clamp(land.elevation / (land.summit ?? 126));
  const lush = land.elevation === 0 ? 0.08 : 0;
  const wet = clamp(
    (hollow - 0.39) * 2.5 +
      (land.moisture - 0.5) * 0.9 +
      riparian * 0.38 -
      alt * 0.5 +
      lush,
  );
  const substrateWeight =
    ecology === "wetland" ? 0.68 : ecology === "tropical-woodland" ? 0.82 : 1;
  const exposed =
    substrateWeight *
    clamp(
      (noise(seed, x - warp, y + warp, 29, "habitat-mineral") - 0.45) * 2.8 +
        alt * 0.55 -
        wet * 0.55,
    );
  const cover = clamp(
    (broad - 0.3) * 0.9 +
      (colony - 0.4) * 1.5 +
      wet * 0.12 -
      exposed * 0.3 -
      alt * 0.3 +
      lush,
  );
  const forest = ecology.includes("woodland");
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
  return { ecology, season, wet, cover, exposed, kind };
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
  return random(seed, "tree-presence", bx, by) < density * grouping;
}

/** Revision 5 gives the same wetness/exposure field a visible canopy effect. */
export function treeGrouping(h: Habitat, ecologyAware = false) {
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
