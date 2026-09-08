/** Review captures only; deliberately separate from the active browser test suite. */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1536, height: 1024 },
  deviceScaleFactor: 1,
});
const studies = [
  ["tundra", "summer", "river-ew"],
  ["boreal-woodland", "summer", "river-ns"],
  ["grassland", "summer", "river-ew"],
  ["temperate-woodland", "autumn", "river-ns"],
  ["tropical-woodland", "summer", "river-ns"],
  ["wetland", "summer", "lake"],
  ["dry-scrub", "summer", "river-ew"],
  ["desert", "summer", "river-ns"],
  ["boreal-woodland", "winter", "river-ns"],
];
await mkdir("artifacts/habitat-review", { recursive: true });
const cards: string[] = [];
try {
  for (const [ecology, season, water] of studies) {
    const name = `${ecology}-${season}`;
    const url = `http://127.0.0.1:5173/terrain-lab?seed=habitat-review&ecology=${ecology}&season=${season}&water=${water}&landform=rolling&population=none&start=wanderer`;
    await page.goto(url);
    const canvas = page.locator("canvas[data-terrain-ready]");
    await canvas.waitFor({ timeout: 60000 });
    await page.waitForFunction(
      () =>
        document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
        "true",
      {},
      { timeout: 60000 },
    );
    await page.getByRole("button", { name: "Pause water" }).click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("canvas")
          ?.getAttribute("data-terrain-pending") === "0",
      {},
      { timeout: 60000 },
    );
    await canvas.screenshot({ path: `artifacts/habitat-review/${name}.png` });
    await page.evaluate(() => {
      const lab = (window as any).terrainLab;
      lab.runtime.zoom = 2;
      lab.scene.draw();
    });
    await page.waitForFunction(
      () =>
        document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
          "true" &&
        document
          .querySelector("canvas")
          ?.getAttribute("data-terrain-pending") === "0",
      {},
      { timeout: 60000 },
    );
    await canvas.screenshot({
      path: `artifacts/habitat-review/${name}-detail.png`,
    });
    cards.push(
      `<article><h2>${ecology.replaceAll("-", " ")} · ${season}</h2><a href="${name}.png"><img src="${name}.png" alt="${name} overview"></a><p><a href="${name}-detail.png">Open 2× detail</a> · <a href="${url}">Explore scene</a></p></article>`,
    );
    console.log(`Captured ${name}`);
  }
} finally {
  await browser.close();
}
await writeFile(
  "artifacts/habitat-review/index.html",
  `<!doctype html><html><meta charset="utf-8"><title>Habitat art review</title><style>body{margin:0;padding:40px;background:#202820;color:#e8e6cf;font:16px/1.5 system-ui}h1{font-size:30px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(500px,1fr));gap:30px}article{background:#2a3429;padding:18px;border-radius:8px}h2{font-size:18px;text-transform:capitalize}img{width:100%;image-rendering:pixelated}a{color:#ccdba5}</style><h1>Habitat & terrain art review</h1><p>Same seed, nine ecological / seasonal studies. Quiet ground, connected habitat patches and sparse native-pixel details. Open an image at full size to judge texture.</p><main>${cards.join("")}</main></html>`,
);
