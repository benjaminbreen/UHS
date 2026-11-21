import { defineConfig } from "@playwright/test";
const baseURL = process.env.UHS_URL ?? process.env.UHS_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5173}`;

export default defineConfig({
  testDir: "tests/browser",
  timeout: 180000,
  retries: 1,
  use: {
    // Another checkout's dev server may already hold 5173.
    baseURL,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium", launchOptions: process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" } } },
    { name: "mobile-webkit", testMatch: /mobile\.spec\.ts/, use: { browserName: "webkit" } },
  ],
  // Browser worlds share one Vite server and substantial generation memory.
  workers: 2,
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
    env: { ...process.env, UHS_OFFLINE: "1" },
  },
});
