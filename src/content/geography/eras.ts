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
  /** Only these gazetteer ids inside the box, where the towns and the villages
   * around them went different ways. */
  places?: readonly string[];
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
 * settler majority later held the towns it names. Where a colonial state ruled
 * an indigenous majority -- Mexico and the Andes, most of Africa, the Indies --
 * the label stays: the colonial grid and church are keyed to the indigenous
 * families there (urban-form/modern.ts, religious/americas.ts).
 */
export const settlerEras: readonly SettlerEra[] = [
  {
    id: "era.ottoman-constantinople",
    label: "Constantinople and Thrace under the Ottomans",
    bounds: [26, 40, 30, 42.2],
    replaces: ["european"],
    from: 1453,
    culture: "north-african-west-asian",
    sources: ["https://doi.org/10.1017/CHOL9780521620932"],
    note: "Bursa was Ottoman from 1326 and Constantinople from 1453; the later date is used for both, since the gazetteer's two cities sit in one box.",
  },
  {
    id: "era.islamic-maghreb",
    label: "Coast of the Maghreb after the Arab conquest",
    bounds: [-10, 29, 12, 37.3],
    replaces: ["european"],
    from: 698,
    culture: "north-african-west-asian",
    sources: ["https://doi.org/10.1017/CHOL9780521200929"],
    note: "Carthage fell in 698. The coastal cities the gazetteer files as European were Roman, Vandal and Byzantine before it; French Algeria's settlers stayed a minority and are not modelled as a change of culture.",
  },
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
    id: "era.northern-gold-rush",
    label: "Gold-rush and railway towns of Alaska and the Yukon",
    bounds: [-170, 54, -110, 72],
    places: [
      "city-anchorage", "city-fairbanks", "city-juneau", "city-whitehorse", "city-yellowknife",
      "city-valdez", "city-nome", "city-dawson-city", "city-prince-rupert", "city-prudhoe-bay",
    ],
    replaces: ["other-indigenous-american"],
    from: 1898,
    culture: "european",
    architecture: "board",
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "The Klondike and Nome rushes of 1897–99, then the Alaska Railroad, which founded Anchorage in 1915, made these settler towns. Bethel, Utqiagvik, Point Hope and the Inuit hamlets stayed Native-majority and keep the gazetteer's label.",
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
  {
    id: "era.spanish-antilles",
    label: "Spanish towns of the Greater Antilles",
    bounds: [-85.5, 17, -65, 24],
    replaces: ["other-indigenous-american"],
    from: 1510,
    culture: "european",
    architecture: "courtyard",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "Santo Domingo 1496, Santiago de Cuba 1515, Havana 1519, San Juan 1521. The Taino population collapsed within a generation; the towns were Spanish, and from the seventeenth century majority African and enslaved. Kingston (1692) and Port-au-Prince (1749) were founded later under the English and French.",
  },
  {
    id: "era.haiti",
    label: "Independent Haiti",
    bounds: [-74.6, 17.9, -71.6, 20.1],
    replaces: ["other-indigenous-american"],
    from: 1804,
    culture: "west-central-african",
    sources: ["Dubois, Avengers of the New World"],
    note: "After the revolution the towns of Saint-Domingue belonged to a nation of formerly enslaved Africans and their children.",
  },
  {
    id: "era.lesser-antilles",
    label: "Plantation islands of the Lesser Antilles",
    bounds: [-65, 10.6, -59, 18.6],
    replaces: ["other-indigenous-american"],
    from: 1630,
    culture: "european",
    architecture: "board",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "English and French settlement from St Kitts (1624) and Barbados (1627). Kalinago held Dominica and St Vincent into the eighteenth century.",
  },
  {
    id: "era.brazil-northeast",
    label: "Sugar coast of northeastern Brazil",
    bounds: [-41, -14, -34, -2],
    replaces: ["other-indigenous-american"],
    from: 1540,
    culture: "european",
    architecture: "courtyard",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "Olinda and Recife from 1535-37, Salvador 1549 as the colonial capital. Tupi villages held the coast before; the plantation towns that replaced them had enslaved African majorities.",
  },
  {
    id: "era.brazil-southeast",
    label: "Portuguese towns of the southeast coast",
    bounds: [-49.5, -26, -39.5, -20],
    replaces: ["other-indigenous-american"],
    from: 1560,
    culture: "european",
    architecture: "courtyard",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "Sao Paulo 1554, Rio de Janeiro 1565, Curitiba 1693.",
  },
  {
    id: "era.brazil-amazon-mouth",
    label: "Portuguese forts at the Amazon mouth",
    bounds: [-52, -3.5, -44, 1],
    replaces: ["other-indigenous-american"],
    from: 1615,
    culture: "european",
    architecture: "courtyard",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "Sao Luis 1612 (French, then Portuguese) and Belem 1616.",
  },
  {
    id: "era.brazil-gold",
    label: "Mining and cattle towns of interior Brazil",
    bounds: [-58, -24, -39.5, -12],
    replaces: ["other-indigenous-american"],
    from: 1700,
    culture: "european",
    architecture: "courtyard",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "The gold rushes of Minas Gerais from the 1690s, Cuiaba 1719 and Goias 1727.",
  },
  {
    id: "era.brazil-planned-capitals",
    label: "Planned capitals of interior Brazil",
    bounds: [-50, -20.5, -43.5, -15],
    places: ["city-brasilia", "city-goiania", "city-belo-horizonte"],
    replaces: ["other-indigenous-american"],
    from: 1897,
    culture: "european",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "Belo Horizonte 1897, Goiania 1933, Brasilia 1960: new cities, not older towns renamed.",
  },
  {
    id: "era.rio-de-la-plata",
    label: "Rio de la Plata and the pampas",
    bounds: [-66, -36.5, -50, -26],
    replaces: ["other-indigenous-american"],
    from: 1580,
    culture: "european",
    architecture: "courtyard",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "Santa Fe 1573, Cordoba 1573, Buenos Aires refounded 1580, Montevideo 1726. Querandi, Charrua and Guarani held the country before; south of the Salado it stayed indigenous until the 1870s.",
  },
  {
    id: "era.chilean-frontier-forts",
    label: "Spanish forts south of the Bio-Bio",
    bounds: [-74, -40, -72.5, -36.5],
    places: ["city-concepcion", "city-valdivia"],
    replaces: ["other-indigenous-american"],
    from: 1550,
    culture: "european",
    architecture: "courtyard",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vols. 1-2"],
    note: "Concepcion and Valdivia held out as Spanish towns; the Mapuche country between them did not.",
  },
  {
    id: "era.patagonia",
    label: "Patagonia and the Araucania",
    bounds: [-76, -56, -53, -36.5],
    replaces: ["other-indigenous-american"],
    from: 1880,
    culture: "european",
    architecture: "board",
    sources: ["Bethell (ed.), Cambridge History of Latin America, vol. 5"],
    note: "Argentina's Conquest of the Desert and Chile's occupation of the Araucania, both 1878-1885, opened the south to settler towns.",
  },
  {
    id: "era.cape-colony",
    label: "Towns of the Cape Colony",
    bounds: [17, -35, 28, -31],
    places: ["city-cape-town", "city-worcester", "city-george", "city-port-elizabeth", "city-east-london", "city-middelburg"],
    replaces: ["east-southern-african"],
    from: 1652,
    culture: "european",
    sources: ["Elphick and Giliomee (eds.), The Shaping of South African Society, 1652-1840"],
    note: "Cape Town from the Dutch station of 1652, the eastern towns from 1786-1847. The Khoikhoi and Xhosa country around them is not listed, so it keeps its own label.",
  },
  {
    id: "era.volga",
    label: "Volga and Kama after the fall of Kazan",
    bounds: [44.5, 45.5, 60, 60],
    replaces: ["inner-eurasian"],
    from: 1560,
    culture: "european",
    architecture: "timber",
    sources: ["Forsyth, A History of the Peoples of Siberia"],
    note: "Kazan fell in 1552 and Astrakhan in 1556; Samara (1586) and Saratov (1590) were founded as Russian forts. The Tatar and Chuvash countryside stayed its own.",
  },
  {
    id: "era.siberia",
    label: "Russian Siberia",
    bounds: [60, 50, 180, 78],
    replaces: ["inner-eurasian"],
    from: 1620,
    culture: "european",
    architecture: "timber",
    sources: ["Forsyth, A History of the Peoples of Siberia"],
    note: "Tyumen 1586, Tomsk 1604, Krasnoyarsk 1628, Yakutsk 1632, Okhotsk 1647, Irkutsk 1661. The forts became Russian towns while Sakha, Evenki, Buryat and Chukchi country lay around them.",
  },
  {
    id: "era.steppe-line",
    label: "Fort line of the southern Urals and Siberian steppe",
    bounds: [55, 49, 87, 56],
    replaces: ["inner-eurasian"],
    from: 1720,
    culture: "european",
    architecture: "timber",
    sources: ["Forsyth, A History of the Peoples of Siberia"],
    note: "Omsk 1716, Semipalatinsk 1718, Barnaul 1730, Chelyabinsk 1736, Orenburg 1743: a century after the forest-belt towns to the north.",
  },
  {
    id: "era.russian-far-east",
    label: "Russian towns of the Amur and Ussuri",
    bounds: [130, 42, 145, 50],
    places: ["city-vladivostok", "city-khabarovsk", "city-yuzhno-sakhalinsk", "city-dalnegorsk"],
    replaces: ["east-asian"],
    from: 1860,
    culture: "european",
    architecture: "timber",
    sources: ["Forsyth, A History of the Peoples of Siberia"],
    note: "The Treaties of Aigun (1858) and Peking (1860) gave Russia the Amur and the Ussuri coast; Khabarovsk was founded in 1858 and Vladivostok in 1860.",
  },
];

