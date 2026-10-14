import { matchesCharacterScope } from "../characters/resolve";
import type { CharacterScope } from "../characters/context-types";
import type { WorldSetting } from "../geography/types";

/** Kinds of punishment, lightest first in each list. Execution and
 * mutilation are left out: petty wrongs rarely came to them. */
export type Penalty = "compensation" | "fine" | "shaming" | "beating" | "labour" | "confinement" | "exile";
/** Who a wronged person goes to, the building they would find them in, and
 * what they could do about it. `shaming` and `beating` name the local form. */
export type OrderKeeper = { who: string; hall?: RegExp; penalties: Penalty[]; shaming?: string; beating?: string };

const box = (w: number, s: number, e: number, n: number) => [w, s, e, n] as const;
const LOS_ANGELES = box(-119, 33.6, -117.6, 34.4);
const NEW_YORK = box(-74.3, 40.4, -73.6, 41);
const LONDON = box(-0.6, 51.3, 0.4, 51.7);
const PARIS = box(2, 48.7, 2.7, 49);
const ROME = box(12.3, 41.7, 12.7, 42.05);
const BRITAIN = box(-8, 49.5, 2, 59);
const ITALY = box(6.5, 36.5, 18.6, 47);
const GREECE = box(19, 34.5, 29, 42);
const FRANCE = box(-5, 42, 8, 51.5);
const IBERIA = box(-10, 36, 3.5, 44);
const GERMANY = box(5.5, 45.5, 17, 55.5);
const SCANDINAVIA = box(4, 54.5, 32, 71);
const RUSSIA = box(27, 45, 60, 65);
const EGYPT = box(24, 22, 35, 32);
const LEVANT = box(34, 29, 37.5, 37);
const MESOPOTAMIA = box(38, 29, 50, 38);
const ANATOLIA = box(26, 36, 45, 42.5);
const PERSIA = box(44, 25, 63, 40);
const ISLAMIC = box(-10, 10, 70, 42);
const INDIA = box(68, 6, 92, 35);
const CHINA = box(98, 18, 125, 45);
const JAPAN = box(129, 30, 146, 46);
const MESOAMERICA = box(-106, 13, -86, 23);
const ANDES = box(-81, -30, -63, 2);
const NORTH_AMERICA = box(-130, 24, -60, 55);
const WEST_AFRICA = box(-18, 4, 15, 18);

type Law = Pick<OrderKeeper, "penalties" | "shaming" | "beating">;
const MODERN: Law = { penalties: ["fine", "confinement"] };
const EUROPE_OLD: Law = { penalties: ["compensation", "fine", "shaming", "beating"], shaming: "the stocks", beating: "a whipping" };
const ROMAN: Law = { penalties: ["compensation", "fine", "beating", "labour"], beating: "a beating with rods" };
const GREEK: Law = { penalties: ["compensation", "fine", "shaming"], shaming: "the stocks" };
const NORSE: Law = { penalties: ["compensation", "exile"] };
const ISLAMIC_LAW: Law = { penalties: ["compensation", "fine", "beating"], beating: "lashes" };
const CHINESE: Law = { penalties: ["compensation", "beating", "shaming", "labour"], shaming: "the cangue", beating: "strokes of the bamboo" };
const EDO: Law = { penalties: ["compensation", "fine", "beating", "exile"], beating: "a flogging" };
const INDIC: Law = { penalties: ["compensation", "fine", "beating", "exile"], beating: "a caning" };
const COLONIAL_INDIA: Law = { penalties: ["fine", "beating", "confinement"], beating: "a caning" };
const AZTEC: Law = { penalties: ["compensation", "shaming", "labour"], shaming: "a public shaving of the head" };
const ANDEAN: Law = { penalties: ["compensation", "shaming", "beating", "exile"], shaming: "a public rebuke", beating: "a beating" };
const PHARAONIC: Law = { penalties: ["compensation", "beating", "labour"], beating: "a hundred blows" };
const NEAR_EAST: Law = { penalties: ["compensation", "fine", "beating"], beating: "a beating" };
const CUSTOMARY: Law = { penalties: ["compensation", "fine", "exile"] };
const ELDERS: Law = { penalties: ["compensation", "exile"] };
const TSARIST: Law = { penalties: ["fine", "beating", "confinement"], beating: "the knout" };
const SOVIET: Law = { penalties: ["fine", "labour", "confinement"] };
const COLONIAL_SPAIN: Law = { penalties: ["compensation", "fine", "shaming", "beating"], shaming: "the pillory", beating: "a whipping" };

