import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
await mkdir("artifacts/texture-review", { recursive: true });
const cards: string[] = [];
try {
  for (const [name, query] of [
    [
      "umbria",
      "place=umbria&ecology=dry-scrub&year=1500&pattern=clustered&population=sparse",
    ],
    [
      "grassland",
      "ecology=grassland&year=-6499&pattern=clustered&population=sparse",
    ],
  ]) {
    const url = `http://127.0.0.1:5173/terrain-lab?seed=street-review&${query}&water=river-ns&landform=plain&start=resident`;
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.querySelector("canvas")?.getAttribute("data-terrain-ready") ===
        "true",
      {},
      { timeout: 90000 },
    );
    await page.getByRole("button", { name: "Pause water" }).click();
    await page.evaluate(() => {
      const lab = (window as any).terrainLab;
      lab.scene.options.center = { ...lab.runtime.engine.world.spawn };
      lab.scene.draw();
    });
    await page.waitForFunction(
      () =>
        document
          .querySelector("canvas")
          ?.getAttribute("data-terrain-pending") === "0",
      {},
      { timeout: 90000 },
    );
    await page
      .locator("canvas")
      .screenshot({ path: `artifacts/texture-review/${name}.png` });
    if (name === "umbria") {
      await page.evaluate(() => {
        const lab = (window as any).terrainLab,
          w = lab.runtime.engine.world,
          p = w.spawn;
        let best = p,
          score = -Infinity;
        for (let dy = -64; dy <= 64; dy += 4)
          for (let dx = -64; dx <= 64; dx += 4) {
            const x = p.x + dx,
              y = p.y + dy,
              c = w.topography(x, y);
            if (!c.habitat || c.habitat.exposed < 0.66 || c.surface === "water")
              continue;
            const path = [
              [-6, 0],
              [6, 0],
              [0, -6],
              [0, 6],
            ].some(([a, b]) => w.topography(x + a, y + b).surface === "soil");
            const s = (path ? 200 : 0) - Math.hypot(dx, dy);
            if (s > score) {
              score = s;
              best = { x, y };
            }
          }
        lab.scene.options.center = best;
        lab.scene.cameras.main.centerOn(best.x * 16 + 8, best.y * 16 + 8);
        lab.scene.draw();
      });
    }
    await page.evaluate(() => {
      const lab = (window as any).terrainLab;
      lab.runtime.zoom = 2;
      lab.scene.draw();
    });
    await page.waitForFunction(
      () =>
        document
          .querySelector("canvas")
          ?.getAttribute("data-terrain-pending") === "0",
      {},
      { timeout: 90000 },
    );
    await page
      .locator("canvas")
      .screenshot({ path: `artifacts/texture-review/${name}-detail.png` });
    cards.push(
      `<article><h2>${name}</h2><a href="${name}.png"><img src="${name}.png"></a><p><a href="${name}-detail.png">2× detail</a> · <a href="${url}">Explore</a></p></article>`,
    );
    console.log(
      name,
      await page.evaluate(() => {
        const w = (window as any).terrainLab.runtime.engine.world;
        let paved = 0;
        let example: any;
        const materials = new Set();
        for (let y = w.spawn.y - 30; y < w.spawn.y + 30; y++)
          for (let x = w.spawn.x - 30; x < w.spawn.x + 30; x++) {
            const c = w.topography(x, y);
            if (c.feature === "paving") {
              paved++;
              example ??= c;
              materials.add(c.streetMaterial);
            }
          }
        return { paved, example, materials: [...materials] };
      }),
    );
  }
} finally {
  await browser.close();
}
await writeFile(
  "artifacts/texture-review/index.html",
  `<!doctype html><meta charset="utf-8"><title>Street review</title><style>body{background:#252e24;color:#eee9d2;font:16px system-ui;margin:36px}img{width:100%;image-rendering:pixelated}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}a{color:#ced9a9}</style><h1>Composed stone and turf textures</h1><main>${cards.join("")}</main>`,
);
