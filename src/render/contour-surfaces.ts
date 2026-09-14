import type { TopographyCell, TopographySample } from "../core/topography";
import { rasterHabitatTile, type GroundTileData } from "./habitat-raster";
import { paintedGround } from "./material-edges";
import type { WaterTileData } from "./water-raster";

type Surface = { x: number; y: number; cell: TopographyCell };
const natural = (c: TopographyCell | undefined): c is TopographyCell =>
  !!c &&
  paintedGround(c) &&
  !c.field &&
  c.feature !== "paving" &&
  c.feature !== "field" &&
  !c.pathArt?.length &&
  c.surface !== "soil";
const wrap = (n: number) => ((n % 16) + 16) % 16;

export function contourSurfaces(
  sample: TopographySample,
  groundTiles: readonly GroundTileData[],
  ox: number,
  oy: number,
  waterTiles: readonly WaterTileData[] = [],
) {
  const tiles = new Map(groundTiles.map((t) => [`${t.x},${t.y}`, t.pixels]));
  const water = new Map(waterTiles.map((t) => [`${t.x},${t.y}`, t.pixels]));
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
  const texture = (surface: Surface, px: number, py: number, tier: number) => {
    const x = Math.floor(px / 16), y = Math.floor(py / 16);
    const moved = x !== surface.x || y !== surface.y || tier !== surface.cell.height;
    const key = moved ? `${x},${y}:${surface.x},${surface.y}:${tier}` : `${x},${y}`;
    let pixels = tiles.get(key);
    if (!pixels && !moved && surface.cell.surface === "water")
      pixels = water.get(key);
    if (!pixels && paintedGround(surface.cell)) {
      // A borrowed tier paints this location's own ground at the donor's
      // height and surface. Copying the donor cell wholesale dragged its
      // path strokes and exposed patches a cell across the contour.
      const here = sample(x, y);
      const cell = moved ? {
        ...(here && natural(here) ? here : surface.cell),
        height: tier,
        surface: surface.cell.surface,
        // Shore distance belongs to this location, never to the donor tile.
        waterVisual: surface.cell.surface === "sand" || here?.height === surface.cell.height
          ? here?.waterVisual : undefined,
      } : surface.cell;
      pixels = rasterHabitatTile(sample, x, y, ox, oy, undefined, cell).pixels;
      tiles.set(key, pixels);
    }
    return pixels;
  };
  const pixel = (
    surface: Surface,
    px: number,
    py: number,
    tier: number,
    _level: (x: number, y: number) => number,
  ) => {
    const pixels = texture(surface, px, py, tier);
    const i = (wrap(py) * 16 + wrap(px)) * 4;
    return pixels?.subarray(i, i + 4);
  };
  return { owner, pixel };
}
