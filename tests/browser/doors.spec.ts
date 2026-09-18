import { test, expect } from "@playwright/test";

const openCount = (page: import("@playwright/test").Page) =>
  page
    .locator(".game-container canvas")
    .getAttribute("data-doors")
    .then((v) => Number((v ?? "0/0").split("/")[0]));

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
  await page.goto("/");
  // A fixed opening: a random start can land somewhere with no buildings.
  await page.getByRole("button", { name: "More info", exact: true }).click();
  await page.getByRole("button", { name: /Korean farmer/ }).click();
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 120_000,
  });
  await expect
    .poll(() => canvas.getAttribute("data-doors"), { timeout: 20_000 })
    .toMatch(/\/[1-9]/);
  // Shops and a minority of houses stand open from the start.
  const standing = await openCount(page);

  // The player's own household: its door must answer them.
  const door = await page.evaluate(() => {
    const r = (window as any).__uhs,
      e = r.engine,
      p = e.state.player;
    // Talk outranks the door, so the doorstep has to be clear of neighbours.
    const place = e.world.places.find((q: any) => {
      const d = e.doorOf(q.id);
      return (
        d &&
        !d.open &&
        e.doorVerdict(q, "player") === "open" &&
        !e.state.actors.some(
          (a: any) =>
            a.pos.space === "outside" &&
            Math.abs(a.pos.x - q.x) < q.w + 3 &&
            Math.abs(a.pos.y - q.y) < q.h + 3,
        )
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
  await page.screenshot({ path: "artifacts/doors/shut.png" });

  await page.locator(".game-container").focus();
  await page.keyboard.press("KeyF");
  await expect.poll(() => openCount(page)).toBeGreaterThan(standing);
  expect(
    await page.evaluate(
      (d) => (window as any).__uhs.engine.blocked(d.x, d.y, "outside"),
      door,
    ),
  ).toBe(false);
  await page.screenshot({ path: "artifacts/doors/open.png" });

  // And the open door is now the way in.
  expect(
    await page.evaluate(() => (window as any).__uhs.verbs().primary.label),
  ).toMatch(/Enter|Climb/i);
  expect(errors).toEqual([]);
});

test("knocking runs, and an open door is walked through", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "More info", exact: true }).click();
  await page.getByRole("button", { name: /Korean farmer/ }).click();
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 120_000,
  });

  // Knocking has to survive the command schema, not just the engine.
  const knocked = await page.evaluate((APPROACH) => {
    const r = (window as any).__uhs,
      e = r.engine;
    const place = e.world.places.find(
      (q: any) => e.doorOf(q.id) && !e.doorOf(q.id).open,
    );
    if (!place) throw Error("Every door is open");
    const d = e.doorOf(place.id);
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
    // And back out through the exit every interior is built with.
    const exit = e.state.objects.find(
      (o: any) => o.kind === "exit" && o.pos.space === space,
    );
    const p = e.state.player.pos;
    if (exit)
      r.command({ type: "move", dx: exit.pos.x - p.x, dy: exit.pos.y - p.y });
    return { space, place: place.id, back: e.state.player.pos.space };
  }, APPROACH);
  expect(inside.space).toBe(inside.place);
  expect(inside.back).toBe("outside");
  expect(errors).toEqual([]);
});
