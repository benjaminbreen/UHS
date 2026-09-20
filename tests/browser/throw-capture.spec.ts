import { expect, test } from "@playwright/test";
import type { Runtime } from "../../src/runtime/session";

/** Review capture: a wide swing that lands, an aimed stone, a thrown spear. */
test("captures a landed spin and aimed throws", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.UHS_URL ?? "/");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  const canvas = page.locator(".game-container canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", {
    timeout: 75000,
  });
  const box = (await canvas.boundingBox())!;
  const clip = {
    x: box.x + box.width / 2 - 230,
    y: box.y + box.height / 2 - 150,
    width: 460,
    height: 300,
  };
  const shots = async (name: string, n: number, gap = 0) => {
    for (let i = 0; i < n; i++) {
      await page.screenshot({
        path: `artifacts/combat/${name}-${i}.png`,
        clip,
      });
      if (gap) await page.waitForTimeout(gap);
    }
  };
  const place = (species: string, cells: number[][], arm: string) =>
    page.evaluate(
      ([species, cells, arm]) => {
        const rt = (window as unknown as { uhs: Runtime }).uhs;
        const e = rt.engine,
          p = e.state.player;
        p.direction = 1;
        rt.devClearFauna();
        rt.devArm(arm as string);
        rt.devSpawnFauna(
          species as string,
          (cells as number[][]).length,
          "strong",
        );
        const g = e.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
        (cells as number[][]).forEach(([dx, dy], i) => {
          g.members[i].x = p.pos.x + dx;
          g.members[i].y = p.pos.y + dy;
        });
        rt.emit();
      },
      [species, cells, arm] as const,
    );
  await page.locator(".game-container").focus();

  // Wind up with nothing in reach, then have boar close in before release.
  await place(
    "wild-boar",
    [
      [6, 0],
      [-6, 0],
      [0, 6],
    ],
    "axe",
  );
  await page.keyboard.down("f");
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const rt = (window as unknown as { uhs: Runtime }).uhs;
    const p = rt.engine.state.player.pos;
    const g = rt.engine.state.fauna!.find((g) => g.id.startsWith("dev-"))!;
    [
      [1, 0],
      [-1, 0],
      [0, 1],
    ].forEach(([dx, dy], i) => {
      g.members[i].x = p.x + dx;
      g.members[i].y = p.y + dy;
    });
    rt.emit();
  });
  await page.keyboard.up("f");
  await shots("spinhit", 8);
  const spin = await page.evaluate(() => {
    const s = (window as unknown as { uhs: Runtime }).uhs.engine.lastSwing;
    return { power: s?.power, hits: s?.creatures.length };
  });
  expect(spin).toEqual({ power: 2, hits: 3 });

  // An aimed stone at a rabbit five cells off.
  await place("rabbit", [[5, 0]], "item:pebble");
  await page.keyboard.down("x");
  await page.waitForTimeout(450);
  await page.screenshot({ path: "artifacts/combat/stone-aim-0.png", clip });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "artifacts/combat/stone-aim-1.png", clip });
  await page.keyboard.up("x");
  await shots("stone", 8);
  expect(
    await page.evaluate(
      () =>
        !!(window as unknown as { uhs: Runtime }).uhs.engine.lastThrow
          ?.creature,
    ),
  ).toBe(true);

  // A spear at a deer.
  await place("red-deer", [[7, 0]], "spear");
  await page.keyboard.down("x");
  await page.waitForTimeout(1000);
  await page.keyboard.up("x");
  await shots("spear", 6);
  expect(errors).toEqual([]);
});
