import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto("http://127.0.0.1:5173/character-lab");
await page.evaluate(async () => {
  const { drawCharacter } = await import(
    "/src/render/characters/draw.ts" as string
  );
  const { originalAppearance } = await import(
    "/src/core/character.ts" as string
  );
  const a = {
    ...originalAppearance,
    hairColor: "#91431f",
    wearing: {
      ...originalAppearance.wearing,
      garment: "shirt",
      color: "#52822e",
      lowerColor: "#354989",
      trim: "#b8b04b",
    },
  };
  const b = document.createElement("canvas"),
    c = document.createElement("canvas");
  b.width = b.height = 80;
  c.width = 4 * 160;
  c.height = 4 * 184;
  const ctx = c.getContext("2d")!,
    bc = b.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#c8cbc1";
  ctx.fillRect(0, 0, c.width, c.height);
  for (let d = 0; d < 4; d++)
    for (let f = 0; f < 4; f++) {
      drawCharacter(bc, a, [2, 1, 0, 3][d], "walk", f);
      ctx.drawImage(b, 20, 40, 40, 40, f * 160, d * 184, 160, 160);
      ctx.fillStyle = "#29332f";
      ctx.font = "12px monospace";
      ctx.fillText(
        `${["South", "East", "North", "West"][d]} / ${f + 1}`,
        f * 160 + 30,
        d * 184 + 178,
      );
    }
  document.body.replaceChildren(c);
  c.style.imageRendering = "pixelated";
});
await page
  .locator("canvas")
  .screenshot({ path: "artifacts/characters/refined-walk.png" });
await page.goto("http://127.0.0.1:5173/");
await page.locator(".game-container canvas[data-ready=true]").waitFor();
await page.evaluate(async () => {
  const r = (window as any).__uhs;
  const { originalAppearance } = await import(
    "/src/core/character.ts" as string
  );
  r.customizeCharacter("player", {
    ...originalAppearance,
    hairColor: "#91431f",
    wearing: {
      ...originalAppearance.wearing,
      garment: "shirt",
      color: "#52822e",
      lowerColor: "#354989",
      trim: "#b8b04b",
    },
  });
  r.setZoom(4);
});
await page
  .locator(".game-container canvas[data-character-pose=breathe]")
  .waitFor();
await page
  .locator(".game-container canvas")
  .screenshot({ path: "artifacts/characters/refined-world.png" });
await browser.close();
