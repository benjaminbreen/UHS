import { tellMemory } from "./device";

/** In a build, the world-worker plugin in vite.config.ts makes this a chunk of
 * the app itself, so the worker imports the geography and model chunks the
 * page has already downloaded instead of shipping its own 4MB copy. */
const url = new URL("../world/worker.ts", import.meta.url);

export const worldWorker = () => tellMemory(new Worker(url, { type: "module" }));
