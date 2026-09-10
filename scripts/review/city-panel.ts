/** Regenerates a fixed panel of cities and writes artifacts/cities/panel.md.
 *
 *   npx tsx scripts/review/city-panel.ts            stats only
 *   UHS_CITY_URL=http://127.0.0.1:5173 npx tsx scripts/review/city-panel.ts capture
 *
 * With `capture`, each city is also screenshotted through the terrain lab
 * (needs the dev server). Run before and after a generator change. */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { panelCity, PANEL } from "./panel";

const capture = process.argv.includes("capture");
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
  if (capture)
    execFileSync(
      "npx",
      ["playwright", "test", "tests/browser/city-capture.spec.ts"],
      {
        env: {
          ...process.env,
          UHS_PLACE: place,
          UHS_YEAR: String(year),
          UHS_ZOOM: process.env.UHS_ZOOM ?? "0.25",
        },
        stdio: "inherit",
      },
    );
}
const out = [
  "# City panel",
  "",
  `Generated ${new Date().toISOString()}`,
  "",
  ...rows,
];
if (capture)
  out.push(
    "",
    ...PANEL.map(
      ({ place, year }) => `![${place} ${year}](${place}-${year}.png)`,
    ),
  );
writeFileSync("artifacts/cities/panel.md", out.join("\n") + "\n");
