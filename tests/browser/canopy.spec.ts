import { test, expect } from "@playwright/test";
test("large native crowns fade over the player while trunks remain opaque", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto(
    "/terrain-lab?ecology=tropical-woodland&population=none&start=wanderer&landform=plain&water=none&seed=composition-01",
  );
  await expect(
    page.getByRole("button", { name: "Play this world →" }),
  ).toBeEnabled({ timeout: 75000 });
  const result = await page.evaluate(() => {
    const s = (window as any).terrainLab.scene;
    const player = s.entities.get("player");
    const entry =
      s.canopies.find(
        (c: any) => c.image.frame.name === "nature-broadleaf-mature",
      ) ?? s.canopies[0];
    const tree = entry.image;
    const old = { x: player.x, y: player.y };
    player.setPosition(tree.x, tree.y - tree.height * 0.45);
    for (let i = 0; i < 20; i++) s.update(0);
    const faded = tree.alpha;
    const trunk = s.children.list.find(
      (o: any) =>
        o !== tree &&
        o.texture?.key === "nature" &&
        o.frame.name === tree.frame.name &&
        o.x === tree.x &&
        o.y === tree.y,
    );
    player.setPosition(old.x, tree.y + 50);
    for (let i = 0; i < 20; i++) s.update(0);
    const restored = tree.alpha;
    player.setPosition(old.x, old.y);
    return {
      faded,
      restored,
      trunk: trunk?.alpha,
      scaleX: tree.scaleX,
      scaleY: tree.scaleY,
    };
  });
  expect(result.faded).toBeLessThan(0.4);
  expect(result.restored).toBe(1);
  expect(result.trunk).toBe(1);
  expect(result.scaleX).toBe(1);
  expect(result.scaleY).toBe(1);
  await page.screenshot({
    path: "artifacts/nature-lab/composition-tropical.png",
  });
});
