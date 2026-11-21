import type { StartMode } from "../content/geography/random-start";

const KEY = "uhs-start-mode";

/** Where and when a random start puts you. */
export const startModes: { value: StartMode; label: string; hint: string }[] = [
  {
    value: "any",
    label: "Random geography",
    hint: "Balanced across the world's regions, climates, and historical eras.",
  },
  {
    value: "realistic",
    label: "Realistically random",
    hint: "Weighted by how many people lived there that year, so most starts are in South and East Asia.",
  },
];

export function readStartMode(): StartMode {
  try {
    return localStorage.getItem(KEY) === "any" ? "any" : "realistic";
  } catch {
    // Private browsing and blocked site data both throw here.
    return "realistic";
  }
}

export function writeStartMode(mode: StartMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* A remembered preference is not worth failing a click over. */
  }
}

/** Quick pace: errands walk fast and the day keeps to one occasion. */
export function readQuick() {
  try {
    return localStorage.getItem("uhs.pace") === "quick";
  } catch {
    return false;
  }
}
export function writeQuick(on: boolean) {
  try {
    localStorage.setItem("uhs.pace", on ? "quick" : "full");
  } catch {
    /* A private window keeps it for the session. */
  }
}
