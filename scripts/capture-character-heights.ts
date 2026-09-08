import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://127.0.0.1:5173/character-lab");
await page.evaluate(async () => {
  const { drawCharacter } = await import(
    "/src/render/characters/draw.ts" as string
  );
  const { originalAppearance } = await import(
    "/src/core/character.ts" as string
  );
  const b = document.createElement("canvas"),
    c = document.createElement("canvas");
  b.width = b.height = 80;
  c.width = 700;
  c.height = 420;
  const ctx = c.getContext("2d")!,
    bc = b.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#829255";
  ctx.fillRect(0, 0, c.width, c.height);
  const names = [
    "Under 6",
    "Child / short adult",
    "Original adult",
    "Tall adult",
    "Tallest adult",
  ];
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 5; i++) {
      const a = { ...originalAppearance, height: i - 2 };
      drawCharacter(
        bc,
        a,
        row === 1 ? 1 : 2,
        row === 2 ? "walk" : "idle",
        row === 2 ? 1 : 0,
      );
      ctx.drawImage(b, 20, 40, 40, 40, i * 140 + 10, row * 140, 120, 120);
      ctx.fillStyle = "#263820";
      ctx.fillRect(i * 140 + 10, row * 140 + 121, 120, 1);
      ctx.font = "11px monospace";
      ctx.fillText(names[i], i * 140 + 4, row * 140 + 137);
    }
  document.body.replaceChildren(c);
  c.style.imageRendering = "pixelated";
});
await page
  .locator("canvas")
  .screenshot({ path: "artifacts/characters/heights.png" });
await browser.close();
