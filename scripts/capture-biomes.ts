/** Review captures only; deliberately separate from the active browser test suite.
 * Usage: npx tsx scripts/capture-biomes.ts <outdir> [ecology[:variant][:season][:water] ...] */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const [outDir = "artifacts/biome-review", ...studies] = process.argv.slice(2);
const list = studies.length
  ? studies
  : ["grassland", "temperate-woodland", "desert", "wetland"];
const ZOOM = Number(process.env.ZOOM ?? 2);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
await mkdir(outDir, { recursive: true });
const ready = () =>
  page.waitForFunction(
    () => {
      const c = document.querySelector("canvas");
      return (
        c?.getAttribute("data-terrain-ready") === "true" &&
        c?.getAttribute("data-terrain-pending") === "0"
      );
    },
    {},
    { timeout: 90000 },
  );
try {
  for (const study of list) {
    const [
      ecology,
      variant = "",
      season = "summer",
      water = "river-ns",
      population = "none",
    ] = study.split(":");
    const name = [ecology, variant, season].filter(Boolean).join("-");
    const url = ecology.startsWith("place=")
      ? `http://127.0.0.1:5173/terrain-lab?seed=${process.env.SEED ?? "biome-review"}&${ecology}&year=${variant || 1300}&season=${season}&population=${population}&start=wanderer`
      : `http://127.0.0.1:5173/terrain-lab?seed=${process.env.SEED ?? "biome-review"}&ecology=${ecology}` +
      (variant ? `&variant=${variant}` : "") +
        `&season=${season}&water=${water}&landform=${process.env.LANDFORM ?? "rolling"}&population=${population}&start=wanderer${process.env.PATTERN ? `&pattern=${process.env.PATTERN}` : ""}`;
    // Prepared worlds are cached in IndexedDB; a generator change must not
    // be judged against a world prepared before it. Delete from a page on
    // the same origin that does not open the database, so the delete is
    // not blocked by the app's own connection.
    await page.goto("http://127.0.0.1:5173/@vite/client");
    const wiped = await page.evaluate(
      () =>
        new Promise<string>((r) => {
          const q = indexedDB.deleteDatabase("uhs-prepared");
          q.onsuccess = () => r("deleted");
          q.onerror = () => r("error");
          q.onblocked = () => r("blocked");
        }),
    );
    if (wiped !== "deleted") console.log("prepared cache:", wiped);
    await page.goto(url);
    await page.locator("canvas[data-terrain-ready]").waitFor({ timeout: 90000 });
    await ready();
    await page.getByRole("button", { name: "Pause water" }).click();
    await ready();
    await page.locator("canvas").screenshot({ path: `${outDir}/${name}.png` });
    const report = await page.evaluate(
      ([ZOOM, center]) => {
        let out = "";
        const lab = (window as any).terrainLab;
        lab.runtime.zoom = ZOOM;
        if (center) {
          let [cx, cy] = center.split(",").map(Number);
          if (center === "ramp") {
            // Nearest ramp cell, preferring one with several ramp neighbours.
            const w = lab.runtime.engine.world;
            let best = Infinity;
            for (let y = -160; y < 160; y++)
              for (let x = -160; x < 160; x++) {
                const c = w.topography?.(x, y);
                if (!c?.ramp) continue;
                const d = Math.hypot(x, y);
                if (d < best) {
                  best = d;
                  cx = x;
                  cy = y;
                }
              }
            console.log("ramp at", cx, cy);
          }
          if (center === "canal" || center === "paddy") {
            const w = lab.runtime.engine.world;
            let best = Infinity;
            for (let y = -200; y < 200; y++)
              for (let x = -200; x < 200; x++) {
                const c = w.topography?.(x, y);
                const hit = center === "canal" ? c?.waterVisual?.kind === "canal" : !!c?.field?.wet;
                if (!hit) continue;
                const d = Math.hypot(x, y);
                if (d < best) { best = d; cx = x; cy = y; }
              }
            out = `${center} at ${cx},${cy}`;
          }
          if (center === "arroyo" || center === "fall") {
            const w = lab.runtime.engine.world;
            let best = Infinity;
            for (let y = -160; y < 160; y++)
              for (let x = -160; x < 160; x++) {
                const c = w.topography?.(x, y);
                const hit =
                  center === "arroyo"
                    ? c?.landscape?.kind === "arroyo" && c.landscape.strength > 0.6
                    : c?.surface === "water" && c.height > 0 && w.topography?.(x, y + 1)?.surface === "water" && w.topography!(x, y + 1)!.height < c.height;
                if (!hit) continue;
                const d = Math.hypot(x, y);
                if (d < best) {
                  best = d;
                  cx = x;
                  cy = y;
                }
              }
            out = `${center} at ${cx},${cy}`;
          }
          if (center === "creek") {
            // Nearest creek cell, preferring a fall, within 120 cells.
            const w = lab.runtime.engine.world;
            let best = Infinity;
            for (let y = -220; y < 220; y++)
              for (let x = -220; x < 220; x++) {
                const c = w.topography?.(x, y);
                const fall = w.decoration?.(x, y)?.sprite === "nature-waterfall";
                if (!fall && !(c?.surface === "water" && c.waterVisual?.shoreWidth === 0.9)) continue;
                const d = Math.hypot(x, y) - (fall ? 200 : 0);
                if (d < best) {
                  best = d;
                  cx = x;
                  cy = y;
                }
              }
            console.log("creek at", cx, cy);
            // Height and water around the centre, for reading captures.
            const rows: string[] = [];
            for (let y = cy - 6; y <= cy + 6; y++) {
              let line = "";
              for (let x = cx - 12; x <= cx + 12; x++) {
                const c = w.topography?.(x, y);
                line += c ? (c.surface === "water" ? "~" : c.surface === "gravel" ? "g" : c.surface === "sand" ? "s" : c.feature === "bank" ? "b" : String(c.height)) : "?";
              }
              rows.push(line);
            }
            out = `creek at ${cx},${cy}\n` + rows.join("\n");
          }
          // The lab draws an overview around options.center.
          lab.scene.options.center = { x: cx, y: cy };
          lab.scene.draw();
          lab.scene.cameras.main.centerOn(cx * 16 + 8, cy * 16 + 8);
        }
        lab.scene.draw();
        return out;
      },
      [ZOOM, process.env.CENTER] as const,
    );
    if (report) console.log(report);
    // Streaming marks new chunks pending a frame later.
    await page.waitForTimeout(process.env.CENTER ? 4000 : 300);
    await ready();
    await page
      .locator("canvas")
      .screenshot({ path: `${outDir}/${name}-detail.png` });
    console.log(`Captured ${name}`);
  }
} finally {
  await browser.close();
}
