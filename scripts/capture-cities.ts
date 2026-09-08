import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
const errors: string[] = [];
page.on("pageerror", (e) => (errors.push(e.message), console.error(e.message)));
try {
  await mkdir("artifacts/cities", { recursive: true });
  await page.goto(
    `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173"}/terrain-lab?place=rome&seed=city-review&ecology=dry-scrub&year=-99&pattern=dense&population=settled&water=none&landform=plain&start=resident`,
  );
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
      "true",
    {},
    { timeout: 120000 },
  );
  console.log(
    await page.evaluate(() => {
      const l = (window as any).terrainLab,
        w = l.runtime.engine.world;
      l.runtime.zoom = 2;
      l.scene.options.center = { ...w.spawn };
      l.scene.draw();
      l.scene.cameras.main.centerOn(w.spawn.x * 16, w.spawn.y * 16);
      return {
        setting: w.pack.setting,
        places: w.places.length,
        spawn: w.spawn,
        urban: w.places.filter((p: any) => p.sprite.includes("urban")).length,
        cell: w.topography(0, 0),
      };
    }),
  );
  await page.waitForTimeout(1500);
  await page
    .locator("canvas")
    .screenshot({ path: "artifacts/cities/rome-detail.png" });
  await page.evaluate(() => {
    const l = (window as any).terrainLab;
    l.runtime.zoom = 1;
    l.scene.draw();
  });
  await page.waitForTimeout(1000);
  await page
    .locator("canvas")
    .screenshot({ path: "artifacts/cities/rome-neighborhood.png" });
  await page.evaluate(() => {
    const l = (window as any).terrainLab;
    const civic = l.runtime.engine.world.places.find((p: any) =>
      p.id.endsWith("-civic"),
    );
    if (!civic) return;
    const center = { x: civic.x + civic.w / 2, y: civic.y + civic.h + 7 };
    l.runtime.zoom = 1.5;
    l.scene.options.center = center;
    l.scene.draw();
    l.scene.cameras.main.centerOn(center.x * 16, center.y * 16);
  });
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-pending") ===
      "0",
    {},
    { timeout: 60000 },
  );
  await page
    .locator("canvas")
    .screenshot({ path: "artifacts/cities/rome-public-square.png" });
  console.log({ errors });
} finally {
  await browser.close();
}
