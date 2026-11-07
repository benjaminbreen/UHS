import type { WorldSetting } from "../../geography/types";

/** Which side of the square the sanctuary takes. "opposite" faces the civic
 * range across the square; the others name a side, with fallbacks. */
export type SanctuarySide = "north" | "east" | "west" | "opposite";

export type ReligiousProfile = {
  id: string;
  /** Faith or tradition the building serves, for names and notes. */
  faith: string;
  /** Key of `src/content/graphics/religious.json` buildings. */
  recipe: string;
  /** Label per compiled scale; the medium label is the default. */
  labels: { small: string; medium: string; large: string };
  side: SanctuarySide;
  /** What the building is, said plainly, for the focus card. */
  about: string;
  /** Paved apron between the square and the door, in cells. */
  forecourt: number;
  /** The only scale whose frame fits, whatever the town's size: of the stepped
   * platforms only the small one is earth-faced. */
  drawnAt?: "small" | "medium" | "large";
  /** Holy ground a stranger may not walk onto: the town keeps guards on
   * watch over it. */
  warded?: boolean;
  evidence: {
    status: "inferred" | "fictional";
    sources: string[];
    note: string;
  };
};

export type ReligiousRule = ReligiousProfile & {
  from: number;
  to: number;
  /** West, south, east, north degrees. */
  bounds: readonly [number, number, number, number];
  /** One family, several, or none: a rule for a few islands or one valley
   * can trust its bounds over a family tag the atlas may have wrong. */
  culture?: WorldSetting["culture"] | readonly WorldSetting["culture"][];
};

export type Box = readonly [number, number, number, number];
/** One rule over several boxes: a region no single rectangle fits. */
export const over = (rule: Omit<ReligiousRule, "bounds">, ...boxes: Box[]): ReligiousRule[] =>
  boxes.map((bounds) => ({ ...rule, bounds }));
