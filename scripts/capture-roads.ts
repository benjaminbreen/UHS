import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const tag = process.argv[2] ?? "after";
const start = performance.now();
try {
  await page.goto(
    "http://127.0.0.1:4184/terrain-lab?place=konya&seed=road-review&ecology=desert&year=-6499&pattern=clustered&population=sparse&water=river-ns&landform=plain&start=resident",
  );
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
      "true",
    {},
    { timeout: 120000 },
  );
  const metrics = await page.evaluate(() => {
    const l = (window as any).terrainLab,
      w = l.runtime.engine.world,
      p = w.planAt(w.spawn.x, w.spawn.y);
    l.runtime.zoom = 1;
    l.scene.options.center = { ...w.spawn };
    l.scene.draw();
    return {
      setting: w.pack.setting,
      households: p?.places.length,
      roads: p?.roads.length,
      roadPoints: p?.roads.reduce(
        (n: number, r: any) => n + r.points.length,
        0,
      ),
      spawn: w.spawn,
    };
  });
  await page.waitForTimeout(1200);
  await page
    .locator("canvas")
    .screenshot({ path: `artifacts/roads/${tag}.png` });
  await page.evaluate(() => {
    const l = (window as any).terrainLab;
    l.runtime.zoom = 2;
    l.scene.draw();
  });
  await page.waitForTimeout(500);
  await page
    .locator("canvas")
    .screenshot({ path: `artifacts/roads/${tag}-junction.png` });
  const walk = await page.evaluate(() => {
    const l = (window as any).terrainLab,
      w = l.runtime.engine.world,
      p = w.planAt(w.spawn.x, w.spawn.y);
    return [...p.roads.find((r: any) => r.id.endsWith("neighborhood0")).points]
      .reverse()
      .slice(0, 9);
  });
  await page.getByRole("button", { name: "Play this world →" }).click();
  await page.waitForFunction(
    () =>
      (window as any).__uhs?.engine &&
      document
        .querySelector(".game-container canvas")
        ?.getAttribute("data-ready") === "true",
    {},
    { timeout: 60000 },
  );
  const movement = await page.evaluate(async (points) => {
    const r = (window as any).__uhs;
    r.engine.state.player.pos = { ...points[0], space: "outside" };
    r.emit();
    for (let i = 1; i < points.length; i++) {
      r.move(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      const p = r.engine.state.player.pos;
      if (p.x !== points[i].x || p.y !== points[i].y)
        throw Error(
          `Junction movement blocked at ${JSON.stringify(points[i])}`,
        );
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    return { steps: points.length - 1, end: r.engine.state.player.pos };
  }, walk);
  if (errors.length) throw Error(errors.join("\n"));
  const result = {
    ...metrics,
    previewAndWalkMs: performance.now() - start,
    movement,
    errors,
  };
  await writeFile(
    `artifacts/roads/${tag}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(result);
} finally {
  await browser.close();
}
