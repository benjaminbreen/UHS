import { test, expect } from "@playwright/test";
test("follows a permanent connection back and generates bounded London", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.goto(
    "/geography-lab?from=london&to=oxford&via=&year=1300&spacing=500&mode=land",
  );
  const panel = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: "Permanent maps", exact: true }),
    });
  await expect(panel.locator("code")).toHaveText("place:london", {
    timeout: 60000,
  });
  await panel
    .locator(".geo-neighbors button")
    .filter({ hasText: "Walking connection" })
    .first()
    .click();
  await expect(panel.locator("code")).not.toHaveText("place:london", {
    timeout: 60000,
  });
  await panel
    .locator(".geo-neighbors button")
    .filter({ hasText: "London" })
    .first()
    .click();
  await expect(panel.locator("code")).toHaveText("place:london", {
    timeout: 60000,
  });
  await panel.getByRole("button", { name: "Generate bounded map" }).click();
  await expect(panel.locator(".geo-preview-canvas canvas")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 180000 },
  );
  await expect(panel.getByLabel("Boundary size")).toHaveValue("512");
  await expect(panel.getByLabel("Boundary size")).toBeDisabled();
  await expect(
    panel.getByText(/Reachable boundary entrance/).first(),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/geography/permanent-london.png",
    fullPage: true,
  });
});
