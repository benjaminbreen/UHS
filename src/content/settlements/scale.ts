import type { UrbanForm } from "./urban-form/types";

/** Bounded so one district's plan stays inside its own cell and the planner's
 * per-building routing cost stays predictable. */
export const URBAN_CAPACITY = 150;

/** Built half-extent, inset from the site radius so parcels keep a margin. */
export const urbanFootprint = (radius: number) => Math.max(12, radius - 6);

/** How many street-facing buildings this extent and this fabric imply. Derived
 * from ground area and block geometry: it is not a population estimate and not
 * a worldwide growth curve. Larger blocks and courtyard plans spend more ground
 * per household, so the same extent holds fewer street ranges. */
export function urbanCapacity(radius: number, form: UrbanForm): number {
  const half = urbanFootprint(radius);
  const [bw, bh] = form.block;
  const perBuilding = 90 + (bw + bh) * 2 + form.courts * 90;
  return Math.max(
    4,
    Math.min(
      URBAN_CAPACITY,
      Math.round(((half * 2) ** 2 * 0.72) / perBuilding),
    ),
  );
}
