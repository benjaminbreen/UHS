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
  const a = {
    ...originalAppearance,
    skin: "#f0ceb0",
    hairColor: "#a35432",
    hair: "braid",
    jaw: "small",
    wearing: {
      ...originalAppearance.wearing,
      garment: "shirt",
      sleeves: "long",
      color: "#387748",
      lowerColor: "#645675",
    },
  };
  const c = document.createElement("canvas"),
    b = document.createElement("canvas");
  c.width = 768;
  c.height = 800;
  b.width = b.height = 80;
  const ctx = c.getContext("2d")!,
    bc = b.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#c8cbc1";
  ctx.fillRect(0, 0, 768, 800);
  for (let row = 0; row < 4; row++)
    for (let f = 0; f < 4; f++) {
      const recipe =
        row === 1
          ? {
              ...a,
              skin: "#70472f",
              hair: "cropped",
              jaw: "square",
              wearing: { ...a.wearing, color: "#b89343" },
            }
          : row === 3
            ? { ...a, build: [-1, 0, 1, 2][f] }
            : a;
      drawCharacter(
        bc,
        recipe,
        row < 2 ? 1 : 2,
        row < 2 ? "walk" : row === 2 ? "breathe" : "idle",
        row === 3 ? 0 : f,
      );
      ctx.drawImage(b, 16, 36, 48, 44, f * 192, row * 200, 192, 176);
      ctx.fillStyle = "#29332f";
      ctx.font = "12px monospace";
      ctx.fillText(
        `${["Light / side walk", "Dark / side walk", "Breathing", "Widths"][row]} ${row === 3 ? ["default", "previous", "broad", "full"][f] : f}`,
        f * 192 + 8,
        row * 200 + 193,
      );
    }
  document.body.replaceChildren(c);
  c.style.imageRendering = "pixelated";
});
await page
  .locator("canvas")
  .screenshot({ path: "artifacts/characters/final-polish.png" });
await browser.close();
