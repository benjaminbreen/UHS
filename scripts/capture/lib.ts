/** Shared plumbing for the review captures and game screenshots. */
import { chromium, type Page } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";

export let base =
  process.env.UHS_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5173}`;

/** Chrome by default; CHROME_PATH points at another build, as in playwright.config.ts. */
export function launchBrowser() {
  const path = process.env.CHROME_PATH;
  return chromium.launch(path ? { executablePath: path } : { channel: "chrome" });
}

export function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    console.error("pageerror", e.message);
    errors.push(e.message);
  });
  return () => {
    if (errors.length) throw Error(`Capture failed with browser errors:\n${errors.join("\n")}`);
  };
}

export async function isGameServer(at = base): Promise<boolean> {
  const html = await fetch(at, { signal: AbortSignal.timeout(3000) })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");
  return html.includes("<title>Universal History Simulator</title>");
}

/** Other projects' dev servers also default to 5173; loading one looks like the game hanging. */
export async function assertGameServer(at = base) {
  if (!(await isGameServer(at)))
    throw Error(
      `${at} is not this game's dev server. Start it (npm run dev) and pass its port as PORT=<port> or UHS_URL=<url>.`,
    );
}

const sparePort = () =>
  new Promise<number>((done, fail) => {
    const probe = createServer().once("error", fail).listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => done(port));
    });
  });

/** Ensures a Vite dev server is available and updates `base`. Reuses UHS_URL / PORT
 * when given; otherwise spawns an isolated offline Vite server on a free port. */
export async function startGameServer({
  reuseDefault = false,
  offline = process.env.UHS_ALLOW_PAID !== "1",
  log = (line: string) => console.log(line),
  viteStdio = "inherit",
}: {
  reuseDefault?: boolean;
  offline?: boolean;
  log?: (line: string) => void;
  viteStdio?: "inherit" | "stderr";
} = {}): Promise<{ url: string; close: () => void }> {
  const explicit = !!(process.env.UHS_URL || process.env.PORT);
  if (explicit || (reuseDefault && (await isGameServer(base)))) {
    await assertGameServer(base);
    log(`using dev server at ${base}`);
    return { url: base, close: () => {} };
  }
  const port = await sparePort();
  const site = `http://127.0.0.1:${port}`;
  log(`starting dev server at ${site}${offline ? " (offline)" : ""}`);
  // Own the Vite process directly so cleanup cannot leave an npx child running.
  const server: ChildProcess = spawn(
    process.execPath,
    [resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      stdio: viteStdio === "stderr" ? ["ignore", "pipe", "inherit"] : "inherit",
      env: { ...process.env, UHS_STILL: "1", ...(offline ? { UHS_OFFLINE: "1" } : {}) },
    },
  );
  if (viteStdio === "stderr") server.stdout?.on("data", (chunk) => process.stderr.write(chunk));
  let startupError: Error | undefined;
  server.on("error", (error) => { startupError = error; });
  const deadline = Date.now() + 60000;
  while (!(await isGameServer(site))) {
    if (startupError) {
      server.kill();
      throw startupError;
    }
    if (server.exitCode !== null || server.signalCode !== null)
      throw Error(`Dev server exited before startup (${server.signalCode ?? server.exitCode}). See Vite output above.`);
    if (Date.now() > deadline) {
      server.kill();
      throw Error(`Dev server never came up at ${site}. See Vite output above.`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  base = site;
  return { url: site, close: () => { server.kill(); } };
}

/** Open a page, run the capture, and close browser + owned server even if it throws. */
export async function withPage(
  { width = 1440, height = 1100 }: { width?: number; height?: number },
  run: (page: Page) => Promise<void>,
) {
  const server = await startGameServer({ reuseDefault: true });
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    const assertHealthy = captureErrors(page);
    await run(page);
    assertHealthy();
  } finally {
    try {
      await browser.close();
    } finally {
      server.close();
    }
  }
}

/** The character lab, with its animation paused so frames are reproducible. */
export async function characterLab(page: Page, { paused = false } = {}) {
  await page.goto(`${base}/character-lab`);
  if (paused) await page.getByRole("button", { name: "Pause", exact: true }).click();
}

/** Screenshot whatever the page's own canvas currently holds. */
export async function shootCanvas(page: Page, out: string) {
  await mkdir(out.replace(/\/[^/]+$/, ""), { recursive: true });
  await page.locator("canvas").screenshot({ path: out });
  console.log(`wrote ${out}`);
}

/** The terrain lab settles in two stages: the world builds, then the pending
 * draw queue empties. Screenshotting between the two catches a half-drawn
 * map, which is what the explicit attribute waits are for. */
export async function terrainLab(
  page: Page,
  query: string,
  { seed = "street-review", pauseWater = true } = {},
) {
  const url = `${base}/terrain-lab?seed=${seed}&${query}`;
  await page.goto(url);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
      "true",
    {},
    { timeout: 90000 },
  );
  if (pauseWater)
    await page.getByRole("button", { name: "Pause water" }).click();
  await settled(page);
  return url;
}

/** Wait for the terrain lab's draw queue to drain. */
export async function settled(page: Page, timeout = 90000) {
  await page.waitForFunction(
    () => {
      const c = document.querySelector("canvas");
      const ready = c?.getAttribute("data-terrain-ready") === "true";
      const pending = c?.getAttribute("data-terrain-pending");
      return ready && (!pending || pending === "0");
    },
    {},
    { timeout },
  );
}

/** Centre the lab camera on the world spawn and redraw. */
export async function centreOnSpawn(page: Page) {
  await page.evaluate(() => {
    const lab = (window as any).terrainLab;
    lab.scene.options.center = { ...lab.runtime.engine.world.spawn };
    lab.scene.draw();
  });
  await settled(page);
}

/** Set the lab zoom and redraw. */
export async function zoom(page: Page, level: number) {
  await page.evaluate((z) => {
    const lab = (window as any).terrainLab;
    lab.runtime.zoom = z;
    lab.scene.draw();
  }, level);
  await settled(page);
}

/** The contact sheet each review writes beside its images, so the whole set
 * can be looked at in one page rather than opened file by file. */
export async function contactSheet(
  dir: string,
  title: string,
  cards: string[],
) {
  await mkdir(dir, { recursive: true });
  await writeFile(
    `${dir}/index.html`,
    `<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{background:#252e24;color:#eee9d2;font:16px system-ui;margin:36px}img{width:100%;image-rendering:pixelated}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}a{color:#ced9a9}</style><h1>${title}</h1><main>${cards.join("")}</main>`,
  );
  console.log(`wrote ${dir}/index.html`);
}

/** One card in a contact sheet. */
export const card = (name: string, url: string, extra = "") =>
  `<article><h2>${name}</h2><a href="${name}.png"><img src="${name}.png"></a><p>${extra}<a href="${url}">Explore</a></p></article>`;

/** Some sheets compose a canvas larger than the viewport and hand back a data
 * URL rather than being screenshotted, so the whole sheet survives. */
export async function writeDataUrl(dataUrl: string, out: string) {
  await mkdir(out.replace(/\/[^/]+$/, ""), { recursive: true });
  await writeFile(out, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`wrote ${out}`);
}
