/** Character-lab review sheets.
 *
 * Usage: npm run capture:characters             (every sheet)
 *        npm run capture:characters -- polish   (one of them)
 *
 * Each preset composes its own canvas in the page, because what a sheet
 * arranges is the point of it. The browser handling is in ./lib.
 */
import type { Page } from "@playwright/test";
import { withPage, characterLab, shootCanvas, writeDataUrl, base } from "./lib";

const out = (name: string) => `artifacts/characters/${name}.png`;

/** Two renderers side by side, A on the paler ground: people, walks, kits, a crowd and accessories. */
async function dollSheets(page: Page, pair: [string, string], prefix: string) {
  await characterLab(page);
  await page.evaluate("window.__name = (fn) => fn");
  const sheets = await page.evaluate(async (pair) => {
    const { renderers } = await import("/src/render/characters/renderers.ts" as string);
    const { places } = await import("/src/content/geography/places.ts" as string);
    const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
    const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
    const { headwear, garments } = await import("/src/core/character.ts" as string);
    const { composeWearing } = await import("/src/core/wearing.ts" as string);
    const { wearableItems } = await import("/src/content/characters/wearables.ts" as string);
    const { parseCloth } = await import("/src/content/characters/wardrobe/cloth.ts" as string);
    // Dressed as the world dresses them: worn items carry the cloth's material and quality.
    const dressed = (c: any, patch = {}) => ({ ...c.appearance, wearing: { ...composeWearing(c.appearance.wearing, c.worn,
      (x: string) => (wearableItems as any)[x] ?? (wearableItems as any)[parseCloth(x)?.base]), ...patch } });
    const where = [["rome", 100], ["london", 1200], ["kyoto", 1850], ["timbuktu", 1400], ["delhi", 1600], ["cusco", 1400],
      ["paris", 1888], ["beijing", 1400], ["konya", 1400], ["mongolia", 1200], ["java", 950], ["paris", 2009]];
    const people = where.flatMap(([id, year], i) => {
      const setting = settingFor(places.find((p: any) => p.id === id), year);
      return [0, 1].map((k) => dressed(generateCharacter(setting, "doll-review", `p-${i}-${k}`, [24, 38, 62, 30, 9][(i + k) % 5])));
    });
    // Each accessory and fibre once, on someone who would have worn it.
    const showcase = ([
      ["london", 1600, "blacksmith", { apron: "leather" }], ["london", 1600, "baker", { apron: "cloth" }],
      ["london", 1600, "merchant", { neckwear: "ruff", headwear: "none" }], ["london", 1780, "clerk", { neckwear: "cravat", bag: "satchel", headwear: "none" }],
      ["london", 1800, "sailor", { neckwear: "neckerchief" }], ["paris", 1400, "trader", { bag: "purse", quality: -1 }],
      ["delhi", 1600, "weaver", { wrist: "bangles", shoulderCloth: true }], ["beijing", 1400, "merchant", { material: "silk", quality: 3 }],
      ["polynesia", 1500, "fisher", { material: "barkcloth" }], ["mongolia", 1200, "herder", { material: "fur" }],
      ["kyoto", 1800, "shopkeeper", { bag: "purse", apron: "cloth" }], ["mexico", 1450, "farmer", { material: "hide" }],
      ["london", 1400, "farmer", { trimPattern: "cross-stitch", garment: "tunic", apron: "none" }], ["cusco", 1450, "farmer", { trimPattern: "step", garment: "poncho" }],
      ["beijing", 1600, "merchant", { trimPattern: "cloud", garment: "robe", mantle: false }], ["timbuktu", 1500, "trader", { trimPattern: "strip", garment: "long-tunic" }],
      ["kyoto", 1800, "weaver", { hairOrnament: "pins", headwear: "none" }, null, "female"], ["delhi", 1600, "weaver", { hairOrnament: "flower", headwear: "none" }, { nose: "ring", ears: "drop" }, "female"],
      ["london", 1620, "merchant", { headwear: "brimmed", hatTrim: "feather", headColor: "#2a2630" }, null, "male"], ["mexico", 1450, "farmer", { headwear: "none" }, { marks: "chin-lines", markStyle: "ink", ears: "spool" }, "female"],
      ["london", 1770, "merchant", { garment: "coat", front: "open", waistcoat: "figured", sidearm: "sword", headwear: "none" }, null, "male"],
      ["london", 1840, "clerk", { garment: "shirt", waistcoat: "plain", headwear: "none" }, null, "male"],
      ["konya", 1700, "weaver", { garment: "long-tunic", waistcoat: "figured", headwear: "none" }, null, "female"],
      ["london", 1850, "laundress", { shawl: "fringed", apron: "none" }, null, "female"],
      ["london", 1830, "merchant", { shawl: "patterned", garment: "gown", headwear: "none" }, null, "female"],
      ["cusco", 1450, "weaver", { shawl: "patterned", trimPattern: "step" }, null, "female"],
      ["mexico", 1800, "market-seller", { shawl: "fringed", headwear: "none" }, null, "female"],
      ["london", 1350, "farmer", { hood: "down", headwear: "none", cloakColor: "#7a2a2a" }, null, "male"],
      ["paris", 2009, "student", { garment: "shirt", hood: "down", headwear: "none" }, null, "male"],
      ["london", 1640, "soldier", { sidearm: "sword" }, null, "male"],
      ["konya", 1600, "soldier", { sidearm: "sabre" }, null, "male"],
      ["kyoto", 1700, "retainer", { sidearm: "katana" }, null, "male"],
      ["java", 1600, "trader", { sidearm: "kris" }, null, "male"],
      ["london", 1450, "carpenter", { sidearm: "dagger" }, null, "male"],
    ] as const).map(([id, year, role, patch, adorn, sex], i) => {
      const c = generateCharacter(settingFor(places.find((p: any) => p.id === id), year), "doll-review", `show-${i}`, 34, role, undefined, undefined, sex);
      const a = dressed(c, patch);
      return adorn ? { ...a, adornment: { ...(a.adornment ?? {}), ...adorn } } : a;
    });
    const frame = document.createElement("canvas");
    frame.width = frame.height = 80;
    const fc = frame.getContext("2d")!;
    const [A, B] = pair;
    const sprite = (id: string, a: any, facing: number, pose = "idle", f = 0) => {
      renderers[id].draw(fc, a, [0, 1, 1, 2, 2, 2, 3, 3][facing], pose, f, undefined, facing, "neutral");
      return frame;
    };
    const facings = [4, 3, 2, 1, 0];
    const S = 3, cw = 46 * S, ch = 52 * S;
    const paint = (cols: number, rows: number, bg = "#9aa58c") => {
      const c = document.createElement("canvas");
      c.width = cols * cw; c.height = rows * ch;
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
      return [c, ctx] as const;
    };
    const cell = (ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, col: number, row: number, tint?: string) => {
      if (tint) { ctx.fillStyle = tint; ctx.fillRect(col * cw, row * ch, cw, ch); }
      ctx.drawImage(src, 17, 27, 46, 52, col * cw, row * ch, cw, ch);
    };
    // People: E's five facings, then F's.
    const [ab, abx] = paint(10, people.length);
    people.forEach((a: any, row: number) => facings.forEach((f, i) => {
      cell(abx, sprite(A, a, f), i, row, "#a7ae98");
      cell(abx, sprite(B, a, f), 5 + i, row);
    }));
    // Walks and a run: E above F, three facings.
    // The third walker wears something short, so the legs show.
    const short = people.find((a: any) => ["shirt", "suit", "tunic", "none", "loincloth"].includes(a.wearing.garment)) ?? people[1];
    // Walkers dressed to show what swings: feather, fez tassel, hat ribbon, drop earrings, neckerchief, watch chain.
    const base = people.find((a: any) => a.wearing.garment === "shirt" || a.wearing.garment === "suit") ?? people[1];
    // Then what hangs and swings: sword, sabre run, katana, shawl from behind, the hood's liripipe, a hoodie.
    const trims = ([
      [{ headwear: "brimmed", hatTrim: "feather", headColor: "#2a2630" }, 3], [{ headwear: "fez", headColor: "#a82a2a" }, 3],
      [{ headwear: "brimmed", hatTrim: "ribbon", headColor: "#d8c48a" }, 2], [{ headwear: "none", neckwear: "neckerchief" }, 3], [{ garment: "suit", headwear: "bowler" }, 3],
      [{ garment: "coat", front: "open", waistcoat: "figured", sidearm: "sword", headwear: "none" }, 3], [{ sidearm: "sabre", headwear: "none" }, 2, "run"],
      [{ sidearm: "katana", headwear: "none" }, 3], [{ shawl: "fringed", headwear: "none" }, 0], [{ hood: "down", headwear: "none", garment: "tunic" }, 1],
      [{ garment: "shirt", hood: "down", headwear: "none" }, 4],
    ] as [any, number, string?][]).map(([patch, f, pose], i) =>
      [{ ...base, wearing: { ...base.wearing, ...patch }, adornment: i === 3 ? { ...(base.adornment ?? {}), ears: "drop" } : base.adornment }, f, pose ?? "walk"] as const);
    const [walk, wx] = paint(8, 22 + trims.length * 2);
    trims.forEach(([a, f, pose], p) => {
      for (let k = 0; k < 8; k++) {
        cell(wx, sprite(A, a, f, pose, k), k, 22 + p * 2, "#a7ae98");
        cell(wx, sprite(B, a, f, pose, k), k, 23 + p * 2);
      }
    });
    [people[0], people[5], short].forEach((a: any, p: number) => [4, 3, 2].forEach((f, i) => {
      for (let k = 0; k < 8; k++) {
        const pose = i === 2 && p === 1 ? "run" : "walk";
        cell(wx, sprite(A, a, f, A === "e" ? "walk" : pose, k), k, p * 6 + i * 2, "#a7ae98");
        cell(wx, sprite(B, a, f, pose, k), k, p * 6 + i * 2 + 1);
      }
    }));
    // Idle's four frames, then talk's, front and three-quarter.
    for (const [row, pose] of [[18, "idle"], [20, "talk"]] as const)
      for (const [i, f] of [4, 3].entries()) for (let k = 0; k < 4; k++) {
        cell(wx, sprite(A, short, f, pose, k), i * 4 + k, row, "#a7ae98");
        cell(wx, sprite(B, short, f, pose, k), i * 4 + k, row + 1);
      }
    // Every garment, then every headwear, F only, front and three-quarter.
    const kits = [
      ...garments.map((g: string, i: number) => ({ ...people[(i * 3) % people.length], wearing: { ...people[(i * 3) % people.length].wearing, garment: g, headwear: "none", cloak: false, mantle: false } })),
      ...headwear.map((h: string, i: number) => ({ ...people[(i * 5 + 1) % people.length], wearing: { ...people[(i * 5 + 1) % people.length].wearing, headwear: h, headColor: undefined } })),
    ];
    const [kitSheet, kx] = paint(16, Math.ceil(kits.length / 8));
    kits.forEach((a: any, i: number) => {
      cell(kx, sprite(A === "e" ? B : A, a, 4), (i % 8) * 2, Math.floor(i / 8), A === "e" ? undefined : "#a7ae98");
      cell(kx, sprite(B, a, A === "e" ? 3 : 4), (i % 8) * 2 + 1, Math.floor(i / 8));
    });
    const [dress, dx] = paint(16, Math.ceil(showcase.length / 4));
    // Front and three-quarter: B alone against E, A then B otherwise.
    showcase.forEach((a: any, i: number) => (A === "e" ? [[B, 4], [B, 3], [B, 2], [B, 0]] : [[A, 4], [B, 4], [A, 3], [B, 3]]).forEach(([id, f]: any, j) =>
      cell(dx, sprite(id, a, f), (i % 4) * 4 + j, Math.floor(i / 4), id === A ? "#a7ae98" : undefined)));
    // A crowd on paving at twice native size, E then F.
    const crowd = document.createElement("canvas");
    crowd.width = 1440; crowd.height = 400;
    const cx = crowd.getContext("2d")!;
    cx.imageSmoothingEnabled = false;
    for (let y = 0; y < 200; y += 8) for (let x = 0; x < 720; x += 8) {
      cx.fillStyle = ((x + y) / 8) % 2 ? "#b9a888" : "#b3a281"; cx.fillRect(x * 2, y * 2, 16, 16);
    }
    for (const [id, ox] of [[A, 0], [B, 720]] as const)
      people.slice(0, 18).forEach((a: any, i: number) => {
        const f = [4, 3, 5, 2, 6, 4, 0, 1, 4, 7, 3, 4, 2, 5, 4, 6, 3, 4][i];
        sprite(id, a, f, i % 3 ? "idle" : "walk", i);
        cx.drawImage(frame, ox + (i % 6) * 116 + (Math.floor(i / 6) % 2) * 50 - 40, Math.floor(i / 6) * 120 - 80, 160, 160);
      });
    return [ab.toDataURL(), walk.toDataURL(), kitSheet.toDataURL(), crowd.toDataURL(), dress.toDataURL()];
  }, pair);
  for (const [i, name] of ["", "-walk", "-kits", "-crowd", "-dress"].entries()) await writeDataUrl(sheets[i], out(prefix + name));
}

