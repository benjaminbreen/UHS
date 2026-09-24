/** Terrain-lab review sheets.
 *
 * Usage: npm run capture:terrain -- textures
 *        npm run capture:terrain -- habitats edges
 *
 * These were five scripts that differed only in their study list and their
 * heading. What varies is data now; the flow is shared.
 */
import type { Page } from "@playwright/test";
import {
  withPage,
  terrainLab,
  settled,
  centreOnSpawn,
  zoom,
  contactSheet,
  card,
} from "./lib";

type Review = {
  dir: string;
  title: string;
  seed: string;
  common: string;
  /** Where to point the camera before the first shot. */
  centre: "spawn" | "none" | "paths" | "arroyo";
  /** Print paving counts, which is what the street studies are looking at. */
  paving?: boolean;
  studies: [name: string, query: string][];
};

const reviews: Record<string, Review> = {
  streets: {
    dir: "artifacts/street-review",
    title: "Continuous footpaths and historical paving",
    seed: "street-review",
    common: "water=river-ns&landform=plain&start=resident",
    centre: "spawn",
    paving: true,
    studies: [
      ["rural-paths", "ecology=grassland&year=-6499&pattern=clustered&population=sparse"],
      ["rome-100", "place=rome&ecology=dry-scrub&year=100&pattern=planned&population=settled"],
    ],
  },
  polish: {
    dir: "artifacts/polish-review",
    title: "Final palette and pixel polish",
    seed: "street-review",
    common: "water=river-ns&landform=plain&start=resident",
    centre: "spawn",
    paving: true,
    studies: [
      ["rural-paths", "ecology=grassland&year=-6499&pattern=clustered&population=sparse"],
      ["rome-100", "place=rome&ecology=dry-scrub&year=100&pattern=planned&population=settled"],
      ["desert", "ecology=desert&year=-6499&pattern=clustered&population=sparse"],
      ["marsh", "ecology=wetland&year=-6499&pattern=clustered&population=sparse"],
      ["northern-grassland", "ecology=tundra&year=-18000&pattern=clustered&population=sparse"],
    ],
  },
  textures: {
    dir: "artifacts/texture-review",
    title: "Composed stone and turf textures",
    seed: "street-review",
    common: "water=river-ns&landform=plain&start=resident",
    centre: "spawn",
    paving: true,
    studies: [
      ["umbria", "place=umbria&ecology=dry-scrub&year=1500&pattern=clustered&population=sparse"],
      ["grassland", "ecology=grassland&year=-6499&pattern=clustered&population=sparse"],
    ],
  },
  habitats: {
    dir: "artifacts/habitat-review",
    title: "Habitat & terrain art review",
    seed: "habitat-review",
    common: "landform=rolling&population=none&start=wanderer",
    centre: "none",
    studies: [
      ["tundra-summer", "ecology=tundra&season=summer&water=river-ew"],
      ["boreal-woodland-summer", "ecology=boreal-woodland&season=summer&water=river-ns"],
      ["grassland-summer", "ecology=grassland&season=summer&water=river-ew"],
      ["temperate-woodland-autumn", "ecology=temperate-woodland&season=autumn&water=river-ns"],
      ["tropical-woodland-summer", "ecology=tropical-woodland&season=summer&water=river-ns"],
      ["wetland-summer", "ecology=wetland&season=summer&water=lake"],
      ["dry-scrub-summer", "ecology=dry-scrub&season=summer&water=river-ew"],
      ["desert-summer", "ecology=desert&season=summer&water=river-ns"],
      ["boreal-woodland-winter", "ecology=boreal-woodland&season=winter&water=river-ns"],
    ],
  },
  edges: {
    dir: "artifacts/edge-review",
    title: "Paths, banks & pixel accents",
    seed: "edge-review",
    common: "landform=plain&start=wanderer",
    centre: "paths",
    studies: [
      ["grassland-summer", "ecology=grassland&season=summer&water=river-ew&population=sparse"],
      ["tundra-summer", "ecology=tundra&season=summer&water=coast-n&population=none"],
      ["tropical-woodland-summer", "ecology=tropical-woodland&season=summer&water=river-ns&population=none"],
      ["wetland-summer", "ecology=wetland&season=summer&water=none&population=none"],
    ],
  },
  arroyos: {
    dir: "artifacts/arroyo-review",
    title: "Arroyo beds and banks",
    seed: "arroyo-review",
    common: "landform=rolling&population=none&start=wanderer&water=none",
    centre: "arroyo",
    studies: [
      ["sonoran-wash", "ecology=desert&colorway=sonoran&season=summer"],
      ["dry-scrub", "ecology=dry-scrub&season=autumn"],
      ["savanna", "ecology=savanna&season=summer"],
    ],
  },
};

