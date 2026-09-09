import { pavingGrade, pavingStonePixel } from "./paving-stones";
import type { TopographyCell, TopographySample } from "../core/topography";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash } from "./water-style";
const mod = (n: number, d: number) => ((n % d) + d) % d;
const paved = (n?: TopographyCell) => n?.feature === "paving" || !!n?.bridge;
/** A cell that reads as ground beside paving, so the edge wears rather than
 * stops. Water and the field edge keep their own outlines. */
export const wornEdge = (n?: TopographyCell) =>
  !!n && !paved(n) && n.surface !== "water" && n.feature !== "field";
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
    grade = pavingGrade(c.pavement),
    pixels = new Uint8ClampedArray(1024);
  const dais = c.pavement === "dais";
  const at = (dx: number, dy: number) => sample(x + dx, y + dy);
  const edge = (dx: number, dy: number) => !paved(at(dx, dy));
  // A dais edge is a step down to ordinary paving; the platform itself is
  // continuous across its cells.
  const step = (dx: number, dy: number) =>
    dais && at(dx, dy)?.pavement !== "dais";
  const north = edge(0, -1),
    south = edge(0, 1),
    west = edge(-1, 0),
    east = edge(1, 0);
  // A raised footway keeps a cut kerb; every other street edge wears into the
  // ground beside it.
  const kerb = c.pavement === "footway";
  const worn = (dx: number, dy: number) => !kerb && wornEdge(at(dx, dy));
  const stepN = step(0, -1),
    stepS = step(0, 1),
    stepW = step(-1, 0),
    stepE = step(1, 0);
  const shadowed = !dais && at(0, -1)?.pavement === "dais";
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
      const nearest =
        border === (north ? py : 99)
          ? worn(0, -1)
          : border === (south ? 15 - py : 99)
            ? worn(0, 1)
            : border === (west ? px : 99)
              ? worn(-1, 0)
              : worn(1, 0);
      if (border < 3 && !nearest) {
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
        tone = pavingStonePixel(wx, wy, material, grade);
      }
      // A worn edge: the outermost stones are broken and sunk, and grit from
      // the ground beside creeps over the last pixel or two.
      if (border < 2 && nearest) {
        const grit = hash(Math.floor(wx / 2), Math.floor(wy / 2), 523);
        if (border === 0 && grit < 0.55) tone = [169, 156, 121];
        else if (grit < 0.22) tone = [160, 152, 124];
        else if (border === 0) tone = tone.map((n) => n - 8);
      }
      if (dais) {
        // Two steps: a lit top lip on every open side, a riser on the south.
        const lip = Math.min(
          stepN ? py : 99,
          stepW ? px : 99,
          stepE ? 15 - px : 99,
          stepS ? 15 - py : 99,
        );
        if (stepS && 15 - py < 4) {
          const r = 15 - py;
          tone =
            r === 3
              ? [214, 208, 188]
              : r === 1
                ? [128, 124, 106]
                : [150, 146, 126];
          if (r === 2 && mod(wx, 7) === 3) tone = [136, 132, 112];
        } else if (lip === 0) tone = [224, 218, 198];
        else if (lip === 1) tone = tone.map((n) => n + 6);
      } else if (shadowed && py < 2) {
        tone = tone.map((n) => n - (py === 0 ? 22 : 10));
      }
      // Chamfer exposed outer corners in native pixels. Connected road cells
      // retain full coverage, so intersections never acquire internal curbs.
      const corner = Math.min(
        north && west ? px + py : 99,
        north && east ? 15 - px + py : 99,
        south && west ? px + 15 - py : 99,
        south && east ? 30 - px - py : 99,
      );
      if (corner < 3) tone = kerb ? [174, 157, 112] : [169, 156, 121];
      const i = (py * 16 + px) * 4;
      pixels.set([...tone, 255], i);
    }
  return { x, y, pixels };
}
