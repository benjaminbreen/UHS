import { defineConfig } from "vitest/config";
import { parseCLI } from "vitest/node";

const { filter, options } = parseCLI(["vitest", ...process.argv.slice(2)]);
// Explicit targets must exercise their integration cases too.
const full = !!process.env.FULL || filter.length > 0 || !!options.testNamePattern;

// Long scenarios stay opt-in; mixed files gate their expensive cases with FULL.
export const slow = [
  "livelihood",
  "city-panel",
  "preparation",
  "settlements",
  "map-seams",
  "farmland",
].map((name) => `tests/${name}.test.ts`);

export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
    exclude: full ? [] : slow,
    env: { FULL: full ? "1" : "" },
    // Each worker loads the world/content graph, about a gigabyte; bound
    // memory on shared machines.
    maxWorkers: 4,
    // A town session takes half a minute alone and twice that while other
    // agents load the machine; a minute's limit failed sound tests.
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
