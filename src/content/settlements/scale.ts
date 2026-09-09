import type { UrbanForm } from "./urban-form/types";

/** Bounded so one district's plan stays inside its own cell and the planner's
 * per-building routing cost stays predictable. Each building costs two short
 * path searches, so this is the main dial on how long a settlement takes to
 * build. */
export const URBAN_CAPACITY = 80;
/** Only the largest modern cities go past the ordinary cap. */
export const METROPOLIS_CAPACITY = 120;
/** Modern city centres need more parcels than the historical frontage cap. */
export const MODERN_CITY_CAPACITY = 240;

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
export function urbanCapacity(
  radius: number,
  form: UrbanForm,
  requested = URBAN_CAPACITY,
): number {
  const half = urbanFootprint(radius, form);
  const [bw, bh] = form.block;
  const blocks = ((half * 2) ** 2 * BLOCK_FILL) / (bw * bh);
  // Nine tenths, because a corner parcel and a court passage always cost some.
  return Math.max(
    4,
    Math.min(
      Math.max(URBAN_CAPACITY, requested),
      Math.round(blocks * perBlock(form) * 0.9),
    ),
  );
}

/** Safety cap on a composed settlement. Blocks are filled to their coverage
 * and the count falls out of that; this only bounds how long a plan may spend
 * routing doors, spent from the centre outward. */
export const URBAN_HARD_CAP = 720;
export function urbanBuildingLimit(
  radius: number,
  form: UrbanForm,
  requested: number,
  year: number,
): number {
  const base = Math.min(urbanCapacity(radius, form, requested), requested);
  if (year < 1900 && radius < 45) return base;
  return Math.max(base, URBAN_HARD_CAP);
}

/** Built half-extent for a population. Log scale from 3,000 to 3,000,000;
 * before 1800 the same population packed into less ground. */
export function urbanRadius(population = 20000, year = 2000): number {
  const t = Math.max(0, Math.min(1, Math.log10(population / 3000) / 3));
  const r = 30 + t * 110;
  return Math.round(year < 1800 ? Math.max(30, r * 0.8) : r);
}

/** Street-facing buildings a place of this population and date should get.
 * Not a population model: a town is drawn at a scale the player can walk,
 * and this only decides how much of it is built. */
export function urbanTarget(
  s: { settlement?: string; year: number },
  population?: number,
): number {
  if (population !== undefined) {
    // Log scale between 3k and 1M; a metropolis past that gets the top band.
    const t = Math.max(0, Math.min(1, Math.log10(population / 3000) / 2.5));
    const target = Math.round(20 + t * (URBAN_CAPACITY - 20));
    return population >= 800000 && s.year >= 1800
      ? Math.min(METROPOLIS_CAPACITY, Math.round(population / 15000) + 40)
      : target;
  }
  const port = s.settlement === "port";
  return s.year >= 1800
    ? port
      ? 45
      : 55
    : s.year >= 500
      ? port
        ? 38
        : 45
      : 40;
}
