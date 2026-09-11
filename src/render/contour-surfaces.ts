import type { TopographyCell, TopographySample } from "../core/topography";
import { rasterHabitatTile, type GroundTileData } from "./habitat-raster";
import { paintedGround } from "./material-edges";
import { waterHash } from "./water-style";

type Surface = { x: number; y: number; cell: TopographyCell };
const natural = (c: TopographyCell | undefined): c is TopographyCell =>
  !!c &&
  paintedGround(c) &&
  !c.field &&
  c.feature !== "paving" &&
  c.feature !== "field" &&
  !c.pathArt?.length &&
  c.surface !== "soil";
const differs = (a: TopographyCell, b: TopographyCell) =>
  a.surface !== b.surface ||
  a.habitat?.ecology !== b.habitat?.ecology ||
  a.habitat?.colorway !== b.habitat?.colorway;
const wrap = (n: number) => ((n % 16) + 16) % 16;

export function contourSurfaces(
  sample: TopographySample,
  groundTiles: readonly GroundTileData[],
  ox: number,
  oy: number,
) {
  const tiles = new Map(groundTiles.map((t) => [`${t.x},${t.y}`, t.pixels]));
  const candidates = new Map<string, Surface[]>();
  const owner = (px: number, py: number, tier: number): Surface | undefined => {
    const x = Math.floor(px / 16),
      y = Math.floor(py / 16);
    const cell = sample(x, y);
    if (!cell) return;
    const original = { x, y, cell };
    if (cell.height === tier || !natural(cell)) return original;
    const key = `${x},${y},${tier}`;
    let nearby = candidates.get(key);
    if (!nearby) {
      nearby = [];
      let tierDistance = Infinity;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const c = sample(x + dx, y + dy);
          if (!natural(c)) continue;
          const delta = Math.abs(c.height - tier);
          if (delta > tierDistance) continue;
          // A tall drop can interpolate a tier with no source cell of its own.
          if (delta < tierDistance) {
            nearby = [];
            tierDistance = delta;
          }
          nearby.push({ x: x + dx, y: y + dy, cell: c });
        }
      candidates.set(key, nearby);
    }
    let best = original,
      distance = Infinity;
    for (const candidate of nearby) {
      const d =
        (candidate.x * 16 + 8 - px) ** 2 + (candidate.y * 16 + 8 - py) ** 2;
      if (d < distance) {
        best = candidate;
        distance = d;
      }
    }
    return best;
  };
  const texture = (surface: Surface) => {
    const key = `${surface.x},${surface.y}`;
    let pixels = tiles.get(key);
    if (!pixels && paintedGround(surface.cell)) {
      pixels = rasterHabitatTile(sample, surface.x, surface.y, ox, oy).pixels;
      tiles.set(key, pixels);
    }
    return pixels;
  };
  const pixel = (
    surface: Surface,
    px: number,
    py: number,
    tier: number,
    level: (x: number, y: number) => number,
  ) => {
    let donor = surface;
    if (natural(surface.cell)) {
      const wx = px + ox * 16,
        wy = py + oy * 16;
      const chance = waterHash(Math.floor(wx / 2), Math.floor(wy / 2), 977);
      // Sparse two-pixel clusters stay on the ground; faces are painted later.
      if (chance < 0.38) {
        outer: for (let d = 1; d <= 3; d++) {
          if (chance >= (4 - d) * 0.095) break;
          for (const [dx, dy] of [
            [-d, 0],
            [d, 0],
            [0, -d],
            [0, d],
          ]) {
            const otherTier = level(px + dx, py + dy);
            if (Math.abs(otherTier - tier) > 1) continue;
            const other = owner(px + dx, py + dy, otherTier);
            if (
              other &&
              natural(other.cell) &&
              differs(surface.cell, other.cell)
            ) {
              donor = other;
              break outer;
            }
          }
        }
      }
    }
    const pixels = texture(donor);
    const i = (wrap(py) * 16 + wrap(px)) * 4;
    return pixels?.subarray(i, i + 4);
  };
  return { owner, pixel };
}
