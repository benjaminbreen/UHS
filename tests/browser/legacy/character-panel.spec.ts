import { expect, test } from "@playwright/test";

test("the character panel opens from the sidebar portrait and reads a person", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  // A fixed start: a random one can land on a modern city that takes minutes
  // to build, and this spec is about the panel, not world generation.
  const choose = page.getByRole("button", { name: "Choose starting details" });
  if (await choose.count()) {
    await choose.click();
    await page.getByLabel("Place", { exact: true }).selectOption("congo");
    await page.getByLabel("Starting year", { exact: true }).fill("1300");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Begin", exact: true })
      .click();
  }
  // The splash's settings dialog may either launch immediately or return the
  // configured start to the splash, depending on the selected creation mode.
  const splashBegin = page.locator(".splash-begin");
  if (
    !(await page.getByRole("dialog").count()) &&
    (await splashBegin.isVisible())
  )
    await splashBegin.click();
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
  // The player can put a wearable on and take it off again. The dev build
  // exposes the runtime, so the test hands the player a cap first.
  await page.evaluate(() => {
    const runtime = (
      window as unknown as {
        __uhs: {
          engine: { state: { player: { inventory: Record<string, number> } } };
          emit: () => void;
        };
      }
    ).__uhs;
    runtime.engine.state.player.inventory["headwear-cap"] = 1;
    runtime.emit();
  });
  const removable = panel.locator(".belongings.worn button:not(:disabled)");
  const wornBefore = await removable.count();
  const goods = panel.locator(".belongings:not(.worn) button");
  for (let i = 0; i < (await goods.count()); i++) {
    await goods.nth(i).click();
    if (await panel.getByRole("button", { name: "Wear" }).isVisible()) break;
  }
  await panel.getByRole("button", { name: "Wear" }).click();
  await expect(removable).toHaveCount(wornBefore + 1);
  await panel.getByRole("button", { name: "Take off Cap" }).click();
  await expect(removable).toHaveCount(wornBefore);
  await page.screenshot({ path: "artifacts/character-panel-player.png" });

  await panel.getByRole("tab", { name: "Abilities" }).click();
  await expect(panel.locator(".stat-bars li")).toHaveCount(9);
  await panel.getByRole("tab", { name: "Beliefs" }).click();
  await expect(panel.locator(".belief-layout")).toBeVisible();
  await expect(panel.locator(".power-node").first()).toBeVisible();
  expect(await panel.locator(".power-node").count()).toBeLessThanOrEqual(8);
  await expect(panel.locator(".power-detail h1")).not.toBeEmpty();
  const otherPower = panel.locator(".power-node").nth(1);
  if (await otherPower.count()) {
    const name = (await otherPower.locator("strong").textContent()) ?? "";
    await otherPower.click();
    await expect(panel.locator(".power-detail h1")).toHaveText(name);
  }
  for (const path of await panel.locator(".power-map path").all()) {
    expect(await path.getAttribute("d")).toMatch(
      /^M [\d.]+ [\d.]+ V [\d.]+ H [\d.]+ V [\d.]+$/,
    );
  }
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

test("Russian Orthodox belief shows the Trinity and five holy figures", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  await page.getByRole("button", { name: "Choose starting details" }).click();
  await page
    .getByLabel("Place", { exact: true })
    .selectOption("area-ural-mountains");
  await page.getByLabel("Starting year", { exact: true }).fill("1750");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Begin", exact: true })
    .click();
  const splashBegin = page.locator(".splash-begin");
  if (
    !(await page.getByRole("dialog").count()) &&
    (await splashBegin.isVisible())
  )
    await splashBegin.click();
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 120000 },
  );
  await page.locator("button.character").click();
  const panel = page.locator(".character-panel");
  await panel.getByRole("tab", { name: "Beliefs" }).click();
  await expect(panel.locator(".belief-intro h1")).toHaveText(
    "Russian Orthodox Christianity in Siberia",
  );
  await expect(panel.locator('.power-node[data-tier="primary"]')).toHaveCount(
    3,
  );
  await expect(panel.locator('.power-node[data-tier="secondary"]')).toHaveCount(
    5,
  );
  await expect(panel.locator(".power-node strong")).toHaveText([
    "God the Father",
    "Jesus Christ, the Son",
    "The Holy Spirit",
    "The Theotokos",
    "Saint Nicholas",
    "Peter and Paul",
    "Saint George",
    "Archangel Michael",
  ]);
  await page.screenshot({ path: "artifacts/character-panel-orthodox.png" });
});
