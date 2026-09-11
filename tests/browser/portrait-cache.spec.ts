import { test, expect } from "@playwright/test";

test("portraits reuse pixels across cloned observations and refresh changed appearances", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const reactPath = "/node_modules/.vite/deps/react.js";
    const domPath = "/node_modules/.vite/deps/react-dom_client.js";
    const componentPath = "/src/ui/CharacterSprite.tsx";
    const characterPath = "/src/core/character.ts";
    const { createElement } = (await import(reactPath)).default;
    const { createRoot } = (await import(domPath)).default;
    const { CharacterSprite } = await import(componentPath);
    const { generateAppearance } = await import(characterPath);
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const original = CanvasRenderingContext2D.prototype.getImageData;
    let reads = 0;
    CanvasRenderingContext2D.prototype.getImageData = function (
      ...args: Parameters<typeof original>
    ) {
      if (this.canvas.width === 80 && this.canvas.height === 80) reads++;
      return original.apply(this, args);
    };
    const appearance = generateAppearance("portrait-cache-check", 0, 35);
    const render = async (
      value: typeof appearance,
      portrait = false,
      key = "first",
    ) => {
      root.render(
        createElement(CharacterSprite, { appearance: value, portrait, key }),
      );
      await new Promise((r) => setTimeout(r, 100));
      return host.querySelector("canvas")!.toDataURL();
    };
    try {
      const first = await render(appearance);
      const initialReads = reads;
      const clone = await render(structuredClone(appearance));
      const remount = await render(
        structuredClone(appearance),
        false,
        "second",
      );
      await render(structuredClone(appearance), true, "second");
      const restored = await render(
        structuredClone(appearance),
        false,
        "second",
      );
      const cachedReads = reads;
      const changed = await render(
        { ...appearance, skin: "#ff00ff" },
        false,
        "second",
      );
      return {
        first,
        clone,
        remount,
        restored,
        changed,
        initialReads,
        cachedReads,
        changedReads: reads,
      };
    } finally {
      root.unmount();
      host.remove();
      CanvasRenderingContext2D.prototype.getImageData = original;
    }
  });
  expect(result.initialReads).toBe(1);
  expect(result.cachedReads).toBe(1);
  expect(result.changedReads).toBe(2);
  expect(result.clone).toBe(result.first);
  expect(result.remount).toBe(result.first);
  expect(result.restored).toBe(result.first);
  expect(result.changed).not.toBe(result.first);
});
