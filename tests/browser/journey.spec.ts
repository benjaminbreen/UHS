import { test, expect, type Page } from "@playwright/test";
import { createSession } from "../../src/runtime/session";
async function ready(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Gaius", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".game-container canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
}
async function observe(page: Page) {
  return page.evaluate(() => (window as any).historySim.observe());
}
test("walk, trade, inventory, notebook, and save/reload through the interface", async ({
  page,
}) => {
  await ready(page);
  const start = await observe(page);
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => (await observe(page)).revision)
    .toBeGreaterThan(start.revision);
  await page.locator(".nearby-list button").first().click();
  const closer = page.getByRole("button", { name: "Walk closer", exact: true });
  if (await closer.isVisible()) {
    await closer.click();
    await expect(
      page.locator(".context-actions button").filter({ hasText: "Talk" }),
    ).toBeEnabled({ timeout: 15000 });
  }
  await page
    .locator(".context-actions button")
    .filter({ hasText: "Talk" })
    .click();
  await expect(page.locator(".event-strip")).toContainText("may visit");
  const before = await observe(page);
  await page
    .locator(".context-actions button")
    .filter({ hasText: "Trade" })
    .click();
  await expect(page.locator(".event-strip")).toContainText("accepts");
  const after = await observe(page);
  expect(after.player.inventory.bread).toBe(before.player.inventory.bread + 1);
  expect(after.player.inventory.coin).toBe(before.player.inventory.coin - 2);
  await page
    .getByRole("button", { name: "Inventory", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "What you carry" }),
  ).toBeVisible();
  const clock = after.clock;
  await page.getByRole("button", { name: "Eat", exact: true }).first().click();
  expect((await observe(page)).clock).toBe(clock + 60);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Notebook", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Notebook entry" })
    .fill("The trade changed both inventories.");
  await page.getByRole("button", { name: "Save observation" }).click();
  await expect(page.locator(".saved-note")).toContainText("both inventories");
  await page.getByRole("button", { name: "Close dialog" }).click();
  const expected = await observe(page);
  await page.waitForTimeout(300);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Gaius", exact: true }),
  ).toBeVisible();
  const restored = await observe(page);
  expect(restored.player.inventory).toEqual(expected.player.inventory);
  expect(restored.player.pos).toEqual(expected.player.pos);
  expect(restored.clock).toBe(expected.clock);
});
test("browser and Node produce matching hashes for identical player commands", async ({
  page,
}) => {
  await ready(page);
  const node = createSession("roman", "tiber-100");
  const commands = [
    { type: "move", dx: 1, dy: 0 },
    { type: "wait", seconds: 120 },
    { type: "move", dx: 0, dy: 1 },
    { type: "wait", seconds: 600 },
  ] as const;
  for (let i = 0; i < commands.length; i++) {
    const req = {
      actionId: `parity-${i}`,
      expectedRevision: node.state.revision,
      command: commands[i],
    };
    node.act(req);
    await page.evaluate(
      (request) => (window as any).historySim.act(request),
      req,
    );
  }
  const hash = await page.evaluate(() => (window as any).__uhs.engine.hash());
  expect(hash).toBe(node.hash());
});
test("input focus does not move the player; unsupported worlds are preserved", async ({
  page,
}) => {
  await ready(page);
  const start = await observe(page);
  await page.getByRole("textbox", { name: "Action command" }).fill("wasd");
  await page.keyboard.press("ArrowRight");
  expect((await observe(page)).clock).toBe(start.clock);
  await page.getByRole("button", { name: "New world", exact: true }).click();
  await page
    .getByLabel("Or describe a supported setting")
    .fill("cosmonaut in orbit");
  await page.getByRole("button", { name: "Enter this world" }).click();
  await expect(page.getByRole("alert")).toContainText("supports Roman Italy");
  await expect(page.getByLabel("Or describe a supported setting")).toHaveValue(
    "cosmonaut in orbit",
  );
});
test("narrow screen leaves the world usable and opens contextual information", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("canvas").first()).toBeVisible();
  await expect(page.locator(".sidebar")).toBeHidden();
  await page.getByRole("button", { name: "Toggle character panel" }).click();
  await expect(
    page.getByRole("heading", { name: "Gaius", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Inventory", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "What you carry" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/mobile-inventory.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});
test("a real save import and recorded replay preserve the source journey", async ({
  page,
}) => {
  await ready(page);
  const node = createSession("neolithic", "replay-seed");
  for (let i = 0; i < 4; i++)
    node.act({
      actionId: `record-${i}`,
      expectedRevision: i,
      command: { type: "wait", seconds: 60 },
    });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Replay a journey" }).click();
  await (
    await chooser
  ).setFiles({
    name: "journey.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        manifest: node.state.manifest,
        commands: node.state.log,
        hash: node.hash(),
      }),
    ),
  });
  await expect(page.getByRole("button", { name: "Play replay" })).toBeVisible();
  await page.getByRole("button", { name: "Play replay" }).click();
  await expect(page.locator(".replay-bar")).toContainText("4 / 4");
  expect(await page.evaluate(() => (window as any).__uhs.engine.hash())).toBe(
    node.hash(),
  );
  await page.getByRole("button", { name: "Continue from here" }).click();
  await expect(page.locator(".replay-bar")).toHaveCount(0);
  await page.keyboard.press("Space");
  expect((await observe(page)).clock).toBe(node.state.clock + 60);
});

