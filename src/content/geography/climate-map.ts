import grid from "./climate.generated.json" with { type: "json" };
import type { WorldSetting } from "./types";

const climates: (WorldSetting["climate"] | undefined)[] = [
  undefined,
  "temperate",
  "mediterranean",
  "tropical",
  "monsoon",
  "arid",
  "boreal",
  "tundra",
];
const moisture = [0, 0.16, 0.32, 0.38, 0.55, 0.6, 0.72, 0.85];
// Looked up in the run-length form: expanding it would hold 9 MB of cells
// for the life of the page.
const count = grid.runs.length / 2;
const starts = new Int32Array(count);
const values = new Uint8Array(count);
for (let i = 0, at = 0; i < count; i++) {
  starts[i] = at;
  values[i] = grid.runs[i * 2 + 1];
  at += grid.runs[i * 2];
}

function climateCell(lon: number, lat: number) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return 0;
  const x = Math.max(0, Math.min(grid.width - 1, Math.floor((lon + 180) * grid.cellsPerDegree)));
  const y = Math.max(0, Math.min(grid.height - 1, Math.floor((90 - lat) * grid.cellsPerDegree)));
  const cell = y * grid.width + x;
  let lo = 0,
    hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= cell) lo = mid;
    else hi = mid - 1;
  }
  return values[lo];
}

export function climateAt(lon: number, lat: number) {
  return climates[climateCell(lon, lat) >> 3];
}

export function climateMoistureAt(lon: number, lat: number) {
  const code = climateCell(lon, lat);
  return code ? moisture[code & 7] : undefined;
}
