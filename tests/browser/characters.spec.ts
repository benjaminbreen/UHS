import { test, expect } from "@playwright/test";
test("character lab generates, edits and exports reproducible appearances", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/character-lab?seed=browser-characters");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByLabel("Count", { exact: true }).selectOption("192");
  const gallery = page.getByLabel("Generated character variants");
  await expect(gallery).toHaveAttribute("height", String(32 * 56));
  await gallery.click({ position: { x: 60, y: 50 } });
  await page.getByLabel("Height", { exact: true }).selectOption("2");
  await page.getByLabel("Garment", { exact: true }).selectOption("robe");
  await page.getByLabel("Hairstyle", { exact: true }).selectOption("braid");
  const recipe = await page.getByTestId("character-recipe").textContent();
  expect(JSON.parse(recipe!).wearing.garment).toBe("robe");
  await page.getByRole("button", { name: "swing", exact: true }).click();
  const canvas = page.getByLabel("Animated character preview");
  await page.getByLabel("Frame", { exact: true }).selectOption("0");
  await expect(canvas).toHaveAttribute("data-frame", "0");
  const first = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByRole("button", { name: "Step frame", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-frame", "1");
  expect(
    await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()),
  ).not.toBe(first);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export recipe", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("character.json");
  expect(errors).toEqual([]);
});
test("all carrying styles render in every direction with crisp pixels", async ({
  page,
}) => {
  await page.goto("/character-lab");
  const result = await page.evaluate(async () => {
    // Production renderer, independent of the UI's selected preview.
    const { drawCharacter } = await import(
      "/src/render/characters/draw.ts" as string
    );
    const { loadCarriedArt, portableProps } = await import(
      "/src/render/characters/props.ts" as string
    );
    const { originalAppearance } = await import(
      "/src/core/character.ts" as string
    );
    const props = await loadCarriedArt();
    const c = document.createElement("canvas");
    c.width = c.height = 80;
    const ctx = c.getContext("2d")!;
    let checked = 0,
      partial = 0;
    for (const p of portableProps)
      for (let d = 0; d < 4; d++) {
        drawCharacter(
          ctx,
          originalAppearance,
          d,
          "carry",
          0,
          props.get(p.sprite),
        );
        const held = c.toDataURL();
        const pixels = ctx.getImageData(0, 0, 80, 80).data;
        for (let i = 3; i < pixels.length; i += 4)
          if (pixels[i] !== 0 && pixels[i] !== 255) partial++;
        drawCharacter(ctx, originalAppearance, d, "carry", 0);
        if (held !== c.toDataURL()) checked++;
      }
    return { checked, expected: portableProps.length * 4, partial };
  });
  expect(result.checked).toBe(result.expected);
  expect(result.partial).toBe(0);
});
test("game renders the held stick, swings with Space and applies clothing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() => {
    const r = (window as any).__uhs;
    const stick = r.engine.state.objects.find((o: any) => o.prop === "stick");
    stick.pos = { ...r.engine.state.player.pos };
    r.command({ type: "interact", target: stick.id, action: "pickup" });
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .querySelector(".game-container canvas")
          ?.getAttribute("data-held-sprite"),
      ),
    )
    .toBe("study-prop-stick-0");
  await page.locator(".game-container").focus();
  await page.keyboard.press("Space");
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__uhs.characterAction?.pose),
    )
    .toBe("swing");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Character lab · appearance & clothing" })
    .click();
  await page.getByLabel("Garment", { exact: true }).selectOption("coat");
  await page
    .getByRole("button", { name: "Apply appearance & clothing", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as any).__uhs.engine.state.player.appearance.wearing.garment,
    ),
  ).toBe("coat");
  await page.getByRole("button", { name: "Back to world ×" }).click();
  await page.locator(".game-container").focus();
  await page.keyboard.press("KeyG");
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .querySelector(".game-container canvas")
          ?.getAttribute("data-held-sprite"),
      ),
    )
    .toBe("");
  await page.screenshot({ path: "artifacts/characters/world.png" });
  expect(errors).toEqual([]);
});

