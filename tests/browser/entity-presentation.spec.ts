import { expect, test } from "@playwright/test";

test("wide-view entities remain drawn across sight boundaries and NPC steps are staggered", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const result = await page.evaluate(async () => {
    const w = window as any,
      runtime = w.__uhs,
      engine = runtime.engine;
    const path = performance
      .getEntriesByType("resource")
      .find((r) => r.name.includes("/src/render/WorldScene.ts"))!.name;
    const { WorldScene } = await import(/* @vite-ignore */ path);
    let scene: any;
    const draw = WorldScene.prototype.draw;
    WorldScene.prototype.draw = function () {
      scene = this;
      draw.call(this);
    };
    runtime.emit();
    WorldScene.prototype.draw = draw;
    const p = engine.state.player.pos;
    const template = engine.state.actors.find((a: any) => a.kind === "human");
    const actors = Array.from({ length: 6 }, (_, i) => ({
      ...structuredClone(template),
      id: `presentation-${i}`,
      pos: { ...p, x: p.x + 20, y: p.y + i },
    }));
    const object = {
      ...structuredClone(engine.state.objects[0]),
      id: "presentation-object",
      pos: { ...p, x: p.x + 24 },
    };
    engine.state.actors = [
      ...actors,
      {
        ...structuredClone(template),
        id: "other-room",
        pos: { ...p, space: "other-room" },
      },
    ];
    engine.state.objects = [object];
    runtime.setZoom(1);
    runtime.emit();
    const image = scene.entities.get(actors[0].id);
    const rendered =
      actors.every((a) => scene.entities.has(a.id)) &&
      scene.entities.has(object.id);
    const unseen = !engine
      .observe()
      .actors.some((a: any) => a.id === actors[0].id);
    const otherRoomHidden = !scene.entities.has("other-room");
    p.x += 2;
    runtime.emit();
    p.x -= 2;
    runtime.emit();
    const retained = scene.entities.get(actors[0].id) === image && image.active;
    runtime.setZoom(4);
    const culled = !scene.entities.has(actors[0].id);
    runtime.setZoom(1);
    const restored = scene.entities.has(actors[0].id);
    const starts = actors.map((a) => scene.entities.get(a.id).x);
    for (const a of actors) a.pos.x++;
    runtime.emit();
    const hash = engine.hash();
    await new Promise((r) => setTimeout(r, 300));
    const deltas = actors.map((a, i) => scene.entities.get(a.id).x - starts[i]);
    await new Promise((r) => setTimeout(r, 650));
    const ends = actors.map((a, i) => scene.entities.get(a.id).x - starts[i]);
    return {
      rendered,
      unseen,
      otherRoomHidden,
      retained,
      culled,
      restored,
      deltas,
      ends,
      unchanged: engine.hash() === hash,
    };
  });
  expect(result.rendered).toBe(true);
  expect(result.unseen).toBe(true);
  expect(result.otherRoomHidden).toBe(true);
  expect(result.retained).toBe(true);
  expect(result.culled).toBe(true);
  expect(result.restored).toBe(true);
  expect(new Set(result.deltas.map((d) => Math.round(d))).size).toBeGreaterThan(
    2,
  );
  expect(result.ends.every((d) => d === 16)).toBe(true);
  expect(result.unchanged).toBe(true);
  expect(errors).toEqual([]);
});
