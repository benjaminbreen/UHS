import ecoregions from "./travel/generated/ecoregions.json";

/** RESOLVE 2017 ecoregions on a quarter-degree grid: biome number 1–14 as in
 * Dinerstein et al., realm name, and a display name for travel labels. */
export type Ecoregion = {
  id: number;
  name: string | null;
  sourceName: string;
  realm: string;
  biome: number;
};
const grid = new Uint16Array(ecoregions.width * ecoregions.height);
for (const [start, end, id] of ecoregions.runs) grid.fill(id, start, end);
const byId = new Map(ecoregions.regions.map((r) => [r.id, r as Ecoregion]));
const cellOf = (lon: number, lat: number) => [
  Math.max(0, Math.min(ecoregions.width - 1, Math.floor((lon + 180) * 4))),
  Math.max(0, Math.min(ecoregions.height - 1, Math.floor((90 - lat) * 4))),
];
export function ecoregionAt(lon: number, lat: number): Ecoregion | undefined {
  const [x, y] = cellOf(lon, lat);
  return byId.get(grid[y * ecoregions.width + x]);
}
/** Id 0 is both "no region" and the sea, so a coastal cell can miss its
 * land. Widen to the nearest filled cell within half a degree. */
export function ecoregionNear(lon: number, lat: number): Ecoregion | undefined {
  const [x, y] = cellOf(lon, lat);
  for (let r = 0; r <= 2; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const xx = x + dx,
          yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= ecoregions.width || yy >= ecoregions.height)
          continue;
        const id = grid[yy * ecoregions.width + xx];
        if (id) return byId.get(id);
      }
  return undefined;
}
export const biomeNames: Record<number, string> = {
  1: "tropical moist broadleaf forest",
  2: "tropical dry broadleaf forest",
  3: "tropical conifer forest",
  4: "temperate broadleaf and mixed forest",
  5: "temperate conifer forest",
  6: "boreal forest and taiga",
  7: "tropical grassland and savanna",
  8: "temperate grassland and steppe",
  9: "flooded grassland and savanna",
  10: "montane grassland and shrubland",
  11: "tundra",
  12: "mediterranean forest and scrub",
  13: "desert and xeric shrubland",
  14: "mangrove",
};
