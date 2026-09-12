import { expect, test } from "@playwright/test";

test("portrait lab compares one recipe across two renderer slots", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/portrait-lab");
  await expect(
    page.getByRole("heading", { name: /Portrait lab/ }),
  ).toBeVisible();
  await expect(page.locator(".portrait-contact-sheet canvas")).toHaveCount(12);
  await expect(page.locator(".portrait-stage canvas")).toHaveCount(3);

  const stages = page.locator(".portrait-stage canvas");
  const before = await Promise.all(
    [0, 1, 2].map((i) => stages.nth(i).screenshot()),
  );
  await page.getByLabel("Eye size").selectOption("large");
  for (const i of [0, 1, 2])
    expect((await stages.nth(i).screenshot()).equals(before[i])).toBe(false);

  await page.getByRole("tab", { name: "A only" }).click();
  await expect(
    page.getByRole("heading", { name: "A · Layered portrait" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /^B · / })).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/portrait-lab/layered-v1.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "C only" }).click();
  await expect(page.getByRole("heading", { name: /^C · / })).toBeVisible();
  const stageData = () =>
    page
      .locator(".portrait-stage canvas")
      .evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(200);
  const cBefore = await stageData();
  const jaw = page.getByRole("slider", { name: "Jaw width" });
  await jaw.focus();
  for (let i = 0; i < 4; i++) await jaw.press("ArrowRight");
  await expect(jaw).toHaveValue("2");
  await page.waitForTimeout(200);
  expect(await stageData()).not.toBe(cBefore);
  await expect(page.getByText('"jawWidth": 2')).toBeVisible();
  await page.getByRole("button", { name: "Reset construction" }).click();
  await expect(jaw).toHaveValue("0");
  await page.waitForTimeout(200);
  expect(await stageData()).toBe(cBefore);

  for (const [tab, file] of [
    ["B only", "three-quarter-v1"],
    ["C only", "constructed-v1"],
  ]) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.locator(".portrait-contact-sheet canvas")).toHaveCount(
      12,
    );
    await page.screenshot({
      path: `artifacts/portrait-lab/${file}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("settings opens the portrait lab with live-world characters", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
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
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 120000 },
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "settings", exact: true });
  await settings.getByRole("tab", { name: "Developer" }).click();
  await settings
    .getByRole("button", { name: /Portrait lab · facial recipes/ })
    .click();
  await expect(
    page.getByRole("heading", { name: /Portrait lab/ }),
  ).toBeVisible();
  const characterSelect = page.locator(".portrait-controls select").first();
  await expect(characterSelect).toBeVisible();
  expect(await characterSelect.locator("option").count()).toBeGreaterThan(12);
  await page.getByRole("button", { name: "Back to world ×" }).click();
  await expect(page.locator(".portrait-lab")).toHaveCount(0);
});
