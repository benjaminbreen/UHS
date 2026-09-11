import { test, expect } from "@playwright/test";

test("Space tap/hold, pickup/drop, focus cancellation and Shift running", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "More info", exact: true }).click();
  await page.getByRole("button", { name: /Neolithic hunter/ }).click();
  await expect(
    page.locator('.game-container canvas[data-ready="true"]'),
  ).toBeVisible({ timeout: 90000 });
  await page.screenshot({ path: "artifacts/controls/world.png" });
  const setup = async () => {
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const r = (window as any).__uhs,
        e = r.engine;
      if (!(window as any).controlOrigin) {
        const p = e.state.player.pos;
        for (let dy = -4; dy <= 4 && !(window as any).controlOrigin; dy++)
          for (let dx = -4; dx <= 4; dx++) {
            const candidate = { ...p, x: p.x + dx, y: p.y + dy };
            if (
              e.world.places.every(
                (b: any) =>
                  Math.hypot(
                    b.entrance.x - candidate.x,
                    b.entrance.y - candidate.y,
                  ) > 3,
              )
            ) {
              (window as any).controlOrigin = candidate;
              break;
            }
          }
        if (!(window as any).controlOrigin)
          throw Error("No input fixture away from doorways");
      }
      r.stop(false);
      e.state.player.pos = { ...(window as any).controlOrigin };
      e.state.player.direction = 1;
      delete e.state.player.held;
      e.state.actors = [];
      e.state.objects = [];
      e.world.blocked = () => false;
      e.world.canCross = () => true;
      e.world.topography = () => ({ height: 0, surface: "grass" });
      e.world.elevation = () => 0;
      e.terrainCollision.clear();
      r.selected = undefined;
      r.emit();
      (window as any).controlLogStart = e.state.log.length;
    });
    await page.locator(".game-container").focus();
  };
  const moves = () =>
    page.evaluate(() => {
      const e = (window as any).__uhs.engine;
      return e.state.log
        .slice((window as any).controlLogStart)
        .map((r: any) => r.command)
        .filter((c: any) => c.type === "move");
    });
  const x = () =>
    page.evaluate(
      () =>
        (window as any).__uhs.engine.state.player.pos.x -
        (window as any).controlOrigin.x,
    );
  await setup();
  await page.keyboard.press("Space");
  await expect.poll(x).toBe(2);
  expect(await moves()).toEqual([
    { type: "move", dx: 1, dy: 0, jump: "short" },
  ]);
  await setup();
  await page.keyboard.down("Space");
  await page.waitForTimeout(700);
  expect(await x()).toBe(3);
  expect(await moves()).toEqual([{ type: "move", dx: 1, dy: 0, jump: "long" }]);
  await page.keyboard.up("Space");
  await setup();
  await page.evaluate(() => {
    const e = (window as any).__uhs.engine;
    e.state.objects.push({
      id: "input-pot",
      prop: "pot",
      kind: "container",
      name: "Input pot",
      sprite: "pot",
      pos: { ...e.state.player.pos },
      inventory: {},
    });
    (window as any).__uhs.emit();
  });
  await page.keyboard.press("Space");
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__uhs.engine.state.player.held),
    )
    .toBe("input-pot");
  await page.keyboard.down("Space");
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(() => ({
      held: (window as any).__uhs.engine.state.player.held,
      notice: (window as any).__uhs.notice,
      commands: (window as any).__uhs.engine.state.log
        .slice(-3)
        .map((r: any) => r.command),
    })),
  ).toMatchObject({ held: undefined });
  expect(await moves()).toEqual([]);
  await page.keyboard.up("Space");
  await setup();
  await page.keyboard.down("Space");
  await page.getByRole("textbox").first().focus();
  await page.waitForTimeout(300);
  await page.keyboard.up("Space");
  expect(await moves()).toEqual([]);
  await setup();
  await page.keyboard.down("d");
  await page.waitForTimeout(700);
  await page.keyboard.up("d");
  const walked = (await moves()).length;
  await setup();
  await page.keyboard.down("Shift");
  await page.keyboard.down("d");
  await page.waitForTimeout(700);
  await page.keyboard.up("d");
  await page.keyboard.up("Shift");
  const ran = await moves();
  expect(ran.length).toBeGreaterThan(walked);
  expect(ran.every((c: any) => c.run && !c.jump && !c.traverse)).toBe(true);
  expect(errors).toEqual([]);
});
