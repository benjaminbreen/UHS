import { resolveMapEnvironment, mapClimateLabel } from "./environment";
import { resolveGeographicName } from "./naming";
import { waterRegion } from "../../content/geography/travel/oceans";
import {
  authoredTravel,
  locationName,
  settlementAt,
  travelById,
} from "../../content/geography/travel";
import { broadEnvironment } from "../geography/atlas";
import {
  cellAt,
  cellPoint,
  describeCell,
  kilometers,
  isWater,
  neighborsOf,
  passable,
  snapCell,
} from "./geography";
import type {
  TravelMode,
  TravelQuery,
  TravelResult,
  TravelStop,
} from "./types";
class Queue {
  items: { id: string; score: number }[] = [];
  push(id: string, score: number) {
    const v = { id, score };
    let i = this.items.length;
    this.items.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p].score <= score) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = v;
  }
  pop() {
    const root = this.items[0],
      last = this.items.pop()!;
    if (this.items.length) {
      let i = 0;
      while (i * 2 + 1 < this.items.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < this.items.length &&
          this.items[child + 1].score < this.items[child].score
        )
          child++;
        if (this.items[child].score >= last.score) break;
        this.items[i] = this.items[child];
        i = child;
      }
      this.items[i] = last;
    }
    return root;
  }
}
const edges = new Map<string, boolean>();
export function edgeOpen(a: string, b: string, mode: TravelMode) {
  const k = [mode, ...[a, b].sort()].join(":");
  let open = edges.get(k);
  if (open === undefined) {
    open = passable(cellPoint(a), cellPoint(b), mode);
    if (edges.size > 250000) edges.clear();
    edges.set(k, open);
  }
  return open;
}
const routeCache = new Map<string, { path: string[]; expanded: number }>();
export function findTravelPath(
  start: string,
  goal: string,
  mode: TravelMode,
  maxKm = Infinity,
) {
  const reverse = start > goal,
    [a, b] = [start, goal].sort(),
    key = `${mode}:${a}:${b}:${maxKm}`;
  const cached = routeCache.get(key);
  if (cached)
    return {
      path: reverse ? [...cached.path].reverse() : [...cached.path],
      expanded: 0,
    };
  const q = new Queue(),
    cost = new Map([[a, 0]]),
    previous = new Map<string, string>(),
    closed = new Set<string>();
  q.push(a, 0);
  while (q.items.length) {
    const current = q.pop().id;
    if (closed.has(current)) continue;
    if (current === b) {
      const path = [b];
      while (path.at(-1) !== a) path.push(previous.get(path.at(-1)!)!);
      path.reverse();
      const result = { path, expanded: closed.size };
      if (routeCache.size > 80) routeCache.clear();
      routeCache.set(key, result);
      return {
        path: reverse ? [...path].reverse() : [...path],
        expanded: closed.size,
      };
    }
    closed.add(current);

    const p = cellPoint(current);
    for (const next of neighborsOf(current)) {
      if (closed.has(next) || !edgeOpen(current, next, mode)) continue;
      const n = cellPoint(next);
      if (kilometers(cellPoint(a), n) + kilometers(n, cellPoint(b)) > maxKm)
        continue;
      const relief =
        !isWater(p) && !isWater(n)
          ? (broadEnvironment(p.lon, p.lat).relief +
              broadEnvironment(n.lon, n.lat).relief) /
            2
          : 0;
      const nextCost =
        cost.get(current)! +
        kilometers(p, n) * (1 + relief * 0.9) +
        (isWater(p) !== isWater(n) ? 75 : 0);
      if (nextCost >= (cost.get(next) ?? Infinity)) continue;
      cost.set(next, nextCost);
      previous.set(next, current);
      q.push(next, nextCost + kilometers(n, cellPoint(b)));
    }
  }
  throw Error(
    `No ${mode} connection at the atlas routing resolution. Islands require a sea journey; narrow crossings may need finer geographic data.`,
  );
}
export function planTravel(query: TravelQuery): TravelResult {
  if (
    !Number.isInteger(query.year) ||
    query.year < -1000000 ||
    query.year > 10000
  )
    throw Error("Enter an astronomical year between −1000000 and 10000.");
  if (
    !Number.isFinite(query.spacing) ||
    query.spacing < 60 ||
    query.spacing > 1200
  )
    throw Error("Landscape spacing must be between 60 and 1200 km.");
  if (!["land", "sea", "mixed"].includes(query.mode))
    throw Error("Unknown travel mode.");
  if (query.via.length > 20) throw Error("Use at most 20 waypoints.");
  const ids = [query.from, ...query.via, query.to];
  const anchors = ids.map((id) => {
    const p = travelById.get(id);
    if (!p) throw Error(`Unknown location: ${id}`);
    return p;
  });
  const path: string[] = [],
    legs: TravelResult["legs"] = [],
    mandatory = new Map<number, string>();
  let expanded = 0;
  for (let i = 1; i < anchors.length; i++) {
    const from = anchors[i - 1],
      to = anchors[i],
      a = snapCell(
        from,
        query.mode === "mixed" && from.kind === "settlement"
          ? "land"
          : query.mode,
      ),
      b = snapCell(
        to,
        query.mode === "mixed" && to.kind === "settlement"
          ? "land"
          : query.mode,
      );
    const result = findTravelPath(a, b, query.mode);
    expanded += result.expanded;
    const start = Math.max(0, path.length - 1);
    mandatory.set(start, from.id);
    path.push(...(path.length ? result.path.slice(1) : result.path));
    mandatory.set(path.length - 1, to.id);
    legs.push({
      from: from.id,
      to: to.id,
      km: result.path
        .slice(1)
        .reduce(
          (sum, c, j) =>
            sum + kilometers(cellPoint(result.path[j]), cellPoint(c)),
          0,
        ),
      snappedKm: Math.max(
        kilometers(from, cellPoint(a)),
        kilometers(to, cellPoint(b)),
      ),
    });
  }
  const cells = path.map((id) => describeCell(id, query.year)),
    distance = [0];
  for (let i = 1; i < cells.length; i++)
    distance.push(distance[i - 1] + kilometers(cells[i - 1], cells[i]));
  const selected = new Map<number, { location?: string; reason: string }>();
  for (const [i, id] of mandatory)
    selected.set(i, { location: id, reason: "Requested destination" });
  const locationsByCell = new Map<string, (typeof authoredTravel)[number]>();
  for (const p of authoredTravel) {
    const cell = cellAt(p),
      old = locationsByCell.get(cell);
    if (!old || p.importance > old.importance) locationsByCell.set(cell, p);
  }
  for (let i = 1; i < path.length - 1; i++) {
    const p = locationsByCell.get(path[i]);
    if (p && !selected.has(i))
      selected.set(i, {
        location: p.id,
        reason:
          p.kind === "settlement"
            ? "Named geographic anchor"
            : "Distinctive landscape",
      });
    if (
      i > 1 &&
      i + 2 < cells.length &&
      cells[i].climate !== cells[i - 1].climate &&
      cells[i].climate === cells[i + 1].climate &&
      cells[i].climate === cells[i + 2].climate &&
      !selected.has(i)
    )
      selected.set(i, { reason: "Climate transition" });
  }
  for (let i = 1; i + 2 < cells.length; i++) {
    const c = cells[i];
    if (
      !c.water &&
      c.regionId &&
      c.regionId !== cells[i - 1].regionId &&
      c.regionId === cells[i + 1].regionId &&
      c.regionId === cells[i + 2].regionId &&
      !selected.has(i)
    )
      selected.set(i, { reason: "Distinctive geographic region" });
  }
  const transitions = new Map<number, "embark" | "disembark">();
  for (let i = 1; i < cells.length; i++) {
    if (cells[i].water === cells[i - 1].water) continue;
    const embark = cells[i].water;
    const coast = embark ? i - 1 : i;
    transitions.set(coast, embark ? "embark" : "disembark");
    for (const j of [i - 1, i])
      selected.set(j, {
        ...selected.get(j),
        reason:
          j === coast
            ? embark
              ? "Coastal departure · boat required"
              : "Landfall · continue on foot"
            : "Sea passage · boat required",
      });
  }
  const pinned = [...selected.keys()].sort((a, b) => a - b);
  for (let j = 1; j < pinned.length; j++) {
    const a = pinned[j - 1],
      b = pinned[j],
      span = distance[b] - distance[a];
    const sea = cells[a].water && cells[b].water;
    const progress = [0];
    for (let i = a + 1; i <= b; i++) {
      const spacing = sea
        ? (waterRegion(cells[i - 1]).spacing + waterRegion(cells[i]).spacing) /
          2
        : query.spacing;
      progress.push(
        progress.at(-1)! + (distance[i] - distance[i - 1]) / spacing,
      );
    }
    const total = progress.at(-1)!;
    const pa = selected.get(a)?.location,
      pb = selected.get(b)?.location;
    const betweenSettlements =
      pa &&
      pb &&
      travelById.get(pa)?.kind === "settlement" &&
      travelById.get(pb)?.kind === "settlement";
    const count = Math.max(
      !sea && betweenSettlements && span > 90 && b - a > 1 ? 1 : 0,
      Math.ceil(total) - 1,
    );
    for (let k = 1; k <= count; k++) {
      const target = (total * k) / (count + 1);
      let best = a + 1;
      for (let i = a + 1; i < b; i++)
        if (
          Math.abs(progress[i - a] - target) <
          Math.abs(progress[best - a] - target)
        )
          best = i;
      if (best < b && !selected.has(best))
        selected.set(best, {
          reason: sea
            ? "Open-ocean passage · boat required"
            : "Representative countryside",
        });
    }
  }
  const stops: TravelStop[] = [...selected]
    .sort(([a], [b]) => a - b)
    .map(([i, selection]) => {
      const p = selection.location
        ? travelById.get(selection.location)
        : undefined;
      const state = p && !cells[i].water ? settlementAt(p, query.year) : "none";
      const naming =
        p && state === "unresearched"
          ? resolveGeographicName(p, false)
          : cells[i].naming;
      const authored = p && authoredTravel.some((a) => a.id === p.id);
      const name =
        p && (state === "city" || state === "town" || authored)
          ? locationName(p, query.year)
          : naming.name;
      const environment = p
        ? resolveMapEnvironment(p, query.year)
        : cells[i].environment;
      return {
        ...cells[i],
        environment,
        climate: mapClimateLabel(environment),
        relief: environment.relief,
        culture: environment.culture,
        name,
        naming,
        transition: transitions.get(i),
        locationId: p?.id,
        settlement: state,
        reason: selection.reason,
        km: distance[i],
        pathIndex: i,
        size: state === "city" ? 384 : 304,
        note:
          p?.note ??
          "Representative geographic landscape. “No named settlement” does not establish historical absence of people.",
      };
    });
  const warnings = [
    "Routing uses the current atlas land mask and broad relief; it does not reconstruct historical roads, climate, or coastlines.",
    "Compression selects review stops on the shared geographic graph. These are not yet live-game exits or a finalized global stop network.",
  ];
  if (legs.some((l) => l.snappedKm > 35))
    warnings.push(
      "Some anchors are over 35 km from the nearest accessible routing-cell center. Inspect the dashed endpoint offsets.",
    );
  if (stops.some((s) => s.settlement === "unresearched"))
    warnings.push(
      "Some dates lack settlement coverage. Geographic locations remain; named towns are not assumed to exist.",
    );
  if (cells.some((c) => c.water))
    warnings.push(
      "Blue route segments require a boat. Coastal transfers are approximate, not surveyed launch sites or harbours. Sea routing is a geographic proposal. Embarkation, vessels, and sea travel are not implemented in the game.",
    );
  return {
    query,
    cells,
    stops,
    legs,
    km: distance.at(-1) ?? 0,
    expanded,
    warnings,
  };
}
