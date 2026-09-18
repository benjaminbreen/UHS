import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
await mkdir("artifacts/signs", { recursive: true });
for (const [place, year] of [["city-cheyenne", 1957], ["city-surakarta", 1957], ["city-dakar", 1960]] as const) {
  await page.goto(
    `http://127.0.0.1:5173/terrain-lab?place=${place}&seed=city-review&year=${year}&pattern=dense&population=settled&landform=plain&start=resident`,
  );
  await page.waitForFunction(
    () => document.querySelector("canvas")?.getAttribute("data-terrain-ready") === "true",
    {}, { timeout: 180000 },
  );
  const info = await page.evaluate(() => {
    const l = (window as any).terrainLab, w = l.runtime.engine.world;
    const shop = w.places.find((p: any) => (p.sprite.includes("candidate") && !p.sprite.includes("home")) || p.sprite.includes("shophouse"))
      ?? w.places.find((p: any) => p.sprite.includes("shop"));
    const center = shop ? { x: shop.x + shop.w / 2, y: shop.y + shop.h + 4 } : { ...w.spawn };
    l.runtime.zoom = 2.5;
    l.scene.options.center = center;
    l.scene.draw();
    l.scene.cameras.main.centerOn(center.x * 16, center.y * 16);
    return { setting: w.pack.setting.location, year: w.pack.setting.year, shop: shop?.sprite };
  });
  console.log(place, JSON.stringify(info));
  await page.waitForTimeout(2500);
  await page.locator("canvas").screenshot({ path: `artifacts/signs/${place}.png` });
}
await browser.close();
