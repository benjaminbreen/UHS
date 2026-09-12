import { expect, test } from "@playwright/test";

/** A contact sheet of every glyph, for looking at. */
const only = process.env.GLYPHS?.split(",").filter(Boolean) ?? [];
const out = process.env.GLYPH_SHEET ?? "artifacts/glyph-sheet.png";

test("renders the glyph sheet", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/");
  const sheet = await page.evaluate(async (wanted: string[]) => {
    const path = performance
      .getEntriesByType("resource")
      .find((r) => r.name.includes("/src/"))!.name;
    const base = path.slice(0, path.indexOf("/src/"));
    const { glyphs, drawGlyph, GLYPH_SIZE } = await import(
      /* @vite-ignore */ `${base}/src/render/glyphs/index.ts`
    );
    const ids = Object.keys(glyphs).filter(
      (id) => !wanted.length || wanted.includes(id),
    );
    const columns = 12,
      cell = GLYPH_SIZE + 9,
      scale = 4;
    const rows = Math.ceil(ids.length / columns);
    const canvas = document.createElement("canvas");
    canvas.width = columns * cell * scale;
    canvas.height = rows * (cell + 7) * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#141b2f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ids.forEach((id, i) => {
      const x = (i % columns) * cell + 4,
        y = Math.floor(i / columns) * (cell + 7) + 4;
      drawGlyph(ctx, id, x, y, {
        edge: "#6a4a2c",
        base: "#d9b477",
        light: "#f6e6c2",
      });
      ctx.fillStyle = "#8fa0bb";
      ctx.font = "4px monospace";
      ctx.fillText(id.slice(0, 13), x - 3, y + GLYPH_SIZE + 5);
    });
    return canvas.toDataURL("image/png");
  }, only);
  const buffer = Buffer.from(sheet.split(",")[1], "base64");
  await page.setContent(
    `<body style="margin:0;background:#141b2f"><img src="${sheet}"></body>`,
  );
  await page.locator("img").screenshot({ path: out });
  expect(buffer.length).toBeGreaterThan(1000);
});
