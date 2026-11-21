/** Screenshots and visual playtesting of the running game.
 *
 * One-shot screenshots:
 *   npm run shot -- [out.png] ["a prompt"] [more.png "another prompt" ...]
 *   npm run shot -- artifacts/ostia.png "A Roman baker in Ostia, 100 CE"
 *
 * Visual playtest (shared Agent commands + shot/zoom/at/key/click):
 *   printf 'look\nshot artifacts/1.png\ngoto b1\nenter b1\nshot artifacts/2.png\n' |
 *     npm run shot -- --play --setting "Weaver in Oaxaca 1650" --seed play1
 *   npm run shot -- --play --setting "Weaver in Oaxaca 1650" --script steps.txt
 *
 * Starts an offline private Vite server by default (UHS_OFFLINE=1, UHS_STILL=1).
 * Set UHS_URL or PORT to use a running server, or UHS_SHOT_TIMEOUT_MS for the deadline.
 */
import { launchBrowser, startGameServer } from "./capture/lib";
import { expect, type Browser, type Locator, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";

const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);
const flag = (name: string) => {
  const i = argv.indexOf(name);
  return i < 0 ? undefined : argv[i + 1];
};
const flagAll = (name: string) => {
  const values: string[] = [];
  for (let i = 0; i < argv.length; i++)
    if (argv[i] === name && argv[i + 1] !== undefined) values.push(argv[++i]);
  return values;
};

const playMode = has("--play") || has("--script") || flagAll("--cmd").length > 0;
const paid = has("--paid") || process.env.UHS_ALLOW_PAID === "1";
const shotTimeout = Number(process.env.UHS_SHOT_TIMEOUT_MS ?? 120000);
if (!Number.isSafeInteger(shotTimeout) || shotTimeout <= 0 || shotTimeout > 2 ** 31 - 1)
  throw Error("UHS_SHOT_TIMEOUT_MS must be a positive timeout in milliseconds.");

const log = (msg: string) => (playMode ? console.error(msg) : console.log(msg));

async function waitVisualSettle(page: Page, timeout = shotTimeout) {
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector<HTMLCanvasElement>(".game-container canvas");
      if (!canvas || canvas.dataset.ready !== "true") return false;
      if (canvas.dataset.terrainReady !== "true") return false;
      if (canvas.dataset.terrainPending && canvas.dataset.terrainPending !== "0") return false;
      const scene = (window as any).uhsGame?.scene.getScene("world");
      return !scene?.fadingOut && !scene?.cameras?.main?.fadeEffect?.isRunning;
    },
    {},
    { timeout },
  );
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function openWorld(
  browser: Browser,
  site: string,
  prompt: string,
  seed: string | undefined,
  label: string,
) {
  // UHS_VIEWPORT="390x844" for a phone.
  const [width, height] = (process.env.UHS_VIEWPORT ?? "1440x1100").split("x").map(Number);
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 700, isMobile: width < 700 });
  page.setDefaultTimeout(shotTimeout);
  const started = performance.now();
  const elapsed = () => `${((performance.now() - started) / 1000).toFixed(1)}s`;
  let stage = "opening the starting screen";
  let submitted = false;
  let failure: Error | undefined;
  let rejectRun!: (reason: Error) => void;
  const interrupted = new Promise<never>((_, reject) => { rejectRun = reject; });
  const stop = (error: Error) => {
    failure ??= error;
    rejectRun(failure);
  };
  page.on("pageerror", (error) => stop(Error(`Browser error: ${error.message}`, { cause: error })));
  page.on("crash", () => stop(Error("Chrome crashed while running the game.")));
  page.on("framenavigated", (frame) => {
    if (submitted && frame === page.mainFrame()) stop(Error("The game page navigated or reloaded after Begin."));
  });
  page.on("console", (m) => { if (m.type() === "error") console.error("browser", m.text()); });
  const phase = (next: string) => {
    if (failure) throw failure;
    stage = next;
    log(`shot ${label} [${elapsed()}] ${stage}`);
  };
  const startError = page.locator(".modal-world [role='alert'], .splash-content:not([inert]) .splash-error").filter({ visible: true });
  const waitForStart = async (target: Locator) => {
    await target.filter({ visible: true }).or(startError).first().waitFor();
    if (await startError.first().isVisible())
      throw Error(`Could not start ${JSON.stringify(prompt)}: ${await startError.first().innerText()}`);
  };
  const enterWorld = async () => {
    phase("opening the starting screen");
    const url = new URL(site);
    url.searchParams.set("start", prompt);
    if (seed) url.searchParams.set("seed", seed);
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
    await waitVisualSettle(page, shotTimeout);
  };
  return { page, phase, elapsed, interrupted, stop, enterWorld, stage: () => stage };
}

