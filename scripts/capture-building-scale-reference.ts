import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const out = resolve("scripts/art/reference/current-adult.png");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:5173/character-lab");
const result = await page.evaluate(async () => {
  const { drawCharacter, defaultRenderer } = await import(
    "/src/render/characters/renderers.ts" as string
  );
  const { originalAppearance } = await import(
    "/src/core/character.ts" as string
  );
  const source = document.createElement("canvas");
  source.width = source.height = 80;
  drawCharacter(
    source.getContext("2d", { willReadFrequently: true })!,
    originalAppearance,
    2,
    "idle",
    0,
    undefined,
    4,
  );
  const pixels = source.getContext("2d")!.getImageData(0, 0, 80, 80).data;
  let x0 = 80,
    y0 = 80,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 80; x++)
      if (pixels[(y * 80 + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  const crop = document.createElement("canvas");
  crop.width = x1 - x0 + 1;
  crop.height = y1 - y0 + 1;
  crop
    .getContext("2d")!
    .drawImage(
      source,
      x0,
      y0,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );
  return {
    png: crop.toDataURL("image/png").split(",")[1],
    renderer: defaultRenderer,
    sourceBounds: [x0, y0, x1 + 1, y1 + 1],
    occupied: [crop.width, crop.height],
  };
});
await browser.close();
await mkdir(dirname(out), { recursive: true });
await writeFile(out, Buffer.from(result.png, "base64"));
await writeFile(
  out.replace(/\.png$/, ".json"),
  `${JSON.stringify(
    {
      renderer: result.renderer,
      appearance: "originalAppearance",
      facing: 4,
      pose: "idle",
      frame: 0,
      sourceBounds: result.sourceBounds,
      occupied: result.occupied,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `wrote ${out} (${result.occupied.join("x")}, renderer ${result.renderer})`,
);
