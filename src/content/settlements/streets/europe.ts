/** Deliberately broad art defaults, not claims that every street was paved. */
export const europeStreets = [
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
