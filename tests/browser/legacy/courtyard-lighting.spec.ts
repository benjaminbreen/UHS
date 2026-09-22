import { expect, test } from "@playwright/test";

test("courtyard buildings follow all daylight phases with grading disabled", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/graphics-lab?study=courtyard&zoom=2&panX=4&colorGrade=0");
  const canvas = page.getByTestId("lab-canvas");
  const images: Buffer[] = [];
  for (const phase of [
    "early-morning",
    "morning",
    "midday",
    "afternoon",
    "dusk",
    "night",
  ]) {
    await page.getByLabel("Light treatment").selectOption(phase);
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect(canvas.locator("canvas")).toHaveAttribute(
      "data-lighting",
      phase,
    );
    const keys: string[] = await page.evaluate(
      () => (window as any).graphicsLab.describe().renderedCourtyardTextures,
    );
    expect(keys).toHaveLength(4);
    expect(keys.every((key) => key.includes(`:${phase}:`))).toBe(true);
    images.push(
      await canvas.screenshot({ path: `artifacts/courtyard-${phase}.png` }),
    );
  }
  for (let i = 1; i < images.length; i++)
    expect(images[i].equals(images[i - 1])).toBe(false);
  expect(errors).toEqual([]);
});

test("inner shadows reverse across the floor, soften with cloud, and stay inside the opening", async ({
  page,
}) => {
  await page.goto("/graphics-lab?study=courtyard");
  await expect(page.getByTestId("lab-canvas")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const result = await page.evaluate(async () => {
    const modulePath = "/src/render/courtyard-lighting.ts";
    const { paintCourtyardLight } = await import(modulePath);
    const court = (window as any).graphicsLab.describe().models[0].model
      .courtyardLight;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const [fl, fr, br, bl] = court.floor;
    const y = Math.round((fl[1] + bl[1]) / 2);
    const left = Math.ceil((fl[0] + bl[0]) / 2) + 2;
    const right = Math.floor((fr[0] + br[0]) / 2) - 2;
    const sample = (phase: string, strength = 1) => {
      ctx.clearRect(0, 0, 256, 256);
      paintCourtyardLight(ctx, court, phase, strength);
      return {
        left: ctx.getImageData(left, y, 1, 1).data[3],
        right: ctx.getImageData(right, y, 1, 1).data[3],
        outside: ctx.getImageData(left, fl[1] + 3, 1, 1).data[3],
      };
    };
    return {
      morning: sample("morning"),
      afternoon: sample("afternoon"),
      cloud: sample("afternoon", 0.28),
      disabled: sample("midday", 0),
      night: sample("night"),
    };
  });
  expect(result.morning.right).toBeGreaterThan(result.morning.left);
  expect(result.afternoon.left).toBeGreaterThan(result.afternoon.right);
  expect(result.cloud.left).toBeLessThan(result.afternoon.left);
  expect(result.disabled.left + result.disabled.right).toBe(0);
  expect(result.night.left).toBe(result.night.right);
  expect(result.night.left).toBeGreaterThan(0);
  for (const phase of Object.values(result)) expect(phase.outside).toBe(0);
});
