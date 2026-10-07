import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test("a custom phone start releases the unused prewarmed world", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any, Native = window.Worker;
    w.worldWorkers = [];
    w.maxWorldWorkers = 0;
    window.Worker = class extends Native {
      private record?: { alive: boolean };
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        if (!String(url).includes("/world/worker.ts")) return;
        this.record = { alive: true };
        w.worldWorkers.push(this.record);
        w.maxWorldWorkers = Math.max(w.maxWorldWorkers, w.worldWorkers.filter((r: { alive: boolean }) => r.alive).length);
      }
      terminate() {
        if (this.record) this.record.alive = false;
        super.terminate();
      }
    };
  });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => (window as any).worldWorkers.length), { timeout: 60000 }).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Choose starting details" }).click();
  const setup = page.getByRole("dialog", { name: "Create a world" });
  await setup.getByLabel("Describe your starting situation").fill("A Roman baker in Rome, 100 CE");
  await setup.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-terrain-ready", "true", { timeout: 60000 });
  expect(await page.evaluate(() => (window as any).worldWorkers.length)).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(() => (window as any).maxWorldWorkers)).toBe(1);
  const clears = await page.evaluate(() => {
    const scene = (window as any).uhsGame.scene.getScene("world");
    const s = scene.runtime.engine.state, plot = s.plot;
    s.plot = { ...plot, cast: { study: "player" }, ended: false };
    s.revision++;
    const g = scene.castMarks, clear = g.clear;
    let calls = 0;
    g.clear = function () { calls++; return clear.call(this); };
    try {
      scene.drawCastMarks(0);
      scene.drawCastMarks(0);
      scene.drawCastMarks(1000);
      return calls;
    } finally {
      g.clear = clear;
      s.plot = plot;
      s.revision++;
    }
  });
  expect(clears).toBe(2);
});

test("portrait nods wait for their worker pixels", async ({ page }) => {
  await page.goto("/character-lab");
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await page.evaluate(async () => {
    const { createRoot } = (await import("/node_modules/.vite/deps/react-dom_client.js" as string)).default;
    const { createElement } = (await import("/node_modules/.vite/deps/react.js" as string)).default;
    const { CharacterSprite } = await import("/src/ui/CharacterSprite.tsx" as string);
    const { generateAppearance } = await import("/src/core/character.ts" as string);
    const sculpted = await import("/src/render/portraits/sculpted.ts" as string);
    const w = window as any;
    w.nodJobs = [];
    const Native = window.Worker;
    window.Worker = class extends Native {
      postMessage(data: any, ...rest: any[]) {
        if (data.pose && data.key) w.nodJobs.push({ worker: this, ...data });
        else super.postMessage(data, rest[0]);
      }
    };
    Math.random = () => 0.99;
    const appearance = generateAppearance("late-nod", 3, 30);
    const host = document.createElement("div");
    host.id = "nod-test";
    document.body.append(host);
    createRoot(host).render(createElement(CharacterSprite, { appearance, age: 30, portrait: true, motion: "npc", facing: "front" }));
    w.nodReady = () => sculpted.sculptedPoseReady(appearance, 30, 0, 0.5);
    w.nodPixels = () => host.querySelector("canvas")!.toDataURL();
    w.deliverNod = () => {
      const job = w.nodJobs.find((j: any) => j.pose.turn === 0 && j.pose.pitch === 0.5);
      const { color, mat, layer, depth } = sculpted.trace(appearance, 30, job.pose);
      job.worker.onmessage({ data: { key: job.key, color, mat, layer, depth } });
    };
  });
  await page.clock.runFor(1);
  await expect(page.locator("#nod-test canvas")).toBeAttached();
  await expect.poll(() => page.evaluate(() => (window as any).nodJobs.length)).toBeGreaterThan(0);
  const before = await page.evaluate(() => (window as any).nodPixels());
  await page.clock.runFor(7000);
  expect(await page.evaluate(() => (window as any).nodReady())).toBe(false);
  expect(await page.evaluate(() => (window as any).nodPixels())).toBe(before);
  await page.evaluate(() => (window as any).deliverNod());
  await page.clock.runFor(6960);
  expect(await page.evaluate(() => (window as any).nodReady())).toBe(true);
  expect(await page.evaluate(() => (window as any).nodPixels())).not.toBe(before);
});

