import type { WorldSetting } from "../geography/types";
import type { LandUse } from "./zoning";
import { industrialized, modernity } from "./modernity";
import { buildingModels } from "../graphics/models";

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

type StyleRule = {
  style: string;
  uses: readonly LandUse[];
  regions?: readonly string[];
  from: number;
  to?: number;
};

/** Which facade-grammar styles (scripts/art/modern_grammar.py) a block of
 * this use builds, where and when. A style's frames are `modern-<style>-<n>`. */
const STYLES: readonly StyleRule[] = [
  // The rental palaces of the boom rings, Vienna and Berlin to Budapest,
  // Barcelona and Paris; they stood through every later rebuilding.
  {
    style: "gruenderzeit",
    uses: ["tenement", "commercial"],
    regions: ["western-europe", "eastern-europe"],
    from: 1860,
  },
  // Khrushchev's five storeys from 1957; the same industrial panels built
  // the grands ensembles, the Plattenbau and China's work-unit walk-ups.
  {
    style: "khrushchyovka",
    uses: ["estate"],
    regions: [
      "eastern-europe",
      "western-europe",
      "east-asia",
      "west-asia-north-africa",
    ],
    from: 1957,
  },
  { style: "glass", uses: ["downtown"], from: 1995 },
  { style: "glass", uses: ["estate"], regions: ["east-asia", "southeast-asia"], from: 1995 },
];

// Asked once per block by the planner; the model list does not change.
const styleFrames = new Map<string, string[]>();
const framesOf = (style: string) => {
  let frames = styleFrames.get(style);
  if (!frames) {
    const pattern = new RegExp(`^modern-${style}-\\d+$`);
    frames = Object.keys(buildingModels).filter((f) => pattern.test(f));
    styleFrames.set(style, frames);
  }
  return frames;
};

/** The oblique modern buildings a block of this land use builds with, by
 * date and region. Where there are any, they replace the flat-front kit. */
export function modernBuildings(
  s: Pick<WorldSetting, "lon" | "lat" | "year">,
  use: LandUse,
): string[] {
  if (!industrialized(s)) return [];
  const region = modernity(s).id;
  const styled = STYLES.filter(
    (r) =>
      r.uses.includes(use) &&
      s.year >= r.from &&
      s.year < (r.to ?? Infinity) &&
      (!r.regions || r.regions.includes(region)),
  ).flatMap((r) => framesOf(r.style));
  const blocks = BRICK_BLOCKS.has(region)
    ? ["modern-commercial-block-0", "modern-commercial-block-1", "modern-commercial-block-2"]
    : [];
  const towers =
    s.year >= CURTAIN_WALL
      ? ["modern-curtain-tower-0", "modern-curtain-tower-1", "modern-curtain-tower-2"]
      : [];
  switch (use) {
    case "downtown":
      return [...styled, ...(towers.length ? [...towers, ...blocks.slice(1)] : blocks)];
    case "commercial":
      return [...styled, ...blocks];
    case "industrial":
      return ["modern-sawtooth-shed-0", "modern-sawtooth-shed-1"];
    case "estate":
      return styled.length ? styled : towers.slice(0, 1);
    default:
      return styled;
  }
}
