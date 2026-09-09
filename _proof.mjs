import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
page.on("pageerror", (e) => console.error(e));
page.on("console", (m) => console.log("PAGE:", m.text()));
await page.goto("http://127.0.0.1:54987/character-lab");

const b64 = await page.evaluate(async () => {
  const { drawCharacter } = await import("/src/render/characters/draw.ts");
  const { generateAppearance, beardStyles, beltStyles } = await import("/src/core/character.ts");
  const base = generateAppearance("proof", 3, 35);
  const rows = [
    ...beardStyles.map((v) => ["beard", v]),
    ...beltStyles.map((v) => ["belt", v]),
  ];
  const CELL = 80, SCALE = 4, DIRS = [2, 1];
  const out = document.createElement("canvas");
  out.width = CELL * DIRS.length * SCALE;
  out.height = CELL * rows.length * SCALE;
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = false;
  octx.fillStyle = "#7d9455";
  octx.fillRect(0, 0, out.width, out.height);
  const tmp = document.createElement("canvas");
  tmp.width = tmp.height = CELL;
  const tctx = tmp.getContext("2d");
  rows.forEach(([kind, v], r) => {
    const a = kind === "beard"
      ? { ...base, beard: v, hair: "cropped", wearing: { ...base.wearing, headwear: "none" } }
      : { ...base, beard: "none", wearing: { ...base.wearing, belt: v, garment: "tunic" } };
    DIRS.forEach((d, c) => {
      drawCharacter(tctx, a, d, "idle", 0);
      octx.drawImage(tmp, 0, 0, CELL, CELL, c * CELL * SCALE, r * CELL * SCALE, CELL * SCALE, CELL * SCALE);
      tctx.clearRect(0, 0, CELL, CELL);
    });
    octx.fillStyle = "#fff";
    octx.font = "16px monospace";
    octx.fillText(`${kind}: ${v}`, 8, r * CELL * SCALE + 20);
  });
  return out.toDataURL().split(",")[1];
});
const fs = await import("node:fs");
fs.writeFileSync("artifacts/characters/proof-beard-belt.png", Buffer.from(b64, "base64"));
await browser.close();
