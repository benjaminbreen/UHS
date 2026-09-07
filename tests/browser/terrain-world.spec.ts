import { test, expect } from "@playwright/test";
test("Anatolia renders discrete relief and remains playable", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "New world", exact: true }).click();
  const started = Date.now();
  await page
    .getByRole("button", { name: "Anatolia · 6500 BCE · terrain preview" })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as any).__uhs?.engine.state.manifest.setting
              ?.terrainRevision,
        ),
      { timeout: 90000 },
    )
    .toBe(1);
  console.log("Preview ready ms", Date.now() - started);
  console.log(
    "Terrain render ms",
    await page
      .locator("canvas[data-terrain-draw-ms]")
      .getAttribute("data-terrain-draw-ms"),
  );
  await page.evaluate(() => (window as any).__uhs.setZoom(1));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "artifacts/anatolia-topography-v3.png" });
  const result = await page.evaluate(() => {
    const e = (window as any).__uhs.engine;
    return {
      generator: e.state.manifest.generator,
      year: e.state.manifest.setting.year,
      route: e.findRoute(
        e.state.player.pos,
        e.world.places.find((p: any) => p.owner === "player").entrance,
      ).status,
    };
  });
  expect(result).toEqual({ generator: 3, year: -6499, route: "found" });
  expect(errors).toEqual([]);
});
