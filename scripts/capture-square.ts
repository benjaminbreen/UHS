/** Screenshot a town centre at 2x for square and paving review.
 * Usage: tsx scripts/capture-square.ts <out.png> [place] [year] [seed] [ecology] */
import { chromium } from "@playwright/test";
const [
  out = "artifacts/square.png",
  place = "mexico",
  year = "1780",
  seed = "plaza-review",
  ecology = "dry-scrub",
] = process.argv.slice(2);
const base = process.env.UHS_CITY_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on("pageerror", (e) => console.error("pageerror", e.message));
try {
  await page.goto(
    `${base}/terrain-lab?place=${place}&seed=${seed}&year=${year}&pattern=dense&population=settled&water=none&landform=plain&start=resident&ecology=${ecology}`,
  );
  await page.waitForFunction(
    () => document.querySelector("canvas")?.dataset.terrainReady === "true",
    {},
    { timeout: 120000 },
  );
  console.log(
    await page.evaluate(() => {
      const l = (window as any).terrainLab,
        w = l.runtime.engine.world;
      l.runtime.zoom = 2;
      l.scene.options.center = { ...w.spawn };
      l.scene.draw();
      const m = w.initialObjects.find((o: any) => o.kind === "monument") ?? {
        pos: w.spawn,
      };
      l.scene.cameras.main.centerOn(m.pos.x * 16, m.pos.y * 16 + 48);
      return w.initialObjects
        .filter((o: any) => ["monument", "well", "fire"].includes(o.kind))
        .map((o: any) => `${o.kind}:${o.sprite}@${o.pos.x},${o.pos.y}`)
        .join(" ");
    }),
  );
  await page.waitForTimeout(2500);
  await page.locator("canvas").screenshot({ path: out });
  // Second frame on the sanctuary, where the town has one.
  const church = await page.evaluate(() => {
    const l = (window as any).terrainLab,
      w = l.runtime.engine.world;
    const p = w.places.find((q: any) => q.claim?.startsWith("religious-"));
    if (!p) return null;
    l.scene.cameras.main.centerOn((p.x + p.w / 2) * 16, (p.y + p.h / 2) * 16);
    return `${p.name} ${p.sprite} @${p.x},${p.y} ${p.w}x${p.h}`;
  });
  if (church) {
    console.log("sanctuary:", church);
    await page.waitForTimeout(1500);
    await page
      .locator("canvas")
      .screenshot({ path: out.replace(/\.png$/, "-church.png") });
  }
} finally {
  await browser.close();
}
