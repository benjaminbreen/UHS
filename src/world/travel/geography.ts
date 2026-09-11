import { northAmericanLandscape } from "../../content/geography/travel/north-american-landscapes";
import { waterRegion } from "../../content/geography/travel/oceans";
import { resolveGeographicName } from "./naming";
import { cellToLatLng, gridDisk, latLngToCell } from "h3-js";
import index from "../../content/geography/atlas-index.generated.json";
import { broadEnvironment } from "../geography/atlas";
import { regionalProfiles } from "../../content/geography/regions";
import { containsDate } from "../../content/history/dates";
import type { Coordinate, TravelCell, TravelMode } from "./types";
export const TRAVEL_RESOLUTION = 4;
const mask = new Uint8Array(index.width * index.height);
for (const [a, b] of index.runs) mask.fill(1, a, b);
export const wrapLon = (lon: number) =>
  ((((lon + 180) % 360) + 360) % 360) - 180;
export function isWater(p: Coordinate) {
  const col = Math.min(index.width - 1, Math.floor((wrapLon(p.lon) + 180) * 4));
  const row = Math.max(
    0,
    Math.min(index.height - 1, Math.floor((90 - p.lat) * 4)),
  );
  return mask[row * index.width + col] !== 1;
}
export function kilometers(a: Coordinate, b: Coordinate) {
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlon = wrapLon(b.lon - a.lon) * r;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function bearingTo(a: Coordinate, b: Coordinate) {
  const r = Math.PI / 180,
    p = a.lat * r,
    q = b.lat * r,
    d = wrapLon(b.lon - a.lon) * r;
  const angle = Math.atan2(
    Math.sin(d) * Math.cos(q),
    Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(d),
  );
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(((angle * 180) / Math.PI + 360) / 45) % 8
  ];
}
export function interpolate(
  a: Coordinate,
  b: Coordinate,
  t: number,
): Coordinate {
  return {
    lon: wrapLon(a.lon + wrapLon(b.lon - a.lon) * t),
    lat: a.lat + (b.lat - a.lat) * t,
  };
}
const points = new Map<string, Coordinate>();
export function cellPoint(id: string): Coordinate {
  let p = points.get(id);
  if (!p) {
    const [lat, lon] = cellToLatLng(id);
    p = { lon, lat };
    points.set(id, p);
  }
  return p;
}
export const cellAt = (p: Coordinate) =>
  latLngToCell(p.lat, p.lon, TRAVEL_RESOLUTION);
export const neighborsOf = (id: string) =>
  gridDisk(id, 1)
    .filter((x) => x !== id)
    .sort();
export function snapCell(p: Coordinate, mode: TravelMode) {
  const id = cellAt(p);
  if (mode === "mixed") return id;
  const candidates = gridDisk(id, 3).filter(
    (c) => isWater(cellPoint(c)) === (mode === "sea"),
  );
  candidates.sort(
    (a, b) =>
      kilometers(p, cellPoint(a)) - kilometers(p, cellPoint(b)) ||
      a.localeCompare(b),
  );
  if (!candidates.length)
    throw Error(
      `No ${mode === "land" ? "land" : "water"} access near ${p.lat.toFixed(2)}, ${p.lon.toFixed(2)} at this routing resolution.`,
    );
  return candidates[0];
}
export function passable(a: Coordinate, b: Coordinate, mode: TravelMode) {
  const steps = Math.max(2, Math.ceil(kilometers(a, b) / 8));
  let previous = isWater(a),
    changes = 0;
  for (let i = 0; i <= steps; i++) {
    const water = isWater(interpolate(a, b, i / steps));
    if (mode !== "mixed" && water !== (mode === "sea")) return false;
    if (water !== previous) changes++;
    previous = water;
  }
  // Keep each edge on one surface, or crossing one coast with explicit embarkation.
  if (mode === "mixed" && changes > 1) return false;
  return true;
}
export function describeCell(id: string, year: number): TravelCell {
  const p = cellPoint(id),
    water = isWater(p),
    e = broadEnvironment(p.lon, p.lat),
    a = Math.abs(p.lat);
  const climate = water
    ? "Ocean"
    : a > 68
      ? "Tundra"
      : a > 55
        ? "Boreal"
        : e.moisture < 0.23
          ? "Arid"
          : a < 18
            ? "Tropical"
            : e.moisture < 0.45
              ? "Mediterranean"
              : "Temperate";
  let culture = "Unresearched";
  for (const profile of regionalProfiles
    .filter((r) => containsDate(r.dates, { year }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))) {
    const [w, s, e, n] = profile.bounds;
    if (
      p.lon >= w &&
      p.lon <= e &&
      p.lat >= s &&
      p.lat <= n &&
      profile.defaults.culture
    )
      culture = profile.defaults.culture;
  }
  const naming = resolveGeographicName(p, water);
  return {
    ...p,
    naming,
    regionId: water ? waterRegion(p).id : northAmericanLandscape(p)?.id,
    id,
    water,
    climate,
    relief: e.relief,
    culture: water ? "No resident default" : culture,
    name: naming.name,
  };
}
