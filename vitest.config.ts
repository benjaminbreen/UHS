import { defineConfig } from "vitest/config";

// World-building suites take minutes each; `npm test` skips them and
// `npm run test:full` runs everything.
export const slow = [
  "livelihood",
  "regional-composition",
  "city-panel",
  "preparation",
  "vegetation-composition",
  "vegetation",
  "settlements",
  "map-seams",
  "water-rendering",
  "topography",
  "farmland",
].map((name) => `tests/${name}.test.ts`);

export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
    exclude: process.env.FULL ? [] : slow,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
