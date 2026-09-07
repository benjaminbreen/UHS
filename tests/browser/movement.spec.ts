import { test, expect } from "@playwright/test";

test("combined keys and player/NPC animation survive redraws", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(async () => {
    const w = window as any;
    const modulePath = performance
      .getEntriesByType("resource")
      .find((e) => e.name.includes("/src/render/WorldScene.ts"))!.name;
    const { WorldScene } = await import(/* @vite-ignore */ modulePath);
    const original = WorldScene.prototype.draw;
    WorldScene.prototype.draw = function () {
      w.movementScene = this;
      original.call(this);
    };
    w.__uhs.emit();
    WorldScene.prototype.draw = original;
    const e = w.__uhs.engine;
    // A clear interior isolates input and animation from generated terrain.
    e.state.player.pos = { x: 7, y: 4, space: e.world.places[0].id };
    w.__uhs.emit();
  });
  await page.locator(".game-container").focus();
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(310);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("ArrowDown");
  await page.waitForTimeout(240);
  const pos = await page.evaluate(
    () => (window as any).__uhs.engine.state.player.pos,
  );
  expect(pos.x).toBeLessThan(7);
  expect(pos.y).toBeGreaterThan(4);
  const samples = await page.evaluate(async () => {
    const w = window as any,
      r = w.__uhs,
      scene = w.movementScene;
    const im = scene.entities.get("player");
    const start = im.x;
    r.move(1, 0);
    await new Promise((resolve) => setTimeout(resolve, 45));
    const middle = im.x;
    r.select(undefined); // No movement: must not snap an active animation.
    const redraw = im.x;
    await new Promise((resolve) => setTimeout(resolve, 240));
    return {
      start,
      middle,
      redraw,
      end: im.x,
      cameraRounded: scene.cameras.main.roundPixels,
    };
  });
  expect(samples.middle).toBeGreaterThan(samples.start);
  expect(samples.middle).toBeLessThan(samples.end);
  expect(samples.redraw).toBe(samples.middle);
  expect(samples.end - samples.start).toBe(16);
  expect(samples.cameraRounded).toBe(false);
  const npcMotion = await page.evaluate(async () => {
    const w = window as any,
      r = w.__uhs,
      scene = w.movementScene;
    const npc = r.engine.state.actors.find((a: any) => a.kind === "human");
    npc.pos = {
      ...r.engine.state.player.pos,
      y: r.engine.state.player.pos.y - 1,
    };
    r.emit();
    const image = scene.entities.get(npc.id);
    const start = image.x;
    npc.pos.x += 1;
    r.emit();
    await new Promise((resolve) => setTimeout(resolve, 55));
    const middle = image.x;
    r.emit();
    const redraw = image.x;
    await new Promise((resolve) => setTimeout(resolve, 240));
    return { start, middle, redraw, end: image.x };
  });
  expect(npcMotion.middle).toBeGreaterThan(npcMotion.start);
  expect(npcMotion.middle).toBeLessThan(npcMotion.end);
  expect(npcMotion.redraw).toBe(npcMotion.middle);
  expect(npcMotion.end - npcMotion.start).toBe(16);
  await page.keyboard.down("a");
  await page.keyboard.down("s");
  await page.waitForTimeout(230);
  await page.keyboard.up("a");
  await page.keyboard.up("s");
  await page.waitForTimeout(240);
  const released = await page.evaluate(() => ({
    ...(window as any).__uhs.engine.state.player.pos,
  }));
  await page.waitForTimeout(220);
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.pos),
  ).toEqual(released);
  await page.screenshot({ path: "artifacts/movement-polish.png" });
  expect(errors).toEqual([]);
});
