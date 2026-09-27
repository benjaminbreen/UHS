import { expect, test } from "@playwright/test";

test("task views browse the day without moving the player or opening game shortcuts", async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByPlaceholder(/A hunter in Anatolia/).fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 40000 });
  expect(await page.evaluate(() => (window as any).__uhs.engine.world.pack.setting.year)).toBe(100);
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await page.locator(".event-open").first().click();
  const task = page.locator(".tasks");
  await expect(task).toBeVisible();
  await expect(task).toHaveAttribute("data-settled", "true");
  const position = () => page.evaluate(() => ({ ...(window as any).__uhs.engine.state.player.pos }));
  const before = await position();
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowDown");
  await page.keyboard.press("i");
  expect(await position()).toEqual(before);
  await expect(page.getByRole("dialog", { name: "inventory", exact: true })).toHaveCount(0);
  const title = await task.locator("h1").textContent();
  await page.keyboard.press("ArrowRight");
  await expect(task.locator("h1")).not.toHaveText(title!);
  await page.screenshot({ path: "artifacts/integration-task-desktop.png", animations: "disabled" });
  await task.getByRole("button", { name: /View: Campfire/ }).click();
  await expect(task.getByRole("button", { name: /View: Close/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(task.getByRole("button", { name: "Close", exact: true })).toBeInViewport();
  await page.screenshot({ path: "artifacts/integration-task-mobile.png", animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(task).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const [id, prompt, landform, camp] of [
  ["island", "tiny desert island", "islet", "none"],
  ["pilot", "ww2 pilot downed, floating in atlantic", "open-ocean", "none"],
  ["everest", "Everest base camp", "local", "expedition"],
  ["roman", "Roman military camp", "local", "military"],
])
  test(`${id} starts through World Weaver`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Choose starting details" }).click();
    await page
      .getByRole("button", { name: "World Weaver", exact: false })
      .click();
    await page
      .getByPlaceholder("Describe a place, period, and character…")
      .fill(prompt);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Begin", exact: true })
      .click();
    await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
    await page.waitForFunction(() => !!(window as any).__uhs?.engine, null, {
      timeout: 150000,
    });
    await expect(
      page
        .getByLabel("Playable historical world.", { exact: false })
        .locator("canvas"),
    ).toHaveAttribute("data-terrain-ready", "true", { timeout: 120000 });
    await expect(
      page
        .getByLabel("Playable historical world.", { exact: false })
        .locator("canvas"),
    ).toHaveAttribute("data-terrain-pending", "0", { timeout: 120000 });
    const result = await page.evaluate(() => {
      const r = (window as any).__uhs,
        e = r.engine;
      return {
        situation: e.world.pack.setting.situation,
        year: e.world.pack.setting.year,
        afloat: e.state.player.afloat,
        places: e.world.places.length,
      };
    });
    expect(result.situation.landform).toBe(landform);
    expect(result.situation.camp).toBe(camp);
    if (id === "pilot") {
      expect(result.afloat).toBe("raft");
      expect(result.year).toBe(1944);
      const before = await page.evaluate(
        () => (window as any).__uhs.engine.state.player.pos.x,
      );
      await page.keyboard.down("ArrowRight");
      await expect
        .poll(() =>
          page.evaluate(() => (window as any).__uhs.engine.state.player.pos.x),
        )
        .toBeGreaterThan(before);
      await page.keyboard.up("ArrowRight");
    }
    await page.screenshot({ path: `artifacts/situation-${id}.png` });
    expect(errors).toEqual([]);
  });
