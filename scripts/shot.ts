/** One screenshot of the running game.
 *
 * Usage: npm run shot -- [out.png] ["a prompt"]
 *        npm run shot -- artifacts/ostia.png "A Roman baker in Ostia, 100 CE"
 *
 * Starts the dev server itself if nothing is listening, and stops it again on
 * the way out; an already-running server is left alone. This is the supported
 * way to look at the game. Prefer it to writing another capture script.
 */
import { assertGameServer, base, captureErrors, launchBrowser } from "./capture/lib";
import { expect, type Page } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [out = "artifacts/shot.png", prompt = "A Roman baker in Ostia, 100 CE", review] =
  process.argv.slice(2);

const up = async () => {
  try {
    return (await fetch(base, { signal: AbortSignal.timeout(1000) })).ok;
  } catch {
    return false;
  }
};

let server: ReturnType<typeof spawn> | undefined;
let browser: Awaited<ReturnType<typeof launchBrowser>> | undefined;
let page: Page | undefined;
try {
  if (!(await up())) {
    console.log(`no server at ${base}; starting one`);
    // Own the Vite process directly so cleanup cannot leave an npx child running.
    server = spawn(
      process.execPath,
      [resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", new URL(base).port, "--strictPort"],
      { stdio: "inherit" },
    );
    let startupError: Error | undefined;
    server.on("error", (error) => { startupError = error; });
    const deadline = Date.now() + 60000;
    while (!(await up())) {
      if (startupError) throw startupError;
      if (server.exitCode !== null || server.signalCode !== null)
        throw Error(`Dev server exited before startup (${server.signalCode ?? server.exitCode}). See Vite output above.`);
      if (Date.now() > deadline) throw Error(`Dev server never came up at ${base}. See Vite output above.`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  await assertGameServer();
  browser = await launchBrowser();
  // UHS_VIEWPORT="390x844" for a phone.
  const [width, height] = (process.env.UHS_VIEWPORT ?? "1440x1100").split("x").map(Number);
  page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 700, isMobile: width < 700 });
  const assertHealthy = captureErrors(page);
  // UHS_SPRITES="f" picks the character renderer, as Settings → Display does.
  if (process.env.UHS_SPRITES)
    await page.addInitScript(`localStorage.setItem("uhs-character-sprites", ${JSON.stringify(process.env.UHS_SPRITES)})`);
  page.on("console", (m) => { if (m.type() === "error") console.error("browser", m.text()); });
  const url = new URL(base);
  url.searchParams.set("start", prompt);
  if (process.env.UHS_SEED) url.searchParams.set("seed", process.env.UHS_SEED);
  await page.goto(url.href);
  await page.locator("#opening-prompt").fill(prompt);
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  // A prompt that only partly matches opens the details dialog, whose own
  // Begin starts play; one that matches outright starts at once.
  const confirm = page
    .getByRole("dialog")
    .getByRole("button", { name: "Begin", exact: true });
  await confirm.or(page.locator(".arrival")).waitFor({ state: "visible", timeout: 30000 });
  if (await confirm.isVisible()) await confirm.click();
  // The arrival card holds play until "Enter life" is pressed.
  const enter = page.getByRole("button", { name: /Enter life/ });
  const startError = page.locator(".modal-world [role='alert'], .splash:not(:has(.modal-world, .arrival)) > .splash-error");
  await enter.or(startError).first().waitFor({ state: "visible", timeout: 120000 });
  if (await startError.first().isVisible())
    throw Error(`Could not start ${JSON.stringify(prompt)}: ${await startError.first().innerText()}`);
  await enter.click({ timeout: 120000 });
  await page.getByRole("button", { name: /^(Begin your day|Continue)$/ }).click({ timeout: 120000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 120000,
  });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 120000 });
  if (process.env.UHS_ZOOM)
    await page.evaluate((zoom) => (window as any).__uhs.setZoom(zoom), Number(process.env.UHS_ZOOM));
  if (process.env.UHS_SEED)
    await page.evaluate(() => (window as any).__uhs.stop());
  // UHS_AT="x,y" stands the player on that cell first (needs the dev server).
  if (process.env.UHS_AT) {
    const [x, y] = process.env.UHS_AT.split(",").map(Number);
    await page.evaluate(
      ([x, y]) => {
        const r = (window as any).__uhs;
        r.engine.state.player.pos = { x, y, space: "outside" };
        r.emit();
      },
      [x, y],
    );
    await page.waitForTimeout(4000);
  }
  // UHS_EVAL runs in the page with `r` bound to window.__uhs: a clock to set,
  // a place to stand. Whatever it returns is printed.
  if (process.env.UHS_EVAL) {
    console.log(await page.evaluate(`(async (r) => { ${process.env.UHS_EVAL} })(window.__uhs)`));
    await page.waitForTimeout(Number(process.env.UHS_WAIT ?? 3000));
  }
  // UHS_KEYS="m" opens the region map, and so on for any key the game binds.
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-terrain-ready", "true", { timeout: 120000 });
  for (const key of process.env.UHS_KEYS ?? "") {
    await page.keyboard.press(key);
    await page.waitForTimeout(4000);
  }
  mkdirSync(dirname(out), { recursive: true });
  // A live collision study, using the same commands as movement input.
  if (review === "--toppling") {
    const dir = await page.evaluate(() => {
      const r = (window as any).__uhs, e = r.engine, p = e.state.player.pos;
      r.stop();
      const dir = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) =>
        !e.blocked(p.x + dx, p.y + dy, p.space) && e.playerCanCross(p, { x: p.x + dx, y: p.y + dy }));
      if (!dir) throw Error("No clear approach for the toppling study");
      e.state.objects.push({ id: "toppling-study", prop: "romanMilestone", name: "Roman milestone",
        kind: "monument", sprite: "study-propb-roman-milestone-0", inventory: {},
        pos: { ...p, x: p.x + dir[0], y: p.y + dir[1] } });
      r.emit();
      return dir;
    });
    for (const [state, run] of [["lean", true], ["fallen", false]] as const) {
      await page.evaluate(([dx, dy, run]) => {
        const result = (window as any).__uhs.command({ type: "move", dx, dy, run });
        if (result.status !== "completed") throw Error("Toppling study collision was refused");
      }, [dir[0], dir[1], run]);
      await page.waitForFunction((state) => {
        const sprite = (window as any).uhsGame.scene.getScene("world").entities.get("toppling-study");
        return sprite?.frame.name.includes(state);
      }, state);
      await page.waitForTimeout(400);
      await page.screenshot({ path: out.replace(/\.png$/, `-${state}.png`) });
    }
  }
  const actual = await page.evaluate(() => {
    const r = (window as any).__uhs, s = r.engine.state;
    return { seed: s.manifest.seed, setting: { location: s.manifest.setting?.location, year: s.manifest.setting?.year, role: s.player.role }, camera: s.player.pos, zoom: r.zoom };
  });
  if (process.env.UHS_SEED && actual.seed !== process.env.UHS_SEED)
    throw Error(`Expected seed ${process.env.UHS_SEED}, got ${actual.seed}`);
  assertHealthy();
  await page.screenshot({ path: out });
  assertHealthy();
  console.log(JSON.stringify({ path: resolve(out), ...actual }));
} catch (error) {
  if (page) {
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out.replace(/\.png$/i, "") + "-failure.png" }).catch(() => {});
    console.error(await page.locator("body").innerText({ timeout: 2000 }).catch(() => ""));
  }
  throw error;
} finally {
  try {
    await browser?.close();
  } finally {
    server?.kill();
  }
}
