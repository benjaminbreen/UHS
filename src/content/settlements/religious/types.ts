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
  /** Paved apron between the square and the door, in cells. */
  forecourt: number;
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
  culture: WorldSetting["culture"];
};
