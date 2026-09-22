import { test, expect } from "@playwright/test";
test("both visual scenes load, move, and switch through the UI", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Gaius", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas").first()).toBeVisible();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "artifacts/roman-first.png" });
  const beforeMap = await page.evaluate(
    () => (window as any).historySim.observe().clock,
  );
  await page.getByRole("button", { name: "Region", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Region", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".map-switcher")).toContainText("640 m");
  await page.getByRole("button", { name: "Inspect", exact: true }).click();
  await expect(page.locator(".focus-thumbnail .pixel-sprite")).toBeVisible();
  expect(
    await page.evaluate(() => (window as any).historySim.observe().clock),
  ).toBe(beforeMap);
  await page.screenshot({ path: "artifacts/roman-polished-context.png" });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "New world", exact: true }).click();
  await page.getByRole("button", { name: /Neolithic Anatolia/ }).click();
  await page.getByRole("button", { name: "Enter this world" }).click();
  await expect(
    page.getByRole("heading", { name: "Early farmer", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "artifacts/neolithic-first.png" });
  expect(errors).toEqual([]);
});
