/** Eight-way visual facing, experiment. `direction` (0-3) stays the source of
 * truth for everything the simulation does; this is only what gets drawn.
 * Remove this file and its callers to strip quarter views. */

/** 0 N, 1 NE, 2 E, 3 SE, 4 S, 5 SW, 6 W, 7 NW. */
export type Facing8 = number;

/** Cardinal `direction` widened to the eight-way scale. */
export function facingFromDirection(direction: number): Facing8 {
  return (((direction % 4) + 4) % 4) * 2;
}

export function facingFromStep(
  dx: number,
  dy: number,
  fallback: number,
): Facing8 {
  const x = Math.sign(dx),
    y = Math.sign(dy);
  if (!x && !y) return facingFromDirection(fallback);
  if (y < 0) return x > 0 ? 1 : x < 0 ? 7 : 0;
  if (y > 0) return x > 0 ? 3 : x < 0 ? 5 : 4;
  return x > 0 ? 2 : 6;
}

/** How a facing is drawn: which of the four authored builds to use, and
 * whether the head turns off that build into a three-quarter view. */
export function facingView(facing: Facing8) {
  const f = (((facing % 8) + 8) % 8) as Facing8;
  if (f % 2 === 0) return { direction: f / 2, quarter: false, away: false };
  // A diagonal is the side build with the head turned: towards the camera on
  // the southern pair, away on the northern.
  return {
    direction: f === 1 || f === 3 ? 1 : 3,
    quarter: true,
    away: f === 1 || f === 7,
  };
}

/** One step along the shorter arc from `from` towards `to`. Turning is drawn
 * through the facings in between rather than snapping across them. */
export function turnToward(from: Facing8, to: Facing8): Facing8 {
  const wrap = (n: number) => ((n % 8) + 8) % 8;
  const a = wrap(from),
    b = wrap(to);
  if (a === b) return b;
  // Signed shortest arc, in steps: -4..3. A half turn has no shorter side.
  const delta = ((b - a + 12) % 8) - 4;
  return wrap(a + Math.sign(delta));
}
