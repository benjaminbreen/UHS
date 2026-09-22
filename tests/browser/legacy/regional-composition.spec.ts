import { test, expect } from "@playwright/test";
test("previews uninhabited river, ridge and basin geography", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [seed, landform, water] of [
    ["reach-17", "rolling", "river-ns"],
    ["ridge-check", "ridge", "none"],
    ["basin-check", "basin", "lake"],
  ]) {
    await page.goto(
      `/terrain-lab?seed=${seed}&ecology=grassland&landform=${landform}&population=none&start=wanderer&household=mixed&pattern=clustered&water=${water}&season=summer&year=-6499`,
    );
    await expect(
      page.getByRole("button", { name: "Play this world →" }),
    ).toBeEnabled({ timeout: 60000 });
    await page.screenshot({ path: `artifacts/regional-${landform}.png` });
  }
  expect(errors).toEqual([]);
});
