/*
 * Coverage and era-plausibility of the naming atlas, over a land grid.
 *
 * Prints the three numbers worth watching: how much of the inhabited world has
 * any naming content, how much of it is era-appropriate, and how many
 * traditions still have no citation. tests/name-coverage.test.ts pins these.
 */
import { nameTraditions } from "../src/content/characters/profiles/traditions.generated";
import { readFileSync } from "node:fs";
import { nameRegions } from "../src/content/characters/profiles/name-regions.generated";

const byId = new Map(nameTraditions.map((t) => [t.id, t]));
const byArea = [...nameRegions].sort(
  (a, b) =>
    (a.bounds[2] - a.bounds[0]) * (a.bounds[3] - a.bounds[1]) -
      (b.bounds[2] - b.bounds[0]) * (b.bounds[3] - b.bounds[1]) ||
    a.id.localeCompare(b.id),
);

/** The runtime rule, minus the WorldSetting: smallest box, era-gated options. */
export function optionsAt(lon: number, lat: number, year: number) {
  for (const region of byArea) {
    const [w, s, e, n] = region.bounds;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    for (const v of region.windows) {
      if (!(year >= v.years[0] && year < v.years[1])) continue;
      const options = v.options.flatMap((o) => {
        const t = byId.get(o.tradition);
        if (!t) return [];
        return year >= t.era[0] && year < t.era[1]
          ? [{ tradition: t, weight: o.weight }]
          : [];
      });
      if (options.length) return { region: region.id, options };
    }
  }
  return undefined;
}

/**
 * Land comes from the atlas, not from the region boxes. Using the boxes as the
 * land mask meant the metric could not see a place that no box covered -- which
 * is exactly a hole -- so Sichuan fell through to invented syllables while
 * coverage read 94%.
 */
const LAND: [number, number][][] = JSON.parse(
  readFileSync(
    new URL("../src/content/geography/atlas.generated.json", import.meta.url),
    "utf8",
  ),
).land;
function onLand(lon: number, lat: number) {
  for (const ring of LAND) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i],
        [xj, yj] = ring[j];
      if (
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
      )
        inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

const YEARS = [-30000, -8000, -3000, -1000, 1, 500, 1000, 1500, 1800, 1950];

export function coverage() {
  let cells = 0,
    covered = 0,
    anachronistic = 0;
  for (let lon = -177.5; lon < 180; lon += 5)
    for (let lat = -57.5; lat < 75; lat += 5) {
      if (!onLand(lon, lat)) continue;
      for (const year of YEARS) {
        cells++;
        const hit = optionsAt(lon, lat, year);
        if (hit) covered++;
        // Would the un-gated table have offered something impossible here?
        const raw = byArea.find(
          (r) =>
            lon >= r.bounds[0] &&
            lon <= r.bounds[2] &&
            lat >= r.bounds[1] &&
            lat <= r.bounds[3] &&
            r.windows.some((v) => year >= v.years[0] && year < v.years[1]),
        );
        const window = raw?.windows.find(
          (v) => year >= v.years[0] && year < v.years[1],
        );
        if (
          window?.options.some((o) => {
            const t = byId.get(o.tradition);
            return t && !(year >= t.era[0] && year < t.era[1]);
          })
        )
          anachronistic++;
      }
    }
  return { cells, covered, anachronistic };
}

if (process.argv[1]?.endsWith("check-name-coverage.ts")) {
  const { cells, covered, anachronistic } = coverage();
  const pc = (n: number) => `${((n / cells) * 100).toFixed(1)}%`;
  console.log(`grid cells (land box x era)   ${cells}`);
  console.log(`  with a naming tradition     ${covered} (${pc(covered)})`);
  console.log(`  falling back to invented    ${cells - covered} (${pc(cells - covered)})`);
  console.log(`  era gate suppressed an option in ${anachronistic} (${pc(anachronistic)})`);
  const uncited = nameTraditions.filter((t) => !t.sources.length);
  console.log(
    `\ntraditions ${nameTraditions.length}, without a citation ${uncited.length}`,
  );
  const wide = nameTraditions
    .filter((t) => t.era[1] - t.era[0] > 100000)
    .map((t) => t.id);
  console.log(`traditions with no era floor: ${wide.length}`);
}