test.setTimeout(180000);
async function enterLife(page: Page) {
  await page.addInitScript(() => { crypto.randomUUID = () => "mobile-polish" as `${string}-${string}-${string}-${string}-${string}`; });
  await page.goto("/?start=Farmer%20in%20Seoul%201750");
  await page.getByPlaceholder(/A hunter in Anatolia/).fill("Farmer in Seoul 1750");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 40000 },
  );
  await page.getByRole("button", { name: "Begin your day", exact: true }).click();
  await expect(page.locator(".plot-card")).toBeHidden();
  await page.evaluate(() => {
    const r = (window as any).__uhs;
    r.ambientRate = 0; r.engine.cards = []; r.engine.state.plot = undefined;
  });
}

async function reachable(locator: Locator) {
  await expect(locator).toBeInViewport();
  await expect.poll(() => locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el === hit || el.contains(hit);
  })).toBe(true);
}

test("opening stories keep their action visible and their text readable", async ({ page }) => {
  await enterLife(page);
  await page.evaluate(() => {
    const r = (window as any).__uhs;
    r.engine.cards.push({ kind: "title", title: "A Long Road Home to Constantinople", text: "",
      intro: { body: [[{ text: "You begin another day with your family, hoping for news from your son. ".repeat(12) }],
        [{ text: "Your household", note: "The home you share with your family.", mark: "note" }, { text: " depends on the work you do today." }]], },
      aim: "See Chloe of Corinth, your five-year-old daughter, safely into adulthood, with choices of her own." });
    r.engine.state.clock++;
    r.emit();
  });
  const card = page.locator(".plot-card"), reader = card.locator(".plot-reader");
  const begin = card.getByRole("button", { name: "Begin your day", exact: true });
  await expect(begin).toBeFocused();
  for (const [width, height] of [[320, 568], [390, 664], [844, 390], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await reachable(begin);
    await reader.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expect(card.locator(".plot-intent")).toBeInViewport();
    const bounds = await card.evaluate((el) => {
      const reader = el.querySelector(".plot-reader")!, goal = el.querySelector(".plot-intent")!.getBoundingClientRect();
      const prose = el.querySelector(".plot-prose")!.getBoundingClientRect(), action = el.querySelector(".plot-foot")!.getBoundingClientRect();
      return { overflow: reader.scrollWidth > reader.clientWidth, goalWidth: goal.width, proseWidth: prose.width, overlap: goal.bottom > action.top };
    });
    expect(bounds.overflow).toBe(false);
    expect(bounds.goalWidth).toBeGreaterThanOrEqual(bounds.proseWidth - 1);
    expect(bounds.overlap).toBe(false);
    expect(await page.locator(".topbar").evaluate((el) => (el as HTMLElement).inert)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addStyleTag({ content: ".plot-prose { font-size: 34px !important; }" });
  await reachable(begin);
  await page.keyboard.press("Tab");
  const name = card.getByRole("button", { name: "Your household", exact: true });
  await expect(name).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(name).toHaveAttribute("aria-expanded", "true");
  await expect(card.getByRole("note")).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(card.getByRole("note")).toBeHidden();
  await page.keyboard.press("Shift+Tab");
  await expect(begin).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(card).toBeHidden();
  await expect(page.locator(".topbar")).not.toHaveAttribute("inert");
});

test("pinch zooms the world and a tap still walks", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CDP injects the two real touch contacts; panel tests also run in WebKit.");
  await enterLife(page);
  const canvas = page.locator(".game-container canvas");
  expect(
    await page.evaluate(() => {
      const game = (window as any).uhsGame;
      return {
        terrainWorkers: game.scene.getScene("world").terrainStream.pool.length,
        characterWorkers: game.scene.getScene("world").characters.pool.length,
        shadows: ["nature-shadows", "prop-shadows", "lighting-shadows"].some(
          (key) => game.textures.exists(key),
        ),
        tiltShift: game.scene
          .getScene("world")
          .cameras.main.postPipelines.some(
            (pipeline: any) => pipeline.name === "TiltShift",
          ),
      };
    }),
  ).toEqual({ terrainWorkers: 1, characterWorkers: 1, shadows: false, tiltShift: false });
  // Without this the browser pinch-zooms the page over the game instead.
  await expect(canvas).toHaveCSS("touch-action", "none");
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll("input,textarea,select")].every(
        (e) => parseFloat(getComputedStyle(e).fontSize) >= 16,
      ),
    ),
  ).toBe(true);

  const zoom = () => page.evaluate(() => (window as any).__uhs.zoom);
  const before = await zoom();
  const cdp = await page.context().newCDPSession(page);
  const cy = 400;
  const send = (type: string, points: { x: number; y: number; id: number }[]) =>
    cdp.send("Input.dispatchTouchEvent", {
      type: type as any,
      touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id })),
    });
  await send("touchStart", [
    { x: 155, y: cy, id: 1 },
    { x: 235, y: cy, id: 2 },
  ]);
  for (const d of [60, 90, 120, 150]) {
    await send("touchMove", [
      { x: 195 - d, y: cy, id: 1 },
      { x: 195 + d, y: cy, id: 2 },
    ]);
    await page.waitForTimeout(40);
  }
  const after = await zoom();
  await send("touchEnd", []);
  expect(after).toBeGreaterThan(before);
  // A pinch must not leave the player walking off toward the first finger.
  expect(await page.evaluate(() => (window as any).__uhs.running)).toBe(false);

  // A one-finger tap still walks.
  const pos = () =>
    page.evaluate(() => {
      const p = (window as any).__uhs.engine.state.player.pos;
      return `${p.x},${p.y}`;
    });
  const start = await pos();
  await send("touchStart", [{ x: 120, y: 250, id: 1 }]);
  await send("touchEnd", []);
  await expect.poll(pos, { timeout: 15000 }).not.toBe(start);
});