async function shoot(browser: Browser, site: string, out: string, prompt: string) {
  const session = await openWorld(browser, site, prompt, process.env.UHS_SEED, out);
  const { page, phase, elapsed, interrupted, stop } = session;
  const timer = setTimeout(() => stop(Error(`Shot exceeded its ${shotTimeout / 1000}s deadline.`)), shotTimeout);
  try {
    await Promise.race([
      (async () => {
        await session.enterWorld();
        if (process.env.UHS_ZOOM || process.env.UHS_AT || process.env.UHS_EVAL) phase("applying capture options");
        if (process.env.UHS_ZOOM)
          await page.evaluate((zoom) => (window as any).__uhs.setZoom(zoom), Number(process.env.UHS_ZOOM));
        if (process.env.UHS_SEED)
          await page.evaluate(() => (window as any).__uhs.stop());
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
          await waitVisualSettle(page);
        }
        if (process.env.UHS_EVAL) {
          console.log(await page.evaluate(`(async (r) => { ${process.env.UHS_EVAL} })(window.__uhs)`));
          if (process.env.UHS_WAIT) await page.waitForTimeout(Number(process.env.UHS_WAIT));
          await waitVisualSettle(page);
        }
        phase("capturing the screenshot");
        for (const key of process.env.UHS_KEYS ?? "") {
          await page.keyboard.press(key);
          await page.waitForTimeout(Number(process.env.UHS_WAIT ?? 300));
        }
        await waitVisualSettle(page);
        mkdirSync(dirname(out), { recursive: true });
        const actual = await page.evaluate(() => {
          const r = (window as any).__uhs, s = r.engine.state;
          return { seed: s.manifest.seed, setting: { location: s.manifest.setting?.location, year: s.manifest.setting?.year, role: s.player.role }, camera: s.player.pos, zoom: r.zoom };
        });
        if (process.env.UHS_SEED && actual.seed !== process.env.UHS_SEED)
          throw Error(`Expected seed ${process.env.UHS_SEED}, got ${actual.seed}`);
        await page.screenshot({ path: out });
        console.log(JSON.stringify({ path: resolve(out), ...actual }));
      })(),
      interrupted,
    ]);
  } catch (error) {
    const failedAt = elapsed();
    clearTimeout(timer);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out.replace(/\.png$/i, "") + "-failure.png", timeout: 2000 }).catch(() => {});
    const screen = await page.locator("body").innerText({ timeout: 1000 }).catch(() => "");
    if (screen) console.error(screen.slice(0, 1600));
    throw Error(`${session.stage()} failed after ${failedAt}: ${error instanceof Error ? error.message : error}`, { cause: error });
  } finally {
    clearTimeout(timer);
    await page.close();
  }
}

async function* commandStream(): AsyncGenerator<string> {
  const cmds = flagAll("--cmd");
  const scriptPath = flag("--script");
  if (scriptPath) {
    for (const line of readFileSync(scriptPath, "utf8").split("\n")) yield line;
  }
  for (const line of cmds) yield line;
  if (!scriptPath && !cmds.length) {
    const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
    for await (const line of rl) yield line;
  }
}