const POLICE = /police|station|gendarm/i;
const COURT = /court|hall|council|moot/i;

// Most specific first; the first that matches wins. Educated guesses from
// what each period's records say ordinary people complained to.
const KEEPERS: (OrderKeeper & { scope: CharacterScope })[] = [
  { scope: { years: [1869, 2100], bounds: LOS_ANGELES }, who: "the Los Angeles police", hall: POLICE, ...MODERN },
  { scope: { years: [1845, 2100], bounds: NEW_YORK }, who: "the New York police", hall: POLICE, ...MODERN },
  { scope: { years: [1829, 2100], bounds: LONDON }, who: "the Metropolitan Police", hall: POLICE, ...MODERN },
  { scope: { years: [1667, 1790], bounds: PARIS }, who: "the lieutenant of police", ...EUROPE_OLD },
  { scope: { years: [-509, 476], bounds: ROME }, who: "the praetor", hall: /basilica|forum/i, ...ROMAN },

  { scope: { years: [1829, 2100], bounds: BRITAIN }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [1600, 1829], bounds: BRITAIN }, who: "the justice of the peace", ...EUROPE_OLD },
  { scope: { years: [1066, 1600], bounds: BRITAIN }, who: "the sheriff of the shire", hall: COURT, ...EUROPE_OLD },
  { scope: { years: [600, 1066], bounds: BRITAIN }, who: "the reeve", hall: COURT, ...EUROPE_OLD },
  { scope: { years: [43, 410], bounds: BRITAIN }, who: "the Roman magistrates", ...ROMAN },

  { scope: { years: [1861, 2100], bounds: ITALY }, who: "the carabinieri", hall: POLICE, ...MODERN },
  { scope: { years: [1100, 1861], bounds: ITALY }, who: "the podestà", hall: /palazzo|hall|council/i, ...EUROPE_OLD },
  { scope: { years: [476, 1100], bounds: ITALY }, who: "the count's officers", ...EUROPE_OLD },
  { scope: { years: [-509, 476], bounds: ITALY }, who: "the magistrate", hall: /basilica|forum/i, ...ROMAN },

  { scope: { years: [1830, 2100], bounds: GREECE }, who: "the gendarmes", hall: POLICE, ...MODERN },
  { scope: { years: [1453, 1830], bounds: GREECE }, who: "the kadi", ...ISLAMIC_LAW },
  { scope: { years: [-800, -146], bounds: GREECE }, who: "the archons", ...GREEK },

  { scope: { years: [1790, 2100], bounds: FRANCE }, who: "the gendarmes", hall: POLICE, ...MODERN },
  { scope: { years: [1200, 1790], bounds: FRANCE }, who: "the provost", ...EUROPE_OLD },
  { scope: { years: [500, 1200], bounds: FRANCE }, who: "the count's provost", ...EUROPE_OLD },

  { scope: { years: [1844, 2100], bounds: IBERIA }, who: "the Guardia Civil", hall: POLICE, ...MODERN },
  { scope: { years: [1100, 1844], bounds: IBERIA }, who: "the alcalde", ...COLONIAL_SPAIN },

  { scope: { years: [1806, 2100], bounds: GERMANY }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [900, 1806], bounds: GERMANY }, who: "the Schultheiss", ...EUROPE_OLD },

  { scope: { years: [1100, 2100], bounds: SCANDINAVIA }, who: "the king's bailiff", ...EUROPE_OLD },
  { scope: { years: [700, 1100], bounds: SCANDINAVIA }, who: "the thing, when it next meets", ...NORSE },

  { scope: { years: [1917, 2100], bounds: RUSSIA }, who: "the militia", hall: POLICE, ...SOVIET },
  { scope: { years: [1700, 1917], bounds: RUSSIA }, who: "the police", hall: POLICE, ...TSARIST },
  { scope: { years: [900, 1700], bounds: RUSSIA }, who: "the prince's men", ...NEAR_EAST },

  { scope: { years: [1800, 2100], bounds: EGYPT }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [-30, 641], bounds: EGYPT }, who: "the Roman prefect's men", ...ROMAN },
  { scope: { years: [-3100, -30], bounds: EGYPT }, who: "the kenbet, the village court", hall: /temple|court/i, ...PHARAONIC },

  { scope: { years: [-1200, -586], bounds: LEVANT }, who: "the elders at the gate", ...NEAR_EAST },
  { scope: { years: [-3500, -539], bounds: MESOPOTAMIA }, who: "the judges at the temple gate", hall: /temple|ziggurat/i, ...NEAR_EAST },
  { scope: { years: [-1650, -1180], bounds: ANATOLIA }, who: "the town elders", ...NEAR_EAST },
  { scope: { years: [1923, 2100], bounds: ANATOLIA }, who: "the gendarmerie", hall: POLICE, ...MODERN },
  { scope: { years: [-550, 651], bounds: PERSIA }, who: "the satrap's officers", ...NEAR_EAST },
  { scope: { years: [632, 1900], bounds: ISLAMIC }, who: "the qadi", hall: /mosque|court/i, ...ISLAMIC_LAW },

  { scope: { years: [1947, 2100], bounds: INDIA }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [1757, 1947], bounds: INDIA }, who: "the daroga at the thana", hall: POLICE, ...COLONIAL_INDIA },
  { scope: { years: [1200, 1757], bounds: INDIA }, who: "the kotwal", ...INDIC },
  { scope: { years: [-600, 1200], bounds: INDIA }, who: "the panchayat", ...INDIC },

  { scope: { years: [1912, 2100], bounds: CHINA }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [-221, 1912], bounds: CHINA }, who: "the magistrate's yamen", hall: /yamen|magistrat/i, ...CHINESE },
  { scope: { years: [-1600, -221], bounds: CHINA }, who: "the lord's officers", ...CHINESE },

  { scope: { years: [1868, 2100], bounds: JAPAN }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [1603, 1868], bounds: JAPAN }, who: "the village headman", ...EDO },
  { scope: { years: [794, 1603], bounds: JAPAN }, who: "the lord's steward", ...EDO },

  { scope: { years: [1821, 2100], bounds: MESOAMERICA }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [1521, 1821], bounds: MESOAMERICA }, who: "the alcalde", ...COLONIAL_SPAIN },
  { scope: { years: [1300, 1521], bounds: MESOAMERICA }, who: "the calpulli headman", ...AZTEC },

  { scope: { years: [1533, 1825], bounds: ANDES }, who: "the corregidor", ...COLONIAL_SPAIN },
  { scope: { years: [1400, 1533], bounds: ANDES }, who: "the curaca", ...ANDEAN },

  { scope: { years: [1850, 2100], bounds: NORTH_AMERICA }, who: "the police", hall: POLICE, ...MODERN },
  { scope: { years: [1607, 1850], bounds: NORTH_AMERICA }, who: "the county sheriff", hall: COURT, ...EUROPE_OLD },
  { scope: { years: [-10000, 1607], bounds: NORTH_AMERICA }, who: "the council of elders", ...ELDERS },

  { scope: { years: [300, 1900], bounds: WEST_AFRICA }, who: "the chief's court", ...CUSTOMARY },
];

/** Who keeps order in this setting. Unresearched places fall back on the
 * size of the place and the century rather than a vague phrase. */
export function orderKeeper(setting?: WorldSetting): OrderKeeper {
  const found = setting && KEEPERS.find((k) => matchesCharacterScope(k.scope, setting, "*"));
  if (found) return found;
  const year = setting?.year ?? 0;
  if (year >= 1900) return { who: "the police", hall: POLICE, ...MODERN };
  if (setting?.settlement === "camp" || year < -3000) return { who: "the elders", ...ELDERS };
  if (setting?.settlement === "city" || setting?.settlement === "port") return { who: "the city's officers", ...NEAR_EAST };
  return { who: "the headman", ...CUSTOMARY };
}
