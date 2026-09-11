import { test, expect } from "@playwright/test";
test("walk into two shallows, lap at rest, block deep water, and leave dry", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    "/terrain-lab?seed=water-review&ecology=desert&water=river-ns&season=summer&landform=plain&population=none&start=wanderer",
  );
  await expect(page.locator("canvas[data-terrain-ready]")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 60000 },
  );
  await page.locator(".gsp-fold").click();
  await page.getByRole("button", { name: "Play this world →" }).click();
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  const path = await page.evaluate(async () => {
    const w = window as any;
    const sceneModule = performance.getEntriesByType("resource").find(e => e.name.includes("/src/render/WorldScene.ts"))!.name, waterModule = "/src/core/water-field.ts";
    const { WorldScene } = await import(/* @vite-ignore */ sceneModule);
    const { waterDepthAt } = await import(/* @vite-ignore */ waterModule);
    const original = WorldScene.prototype.draw;
    WorldScene.prototype.draw = function () {
      w.wadeScene = this;
      original.call(this);
    };
    w.__uhs.emit();
    WorldScene.prototype.draw = original;
    const e = w.__uhs.engine,
      sample = e.world.topography;
    for (let y = -45; y < 45; y++)
      for (let x = -50; x < 30; x++)
        for (const dx of [-1, 1]) {
          const points = Array.from({ length: 4 }, (_, i) => ({
            x: x + dx * i,
            y,
          }));
          const depths = points.map((p) =>
            waterDepthAt(sample, p.x + 0.5, p.y + 0.5),
          );
          if (
            depths[0] !== 0 ||
            depths[1] < 0.08 ||
            depths[1] > 0.4 ||
            depths[2] < 0.4 ||
            depths[2] > 0.85 ||
            depths[3] <= 0.85
          )
            continue;
          if (points.slice(0, 3).some((p) => e.blocked(p.x, p.y, "outside")))
            continue;
          if (
            !e.world.canCross(points[0], points[1]) ||
            !e.world.canCross(points[1], points[2])
          )
            continue;
          e.state.player.pos = { ...points[0], space: "outside" };
          w.__uhs.setZoom(3);
          w.__uhs.emit();
          return { points, dx, depths };
        }
    throw new Error("No shallow bank found");
  });
  await page.waitForTimeout(500);
  await page.evaluate((dx) => (window as any).__uhs.move(dx, 0), path.dx);
  await page.waitForTimeout(380);
  await page.evaluate((dx) => (window as any).__uhs.move(dx, 0), path.dx);
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() =>
      (window as any).wadeScene.entities.get("player").getData("characterPose"),
    ),
  ).toBe("wade");
  await page.waitForTimeout(450);
  const wet = await page.evaluate(() => {
    const s = (window as any).wadeScene,
      c = s.wading.contacts.get("player"),
      im = s.entities.get("player");
    return {
      depth: im.getData("waterDepth"),
      crop: im.isCropped,
      alpha: c.submerged.alpha,
      ripples: c.ripples.length,
    };
  });
  expect(wet.depth).toBeGreaterThan(0.35);
  expect(wet.crop).toBe(true);
  expect(wet.alpha).toBeLessThan(0.5);
  await page.screenshot({ path: "artifacts/wading-river.png" });
  await page.waitForTimeout(1000);
  expect(
    await page.evaluate(
      () =>
        (window as any).wadeScene.wading.contacts.get("player").ripples.length,
    ),
  ).toBe(0);
  await page.evaluate((dx) => (window as any).__uhs.move(dx, 0), path.dx);
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.pos.x),
  ).toBe(path.points[2].x);
  await page.evaluate((dx) => (window as any).__uhs.move(-dx, 0), path.dx);
  await page.waitForTimeout(420);
  await page.evaluate((dx) => (window as any).__uhs.move(-dx, 0), path.dx);
  await page.waitForTimeout(420);
  expect(
    await page.evaluate(() =>
      (window as any).wadeScene.wading.contacts.has("player"),
    ),
  ).toBe(false);
  expect(
    await page.evaluate(
      () => (window as any).wadeScene.entities.get("player").isCropped,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});
