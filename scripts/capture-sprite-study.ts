/** A spread wide enough to judge the shading engine rather than one draw:
 * dark and light palettes, bare and clothed, thin limbs, all four views. */
import { chromium } from "@playwright/test";
const out = process.argv[2] ?? "artifacts/sprite-study.png";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.addInitScript(`window.__poses = ${JSON.stringify((process.env.POSES ?? "idle,chop").split(","))}; window.__scale = ${process.env.SCALE ?? 4}; window.__only = ${process.env.ONLY ?? "undefined"}`);
await page.goto(`http://127.0.0.1:${process.env.PORT ?? 5173}/character-lab`);
const shot = await page.evaluate(async () => {
  const { drawCharacter } = await import(
    "/src/render/characters/v2/draw.ts" as string
  );
  const { originalAppearance } = await import(
    "/src/core/character.ts" as string
  );
  const base = originalAppearance as any;
  const only = (window as any).__only as number | undefined;
  const people = [
    // Near-black hair on deep skin, short tunic: the common village draw.
    { skin: "#70472f", hairColor: "#171312", hair: "braid",
      wearing: { garment: "tunic", sleeves: "short", color: "#59483d", lowerColor: "#743f45" } },
    // Light palette, long sleeves: thin limbs against a pale garment.
    { skin: "#f0ceb0", hairColor: "#a88850", hair: "cropped",
      wearing: { garment: "shirt", sleeves: "long", color: "#e4d6af", lowerColor: "#424f62" } },
    // Bare torso: skin ramp carrying the whole body, arms unclothed.
    { skin: "#a97143", hairColor: "#292823", hair: "long",
      wearing: { garment: "none", sleeves: "none", color: "#ab5a36", lowerColor: "#ab5a36" } },
    // Layered: cloak over robe, the case for contact shadow.
    { skin: "#c18a54", hairColor: "#493627", hair: "bun",
      wearing: { garment: "robe", sleeves: "long", color: "#2f625b", lowerColor: "#38798b", cloak: true, cloakColor: "#743f45" } },
  ];
  const poses = (window as any).__poses ?? ["idle", "chop"];
  const S = (window as any).__scale ?? 4;
  const cell = 64, cols = poses.length * 4, rows = only === undefined ? people.length : 1;
  const c = document.createElement("canvas"), b = document.createElement("canvas");
  c.width = cols * cell * S; c.height = rows * cell * S;
  b.width = b.height = 80;
  const ctx = c.getContext("2d")!, bc = b.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#8d9484";
  ctx.fillRect(0, 0, c.width, c.height);
  (only === undefined ? people : [people[only]]).forEach((p, row) => {
    const a = { ...base, ...p, wearing: { ...base.wearing, ...p.wearing } };
    let col = 0;
    for (const pose of poses)
      for (const dir of [2, 1, 0, 3]) {
        bc.clearRect(0, 0, 80, 80);
        drawCharacter(bc, a, dir, pose, pose === "idle" ? 0 : 1);
        ctx.drawImage(b, 8, 16, cell, cell, col * cell * S, row * cell * S, cell * S, cell * S);
        col++;
      }
  });
  return c.toDataURL();
});
const { writeFileSync } = await import("node:fs");
writeFileSync(out, Buffer.from(shot.split(",")[1], "base64"));
await browser.close();
console.log("wrote", out);
