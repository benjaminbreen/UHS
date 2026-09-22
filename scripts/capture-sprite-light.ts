/** The same figure through the day: the key light should change side with the
 * sun and flatten at night, not just take a flat multiply. */
import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto(`http://127.0.0.1:${process.env.PORT ?? 5173}/character-lab`);
const shot = await page.evaluate(async () => {
  const { drawCharacter } = await import(
    "/src/render/characters/v2/draw.ts" as string
  );
  const { setSpriteLight, spriteLightFor } = await import(
    "/src/render/characters/v2/pixels.ts" as string
  );
  const { lightingPresets } = await import("/src/render/lighting.ts" as string);
  const { originalAppearance } = await import(
    "/src/core/character.ts" as string
  );
  const a = {
    ...(originalAppearance as any),
    skin: "#b78464",
    hairColor: "#493627",
    wearing: {
      ...(originalAppearance as any).wearing,
      garment: "tunic",
      sleeves: "short",
      color: "#e4d6af",
      lowerColor: "#38798b",
    },
  };
  const S = 8, cell = 64;
  const c = document.createElement("canvas"), b = document.createElement("canvas");
  c.width = lightingPresets.length * cell * S;
  c.height = 2 * cell * S;
  b.width = b.height = 80;
  const ctx = c.getContext("2d")!, bc = b.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#8d9484";
  ctx.fillRect(0, 0, c.width, c.height);
  lightingPresets.forEach((preset: any, col: number) => {
    setSpriteLight({
      ...spriteLightFor(preset.cast, preset.id === "night"),
      warm: `#${preset.tint}`,
      cool: preset.ambientAlpha ? `#${preset.ambient}` : "#241c38",
    });
    [2, 1].forEach((dir, row) => {
      bc.clearRect(0, 0, 80, 80);
      drawCharacter(bc, a, dir, "idle", 0);
      ctx.drawImage(b, 8, 16, cell, cell, col * cell * S, row * cell * S, cell * S, cell * S);
    });
  });
  setSpriteLight(undefined);
  return c.toDataURL();
});
const { writeFileSync } = await import("node:fs");
writeFileSync(process.argv[2] ?? "artifacts/sprite-light.png", Buffer.from(shot.split(",")[1], "base64"));
await browser.close();
console.log("ok");
