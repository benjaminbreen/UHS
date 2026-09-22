import type { TopographyCell, TopographySample } from "../../core/topography";
import { waterHash as hash } from "../../core/water-field";
import { pickSpecies, type FloraRegion, type Species } from "./flora";

export type BloomSpot = {
  x: number;
  y: number;
  wx: number;
  wy: number;
  /** The world cell the bloom grows in. */
  tx: number;
  ty: number;
  kind: string;
  phase: number;
};
const seasonal: Record<string, number> = {
  spring: 1,
  summer: 0.75,
  autumn: 0.2,
  winter: 0,
};
/** The flora of the world being drawn. The renderer's chunk builder has no
 * pack to read, so the scene sets this once per world. */
let current: FloraRegion = "europe";
export const setFloraRegion = (region: FloraRegion) => (current = region);
export const floraRegionNow = () => current;

/** The species of a bloom colony: one kind per five-cell block. */
export function colonySpecies(
  cell: TopographyCell,
  wx: number,
  wy: number,
  region = current,
): Species | undefined {
  const h = cell.habitat;
  if (!h || h.ecology === "desert") return undefined;
  return pickSpecies(
    "bloom",
    region,
    h.ecology,
    hash(Math.floor(wx / 5), Math.floor(wy / 5), 607),
  );
}
/** Blooms grow in colonies on open turf, away from worn ground and water.
 * `x`, `y` are in the sample's frame; `ox`, `oy` shift them to the world. */
export function bloomsAt(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  top: number,
  region = current,
): BloomSpot[] {
  const c = sample(x, y);
  const h = c?.habitat;
  if (!c || !h || !turf(c)) return [];
  const season = seasonal[h.season] ?? 0.5;
  if (!season) return [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const n = sample(x + dx, y + dy);
      if (!n || n.surface === "soil" || n.feature || n.height !== c.height)
        return [];
    }
  const wx = x + ox,
    wy = y + oy;
  const species = colonySpecies(c, wx, wy, region);
  if (!species) return [];
  const colony = hash(Math.floor(wx / 5), Math.floor(wy / 5), 601);
  const dense = h.kind === "meadow" ? 1.6 : h.kind === "open" ? 1 : 0.5;
  // A colony is thick with its one flower; the odd stray grows anywhere.
  const thick = colony > 0.72;
  const chance = (thick ? 0.3 : 0.03) * season * dense;
  if (hash(wx, wy, 603) > chance) return [];
  const count = 1 + Math.floor(hash(wx, wy, 605) * (thick ? 3 : 1.6));
  const spots: BloomSpot[] = [];
  for (let i = 0; i < count; i++) {
    // Each later bloom takes its own quadrant round the first, a clear gap
    // away, so heads never overlap.
    const turn = Math.floor(hash(wx, wy, 615) * 4);
    const gap = (seed: number, bit: number) =>
      ((i + turn) & bit ? 1 : -1) * (5 + Math.floor(hash(wx, wy, seed) * 3));
    const px =
      i === 0
        ? 3 + Math.floor(hash(wx, wy, 609) * 8)
        : spots[0].x - x * 16 + gap(619 + i * 7, 1);
    const py =
      i === 0
        ? 3 + Math.floor(hash(wx, wy, 613) * 8)
        : spots[0].y - top + gap(641 + i * 7, 2);
    spots.push({
      x: x * 16 + px,
      y: top + py,
      wx: wx * 16 + px,
      wy: wy * 16 + py,
      tx: wx,
      ty: wy,
      kind: species.id,
      phase: hash(wx, wy, 617 + i) * 6.28,
    });
  }
  return spots;
}
function turf(c: TopographyCell) {
  const h = c.habitat!;
  return (
    !c.ramp &&
    !c.bridge &&
    !c.feature &&
    !c.solid &&
    ["grass", "damp", "dry"].includes(c.surface) &&
    h.exposed < 0.4 &&
    h.wet < 0.61 &&
    (h.kind !== "woodland" || h.cover < 0.5) &&
    h.kind !== "exposed" &&
    (!c.waterVisual || c.waterVisual.distance > c.waterVisual.shoreWidth + 1)
  );
}