const inBox = (
  place: Pick<AtlasPlace, "lon" | "lat">,
  [w, s, e, n]: SettlerEra["bounds"],
) => place.lon >= w && place.lon <= e && place.lat >= s && place.lat <= n;

/** The settler era in force here at this date, or the first to come. Without a
 * date, the first: the one that founded the town. An era naming this place
 * outranks the boxes around it. */
export function settlerEraFor(
  place: Pick<AtlasPlace, "lon" | "lat" | "culture"> & { id?: string },
  year = -Infinity,
): SettlerEra | undefined {
  const here = settlerEras.filter((e) => e.replaces.includes(place.culture) && inBox(place, e.bounds));
  const named = here.filter((e) => e.places?.includes(place.id ?? ""));
  const eras = (named.length ? named : here.filter((e) => !e.places)).sort((a, b) => a.from - b.from);
  return eras.filter((e) => e.from <= year).at(-1) ?? eras[0];
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
  place: Pick<AtlasPlace, "lon" | "lat" | "culture" | "population"> & { id?: string },
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
  const era = settlerEraFor(place, year);
  const population = populationAt(place, year);
  const settled = era && year >= era.from;
  // Before the settlers came, Minot's ground was not yet Minot.
  // Curated names (no modern population) already name the ground at any date.
  const before = era && !settled && place.population
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
