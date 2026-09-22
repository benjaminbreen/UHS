import { test, expect } from "@playwright/test";
test("walks to Oxford and back with one player and retained local changes", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    "/geography-lab?from=london&to=oxford&via=&year=1300&spacing=500&mode=land",
  );
  await page
    .getByRole("button", { name: "Play connected maps", exact: true })
    .click();
  await page.waitForFunction(
    () => Boolean((window as any).__uhs?.journey),
    undefined,
    { timeout: 120000 },
  );
  await page.waitForFunction(() => Boolean((window as any).__uhs?.journey));
  const initial = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    rt.engine.state.player.health = 73;
    const object = rt.engine.state.objects[0];
    object.damage = 17;
    return { name: rt.engine.state.player.name, object: object.id };
  });
  async function cross(to: string) {
    await page.evaluate((to) => {
      const rt = (window as any).__uhs,
        e = rt.journey.entrances.find((e: any) => e.to === to);
      if (!e?.point) throw Error("Missing entrance to " + to);
      const half = rt.engine.state.manifest.setting.playableMap.size / 2;
      rt.engine.state.player.pos = { ...e.point, space: "outside" };
      rt.emit();
      rt.move(
        e.point.x === -half ? -1 : e.point.x === half - 1 ? 1 : 0,
        e.point.y === -half ? -1 : e.point.y === half - 1 ? 1 : 0,
      );
    }, to);
    await page.waitForFunction(
      (id) =>
        (window as any).__uhs.journey.id === id &&
        !(window as any).__uhs.journey.busy,
      to,
      { timeout: 120000 },
    );
  }
  await cross("place:oxford");
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.name),
  ).toBe(initial.name);
  expect(
    await page.evaluate(() => (window as any).__uhs.engine.state.player.health),
  ).toBe(73);
  // Move clear of the entrance before making the deliberate return trip.
  await page.evaluate(() => {
    const rt = (window as any).__uhs;
    rt.engine.state.player.pos = { x: 0, y: 0, space: "outside" };
    rt.emit();
  });
  await cross("place:london");
  expect(
    await page.evaluate(
      (id) =>
        (window as any).__uhs.engine.state.objects.find((o: any) => o.id === id)
          ?.damage,
      initial.object,
    ),
  ).toBe(17);
  expect(
    await page.evaluate(() => (window as any).__uhs.journey.visited.size),
  ).toBe(1);
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 75000 },
  );
  await page.screenshot({ path: "artifacts/geography/live-map-return.png" });
  expect(errors).toEqual([]);
});

test("normal new-game creation enables connected maps", async ({ page }) => {
  test.setTimeout(180000);
  await page.goto("/");
  await page.locator("#opening-prompt").fill("London 1300 farmer");
  await page.locator("#opening-prompt").press("Enter");
  await page.waitForFunction(
    () => Boolean((window as any).__uhs?.journey),
    undefined,
    { timeout: 120000 },
  );
  const state = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    return {
      id: rt.journey.id,
      size: rt.engine.state.manifest.setting.playableMap.size,
    };
  });
  expect(state).toEqual({ id: "place:london", size: 384 });
});

test("San Diego has a walkable southern border and a constrained camera", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  await page.locator("#opening-prompt").fill("San Diego 1650 BCE hunter");
  await page.locator("#opening-prompt").press("Enter");
  await page.waitForFunction(
    () => Boolean((window as any).__uhs?.journey),
    undefined,
    { timeout: 120000 },
  );
  await expect(page.getByLabel("Map travel")).toHaveCount(0);
  const destination = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    const e = rt.journey.entrances.find(
      (e: any) => e.bearing === "S" && e.mode === "land" && e.point,
    );
    if (!e) throw Error("No southern overland entrance");
    rt.engine.state.player.pos = { ...e.point, space: "outside" };
    rt.setZoom(0.5);
    rt.emit();
    return e.to;
  });
  await expect(page.getByLabel("Map travel")).toBeVisible();
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-terrain-ready",
    "true",
    { timeout: 90000 },
  );
  await page.screenshot({ path: "artifacts/geography/coastal-border.png" });
  await page.evaluate(() => (window as any).__uhs.move(0, 1));
  await page.waitForFunction(
    (id) =>
      (window as any).__uhs.journey.id === id &&
      !(window as any).__uhs.journey.busy,
    destination,
    { timeout: 90000 },
  );
});

test("can continue north through several maps from Butembo", async ({ page }) => {
  test.setTimeout(300000);
  await page.goto("/geography-lab?year=1300");
  await page.getByLabel("Permanent map place").selectOption("place:city-butembo");
  await page.getByRole("button", {name:"Play connected maps",exact:true}).click();
  await page.waitForFunction(()=>Boolean((window as any).__uhs?.journey),undefined,{timeout:120000});
  for(let i=0;i<3;i++) {
    const next=await page.evaluate(()=>{
      const rt=(window as any).__uhs;
      const candidates=rt.journey.entrances.filter((e:any)=>e.point&&e.mode==="land"&&(e.seam?.side??e.bearing).includes("N"));
      const e=candidates[0];
      if(!e)throw Error("Missing reachable north exit on "+rt.journey.id);
      rt.engine.state.player.pos={x:0,y:0,space:"outside"};rt.emit();
      rt.engine.state.player.pos={...e.point,space:"outside"};rt.emit();
      const half=rt.engine.state.manifest.setting.playableMap.size/2;
      rt.move(e.point.x===-half?-1:e.point.x===half-1?1:0,e.point.y===-half?-1:e.point.y===half-1?1:0);
      return e.to;
    });
    await page.waitForFunction(id=>(window as any).__uhs.journey.id===id&&!(window as any).__uhs.journey.busy,next,{timeout:120000});
  }
});
