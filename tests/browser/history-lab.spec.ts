import { test, expect } from "@playwright/test";

test("history inspector resolves dates, sources and exclusions without accessing the saved game", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() =>
    (window as any).historySim.act({
      actionId: "before-history",
      expectedRevision: 0,
      command: { type: "wait", seconds: 60 },
    }),
  );
  const before = await page.evaluate(() => (window as any).__uhs.engine.hash());
  await page.waitForTimeout(300);
  await page.goto("/history-lab");
  await expect(
    page.getByRole("heading", { name: "History & content lab" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Boolean((window as any).historySim || (window as any).__uhs),
    ),
  ).toBe(false);
  await page.getByLabel("Placement context").selectOption("household");
  await expect(page.getByTestId("content-prop.amphora")).toContainText(
    "excluded",
  );
  await page.getByLabel("Placement context").selectOption("market");
  await expect(page.getByTestId("content-prop.amphora")).toContainText(
    "included",
  );
  await page.screenshot({
    path: "artifacts/history-lab-roman.png",
    fullPage: true,
  });
  await page.getByLabel("Local profile").selectOption("moscow-transition");
  await expect(page.getByTestId("fact-authority")).toContainText("Soviet");
  await page.getByLabel("Day", { exact: true }).fill("25");
  await expect(page.getByTestId("fact-authority")).toContainText(
    "Russian Federation",
  );
  await expect(
    page.getByRole("heading", { name: "Contemporary", exact: true }),
  ).toBeVisible();
  const url = page.url();
  const report = await page.evaluate(() =>
    (window as any).historyLab.describe(),
  );
  await page.reload();
  await expect(page.getByTestId("fact-authority")).toContainText(
    "Russian Federation",
  );
  expect(page.url()).toBe(url);
  expect(
    await page.evaluate(() => (window as any).historyLab.describe()),
  ).toEqual(report);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export resolved JSON" }).click();
  expect((await downloaded).suggestedFilename()).toBe(
    "uhs-history-moscow-transition.json",
  );
  await page
    .getByRole("link", { name: "Return to world", exact: true })
    .click();
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(await page.evaluate(() => (window as any).__uhs.engine.hash())).toBe(
    before,
  );
  expect(errors).toEqual([]);
});

test("prehistoric hypotheses, missing coverage, mobile and malformed input remain explicit", async ({
  page,
}) => {
  await page.goto("/history-lab?place=konya");
  await expect(page.getByTestId("fact-language")).toContainText("hypothesis");
  await page.getByLabel("Allow hypotheses & game assumptions").uncheck();
  await expect(page.getByTestId("fact-language")).toContainText("Not adopted");
  await page.getByLabel("Allow hypotheses & game assumptions").check();
  await page.screenshot({
    path: "artifacts/history-lab-konya.png",
    fullPage: true,
  });
  await page.getByLabel("Culture family").selectOption("inner-eurasian");
  await page.getByLabel("Local profile").selectOption("eurasia-language-study");
  await expect(page.getByTestId("fact-language")).toContainText("Eurasiatic");
  await page.getByLabel("Culture family").selectOption("andean");
  await expect(page.getByTestId("history-coverage")).toContainText(
    "Unresearched",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/history-lab-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/history-lab?place=__proto__&year=100");
  await expect(page.getByRole("alert")).toContainText("Unknown place");
  await page.goto(
    "/history-lab?place=moscow-transition&year=1991&month=2&day=31",
  );
  await expect(page.getByRole("alert")).toContainText(
    "Invalid historical date",
  );
});
