import { test, expect } from "@playwright/test";
test("procedural explorer previews environments and plays the identical world", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.log("pageerror", e.stack);
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.log("console", m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) console.log("HTTP", r.status(), r.url());
  });
  await page.goto("/terrain-lab");
  await expect(
    page.getByRole("button", { name: "Play this world →" }),
  ).toBeEnabled({ timeout: 60000 });
  const initial = await page.evaluate(() =>
    (window as any).terrainLab.describe(),
  );
  expect(initial.households.length).toBeGreaterThan(0);
  expect(initial.resources).toBeGreaterThan(0);
  await page.screenshot({ path: "artifacts/procedural-woodland.png" });
  await page
    .getByRole("button", { name: "Uninhabited coast", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play this world →" }),
  ).toBeEnabled({ timeout: 60000 });
  const before = await page.evaluate(() => {
    const e = (window as any).terrainLab.runtime.engine;
    return {
      hash: e.hash(),
      spawn: e.world.spawn,
      households: e.state.households?.length,
      setting: e.state.manifest.setting,
    };
  });
  expect(before.households).toBe(0);
  expect(before.setting.environment.start).toBe("wanderer");
  await page.screenshot({ path: "artifacts/procedural-coast.png" });
  await page.getByRole("button", { name: "Play this world →" }).click();
  await expect(page.locator('canvas[data-ready="true"]')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__uhs.engine.hash())).toBe(
    before.hash,
  );
  await page
    .getByRole("button", { name: "Back to procedural explorer" })
    .click();
  await page
    .getByRole("button", { name: "Tundra shepherd", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play this world →" }),
  ).toBeEnabled({ timeout: 60000 });
  expect(
    await page.evaluate(
      () =>
        (window as any).terrainLab.runtime.engine.state.actors.filter(
          (a: any) => a.owner === "player",
        ).length,
    ),
  ).toBeGreaterThan(0);
  await page.screenshot({ path: "artifacts/procedural-tundra.png" });
  for (const name of ["Desert camp", "Tropical waterfront", "Dense town"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Play this world →" }),
    ).toBeEnabled({ timeout: 60000 });
    const result = await page.evaluate(() =>
      (window as any).terrainLab.describe(),
    );
    expect(result.households.length).toBeGreaterThan(0);
    await page.screenshot({
      path: `artifacts/procedural-${name.toLowerCase().replaceAll(" ", "-")}.png`,
    });
  }
  await page.getByLabel("Map overlay").selectOption("height");
  await expect(
    page.getByRole("button", { name: "Play this world →" }),
  ).toBeEnabled({ timeout: 60000 });
  await page.getByRole("button", { name: "Play this world →" }).click();
  await expect(page.locator('canvas[data-ready="true"]')).toBeVisible();
  const simulation = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    const t = performance.now();
    const r = rt.command({ type: "wait", seconds: 300 });
    return { status: r.status, ms: performance.now() - t };
  });
  expect(simulation.status).toBe("completed");
  console.log("Dense-town five-minute runtime command", simulation);
  expect(errors).toEqual([]);
});
