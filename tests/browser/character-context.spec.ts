import { test, expect } from "@playwright/test";

for (const scene of [
  {
    place: "amazon",
    year: "1400",
    profile: "community.regional-americas",
    invented: false,
  },
  {
    place: "burma",
    year: "1350",
    profile: "community.regional-asia",
    invented: false,
  },
  {
    place: "congo",
    year: "1300",
    profile: "community.congo-basin",
    invented: false,
  },
  {
    place: "australia",
    year: "1400",
    profile: "community.australian-interior-pre1788",
    invented: false,
  },
  {
    place: "haiti",
    year: "1850",
    profile: "community.haitian-rural",
    invented: false,
  },
  {
    place: "virginia",
    year: "1650",
    profile: "community.english-colonial",
    invented: false,
  },
])
  test(`${scene.place} starts with scoped player and household appearances`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Choose starting details" }).click();
    await page.getByLabel("Place", { exact: true }).selectOption(scene.place);
    await page.getByLabel("Starting year", { exact: true }).fill(scene.year);
    const preview = page.getByRole("dialog").getByLabel("Selected start");
    const previewName = await preview.locator("strong").innerText();
    expect(previewName).not.toMatch(/^Resident /);
    await expect(preview).not.toContainText("fallback");
    await expect(preview).not.toContainText("unresearched");
    if (scene.invented) await expect(preview).toContainText("Invented name");
    if (scene.place === "amazon")
      await preview.screenshot({
        path: "artifacts/characters/context-amazon-preview.png",
      });
    if (scene.place === "virginia") {
      await expect(page.getByLabel("Starting community")).toHaveValue(
        "english-colonial",
      );
      await page
        .getByLabel("Starting community")
        .selectOption("indigenous-local");
      await expect(preview).not.toContainText("Invented name");
      await page
        .getByLabel("Starting community")
        .selectOption("english-colonial");
    }
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Begin", exact: true })
      .click();
    await page.waitForFunction(() => !!(window as any).historySim, null, {
      timeout: 90000,
    });
    const result = await page.evaluate(async () => {
      const observation = (window as any).historySim.observe();
      const { resolveCharacterContext } = await import(
        "/src/content/characters/resolve.ts" as string
      );
      const context = resolveCharacterContext(observation.manifest.setting);
      const people = [
        observation.player,
        ...observation.actors.filter((a: any) => a.kind === "human"),
      ];
      return {
        player: observation.player,
        people: people.map((a: any) => ({
          id: a.id,
          origin: a.origin,
          appearance: a.appearance,
        })),
        skin: context.appearance.skin,
        profile: context.profile.id,
      };
    });
    expect(result.profile).toBe(scene.profile);
    expect(result.player.name).toBe(previewName);
    for (const person of result.people) {
      expect(person.appearance).toBeDefined();
      expect(result.skin).toContain(person.appearance.skin);
      expect(person.origin.profile).toBe(scene.profile);
    }
    await expect(page.locator(".game-container canvas")).toBeVisible();
    await expect(
      page.getByLabel("Character appearance", { exact: true }),
    ).toHaveAttribute("data-skin", result.player.appearance.skin);
    await expect(page.locator(".wealth")).toHaveCount(0);
    await page.screenshot({
      path: `artifacts/characters/context-${scene.place}.png`,
    });
    expect(errors).toEqual([]);
  });

test("random starts never expose numbered residents or internal coverage labels", async ({
  page,
}) => {
  await page.goto("/");
  const generated = await page.evaluate(async () => {
    const { randomStart } = await import(
      "/src/content/geography/random-start.ts" as string
    );
    return Array.from(
      { length: 100 },
      () => randomStart().setting.characterName,
    );
  });
  expect(generated.every((name) => !/^Resident \d+$/.test(name))).toBe(true);
  await page.getByRole("button", { name: "More info" }).click();
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Random start", exact: true })
      .click();
    const preview = page.getByLabel("Selected start");
    await expect(preview.locator("strong")).not.toHaveText(/^Resident \d+$/);
    await expect(preview).not.toContainText("fallback");
    await expect(preview).not.toContainText("unresearched");
  }
});
