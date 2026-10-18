import { expect, test } from "@playwright/test";

test("interiors stay centered when they fit and follow within the building at higher zoom", async ({ page }) => {
  await page.goto("/");
  await page.locator("#opening-prompt").fill("A potter in Central India, 304 BCE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await Promise.race([
    page.getByRole("dialog").getByRole("button", { name: "Begin", exact: true }).click({ timeout: 15000 }).catch(() => {}),
    page.getByRole("button", { name: /Enter life/ }).waitFor({ timeout: 15000 }),
  ]);
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 40000 });
  await page.getByRole("button", { name: /Begin your day/ }).click();
  await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    r.stop();
    r.ambientRate = 0;
    const house = e.state.households.find((h: any) => h.members.includes("player"));
    const place = e.world.place(house.residence);
    e.state.player.pos = { ...place.entrance, space: "outside" };
    const result = r.command({ type: "interact", target: place.id, action: "enter" });
    if (result.status !== "completed") throw Error(JSON.stringify(result));
  });
  await page.waitForFunction(() => !!(window as any).uhsGame.scene.getScene("world").roomView);
  for (const viewport of [{ width: 2048, height: 1108 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).uhsGame.scene.getScene("world");
      return scene.cameras.main.width === scene.scale.width && scene.cameras.main.height === scene.scale.height;
    })).toBe(true);
    for (const zoom of [1, 2, 4]) {
      await page.evaluate((zoom) => (window as any).__uhs.setZoom(zoom), zoom);
      await expect.poll(() => page.evaluate((zoom) => {
        const camera = (window as any).uhsGame.scene.getScene("world").cameras.main;
        return Math.abs(camera.zoom - zoom) < 0.001;
      }, zoom)).toBe(true);
      for (const side of ["left", "right"]) {
        await page.evaluate((side) => {
          const r = (window as any).__uhs, e = r.engine;
          const cells = [...e.interiorOf(e.state.player.pos.space).walk] as string[];
          cells.sort((a, b) => Number(a.split(",")[0]) - Number(b.split(",")[0]));
          const [x, y] = cells[side === "left" ? 0 : cells.length - 1].split(",").map(Number);
          e.state.player.pos = { ...e.state.player.pos, x, y };
          r.emit();
        }, side);
        await expect.poll(() => page.evaluate(() => {
          const scene = (window as any).uhsGame.scene.getScene("world");
          const c = scene.cameras.main, room = scene.roomView;
          if (!room) return false;
          const framed = (start: number, size: number, viewStart: number, viewSize: number) =>
            size + 32 <= viewSize
              ? Math.abs(start + size / 2 - viewStart - viewSize / 2) * c.zoom <= 2
              : start - viewStart <= 17 && start + size - viewStart >= viewSize - 17;
          const p = scene.entities.get("player");
          return framed(room.image.x, room.pixel.W, c.worldView.x, c.worldView.width) &&
            framed(room.image.y, room.pixel.H, c.worldView.y, c.worldView.height) &&
            c.worldView.contains(p.x, p.y);
        })).toBe(true);
      }
      if (zoom === 2)
        await page.screenshot({ path: `artifacts/interior-framing-${viewport.width}.png` });
    }
  }
  await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    const room = e.interiorOf(e.state.player.pos.space);
    e.state.player.pos = { ...room.exit, space: e.state.player.pos.space };
    const exit = e.state.objects.find((o: any) => o.kind === "exit" && o.pos.space === e.state.player.pos.space);
    const result = r.command({ type: "interact", target: exit.id, action: "exit" });
    if (result.status !== "completed") throw Error(JSON.stringify(result));
  });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).uhsGame.scene.getScene("world"), p = scene.entities.get("player");
    return !scene.roomView && scene.runtime.engine.state.player.pos.space === "outside" && scene.cameras.main.worldView.contains(p.x, p.y);
  })).toBe(true);
});

