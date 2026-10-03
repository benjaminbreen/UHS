/** Interior review sheets: every public building of a group drawn whole, at
 * two finishes, labelled, on one canvas.
 *
 * Usage: npm run capture:interiors                    (every group)
 *        npm run capture:interiors -- baths           (a group, by its label)
 *        npm run capture:interiors -- kiva hammam     (profiles, by id)
 *        UHS_HOUR=21 npm run capture:interiors -- ... (the hour; default 11)
 *        UHS_STATUS=0,2 npm run capture:interiors -- ... (finishes; default common)
 *        npm run capture:interiors -- shops            (a shop of each kind, in a fitting house)
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
      if (ids.includes("shops")) {
        const { shopFor, shopKinds } = await import("/src/content/interiors/shops.ts" as string);
        const { interiorProfile } = await import("/src/content/interiors/index.ts" as string);
        const where: [string, string, number, number, number][] = [
          ["bread", "flemish-townhouse", 4.9, 52.4, 1650], ["tools", "medieval-cottage", -0.1, 51.5, 1400],
          ["meat", "roman-domus", 12.5, 41.9, 100], ["cloth", "maghrebi-dar", -5, 34, 1500],
          ["apothecary", "flemish-townhouse", 4.9, 52.4, 1650], ["tea", "japanese-minka", 135.8, 35, 1750],
          ["fine", "japanese-minka", 135.8, 35, 1750], ["general", "farmhouse-1930s", -0.1, 51.5, 1900],
          ["candles", "medieval-cottage", -0.1, 51.5, 1400], ["timber", "medieval-cottage", 2, 47, 1300],
          ["fish", "roman-domus", 12.5, 41.9, 100], ["pots", "ming-study", 116, 40, 1600], ["leather", "flemish-townhouse", 4.9, 52.4, 1700],
        ];
        groups.push({ name: "shops", profiles: where.map(([kind, home, lon, lat, year]) =>
          ({ ...shopFor(interiorProfile(home), shopKinds.find((k: any) => k.id === kind), { lon, lat, year }), label: `${kind} in a ${home}`, period: String(year) })) });
      }
      const { T, FLOOR_X, FLOOR_Y } = await import("/src/render/interiors/pixel.ts" as string);
      const render = (pr: any, status: number, firstRoom = false) => {
        const size = pr.rooms?.[0].size ?? pr.size;
        const b = planBuilding(pr, { seed: 7, status, colorway: 0, w: size[0], d: size[1], hour: hour as number });
        const cv = document.createElement("canvas");
        const room = new PixelRoom(cv);
        room.set({ ...b.plan.rooms[0], w: b.plan.w, d: b.plan.d, entrance: b.plan.entrance[0], hour }, b.props, b.plan);
        for (let i = 0; i < 30; i++) room.frame(0.05);
        if (!firstRoom) return cv;
        // Just the first room, with the wall above it.
        const r = b.rooms[0], x = FLOOR_X + r.x * T - 10, y = FLOOR_Y + r.y * T - 62, w = r.w * T + 20, h = r.d * T + 74;
        const out = document.createElement("canvas");
        out.width = w; out.height = h;
        out.getContext("2d")!.drawImage(cv, x, y, w, h, 0, 0, w, h);
        return out;
      };
      return groups.map((g) => {
        const cells = g.profiles.flatMap((pr) => (statuses as number[]).map((status) => ({ pr, status, cv: render(pr, status, g.name === "shops") })));
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
