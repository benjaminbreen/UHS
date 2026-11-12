import { cellKey, type SettlementPlan, type Rect } from "./types";
import type { StreetMaterial } from "../../content/settlements/streets";
import type { StreetSurface } from "../../content/settlements/streets/palettes";

export type StreetStroke = {
  a: [number, number]; b: [number, number]; radius: number; material?: StreetMaterial; footway?: StreetMaterial; tier?: string;
  /** Cells of footway beyond each kerb. */
  walk?: number;
  /** How the carriageway is painted, where the town marks its roads. */
  marks?: import("../../content/settlements/streets/markings").RoadMarkings;
};

/** Where a point sits in a street's own frame, in cells: `along` from the
 * end nearer the origin, `across` from the centreline, positive to the south
 * of a street that runs mostly east-west and to the east of any other. */
export function strokeFrame(s: StreetStroke, x: number, y: number) {
  let dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], ox = s.a[0], oy = s.a[1];
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const xlike = Math.abs(dx) >= Math.abs(dy);
  if (xlike ? dx < 0 : dy < 0) { dx = -dx; dy = -dy; ox = s.b[0]; oy = s.b[1]; }
  return {
    xlike,
    along: (x - ox) * dx + (y - oy) * dy + (xlike ? ox : oy),
    across: xlike ? (y - oy) * dx - (x - ox) * dy : (x - ox) * dy - (y - oy) * dx,
  };
}

export type StreetGeometry = { strokes: StreetStroke[]; infill: boolean };

/** Square-ended: a made street stops at a straight edge, half a cell past
 * its last centre, rather than in a round blob. */
export function streetDistance(s: StreetStroke, x: number, y: number) {
  const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], len = Math.hypot(dx, dy) || 1;
  const along = ((x - s.a[0]) * dx + (y - s.a[1]) * dy) / len,
    across = Math.abs((x - s.a[0]) * dy - (y - s.a[1]) * dx) / len;
  return Math.max(across - s.radius, -along - 0.5, along - len - 0.5);
}

export function streetUnionDistance(strokes: StreetStroke[], x: number, y: number) {
  let distance = Infinity, nearest: StreetStroke | undefined;
  for (const stroke of strokes) {
    const d = streetDistance(stroke, x, y);
    if (d < distance) { distance = d; nearest = stroke; }
  }
  let rounded = distance;
  for (const stroke of strokes) {
    if (stroke === nearest || !nearest) continue;
    const ax = nearest.b[0] - nearest.a[0], ay = nearest.b[1] - nearest.a[1];
    const bx = stroke.b[0] - stroke.a[0], by = stroke.b[1] - stroke.a[1];
    if (Math.abs(ax * by - ay * bx) < 0.01) continue;
    const h = Math.max(0, 1 - Math.abs(distance - streetDistance(stroke, x, y)));
    rounded = Math.min(rounded, distance - h * h * 0.25);
  }
  return rounded;
}

/** Whose surface a point takes: where carriageways cross, the wider street
 * runs through and the narrower butts into it; elsewhere the nearest. */
