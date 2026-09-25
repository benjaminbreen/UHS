/** Shared plumbing for the review captures.
 *
 * Every capture used to carry its own copy of this: launch Chrome, open a
 * page, wait for the lab to settle, screenshot, close. The bespoke part of a
 * capture is the composition it draws, not the browser handling.
 */
import { chromium, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

export const base =
  process.env.UHS_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5173}`;

/** Chrome by default; CHROME_PATH points at another build, as in playwright.config.ts. */
export function launchBrowser() {
  const path = process.env.CHROME_PATH;
  return chromium.launch(path ? { executablePath: path } : { channel: "chrome" });
}

/** Open a page, run the capture, and close the browser even if it throws. */
export async function withPage(
  { width = 1440, height = 1100 }: { width?: number; height?: number },
  run: (page: Page) => Promise<void>,
) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", (e) => console.error("pageerror", e.message));
    await run(page);
  } finally {
    await browser.close();
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
export async function settled(page: Page) {
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.getAttribute("data-terrain-pending") ===
      "0",
    {},
    { timeout: 90000 },
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
  const { writeFile } = await import("node:fs/promises");
  await mkdir(out.replace(/\/[^/]+$/, ""), { recursive: true });
  await writeFile(out, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`wrote ${out}`);
}
