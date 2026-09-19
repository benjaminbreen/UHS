import { expect, test } from "@playwright/test";
import type { Runtime } from "../../src/runtime/session";

/** Review capture for the skills UI and the wide swing. */
test("captures the skills HUD, a level-up and a spin", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.UHS_URL ?? "/");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 75000,
  });
  await page.getByRole("tab", { name: "Skills" }).click();
  await page.screenshot({ path: "artifacts/combat/ui-skills.png" });
  // An ordinary gain, then a level.
  await page.evaluate(() => {
    const rt = (window as unknown as { uhs: Runtime }).uhs;
    rt.engine.state.player.health = 62;
    rt.engine.state.player.injury = {
      name: "gored leg",
      until: rt.engine.state.clock + 2.5 * 86400,
    };
    rt.engine.grantXp("hunting", 12);
    rt.emit();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "artifacts/combat/ui-gain.png" });
  await page.evaluate(() => {
    const rt = (window as unknown as { uhs: Runtime }).uhs;
    rt.engine.grantXp("hunting", 400);
    rt.emit();
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "artifacts/combat/ui-levelup.png" });
  await page.locator(".skill-row", { hasText: "Hunting" }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: "artifacts/combat/ui-skill-open.png" });
  // The wide swing, with sheep all round.
  await page.evaluate(() => {
    const rt = (window as unknown as { uhs: Runtime }).uhs;
    const e = rt.engine,
      p = e.state.player.pos;
    rt.devArm("stick");
    rt.devSpawnFauna("sheep", 3, "ordinary");
    const g = e.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
    [
      [1, 0],
      [-1, 0],
      [0, 1],
    ].forEach(([dx, dy], i) => {
      g.members[i].x = p.x + dx;
      g.members[i].y = p.y + dy;
    });
    rt.emit();
  });
  await page.locator(".game-container").focus();
  await page.keyboard.down("f");
  const box = (await canvas.boundingBox())!;
  const clip = {
    x: box.x + box.width / 2 - 200,
    y: box.y + box.height / 2 - 150,
    width: 400,
    height: 300,
  };
  await page.waitForTimeout(700);
  await page.screenshot({ path: "artifacts/combat/spin-0.png", clip });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "artifacts/combat/spin-1.png", clip });
  await page.keyboard.up("f");
  for (let i = 2; i < 8; i++)
    await page.screenshot({ path: `artifacts/combat/spin-${i}.png`, clip });
  // The tap that starts the hold scatters the flock, so the ring may find
  // nothing: what matters here is that the wide swing went off.
  const power = await page.evaluate(
    () => (window as unknown as { uhs: Runtime }).uhs.engine.lastSwing?.power,
  );
  expect(power).toBe(2);
  expect(errors).toEqual([]);
});
