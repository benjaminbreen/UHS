/** Plot banner review sheet: each plot's emblem as it opens, at each choice
 * card's moment, and at each ending, drawn at 3x and labelled.
 *
 * Usage: npm run capture:emblems              (every plot)
 *        npm run capture:emblems -- run whale  (plots, by id)
 * Writes artifacts/emblems/<plot>.png, or all.png for the whole set.
 */
import { withPage, base, writeDataUrl } from "./lib";

const asked = process.argv.slice(2);

await withPage({}, async (page) => {
  await page.goto(base);
  await page.evaluate("window.__name = (fn) => fn");
  const sheets: { name: string; url: string }[] = await page.evaluate(async (asked) => {
    const { PLOTS } = await import("/src/content/plots/index.ts" as string);
    const { drawEmblem, EMBLEM_W, EMBLEM_H } = await import("/src/ui/plot-emblems.ts" as string);
    const plots = (PLOTS as any[]).filter((p) => !(asked as string[]).length || (asked as string[]).includes(p.id));
    const k = 3, pad = 14, head = 26, cols = 4;
    const sheet = (rows: { label: string; look: any; ending?: string }[]) => {
      const cw = EMBLEM_W * k + pad, ch = EMBLEM_H * k + head + pad;
      const cv = document.createElement("canvas");
      cv.width = cols * cw + pad;
      cv.height = Math.ceil(rows.length / cols) * ch + pad;
      const g = cv.getContext("2d")!;
      g.fillStyle = "#14121a";
      g.fillRect(0, 0, cv.width, cv.height);
      g.imageSmoothingEnabled = false;
      const one = document.createElement("canvas");
      one.width = EMBLEM_W;
      one.height = EMBLEM_H;
      const o = one.getContext("2d")!;
      rows.forEach((r, i) => {
        const x = pad + (i % cols) * cw, y = pad + Math.floor(i / cols) * ch;
        o.clearRect(0, 0, EMBLEM_W, EMBLEM_H);
        drawEmblem(o, r.look, 6000, { marks: 5, ending: r.ending });
        g.fillStyle = "#eee9d2";
        g.font = "bold 15px system-ui";
        g.fillText(r.label, x, y + 17);
        g.drawImage(one, x, y + head, EMBLEM_W * k, EMBLEM_H * k);
      });
      return cv.toDataURL();
    };
    const moments = (p: any) => [...p.opening, ...p.developments.flatMap((d: any) => d.then)]
      .filter((e: any) => e.type === "choose").map((e: any) => e.line);
    const rowsOf = (p: any) => [
      { label: `${p.id} · ${p.look.emblem}`, look: p.look },
      ...moments(p).map((m: string) => ({ label: `${p.id} · ${m}`, look: p.look, ending: m })),
      ...p.endings.map((e: any) => ({ label: `${p.id} → ${e.id}`, look: p.look, ending: e.id })),
    ];
    return (asked as string[]).length
      ? plots.map((p) => ({ name: p.id, url: sheet(rowsOf(p)) }))
      : [{ name: "all", url: sheet(plots.map((p) => ({ label: `${p.id} · ${p.look.emblem}`, look: p.look }))) }];
  }, asked);
  for (const s of sheets) await writeDataUrl(s.url, `artifacts/emblems/${s.name}.png`);
});
