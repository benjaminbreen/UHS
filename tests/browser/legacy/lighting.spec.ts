import { test, expect } from "@playwright/test";

test("six lab light presets, color toggle and shadow toggle are independent and reproducible", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/graphics-lab?study=mixed&bank=earth");
  const canvas = page.getByTestId("lab-canvas");
  const ready = () => expect(canvas).toHaveAttribute("data-ready", "true");
  await ready();
  const images: Buffer[] = [];
  for (const lighting of [
    "early-morning",
    "morning",
    "midday",
    "afternoon",
    "dusk",
    "night",
  ]) {
    await page.getByLabel("Light treatment").selectOption(lighting);
    await ready();
    await expect(canvas.locator("canvas")).toHaveAttribute(
      "data-lighting",
      lighting,
    );
    const frames: string[] = await page.evaluate(
      () => (window as any).graphicsLab.describe().renderedShadowFrames,
    );
    expect(frames.every((f) => f.startsWith(lighting + ":"))).toBe(true);
    expect(frames.some((f) => f.includes("house-"))).toBe(true);
    expect(frames.some((f) => f.includes("human-"))).toBe(true);
    images.push(await canvas.screenshot());
    await page.screenshot({ path: `artifacts/lighting-${lighting}.png` });
  }
  for (let i = 1; i < images.length; i++)
    expect(images[i].equals(images[i - 1])).toBe(false);
  await page.getByLabel("Time-of-day colors").uncheck();
  await ready();
  const ungraded = await canvas.screenshot();
  expect(ungraded.equals(images[5])).toBe(false);
  await page.getByLabel("Cast & contact shadows").uncheck();
  await ready();
  const noon = await canvas.screenshot();
  await page.getByLabel("Light treatment").selectOption("midday");
  await ready();
  // No color grade and no shadows means no difference between the time presets.
  expect(await canvas.screenshot()).toEqual(noon);
  expect(errors).toEqual([]);
});

test("real game clock switches lighting at a boundary and restores correctly", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-lighting", "morning");
  // Select the last minute of morning through the same saved-clock state used on load.
  await page.evaluate(() => {
    const rt = (window as any).__uhs;
    rt.engine.state.clock = 11 * 3600 - 60;
    rt.emit();
  });
  await expect(canvas).toHaveAttribute("data-lighting", "morning");
  const result = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    return rt.act({
      actionId: "lighting-boundary",
      expectedRevision: rt.engine.state.revision,
      command: { type: "wait", seconds: 60 },
    });
  });
  expect(result.status).toBe("completed");
  await expect(canvas).toHaveAttribute("data-lighting", "midday");
  const state = await page.evaluate(() => (window as any).historySim.observe());
  expect(state.clock).toBe(11 * 3600);
  expect(state.revision).toBe(1);
  // Lighting changes do not add simulation commands or revisions.
  const timeline = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    return { clock: rt.engine.state.clock, count: rt.engine.state.log.length };
  });
  expect(timeline).toEqual({ clock: 11 * 3600, count: 1 });
  await page.waitForTimeout(300);
  await page.reload();
  await expect(canvas).toHaveAttribute("data-lighting", "midday");
  expect(errors).toEqual([]);
});

test("projected tree trunks and vessel necks stay narrower than their main silhouettes", async ({
  page,
}) => {
  await page.goto("/graphics-lab?study=mixed&lighting=early-morning");
  await expect(page.getByTestId("lab-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const widths = await page.evaluate(async () => {
    const read = async (name: string) => {
      const manifest = await (await fetch(`/packs/${name}.json`)).json();
      const im = new Image();
      im.src = `/packs/${name}.png`;
      await im.decode();
      const canvas = document.createElement("canvas");
      canvas.width = im.width;
      canvas.height = im.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(im, 0, 0);
      return { manifest, context };
    };
    const source = await read("atlas"),
      shadows = await read("lighting-shadows");
    const widthAt = (name: string, distance: number) => {
      const s = source.manifest.frames[name].frame;
      const sourcePixels = source.context.getImageData(s.x, s.y, s.w, s.h).data;
      let bottom = 0;
      const feet: number[] = [];
      for (let y = 0; y < s.h; y++)
        for (let x = 0; x < s.w; x++)
          if (sourcePixels[(y * s.w + x) * 4 + 3] > 200)
            bottom = Math.max(bottom, y);
      for (let y = bottom - 2; y <= bottom; y++)
        for (let x = 0; x < s.w; x++)
          if (sourcePixels[(y * s.w + x) * 4 + 3] > 200) feet.push(x);
      const center = (Math.min(...feet) + Math.max(...feet)) / 2 - s.w / 2;
      const frame = shadows.manifest.frames[`early-morning:${name}`],
        f = frame.frame;
      const pixels = shadows.context.getImageData(f.x, f.y, f.w, f.h).data;
      const length = Math.hypot(-0.85, 0.28),
        dx = -0.85 / length,
        dy = 0.28 / length;
      const across: number[] = [];
      for (let y = 0; y < f.h; y++)
        for (let x = 0; x < f.w; x++) {
          if (!pixels[(y * f.w + x) * 4 + 3]) continue;
          const px = x - frame.pivot.x * f.w - center,
            py = y - frame.pivot.y * f.h - (bottom - s.h);
          if (Math.abs(px * dx + py * dy - distance) < 1.5)
            across.push(-px * dy + py * dx);
        }
      return across.length ? Math.max(...across) - Math.min(...across) : 0;
    };
    return {
      trunk: widthAt("hackberry", 8),
      canopy: widthAt("hackberry", 35),
      neck: widthAt("amphora", 20),
      body: widthAt("amphora", 10),
    };
  });
  expect(widths.trunk).toBeGreaterThan(0);
  expect(widths.trunk).toBeLessThan(widths.canopy * 0.45);
  expect(widths.neck).toBeGreaterThan(0);
  expect(widths.neck).toBeLessThan(widths.body * 0.8);
});
