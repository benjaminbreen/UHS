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
