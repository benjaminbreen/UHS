import { expect, test } from "@playwright/test";

test("batched ground matches individual tiles and reduces canvas writes", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    const Original = window.Worker;
    (window as any).groundResponses = [];
    window.Worker = class extends Original {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", ({ data }) => {
          if (data.groundPage) (window as any).groundResponses.push(data);
        });
      }
    };
  });
  await page.goto(
    "/terrain-lab?place=rome&seed=ground-batch&year=-99&ecology=dry-scrub&pattern=dense&population=settled&water=none&landform=plain&start=resident",
  );
  await expect(page.locator("canvas[data-terrain-ready]")).toHaveAttribute(
    "data-terrain-pending",
    "0",
    { timeout: 100000 },
  );
  const result = await page.evaluate(async () => {
    const load = (url: string) => import(/* @vite-ignore */ url);
    const { drawTopography } = await load("/src/render/topography.ts");
    const { TERRAIN_CHUNK_SIZE: size, TERRAIN_CHUNK_PAD: pad } = await load(
      "/src/render/terrain-region.ts",
    );
    const scene = (window as any).terrainLab.scene;
    const responses = (window as any).groundResponses;
    let differences = 0;
    const times: number[][] = [[], []],
      writes = [0, 0];
    const original = CanvasRenderingContext2D.prototype.putImageData;
    for (const done of responses.slice(0, 8)) {
      const ground = done.groundPage;
      const restored = [...done.groundTiles];
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          if (!ground.tiles[y * size + x]) continue;
          const pixels = new Uint8ClampedArray(1024);
          for (let row = 0; row < 16; row++) {
            const start = ((y * 16 + row) * ground.width + x * 16) * 4;
            pixels.set(ground.pixels.subarray(start, start + 64), row * 64);
          }
          restored.push({ x, y, pixels });
        }
      const snapshots: Uint8ClampedArray[][] = [];
      for (const mode of [0, 1]) {
        CanvasRenderingContext2D.prototype.putImageData = function (
          ...args: [ImageData, number, number, ...number[]]
        ) {
          writes[mode]++;
          return Reflect.apply(original, this, args);
        };
        const start = performance.now();
        const resources = drawTopography(
          scene,
          (x: number, y: number) =>
            done.cells[(y + pad) * (size + pad * 2) + x + pad],
          size,
          size,
          { x: 0, y: 0, prefix: "batch-review" },
          done.bridges,
          done.waterTiles,
          mode ? done.groundTiles : restored,
          done.living,
          mode ? ground : undefined,
        );
        times[mode].push(performance.now() - start);
        snapshots.push(
          resources.textures
            .filter((key: string) => key.includes("-ground-"))
            .sort()
            .map((key: string) => {
              const texture = scene.textures.get(key);
              return texture
                .getContext()
                .getImageData(0, 0, texture.width, texture.height).data;
            }),
        );
        for (const object of resources.objects) object.destroy();
        for (const key of resources.textures) scene.textures.remove(key);
      }
      if (snapshots[0].length !== snapshots[1].length) differences++;
      snapshots[0].forEach((pixels, i) => {
        const other = snapshots[1][i];
        if (
          !other ||
          pixels.length !== other.length ||
          pixels.some((v, j) => v !== other[j])
        )
          differences++;
      });
    }
    CanvasRenderingContext2D.prototype.putImageData = original;
    scene.options.freeze = true;
    scene.options.waterAnimation = false;
    scene.draw();
    return { chunks: responses.length, differences, writes, times };
  });
  console.log("Ground page comparison", JSON.stringify(result));
  expect(result.chunks).toBeGreaterThan(0);
  expect(result.differences).toBe(0);
  expect(result.writes[1]).toBeLessThan(result.writes[0] / 4);
  await page.screenshot({ path: "artifacts/ground-pages.png" });
  await page.evaluate(() => {
    const lab = (window as any).terrainLab;
    const center = lab.scene.options.center ?? lab.runtime.engine.world.spawn;
    lab.scene.options.center = { x: center.x + 32, y: center.y + 16 };
    lab.scene.draw();
  });
  await expect(page.locator("canvas[data-terrain-ready]")).toHaveAttribute(
    "data-terrain-pending",
    "0",
    { timeout: 60000 },
  );
  expect(
    await page.locator("canvas").getAttribute("data-terrain-error"),
  ).toBeNull();
});