test("task views browse the day without moving the player or opening game shortcuts", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.locator("#opening-prompt").fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 40000 });
  expect(await page.evaluate(() => (window as any).__uhs.engine.world.pack.setting.year)).toBe(100);
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await page.locator(".event-open").first().click();
  const task = page.locator(".tasks");
  await expect(task).toBeVisible();
  await expect(task).toHaveAttribute("data-settled", "true");
  const position = () => page.evaluate(() => ({ ...(window as any).__uhs.engine.state.player.pos }));
  const before = await position();
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowDown");
  await page.keyboard.press("i");
  expect(await position()).toEqual(before);
  await expect(page.getByRole("dialog", { name: "inventory", exact: true })).toHaveCount(0);
  const title = await task.locator("h1").textContent();
  await page.keyboard.press("ArrowRight");
  await expect(task.locator("h1")).not.toHaveText(title!);
  await page.screenshot({ path: "artifacts/integration-task-desktop.png", animations: "disabled" });
  await task.getByRole("button", { name: /View: Campfire/ }).click();
  await expect(task.getByRole("button", { name: /View: Close/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(task.getByRole("button", { name: "Close", exact: true })).toBeInViewport();
  await page.screenshot({ path: "artifacts/integration-task-mobile.png", animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(task).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const [id, prompt, landform, camp] of [
  ["island", "tiny desert island", "islet", "none"],
  ["pilot", "ww2 pilot downed, floating in atlantic", "open-ocean", "none"],
  ["everest", "Everest base camp", "local", "expedition"],
  ["roman", "Roman military camp", "local", "military"],
])
  test(`${id} starts through World Weaver`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Choose starting details" }).click();
    await page
      .getByRole("button", { name: "World Weaver", exact: false })
      .click();
    await page
      .getByPlaceholder("Describe a place, period, and character…")
      .fill(prompt);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Begin", exact: true })
      .click();
    await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
    await page.waitForFunction(() => !!(window as any).__uhs?.engine, null, {
      timeout: 150000,
    });
    await expect(
      page
        .getByLabel("Playable historical world.", { exact: false })
        .locator("canvas"),
    ).toHaveAttribute("data-terrain-ready", "true", { timeout: 120000 });
    await expect(
      page
        .getByLabel("Playable historical world.", { exact: false })
        .locator("canvas"),
    ).toHaveAttribute("data-terrain-pending", "0", { timeout: 120000 });
    const result = await page.evaluate(() => {
      const r = (window as any).__uhs,
        e = r.engine;
      return {
        situation: e.world.pack.setting.situation,
        year: e.world.pack.setting.year,
        afloat: e.state.player.afloat,
        places: e.world.places.length,
      };
    });
    expect(result.situation.landform).toBe(landform);
    expect(result.situation.camp).toBe(camp);
    if (id === "pilot") {
      expect(result.afloat).toBe("raft");
      expect(result.year).toBe(1944);
      const before = await page.evaluate(
        () => (window as any).__uhs.engine.state.player.pos.x,
      );
      await page.keyboard.down("ArrowRight");
      await expect
        .poll(() =>
          page.evaluate(() => (window as any).__uhs.engine.state.player.pos.x),
        )
        .toBeGreaterThan(before);
      await page.keyboard.up("ArrowRight");
    }
    await page.screenshot({ path: `artifacts/situation-${id}.png` });
    expect(errors).toEqual([]);
  });


test("running impacts hurt and fatal fire offers a new world", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.locator("#opening-prompt").fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 40000 });
  await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    r.stop();
    r.ambientRate = 0;
    e.state.actors = [];
    e.state.objects = [];
    e.state.fauna = [];
    e.state.fires = [];
    e.world.fauna = undefined;
    e.world.canCross = undefined;
    e.world.topography = undefined;
    e.world.elevation = () => 0;
    e.world.terrain = () => "grass";
    e.world.decoration = () => undefined;
    e.world.blocked = (x: number) => x === 3;
    e.terrainCollision.clear();
    e.state.player.pos = { x: 0, y: 0, space: "outside" };
    e.state.player.health = 100;
    r.emit();
  });
  await page.locator(".game-container").focus();
  await page.keyboard.down("Shift");
  await page.keyboard.down("ArrowRight");
  await expect.poll(() => page.evaluate(() => (window as any).__uhs.engine.state.player.health)).toBeLessThan(100);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("Shift");
  expect(await page.evaluate(() => (window as any).__uhs.engine.state.player.pos.x)).toBe(2);
  await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine, p = e.state.player;
    e.state.fires = [{ x: p.pos.x, y: p.pos.y, until: e.state.clock + 300 }];
    r.command({ type: "wait", seconds: 30 });
  });
  const death = page.getByRole("alertdialog", { name: "You died", exact: true });
  await expect(death).toBeVisible();
  await expect(death).toContainText("burns");
  await expect(page.getByRole("status", { name: "Health 0 of 100", exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/hazard-death-desktop.png", animations: "disabled" });
  const ended = await page.evaluate(() => {
    const r = (window as any).__uhs;
    return { health: r.engine.state.player.health, clock: r.engine.state.clock };
  });
  expect(ended.health).toBe(0);
  await page.keyboard.press("ArrowLeft");
  expect(await page.evaluate(() => (window as any).__uhs.engine.state.clock)).toBe(ended.clock);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(death.getByRole("button", { name: "New world", exact: true })).toBeInViewport();
  await page.screenshot({ path: "artifacts/hazard-death-mobile.png", animations: "disabled" });
  await death.getByRole("button", { name: "New world", exact: true }).click();
  await expect(death).toHaveCount(0);
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});

test("refusing to leave during dialogue ends talk and produces a real threat", async ({ page }) => {
  await page.route("**/api/dialogue", async (route) => {
    const { user } = route.request().postDataJSON();
    const refused = user.includes("Player says: No, I'm staying.");
    await route.fulfill({ json: { text: refused ? "Get out of my house." : "Leave my house.", regard: refused ? -1 : 0, trespass: refused ? "refused" : "warned" } });
  });
  await page.goto("/");
  await page.locator("#opening-prompt").fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 40000 });
  await page.getByRole("button", { name: /Begin your day/ }).click();
  await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    r.stop();
    r.ambientRate = 0;
    const h = e.state.households.find((h: any) => h.residence && h.id !== e.state.player.householdId && h.members.some((id: string) => e.state.actors.some((a: any) => a.id === id)));
    const actor = e.state.actors.find((a: any) => a.id === h.members[0]);
    const house = e.world.place(h.residence), room = e.interiorOf(house.id);
    const cells = [...room.walk] as string[];
    const pair = cells.find((cell) => { const [x, y] = cell.split(",").map(Number); return room.walk.has(`${x + 1},${y}`); })!;
    const [x, y] = pair.split(",").map(Number);
    house.owner = actor.id;
    house.access = "household";
    e.state.permissions[house.owner] = 0;
    actor.age = 34;
    actor.health = 100;
    delete actor.injury;
    actor.stats = { strength: 60, agility: 60, endurance: 60, wit: 50, openness: 50, conscientiousness: 50, extraversion: 100, agreeableness: 0, neuroticism: 0 };
    actor.pos = { x, y, space: house.id };
    e.state.player.pos = { x: x + 1, y, space: house.id };
    e.confronter = actor.id;
    e.state.plot = undefined;
    r.emit();
  });
  const conversation = page.getByRole("dialog", { name: /Conversation with/ });
  await expect(conversation.getByText(/^(Leave my house\.|LEAVE MY HOUSE!!)$/)).toBeVisible();
  const respond = conversation.getByRole("button", { name: "Respond", exact: true });
  if (await respond.count()) await respond.click();
  await conversation.getByRole("textbox", { name: "Your response" }).fill("No, I'm staying.");
  await conversation.getByRole("button", { name: "Send response" }).click();
  await expect(conversation.getByText("GET OUT OF MY HOUSE!!", { exact: true })).toBeVisible();
  await expect(conversation.getByRole("textbox", { name: "Your response" })).toHaveCount(0);
  await expect(conversation.getByRole("button", { name: "Leave", exact: true })).toBeVisible();
  expect(await page.evaluate(() => {
    const e = (window as any).__uhs.engine;
    return e.state.actors.some((a: any) => a.terror?.fight && a.terror.cause === "anger");
  })).toBe(true);
});
