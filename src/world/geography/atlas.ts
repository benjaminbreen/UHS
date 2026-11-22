import { trimCache } from "../../core/cache";
import prepared from "../../content/geography/atlas-index.generated.json" with { type: "json" };
import data from "../../content/geography/atlas.generated.json" with { type: "json" };
import { mountainBelts } from "../../content/geography/landforms";
import { segmentDistance } from "./noise";
import { ATLAS_SCALE, fromAtlas } from "./coordinates";
import { climateAt, climateMoistureAt } from "../../content/geography/climate-map";
export { ATLAS_SCALE, toAtlas, fromAtlas } from "./coordinates";

type BucketIndex = {
  slots: Map<number, number>;
  offsets: Int32Array;
  edges: Int32Array;
};

const { width, height, bucket: BUCKET } = prepared;
export const atlasMaskWidth = width;
export const atlasMaskHeight = height;
export const atlasMask = new Uint8Array(width * height);
for (const [start, end] of prepared.runs) atlasMask.fill(1, start, end);

// Pack Earth coastlines, rivers and spatial buckets into flat typed arrays,
// then release the parsed JSON arrays (~85 MB in V8, ~300+ MB in WebKit JSC).
let landVertCount = 0;
let landEdgeCount = 0;
for (const ring of data.land) {
  landVertCount += ring.length;
  for (let i = 1; i < ring.length; i++)
    if (Math.abs(ring[i - 1][0] - ring[i][0]) <= 180) landEdgeCount++;
}
const landCoords = new Float64Array(landVertCount * 2);
const landRings = new Int32Array(data.land.length + 1);
const landEdgeV = new Int32Array(landEdgeCount);
{
  let v = 0, e = 0;
  for (let r = 0; r < data.land.length; r++) {
    const ring = data.land[r];
    landRings[r] = v;
    for (let i = 0; i < ring.length; i++) {
      landCoords[v * 2] = ring[i][0];
      landCoords[v * 2 + 1] = ring[i][1];
      if (i > 0 && Math.abs(ring[i - 1][0] - ring[i][0]) <= 180) landEdgeV[e++] = v - 1;
      v++;
    }
  }
  landRings[data.land.length] = v;
}

let riverVertCount = 0;
let riverEdgeCount = 0;
for (const river of data.rivers) {
  const pts = river.points;
  riverVertCount += pts.length;
  for (let i = 1; i < pts.length; i++)
    if (Math.abs(pts[i - 1][0] - pts[i][0]) <= 180) riverEdgeCount++;
}
const riverCoords = new Float64Array(riverVertCount * 2);
const riverRings = new Int32Array(data.rivers.length + 1);
const riverNames = data.rivers.map((r) => r.name);
const riverEdgeV = new Int32Array(riverEdgeCount);
const riverEdgeId = new Int32Array(riverEdgeCount);
{
  let v = 0, e = 0;
  for (let r = 0; r < data.rivers.length; r++) {
    const pts = data.rivers[r].points;
    riverRings[r] = v;
    for (let i = 0; i < pts.length; i++) {
      riverCoords[v * 2] = pts[i][0];
      riverCoords[v * 2 + 1] = pts[i][1];
      if (i > 0 && Math.abs(pts[i - 1][0] - pts[i][0]) <= 180) {
        riverEdgeV[e] = v - 1;
        riverEdgeId[e] = r;
        e++;
      }
      v++;
    }
  }
  riverRings[data.rivers.length] = v;
}

