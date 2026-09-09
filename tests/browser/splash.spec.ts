import { test, expect } from "@playwright/test";

const starts = [
  {
    name: "Neolithic hunter",
    year: -6999,
    role: "Hunter",
    location: "Konya plain",
  },
  { name: "Roman legionary", year: -19, role: "Legionary", location: "Umbria" },
  { name: "Korean farmer", year: 1750, role: "Farmer", location: "Seoul" },
  {
    name: "Haitian farmer",
    year: 1820,
    role: "Farmer",
    location: "Haitian countryside",
  },
];
test("opens on the splash without creating a simulation; details and mobile layout work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByAltText("Universal History Simulator")).toBeVisible();
  expect(await page.evaluate(() => !!(window as any).historySim)).toBe(false);
  await page.getByRole("button", { name: "Choose starting details" }).click();
  await expect(
    page.getByRole("dialog", { name: "Create a world" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Random start", exact: true }),
  ).toBeVisible();
});
for (const start of starts)
  test(`${start.name} opens its specified setting`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByRole("button", { name: new RegExp(start.name) }).click();
    await page.waitForFunction(() => !!(window as any).historySim, null, {
      timeout: 75000,
    });
    const actual = await page.evaluate(() => {
      const runtime = (window as any).historySim;
      return {
        setting: runtime.observe().manifest.setting,
        role: runtime.observe().player.role,
      };
    });
    expect(actual.setting.year).toBe(start.year);
    expect(actual.setting.location).toBe(start.location);
    expect(actual.role).toBe(start.role);
    await expect(page.locator(".game-container canvas")).toBeVisible({
      timeout: 15000,
    });
    expect(errors).toEqual([]);
  });
test("Random start previews characters and Begin preserves the selected character", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: "Random start", exact: true }).click();
  const preview = page.getByLabel("Selected start");
  await expect(preview).toBeVisible();
  const first = await preview.textContent();
  expect(await page.evaluate(() => !!(window as any).historySim)).toBe(false);
  await page.getByRole("button", { name: "Random start", exact: true }).click();
  await expect(preview).not.toHaveText(first!);
  const name = await preview.locator("strong").innerText();
  await page.getByRole("button", { name: "Choose starting details" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByLabel("Selected start").locator("strong"),
  ).toHaveText(name);
  await dialog.getByRole("button", { name: "Begin", exact: true }).click();
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 75000,
  });
  const firstPlayer = await page.evaluate(
    () => (window as any).historySim.observe().player,
  );
  expect(firstPlayer.name).toBe(name);
  expect(firstPlayer.appearance).toBeDefined();
  await page.reload();
  await expect(page.getByAltText("Universal History Simulator")).toBeVisible();
  expect(await page.evaluate(() => !!(window as any).historySim)).toBe(false);
  await page.getByRole("button", { name: "Random start", exact: true }).click();
  await expect(preview).toBeVisible();
  const nextName = await preview.locator("strong").innerText();
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 75000,
  });
  const nextPlayer = await page.evaluate(
    () => (window as any).historySim.observe().player,
  );
  expect(nextPlayer.name).toBe(nextName);
  expect(nextPlayer.appearance).not.toEqual(firstPlayer.appearance);
});

test("World Weaver Begin fits within a laptop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.getByRole("button", { name: "Choose starting details" }).click();
  const dialog = page.getByRole("dialog");
  const begin = dialog.getByRole("button", { name: "Begin", exact: true });
  await expect(begin).toBeVisible();
  const bounds = await begin.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(700);
  expect(
    await dialog.evaluate((e) => e.scrollHeight <= e.clientHeight + 2),
  ).toBe(true);
});

test("typed prompt begins a world and unrecognized text stays editable", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByLabel("Who will you be?").fill("An unknown place");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Create a world" }),
  ).toBeVisible();
  await expect(page.getByLabel("Describe your starting situation")).toHaveValue(
    "An unknown place",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Who will you be?").fill("Farmer in Seoul 1750");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 75000,
  });
  const observation = await page.evaluate(() =>
    (window as any).historySim.observe(),
  );
  expect(observation.manifest.setting.location).toBe("Seoul");
  expect(observation.player.role).toBe("Farmer");
});
