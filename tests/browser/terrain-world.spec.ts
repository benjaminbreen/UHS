import { test, expect } from "@playwright/test";
test("Anatolia renders discrete relief and remains playable", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "New world", exact: true }).click();
  const started = Date.now();
  await page
    .getByRole("button", { name: "Anatolia · 6500 BCE · terrain preview" })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as any).__uhs?.engine.state.manifest.setting
              ?.terrainRevision,
        ),
      { timeout: 90000 },
    )
    .toBe(1);
  console.log("Preview ready ms", Date.now() - started);
  console.log(
    "Scenery render ms",
    await page
      .locator("canvas[data-scenery-draw-ms]")
      .getAttribute("data-scenery-draw-ms"),
  );
  await page.evaluate(() => (window as any).__uhs.setZoom(1));
  await expect(page.locator("canvas[data-terrain-ready]")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 15000 },
  );
  console.log(
    "Visible terrain ready ms",
    await page
      .locator("canvas[data-terrain-load-ms]")
      .getAttribute("data-terrain-load-ms"),
  );
  await page.screenshot({ path: "artifacts/terrain-stream-overview.png" });
  const result = await page.evaluate(() => {
    const e = (window as any).__uhs.engine;
    return {
      generator: e.state.manifest.generator,
      year: e.state.manifest.setting.year,
      route: e.findRoute(
        e.state.player.pos,
        e.world.places.find((p: any) => p.owner === "player").entrance,
      ).status,
    };
  });
  expect(result).toEqual({ generator: 3, year: -6499, route: "found" });
  const crossing = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    const e = rt.engine;
    for (let y = -40; y < 50; y++) {
      const xs: number[] = [];
      for (let x = -45; x < 0; x++)
        if (e.world.topography(x, y)?.bridge) xs.push(x);
      if (xs.length < 3) continue;
      const start = { x: Math.max(...xs) + 2, y };
      const end = { x: Math.min(...xs) - 2, y };
      const route = e.findRoute(start, end);
      if (route.status !== "found" || route.path.length > xs.length + 8)
        continue;
      rt.walkTo(start);
      for (let i = 0; i < 200 && rt.running; i++) rt.tick();
      return { start, end };
    }
    throw new Error("No bridge crossing found");
  });
  await page.waitForTimeout(500);
  const timing = await page.evaluate(async ({ start: departure, end }) => {
    const rt = (window as any).__uhs;
    const canvas = document.querySelector(
      "canvas[data-scenery-draw-count]",
    ) as HTMLCanvasElement;
    const before = Number(canvas.dataset.sceneryDrawCount);
    const times: number[] = [];
    let last = performance.now();
    const start = last;
    let returning = false;
    rt.walkTo(end);
    await new Promise<void>((resolve, reject) => {
      const frame = (now: number) => {
        times.push(now - last);
        last = now;
        if (now - start > 15000) return reject(new Error("Crossing timed out"));
        if (!rt.running && now - start > 250) {
          if (returning) return resolve();
          returning = true;
          rt.walkTo(departure);
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    times.sort((a, b) => a - b);
    return {
      p95: times[Math.floor(times.length * 0.95)],
      max: times.at(-1)!,
      rebuilds: Number(canvas.dataset.sceneryDrawCount) - before,
      position: {
        x: rt.engine.state.player.pos.x,
        y: rt.engine.state.player.pos.y,
      },
    };
  }, crossing);
  console.log("Bridge crossing", timing);
  expect(timing.position).toEqual(crossing.start);
  // Scenery may refresh; terrain is retained and installed in small chunks.
  expect(
    Number(
      await page
        .locator("canvas[data-terrain-install-max-ms]")
        .getAttribute("data-terrain-install-max-ms"),
    ),
  ).toBeLessThan(100);
  expect(timing.max).toBeLessThan(150);
  await page.evaluate(({ start, end }) => {
    const rt = (window as any).__uhs;
    rt.walkTo({ x: Math.round((start.x + end.x) / 2), y: start.y + 1 });
    for (let i = 0; i < 40 && rt.running; i++) rt.tick();
    rt.setZoom(3);
  }, crossing);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "artifacts/terrain-stream-bridge.png" });
  expect(errors).toEqual([]);
});

