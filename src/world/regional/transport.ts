import type {
  GeographicArea,
  GeographicConnection,
} from "../../core/geography";
import type { Point } from "../../core/types";
import type { RegionalContext } from "./context";
import { REGION_CELL } from "./context";
import { toAtlas } from "../v2/atlas";
import { containsDate } from "../../content/history/dates";
import type { Road, Site } from "../v3/types";
import { cellKey } from "../v3/types";
import { line, crossing, planRoad, roadCells, type Sample } from "../v3/roads";

/** Connections own route geometry independently of loaded households. Water links
 * remain proposals until a transport system can actually service them. */
export function regionalTransport(
  context: RegionalContext,
  sitesIn: (x: number, y: number) => Site[],
  sample: Sample,
) {
  const cache = new Map<
    string,
    { record: GeographicConnection; roads: Road[] }
  >();
  const authored = context.profiles
    .flatMap((p) => p.connections ?? [])
    .filter((c) =>
      containsDate(c.dates, { year: context.settingAt(0, 0).year }),
    );
  const point = (id: string) => {
    const p = context.activePlaces.find((p) => p.id === id);
    return p && context.local(p);
  };
  const bounds = (points: Point[]): GeographicArea => ({
    x: Math.min(...points.map((p) => p.x)) - 40,
    y: Math.min(...points.map((p) => p.y)) - 40,
    w:
      Math.max(...points.map((p) => p.x)) -
      Math.min(...points.map((p) => p.x)) +
      80,
    h:
      Math.max(...points.map((p) => p.y)) -
      Math.min(...points.map((p) => p.y)) +
      80,
  });
  const intersects = (a: GeographicArea, b: GeographicArea) =>
    a.x <= b.x + b.w &&
    a.x + a.w >= b.x &&
    a.y <= b.y + b.h &&
    a.y + a.h >= b.y;
  function build(id: string, from: string, to: string, a: Point, b: Point) {
    const old = cache.get(id);
    if (old) return old;
    const middle = {
      x: Math.round((a.x + b.x) / 2),
      y: Math.round((a.y + b.y) / 2),
    };
    const crossesWater = Array.from({ length: 17 }, (_, i) =>
      sample(
        Math.round(a.x + ((b.x - a.x) * i) / 16),
        Math.round(a.y + ((b.y - a.y) * i) / 16),
      ),
    ).some((f) => f.water < 0);
    const bridge = crossesWater
      ? crossing(`${id}-bridge`, middle, sample, 72)
      : undefined;
    const allowed = new Set<string>();
    if (bridge) roadCells(bridge, (x, y) => allowed.add(cellKey(x, y)));
    const direct = line(a, b),
      level = sample(a.x, a.y).elevation;
    const flat =
      !crossesWater &&
      direct.every((p) =>
        [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].every(([dx, dy]) => {
          const f = sample(p.x + dx, p.y + dy);
          return f.water >= 4 && f.elevation === level;
        }),
      );
    // Open level ground needs no graph search. Relief and crossings use the shared router.
    const road: Road | undefined = flat
      ? {
          id,
          points: direct,
          width: 1,
          kind: "street",
          cost: direct.length * 2.2,
        }
      : planRoad(
          id,
          a,
          b,
          sample,
          new Set(),
          allowed,
          new Set(),
          bounds([a, b]),
          1,
          4,
        );
    const result = {
      record: {
        id,
        from,
        to,
        mode: "road" as const,
        status: road ? ("routed" as const) : ("blocked" as const),
        points: road?.points ?? [a, b],
      },
      roads: road ? [...(bridge ? [bridge] : []), road] : [],
    };
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(id, result);
    return result;
  }
  const neighborCache = new Map<string, Site[]>();
  function neighbors(s: Site) {
    const oldNeighbors = neighborCache.get(s.id);
    if (oldNeighbors) return oldNeighbors;
    const nearby: Site[] = [];
    for (let y = -1; y <= 1; y++)
      for (let x = -1; x <= 1; x++) nearby.push(...sitesIn(s.cx + x, s.cy + y));
    const selected = new Map<number, Site>();
    for (const b of nearby.sort((a, b) => a.id.localeCompare(b.id))) {
      if (s.id === b.id || b.pack?.setting?.settlement === "camp") continue;
      const dx = b.center.x - s.center.x,
        dy = b.center.y - s.center.y;
      const dir =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 1) : dy > 0 ? 2 : 3;
      const old = selected.get(dir);
      if (
        !old ||
        Math.hypot(dx, dy) <
          Math.hypot(old.center.x - s.center.x, old.center.y - s.center.y)
      )
        selected.set(dir, b);
    }
    const result = [...selected.values()];
    if (neighborCache.size >= 256)
      neighborCache.delete(neighborCache.keys().next().value!);
    neighborCache.set(s.id, result);
    return result;
  }
  function inArea(area: GeographicArea) {
    const result = new Map<string, ReturnType<typeof build>>();
    const minX = Math.floor((area.x + context.origin.x) / REGION_CELL) - 1;
    const minY = Math.floor((area.y + context.origin.y) / REGION_CELL) - 1;
    const maxX =
      Math.floor((area.x + area.w + context.origin.x) / REGION_CELL) + 1;
    const maxY =
      Math.floor((area.y + area.h + context.origin.y) / REGION_CELL) + 1;
    if ((maxX - minX + 1) * (maxY - minY + 1) <= 256)
      for (let cy = minY; cy <= maxY; cy++)
        for (let cx = minX; cx <= maxX; cx++)
          for (const a of sitesIn(cx, cy)) {
            if (a.pack?.setting?.settlement === "camp") continue;
            for (const b of neighbors(a)) {
              if (!intersects(area, bounds([a.center, b.center]))) continue;
              const [first, second] = a.id < b.id ? [a, b] : [b, a];
              const id = `${first.id}:${second.id}`;
              if (!result.has(id))
                result.set(
                  id,
                  build(id, first.id, second.id, first.center, second.center),
                );
            }
          }
    for (const c of authored) {
      const a = point(c.from),
        b = point(c.to);
      if (!a || !b) continue;
      const points = [
        a,
        ...(c.via ?? []).map((p) => {
          const q = toAtlas(...p);
          return { x: q.x - context.origin.x, y: q.y - context.origin.y };
        }),
        b,
      ];
      if (!intersects(area, bounds(points))) continue;
      if (c.mode !== "road") {
        result.set(c.id, {
          record: {
            id: c.id,
            from: c.from,
            to: c.to,
            mode: c.mode,
            status: "proposed",
            points,
          },
          roads: [],
        });
        continue;
      }
      // Long authored corridors are resolved in bounded sections with shared endpoints.
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i],
          count = Math.max(
            1,
            Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 256),
          );
        for (let j = 0; j < count; j++) {
          const at = (t: number) => ({
            x: Math.round(a.x + ((b.x - a.x) * t) / count),
            y: Math.round(a.y + ((b.y - a.y) * t) / count),
          });
          const u = at(j),
            v = at(j + 1);
          if (intersects(area, bounds([u, v]))) {
            const id = `${c.id}:${i}:${j}`;
            result.set(id, build(id, c.from, c.to, u, v));
          }
        }
      }
    }
    return [...result.values()];
  }
  return {
    roadsIn: (area: GeographicArea) => inArea(area).flatMap((r) => r.roads),
    connectionsIn: (area: GeographicArea) => inArea(area).map((r) => r.record),
  };
}
