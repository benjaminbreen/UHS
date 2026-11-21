import type { WorldSetting } from "../geography/types";
import type { EarthFinish } from "./urban-form/types";

export type WaysideCompanion = {
  family: string;
  prop: string;
  name: string;
  variant: number;
};

/** Variant indexes into the `waymark` and `wayside-shrine` prop families,
 * plus culturally matched crossroads/approach companions and pocket ground.
 * Inferred and illustrative: which kind of marker a country stood at its
 * crossroads, not a claim about any one road. Absent means none is placed. */
export type Wayside = {
  waymark?: number;
  shrine?: number;
  /** Optional regional shrine override (e.g. `jizo` in Japan or `saint-niche` in Mediterranean Europe). */
  altShrine?: WaysideCompanion;
  /** A `standing-stone` variant, raised where ways meet before there were
   * waymarks: the same need, an older answer. */
  stone?: number;
  /** Culturally grounded companion placed beside the waymark or shrine when a 2-cell pocket is clear. */
  companion?: WaysideCompanion;
  /** Ground finish under the wayside pocket so markers sit in a worn/cobbled corner rather than raw grass. */
  pocketFinish?: EarthFinish;
};

const FINGERPOST = 0,
  CROSS = 1,
  MILESTONE = 2,
  CAIRN = 3,
  KOS_MINAR = 4,
  ROAD_STELA = 5;
const POST_SHRINE = 0,
  NICHE = 1,
  LANTERN = 2,
  FLAGGED_CAIRN = 3,
  CHABUTRA = 4,
  HOKORA = 5;

const OAK_BENCH: WaysideCompanion = { family: "bench", prop: "bench", name: "Wayside bench", variant: 0 };
const STONE_BENCH: WaysideCompanion = { family: "bench", prop: "bench", name: "Stone bench", variant: 1 };
const BAMBOO_BENCH: WaysideCompanion = { family: "bench", prop: "bench", name: "Bamboo bench", variant: 2 };
const SITTING_STONE: WaysideCompanion = { family: "seat-stone", prop: "seatStone", name: "Sitting stone", variant: 0 };
const PIAU_JARS: WaysideCompanion = { family: "water-station", prop: "waterStation", name: "Shaded drinking jars", variant: 0 };
const SABIL_JARS: WaysideCompanion = { family: "water-station", prop: "waterStation", name: "Drinking jars", variant: 1 };
const STONE_LEDGE_JARS: WaysideCompanion = { family: "water-station", prop: "waterStation", name: "Roadside water jars", variant: 2 };
const ROMAN_FOUNTAIN: WaysideCompanion = { family: "street-fountain", prop: "streetFountain", name: "Wayside fountain", variant: 0 };

export function waysideFor(setting: (Pick<WorldSetting, "culture" | "year"> & Partial<Pick<WorldSetting, "climate" | "lon" | "lat">>) | undefined): Wayside {
  if (!setting) return {};
  const { culture, year, climate, lon = 0, lat = 0 } = setting;
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
    return {
      stone: stone[culture] ?? 2,
      companion: SITTING_STONE,
      pocketFinish: "beaten",
    };
  }
  const highland = climate === "tundra" || climate === "boreal";
  switch (culture) {
    case "european": {
      const med = climate === "mediterranean" || lat < 45;
      if (year < 500)
        return {
          waymark: MILESTONE,
          shrine: NICHE,
          companion: med ? ROMAN_FOUNTAIN : STONE_BENCH,
          pocketFinish: "gravel",
        };
      if (year < 1600)
        return {
          waymark: CROSS,
          shrine: med ? NICHE : POST_SHRINE,
          altShrine: med
            ? { family: "saint-niche", prop: "saintNiche", name: "Wayside saint's shrine", variant: 1 }
            : undefined,
          companion: med ? STONE_BENCH : OAK_BENCH,
          pocketFinish: "gravel",
        };
      return {
        waymark: year < 1700 ? MILESTONE : FINGERPOST,
        shrine: med ? NICHE : POST_SHRINE,
        altShrine: med
          ? { family: "saint-niche", prop: "saintNiche", name: "Wayside saint's shrine", variant: 2 }
          : undefined,
        companion: med ? STONE_BENCH : OAK_BENCH,
        pocketFinish: "gravel",
      };
    }
    case "north-african-west-asian":
      return {
        waymark: year >= -500 ? MILESTONE : CAIRN,
        companion: year >= -200 ? SABIL_JARS : SITTING_STONE,
        pocketFinish: "swept",
      };
    case "inner-eurasian":
      return {
        waymark: CAIRN,
        shrine: FLAGGED_CAIRN,
        companion: SITTING_STONE,
        pocketFinish: "beaten",
      };
    case "south-asian":
      return {
        waymark: year >= 1200 ? KOS_MINAR : MILESTONE,
        shrine: year >= -300 ? CHABUTRA : undefined,
        companion: year >= -300 ? PIAU_JARS : SITTING_STONE,
        pocketFinish: "swept",
      };
    case "east-asian": {
      const japan = lon >= 129 && lat >= 30 && lat <= 46;
      return {
        waymark: ROAD_STELA,
        shrine: year >= 600 ? (japan ? HOKORA : LANTERN) : undefined,
        altShrine:
          japan && year >= 1200
            ? { family: "jizo", prop: "jizo", name: "Roadside Jizō", variant: year >= 1600 ? 2 : 1 }
            : undefined,
        companion: BAMBOO_BENCH,
        pocketFinish: "gravel",
      };
    }
    case "southeast-asian":
      return {
        waymark: year >= 800 ? ROAD_STELA : undefined,
        shrine: year >= 800 ? HOKORA : undefined,
        companion: year >= 500 ? PIAU_JARS : BAMBOO_BENCH,
        pocketFinish: "swept",
      };
    case "andean":
      // The apacheta: a traveller's cairn at a pass or a crossing.
      return {
        waymark: CAIRN,
        shrine: FLAGGED_CAIRN,
        companion: SITTING_STONE,
        pocketFinish: "beaten",
      };
    case "mesoamerican":
      return {
        waymark: ROAD_STELA,
        shrine: year >= 1520 ? NICHE : undefined,
        companion: year >= 1520 ? STONE_LEDGE_JARS : SITTING_STONE,
        pocketFinish: "swept",
      };
    default:
      return highland
        ? { waymark: CAIRN, companion: SITTING_STONE, pocketFinish: "beaten" }
        : {};
  }
}
