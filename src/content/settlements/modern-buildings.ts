import type { WorldSetting } from "../geography/types";
import type { LandUse } from "./zoning";
import { industrialized, modernity } from "./modernity";

/** Where the brick main-street block was the ordinary commercial building:
 * Britain and the lands built from its and America's pattern books, and the
 * brick cities of northern and central Europe. Elsewhere shops kept their
 * regional forms. */
const BRICK_BLOCKS = new Set([
  "britain",
  "north-america",
  "western-europe",
  "eastern-europe",
  "australasia",
  "southern-africa",
]);

// The International Style office slab spread worldwide within a decade of
// Lever House (1952); a city had its first by about 1960.
const CURTAIN_WALL = 1955;

/** The modern gold masters a block of this land use builds with, by date and
 * region. They join the kit forms rather than replace them. */
export function modernBuildings(
  s: Pick<WorldSetting, "lon" | "lat" | "year">,
  use: LandUse,
): string[] {
  if (!industrialized(s)) return [];
  const blocks = BRICK_BLOCKS.has(modernity(s).id)
    ? ["modern-commercial-block-0", "modern-commercial-block-1", "modern-commercial-block-2"]
    : [];
  const towers =
    s.year >= CURTAIN_WALL
      ? ["modern-curtain-tower-0", "modern-curtain-tower-1", "modern-curtain-tower-2"]
      : [];
  switch (use) {
    case "downtown":
      return towers.length ? [...towers, ...blocks.slice(1)] : blocks;
    case "commercial":
      return blocks;
    case "industrial":
      return ["modern-sawtooth-shed-0", "modern-sawtooth-shed-1"];
    case "estate":
      return towers.slice(0, 1);
    default:
      return [];
  }
}
