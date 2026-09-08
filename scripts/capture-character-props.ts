import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://127.0.0.1:5173/character-lab");
await page.evaluate(async () => {
  const { drawCharacter } = await import(
    "/src/render/characters/draw.ts" as string
  );
  const { loadCarriedArt, portableProps } = await import(
    "/src/render/characters/props.ts" as string
  );
  const { originalAppearance } = await import(
    "/src/core/character.ts" as string
  );
  const art = await loadCarriedArt(),
    c = document.createElement("canvas"),
    b = document.createElement("canvas");
  b.width = b.height = 80;
  c.width = 4 * 160;
  c.height = portableProps.length * 130;
  const ctx = c.getContext("2d")!,
    bc = b.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#829255";
  ctx.fillRect(0, 0, c.width, c.height);
  portableProps.forEach((p: any, i: number) => {
    for (let d = 0; d < 4; d++) {
      drawCharacter(bc, originalAppearance, d, "carry", 0, art.get(p.sprite));
      ctx.drawImage(b, 8, 24, 64, 56, d * 160, i * 130, 128, 112);
    }
    ctx.fillStyle = "#17261d";
    ctx.font = "12px monospace";
    ctx.fillText(p.name, 5, i * 130 + 126);
  });
  document.body.replaceChildren(c);
  c.style.imageRendering = "pixelated";
});
await page
  .locator("canvas")
  .screenshot({ path: "artifacts/characters/all-carrying.png" });
await browser.close();
