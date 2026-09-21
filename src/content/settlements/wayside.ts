import type { WorldSetting } from "../geography/types";

/** Variant indexes into the `waymark` and `wayside-shrine` prop families.
 * Inferred and illustrative: which kind of marker a country stood at its
 * crossroads, not a claim about any one road. Absent means none is placed. */
export type Wayside = {
  waymark?: number;
  shrine?: number;
  /** A `standing-stone` variant, raised where ways meet before there were
   * waymarks: the same need, an older answer. */
  stone?: number;
};

const FINGERPOST = 0,
  CROSS = 1,
  MILESTONE = 2,
  CAIRN = 3;
const POST_SHRINE = 0,
  NICHE = 1,
  LANTERN = 2,
  FLAGGED_CAIRN = 3;

export function waysideFor(setting: WorldSetting | undefined): Wayside {
  if (!setting) return {};
  const { culture, year, climate } = setting;
  if (year < -800) {
    const stone: Partial<Record<typeof culture, number>> = {
      european: climate === "mediterranean" ? 2 : 0,
      "inner-eurasian": 1,
      "north-african-west-asian": 2,
      "south-asian": 2,
      "east-asian": 2,
      "west-central-african": 3,
      "east-southern-african": 2,
      "other-indigenous-american": climate === "tundra" ? 4 : 3,
      "australian-pacific": 3,
      andean: 2,
      mesoamerican: 2,
    };
    return { stone: stone[culture] ?? 2 };
  }
  const highland = climate === "tundra" || climate === "boreal";
  switch (culture) {
    case "european":
      if (year < 500) return { waymark: MILESTONE, shrine: NICHE };
      if (year < 1600)
        return {
          waymark: CROSS,
          shrine: climate === "mediterranean" ? NICHE : POST_SHRINE,
        };
      return {
        waymark: year < 1700 ? MILESTONE : FINGERPOST,
        shrine: climate === "mediterranean" ? NICHE : POST_SHRINE,
      };
    case "north-african-west-asian":
      return { waymark: year >= -500 ? MILESTONE : CAIRN };
    case "inner-eurasian":
      return { waymark: CAIRN, shrine: FLAGGED_CAIRN };
    case "south-asian":
      return { waymark: MILESTONE, shrine: year >= -300 ? NICHE : undefined };
    case "east-asian":
      return { waymark: MILESTONE, shrine: year >= 600 ? LANTERN : undefined };
    case "southeast-asian":
      return { shrine: year >= 800 ? LANTERN : undefined };
    case "andean":
      // The apacheta: a traveller's cairn at a pass or a crossing.
      return { waymark: CAIRN, shrine: FLAGGED_CAIRN };
    default:
      return highland ? { waymark: CAIRN } : {};
  }
}
