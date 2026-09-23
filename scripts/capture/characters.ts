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

const presets: Record<string, (page: Page) => Promise<void>> = {
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

  /** Every height against a fixed ground line, idle and walking. */
  async heights(page) {
    await characterLab(page);
    await page.evaluate(async () => {
      const { drawCharacter } = await import(
        "/src/render/characters/draw.ts" as string
      );
      const { originalAppearance } = await import(
        "/src/core/character.ts" as string
      );
      const b = document.createElement("canvas"),
        c = document.createElement("canvas");
      b.width = b.height = 80;
      c.width = 700;
      c.height = 420;
      const ctx = c.getContext("2d")!,
        bc = b.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#829255";
      ctx.fillRect(0, 0, c.width, c.height);
      const names = [
        "Under 6",
        "Child / short adult",
        "Original adult",
        "Tall adult",
        "Tallest adult",
      ];
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 5; i++) {
          const a = { ...originalAppearance, height: i - 2 };
          drawCharacter(
            bc,
            a,
            row === 1 ? 1 : 2,
            row === 2 ? "walk" : "idle",
            row === 2 ? 1 : 0,
          );
          ctx.drawImage(b, 20, 40, 40, 40, i * 140 + 10, row * 140, 120, 120);
          ctx.fillStyle = "#263820";
          ctx.fillRect(i * 140 + 10, row * 140 + 121, 120, 1);
          ctx.font = "11px monospace";
          ctx.fillText(names[i], i * 140 + 4, row * 140 + 137);
        }
      document.body.replaceChildren(c);
      c.style.imageRendering = "pixelated";
    });
    await shootCanvas(page, out("heights"));
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
          drawCharacter(bc, { ...originalAppearance, hair: "bald" }, d, pose, f);
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
   * POSES, SCALE and ONLY narrow it when chasing one case. */
  async "sprite-study"(page) {
    const knobs = {
      poses: (process.env.POSES ?? "idle,chop").split(","),
      scale: Number(process.env.SCALE ?? 4),
      only: process.env.ONLY === undefined ? undefined : Number(process.env.ONLY),
    };
    await characterLab(page);
    const sheet = await page.evaluate(async (k) => {
      const { drawCharacter } = await import(
        "/src/render/characters/v2/draw.ts" as string
      );
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
      const cell = 64,
        cols = poses.length * 4,
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
          for (const dir of [2, 1, 0, 3]) {
            bc.clearRect(0, 0, 80, 80);
            drawCharacter(bc, a, dir, pose, pose === "idle" ? 0 : 1);
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
