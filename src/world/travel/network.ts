import { sampleSeam, type BoundarySeam } from "./seams";
import {
  travelLocations,
  settlementAt,
  locationName,
} from "../../content/geography/travel";
import { atlasSample, broadEnvironment, toAtlas, fromAtlas, nearestRiver } from "../geography/atlas";
import { REGION_CELL } from "../regional/context";
import { waterRegion } from "../../content/geography/travel/oceans";
import { northAmericanLandscape } from "../../content/geography/travel/north-american-landscapes";
import { kilometers, bearingTo, wrapLon } from "./geography";
import { resolveMapEnvironment, mapClimateLabel } from "./environment";
import { resolveGeographicName } from "./naming";
import { trimCache } from "../../core/cache";
import { random } from "../../core/random";
import type { Coordinate, TravelLocation, TravelStop } from "./types";
export type PermanentMap = TravelStop & { networkId: string };
export type MapExit = {
  seam?: BoundarySeam;
  id: string;
  from: string;
  to: string;
  name: string;
  bearing: string;
  mode: "land" | "sea" | "mixed";
  km: number;
};

/** Every map is one square of the atlas at its native scale, and its
 * neighbours are the squares beside it: a border is the same line of Earth
 * seen from both sides. The regional generator's cell is the same size. */
export const TILE = REGION_CELL;
const COLUMNS = (360 * 2048) / TILE;
const LAST_ROW = Math.floor((84 * 2048) / TILE);
type Tile = { i: number; j: number };
const wrapColumn = (i: number) =>
  ((((i + COLUMNS / 2) % COLUMNS) + COLUMNS) % COLUMNS) - COLUMNS / 2;
export const tileId = ({ i, j }: Tile) => `tile:${wrapColumn(i)},${j}`;
export function parseTile(id: string): Tile {
  const m = /^tile:(-?\d+),(-?\d+)$/.exec(id);
  if (!m) throw Error(`Unknown permanent map: ${id}`);
  return { i: Number(m[1]), j: Number(m[2]) };
}
const tileOf = (p: Coordinate): Tile => {
  const a = toAtlas(wrapLon(p.lon), p.lat);
  return { i: Math.floor(a.x / TILE), j: Math.floor(a.y / TILE) };
};
const centreOf = ({ i, j }: Tile) =>
  fromAtlas(i * TILE + TILE / 2, j * TILE + TILE / 2);

// Catalog places by tile, built once: a map is named for the town in it.
let byTile: Map<string, TravelLocation[]> | undefined;
function placesIn(tile: Tile) {
  if (!byTile) {
    byTile = new Map();
    for (const p of travelLocations) {
      const key = tileId(tileOf(p));
      if (!byTile.has(key)) byTile.set(key, []);
      byTile.get(key)!.push(p);
    }
  }
  return byTile.get(tileId(tile)) ?? [];
}
/** A town standing in that year, or a named landscape: never a city
 * before its founding. */
function landmark(p: TravelLocation, year: number) {
  const status = settlementAt(p, year);
  return status === "city" || status === "town" || status === "village" || p.kind === "landscape";
}
function nearestPlace(tile: Tile, year: number, reach: number) {
  const centre = centreOf(tile);
  let best: { p: TravelLocation; score: number } | undefined;
  for (let dj = -reach; dj <= reach; dj++)
    for (let di = -reach; di <= reach; di++)
      for (const p of placesIn({ i: tile.i + di, j: tile.j + dj })) {
        if (!landmark(p, year)) continue;
        // A town is the better landmark at the same distance.
        const score = kilometers(centre, p) * (p.kind === "settlement" ? 0.6 : 1);
        if (!best || score < best.score) best = { p, score };
      }
  return best?.p;
}

