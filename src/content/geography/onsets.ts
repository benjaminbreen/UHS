import type { CultureId } from "../history/types";
import type { WorldSetting } from "./types";

/**
 * Rough regional dates for two things the atlas cannot say on its own: when
 * farming settlements appear, and when the present network of named places
 * took shape.
 *
 * These are round numbers from the general archaeological literature, not a
 * reviewed dataset, and they are regional rather than per settlement. They
 * decide only whether a generated place is a camp, a village or a town — they
 * are not a technology ladder and nothing else in the engine reads them.
 */
export type OnsetRule = {
  id: string;
  culture: CultureId;
  /** West, south, east, north degrees. */
  bounds: readonly [number, number, number, number];
  /** Year settled farming appears here. Infinity where foraging persisted. */
  farming: number;
  /** Year the modern network of named places took shape, for regions with no
   * researched street fabric. Omitted means the global default. */
  network?: number;
  note: string;
};

/** The atlas ranks places by modern prominence, so that rank cannot describe
 * anything before the modern network existed. Used where no `network` rule and
 * no researched street fabric apply. */
export const MODERN_RANK_YEAR = 1900;

/** Narrower bounds win, so a specific region is not shadowed by a continental
 * catch-all. Every culture has a catch-all, so no place falls through. */
const rules: OnsetRule[] = [
  // West Asia and North Africa
  {
    id: "fertile-crescent",
    culture: "north-african-west-asian",
    bounds: [32, 29, 50, 40],
    farming: -9500,
    note: "Domestication of wheat, barley, sheep and goats in the Levant, upper Mesopotamia and the Zagros foothills.",
  },
  {
    id: "nile-valley",
    culture: "north-african-west-asian",
    bounds: [24, 15, 37, 32],
    farming: -5500,
    note: "Farming villages along the Nile, later than the Levant.",
  },
  {
    id: "west-asia-north-africa",
    culture: "north-african-west-asian",
    bounds: [-18, 10, 70, 45],
    farming: -6000,
    network: 1500,
    note: "Continental catch-all for the wider region.",
  },
  // Europe
  {
    id: "aegean-anatolia",
    culture: "european",
    bounds: [19, 34, 32, 45],
    farming: -6800,
    note: "Farming reaches Greece and the southern Balkans from Anatolia.",
  },
  {
    id: "temperate-europe",
    culture: "european",
    bounds: [-10, 36, 32, 50],
    farming: -5500,
    note: "Linear Pottery and Mediterranean farming spread across central and southern Europe.",
  },
  {
    id: "northern-europe",
    culture: "european",
    bounds: [-11, 50, 42, 72],
    farming: -4000,
    note: "Farming reaches Britain, Ireland and southern Scandinavia last.",
  },
  {
    id: "european-settler-americas",
    culture: "european",
    bounds: [-170, 5, -30, 75],
    farming: 1600,
    network: 1600,
    note: "Places the atlas assigns to a European culture in the Americas date from colonial settlement.",
  },
  {
    id: "european-settler-oceania",
    culture: "european",
    bounds: [110, -50, 180, -8],
    farming: 1790,
    network: 1790,
    note: "European settlement of Australia and New Zealand.",
  },
  {
    id: "europe",
    culture: "european",
    bounds: [-180, -60, 180, 85],
    farming: -5000,
    network: 1500,
    note: "Continental catch-all.",
  },
  // Inner Eurasia
  {
    id: "central-asian-oases",
    culture: "inner-eurasian",
    bounds: [52, 32, 82, 48],
    farming: -2500,
    note: "Irrigated oasis farming in Transoxiana and the Amu Darya basin.",
  },
  {
    id: "inner-eurasia",
    culture: "inner-eurasian",
    bounds: [-180, -60, 180, 85],
    farming: -2000,
    network: 1700,
    note: "Catch-all for the steppe and Siberia, where herding rather than farming dominates and the named-place network is recent.",
  },
  // South Asia
  {
    id: "indus-basin",
    culture: "south-asian",
    bounds: [60, 20, 80, 36],
    farming: -7000,
    note: "Mehrgarh and the early farming of the Indus borderlands.",
  },
  {
    id: "south-asia",
    culture: "south-asian",
    bounds: [-180, -60, 180, 85],
    farming: -3000,
    network: 1500,
    note: "Catch-all for the peninsula and Ganges plain.",
  },
  // East Asia
  {
    id: "china-river-basins",
    culture: "east-asian",
    bounds: [100, 20, 126, 45],
    farming: -7000,
    network: -1000,
    note: "Millet on the Yellow River and rice on the Yangtze.",
  },
  {
    id: "japan-korea",
    culture: "east-asian",
    bounds: [126, 30, 146, 46],
    farming: -900,
    network: 700,
    note: "Wet rice arrives in the archipelago with the Yayoi; the preceding Jomon were foragers.",
  },
  {
    id: "east-asia",
    culture: "east-asian",
    bounds: [-180, -60, 180, 85],
    farming: -5000,
    network: 1500,
    note: "Continental catch-all.",
  },
  // Southeast Asia
  {
    id: "southeast-asia",
    culture: "southeast-asian",
    bounds: [-180, -60, 180, 85],
    farming: -2500,
    network: 1500,
    note: "Rice farming spreads from southern China through the mainland and islands.",
  },
  // Africa
  {
    id: "sahel-west-africa",
    culture: "west-central-african",
    bounds: [-18, 4, 30, 20],
    farming: -3000,
    note: "Pearl millet and sorghum in the Sahel.",
  },
  {
    id: "west-central-africa",
    culture: "west-central-african",
    bounds: [-180, -60, 180, 85],
    farming: -1000,
    network: 1500,
    note: "Catch-all; farming reaches the equatorial forest with the Bantu expansion.",
  },
  {
    id: "ethiopian-highlands",
    culture: "east-southern-african",
    bounds: [33, 3, 48, 18],
    farming: -2500,
    note: "Teff, ensete and finger millet in the highlands.",
  },
  {
    id: "southern-africa",
    culture: "east-southern-african",
    bounds: [10, -35, 40, -15],
    farming: 300,
    network: 1850,
    note: "Farming reaches southern Africa with the Bantu expansion; large areas stayed forager or herder country until the colonial period.",
  },
  {
    id: "east-southern-africa",
    culture: "east-southern-african",
    bounds: [-180, -60, 180, 85],
    farming: 1,
    network: 1500,
    note: "Catch-all for East Africa.",
  },
  // The Americas
  {
    id: "mesoamerica",
    culture: "mesoamerican",
    bounds: [-180, -60, 180, 85],
    farming: -1800,
    network: 1550,
    note: "Maize was cultivated far earlier, but sedentary farming villages date from the early Formative.",
  },
  {
    id: "andes",
    culture: "andean",
    bounds: [-180, -60, 180, 85],
    farming: -3000,
    network: 1550,
    note: "Potatoes, quinoa and camelid herding in the highlands, with maize and cotton on the coast.",
  },
  {
    id: "eastern-woodlands",
    culture: "other-indigenous-american",
    bounds: [-100, 25, -60, 50],
    farming: -1000,
    network: 1700,
    note: "The Eastern Agricultural Complex, later maize agriculture.",
  },
  {
    id: "american-southwest",
    culture: "other-indigenous-american",
    bounds: [-115, 28, -100, 40],
    farming: -1200,
    network: 1700,
    note: "Maize reaches the Southwest from Mesoamerica.",
  },
  {
    id: "amazonia",
    culture: "other-indigenous-american",
    bounds: [-80, -20, -45, 8],
    farming: -2000,
    network: 1700,
    note: "Manioc and tree crops in the lowlands.",
  },
  {
    id: "other-indigenous-american",
    culture: "other-indigenous-american",
    bounds: [-180, -60, 180, 85],
    farming: Infinity,
    network: 1800,
    note: "Catch-all for the subarctic, plains, Northwest Coast, Great Basin and southern cone, where people lived by hunting, fishing and gathering.",
  },
  // Australia and the Pacific
  {
    id: "new-guinea-highlands",
    culture: "australian-pacific",
    bounds: [136, -11, 151, -1],
    farming: -7000,
    note: "Kuk Swamp: independent cultivation of taro and banana.",
  },
  {
    id: "pacific-islands-west",
    culture: "australian-pacific",
    bounds: [130, -50, 180, 25],
    farming: -1300,
    network: 1800,
    note: "Lapita and later voyagers carry horticulture across the islands; dates vary by archipelago.",
  },
  {
    id: "pacific-islands-east",
    culture: "australian-pacific",
    bounds: [-180, -50, -120, 25],
    farming: 800,
    network: 1800,
    note: "East Polynesia was settled last.",
  },
  {
    id: "australia",
    culture: "australian-pacific",
    bounds: [112, -44, 154, -10],
    farming: Infinity,
    network: 1800,
    note: "Aboriginal Australians lived by hunting, fishing and gathering, with fire and eel-trap management rather than farming villages.",
  },
  {
    id: "australian-pacific",
    culture: "australian-pacific",
    bounds: [-180, -60, 180, 85],
    farming: Infinity,
    network: 1800,
    note: "Catch-all.",
  },
];

const area = (r: OnsetRule) =>
  (r.bounds[2] - r.bounds[0]) * (r.bounds[3] - r.bounds[1]);
const ordered = [...rules].sort((a, b) => area(a) - area(b));

type Where = Pick<WorldSetting, "culture" | "lon" | "lat">;

export function onsetAt(s: Where): OnsetRule | undefined {
  return ordered.find((r) => {
    const [w, south, e, n] = r.bounds;
    return (
      s.culture === r.culture &&
      s.lon >= w &&
      s.lon <= e &&
      s.lat >= south &&
      s.lat <= n
    );
  });
}

/** Year settled farming appears here, or Infinity where foraging persisted. */
export const farmingOnset = (s: Where) => onsetAt(s)?.farming ?? -5000;

/** Year the modern network of named places took shape here. */
export const networkOnset = (s: Where) =>
  onsetAt(s)?.network ?? MODERN_RANK_YEAR;

/** Whether people here live by farming or herding at this date. */
export const farms = (s: Where & Pick<WorldSetting, "year">) =>
  s.year >= farmingOnset(s);
