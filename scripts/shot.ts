/** Screenshots of the running game.
 *
 * Usage: npm run shot -- [out.png] ["a prompt"] [more.png "another prompt" ...]
 *        npm run shot -- artifacts/ostia.png "A Roman baker in Ostia, 100 CE"
 *
 * Several pairs share one server and one browser. Set UHS_URL or PORT to use
 * a running dev server, or UHS_SHOT_TIMEOUT_MS to change the per-shot deadline.
 */
import { assertGameServer, base, launchBrowser } from "./capture/lib";
import { expect, type Browser, type Locator } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";

const review = process.argv.find((a) => a === "--toppling");
const rest = process.argv.slice(2).filter((a) => a !== review);
const jobs: [string, string][] = [];
for (let i = 0; i < rest.length; i += 2) jobs.push([rest[i], rest[i + 1] ?? "A Roman baker in Ostia, 100 CE"]);
if (!jobs.length) jobs.push(["artifacts/shot.png", "A Roman baker in Ostia, 100 CE"]);

const shotTimeout = Number(process.env.UHS_SHOT_TIMEOUT_MS ?? 120000);
if (!Number.isSafeInteger(shotTimeout) || shotTimeout <= 0 || shotTimeout > 2 ** 31 - 1)
  throw Error("UHS_SHOT_TIMEOUT_MS must be a positive timeout in milliseconds.");

const up = async (at: string) => {
  try {
    return (await fetch(at, { signal: AbortSignal.timeout(1000) })).ok;
  } catch {
    return false;
  }
};
const sparePort = () =>
  new Promise<number>((done, fail) => {
    const probe = createServer().once("error", fail).listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => done(port));
    });
  });

