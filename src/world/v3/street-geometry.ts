import { cellKey, type SettlementPlan, type Rect } from "./types";

export type StreetStroke = { a: [number, number]; b: [number, number]; radius: number };

export type StreetGeometry = { strokes: StreetStroke[]; infill: boolean };

export function streetDistance(s: StreetStroke, x: number, y: number) {
  const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1];
  const t = Math.max(0, Math.min(1, ((x - s.a[0]) * dx + (y - s.a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - s.a[0] - t * dx, y - s.a[1] - t * dy) - s.radius;
}

/** Diagonal corridors and their intersecting streets share one continuous edge. */
export function composeStreetGeometry(plan: SettlementPlan, buildings: Rect[] = []) {
  const strokes = plan.roads.filter((r) => /-(street-\d|avenue-)/.test(r.id) && r.kind !== "bridge")
    .map((r): StreetStroke => {
      const a = r.points[0], b = r.points.at(-1)!, radius = (r.span ?? r.width * 2 + 1) / 2;
      const offset = Number.isInteger(radius) ? 0.5 : 0;
      return { a: [a.x + 0.5 + (a.x === b.x ? offset : 0), a.y + 0.5 + (a.y === b.y ? offset : 0)],
        b: [b.x + 0.5 + (a.x === b.x ? offset : 0), b.y + 0.5 + (a.y === b.y ? offset : 0)], radius };
    });
  if (!strokes.some((s) => s.a[0] !== s.b[0] && s.a[1] !== s.b[1])) return;
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
    if (!list.some((s) => s.a[0] !== s.b[0] && s.a[1] !== s.b[1])) continue;
    if (plan.solid.has(k) || plan.pavement?.get(k) === "square" || plan.pavement?.get(k) === "platform") continue;
    const [x, y] = k.split(",").map(Number);
    const d = Math.min(...list.map((s) => streetDistance(s, x + 0.5, y + 0.5)));
    geometry.set(k, { strokes: list, infill: buildings.some((b) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h) });
    plan.surface.set(k, "paving");
    plan.streetSurfaces!.set(k, d <= 0 ? "asphalt" : "concrete");
    plan.reserved.add(k);
    if (d <= 0) {
      plan.pavement!.delete(k);
      plan.traffic.add(k);
      const lane = plan.lanes?.get(k);
      if (lane) lane.junction = true;
    } else {
      plan.pavement!.set(k, "footway");
      plan.lanes?.delete(k);
    }
  }
  plan.streetGeometry = geometry;
}
