import type { CultureId } from "../history/types";
import type { AtlasPlace } from "./types";
import { ecoregionAt } from "./ecoregions";
import { northAmericanLandscape } from "./travel/north-american-landscapes";

/*
 * The imported gazetteer holds one row per place: modern coordinates, a modern
 * population, and a single culture with no date attached. Read literally it
 * says Knoxville was a city of six hundred thousand indigenous Americans in
 * 1780, and it said exactly that.
 *
 * Two corrections live here. A settler era says when a colonial society
 * displaced the gazetteer's culture label in a region, so the place reports the
 * culture of the date being played. A growth curve says how much of the modern
 * figure a place plausibly held at that date, so a modern metro population does
 * not size a frontier town's streets.
 *
 * Neither is demography. They decide which palette, naming kit and street
 * extent a scene is built from, nothing else. Where a place's own history
 * matters more than the regional rule, give it an entry in places.ts instead.
 */
export type SettlerEra = {
  id: string;
  label: string;
  bounds: readonly [number, number, number, number];
  /** Culture families this overlay replaces; others in the box are untouched. */
  replaces: readonly CultureId[];
  /** Year the replacing society's towns are established here. */
  from: number;
  culture: CultureId;
  architecture?: AtlasPlace["architecture"];
  sources: readonly string[];
  note?: string;
};

/*
 * Only regions where the gazetteer's own label is the pre-contact one and a
 * settler majority later held the towns it names. Places where a colonial state
 * ruled an indigenous majority -- most of Spanish America, southern Africa,
 * the Indies -- are not listed: the label stays right and the plural society is
 * described in profiles/populations.ts instead.
 */
export const settlerEras: readonly SettlerEra[] = [
  {
    id: "era.atlantic-seaboard",
    label: "Atlantic seaboard of North America",
    bounds: [-82, 25, -52, 52],
    replaces: ["other-indigenous-american"],
    from: 1620,
    culture: "european",
    architecture: "board",
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "Permanent English and French towns from the 1620s. The date is when the seaboard's named towns begin, not when the region's indigenous nations ended: Iroquoia and the southeastern confederacies held their own country well past it.",
  },
  {
    id: "era.trans-appalachia",
    label: "Trans-Appalachian interior",
    bounds: [-98, 25, -82, 49],
    replaces: ["other-indigenous-american"],
    from: 1780,
    culture: "european",
    architecture: "board",
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "Knoxville, Nashville, Cincinnati and the rest of the interior town network are founded in the 1780s and 1790s, a century and a half after the seaboard.",
  },
  {
    id: "era.western-north-america",
    label: "Western North America",
    bounds: [-141, 31, -98, 60],
    replaces: ["other-indigenous-american"],
    from: 1850,
    culture: "european",
    architecture: "board",
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "The plains and Pacific towns date from the gold rush and the railways. The Spanish-speaking southwest predates them and is described as a population rather than a settler era.",
  },
  {
    id: "era.australia-settler",
    label: "Settler Australia",
    bounds: [112, -44, 154, -10],
    replaces: ["australian-pacific"],
    from: 1788,
    culture: "european",
    architecture: "board",
    sources: ["https://australian.museum/about/history/exhibitions/indigenous-australians/"],
    note: "The gazetteer's Australian entries are the colonial towns founded from 1788. Aboriginal country covered the same ground before and after, and is not a town network this table can name.",
  },
  {
    id: "era.new-zealand-settler",
    label: "Settler New Zealand",
    bounds: [166, -48, 179, -34],
    replaces: ["australian-pacific"],
    from: 1840,
    culture: "european",
    architecture: "board",
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "Organised settlement follows the Treaty of Waitangi. Maori settlement of the same sites is far older and is not what the gazetteer's population figures count.",
  },
];

const inBox = (
  place: Pick<AtlasPlace, "lon" | "lat">,
  [w, s, e, n]: SettlerEra["bounds"],
) => place.lon >= w && place.lon <= e && place.lat >= s && place.lat <= n;

/** The settler era covering this place, latest start first. */
export function settlerEraFor(
  place: Pick<AtlasPlace, "lon" | "lat" | "culture">,
): SettlerEra | undefined {
  return settlerEras
    .filter((e) => e.replaces.includes(place.culture) && inBox(place, e.bounds))
    .sort((a, b) => b.from - a.from)[0];
}

/*
 * Share of a place's modern population it plausibly held at a date. Anchored on
 * the long-run urban series -- a pre-industrial town of any importance held a
 * few per cent of what the same site holds now -- and flat before 1500, because
 * a modern figure carries no information about a site's ancient size. Rome and
 * the other places whose ancient size is the point are hand-written anchors in
 * places.ts and carry no population figure at all.
 */
const growth: readonly (readonly [number, number])[] = [
  [1500, 0.04],
  [1700, 0.05],
  [1800, 0.07],
  [1850, 0.11],
  [1900, 0.22],
  [1950, 0.45],
  [2000, 1],
];

export function growthShare(year: number): number {
  if (year <= growth[0][0]) return growth[0][1];
  if (year >= growth[growth.length - 1][0]) return 1;
  const i = growth.findIndex(([y]) => y > year);
  const [y0, s0] = growth[i - 1],
    [y1, s1] = growth[i];
  return s0 + ((s1 - s0) * (year - y0)) / (y1 - y0);
}

/** A new town takes generations to reach the share its region holds. */
const FOUNDING_YEARS = 160;

/**
 * What this place's population implies at this date, or undefined where it is
 * too small or too early to be a named town. Sizes a footprint; not a census.
 */
export function populationAt(
  place: Pick<AtlasPlace, "lon" | "lat" | "culture" | "population">,
  year: number,
): number | undefined {
  if (!place.population) return undefined;
  const era = settlerEraFor(place);
  if (era && year < era.from) return undefined;
  // Squared, so a town founded a generation ago is a few streets rather than a
  // third of its eventual size.
  const ramp = era
    ? Math.min(1, (year - era.from) / FOUNDING_YEARS) ** 2
    : 1;
  const n = Math.round(place.population * growthShare(year) * ramp);
  return n < 400 ? undefined : n;
}

/** The gazetteer row as it stood at this date. */
export function placeAtYear(place: AtlasPlace, year: number): AtlasPlace {
  const era = settlerEraFor(place);
  const population = populationAt(place, year);
  const settled = era && year >= era.from;
  // Before the settlers came, Minot's ground was not yet Minot.
  const before = era && !settled
    ? northAmericanLandscape(place)?.name ?? ecoregionAt(place.lon, place.lat)?.name
    : undefined;
  return {
    ...place,
    ...(before ? { name: before } : {}),
    ...(settled
      ? {
          culture: era.culture,
          ...(era.architecture ? { architecture: era.architecture } : {}),
        }
      : {}),
    population,
    // A gazetteer city with no population left at this date is a village on the
    // same ground, not a city drawn at modern extent.
    settlement:
      place.population && population === undefined && place.settlement !== "camp"
        ? "village"
        : place.settlement,
  };
}
