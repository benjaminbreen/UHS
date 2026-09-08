import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  await mkdir("artifacts/cities", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1024 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [name, place, year] of [
    ["rome", "rome", -99],
    ["new-york", "city-new-york", 1850],
  ] as const) {
    await page.goto(
      `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5174"}/terrain-lab?place=${place}&year=${year}&seed=city-review&ecology=grassland&pattern=dense&population=settled&water=none&landform=plain&start=resident`,
    );
    await page.waitForFunction(
      () =>
        document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
        "true",
      {},
      { timeout: 120000 },
    );
    console.log(
      name,
      await page.evaluate(() => {
        const lab = (window as any).terrainLab,
          w = lab.runtime.engine.world;
        const plan = w.planAt(w.spawn.x, w.spawn.y);
        const counts: Record<string, number> = {};
        for (const [key, material] of plan.streetSurfaces) {
          const [x, y] = key.split(",").map(Number),
            t = w.topography(x, y);
          if (material === "earth" && t.feature === "paving")
            throw Error("Earth lane still paved");
          const rendered =
            t.feature === "paving" ? t.streetMaterial : t.surface;
          counts[rendered] = (counts[rendered] ?? 0) + 1;
        }
        const civic = plan.places.find((p: any) => p.id.endsWith("-civic"));
        const center = civic
          ? { x: civic.x + civic.w / 2, y: civic.y + civic.h + 10 }
          : w.spawn;
        lab.runtime.zoom = 1.5;
        lab.scene.options.center = center;
        lab.scene.draw();
        lab.scene.cameras.main.centerOn(center.x * 16, center.y * 16);
        return {
          counts,
          setting: {
            lon: w.pack.setting.lon,
            lat: w.pack.setting.lat,
            year: w.pack.setting.year,
          },
        };
      }),
    );
    await page.waitForFunction(
      () =>
        document
          .querySelector("canvas")
          ?.getAttribute("data-terrain-pending") === "0",
      {},
      { timeout: 60000 },
    );
    await page
      .locator("canvas")
      .screenshot({ path: `artifacts/cities/${name}-mixed-paving.png` });
  }
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