test("profile walk has alternating strides and material-specific contours", async ({
  page,
}) => {
  await page.goto("/character-lab");
  const result = await page.evaluate(async () => {
    const { drawCharacter } = await import(
      "/src/render/characters/draw.ts" as string
    );
    const { originalAppearance } = await import(
      "/src/core/character.ts" as string
    );
    const { ramp } = await import("/src/render/characters/pixels.ts" as string);
    const c = document.createElement("canvas");
    c.width = c.height = 80;
    const ctx = c.getContext("2d")!;
    const walks = [0, 1, 2, 3].map(
      (d) =>
        new Set(
          [0, 1, 2, 3].map((f) => {
            drawCharacter(ctx, originalAppearance, d, "walk", f);
            return c.toDataURL();
          }),
        ).size,
    );
    drawCharacter(ctx, originalAppearance, 1, "idle", 0);
    const pixel = (x: number, y: number) =>
      Array.from(ctx.getImageData(x, y, 1, 1).data);
    const profileNose = pixel(47, 58)[3];
    drawCharacter(ctx, originalAppearance, 2, "idle", 0);
    const frontNose = pixel(47, 58)[3];
    return {
      walks,
      profileNose,
      frontNose,
      edges: [
        ramp(originalAppearance.skin, "skin").edge,
        ramp(originalAppearance.wearing.color).edge,
        ramp(originalAppearance.hairColor, "hair").edge,
      ],
    };
  });
  expect(result.walks.every((count) => count >= 3)).toBe(true);
  expect(result.profileNose).toBe(255);
  expect(result.frontNose).toBe(0);
  expect(new Set(result.edges).size).toBe(3);
});

test("age-aware lab offers small children, short adults and the original default", async ({
  page,
}) => {
  await page.goto("/character-lab");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByLabel("Height", { exact: true })).toHaveValue("0");
  await expect(
    page.getByLabel("Height", { exact: true }).locator('option[value="-2"]'),
  ).toHaveCount(0);
  await page.getByLabel("Preview age", { exact: true }).fill("4");
  await expect(page.getByLabel("Height", { exact: true })).toHaveValue("-2");
  await page.getByLabel("Carrying", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "idle", exact: true }).click();
  await page.getByLabel("Frame", { exact: true }).selectOption("0");
  const bounds = () =>
    page
      .getByLabel("Animated character preview")
      .evaluate((c: HTMLCanvasElement) => {
        const data = c.getContext("2d")!.getImageData(0, 0, 80, 80).data;
        let top = 80,
          bottom = -1;
        for (let y = 0; y < 80; y++)
          for (let x = 0; x < 80; x++)
            if (data[(y * 80 + x) * 4 + 3]) {
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        return { top, bottom, height: bottom - top + 1 };
      });
  const small = await bounds();
  await page.getByLabel("Preview age", { exact: true }).fill("6");
  await expect(page.getByLabel("Height", { exact: true })).toHaveValue("-1");
  await expect.poll(async () => (await bounds()).height).toBe(small.height + 3);
  await page.getByLabel("Preview age", { exact: true }).fill("30");
  await page.getByLabel("Height", { exact: true }).selectOption("0");
  await expect.poll(async () => (await bounds()).height).toBe(small.height + 6);
  expect((await bounds()).bottom).toBe(small.bottom);
  await page.getByLabel("Height", { exact: true }).selectOption("-1");
  await expect.poll(async () => (await bounds()).height).toBe(small.height + 3);
});

test("face controls and time-of-day shadows use the production renderer", async ({
  page,
}) => {
  await page.goto("/character-lab");
  await page.getByLabel("Jaw shape", { exact: true }).selectOption("small");
  await page.getByLabel("Sleeves", { exact: true }).selectOption("loose");
  await page
    .getByLabel("Resting posture", { exact: true })
    .selectOption("stooped");
  const recipe = JSON.parse(
    (await page.getByTestId("character-recipe").textContent())!,
  );
  expect(recipe.jaw).toBe("small");
  expect(recipe.wearing.sleeves).toBe("loose");
  await page.getByLabel("Lighting", { exact: true }).selectOption("night");
  await expect(
    page.getByTestId("character-village").locator("canvas"),
  ).toHaveAttribute("data-character-shadow", "night");
  const result = await page.evaluate(async () => {
    const { drawCharacter } = await import(
      "/src/render/characters/draw.ts" as string
    );
    const { characterShadow } = await import(
      "/src/render/characters/shadow.ts" as string
    );
    const { originalAppearance, jawShapes, generateAppearance } = await import(
      "/src/core/character.ts" as string
    );
    const { loadCarriedArt } = await import(
      "/src/render/characters/props.ts" as string
    );
    const c = document.createElement("canvas");
    c.width = c.height = 80;
    const ctx = c.getContext("2d")!;
    const faces = jawShapes.map((jaw: string) => {
      drawCharacter(ctx, { ...originalAppearance, jaw }, 2, "idle", 0);
      return c.toDataURL();
    });
    drawCharacter(ctx, originalAppearance, 2, "idle", 0);
    const bounds = (phase: string) => {
      const s = characterShadow(c, phase),
        d = s.getContext("2d")!.getImageData(0, 0, 160, 96).data;
      let total = 0,
        xsum = 0,
        count = 0;
      for (let i = 3; i < d.length; i += 4)
        if (d[i]) {
          total += d[i];
          xsum += (((i - 3) / 4) % 160) * d[i];
          count++;
        }
      return { x: xsum / total, count };
    };
    const morning = bounds("morning"),
      dusk = bounds("dusk"),
      night = bounds("night");
    const empty = characterShadow(c, "morning").toDataURL();
    const props = await loadCarriedArt();
    drawCharacter(
      ctx,
      originalAppearance,
      2,
      "carry",
      0,
      props.get("study-prop-stick-0"),
    );
    const held = characterShadow(c, "morning").toDataURL();
    let partial = 0;
    for (let i = 0; i < 64; i++)
      for (let d = 0; d < 4; d++) {
        drawCharacter(ctx, generateAppearance("shape-qa", i), d, "walk", i % 4);
        const pixels = ctx.getImageData(0, 0, 80, 80).data;
        for (let j = 3; j < pixels.length; j += 4)
          if (pixels[j] !== 0 && pixels[j] !== 255) partial++;
      }
    return {
      faces: new Set(faces).size,
      morning,
      dusk,
      night,
      propChangesShadow: held !== empty,
      partial,
    };
  });
  expect(result.faces).toBe(5);
  expect(result.morning.x).toBeLessThan(80);
  expect(result.dusk.x).toBeGreaterThan(80);
  expect(result.night.count).toBeGreaterThan(0);
  expect(result.night.count).toBeLessThan(result.morning.count);
  expect(result.propChangesShadow).toBe(true);
  expect(result.partial).toBe(0);
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  for (const [clock, phase] of [
    [9 * 3600, "morning"],
    [18 * 3600, "dusk"],
    [22 * 3600, "night"],
  ] as const) {
    await page.evaluate((clock) => {
      const r = (window as any).__uhs;
      r.engine.state.clock = clock;
      r.setZoom(3);
    }, clock);
    await expect(page.locator(".game-container canvas")).toHaveAttribute(
      "data-character-shadow",
      phase,
    );
  }
});

