import { expect, test } from "@playwright/test";
import type { Runtime } from "../../src/runtime/session";

/** Review capture, not an assertion suite: stages one blow with the dev
 * handle and saves the frames around the contact to artifacts/combat. */
test("captures a hit, a knockback and a kill", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.UHS_URL ?? "/");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 75000,
  });
  const stage = (species: string, weapon: string) =>
    page.evaluate(
      ([species, weapon]) => {
        const rt = (window as unknown as { uhs: Runtime }).uhs;
        const e = rt.engine,
          p = e.state.player;
        rt.devClearFauna();
        rt.devArm(weapon);
        rt.devSpawnFauna(species, 1, "ordinary");
        const g = e.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
        p.direction = 1;
        g.members[0].x = p.pos.x + 1;
        g.members[0].y = p.pos.y;
        rt.emit();
      },
      [species, weapon],
    );
  const swing = () =>
    page.evaluate(() => {
      const rt = (window as unknown as { uhs: Runtime }).uhs;
      rt.propAction("KeyF");
      return rt.engine.lastSwing?.creatures;
    });
  const box = (await canvas.boundingBox())!;
  const clip = {
    x: box.x + box.width / 2 - 220,
    y: box.y + box.height / 2 - 160,
    width: 440,
    height: 320,
  };
  for (const [species, weapon] of [
    ["sheep", "stick"],
    ["rabbit", "axe"],
  ]) {
    await stage(species, weapon);
    await page.waitForTimeout(500);
    const hits = await swing();
    expect(hits?.length).toBe(1);
    for (let i = 0; i < 8; i++)
      await page.screenshot({
        path: `artifacts/combat/${species}-${i}.png`,
        clip,
      });
  }
  // A bird goes up in feathers.
  await stage("rock-dove", "axe");
  await page.evaluate(() => {
    const rt = (window as unknown as { uhs: Runtime }).uhs;
    const g = rt.engine.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
    g.members[0].hp = 1;
  });
  await page.waitForTimeout(400);
  const dove = await swing();
  expect(dove?.[0]?.feathered).toBe(true);
  expect(dove?.[0]?.killed).toBe(true);
  for (let i = 0; i < 8; i++)
    await page.screenshot({ path: `artifacts/combat/dove-${i}.png`, clip });
  // A boar, struck once, squares up and comes.
  await page.evaluate(() => {
    const rt = (window as unknown as { uhs: Runtime }).uhs;
    const e = rt.engine,
      p = e.state.player;
    rt.devClearFauna();
    rt.devSpawnFauna("wild-boar", 1, "very-strong");
    const g = e.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
    p.direction = 1;
    g.members[0].x = p.pos.x + 1;
    g.members[0].y = p.pos.y;
    rt.emit();
  });
  await page.waitForTimeout(400);
  await swing();
  for (let i = 0; i < 16; i++) {
    await page.screenshot({ path: `artifacts/combat/boar-${i}.png`, clip });
    await page.waitForTimeout(120);
  }
  const health = await page.evaluate(
    () =>
      (window as unknown as { uhs: Runtime }).uhs.engine.state.player.health,
  );
  expect(health ?? 100).toBeLessThan(100);
  expect(errors).toEqual([]);
});
