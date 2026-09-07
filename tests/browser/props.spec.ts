import { test, expect } from "@playwright/test";

test("world props expose E/Space prompts, preserve contents and render broken remains", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const id = await page.evaluate(() => {
    const r = (window as any).__uhs,
      e = r.engine;
    const o = e.state.objects.find(
      (p: any) => ["pot", "jar"].includes(p.prop) && p.pos.space === "outside",
    );
    if (!o) throw Error("No generated container");
    const pos = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]
      .map(([x, y]) => ({ ...o.pos, x: o.pos.x + x, y: o.pos.y + y }))
      .find((p) => !e.blocked(p.x, p.y));
    e.state.player.pos = pos;
    e.state.player.direction = 0;
    r.select(o.id);
    r.emit();
    return o.id;
  });
  await page.locator(".game-container").focus();
  await page.keyboard.press("KeyE");
  await expect(page.getByTestId("container-contents")).toBeVisible();
  const before = await page.evaluate(
    () => (window as any).__uhs.engine.state.clock,
  );
  await page.keyboard.press("Space");
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.held),
  ).toBe(id);
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.clock),
  ).toBe(before + 2);
  await expect(page.getByTestId("prop-prompts")).toContainText("Holding:");
  await page.keyboard.press("KeyG");
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.held),
  ).toBeUndefined();
  await page.evaluate((id) => {
    const r = (window as any).__uhs,
      e = r.engine,
      o = e.state.objects.find((p: any) => p.id === id);
    const stick = e.state.objects.find((p: any) => p.prop === "stick");
    stick.pos = { ...e.state.player.pos };
    r.command({ type: "interact", target: stick.id, action: "pickup" });
    r.select(o.id);
  }, id);
  await page.keyboard.press("Space");
  expect(
    await page.evaluate(
      (id) =>
        (window as any).__uhs.engine.state.objects.find((p: any) => p.id === id)
          .broken,
      id,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/interactive-props.png" });
  await page.keyboard.press("KeyI");
  const time = await page.evaluate(
    () => (window as any).__uhs.engine.state.clock,
  );
  await page.keyboard.press("Space");
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.clock),
  ).toBe(time);
  expect(errors).toEqual([]);
});

test("E offers water at a well and repeat keys do not repeat a pickup", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() => {
    const r = (window as any).__uhs,
      e = r.engine,
      o = e.state.objects.find((o: any) => o.prop === "well");
    const pos = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]
      .map(([x, y]) => ({ ...o.pos, x: o.pos.x + x, y: o.pos.y + y }))
      .find((p) => !e.blocked(p.x, p.y));
    e.state.player.pos = pos;
    e.state.player.direction = 0;
    r.emit();
  });
  await expect(page.getByTestId("prop-prompts")).toContainText(
    "Press E to drink water",
  );
  await page.locator(".game-container").focus();
  await page.keyboard.press("KeyE");
  expect(
    await page.evaluate(
      () => (window as any).__uhs.engine.state.player.inventory.water,
    ),
  ).toBeGreaterThanOrEqual(2);
  const revision = await page.evaluate(
    () => (window as any).__uhs.engine.state.revision,
  );
  await page.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Space",
        key: " ",
        repeat: true,
        bubbles: true,
      }),
    ),
  );
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.revision),
  ).toBe(revision);
});