const bucketKey = (cx: number, cy: number) => (cx + 512) * 1024 + (cy + 512);
function packBuckets(ranges: [string, number[]][]): BucketIndex {
  let total = 0;
  for (const [, runs] of ranges)
    for (let i = 0; i < runs.length; i += 2) total += runs[i + 1] - runs[i];
  const slots = new Map<number, number>();
  const offsets = new Int32Array(ranges.length + 1);
  const edges = new Int32Array(total);
  let pos = 0;
  for (let b = 0; b < ranges.length; b++) {
    const [key, runs] = ranges[b];
    const comma = key.indexOf(",");
    const cx = Number(key.slice(0, comma)), cy = Number(key.slice(comma + 1));
    slots.set(bucketKey(cx, cy), b);
    offsets[b] = pos;
    for (let i = 0; i < runs.length; i += 2)
      for (let j = runs[i]; j < runs[i + 1]; j++) edges[pos++] = j;
  }
  offsets[ranges.length] = pos;
  return { slots, offsets, edges };
}

const landBuckets = packBuckets(prepared.land as [string, number[]][]);
const riverBuckets = packBuckets(prepared.rivers as [string, number[]][]);

data.land.length = 0;
data.rivers.length = 0;
prepared.land.length = 0;
prepared.rivers.length = 0;
prepared.runs.length = 0;

export function forEachAtlasLand(fn: (coords: Float64Array, start: number, end: number) => void) {
  for (let r = 0; r < landRings.length - 1; r++) fn(landCoords, landRings[r], landRings[r + 1]);
}
export function forEachAtlasRiver(fn: (coords: Float64Array, start: number, end: number, name: string) => void) {
  for (let r = 0; r < riverRings.length - 1; r++) fn(riverCoords, riverRings[r], riverRings[r + 1], riverNames[r]);
}

function pointSegmentDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax,
    dy = by - ay,
    t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

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
  for (let r = 0; r < landRings.length - 1; r++) {
    const start = landRings[r], end = landRings[r + 1];
    for (let v = start + 1; v < end; v++) {
      const ax = landCoords[(v - 1) * 2], ay = landCoords[(v - 1) * 2 + 1];
      const bx = landCoords[v * 2], by = landCoords[v * 2 + 1];
      // A horizontal segment never crosses a scan line.
      if (ay === by) continue;
      const index = flat.length / 4;
      flat.push(ax, ay, bx, by);
      const top = bandOf(Math.max(ay, by)),
        bottom = bandOf(Math.min(ay, by));
      for (let band = top; band <= bottom; band++) lists[band].push(index);
    }
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
  const cx = Math.floor(lon / BUCKET),
    cy = Math.floor(lat / BUCKET);
  // Beyond the neighbouring buckets the coast is only known to be far.
  let coast = BUCKET;
  for (let by = cy - 1; by <= cy + 1; by++)
    for (let bx = cx - 1; bx <= cx + 1; bx++) {
      const slot = landBuckets.slots.get(bucketKey(bx, by));
      if (slot === undefined) continue;
      const end = landBuckets.offsets[slot + 1];
      for (let i = landBuckets.offsets[slot]; i < end; i++) {
        const v = landEdgeV[landBuckets.edges[i]] * 2;
        const d = pointSegmentDistance(lon, lat, landCoords[v], landCoords[v + 1], landCoords[v + 2], landCoords[v + 3]);
        if (d < coast) coast = d;
      }
    }
  let river = Infinity;
  let riverFlow: readonly [number, number] = [0, 0];
  for (let by = cy - 1; by <= cy + 1; by++)
    for (let bx = cx - 1; bx <= cx + 1; bx++) {
      const slot = riverBuckets.slots.get(bucketKey(bx, by));
      if (slot === undefined) continue;
      const end = riverBuckets.offsets[slot + 1];
      for (let i = riverBuckets.offsets[slot]; i < end; i++) {
        const v = riverEdgeV[riverBuckets.edges[i]] * 2;
        const ax = riverCoords[v], ay = riverCoords[v + 1], bx2 = riverCoords[v + 2], by2 = riverCoords[v + 3];
        const distance = pointSegmentDistance(lon, lat, ax, ay, bx2, by2) * ATLAS_SCALE;
        if (distance < river) {
          river = distance;
          const dx = bx2 - ax,
            dy = ay - by2,
            length = Math.hypot(dx, dy) || 1;
          riverFlow = [dx / length, dy / length];
        }
      }
    }
  return {
    coast:
      ((coast < 0.36 ? landAt(lon, lat) : atlasMask[row * width + col]) ? 1 : -1) *
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
  const moisture =
    climateMoistureAt(lon, lat) ?? (a < 15 ? 0.85 : a > 60 ? 0.38 : 0.6);
  const climate = climateAt(lon, lat);
  return {
    relief,
    moisture,
    cold: climate ? climate === "boreal" || climate === "tundra" : a > 58,
  };
}
/** The named river nearest an atlas point, and its distance in tiles. */
export function nearestRiver(x: number, y: number) {
  const { lon, lat } = fromAtlas(x, y);
  const cx = Math.floor(lon / BUCKET),
    cy = Math.floor(lat / BUCKET);
  let best: { name?: string; distance: number } = { distance: Infinity };
  for (let by = cy - 1; by <= cy + 1; by++)
    for (let bx = cx - 1; bx <= cx + 1; bx++) {
      const slot = riverBuckets.slots.get(bucketKey(bx, by));
      if (slot === undefined) continue;
      const end = riverBuckets.offsets[slot + 1];
      for (let i = riverBuckets.offsets[slot]; i < end; i++) {
        const e = riverBuckets.edges[i];
        const v = riverEdgeV[e] * 2;
        const distance = pointSegmentDistance(lon, lat, riverCoords[v], riverCoords[v + 1], riverCoords[v + 2], riverCoords[v + 3]) * ATLAS_SCALE;
        if (distance < best.distance) best = { name: riverNames[riverEdgeId[e]], distance };
      }
    }
  return best;
}
export function nearestRiverPoint(x: number, y: number, name?: string) {
  return nearestBankPoint(x, y, "river", name);
}
export function nearestBankPoint(
  x: number,
  y: number,
  shore: "river" | "coast",
  name?: string,
): number[] | undefined {
  const { lon, lat } = fromAtlas(x, y);
  let best = Infinity,
    point: number[] | undefined;
  const check = (ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax,
      dy = by - ay,
      t = Math.max(0, Math.min(1, ((lon - ax) * dx + (lat - ay) * dy) / (dx * dx + dy * dy || 1)));
    const px = ax + t * dx,
      py = ay + t * dy,
      d = Math.hypot(px - lon, py - lat);
    if (d < best) {
      best = d;
      point = [px * ATLAS_SCALE, -py * ATLAS_SCALE];
    }
  };
  if (name) {
    const needle = name.toLowerCase();
    for (let r = 0; r < riverNames.length; r++) {
      if (!riverNames[r].toLowerCase().includes(needle)) continue;
      const start = riverRings[r], end = riverRings[r + 1];
      for (let v = start + 1; v < end; v++)
        check(riverCoords[(v - 1) * 2], riverCoords[(v - 1) * 2 + 1], riverCoords[v * 2], riverCoords[v * 2 + 1]);
    }
  } else {
    const cx = Math.floor(lon / BUCKET),
      cy = Math.floor(lat / BUCKET);
    const index = shore === "coast" ? landBuckets : riverBuckets;
    const edgeV = shore === "coast" ? landEdgeV : riverEdgeV;
    const coords = shore === "coast" ? landCoords : riverCoords;
    for (let by = cy - 1; by <= cy + 1; by++)
      for (let bx = cx - 1; bx <= cx + 1; bx++) {
        const slot = index.slots.get(bucketKey(bx, by));
        if (slot === undefined) continue;
        const end = index.offsets[slot + 1];
        for (let i = index.offsets[slot]; i < end; i++) {
          const v = edgeV[index.edges[i]] * 2;
          check(coords[v], coords[v + 1], coords[v + 2], coords[v + 3]);
        }
      }
  }
  return best < 5 ? point : undefined;
}
