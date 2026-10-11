import { cellKey, type SettlementPlan, type Rect } from "./types";
import type { StreetMaterial } from "../../content/settlements/streets";
import type { StreetSurface } from "../../content/settlements/streets/palettes";

export type StreetStroke = { a: [number, number]; b: [number, number]; radius: number; material?: StreetMaterial; footway?: StreetMaterial };

export type StreetGeometry = { strokes: StreetStroke[]; infill: boolean };

export function streetDistance(s: StreetStroke, x: number, y: number) {
  const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1];
  const t = Math.max(0, Math.min(1, ((x - s.a[0]) * dx + (y - s.a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - s.a[0] - t * dx, y - s.a[1] - t * dy) - s.radius;
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

/** Made streets share continuous edges and rounded junctions, in their own stone. */
export function composeStreetGeometry(plan: SettlementPlan, buildings: Rect[] = []) {
  const footway = [...plan.pavement ?? []].find(([k, role]) => role === "footway" && plan.streetSurfaces?.get(k));
  const walk = footway && plan.streetSurfaces?.get(footway[0]);
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
      return [{ a: [a.x + 0.5 + (a.x === b.x ? offset : 0), a.y + 0.5 + (a.y === b.y ? offset : 0)],
        b: [b.x + 0.5 + (a.x === b.x ? offset : 0), b.y + 0.5 + (a.y === b.y ? offset : 0)], radius,
        material, footway: walk && walk !== "earth" ? walk : material }];
    });
  if (!strokes.length) return;
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
    const closest = list.reduce((a, b) => streetDistance(a, x + 0.5, y + 0.5) <= streetDistance(b, x + 0.5, y + 0.5) ? a : b);
    const d = streetUnionDistance(list, x + 0.5, y + 0.5);
    if (d > 2) continue;
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
