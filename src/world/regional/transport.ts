import type {
  GeographicArea,
  GeographicConnection,
} from "../../core/geography";
import type { Point } from "../../core/types";
import type { RegionalContext } from "./context";
import { REGION_CELL } from "./context";
import { toAtlas } from "../geography/coordinates";
import { containsDate } from "../../content/history/dates";
import type { Road, Site } from "../v3/types";
import { siteGate } from "../v3/urban";
import { cellKey } from "../v3/types";
import {
  line,
  directLine,
  crossing,
  planRoad,
  roadCells,
  type Sample,
} from "../v3/roads";

/** Connections own route geometry independently of loaded households. Water links
 * remain proposals until a transport system can actually service them. */
export function regionalTransport(
  context: RegionalContext,
  sitesIn: (x: number, y: number) => Site[],
  sample: Sample,
) {
  const shared = !!context.settingAt(0, 0).roadRevision;
  const cache = new Map<
    string,
    { record: GeographicConnection; roads: Road[] }
  >();
  const authored = context.profiles
    .flatMap((p) => p.connections ?? [])
    .filter((c) =>
      containsDate(c.dates, { year: context.settingAt(0, 0).year }),
    );
  // A playable map is one square of the atlas, and the land past its border
  // is another map's to build. Its roads run to each border's own crossing
  // point, which the map on the far side shares, so a road that leaves one
  // map arrives in the next; they do not run on to settlements this map
  // only imagines beyond its edge.
  const map = context.settingAt(0, 0).playableMap;
  const half = (map?.size ?? 0) / 2;
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
  function build(
    id: string,
    from: string,
    to: string,
    a: Point,
    b: Point,
    existing = new Set<string>(),
    crossingCells = new Set<string>(),
    knownBridges: Road[] = [],
    cardinal = false,
  ) {
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
    const allowed = new Set<string>(crossingCells);
    const level = sample(a.x, a.y).elevation;
    const clear = (points: Point[]) =>
      points.every((p) =>
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
    // A road that ends at a town gate has to arrive square to the built edge: a
    // proportional line would enter as a diagonal stair across the streets
    // waiting for it on the other side. Only tried on open level ground, where
    // it saves the graph search entirely.
    const elbow = (corner: Point) => [
      ...line(a, corner),
      ...line(corner, b).slice(1),
    ];
    const straight =
      existing.size || crossesWater
        ? undefined
        : (cardinal
            ? [elbow({ x: b.x, y: a.y }), elbow({ x: a.x, y: b.y })]
            : [(shared ? directLine : line)(a, b)]
          ).find(clear);
    // The search walks a four-cell grid and would step off a map's last
    // row: an end on the border is searched from four cells inside it, and
    // the road runs straight out from there.
    const inside = (p: Point): Point => {
      if (!map || (Math.abs(p.x) < half - 4 && Math.abs(p.y) < half - 4)) return p;
      const pull = (v: number) => Math.max(-half + 4, Math.min(half - 4, Math.round(v / 4) * 4));
      return { x: pull(p.x), y: pull(p.y) };
    };
    const search = (from: Point, to: Point) => {
      const f = inside(from), t = inside(to);
      const road = planRoad(
        id,
        f,
        t,
        sample,
        existing,
        allowed,
        new Set(),
        bounds([f, t]),
        1,
        4,
      );
      return road && { ...road, points: [...line(from, f).slice(0, -1), ...road.points, ...line(t, to).slice(1)] };
    };
    // A search only reaches a bridge that lies on its line, and otherwise
    // floods the near bank until the budget runs out. So a crossing is routed
    // as two land legs to the bridge's ends: a bridge already built first,
    // then one of this road's own.
    const over = (deck: Road): Road | undefined => {
      const ends = [deck.points[0], deck.points[deck.points.length - 1]];
      const d = (p: Point, q: Point) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
      const [near, far] =
        d(a, ends[0]) + d(ends[1], b) <= d(a, ends[1]) + d(ends[0], b)
          ? ends
          : [ends[1], ends[0]];
      const first = search(a, near),
        second = first && search(far, b);
      if (!first || !second) return;
      const deckPoints =
        near === ends[0] ? deck.points : [...deck.points].reverse();
      return {
        ...first,
        points: [
          ...first.points,
          ...deckPoints.slice(1, -1),
          ...second.points,
        ],
        cost: first.cost + deck.cost + second.cost,
      };
    };
    let bridge: Road | undefined;
    let spans: Road[] = [];
    let road: Road | undefined;
    if (straight)
      road = {
        id,
        points: straight,
        width: 1,
        kind: "street",
        cost: straight.length * 2.2,
      };
    else if (crossesWater) {
      const d = (deck: Road) =>
        Math.hypot(deck.points[0].x - middle.x, deck.points[0].y - middle.y);
      for (const deck of [...knownBridges].sort((p, q) => d(p) - d(q))) {
        if (d(deck) > 160) break;
        if ((road = over(deck))) break;
      }
      if (!road) {
        bridge = crossing(`${id}-bridge`, middle, sample, 72);
        if (bridge) {
          roadCells(bridge, (x, y) => allowed.add(cellKey(x, y)));
          road = over(bridge);
          if (!road) bridge = undefined;
        }
      }
      // No bridge, but the water may be a bay the road can walk round.
      road ??= search(a, b);
      // Two rivers, or a river and a stream: a bridge over each stretch of
      // water on the direct line, and land legs between them.
      if (!road) {
        const waters: Point[] = [];
        let wet: Point[] = [];
        for (const p of [...line(a, b), a]) {
          if (p !== a && sample(p.x, p.y).water < 0) wet.push(p);
          else if (wet.length) { waters.push(wet[wet.length >> 1]); wet = []; }
        }
        const decks = waters.map((w, n) => crossing(`${id}-bridge-${n}`, w, sample, 48));
        if (decks.length > 1 && decks.every(Boolean)) {
          for (const deck of decks) roadCells(deck!, (x, y) => allowed.add(cellKey(x, y)));
          const d = (p: Point, q: Point) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
          const points: Point[] = [];
          let at: Point | undefined = a;
          let cost = 0;
          for (const deck of decks) {
            const ends = [deck!.points[0], deck!.points[deck!.points.length - 1]];
            const from: Point = at!;
            const [near, far]: Point[] = d(from, ends[0]) <= d(from, ends[1]) ? ends : [ends[1], ends[0]];
            const leg = search(from, near);
            if (!leg) { at = undefined; break; }
            points.push(...leg.points, ...(near === ends[0] ? deck!.points : [...deck!.points].reverse()).slice(1, -1));
            cost += leg.cost + deck!.cost;
            at = far;
          }
          const last = at && search(at, b);
          if (last) {
            road = { ...last, points: [...points, ...last.points], cost: cost + last.cost };
            spans = decks as Road[];
          }
        }
      }
    } else road = search(a, b);
    const result = {
      record: {
        id,
        from,
        to,
        mode: "road" as const,
        status: road ? ("routed" as const) : ("blocked" as const),
        points: road?.points ?? [a, b],
      },
      roads: road
        ? [
            ...(spans.length
              ? spans
              : bridge
              ? [bridge]
              : knownBridges.filter((b) => {
                  const cells = new Set<string>();
                  roadCells(b, (x, y) => cells.add(cellKey(x, y)));
                  return road.points.some((p) => cells.has(cellKey(p.x, p.y)));
                })),
            road,
          ]
        : [],
    };
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(id, result);
    return result;
  }
  /** Endpoints on the two settlements' built edges rather than their centres,
   * so a through route stops at a gate instead of crossing the main square. */
  const ends = (a: Site, b: Site) => {
    const from = a.pack && siteGate(a, a.pack, b.center),
      to = b.pack && siteGate(b, b.pack, a.center);
    return {
      from: from?.point ?? a.center,
      to: to?.point ?? b.center,
      cardinal: !!(from || to),
    };
  };
  /** A camp keeps no road to its neighbours: herders cross open grass. */
  const roadless = (s: Site) =>
    s.pack?.setting?.settlement === "camp" ||
    s.profile?.pattern === "encampment" ||
    s.profile?.pattern === "band";
  const within = (s: Site) => !map || (Math.abs(s.center.x) < half && Math.abs(s.center.y) < half);
  const crossings = (cx: number, cy: number): Site[] =>
    (map?.exits ?? []).flatMap((e) => {
      if (!e.seam?.road) return [];
      const t = Math.round(-half + (e.seam.start + (e.seam.end - e.seam.start) * e.seam.roadAt) * (map!.size - 1));
      const side = e.seam.side;
      const center = { x: side === "W" ? -half : side === "E" ? half - 1 : t, y: side === "N" ? -half : side === "S" ? half - 1 : t };
      return [{ id: `border:${e.id}`, cx, cy, center } as Site];
    });
  const neighborCache = new Map<string, Site[]>();
  function neighbors(s: Site) {
    const oldNeighbors = neighborCache.get(s.id);
    if (oldNeighbors) return oldNeighbors;
    if (!within(s)) return [];
    const nearby: Site[] = map ? crossings(s.cx, s.cy) : [];
    for (let y = -1; y <= 1; y++)
      for (let x = -1; x <= 1; x++) nearby.push(...sitesIn(s.cx + x, s.cy + y).filter(within));
    const selected = new Map<number, Site>();
    for (const b of nearby.sort((a, b) => a.id.localeCompare(b.id))) {
      if (s.id === b.id || roadless(b)) continue;
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
    const candidates = shared
      ? nearby.filter(
          (p) => p.id !== s.id && !roadless(p),
        )
      : [...selected.values()];
    const result = shared
      ? candidates.filter((b) => {
          const distance = Math.hypot(
            b.center.x - s.center.x,
            b.center.y - s.center.y,
          );
          const witnesses = new Map(nearby.map((p) => [p.id, p]));
          if (!map)
            for (let y = -1; y <= 1; y++)
              for (let x = -1; x <= 1; x++)
                for (const p of sitesIn(b.cx + x, b.cy + y))
                  witnesses.set(p.id, p);
          return ![...witnesses.values()].some(
            (p) =>
              p.id !== s.id &&
              p.id !== b.id &&
              !roadless(p) &&
              Math.hypot(p.center.x - s.center.x, p.center.y - s.center.y) <
                distance &&
              Math.hypot(p.center.x - b.center.x, p.center.y - b.center.y) <
                distance,
          );
        })
      : candidates;
    if (neighborCache.size >= 256)
      neighborCache.delete(neighborCache.keys().next().value!);
    neighborCache.set(s.id, result);
    return result;
  }
  const batches = new Map<string, Map<string, ReturnType<typeof build>>>();
  function batch(cx: number, cy: number) {
    const key = `${cx},${cy}`,
      old = batches.get(key);
    if (old) return old;
    const edges = new Map<string, [Site, Site]>();
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const a of sitesIn(cx + dx, cy + dy)) {
          if (roadless(a)) continue;
          for (const b of neighbors(a)) {
            const [u, v] = a.id < b.id ? [a, b] : [b, a];
            if (u.cx === cx && u.cy === cy)
              edges.set(`${u.id}:${v.id}`, [u, v]);
          }
        }
    const ordered = [...edges].sort((a, b) => {
      const length = ([u, v]: [Site, Site]) =>
        Math.hypot(u.center.x - v.center.x, u.center.y - v.center.y);
      return length(a[1]) - length(b[1]) || a[0].localeCompare(b[0]);
    });
    const result = new Map<string, ReturnType<typeof build>>(),
      roads = new Set<string>(),
      bridges = new Set<string>(),
      bridgeRoads = new Map<string, Road>();
    for (const [id, [a, b]] of ordered) {
      const e = ends(a, b);
      const route = build(
        id,
        a.id,
        b.id,
        e.from,
        e.to,
        roads,
        bridges,
        [...bridgeRoads.values()],
        e.cardinal,
      );
      result.set(id, route);
      for (const road of route.roads)
        if (road.kind === "bridge") bridgeRoads.set(road.id, road);
      for (const road of route.roads)
        roadCells(road, (x, y) => {
          if (road.kind === "bridge") bridges.add(cellKey(x, y));
        });
      for (const road of route.roads)
        for (const p of road.points) roads.add(cellKey(p.x, p.y));
    }
    if (batches.size >= 64) batches.delete(batches.keys().next().value!);
    batches.set(key, result);
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
            if (roadless(a)) continue;
            for (const b of neighbors(a)) {
              if (!intersects(area, bounds([a.center, b.center]))) continue;
              const [first, second] = a.id < b.id ? [a, b] : [b, a];
              const id = `${first.id}:${second.id}`;
              if (!result.has(id))
                result.set(
                  id,
                  shared
                    ? batch(first.cx, first.cy).get(id)!
                    : (() => {
                        const e = ends(first, second);
                        return build(
                          id,
                          first.id,
                          second.id,
                          e.from,
                          e.to,
                          new Set(),
                          new Set(),
                          [],
                          e.cardinal,
                        );
                      })(),
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
