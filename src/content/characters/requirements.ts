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
