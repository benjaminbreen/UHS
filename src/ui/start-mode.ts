import type { StartMode } from "../content/geography/random-start";

const KEY = "uhs-start-mode";

/** Where a random start puts you. The year is population-weighted either way. */
export const startModes: { value: StartMode; label: string; hint: string }[] = [
  {
    value: "any",
    label: "Random geography",
    hint: "Any place on the map, all equally likely.",
  },
  {
    value: "realistic",
    label: "Realistically random",
    hint: "Weighted by how many people lived there that year, so most starts are in South and East Asia.",
  },
];

export function readStartMode(): StartMode {
  try {
    return localStorage.getItem(KEY) === "realistic" ? "realistic" : "any";
  } catch {
    // Private browsing and blocked site data both throw here.
    return "any";
  }
}

export function writeStartMode(mode: StartMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* A remembered preference is not worth failing a click over. */
  }
}
