/** Interior review sheets: every public building of a group drawn whole, at
 * two finishes, labelled, on one canvas.
 *
 * Usage: npm run capture:interiors                    (every group)
 *        npm run capture:interiors -- baths           (a group, by its label)
 *        npm run capture:interiors -- kiva hammam     (profiles, by id)
 *        UHS_HOUR=21 npm run capture:interiors -- ... (the hour; default 11)
 *        UHS_STATUS=0,2 npm run capture:interiors -- ... (finishes; default common)
 */
import { withPage, base, writeDataUrl } from "./lib";

const asked = process.argv.slice(2);
const hour = Number(process.env.UHS_HOUR ?? 11);
const statuses = (process.env.UHS_STATUS ?? "1").split(",").map(Number);

await withPage({}, async (page) => {
  await page.goto(`${base}/interior-lab`);
  await page.waitForTimeout(1200);
  await page.evaluate("window.__name = (fn) => fn");
  const sheets: { name: string; url: string }[] = await page.evaluate(
    async ([asked, hour, statuses]) => {
      const { publicInteriorGroups } = await import("/src/content/interiors/index.ts" as string);
      const { planBuilding } = await import("/src/render/interiors/building.ts" as string);
      const { PixelRoom } = await import("/src/render/interiors/pixel.ts" as string);
      const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");
      const ids = asked as string[];
      const groups = (publicInteriorGroups as { label: string; profiles: any[] }[])
        .map((g) => ({ name: slug(g.label), profiles: g.profiles.filter((p) => !ids.length || ids.includes(slug(g.label)) || ids.includes(p.id)) }))
        .filter((g) => g.profiles.length);
      const render = (pr: any, status: number) => {
        const size = pr.rooms?.[0].size ?? pr.size;
        const b = planBuilding(pr, { seed: 7, status, colorway: 0, w: size[0], d: size[1], hour: hour as number });
        const cv = document.createElement("canvas");
        const room = new PixelRoom(cv);
        room.set({ ...b.plan.rooms[0], w: b.plan.w, d: b.plan.d, entrance: b.plan.entrance[0], hour }, b.props, b.plan);
        for (let i = 0; i < 30; i++) room.frame(0.05);
        return cv;
      };
      return groups.map((g) => {
        const cells = g.profiles.flatMap((pr) => (statuses as number[]).map((status) => ({ pr, status, cv: render(pr, status) })));
        const k = 2, pad = 16, head = 34, colW = Math.max(...cells.map((c) => c.cv.width)) * k + pad;
        const cols = 3, rows = Math.ceil(cells.length / cols);
        const rowH = Array.from({ length: rows }, (_, r) => Math.max(...cells.slice(r * cols, r * cols + cols).map((c) => c.cv.height)) * k + head + pad);
        const sheet = document.createElement("canvas");
        sheet.width = cols * colW + pad;
        sheet.height = rowH.reduce((a, b) => a + b, 0) + pad;
        const g2 = sheet.getContext("2d")!;
        g2.fillStyle = "#14121a";
        g2.fillRect(0, 0, sheet.width, sheet.height);
        g2.imageSmoothingEnabled = false;
        cells.forEach((c, i) => {
          const x = pad + (i % cols) * colW, y = pad + rowH.slice(0, Math.floor(i / cols)).reduce((a, b) => a + b, 0);
          g2.fillStyle = "#eee9d2";
          g2.font = "bold 18px system-ui";
          g2.fillText(`${c.pr.label} · ${["humble", "common", "elite"][c.status]} · ${c.pr.period}`, x, y + 22);
          g2.drawImage(c.cv, x, y + head, c.cv.width * k, c.cv.height * k);
        });
        return { name: g.name, url: sheet.toDataURL() };
      });
    },
    [asked, hour, statuses] as const,
  );
  for (const s of sheets) await writeDataUrl(s.url, `artifacts/interiors/${s.name}.png`);
});
