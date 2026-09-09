import type { UrbanForm } from "./urban-form/types";

/** Bounded so one district's plan stays inside its own cell and the planner's
 * per-building routing cost stays predictable. Each building costs two short
 * path searches, so this is the main dial on how long a settlement takes to
 * build. */
export const URBAN_CAPACITY = 110;

/** Cells of block edge one street-facing building occupies, averaged over the
 * kit's frontages. */
const FRONTAGE = 8;

/** Share of the built extent that ends up as block rather than street, square
 * or refused ground. */
const BLOCK_FILL = 0.62;

/** Buildings a block of this size holds along its four street edges. */
const perBlock = (form: UrbanForm) =>
  (2 * (form.block[0] + form.block[1])) / FRONTAGE;

/** Built half-extent, inset from the site radius so parcels keep a margin.
 *
 * This deliberately does not shrink to the building budget. Wide arterials, the
 * public square and the inset around every quarter cost the same whatever the
 * extent, so a footprint sized down to the budget loses its blocks to those
 * fixed costs entirely rather than filling them: measured at a medina's block
 * size, the shrink took a forty-block town to none. The budget is spent instead
 * by filling blocks from the square outward, which leaves open ground at the
 * edge of the extent rather than a thin scatter across all of it. */
export function urbanFootprint(radius: number, _form?: UrbanForm) {
  return Math.max(12, radius - 6);
}

/** How many street-facing buildings this extent and this fabric imply. Derived
 * from ground area and block geometry: it is not a population estimate and not
 * a worldwide growth curve. Larger blocks hold more frontage each but fewer fit,
 * so the count follows the extent far more than the fabric. */
export function urbanCapacity(radius: number, form: UrbanForm): number {
  const half = urbanFootprint(radius, form);
  const [bw, bh] = form.block;
  const blocks = ((half * 2) ** 2 * BLOCK_FILL) / (bw * bh);
  // Nine tenths, because a corner parcel and a court passage always cost some.
  return Math.max(
    4,
    Math.min(URBAN_CAPACITY, Math.round(blocks * perBlock(form) * 0.9)),
  );
}
