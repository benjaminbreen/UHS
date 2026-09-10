/** A/B the terrain-lab ground style: shoot the preview with the shipped
 * renderer, flip the panel toggle, shoot it again. */
import { chromium } from "playwright";

const [url, outA, outB, style] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".gsp", { timeout: 30000 });
const landform = process.env.LANDFORM;
if (landform) {
  await page
    .locator("label", { hasText: "Landform" })
    .locator("select")
    .selectOption(landform);
  const gen = page.getByRole("button", { name: /Generate preview/i });
  if (await gen.count()) await gen.first().click();
  await page.waitForTimeout(2000);
}
const ready = async () => {
  for (let i = 0; i < 60; i++) {
    if (await page.locator('[data-ready="true"]').count()) return true;
    const text = await page.textContent(".proc-readout").catch(() => "");
    if (text?.includes("Ready to explore")) return true;
    await page.waitForTimeout(1000);
  }
  return false;
};
console.log("baseline ready:", await ready());
/** Clip the full-page capture to the canvas: screenshotting a WebGL element
 * directly can come back without its drawing buffer. */
const shot = async (path) => {
  const box = await page.locator("canvas").first().boundingBox();
  await page.screenshot({ path, clip: box ?? undefined });
};
await shot(outA);
if (style) {
  await page.evaluate((s) => window.groundStyleLab?.apply(JSON.parse(s)), style);
}
await page.click(".gsp-ab input");
await page.waitForTimeout(Number(process.env.SETTLE ?? 14000));
await shot(outB);
console.log("error:", await page.getAttribute("canvas", "data-terrain-error"));
await browser.close();
