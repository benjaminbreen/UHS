import { expect, test } from "@playwright/test";

/** Opens the same city twice and reports how long each took to become
 * ready. The second visit should come from the prepared-settlement cache.
 *   UHS_CITY_URL=http://127.0.0.1:5173 npx playwright test tests/browser/load-time.spec.ts */
test("a revisited city opens from the cache", async ({ page }) => {
  test.setTimeout(300000);
  const place = process.env.UHS_PLACE ?? "city-miami",
    year = process.env.UHS_YEAR ?? "2001";
  const url = `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173"}/terrain-lab?place=${place}&seed=load-time&ecology=temperate-woodland&year=${year}&pattern=dense&population=settled&landform=rolling&start=resident`;
  const times: number[] = [];
  for (let visit = 0; visit < 2; visit++) {
    const t0 = Date.now();
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
        "true",
      {},
      { timeout: 240000 },
    );
    times.push(Date.now() - t0);
  }
  console.log(`load ms first ${times[0]} second ${times[1]}`);
  expect(times[1]).toBeLessThan(times[0]);
});
