import { test, expect } from "@playwright/test";
test("a full-size barrel blocks walking and clears when picked up", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const id = await page.evaluate(() => {
    const r = (window as any).__uhs,
      e = r.engine;
    const o = e.state.objects.find(
      (o: any) => o.prop && o.pos.space === "outside" && o.prop !== "stick",
    );
    const spots = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ].map(([x, y]) => ({ ...o.pos, x: o.pos.x + x, y: o.pos.y + y }));
    const p = spots.find((p) => !e.blocked(p.x, p.y, p.space));
    if (!p) throw Error("No approach");
    o.prop = "barrel";
    o.sprite = "study-prop-barrel-0";
    o.name = "Wooden barrel";
    e.state.player.pos = p;
    r.select(o.id);
    return o.id;
  });
  const before = await page.evaluate(
    () => (window as any).__uhs.engine.state.player.pos,
  );
  const direction = await page.evaluate((id) => {
    const e = (window as any).__uhs.engine,
      o = e.state.objects.find((o: any) => o.id === id),
      p = e.state.player.pos;
    return { dx: o.pos.x - p.x, dy: o.pos.y - p.y };
  }, id);
  const key =
    direction.dx > 0
      ? "ArrowRight"
      : direction.dx < 0
        ? "ArrowLeft"
        : direction.dy > 0
          ? "ArrowDown"
          : "ArrowUp";
  await page.locator(".game-container").focus();
  await page.keyboard.press(key);
  await page.waitForTimeout(180);
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.pos),
  ).toEqual(before);
  await page.screenshot({ path: "artifacts/prop-size-collision.png" });
  await page.evaluate(
    (id) =>
      (window as any).__uhs.command({
        type: "interact",
        target: id,
        action: "pickup",
      }),
    id,
  );
  await page.waitForTimeout(200); // Respect the shared movement cadence after the blocked step.
  await page.keyboard.press(key);
  await expect.poll(
    () => page.evaluate(() => (window as any).__uhs.engine.state.player.pos),
  ).toEqual({
    ...before,
    x: before.x + direction.dx,
    y: before.y + direction.dy,
  });
});
