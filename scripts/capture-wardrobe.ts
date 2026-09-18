/**
 * Review sheet for the wardrobe vocabulary: every garment, hat, leg and foot
 * shape side by side, and a crowd per era. Run the dev server first, then:
 *   UHS_URL=http://127.0.0.1:5173 npx tsx scripts/capture-wardrobe.ts
 */
import { chromium } from "@playwright/test";
const url = process.env.UHS_URL ?? "http://127.0.0.1:5173";
// Plain JS, evaluated as source: tsx's keepNames helper does not survive being
// serialised into the page, and the browser cannot parse TS annotations.
const SHEET = `(async () => {
  const load = (p) => (new Function("p", "return import(p)"))(p);
  const draw = await load("/src/render/characters/v2/draw.ts");
  const ch = await load("/src/core/character.ts");
  const base = ch.generateAppearance("wardrobe-sheet", 3, 34);
  base.wearing.color = "#7a4f6b";
  base.wearing.lowerColor = "#4a5a76";
  base.wearing.trim = "#c8a24a";
  base.wearing.cloakColor = "#8a5a3a";
  base.wearing.belt = "leather";
  base.wearing.footwear = "shoes";
  const rows = [
    { cells: ch.garments.map((g) => ({ garment: g, _l: g })) },
    { cells: ch.headwear.map((h) => ({ headwear: h, _l: h })) },
    { cells: ch.leggings.map((l) => ({ leggings: l, garment: "tunic", _l: l })) },
    { cells: ch.footwear.map((f) => ({ footwear: f, garment: "tunic", _l: f })) },
    { cells: [
      { _l: "plain" },
      { cloak: true, _l: "cloak" },
      { mantle: true, _l: "mantle" },
      { shoulderCloth: true, _l: "shoulder" },
    ] },
  ];
  const scale = 5, cell = 46, pad = 18;
  const cols = Math.max.apply(null, rows.map((r) => r.cells.length));
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell * scale;
  canvas.height = rows.length * (cell + pad) * scale;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#11182a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const one = document.createElement("canvas");
  one.width = one.height = 80;
  const oneCtx = one.getContext("2d");
  rows.forEach((row, y) => {
    row.cells.forEach((over, x) => {
      const label = over._l;
      const wearing = Object.assign({}, base.wearing, over);
      delete wearing._l;
      draw.drawCharacter(oneCtx, Object.assign({}, base, { wearing }), 2, "idle", 0);
      ctx.drawImage(
        one, 0, 0, 80, 80,
        x * cell * scale, y * (cell + pad) * scale,
        80 * scale * 0.55, 80 * scale * 0.55,
      );
      ctx.fillStyle = "#c9d4e8";
      ctx.font = Math.round(scale * 2.2) + "px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        label,
        (x * cell + cell / 2) * scale,
        (y * (cell + pad) + 52) * scale,
      );
    });
  });
  return canvas.toDataURL("image/png");
})()`;

// A crowd per region and era, to see whether a street reads as one place and
// one century. Extend ROWS as regions are authored.
const ROWS = `[
  ["south-asian", -200], ["south-asian", 900],
  ["south-asian", 1650], ["south-asian", 1930],
  ["southeast-asian", 200], ["southeast-asian", 1600],
  ["southeast-asian", 1980],
  ["east-asian", -500], ["east-asian", 800],
  ["east-asian", 1600], ["east-asian", 1980],
  ["north-african-west-asian", -300], ["north-african-west-asian", 1100],
  ["north-african-west-asian", 1700], ["north-african-west-asian", 1900],
  ["andean", -400], ["andean", 1400], ["andean", 1900],
  ["mesoamerican", -400], ["mesoamerican", 1400], ["mesoamerican", 1900],
  ["european", -300], ["european", 900], ["european", 1500],
  ["european", 1850], ["european", 1990],
  ["inner-eurasian", -300], ["inner-eurasian", 1200], ["inner-eurasian", 1990],
  ["west-central-african", 500, 5, 10], ["west-central-african", 1500, 5, 10],
  ["west-central-african", 1950, 5, 10],
  ["east-southern-african", 500, 35, -5], ["east-southern-african", 1900, 35, -5],
  ["other-indigenous-american", 1500, -100, 45],
  ["other-indigenous-american", 1500, -60, -5],
  ["other-indigenous-american", 1900, -100, 45],
  ["australian-pacific", 1500, 170, -15], ["australian-pacific", 1900, 170, -15]
]`;
const CROWD = `(async () => {
  const load = (p) => (new Function("p", "return import(p)"))(p);
  const draw = await load("/src/render/characters/v2/draw.ts");
  const ch = await load("/src/core/character.ts");
  const wd = await load("/src/content/characters/wardrobe/index.ts");
  const rows = ${ROWS};
  const N = 12, scale = 4, cell = 30, pad = 20;
  const canvas = document.createElement("canvas");
  canvas.width = N * cell * scale;
  canvas.height = rows.length * (cell + pad) * scale;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#11182a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const one = document.createElement("canvas");
  one.width = one.height = 80;
  const oneCtx = one.getContext("2d");
  const jobs = ["farmer", "fisher", "trader", "craftsperson"];
  rows.forEach((row, y) => {
    const culture = row[0], year = row[1];
    const lon = row[2] === undefined ? 80 : row[2];
    const lat = row[3] === undefined ? 10 : row[3];
    const setting = { culture, year, placeId: "p", lon, lat, community: "local" };
    for (let i = 0; i < N; i++) {
      const id = culture + "-" + year + "-" + i;
      const age = 18 + ((i * 11) % 50);
      const a = ch.generateAppearance(id, i, age);
      a.wearing = wd.wardrobeFor(
        { id, age, sex: i % 2 ? "female" : "male", livelihood: jobs[i % 4] },
        { year, setting },
        a.wearing,
      );
      draw.drawCharacter(oneCtx, a, 2, "idle", 0);
      ctx.drawImage(
        one, 0, 0, 80, 80,
        i * cell * scale, y * (cell + pad) * scale,
        80 * scale * 0.45, 80 * scale * 0.45,
      );
    }
    ctx.fillStyle = "#d5b16a";
    ctx.font = Math.round(scale * 2.6) + "px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      culture + "  " + Math.abs(year) + (year < 0 ? " BCE" : " CE") +
        (row[2] === undefined ? "" : "  (" + lon + ", " + lat + ")"),
      3 * scale,
      (y * (cell + pad) + cell + 12) * scale,
    );
  });
  return canvas.toDataURL("image/png");
})()`;
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
page.on("pageerror", (e) => console.error(e));
await page.goto(`${url}/character-lab`);
await page.waitForTimeout(1500);
const png = (await page.evaluate(SHEET)) as string;
const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir("artifacts/wardrobe", { recursive: true });
await writeFile(
  "artifacts/wardrobe/shapes.png",
  Buffer.from(png.split(",")[1], "base64"),
);
const crowd = (await page.evaluate(CROWD)) as string;
await writeFile(
  "artifacts/wardrobe/regions.png",
  Buffer.from(crowd.split(",")[1], "base64"),
);
await browser.close();
console.log("artifacts/wardrobe/shapes.png artifacts/wardrobe/regions.png");
