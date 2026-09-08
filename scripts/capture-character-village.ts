import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("pageerror", console.error);
await page.goto("http://127.0.0.1:5173/character-lab");
await page.getByRole("button", { name: "Pause", exact: true }).click();
for (const light of ["morning", "midday", "dusk", "night"]) {
  await page.getByLabel("Lighting", { exact: true }).selectOption(light);
  const village = page.getByTestId("character-village");
  await village.locator("canvas[data-ready=true]").waitFor();
  await village.locator(`canvas[data-character-shadow=${light}]`).waitFor();
  await village.screenshot({
    path: `artifacts/characters/village-${light}.png`,
  });
}
await browser.close();
