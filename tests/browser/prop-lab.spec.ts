import { test, expect } from "@playwright/test";

test("prop review renders all families, variants, shadows and export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/prop-lab");
  await expect(page.locator(".prop-card")).toHaveCount(40);
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(41);
  expect(await page.evaluate(() => Boolean((window as any).__uhs))).toBe(false);
  await page.getByTestId("prop-painted-chest").click();
  const canvas = page.locator(".prop-detail-stage canvas");
  const pixels = () => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  const original = await pixels();
  await page.getByRole("button", { name: "Muted blue", exact: true }).click();
  await expect.poll(pixels).not.toBe(original);
  const colored = await pixels();
  await page.getByLabel("Shadow study").selectOption("afternoon");
  await expect.poll(pixels).not.toBe(colored);
  await page.getByLabel("Find a prop").fill("well");
  expect(await page.locator(".prop-card").count()).toBeGreaterThan(0);
  expect(await page.locator(".prop-card").count()).toBeLessThan(40);
  await page.getByLabel("Find a prop").fill("");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save selected PNG" }).click();
  expect((await download).suggestedFilename()).toContain("painted-chest");
  await page.screenshot({ path: "artifacts/prop-gallery.png" });
  expect(errors).toEqual([]);
});

test("Command+2 opens and closes in world and graphics lab without game actions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const before = await page.evaluate(() => (window as any).__uhs.engine.hash());
  await page.keyboard.press("Meta+Digit2");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Find a prop").focus();
  await page.keyboard.type("pot");
  await page.keyboard.press("Space");
  expect(await page.evaluate(() => (window as any).__uhs.engine.hash())).toBe(
    before,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/graphics-lab");
  await expect(page.getByRole("button", { name: "Prop gallery · ⌘2", exact: true })).toBeVisible();
  await page.keyboard.press("Meta+Digit2");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Meta+Digit2");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Control+Digit2");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("mobile gallery stays within viewport and selects detail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/prop-lab");
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(41);
  await page.getByTestId("prop-earthen-pot").click();
  await expect(page.locator(".prop-detail h2")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: "artifacts/prop-gallery-mobile.png" });
});