test("outdoor diagonals and long walks stream terrain across redraw boundaries", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "New world", exact: true }).click();
  await page
    .getByRole("button", { name: "Anatolia · 6500 BCE · terrain preview" })
    .click();
  const canvas = page.locator("canvas[data-terrain-ready]");
  await expect(canvas).toHaveAttribute("data-terrain-ready", "true", {
    timeout: 15000,
  });
  await page.evaluate(() => {
    const rt = (window as any).__uhs;
    rt.engine.state.player.pos = { x: -10, y: -10, space: "outside" };
    rt.emit();
  });
  await page.locator(".game-container").focus();
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(240);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowDown");
  const diagonal = await page.evaluate(
    () => (window as any).__uhs.engine.state.player.pos,
  );
  expect(diagonal.x).toBeGreaterThan(-10);
  expect(diagonal.y).toBeGreaterThan(-10);
  await page.evaluate(() => {
    const rt = (window as any).__uhs;
    rt.engine.state.player.pos = { x: 0, y: 0, space: "outside" };
    rt.emit();
  });
  await expect(canvas).toHaveAttribute("data-terrain-pending", "0", {
    timeout: 15000,
  });
  const timing = await page.evaluate(async () => {
    const rt = (window as any).__uhs;
    const canvas = document.querySelector(
      "canvas[data-terrain-ready]",
    ) as HTMLCanvasElement;
    const before = Number(canvas.dataset.terrainChunksBuilt);
    const times: number[] = [],
      commandTimes: number[] = [];
    const command = rt.command.bind(rt);
    rt.command = (c: any) => {
      const t = performance.now();
      const r = command(c);
      commandTimes.push(performance.now() - t);
      return r;
    };
    let last = performance.now(),
      missingFrames = 0,
      frames = 0;
    const start = last;
    const destination = { x: 75, y: 0 };
    if (
      rt.engine.findRoute(rt.engine.state.player.pos, destination).status !==
      "found"
    )
      throw Error("No long route");
    rt.walkTo(destination);
    let returning = false;
    await new Promise<void>((resolve, reject) => {
      const frame = (now: number) => {
        times.push(now - last);
        last = now;
        frames++;
        if (canvas.dataset.terrainReady !== "true") missingFrames++;
        if (now - start > 65000) return reject(Error("Long walk timed out"));
        if (!rt.running && now - start > 250) {
          if (returning) return resolve();
          returning = true;
          rt.walkTo({ x: 0, y: 0 });
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    rt.command = command;
    times.sort((a, b) => a - b);
    return {
      p95: times[Math.floor(times.length * 0.95)],
      max: times.at(-1),
      maxCommand: Math.max(...commandTimes),
      built: Number(canvas.dataset.terrainChunksBuilt) - before,
      retained: Number(canvas.dataset.terrainChunkCount),
      installMax: Number(canvas.dataset.terrainInstallMaxMs),
      missingFrames,
      frames,
      pos: rt.engine.state.player.pos,
    };
  });
  console.log("Long terrain walk", timing);
  expect(timing.pos).toEqual({ x: 0, y: 0, space: "outside" });
  expect(timing.built).toBeGreaterThan(0);
  expect(timing.retained).toBeLessThan(150);
  expect(timing.p95).toBeLessThan(35);
  expect(timing.max).toBeLessThan(150);
  expect(timing.installMax).toBeLessThan(100);
  expect(timing.missingFrames).toBe(0);
  // Zoom and lighting must reuse rasterized textures, even though scenery changes.
  const reuse = await page.evaluate(async () => {
    const rt = (window as any).__uhs;
    const url = performance
      .getEntriesByType("resource")
      .find((e) => e.name.includes("/src/render/WorldScene.ts"))!.name;
    const { WorldScene } = await import(/* @vite-ignore */ url);
    let scene: any;
    const draw = WorldScene.prototype.draw;
    WorldScene.prototype.draw = function () {
      scene = this;
      draw.call(this);
    };
    rt.emit();
    WorldScene.prototype.draw = draw;
    const original = new Map(scene.terrainStream.chunks);
    rt.setZoom(2);
    rt.engine.state.clock += 3600 * 5;
    rt.emit();
    rt.setZoom(1);
    return [...original].filter(
      ([id, chunk]) => scene.terrainStream.chunks.get(id) === chunk,
    ).length;
  });
  expect(reuse).toBeGreaterThan(0);
  expect(await canvas.getAttribute("data-terrain-error")).toBeNull();
  expect(errors).toEqual([]);
});
