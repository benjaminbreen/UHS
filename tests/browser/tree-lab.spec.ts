import { test, expect } from "@playwright/test";

test("tree lab loads tree atlas pixels and exports an editable recipe", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tree-lab");
  await expect(page.getByRole("heading", { name: "Tree texture lab" })).toBeVisible();
  await expect(page.getByText(/Source atlas loaded/)).toBeVisible();
  await expect(page.locator(".tree-asset-grid > button")).toHaveCount(19);
  await expect(page.locator(".tree-pixel-editor")).toBeVisible();
  await expect(page.getByText("112 × 144 native pixels")).toBeVisible();

  const palette = page.getByLabel("Edit palette color 1");
  await palette.fill("#123456");
  await expect(page.locator(".tree-recipe pre")).toContainText("#123456");

  await page.locator(".tree-pixel-editor").click({ position: { x: 220, y: 280 } });
  await page.getByText("Show current JSON recipe").click();
  await expect(page.locator(".tree-recipe pre")).toContainText('"nature-broadleaf-mature"');

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  expect((await download).suggestedFilename()).toBe("tree-art.json");
  expect(errors).toEqual([]);
});
