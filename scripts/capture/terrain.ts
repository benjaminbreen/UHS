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
  base,
} from "./lib";

type Review = {
  dir: string;
  title: string;
  seed: string;
  common: string;
  /** Where to point the camera before the first shot. */
  centre: "spawn" | "none" | "paths" | "arroyo" | "cliff";
  /** Print paving counts, which is what the street studies are looking at. */
  paving?: boolean;
  studies: [name: string, query: string][];
};

const reviews: Record<string, Review> = {
  cliffs: {
    dir: "artifacts/cliff-review",
    title: "Continuous beach and terrace contours",
    seed: "cliff-shore-review",
    common: "population=none&start=wanderer&season=summer",
    centre: "cliff",
    studies: [
      ["coast", "ecology=boreal-woodland&water=coast-n&landform=ridge&relief=0.9&year=1700&waterContext&coastBeachWidth=12"],
      ["inland", "ecology=grassland&water=river-ew&landform=rolling&relief=0.7"],
      ["flat-coast", "ecology=boreal-woodland&water=coast-n&landform=plain&relief=0"],
    ],
  },
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
      ["konya-roads", "place=konya&ecology=desert&year=-6499&pattern=clustered&population=sparse"],
    ],
  },
  cities: {
    dir: "artifacts/cities",
    title: "Dense cities: paving, squares and shop signs",
    seed: "city-review",
    common: "pattern=dense&population=settled&water=none&landform=plain&start=resident",
    centre: "spawn",
    paving: true,
    studies: [
      ["rome-99bce", "place=rome&ecology=dry-scrub&year=-99"],
      ["new-york-1850", "place=city-new-york&ecology=grassland&year=1850"],
      ["mexico-1780", "place=mexico&ecology=dry-scrub&year=1780"],
      ["cheyenne-1957", "place=city-cheyenne&year=1957"],
      ["surakarta-1957", "place=city-surakarta&year=1957"],
      ["dakar-1960", "place=city-dakar&year=1960"],
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
  relief: {
    dir: "artifacts/relief-review",
    title: "Altitude steps: rims, faces and ramps",
    seed: "relief-review",
    common: "start=resident&water=none&relief=0.9",
    centre: "spawn",
    studies: [
      ["town-ridge", "ecology=grassland&season=summer&landform=ridge&population=settled&pattern=clustered&year=1300"],
      ["village-rolling", "ecology=dry-scrub&season=summer&landform=rolling&population=sparse&pattern=clustered&year=1200"],
      ["tundra-winter", "ecology=tundra&season=winter&landform=ridge&population=sparse&pattern=clustered&year=1021"],
      ["open-ridge", "ecology=grassland&season=autumn&landform=ridge&population=none"],
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
        pauseWater: !query.includes("waterContext"),
      });
      if (review.centre === "spawn") await centreOnSpawn(page);
      if (review.centre === "paths" && name.startsWith("grassland"))
        await centreOnPaths(page);
      if (review.centre === "arroyo") await centreOnArroyo(page);
      if (review.centre === "cliff") {
        await page.addStyleTag({ content: ".gsp{display:none!important}" });
        const at = await page.evaluate(() => {
          const lab = (window as any).terrainLab, world = lab.runtime.engine.world;
          const spawn = lab.scene.options.center ?? world.spawn;
          let best = spawn, distance = Infinity;
          for (let y = spawn.y - 60; y <= spawn.y + 60; y++)
            for (let x = spawn.x - 60; x <= spawn.x + 60; x++) {
              const c = world.topography(x, y);
              if (c.surface === "water" || c.ramp) continue;
              if (!c.waterVisual || c.waterVisual.distance > 24) continue;
              if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => world.topography(x + dx, y + dy).height > c.height)) continue;
              const d = (x - spawn.x) ** 2 + (y - spawn.y) ** 2;
              if (d < distance) { best = { x, y }; distance = d; }
            }
          lab.scene.options.center = best;
          lab.scene.draw();
          lab.scene.cameras.main.centerOn(best.x * 16 + 8, best.y * 16 + 8);
          return { ...best, cliff: distance < Infinity };
        });
        console.log("  cliff camera", at);
        await settled(page);
        await zoom(page, 1);
      }
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

