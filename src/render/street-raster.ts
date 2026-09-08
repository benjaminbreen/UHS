import { pavingStonePixel } from "./paving-stones";
import type { TopographySample } from "../core/topography";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash } from "./water-style";
const mod = (n: number, d: number) => ((n % d) + d) % d;
/** Shared native-pixel paving materials. Place/date selection happens in content. */
export function rasterStreetTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): GroundTileData {
  const c = sample(x, y)!,
    material = c.streetMaterial ?? "slab",
    pixels = new Uint8ClampedArray(1024);
  const edge = (dx: number, dy: number) => {
    const n = sample(x + dx, y + dy);
    return n?.feature !== "paving" && !n?.bridge;
  };
  const north = edge(0, -1),
    south = edge(0, 1),
    west = edge(-1, 0),
    east = edge(1, 0);
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = (x + ox) * 16 + px,
        wy = (y + oy) * 16 + py;
      const border = Math.min(
        north ? py : 99,
        south ? 15 - py : 99,
        west ? px : 99,
        east ? 15 - px : 99,
      );
      let tone: readonly number[];
      if (border < 3) {
        // Use the nearest edge's tangent, including corners and T-junctions.
        const horizontal =
          Math.min(north ? py : 99, south ? 15 - py : 99) <=
          Math.min(west ? px : 99, east ? 15 - px : 99);
        const joint = mod(horizontal ? wx : wy, 9) === 0;
        tone =
          border === 2
            ? [112, 113, 96]
            : joint
              ? [137, 134, 112]
              : border === 0
                ? [202, 192, 157]
                : [175, 166, 138];
      } else if (material === "brick") {
        const w = 8,
          h = 4,
          row = Math.floor(wy / h);
        const a = mod(wx + (row % 2) * Math.floor(w / 2), w),
          b = mod(wy, h);
        const v = hash(Math.floor((wx + ((row % 2) * w) / 2) / w), row, 391);
        const base = [156, 98, 65];
        const light =
          a === 1 || b === 1
            ? 7
            : a === w - 1 || b === h - 1
              ? -7
              : Math.floor(v * 12) - 6;
        tone =
          a === 0 || b === 0 ? [132, 130, 112] : base.map((n) => n + light);
      } else {
        tone = pavingStonePixel(wx, wy, material);
      }
      // Chamfer exposed outer corners in native pixels. Connected road cells
      // retain full coverage, so intersections never acquire internal curbs.
      const corner = Math.min(
        north && west ? px + py : 99,
        north && east ? 15 - px + py : 99,
        south && west ? px + 15 - py : 99,
        south && east ? 30 - px - py : 99,
      );
      if (corner < 3) tone = [174, 157, 112];
      const i = (py * 16 + px) * 4;
      pixels.set([...tone, 255], i);
    }
  return { x, y, pixels };
}
