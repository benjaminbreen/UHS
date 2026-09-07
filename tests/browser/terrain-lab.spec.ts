import { test, expect } from "@playwright/test";

test("terrain fixture walks slopes, blocks cliffs, exports and renders both studies", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" && /frame|texture/i.test(m.text()))
      errors.push(m.text());
  });
  await page.goto("/terrain-lab");
  await expect(page.getByTestId("terrain-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(await page.evaluate(() => Boolean((window as any).historySim))).toBe(
    false,
  );
  await page.getByRole("button", { name: "Raised terrace" }).click();
  await expect(page.getByTestId("terrain-position")).toContainText(
    "Tier 2 · soil · 29, 14",
  );
  await page.getByRole("button", { name: "Upper ridge" }).click();
  await expect(page.getByTestId("terrain-position")).toContainText(
    "Tier 2 · dry · 32, 5",
  );
  // Click using the visible elevated actor's row, not an unprojected grid Y.
  const view = await page.evaluate(() => (window as any).terrainLab.describe());
  const bounds = await page.getByTestId("terrain-canvas").boundingBox();
  await page.mouse.click(
    bounds!.x + (view.feet.x - 16 - view.camera.worldX) * view.camera.zoom,
    bounds!.y + (view.feet.y - view.camera.worldY) * view.camera.zoom,
  );
  await expect(page.getByTestId("terrain-position")).toContainText("31, 5");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("terrain-position")).toContainText("32, 5");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("terrain-position")).toContainText("33, 5");
  await page.getByRole("button", { name: "Return to start" }).click();
  await page.screenshot({ path: "artifacts/topography-meadow.png" });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export scene PNG" }).click();
  expect((await download).suggestedFilename()).toBe("uhs-terrain-meadow.png");
  await page.getByLabel("Terrain scene").selectOption("contours");
  await expect(page.getByTestId("terrain-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  // Low ground ends in a ledge at x16,y20. The designated slope is x17,y21.
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("terrain-position")).toContainText("16, 23");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("terrain-position")).toContainText("16, 22");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("terrain-position")).toContainText("16, 21");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("status")).toContainText("A ledge blocks");
  await expect(page.getByTestId("terrain-position")).toContainText("16, 21");
  await page.getByRole("button", { name: "North slope" }).click();
  await expect(page.getByTestId("terrain-position")).toContainText(
    "Tier 3 · grass · 18, 13",
    { timeout: 10000 },
  );
  await page.screenshot({ path: "artifacts/topography-contours.png" });
  await page.getByLabel("Show height grid").check();
  await page.screenshot({ path: "artifacts/topography-height-grid.png" });
  expect(errors).toEqual([]);
});

test("terrain review is independent of saved journeys and usable on a narrow screen", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() =>
    (window as any).historySim.act({
      actionId: "terrain-before",
      expectedRevision: 0,
      command: { type: "wait", seconds: 60 },
    }),
  );
  const before = await page.evaluate(() => (window as any).__uhs.engine.hash());
  await page.waitForTimeout(400);
  await page.goto("/terrain-lab");
  await expect(page.getByTestId("terrain-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "River crossing" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).terrainLab.describe().camera.zoom),
    )
    .toBe(1);
  await expect(page.locator(".terrain-canvas canvas")).toHaveAttribute(
    "width",
    "390",
  );
  const cameraBefore = await page.evaluate(
    () => (window as any).terrainLab.describe().camera,
  );
  const canvas = await page.getByTestId("terrain-canvas").boundingBox();
  await page.mouse.move(canvas!.x + 100, canvas!.y + 150);
  await page.mouse.down();
  await page.mouse.move(canvas!.x + 160, canvas!.y + 150, { steps: 5 });
  await page.mouse.up();
  const afterDrag = await page.evaluate(() =>
    (window as any).terrainLab.describe(),
  );
  expect(afterDrag.camera.x).toBeLessThan(cameraBefore.x);
  expect(afterDrag.position).toEqual({ x: 17, y: 15 });
  await page.mouse.wheel(0, -100);
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).terrainLab.describe().camera.zoom),
    )
    .toBe(2);
  await page.mouse.wheel(0, 100);
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).terrainLab.describe().camera.zoom),
    )
    .toBe(1);
  await page.screenshot({
    path: "artifacts/topography-mobile.png",
    fullPage: true,
  });
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(await page.evaluate(() => (window as any).__uhs.engine.hash())).toBe(
    before,
  );
});
