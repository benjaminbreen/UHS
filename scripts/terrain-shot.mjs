/** Render the terrain-experiments canvas headlessly for review. */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const [url, out, settings = "{}"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(
  (s) => window.terrainExperiments?.apply(JSON.parse(s)),
  settings,
);
await page.waitForTimeout(1200);
const data = await page.evaluate(() =>
  document.querySelector("canvas").toDataURL("image/png"),
);
writeFileSync(out, Buffer.from(data.split(",")[1], "base64"));
await browser.close();
console.log("wrote", out);
