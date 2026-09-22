import { test, expect } from "@playwright/test";
test("urban blocks, civic square, usable public hall and stable rendering", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173"}/terrain-lab?place=rome&seed=city-review&ecology=dry-scrub&year=-99&pattern=dense&population=settled&water=none&landform=plain&start=resident`,
  );
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
      "true",
    {},
    { timeout: 120000 },
  );
  const result = await page.evaluate(() => {
    const l = (window as any).terrainLab,
      rt = l.runtime,
      e = rt.engine,
      w = e.world;
    const civic = w.places.find((b: any) => b.id.endsWith("-civic"));
    if (!civic) return { count: w.places.length };
    const route = e.findRoute(e.state.player.pos, civic.entrance);
    rt.walkTo(civic.entrance);
    for (let i = 0; i < 600 && rt.running; i++) rt.tick();
    const entry = rt.command({
      type: "interact",
      target: civic.id,
      action: "enter",
    });
    const inside = e.state.player.pos.space === civic.id;
    const exit = rt.command({
      type: "interact",
      target: `${civic.id}-exit`,
      action: "exit",
    });
    l.runtime.zoom = 2;
    l.scene.options.center = {
      x: civic.x + civic.w / 2,
      y: civic.y + civic.h + 4,
    };
    l.scene.draw();
    l.scene.cameras.main.stopFollow();
    l.scene.cameras.main.centerOn(
      (civic.x + civic.w / 2) * 16,
      (civic.y + civic.h) * 16,
    );
    return {
      count: w.places.length,
      civic: civic.name,
      counters: e.state.objects
        .filter((o: any) => o.prop === "marketCounter")
        .map((o: any) => o.sprite),
      route: route.status,
      entered: entry?.status,
      inside,
      exited: exit?.status,
      outside: e.state.player.pos.space === "outside",
      missing: [...l.scene.buildings.values()].filter(
        (i: any) => i.frame.name === "__MISSING",
      ).length,
    };
  });
  expect(result.count).toBeGreaterThan(20);
  expect(result.civic).toBe("Civic basilica");
  expect(result.counters?.length).toBeGreaterThanOrEqual(2);
  expect(
    result.counters?.every((s: string) => s.startsWith("urban-stall-")),
  ).toBe(true);
  expect(result.route).toBe("found");
  expect(result.entered).toBe("completed");
  expect(result.inside).toBe(true);
  expect(result.exited).toBe("completed");
  expect(result.outside).toBe(true);
  expect(result.missing).toBe(0);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-pending") ===
      "0",
    {},
    { timeout: 60000 },
  );
  await page
    .locator("canvas")
    .screenshot({ path: "artifacts/cities/rome-square.png" });
  const cadence = await page.evaluate(async () => {
    const t: number[] = [];
    await new Promise<void>((resolve) => {
      let last = performance.now();
      function frame(now: number) {
        t.push(now - last);
        last = now;
        if (t.length >= 120) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    t.shift();
    t.sort((a, b) => a - b);
    return { p95: t[Math.floor(t.length * 0.95)], max: t.at(-1) };
  });
  console.log("city frame cadence", cadence);
  expect(errors).toEqual([]);
});

for (const [name, query] of [
  ["timber", "place=konya&ecology=grassland&year=1700"],
  ["earthen", "place=konya&ecology=desert&year=-500"],
] as const) {
  test(`${name} urban kit uses shared public-space generation`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      `${process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173"}/terrain-lab?${query}&seed=city-review&pattern=planned&population=settled&water=none&landform=plain&start=resident`,
    );
    await page.waitForFunction(
      () =>
        document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
        "true",
      {},
      { timeout: 120000 },
    );
    const result = await page.evaluate(() => {
      const l = (window as any).terrainLab,
        w = l.runtime.engine.world;
      const civic = w.places.find((p: any) => p.id.endsWith("-civic"));
      const p = civic
        ? { x: civic.x + civic.w / 2, y: civic.y + civic.h }
        : w.spawn;
      l.runtime.zoom = 2;
      l.scene.options.center = p;
      l.scene.draw();
      l.scene.cameras.main.centerOn(p.x * 16, p.y * 16);
      return {
        urban: w.places.filter((p: any) => p.sprite.includes("-urban-")).length,
        civic: !!civic,
        missing: [...l.scene.buildings.values()].filter(
          (i: any) => i.frame.name === "__MISSING",
        ).length,
      };
    });
    expect(result.urban).toBeGreaterThan(2);
    expect(result.civic).toBe(true);
    expect(result.missing).toBe(0);
    await page.waitForFunction(
      () =>
        document
          .querySelector("canvas")
          ?.getAttribute("data-terrain-pending") === "0",
      {},
      { timeout: 60000 },
    );
    await page
      .locator("canvas")
      .screenshot({ path: `artifacts/cities/${name}-square.png` });
    expect(errors).toEqual([]);
  });
}
