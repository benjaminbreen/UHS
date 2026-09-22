import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  // tests/browser holds the specs worth running: they drive the game, assert
  // something, and pass. Everything under legacy/ was written to memorialise
  // one review and left to rot; it is kept for reference, not run.
  // `npm run test:legacy -- <pattern>` if you need one of them.
  testIgnore: process.env.UHS_LEGACY ? [] : ["**/legacy/**"],
  timeout: 45000,
  // These specs build worlds and wait on canvases, so they fail under load
  // rather than because of a change; a machine shared with another agent is
  // enough to do it. One retry absorbs that instead of spending your time on
  // a phantom.
  retries: 1,
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
