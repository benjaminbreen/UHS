import { expect, test } from "@playwright/test";
test.use({ baseURL: process.env.TRAVEL_BASE_URL ?? "http://127.0.0.1:5173" });
const ready = async (page: import("@playwright/test").Page) => {
  await expect
    .poll(async () =>
      page
        .evaluate(() => {
          const d = (window as any).geographyLab?.describe();
          const from = (
            document.querySelector(
              'select[aria-label="Departure"]',
            ) as HTMLSelectElement
          )?.value;
          const to = (
            document.querySelector(
              'select[aria-label="Destination"]',
            ) as HTMLSelectElement
          )?.value;
          const year = Number(
            (
              document.querySelector(
                'input[aria-label="Year"]',
              ) as HTMLInputElement
            )?.value,
          );
          const spacing = Number(
            (
              document.querySelector(
                'input[aria-label="Landscape spacing"]',
              ) as HTMLInputElement
            )?.value,
          );
          return (
            !!d &&
            !d.busy &&
            d.result?.query.from === from &&
            d.result?.query.to === to &&
            d.result?.query.year === year &&
            d.result?.query.spacing === spacing
          );
        })
        .catch(() => false),
    )
    .toBe(true);
  await expect(page.getByRole("alert")).toHaveCount(0);
};
test("review routes, date changes, compression, and reciprocal cell inspection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/geography-lab");
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "The geography workshop" }),
  ).toBeVisible();
  await expect(
    page.locator(".geo-stop").filter({ hasText: "Oxford" }),
  ).toHaveCount(1);
  await page.getByLabel("Year", { exact: true }).fill("-4999");
  await ready(page);
  await expect(
    page.locator(".geo-stop").filter({ hasText: "Upper Thames valley" }),
  ).toBeVisible();
  await expect(
    page.locator(".geo-stop strong").filter({ hasText: /^Oxford$/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Morocco → Cairo → Delhi", exact: true })
    .click();
  await ready(page);
  const count = await page.locator(".geo-stop").count();
  expect(count).toBeGreaterThan(25);
  expect(count).toBeLessThan(50);
  await page.getByLabel("Landscape spacing").fill("180");
  await ready(page);
  expect(await page.locator(".geo-stop").count()).toBeGreaterThan(count);
  await page
    .getByRole("button", { name: "London → Oxford → Edinburgh", exact: true })
    .click();
  await ready(page);
  await page.locator(".geo-neighbors button").first().click();
  await expect(
    page.getByText("Adjacent geographic cell", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to selected stop" }).click();
  await page.getByLabel("Routing cells", { exact: true }).check();
  await page.screenshot({
    path: "artifacts/geography/britain.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Morocco → Cairo → Delhi", exact: true })
    .click();
  await ready(page);
  await page.screenshot({
    path: "artifacts/geography/morocco-india.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("supports share links and mobile review", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/geography-lab?preset=britain&year=-4999");
  await ready(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/geography/mobile.png",
    fullPage: true,
  });
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Year", { exact: true })).toHaveValue("-4999");
});
test("opens the existing terrain renderer with adjustable boundary overlays", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/geography-lab");
  await ready(page);
  await page.getByRole("button", { name: "Preview existing terrain" }).click();
  await expect(
    page.getByText(
      "Existing generator and renderer · gold outline shows proposed bounds",
    ),
  ).toBeVisible({ timeout: 75000 });
  await expect(page.locator(".geo-preview-canvas canvas")).toBeVisible();
  await page.getByLabel("Boundary size").selectOption("384");
  await page.getByRole("button", { name: "Fit bounds", exact: true }).click();
  await page.screenshot({ path: "artifacts/geography/local-bounds.png" });
  await page.getByRole("button", { name: "Close preview ×" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("plans mixed ocean journeys and clears obsolete waypoints and errors", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/geography-lab");
  await ready(page);
  await expect(page.getByLabel("Travel mode")).toHaveValue("mixed");
  await page
    .getByLabel("Departure", { exact: true })
    .selectOption("city-matamoros");
  await expect(page.getByLabel("Waypoints")).toHaveValue("");
  await page
    .getByLabel("Destination", { exact: true })
    .selectOption("city-dalian");
  await ready(page);
  await expect(
    page.locator(".geo-stop").filter({ hasText: "Board boat" }).first(),
  ).toBeVisible();
  await expect(
    page.locator(".geo-stop").filter({ hasText: "Landfall" }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/geography/mixed-ocean.png",
    fullPage: true,
  });
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Travel mode")).toHaveValue("mixed");
  await expect(page.getByLabel("Waypoints")).toHaveValue("");
  await page
    .getByLabel("Departure", { exact: true })
    .selectOption("area-iceland");
  await page
    .getByLabel("Destination", { exact: true })
    .selectOption("edinburgh");
  await ready(page);
  await page.getByLabel("Travel mode").selectOption("land");
  await expect(page.getByRole("alert")).toContainText("No land connection", {
    timeout: 20000,
  });
  await expect(
    page.getByText("Finding a geographic path…", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".geo-stats")).not.toContainText("1,436");
  await expect(page.locator(".geo-stats strong").first()).toHaveText("—");
  await expect(page.locator(".geo-stop")).toHaveCount(0);
  await page.getByLabel("Travel mode").selectOption("mixed");
  await ready(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("compresses ocean passages and shows regional US names", async ({
  page,
}) => {
  await page.goto(
    "/geography-lab?from=london&to=city-el-paso&via=&year=1300&spacing=180&mode=mixed",
  );
  await ready(page);
  const report = await page.evaluate(
    () => (window as any).geographyLab.describe().result,
  );
  expect(report.stops.length).toBeGreaterThanOrEqual(20);
  expect(report.stops.length).toBeLessThanOrEqual(35);
  expect(report.stops.filter((s: any) => s.water).length).toBeLessThanOrEqual(
    6,
  );
  await expect(
    page.locator(".geo-stop").filter({ hasText: "Piney Woods" }).first(),
  ).toBeVisible();
  await expect(
    page.locator(".geo-stop").filter({ hasText: "Chihuahuan Desert" }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/geography/london-el-paso.png",
    fullPage: true,
  });
});
test("inspects global naming coverage and unrelated regional labels", async ({
  page,
}) => {
  await page.goto(
    "/geography-lab?from=city-kyiv&to=city-florence&via=&year=1300&spacing=180&mode=mixed",
  );
  await ready(page);
  await expect(
    page.locator(".geo-stop").filter({ hasText: "Open countryside" }),
  ).toHaveCount(0);
  await page.getByText("Geographic naming coverage", { exact: true }).click();
  await page
    .getByRole("button", { name: "Check global naming coverage", exact: true })
    .click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (window as any).geographyLab.describe().audit?.samples.length ?? 0,
      ),
    )
    .toBeGreaterThan(3000);
  await expect(
    page.getByLabel("Show coverage: green specific · gold broad · red missing"),
  ).toBeChecked();
  await page.screenshot({
    path: "artifacts/geography/global-naming-coverage.png",
    fullPage: true,
  });
  await page
    .getByLabel("Show coverage: green specific · gold broad · red missing")
    .uncheck();
  await page.getByRole("button", { name: "Fit journey", exact: true }).click();
  await page.screenshot({
    path: "artifacts/geography/kyiv-florence-names.png",
    fullPage: true,
  });
});
test("previews dry terrain and a small island from their actual anchors", async ({
  page,
}) => {
  test.setTimeout(300000);
  for (const [id, mode, ecology] of [
    ["city-dulan", "mixed", "desert"],
    ["city-male", "sea", "tropical-woodland"],
  ]) {
    await page.goto(
      `/geography-lab?from=${id}&to=${id}&via=&year=1300&spacing=500&mode=${mode}`,
    );
    await ready(page);
    const stop = await page.evaluate(
      () => (window as any).geographyLab.describe().result.stops[0],
    );
    expect(stop.environment.ecology).toBe(ecology);
    expect(stop.environment.surface).toBe("land");
    await page
      .getByRole("button", { name: "Preview existing terrain" })
      .click();
    await expect(
      page.getByText(
        "Existing generator and renderer · gold outline shows proposed bounds",
      ),
    ).toBeVisible({ timeout: 75000 });
    await expect(page.locator(".geo-preview-canvas canvas")).toHaveAttribute(
      "data-terrain-ready", "true", { timeout: 120000 },
    );
    await page.screenshot({
      path: `artifacts/geography/environment-${id}.png`,
    });
    await page.getByRole("button", { name: "Close preview ×" }).click();
  }
});
