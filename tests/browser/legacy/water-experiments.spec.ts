import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
const digest = (buffer: Buffer) =>
  createHash("sha256").update(buffer).digest("hex");
test("water studies animate, pause, switch habitats and preserve shared controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/water-experiments");
  await page
    .getByRole("button", { name: "Compare A / B / C", exact: true })
    .click();
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(3);
  const canvases = page.locator("canvas");
  const first = await canvases.nth(2).getAttribute("data-frame");
  await expect
    .poll(() => canvases.nth(2).getAttribute("data-frame"))
    .not.toBe(first);
  const images = await Promise.all(
    [0, 1, 2].map(async (i) => digest(await canvases.nth(i).screenshot())),
  );
  expect(new Set(images).size).toBe(3);
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(3);
  await page.waitForTimeout(300);
  const still = await Promise.all(
    [0, 1, 2].map(async (i) => digest(await canvases.nth(i).screenshot())),
  );
  await page.waitForTimeout(350);
  for (let i = 0; i < 3; i++)
    expect(digest(await canvases.nth(i).screenshot())).toBe(still[i]);
  await page.screenshot({
    path: "artifacts/water-experiments-comparison.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Resume animation", exact: true })
    .click();
  await page.getByLabel("Wave intensity").selectOption("3");
  await page.getByLabel("Time of day").fill("18");
  await page
    .getByRole("button", { name: "C / Living depths", exact: true })
    .click();
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page.waitForTimeout(700);
  await page.screenshot({
    path: "artifacts/water-experiments-storm.png",
    fullPage: true,
  });
  for (const kind of ["pond", "river", "lake"]) {
    await page.getByLabel("Water type").selectOption(kind);
    await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
    await expect
      .poll(async () =>
        Number(await page.locator("canvas").getAttribute("data-frame")),
      )
      .toBeGreaterThan(0);
  }
  await page.getByLabel("Water type").selectOption("pond");
  await page.getByLabel("Wave intensity").selectOption("1");
  await page.getByLabel("Time of day").fill("12");
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "artifacts/water-experiments-pond.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByLabel("Water type")).toHaveValue("pond");
  await expect(page.getByLabel("Time of day")).toHaveValue("12");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("color forms move without effects, still water holds, and palettes stay distinct", async ({
  page,
}) => {
  await page.goto("/water-experiments");
  await page
    .getByRole("button", { name: "Compare A / B / C", exact: true })
    .click();
  const results = await page.evaluate(async () => {
    const surfacePath = "/src/dev/water-experiments/surface.ts";
    const modelPath = "/src/dev/water-experiments/model.ts";
    const { animatedSurface } = await import(surfacePath);
    const { makeField, defaults } = await import(modelPath);
    const changed = (
      a: Uint8ClampedArray,
      b: Uint8ClampedArray,
      field: Float32Array,
    ) => {
      let total = 0,
        different = 0;
      for (let i = 0; i < field.length; i++)
        if (field[i] > 3) {
          total++;
          if (
            Math.abs(a[i * 4] - b[i * 4]) +
              Math.abs(a[i * 4 + 1] - b[i * 4 + 1]) +
              Math.abs(a[i * 4 + 2] - b[i * 4 + 2]) >
            10
          )
            different++;
        }
      return different / total;
    };
    return ["tiles", "depth"].map((system) => {
      const field = makeField(defaults),
        draw = animatedSurface(field, defaults, system);
      const a = draw(1).data.slice(),
        b = draw(2).data.slice();
      const still = animatedSurface(
        field,
        { ...defaults, strength: 0 },
        system,
      );
      const before = still(1).data.slice(),
        after = still(2).data.slice();
      const polar = animatedSurface(
        field,
        { ...defaults, palette: "polar" },
        system,
      )(1).data;
      const costs = [];
      for (let i = 0; i < 12; i++) {
        const start = performance.now();
        draw(i / 10);
        costs.push(performance.now() - start);
      }
      return {
        system,
        motion: changed(a, b, field),
        still: changed(before, after, field),
        palette: changed(a, polar, field),
        maxSurfaceMs: Math.max(...costs),
      };
    });
  });
  for (const r of results) {
    expect(r.motion).toBeGreaterThan(0.15);
    expect(r.still).toBe(0);
    expect(r.palette).toBeGreaterThan(0.9);
  }
  console.log("Animated color field checks", results);
});

