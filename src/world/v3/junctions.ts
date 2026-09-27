import { cellKey, type Junction, type SettlementPlan } from "./types";

/** Resolve whole approaches before paint, medians, parking or signals. */
export function resolveJunctions(plan: SettlementPlan, occupied = plan.solid): Junction[] {
  const lanes = plan.lanes ?? new Map();
  for (const [k, lane] of lanes) {
    if (plan.pavement?.has(k) || plan.surface.get(k) !== "paving") {
      lanes.delete(k);
      continue;
    }
    delete lane.toJunction;
    lane.crossing = false;
    lane.stopLine = false;
  }
  const pending = new Set([...lanes].filter(([, l]) => l.junction).map(([k]) => k));
  const result: Junction[] = [];
  const walk = (x: number, y: number) => {
    const k = cellKey(x, y), p = plan.pavement?.get(k);
    return (p === "footway" || p === "square") && !occupied.has(k);
  };
  for (const first of pending) {
    const queue = [first];
    pending.delete(first);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i].split(",").map(Number);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      const lane = lanes.get(queue[i])!;
      if (lane.axis === "x") {
        y0 = Math.min(y0, y - lane.at);
        y1 = Math.max(y1, y - lane.at + lane.span - 1);
      } else {
        x0 = Math.min(x0, x - lane.at);
        x1 = Math.max(x1, x - lane.at + lane.span - 1);
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = cellKey(x + dx, y + dy);
        if (pending.delete(k)) queue.push(k);
      }
    }
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const lane = lanes.get(cellKey(x, y));
        if (lane) lane.junction = true;
      }
    const junction: Junction = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, approaches: [] };
    for (const [axis, edge, toward, from, to] of [
      ["x", x0 - 1, 1, y0, y1], ["x", x1 + 1, -1, y0, y1],
      ["y", y0 - 1, 1, x0, x1], ["y", y1 + 1, -1, x0, x1],
    ] as const) {
      const at = (u: number, d: number) => axis === "x"
        ? { x: edge - toward * d, y: u } : { x: u, y: edge - toward * d };
      for (let u = from; u <= to; u++) {
        const q = at(u, 0), lane = lanes.get(cellKey(q.x, q.y));
        if (!lane || lane.junction || lane.axis !== axis || lane.at !== 0) continue;
        const span = lane.span;
        const rows = [];
        for (let d = 0; d < 4; d++) {
          const row = Array.from({ length: span }, (_, i) => {
            const p = at(u + i, d);
            return lanes.get(cellKey(p.x, p.y));
          });
          if (!row.every((l, i) => l && !l.junction && l.axis === axis && l.at === i && l.span === span)) break;
          rows.push(row);
        }
        if (rows.length < 3) continue;
        const landings = [at(u - 1, 1), at(u + span, 1)];
        const paths = [-1, 1].flatMap((side) => [0, 1].map((d) => {
          const path = [];
          for (let offset = 0; offset < 5; offset++) {
            const p = at(side < 0 ? u - 1 - offset : u + span + offset, d);
            const k = cellKey(p.x, p.y);
            if (occupied.has(k)) return undefined;
            path.push(p);
            if (walk(p.x, p.y)) return path;
            if (plan.pavement?.get(k) !== "verge") return undefined;
          }
          return undefined;
        }));
        const crossing = span >= 4 && lane.marks.crossing !== "none" && paths.every(Boolean);
        if (crossing)
          for (const path of paths)
            for (const p of path!) {
              const k = cellKey(p.x, p.y);
              const end = path!.at(-1)!;
              plan.surface.set(k, "paving");
              plan.pavement!.set(k, "footway");
              plan.streetSurfaces!.set(k, plan.streetSurfaces?.get(cellKey(end.x, end.y)) ?? "concrete");
              plan.reserved.add(k);
              plan.traffic.add(k);
            }
        junction.approaches.push({ axis, start: u, edge, span, toward, crossing, landings });
        for (const [d, row] of rows.entries())
          for (const l of row) {
            if (l!.toJunction !== undefined && Math.abs(l!.toJunction) <= d + 1) continue;
            l!.toJunction = toward * (d + 1);
            l!.crossing = crossing;
          }
        u += span - 1;
      }
    }
    result.push(junction);
  }
  return result;
}
