import { expect, test } from "@playwright/test";

test("compact signs render all regional frames and directional shadows", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/prop-lab");
  await page.getByLabel("Find a prop").fill("Compact sign");
  await expect(page.locator(".prop-card")).toHaveCount(7);
  for (const style of [
    "oak",
    "painted",
    "iron",
    "lacquer",
    "split",
    "pennant",
    "bazaar",
  ]) {
    await page.getByTestId(`prop-signpost-${style}`).click();
    await page
      .getByRole("button", {
        name: style === "lacquer" ? "Tea cup" : "Shears",
        exact: true,
      })
      .click();
    await expect(page.locator(".prop-detail-stage canvas")).toHaveAttribute(
      "data-ready",
      "true",
    );
  }
  const canvas = page.locator(".prop-detail-stage canvas");
  const pixels = () => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByLabel("Shadow study").selectOption("morning");
  const morning = await pixels();
  await page.getByLabel("Shadow study").selectOption("afternoon");
  await expect.poll(pixels).not.toBe(morning);
  await page.screenshot({
    path: "artifacts/signage-concepts/browser-gallery.png",
  });
  expect(errors).toEqual([]);
});

for (const [query, style, slug] of [
  ["London 1308", "oak", "london"],
  ["Beijing 1880", "lacquer", "beijing"],
])
  test(`${query} uses compact trade signs beside clear entrances`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.waitForFunction(
      () =>
        !!(document.querySelector("#opening-prompt") as HTMLInputElement)
          ?.value,
    );
    await page.getByPlaceholder("A hunter in Anatolia, 7000 BCE").fill(query);
    await page.getByRole("button", { name: "Begin", exact: true }).click();
    await expect(page.locator(".game-container canvas")).toHaveAttribute(
      "data-ready",
      "true",
      { timeout: 120000 },
    );
    const result = await page.evaluate(() => {
      const r = (window as any).__uhs,
        e = r.engine;
      const signs = e.state.objects.filter((o: any) =>
        o.prop?.startsWith("signpost-"),
      );
      const places = e.world.places;
      const bad = signs.filter((o: any) =>
        places.some(
          (b: any) =>
            b.entrance.x === o.pos.x && Math.abs(b.entrance.y - o.pos.y) <= 1,
        ),
      );
      const sign = signs.find((o: any) => o.sprite.endsWith("-1")) ?? signs[0];
      if (sign) {
        e.state.player.pos = { ...sign.pos, y: sign.pos.y + 2 };
        r.select();
        r.emit();
      }
      return {
        count: signs.length,
        places: places.length,
        bad: bad.length,
        sprites: signs.map((o: any) => o.sprite),
        revision: e.state.manifest.setting.signageRevision,
      };
    });
    expect(result.revision).toBe(1);
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBeLessThan(result.places / 2);
    expect(result.bad).toBe(0);
    expect(
      result.sprites.every((s: string) =>
        s.startsWith(`study-propb-signpost-${style}-`),
      ),
    ).toBe(true);
    await expect(page.locator(".game-container canvas")).toBeVisible();
    await page.screenshot({
      path: `artifacts/signage-concepts/browser-${slug}.png`,
    });
    expect(errors).toEqual([]);
  });
