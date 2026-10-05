import type { CultureId } from "../content/history/types";
import { accentFor } from "./culture-theme";

export const ACCENTS = [
  { id: "gold", name: "Gold", hex: "#d9b477" },
  { id: "culture", name: "Follows the place", hex: "" },
  { id: "lapis", name: "Lapis", hex: "#8fb4e3" },
  { id: "jade", name: "Jade", hex: "#6cc4ac" },
  { id: "madder", name: "Madder", hex: "#e48a7a" },
  { id: "copper", name: "Copper", hex: "#d28c5c" },
  { id: "murex", name: "Murex", hex: "#bd9ae0" },
] as const;

// bg is the page, bg2 the panels, bg3 raised surfaces.
export const BACKGROUNDS = [
  { id: "night", name: "Night", bg: "#0f1526", bg2: "#141b2f", bg3: "#1c2542" },
  { id: "ink", name: "Ink", bg: "#121110", bg2: "#1a1816", bg3: "#26221e" },
  { id: "moss", name: "Moss", bg: "#0e1513", bg2: "#141d1a", bg3: "#1d2a26" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];

export const ACCENT_KEY = "uhs.ui.accent";
export const BACKGROUND_KEY = "uhs.ui.background";

export function stored<T extends string>(key: string, valid: readonly { id: string }[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v && valid.some((o) => o.id === v)) return v as T;
  } catch {
    /* private mode */
  }
  return fallback;
}

export function accentHex(id: AccentId, culture?: CultureId) {
  return id === "culture" ? accentFor(culture) : ACCENTS.find((a) => a.id === id)!.hex;
}

export function applyTheme(accent: AccentId, background: BackgroundId, culture?: CultureId) {
  const root = document.documentElement.style;
  const b = BACKGROUNDS.find((o) => o.id === background)!;
  root.setProperty("--gold", accentHex(accent, culture));
  root.setProperty("--bg", b.bg);
  root.setProperty("--bg-2", b.bg2);
  root.setProperty("--bg-3", b.bg3);
}