test("clicking a tree canopy selects the actual object without advancing time", async ({
  page,
}) => {
  await ready(page);
  await page.waitForTimeout(200);
  const before = await observe(page);
  const tree = before.objects.find((o: any) => o.kind === "tree");
  expect(tree).toBeTruthy();
  const canvas = page.locator(".game-container canvas");
  const box = await canvas.boundingBox();
  const zoom = 2;
  await canvas.click({
    position: {
      x: box!.width / 2 + (tree.pos.x - before.player.pos.x) * 16 * zoom,
      y:
        box!.height / 2 +
        (tree.pos.y - before.player.pos.y) * 16 * zoom -
        30 * zoom,
    },
  });
  await expect(page.locator(".context-section h2")).toHaveText(tree.name);
  expect((await observe(page)).clock).toBe(before.clock);
});

test("a crop's visual rows share one harvest target and water animation costs no time", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "New world", exact: true }).click();
  await page.getByRole("button", { name: /Neolithic Anatolia/ }).click();
  await page.getByRole("button", { name: "Enter this world" }).click();
  const clock = (await observe(page)).clock;
  const canvas = page.locator(".game-container canvas");
  const first = await canvas.screenshot();
  await page.waitForTimeout(950);
  const second = await canvas.screenshot();
  expect(first.equals(second)).toBe(false);
  expect((await observe(page)).clock).toBe(clock);
  const crop = await page.evaluate(() => {
    const rt = (window as any).__uhs;
    const o = rt.engine.world.initialObjects.find(
      (o: any) => o.kind === "crop",
    );
    rt.walkTo({ x: o.pos.x, y: o.pos.y + 1 });
    return o;
  });
  await expect
    .poll(async () => page.evaluate(() => (window as any).__uhs.running), {
      timeout: 20000,
    })
    .toBe(false);
  const state = await observe(page);
  expect(state.player.pos.x).toBe(crop.pos.x);
  expect(state.player.pos.y).toBe(crop.pos.y + 1);
  await page.waitForTimeout(250);
  const box = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: box.width / 2 - 4, y: box.height / 2 + 8 },
  });
  await expect(page.locator(".context-section h2")).toHaveText(crop.name);
  await page.screenshot({ path: "artifacts/neolithic-field-detail.png" });
  await page
    .locator(".context-actions button")
    .filter({ hasText: "Gather grain" })
    .click();
  expect((await observe(page)).player.inventory.grain).toBe(
    state.player.inventory.grain + 3,
  );
  await expect(page.locator(".event-strip")).toContainText(
    "harvested plot remains bare",
  );
  await page.screenshot({ path: "artifacts/neolithic-field-harvested.png" });
});