let server: ReturnType<typeof spawn> | undefined;
let browser: Browser | undefined;
let failed = 0;
try {
  let site = base;
  if (!process.env.UHS_URL && !process.env.PORT) {
    site = `http://127.0.0.1:${await sparePort()}`;
    console.log(`shot starting a dev server at ${site}`);
    // Own the Vite process directly so cleanup cannot leave an npx child running.
    server = spawn(
      process.execPath,
      [resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", new URL(site).port, "--strictPort"],
      { stdio: "inherit", env: { ...process.env, UHS_STILL: "1" } },
    );
    let startupError: Error | undefined;
    server.on("error", (error) => { startupError = error; });
    const deadline = Date.now() + 60000;
    while (!(await up(site))) {
      if (startupError) throw startupError;
      if (server.exitCode !== null || server.signalCode !== null)
        throw Error(`Dev server exited before startup (${server.signalCode ?? server.exitCode}). See Vite output above.`);
      if (Date.now() > deadline) throw Error(`Dev server never came up at ${site}. See Vite output above.`);
      await new Promise((r) => setTimeout(r, 500));
    }
  } else console.log(`shot using the dev server at ${site}`);
  await assertGameServer(site);
  console.log("shot launching Chrome");
  browser = await launchBrowser();
  for (const [out, prompt] of jobs)
    await shoot(browser, site, out, prompt).catch((error) => {
      failed++;
      console.error(`shot failed: ${out}\n`, error);
    });
} finally {
  try {
    await browser?.close();
  } finally {
    server?.kill();
  }
}
if (failed) process.exit(1);

async function shoot(browser: Browser, site: string, out: string, prompt: string) {
  // UHS_VIEWPORT="390x844" for a phone.
  const [width, height] = (process.env.UHS_VIEWPORT ?? "1440x1100").split("x").map(Number);
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 700, isMobile: width < 700 });
  page.setDefaultTimeout(shotTimeout);
  const started = performance.now();
  const elapsed = () => `${((performance.now() - started) / 1000).toFixed(1)}s`;
  let stage = "opening the starting screen";
  let submitted = false;
  let failure: Error | undefined;
  let rejectCapture!: (reason: Error) => void;
  const interrupted = new Promise<never>((_, reject) => { rejectCapture = reject; });
  const stop = (error: Error) => {
    failure ??= error;
    rejectCapture(failure);
  };
  const timer = setTimeout(() => stop(Error(`Shot exceeded its ${shotTimeout / 1000}s deadline.`)), shotTimeout);
  page.on("pageerror", (error) => stop(Error(`Browser error: ${error.message}`, { cause: error })));
  page.on("crash", () => stop(Error("Chrome crashed while capturing the game.")));
  page.on("framenavigated", (frame) => {
    if (submitted && frame === page.mainFrame()) stop(Error("The game page navigated or reloaded after Begin."));
  });
  page.on("console", (m) => { if (m.type() === "error") console.error("browser", m.text()); });
  const phase = (next: string) => {
    if (failure) throw failure;
    stage = next;
    console.log(`shot ${out} [${elapsed()}] ${stage}`);
  };
  const startError = page.locator(".modal-world [role='alert'], .splash-content:not([inert]) .splash-error").filter({ visible: true });
  const waitForStart = async (target: Locator) => {
    await target.filter({ visible: true }).or(startError).first().waitFor();
    if (await startError.first().isVisible())
      throw Error(`Could not start ${JSON.stringify(prompt)}: ${await startError.first().innerText()}`);
  };
  try {
    await Promise.race([capture(), interrupted]);
  } catch (error) {
    const failedAt = elapsed();
    clearTimeout(timer);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out.replace(/\.png$/i, "") + "-failure.png", timeout: 2000 }).catch(() => {});
    const screen = await page.locator("body").innerText({ timeout: 1000 }).catch(() => "");
    if (screen) console.error(screen.slice(0, 1600));
    throw Error(`${stage} failed after ${failedAt}: ${error instanceof Error ? error.message : error}`, { cause: error });
  } finally {
    clearTimeout(timer);
    await page.close();
  }

  async function capture() {
    phase("opening the starting screen");
    // UHS_SPRITES="f" picks the character renderer, as Settings → Display does.
    if (process.env.UHS_SPRITES)
      await page.addInitScript(`localStorage.setItem("uhs-character-sprites", ${JSON.stringify(process.env.UHS_SPRITES)})`);
    const url = new URL(site);
    url.searchParams.set("start", prompt);
    if (process.env.UHS_SEED) url.searchParams.set("seed", process.env.UHS_SEED);
    await page.goto(url.href, { waitUntil: "domcontentloaded" });
    await page.locator("#opening-prompt").fill(prompt);
    phase("submitting the starting prompt");
    submitted = true;
    await page.getByRole("button", { name: "Begin", exact: true }).click();
    // A prompt that only partly matches opens the details dialog, whose own
    // Begin starts play; one that matches outright starts at once.
    const confirm = page.locator(".modal-world").getByRole("button", { name: "Begin", exact: true });
    await waitForStart(confirm.or(page.locator(".arrival")));
    if (await confirm.isVisible()) await confirm.click();
    // The arrival card holds play until "Enter life" is pressed.
    const enter = page.getByRole("button", { name: /Enter life/ });
    phase("generating the world");
    await waitForStart(enter);
    phase("entering the game");
    await enter.click();
    await page.waitForFunction(() => !!(window as any).historySim);
    phase("dismissing the intro card");
    await page.getByRole("button", { name: /^(Begin your day|Continue)$/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: shotTimeout });
    phase("initializing the renderer");
    await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: shotTimeout });
    if (process.env.UHS_ZOOM || process.env.UHS_AT || process.env.UHS_EVAL) phase("applying capture options");
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
    phase("drawing visible terrain");
    await expect(page.locator(".game-container canvas")).toHaveAttribute("data-terrain-ready", "true", { timeout: shotTimeout });
    phase("capturing the screenshot");
    // UHS_KEYS="m" opens the region map, and so on for any key the game binds.
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
    await page.screenshot({ path: out });
    console.log(JSON.stringify({ path: resolve(out), ...actual }));
  }
}
