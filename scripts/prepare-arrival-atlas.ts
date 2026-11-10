// Run with npm run dev running, then npx tsx scripts/prepare-arrival-atlas.ts.
import { execFileSync } from "node:child_process";
import { base, withPage } from "./capture/lib";

await withPage({}, async (page) => {
  const url = `${base}/__arrival-atlas`;
  await page.route(url, (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html>" }));
  await page.goto(url);
  await page.evaluate("window.__name = (fn) => fn");
  const backgrounds = await page.evaluate(async (base) => {
    const load = (path: string) => import(`${base}/src/${path}.ts`);
    const { atlasLand, atlasRivers }: typeof import("../src/world/geography/atlas") = await load("world/geography/atlas");
    const { koppenAt }: typeof import("../src/content/geography/climate-map") = await load("content/geography/climate-map");
    const { mountainBelts }: typeof import("../src/content/geography/landforms") = await load("content/geography/landforms");
    const { noise, segmentDistance }: typeof import("../src/world/geography/noise") = await load("world/geography/noise");
    const { boxBlur }: typeof import("../src/render/box-blur") = await load("render/box-blur");

    const project = ([lon, lat]: number[]) => [(lon + 180) * 2, (85 - lat) * 2];
    // Terrain raster at 4 px per degree, twice the map's base scale.
    const RES = 4, TW = 360 * RES, TH = 170 * RES;

    // One colour per Köppen–Geiger class, 1 Af .. 30 EF, read as the vegetation
    // it carries: rainforest to savanna, sand to steppe, oak-pine to taiga.
    const biome: [number, number, number][] = [
      [0, 0, 0],
      [44, 90, 48], [70, 106, 54], [112, 124, 62],
      [210, 180, 116], [184, 166, 124], [186, 158, 98], [156, 150, 94],
      [152, 142, 88], [126, 134, 80], [112, 126, 82],
      [96, 118, 60], [104, 124, 70], [100, 120, 74],
      [80, 116, 60], [92, 128, 72], [96, 116, 84],
      [132, 136, 82], [110, 124, 76], [70, 92, 70], [78, 92, 72],
      [104, 124, 66], [90, 118, 66], [64, 90, 66], [78, 92, 72],
      [118, 134, 74], [84, 116, 66], [62, 88, 66], [76, 90, 70],
      [138, 142, 118], [214, 220, 224],
    ];
    const fallback = { tundra: 29, boreal: 27, tropical: 3, temperate: 15 };
    // Rough peak height against the Himalaya, so only real alpine belts carry snow.
    const peaks: Record<string, number> = {
      Himalaya: 1.1, "Tibetan highlands": 0.95, Andes: 1, Alps: 0.9, "Rocky Mountains": 0.85, Altai: 0.8,
      "Taurus and Zagros": 0.7, Pyrenees: 0.7, "Ethiopian highlands": 0.65, "East African highlands": 0.65,
      "Atlas Mountains": 0.65, "Japanese mountains": 0.6, Balkans: 0.5, Apennines: 0.5, "Burmese highlands": 0.55,
    };

    function terrain(glacial: boolean) {
      const canvas = document.createElement("canvas");
      canvas.width = TW; canvas.height = TH;
      const c = canvas.getContext("2d")!;
      c.scale(RES / 2, RES / 2);
      c.fillStyle = "#fff";
      for (const ring of atlasLand) {
        c.beginPath();
        ring.forEach((point, i) => { const [x, y] = project(point); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
        c.fill();
      }
      const image = c.getImageData(0, 0, TW, TH), px = image.data;
      const land = new Float32Array(TW * TH);
      for (let i = 0; i < land.length; i++) land[i] = px[i * 4 + 3] > 127 ? 1 : 0;
      c.clearRect(0, 0, TW, TH);
      c.strokeStyle = "#fff";
      c.lineWidth = 1.5;
      for (const river of atlasRivers) {
        c.beginPath();
        river.points.forEach((point, i) => { const [x, y] = project(point); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
        c.stroke();
      }
      const wet = c.getImageData(0, 0, TW, TH).data, banks = new Float32Array(TW * TH);
      for (let i = 0; i < banks.length; i++) banks[i] = wet[i * 4 + 3] / 255;
      const riparian = boxBlur(boxBlur(banks, TW, TH, 3), TW, TH, 3);
      // Three box blurs of the land mask stand in for distance from shore.
      let shelf = land;
      for (let pass = 0; pass < 3; pass++) shelf = boxBlur(shelf, TW, TH, 7);
      const height = new Float32Array(TW * TH);
      const belts = mountainBelts.map((b) => {
        const xs = b.points.map((p) => p[0]), ys = b.points.map((p) => p[1]);
        return { ...b, peak: peaks[b.name] ?? 0.45, x0: Math.min(...xs) - b.width, x1: Math.max(...xs) + b.width, y0: Math.min(...ys) - b.width, y1: Math.max(...ys) + b.width };
      });
      for (let y = 0; y < TH; y++)
        for (let x = 0; x < TW; x++) {
          const i = y * TW + x;
          if (!land[i]) continue;
          const lon = x / RES - 180, lat = 85 - y / RES;
          let relief = 0;
          // Warping the distance breaks the belts' straight edges into spurs and foothills.
          const warp = 0.5 + 0.6 * noise("arrival-warp", x, y, 14) + 0.5 * noise("arrival-warp", x, y, 4);
          for (const b of belts) {
            if (lon < b.x0 || lon > b.x1 || lat < b.y0 || lat > b.y1) continue;
            for (let k = 1; k < b.points.length; k++) {
              const t = Math.max(0, 1 - warp * segmentDistance(lon, lat, b.points[k - 1], b.points[k]) / b.width);
              relief = Math.max(relief, b.peak * t * t * (3 - 2 * t));
            }
          }
          const rough = noise("arrival", x, y, 9) * 0.6 + noise("arrival", x, y, 3) * 0.4;
          height[i] = relief * (0.35 + 0.9 * rough) + 0.12 * noise("arrival", x, y, 40) + 0.05 * rough;
        }
      for (let y = 0; y < TH; y++)
        for (let x = 0; x < TW; x++) {
          const i = y * TW + x, o = i * 4;
          const grain = noise("arrival-sea", x, y, 5) * 0.06;
          if (!land[i]) {
            const s = Math.min(1, shelf[i] * 2.2) + grain;
            px[o] = 18 + 38 * s; px[o + 1] = 44 + 70 * s; px[o + 2] = 68 + 58 * s; px[o + 3] = 255;
            continue;
          }
          const lon = x / RES - 180, lat = 85 - y / RES;
          // Jitter the climate lookup so biome edges dither instead of stepping.
          const jx = (noise("arrival-j", x, y, 4) - 0.5) * 1.6, jy = (noise("arrival-k", x, y, 4) - 0.5) * 1.6;
          const code = koppenAt(lon + jx, lat + jy)
            || fallback[Math.abs(lat) > 66 ? "tundra" : Math.abs(lat) > 55 ? "boreal" : Math.abs(lat) < 18 ? "tropical" : "temperate"];
          let [r, g, b] = biome[code];
          // Gallery woods and irrigated fields line rivers through desert, steppe and maquis.
          if (code >= 4 && code <= 10) {
            const t = Math.min(1, riparian[i] * 3);
            r += (98 - r) * t; g += (126 - g) * t; b += (64 - b) * t;
          }
          const h = height[i];
          const fleck = noise("arrival-fleck", x, y, 2);
          const rock = Math.max(0, Math.min(1, (h - 0.45 + 0.15 * (fleck - 0.5)) * 2));
          r += (128 - r) * rock; g += (112 - g) * rock; b += (92 - b) * rock;
          const ice = (glacial && lat > 50 + 8 * noise("arrival-ice", x, y, 30) && (lon < -50 || (lon > -10 && lon < 60)))
            || Math.abs(lat) > 80 || lat < -60
            // The Greenland ice sheet, which every era has had; its coast is bare.
            || (lat > 60 && lon > -55 && lon < -20 && shelf[i] > 0.93);
          const snow = ice ? 1 : Math.max(0, Math.min(1, (h + 0.2 * (fleck - 0.5) - 0.95 + Math.abs(lat) / 160) * 6));
          r += (236 - r) * snow; g += (238 - g) * snow; b += (240 - b) * snow;
          const nw = height[Math.max(0, i - TW - 1)], se = height[Math.min(height.length - 1, i + TW + 1)];
          // Quantised light from the north-west keeps the relief reading as pixel art.
          const shade = 1 + Math.round(Math.max(-0.5, Math.min(0.5, (nw - se) * 6)) * 8) / 12 + (grain - 0.03);
          px[o] = r * shade; px[o + 1] = g * shade; px[o + 2] = b * shade; px[o + 3] = 255;
        }
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.putImageData(image, 0, 0);
      return canvas;
    }

    return [terrain(false).toDataURL(), terrain(true).toDataURL()];
  }, base);
  for (const [index, variant] of ["modern", "glacial"].entries()) {
    const out = `src/assets/arrival-atlas-${variant}.webp`;
    execFileSync(".venv/bin/python", [
      "-c",
      "import sys; from PIL import Image; Image.open(sys.stdin.buffer).convert('RGB').save(sys.argv[1], lossless=True, method=6)",
      out,
    ], { input: Buffer.from(backgrounds[index].split(",")[1], "base64") });
    console.log(`wrote ${out}`);
  }
});
