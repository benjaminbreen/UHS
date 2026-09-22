import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  // Two specs assert nothing and exist to shoot one image each; city-capture
  // alone allows itself four minutes. They are not a gate, so they stay out of
  // the default run: `npm run capture:city` / `capture:field` to shoot them.
  testIgnore: process.env.UHS_CAPTURES
    ? []
    : ["**/city-capture.spec.ts", "**/field-capture.spec.ts"],
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
  // Measured on the 27-spec sample: 40 minutes serial, 5 at six workers, with
  // the same tests failing either way. Half the cores leaves room for the one
  // Vite process everything shares.
  workers: "50%",
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
