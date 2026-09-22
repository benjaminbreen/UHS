import { trimCache } from "../../core/cache";
import prepared from "../../content/geography/atlas-index.generated.json" with { type: "json" };
import data from "../../content/geography/atlas.generated.json" with { type: "json" };
import { mountainBelts } from "../../content/geography/landforms";
import { segmentDistance } from "./noise";
import { ATLAS_SCALE, fromAtlas } from "./coordinates";
export { ATLAS_SCALE, toAtlas, fromAtlas } from "./coordinates";
export const atlasLand = data.land;
export const atlasRivers = data.rivers;
type Edge = { a: number[]; b: number[]; name?: string };
const { width, height, bucket: BUCKET } = prepared;
/** Edges from the bucket at lon/lat and its eight neighbours. */
function* near(index: Map<string, Edge[]>, lon: number, lat: number) {
  const cx = Math.floor(lon / BUCKET),
    cy = Math.floor(lat / BUCKET);
  for (let y = cy - 1; y <= cy + 1; y++)
    for (let x = cx - 1; x <= cx + 1; x++) {
      const list = index.get(`${x},${y}`);
      if (list) yield* list;
    }
}
const mask = new Uint8Array(width * height);
for (const [start, end] of prepared.runs) mask.fill(1, start, end);
function edges(paths: { points: number[][]; name?: string }[]) {
  return paths.flatMap(({ points, name }) =>
    points
      .slice(1)
      .flatMap((b, i) =>
        Math.abs(points[i][0] - b[0]) > 180 ? [] : [{ a: points[i], b, name }],
      ),
  );
}
function buckets(ranges: [string, number[]][], all: Edge[]) {
  const result = new Map<string, Edge[]>();
  for (const [key, runs] of ranges) {
    const list: Edge[] = [];
    for (let i = 0; i < runs.length; i += 2)
      for (let j = runs[i]; j < runs[i + 1]; j++) list.push(all[j]);
    result.set(key, list);
  }
  return result;
}
const landEdges = buckets(
  prepared.land as [string, number[]][],
  edges(data.land.map((points) => ({ points }))),
);
const riverEdges = buckets(
  prepared.rivers as [string, number[]][],
  edges(data.rivers),
);
// Exact scan-line membership near shore avoids square coast artifacts from the
// coarse mask. Tile rows share the intersections; cache size stays bounded.
const shoreRows = new Map<number, number[]>();
const BAND = 0.25;
const bandOf = (lat: number) =>
  Math.max(0, Math.min(BANDS - 1, Math.floor((90 - lat) / BAND)));
const BANDS = Math.round(180 / BAND);
/** Coast segments as flat ax, ay, bx, by, with the segments crossing each
 * latitude band listed separately: a scan line only needs the ones that reach
 * its row, not all hundred thousand vertices of the world. Built on the first
 * shore query, so importing the atlas stays cheap. */
