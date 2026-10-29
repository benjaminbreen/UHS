import type { CultureId } from "../content/history/types";
import { accentFor } from "./culture-theme";

export const ACCENTS = [
  { id: "gold", name: "Gold", hex: "" },
  { id: "culture", name: "Follows the place", hex: "" },
  { id: "lapis", name: "Lapis", hex: "#8fb4e3" },
  { id: "jade", name: "Jade", hex: "#6cc4ac" },
  { id: "madder", name: "Madder", hex: "#e48a7a" },
  { id: "copper", name: "Copper", hex: "#d28c5c" },
  { id: "murex", name: "Murex", hex: "#bd9ae0" },
] as const;

// bg is the page, bg2 the panels, bg3 raised surfaces; gold is what the Gold accent means in this palette.
// frameDark and frameHi are the outer edge and inner highlight of the pixel frames.
export const BACKGROUNDS = [
  { id: "plum", name: "Plum", bg: "#1b1322", bg2: "#251a2f", bg3: "#352641", gold: "#f2c35b", teal: "#6fe0c8", cream: "#f7f0ea", text: "#ece3ee", muted: "#b5a5c4", rose: "#ff86ad", line: "#6c5283", frameDark: "#0d0912", frameHi: "#4a3858" },
  { id: "night", name: "Indigo", bg: "#0f1526", bg2: "#141b2f", bg3: "#1c2542", gold: "#d9b477", teal: "#7fd3c4", cream: "#f0e6cf", text: "#e6e2d8", muted: "#a7b6cc", rose: "#e98bb0", line: "color-mix(in srgb, var(--gold) 72%, var(--bg))", frameDark: "#070a14", frameHi: "#2a3558" },
  { id: "graphite", name: "Graphite", bg: "#141417", bg2: "#1c1c21", bg3: "#28282f", gold: "#ff9d5c", teal: "#7cc8ff", cream: "#f4f4f2", text: "#e8e8e6", muted: "#a3a3ad", rose: "#ff7a8a", line: "#4a4a55", frameDark: "#08080a", frameHi: "#34343c" },
] as const;

// The face for anything read as sentences; the interface itself stays in the pixel type.
export const PROSE_FONTS = [
  { id: "atkinson", name: "Atkinson Hyperlegible", family: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif' },
  { id: "nunito", name: "Nunito", family: '"Nunito", system-ui, sans-serif' },
  { id: "lexend", name: "Lexend", family: '"Lexend", system-ui, sans-serif' },
] as const;

export type ProseFontId = (typeof PROSE_FONTS)[number]["id"];
export const PROSE_FONT_KEY = "uhs.ui.prose";

export function applyProseFont(id: ProseFontId) {
  document.documentElement.style.setProperty("--prose", PROSE_FONTS.find((f) => f.id === id)!.family);
}

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

export function accentHex(id: AccentId, culture?: CultureId, background: BackgroundId = "plum") {
  if (id === "culture") return accentFor(culture);
  return ACCENTS.find((a) => a.id === id)!.hex || BACKGROUNDS.find((o) => o.id === background)!.gold;
}

export function applyTheme(accent: AccentId, background: BackgroundId, culture?: CultureId) {
  const root = document.documentElement.style;
  const b = BACKGROUNDS.find((o) => o.id === background)!;
  root.setProperty("--gold", accentHex(accent, culture, background));
  for (const [name, value] of [["--bg", b.bg], ["--bg-2", b.bg2], ["--bg-3", b.bg3], ["--teal", b.teal], ["--cream", b.cream],
    ["--text", b.text], ["--muted", b.muted], ["--rose", b.rose], ["--line", b.line], ["--frame-dark", b.frameDark], ["--frame-hi", b.frameHi]])
    root.setProperty(name, value);
}
