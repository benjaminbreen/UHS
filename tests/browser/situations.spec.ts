import { expect, test } from "@playwright/test";
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
