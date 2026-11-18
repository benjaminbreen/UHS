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
  await page.getByRole("button", { name: /^(Begin your day|Continue)$/ }).click();
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await page.locator(".today-work .work-card-head").click();
  await page.getByRole("button", { name: "About today's work", exact: true }).click();
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
    const { enabled } = await (await page.request.get("/api/world-weaver")).json();
    test.skip(!enabled, "World Weaver needs OPENAI_API_KEY on the dev server");
    test.setTimeout(300000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Choose starting details" }).click();
    await page.getByRole("button", { name: /^World Weaver/ }).click();
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
  // The day's opening card would cover the death card, and swallows arrows while it closes.
  await page.getByRole("button", { name: /^(Begin your day|Continue)$/ }).click();
  await expect(page.locator(".plot-card")).toBeHidden();
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
    e.cards = [];
    e.state.plot = undefined;
    e.state.fires = [{ x: p.pos.x, y: p.pos.y, until: e.state.clock + 300 }];
    r.command({ type: "wait", seconds: 30 });
  });
  const death = page.getByRole("alertdialog", { name: / has died$/ });
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
  await expect(death.getByRole("button", { name: "Close this life", exact: true })).toBeInViewport();
  await page.screenshot({ path: "artifacts/hazard-death-mobile.png", animations: "disabled" });
  await death.getByRole("button", { name: "Close this life", exact: true }).click();
  await expect(death).toHaveCount(0);
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});

test("refusing to leave during dialogue ends talk and produces a real threat", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/dialogue", async (route) => {
    requests++;
    const { user } = route.request().postDataJSON();
    const refused = user.includes("Player says: No, I'm staying.");
    await route.fulfill({ json: { text: refused ? "Get out of my house." : "Leave my house.", regard: refused ? -1 : 0, trespass: refused ? "refused" : "warned" } });
  });
  await page.goto("/");
  await page.locator("#opening-prompt").fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const confirm = page.locator(".modal-world").getByRole("button", { name: "Begin", exact: true });
  await confirm.or(page.locator(".arrival")).waitFor({ state: "visible", timeout: 30000 });
  if (await confirm.isVisible()) await confirm.click();
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
    for (const id of h.members) {
      const member = e.state.actors.find((a: any) => a.id === id);
      if (member) { member.trust = 0; member.relations = []; }
    }
    actor.activity = "At home";
    actor.offRoutine = true;
    e.confront(e.state.clock);
    e.state.plot = undefined;
    r.emit();
  });
  const answer = page.locator(".toast").getByRole("button", { name: "Answer" });
  await expect(answer).toBeVisible();
  expect(requests).toBe(0);
  await page.screenshot({ path: "artifacts/household-warning.png" });
  await answer.click();
  const conversation = page.getByRole("dialog", { name: /Conversation with/ });
  await expect(conversation.getByText(/^(Leave my house\.|LEAVE MY HOUSE!!)$/)).toBeVisible();
  const respond = conversation.getByRole("button", { name: "Respond", exact: true });
  if (await respond.count()) await respond.click();
  await conversation.getByRole("textbox", { name: "Your response" }).fill("No, I'm staying.");
  await conversation.getByRole("button", { name: "Send response" }).click();
  await expect(conversation.locator(".dialogue-line.npc:not([data-typing])")).toContainText("GET OUT OF MY HOUSE!!", { timeout: 20000 });
  await expect(conversation.getByRole("textbox", { name: "Your response" })).toHaveCount(0);
  await expect(conversation.getByRole("button", { name: "Leave", exact: true })).toBeVisible();
  expect(await page.evaluate(() => {
    const e = (window as any).__uhs.engine;
    return e.state.actors.some((a: any) => a.terror?.fight && a.terror.cause === "anger");
  })).toBe(true);
});

