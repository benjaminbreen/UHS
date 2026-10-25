import type { Point } from "../../core/types";
import { buildingModel } from "../../content/graphics/models";
import { crownRadius } from "./vegetation-spacing";
import { cellKey, type Rect, type SettlementPlan } from "./types";

export type PlacementEnvelope = {
  /** Cells that physically stop movement or construction. */
  occupied: Point[];
  /** Cells that must remain usable: roads, thresholds and work approaches. */
  access: Point[];
  /** The visible silhouette: roofs, tree crowns and wide props. */
  clearance: Point[];
};

export type PlacementClaims = {
  occupied: Set<string>;
  access: Set<string>;
  clearance: Set<string>;
};

export function createPlacementClaims(): PlacementClaims {
  return {
    occupied: new Set(),
    access: new Set(),
    clearance: new Set(),
  };
}

export function rectCells(rect: Rect): Point[] {
  const out: Point[] = [];
  for (let y = rect.y; y < rect.y + rect.h; y++)
    for (let x = rect.x; x < rect.x + rect.w; x++) out.push({ x, y });
  return out;
}

export function cultivatedAt(plan: Pick<SettlementPlan, "fields" | "surface">, x: number, y: number) {
  const key = cellKey(x, y), field = plan.fields?.get(key);
  return field ? field.crop !== "pasture" || !!field.garden : plan.surface.get(key) === "field";
}

export function buildingPlacementEnvelope(sprite: string, rect: Rect, access: Point[]): PlacementEnvelope {
  const model = buildingModel(sprite);
  const left = rect.x + rect.w / 2 - model.anchor[0] / 16,
    top = rect.y + rect.h - model.anchor[1] / 16;
  const clearance = rectCells({ x: Math.floor(left), y: Math.floor(top),
    w: Math.ceil(left + model.bounds[2] / 16) - Math.floor(left),
    h: Math.ceil(top + model.bounds[3] / 16) - Math.floor(top) })
    .filter(p => p.x < rect.x || p.x >= rect.x + rect.w || p.y < rect.y || p.y >= rect.y + rect.h);
  return { occupied: rectCells(rect), access, clearance };
}

/** A tree is anchored at its trunk; most of its visible mass is behind it. */
export function treePlacementEnvelope(
  sprite: string,
  at: Point,
): PlacementEnvelope {
  const radius = crownRadius(sprite),
    rx = Math.ceil(radius),
    ry = Math.ceil(radius * 1.25),
    centerY = at.y - Math.round(radius * 0.7),
    clearance: Point[] = [];
  for (let y = centerY - ry; y <= at.y; y++)
    for (let x = at.x - rx; x <= at.x + rx; x++) {
      const dx = (x - at.x) / Math.max(1, radius),
        dy = (y - centerY) / Math.max(1, radius * 1.25);
      if (dx * dx + dy * dy <= 1.15) clearance.push({ x, y });
    }
  return { occupied: [{ ...at }], access: [], clearance };
}

export function claimEnvelope(
  claims: PlacementClaims,
  envelope: PlacementEnvelope,
) {
  for (const p of envelope.occupied) claims.occupied.add(cellKey(p.x, p.y));
  for (const p of envelope.access) claims.access.add(cellKey(p.x, p.y));
  for (const p of envelope.clearance) claims.clearance.add(cellKey(p.x, p.y));
}

/** Visual envelopes may overlap access only when a caller explicitly allows it. */
export function envelopeConflicts(
  claims: PlacementClaims,
  envelope: PlacementEnvelope,
  allowClearanceOverAccess = false,
  allowClearanceOverlap = false,
) {
  return (
    envelope.occupied.some((p) => {
      const k = cellKey(p.x, p.y);
      return claims.occupied.has(k) || claims.access.has(k);
    }) ||
    envelope.access.some((p) => {
      const k = cellKey(p.x, p.y);
      return claims.occupied.has(k) || claims.clearance.has(k);
    }) ||
    envelope.clearance.some((p) => {
      const k = cellKey(p.x, p.y);
      return (
        claims.occupied.has(k) ||
        (!allowClearanceOverAccess && claims.access.has(k)) ||
        (!allowClearanceOverlap && claims.clearance.has(k))
      );
    })
  );
}
