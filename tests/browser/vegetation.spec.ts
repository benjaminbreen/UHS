import { test, expect } from "@playwright/test";
for (const ecology of [
  "temperate-woodland",
  "boreal-woodland",
  "tropical-woodland",
  "desert",
]) {
  test(`renders ${ecology} vegetation with atlas frames and shadows`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (/texture.*not found|frame.*not found|missing.*frame/i.test(m.text()))
        errors.push(m.text());
    });
    await page.goto(
      `/terrain-lab?ecology=${ecology}&population=none&start=wanderer&landform=plain&water=river-ns&seed=flora-01`,
    );
    await expect(
      page.getByRole("button", { name: "Play this world →" }),
    ).toBeEnabled({ timeout: 75000 });
    const info = await page.evaluate(() => {
      const { scene, runtime } = (window as any).terrainLab;
      const plants = scene.children.list.filter(
        (o: any) => o.texture?.key === "nature",
      );
      const shadows = scene.children.list.filter(
        (o: any) => o.texture?.key === "nature-shadows",
      );
      return {
        frames: [...new Set(plants.map((o: any) => o.frame.name))],
        shadows: shadows.length,
        revision: runtime.engine.state.manifest.setting.vegetationRevision,
      };
    });
    expect(info.revision).toBe(5);
    expect(info.frames.length).toBeGreaterThan(0);
    expect(info.shadows).toBeGreaterThan(0);
    if (ecology === "boreal-woodland")
      expect(info.frames.some((f) => String(f).includes("spruce"))).toBe(true);
    if (ecology === "tropical-woodland")
      expect(info.frames.some((f) => String(f).includes("broadleaf"))).toBe(
        true,
      );
    if (ecology === "desert")
      expect(
        info.frames.every(
          (f) =>
            String(f).includes("scrub") || String(f).includes("bunchgrass") || String(f).includes("sedge"),
        ),
      ).toBe(true);
    await page.screenshot({ path: `artifacts/nature-lab/map-${ecology}.png` });
    expect(errors).toEqual([]);
  });
}

test("new Korean game uses habitat vegetation and renders its minimap", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Korean farmer/ }).click();
  await page.waitForFunction(() => !!(window as any).__uhs, null, {
    timeout: 75000,
  });
  const counts = await page.evaluate(() => {
    const rt = (window as any).__uhs,
      w = rt.engine.world,
      p = rt.engine.state.player.pos;
    const sprites: string[] = [];
    for (let y = p.y - 35; y < p.y + 35; y++)
      for (let x = p.x - 35; x < p.x + 35; x++) {
        const d = w.decoration(x, y);
        if (d) sprites.push(d.sprite);
      }
    return {
      revision: rt.engine.state.manifest.setting.vegetationRevision,
      nature: sprites.filter((s) => s.startsWith("nature-")).length,
    };
  });
  expect(counts.revision).toBe(5);
  expect(counts.nature).toBeGreaterThan(0);
  await expect(page.locator("canvas[data-map-builds]")).toHaveCount(1);
  await page.screenshot({ path: "artifacts/nature-lab/map-seoul.png" });
  expect(errors).toEqual([]);
});

test("Burmese interior renders bamboo and upright deciduous trees", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto(
    "/terrain-lab?place=burma&year=1650&ecology=tropical-woodland&population=none&start=wanderer&landform=plain&water=none&seed=burma-quiet",
  );
  await expect(
    page.getByRole("button", { name: "Play this world →" }),
  ).toBeEnabled({ timeout: 75000 });
  const frames = await page.evaluate(() =>
    (window as any).terrainLab.scene.children.list
      .filter((o: any) => o.texture?.key === "nature")
      .map((o: any) => o.frame.name),
  );
  expect(frames).toContain("nature-bamboo-clump");
  expect(frames).toContain("nature-teak");
  await page.screenshot({ path: "artifacts/nature-lab/burma-quiet.png" });
});
