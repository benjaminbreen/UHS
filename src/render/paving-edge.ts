import type { TopographyCell, TopographySample } from "../core/topography";
import { raisedFieldEdge } from "./field-raster";
import { waterHash as hash } from "./water-style";

export const paved = (n?: TopographyCell) =>
  n?.feature === "paving" || !!n?.bridge;
/** A cell that reads as ground beside paving, so the edge wears rather than
 * stops. Water and a field with a standing boundary keep their own outlines. */
export const wornEdge = (n?: TopographyCell) =>
  !!n &&
  !paved(n) &&
  n.surface !== "water" &&
  (n.field ? !raisedFieldEdge(n) : n.feature !== "field");

/** The roadway a footway runs beside, within two cells. */
export function roadwayMaterial(sample: TopographySample, x: number, y: number) {
  for (const r of [1, 2])
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++) {
        const n = sample(x + i, y + j);
        if (
          n?.feature === "paving" &&
          n.pavement !== "footway" &&
          n.pavement !== "verge" &&
          n.pavement !== "dais"
        )
          return n.streetMaterial ?? "slab";
      }
  return undefined;
}
/** A raised, kerbed footway belongs beside a made roadway. Beside cobbles or
 * flags it is the same stones carried to the house fronts, with a worn edge. */
export function kerbed(sample: TopographySample, x: number, y: number) {
  if (sample(x, y)?.pavement !== "footway") return false;
  const road = roadwayMaterial(sample, x, y);
  return !!road && road !== "cobble" && road !== "slab";
}

/** A one-cell slot of ground between paving reads as a hole; draw it paved. */
export function enclosed(sample: TopographySample, x: number, y: number) {
  return (
    wornEdge(sample(x, y)) &&
    ((paved(sample(x - 1, y)) && paved(sample(x + 1, y))) ||
      (paved(sample(x, y - 1)) && paved(sample(x, y + 1))))
  );
}

// Box-blur half width and threshold. On a straight edge the contour sits
// (T - 0.5) * 2K = 2.5px inside the cell boundary, which is the verge.
const K = 8,
  T = 0.656;
/** Soil reaches this far outside the paving contour, in native pixels. */
export const VERGE = 4.5;

const smooth = (wx: number, wy: number, scale: number, seed: number) => {
  const fx = wx / scale,
    fy = wy / scale,
    ix = Math.floor(fx),
    iy = Math.floor(fy),
    tx = fx - ix,
    ty = fy - iy;
  const a = hash(ix, iy, seed),
    b = hash(ix + 1, iy, seed),
    c = hash(ix, iy + 1, seed),
    d = hash(ix + 1, iy + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
};

/** Signed distance, in native pixels, from a pixel of cell (x, y) to the
 * paving margin: positive inside. The margin is the blurred footprint of the
 * paved cells, so outer corners round, inner corners fillet and a staircase
 * of cells reads as a slope. Undefined where no worn ground is near. */
export function pavingMask(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): ((px: number, py: number) => number) | undefined {
  const solid: boolean[] = [];
  let open = false,
    any = false;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const n = sample(x + i, y + j);
      // Kerbed footways and platforms keep cut edges.
      const s = !wornEdge(n) || enclosed(sample, x + i, y + j);
      solid.push(s);
      if (!s) open = true;
      if (paved(n) && n?.pavement !== "dais" && !kerbed(sample, x + i, y + j))
        any = true;
    }
  if (!open || !any) return undefined;
  const span = (c: number, i: number) =>
    Math.max(0, Math.min(c + K, 16 * i + 16) - Math.max(c - K, 16 * i));
  return (px, py) => {
    const cx = px + 0.5,
      cy = py + 0.5;
    let cover = 0;
    for (let j = -1; j <= 1; j++) {
      const h = span(cy, j);
      if (!h) continue;
      for (let i = -1; i <= 1; i++)
        if (solid[(j + 1) * 3 + i + 1]) cover += span(cx, i) * h;
    }
    const wx = (x + ox) * 16 + px,
      wy = (y + oy) * 16 + py;
    return (
      (cover / (4 * K * K) - T) * 2 * K +
      (smooth(wx, wy, 11, 881) - 0.5) * 2.6 +
      (hash(wx >> 1, wy >> 1, 882) - 0.5) * 0.8
    );
  };
}
