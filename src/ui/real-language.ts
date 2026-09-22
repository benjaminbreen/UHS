import { useSyncExternalStore } from "react";

/** Experimental: NPCs speak the language of their place and date, with an
 * English gloss on click. Shared by settings and the dialogue modal. */
const KEY = "uhs.realLanguage";
const listeners = new Set<() => void>();
let on = (() => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
})();

export function setRealLanguage(next: boolean) {
  on = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  listeners.forEach((listener) => listener());
}

export function useRealLanguage() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => on,
  );
}
