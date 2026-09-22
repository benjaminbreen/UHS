import { test } from "@playwright/test";

/** Screenshot the fields of one town close up.
 *   UHS_PLACE=city-alexandria UHS_YEAR=-244 npx playwright test tests/browser/field-capture.spec.ts */
test("captures fields for review", async ({ page }) => {
  test.setTimeout(240000);
  const place = process.env.UHS_PLACE ?? "city-alexandria",
    year = process.env.UHS_YEAR ?? "-244",
    zoom = Number(process.env.UHS_ZOOM ?? "1.75"),
    tag = process.env.UHS_TAG ?? "after";
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto(
    `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173"}/terrain-lab?place=${place}&seed=city-review&ecology=temperate-woodland&year=${year}&pattern=dense&population=settled&landform=rolling&start=resident`,
  );
  await page.waitForFunction(
    () => document.querySelector("canvas")?.getAttribute("data-terrain-ready") === "true",
    {},
    { timeout: 180000 },
  );
  const info = await page.evaluate((zoom) => {
    const lab = (window as any).terrainLab,
      world = lab.runtime.engine.world,
      plan = world.planAt(world.spawn.x, world.spawn.y);
    const parcels = plan.parcels ?? [];
    if (!parcels.length) return "no parcels";
    // Middle parcel by index so the view has fields on every side.
    const p = parcels[Math.floor(parcels.length / 2)];
    const c = { x: p.rect.x + p.rect.w / 2, y: p.rect.y + p.rect.h / 2 };
    lab.runtime.zoom = zoom;
    lab.scene.options.center = c;
    lab.scene.draw();
    lab.scene.cameras.main.stopFollow();
    lab.scene.cameras.main.centerOn(c.x * 16, c.y * 16);
    return `${parcels.length} parcels, ${p.crop}`;
  }, zoom);
  console.log(info);
  await page.waitForFunction(
    () => document.querySelector("canvas")?.getAttribute("data-terrain-pending") === "0",
    {},
    { timeout: 120000 },
  );
  await page.locator("canvas").screenshot({ path: `artifacts/fields/${place}-${year}-${tag}.png` });
});
