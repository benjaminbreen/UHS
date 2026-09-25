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
export function boundarySample(
  size: number,
  seams: BoundarySeam[],
  x: number,
  y: number,
) {
  const half = size / 2;
  const candidates = seams
    .map((seam) => {
      const horizontal = seam.side === "N" || seam.side === "S";
      const u = ((horizontal ? x : y) + half) / (size - 1);
      const depth =
        seam.side === "N"
          ? y + half
          : seam.side === "S"
            ? half - 1 - y
            : seam.side === "W"
              ? x + half
              : half - 1 - x;
      return { seam, u, depth };
    })
    .filter(
      (p) =>
        p.depth >= 0 &&
        p.depth < (p.seam.band ?? SEAM_BAND) &&
        p.u >= p.seam.start &&
        p.u <= p.seam.end,
    )
    // Nearest edge wins, so a road crossing is not flooded by the wider shore
    // band reaching round a corner.
    .sort((a, b) => a.depth - b.depth);
  const hit = candidates[0];
  if (!hit) return undefined;
  const { seam, u, depth } = hit,
    t = (u - seam.start) / (seam.end - seam.start),
    k = t * (seam.water.length - 1),
    i = Math.min(seam.water.length - 2, Math.floor(k)),
    f = k - i;
  const interpolate = (values: number[]) =>
    values[i] * (1 - f) + values[i + 1] * f;
  const band = seam.band ?? SEAM_BAND;
  const fade = Math.max(0, Math.min(1, (depth - 2) / (band - 2)));
  const weight = 1 - fade * fade * (3 - 2 * fade);
  return {
    water: interpolate(seam.water),
    height: interpolate(seam.height),
    kind: seam.sea[Math.round(k)] ? ("sea" as const) : ("river" as const),
    weight,
    road:
      seam.road &&
      Math.abs(t - seam.roadAt) * (seam.end - seam.start) * (size - 1) < 1.5,
    flow:
      seam.side === "N" || seam.side === "S"
        ? ([0, 1] as const)
        : ([1, 0] as const),
  };
}
