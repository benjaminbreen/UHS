import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.PERF_URL ?? "http://127.0.0.1:4173";
const label = process.argv[2] ?? "current";
const frameCount = Number(process.env.PERF_FRAMES ?? 360);
const mobile = process.env.PERF_MOBILE === "1";

async function sampleMemory(page) {
  const cdp = await page.context().newCDPSession(page);
  const workers = new Map(), pending = new Map(), samples = [], peaks = new Map();
  const errors = new Set();
  let serial = 0, busy = false, phase = "shell";
  const started = Date.now();
  cdp.on("Target.attachedToTarget", ({ sessionId, targetInfo }) => {
    workers.set(sessionId, targetInfo.url);
  });
  cdp.on("Target.detachedFromTarget", ({ sessionId }) => {
    workers.delete(sessionId);
    for (const [id, request] of pending)
      if (request.sessionId === sessionId) {
        pending.delete(id);
        request.resolve(undefined);
      }
  });
  cdp.on("Target.receivedMessageFromTarget", ({ message }) => {
    const response = JSON.parse(message), request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    if (response.error) errors.add(response.error.message);
    request.resolve(response.result);
  });
  await cdp.send("Target.setAutoAttach", {
    autoAttach: true, waitForDebuggerOnStart: false, flatten: false,
    filter: [{ type: "worker", exclude: false }, { exclude: true }],
  });
  const readWorker = async (sessionId) => {
    const id = ++serial;
    let resolve;
    const response = new Promise((done) => { resolve = done; });
    pending.set(id, { sessionId, resolve });
    const timeout = setTimeout(() => {
      pending.delete(id);
      if (workers.has(sessionId)) errors.add("Worker heap sample timed out");
      resolve(undefined);
    }, 5000);
    try {
      await cdp.send("Target.sendMessageToTarget", {
        sessionId, message: JSON.stringify({ id, method: "Runtime.getHeapUsage" }),
      });
      return await response;
    } catch (error) {
      if (workers.has(sessionId)) errors.add(error.message);
    } finally {
      clearTimeout(timeout);
      pending.delete(id);
    }
  };
  const sample = async () => {
    if (busy) return;
    busy = true;
    try {
      const sessions = [...workers];
      const [main, ...heaps] = await Promise.all([
        cdp.send("Runtime.getHeapUsage"),
        ...sessions.map(([id]) => readWorker(id)),
      ]);
      const active = sessions.flatMap(([id, url], i) => {
        const heap = heaps[i];
        if (!heap || !workers.has(id)) return [];
        const previous = peaks.get(id);
        peaks.set(id, { url, usedSize: Math.max(previous?.usedSize ?? 0, heap.usedSize) });
        return [{ url, ...heap }];
      });
      samples.push({ ms: Date.now() - started, phase, main, workers: active,
        sampledJSHeap: main.usedSize + active.reduce((n, h) => n + h.usedSize, 0) });
    } catch (error) {
      errors.add(error.message);
    } finally { busy = false; }
  };
  const timer = setInterval(sample, 250);
  page.once("close", () => clearInterval(timer));
  await sample();
  return {
    phase(next) { phase = next; },
    async stop() {
      clearInterval(timer);
      while (busy) await new Promise((resolve) => setTimeout(resolve, 10));
      await sample();
      await cdp.detach();
      return { intervalMs: 250, mainPeak: Math.max(...samples.map((s) => s.main.usedSize)),
        sampledJSHeapPeak: Math.max(...samples.map((s) => s.sampledJSHeap)),
        workerPeaks: [...peaks.values()], errors: [...errors], samples };
    },
  };
}
const browser = await chromium.launch({ channel: "chrome" });
const reports = [];
try {
  for (const world of process.env.PERF_WORLD ? ["custom"] : ["anatolia", "alexandria"]) {
    const page = await browser.newPage({
      ...(mobile ? { viewport: { width: 375, height: 812 }, screen: { width: 375, height: 812 },
        isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : { viewport: { width: 1440, height: 1000 } }),
    });
    const memory = process.env.PERF_MEMORY === "1" ? await sampleMemory(page) : undefined;
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(({ renderer }) => {
      // Keep generated world seeds identical across benchmark runs.
      let serial = 0;
      crypto.randomUUID = () =>
        `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`;
      if (renderer) localStorage.setItem("uhs-character-sprites", renderer);
      window.longTasks = [];
      new PerformanceObserver((list) =>
        window.longTasks.push(
          ...list
            .getEntries()
            .map((e) => ({ start: e.startTime, ms: e.duration })),
        ),
      ).observe({ type: "longtask", buffered: true });
    }, { renderer: process.env.PERF_RENDERER });
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
        process.env.PERF_WORLD ?? (world === "anatolia"
          ? "A hunter in Anatolia, 6500 BCE"
          : "Hellenistic Alexandria"),
      );
    await page.evaluate(() => {
      window.longTasks = [];
    });
    const selection = Date.now();
    memory?.phase("loading");
    await setup.getByRole("button", { name: "Begin", exact: true }).click();
    if (memory) {
      await page.getByRole("button", { name: /Enter life/ }).waitFor({ timeout: 120000 });
      memory.phase("arrival");
      await page.waitForTimeout(Number(process.env.PERF_CARD_MS ?? 5000));
      memory.phase("loading");
    }
    await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
    const canvas = page.locator(
      '.game-container canvas[data-terrain-ready="true"]',
    );
    await canvas.waitFor({ timeout: 90000 });
    const readyMs = Date.now() - selection;
    const startupTasks = await page.evaluate(() => window.longTasks);
    await page
      .locator('.game-container canvas[data-terrain-pending="0"]')
      .waitFor({ timeout: 90000 });
    if (memory) {
      memory.phase("idle");
      await page.waitForTimeout(Number(process.env.PERF_IDLE_MS ?? 30000));
    }
    memory?.phase("movement");
    const profiler = process.env.PERF_PROFILE
      ? await page.context().newCDPSession(page)
      : undefined;
    await profiler?.send("Profiler.enable");
    await profiler?.send("Profiler.start");
    const sample = await page.evaluate(async (frameCount) => {
      const frames = [],
        commands = [],
        statuses = {};
      let last = performance.now(),
        direction = 0;
      const scene = window.uhsGame?.scene.getScene("world");
      const characters = scene?.characters;
      const originalFrame = characters?.frame;
      const characterCalls = [];
      const frameCalls = [];
      let frameWork = 0;
      if (characters) characters.frame = function (...args) {
        const began = performance.now();
        try { return originalFrame.apply(this, args); }
        finally {
          const ms = performance.now() - began;
          characterCalls.push(ms);
          frameWork += ms;
        }
      };
      window.longTasks = [];
      const start = window.historySim.observe().player.pos;
      const dirs = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ];
      for (let i = 0; i < frameCount; i++) {
        await new Promise((resolve) =>
          requestAnimationFrame((now) => {
            frames.push(now - last);
            last = now;
            frameCalls.push(frameWork);
            frameWork = 0;
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
      if (characters) characters.frame = originalFrame;
      frames.sort((a, b) => a - b);
      commands.sort((a, b) => a - b);
      characterCalls.sort((a, b) => a - b);
      frameCalls.sort((a, b) => a - b);
      return {
        p50: frames[Math.floor(frames.length * 0.5)],
        p95: frames[Math.floor(frames.length * 0.95)],
        max: frames.at(-1),
        hitches: frames.filter((ms) => ms >= 24).length,
        characterCallP95: characterCalls[Math.floor(characterCalls.length * 0.95)],
        characterCallMax: characterCalls.at(-1),
        characterWorkP95: frameCalls[Math.floor(frameCalls.length * 0.95)],
        characterWorkMax: frameCalls.at(-1),
        characterFrames: characters?.cache.size,
        characterPending: characters?.pending?.size,
        characterWorkers: characters?.pool?.length,
        longTasks: window.longTasks,
        commandP95: commands[Math.floor(commands.length * 0.95)],
        commandMax: commands.at(-1),
        statuses,
        start,
        end: window.historySim.observe().player.pos,
        manifest: window.historySim.observe().manifest,
        heap: performance.memory?.usedJSHeapSize,
      };
    }, frameCount);
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
      memory: await memory?.stop(),
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
    mobile,
    cadence,
    reports,
  };
  writeFileSync(
    `artifacts/performance/${label}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify({ ...result, reports: reports.map((r) => ({ ...r,
    memory: r.memory && { ...r.memory, samples: r.memory.samples.length } })) }, null, 2));
} finally {
  await browser.close();
}
