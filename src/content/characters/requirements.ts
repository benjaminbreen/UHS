import type { WorldSetting } from "../geography/types";
import type { CharacterScope } from "./context-types";
import { domesticFauna } from "../fauna/domestic";
import { workingFauna } from "../fauna/working";
import { directionalFauna } from "../fauna/directional";
import { americanFauna } from "../fauna/americas";

/*
 * What a piece of work cannot be done without. The society-capability gate
 * says whether a people could smelt or write; it cannot say that Cusco had no
 * horses or Tenochtitlan no sheep, so the Andes drew horse herders and the
 * Valley of Mexico wool combers. An animal is read off the fauna table's own
 * range; everything else is a short list of where and when it existed.
 */

const animals = new Map(
  [...domesticFauna, ...workingFauna, ...directionalFauna, ...americanFauna].map(
    (f) => [f.id, f.presence],
  ),
);
const at = (from: number, bounds?: readonly [number, number, number, number], to = 10001): CharacterScope =>
  bounds ? { years: [from, to], bounds } : { years: [from, to] };

const EUROPE = [-25, 35, 45, 72] as const;
/** Europe west of the Bosphorus: the Ottoman lands kept their own institutions. */
const LATIN_EUROPE = [-25, 36, 28, 72] as const;
const MEDITERRANEAN = [-10, 28, 40, 47] as const;
const WEST_ASIA = [25, 12, 63, 45] as const;
const SOUTH_ASIA = [60, 5, 98, 37] as const;
const EAST_ASIA = [98, 18, 146, 54] as const;
const NORTH_AMERICA = [-125, 25, -60, 50] as const;
const BRITAIN = [-6, 50, 2, 56] as const;
/** When a European-style institution reached everywhere else: the Americas
 * first, the African interior last. Kano drew policemen and milliners in 1850. */
const colonial: readonly CharacterScope[] = [
  at(1800, [-170, -56, -30, 72]),
  at(1860, SOUTH_ASIA),
  at(1870, [128, 30, 146, 46]),
  at(1880, WEST_ASIA),
  at(1890, [92, -11, 125, 25]),
  at(1900, EAST_ASIA),
  at(1910),
];