export function throughStroke(strokes: StreetStroke[], x: number, y: number) {
  let best = strokes[0], bestD = streetDistance(best, x, y);
  for (const s of strokes.slice(1)) {
    const d = streetDistance(s, x, y);
    const on = d <= 0, bestOn = bestD <= 0;
    if (on && bestOn ? s.radius > best.radius || (s.radius === best.radius && d < bestD) : d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

/** Made streets share continuous edges and rounded junctions, in their own stone. */
export function composeStreetGeometry(
  plan: SettlementPlan,
  buildings: Rect[] = [],
  /** Keep each street's own footway width instead of two cells everywhere. */
  sectioned = false,
) {
  const footway = [...plan.pavement ?? []].find(([k, role]) => role === "footway" && plan.streetSurfaces?.get(k));
  const paved = footway && plan.streetSurfaces?.get(footway[0]);
  const marks = plan.lanes?.values().next().value?.marks;
  const strokes = plan.roads.filter((r) => /-(street-\d|avenue-)/.test(r.id) && r.kind !== "bridge")
    .flatMap((r): StreetStroke[] => {
      const made = r.points.filter((p) => {
        const k = cellKey(p.x, p.y), role = plan.pavement?.get(k);
        return plan.surface.get(k) === "paving" && (!role || role === "lane");
      });
      if (made.length < r.points.length / 2) return [];
      const a = r.points[0], b = r.points.at(-1)!, radius = (r.span ?? r.width * 2 + 1) / 2;
      const offset = Number.isInteger(radius) ? 0.5 : 0;
      const materials = new Map<StreetSurface, number>();
      for (const p of made) {
        const material = plan.streetSurfaces?.get(cellKey(p.x, p.y));
        if (material) materials.set(material, (materials.get(material) ?? 0) + 1);
      }
      const material = [...materials].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "slab";
      if (material === "earth") return [];
      // A stub shorter than the street is wide is a junction's leftover, and
      // drew as a bar of the wrong stone across it.
      if (Math.hypot(b.x - a.x, b.y - a.y) < radius) return [];
      // The footway a street already has, counted out from its kerb at the
      // middle of its run; a street laid without one gets two cells.
      const mid = r.points[r.points.length >> 1], sx = a.x === b.x ? 1 : 0, sy = sx ? 0 : 1;
      let walk = 0;
      for (const side of [-1, 1]) {
        let n = 0;
        for (let d = Math.ceil(radius); d < Math.ceil(radius) + 5; d++) {
          const role = plan.pavement?.get(cellKey(mid.x + sx * side * d, mid.y + sy * side * d));
          if (role === "footway" || role === "verge") n++;
          else if (n) break;
        }
        walk = Math.max(walk, n);
      }
      // Run on to the far side of the cells the road was stamped over, so no
      // island of carriageway is left past the stroke's end.
      const out = Math.max(0, radius - 0.5), length = Math.hypot(b.x - a.x, b.y - a.y),
        ex = ((b.x - a.x) / length) * out, ey = ((b.y - a.y) / length) * out;
      return [{ a: [a.x + 0.5 + (a.x === b.x ? offset : 0) - ex, a.y + 0.5 + (a.y === b.y ? offset : 0) - ey],
        b: [b.x + 0.5 + (a.x === b.x ? offset : 0) + ex, b.y + 0.5 + (a.y === b.y ? offset : 0) + ey], radius,
        material, footway: paved && paved !== "earth" ? paved : material, tier: /-(street-\d|avenue)-/.exec(r.id)?.[1],
        walk: sectioned && walk ? walk : 2, ...(marks && { marks }) }];
    });
  if (!strokes.length) return;
  // A street is surfaced as its kind, not segment by segment: a main road
  // that votes for the square's stone where it passes one would change
  // surface half way along.
  for (const tier of new Set(strokes.map((s) => s.tier))) {
    const same = strokes.filter((s) => s.tier === tier), tally = new Map<StreetMaterial, number>();
    for (const s of same) if (s.material) tally.set(s.material, (tally.get(s.material) ?? 0) + Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]));
    const most = [...tally].sort((a, b) => b[1] - a[1])[0]?.[0];
    for (const s of same) {
      if (s.footway === s.material) s.footway = most;
      s.material = most;
    }
  }
  const index = new Map<string, StreetStroke[]>();
  for (const s of strokes) {
    const pad = s.radius + 3;
    for (let y = Math.floor(Math.min(s.a[1], s.b[1]) - pad); y <= Math.ceil(Math.max(s.a[1], s.b[1]) + pad); y++)
      for (let x = Math.floor(Math.min(s.a[0], s.b[0]) - pad); x <= Math.ceil(Math.max(s.a[0], s.b[0]) + pad); x++) {
        if (streetDistance(s, x + 0.5, y + 0.5) > 3) continue;
        const k = cellKey(x, y), list = index.get(k) ?? [];
        list.push(s); index.set(k, list);
      }
  }
  const geometry = new Map<string, StreetGeometry>();
  for (const [k, list] of index) {
    const role = plan.pavement?.get(k);
    if (plan.solid.has(k) || (role && !["lane", "footway", "vacant"].includes(role))) continue;
    const [x, y] = k.split(",").map(Number);
    if (buildings.some((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) continue;
    const closest = throughStroke(list, x + 0.5, y + 0.5);
    const d = streetUnionDistance(list, x + 0.5, y + 0.5);
    if (d > (closest.walk ?? 2)) continue;
    geometry.set(k, { strokes: list, infill: false });
    plan.surface.set(k, "paving");
    plan.streetSurfaces!.set(k, (d <= 0 ? closest.material : closest.footway) ?? "slab");
    plan.reserved.add(k);
    if (d <= 0) {
      plan.pavement!.delete(k);
      plan.traffic.add(k);
    } else {
      plan.pavement!.set(k, "footway");
      plan.lanes?.delete(k);
    }
  }
  plan.streetGeometry = geometry;
}
