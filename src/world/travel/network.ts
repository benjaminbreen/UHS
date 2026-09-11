import { sampleSeam, seamSide, oppositeSide, type BoundarySeam } from "./seams";
import {
  cellToChildren,
  cellToParent,
  getRes0Cells,
  gridDisk,
  latLngToCell,
} from "h3-js";
import {
  travelById,
  travelLocations,
  settlementAt,
  locationName,
} from "../../content/geography/travel";
import { atlasSample, toAtlas } from "../geography/atlas";
import { waterRegion } from "../../content/geography/travel/oceans";
import {
  cellAt,
  cellPoint,
  describeCell,
  isWater,
  kilometers,
  bearingTo,
  interpolate,
  passable,
  snapCell,
} from "./geography";
import { resolveMapEnvironment, mapClimateLabel } from "./environment";
import { resolveGeographicName } from "./naming";
import backboneNames from "../../content/geography/travel/generated/backbone-names.json";
import { findTravelPath } from "./routing";
import type { Coordinate, TravelStop } from "./types";
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
type Node = {
  id: string;
  anchor: Coordinate;
  locationId?: string;
  water: boolean;
};
const nodes = new Map<string, Node>(),
  links = new Map<string, Set<string>>();
let initialized = false;
const landOwners = new Map<string, string>();
function connect(a: string, b: string) {
  if (a === b) return;
  for (const [x, y] of [
    [a, b],
    [b, a],
  ]) {
    if (!links.has(x)) links.set(x, new Set());
    links.get(x)!.add(y);
  }
}
function owner(cell: string) {
  const p = cellPoint(cell);
  if (!isWater(p)) return "land:" + (landOwners.get(cell) ?? cell);
  const resolution = waterRegion(p).spacing >= 1500 ? 0 : 1;
  return `sea:${cellToParent(cell, resolution)}`;
}
function initialize() {
  if (initialized) return;
  const cells = getRes0Cells()
    .flatMap((id) => cellToChildren(id, 2))
    .sort();
  const priority = (id: string) => {
    let n = 2166136261;
    for (const c of id) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  };
  const land = cells.filter((c) => !isWater(cellPoint(c)));
  const centers = new Set<string>();
  for (const c of [...land].sort(
    (a, b) => priority(a) - priority(b) || a.localeCompare(b),
  ))
    if (
      !gridDisk(c, 1).some(
        (n) => centers.has(n) && passable(cellPoint(c), cellPoint(n), "land"),
      )
    )
      centers.add(c);
  for (const c of land) {
    const near = gridDisk(c, 1)
      .filter(
        (n) => centers.has(n) && passable(cellPoint(c), cellPoint(n), "land"),
      )
      .sort(
        (a, b) =>
          kilometers(cellPoint(c), cellPoint(a)) -
            kilometers(cellPoint(c), cellPoint(b)) || a.localeCompare(b),
      );
    landOwners.set(c, near[0]);
  }
  const groups = new Map<string, string[]>();
  for (const c of cells) {
    const id = owner(c);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(c);
  }
  for (const [id, members] of groups) {
    const center = cellPoint(id.split(":")[1]);
    members.sort(
      (a, b) =>
        kilometers(center, cellPoint(a)) - kilometers(center, cellPoint(b)) ||
        a.localeCompare(b),
    );
    const water = id.startsWith("sea:");
    const candidates = cellToChildren(members[0], 4)
      .map(cellPoint)
      .sort((a, b) => kilometers(a, center) - kilometers(b, center));
    const anchor =
      candidates.find((p) => {
        const atlas = toAtlas(p.lon, p.lat);
        return (
          isWater(p) === water &&
          atlasSample(atlas.x, atlas.y).coast < 0 === water
        );
      }) ?? cellPoint(members[0]);
    const atlas = toAtlas(anchor.lon, anchor.lat);
    nodes.set(id, {
      id,
      anchor,
      water: atlasSample(atlas.x, atlas.y).coast < 0,
    });
  }
  for (const c of cells)
    for (const neighbor of gridDisk(c, 1)) connect(owner(c), owner(neighbor));
  // Catalog records attach locally; adding a record never changes a backbone ID.
  const local = new Map<string, string[]>();
  for (const p of travelLocations) {
    const id = "place:" + p.id;
    let parent = owner(latLngToCell(p.lat, p.lon, 2));
    const atlas = toAtlas(p.lon, p.lat);
    nodes.set(id, {
      id,
      anchor: p,
      locationId: p.id,
      water: atlasSample(atlas.x, atlas.y).coast < 0,
    });
    if (!nodes.get(id)!.water) {
      const nearby = [...nodes.values()]
        .filter(
          (n) => !n.locationId && !n.water && kilometers(p, n.anchor) < 650,
        )
        .sort(
          (a, b) =>
            kilometers(p, a.anchor) - kilometers(p, b.anchor) ||
            a.id.localeCompare(b.id),
        );
      for (const direction of ["N", "E", "S", "W"]) {
        const next = nearby.find((n) =>
          bearingTo(p, n.anchor).includes(direction),
        );
        if (next) connect(id, next.id);
      }
      try {
        const access = cellPoint(snapCell(p, "land"));
        const inland = nearby.find((n) => passable(access, n.anchor, "land"));
        if (inland) parent = inland.id;
      } catch {
        /* Small islands retain their sea parent. */
      }
    }
    connect(id, parent);
    if (!local.has(parent)) local.set(parent, []);
    local.get(parent)!.push(id);
  }
  for (const members of local.values())
    for (const id of members) {
      const nearest = members
        .filter((x) => x !== id)
        .sort(
          (a, b) =>
            kilometers(nodes.get(id)!.anchor, nodes.get(a)!.anchor) -
              kilometers(nodes.get(id)!.anchor, nodes.get(b)!.anchor) ||
            a.localeCompare(b),
        )
        .slice(0, 2);
      for (const other of nearest) connect(id, other);
    }
  initialized = true;
}
export function permanentMap(id: string, year: number): PermanentMap {
  initialize();
  const n = nodes.get(id);
  if (!n) throw Error(`Unknown permanent map: ${id}`);
  const p = n.locationId ? travelById.get(n.locationId)! : undefined;
  const environment = resolveMapEnvironment(n.anchor, year),
    naming = resolveGeographicName(n.anchor, environment.surface === "sea");
  const settlement = p ? settlementAt(p, year) : "none";
  return {
    ...describeCell(cellAt(n.anchor), year),
    ...n.anchor,
    id: cellAt(n.anchor),
    networkId: id,
    environment,
    naming,
    // A backbone map otherwise inherits whatever broad polygon contains it, so
    // ten maps read "Arabian Peninsula". The generated table gives each the
    // nearest regional landform instead; a catalog place keeps its own name.
    name:
      p && settlement !== "unresearched"
        ? locationName(p, year)
        : ((backboneNames as Record<string, string>)[id] ?? naming.name),
    climate: mapClimateLabel(environment),
    water: environment.surface === "sea",
    culture: environment.culture,
    locationId: n.locationId,
    settlement,
    size: settlement === "city" ? 384 : 304,
    reason: "Permanent playable map",
    km: 0,
    pathIndex: 0,
    note:
      p?.note ??
      "Permanent geographic landscape; habitation is resolved separately.",
  };
}
const seamCache = new Map<string, ReturnType<typeof sampleSeam>>();
const landConnections = new Map<string, boolean>();
function landConnection(a: Coordinate, b: Coordinate) {
  const key = [a.lon + "," + a.lat, b.lon + "," + b.lat].sort().join("|");
  if (landConnections.has(key)) return landConnections.get(key)!;
  let connected = false;
  try {
    findTravelPath(
      snapCell(a, "land"),
      snapCell(b, "land"),
      "land",
      Math.max(250, kilometers(a, b) * 3),
    );
    connected = true;
  } catch {
    /* Disconnected shores remain sea transfers. */
  }
  landConnections.set(key, connected);
  return connected;
}
export function permanentExits(id: string, year: number): MapExit[] {
  initialize();
  const from = nodes.get(id)!;
  const exits: MapExit[] = [...(links.get(id) ?? [])].sort().map((to) => {
    const other = nodes.get(to)!;
    return {
      id: [id, to].sort().join("~"),
      from: id,
      to,
      km: kilometers(from.anchor, other.anchor),
      name: permanentMap(to, year).name,
      bearing: bearingTo(from.anchor, other.anchor),
      mode:
        from.water && other.water
          ? "sea"
          : from.water || other.water
            ? "mixed"
            : landConnection(from.anchor, other.anchor)
              ? "land"
              : "mixed",
    };
  });
  for (const exit of exits) {
    const ids = [exit.from, exit.to].sort(),
      a = nodes.get(ids[0])!,
      b = nodes.get(ids[1])!;
    const side = seamSide(bearingTo(a.anchor, b.anchor));
    // A crossing that needs a boat ends the map in open water rather than at a
    // bare edge, so every border reads as geography.
    const shore = exit.mode !== "land";
    let shared = seamCache.get(exit.id);
    if (!shared) {
      let anchor = interpolate(a.anchor, b.anchor, 0.5);
      const atlas = toAtlas(anchor.lon, anchor.lat);
      if (!shore && atlasSample(atlas.x, atlas.y).coast < 0) {
        const route = findTravelPath(
          snapCell(a.anchor, "land"),
          snapCell(b.anchor, "land"),
          "land",
        ).path;
        anchor = cellPoint(route[Math.floor(route.length / 2)]);
      }
      shared = sampleSeam(anchor, side, shore);
      seamCache.set(exit.id, shared);
    }
    exit.seam = {
      ...shared,
      side: exit.from === ids[0] ? side : oppositeSide(side),
      start: 0,
      end: 1,
      road: !shore,
    };
  }
  for (const side of ["N", "E", "S", "W"]) {
    const group = exits.filter((e) => e.seam?.side === side);
    group.forEach((e, i) => {
      e.seam!.start = i / group.length;
      e.seam!.end = (i + 1) / group.length;
    });
  }
  return exits;
}

export function connectionPath(exit: MapExit) {
  initialize();
  const a = nodes.get(exit.from)!,
    b = nodes.get(exit.to)!;
  return findTravelPath(
    snapCell(a.anchor, exit.mode === "land" ? "land" : "mixed"),
    snapCell(b.anchor, exit.mode === "land" ? "land" : "mixed"),
    exit.mode,
  ).path.map(cellPoint);
}
export function mapForCoordinate(p: Coordinate) {
  initialize();
  const id = owner(latLngToCell(p.lat, p.lon, 2));
  const atlas = toAtlas(p.lon, p.lat);
  // A routing cell's centre can sit offshore while the point itself is inland.
  // Without this an inland start resolves to an ocean map with no land exits.
  if (!id.startsWith("sea:") || atlasSample(atlas.x, atlas.y).coast < 0)
    return id;
  const nearest = [...nodes.values()]
    .filter((n) => !n.water && !n.locationId)
    .sort(
      (a, b) =>
        kilometers(p, a.anchor) - kilometers(p, b.anchor) ||
        a.id.localeCompare(b.id),
    )[0];
  return nearest?.id ?? id;
}