// Names built by scripts/prepare-tile-names.py from Natural Earth and GeoNames
// physical features: one file per band of 32 rows, loaded near the traveller.
type Band = Record<string, [number, ...string[]][]>;
const bandFiles = import.meta.glob<Band>(
  "../../content/geography/travel/generated/tile-names/*.json",
  { import: "default" },
);
const BAND = 32;
const bands = new Map<number, Band>();
const bandOf = (j: number) => Math.floor(j / BAND);
// Dated settlements built by scripts/prepare-settlements.py, in the same bands.
type Row = [number, number, string, number[], string];
const settlementFiles = import.meta.glob<Row[]>(
  "../../content/geography/travel/generated/settlements/*.json",
  { import: "default" },
);
const sourceNote: Record<string, string> = {
  a: "Authored regional gazetteer; ranks and dates are partly inferred.",
  c: "Chandler and Modelski city populations, geocoded by Reba, Reitsma and Seto (2016).",
  p: "Pleiades gazetteer of the ancient world; dates follow its attested periods.",
  t: "Al-Muqaddasi's hierarchy of places, c. 985, via al-Thurayya; earlier dates inferred.",
  w: "Wikidata inception date; rank from modern population, inferred before 1850.",
  g: "GeoNames modern town, assumed standing from 1900; earlier history unresearched.",
};
const trust = (p: TravelLocation) => "acptwg".indexOf(p.settlement?.source ?? "a");
function addSettlements(rows: Row[]) {
  placesIn({ i: 0, j: 0 });
  for (const [lon, lat, name, phases, src] of rows) {
    const p: TravelLocation = {
      id: `settlement:${lon},${lat}`,
      name,
      landscape: name,
      lon,
      lat,
      kind: "settlement",
      importance: 1 + Math.max(...phases.filter((_, k) => k % 2)),
      settlement: { from: phases[0], rank: "village", source: src, phases },
      note: sourceNote[src],
    };
    const key = tileId(tileOf(p));
    if (!byTile!.has(key)) byTile!.set(key, []);
    const here = byTile!.get(key)!;
    // An authored entry of the same name speaks for it; an undated catalog
    // anchor gives way to the dated record.
    const same = here.findIndex((q) => q.name.toLowerCase() === name.toLowerCase());
    if (same < 0) here.push(p);
    else if (!here[same].settlement) here[same] = p;
  }
}
/** Loads the names around these maps; call before preparing or listing them. */
export async function loadTileNames(ids: string[]) {
  const wanted = new Set<number>();
  for (const id of ids) {
    const { j } = parseTile(id);
    for (const dj of [-1, 0, 1]) wanted.add(bandOf(j + dj));
  }
  await Promise.all(
    [...wanted]
      .filter((b) => !bands.has(b))
      .map(async (b) => {
        const load = bandFiles[`../../content/geography/travel/generated/tile-names/${b}.json`];
        bands.set(b, load ? await load() : {});
        const rows = settlementFiles[`../../content/geography/travel/generated/settlements/${b}.json`];
        if (rows) addSettlements(await rows());
      }),
  );
}
function tableName({ i, j }: Tile) {
  const band = bands.get(bandOf(j));
  if (!band) return undefined;
  const column = wrapColumn(i);
  for (const [start, ...names] of band[j] ?? [])
    if (column >= start && column < start + names.length) return names[column - start];
  return null;
}

function nearTowns(tile: Tile, year: number, centre: Coordinate) {
  if (placesIn(tile).some((p) => p.kind === "settlement" && landmark(p, year))) return [];
  const found: TravelLocation[] = [];
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++)
      for (const p of placesIn({ i: tile.i + di, j: tile.j + dj }))
        if (
          (di || dj) &&
          p.kind === "settlement" &&
          landmark(p, year) &&
          kilometers(p, centre) < 10
        )
          found.push(p);
  return found;
}

/** Sea covers the whole square: open water, boarded rather than walked. */
function allSea(tile: Tile) {
  for (let v = 0; v <= 4; v++)
    for (let u = 0; u <= 4; u++)
      if (
        atlasSample(tile.i * TILE + (u * TILE) / 4, tile.j * TILE + (v * TILE) / 4)
          .coast >= 0
      )
        return false;
  return true;
}

// Ecoregion labels describe vegetation; trim the vocabulary that no one
// would use for a place.
const JARGON =
  / (?:mixed |montane |lowland |moist |dry |rain |deciduous |broadleaf |conifer |coniferous |tropical |subtropical |temperate )*(?:forests?|woodlands?|forest-savanna|savanna|shrublands?|xeric shrublands?)$/i;
const plain = (name: string) => name.replace(JARGON, "").trim() || name;
const compass: Record<string, string> = {
  N: "north", NE: "northeast", E: "east", SE: "southeast",
  S: "south", SW: "southwest", W: "west", NW: "northwest",
};

