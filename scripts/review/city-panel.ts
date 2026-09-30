/** Regenerates a fixed panel of cities and writes artifacts/cities/panel.md.
 *
 *   npx tsx scripts/review/city-panel.ts
 *
 * Run before and after a generator change. */
import { mkdirSync, writeFileSync } from "node:fs";
import { panelCity, PANEL } from "./panel";

mkdirSync("artifacts/cities", { recursive: true });
const rows: string[] = [
  "| city | year | radius | buildings | people | built share | parks | parcels | field cells | gen ms | streets | fields | buildings | routines |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
];
for (const { place, year } of PANEL) {
  const c = panelCity(place, year);
  const t = c.timing;
  rows.push(
    `| ${place} | ${year} | ${c.radius} | ${c.buildings} | ${c.humans} | ${(c.builtShare * 100).toFixed(1)}% | ${c.parks} | ${c.parcels} | ${c.fieldCells} | ${c.genMs} | ${t.streets ?? ""} | ${t.fields ?? ""} | ${t.buildings ?? ""} | ${t.routines ?? ""} |`,
  );
  console.log(rows.at(-1));
}
const out = [
  "# City panel",
  "",
  `Generated ${new Date().toISOString()}`,
  "",
  ...rows,
];
writeFileSync("artifacts/cities/panel.md", out.join("\n") + "\n");