test("scenery controls persist and habitat obstacles affect the water field", async ({
  page,
}) => {
  await page.goto("/water-experiments?kind=river");
  await page
    .getByRole("button", { name: "C / Living depths", exact: true })
    .click();
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveAttribute("data-rocks", "9");
  await page.getByLabel("Rocks", { exact: true }).fill("0");
  await page.getByLabel("Plant clusters", { exact: true }).fill("0");
  await expect(page.locator("canvas")).toHaveAttribute("data-rocks", "0");
  await expect(page.locator("canvas")).toHaveAttribute("data-plants", "0");
  await page.getByLabel("Rocks", { exact: true }).fill("12");
  await page.getByLabel("Plant clusters", { exact: true }).fill("18");
  await page.getByLabel("Bank height", { exact: true }).fill("16");
  await page.getByLabel("Boundary opacity", { exact: true }).fill("0.85");
  await page.getByLabel("Bank vegetation", { exact: true }).fill("0.8");
  await page
    .getByRole("combobox", { name: /Plant type/ })
    .selectOption("lilies");
  await page.reload();
  await expect(page.getByLabel("Rocks", { exact: true })).toHaveValue("12");
  await expect(page.getByLabel("Bank height", { exact: true })).toHaveValue(
    "16",
  );
  await expect(page.getByRole("combobox", { name: /Plant type/ })).toHaveValue(
    "lilies",
  );
  const result = await page.evaluate(async () => {
    const path = "/src/dev/water-experiments/scenery.ts",
      model = "/src/dev/water-experiments/model.ts";
    const { scenery, obstacleField } = await import(path),
      { defaults, makeField } = await import(model);
    const s = { ...defaults, kind: "river" },
      field = makeField(s),
      objects = scenery(field, s);
    const rocks = objects.filter((o: { kind: string }) => o.kind === "rock"),
      plants = objects.filter((o: { kind: string }) => o.kind !== "rock");
    const magnitude = (f: { u: Float32Array; v: Float32Array }) =>
      f.u.reduce((n, v, i) => n + Math.abs(v) + Math.abs(f.v[i]), 0);
    const coast = { ...defaults, kind: "coast", plantType: "lilies" };
    return {
      rocks: rocks.length,
      plants: plants.length,
      rockEffect: magnitude(obstacleField(rocks, s)),
      plantEffect: magnitude(obstacleField(plants, s)),
      emptyEffect: magnitude(obstacleField([], s)),
      coastKinds: scenery(makeField(coast), coast)
        .filter((o: { kind: string }) => o.kind !== "rock")
        .map((o: { kind: string }) => o.kind),
    };
  });
  expect(result.rocks).toBe(9);
  expect(result.plants).toBeGreaterThan(0);
  expect(result.rockEffect).toBeGreaterThan(0);
  expect(result.plantEffect).toBeGreaterThan(0);
  expect(result.emptyEffect).toBe(0);
  expect(result.coastKinds.every((k: string) => k === "seaweed")).toBe(true);
  await page
    .getByRole("button", { name: "C / Living depths", exact: true })
    .click();
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page
    .locator(".water-studies")
    .screenshot({ path: "artifacts/water-scenery-river.png" });
  await page.getByLabel("Water type").selectOption("coast");
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page
    .locator(".water-studies")
    .screenshot({ path: "artifacts/water-scenery-coast.png" });
});

test("clean boundary settings export as JSON with the selected renderer", async ({
  page,
}) => {
  await page.goto("/water-experiments?kind=pond");
  await page
    .getByRole("button", { name: "C / Living depths", exact: true })
    .click();
  await page.getByLabel("Bank boundary color", { exact: true }).fill("#aa8866");
  await page.getByLabel("Boundary darkness", { exact: true }).fill("0.25");
  await page.getByLabel("Boundary opacity", { exact: true }).fill("0.6");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save settings JSON" }).click();
  const download = await downloadPromise;
  const { readFile } = await import("node:fs/promises");
  const saved = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(saved.schema).toBe("uhs-water-study");
  expect(saved.selectedRenderer).toBe("depth");
  expect(saved.settings).toMatchObject({
    kind: "pond",
    boundaryColor: "#aa8866",
    boundaryDarkness: 0.25,
    boundaryOpacity: 0.6,
  });
  expect(saved.settings).not.toHaveProperty("bankBlend");
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page
    .locator(".water-studies")
    .screenshot({ path: "artifacts/water-clean-boundary.png" });
  await page.reload();
  await expect(
    page.getByLabel("Bank boundary color", { exact: true }),
  ).toHaveValue("#aa8866");
  await expect(
    page.getByLabel("Boundary darkness", { exact: true }),
  ).toHaveValue("0.25");
});

