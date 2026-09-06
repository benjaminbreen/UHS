import { test, expect } from "@playwright/test";
test("free world creation, regional zoom and save/reload make no model requests", async ({
  page,
}) => {
  let modelCalls = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/world-weaver")) modelCalls++;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "New world", exact: true }).click();
  await page
    .getByRole("button", { name: "Hellenistic Alexandria", exact: true })
    .click();
  await expect(page.getByLabel("Resolved setting")).toContainText("Alexandria");
  await page
    .getByRole("button", { name: "Enter this world", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).__uhs?.engine.state.manifest.setting?.placeId,
      ),
    )
    .toBe("alexandria");
  const state = await page.evaluate(() =>
    (window as any).__uhs.engine.snapshot(),
  );
  expect(state.manifest.generator).toBe(2);
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Open regional map" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Zoom out", exact: true })
    .click();
  await page.getByRole("button", { name: "Earth", exact: true }).click();
  await expect(
    page.getByLabel("Earth atlas showing your location"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.waitForTimeout(350);
  const before = await page.evaluate(() => (window as any).__uhs.engine.hash());
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => (window as any).__uhs?.engine.hash()))
    .toBe(before);
  expect(modelCalls).toBe(0);
});
test("classroom interpretation uses the same saved setting and failure preserves the prompt", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New world", exact: true }).click();
  await page
    .getByRole("button", { name: "World Weaver · classroom", exact: true })
    .click();
  await page
    .getByLabel("Describe your starting situation")
    .fill("A sailor in Alexandria");
  await page.route("**/api/world-weaver", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Classroom endpoint unavailable" }),
    }),
  );
  await page
    .getByRole("button", { name: "Enter this world", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("unavailable");
  await expect(page.getByLabel("Describe your starting situation")).toHaveValue(
    "A sailor in Alexandria",
  );
  await page
    .getByRole("button", { name: "Procedural · free / offline", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enter this world", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).__uhs.engine.state.manifest.setting?.role,
      ),
    )
    .toBe("Sailor");
});
test("new-world controls fit a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".world-selector").click();
  await page
    .getByRole("button", { name: "Paleolithic shaman Siberia", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enter this world", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).__uhs.engine.state.manifest.setting?.role,
      ),
    )
    .toBe("Shaman");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("invalid manual dates stay usable and a successful classroom response persists without reinterpretation", async ({
  page,
}) => {
  const { resolveSetting } = await import(
    "../../src/content/geography/resolve"
  );
  const result = resolveSetting("Elizabethan London");
  if ("error" in result) throw Error(result.error);
  let requests = 0;
  await page.route("**/api/world-weaver", (route) => {
    requests++;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ setting: result.setting }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "New world", exact: true }).click();
  await page.getByLabel("Starting year", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Enter this world", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("whole year");
  await page.getByLabel("Starting year", { exact: true }).fill("20000");
  await expect(
    page.getByRole("heading", { name: "Where will you begin?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "World Weaver · classroom", exact: true })
    .click();
  await page
    .getByLabel("Describe your starting situation")
    .fill("Life by the Thames under Elizabeth");
  await page.getByLabel("Classroom access code").fill("test-only");
  await page
    .getByRole("button", { name: "Enter this world", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).__uhs?.engine.state.manifest.setting?.placeId,
      ),
    )
    .toBe("london");
  expect(
    await page.evaluate(
      () => (window as any).__uhs.engine.state.manifest.setting,
    ),
  ).toEqual(result.setting);
  await page.waitForTimeout(350);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as any).__uhs?.engine.state.manifest.setting?.placeId,
      ),
    )
    .toBe("london");
  expect(requests).toBe(1);
});

test("switching atlas settings with the same seed replaces the rendered world", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const [label, id] of [
    ["Elizabethan London", "london"],
    ["Hellenistic Alexandria", "alexandria"],
    ["Paleolithic shaman Siberia", "siberia"],
  ]) {
    await page.getByRole("button", { name: "New world", exact: true }).click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByLabel("World seed", { exact: true }).fill("same-seed");
    await page
      .getByRole("button", { name: "Enter this world", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).__uhs?.engine.state.manifest.setting?.placeId,
        ),
      )
      .toBe(id);
    await expect(page.locator(".game-container canvas")).toHaveAttribute(
      "data-ready",
      "true",
    );
  }
  expect(errors).toEqual([]);
});
