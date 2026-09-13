import { expect, test } from "@playwright/test";

test("live graphics panel tunes the renderer and zoom easing", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 75000,
  });

  await page.keyboard.press("Control+Backquote");
  const panel = page.getByRole("complementary", {
    name: "Live graphics tuning",
  });
  await expect(panel).toBeVisible();
  await expect(canvas).toHaveAttribute("data-round-pixels", "false");
  await expect(canvas).toHaveAttribute("data-zoom-duration", "130");

  await panel.getByLabel("Round camera pixels").check();
  await expect(canvas).toHaveAttribute("data-round-pixels", "true");
  await panel.getByLabel("Texture filtering").selectOption("linear");
  await expect(canvas).toHaveAttribute("data-texture-sampling", "linear");
  await panel.getByLabel("Browser canvas sampling").selectOption("auto");
  await expect(canvas).toHaveCSS("image-rendering", "auto");
  await panel.getByRole("slider", { name: "Camera follow" }).fill("0.25");
  await expect(canvas).toHaveAttribute("data-follow-lerp", "0.25");
  await panel.getByLabel("Species").selectOption("red-deer");
  await panel.getByLabel("Animation").selectOption("flee");
  const faunaBefore = await page.evaluate(
    () => (window as any).__uhs.engine.state.fauna?.length ?? 0,
  );
  await panel.getByRole("slider", { name: "Test animal count" }).fill("3");
  await panel.getByRole("button", { name: "Add nearby" }).click();
  await expect(canvas).toHaveAttribute("data-test-fauna-count", "3");
  await expect(panel.getByText("3 test animals added nearby.")).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as any).__uhs.engine.state.fauna?.length ?? 0,
    ),
  ).toBe(faunaBefore);
  await page.screenshot({ path: "artifacts/live-graphics-panel.png" });
  await panel.getByRole("button", { name: "Clear test animals" }).click();
  await expect(canvas).toHaveAttribute("data-test-fauna-count", "0");

  await panel.getByRole("slider", { name: "Zoom transition" }).fill("400");
  await panel.getByRole("slider", { name: "Live zoom" }).fill("3");
  await expect(canvas).toHaveAttribute("data-camera-zoom-target", "3");
  const during = Number(await canvas.getAttribute("data-camera-zoom"));
  expect(during).toBeGreaterThanOrEqual(2);
  expect(during).toBeLessThan(3);
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-camera-zoom")))
    .toBeCloseTo(3, 2);

  await panel.getByRole("button", { name: "Reset" }).click();
  await expect(canvas).toHaveAttribute("data-round-pixels", "false");
  await expect(canvas).toHaveAttribute("data-texture-sampling", "nearest");
  await expect(panel.getByRole("slider", { name: "Live zoom" })).toHaveValue(
    "2",
  );
  await page.keyboard.press("Control+Backquote");
  await expect(panel).toHaveCount(0);
  expect(errors).toEqual([]);
});
