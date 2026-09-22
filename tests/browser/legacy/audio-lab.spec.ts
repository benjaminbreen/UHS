import { test, expect } from "@playwright/test";

test("audio studio plays, mixes, exports and closes without changing the world", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const before = await page.evaluate(() => (window as any).__uhs.engine.hash());
  await page.keyboard.press("Meta+Digit1");
  const dialog = page.getByRole("dialog", {
    name: "A soundtrack for the journey",
  });
  await expect(dialog).toBeVisible();
  await page.getByLabel("Music season").selectOption("winter");
  await page
    .getByRole("button", { name: "Music time: night", exact: true })
    .click();
  await expect(page.getByLabel("Follow world clock")).not.toBeChecked();
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".audio-time")).not.toHaveText(/^0:00 /, {
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Chamber", exact: true }).click();
  await page.getByLabel("melody level").fill("0.25");
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  const time = await page.locator(".audio-time").textContent();
  await page.waitForTimeout(500);
  expect(await page.locator(".audio-time").textContent()).toBe(time);
  await page.getByRole("button", { name: "Reset mix", exact: true }).click();
  await expect(page.getByLabel("melody level")).toHaveValue("1");
  await page
    .getByRole("button", { name: "Mute all audio", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Unmute all audio", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Unmute all audio", exact: true })
    .click();
  await page.getByRole("tab", { name: /Sound effects/ }).click();
  for (const name of [
    "Footstep · earth",
    "Water · ripple",
    "Interface · select",
    "Gather · found",
    "Door · wood",
    "Time · passing",
  ])
    await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("tab", { name: /Overworld music/ }).click();
  const download = page.waitForEvent("download", { timeout: 45000 });
  await page.getByRole("button", { name: "WAV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "snow-lanterns-winter-night-chamber.wav",
  );
  await page.screenshot({ path: "artifacts/audio-studio.png" });
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => (window as any).__uhs.engine.hash())).toBe(
    before,
  );
  await page.getByLabel("Follow world clock").check();
  await expect(page.getByLabel("Music season")).toHaveValue("spring");
  await expect(
    page.getByRole("button", { name: "Music time: day", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await page.keyboard.press("Meta+Digit1");
  await expect(dialog).not.toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Audio studio", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".audio-time")).not.toHaveText(/^0:00 /);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("studio fits a phone and the shortcut works while editing a control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Audio studio", exact: true }).click();
  await page.getByLabel("Music season").selectOption("autumn");
  await page.getByLabel("Music season").focus();
  await page.keyboard.press("Control+Digit1");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.keyboard.press("Control+Digit1");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".audio-lab")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/audio-studio-mobile.png" });
  await page.getByLabel("Music volume", { exact: true }).fill("0.2");
  await page
    .getByRole("button", { name: "Mute all audio", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Audio studio", exact: true }).click();
  await expect(page.getByLabel("Music volume", { exact: true })).toHaveValue(
    "0.2",
  );
  await expect(
    page.getByRole("button", { name: "Unmute all audio", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeVisible();
});
