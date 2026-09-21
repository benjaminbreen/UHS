/** Real-renderer benchmark: the same towns, seed and camera every time, so an
 * art change is judged across eras and ecologies rather than on one scene.
 * Usage: tsx scripts/capture-benchmark.ts [label] [name-filter]
 * Writes artifacts/benchmark/<label>/<name>.png and index.html. */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const [label = "current", only] = process.argv.slice(2);
const base = process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173";
const out = `artifacts/benchmark/${label}`;

type Shot = {
  name: string;
  place: string;
  year: number;
  ecology: string;
  pattern: string;
  water: string;
  season?: string;
  /** Centre on the nearest shoreline to the town rather than its monument. */
  shore?: boolean;
  rain?: boolean;
};
const shots: Shot[] = [
  { name: "st-petersburg-1289", place: "city-st-petersburg", year: 1289, ecology: "boreal-woodland", pattern: "waterfront", water: "coast-n" },
  { name: "st-petersburg-shore", place: "city-st-petersburg", year: 1289, ecology: "boreal-woodland", pattern: "waterfront", water: "coast-n", shore: true },
  { name: "st-petersburg-rain", place: "city-st-petersburg", year: 1289, ecology: "boreal-woodland", pattern: "waterfront", water: "coast-n", rain: true },
  { name: "normandy-1173", place: "normandy", year: 1173, ecology: "temperate-woodland", pattern: "clustered", water: "river-ns" },
  { name: "london-1650", place: "london", year: 1650, ecology: "grassland", pattern: "dense", water: "river-ew" },
  { name: "rome-100", place: "rome", year: 100, ecology: "dry-scrub", pattern: "dense", water: "none" },
  { name: "cairo-1200", place: "city-cairo", year: 1200, ecology: "desert", pattern: "dense", water: "river-ns" },
  { name: "konya-neolithic", place: "konya", year: -6500, ecology: "grassland", pattern: "clustered", water: "lake" },
  { name: "kyoto-1700", place: "kyoto", year: 1700, ecology: "temperate-woodland", pattern: "planned", water: "river-ns" },
  { name: "timbuktu-1400", place: "timbuktu", year: 1400, ecology: "savanna", pattern: "clustered", water: "river-ew" },
  { name: "mexico-1500", place: "mexico", year: 1500, ecology: "tropical-woodland", pattern: "waterfront", water: "lake" },
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(out, { recursive: true });
const done: string[] = [];
try {
  for (const s of shots.filter((s) => !only || s.name.includes(only))) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    page.on("pageerror", (e) => console.error(s.name, e.message));
    const q = new URLSearchParams({
      place: s.place,
      year: String(s.year),
      seed: "benchmark-01",
      ecology: s.ecology,
      pattern: s.pattern,
      water: s.water,
      season: s.season ?? "summer",
      population: "settled",
      landform: "plain",
      start: "resident",
    });
    await page.goto(`${base}/terrain-lab?${q}`);
    await page.waitForFunction(
      () => document.querySelector("canvas")?.dataset.terrainReady === "true",
      {},
      { timeout: 180000 },
    );
    const at = await page.evaluate(
      ({ shore, rain }) => {
        const l = (window as any).terrainLab,
          w = l.runtime.engine.world;
        const hub =
          w.initialObjects.find((o: any) => o.kind === "monument")?.pos ??
          w.initialObjects.find((o: any) => o.kind === "well")?.pos ??
          w.spawn;
        let c = { x: hub.x, y: hub.y };
        if (shore) {
          let best = Infinity;
          for (let dy = -30; dy <= 30; dy++)
            for (let dx = -30; dx <= 30; dx++) {
              const d = dx * dx + dy * dy;
              if (d < best && w.terrain(hub.x + dx, hub.y + dy) === "water") {
                best = d;
                c = { x: hub.x + dx, y: hub.y + dy };
              }
            }
        }
        l.runtime.zoom = 2;
        l.scene.options.center = { ...c };
        if (rain) {
          l.scene.options.colorGrade = true;
          l.scene.weather = { condition: "rain", wetness: 1, wind: { angle: 0, strength: 0 } };
        }
        l.scene.draw();
        l.scene.cameras.main.centerOn(c.x * 16, c.y * 16);
        return c;
      },
      { shore: !!s.shore, rain: !!s.rain },
    );
    await page.addStyleTag({ content: ".gsp{display:none}" });
    // The lab can remount after ready and reset the camera; aim it again.
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(1500);
      const ok = await page.evaluate((c) => {
        const l = (window as any).terrainLab,
          cam = l.scene.cameras.main;
        if (l.runtime.zoom === 2 && Math.abs(cam.midPoint.x - c.x * 16) < 2) return true;
        l.runtime.zoom = 2;
        l.scene.options.center = { ...c };
        l.scene.draw();
        cam.centerOn(c.x * 16, c.y * 16);
        return false;
      }, at);
      if (ok) break;
    }
    await page.waitForTimeout(1500);
    await page.locator("canvas").screenshot({ path: `${out}/${s.name}.png` });
    console.log(s.name, at);
    done.push(s.name);
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  `${out}/index.html`,
  `<!doctype html><meta charset=utf-8><title>Benchmark ${label}</title>
<style>body{background:#1b1f24;color:#ddd;font:14px system-ui;margin:16px}
figure{margin:0 0 24px}img{max-width:100%;image-rendering:pixelated;display:block}</style>
${done.map((n) => `<figure><figcaption>${n}</figcaption><img src="${n}.png"></figure>`).join("\n")}`,
);
