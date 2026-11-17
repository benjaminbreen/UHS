/** Interior review sheets: every public building of a group drawn whole, at
 * two finishes, labelled, on one canvas.
 *
 * Usage: npm run capture:interiors                    (every group)
 *        npm run capture:interiors -- baths           (a group, by its label)
 *        npm run capture:interiors -- kiva hammam     (profiles, by id)
 *        UHS_HOUR=21 npm run capture:interiors -- ... (the hour; default 11)
 *        UHS_STATUS=0,2 npm run capture:interiors -- ... (finishes; default common)
 *        npm run capture:interiors -- shops            (a shop of each kind, in a fitting house)
 *        npm run capture:interiors -- henhouse         (the henhouse in three regions; UHS_HOUR=21 for the roost)
 *        npm run capture:interiors -- fair             (fair cases, objects and tabletop exhibits)
 *        npm run capture:interiors -- fair-variants    (six variations of each exhibit archetype)
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
      const ids = asked as string[];
      if (ids.includes("fair") || ids.includes("fair-variants")) {
        const { fairs, FAIR_SIZES } = await import("/src/content/fairs/index.ts" as string);
        const { fairLevel } = await import("/src/world/fair.ts" as string);
        const { paintFairCase, paintFairThing, paintFairDecor } = await import("/src/render/fair/things.ts" as string);
        const { exhibitIcon, stamp } = await import("/src/render/fair/items.ts" as string);
        const { paintFairGround, PAD } = await import("/src/render/fair/ground.ts" as string);
        const { Raster } = await import("/src/render/ship/raster.ts" as string);
        const { hash } = await import("/src/core/random.ts" as string);
        const all = fairs.flatMap((f: any) => f.finds).filter((f: any) => f.catalog);
        if (ids.includes("fair-variants")) {
          const small = [
            ["Bottles", "bottle"], ["Preserve jars", "jar"], ["Pottery", "vase"],
            ["Books", "book"], ["Cloth", "bolt"], ["Stockings", "stockings"],
            ["Locks", "lock"], ["Cutlery", "cutlery"], ["Plates", "plate"],
            ["Bowls", "bowl"], ["Specimen packets", "seeds"], ["Perfume", "perfume"],
          ];
          const large = [
            ["Baths", "bath"], ["Washstands", "basin"], ["Stoves and ranges", "stove"],
            ["Cupboards", "cupboard"], ["Cisterns and tanks", "tank"], ["Sanitary fittings", "toilet"],
            ["Tools on workbenches", "toolset"], ["Treadle sewing machines", "sewingmachine"], ["Water filters", "filter"],
            ["Chairs", "chair"], ["Mattresses and frames", "mattress"], ["Hall clocks", "hallclock"],
          ];
          const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
          const { resolveSetting } = await import("/src/content/geography/resolve.ts" as string);
          const { drawCharacterG } = await import("/src/render/characters/doll/draw.ts" as string);
          const person = generateCharacter(resolveSetting("A clerk in London, 1884").setting, "scale-review", "adult", 32, "clerk", undefined, undefined, "male");
          const actor = document.createElement("canvas"); actor.width = actor.height = 80;
          drawCharacterG(actor.getContext("2d")!, person.appearance, 2, "idle", 0);
          const sheet = document.createElement("canvas");
          sheet.width = 1600; sheet.height = 1928;
          const g = sheet.getContext("2d")!;
          g.imageSmoothingEnabled = false;
          g.fillStyle = "#211e29"; g.fillRect(0, 0, sheet.width, sheet.height);
          g.fillStyle = "#f0dfbd"; g.font = "600 30px 'Atkinson Hyperlegible Next', sans-serif";
          g.fillText("Exhibits at game scale", 40, 48);
          g.fillStyle = "#bdb0b4"; g.font = "17px 'Atkinson Hyperlegible Next', sans-serif";
          g.fillText("All artwork and adult figures at the same 3× pixel scale · footprints measured in 16-pixel cells", 40, 78);
          small.forEach(([label, icon], i) => {
            const x = 40 + i % 4 * 384, y = 108 + Math.floor(i / 4) * 132;
            g.fillStyle = "#2d2936"; g.fillRect(x, y, 368, 116);
            g.fillStyle = "#f0dfbd"; g.font = "600 18px 'Atkinson Hyperlegible Next', sans-serif";
            g.fillText(label, x + 12, y + 28);
            for (let variant = 0; variant < 6; variant++) {
              const r = exhibitIcon(icon, variant / 6);
              g.drawImage(r.canvas(), x + 16 + variant * 56, y + 44, 48, 48);
            }
          });
          g.fillStyle = "#f0dfbd"; g.font = "600 24px 'Atkinson Hyperlegible Next', sans-serif";
          g.fillText("Standalone floor exhibits", 40, 552);
          const crop = (cv: HTMLCanvasElement) => {
            const data = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height).data;
            let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
            for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (data[(y * cv.width + x) * 4 + 3] >= 200) {
              x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
            }
            return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
          };
          const personBounds = crop(actor);
          large.forEach(([label, art], i) => {
            const x = 40 + i % 3 * 512, y = 580 + Math.floor(i / 3) * 328;
            const [w, h] = FAIR_SIZES[art];
            g.fillStyle = "#2d2936"; g.fillRect(x, y, 496, 312);
            g.fillStyle = "#f0dfbd"; g.font = "600 20px 'Atkinson Hyperlegible Next', sans-serif";
            g.fillText(label, x + 12, y + 28);
            const variants = art === "stove" ? [1 / 6, 5 / 6] : [0, 0.5];
            variants.forEach((variant, j) => {
              const s = paintFairThing(art, w, h, variant), cv = s.r.canvas(), [sx, sy, sw, sh] = crop(cv);
              g.drawImage(cv, sx, sy, sw, sh, x + 14 + j * 192, y + 266 - sh * 3, sw * 3, sh * 3);
            });
            const [sx, sy, sw, sh] = personBounds;
            g.drawImage(actor, sx, sy, sw, sh, x + 416, y + 266 - sh * 3, sw * 3, sh * 3);
            g.fillStyle = "#bdb0b4"; g.font = "15px 'Atkinson Hyperlegible Next', sans-serif";
            g.fillText(w + " × " + h + " cells · floor placement", x + 12, y + 294);
          });
          return [{ name: "fair-variants", url: sheet.toDataURL() }];
        }
        const named = (name: string) => {
          const f = all.find((f: any) => f.name === name);
          if (!f) throw Error("Missing sheet exhibit " + name);
          return f;
        };
        const subjects = [
          ["Timekeeping", ["Waterbury pocket watch", "Gold-cased Trenton watch", "Kahenn railway clock", "Nickel-cased Trenton watch"]],
          ["Tonics and remedies", ["Kepler Cod Liver Oil", "Kepler Extract of Malt with iron and quinine", "Burroughs Beef and Iron Wine", "Kepler Food for Dyspeptics and Infants"]],
          ["Perfumery and toilet articles", ["Lundborg perfume bottle", "Sheffield crème dentifrice in a tube", "Colgate toilet soap", "Sheffield crème dentifrice in a jar"]],
          ["Food and souvenirs", ["Heinz pickles", "Heinz pickle watch charm", "Colman’s mustard", "Elgin condensed milk"]],
          ["Electricity", ["Westinghouse stopper lamp", "Anthony resistance coil", "Anthony voltmeter"]],
          ["Photography and instruments", ["Kodak camera", "Beck microscopes", "Spectacles"]],
        ] as [string, string[]][];
        // The spectacle listings use the catalog's longer title.
        subjects[5][1][2] = all.find((f: any) => f.catalog.icon === "spectacles").name;
        const sheet = document.createElement("canvas");
        sheet.width = 1408; sheet.height = 1336;
        const g = sheet.getContext("2d")!;
        g.imageSmoothingEnabled = false;
        g.fillStyle = "#211e29"; g.fillRect(0, 0, sheet.width, sheet.height);
        g.fillStyle = "#f0dfbd"; g.font = "600 30px 'Atkinson Hyperlegible Next', sans-serif";
        g.fillText("World’s fair exhibits", 40, 48);
        g.fillStyle = "#bdb0b4"; g.font = "17px 'Atkinson Hyperlegible Next', sans-serif";
        g.fillText("Game painters · top-down display studies · cases 4×, object details 6×", 40, 76);
        const paris = fairs.find((f: any) => f.id === "paris-1889");
        const level = fairLevel("contact-sheet", paris, "liberal-arts-hall");
        const ground = paintFairGround(level, 17).canvas();
        const draw = (r: any, x: number, y: number, scale: number) =>
          g.drawImage(r.canvas(), Math.round(x), Math.round(y), r.w * scale, r.h * scale);
        const detail: any[] = [];
        subjects.forEach(([name, names], i) => {
          const x = 32 + i % 3 * 448, y = 104 + Math.floor(i / 3) * 304;
          g.fillStyle = "#f0dfbd"; g.font = "600 20px 'Atkinson Hyperlegible Next', sans-serif";
          g.fillText(name, x + 8, y + 22);
          g.globalAlpha = 0.38;
          g.drawImage(ground, (PAD.x + 3) * 16, (PAD.top + 11) * 16, 108, 62, x + 8, y + 40, 432, 248);
          g.globalAlpha = 1;
          const finds = names.map(named), display = { id: "sheet-" + i, name, x: 0, y: 0, w: finds.length + 1, finds };
          const { cabinet, items } = paintFairCase(display);
          const r = new Raster(cabinet.r.w, cabinet.r.h);
          stamp(r, cabinet.r, 0, 0);
          for (const item of items) stamp(r, item.r, cabinet.ox - item.ox, cabinet.oy - item.oy);
          draw(r, x + 224 - r.w * 2, y + 40, 4);
          detail.push(...finds);
        });
        const specimens = [
          ["Kodak", "kodak", 0], ["Long Wind", "longwind", 0], ["Microscope", "microscope", 0],
          ["Cod liver oil", "kepler", 0], ["Perfume", "perfume", 0.65], ["Tooth cream", "dentifrice", 0.05],
          ["Pickle jar", "picklejar", 0], ["Watch charm", "picklecharm", 0],
        ] as [string, string, number][];
        specimens.forEach(([name, icon, variant], i) => {
          const x = 40 + i * 168, y = 750;
          g.fillStyle = "#2d2936"; g.fillRect(x, y, 152, 174);
          draw(exhibitIcon(icon, variant), x + 28, y + 14, 6);
          g.fillStyle = "#dfd0b7"; g.font = "16px 'Atkinson Hyperlegible Next', sans-serif";
          g.textAlign = "center"; g.fillText(name, x + 76, y + 144); g.textAlign = "left";
          const f = detail.find((f: any) => f.catalog.icon === icon);
          if (f) {
            const r = exhibitIcon(icon, f.catalog.variant ?? (hash(f.id) % 6) / 6);
            draw(r, x + 68, y + 153, 1);
          }
        });
        g.fillStyle = "#f0dfbd"; g.font = "600 22px 'Atkinson Hyperlegible Next', sans-serif";
        g.fillText("Larger exhibits", 40, 978);
        const machines = [["Hollerith tabulator", "hollerith", 3], ["Remington Standard", "remington", 2], ["Doulton filter", "filter", 2]] as const;
        machines.forEach(([name, art, w], i) => {
          const x = 32 + i * 448, y = 1000;
          g.globalAlpha = 0.38;
          g.drawImage(ground, (PAD.x + 3) * 16, (PAD.top + 11) * 16, 108, 70, x + 8, y, 432, 280);
          g.globalAlpha = 1;
          const table = art === "filter" ? undefined : paintFairDecor("table:empty:5x3", 0.7);
          const object = paintFairThing(art, w, 1, 0.3);
          const scale = 3, tx = x + 224 - (table?.r.w ?? 0) * scale / 2, ty = y + 86;
          if (table) draw(table.r, tx, ty, scale);
          draw(object.r, x + 224 - object.r.w * scale / 2, ty + 88 - object.r.h * scale, scale);
          g.fillStyle = "#f0dfbd"; g.font = "19px 'Atkinson Hyperlegible Next', sans-serif";
          g.textAlign = "center"; g.fillText(name, x + 224, y + 302); g.textAlign = "left";
        });
        return [{ name: "fairs", url: sheet.toDataURL() }];
      }
      const { publicInteriorGroups } = await import("/src/content/interiors/index.ts" as string);
      const { planBuilding } = await import("/src/render/interiors/building.ts" as string);
      const { PixelRoom } = await import("/src/render/interiors/pixel.ts" as string);
      const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");
      const groups = (publicInteriorGroups as { label: string; profiles: any[] }[])
        .map((g) => ({ name: slug(g.label), profiles: g.profiles.filter((p) => !ids.length || ids.includes(slug(g.label)) || ids.includes(p.id)) }))
        .filter((g) => g.profiles.length);
      if (ids.includes("worksites")) {
        const { worksiteProfiles } = await import("/src/content/settlements/worksites/index.ts" as string);
        const { interiorProfileFor } = await import("/src/content/interiors/select.ts" as string);
        groups.push({name:"worksites",profiles:worksiteProfiles.map((p:any)=>{
          const b=p.scope.bounds ?? [-1,50,1,52];
          return interiorProfileFor({lon:(b[0]+b[2])/2,lat:(b[1]+b[3])/2,year:p.scope.years[0],settlement:"city",use:`worksite.${p.id}`});
        })});
      }
      if (ids.includes("henhouse")) {
        const { interiorProfileFor } = await import("/src/content/interiors/select.ts" as string);
        groups.push({name:"henhouse",profiles:[[0.2,49,1300],[139,35,1700],[-99,19,1450]].map(([lon,lat,year])=>
          interiorProfileFor({lon,lat,year,settlement:"village",use:"yard.henhouse"}))});
      }
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
