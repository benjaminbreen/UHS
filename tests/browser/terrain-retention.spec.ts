import { test, expect } from "@playwright/test";

test("rasterised terrain survives a trip indoors", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "More info", exact: true }).click();
  await page.getByRole("button", { name: /Korean farmer/ }).click();
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 120_000,
  });
  await page.waitForTimeout(8000);
  const stat = async (k: string) => Number(await canvas.getAttribute(k));
  const before = await stat("data-terrain-chunk-count");
  const builtBefore = await stat("data-terrain-chunks-built");
  await page.evaluate(() => {
    const r = (window as any).__uhs;
    (window as any).__home = { ...r.engine.state.player.pos };
  });
  const go = (inside: boolean) =>
    page.evaluate((inside) => {
      const r = (window as any).__uhs,
        e = r.engine;
      const place = e.world.places.find((q: any) => e.doorOf(q.id)?.open);
      e.state.player.pos = inside
        ? { x: 6, y: 8, space: place.id }
        : { ...(window as any).__home };
      r.emit();
    }, inside);
  await go(true);
  await page.waitForTimeout(800);
  const indoors = await stat("data-terrain-chunk-count");
  await go(false);
  await page.waitForTimeout(500);
  const back = await stat("data-terrain-chunk-count");
  const builtBack = await stat("data-terrain-chunks-built");
  console.log(
    `CHUNKS before=${before} indoors=${indoors} back=${back} | rasterised before=${builtBefore} after=${builtBack}`,
  );
  // The regression this guards: disposing the stream indoors dropped every
  // rasterised chunk, so stepping back out re-streamed the settlement.
  // Streaming continues in the background, so the counts only ever grow; the
  // regression is the drop to zero.
  expect(before).toBeGreaterThan(0);
  expect(indoors).toBeGreaterThanOrEqual(before);
  expect(back).toBeGreaterThanOrEqual(indoors);
});
