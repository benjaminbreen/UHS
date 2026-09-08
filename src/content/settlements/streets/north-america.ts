import type { StreetPalette } from "./palettes";
/** NYC's nineteenth-century granite blocks are documented by the Street Design
 * Manual: https://www.nycstreetdesign.info/material/granite-block-0
 * Brick footways and earth service lanes are an artistic inference; weights and
 * placement are not a reconstructed survey. Keep this scope local and dated.
 */
export const newYorkStreets = {
  bounds: [-74.3, 40.45, -73.65, 41.05],
  from: 1800,
  to: 1900,
  palette: {
    main: ["sett", "sett", "cobble"],
    local: ["sett", "cobble", "cobble"],
    lane: ["earth", "earth", "cobble"],
    square: ["sett", "slab"],
    footway: ["slab", "brick", "brick"],
  } satisfies StreetPalette,
} as const;
