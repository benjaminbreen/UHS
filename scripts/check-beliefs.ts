/** Coverage of the belief scopes against the places the app can actually
 * generate. `npx tsx scripts/check-beliefs.ts [culture-id]` */
import { beliefsFor } from "../src/content/beliefs/index";
import { places } from "../src/content/geography/places";

/** Geographic remits, one per regional data file. Place `culture` tags are not
 * reliable enough to bucket a coverage gap by. */
const regions: [id: string, box: [number, number, number, number]][] = [
  ["european", [-25, 35, 45, 72]],
  ["west-asia", [-18, 12, 63, 45]],
  ["inner-eurasia", [25, 38, 180, 78]],
  ["south-asia", [60, 5, 92, 37]],
  ["east-asia", [95, 18, 150, 55]],
  ["southeast-asia", [92, -11, 142, 25]],
  ["west-central-africa", [-18, -10, 32, 20]],
  ["east-southern-africa", [10, -36, 52, 18]],
  ["mesoamerica", [-107, 12, -82, 25]],
  ["andes", [-82, -40, -60, 13]],
  ["indigenous-americas", [-170, -56, -35, 83]],
  ["australia-pacific", [110, -50, 180, 25]],
  ["australia-pacific", [-180, -30, -130, 30]],
];
const regionOf = (lon: number, lat: number) =>
  regions.find(
    ([, b]) => lon >= b[0] && lat >= b[1] && lon <= b[2] && lat <= b[3],
  )?.[0] ?? "unassigned";
const only = process.argv[2];
const years = [-8000, -3000, -1200, -400, 200, 800, 1200, 1500, 1750, 1900];
const byCulture = new Map<
  string,
  { miss: Map<number, string[]>; n: number; hit: number }
>();
for (const p of places) {
  const region = regionOf(p.lon, p.lat);
  if (only && region !== only) continue;
  const e = byCulture.get(region) ?? { miss: new Map(), n: 0, hit: 0 };
  byCulture.set(region, e);
  for (const year of years) {
    e.n++;
    const ok =
      beliefsFor({ ...p, year, community: "" } as never).id !== "unscoped";
    if (ok) e.hit++;
    else {
      const list = e.miss.get(year) ?? [];
      if (list.length < 8)
        list.push(`${p.name} (${p.lon.toFixed(0)},${p.lat.toFixed(0)})`);
      e.miss.set(year, list);
    }
  }
}
let n = 0,
  hit = 0;
for (const [region, e] of [...byCulture].sort()) {
  n += e.n;
  hit += e.hit;
  console.log(
    `\n### ${region}: ${Math.round((100 * e.hit) / e.n)}% covered (${e.n - e.hit} misses of ${e.n})`,
  );
  for (const year of years) {
    const list = e.miss.get(year);
    if (list?.length) console.log(`  ${year}: ${list.join(", ")}`);
  }
}
console.log(`\ntotal ${Math.round((100 * hit) / n)}% of ${n} place-years`);
