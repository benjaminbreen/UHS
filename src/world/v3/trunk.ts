import type { Point } from "../../core/types";
import { routesIn } from "../travel/routes";
import { directLine, type Sample } from "./roads";
import type { Rail } from "./blocks";
import type { Road } from "./types";

/** A river this wide or less is bridged; wider water breaks the route, and
 * its far side is reached some other way. */
const SPAN = 48;
/** Cells from a motorway's median to the middle of each carriageway. */
const CARRIAGEWAY = 3.5;
/** A railway within this many cells of a town's edge stops for it. */
const STATION_REACH = 150;

/** The trunk routes that cross one map, in its own cells: roads and railways
 * on the dry stretches, a deck over each river. `rails` is each line as
 * drawn, `stations` the halts where one passes a town it does not enter. */
export function trunkRoads(
  origin: Point,
  half: number,
  year: number,
  sample: Sample,
  /** Built-up ground. A road passes round it; a railway runs through a
   * `urban` town on a straight strip the town builds its station beside,
   * and round any other. */
  towns: readonly { id: string; x: number; y: number; r: number; urban: boolean }[] = [],
) {
  const roads: Road[] = [],
    rails: Point[][] = [],
    stations: { x: number; y: number; toward: [number, number] }[] = [];
  /** The strip each town's own railway takes, by site id. */
  const through = new Map<string, Rail>();
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
    const rail = route.kind === "rail";
    for (const town of towns) {
      // Nearest approach, and the heading there.
      let at = 0;
      for (let i = 1; i < local.length; i++)
        if (Math.hypot(local[i].x - town.x, local[i].y - town.y) < Math.hypot(local[at].x - town.x, local[at].y - town.y)) at = i;
      const near = Math.hypot(local[at].x - town.x, local[at].y - town.y);
      // A railway is drawn to a town from further off than a road is.
      if (near >= town.r + (rail ? STATION_REACH : 0)) continue;
      const a = local[Math.max(0, at - 8)],
        b = local[Math.min(local.length - 1, at + 8)],
        length = Math.hypot(b.x - a.x, b.y - a.y) || 1,
        hx = (b.x - a.x) / length,
        hy = (b.y - a.y) / length;
      const alongX = Math.abs(hx) >= Math.abs(hy);
      let strip = through.get(town.id);
      if (rail && town.urban && (!strip || (strip.axis === "x") === alongX)) {
        // Straight through the town's edge, on the side the line came by.
        const mid = alongX ? town.x : town.y,
          across = (p: Point) => (alongX ? p.y : p.x),
          reach = town.r + 40;
        if (!strip) {
          const side = across(local[at]) < across(town) ? -1 : 1;
          strip = { axis: alongX ? "x" : "y", level: Math.round(across(town) + side * town.r * 0.8) - 2, lo: Math.round(mid - reach), hi: Math.round(mid + reach), span: 4 };
          through.set(town.id, strip);
        }
        const centre = strip.level + 2,
          ease = Math.max(town.r * 2, Math.abs(across(local[at]) - centre) * 2.5);
        local = local.map((p) => {
          const past = Math.abs((alongX ? p.x : p.y) - mid) - reach;
          if (past >= ease) return p;
          const pull = past <= 0 ? 1 : 0.5 * (1 + Math.cos((Math.PI * past) / ease)),
            to = across(p) + (centre - across(p)) * pull;
          return alongX ? { x: p.x, y: to } : { x: to, y: p.y };
        });
        continue;
      }
      // A railway rounds the houses wider than the road does, so the two
      // never share a curve.
      const clearance = town.r + (rail ? 18 : 0);
      if (near >= clearance) {
        if (rail) stations.push({ x: Math.round(local[at].x), y: Math.round(local[at].y), toward: [(town.x - local[at].x) / near, (town.y - local[at].y) / near] });
        continue;
      }
      const side = (local[at].x - town.x) * -hy + (local[at].y - town.y) * hx < 0 ? -1 : 1,
        reach = clearance * 3;
      if (rail)
        stations.push({ x: Math.round(town.x - hy * side * clearance), y: Math.round(town.y + hx * side * clearance), toward: [hy * side, -hx * side] });
      local = local.map((p) => {
        const along = (p.x - town.x) * hx + (p.y - town.y) * hy,
          off = ((p.x - town.x) * -hy + (p.y - town.y) * hx) * side;
        if (Math.abs(along) >= reach) return p;
        const clear = clearance * 0.5 * (1 + Math.cos((Math.PI * along) / reach));
        return off >= clear ? p : { x: p.x + -hy * side * (clear - off), y: p.y + hx * side * (clear - off) };
      });
    }
    // The track as drawn keeps the line's own curve, not its cells.
    if (rail) {
      let piece: Point[] = [];
      for (const p of [...local, undefined]) {
        const cell = p && { x: Math.round(p.x), y: Math.round(p.y) };
        if (p && cell && inside(cell) && !(wet(cell) && sample(cell.x, cell.y).kind !== "river")) piece.push(p);
        else {
          if (piece.length > 2) rails.push(piece);
          piece = [];
        }
      }
    }
    const beside = (by: number) =>
      local.map((p, i) => {
        const a = local[Math.max(0, i - 1)],
          b = local[Math.min(local.length - 1, i + 1)],
          length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        return { x: Math.round(p.x - ((b.y - a.y) / length) * by), y: Math.round(p.y + ((b.x - a.x) / length) * by) };
      });
    const kind = rail ? ("rail" as const) : ("street" as const);
    let part = 0;
    const emit = (points: Point[], as: Road["kind"]) => {
      if (points.length < 3) return;
      const id = `trunk-${route.id}-${n}-${part++}`;
      // A double-track formation is four cells across.
      roads.push({ id, points, width: rail && as !== "bridge" ? 2 : 1, kind: as, cost: points.length });
      if (route.kind === "motorway") motorways.add(id);
    };
    // A motorway is two carriageways either side of a grass median.
    for (const line of route.kind === "motorway" ? [beside(-CARRIAGEWAY), beside(CARRIAGEWAY)] : [beside(0)]) {
      const cells: Point[] = [];
      for (let i = 1; i < line.length; i++) cells.push(...directLine(line[i - 1], line[i]).slice(i > 1 ? 1 : 0));
      for (let from = 0; from < cells.length; ) {
        if (!inside(cells[from])) {
          from++;
          continue;
        }
        let to = from;
        const water = wet(cells[from]);
        while (to < cells.length && inside(cells[to]) && wet(cells[to]) === water) to++;
        const stretch = cells.slice(from, to);
        if (!water) emit(stretch, kind);
        // A railway's own trestle is drawn with its track; a road gets a deck.
        else if (!rail && stretch.length <= SPAN && sample(stretch[0].x, stretch[0].y).kind === "river" && from > 0 && to < cells.length)
          emit([cells[from - 1], ...stretch, cells[to]], "bridge");
        from = to;
      }
    }
  });
  return { roads, rails, stations, motorways, through };
}
