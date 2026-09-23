import type { WorldSetting } from "../geography/types";
import type { CultureId } from "../history/types";
import type { Boundary } from "../agriculture/types";
import { subsistenceFor } from "../characters/resolve";
import { farms } from "../geography/onsets";

/**
 * How a place lives decides what its settlement looks like. Where people live
 * off their herds, or by hunting and gathering, the settlement is a camp and
 * not a village: no fields, no garden beds, tracks rather than streets. A
 * lifeway says how the camp is arranged; which dwellings stand in it is the
 * building pack's business.
 *
 * A rule applies where its scope matches and the place's share of the named
 * work (characters/profiles/subsistence.ts) reaches `min`. The first match
 * wins, so specific rules come before the catch-alls.
 */
export type CampForm =
  /** Households of two to five related tents, far apart: the Mongol ail. */
  | "scatter"
  /** A band's shelters in an arc north of the shared hearth, openings to
   * the south, with a smaller camp apart for the unmarried. */
  | "band"
  /** Houses round a plaza or a fold, the kraal and the Amazonian ring
   * village. Drawn as a horseshoe open to the south: the art shows every
   * door on the face toward the viewer, so the near side of the ring
   * would face the wrong way. */
  | "ring"
  /** Houses in a row above the beach, facing the water. */
  | "shore-row";

export type Lifeway = {
  id: string;
  label: string;
  mode:
    | "nomadic-pastoral"
    | "mobile-foraging"
    | "sedentary-foraging"
    | "horticultural";
  culture?: CultureId;
  from: number;
  to: number;
  /** [west, south, east, north] in degrees. */
  bounds: readonly [number, number, number, number];
  /** The share of the workforce this lifeway needs, by kind of work. */
  share: { of: "herding" | "foraging" | "fishing" | "farming"; min: number };
  /** Only where settled farming has not arrived. */
  unfarmed?: boolean;
  camp: {
    form: CampForm;
    /** Household groups, or for a band its main camp and any camps apart. */
    groups: readonly [number, number];
    /** Dwellings in a group. */
    perGroup: readonly [number, number];
    /** Tiles between group centres, roughly. */
    spacing: number;
    /** A larger building at the middle of a ring: the men's house. */
    centre?: boolean;
    /** The fence round the stock at the middle of a ring. */
    fold?: Boundary;
    /** The fence round the whole camp, with a gate to the south. */
    perimeter?: Boundary;
  };
  evidence: {
    status: "documented" | "inferred" | "fictional";
    note: string;
    sources: readonly string[];
  };
};

const EARTH = [-180, -90, 180, 90] as const;

