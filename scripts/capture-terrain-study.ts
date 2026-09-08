import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
try {
  await page.goto("http://127.0.0.1:5173/artifacts/terrain-study/index.html");
  await page.waitForSelector('body[data-ready="true"]');
  await page.screenshot({
    path: "artifacts/terrain-study/grassland.png",
    fullPage: true,
  });
  await page.locator("select").selectOption("tundra");
  await page.screenshot({
    path: "artifacts/terrain-study/tundra.png",
    fullPage: true,
  });
} finally {
  await browser.close();
}
