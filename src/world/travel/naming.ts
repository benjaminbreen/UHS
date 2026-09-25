import { ecoregionAt } from "../../content/geography/ecoregions";
import { physicalRegions } from "../../content/geography/travel/generated";
import { northAmericanLandscape } from "../../content/geography/travel/north-american-landscapes";
import { waterRegion } from "../../content/geography/travel/oceans";
import type { Coordinate } from "./types";

export type GeographicName = {
  name: string;
  coverage: "specific" | "broad" | "missing";
  sourceName?: string;
  regionId?: string;
  /** West, south, east, north of the named region, where one matched. */
  bounds?: number[];
  source: string;
};
type Region = (typeof physicalRegions)[number];
const ecoregion = (p: Coordinate) => ecoregionAt(p.lon, p.lat);
const SOURCE = "Natural Earth physical labels · approximate boundary";
const wrap = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;
const boundsOf = (ring: number[][]) => [
  Math.min(...ring.map((p) => p[0])),
  Math.min(...ring.map((p) => p[1])),
  Math.max(...ring.map((p) => p[0])),
  Math.max(...ring.map((p) => p[1])),
];
const inBounds = (b: number[], p: Coordinate) =>
  p.lon >= b[0] && p.lon <= b[2] && p.lat >= b[1] && p.lat <= b[3];
const parts = new Map(
  physicalRegions.map((r) => [
    r.id,
    r.polygons.map((rings) => ({ rings, bounds: boundsOf(rings[0]) })),
  ]),
);
const buckets = new Map<string, Region[]>();
for (const r of physicalRegions) {
  for (
    let y = Math.floor(r.bounds[1] / 5);
    y <= Math.floor(r.bounds[3] / 5);
    y++
  )
    for (
      let x = Math.floor(r.bounds[0] / 5);
      x <= Math.floor(r.bounds[2] / 5);
      x++
    ) {
      const key = `${x}:${y}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(r);
    }
}
function inRing(ring: number[][], p: Coordinate) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i],
      [a, b] = ring[j];
    if (
      y > p.lat !== b > p.lat &&
      p.lon < ((a - x) * (p.lat - y)) / (b - y) + x
    )
      inside = !inside;
  }
  return inside;
}
function contains(r: Region, p: Coordinate) {
  return parts
    .get(r.id)!
    .some(
      ({ rings, bounds }) =>
        inBounds(bounds, p) &&
        inRing(rings[0], p) &&
        !rings.slice(1).some((h) => inRing(h, p)),
    );
}
function broadName(r: Region, p: Coordinate) {
  if (r.kind !== "Continent") return r.name;
  if (r.name === "Antarctica") return "Antarctic interior";
  const [w, s, e, n] = r.bounds;
  const x = (p.lon - w) / (e - w),
    y = (p.lat - s) / (n - s);
  const direction =
    y < 0.3
      ? "Southern"
      : y > 0.7
        ? "Northern"
        : x < 0.4
          ? "Western"
          : x > 0.6
            ? "Eastern"
            : "Central";
  return `${direction} ${r.name}`;
}

export function resolveGeographicName(
  p: Coordinate,
  water: boolean,
  footprintKm = 2,
): GeographicName {
  p = { lon: wrap(p.lon), lat: Math.max(-89.9999, Math.min(89.9999, p.lat)) };
  const local = !water && northAmericanLandscape(p);
  if (local)
    return {
      name: local.name,
      coverage: "specific",
      regionId: local.id,
      source: "Regional refinement · approximate USGS interpretation",
    };
  const dy = Math.max(0, footprintKm) / 111,
    dx = dy / Math.max(0.05, Math.cos((p.lat * Math.PI) / 180));
  const samples = [
    p,
    { lon: wrap(p.lon - dx), lat: p.lat },
    { lon: wrap(p.lon + dx), lat: p.lat },
    { lon: p.lon, lat: Math.min(89.9999, p.lat + dy) },
    { lon: p.lon, lat: Math.max(-89.9999, p.lat - dy) },
  ];
  const candidates = (
    buckets.get(`${Math.floor(p.lon / 5)}:${Math.floor(p.lat / 5)}`) ?? []
  )
    .filter(
      (r) => r.marine === water && inBounds(r.bounds, p) && contains(r, p),
    )
    .sort((a, b) => a.area - b.area || a.id.localeCompare(b.id));
  const specific = candidates.find(
    (r) =>
      !["Continent", "Geoarea", "Island group", "ocean"].includes(r.kind) &&
      !(r.kind === "Island" && r.area > 10) &&
      r.name.length <= 34 &&
      samples.filter((p) => contains(r, p)).length >= 3,
  );
  if (specific)
    return {
      name: specific.name,
      coverage: "specific",
      regionId: specific.id,
      bounds: specific.bounds,
      source: SOURCE,
    };
  if (water) {
    const ocean = waterRegion(p);
    return {
      name: ocean.name,
      coverage: "broad",
      regionId: ocean.id,
      source: "Fixed ocean sector · approximate geographic interpretation",
    };
  }
  const eco = ecoregion(p);
  if (
    eco?.name &&
    samples.filter((p) => ecoregion(p)?.id === eco.id).length >= 3
  )
    return {
      name: eco.name,
      sourceName: eco.sourceName,
      coverage: "broad",
      regionId: `resolve:${eco.id}`,
      source:
        "RESOLVE Ecoregions 2017 · CC BY 4.0 · modern regional label, not historical vegetation",
    };
  const broad = candidates.find(
    (r) =>
      ["Geoarea", "Island group", "Continent", "Island"].includes(r.kind) &&
      r.name.length <= 34,
  );
  if (broad)
    return {
      name: broadName(broad, p),
      coverage: "broad",
      regionId: broad.id,
      bounds: broad.kind === "Continent" ? undefined : broad.bounds,
      source: SOURCE,
    };
  return {
    name: `Landscape at ${Math.abs(p.lat).toFixed(0)}°${p.lat < 0 ? "S" : "N"}, ${Math.abs(p.lon).toFixed(0)}°${p.lon < 0 ? "W" : "E"}`,
    coverage: "missing",
    source: "No containing physical region in the source data",
  };
}
