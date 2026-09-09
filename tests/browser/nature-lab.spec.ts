import { test, expect } from "@playwright/test";

test("nature gallery previews atlas assets, frames, backgrounds and exports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/nature-lab");
  await expect(
    page.getByRole("heading", { name: "Plants & animals" }),
  ).toBeVisible();
  await expect(page.locator(".nature-grid button")).toHaveCount(42);
  await expect(page.locator(".nature-grid .pixel-sprite")).toHaveCount(42);
  for (const name of [
    "Silver birch",
    "Tropical broadleaf",
    "Riverside willow",
    "Dry thorn scrub",
  ]) {
    await page
      .getByRole("button", { name: new RegExp(`^${name} New`) })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId("nature-preview").locator(".pixel-sprite"),
    ).toHaveCount(1);
  }
  await page
    .getByRole("button", { name: "Riverside willow New trees" })
    .click();
  await page.screenshot({
    path: "artifacts/nature-lab/willow-preview.png",
    fullPage: true,
  });
  for (const name of [
    "Woodland fern",
    "Flowering heath",
    "Sagebrush",
    "Tropical ginger",
  ]) {
    await page.getByRole("button", { name: `${name} New understory` }).click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId("nature-preview").locator(".pixel-sprite"),
    ).toHaveCount(1);
  }
  await page.screenshot({
    path: "artifacts/nature-lab/ginger-preview.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Acacia Trees" }).click();
  await page.getByLabel("Pixel scale").selectOption("4");
  await page.getByLabel("Backdrop").selectOption("dry");
  await expect(page.getByTestId("nature-preview")).toHaveClass(/nature-bg-dry/);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export sprite PNG" }).click();
  expect((await download).suggestedFilename()).toBe("acacia.png");
  await page.getByRole("tab", { name: "Animals" }).click();
  await expect(page.locator(".nature-grid button")).toHaveCount(4);
  await page.getByLabel("Animation frame").selectOption("1");
  await expect(page.locator(".nature-meta code")).toHaveText("sheep1");
  await page.getByRole("button", { name: "Play animation" }).click();
  await expect(page.locator(".nature-meta code")).toHaveText("sheep0");
  await page.getByRole("button", { name: "Pause animation" }).click();
  await page.getByRole("tab", { name: "Plants" }).click();
  await page.screenshot({
    path: "artifacts/nature-lab/plants.png",
    fullPage: true,
  });
  await page.getByLabel("Find an asset").fill("absent");
  await expect(
    page.getByText("No matching assets. Try another name."),
  ).toBeVisible();
  await page.getByLabel("Find an asset").fill("");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/nature-lab/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("settings tabs open the nature lab without replacing the world", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: /Korean farmer/ }).click();
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 75000,
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "settings", exact: true });
  await expect(dialog.getByRole("tab", { name: "Display" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await dialog.getByRole("tab", { name: "Display" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    dialog.getByRole("heading", { name: "Music & sound" }),
  ).toBeVisible();
  await dialog.getByRole("tab", { name: "Journeys" }).click();
  await expect(
    dialog.getByRole("button", { name: "Export world" }),
  ).toBeVisible();
  await dialog.getByRole("tab", { name: "Developer" }).click();
  await page.screenshot({ path: "artifacts/nature-lab/settings.png" });
  const popup = page.waitForEvent("popup");
  await dialog.getByRole("link", { name: /Plants & animals/ }).click();
  const lab = await popup;
  await expect(
    lab.getByRole("heading", { name: "Plants & animals" }),
  ).toBeVisible();
  await lab.close();
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/nature-lab/settings-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(dialog).toHaveCount(0);
});
