/**
 * What the device can be asked to hold.
 *
 * iOS Safari gives a tab a memory budget far below the desktop one and kills
 * the whole web process when it is passed — no exception, just a blank page.
 * Nothing in the platform reports the budget, so the screen and the input
 * method stand in for it.
 */

let cached: boolean | undefined;

/** A phone or small tablet: treat memory as the scarce resource. */
export function smallMemoryDevice() {
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") return (cached = false);
  const memory = (navigator as { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory <= 4) return (cached = true);
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const shortest = Math.min(window.screen.width, window.screen.height);
  // iPadOS claims a desktop UA but still reports a touch pointer.
  return (cached = coarse && shortest <= 834);
}

/**
 * Terrain workers to run at once. Each one holds its own copy of the world and
 * its own copy of the module graph, so this is the largest memory dial there
 * is.
 */
export function workerBudget() {
  if (smallMemoryDevice()) return 1;
  // Three, not six: load time measured the same with 2, 3 and 6, because each
  // worker first parses ~9MB of geography and rebuilds the world.
  return Math.min(3, Math.max(1, (navigator.hardwareConcurrency ?? 4) - 1));
}

/** The screens the touch controls and the phone stylesheet claim. */
export const PHONE_QUERY =
  "(max-width: 640px), (pointer: coarse) and (max-width: 1024px)";

/** Whether the phone layout is on right now. */
export function phoneLayout() {
  return window.matchMedia?.(PHONE_QUERY).matches ?? false;
}
