import type { CultureId } from "../history/types";
import type { EraId } from "../history/dates";
import type { TechniqueId } from "../../core/techniques";
import type { SourceId } from "./sources";

/** Reading for a skill in some places and times. Leave `cultures` or `eras`
 * out and it applies everywhere or always. */
export type ContextEntry = {
  cultures?: CultureId[];
  eras?: EraId[];
  /** English Wikipedia titles, the most fitting first. */
  wiki: string[];
  sources: SourceId[];
};
export type TechniqueNote = {
  wiki?: string;
  /** What the technique stands for in history, in a sentence or two. */
  note: string;
};
export type SkillContext = {
  entries: ContextEntry[];
  techniques: Partial<Record<TechniqueId, TechniqueNote>>;
};

export const DEEP: EraId[] = ["deep-prehistory"];
export const HOLOCENE: EraId[] = ["early-holocene"];
export const EARLY: EraId[] = ["early-historical"];
export const ANTIQUITY: EraId[] = ["antiquity"];
export const MEDIEVAL: EraId[] = ["early-middle", "later-middle"];
export const EARLY_MODERN: EraId[] = ["early-modern"];
export const INDUSTRIAL: EraId[] = ["1750-1850", "1850-1914"];
export const MODERN: EraId[] = ["1914-1945", "1945-1990", "contemporary"];
export const AFTER_ICE: EraId[] = [...HOLOCENE, ...EARLY, ...ANTIQUITY, ...MEDIEVAL, ...EARLY_MODERN];
export const HISTORIC: EraId[] = [...EARLY, ...ANTIQUITY, ...MEDIEVAL, ...EARLY_MODERN];
export const PREMODERN: EraId[] = [...AFTER_ICE, ...INDUSTRIAL];
