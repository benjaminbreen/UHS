import { test, expect } from "@playwright/test";
import { captureErrors } from "../../scripts/capture/lib";

test("review captures fail on uncaught browser errors", async ({ page }) => {
  const assertHealthy = captureErrors(page);
  assertHealthy();
  await Promise.all([
    page.waitForEvent("pageerror"),
    page.evaluate(() => { setTimeout(() => { throw Error("capture regression"); }, 0); }),
  ]);
  expect(assertHealthy).toThrow("capture regression");
});

/** The approach cell for a door, the way src/core/doors.ts computes it. */
const APPROACH = `(place, d) => {
  const dx = d.pos.x - (place.x + (place.w - 1) / 2),
    dy = d.pos.y - (place.y + (place.h - 1) / 2);
  return Math.abs(dx) > Math.abs(dy)
    ? { x: d.pos.x + Math.sign(dx), y: d.pos.y }
    : { x: d.pos.x, y: d.pos.y + Math.sign(dy) };
}`;

test("a door is solid until it is opened, and the leaf follows it", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?start=Farmer%20in%20Seoul%201750&seed=doors-regression");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 120_000,
  });
  await expect
    .poll(() => canvas.getAttribute("data-doors"), { timeout: 20_000 })
    .toMatch(/\/[1-9]/);
  await page.getByRole("button", { name: /^(Begin your day|Continue)$/ }).click({ timeout: 30000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // The player's own household: its door must answer them.
  const door = await page.evaluate(() => {
    const r = (window as any).__uhs,
      e = r.engine,
      p = e.state.player;
    const place = e.world.places.find((q: any) => {
      const d = e.doorOf(q.id);
      return (
        d &&
        !d.open &&
        e.doorVerdict(q, "player") === "open"
      );
    });
    if (!place) throw Error("No door the player may open");
    const d = e.doorOf(place.id);
    // Stand outside the door itself, which is not always the lot's entrance.
    const dx = d.pos.x - (place.x + (place.w - 1) / 2),
      dy = d.pos.y - (place.y + (place.h - 1) / 2);
    p.pos =
      Math.abs(dx) > Math.abs(dy)
        ? { x: d.pos.x + Math.sign(dx), y: d.pos.y, space: "outside" }
        : { x: d.pos.x, y: d.pos.y + Math.sign(dy), space: "outside" };
    // Face the wall the door is in.
    p.direction =
      d.pos.y < p.pos.y ? 0 : d.pos.x > p.pos.x ? 1 : d.pos.y > p.pos.y ? 2 : 3;
    // Talk outranks the door; keep this fixture's approach clear of neighbours.
    e.state.actors = e.state.actors.filter((a: any) =>
      a.pos.space !== "outside" || Math.max(Math.abs(a.pos.x - p.pos.x), Math.abs(a.pos.y - p.pos.y)) > 3);
    r.emit();
    return { id: d.id, place: place.id, x: d.pos.x, y: d.pos.y };
  });

  // Shut, it is a wall.
  expect(
    await page.evaluate(
      (d) => (window as any).__uhs.engine.blocked(d.x, d.y, "outside"),
      door,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as any).__uhs.verbs().primary.label),
  ).toMatch(/Open the door/);
  await page.locator(".game-container").focus();
  await page.keyboard.press("KeyF");
  await expect.poll(() => page.evaluate((place) => {
    const view = (window as any).uhsGame.scene.getScene("world").doors.get(place);
    return { open: (window as any).__uhs.engine.doorOf(place)?.open, openness: view?.openness };
  }, door.place)).toEqual({ open: true, openness: 1 });
  expect(
    await page.evaluate(
      (d) => (window as any).__uhs.engine.blocked(d.x, d.y, "outside"),
      door,
    ),
  ).toBe(false);
  // And the open door is now the way in.
  expect(
    await page.evaluate(() => (window as any).__uhs.verbs().primary.label),
  ).toMatch(/Enter|Climb/i);
  expect(errors).toEqual([]);
});

test("knocking runs, and an open door is walked through", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?start=Farmer%20in%20Seoul%201750&seed=doors-regression");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await page.getByRole("button", { name: /Enter life/ }).click({ timeout: 120000 });
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 120_000,
  });

  // Knocking has to survive the command schema, not just the engine.
  await page.getByRole("button", { name: /^(Begin your day|Continue)$/ }).click({ timeout: 30000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const knocked = await page.evaluate((APPROACH) => {
    const r = (window as any).__uhs,
      e = r.engine;
    const place = e.world.places.find(
      (q: any) => e.doorOf(q.id) && !e.doorOf(q.id).open,
    ) ?? e.world.places.find((q: any) => e.doorOf(q.id));
    if (!place) throw Error("No door in the test world");
    const d = e.doorOf(place.id);
    d.open = false;
    const at = eval(APPROACH)(place, d);
    e.state.player.pos = { ...at, space: "outside" };
    r.emit();
    const label = r.doorVerb()?.label ?? "";
    const before = e.state.events.length;
    // Through the session, so the command schema is exercised too.
    r.command(r.doorVerb()!.command);
    return {
      label,
      notice: r.notice,
      said: e.state.events.slice(before).map((v: any) => v.text),
    };
  }, APPROACH);
  expect(knocked.label).toMatch(/Knock at|Open the door/);
  expect(knocked.notice).not.toMatch(/not supported/);
  expect(knocked.said.join(" ")).toMatch(
    /Nobody answers|opens the door|go away|daylight|You open the door/,
  );

  // An open door is a way in: walk onto it and you are inside.
  const inside = await page.evaluate((APPROACH) => {
    const r = (window as any).__uhs,
      e = r.engine;
    const place = e.world.places.find((q: any) => e.doorOf(q.id)?.open);
    if (!place) throw Error("No door stands open");
    const d = e.doorOf(place.id);
    const at = eval(APPROACH)(place, d);
    e.state.player.pos = { ...at, space: "outside" };
    r.command({ type: "move", dx: d.pos.x - at.x, dy: d.pos.y - at.y });
    const space = e.state.player.pos.space;
    return { space, place: place.id };
  }, APPROACH);
  expect(inside.space).toBe(inside.place);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as any).uhsGame.scene.getScene("world");
    return scene.roomView?.space === (window as any).__uhs.engine.state.player.pos.space && !scene.fadingOut;
  })).toBe(true);
  const back = await page.evaluate(() => {
    const r = (window as any).__uhs, e = r.engine;
    const scene = (window as any).uhsGame.scene.getScene("world");
    const camera = scene.cameras.main;
    const bounds = camera.getBounds();
    // Movement redraws must keep the room's centered bounds between frames.
    const p = e.state.player.pos;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
      if (e.blocked(p.x + dx, p.y + dy, p.space)) continue;
      r.command({ type: "move", dx, dy });
      scene.draw();
      const current = camera.getBounds();
      if (!camera.useBounds || current.x !== bounds.x || current.y !== bounds.y || current.width !== bounds.width || current.height !== bounds.height)
        throw Error("Interior movement reset the centered camera bounds");
      r.command({ type: "move", dx: -dx, dy: -dy });
      break;
    }
    // And back out through the exit every interior is built with.
    const exit = e.state.objects.find(
      (o: any) => o.kind === "exit" && o.pos.space === e.state.player.pos.space,
    );
    const at = e.state.player.pos;
    if (exit)
      r.command({ type: "move", dx: exit.pos.x - at.x, dy: exit.pos.y - at.y });
    return e.state.player.pos.space;
  });
  expect(back).toBe("outside");
  expect(errors).toEqual([]);
});
