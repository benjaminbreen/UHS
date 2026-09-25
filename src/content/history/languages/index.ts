import { africa } from "./africa";
import { americas } from "./americas";
import { eastAsia } from "./east-asia";
import { europe } from "./europe";
import { nearEast } from "./near-east";
import { oceania } from "./oceania";
import { paleolithic } from "./paleolithic";
import { southAsia } from "./south-asia";
import { southeastAsia } from "./southeast-asia";
import { spoken } from "./spoken";
import { steppe } from "./steppe";

/** Ported from HistoricalPersonaGenerator's languageDeepTime.ts, keyed on
 * coordinates rather than place names: a modern name ("Qaraghandy") is what
 * drew the model to Kazakh for 2269 BCE in the first place. */
export type LanguageConfidence =
  /** Written records of this language, here, in this period. */
  | "attested"
  /** No records here, but the comparative method recovers it. */
  | "reconstructed"
  /** The family is known; which descendant was spoken here is an inference. */
  | "inferred"
  /** Family membership itself is a live scholarly question. */
  | "conjectural";

export type LanguageHypothesis = {
  /** Unrecorded languages get descriptive labels, never invented glossonyms. */
  label: string;
  probability: number;
  confidence: LanguageConfidence;
  note?: string;
  /** Where to take words from when writing in it. */
  draw?: string;
};

export type LanguageWindow = {
  id: string;
  /** [from, to): years, negative BCE. */
  years: [number, number];
  /** Any of these [west, south, east, north] boxes, in degrees. */
  box: [number, number, number, number][];
  hypotheses: LanguageHypothesis[];
};

// Most specific first; the first match wins.
// The Near East backstop covers North Africa too, so Europe must come first.
const windows: LanguageWindow[] = [
  ...steppe, ...spoken, ...europe, ...nearEast, ...southAsia, ...southeastAsia, ...eastAsia, ...africa, ...oceania, ...americas, ...paleolithic,
];

export function languageWindow(lon: number, lat: number, year: number) {
  return windows.find(({ years, box }) =>
    year >= years[0] && year < years[1] && box.some(([w, s, e, n]) => lon >= w && lon <= e && lat >= s && lat <= n));
}

export function languageBrief(lon: number, lat: number, year: number) {
  const window = languageWindow(lon, lat, year);
  if (!window) return "";
  const [best, ...rest] = [...window.hypotheses].sort((a, b) => b.probability - a.probability);
  return [
    `Language: best guess ${best.label} (${best.confidence}, ${best.probability}).${best.note ? ` ${best.note}` : ""}${best.draw ? ` Draw from: ${best.draw}` : ""}`,
    rest.length ? `Also possible: ${rest.map((h) => `${h.label} (${h.confidence}, ${h.probability})`).join("; ")}.` : "",
  ].filter(Boolean).join("\n");
}
