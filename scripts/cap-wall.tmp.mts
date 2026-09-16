import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("pageerror", (e) => console.error("ERR", e.message));
await page.goto(
  "http://127.0.0.1:5173/terrain-lab?place=rome&seed=wall-review&ecology=dry-scrub&year=-99&pattern=dense&population=settled&water=none&landform=plain&start=resident",
);
await page.waitForFunction(
  () => document.querySelector("canvas")?.getAttribute("data-terrain-ready") === "true",
  {}, { timeout: 120000 });
const info = await page.evaluate(() => {
  const l = (window as any).terrainLab, w = l.runtime.engine.world;
  const parts = w.enclosures.flatMap((e: any) => e.parts ?? []);
  if (!parts.length) return { parts: 0 };
  const c = parts.filter((p: any) => /-10-/.test(p.frame))[3] ?? parts[0];
  l.runtime.zoom = 2;
  l.scene.options.center = { x: c.x, y: c.y };
  l.scene.draw();
  l.scene.cameras.main.centerOn(c.x * 16, c.y * 16);
  return { parts: parts.length, at: c, frames: [...new Set(parts.map((p: any) => p.frame))].length };
});
console.log(info);
await page.waitForTimeout(1500);
await page.locator("canvas").screenshot({ path: "artifacts/wall-ingame.png", clip: { x: 0, y: 0, width: 820, height: 680 } });
await browser.close();