test("sidebar previews link to the world without moving or selecting, and empty inventory offers a next step", async ({ page }) => {
  page.setDefaultTimeout(15000);
  await page.goto("/?start=A%20Roman%20baker%20in%20Ostia%2C%20100%20CE&seed=ui-sidebar-polish");
  await page.locator("#opening-prompt").fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const confirm = page.getByRole("dialog").getByRole("button", { name: "Begin", exact: true });
  await confirm.or(page.locator(".arrival")).waitFor({ state: "visible", timeout: 30000 });
  if (await confirm.isVisible()) await confirm.click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await page.getByRole("button", { name: /^(Begin your day|Continue)$/ }).click();
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  const before = await page.evaluate(() => {
    const r = (window as any).__uhs;
    r.stop(); r.ambientRate = 0; r.select();
    return { pos: { ...r.engine.state.player.pos }, clock: r.engine.state.clock };
  });
  await page.getByRole("tab", { name: "Nearby", exact: true }).click();
  await page.getByRole("button", { name: "Show everything", exact: true }).click();
  const row = page.locator(".nearby-list > button[data-world-target]").first();
  const id = await row.getAttribute("data-world-target");
  await row.hover();
  await expect.poll(() => page.evaluate(() => (window as any).uhsGame.scene.getScene("world").preview?.id)).toBe(id);
  await expect(page.locator(".map-highlight")).toBeVisible();
  expect(await page.evaluate(() => {
    const r = (window as any).__uhs;
    return { pos: r.engine.state.player.pos, clock: r.engine.state.clock, selected: r.selected };
  })).toEqual({ ...before, selected: undefined });
  await page.locator(".brand").hover();
  await expect(page.locator(".map-highlight")).toHaveCount(0);
  await row.focus();
  await expect(page.locator(".map-highlight")).toBeVisible();
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await page.locator(".today-work .work-card-head").click();
  await page.getByRole("button", { name: "About today's work", exact: true }).click();
  await expect(page.locator(".tasks")).toBeVisible();
  await page.getByRole("button", { name: "Show on map", exact: true }).click();
  await expect(page.locator(".tasks")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__uhs.selected)).toBeUndefined();
  await expect(page.getByRole("button", { name: "Clear destination", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear destination", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__uhs.guide)).toBeUndefined();
  expect(await page.evaluate(() => (window as any).__uhs.selected)).toBeUndefined();
  expect(await page.evaluate(() => ({ ...(window as any).__uhs.engine.state.player.pos }))).toEqual(before.pos);
  await page.getByRole("tab", { name: "Inventory", exact: true }).click();
  await page.evaluate(() => { const r = (window as any).__uhs; r.engine.state.player.inventory = {}; r.emit(); });
  await expect(page.getByRole("heading", { name: "Travelling light" })).toBeVisible();
  await page.getByRole("button", { name: "Look nearby", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Nearby", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.evaluate(() => { const r = (window as any).__uhs; r.engine.nearby = () => []; r.emit(false); });
  await expect(page.getByRole("heading", { name: "A quiet stretch of the world" })).toBeVisible();
  await page.getByRole("button", { name: "People only", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No one within earshot" })).toBeVisible();
  await page.getByRole("button", { name: "Look for things nearby", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A quiet stretch of the world" })).toBeVisible();
  await page.evaluate(() => { const r = (window as any).__uhs; r.dayGoals = () => []; r.emit(false); });
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The day is yours" })).toBeVisible();

});

test("notifications pause for reading, refresh repeated messages, and can be dismissed", async ({ page }) => {
  await page.goto("/character-lab");
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await page.evaluate(async () => {
    const { createRoot } = (await import("/node_modules/.vite/deps/react-dom_client.js" as string)).default;
    const { createElement } = (await import("/node_modules/.vite/deps/react.js" as string)).default;
    const { Toasts } = await import("/src/ui/Toasts.tsx" as string);
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0;z-index:100;background:#101626";
    document.body.append(host);
    const root = createRoot(host), w = window as any;
    w.toastEvents = [];
    w.toastOmit = [];
    w.renderToasts = () => root.render(createElement(Toasts, { events: [...w.toastEvents], omit: w.toastOmit, onHistory: () => { w.historyOpened = true; } }));
    w.addToast = (id: number, text: string) => {
      w.toastEvents.push({ id, time: 0, kind: "action", text });
      w.renderToasts();
    };
    w.renderToasts();
  });
  await page.clock.runFor(16);
  await page.evaluate(() => (window as any).addToast(1, "You picked up a branch."));
  await page.clock.runFor(16);
  const toast = page.locator(".toast");
  await expect(toast).toHaveCount(1);
  await page.clock.runFor(3000);
  await toast.hover();
  await page.clock.runFor(7000);
  await expect(toast).toHaveCount(1);
  await page.mouse.move(1200, 900);
  await page.clock.runFor(800);
  await page.evaluate(() => (window as any).addToast(2, "You picked up a branch."));
  await page.clock.runFor(16);
  await expect(page.locator(".toast-count")).toHaveText("×2");
  await page.clock.runFor(1800);
  await expect(toast).toHaveCount(1);
  await page.getByRole("button", { name: "Recent events", exact: true }).click();
  expect(await page.evaluate(() => (window as any).historyOpened)).toBe(true);
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  await page.clock.runFor(240);
  await expect(toast).toHaveCount(0);
  await page.evaluate(() => (window as any).addToast(3, "You gathered some firewood."));
  await page.clock.runFor(16);
  await page.mouse.move(1200, 900);
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).blur();
  await page.clock.runFor(4700);
  await expect(toast).toHaveCount(0);
  await page.evaluate(() => (window as any).addToast(4, "You finished your work."));
  await page.clock.runFor(16);
  await expect(toast).toHaveCount(1);
  await page.evaluate(() => { const w = window as any; w.toastOmit = ["You finished your work."]; w.renderToasts(); });
  await page.clock.runFor(16);
  await expect(toast).toHaveCount(0);
  await page.evaluate(() => { const w = window as any; w.toastOmit = []; w.renderToasts(); });
  await page.clock.runFor(16);
  await expect(toast).toHaveCount(0);
});

test("a walking NPC stays beside the player while the conversation is open", async ({ page }) => {
  await page.route("**/api/dialogue", (route) => route.fulfill({ json: { text: "Hello there.", regard: 0 } }));
  await page.goto("/?start=A%20Roman%20baker%20in%20Ostia%2C%20100%20CE&seed=talk-routine");
  await page.locator("#opening-prompt").fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const confirm = page.getByRole("dialog").getByRole("button", { name: "Begin", exact: true });
  await confirm.or(page.locator(".arrival")).waitFor({ state: "visible", timeout: 30000 });
  if (await confirm.isVisible()) await confirm.click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 40000 });
  await page.getByRole("button", { name: /Begin your day/ }).click();
  const start = await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    r.stop();
    r.ambientRate = 0;
    e.state.plot = undefined;
    const actor = e.state.actors.find((a: any) => a.kind === "human" && !a.dead);
    const pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    Object.assign(actor, { pos, offRoutine: false, hunger: 0, task: undefined, errand: undefined, terror: undefined, mount: undefined });
    const routine = { start: e.state.clock / 60, period: 10, segments: [{ from: 0, to: 10, pos,
      path: Array.from({ length: 100 }, (_, i) => ({ x: pos.x + i, y: pos.y })), activity: "work", label: "Walking" }] };
    const itinerary = e.world.itinerary?.bind(e.world);
    e.world.itinerary = (id: string) => id === actor.id ? routine : itinerary?.(id);
    const pending = e.world.routinePending?.bind(e.world);
    e.world.routinePending = (id: string) => id === actor.id ? false : pending?.(id);
    r.emit();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "q", bubbles: true }));
    return { id: actor.id, pos };
  });
  const conversation = page.getByRole("dialog", { name: /Conversation with/ });
  await expect(conversation).toBeVisible();
  const result = await page.evaluate(({ id }) => {
    const r = (window as any).__uhs, e = r.engine;
    const scene = (window as any).uhsGame.scene.getScene("world");
    const actor = e.state.actors.find((a: any) => a.id === id);
    const image = scene.entities.get(id);
    const before = { x: image.x, y: image.y };
    scene.moveAmbient(e.state.clock + 120);
    const after = { x: image.x, y: image.y };
    for (const seconds of [1, 6, 90]) r.command({ type: "pass", seconds });
    return { before, after, pos: actor.pos, conversing: e.conversing,
      walkedOff: e.state.events.some((event: any) => event.text.includes("calls after you")) };
  }, start);
  expect(Math.hypot(result.after.x - result.before.x, result.after.y - result.before.y)).toBeLessThanOrEqual(2);
  expect(result.pos).toEqual(start.pos);
  expect(result.conversing).toBe(start.id);
  expect(result.walkedOff).toBe(false);
  await expect(conversation).toBeVisible();
});

