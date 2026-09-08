import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto("http://127.0.0.1:5173/character-lab");
await page.getByRole("button", { name: "Pause", exact: true }).click();
await page.getByLabel("Carrying", { exact: true }).selectOption("");
await page
  .getByLabel("Four direction animation sheet")
  .screenshot({ path: "artifacts/characters/walk-sheet.png" });
await page.getByLabel("Facing", { exact: true }).selectOption("1");
await page.getByLabel("Zoom", { exact: true }).selectOption("8");
await page
  .getByLabel("Animated character preview")
  .screenshot({ path: "artifacts/characters/profile.png" });
await browser.close();
