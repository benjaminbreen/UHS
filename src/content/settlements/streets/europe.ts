/** Deliberately broad art defaults, not claims that every street was paved. */
export const europeStreets = [
  // Log roadways of Novgorod (from the 950s), Pskov, Moscow, Gdańsk and
  // Bergen: split timbers laid across longitudinal sleepers, relaid as they sank.
  {
    bounds: [4, 54, 60, 66],
    from: 900,
    to: 1750,
    material: "plank",
    status: "inferred",
  },
  {
    bounds: [3, 50, 8, 54],
    from: 1500,
    to: 1950,
    material: "brick",
    status: "inferred",
  },
  {
    bounds: [-12, 35, 40, 65],
    from: 1000,
    to: 1950,
    material: "cobble",
    status: "inferred",
  },
] as const;