/** "Southeastern" and the like: where in a named region a square lies. */
function within(bounds: number[] | undefined, p: Coordinate, name: string) {
  if (!bounds) return "";
  const [w, south, e, n] = bounds;
  // A region a few squares across needs no qualifier.
  if (e - w < 0.6 && n - south < 0.6) return "";
  if (/^(north|south|east|west|central|upper|lower)/i.test(name)) return "";
  const x = (p.lon - w) / (e - w),
    y = (p.lat - south) / (n - south);
  const ns = y > 0.66 ? "north" : y < 0.33 ? "south" : "",
    ew = x > 0.66 ? "east" : x < 0.33 ? "west" : "";
  const word = ns || ew ? `${ns}${ew}ern` : "central";
  return word[0].toUpperCase() + word.slice(1) + " ";
}
function nameOf(tile: Tile, year: number, water: boolean) {
  const centre = centreOf(tile);
  // A standing town just over the edge still claims a square with none of
  // its own, so choosing Istanbul does not open on its offshore islands.
  // Only a town claims a square: a catalog landscape such as the Atlas
  // Mountains spans hundreds of them.
  const own = [...placesIn(tile), ...nearTowns(tile, year, centre)]
    .filter((p) => p.kind === "settlement" && landmark(p, year))
    .sort(
      (a, b) =>
        b.importance - a.importance ||
        trust(a) - trust(b) ||
        a.id.localeCompare(b.id),
    )[0];
  if (own) return { name: locationName(own, year), location: own };
  const a = toAtlas(centre.lon, centre.lat);
  const table = tableName(tile);
  if (table && !table.startsWith("~")) return { name: table };
  if (table) {
    // A feature beside the square: "Hills south of Lake Taal".
    const [bearing, feature] = table.slice(1).split("|");
    const word = water
      ? "Waters"
      : atlasSample(a.x, a.y).coast < TILE
        ? "Coast"
        : broadEnvironment(centre.lon, centre.lat).relief > 0.5
          ? "Hills"
          : "Country";
    return { name: `${word} ${compass[bearing]} of ${feature}` };
  }
  const river = water ? undefined : nearestRiver(a.x, a.y);
  // A strait or a small coast can fall between the source regions; the
  // nearest named ground a quarter-degree away stands in for it.
  const region = [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25]]
    .map(([dx, dy]) => resolveGeographicName({ lon: centre.lon + dx, lat: centre.lat + dy }, water))
    .find((r) => r.coverage !== "missing") ?? resolveGeographicName(centre, water);
  let base: string | undefined;
  if (river?.name && river.distance < TILE * 0.7)
    base = `${river.name.replace(/\s+/g, " ")} valley`;
  else if (region.coverage !== "missing") base = plain(region.name);
  const near = water ? undefined : nearestPlace(tile, year, 8);
  if (!near)
    return {
      name: base
        ? base.endsWith(" valley") ? base : within(region.bounds, centre, base) + base
        : water ? waterRegion(centre).name : region.name,
    };
  // Five-kilometre steps keep neighbouring squares apart.
  const km = Math.max(5, Math.round(kilometers(near, centre) / 5) * 5);
  const where = `${km} km ${compass[bearingTo(near, centre)]} of ${locationName(near, year)}`;
  return {
    name: base
      ? `${base}, ${where}`
      : `${atlasSample(a.x, a.y).coast < TILE ? "Coast" : "Country"} ${where}`,
  };
}

// Gameplay odds, not demography: most land has someone on it, less so in
// deserts, mountains and tundra, more within a day's walk of a town.
function countryside(tile: Tile, year: number, climate: string) {
  const c = centreOf(tile), b = broadEnvironment(c.lon, c.lat);
  let odds = year < -9000 ? 0.35 : year < 1500 ? 0.55 : year < 1850 ? 0.65 : 0.8;
  odds *= Math.min(1, b.moisture / 0.35) ** 2 * (b.relief > 0.6 ? 0.5 : 1);
  if (climate === "tundra") odds *= 0.2;
  const town = nearestPlace(tile, year, 2);
  if (town?.kind === "settlement" && kilometers(town, c) < 30) odds += 0.25;
  // Keyed by square alone, so a hamlet stands at every date it is rolled for.
  const roll = random("countryside", tileId(tile));
  return roll < odds * 0.35 ? "settled" : roll < odds ? "sparse" : undefined;
}

