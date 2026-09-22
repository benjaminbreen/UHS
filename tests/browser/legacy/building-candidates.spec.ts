import { expect, test } from "@playwright/test";

test("building panel exposes compact modern infill candidates", async ({
  page,
}) => {
  await page.goto("/building-lab");
  await expect(
    page
      .locator("aside button")
      .filter({ hasText: "Candidate · 3×2 ranch home" }),
  ).toBeVisible();
  await expect(page.getByText("Review-only candidate")).toBeVisible();

  const candidates = page
    .locator("aside button")
    .filter({ hasText: "Candidate ·" });
  await expect(candidates).toHaveCount(18);

  await page
    .getByRole("button", { name: /Candidate · 3×2 donut shop/ })
    .click();
  await expect(page.locator(".building-meta")).toContainText(
    "Candidate · 3×2 donut shop",
  );
  await expect(page.locator(".building-meta")).toContainText("sign DONUTS");

  await page
    .getByRole("button", { name: /Candidate · 3×2 gas station/ })
    .click();
  await expect(page.locator(".building-meta")).toContainText("sign GAS");
  await expect(page.locator(".candidate-card")).toContainText("roof fan");

  await page.locator(".building-controls select").selectOption("Asphalt");
  await page.screenshot({
    path: "artifacts/buildings/modern-infill-candidates.png",
    fullPage: true,
  });
});