/** Point the camera at the arroyo cell nearest the spawn. */
async function centreOnArroyo(page: Page) {
  const at = await page.evaluate(() => {
    const lab = (window as any).terrainLab,
      world = lab.runtime.engine.world;
    const { x: sx, y: sy } = world.spawn;
    for (let r = 0; r < 120; r++)
      for (let y = sy - r; y <= sy + r; y++)
        for (let x = sx - r; x <= sx + r; x++)
          if (world.topography(x, y).landscape?.kind === "arroyo") {
            lab.scene.options.center = { x, y };
            lab.scene.draw();
            return { x, y };
          }
  });
  await settled(page);
  console.log("  arroyo camera", at);
}

/** Point the camera at the best-connected stretch of path near the spawn,
 * which is what the edge study is actually about; the spawn itself often
 * sits on blank ground. */
async function centreOnPaths(page: Page) {
  const at = await page.evaluate(() => {
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
        for (const [dx, dy] of [[-1, -1], [1, 1], [1, -1], [-1, 1]])
          if (world.topography(x + dx, y + dy).surface === "soil") diagonals++;
        const near = world.places.some(
          (p: any) => Math.hypot(x - p.x, y - p.y) < 20,
        );
        const value =
          diagonals + (near ? 2 : 0) - Math.hypot(x - spawn.x, y - spawn.y) / 100;
        if (value > score) {
          score = value;
          best = { x, y };
        }
      }
    lab.scene.options.center = best;
    lab.scene.draw();
    return best;
  });
  await settled(page);
  console.log("  path camera", at);
}

/** Paved tile count and materials around the spawn. */
const pavingReport = (page: Page) =>
  page.evaluate(() => {
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
  });

async function run(review: Review) {
  const cards: string[] = [];
  await withPage({ width: 1536, height: 1024 }, async (page) => {
    for (const [name, query] of review.studies) {
      const url = await terrainLab(page, `${query}&${review.common}`, {
        seed: review.seed,
      });
      if (review.centre === "spawn") await centreOnSpawn(page);
      if (review.centre === "paths" && name.startsWith("grassland"))
        await centreOnPaths(page);
      if (review.centre === "arroyo") await centreOnArroyo(page);
      await page.locator("canvas").screenshot({ path: `${review.dir}/${name}.png` });
      await zoom(page, 2);
      await page
        .locator("canvas")
        .screenshot({ path: `${review.dir}/${name}-detail.png` });
      cards.push(card(name, url, `<a href="${name}-detail.png">2× detail</a> · `));
      if (review.paving) console.log(` ${name}`, await pavingReport(page));
      else console.log(` ${name}`);
    }
  });
  await contactSheet(review.dir, review.title, cards);
}

const asked = process.argv.slice(2);
const names = asked.length ? asked : Object.keys(reviews);
for (const name of names) {
  const review = reviews[name];
  if (!review)
    throw Error(
      `no terrain review "${name}". Try: ${Object.keys(reviews).join(", ")}`,
    );
  console.log(`--- ${name}`);
  await run(review);
}