test("walking indoors does not replay an earlier swing", async ({ page }) => {
  await page.goto("/?start=A%20Roman%20baker%20in%20Ostia%2C%20100%20CE&seed=indoor-swing");
  await page.locator("#opening-prompt").fill("A Roman baker in Ostia, 100 CE");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const confirm = page.getByRole("dialog").getByRole("button", { name: "Begin", exact: true });
  await confirm.or(page.locator(".arrival")).waitFor({ state: "visible", timeout: 30000 });
  if (await confirm.isVisible()) await confirm.click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  await expect(page.locator(".game-container canvas")).toHaveAttribute("data-ready", "true", { timeout: 40000 });
  await page.getByRole("button", { name: /Begin your day/ }).click();
  await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    r.stop();
    r.ambientRate = 0;
    e.state.plot = undefined;
    const home = e.state.households.find((h: any) => h.members.includes("player"));
    const place = e.world.place(home.residence);
    e.state.player.pos = { ...place.entrance, space: "outside" };
    if (r.command({ type: "interact", target: place.id, action: "enter" }).status !== "completed") throw Error("Could not enter home");
  });
  await page.waitForFunction(() => !!(window as any).uhsGame.scene.getScene("world").roomView);
  await page.evaluate(async () => {
    const r = (window as any).__uhs, scene = (window as any).uhsGame.scene.getScene("world");
    const modulePath = "/src/render/combat-effects.ts";
    const { CombatEffects } = await import(modulePath);
    const sweep = CombatEffects.prototype.sweep;
    (window as any).indoorSwings = 0;
    CombatEffects.prototype.sweep = function (...args: any[]) {
      (window as any).indoorSwings++;
      return sweep.apply(this, args);
    };
    r.command({ type: "stow" });
    r.command({ type: "swing", power: 1 });
    scene.combat().consume(r.swingEffect);
  });
  await page.waitForFunction(() => (window as any).indoorSwings === 1);
  const until = await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine, scene = (window as any).uhsGame.scene.getScene("world");
    for (let n = 0; n < 4; n++) {
      const p = e.state.player.pos;
      const step = [[1, 0], [0, 1], [-1, 0], [0, -1]].find(([dx, dy]) => !e.blocked(p.x + dx, p.y + dy, p.space) && !e.actorAt({ ...p, x: p.x + dx, y: p.y + dy }));
      if (!step) throw Error("No room to walk");
      if (r.command({ type: "move", dx: step[0], dy: step[1] }).status !== "completed") throw Error("Could not walk");
      scene.combat().consume(r.swingEffect);
    }
    return scene.time.now + 500;
  });
  await page.waitForFunction((until) => (window as any).uhsGame.scene.getScene("world").time.now > until, until);
  expect(await page.evaluate(() => (window as any).indoorSwings)).toBe(1);
});