test("phone dialogs, sheets, and menus stay usable across sizes and rotation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enterLife(page);
  await page.evaluate(() => { const r = (window as any).__uhs; r.stop(); r.ambientRate = 0; });
  for (const [width, height] of [[320, 568], [390, 664], [430, 740], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator(".touch-stick")).toBeVisible();
    await reachable(page.getByRole("button", { name: "Travel", exact: true }));
    await expect(page.locator(".topbar-avatar")).toBeInViewport();
    await page.locator(".topbar-avatar").click();
    const dialog = page.getByRole("dialog", { name: "character", exact: true });
    await expect(dialog).toBeVisible();
    const overlaps = await dialog.evaluate((el) => {
      const avatar = el.querySelector(".header-avatar")!.getBoundingClientRect();
      const name = el.querySelector("h2")!.getBoundingClientRect();
      return avatar.right > name.left && avatar.left < name.right && avatar.bottom > name.top && avatar.top < name.bottom;
    });
    expect(overlaps).toBe(false);
    for (const tab of ["Profile", "Household", "Abilities", "Beliefs", "Ideology"]) {
      const button = dialog.getByRole("tab", { name: tab, exact: true });
      await button.scrollIntoViewIfNeeded();
      await reachable(button);
      await button.click();
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    await dialog.getByRole("tab", { name: "Profile", exact: true }).click();
    await expect(dialog).toHaveScreenshot(`character-${width}x${height}.png`, { animations: "disabled", mask: [dialog.locator("canvas")], maxDiffPixelRatio: 0.005 });
    await page.screenshot({ path: `artifacts/mobile/character-${width}x${height}.png`, animations: "disabled" });
    await dialog.locator(".day-plan li[role='button']").first().click();
    const task = page.locator(".tasks");
    await expect(dialog).toBeHidden();
    await reachable(task.getByRole("button", { name: "Close", exact: true }));
    await task.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await reachable(task.getByRole("button", { name: "Close", exact: true }));
    await page.screenshot({ path: `artifacts/mobile/task-${width}x${height}.png`, animations: "disabled" });
    await task.getByRole("button", { name: "Close", exact: true }).click();
    await expect(task).toBeHidden();

    await page.getByRole("button", { name: "Narration", exact: true }).click();
    await expect(page.locator(".touch-controls")).toBeHidden();
    await reachable(page.getByRole("button", { name: "Close narrator", exact: true }));
    await page.getByRole("button", { name: "Rest", exact: true }).click();
    await expect(page.locator(".narrator-panel")).toHaveAttribute("aria-hidden", "true");
    for (const option of await page.getByRole("menuitem").all()) await reachable(option);
    if (width === 390) await expect(page.locator(".rest-options")).toHaveScreenshot("rest-menu.png", { animations: "disabled", maxDiffPixels: 20 });
    await page.screenshot({ path: `artifacts/mobile/rest-${width}x${height}.png`, animations: "disabled" });
    await page.getByRole("button", { name: "Close open panel", exact: true }).click({ position: { x: 4, y: 4 } });

    await page.getByRole("button", { name: "Travel", exact: true }).click();
    const map = page.getByRole("dialog", { name: "map", exact: true });
    await reachable(map.getByRole("button", { name: "Close dialog", exact: true }));
    await reachable(map.getByRole("button", { name: "Period style", exact: true }));
    await reachable(map.getByRole("button", { name: "Earth", exact: true }));
    expect(await map.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `artifacts/mobile/map-${width}x${height}.png`, animations: "disabled" });
    await map.getByRole("button", { name: "Close dialog", exact: true }).click();

    for (const name of ["Notebook", "Settings", "inventory"]) {
      if (name === "inventory") { await page.locator(".game-container").focus(); await page.keyboard.press("i"); }
      else await page.getByRole("button", { name, exact: true }).click();
      const panel = page.getByRole("dialog", { name: name.toLowerCase(), exact: true });
      await reachable(panel.getByRole("button", { name: "Close dialog", exact: true }));
      if (width === 390 && name === "Settings") {
        const close = panel.getByRole("button", { name: "Close dialog", exact: true });
        await expect(close).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        await page.keyboard.press("Tab");
        await expect(close).toBeFocused();
      }
      if (name === "Settings") {
        for (const tab of ["Display", "Audio", "Journeys", "Developer"]) {
          const button = panel.getByRole("tab", { name: tab, exact: true });
          await button.scrollIntoViewIfNeeded(); await reachable(button); await button.click();
        }
      }
      expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await panel.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await reachable(panel.getByRole("button", { name: "Close dialog", exact: true }));
      await page.screenshot({ path: `artifacts/mobile/${name.toLowerCase()}-${width}x${height}.png`, animations: "disabled" });
      await panel.getByRole("button", { name: "Close dialog", exact: true }).click();
    }

    await page.locator(".world-selector").click();
    await reachable(page.getByRole("button", { name: "Close time", exact: true }));
    await page.locator(".time-veil").evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await reachable(page.getByRole("button", { name: "Close time", exact: true }));
    await page.locator(".time-veil").evaluate((el) => { el.scrollTop = 0; });
    await page.screenshot({ path: `artifacts/mobile/time-${width}x${height}.png`, animations: "disabled" });
    await page.getByRole("button", { name: "Close time", exact: true }).click();

    await page.evaluate(() => { const r = (window as any).__uhs; r.select(r.engine.world.places[0].id); });
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(page.locator(".touch-controls")).toBeHidden();
    const sheet = page.locator(".sidebar");
    expect(await sheet.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const lastAction = sheet.locator(".context-section button").last();
    await lastAction.scrollIntoViewIfNeeded();
    await reachable(lastAction);
    await reachable(page.getByRole("button", { name: "Close character panel", exact: true }));
    await page.screenshot({ path: `artifacts/mobile/inspect-${width}x${height}.png`, animations: "disabled" });
    await sheet.evaluate((el) => { el.scrollTop = 0; });
    await reachable(page.getByRole("button", { name: "Close character panel", exact: true }));
    await page.getByRole("button", { name: "Close character panel", exact: true }).click();
    await page.evaluate(() => (window as any).__uhs.select());
    await expect(page.locator(".touch-stick")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 664 });
  const command = page.getByRole("textbox", { name: "Action command", exact: true });
  await command.focus();
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, "height", { configurable: true, get: () => 420 });
    Object.defineProperty(viewport, "offsetTop", { configurable: true, get: () => 80 });
    viewport.dispatchEvent(new Event("resize"));
    viewport.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(() => page.locator(".app").evaluate((el) => Math.round(el.getBoundingClientRect().bottom))).toBe(500);
  await reachable(command);
  await reachable(page.getByRole("button", { name: "Close narrator", exact: true }));
  await command.fill("walk toward the house");
  await expect(page.locator(".touch-controls")).toBeHidden();
  await page.screenshot({ path: "artifacts/mobile/keyboard-viewport.png", animations: "disabled" });
  await page.evaluate(() => {
    delete (window.visualViewport as any).height;
    delete (window.visualViewport as any).offsetTop;
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  expect(errors).toEqual([]);
});

test("joystick walks, sprint is deliberate, and cancellation clears movement", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Multi-touch input injection uses CDP.");
  await enterLife(page);
  await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    r.stop(); r.ambientRate = 0;
    e.cards = []; e.state.plot = undefined;
    e.state.actors = []; e.state.objects = []; e.state.fauna = [];
    e.world.blocked = () => false; e.world.canCross = () => true;
    e.world.topography = undefined; e.world.terrain = () => "grass"; e.world.elevation = () => 0;
    e.world.decoration = () => undefined; e.world.fauna = undefined;
    e.terrainCollision.clear(); e.state.player.pos = { x: 0, y: 0, space: "outside" };
    e.state.player.direction = 1; e.state.player.fatigue = 0; r.emit();
  });
  const cdp = await page.context().newCDPSession(page);
  const send = (type: string, points: { x: number; y: number; id: number }[]) => cdp.send("Input.dispatchTouchEvent", { type: type as any, touchPoints: points });
  const stick = (await page.locator(".touch-stick").boundingBox())!;
  const centre = { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2, id: 1 };
  const edge = { ...centre, x: centre.x + 38 };
  const x = () => page.evaluate(() => (window as any).__uhs.engine.state.player.pos.x);
  await send("touchStart", [centre]);
  expect(await x()).toBe(0);
  await send("touchMove", [edge]);
  await expect.poll(x).toBeGreaterThan(1);
  expect(await page.evaluate(() => (window as any).uhsGame.scene.getScene("world").touchStick.run)).toBe(false);
  await expect(page.locator("canvas[data-character-pose]")).toHaveAttribute("data-character-pose", "walk");
  const animation = await page.evaluate(async () => {
    const scene = (window as any).uhsGame.scene.getScene("world");
    const textures = new Set<string>();
    const start = scene.entities.get("player").x;
    for (let i = 0; i < 24; i++) {
      await new Promise(requestAnimationFrame);
      textures.add(scene.entities.get("player").texture.key);
    }
    return { textures: textures.size, distance: scene.entities.get("player").x - start };
  });
  expect(animation.distance).toBeGreaterThan(0);
  expect(animation.textures).toBeGreaterThan(1);
  const run = (await page.getByRole("button", { name: "Run. Hold while moving", exact: true }).boundingBox())!;
  const sprint = { x: run.x + run.width / 2, y: run.y + run.height / 2, id: 2 };
  await send("touchStart", [edge, sprint]);
  await expect(page.getByRole("button", { name: "Run. Hold while moving", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("canvas[data-character-pose]")).toHaveAttribute("data-character-pose", "run");
  await send("touchEnd", [edge]);
  await expect(page.locator("canvas[data-character-pose]")).toHaveAttribute("data-character-pose", "walk");
  await send("touchCancel", []);
  expect(await page.evaluate(() => (window as any).uhsGame.scene.getScene("world").touchStick)).toBeUndefined();
  expect(await page.evaluate(() => (window as any).uhsGame.scene.getScene("world").pendingDirection)).toBeUndefined();

  await send("touchStart", [centre]); await send("touchMove", [edge]);
  await page.getByRole("button", { name: "Rest", exact: true }).click();
  await send("touchEnd", []);
  await expect(page.locator(".touch-controls")).toBeHidden();
  expect(await page.evaluate(() => (window as any).uhsGame.scene.getScene("world").touchStick)).toBeUndefined();
  const stopped = await x();
  await page.getByRole("button", { name: "Close open panel", exact: true }).click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("Shift");
  expect(await x()).toBe(stopped);
});
