import { test, expect } from "@playwright/test";
for (const [query, pattern] of [
  ["Medieval Normandy", "roadside"],
  ["Renaissance Florence weaver", "dense"],
  ["Hellenistic Alexandria", "waterfront"],
  ["Ancient Rome", "planned"],
  ["Neolithic Anatolia", "clustered"],
  ["19th century Haiti farmer", "farmstead"],
] as const) {
  test(`${pattern} settlement renders and enters an owned household`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New world", exact: true }).click();
    await page.getByLabel("Describe your starting situation").fill(query);
    await page.getByLabel("Settlement layout").selectOption(pattern);
    await page
      .getByRole("button", { name: "Enter this world", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).__uhs?.engine.state.manifest.generator,
        ),
      )
      .toBe(3);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `artifacts/settlement-${pattern}.png` });
    const result = await page.evaluate(async () => {
      const w = window as any;
      const modulePath = performance
        .getEntriesByType("resource")
        .find((e) => e.name.includes("/src/render/WorldScene.ts"))!.name;
      const { WorldScene } = await import(/* @vite-ignore */ modulePath);
      let scene: any;
      const draw = WorldScene.prototype.draw;
      WorldScene.prototype.draw = function () {
        scene = this;
        draw.call(this);
      };
      w.__uhs.emit();
      WorldScene.prototype.draw = draw;
      const playerImage = scene.entities.get("player");
      const rt = (window as any).__uhs,
        e = rt.engine,
        b = e.world.places.find((p: any) => p.owner === "player");
      if (!b) return null;
      const r = e.findRoute(e.state.player.pos, b.entrance);
      rt.walkTo(b.entrance);
      for (let i = 0; i < 250 && rt.running; i++) rt.tick();
      const entry = rt.command({
        type: "interact",
        target: b.id,
        action: "enter",
      });
      return {
        entered: entry?.status,
        interior: e.state.player.pos.space === b.id,
        playerVisible:
          playerImage.visible &&
          playerImage.alpha > 0 &&
          playerImage.frame.name !== "__MISSING",
        status: r.status,
        sprite: b.sprite,
        count: e.world.places.length,
        fields: e.state.objects.filter((o: any) => o.kind === "crop").length,
      };
    });
    expect(result?.status).toBe("found");
    expect(result?.playerVisible).toBe(true);
    expect(result?.entered).toBe("completed");
    expect(result?.interior).toBe(true);
    expect(result!.count).toBeGreaterThan(3);
    if (pattern === "farmstead") {
      await page.evaluate(() => {
        const rt = (window as any).__uhs,
          e = rt.engine;
        rt.command({
          type: "interact",
          target: `${e.state.player.pos.space}-exit`,
          action: "exit",
        });
        const gate = e.state.objects.find((o: any) => o.kind === "gate");
        rt.walkTo({ x: gate.pos.x, y: gate.pos.y + 1 });
        for (let i = 0; i < 300 && rt.running; i++) rt.tick();
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: "artifacts/settlement-pens.png" });
    }
  });
}
