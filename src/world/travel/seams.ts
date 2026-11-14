import { atlasSample, broadEnvironment, toAtlas } from "../geography/atlas";
import type { Coordinate } from "./types";
export type BoundarySeam = {
  side: "N" | "E" | "S" | "W";
  start: number;
  end: number;
  water: number[];
  sea: boolean[];
  height: number[];
  road: boolean;
  roadAt: number;
  /** Tiles the blend reaches inward. A shore needs room for a beach and open
   * water; a road crossing only needs the ground to match. */
  band?: number;
  /** Fraction of this border that is dry ground, so 0 needs a boat. */
  walkable: number;
};
export const SEAM_BAND = 32;
export const SHORE_BAND = 72;
export const seamSide = (bearing: string): BoundarySeam["side"] =>
  (
    ({
      N: "N",
      NE: "N",
      E: "E",
      SE: "E",
      S: "S",
      SW: "S",
      W: "W",
      NW: "W",
    }) as const
  )[bearing as "N"];
export const oppositeSide = (
  side: BoundarySeam["side"],
): BoundarySeam["side"] =>
  (({ N: "S", S: "N", E: "W", W: "E" }) as const)[side];
export function sampleSeam(
  anchor: Coordinate,
  side: BoundarySeam["side"],
  /** The border is open sea whatever the atlas says here: used when one side
   * is an island or open water, whose own coast already closes the map. */
  openWater = false,
) {
  const p = toAtlas(anchor.lon, anchor.lat);
  const water: number[] = [],
    sea: boolean[] = [],
    height: number[] = [];
  const elevation =
    Math.round(broadEnvironment(anchor.lon, anchor.lat).relief * 3) * 14;
  for (let i = 0; i <= 32; i++) {
    const t = (i / 32 - 0.5) * 384;
    const a = atlasSample(
      p.x + (side === "N" || side === "S" ? t : 0),
      p.y + (side === "E" || side === "W" ? t : 0),
    );
    const depth = Math.min(a.coast, a.river - 6);
    if (openWater) {
      water.push(Math.max(-64, Math.min(-16, depth - 30)));
      sea.push(true);
      height.push(0);
      continue;
    }
    water.push(Math.max(-64, Math.min(64, depth)));
    sea.push(a.coast < a.river - 6);
    height.push(depth < 12 ? 0 : elevation);
  }
  const candidates = water
    .map((v, i) => ({ v, i }))
    .filter((p) => p.v > 8)
    .sort((a, b) => Math.abs(a.i - 16) - Math.abs(b.i - 16));
  return {
    water,
    sea,
    height,
    // A border with any water on it needs room for a shore; a dry crossing
    // only needs the ground either side to match.
    band: water.some((v) => v < 0) ? SHORE_BAND : SEAM_BAND,
    roadAt: (candidates[0]?.i ?? 16) / 32,
    /** Fraction of the border you can walk through. */
    walkable: water.filter((v) => v >= 0).length / water.length,
  };
}
