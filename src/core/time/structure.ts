import { random } from "../random";
import type { Place } from "../types";

export type Fabric = "masonry" | "earth" | "timber";
export type Structure = {
  version: 1;
  fabric: Fabric;
  built: number;
  abandoned?: number;
  roof: number;
  walls: number[];
  burial: number;
  vegetation: number;
  char: number;
};
export type StructuralImpact = {
  kind: "impact" | "fire" | "repair";
  section: number;
  amount: number;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function fabricOf(material: string): Fabric {
  return /timber|wood|bark|hide|wattle|board|mat/.test(material)
    ? "timber"
    : /mud|earth|adobe/.test(material)
      ? "earth"
      : "masonry";
}
export function ageStructure(
  seed: string,
  id: string,
  fabric: Fabric,
  built: number,
  abandoned: number,
  year: number,
  wet: number,
): Structure {
  const years = Math.max(0, year - abandoned);
  const rate =
    { masonry: 0.004, earth: 0.013, timber: 0.022 }[fabric] * (0.6 + wet);
  return {
    version: 1,
    fabric,
    built,
    ...(years ? { abandoned } : {}),
    roof: clamp(1 - years * (fabric === "masonry" ? 0.022 : 0.04)),
    walls: Array.from({ length: 12 }, (_, i) =>
      clamp(1 - years * rate * (0.6 + random(seed, id, "wall", i))),
    ),
    burial: clamp(years / 480),
    vegetation: clamp(years / 85) * wet,
    char: 0,
  };
}
/** A building somebody lives in. It wears at a fraction of the abandoned
 * rate, because a roof in use is patched before it falls in, and the fraction
 * is what the household can spend on it. */
export function weatherStructure(
  seed: string,
  id: string,
  fabric: Fabric,
  built: number,
  year: number,
  upkeep: number,
): Structure {
  const years = Math.max(0, year - built);
  const kept = 1 - 0.75 * clamp(upkeep);
  const rate = { masonry: 0.0015, earth: 0.004, timber: 0.006 }[fabric] * kept;
  // Lived in, so it is still a building: the wall stands and the roof keeps
  // the rain off, however long it has been since anyone was proud of it.
  const standing = (wear: number, floor: number) =>
    Math.max(floor, clamp(1 - wear));
  return {
    version: 1,
    fabric,
    built,
    roof: standing(years * rate * 1.5, 0.6),
    walls: Array.from({ length: 12 }, (_, i) =>
      standing(years * rate * (0.6 + random(seed, id, "wear", i)), 0.35),
    ),
    burial: 0,
    vegetation: clamp(years * rate * 0.5),
    char: 0,
  };
}
/** 0 is a ruin, 1 is new. The worst wall counts for as much as the average:
 * one side falling in is what you notice about a building. */
export function conditionOf(structure: Structure | undefined) {
  if (!structure) return 1;
  const walls = structure.walls;
  const mean = walls.reduce((a, b) => a + b, 0) / walls.length;
  return clamp(
    Math.min(structure.roof, (mean + Math.min(...walls)) / 2) -
      structure.char * 0.5 -
      structure.vegetation * 0.2 -
      structure.burial,
  );
}
const BANDS: [number, string][] = [
  [0.94, "as good as new"],
  [0.82, "well kept"],
  [0.66, "sound"],
  [0.45, "worn"],
  [0.25, "in poor repair"],
  [0.08, "half derelict"],
];
/** The condition as a phrase that reads after "It is". */
export function conditionBand(condition: number) {
  return BANDS.find(([floor]) => condition >= floor)?.[1] ?? "a ruin";
}
export function damageStructure(
  state: Structure,
  impact: StructuralImpact,
): Structure {
  if (
    !Number.isFinite(impact.amount) ||
    impact.amount < 0 ||
    !Number.isInteger(impact.section) ||
    impact.section < 0 ||
    impact.section >= state.walls.length
  )
    throw Error("Invalid structural impact");
  const next = { ...state, walls: [...state.walls] };
  const amount = impact.amount;
  if (impact.kind === "repair") {
    next.walls[impact.section] = clamp(next.walls[impact.section] + amount);
    next.roof = clamp(next.roof + amount * 0.5);
  } else {
    const resistance =
      impact.kind === "fire" && state.fabric === "masonry" ? 0.15 : 1;
    next.walls[impact.section] = clamp(
      next.walls[impact.section] - amount * resistance,
    );
    next.roof = clamp(next.roof - amount * (impact.kind === "fire" ? 1 : 0.4));
    if (impact.kind === "fire") next.char = clamp(next.char + amount);
  }
  return next;
}
export function wallSection(
  place: Pick<Place, "x" | "y" | "w" | "h">,
  x: number,
  y: number,
): number | undefined {
  const dx = x - place.x,
    dy = y - place.y;
  if (dx < 0 || dy < 0 || dx >= place.w || dy >= place.h) return;
  if (dy === 0) return Math.min(2, Math.floor((dx / place.w) * 3));
  if (dx === place.w - 1)
    return 3 + Math.min(2, Math.floor((dy / place.h) * 3));
  if (dy === place.h - 1)
    return 6 + Math.min(2, Math.floor(((place.w - 1 - dx) / place.w) * 3));
  if (dx === 0)
    return 9 + Math.min(2, Math.floor(((place.h - 1 - dy) / place.h) * 3));
}
export function structureBlocks(place: Place, x: number, y: number) {
  const section = wallSection(place, x, y);
  return (
    section !== undefined &&
    (place.structure?.walls[section] ?? 1) *
      (1 - (place.structure?.burial ?? 0)) >
      0.28
  );
}