async function pavingReview() {
  await withPage({ width: 1440, height: 1600 }, async (page) => {
    await page.goto(`${base}/terrain-lab`);
    await page.evaluate(async () => {
      const { rasterStreetTile } = await import("/src/render/street-raster.ts" as string);
      const materials = ["slab", "basalt", "cobble", "sett", "brick", "plank", "macadam", "concrete", "asphalt"];
      const roles = [undefined, "footway", "court", "yard", "square"];
      const canvas = document.createElement("canvas");
      canvas.id = "paving-review";
      canvas.width = 1248;
      canvas.height = 1268;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#20272a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "16px monospace";
      ctx.fillStyle = "#e2d5b0";
      ctx.fillText("Native street renderer · 3× pixels", 16, 24);
      roles.forEach((role, i) => ctx.fillText(role ?? "street", 120 + i * 224, 52));
      materials.forEach((material, row) => {
        ctx.fillStyle = "#e2d5b0";
        ctx.fillText(material, 16, 94 + row * 132);
        roles.forEach((role, col) => {
          const patch = document.createElement("canvas");
          patch.width = 64; patch.height = 32;
          const p = patch.getContext("2d")!;
          for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) {
            const pixels = rasterStreetTile(() => ({ height: 0, surface: "gravel", feature: "paving", streetMaterial: material, pavement: role }), x, y, 0, 0).pixels;
            p.putImageData(new ImageData(pixels, 16, 16), x * 16, y * 16);
          }
          ctx.drawImage(patch, 120 + col * 224, 68 + row * 132, 192, 96);
        });
      });
      canvas.style.cssText = "position:absolute;left:0;top:0;z-index:10000";
      document.body.append(canvas);
    });
    await page.locator("#paving-review").screenshot({ path: "artifacts/paving-review/materials.png" });
    await page.evaluate(async () => {
      const { rasterHabitatTile } = await import("/src/render/habitat-raster.ts" as string);
      const materials = ["slab", "basalt", "cobble", "sett", "brick", "plank", "macadam", "concrete", "asphalt"];
      const canvas = document.querySelector<HTMLCanvasElement>("#paving-review")!;
      canvas.width = 1080; canvas.height = 1136;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#20272a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "16px monospace"; ctx.fillStyle = "#e2d5b0";
      ctx.fillText("Actual ground transitions · 3× pixels", 16, 24);
      ctx.fillText("road / footway / verge", 120, 52);
      ctx.fillText("court / planted strip / earth yard", 600, 52);
      materials.forEach((material, row) => {
        ctx.fillStyle = "#e2d5b0"; ctx.fillText(material, 16, 90 + row * 118);
        for (const col of [0, 1]) {
          const patch = document.createElement("canvas"); patch.width = 144; patch.height = 32;
          const p = patch.getContext("2d")!;
          for (let y = 0; y < 2; y++) for (let x = 0; x < 9; x++) {
            const pixels = rasterHabitatTile((a: number) => {
              const role = col === 0 ? a < 2 ? "verge" : a < 4 ? "footway" : undefined
                : a < 3 ? "court" : a === 3 ? "garden" : a < 7 ? "court" : "yard";
              const paving = col === 0 ? a >= 2 : a < 7 && a !== 3;
              return { height: 0, surface: paving ? "gravel" : role === "yard" ? "soil" : "grass",
                feature: paving ? "paving" : undefined, pavement: role,
                streetMaterial: col === 0 && a < 4 ? "slab" : material,
                habitat: { ecology: "grassland", kind: "meadow", wet: 0.3, cover: role === "yard" ? 0 : 0.25,
                  exposed: role === "yard" ? 1 : 0, season: "summer" } };
            }, x, y, 0, 0).pixels;
            p.putImageData(new ImageData(pixels, 16, 16), x * 16, y * 16);
          }
          ctx.drawImage(patch, 120 + col * 480, 68 + row * 118, 432, 96);
        }
      });
    });
    await page.locator("#paving-review").screenshot({ path: "artifacts/paving-review/edges.png" });
  });
  console.log("wrote artifacts/paving-review/materials.png and edges.png");
}

const asked = process.argv.slice(2);
const names = asked.length ? asked : Object.keys(reviews);
for (const name of names) {
  if (name === "paving") {
    await pavingReview();
    continue;
  }
  const review = reviews[name];
  if (!review)
    throw Error(
      `no terrain review "${name}". Try: paving, ${Object.keys(reviews).join(", ")}`,
    );
  console.log(`--- ${name}`);
  await run(review);
}
