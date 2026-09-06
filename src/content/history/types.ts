import type { DateRange, HistoricalDate, EraId } from "./dates";

export const cultures = [
  ["european", "European"],
  ["north-african-west-asian", "North African & West Asian"],
  ["inner-eurasian", "Inner Eurasian"],
  ["south-asian", "South Asian"],
  ["east-asian", "East Asian"],
  ["southeast-asian", "Southeast Asian"],
  ["west-central-african", "West & Central African"],
  ["east-southern-african", "East & Southern African"],
  ["mesoamerican", "Mesoamerican"],
  ["andean", "Andean"],
  ["other-indigenous-american", "Other Indigenous American"],
  ["australian-pacific", "Australian & Pacific"],
] as const;
export type CultureId = (typeof cultures)[number][0];
export const categories = [
  "item",
  "prop",
  "occupation",
  "building",
  "animal",
  "plant",
  "appearance",
  "institution",
  "music",
] as const;
export type Category = (typeof categories)[number];
export type Evidence = {
  status: "documented" | "inferred" | "hypothesis" | "fictional";
  claim: string;
  sources: string[];
  limitation: string;
};
export type Source = { id: string; title: string; url: string };
export type Definition = {
  id: string;
  category: Category;
  label: string;
  /** Existing engine/art ID only; reference definitions are not playable features. */
  runtimeId?: string;
  sprite?: string;
  delivery: "existing" | "reference";
  requires?: string[];
};
export type Selection = {
  id: string;
  availability: "available" | "excluded";
  frequency: "common" | "uncommon" | "rare";
  contexts: string[];
  supply: "local" | "imported" | "surviving" | "unspecified";
  evidence: Evidence;
};
export type Fact = {
  label: string;
  evidence: Evidence;
  /** Competing interpretations, never presented as simultaneously established. */
  alternatives?: { label: string; evidence: Evidence }[];
};
export type FactKey = "authority" | "overlord" | "claims" | "language";
export type Place = {
  id: string;
  label: string;
  regions: string[];
  community: string;
  culture: CultureId;
  sample: HistoricalDate;
  coverage: string;
};
export type Rule = {
  id: string;
  level: "baseline" | "regional" | "local";
  culture: CultureId;
  eras?: EraId[];
  dates?: DateRange;
  regions?: string[];
  places?: string[];
  communities?: string[];
  /** Explicit shared selection lists; no nested kits or implicit era inheritance. */
  kits?: string[];
  selections?: Selection[];
  facts?: Partial<Record<FactKey, Fact>>;
  note: string;
};
export type Registry = {
  version: number;
  definitions: Definition[];
  sources: Source[];
  places: Place[];
  kits: Record<string, Selection[]>;
  rules: Rule[];
};
export type ResolveInput = {
  culture: CultureId;
  date: HistoricalDate;
  place?: string;
  context?: string;
  capabilities?: string[];
  /** Default true: users want sourced, audacious hypotheses, visibly qualified. */
  hypotheses?: boolean;
};