const mapCache = new Map<string, PermanentMap>();
export function permanentMap(id: string, year: number): PermanentMap {
  const key = `${id}@${year}`;
  const cached = mapCache.get(key);
  if (cached) return cached;
  const tile = parseTile(id);
  const centre = centreOf(tile);
  const water = allSea(tile);
  const environment = resolveMapEnvironment(centre, year),
    naming = resolveGeographicName(centre, water);
  const { name, location } = nameOf(tile, year, water);
  const named = tableName(tile) !== undefined;
  const status = location ? settlementAt(location, year) : "none";
  const settlement =
    status === "city" || status === "town" || status === "village" ? status : "none";
  const map: PermanentMap = {
    ...centre,
    id: tileId(tile),
    networkId: tileId(tile),
    environment,
    naming,
    regionId: water ? waterRegion(centre).id : northAmericanLandscape(centre)?.id,
    name,
    climate: mapClimateLabel(environment),
    relief: environment.relief,
    water,
    culture: water ? "No resident default" : environment.culture,
    locationId: settlement !== "none" ? location!.id : undefined,
    settlement,
    countryside:
      settlement === "none" && !water
        ? countryside(tile, year, environment.climate)
        : undefined,
    size: TILE,
    reason: "Permanent playable map",
    km: 0,
    pathIndex: 0,
    note:
      location?.note ??
      "Permanent geographic landscape; habitation is resolved separately.",
  };
  // A name made before its band arrived is a stand-in, not worth keeping.
  if (named) {
    trimCache(mapCache, 512);
    mapCache.set(key, map);
  }
  return map;
}

const sides = [
  ["N", 0, -1],
  ["E", 1, 0],
  ["S", 0, 1],
  ["W", -1, 0],
] as const;
const seamCache = new Map<string, ReturnType<typeof sampleSeam>>();
// The exits of a map cannot change while the date holds, but the UI asks for
// them every frame to label the border it is standing near.
const exitCache = new Map<string, MapExit[]>();
export function permanentExits(id: string, year: number): MapExit[] {
  const key = `${id}@${year}`;
  const cached = exitCache.get(key);
  if (cached) return cached;
  const tile = parseTile(id),
    here = permanentMap(id, year);
  const exits: MapExit[] = [];
  for (const [side, di, dj] of sides) {
    const next = { i: tile.i + di, j: tile.j + dj };
    if (Math.abs(next.j) > LAST_ROW) continue;
    const to = tileId(next);
    const exitId = [id, to].sort().join("~");
    // Sampled once from the northern or western tile, so both sides share it.
    let seam = seamCache.get(exitId);
    if (!seam) {
      const first = side === "N" || side === "W" ? next : tile;
      const along = side === "N" || side === "S" ? "S" : "E";
      const c = centreOf(first);
      const a = toAtlas(c.lon, c.lat);
      seam = sampleSeam(
        fromAtlas(a.x + (along === "E" ? TILE / 2 : 0), a.y + (along === "S" ? TILE / 2 : 0)),
        along,
      );
      trimCache(seamCache, 256);
      seamCache.set(exitId, seam);
    }
    const there = permanentMap(to, year);
    exits.push({
      id: exitId,
      from: id,
      to,
      name: there.name,
      bearing: side,
      km: kilometers(here, there),
      mode:
        seam.walkable > 0
          ? "land"
          : here.water && there.water
            ? "sea"
            : "mixed",
      seam: {
        ...seam,
        side,
        start: 0,
        end: 1,
        road: seam.walkable > 0,
      },
    });
  }
  if (exits.every((e) => tableName(parseTile(e.to)) !== undefined)) {
    trimCache(exitCache, 64);
    exitCache.set(key, exits);
  }
  return exits;
}

/** Neighbouring squares meet along their shared border. */
export function connectionPath(exit: MapExit) {
  const a = centreOf(parseTile(exit.from)),
    b = centreOf(parseTile(exit.to));
  return [a, b];
}
export function mapForCoordinate(p: Coordinate) {
  return tileId(tileOf(p));
}
/** Where a tile's map is centred: the origin its world is generated from. */
export function tileCentre(id: string) {
  return centreOf(parseTile(id));
}