test("breathing keeps head and feet fixed, idle heads stay facing forward, and narrower bodies retain crisp pixels", async ({
  page,
}) => {
  await page.goto("/character-lab");
  await page.getByRole("button", { name: "breathe", exact: true }).click();
  await page.getByLabel("Build", { exact: true }).selectOption("-1");
  const result = await page.evaluate(async () => {
    const { drawCharacter } = await import(
      "/src/render/characters/draw.ts" as string
    );
    const { originalAppearance } = await import(
      "/src/core/character.ts" as string
    );
    const { ramp } = await import("/src/render/characters/pixels.ts" as string);
    const c = document.createElement("canvas");
    c.width = c.height = 80;
    const ctx = c.getContext("2d")!;
    const crop = (y: number, h: number) =>
      Array.from(ctx.getImageData(0, y, 80, h).data).join(",");
    let stable = true,
      animated = true,
      crisp = true;
    for (let direction = 0; direction < 4; direction++) {
      const heads = [],
        feet = [],
        bodies = [];
      for (let f = 0; f < 4; f++) {
        drawCharacter(ctx, originalAppearance, direction, "breathe", f);
        heads.push(crop(45, 16));
        feet.push(crop(76, 4));
        bodies.push(c.toDataURL());
        const data = ctx.getImageData(0, 0, 80, 80).data;
        for (let i = 3; i < data.length; i += 4)
          if (data[i] !== 0 && data[i] !== 255) crisp = false;
      }
      stable &&= new Set(heads).size === 1 && new Set(feet).size === 1;
      animated &&= new Set(bodies).size > 1;
    }
    const attentive = { ...originalAppearance, posture: "attentive" };
    drawCharacter(ctx, attentive, 1, "idle", 0);
    const idle = c.toDataURL();
    drawCharacter(ctx, attentive, 1, "idle", 2);
    const headStill = idle === c.toDataURL();
    const width = (build: number) => {
      drawCharacter(ctx, { ...originalAppearance, build }, 2, "idle", 0);
      const d = ctx.getImageData(0, 64, 80, 6).data;
      let min = 80,
        max = 0;
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 80; x++)
          if (d[(y * 80 + x) * 4 + 3]) {
            min = Math.min(min, x);
            max = Math.max(max, x);
          }
      return max - min + 1;
    };
    return {
      stable,
      animated,
      crisp,
      headStill,
      narrow: width(-1),
      previous: width(0),
      edge: ramp("#f0ceb0", "skin").edge,
    };
  });
  expect(result.stable).toBe(true);
  expect(result.animated).toBe(true);
  expect(result.crisp).toBe(true);
  expect(result.headStill).toBe(true);
  expect(result.previous - result.narrow).toBe(1);
  const edge = parseInt(result.edge.slice(1), 16);
  expect((edge >> 16) & 255).toBeLessThan(110);
  expect((edge >> 8) & 255).toBeLessThan(85);
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-character-pose",
    "breathe",
  );
});
