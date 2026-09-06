import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const pack = process.argv.includes("--neolithic") ? "neolithic" : "roman";
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const start = performance.now();
  await page.goto("http://127.0.0.1:4173/");
  await page.locator('.game-container canvas[data-ready="true"]').waitFor();
  const coldReadyMs = Math.round(performance.now() - start);
  let sceneSwitchMs;
  if (pack === "neolithic") {
    await page.getByRole("button", { name: "New world", exact: true }).click();
    await page.getByRole("button", { name: /Neolithic Anatolia/ }).click();
    const switchStart = performance.now();
    await page.getByRole("button", { name: "Enter this world" }).click();
    await page
      .getByRole("heading", { name: "Early farmer", exact: true })
      .waitFor();
    sceneSwitchMs = Math.round(performance.now() - switchStart);
  }
  const result = await page.evaluate(async () => {
    const frames = [];
    let previous = performance.now();
    for (let i = 0; i < 150; i++) {
      await new Promise((resolve) =>
        requestAnimationFrame((now) => {
          frames.push(now - previous);
          previous = now;
          resolve();
        }),
      );
      if (i % 4 === 0) {
        const s = window.historySim.observe();
        window.historySim.act({
          actionId: `perf-${i}`,
          expectedRevision: s.revision,
          command: { type: "move", dx: i % 8 === 0 ? 1 : -1, dy: 0 },
        });
      }
    }
    const sorted = frames.slice(4).sort((a, b) => a - b);
    return {
      userAgent: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      sampleFrames: sorted.length,
      medianFrameMs: sorted[Math.floor(sorted.length * 0.5)],
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
      heapBytes: performance.memory?.usedJSHeapSize ?? null,
      clock: window.historySim.observe().clock,
      developmentHandleExposed: "__uhs" in window,
      webMCPAvailable: !!document.modelContext,
    };
  });
  await page.goto("about:blank");
  const blankPageMedianFrameMs = await page.evaluate(async () => {
    const frames = [];
    let previous = performance.now();
    for (let i = 0; i < 40; i++)
      await new Promise((resolve) =>
        requestAnimationFrame((now) => {
          frames.push(now - previous);
          previous = now;
          resolve();
        }),
      );
    return frames.slice(4).sort((a, b) => a - b)[18];
  });
  const report = {
    pack,
    sceneSwitchMs,
    blankPageMedianFrameMs,
    recordedAt: new Date().toISOString(),
    mode: "production build, Chrome headless, short alternating movement sample",
    coldReadyMs,
    ...result,
    pageErrors: errors,
  };
  if (errors.length || result.developmentHandleExposed)
    throw Error(JSON.stringify(report));
  writeFileSync(
    pack === "roman"
      ? "artifacts/performance.json"
      : "artifacts/performance-neolithic.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