const presets: Record<string, (page: Page) => Promise<void>> = {
  async readme(page) {
    await characterLab(page, { paused: true });
    await page.evaluate("window.__name = (fn) => fn");
    const sheets = await page.evaluate(async () => {
      const { drawCharacter } = await import("/src/render/characters/renderers.ts" as string);
      const { drawSculptedPortrait } = await import("/src/render/portraits/sculpted.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const { composeWearing } = await import("/src/core/wearing.ts" as string);
      const { wearableItems } = await import("/src/content/characters/wearables.ts" as string);
      const { parseCloth } = await import("/src/content/characters/wardrobe/cloth.ts" as string);
      const where = [["rome", 100, "Rome"], ["london", 1200, "London"], ["kyoto", 1850, "Kyoto"],
        ["timbuktu", 1400, "Timbuktu"], ["delhi", 1600, "Delhi"], ["cusco", 1400, "Cusco"]] as const;
      const people = where.flatMap(([id, year, label], i) => {
        const setting = settingFor(places.find((p: any) => p.id === id), year);
        return ["female", "male"].map((sex, k) => {
          const age = [24, 38, 62, 30][(i + k) % 4];
          const c = generateCharacter(setting, "readme", `person-${i}-${k}`, age, undefined, undefined, undefined, sex);
          const appearance = { ...c.appearance, wearing: composeWearing(c.appearance.wearing, c.worn,
            (x: string) => (wearableItems as any)[x] ?? (wearableItems as any)[parseCloth(x)?.base]) };
          return { appearance, age, label: `${label} · ${year} CE` };
        });
      });
      const W = 216, H = 192, cols = 3;
      const sheets = ["sprites", "portraits"].map((kind) => {
        const canvas = document.createElement("canvas");
        canvas.width = cols * W; canvas.height = Math.ceil(people.length / cols) * H;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        people.forEach(({ appearance, age, label }, i) => {
          const x = (i % cols) * W, y = Math.floor(i / cols) * H;
          ctx.fillStyle = "#1c2233"; ctx.fillRect(x, y, W, H);
          if (kind === "sprites") {
            const frame = document.createElement("canvas"); frame.width = frame.height = 80;
            const fc = frame.getContext("2d")!;
            [4, 3].forEach((facing, j) => {
              drawCharacter(fc, appearance, 2, j ? "walk" : "idle", j ? 2 : 0, undefined, facing, "neutral");
              ctx.drawImage(frame, 18, 25, 44, 55, x + 20 + j * 88, y + 40, 88, 110);
            });
          } else {
            const portrait = document.createElement("canvas"); portrait.width = 64; portrait.height = 80;
            drawSculptedPortrait(portrait.getContext("2d")!, appearance, age);
            ctx.drawImage(portrait, x + 44, y + 6, 128, 160);
          }
          ctx.fillStyle = "#ddd7c7"; ctx.font = "13px sans-serif"; ctx.textAlign = "center";
          ctx.fillText(label, x + W / 2, y + 181);
        });
        return canvas.toDataURL();
      });
      return sheets;
    });
    for (const [i, name] of ["sprites", "portraits"].entries())
      await writeDataUrl(sheets[i], `docs/images/${name}.png`);
  },
  /** The README's sprite sheet: game-renderer people from twelve places and dates. */
  async readme(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheet = await page.evaluate(async () => {
      const { drawCharacter } = await import("/src/render/characters/renderers.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const where = [["rome", 100], ["london", 1200], ["kyoto", 1200], ["timbuktu", 1400], ["cusco", 1400], ["rome", 1500],
        ["london", 1750], ["kyoto", 1850], ["timbuktu", 1850], ["cusco", 1700], ["rome", 1900], ["london", 1900]];
      const who: [number, string][] = [[34, "male"], [30, "female"], [62, "male"], [9, "female"]];
      // Two places a row at the portrait sheet's near-square aspect, so the README pair line up.
      const CW = 36, CH = 50, W = CW * 3 + 12, H = CH * 3, LABEL = 22, COL = who.length * W + 24;
      const sheet = document.createElement("canvas");
      sheet.width = 2 * COL; sheet.height = (where.length / 2) * (H + LABEL) + 8;
      const ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#8a9a6a"; ctx.fillRect(0, 0, sheet.width, sheet.height);
      where.forEach(([id, year], i) => {
        const place = places.find((p: any) => p.id === id);
        const setting = settingFor(place, year);
        const x = (i % 2) * COL + 12, y = Math.floor(i / 2) * (H + LABEL) + 4;
        ctx.fillStyle = "#2a2a1e"; ctx.font = "14px monospace";
        ctx.fillText(`${place.name ?? id}, ${year}`, x, y + 15);
        who.forEach(([age, sex], c) => {
          const look = generateCharacter(setting, "readme", `${id}-${year}-${c}`, age, undefined, undefined, undefined, sex).appearance;
          const body = document.createElement("canvas"); body.width = body.height = 80;
          drawCharacter(body.getContext("2d")!, look, 2, "idle", 0);
          ctx.drawImage(body, 22, 30, CW, CH, x + c * W, y + LABEL, CW * 3, H);
        });
      });
      return sheet.toDataURL();
    });
    await writeDataUrl(sheet, out("readme"));
  },
  /** Families (head, partner, then three children) and one face under each body record. */
  async family(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheet = await page.evaluate(async () => {
      const { drawSculptedPortrait } = await import("/src/render/portraits/sculpted.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const { inheritLikeness } = await import("/src/core/character.ts" as string);
      const where = [["rome", 100], ["kyoto", 1850], ["timbuktu", 1400], ["london", 1200], ["cusco", 1400]];
      const rows = where.map(([id, year], i) => {
        const setting = settingFor(places.find((p: any) => p.id === id), year);
        const gen = (who: string, age: number, sex: string) => generateCharacter(setting, "family-review", who, age, undefined, undefined, undefined, sex).appearance;
        const head = { ...gen(`h${i}`, 44, "male"), lineage: `family-${i}` };
        const partner = gen(`p${i}`, 40, "female");
        const kids = [[16, "female"], [12, "male"], [7, "female"]].map(([age, sex], k) =>
          [inheritLikeness(gen(`c${i}-${k}`, age as number, sex as string), [head, partner], "family-review", `c${i}-${k}`), age]);
        const stranger = gen(`s${i}`, 16, "female");
        return [[head, 44], [partner, 40], ...kids, [stranger, 16]];
      });
      const base = rows[0][1][0];
      const records = [{}, { gaunt: 2 }, { tired: true }, { pale: true }, { sun: 2 }, { soot: true }, { injury: "burned skin" }, { injury: "torn arm" },
        { injury: "injured leg" }, { scars: ["burned skin", "injured leg"] }, { scars: ["torn arm"], sun: 2 },
        { sick: "fever" }, { sick: "rash" }, { sick: "pallor" }];
      const cols = Math.max(6, records.length), W = 192, H = 240;
      const sheet = document.createElement("canvas");
      sheet.width = cols * (W + 6); sheet.height = (rows.length + 1) * (H + 6);
      const ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#1c2233"; ctx.fillRect(0, 0, sheet.width, sheet.height);
      const cell = (a: any, age: number, x: number, y: number, bg = "#2a3a78") => {
        const c = document.createElement("canvas"); c.width = 64; c.height = 80;
        drawSculptedPortrait(c.getContext("2d")!, a, age);
        ctx.fillStyle = bg; ctx.fillRect(x, y, W, H);
        ctx.drawImage(c, x, y, W, H);
      };
      rows.forEach((row, r) => row.forEach(([a, age]: any, c: number) => cell(a, age, c * (W + 6), r * (H + 6), c === 5 ? "#4a2a3a" : "#2a3a78")));
      records.forEach((record, c) => cell({ ...base, wearing: { ...base.wearing, garment: c === 10 ? "none" : base.wearing.garment }, record }, 44, c * (W + 6), rows.length * (H + 6)));
      return sheet.toDataURL();
    });
    await writeDataUrl(sheet, out("family"));
  },
  /** The sculpted bust before and after the refined model, pair by pair, with the G sprite beside each. */
  async "portrait-ab"(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheet = await page.evaluate(async () => {
      const { drawSculptedPortrait, setSculptedRefined } = await import("/src/render/portraits/sculpted.ts" as string);
      const { renderers } = await import("/src/render/characters/renderers.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const where = [["rome", 100], ["kyoto", 1850], ["timbuktu", 1400], ["london", 1850], ["delhi", 1600], ["cusco", 1400], ["mongolia", 1200], ["paris", 2009]];
      const people = where.flatMap(([id, year], i) => [["female", 24], ["male", 38], ["female", 62], ["male", 9]].map(([sex, age], k) =>
        [generateCharacter(settingFor(places.find((p: any) => p.id === id), year), "portrait-ab", `p${i}-${k}`, age, undefined, undefined, undefined, sex).appearance, age]));
      const W = 128, H = 160, cols = 4, cell = W * 2 + 64 + 12;
      const out = document.createElement("canvas");
      out.width = cols * cell; out.height = Math.ceil(people.length / cols) * (H + 6);
      const ctx = out.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#1c2233"; ctx.fillRect(0, 0, out.width, out.height);
      const f = document.createElement("canvas"); f.width = f.height = 80;
      people.forEach(([a, age]: any, i: number) => {
        const x = (i % cols) * cell, y = Math.floor(i / cols) * (H + 6);
        renderers.g.draw(f.getContext("2d")!, a, 2, "idle", 0, undefined, 3, "neutral");
        ctx.fillStyle = "#3a5a3a"; ctx.fillRect(x, y, 64, H); ctx.drawImage(f, 22, 27, 36, 52, x, y + 20, 64, 92);
        [false, true].forEach((on, j) => {
          setSculptedRefined(on);
          const c = document.createElement("canvas"); c.width = 64; c.height = 80;
          drawSculptedPortrait(c.getContext("2d")!, a, age);
          ctx.fillStyle = "#2a3a78"; ctx.fillRect(x + 64 + j * W, y, W, H); ctx.drawImage(c, x + 64 + j * W, y, W, H);
        });
      });
      setSculptedRefined(true);
      return out.toDataURL();
    });
    await writeDataUrl(sheet, out("portrait-ab"));
  },
  /** Three people well and in each of illness's three looks: portrait above, the world sprite below. */
  async sick(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheet = await page.evaluate(async () => {
      const { drawSculptedPortrait } = await import("/src/render/portraits/sculpted.ts" as string);
      const { drawCharacter } = await import("/src/render/characters/renderers.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const people = [["london", 1750, 34, "female"], ["timbuktu", 1400, 40, "male"], ["kyoto", 1200, 9, "male"]].map(([id, year, age, sex], i) =>
        [generateCharacter(settingFor(places.find((p: any) => p.id === id), year), "sick-review", `s${i}`, age as number, undefined, undefined, undefined, sex as string).appearance, age]);
      const looks = [undefined, "fever", "rash", "pallor"], W = 160, H = 200, S = 160;
      const sheet = document.createElement("canvas");
      sheet.width = looks.length * people.length * (W + 6); sheet.height = H + S + 12;
      const ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#1c2233"; ctx.fillRect(0, 0, sheet.width, sheet.height);
      people.forEach(([a, age]: any, p: number) => looks.forEach((sick, l) => {
        const x = (p * looks.length + l) * (W + 6), look = { ...a, record: sick ? { sick } : undefined };
        const face = document.createElement("canvas"); face.width = 64; face.height = 80;
        drawSculptedPortrait(face.getContext("2d")!, look, age);
        ctx.fillStyle = "#2a3a78"; ctx.fillRect(x, 0, W, H); ctx.drawImage(face, x, 0, W, H);
        const body = document.createElement("canvas"); body.width = body.height = 80;
        drawCharacter(body.getContext("2d")!, look, 2, "idle", 0);
        ctx.fillStyle = "#3a5a3a"; ctx.fillRect(x, H + 6, W, S); ctx.drawImage(body, 26, 44, 28, 36, x + 18, H + 6, S * 0.78, S);
      }));
      return sheet.toDataURL();
    });
    await writeDataUrl(sheet, out("sick"));
  },
  /** E against F, the paper doll: generated people in five facings and a walk,
   * every garment and headwear, a crowd at play scale, and F's accessories and fibres. */
  doll: (page) => dollSheets(page, ["e", "f"], "doll"),
  /** F against G, the same sheets: every kit and accessory shown in both. */
  "doll-g": (page) => dollSheets(page, ["f", "g"], "doll-g"),

  /** Generated people from sixteen places, then every headwear and garment, and a strip of head poses and expressions. */
  async ab(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheet = await page.evaluate(async () => {
      const { drawSculptedPortrait } = await import("/src/render/portraits/sculpted.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const { headwear, garments } = await import("/src/core/character.ts" as string);
      const where = [["rome", 100], ["london", 1200], ["paris", 1888], ["mongolia", 1200], ["konya", 1400], ["beijing", 1400], ["kyoto", 1850], ["delhi", 1600],
        ["java", 950], ["paris", 2009], ["timbuktu", 1400], ["ethiopia", 1400], ["cusco", 1400], ["mexico", 1450], ["polynesia", 1500], ["australia", 1400]];
      const people = where.flatMap(([id, year], i) => {
        const setting = settingFor(places.find((p: any) => p.id === id), year);
        return [0, 1].map((k) => {
          const age = [24, 38, 62, 30][(i + k) % 4];
          return [generateCharacter(setting, "portrait-review", `p-${i}-${k}`, age).appearance, age];
        });
      });
      const base = people[3][0];
      const hats = headwear.map((hw: string) => [{ ...base, wearing: { ...base.wearing, headwear: hw, headColor: "#8a5a38" } }, 30]);
      const clothes = garments.map((g: string, i: number) => [{ ...people[i % people.length][0], wearing: { ...people[i % people.length][0].wearing, garment: g, headwear: "none", cloak: false, mantle: false } }, 30]);
      const W = 192, H = 240, cols = 16;
      const cells: [any, any, number][] = [
        ...people.map(([a, age]: any) => [drawSculptedPortrait, a, age] as [any, any, number]),
        ...[...hats, ...clothes].map(([a, age]: any) => [drawSculptedPortrait, a, age] as [any, any, number]),
      ];
      const sheet = document.createElement("canvas");
      sheet.width = cols * (W + 6); sheet.height = Math.ceil(cells.length / cols) * (H + 6);
      const ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#1c2233"; ctx.fillRect(0, 0, sheet.width, sheet.height);
      cells.forEach(([draw, a, age], i) => {
        const c = document.createElement("canvas"); c.width = 64; c.height = 80;
        draw(c.getContext("2d")!, a, age);
        const x = (i % cols) * (W + 6), y = Math.floor(i / cols) * (H + 6);
        ctx.fillStyle = "#2a3a78"; ctx.fillRect(x, y, W, H);
        ctx.drawImage(c, x, y, W, H);
      });
      return sheet.toDataURL();
    });
    const strip = await page.evaluate(async () => {
      const { drawSculptedPortrait } = await import("/src/render/portraits/sculpted.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const where = [["rome", 100], ["kyoto", 1850], ["timbuktu", 1400], ["paris", 1888], ["delhi", 1600], ["cusco", 1400]];
      const people = where.map(([id, year], i) => generateCharacter(settingFor(places.find((p: any) => p.id === id), year), "portrait-review", `p-${i}-0`, 34).appearance);
      // One row per frame: the idle turn to face the viewer, a nod, talking, then a few dialogue faces.
      const frames = [{}, { turn: 0.75 }, { turn: 0.5 }, { turn: 0.25 }, { turn: 0 }, { turn: 0, blink: 2 }, { turn: 0, mouth: 1 }, { turn: 0, mouth: 2 },
        { pitch: 1, gazeY: 1 }, { gazeY: 1 }, { expression: "laugh" }, { expression: "sad" }, { expression: "angry" }, { expression: "surprised" }, { turn: 0, expression: "smile" }, { breath: 1 }];
      const sheet = document.createElement("canvas");
      sheet.width = people.length * 192; sheet.height = frames.length * 240;
      const ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      frames.forEach((options, row) => people.forEach((a: any, col: number) => {
        const c = document.createElement("canvas"); c.width = 64; c.height = 80;
        drawSculptedPortrait(c.getContext("2d")!, a, 34, options);
        ctx.fillStyle = "#2a3a78"; ctx.fillRect(col * 192, row * 240, 192, 240);
        ctx.drawImage(c, col * 192, row * 240, 192, 240);
      }));
      return sheet.toDataURL();
    });
    await writeDataUrl(strip, out("ab-idle"));
    await writeDataUrl(sheet, out("ab"));
  },
  async expressions(page) {
    await characterLab(page);
    await page.getByLabel("Generated character variants").waitFor();
    const sheet = await page.evaluate(async () => {
      const { renderers } = await import("/src/render/characters/renderers.ts" as string);
      const { originalAppearance } = await import("/src/core/character.ts" as string);
      const expressions = ["neutral", "smile", "soft", "serious", "concerned"];
      const rows = [
        ["Straight nose", "straight", "#f0ceb0", 4, "idle"],
        ["Broad nose", "broad", "#f0ceb0", 4, "idle"],
        ["Snub nose", "snub", "#f0ceb0", 3, "idle"],
        ["Dark complexion", "straight", "#70472f", 4, "idle"],
        ["Profile", "straight", "#f0ceb0", 2, "idle"],
        ["Hurt overrides resting face", "straight", "#f0ceb0", 4, "hurt"],
      ];
      const sheet = document.createElement("canvas"), frame = document.createElement("canvas");
      sheet.width = 1100; sheet.height = rows.length * 190;
      frame.width = frame.height = 80;
      const ctx = sheet.getContext("2d")!, fc = frame.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#c8cbc1"; ctx.fillRect(0, 0, sheet.width, sheet.height);
      rows.forEach(([label, nose, skin, facing, pose], row) => {
        const a = { ...originalAppearance, skin, hair: "cropped", beard: "none", head: "original", jaw: "original",
          face: { ...originalAppearance.face, nose, mouth: "soft", detail: "clear" },
          wearing: { ...originalAppearance.wearing, headwear: "none", eyewear: "none" } };
        expressions.forEach((expression, col) => {
          renderers.d.draw(fc, a, 2, pose, 0, undefined, facing, expression);
          ctx.drawImage(frame, 22, 30, 36, 48, col * 220 + 6, row * 190 + 32, 108, 144);
          ctx.drawImage(frame, 30, 36, 20, 20, col * 220 + 120, row * 190 + 62, 80, 80);
          ctx.fillStyle = "#29332f"; ctx.font = "13px monospace";
          ctx.fillText(`${label}`, col * 220 + 6, row * 190 + 15);
          ctx.fillText(expression, col * 220 + 6, row * 190 + 30);
        });
      });
      return sheet.toDataURL();
    });
    await writeDataUrl(sheet, out("expressions"));
  },
  async wardrobe(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheets = await page.evaluate(async () => {
      const { renderers } = await import("/src/render/characters/renderers.ts" as string);
      const { places } = await import("/src/content/geography/places.ts" as string);
      const { settingFor } = await import("/src/content/geography/resolve.ts" as string);
      const { generateCharacter } = await import("/src/content/characters/generate.ts" as string);
      const { wardrobeFor, clothFor, accessoryFor } = await import("/src/content/characters/wardrobe/index.ts" as string);
      const { iconCarriedArt } = await import("/src/render/characters/props.ts" as string);
      const { drawGarmentIcon, GARMENT_ICON } = await import("/src/render/garment-icons.ts" as string);
      const groups = [
        [["Rome", "rome", 100], ["Medieval Europe", "london", 1200], ["Paris", "paris", 1888], ["Mongolia", "mongolia", 1200], ["West Asia", "konya", 1400]],
        [["China", "beijing", 1400], ["Japan", "kyoto", 1850], ["South Asia", "delhi", 1600], ["Southeast Asia", "java", 950], ["Modern Europe", "paris", 2009]],
        [["West Africa", "timbuktu", 1400], ["East Africa", "ethiopia", 1400], ["Andes", "cusco", 1400], ["Mesoamerica", "mexico", 1450], ["Pacific", "polynesia", 1500], ["Indigenous America", "great-plains-early", 1400], ["Australia", "australia", 1400]],
      ];
      return groups.map((rows, group) => {
        const sheet = document.createElement("canvas"), frame = document.createElement("canvas");
        sheet.width = 1280; sheet.height = rows.length * 176;
        frame.width = frame.height = 80;
        const ctx = sheet.getContext("2d")!, fc = frame.getContext("2d")!;
        ctx.imageSmoothingEnabled = false; ctx.fillStyle = "#9aa59a"; ctx.fillRect(0, 0, sheet.width, sheet.height);
        rows.forEach(([label, placeId, year], row) => {
          const setting = settingFor(places.find((p: any) => p.id === placeId), year);
          for (let person = 0; person < 4; person++) {
            const age = [35, 30, 60, 9][person], sex = person === 1 ? "female" : "male", means = ["poor", "common", "wealthy", "common"][person];
            const id = `wardrobe-review-${group}-${row}-${person}`;
            const a = generateCharacter(setting, "wardrobe-review", id, age).appearance;
            a.physique = { ...a.physique, sex }; a.beard = sex === "female" || age < 13 ? "none" : a.beard;
            const wearer = { id, age, sex, means, roles: label === "Japan" && person === 1 ? ["geisha"] : [] };
            a.wearing = wardrobeFor(wearer, { year, setting }, a.wearing);
            const cloth = clothFor(wearer, { year, setting }, undefined, a.wearing.color);
            a.wearing.material = cloth.material; a.wearing.quality = cloth.quality;
            const accessory = accessoryFor(wearer, { year, setting }, a.wearing.garment);
            const prop = accessory ? iconCarriedArt(`icon:${accessory}`, (c: CanvasRenderingContext2D) => drawGarmentIcon(c, accessory, 0, 0), GARMENT_ICON) : undefined;
            for (let d = 0; d < 2; d++) {
              renderers.d.draw(fc, a, 1, "walk", 2, prop, d ? 2 : 3);
              ctx.drawImage(frame, 16, 30, 48, 48, (person * 2 + d) * 160 + 8, row * 176 + 20, 144, 144);
            }
          }
          ctx.fillStyle = "#26352c"; ctx.font = "14px monospace";
          ctx.fillText(`${label} · ${year} · poor man / woman / wealthy elder / child`, 8, row * 176 + 16);
        });
        return sheet.toDataURL();
      });
    });
    for (let i = 0; i < sheets.length; i++) await writeDataUrl(sheets[i], out(`wardrobe-${i + 1}`));
  },

  async accessories(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheet = await page.evaluate(async () => {
      const { renderers } = await import("/src/render/characters/renderers.ts" as string);
      const { originalAppearance } = await import("/src/core/character.ts" as string);
      const { iconCarriedArt } = await import("/src/render/characters/props.ts" as string);
      const { drawGarmentIcon, GARMENT_ICON } = await import("/src/render/garment-icons.ts" as string);
      const sheet = document.createElement("canvas"), frame = document.createElement("canvas");
      sheet.width = 1280; sheet.height = 6 * 192; frame.width = frame.height = 80;
      const ctx = sheet.getContext("2d")!, fc = frame.getContext("2d")!;
      ctx.imageSmoothingEnabled = false; ctx.fillStyle = "#9aa59a"; ctx.fillRect(0, 0, sheet.width, sheet.height);
      ["walking-cane", "fan"].forEach((id, j) => {
        const prop = iconCarriedArt(`icon:${id}`, (c: CanvasRenderingContext2D) => drawGarmentIcon(c, id, 0, 0), GARMENT_ICON);
        const a = { ...originalAppearance, physique: { sex: j ? "female" : "male", mass: 0, strength: 0 },
          wearing: { ...originalAppearance.wearing, garment: j ? "open-robe" : "coat", sleeves: j ? "loose" : "long", cut: "fitted", front: j ? "cross" : "open",
            color: j ? "#755481" : "#3c414a", headwear: j ? "none" : "top-hat", headColor: "#303238", innerColor: "#e5dcc3", leggings: j ? "none" : "trousers", footwear: j ? "sandals" : "shoes", cloak: false, shoulderCloth: false, mantle: false, necklace: false, motif: "plain", belt: j ? "sash" : "none" } };
        ["idle", "walk", "run"].forEach((pose, k) => {
          const row = j * 3 + k;
          for (let f = 0; f < 8; f++) {
            renderers.d.draw(fc, a, 1, pose, f, prop, k === 0 ? f : 2);
            ctx.drawImage(frame, 14, 24, 52, 54, f * 160 + 2, row * 192 + 16, 156, 162);
          }
          ctx.fillStyle = "#26352c"; ctx.font = "14px monospace"; ctx.fillText(`${id} · ${pose}`, 8, row * 192 + 187);
        });
      });
      return sheet.toDataURL();
    });
    await writeDataUrl(sheet, out("accessories"));
  },

  async weapons(page) {
    await characterLab(page);
    await page.evaluate(async () => {
      const { drawCharacter } = await import("/src/render/characters/renderers.ts" as string);
      const { loadCarriedArt, portableProps, iconCarriedArt } = await import("/src/render/characters/props.ts" as string);
      const { drawGarmentIcon, GARMENT_ICON } = await import("/src/render/garment-icons.ts" as string);
      const { originalAppearance } = await import("/src/core/character.ts" as string);
      const art = await loadCarriedArt();
      const rows = [
        ["Bow · draw", "bow", "draw"],
        ["Spear · thrust", "spear", "spear-thrust"],
        ["Spear · throw", "spear", "spear-throw"],
        ["Stick · swing", "stick", "stick-swing"],
        ["Pitchfork · jab", "pitchfork", "pitchfork-jab"],
        ["Rake · pull", "rake", "rake-pull"],
        ["Sickle · cut", "sickle", "sickle-cut"],
        ["Scythe · sweep", "scythe", "scythe-sweep"],
        ["Shovel · dig", "shovel", "shovel-dig"],
        ["Axe · chop", "axe", "axe-chop"],
        ["Pick · strike", "pick", "pick-strike"],
        ["Knife · thrust", "tool", "knife-thrust"],
        ["Knife · carve", "tool", "carve"],
        ["Sling · whirl", "sling", "whirl"],
        ["Sling · carried", "sling", "walk"],
        ["Torch · brand", "torch", "thrust"],
      ] as const;
      const sheet = document.createElement("canvas"), frame = document.createElement("canvas");
      sheet.width = 8 * 116;
      sheet.height = rows.length * 120;
      frame.width = frame.height = 80;
      const ctx = sheet.getContext("2d")!, fc = frame.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#667c57";
      ctx.fillRect(0, 0, sheet.width, sheet.height);
      rows.forEach(([label, id, pose], row) => {
        const key = portableProps.find((p: any) => p.id === id)?.sprite;
        const held = key
          ? art.get(key)
          : iconCarriedArt(`icon:${id}`, (c: CanvasRenderingContext2D) => drawGarmentIcon(c, id, 0, 0), GARMENT_ICON);
        for (let direction = 0; direction < 2; direction++)
          for (let f = 0; f < 4; f++) {
            drawCharacter(fc, originalAppearance, direction ? 2 : 1, pose, f, held);
            ctx.drawImage(frame, 0, 0, 80, 80, (direction * 4 + f) * 116 + 8, row * 120 + 3, 100, 100);
          }
        ctx.fillStyle = "#f5e9c8";
        ctx.font = "12px monospace";
        ctx.fillText(label, 8, row * 120 + 116);
      });
      document.body.replaceChildren(sheet);
      sheet.style.imageRendering = "pixelated";
    });
    await shootCanvas(page, out("weapons"));
  },
  async work(page) {
    await characterLab(page);
    await page.evaluate(async () => {
      const { drawCharacter } = await import("/src/render/characters/renderers.ts" as string);
      const { originalAppearance } = await import("/src/core/character.ts" as string);
      const rows = [
        ["Stir · broth or dye", "work-stir"],
        ["Knead · dough or clay", "work-knead"],
        ["Pound · grain or metal", "work-pound"],
        ["Turn · rotary quern", "work-quern"],
        ["Grind · handstone or metate", "work-grind"],
        ["Weave · shuttle and warp", "work-weave"],
        ["Scrub · cloth or vessel", "work-scrub"],
        ["Rinse · water and cloth", "work-rinse"],
        ["Fish · cast and draw line", "work-fish"],
        ["Hang · dry the catch", "work-hang"],
        ["Tend · crop and garden", "work-tend"],
        ["Sort · goods and records", "work-sort"],
        ["Check · assess the work", "work-check"],
      ] as const;
      const sheet = document.createElement("canvas"), frame = document.createElement("canvas");
      sheet.width = 8 * 144; sheet.height = rows.length * 156;
      frame.width = frame.height = 80;
      const ctx = sheet.getContext("2d")!, fc = frame.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#667c57"; ctx.fillRect(0, 0, sheet.width, sheet.height);
      rows.forEach(([label, pose], row) => {
        for (let direction = 0; direction < 2; direction++)
          for (let f = 0; f < 4; f++) {
            drawCharacter(fc, originalAppearance, direction ? 2 : 1, pose, f);
            ctx.drawImage(frame, 22, 24, 40, 46, (direction * 4 + f) * 144 + 8, row * 156 + 3, 128, 140);
          }
        ctx.fillStyle = "#f5e9c8"; ctx.font = "12px monospace";
        ctx.fillText(label, 8, row * 156 + 151);
      });
      document.body.replaceChildren(sheet);
      sheet.style.imageRendering = "pixelated";
    });
    await shootCanvas(page, out("work"));
  },
  /** The lab's own panels: the generated population and the direction sheet. */
  async lab(page) {
    await characterLab(page, { paused: true });
    await page.screenshot({ path: out("lab"), fullPage: true });
    await page
      .getByLabel("Generated character variants")
      .screenshot({ path: out("population") });
    await page
      .getByLabel("Eight direction animation sheet")
      .screenshot({ path: out("stick-sheet") });
    console.log("wrote lab, population, stick-sheet");
  },

  /** The generated population in profile: jaws, noses, hair from the side. */
  async profiles(page) {
    await characterLab(page, { paused: true });
    await page.getByLabel("Carrying", { exact: true }).selectOption("");
    await page.getByLabel("Facing", { exact: true }).selectOption("2");
    await page
      .getByLabel("Generated character variants")
      .screenshot({ path: out("profiles") });
    console.log("wrote profiles");
  },

  /** An empty-handed walk sheet, then one figure large enough to read. */
  async walk(page) {
    await characterLab(page, { paused: true });
    await page.getByLabel("Carrying", { exact: true }).selectOption("");
    await page
      .getByLabel("Eight direction animation sheet")
      .screenshot({ path: out("walk-sheet") });
    await page.getByLabel("Facing", { exact: true }).selectOption("1");
    await page.getByLabel("Zoom", { exact: true }).selectOption("8");
    await page
      .getByLabel("Animated character preview")
      .screenshot({ path: out("profile") });
    console.log("wrote walk-sheet, profile");
  },

  async cloth(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheet = await page.evaluate(async () => {
      const { renderers, outlineCharacter } = await import("/src/render/characters/renderers.ts" as string);
      const { originalAppearance } = await import("/src/core/character.ts" as string);
      const { ramp } = await import("/src/render/characters/v2/pixels.ts" as string);
      const rows = [
        ["Robe · side walk", "robe", 0, "female", 2, "walk"],
        ["Dress · side walk", "dress", 0, "female", 2, "walk"],
        ["Skirt · side walk", "skirt", 0, "female", 2, "walk"],
        ["Robe · side run", "robe", 0, "female", 2, "run"],
        ["Dress · side run", "dress", 0, "female", 2, "run"],
        ["Robe · diagonal", "robe", 0, "male", 3, "walk"],
        ["Dress · front", "dress", 0, "female", 4, "walk"],
        ["Child · robe", "robe", -2, "male", 2, "walk"],
        ["Short · dress", "dress", -1, "female", 2, "run"],
        ["Tall · robe", "robe", 1, "male", 2, "run"],
      ] as const;
      const frame = document.createElement("canvas"), sheet = document.createElement("canvas");
      frame.width = frame.height = 80;
      const cellW = 192, cellH = 208;
      sheet.width = 8 * cellW;
      sheet.height = rows.length * cellH;
      const fc = frame.getContext("2d")!, ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#a4b0a6";
      ctx.fillRect(0, 0, sheet.width, sheet.height);
      const cloth = ramp("#b86b48");
      const colors = new Set([cloth.light, cloth.base, cloth.shade, cloth.edge, cloth.shadowEdge ?? cloth.edge]
        .map((c: string) => parseInt(c.slice(1), 16)));
      const widths: number[][] = [];
      rows.forEach(([label, garment, height, sex, facing, pose], row) => {
        widths[row] = [];
        for (let f = 0; f < 8; f++) {
          const a = { ...originalAppearance, height, physique: { sex, strength: 50, mass: 40 },
            wearing: { ...originalAppearance.wearing, garment, footwear: "shoes", color: "#b86b48", lowerColor: "#645675", motif: "plain", belt: "none" } };
          renderers.d.draw(fc, a, 2, pose, f, undefined, facing);
          const pixels = fc.getImageData(0, 0, 80, 80).data;
          let left = 80, right = -1;
          for (let y = 66; y < 76; y++) for (let x = 14; x < 66; x++) {
            const i = (y * 80 + x) * 4;
            if (pixels[i + 3] && colors.has((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2])) {
              left = Math.min(left, x); right = Math.max(right, x);
            }
          }
          widths[row].push(right - left + 1);
          outlineCharacter(fc);
          ctx.drawImage(frame, 16, 34, 48, 46, f * cellW, row * cellH, 192, 184);
          ctx.fillStyle = "#263820";
          ctx.font = "12px monospace";
          ctx.fillText(`${label} ${f}`, f * cellW + 4, row * cellH + 202);
        }
      });
      for (const row of [0, 3])
        if (Math.max(widths[row][2], widths[row][6]) <= widths[row][0])
          throw Error(`${rows[row][0]}: hem did not spread with stride (${widths[row]})`);
      return sheet.toDataURL();
    });
    await writeDataUrl(sheet, out("cloth"));
  },

  async feet(page) {
    await characterLab(page);
    const sheet = await page.evaluate(async () => {
      const { renderers, outlineCharacter } = await import("/src/render/characters/renderers.ts" as string);
      const { originalAppearance } = await import("/src/core/character.ts" as string);
      const shoes = ["none", "sandals", "shoes", "boots", "sneakers"] as const;
      const rows = [
        ["Skirt front", "skirt", 0, "female", 4, "idle", 0],
        ["Skirt diagonal", "skirt", 0, "female", 3, "idle", 0],
        ["Skirt side", "skirt", 0, "female", 2, "idle", 0],
        ["Shirt back", "shirt", 0, "male", 0, "idle", 0],
        ["Short front", "shirt", -1, "female", 4, "idle", 0],
        ["Child side", "shirt", -2, "male", 2, "idle", 0],
        ["Walk side", "shirt", 0, "male", 2, "walk", 2],
        ["Walk diagonal", "skirt", 0, "female", 3, "walk", 2],
        ["Run side", "shirt", 0, "male", 2, "run", 2],
        ["Run recovery", "shirt", 0, "male", 2, "run", 0],
      ] as const;
      const frame = document.createElement("canvas"), sheet = document.createElement("canvas");
      frame.width = frame.height = 80;
      const cellW = 192, cellH = 212;
      sheet.width = shoes.length * cellW;
      sheet.height = rows.length * cellH;
      const fc = frame.getContext("2d")!, ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#a4b0a6";
      ctx.fillRect(0, 0, sheet.width, sheet.height);
      rows.forEach(([label, garment, height, sex, facing, pose, f], row) => shoes.forEach((footwear, col) => {
        const a = { ...originalAppearance, height, physique: { sex, strength: 50, mass: 40 },
          wearing: { ...originalAppearance.wearing, garment, footwear, color: "#677b37", lowerColor: "#645675" } };
        renderers.d.draw(fc, a, 2, pose, f, undefined, facing);
        if (row === 9 && footwear === "sneakers") {
          const pixels = fc.getImageData(0, 0, 80, 80).data;
          let raisedSole = false;
          for (let y = 60; y < 75; y++) for (let x = 20; x < 60; x++) {
            const i = (y * 80 + x) * 4;
            const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
            if (pixels[i + 3] && Math.min(...rgb) > 110 && Math.max(...rgb) - Math.min(...rgb) < 30)
              raisedSole = true;
          }
          if (!raisedSole) throw Error("Raised sneaker lost its sole during run recovery");
        }
        outlineCharacter(fc);
        ctx.drawImage(frame, 16, 34, 48, 46, col * cellW, row * cellH, 192, 184);
        ctx.fillStyle = "#263820";
        ctx.font = "12px monospace";
        ctx.fillText(`${label} · ${footwear}`, col * cellW + 4, row * cellH + 204);
      }));
      return sheet.toDataURL();
    });
    await writeDataUrl(sheet, out(process.env.REVIEW_NAME ?? "feet"));
  },

  /** D's adult ranges and child proportions, with identical clothing and heads. */
  async heights(page) {
    await characterLab(page);
    await page.evaluate("window.__name = (fn) => fn");
    const sheets = await page.evaluate(async () => {
      const { renderers, outlineCharacter } = await import(
        "/src/render/characters/renderers.ts" as string
      );
      const { originalAppearance } = await import("/src/core/character.ts" as string);
      const { loadCarriedArt, portableProps } = await import("/src/render/characters/props.ts" as string);
      const art = await loadCarriedArt();
      const held = (id: string) => art.get(portableProps.find((p: any) => p.id === id)!.sprite);
      const variants = [
        ["Tall man", 1, "male"],
        ["Medium man", 0, "male"],
        ["Short man", -1, "male"],
        ["Tall woman", 1, "female"],
        ["Medium woman", 0, "female"],
        ["Short woman", -1, "female"],
        ["Child", -2, "male"],
      ] as const;
      const people = variants.map(([, height, sex]) => ({
        ...originalAppearance, height, headSize: "medium", hair: "cropped",
        physique: { sex, strength: 50, mass: 40 },
        wearing: { ...originalAppearance.wearing, garment: "shirt", color: "#387748", lowerColor: "#645675" },
      }));
      const buffer = document.createElement("canvas");
      buffer.width = buffer.height = 80;
      const bc = buffer.getContext("2d")!;
      const bounds = () => {
        const data = bc.getImageData(0, 0, 80, 80).data;
        let top = 80, bottom = -1, left = 80, right = -1;
        for (let y = 0; y < 80; y++) for (let x = 0; x < 80; x++)
          if (data[(y * 80 + x) * 4 + 3]) {
            top = Math.min(top, y); bottom = Math.max(bottom, y);
            left = Math.min(left, x); right = Math.max(right, x);
          }
        if (bottom < top || top === 0 || left === 0 || right === 79)
          throw Error(`Empty or clipped D frame: ${left},${top}–${right},${bottom}`);
        return { top, bottom, height: bottom - top + 1 };
      };
      const heights = people.map((a) => {
        renderers.d.draw(bc, a, 2, "idle", 0);
        return bounds().height;
      });
      for (const [i, delta] of [[1, 2], [2, 4], [3, 2], [4, 4], [5, 6]] as const)
        if (heights[0] - heights[i] !== delta)
          throw Error(`${variants[i][0]}: expected ${delta}px shorter, got ${heights[0] - heights[i]}`);
      if (heights[0] - heights[6] < 8) throw Error("Child must be at least 8px shorter than tall adult");
      for (const a of people)
        for (const facing of [0, 1, 2, 3, 4, 5, 6, 7]) {
          renderers.d.draw(bc, a, 0, "idle", 0, undefined, facing);
          bounds();
        }
      const sheet = document.createElement("canvas");
      const rows = [
        ["Front · idle", 4, "idle", 0, undefined],
        ["Side · idle", 2, "idle", 0, undefined],
        ["Back · idle", 0, "idle", 0, undefined],
        ["Walk", 3, "walk", 2, undefined],
        ["Run", 2, "run", 2, undefined],
        ["Pickup", 4, "pickup", 2, undefined],
        ["Sit", 3, "sit", 0, undefined],
        ["Carry basket", 4, "carry", 0, held("basket")],
        ["Swing stick", 2, "swing", 2, held("stick")],
        ["Long robe", 3, "walk", 2, undefined],
      ] as const;
      const cellW = 144, cellH = 154;
      sheet.width = people.length * cellW;
      sheet.height = rows.length * cellH;
      const ctx = sheet.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#c8cbc1";
      ctx.fillRect(0, 0, sheet.width, sheet.height);
      rows.forEach(([label, facing, pose, f, prop], row) => people.forEach((a, col) => {
        const appearance = row === 9 ? { ...a, wearing: { ...a.wearing, garment: "robe", cloak: true } } : a;
        renderers.d.draw(bc, appearance, 2, pose, f, prop, facing);
        bounds();
        outlineCharacter(bc);
        ctx.drawImage(buffer, 16, 34, 48, 46, col * cellW, row * cellH + 2, 144, 138);
        ctx.fillStyle = "#263820";
        ctx.fillRect(col * cellW + 8, row * cellH + 140, 128, 1);
        ctx.font = "11px monospace";
        ctx.fillText(`${variants[col][0]} · ${label}`, col * cellW + 4, row * cellH + 152);
      }));
      const gait = document.createElement("canvas");
      gait.width = 8 * 144;
      gait.height = people.length * 2 * cellH;
      const gc = gait.getContext("2d")!;
      gc.imageSmoothingEnabled = false;
      gc.fillStyle = "#c8cbc1";
      gc.fillRect(0, 0, gait.width, gait.height);
      people.forEach((a, i) => ["walk", "run"].forEach((pose, j) => {
        for (let f = 0; f < 8; f++) {
          renderers.d.draw(bc, a, 1, pose, f);
          bounds();
          outlineCharacter(bc);
          const row = i * 2 + j;
          gc.drawImage(buffer, 16, 34, 48, 46, f * 144, row * cellH + 2, 144, 138);
          gc.fillStyle = "#263820";
          gc.font = "11px monospace";
          gc.fillText(`${variants[i][0]} · ${pose} ${f}`, f * 144 + 4, row * cellH + 152);
        }
      }));
      return { heights, sheet: sheet.toDataURL(), gait: gait.toDataURL() };
    });
    await writeDataUrl(sheets.sheet, out("heights"));
    await writeDataUrl(sheets.gait, out("height-gait"));
    console.log("D standing heights:", sheets.heights);
  },

  /** Large, medium and small heads on the game renderer, bald and haired,
   * front, profile and back. */
  async heads(page) {
    await characterLab(page);
    await page.evaluate(async () => {
      const { drawCharacter } = await import(
        "/src/render/characters/renderers.ts" as string
      );
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const looks = [
        { hair: "bald", beard: "none" },
        { hair: "bald", beard: "full", skin: "#8d5a3b" },
        { hair: "cropped", beard: "none", skin: "#c68d62" },
        { hair: "long", beard: "none", hairColor: "#292823" },
        { hair: "curls", beard: "short" },
      ];
      const sizes = ["large", "medium", "small"],
        dirs = [2, 1, 0];
      const b = document.createElement("canvas"),
        c = document.createElement("canvas");
      b.width = b.height = 80;
      c.width = looks.length * dirs.length * 90;
      c.height = sizes.length * 170;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#c9ad7a";
      ctx.fillRect(0, 0, c.width, c.height);
      sizes.forEach((headSize, row) =>
        looks.forEach((look, i) =>
          dirs.forEach((d, j) => {
            drawCharacter(bc, { ...originalAppearance, ...look, headSize }, d, "idle", 0);
            ctx.drawImage(b, 22, 26, 28, 54, (i * 3 + j) * 90, row * 170, 84, 162);
            ctx.fillStyle = "#2a2018";
            ctx.font = "12px monospace";
            if (!i && !j) ctx.fillText(headSize, 4, row * 170 + 14);
          }),
        ),
      );
      document.body.replaceChildren(c);
      c.style.imageRendering = "pixelated";
    });
    await shootCanvas(page, out("heads"));
  },

  /** Generated faces front-on across the skin range, head and shoulders at
   * 8x: how eyes, brows, nose, mouth and blush vary between people. */
  async faces(page) {
    await characterLab(page);
    await page.evaluate(async (facing) => {
      const { drawCharacter, outlineCharacter, outlined, defaultRenderer } = await import(
        "/src/render/characters/renderers.ts" as string
      );
      const { generateAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const skins = ["#3b2219", "#5a3522", "#7a4a2e", "#a06a42", "#c79466", "#ecc7a4"];
      const b = document.createElement("canvas"),
        c = document.createElement("canvas");
      b.width = b.height = 80;
      const cols = 8,
        S = 8,
        w = 30,
        h = 26;
      c.width = cols * w * S;
      c.height = skins.length * h * S;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#b8a878";
      ctx.fillRect(0, 0, c.width, c.height);
      skins.forEach((skin, row) => {
        for (let i = 0; i < cols; i++) {
          const a = generateAppearance("faces", row * cols + i, 30);
          // FACING is 0–7, north clockwise, so diagonals can be reviewed too.
          drawCharacter(bc, { ...a, skin }, Math.round(facing / 2) % 4, "idle", 0, undefined, facing);
          if (!outlined(defaultRenderer)) outlineCharacter(bc);
          ctx.drawImage(b, 21, 32, w, h, i * w * S, row * h * S, w * S, h * S);
        }
      });
      document.body.replaceChildren(c);
      c.style.imageRendering = "pixelated";
    }, Number(process.env.FACING ?? 4));
    await shootCanvas(page, out(`faces-${process.env.FACING ?? 4}`));
  },

  /** Every frame of the walk and the run on the game renderer: profile,
   * front and back, one row each. */
  async gait(page) {
    await characterLab(page);
    await page.evaluate(async () => {
      const { drawCharacter } = await import(
        "/src/render/characters/renderers.ts" as string
      );
      const { frameCount } = await import(
        "/src/render/characters/poses.ts" as string
      );
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const rows = [
        ["walk", 1],
        ["walk", 2],
        ["walk", 0],
        ["run", 1],
        ["run", 2],
        ["setoff", 1],
        ["halt", 1],
        ["halt", 2],
      ] as const;
      const b = document.createElement("canvas"),
        c = document.createElement("canvas");
      b.width = b.height = 80;
      c.width = 8 * 130;
      c.height = rows.length * 170;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#c9ad7a";
      ctx.fillRect(0, 0, c.width, c.height);
      rows.forEach(([pose, d], row) => {
        for (let f = 0; f < frameCount(pose); f++) {
          drawCharacter(
            bc,
            {
              ...originalAppearance,
              hair: "long",
              wearing: { ...originalAppearance.wearing, cloak: true },
            },
            d,
            pose,
            f,
          );
          ctx.drawImage(b, 16, 26, 42, 54, f * 130, row * 170, 126, 162);
        }
        ctx.fillStyle = "#3a2c1c";
        ctx.fillRect(0, row * 170 + 161, c.width, 1);
      });
      document.body.replaceChildren(c);
      c.style.imageRendering = "pixelated";
    });
    await shootCanvas(page, out("gait"));
  },

  /** Every portable object in hand, four directions each. */
  async props(page) {
    await characterLab(page);
    await page.evaluate(async () => {
      const { drawCharacter } = await import(
        "/src/render/characters/draw.ts" as string
      );
      const { loadCarriedArt, portableProps } = await import(
        "/src/render/characters/props.ts" as string
      );
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const art = await loadCarriedArt(),
        c = document.createElement("canvas"),
        b = document.createElement("canvas");
      b.width = b.height = 80;
      c.width = 4 * 160;
      c.height = portableProps.length * 130;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#829255";
      ctx.fillRect(0, 0, c.width, c.height);
      portableProps.forEach((p: any, i: number) => {
        for (let d = 0; d < 4; d++) {
          drawCharacter(bc, originalAppearance, d, "carry", 0, art.get(p.sprite));
          ctx.drawImage(b, 8, 24, 64, 56, d * 160, i * 130, 128, 112);
        }
        ctx.fillStyle = "#17261d";
        ctx.font = "12px monospace";
        ctx.fillText(p.name, 5, i * 130 + 126);
      });
      document.body.replaceChildren(c);
      c.style.imageRendering = "pixelated";
    });
    await shootCanvas(page, out("all-carrying"));
  },

  /** Loads in each carrying style, standing and mid-stride, four directions. */
  async loads(page) {
    await characterLab(page);
    await page.evaluate(async () => {
      const { drawCharacter } = await import(
        "/src/render/characters/renderers.ts" as string
      );
      const { loadCarriedArt, portableProps } = await import(
        "/src/render/characters/props.ts" as string
      );
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const art = await loadCarriedArt();
      const rows = [
        ["jug", "head"],
        ["pot", "head"],
        ["basket", "head"],
        ["basket", "back"],
        ["sack", "back"],
        ["bucket", "both"],
        ["calabash", "side"],
      ];
      const c = document.createElement("canvas"),
        b = document.createElement("canvas");
      b.width = b.height = 80;
      c.width = 8 * 110;
      c.height = rows.length * 120;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#829255";
      ctx.fillRect(0, 0, c.width, c.height);
      rows.forEach(([id, kind], i) => {
        const base = art.get(
          portableProps.find((p: any) => p.id === id).sprite,
        );
        for (let d = 0; d < 4; d++)
          for (const [k, pose, frame] of [
            [0, "carry", 0],
            [1, "walk", 2],
          ] as const) {
            drawCharacter(bc, originalAppearance, d, pose, frame, base && { ...base, kind });
            ctx.drawImage(b, 16, 8, 48, 60, (d * 2 + k) * 110 + 8, i * 120, 84, 105);
          }
        ctx.fillStyle = "#17261d";
        ctx.font = "12px monospace";
        ctx.fillText(`${id} on ${kind}`, 5, i * 120 + 114);
      });
      document.body.replaceChildren(c);
      c.style.imageRendering = "pixelated";
    });
    await shootCanvas(page, out("loads"));
  },

  /** Two palettes walking, a breathing idle, and the four builds. */
  async polish(page) {
    await characterLab(page);
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
    await shootCanvas(page, out("final-polish"));
  },

  /** A four-direction walk in one outfit, then the same outfit in the world. */
  async refinement(page) {
    const outfit = {
      hairColor: "#91431f",
      wearing: {
        garment: "shirt",
        color: "#52822e",
        lowerColor: "#354989",
        trim: "#b8b04b",
      },
    };
    await characterLab(page);
    await page.evaluate(async (o) => {
      const { drawCharacter } = await import(
        "/src/render/characters/draw.ts" as string
      );
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const a = {
        ...originalAppearance,
        ...o,
        wearing: { ...originalAppearance.wearing, ...o.wearing },
      };
      const b = document.createElement("canvas"),
        c = document.createElement("canvas");
      b.width = b.height = 80;
      c.width = 4 * 160;
      c.height = 4 * 184;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#c8cbc1";
      ctx.fillRect(0, 0, c.width, c.height);
      for (let d = 0; d < 4; d++)
        for (let f = 0; f < 4; f++) {
          drawCharacter(bc, a, [2, 1, 0, 3][d], "walk", f);
          ctx.drawImage(b, 20, 40, 40, 40, f * 160, d * 184, 160, 160);
          ctx.fillStyle = "#29332f";
          ctx.font = "12px monospace";
          ctx.fillText(
            `${["South", "East", "North", "West"][d]} / ${f + 1}`,
            f * 160 + 30,
            d * 184 + 178,
          );
        }
      document.body.replaceChildren(c);
      c.style.imageRendering = "pixelated";
    }, outfit);
    await shootCanvas(page, out("refined-walk"));

    await page.goto(`${base}/`);
    await page.locator(".game-container canvas[data-ready=true]").waitFor();
    await page.evaluate(async (o) => {
      const r = (window as any).__uhs;
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      r.customizeCharacter("player", {
        ...originalAppearance,
        ...o,
        wearing: { ...originalAppearance.wearing, ...o.wearing },
      });
      r.setZoom(4);
    }, outfit);
    await page
      .locator(".game-container canvas[data-character-pose=breathe]")
      .waitFor();
    await page
      .locator(".game-container canvas")
      .screenshot({ path: out("refined-world") });
    console.log(`wrote ${out("refined-world")}`);
  },

  /** The same figure through the day: the key light should change side with
   * the sun and flatten at night, not just take a flat multiply. */
  async "sprite-light"(page) {
    await characterLab(page);
    const sheet = await page.evaluate(async () => {
      const { drawCharacter } = await import(
        "/src/render/characters/v2/draw.ts" as string
      );
      const { setSpriteLight, spriteLightFor } = await import(
        "/src/render/characters/v2/pixels.ts" as string
      );
      const { lightingPresets } = await import(
        "/src/render/lighting.ts" as string
      );
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
      const S = 8,
        cell = 64;
      const c = document.createElement("canvas"),
        b = document.createElement("canvas");
      c.width = lightingPresets.length * cell * S;
      c.height = 2 * cell * S;
      b.width = b.height = 80;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
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
    await writeDataUrl(sheet, "artifacts/sprite-light.png");
  },

  /** A spread wide enough to judge the shading engine rather than one draw:
   * dark and light palettes, bare and clothed, thin limbs, all four views.
   * POSES, SCALE and ONLY narrow it when chasing one case; RENDERER (a–d),
   * PROP (a carried sprite) and FRAMES (all, or a list) study an action. */
  async "sprite-study"(page) {
    const knobs = {
      poses: (process.env.POSES ?? "idle,chop").split(","),
      scale: Number(process.env.SCALE ?? 4),
      only: process.env.ONLY === undefined ? undefined : Number(process.env.ONLY),
      renderer: process.env.RENDERER ?? "b",
      prop: process.env.PROP,
      frames: process.env.FRAMES === "all" ? [0, 1, 2, 3] : process.env.FRAMES?.split(",").map(Number),
    };
    await characterLab(page);
    const sheet = await page.evaluate(async (k) => {
      const { renderers } = await import(
        "/src/render/characters/renderers.ts" as string
      );
      const drawCharacter = renderers[k.renderer].draw;
      const art = k.prop
        ? (await (await import("/src/render/characters/props.ts" as string)).loadCarriedArt()).get(k.prop)
        : undefined;
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const base = originalAppearance as any;
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
      const { poses, scale: S, only } = k;
      const frames = k.frames;
      const cell = 64,
        cols = poses.length * 4 * (frames?.length ?? 1),
        rows = only === undefined ? people.length : 1;
      const c = document.createElement("canvas"),
        b = document.createElement("canvas");
      c.width = cols * cell * S;
      c.height = rows * cell * S;
      b.width = b.height = 80;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#8d9484";
      ctx.fillRect(0, 0, c.width, c.height);
      (only === undefined ? people : [people[only]]).forEach((p, row) => {
        const a = { ...base, ...p, wearing: { ...base.wearing, ...p.wearing } };
        let col = 0;
        for (const pose of poses)
          for (const dir of [2, 1, 0, 3])
            for (const frame of frames ?? [pose === "idle" ? 0 : 1]) {
              bc.clearRect(0, 0, 80, 80);
              drawCharacter(bc, a, dir, pose, frame, art, dir * 2);
              ctx.drawImage(b, 8, 16, cell, cell, col * cell * S, row * cell * S, cell * S, cell * S);
              col++;
            }
      });
      return c.toDataURL();
    }, knobs);
    await writeDataUrl(sheet, "artifacts/sprite-study.png");
  },

  /** The production-renderer village at each lighting phase. */
  async village(page) {
    await characterLab(page, { paused: true });
    for (const light of ["morning", "midday", "dusk", "night"]) {
      await page.getByLabel("Lighting", { exact: true }).selectOption(light);
      const village = page.getByTestId("character-village");
      await village.locator("canvas[data-ready=true]").waitFor();
      await village.locator(`canvas[data-character-shadow=${light}]`).waitFor();
      await village.screenshot({ path: out(`village-${light}`) });
      console.log(`wrote ${out(`village-${light}`)}`);
    }
  },
};

const asked = process.argv.slice(2);
const names = asked.length ? asked : Object.keys(presets);
for (const name of names) {
  const preset = presets[name];
  if (!preset)
    throw Error(
      `no character preset "${name}". Try: ${Object.keys(presets).join(", ")}`,
    );
  console.log(`--- ${name}`);
  await withPage({ width: 1440, height: 1100 }, preset);
}