test("beach slope controls and rock-aware foam are independent", async ({
  page,
}) => {
  await page.goto("/water-experiments?kind=coast&strength=3");
  await page
    .getByRole("button", { name: "C / Living depths", exact: true })
    .click();
  await page.getByLabel("Extra surface ripples (C)", { exact: true }).check();
  await page.getByLabel("White wave thickness", { exact: true }).fill("0.4");
  await page
    .getByLabel("Automatic beach from altitude levels", { exact: true })
    .check();
  await page.getByLabel("Map altitude levels", { exact: true }).fill("2");
  await expect(page.getByLabel("Beach width", { exact: true })).toBeDisabled();
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page
    .locator(".water-studies")
    .screenshot({ path: "artifacts/water-wide-beach.png" });
  await page.getByLabel("Map altitude levels", { exact: true }).fill("8");
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page
    .locator(".water-studies")
    .screenshot({ path: "artifacts/water-cliff-coast.png" });
  const result = await page.evaluate(async () => {
    const mp = "/src/dev/water-experiments/model.ts",
      sp = "/src/dev/water-experiments/surface.ts",
      op = "/src/dev/water-experiments/scenery.ts";
    const { defaults, makeField, beachExtent } = await import(mp),
      { animatedSurface } = await import(sp),
      { scenery, obstacleField } = await import(op);
    const s = {
        ...defaults,
        kind: "coast",
        strength: 3,
        foamWidth: 1,
        foamBreakup: 0,
      },
      field = makeField(s),
      obstacles = obstacleField(scenery(field, s), s);
    const withFoam = animatedSurface(
      field,
      { ...s, foamOpacity: 1 },
      "depth",
    )(1).data.slice();
    const without = animatedSurface(
      field,
      { ...s, foamOpacity: 0 },
      "depth",
    )(1).data.slice();
    let inside = 0,
      outside = 0;
    for (let i = 0; i < field.length; i++)
      if (
        withFoam[i * 4] !== without[i * 4] ||
        withFoam[i * 4 + 1] !== without[i * 4 + 1]
      ) {
        if (obstacles.solid[i]) inside++;
        else outside++;
      }
    return {
      flat: beachExtent({ ...s, autoBeach: true, altitudeLevels: 2 }),
      steep: beachExtent({ ...s, autoBeach: true, altitudeLevels: 8 }),
      manual: beachExtent({ ...s, autoBeach: false, beachWidth: 1.5 }),
      inside,
      outside,
      delay: Math.max(...obstacles.delay),
    };
  });
  expect(result.flat).toBe(3);
  expect(result.steep).toBe(0);
  expect(result.manual).toBe(1.5);
  expect(result.inside).toBe(0);
  expect(result.outside).toBeGreaterThan(0);
  expect(result.delay).toBeGreaterThan(0);
  await page.reload();
  await expect(
    page.getByLabel("Extra surface ripples (C)", { exact: true }),
  ).toBeChecked();
});

test("preferred C loads exact approved values and climate banks retain a wet edge", async ({
  page,
}) => {
  await page.goto("/water-experiments");
  await page
    .getByRole("button", { name: "Load preferred C", exact: true })
    .click();
  await expect(page.getByLabel("Beach width", { exact: true })).toHaveValue(
    "1.5",
  );
  await expect(page.getByLabel("Water type")).toHaveValue("river");
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page
    .locator(".water-studies")
    .screenshot({ path: "artifacts/water-preferred-river.png" });
  for (const [climate, material] of [
    ["desert", "clay"],
    ["tundra", "snow"],
  ]) {
    await page
      .getByLabel("Bank climate", { exact: true })
      .selectOption(climate);
    await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
    await page
      .locator(".water-studies")
      .screenshot({ path: `artifacts/water-bank-${climate}.png` });
    const resolved = await page.evaluate(async () => {
      const path = "/src/dev/water-experiments/banks.ts",
        model = "/src/dev/water-experiments/model.ts";
      const { bankStyle } = await import(path),
        { defaults } = await import(model);
      return bankStyle({
        ...defaults,
        bankClimate: new URLSearchParams(location.search).get("bankClimate"),
      });
    });
    expect(resolved.material).toBe(material);
    expect(resolved.wet).not.toBe(resolved.dry);
    expect(resolved.contact).not.toBe(resolved.wet);
  }
});

test("bank colorways, opacity and gradient are preserved in exported JSON", async ({
  page,
}) => {
  await page.goto("/water-experiments");
  await page.getByLabel("Bank colorway", { exact: true }).selectOption("sand");
  await page.getByLabel("Wet bank edge width", { exact: true }).fill("0.5");
  await page.getByLabel("Bank tint opacity", { exact: true }).fill("0.8");
  await page.getByLabel("Wet edge opacity", { exact: true }).fill("0.6");
  await page.getByLabel("Bank surface color", { exact: true }).fill("#edc386");
  await page.getByLabel("Gradient color steps", { exact: true }).fill("6");
  await expect(
    page.getByLabel("Stepped bank gradient", { exact: true }),
  ).toBeChecked();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save settings JSON" }).click();
  const download = await event;
  const { readFile } = await import("node:fs/promises");
  const json = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(json.settings).toMatchObject({
    bankDryColor: "#edc386",
    customBankColors: true,
    bankTintOpacity: 0.8,
    wetEdgeOpacity: 0.6,
    bankGradient: true,
    bankGradientSteps: 6,
  });
  await expect(page.locator("canvas[data-ready=true]")).toHaveCount(1);
  await page
    .locator(".water-studies")
    .screenshot({ path: "artifacts/water-bank-gradient.png" });
  await page.getByLabel("Stepped bank gradient", { exact: true }).uncheck();
  await page.reload();
  await expect(
    page.getByLabel("Stepped bank gradient", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Bank surface color", { exact: true }),
  ).toHaveValue("#edc386");
});
