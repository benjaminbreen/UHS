import { test, expect } from "@playwright/test";

test("graphics lab is reproducible across construction families and leaves the journey untouched", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() =>
    (window as any).historySim.act({
      actionId: "before-lab",
      expectedRevision: 0,
      command: { type: "wait", seconds: 60 },
    }),
  );
  const before = await page.evaluate(() => (window as any).__uhs.engine.hash());
  await page.waitForTimeout(300);
  await page.goto("/graphics-lab?study=classical&bank=masonry");
  const ready = () =>
    expect(page.getByTestId("lab-canvas")).toHaveAttribute(
      "data-ready",
      "true",
    );
  await ready();
  expect(await page.evaluate(() => Boolean((window as any).historySim))).toBe(
    false,
  );
  for (const family of [
    "classical",
    "mudbrick",
    "timber",
    "courtyard",
    "board",
    "mixed",
  ]) {
    await page.getByLabel("Construction family").selectOption(family);
    await ready();
    expect(
      await page.evaluate(
        () => (window as any).graphicsLab.describe().renderer,
      ),
    ).toBe("WorldScene");
    if (["classical", "mudbrick", "mixed"].includes(family))
      await page.screenshot({ path: `artifacts/lab-${family}.png` });
  }
  await page.getByLabel("Landscape", { exact: true }).selectOption("earth");
  await ready();
  await page.getByLabel("Show footprints & anchors").check();
  await ready();
  await page.getByLabel("Light treatment").selectOption("dusk");
  await ready();
  await page.getByLabel("Frame", { exact: true }).selectOption("square");
  await ready();
  const square = await page.getByTestId("lab-canvas").boundingBox();
  expect(Math.abs(square!.width - square!.height)).toBeLessThan(2);
  await page.getByLabel("Frame", { exact: true }).selectOption("portrait");
  await ready();
  await page.getByRole("button", { name: "Pan ←", exact: true }).click();
  await ready();
  const portrait = await page.getByTestId("lab-canvas").boundingBox();
  expect(Math.abs(portrait!.width / portrait!.height - 9 / 16)).toBeLessThan(
    0.01,
  );
  await page.screenshot({ path: "artifacts/lab-contract-portrait.png" });
  const url = page.url();
  await page.waitForTimeout(150);
  const frozen = await page.getByTestId("lab-canvas").screenshot();
  await page.reload();
  await ready();
  await page.waitForTimeout(150);
  expect(await page.getByTestId("lab-canvas").screenshot()).toEqual(frozen);
  expect(page.url()).toBe(url);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save PNG", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await page.getByRole("link", { name: "Return to world →" }).click();
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(await page.evaluate(() => (window as any).__uhs.engine.hash())).toBe(
    before,
  );
  expect(errors).toEqual([]);
});

test("generated settlement studies and narrow controls render without overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const family of ["classical", "mudbrick"]) {
    await page.goto(
      `/graphics-lab?study=${family}&scene=settlement&bank=${family === "classical" ? "masonry" : "earth"}&zoom=3`,
    );
    await expect(page.getByTestId("lab-canvas")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await page.screenshot({ path: `artifacts/lab-${family}-settlement.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Construction family")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Construction family").selectOption("courtyard");
  await expect(page.getByTestId("lab-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(errors).toEqual([]);
});
