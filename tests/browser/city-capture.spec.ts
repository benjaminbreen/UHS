import { test } from "@playwright/test";

/** Screenshot one city for visual review. Not an assertion suite.
 *   UHS_PLACE=city-miami UHS_YEAR=2001 npx playwright test tests/browser/city-capture.spec.ts */
test("captures a city for review", async ({ page }) => {
  test.setTimeout(240000);
  const place = process.env.UHS_PLACE ?? "city-miami",
    year = process.env.UHS_YEAR ?? "2001",
    zoom = Number(process.env.UHS_ZOOM ?? "0.5");
  await page.goto(
    `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173"}/terrain-lab?place=${place}&seed=city-review&ecology=temperate-woodland&year=${year}&pattern=dense&population=settled&landform=rolling&start=resident`,
  );
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
      "true",
    {},
    { timeout: 180000 },
  );
  await page.evaluate((zoom) => {
    const lab = (window as any).terrainLab,
      world = lab.runtime.engine.world,
      plan = world.planAt(world.spawn.x, world.spawn.y);
    lab.runtime.zoom = zoom;
    lab.scene.options.center = plan.site.center;
    lab.scene.draw();
    lab.scene.cameras.main.stopFollow();
    lab.scene.cameras.main.centerOn(
      plan.site.center.x * 16,
      plan.site.center.y * 16,
    );
  }, zoom);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-pending") ===
      "0",
    {},
    { timeout: 120000 },
  );
  await page.locator("canvas").screenshot({
    path: `artifacts/cities/${place}-${year}.png`,
  });
});
