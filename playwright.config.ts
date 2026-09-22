import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 45000,
  use: {
    // Another checkout's dev server may already hold 5173.
    baseURL: process.env.UHS_BASE_URL ?? "http://127.0.0.1:5173",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      ...(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH }
        : { channel: "chrome" }),
    },
    screenshot: "only-on-failure",
  },
  workers: 1,
  // Start the dev server if nothing is serving yet, and leave an already
  // running one alone, so the suite does not fail with connection errors that
  // look like broken tests.
  webServer: {
    command: "npm run dev",
    url: process.env.UHS_BASE_URL ?? "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
