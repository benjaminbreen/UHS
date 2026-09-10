/** Screenshot the main game chrome for UI review.
 * Usage: tsx scripts/capture-ui.ts <out.png> [named start] */
import { chromium } from "@playwright/test";
const [out = "artifacts/ui.png", start = "Korean farmer"] =
  process.argv.slice(2);
const base = process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1668, height: 941 } });
page.on("pageerror", (e) => console.error("pageerror", e.message));
await page.goto(base + "/");
await page.getByRole("button", { name: "More info" }).click();
await page.getByRole("button", { name: new RegExp(start) }).click();
await page.waitForFunction(() => !!(window as any).historySim, null, {
  timeout: 120000,
});
await page.waitForSelector(".game-container canvas", { timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await browser.close();
