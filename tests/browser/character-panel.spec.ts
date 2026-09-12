import { expect, test } from "@playwright/test";

test("the character panel opens from the sidebar portrait and reads a person", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const begin = page.getByRole("button", { name: "Begin", exact: true });
  if (await begin.count()) await begin.click();
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 120000 },
  );
  await page.locator("button.character").click();
  const panel = page.locator(".character-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator("header h2")).not.toBeEmpty();
  await expect(panel.locator(".ability-list li").first()).toBeVisible();
  await expect(panel.locator("footer span")).not.toBeEmpty();
  await page.screenshot({ path: "artifacts/character-panel-player.png" });

  await panel.getByRole("tab", { name: "Abilities" }).click();
  await expect(panel.locator(".stat-bars li")).toHaveCount(9);
  await panel.getByRole("tab", { name: "Beliefs" }).click();
  await expect(panel.locator(".powers li").first()).toBeVisible();
  await page.screenshot({ path: "artifacts/character-panel-beliefs.png" });
  await panel.getByRole("tab", { name: "Household" }).click();
  await expect(panel.locator(".character-tab")).toBeVisible();
  await page.screenshot({ path: "artifacts/character-panel-household.png" });
  await panel.getByRole("tab", { name: "Profile" }).click();

  // A neighbour: the same panel, plus the things you can do with them.
  await panel.getByRole("button", { name: "Close" }).click();
  await expect(panel).toHaveCount(0);
  const clear = page.getByRole("button", { name: "Clear selection" });
  if (await clear.count()) await clear.click();
  const around = page.getByRole("tab", { name: "Around you" });
  if (!(await around.count())) return;
  await around.click();
  const neighbour = page.locator(".nearby-list button").first();
  if (await neighbour.count()) {
    await neighbour.click();
    await expect(panel).toBeVisible();
    await expect(panel.locator(".day-plan li").first()).toBeVisible();
    // Only while they are still in sight: the list is the engine's own.
    if (await panel.locator(".available").count())
      await expect(panel.locator(".available button").first()).toBeVisible();
    await page.screenshot({ path: "artifacts/character-panel-neighbour.png" });
  }
  expect(errors).toEqual([]);
});
