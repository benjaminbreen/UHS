import { expect, test } from "@playwright/test";

test("fauna lab previews species, behavior and group presentation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/fauna-lab");
  await expect(page.getByRole("heading", { name: "Fauna Lab" })).toBeVisible();
  await expect(page.locator(".fauna-grid button")).toHaveCount(6);
  await expect(page.locator(".fauna-member")).toHaveCount(5);

  await page.getByLabel("Behavior state").selectOption("flight");
  await expect(page.getByLabel("Flight height")).toBeEnabled();
  await page.getByLabel("Direction").selectOption("west");
  await page.getByLabel("Group members").fill("7");
  await page.getByLabel("Group spacing").fill("30");
  await page.getByLabel("Flight height").fill("42");
  await expect(page.locator(".fauna-member")).toHaveCount(7);
  await expect(page.locator(".fauna-frame code")).toContainText(
    "fauna-house-sparrow-flight-",
  );
  await page.screenshot({
    path: "artifacts/fauna-lab/flight-preview.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: /Red deer study/ }).click();
  await expect(page.getByLabel("Flight height")).toBeDisabled();
  await page.getByLabel("Behavior state").selectOption("flee");
  await expect(page.locator(".fauna-frame code")).toContainText(
    "fauna-red-deer-flee-",
  );

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export current frame" }).click();
  expect((await download).suggestedFilename()).toMatch(
    /^fauna-red-deer-flee-\d\.png$/,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/fauna-lab/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("developer settings link to the fauna lab", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 75000,
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "settings", exact: true });
  await settings.getByRole("tab", { name: "Developer" }).click();
  await expect(settings.getByRole("link", { name: /Fauna lab/ })).toHaveAttribute(
    "href",
    "/fauna-lab",
  );
});
