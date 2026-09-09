import { test, expect } from "@playwright/test";

test("grass lab edits source pixels, colors, previews and exports a recipe", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/grass-lab");
  await expect(
    page.getByRole("heading", { name: "Grass texture lab" }),
  ).toBeVisible();
  await expect(page.getByTestId("grass-preview")).toHaveAttribute(
    "width",
    "144",
  );
  await expect(page.getByRole("gridcell")).toHaveCount(72);

  const pixel = page.getByRole("gridcell", { name: "Pixel 4,0" });
  await expect(pixel).toHaveAttribute("data-value", "2");
  await page.getByRole("button", { name: "Highlight", exact: true }).click();
  await pixel.click();
  await expect(pixel).toHaveAttribute("data-value", "3");
  await pixel.click({ button: "right" });
  await expect(pixel).toHaveAttribute("data-value", "0");

  await page.getByLabel("Base turf").fill("#123456");
  await expect(page.getByLabel("Base turf")).toHaveValue("#123456");
  await page.getByRole("tab", { name: "Ground ticks" }).click();
  await expect(page.getByRole("gridcell")).toHaveCount(64);
  await page.getByRole("gridcell", { name: "Pixel 2,1" }).click();
  await expect(
    page.getByRole("gridcell", { name: "Pixel 2,1" }),
  ).toHaveAttribute("data-value", "0");

  const recipe = JSON.parse(
    (await page.locator(".grass-recipe pre").textContent())!,
  );
  recipe.palettes.grassland.base = "#654321";
  await page.locator('input[type="file"]').setInputFiles({
    name: "custom-grass.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(recipe)),
  });
  await expect(page.getByLabel("Base turf")).toHaveValue("#654321");
  await expect(page.getByRole("status")).toContainText("imported");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  expect((await download).suggestedFilename()).toBe("grass-art.json");
  expect(errors).toEqual([]);
});

test("settings developer tools expose the grass lab", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "More info" }).click();
  await page.getByRole("button", { name: /Roman legionary/ }).click();
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 75000,
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "settings", exact: true });
  await dialog.getByRole("tab", { name: "Developer" }).click();
  const popup = page.waitForEvent("popup");
  await dialog.getByRole("link", { name: /Grass texture lab/ }).click();
  const lab = await popup;
  await expect(
    lab.getByRole("heading", { name: "Grass texture lab" }),
  ).toBeVisible();
  await lab.close();
});
