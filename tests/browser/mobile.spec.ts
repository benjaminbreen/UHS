import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.setTimeout(180000);
test("pinch zooms the world and a tap still walks", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator(".game-container canvas");
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Begin", exact: true }).click();
    try {
      await canvas.waitFor({ timeout: 25000 });
      break;
    } catch {
      await page
        .getByRole("button", { name: "Random start", exact: true })
        .click();
    }
  }
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 40000 },
  );
  expect(
    await page.evaluate(() => {
      const game = (window as any).uhsGame;
      return {
        workers: (window as any).__vitals.now().counts.workers,
        shadows: ["nature-shadows", "prop-shadows", "lighting-shadows"].some(
          (key) => game.textures.exists(key),
        ),
        tiltShift: game.scene
          .getScene("world")
          .cameras.main.postPipelines.some(
            (pipeline: any) => pipeline.name === "TiltShift",
          ),
      };
    }),
  ).toEqual({ workers: 1, shadows: false, tiltShift: false });
  // Without this the browser pinch-zooms the page over the game instead.
  await expect(canvas).toHaveCSS("touch-action", "none");
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll("input,textarea,select")].every(
        (e) => parseFloat(getComputedStyle(e).fontSize) >= 16,
      ),
    ),
  ).toBe(true);

  const zoom = () => page.evaluate(() => (window as any).__uhs.zoom);
  const before = await zoom();
  const cdp = await page.context().newCDPSession(page);
  const cy = 400;
  const send = (type: string, points: { x: number; y: number; id: number }[]) =>
    cdp.send("Input.dispatchTouchEvent", {
      type: type as any,
      touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id })),
    });
  await send("touchStart", [
    { x: 155, y: cy, id: 1 },
    { x: 235, y: cy, id: 2 },
  ]);
  for (const d of [60, 90, 120, 150]) {
    await send("touchMove", [
      { x: 195 - d, y: cy, id: 1 },
      { x: 195 + d, y: cy, id: 2 },
    ]);
    await page.waitForTimeout(40);
  }
  const after = await zoom();
  await send("touchEnd", []);
  expect(after).toBeGreaterThan(before);
  // A pinch must not leave the player walking off toward the first finger.
  expect(await page.evaluate(() => (window as any).__uhs.running)).toBe(false);

  // A one-finger tap still walks.
  const pos = () =>
    page.evaluate(() => {
      const p = (window as any).__uhs.engine.state.player.pos;
      return `${p.x},${p.y}`;
    });
  const start = await pos();
  await send("touchStart", [{ x: 120, y: 250, id: 1 }]);
  await send("touchEnd", []);
  await expect.poll(pos, { timeout: 15000 }).not.toBe(start);
});
