/** Review captures only; deliberately separate from the active browser test suite. */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1536, height: 1024 },
  deviceScaleFactor: 1,
});
const studies = [
  ["grassland", "summer", "river-ew"],
  ["tundra", "summer", "coast-n"],
  ["tropical-woodland", "summer", "river-ns"],
  ["wetland", "summer", "none"],
];
await mkdir("artifacts/edge-review", { recursive: true });
const cards: string[] = [];
try {
  for (const [ecology, season, water] of studies) {
    const name = `${ecology}-${season}`;
    const url = `http://127.0.0.1:5173/terrain-lab?seed=edge-review&ecology=${ecology}&season=${season}&water=${water}&landform=plain&population=${ecology === "grassland" ? "sparse" : "none"}&start=wanderer`;
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
    if (ecology === "grassland") {
      const center = await page.evaluate(() => {
        const lab = (window as any).terrainLab,
          world = lab.runtime.engine.world;
        const spawn = world.spawn;
        let best = { x: spawn.x, y: spawn.y },
          score = -1;
        for (let y = spawn.y - 55; y < spawn.y + 55; y++)
          for (let x = spawn.x - 55; x < spawn.x + 55; x++) {
            const c = world.topography(x, y);
            if (c.surface !== "soil" || c.bridge) continue;
            let diagonals = 0;
            for (const [dx, dy] of [
              [-1, -1],
              [1, 1],
              [1, -1],
              [-1, 1],
            ])
              if (world.topography(x + dx, y + dy).surface === "soil")
                diagonals++;
            const near = world.places.some(
              (p: any) => Math.hypot(x - p.x, y - p.y) < 20,
            );
            const value =
              diagonals +
              (near ? 2 : 0) -
              Math.hypot(x - spawn.x, y - spawn.y) / 100;
            if (value > score) {
              score = value;
              best = { x, y };
            }
          }
        lab.scene.options.center = best;
        lab.scene.draw();
        return best;
      });
      console.log("Path camera", center);
      await page.waitForFunction(
        () =>
          document
            .querySelector("canvas")
            ?.getAttribute("data-terrain-pending") === "0",
        {},
        { timeout: 60000 },
      );
    }
    await canvas.screenshot({ path: `artifacts/edge-review/${name}.png` });
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
      path: `artifacts/edge-review/${name}-detail.png`,
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
  "artifacts/edge-review/index.html",
  `<!doctype html><html><meta charset="utf-8"><title>Pixel edges review</title><style>body{margin:0;padding:40px;background:#202820;color:#e8e6cf;font:16px/1.5 system-ui}h1{font-size:30px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(500px,1fr));gap:30px}article{background:#2a3429;padding:18px;border-radius:8px}h2{font-size:18px;text-transform:capitalize}img{width:100%;image-rendering:pixelated}a{color:#ccdba5}</style><h1>Paths, banks & pixel accents</h1><p>Four generated studies: connected paths, a cold gravel shore, a tropical river corridor and marsh basins. Open an image at full size to judge texture.</p><main>${cards.join("")}</main></html>`,
);