export const lifeways: readonly Lifeway[] = [
  {
    id: "eurasian-steppe",
    label: "Steppe herding camp",
    mode: "nomadic-pastoral",
    culture: "inner-eurasian",
    from: -800,
    to: 1900,
    bounds: [20, 35, 130, 60],
    share: { of: "herding", min: 0.4 },
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
  {
    id: "aboriginal-australia",
    label: "Aboriginal camp",
    mode: "mobile-foraging",
    culture: "australian-pacific",
    from: -65000,
    to: 1788,
    bounds: [112, -44, 154, -10],
    share: { of: "foraging", min: 0.4 },
    unfarmed: true,
    camp: { form: "band", groups: [1, 2], perGroup: [4, 7], spacing: 26 },
    evidence: {
      status: "documented",
      note: "Ethnographic camps were laid out by kinship: each family's shelter or windbreak with its own fire, set so that relatives faced one another across the camp, with the unmarried men's camp and sometimes a widows' camp pitched apart.",
      sources: [
        "https://doi.org/10.1017/CBO9781139017855",
        "https://en.wikipedia.org/wiki/Gunyah",
      ],
    },
  },
  {
    id: "northwest-coast",
    label: "Plank-house village",
    mode: "sedentary-foraging",
    from: -2000,
    to: 1880,
    bounds: [-136, 42, -122, 60],
    share: { of: "fishing", min: 0.4 },
    camp: { form: "shore-row", groups: [1, 1], perGroup: [4, 7], spacing: 0 },
    evidence: {
      status: "documented",
      note: "Winter villages from the Tlingit to the Coast Salish stood in a single row of cedar plank houses along the beach above the tide line, fronts and crest poles to the water, canoes drawn up below.",
      sources: [
        "https://en.wikipedia.org/wiki/Plank_house",
        "https://en.wikipedia.org/wiki/Haida_people",
      ],
    },
  },
  {
    id: "maasai",
    label: "Enkang",
    mode: "nomadic-pastoral",
    culture: "east-southern-african",
    from: 1600,
    to: 1950,
    bounds: [33, -7, 38.5, 2.5],
    share: { of: "herding", min: 0.4 },
    camp: {
      form: "ring",
      groups: [1, 1],
      perGroup: [8, 12],
      spacing: 0,
      fold: "thorn",
      perimeter: "thorn",
    },
    evidence: {
      status: "documented",
      note: "A Maasai homestead is a ring of low dung-plastered houses, built by the women, round the fold where the cattle come in at night, the whole enclosed by a fence of thorn branches.",
      sources: ["https://en.wikipedia.org/wiki/Maasai_people"],
    },
  },
  {
    id: "khoikhoi",
    label: "Kraal",
    mode: "nomadic-pastoral",
    culture: "east-southern-african",
    from: -100,
    to: 1800,
    bounds: [16, -35, 26, -28],
    share: { of: "herding", min: 0.35 },
    camp: {
      form: "ring",
      groups: [1, 1],
      perGroup: [7, 11],
      spacing: 0,
      fold: "thorn",
    },
    evidence: {
      status: "documented",
      note: "Cape herders pitched their mat-covered domed houses in a circle round the livestock at night, and took the mats and frames down onto pack oxen when they moved.",
      sources: ["https://en.wikipedia.org/wiki/Khoikhoi", "https://en.wikipedia.org/wiki/Matjieshuis"],
    },
  },
  {
    id: "amazonian-ring",
    label: "Ring village",
    mode: "horticultural",
    culture: "other-indigenous-american",
    from: -1000,
    to: 1950,
    bounds: [-78, -20, -35, 6],
    share: { of: "farming", min: 0.3 },
    camp: { form: "ring", groups: [1, 1], perGroup: [6, 9], spacing: 0, centre: true },
    evidence: {
      status: "documented",
      note: "Across the southern Amazon, from the Xingu to the Kayapo and Bororo, households stood round a cleared plaza with the men's house at its centre; the swidden gardens lay out in the forest beyond.",
      sources: [
        "https://en.wikipedia.org/wiki/Kuikuro_people",
        "https://doi.org/10.1126/science.1086442",
      ],
    },
  },
  {
    id: "mobile-foragers",
    label: "Foraging band camp",
    mode: "mobile-foraging",
    from: -300000,
    to: 1950,
    bounds: EARTH,
    share: { of: "foraging", min: 0.45 },
    unfarmed: true,
    camp: { form: "band", groups: [1, 1], perGroup: [4, 6], spacing: 24 },
    evidence: {
      status: "inferred",
      note: "Mobile hunter-gatherers from the Kalahari to the Great Basin camped as bands of a few families, twenty-five to fifty people, each family's shelter and hearth in a loose ring or arc near water.",
      sources: ["https://en.wikipedia.org/wiki/Band_society"],
    },
  },
];

/** A camp pinned where no rule reaches: the steppe camp's arrangement,
 * without its claim to a people. */
export const genericCamp: Lifeway = {
  ...lifeways[0],
  id: "generic-camp",
  label: "Herding camp",
  culture: undefined,
  evidence: {
    status: "fictional",
    note: "A camp arrangement chosen for this setting, not attested for it.",
    sources: [],
  },
};

export const genericBand: Lifeway = {
  ...lifeways.find((r) => r.id === "mobile-foragers")!,
  id: "generic-band",
  evidence: genericCamp.evidence,
};

export function lifeway(s: WorldSetting | undefined): Lifeway | undefined {
  if (!s || s.settlement === "city" || s.settlement === "port") return;
  const { lon, lat } = s;
  const shares = subsistenceFor(s)?.shares;
  if (!shares) return;
  return lifeways.find(
    (r) =>
      (!r.culture || r.culture === s.culture) &&
      s.year >= r.from &&
      s.year < r.to &&
      lon >= r.bounds[0] &&
      lat >= r.bounds[1] &&
      lon <= r.bounds[2] &&
      lat <= r.bounds[3] &&
      shares[r.share.of] >= r.share.min &&
      !(r.unfarmed && farms(s)),
  );
}
