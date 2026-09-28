import { test, expect } from "@playwright/test";

test.setTimeout(180000);

test("props keep their atlas ground anchors across animation and redraws", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/A hunter in Anatolia/).fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 120000 });
  const result = await page.evaluate(() => {
    const w = window as any, r = w.__uhs, e = r.engine;
    const scene = w.uhsGame.scene.getScene("world");
    r.stop();
    scene.options.freeze = true;
    const frames = ["study-prop-council-fire-0", "study-propb-midden-0", "study-propb-pitch-roman-0", "study-propb-stall-awning-0"];
    const props = frames.map((sprite, i) => ({
      id: `anchor-study-${i}`, kind: "container", sprite, inventory: {},
      pos: { ...e.state.player.pos, x: e.state.player.pos.x + i * 4 - 4, y: e.state.player.pos.y - 4 },
    }));
    e.state.objects.push(...props);
    scene.draw();
    const failures: string[] = [];
    for (const prop of props) {
      const im = scene.entities.get(prop.id);
      const names = scene.textures.get("props").getFrameNames()
        .filter((name: string) => name === prop.sprite || name.startsWith(`${prop.sprite}-f`) || name.startsWith(`${prop.sprite}-m`));
      for (const name of names) {
        im.setFrame(name);
        const before = [im.x, im.y, im.displayOriginX, im.displayOriginY];
        scene.draw();
        const after = [im.x, im.y, im.displayOriginX, im.displayOriginY];
        if (before.some((value, i) => Math.abs(value - after[i]) > 1e-9)) failures.push(name);
        if (Math.abs(im.originX - im.frame.pivotX) > 1e-9 || Math.abs(im.originY - im.frame.pivotY) > 1e-9)
          failures.push(`${name}:pivot`);
      }
    }
    return { failures, props: props.length };
  });
  expect(result).toEqual({ failures: [], props: 4 });
});

test("character workers preserve the synchronous sprite pixels", async ({ page }) => {
  await page.goto("/character-lab");
  const result = await page.evaluate(async () => {
    const { renderers, outlineCharacter } = await import("/src/render/characters/renderers.ts" as string);
    const { originalAppearance, generateAppearance } = await import("/src/core/character.ts" as string);
    const { loadCarriedArt, portableProps, iconCarriedArt } = await import("/src/render/characters/props.ts" as string);
    const { drawGarmentIcon, GARMENT_ICON } = await import("/src/render/garment-icons.ts" as string);
    const { lightingPreset } = await import("/src/render/lighting.ts" as string);
    const { setSpriteLight, spriteLightFor } = await import("/src/render/characters/v2/pixels.ts" as string);
    const worker = new Worker(new URL("/src/render/characters/worker.ts", location.href), { type: "module" });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 80;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const art = await loadCarriedArt();
    const axe = art.get(portableProps.find((p: { id: string }) => p.id === "axe").sprite);
    const sack = art.get(portableProps.find((p: { id: string }) => p.id === "sack").sprite);
    const bow = iconCarriedArt("icon:bow", (c: CanvasRenderingContext2D) => drawGarmentIcon(c, "bow", 0, 0), GARMENT_ICON);
    const cases = [
      { a: originalAppearance, pose: "walk", frame: 7 },
      { a: generateAppearance("worker-pixels", 1, 60), pose: "chop", frame: 2, prop: axe },
      { a: generateAppearance("worker-pixels", 2, 30, { sex: "female" }), pose: "carry", frame: 1, prop: sack && { ...sack, kind: "head" } },
      { a: generateAppearance("worker-pixels", 3, 5), pose: "breathe", frame: 3, prop: sack && { ...sack, kind: "back" } },
      { a: { ...originalAppearance, headSize: "large" }, pose: "draw", frame: 2, prop: bow },
    ];
    let frames = 0;
    try {
      for (const renderer of ["c", "d"])
        for (const id of ["morning", "midday", "night"])
          for (const [index, sample] of cases.entries())
            for (let facing = 0; facing < 8; facing++) {
              const preset = lightingPreset(id);
              const light = { ...spriteLightFor(preset.cast, id === "night"), warm: `#${preset.tint}`, cool: preset.ambientAlpha ? `#${preset.ambient}` : "#241c38" };
              const outline = index % 2 === 0;
              setSpriteLight(light);
              renderers[renderer].draw(ctx, sample.a, 2, sample.pose, sample.frame, sample.prop, facing);
              if (outline) outlineCharacter(ctx);
              setSpriteLight(undefined);
              const expected = ctx.getImageData(0, 0, 80, 80).data;
              const prop = sample.prop && {
                sprite: sample.prop.sprite, kind: sample.prop.kind,
                width: sample.prop.width, height: sample.prop.height,
                pixels: sample.prop.image.getContext("2d").getImageData(0, 0, sample.prop.width, sample.prop.height).data,
              };
              const actual = await new Promise<Uint8ClampedArray>((resolve, reject) => {
                worker.onmessage = (event) => event.data.error ? reject(Error(event.data.error)) : resolve(event.data.pixels);
                worker.onerror = (event) => reject(Error(event.message));
                worker.postMessage({ signature: String(frames), renderer, appearance: sample.a, direction: 2, facing, pose: sample.pose, frame: sample.frame, prop, outline, light });
              });
              if (actual.length !== expected.length || actual.some((value, i) => value !== expected[i]))
                return { frames, mismatch: `${renderer}:${id}:${index}:${facing}` };
              frames++;
            }
    } finally {
      worker.terminate();
    }
    return { frames, mismatch: null };
  });
  expect(result).toEqual({ frames: 240, mismatch: null });
});

test("rasterised terrain survives a trip indoors", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "More info", exact: true }).click();
  await page.getByRole("button", { name: /Korean farmer/ }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 120_000,
  });
  await page.waitForTimeout(8000);
  const stat = async (k: string) => Number(await canvas.getAttribute(k));
  const before = await stat("data-terrain-chunk-count");
  const builtBefore = await stat("data-terrain-chunks-built");
  await page.evaluate(() => {
    const r = (window as any).__uhs;
    (window as any).__home = { ...r.engine.state.player.pos };
  });
  const go = (inside: boolean) =>
    page.evaluate((inside) => {
      const r = (window as any).__uhs,
        e = r.engine;
      const place = e.world.places.find((q: any) => e.doorOf(q.id)?.open);
      e.state.player.pos = inside
        ? { x: 6, y: 8, space: place.id }
        : { ...(window as any).__home };
      r.emit();
    }, inside);
  await go(true);
  await page.waitForTimeout(800);
  const indoors = await stat("data-terrain-chunk-count");
  await go(false);
  await page.waitForTimeout(500);
  const back = await stat("data-terrain-chunk-count");
  const builtBack = await stat("data-terrain-chunks-built");
  console.log(
    `CHUNKS before=${before} indoors=${indoors} back=${back} | rasterised before=${builtBefore} after=${builtBack}`,
  );
  // The regression this guards: disposing the stream indoors dropped every
  // rasterised chunk, so stepping back out re-streamed the settlement.
  // Streaming continues in the background, so the counts only ever grow; the
  // regression is the drop to zero.
  expect(before).toBeGreaterThan(0);
  expect(indoors).toBeGreaterThanOrEqual(before);
  expect(back).toBeGreaterThanOrEqual(indoors);
});
