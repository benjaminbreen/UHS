import { createHash } from "node:crypto";
import { test, expect } from "@playwright/test";

test("ecological water animates, pauses, survives chunk movement and plays", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const results: unknown[] = [];
  for (const [name, ecology, water, season] of [
    ["desert-river", "desert", "river-ew", "summer"],
    ["monsoon-river", "tropical-woodland", "river-ns", "summer"],
    ["tropical-coast", "tropical-woodland", "coast-n", "summer"],
    ["temperate-coast", "temperate-woodland", "coast-n", "summer"],
    ["arctic-coast", "tundra", "coast-n", "winter"],
  ]) {
    await page.goto(
      `/terrain-lab?seed=water-review&ecology=${ecology}&water=${water}&season=${season}&landform=plain&population=none&start=wanderer`,
    );
    const canvas = page.locator("canvas[data-terrain-ready]");
    await expect(canvas).toHaveAttribute("data-terrain-ready", "true", {
      timeout: 30000,
    });
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-water-tiles")))
      .toBeGreaterThan(0);
    const frame = await canvas.getAttribute("data-water-frame");
    await expect
      .poll(() => canvas.getAttribute("data-water-frame"))
      .not.toBe(frame);
    const hash = await page.evaluate(() =>
      (window as any).terrainLab.runtime.engine.hash(),
    );
    await page.getByRole("button", { name: "Pause water" }).click();
    await expect(canvas).toHaveAttribute("data-water-frame", "0");
    await expect(canvas).toHaveAttribute("data-terrain-pending", "0", {
      timeout: 30000,
    });
    const digest = (buffer: Buffer) =>
      createHash("sha256").update(buffer).digest("hex");
    const still = digest(await canvas.screenshot());
    await page.waitForTimeout(250);
    expect(digest(await canvas.screenshot())).toEqual(still);
    expect(
      await page.evaluate(() =>
        (window as any).terrainLab.runtime.engine.hash(),
      ),
    ).toBe(hash);
    await canvas.screenshot({ path: `artifacts/water-${name}.png` });
    const detail = await page.evaluate(() => {
      const lab = (window as any).terrainLab;
      const zoom = lab.runtime.zoom;
      lab.runtime.zoom = 2;
      lab.scene.draw();
      return zoom;
    });
    await expect(canvas).toHaveAttribute("data-terrain-ready", "true");
    await canvas.screenshot({ path: `artifacts/water-detail-${name}.png` });
    await page.evaluate((zoom) => {
      const lab = (window as any).terrainLab;
      lab.runtime.zoom = zoom;
      lab.scene.draw();
    }, detail);
    await expect(canvas).toHaveAttribute("data-terrain-ready", "true");
    await page.getByRole("button", { name: "Animate water" }).click();
    await expect
      .poll(() => canvas.getAttribute("data-water-frame"))
      .not.toBe("0");
    await page.waitForTimeout(300);
    expect(digest(await canvas.screenshot())).not.toBe(still);
    const timing = await page.evaluate(async () => {
      const canvas = document.querySelector("canvas")!;
      const times: number[] = [],
        costs: number[] = [];
      let last = performance.now();
      await new Promise<void>((resolve) => {
        const frame = (now: number) => {
          times.push(now - last);
          last = now;
          costs.push(Number(canvas.dataset.waterUpdateMs));
          if (times.length < 90) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      times.sort((a, b) => a - b);
      return {
        p95: times[Math.floor(times.length * 0.95)],
        max: Math.max(...times),
        waterMax: Math.max(...costs),
        installMax: Number(canvas.dataset.terrainInstallMaxMs),
      };
    });
    const density = await page.evaluate(() => {
      const c = document.querySelector("canvas")!;
      return Number(c.dataset.waterMotifs) / Number(c.dataset.waterTiles);
    });
    expect(density).toBeLessThan(0.2);
    results.push({ name, ...timing, activeMotifFraction: density });
    expect(timing.p95).toBeLessThan(45);
    expect(timing.waterMax).toBeLessThan(15);
    expect(timing.installMax).toBeLessThan(100);
  }
  // Pan past a chunk boundary while paused: arriving patches retain the same phase.
  await page.getByRole("button", { name: "Pause water" }).click();
  const bounds = await page.locator("canvas").boundingBox();
  await page.mouse.move(
    bounds!.x + bounds!.width * 0.6,
    bounds!.y + bounds!.height * 0.5,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds!.x + bounds!.width * 0.3,
    bounds!.y + bounds!.height * 0.6,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-terrain-ready",
    "true",
  );
  await expect(page.locator("canvas")).toHaveAttribute("data-water-frame", "0");
  await page.mouse.wheel(0, -200);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-terrain-ready",
    "true",
  );
  await page.evaluate(() => {
    const lab = (window as any).terrainLab,
      scene = lab.scene;
    scene.options.center.x += 220;
    scene.draw();
  });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-terrain-pending",
    "0",
    { timeout: 30000 },
  );
  expect(
    await page.evaluate(() =>
      (window as any).terrainLab.scene.textures.exists("water-motifs-1"),
    ),
  ).toBe(true);
  await page.evaluate(() => {
    const lab = (window as any).terrainLab,
      scene = lab.scene;
    scene.options.center.x -= 220;
    scene.draw();
  });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: "Play this world →" }).click();
  await expect(page.locator("canvas[data-terrain-ready]")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 30000 },
  );
  await page
    .getByRole("button", { name: "← Back to procedural explorer" })
    .click();
  await expect(page.locator("canvas[data-terrain-ready]")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 30000 },
  );
  console.log("Water performance", JSON.stringify(results));
  expect(errors).toEqual([]);
});

test("water frame cadence stays within the local browser budget", async ({
  page,
}) => {
  const measure = () =>
    page.evaluate(async () => {
      const times: number[] = [];
      let last = performance.now();
      await new Promise<void>((resolve) => {
        const frame = (now: number) => {
          times.push(now - last);
          last = now;
          if (times.length < 120) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      times.sort((a, b) => a - b);
      return { p95: times[Math.floor(times.length * 0.95)], max: times.at(-1) };
    });
  await page.goto("about:blank");
  const baseline = await measure();
  await page.goto(
    "/terrain-lab?seed=water-review&ecology=tropical-woodland&water=coast-n&landform=plain&population=none&start=wanderer",
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-terrain-pending",
    "0",
    { timeout: 30000 },
  );
  const water = await measure();
  console.log("Frame cadence baseline / animated water", { baseline, water });
  expect(water.p95).toBeLessThan(45);
});