async function runVisualPlay(browser: Browser, site: string) {
  const prompt = flag("--setting") ?? "A Roman baker in Ostia, 100 CE";
  const seed = flag("--seed") ?? process.env.UHS_SEED;
  const timeTravel = has("--time-travel");
  const concern = has("--concern");
  const session = await openWorld(browser, site, prompt, seed, "play");
  const { page, phase, interrupted } = session;
  try {
    await Promise.race([session.enterWorld(), interrupted]);
    phase("attaching agent to live browser runtime");
    await page.evaluate(
      async ({ offline, timeTravel, concern }) => {
        const [{ Agent, parsePlayLine }, { RunRecord }] = await Promise.all([
          import("/src/agents/agent.ts" as string),
          import("/src/agents/record.ts" as string),
        ]);
        const r = (window as any).__uhs;
        r.stop();
        const record = new RunRecord({ mode: "play", offline });
        const agent = new Agent(r, record, { offline, timeTravel, concern });
        (window as any).__uhsPlay = { agent, record, parsePlayLine };
      },
      { offline: !paid, timeTravel, concern },
    );
    phase("ready for commands");
    const reply = (obj: unknown) => console.log(JSON.stringify(obj));
    for await (const raw of commandStream()) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const [, verb, rest = ""] = /^(\S+)(?:\s+(.*))?$/.exec(line)!;
      if (verb === "quit" || verb === "q") break;
      if (verb === "shot" || verb === "screenshot") {
        const out = rest.trim() || "artifacts/shot.png";
        await waitVisualSettle(page);
        mkdirSync(dirname(out), { recursive: true });
        await page.screenshot({ path: out });
        const state = await page.evaluate(() => {
          const r = (window as any).__uhs, s = r.engine.state;
          return { pos: s.player.pos, zoom: r.zoom, clock: s.clock, hash: r.engine.hash() };
        });
        reply({ tool: "shot", status: "saved", path: resolve(out), ...state });
        continue;
      }
      if (verb === "zoom") {
        const z = Number(rest);
        if (!Number.isFinite(z) || z <= 0) {
          reply({ tool: "zoom", status: "invalid", text: `Invalid zoom: ${rest}` });
          continue;
        }
        await page.evaluate((level) => (window as any).__uhs.setZoom(level), z);
        await waitVisualSettle(page);
        reply({ tool: "zoom", status: "completed", zoom: z });
        continue;
      }
      if (verb === "at") {
        const xy = /^(-?\d+)\s+(-?\d+)(?:\s+(\S+))?$/.exec(rest);
        if (!xy) {
          reply({ tool: "at", status: "invalid", text: "Usage: at <x> <y> [space]" });
          continue;
        }
        await page.evaluate(
          ([x, y, space]) => {
            const r = (window as any).__uhs;
            r.engine.state.player.pos = { x, y, space: space ?? r.engine.state.player.pos.space };
            r.emit();
          },
          [Number(xy[1]), Number(xy[2]), xy[3]] as const,
        );
        await waitVisualSettle(page);
        reply({ tool: "at", status: "completed", x: Number(xy[1]), y: Number(xy[2]) });
        continue;
      }
      if (verb === "key") {
        await page.keyboard.press(rest.trim());
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        reply({ tool: "key", status: "completed", key: rest.trim() });
        continue;
      }
      if (verb === "click") {
        const target = rest.trim();
        await page.getByRole("button", { name: target }).or(page.locator(target)).first().click();
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        reply({ tool: "click", status: "completed", target });
        continue;
      }
      if (verb === "eval") {
        const value = await page.evaluate(`(async (r) => { ${rest} })(window.__uhs)`);
        await waitVisualSettle(page);
        reply({ tool: "eval", status: "completed", value });
        continue;
      }
      const result = await page.evaluate(async (cmdLine) => {
        const { agent, record, parsePlayLine } = (window as any).__uhsPlay;
        const parsed = parsePlayLine(cmdLine);
        if (!parsed) return null;
        if ("error" in parsed) return { tool: cmdLine.split(/\s+/, 1)[0], status: "invalid", text: parsed.error };
        const text = await agent.call(parsed.tool, parsed.input);
        const entry = record.entries.at(-1);
        return { tool: parsed.tool, status: entry.status, text, clock: entry.clock, after: entry.after, hash: entry.hash };
      }, line);
      if (result) reply(result);
    }
  } finally {
    await page.close();
  }
}

const server = await startGameServer({
  reuseDefault: false,
  offline: !paid,
  log: (line) => log(`shot ${line}`),
  viteStdio: playMode ? "stderr" : "inherit",
});
let browser: Browser | undefined;
let failed = 0;
try {
  log("shot launching Chrome");
  browser = await launchBrowser();
  if (playMode) {
    await runVisualPlay(browser, server.url);
  } else {
    const rest = argv.filter((a) => a !== "--paid");
    const jobs: [string, string][] = [];
    for (let i = 0; i < rest.length; i += 2)
      jobs.push([rest[i], rest[i + 1] ?? "A Roman baker in Ostia, 100 CE"]);
    if (!jobs.length) jobs.push(["artifacts/shot.png", "A Roman baker in Ostia, 100 CE"]);
    for (const [out, prompt] of jobs)
      await shoot(browser, server.url, out, prompt).catch((error) => {
        failed++;
        console.error(`shot failed: ${out}\n`, error);
      });
  }
} finally {
  try {
    await browser?.close();
  } finally {
    server.close();
  }
}
if (failed) process.exit(1);
