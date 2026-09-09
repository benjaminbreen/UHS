import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
    // Several suites build whole worlds, which is seconds of real work each.
    // The 5s default was timing those out and reporting it as a failure.
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