let shoreSegments: Float64Array | undefined;
let shoreBands: Int32Array[] | undefined;
function buildShoreIndex() {
  const flat: number[] = [];
  const lists: number[][] = Array.from({ length: BANDS }, () => []);
  for (const ring of atlasLand)
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1],
        b = ring[i];
      // A horizontal segment never crosses a scan line.
      if (a[1] === b[1]) continue;
      const index = flat.length / 4;
      flat.push(a[0], a[1], b[0], b[1]);
      const top = bandOf(Math.max(a[1], b[1])),
        bottom = bandOf(Math.min(a[1], b[1]));
      for (let band = top; band <= bottom; band++) lists[band].push(index);
    }
  shoreSegments = Float64Array.from(flat);
  shoreBands = lists.map((list) => Int32Array.from(list));
}
function landAt(lon: number, lat: number) {
  let hits = shoreRows.get(lat);
  if (!hits) {
    if (!shoreBands) buildShoreIndex();
    const segments = shoreSegments!;
    hits = [];
    for (const i of shoreBands![bandOf(lat)]) {
      const ax = segments[i * 4],
        ay = segments[i * 4 + 1],
        bx = segments[i * 4 + 2],
        by = segments[i * 4 + 3];
      if (ay > lat !== by > lat)
        hits.push(ax + ((lat - ay) * (bx - ax)) / (by - ay));
    }
    hits.sort((a, b) => a - b);
    trimCache(shoreRows, 2048);
    shoreRows.set(lat, hits);
  }
  let left = 0,
    right = hits.length;
  while (left < right) {
    const middle = (left + right) >>> 1;
    if (hits[middle] <= lon) left = middle + 1;
    else right = middle;
  }
  return left % 2 === 1;
}
export function atlasSample(x: number, y: number) {
  const { lon, lat } = fromAtlas(x, y);
  const col = Math.max(0, Math.min(width - 1, Math.floor((lon + 180) * 4))),
    row = Math.max(0, Math.min(height - 1, Math.floor((90 - lat) * 4)));
  // Beyond the neighbouring buckets the coast is only known to be far.
  let coast = BUCKET;
  for (const e of near(landEdges, lon, lat))
    coast = Math.min(coast, segmentDistance(lon, lat, e.a, e.b));
  let river = Infinity;
  let riverFlow: readonly [number, number] = [0, 0];
  for (const e of near(riverEdges, lon, lat)) {
    const distance = segmentDistance(lon, lat, e.a, e.b) * ATLAS_SCALE;
    if (distance < river) {
      river = distance;
      const dx = e.b[0] - e.a[0],
        dy = e.a[1] - e.b[1],
        length = Math.hypot(dx, dy) || 1;
      riverFlow = [dx / length, dy / length];
    }
  }
  return {
    coast:
      ((coast < 0.36 ? landAt(lon, lat) : mask[row * width + col]) ? 1 : -1) *
      coast *
      ATLAS_SCALE,
    river,
    riverFlow,
  };
}

export function broadEnvironment(lon: number, lat: number) {
  let relief = 0.15;
  for (const ridge of mountainBelts)
    for (let i = 1; i < ridge.points.length; i++) {
      const distance = segmentDistance(
        lon,
        lat,
        ridge.points[i - 1],
        ridge.points[i],
      );
      relief = Math.max(relief, Math.max(0, 1 - distance / ridge.width));
    }
  const a = Math.abs(lat);
  let moisture = a < 15 ? 0.85 : a > 60 ? 0.38 : 0.6;
  if (
    (lon > -18 && lon < 65 && lat > 17 && lat < 34) ||
    (lon > 115 && lon < 145 && lat < -18 && lat > -32) ||
    (lon > 45 && lon < 105 && lat > 35 && lat < 49)
  )
    moisture = 0.16;
  if (lon > 70 && lon < 140 && lat > 8 && lat < 30) moisture = 0.72;
  if (lon > -12 && lon < 40 && lat > 31 && lat < 44) moisture = 0.38;
  return { relief, moisture, cold: a > 58 };
}
export function nearestRiverPoint(
  x: number,
  y: number,
  name?: string,
): number[] | undefined {
  const { lon, lat } = fromAtlas(x, y);
  let best = Infinity,
    point: number[] | undefined;
  const edges = name
    ? atlasRivers
        .filter((r) => r.name.toLowerCase().includes(name.toLowerCase()))
        .flatMap((r) =>
          r.points.slice(1).map((b, i) => ({ a: r.points[i], b })),
        )
    : [...near(riverEdges, lon, lat)];
  for (const { a, b } of edges) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      t = Math.max(
        0,
        Math.min(
          1,
          ((lon - a[0]) * dx + (lat - a[1]) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
    const px = a[0] + t * dx,
      py = a[1] + t * dy,
      d = Math.hypot(px - lon, py - lat);
    if (d < best) {
      best = d;
      point = [px * ATLAS_SCALE, -py * ATLAS_SCALE];
    }
  }
  return best < 5 ? point : undefined;
}
