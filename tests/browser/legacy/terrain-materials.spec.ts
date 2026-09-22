import { expect, test } from "@playwright/test";

test("renders mixed-material altitude contours without tile-shaped material remnants", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const load = (path: string) => import(/* @vite-ignore */ path);
    const [
      { rasterTerrainContours, wallOwnsCell },
      { rasterHabitatTile },
      { rasterWaterTile },
      { setGroundStyle, defaultGroundStyle },
    ] = await Promise.all([
      load("/src/render/terrain-contours.ts"),
      load("/src/render/habitat-raster.ts"),
      load("/src/render/water-raster.ts"),
      load("/src/render/ground-style.ts"),
    ]);
    setGroundStyle(defaultGroundStyle());
    const sample = (x: number, y: number) => {
      const distance = Math.hypot((x - 9.5) * 0.85, y - 9.5) - 3.5;
      return {
        height: distance > 2.5 ? 1 : 0,
        surface: distance < 0 ? "water" : distance < 2.5 ? "gravel" : "grass",
        habitat: {
          ecology: "grassland",
          kind: "open",
          season: "summer",
          wet: 0.3,
          cover: 0.3,
          exposed: 0,
        },
        waterVisual: {
          distance,
          kind: "lake",
          ecology: "grassland",
          shoreWidth: 2.5,
          flow: [0, 0],
          frozenMargin: false,
        },
      };
    };
    const tiles = [];
    const water = [];
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        if (sample(x, y).surface === "water")
          water.push(rasterWaterTile(sample, x, y, 0, 0));
        else tiles.push(rasterHabitatTile(sample, x, y, 0, 0));
      }
    const layers = rasterTerrainContours(
      sample,
      20,
      20,
      [],
      { x: 0, y: 0, prefix: "fixture" },
      tiles,
    );
    document.body.replaceChildren();
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 340;
    canvas.style.cssText =
      "width:960px;height:1020px;image-rendering:pixelated";
    document.body.append(canvas);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#819253";
    ctx.fillRect(0, 0, 320, 340);
    const draw = (
      pixels: Uint8ClampedArray,
      width: number,
      height: number,
      x: number,
      y: number,
    ) => {
      const tile = document.createElement("canvas");
      tile.width = width;
      tile.height = height;
      const tc = tile.getContext("2d")!;
      const data = tc.createImageData(width, height);
      data.data.set(pixels);
      tc.putImageData(data, 0, 0);
      ctx.drawImage(tile, x, y + 20);
    };
    for (const t of [...tiles, ...water])
      if (!wallOwnsCell(sample, t.x, t.y))
        draw(
          t.pixels,
          16,
          16,
          t.x * 16,
          t.y * 16 - sample(t.x, t.y).height * 20,
        );
    layers.sort(
      (a: any, b: any) =>
        a.row * 16 + (a.flat ? -7 : 1.5) - b.row * 16 - (b.flat ? -7 : 1.5),
    );
    for (const l of layers) draw(l.pixels, l.width, l.height, l.x, l.y);
    const data = ctx.getImageData(16, 36, 288, 248).data;
    let holes = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i] === 129 && data[i + 1] === 146 && data[i + 2] === 83) holes++;
    return { holes, layers: layers.length };
  });
  expect(result.holes).toBe(0);
  expect(result.layers).toBeGreaterThan(0);
  await page
    .locator("canvas")
    .screenshot({ path: "artifacts/terrain-material-bank.png" });
});