const SCOPES: Record<string, readonly CharacterScope[]> = {
  // Bloomery iron: Anatolia and the Levant by 1200 BCE, Europe and India by
  // 800, China by 600, West Africa (Nok) by 500. None in the Americas or
  // Oceania before contact.
  iron: [
    at(-1200, [25, 25, 60, 45]),
    at(-800, EUROPE),
    at(-800, SOUTH_ASIA),
    at(-600, EAST_ASIA),
    at(-500, [-20, -35, 55, 25]),
    at(-200, [92, -11, 125, 25]),
    at(1521, [-120, 7, -77, 33]),
    at(1533, [-82, -56, -30, 10]),
    at(1800),
  ],
  // The spoked or solid wheel on a cart. The Americas had it on toys only.
  // South of the Sahara it was hardly used before the colonial roads.
  wheel: [
    at(-3500, [-12, 30, 120, 60]),
    at(-1500, [-20, 20, 150, 72]),
    at(-2500, SOUTH_ASIA),
    at(0, [92, -11, 125, 25]),
    at(1520, [-120, -56, -30, 33]),
    at(1800),
  ],
  // Window and vessel glass as a town trade.
  glass: [at(-1500, [25, 22, 50, 40]), at(-50, MEDITERRANEAN), at(100, EUROPE), at(700, WEST_ASIA), ...colonial],
  // A press, or woodblocks cut for the market. Mexico City had a press in
  // 1539; Ottoman Muslims none until 1727; the Mughals none at all.
  print: [
    at(700, EAST_ASIA),
    at(1450, LATIN_EUROPE),
    at(1539, [-105, 13, -86, 23]),
    at(1727, WEST_ASIA),
    at(1800, SOUTH_ASIA),
    ...colonial,
  ],
  // A spring-driven clock or watch to repair.
  clocks: [at(1550, LATIN_EUROPE), ...colonial],
  // Coal or wood fires in chimneyed houses, swept by climbing boys.
  chimneys: [at(1400, LATIN_EUROPE), at(1650, [-100, 25, -50, 55]), ...colonial],
  // A press for olives, sesame or linseed. The Americas pressed none before
  // the Spanish planted olives.
  "oil-press": [at(-3000, [-25, -35, 146, 72]), at(1550, [-120, -56, -30, 33]), ...colonial],
  // A water, animal or wind mill grinding for others. Before it grinding was
  // household work on a quern or metate.
  mills: [at(-300, [-25, 0, 146, 72]), at(1550, [-120, -56, -30, 33]), ...colonial],
  // A shop with a counter, as against a market stall. Old World towns had
  // them from the Roman tabernae and the Chinese walled markets on; Benin and
  // Tenochtitlan traded in great markets instead.
  shops: [at(-1000, [-25, 15, 146, 72]), at(-500, [60, -11, 146, 15]), at(1550, [-120, -56, -30, 33]), ...colonial],
  // A druggist mixing to order: the Abbasid saydalani, the European
  // apothecary, the Chinese medicine shop.
  apothecary: [at(800, WEST_ASIA), at(1100, MEDITERRANEAN), at(1250, EUROPE), at(1000, EAST_ASIA), at(1200, SOUTH_ASIA), ...colonial],
  // Paid teaching of letters to children: the maktab, the Chinese private
  // school, the parish and grammar school.
  schools: [at(-500, EAST_ASIA), at(-400, MEDITERRANEAN), at(700, WEST_ASIA), at(1000, EUROPE), at(1000, SOUTH_ASIA), at(1100, [-17, 8, 16, 20]), ...colonial],
  // Clerks in a counting house or office: Roman scribae, Abbasid katibs,
  // Chinese yamen clerks, Mughal munshis.
  office: [at(-3000, [25, 22, 63, 40]), at(-500, MEDITERRANEAN), at(-200, EAST_ASIA), at(700, WEST_ASIA), at(1100, EUROPE), at(1200, SOUTH_ASIA), at(1530, [-105, 13, -86, 23]), ...colonial],
  // Fleece that can be combed and fulled. The hair sheep of the West
  // African forest and most of the Sahel had none; Macina on the Niger bred
  // a wool sheep, and the Andes had the llama and alpaca.
  wool: [
    at(-3000, [-20, 20, 140, 72]),
    at(-2000, [-82, -25, -63, 0]),
    at(1000, [-6, 13, -2, 16]),
    at(1550, [-120, -56, -30, 33]),
    at(1800, [110, -50, 180, -10]),
  ],
  // Veneered case furniture: the London and Paris trade of the seventeenth
  // century; joiners and carpenters before it and elsewhere.
  cabinetry: [at(1600, LATIN_EUROPE), at(1700, [-100, 15, -50, 50]), ...colonial],
  // Fat rendered for candles and soap. Mesoamerica lit with pine torches and
  // washed with soap-plant; neither had the trade before cattle and sheep.
  // West Africa lit with palm-oil lamps; its black soap was palm oil and ash.
  tallow: [at(-3000, [-25, 15, 146, 72]), at(-500, [60, -11, 146, 15]), at(1520, [-120, -56, -30, 33]), ...colonial],
  soap: [at(-100, [-25, 15, 146, 72]), at(1000, [-18, 0, 20, 15]), at(1520, [-120, -56, -30, 33]), ...colonial],
  // Letter carriers on a public post; the Thurn und Taxis and royal posts in
  // Europe, Franklin's in the colonies.
  post: [at(1680, LATIN_EUROPE), at(1775, NORTH_AMERICA), ...colonial],
  // Uniformed street police: the Paris lieutenance, then the London
  // Metropolitan Police of 1829 and the American city forces of the 1840s.
  police: [at(1700, [-5, 42, 8, 51]), at(1829, LATIN_EUROPE), at(1845, NORTH_AMERICA), ...colonial],
  // The waged service work of a European-style town: charwomen, errand boys,
  // hospital nurses, bank clerks.
  "modern-town": [at(1700, LATIN_EUROPE), at(1750, NORTH_AMERICA), ...colonial],
  "street-lighting": [at(1667, LATIN_EUROPE), at(1750, NORTH_AMERICA), ...colonial],
  // Powered mills: Arkwright's Cromford in 1771, the Continent after the
  // wars, Lowell in 1823, Bombay's first cotton mill in 1854, Meiji Japan,
  // Russia's industrial take-off.
  factories: [
    at(1780, BRITAIN),
    at(1815, LATIN_EUROPE),
    at(1820, NORTH_AMERICA),
    at(1855, SOUTH_ASIA),
    at(1875, [128, 30, 146, 46]),
    at(1880, [20, 40, 60, 62]),
    at(1895, EAST_ASIA),
    at(1880, [-120, -56, -30, 33]),
    at(1920),
  ],
  railways: [
    at(1825, BRITAIN),
    at(1835, LATIN_EUROPE),
    at(1830, NORTH_AMERICA),
    at(1853, SOUTH_ASIA),
    at(1872, [128, 30, 146, 46]),
    at(1880, [-120, -56, -30, 33]),
    at(1890),
  ],
  // Dromedaries and Bactrians as the herd a people lives by: the Sahara,
  // Arabia, the Iranian and Turan deserts and the Gobi. Not Mediterranean
  // scrub, which the ecology alone let in.
  "camel-country": [
    at(-1000, [-17, 12, 60, 33]),
    at(-1000, [34, 12, 60, 37]),
    at(-1000, [48, 24, 78, 46]),
    at(-1000, [88, 37, 122, 48]),
    at(1860, [112, -38, 150, -12]),
  ],
  // Stave barrels: Celtic Iron Age, then Roman Europe. The Islamic world and
  // the East used jars and skins.
  cask: [at(-300, [-12, 36, 30, 62]), at(500, EUROPE), at(1600, [-120, -56, -30, 72]), ...colonial],
  // A craft hierarchy of master, wage-earning journeyman and bound
  // apprentice. European guilds; the Ottoman esnaf with usta, kalfa and
  // çırak; Chinese and Japanese trade guilds. Not the hereditary crafts of
  // India, Benin or the calpolli.
  "journeymen": [at(1150, EUROPE), at(1450, [20, 28, 50, 45]), at(1000, [100, 18, 125, 45]), at(1600, [128, 30, 146, 46]), ...colonial],
  // Cane boiled down for export: Madeira and São Tomé, then Brazil, the
  // Caribbean, Louisiana, the Mascarenes, Java, Natal, Fiji and Hawaii.
  sugar: [
    at(1450, [-18, 0, 8, 33], 1650),
    at(1540, [-45, -25, -34, -3], 1950),
    at(1640, [-86, 10, -59, 24]),
    at(1795, [-94, 28, -88, 32], 1950),
    at(1730, [55, -22, 58, -19]),
    at(1830, [105, -9, 115, -5], 1960),
    at(1850, [29, -31, 32, -27]),
    at(1870, [176, -19, 180, -16]),
    at(1835, [-161, 18, -154, 23], 1995),
    // Jaggery and boiled sugar for the home market, long before the export estates.
    at(300, [66, 6, 92, 34]),
    at(1000, [104, 18, 122, 27]),
  ],
  indigo: [at(1744, [-82, 31.5, -78.5, 34.5], 1800), at(1777, [84, 21, 92, 27], 1900)],
  // Any export estate worked by gangs: sugar, Chesapeake tobacco, Lowcountry
  // rice, upland cotton, Brazilian and Ceylon coffee, Assam and Ceylon tea,
  // Malayan and Sumatran rubber.
  plantation: [
    at(1450, [-18, 0, 8, 33], 1650),
    at(1540, [-55, -25, -34, -3], 1960),
    at(1620, [-86, 10, -59, 24], 1960),
    at(1620, [-98, 28, -74, 40], 1940),
    at(1730, [55, -22, 58, -19]),
    at(1830, [79, 5, 82, 10], 1980),
    at(1840, [88, 24, 97, 28], 1980),
    at(1830, [95, -9, 115, 6], 1960),
    at(1850, [29, -31, 32, -27]),
    at(1870, [176, -19, 180, -16]),
    at(1850, [-161, 18, -154, 23], 1995),
    at(1900, [99, 1, 105, 7], 1980),
    at(1926, [-11, 4, -8, 8]),
  ],
  // Contracted Asian and Pacific labour after abolition: Indians to Mauritius,
  // the Caribbean, Natal and Fiji; Chinese to Cuba and Peru; Javanese to
  // Suriname; Islanders to Queensland.
  indenture: [
    at(1834, [55, -22, 58, -19], 1925),
    at(1838, [-62, 5, -52, 11], 1925),
    at(1845, [-62, 10, -60, 11], 1925),
    at(1847, [-85, 19, -74, 23.5], 1875),
    at(1849, [-82, -18, -75, -4], 1875),
    at(1860, [29, -31, 32, -27], 1912),
    at(1863, [138, -29, 154, -10], 1907),
    at(1879, [176, -19, 180, -16], 1920),
    at(1873, [-58, 2, -53, 6], 1940),
    at(1840, [79, 5, 82, 10], 1940),
    at(1880, [99, 1, 105, 7], 1940),
  ],
  // Hevea tapped wild on the Amazon from the vulcanisation boom, then on
  // estates in Malaya, Sumatra, Ceylon, Indochina and Liberia.
  rubber: [
    at(1850, [-75, -15, -45, 5]),
    at(1900, [95, -6, 120, 8]),
    at(1905, [79, 5, 82, 10]),
    at(1910, [102, 8, 108, 14]),
    at(1926, [-11, 4, -8, 8]),
    at(1960, [-8, 4, 10, 10]),
  ],
  // Oilfields: Pennsylvania, Baku, Galicia and Romania, Burma, Sumatra,
  // Texas and California, Persia, Mexico, Venezuela, the Gulf, Alberta,
  // Nigeria, Siberia and the North Sea.
  oil: [
    at(1859, [-81, 39, -78, 43], 1950),
    at(1857, [23, 44, 27, 50]),
    at(1872, [46, 38, 51, 42]),
    at(1880, [94, 19, 96, 22]),
    at(1890, [95, -5, 119, 6]),
    at(1892, [-121, 33, -117, 36]),
    at(1901, [-104, 26, -93, 37]),
    at(1908, [47, 28, 52, 33]),
    at(1910, [-99, 18, -94, 23]),
    at(1914, [-73, 8, -70, 12]),
    at(1932, [46, 22, 57, 30]),
    at(1947, [-120, 50, -110, 58]),
    at(1958, [4, 4, 8, 6]),
    at(1965, [65, 55, 80, 65]),
    at(1970, [-3, 56, 7, 62]),
  ],
  // Stored-program machines in offices and laboratories, then everywhere.
  computers: [at(1955, [-125, 25, -60, 50]), at(1958, [-11, 36, 40, 62]), at(1962, [128, 30, 146, 46]), at(1980, [-180, -60, 180, 72])],
  // Irregular war: the Peninsular guerrilla, the Mexican Revolution, the
  // European resistance, the wars of decolonisation and the Central American
  // and Afghan insurgencies.
  insurgency: [
    at(1808, [-10, 36, 3, 44], 1814),
    at(1910, [-118, 14, -86, 33], 1930),
    at(1941, [12, 36, 45, 56], 1946),
    at(1940, [-5, 42, 8, 51], 1945),
    at(1942, [116, 4, 127, 21], 1946),
    at(1937, [105, 22, 125, 42], 1950),
    at(1945, [95, -11, 141, 6], 1950),
    at(1946, [102, 8, 110, 24], 1976),
    at(1952, [34, -5, 42, 5], 1961),
    at(1954, [-9, 19, 12, 37], 1963),
    at(1956, [-85, 19, -74, 23.5], 1960),
    at(1961, [11, -27, 41, -8], 1981),
    at(1963, [-18, 10, -13, 13], 1975),
    at(1960, [-92, 7, -82, 18], 1997),
    at(1979, [60, 29, 75, 39], 1993),
    at(1916, [34, 20, 45, 32], 1919),
    at(1936, [33, 3, 48, 15], 1942),
  ],
};

