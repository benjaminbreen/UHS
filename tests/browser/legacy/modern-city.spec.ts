import { expect, test } from "@playwright/test";

test("modern cities have dense mixed-use blocks, asphalt streets and green space", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173"}/terrain-lab?place=city-miami&seed=city-review&ecology=temperate-woodland&year=2001&pattern=dense&population=settled&water=none&landform=rolling&start=resident`,
  );
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
      "true",
    {},
    { timeout: 120000 },
  );
  const result = await page.evaluate(() => {
    const lab = (window as any).terrainLab,
      world = lab.runtime.engine.world,
      plan = world.planAt(world.spawn.x, world.spawn.y),
      frames = [
        ...new Set<string>(plan.places.map((place: any) => place.sprite)),
      ];
    lab.runtime.zoom = 1;
    lab.scene.options.center = plan.site.center;
    lab.scene.draw();
    lab.scene.cameras.main.stopFollow();
    lab.scene.cameras.main.centerOn(
      plan.site.center.x * 16,
      plan.site.center.y * 16,
    );
    return {
      buildings: plan.places.length,
      modernBuildings: plan.places.filter((place: any) =>
        place.sprite.startsWith("modern-") ||
        place.sprite.startsWith("candidate-modern-"),
      ).length,
      infillBuildings: plan.places.filter((place: any) =>
        place.sprite.startsWith("candidate-modern-"),
      ).length,
      parks: plan.plots.filter((plot: any) => plot.id.includes("-park-"))
        .length,
      asphalt: [...plan.streetSurfaces.values()].filter(
        (surface: string) => surface === "asphalt",
      ).length,
      concrete: [...plan.streetSurfaces.values()].filter(
        (surface: string) => surface === "concrete",
      ).length,
      verges: [...plan.pavement.values()].filter(
        (surface: string) => surface === "verge",
      ).length,
      grass: [...plan.surface.values()].filter(
        (surface: string) => surface === "grass",
      ).length,
      frames,
      buildingAnimations: Number(
        document.querySelector("canvas")?.dataset.buildingAnimations ?? 0,
      ),
      site: { name: plan.site.name, profile: plan.site.profile },
      missing: [...lab.scene.buildings.values()].filter(
        (image: any) => image.frame.name === "__MISSING",
      ).length,
    };
  });
  expect(result.buildings).toBeGreaterThanOrEqual(140);
  expect(result.modernBuildings).toBe(result.buildings);
  expect(result.infillBuildings).toBeGreaterThanOrEqual(60);
  expect(result.parks).toBeGreaterThanOrEqual(2);
  expect(result.asphalt).toBeGreaterThan(0);
  expect(result.concrete).toBeGreaterThan(0);
  expect(result.buildingAnimations).toBeGreaterThan(0);
  expect(result.verges).toBeGreaterThan(500);
  expect(result.grass).toBeGreaterThan(1000);
  expect(
    result.frames.some((frame: string) => frame.startsWith("modern-office")),
  ).toBe(true);
  expect(result.missing).toBe(0);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-pending") ===
      "0",
    {},
    { timeout: 60000 },
  );
  await page.locator("canvas").screenshot({
    path: "artifacts/cities/miami-modern.png",
  });
  expect(errors).toEqual([]);
});
