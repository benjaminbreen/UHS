import type { Point } from "../../core/types";
import { routesIn } from "../travel/routes";
import { directLine, type Sample } from "./roads";
import type { Road } from "./types";

/** A river this wide or less is bridged; wider water breaks the route, and
 * its far side is reached some other way. */
const SPAN = 48;
/** Cells from a motorway's median to the middle of each carriageway. */
const CARRIAGEWAY = 3.5;

/** The trunk routes that cross one map, in its own cells: roads and railways
 * on the dry stretches, a deck over each river. `rails` keeps every line
 * whole across its bridges, for drawing the track; `stations` are where a
 * railway passes a town. */
export function trunkRoads(
  origin: Point,
  half: number,
  year: number,
  sample: Sample,
  /** Built-up ground the routes pass round, not through. */
  towns: readonly { x: number; y: number; r: number }[] = [],
) {
  const roads: Road[] = [],
    rails: Point[][] = [],
    stations: { x: number; y: number; toward: [number, number] }[] = [];
  /** Ids of the roads that are motorway carriageways. */
  const motorways = new Set<string>();
  const inside = (p: Point) => p.x >= -half && p.x < half && p.y >= -half && p.y < half;
  const wet = (p: Point) => sample(p.x, p.y).water < 2;
  routesIn(origin.x - half - 64, origin.y - half - 64, origin.x + half + 64, origin.y + half + 64, year).forEach(({ route, run }, n) => {
    let local = run.map((p) => ({ x: p.x - origin.x, y: p.y - origin.y }));
    // Stepped finely enough to bend round a town.
    local = local.flatMap((a, i) => {
      const b = local[i + 1];
      if (!b) return [a];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6);
      return Array.from({ length: steps }, (_, k) => ({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps }));
    });
    for (const town of towns) {
      // Nearest approach, and the heading there.
      let at = 0;
      for (let i = 1; i < local.length; i++)
        if (Math.hypot(local[i].x - town.x, local[i].y - town.y) < Math.hypot(local[at].x - town.x, local[at].y - town.y)) at = i;
      const near = Math.hypot(local[at].x - town.x, local[at].y - town.y);
      // Passing within sight of a town, a railway still stops for it.
      if (near >= town.r) {
        if (route.kind === "rail" && near < town.r + 48)
          stations.push({ x: Math.round(local[at].x), y: Math.round(local[at].y), toward: [(town.x - local[at].x) / near, (town.y - local[at].y) / near] });
        continue;
      }
      const a = local[Math.max(0, at - 8)],
        b = local[Math.min(local.length - 1, at + 8)],
        length = Math.hypot(b.x - a.x, b.y - a.y) || 1,
        hx = (b.x - a.x) / length,
        hy = (b.y - a.y) / length;
      // The line swings wide on the side it already favours, starting three
      // town-widths out, so it rounds the houses on an easy curve.
      const side = (local[at].x - town.x) * -hy + (local[at].y - town.y) * hx < 0 ? -1 : 1,
        reach = town.r * 3;
      // A railway stops where it passes closest: the platform faces the town.
      if (route.kind === "rail")
        stations.push({ x: Math.round(town.x - hy * side * town.r), y: Math.round(town.y + hx * side * town.r), toward: [hy * side, -hx * side] });
      local = local.map((p) => {
        const along = (p.x - town.x) * hx + (p.y - town.y) * hy,
          off = ((p.x - town.x) * -hy + (p.y - town.y) * hx) * side;
        if (Math.abs(along) >= reach) return p;
        const clear = town.r * 0.5 * (1 + Math.cos((Math.PI * along) / reach));
        return off >= clear ? p : { x: p.x + -hy * side * (clear - off), y: p.y + hx * side * (clear - off) };
      });
    }
    const beside = (by: number) =>
      local.map((p, i) => {
        const a = local[Math.max(0, i - 1)],
          b = local[Math.min(local.length - 1, i + 1)],
          length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        return { x: Math.round(p.x - ((b.y - a.y) / length) * by), y: Math.round(p.y + ((b.x - a.x) / length) * by) };
      });
    const kind = route.kind === "rail" ? ("rail" as const) : ("street" as const);
    let part = 0;
    const emit = (points: Point[], as: Road["kind"]) => {
      if (points.length < 3) return;
      const id = `trunk-${route.id}-${n}-${part++}`;
      roads.push({ id, points, width: 1, kind: as, cost: points.length });
      if (route.kind === "motorway") motorways.add(id);
    };
    // A motorway is two carriageways either side of a grass median.
    for (const line of route.kind === "motorway" ? [beside(-CARRIAGEWAY), beside(CARRIAGEWAY)] : [beside(0)]) {
      const cells: Point[] = [];
      for (let i = 1; i < line.length; i++) cells.push(...directLine(line[i - 1], line[i]).slice(i > 1 ? 1 : 0));
      let track: Point[] = [];
      const flush = () => {
        if (kind === "rail" && track.length > 2) rails.push(track);
        track = [];
      };
      for (let from = 0; from < cells.length; ) {
        if (!inside(cells[from])) {
          flush();
          from++;
          continue;
        }
        let to = from;
        const water = wet(cells[from]);
        while (to < cells.length && inside(cells[to]) && wet(cells[to]) === water) to++;
        const stretch = cells.slice(from, to);
        if (!water) {
          emit(stretch, kind);
          track.push(...stretch);
        } else if (stretch.length <= SPAN && sample(stretch[0].x, stretch[0].y).kind === "river" && from > 0 && to < cells.length) {
          emit([cells[from - 1], ...stretch, cells[to]], "bridge");
          track.push(...stretch);
        } else flush();
        from = to;
      }
      flush();
    }
  });
  return { roads, rails, stations, motorways };
}
