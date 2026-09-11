import { test, expect } from "@playwright/test";
test("walks to Oxford and back with one player and retained local changes", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    "/geography-lab?from=london&to=oxford&via=&year=1300&spacing=500&mode=land",
  );
  await page
    .getByRole("button", { name: "Play connected maps", exact: true })
    .click();
  await expect(page.getByLabel("Map travel")).toBeVisible({ timeout: 120000 });
  await page.waitForFunction(() => Boolean((window as any).__uhs?.journey));
  const initial = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    rt.engine.state.player.health = 73;
    const object = rt.engine.state.objects[0];
    object.damage = 17;
    return { name: rt.engine.state.player.name, object: object.id };
  });
  async function cross(to: string) {
    await page.evaluate((to) => {
      const rt = (window as any).__uhs,
        e = rt.journey.entrances.find((e: any) => e.to === to);
      if (!e?.point) throw Error("Missing entrance to " + to);
      const half = rt.engine.state.manifest.setting.playableMap.size / 2;
      rt.engine.state.player.pos = { ...e.point, space: "outside" };
      rt.emit();
      rt.move(
        e.point.x === -half ? -1 : e.point.x === half - 1 ? 1 : 0,
        e.point.y === -half ? -1 : e.point.y === half - 1 ? 1 : 0,
      );
    }, to);
    await page.waitForFunction(
      (id) =>
        (window as any).__uhs.journey.id === id &&
        !(window as any).__uhs.journey.busy,
      to,
      { timeout: 120000 },
    );
  }
  await cross("place:oxford");
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.name),
  ).toBe(initial.name);
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.health),
  ).toBe(73);
  // Move clear of the entrance before making the deliberate return trip.
  await page.evaluate(() => {
    const rt = (window as any).__uhs;
    rt.engine.state.player.pos = { x: 0, y: 0, space: "outside" };
    rt.emit();
  });
  await cross("place:london");
  expect(
    await page.evaluate(
      (id) =>
        (window as any).__uhs.engine.state.objects.find((o: any) => o.id === id)
          ?.damage,
      initial.object,
    ),
  ).toBe(17);
  expect(
    await page.evaluate(() => (window as any).__uhs.journey.visited.size),
  ).toBe(1);
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 75000 },
  );
  await page.screenshot({ path: "artifacts/geography/live-map-return.png" });
  expect(errors).toEqual([]);
});
