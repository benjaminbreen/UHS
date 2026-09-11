import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.PERF_URL ?? "http://127.0.0.1:4173";
const label = process.argv[2] ?? "current";
const browser = await chromium.launch({ channel: "chrome" });
const reports = [];
try {
  for (const world of ["anatolia", "alexandria"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      // Keep generated world seeds identical across benchmark runs.
      let serial = 0;
      crypto.randomUUID = () =>
        `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`;
      window.longTasks = [];
      new PerformanceObserver((list) =>
        window.longTasks.push(
          ...list
            .getEntries()
            .map((e) => ({ start: e.startTime, ms: e.duration })),
        ),
      ).observe({ type: "longtask", buffered: true });
    });
    const start = Date.now();
    await page.goto(base);
    await page
      .getByRole("button", { name: "Choose starting details" })
      .waitFor();
    const shellMs = Date.now() - start;
    await page.getByRole("button", { name: "Choose starting details" }).click();
    const setup = page.getByRole("dialog", { name: "Create a world" });
    await setup
      .getByLabel("Describe your starting situation")
      .fill(
        world === "anatolia"
          ? "A hunter in Anatolia, 6500 BCE"
          : "Hellenistic Alexandria",
      );
    await page.evaluate(() => {
      window.longTasks = [];
    });
    const selection = Date.now();
    await setup.getByRole("button", { name: "Begin", exact: true }).click();
    const canvas = page.locator(
      '.game-container canvas[data-terrain-ready="true"]',
    );
    await canvas.waitFor({ timeout: 90000 });
    const readyMs = Date.now() - selection;
    const startupTasks = await page.evaluate(() => window.longTasks);
    await page
      .locator('.game-container canvas[data-terrain-pending="0"]')
      .waitFor({ timeout: 90000 });
    const profiler = process.env.PERF_PROFILE
      ? await page.context().newCDPSession(page)
      : undefined;
    await profiler?.send("Profiler.enable");
    await profiler?.send("Profiler.start");
    const sample = await page.evaluate(async () => {
      const frames = [],
        commands = [],
        statuses = {};
      let last = performance.now(),
        direction = 0;
      const start = window.historySim.observe().player.pos;
      const dirs = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ];
      for (let i = 0; i < 360; i++) {
        await new Promise((resolve) =>
          requestAnimationFrame((now) => {
            frames.push(now - last);
            last = now;
            resolve();
          }),
        );
        if (i % 9 === 0) {
          const obs = window.historySim.observe(),
            [dx, dy] = dirs[direction],
            t = performance.now();
          const result = window.historySim.act({
            actionId: `perf-${i}`,
            expectedRevision: obs.revision,
            command: { type: "move", dx, dy },
          });
          commands.push(performance.now() - t);
          statuses[result.status] = (statuses[result.status] ?? 0) + 1;
          if (result.status === "rejected" || i % 45 === 0)
            direction = (direction + 1) % 4;
        }
      }
      frames.splice(0, 5);
      frames.sort((a, b) => a - b);
      commands.sort((a, b) => a - b);
      return {
        p50: frames[Math.floor(frames.length * 0.5)],
        p95: frames[Math.floor(frames.length * 0.95)],
        max: frames.at(-1),
        commandP95: commands[Math.floor(commands.length * 0.95)],
        commandMax: commands.at(-1),
        statuses,
        start,
        end: window.historySim.observe().player.pos,
        manifest: window.historySim.observe().manifest,
        heap: performance.memory?.usedJSHeapSize,
      };
    });
    const metrics = await canvas.evaluate((c) => ({ ...c.dataset }));
    mkdirSync("artifacts/performance", { recursive: true });
    if (profiler) {
      const { profile } = await profiler.send("Profiler.stop");
      writeFileSync(
        `artifacts/performance/${label}-${world}.cpuprofile`,
        JSON.stringify(profile),
      );
      await profiler.detach();
    }
    const minimaps = await page
      .locator("canvas.minimap, canvas.large-map")
      .evaluateAll((maps) =>
        maps.map((map) => ({
          className: map.className,
          builds: map.dataset.mapBuilds,
        })),
      );
    await page.screenshot({
      path: `artifacts/performance/${label}-${world}.png`,
    });
    reports.push({
      world,
      shellMs,
      readyMs,
      startupTasks,
      sample,
      metrics,
      minimaps,
      errors,
    });
    if (errors.length) throw Error(errors.join("\n"));
    await page.close();
  }
  const blank = await browser.newPage();
  const cadence = await blank.evaluate(async () => {
    let f = [],
      last = performance.now();
    for (let i = 0; i < 60; i++)
      await new Promise((r) =>
        requestAnimationFrame((t) => {
          f.push(t - last);
          last = t;
          r();
        }),
      );
    f = f.slice(5).sort((a, b) => a - b);
    return {
      p50: f[Math.floor(f.length * 0.5)],
      p95: f[Math.floor(f.length * 0.95)],
    };
  });
  const result = {
    recordedAt: new Date().toISOString(),
    base,
    cadence,
    reports,
  };
  writeFileSync(
    `artifacts/performance/${label}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
