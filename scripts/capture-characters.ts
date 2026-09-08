import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("pageerror", (e) => console.error(e));
await page.goto("http://127.0.0.1:5173/character-lab");
await page.getByRole("button", { name: "Pause", exact: true }).click();
await page.screenshot({ path: "artifacts/characters/lab.png", fullPage: true });
await page
  .getByLabel("Generated character variants")
  .screenshot({ path: "artifacts/characters/population.png" });
await page
  .getByLabel("Four direction animation sheet")
  .screenshot({ path: "artifacts/characters/stick-sheet.png" });
await browser.close();
