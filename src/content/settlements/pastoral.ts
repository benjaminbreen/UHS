import type { WorldSetting } from "../geography/types";
import type { CultureId } from "../history/types";
import { subsistenceFor } from "../characters/resolve";

/**
 * Where a place lives off its herds, the settlement is a camp and not a
 * village: households pitched in loose groups, tracks rather than streets, no
 * fields or garden beds. A regime says how the camp is arranged; which
 * dwellings stand in it is the building pack's business.
 *
 * A rule applies where its scope matches and the place's herding share
 * (characters/profiles/subsistence.ts) reaches `minHerding`.
 */
export type CampForm =
  /** Households of two to five related tents, far apart: the Mongol ail. */
  | "scatter"
  /** Houses round a central fold: the East African and Khoikhoi kraal. */
  | "ring"
  /** Tents in a row with their backs to the wind: the Bedouin camp. */
  | "line";

export type PastoralRegime = {
  id: string;
  label: string;
  culture?: CultureId;
  from: number;
  to: number;
  /** [west, south, east, north] in degrees. */
  bounds: readonly [number, number, number, number];
  minHerding: number;
  mode: "nomadic" | "transhumant" | "agro-pastoral";
  camp: {
    form: CampForm;
    /** Household groups in the camp. */
    groups: readonly [number, number];
    /** Dwellings in a group. */
    perGroup: readonly [number, number];
    /** Tiles between group centres, roughly. */
    spacing: number;
  };
  evidence: {
    status: "documented" | "inferred" | "fictional";
    note: string;
    sources: readonly string[];
  };
};

export const pastoralRegimes: readonly PastoralRegime[] = [
  {
    id: "eurasian-steppe",
    label: "Steppe herding camp",
    culture: "inner-eurasian",
    from: -800,
    to: 1900,
    bounds: [20, 35, 130, 60],
    minHerding: 0.4,
    mode: "nomadic",
    camp: { form: "scatter", groups: [3, 4], perGroup: [2, 4], spacing: 38 },
    evidence: {
      status: "documented",
      note: "From the Scythians to the Kazakhs and Mongols, the working unit was a small camp of related households, a few tents pitched together with their doors to the south, moving between seasonal pastures and keeping well apart from the next camp.",
      sources: [
        "https://en.wikipedia.org/wiki/Ail_(Mongolia)",
        "https://doi.org/10.1017/CBO9781139016735",
      ],
    },
  },
];

/** A camp pinned where no rule reaches: the steppe camp's arrangement,
 * without its claim to a people. */
export const genericCamp: PastoralRegime = {
  ...pastoralRegimes[0],
  id: "generic-camp",
  label: "Herding camp",
  culture: undefined,
  evidence: {
    status: "fictional",
    note: "A camp arrangement chosen for this setting, not attested for it.",
    sources: [],
  },
};

export function pastoralRegime(
  s: WorldSetting | undefined,
): PastoralRegime | undefined {
  if (!s || s.settlement === "city" || s.settlement === "port") return;
  const [lon, lat] = [s.lon, s.lat];
  const herding = subsistenceFor(s)?.shares.herding ?? 0;
  return pastoralRegimes.find(
    (r) =>
      (!r.culture || r.culture === s.culture) &&
      s.year >= r.from &&
      s.year < r.to &&
      lon >= r.bounds[0] &&
      lat >= r.bounds[1] &&
      lon <= r.bounds[2] &&
      lat <= r.bounds[3] &&
      herding >= r.minHerding,
  );
}
