import { test, expect } from "@playwright/test";
test("shoreline context renders a real map, compares C, applies controls and exports", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/water-experiments?context=map");
  const frame = page.frameLocator('iframe[title="Live shoreline map"]'),
    canvas = frame.locator("canvas");
  await expect(canvas).toHaveAttribute("data-terrain-pending", "0", {
    timeout: 60000,
  });
  await expect(frame.locator(".terrain-header")).toBeHidden();
  const enabled = () =>
    canvas.evaluate((c) => {
      const w = c.ownerDocument.defaultView as any;
      return w.terrainLab.scene.options.shorePolish.enabled;
    });
  expect(await enabled()).toBe(true);
  await page.getByRole("button", { name: "Pause water", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-water-frame", "0");
  await page
    .locator("iframe")
    .screenshot({ path: "artifacts/shoreline-map-polished.png" });
  await page
    .getByRole("button", { name: "Compare current C", exact: true })
    .click();
  await expect.poll(enabled, { timeout: 60000 }).toBe(false);
  await expect(canvas).toHaveAttribute("data-terrain-pending", "0", {
    timeout: 60000,
  });
  await page
    .locator("iframe")
    .screenshot({ path: "artifacts/shoreline-map-current.png" });
  await page
    .getByRole("button", { name: "Show shoreline polish", exact: true })
    .click();
  await page.getByLabel("Map ecology").selectOption("tundra");
  await page.getByRole("button", { name: "Apply to map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-terrain-pending", "0", {
    timeout: 60000,
  });
  const plants = await canvas.evaluate(
    (c) =>
      (c.ownerDocument.defaultView as any).terrainLab.scene.children.list
        .filter((x: any) => x.type === "Shader")
        .flatMap((x: any) => x.getData("shoreObjects") ?? [])
        .filter((x: any) => x.kind !== "rock").length,
  );
  expect(plants).toBe(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save map settings JSON" }).click();
  const file = await (await download).path();
  const { readFile } = await import("node:fs/promises");
  expect(JSON.parse(await readFile(file!, "utf8")).settings.ecology).toBe(
    "tundra",
  );
  expect(errors).toEqual([]);
});

test('coastal controls reach the live renderer and export with the preset',async({page})=>{
 test.setTimeout(90000);
 await page.goto('/water-experiments?context=coast');
 const frame=page.frameLocator('iframe'),canvas=frame.locator('canvas');
 await expect(canvas).toHaveAttribute('data-terrain-pending','0',{timeout:60000});
 await page.getByLabel('Coastal scallop depth').fill('2.5');
 await page.getByLabel('Coastal scallop size').fill('12');
 await page.getByLabel('Outer beach variation').fill('0.8');
 await page.getByLabel('Offshore calmness').fill('1');
 await page.getByRole('button',{name:'Apply to map',exact:true}).click();
 await expect.poll(()=>canvas.evaluate(c=>(c.ownerDocument.defaultView as any).terrainLab.scene.options.shorePolish.coastScallop),{timeout:60000}).toBe(2.5);
 await expect(canvas).toHaveAttribute('data-terrain-pending','0',{timeout:60000});
 const s=await canvas.evaluate(c=>(c.ownerDocument.defaultView as any).terrainLab.scene.options.shorePolish);
 expect(s).toMatchObject({coastScallop:2.5,coastScale:12,coastBeachWidth:8,beachVariation:.8,offshoreCalm:1});
 await page.locator('iframe').screenshot({path:'artifacts/coast-scallops-and-calm-ocean.png'});
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Save map settings JSON'}).click();const path=await(await event).path();const{readFile}=await import('node:fs/promises');expect(JSON.parse(await readFile(path!,'utf8')).settings.coastScallop).toBe(2.5);
});
