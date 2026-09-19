import { expect, test } from "@playwright/test";

/**
 * The portrait blinks. Everything else in the bust is static, so sampling the
 * canvas over a few seconds and counting distinct frames is enough: if the
 * pixels never change, the timer is not running.
 */
test("the character portrait blinks", async ({ page }) => {
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
  const portrait = page.locator(".character-portrait canvas");
  await expect(portrait).toBeVisible();

  // Sample the eye band of the bust often enough to catch a ~180ms blink.
  const frames = await page.evaluate(async () => {
    const canvas = document.querySelector(
      ".character-portrait canvas",
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const seen = new Set<string>();
    const until = Date.now() + 26000;
    while (Date.now() < until) {
      const d = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height / 2)).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 17) h = (Math.imul(h, 31) + d[i]) >>> 0;
      seen.add(String(h));
      if (seen.size > 2) break;
      await new Promise((r) => setTimeout(r, 40));
    }
    return seen.size;
  });
  // Open, half and shut are three distinct frames; two proves it animates.
  expect(frames).toBeGreaterThan(1);

  // Clicking the portrait blinks it straight away, well inside the five
  // seconds the idle timer would otherwise wait.
  const onClick = await page.evaluate(async () => {
    const canvas = document.querySelector(
      ".character-portrait canvas",
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const band = () => {
      const d = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height / 2)).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 17) h = (Math.imul(h, 31) + d[i]) >>> 0;
      return h;
    };
    const open = band();
    canvas.click();
    const until = Date.now() + 1200;
    let changed = 0;
    while (Date.now() < until) {
      if (band() !== open) changed++;
      await new Promise((r) => setTimeout(r, 20));
    }
    return changed;
  });
  expect(onClick).toBeGreaterThan(0);
});
