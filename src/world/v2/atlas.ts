import data from "../../content/geography/atlas.generated.json" with { type: "json" };
import { mountainBelts } from "../../content/geography/landforms";
import { segmentDistance } from "./noise";
export const ATLAS_SCALE = 2048; // game tiles per geographic degree; a deliberately compressed Earth
export const atlasLand = data.land;
export const atlasRivers = data.rivers;
export const toAtlas = (lon: number, lat: number) => ({
  x: Math.round(lon * ATLAS_SCALE),
  y: Math.round(-lat * ATLAS_SCALE),
});
export const fromAtlas = (x: number, y: number) => ({
  lon: x / ATLAS_SCALE,
  lat: -y / ATLAS_SCALE,
});
type Edge = { a: number[]; b: number[]; name?: string };
const landEdges = new Map<string, Edge[]>(),
  riverEdges = new Map<string, Edge[]>();
const key = (x: number, y: number) =>
  `${Math.floor(x / 2)},${Math.floor(y / 2)}`;
function index(target: Map<string, Edge[]>, points: number[][], name?: string) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    if (Math.abs(a[0] - b[0]) > 180) continue;
    for (
      let y = Math.floor(Math.min(a[1], b[1]) / 2) - 1;
      y <= Math.floor(Math.max(a[1], b[1]) / 2) + 1;
      y++
    )
      for (
        let x = Math.floor(Math.min(a[0], b[0]) / 2) - 1;
        x <= Math.floor(Math.max(a[0], b[0]) / 2) + 1;
        x++
      ) {
        const k = `${x},${y}`;
        const edges = target.get(k) ?? [];
        edges.push({ a, b, name });
        target.set(k, edges);
      }
  }
}
for (const ring of data.land) index(landEdges, ring);
for (const river of data.rivers) index(riverEdges, river.points, river.name);
// A tiny scan-line land mask makes atlas lookup constant-time away from shorelines.
const width = 1440,
  height = 720,
  mask = new Uint8Array(width * height);
for (const ring of data.land) {
  const minY = Math.max(
    0,
    Math.floor((90 - Math.max(...ring.map((p) => p[1]))) * 4),
  );
  const maxY = Math.min(
    height - 1,
    Math.ceil((90 - Math.min(...ring.map((p) => p[1]))) * 4),
  );
  for (let row = minY; row <= maxY; row++) {
    const lat = 90 - (row + 0.5) / 4,
      hits: number[] = [];
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1],
        b = ring[i];
      if (a[1] > lat !== b[1] > lat)
        hits.push(a[0] + ((lat - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2)
      mask.fill(
        1,
        row * width + Math.max(0, Math.ceil((hits[i] + 180) * 4 - 0.5)),
        row * width + Math.min(width, Math.ceil((hits[i + 1] + 180) * 4 - 0.5)),
      );
  }
}
// Exact scan-line membership near shore avoids square coast artifacts from the
// coarse mask. Tile rows share the intersections; cache size stays bounded.
const shoreRows = new Map<number, number[]>();
function landAt(lon: number, lat: number) {
  let hits = shoreRows.get(lat);
  if (!hits) {
    hits = [];
    for (const ring of atlasLand)
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1],
          b = ring[i];
        if (a[1] > lat !== b[1] > lat)
          hits.push(a[0] + ((lat - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    hits.sort((a, b) => a - b);
    if (shoreRows.size >= 2048) shoreRows.clear();
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
  const { lon, lat } = fromAtlas(x, y),
    k = key(lon, lat);
  const col = Math.max(0, Math.min(width - 1, Math.floor((lon + 180) * 4))),
    row = Math.max(0, Math.min(height - 1, Math.floor((90 - lat) * 4)));
  let coast = 2;
  for (const e of landEdges.get(k) ?? [])
    coast = Math.min(coast, segmentDistance(lon, lat, e.a, e.b));
  let river = Infinity;
  for (const e of riverEdges.get(k) ?? [])
    river = Math.min(river, segmentDistance(lon, lat, e.a, e.b) * ATLAS_SCALE);
  return {
    coast:
      ((coast < 0.36 ? landAt(lon, lat) : mask[row * width + col]) ? 1 : -1) *
      coast *
      ATLAS_SCALE,
    river,
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
    : (riverEdges.get(key(lon, lat)) ?? []);
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
