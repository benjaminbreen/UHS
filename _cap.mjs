import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error(e));
await page.goto("http://127.0.0.1:54987/character-lab");
await page.getByRole("button", { name: "Pause", exact: true }).click();
await page.getByLabel("Generated character variants").screenshot({ path: "artifacts/characters/population.png" });
await browser.close();