/** Some animal that can be milked, ridden, yoked or shorn. */
const ANY_OF: Record<string, readonly string[]> = {
  draught: ["cattle", "horse", "water-buffalo", "donkey", "camel"],
  milk: ["cattle", "goat", "sheep", "water-buffalo", "camel"],
  "pack-animal": ["donkey", "horse", "camel", "llama"],
  "herd-animal": ["sheep", "goat", "cattle", "llama", "camel", "horse", "water-buffalo"],
};

function present(scopes: readonly CharacterScope[], s: WorldSetting) {
  return scopes.some(
    (scope) =>
      s.year >= scope.years[0] &&
      s.year < scope.years[1] &&
      (!scope.bounds ||
        (s.lon >= scope.bounds[0] &&
          s.lat >= scope.bounds[1] &&
          s.lon <= scope.bounds[2] &&
          s.lat <= scope.bounds[3])),
  );
}

const coastal = (s: WorldSetting) =>
  s.water.startsWith("coast") || s.water === "island" || s.water === "ocean";

export function requirementMet(r: string, s: WorldSetting): boolean {
  if (r === "coast") return coastal(s);
  if (r === "countryside") return s.settlement !== "city" && s.settlement !== "port";
  if (ANY_OF[r]) return ANY_OF[r].some((a) => requirementMet(a, s));
  const scopes = SCOPES[r] ?? animals.get(r);
  if (!scopes) throw Error(`Unknown work requirement: ${r}`);
  return present(scopes, s);
}

export const knownRequirements = [
  "coast",
  "countryside",
  ...Object.keys(ANY_OF),
  ...Object.keys(SCOPES),
  ...animals.keys(),
];
