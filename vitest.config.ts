import { defineConfig } from "vitest/config";
import { parseCLI } from "vitest/node";

const { filter, options } = parseCLI(["vitest", ...process.argv.slice(2)]);
// Explicit targets include integration cases unless the quick suite was requested.
const mode = process.env.FULL;
const full = mode !== "0" && (!!mode || filter.length > 0 || !!options.testNamePattern);
const poll = process.env.CHOKIDAR_USEPOLLING;

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
  // On macOS, Chokidar selects FSEvents before reading the polling variable.
  server: poll === "1" || poll === "true" ? { watch: { usePolling: true } } : undefined,
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
