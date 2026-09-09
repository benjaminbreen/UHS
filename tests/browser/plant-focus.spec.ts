import { test, expect } from "@playwright/test";
for (const tree of [false, true])
  test(`clicking ${tree ? "a tree" : "a shrub"} focuses its sprite and name without walking`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto(
      "/terrain-lab?ecology=temperate-woodland&population=none&start=wanderer&landform=plain&water=none&seed=virginia-density",
    );
    await expect(
      page.getByRole("button", { name: "Play this world →" }),
    ).toBeEnabled({ timeout: 75000 });
    await page.evaluate(async () => {
      const { WorldScene } = await import(
        /* @vite-ignore */ "/src/render/WorldScene.ts" as string
      );
      const create = WorldScene.prototype.create;
      WorldScene.prototype.create = function () {
        create.call(this);
        (window as any).testWorldScene = this;
      };
    });
    await page.getByRole("button", { name: "Play this world →" }).click();
    await page.waitForFunction(() => !!(window as any).__uhs);
    await page.waitForTimeout(1500);
    const target = await page.evaluate(async (tree) => {
      const s = (window as any).testWorldScene;
      const rt = s.runtime;
      const plants = s.children.list.filter(
        (o: any) =>
          o.input &&
          o.texture?.key === "nature" &&
          (tree
            ? !o.frame.name.includes("understory") &&
              !o.frame.name.includes("scrub")
            : o.frame.name.includes("understory")) &&
          rt.engine.inspect(
            `decor-${Math.round((o.x - 8) / 16)}-${Math.round((o.y + s.lift(o.x, o.y) - 16) / 16)}`,
          ),
      );
      for (const plant of plants) {
        for (let y = Math.floor(plant.height * 0.35); y < plant.height; y++) {
          for (let x = 0; x < plant.width; x++) {
            if (
              s.textures.getPixelAlpha(
                x,
                y,
                plant.texture.key,
                plant.frame.name,
              ) < 200
            )
              continue;
            const wx = plant.x - plant.width / 2 + x + 0.5,
              wy = plant.y - plant.height + y + 0.5;
            const covered = s.children.list.some(
              (o: any) =>
                o !== plant &&
                o.input &&
                o.depth >= plant.depth &&
                o.texture &&
                s.textures.getPixelAlpha(
                  Math.floor(wx - o.x + o.width * o.originX),
                  Math.floor(wy - o.y + o.height * o.originY),
                  o.texture.key,
                  o.frame.name,
                ) > 0,
            );
            if (covered) continue;
            const camera = s.cameras.main;
            camera.stopFollow();
            camera.centerOn(plant.x, plant.y - plant.height / 2);
            return {
              wx,
              wy,
              frame: plant.frame.name,
              clock: rt.engine.state.clock,
            };
          }
        }
      }
      throw Error("No unobscured plant pixel found");
    }, tree);
    await page.waitForTimeout(100);
    const screen = await page.evaluate(async ({ wx, wy }) => {
      const s = (window as any).testWorldScene,
        g = s.game,
        c = s.cameras.main;
      const r = g.canvas.getBoundingClientRect();
      return {
        x: r.left + c.x + (wx - c.worldView.x) * c.zoom,
        y: r.top + c.y + (wy - c.worldView.y) * c.zoom,
      };
    }, target);
    await page.mouse.click(screen.x, screen.y);
    await expect(page.locator(".focus-card")).toBeVisible();
    const state = await page.evaluate(() => {
      const rt = (window as any).__uhs;
      return {
        selection: rt.getSnapshot().selection,
        clock: rt.engine.state.clock,
        route: rt.route.length,
      };
    });
    expect(state.selection.kind).toBe("vegetation");
    expect(state.selection.sprite).toBe(target.frame);
    expect(state.clock).toBe(target.clock);
    expect(state.route).toBe(0);
    await expect(page.locator(".focus-card h2")).toHaveText(
      state.selection.name,
    );
    await expect(page.locator(".focus-thumbnail")).toBeVisible();
    await page.screenshot({
      path: `artifacts/nature-lab/plant-focus-${tree ? "tree" : "shrub"}.png`,
    });
  });
