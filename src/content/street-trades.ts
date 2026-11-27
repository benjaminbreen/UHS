import type { StreetSoundKind } from "../audio/sfx";
import type { CharacterScope } from "./characters/context-types";
import { matchesCharacterScope } from "./characters/resolve";
import type { WorldSetting } from "./geography/types";

/** People who work the streets on a round: they walk the town every day it
 * suits them, stop at doors, corners or lamps, and are heard before they are seen. */
export type StreetTrade = {
  id: string;
  scope: CharacterScope;
  /** The livelihood they dress as. */
  dress: string;
  label: string;
  /** What they carry, over whatever their dress would give them. */
  kit?: string;
  /** Hours of the round; past 24 runs into the small hours of the next day. */
  hours: readonly [number, number];
  /** Seasons they come out in; any season unset. */
  seasons?: readonly string[];
  /** Where they stop: lamps in the order they light them, doors, or corners. */
  round: "lamps" | "doors" | "corners";
  stops: number;
  minutes: number;
  doing: string;
  stopping: string;
  /** What they call, in plain English; `{clock}` is the hour in words. */
  cry: string;
  /** The words as they were called, glossed. */
  heard?: string;
  sound: StreetSoundKind;
  women?: number;
  /** The town keeps one every day the scope holds, not by chance. */
  civic?: boolean;
  weight: number;
  note: string;
};

const BRITAIN: CharacterScope["bounds"] = [-11, 49, 2, 61];
const GERMAN: CharacterScope["bounds"] = [5, 45.5, 17.5, 55];
const IBERIA: CharacterScope["bounds"] = [-10, 36, 3.5, 44];
const JAPAN: CharacterScope["bounds"] = [129, 30, 146, 46];
const NORTH_CHINA: CharacterScope["bounds"] = [110, 34, 124, 42.5];
const ISTANBUL: CharacterScope["bounds"] = [27.5, 40.5, 30, 41.6];
const EUROPE = { cultures: ["european"] } as const;

export const streetTrades: readonly StreetTrade[] = [
  {
    id: "lamplighter", scope: { years: [1700, 1930], ...EUROPE }, dress: "lamplighter", label: "Lamplighter", kit: "lamp-pole",
    hours: [17.5, 20], round: "lamps", stops: 22, minutes: 1, doing: "Going round the lamps", stopping: "Lighting a lamp",
    cry: "Lights!", sound: "cry", civic: true, weight: 1,
    note: "Documented: oil-lamp contractors from about 1700, then the gas companies' lighters, each with a round of some fifty to a hundred lamps, lit at dusk and put out at dawn.",
  },
  {
    id: "watch", scope: { years: [1500, 1840], ...EUROPE, except: [GERMAN!] }, dress: "night-watchman", label: "Night watchman", kit: "lantern",
    hours: [21, 29], round: "corners", stops: 8, minutes: 4, doing: "Walking the watch", stopping: "Calling the hour",
    cry: "Past {clock} o'clock, and a fine night!", heard: "\"Past twelve o'clock and a fine night\", the London charley's call", sound: "cry", civic: true, weight: 1,
    note: "Documented: parish watchmen called the hour and the weather at each corner until police forces replaced them (London 1829).",
  },
  {
    id: "watch-horn", scope: { years: [1400, 1900], bounds: GERMAN }, dress: "night-watchman", label: "Night watchman", kit: "lantern",
    hours: [21, 29], round: "corners", stops: 8, minutes: 4, doing: "Walking the watch", stopping: "Calling the hour",
    cry: "Hear me, people: the clock has struck {clock}. Mind your fire and your light!", heard: "\"Hört, ihr Herrn, und lasst euch sagen\", the Nachtwächter's song", sound: "watch-horn", civic: true, weight: 1,
    note: "Documented: the German town watchman blew his horn and sang the hour with a warning about fire; some towns kept him into the twentieth century.",
  },
  {
    id: "fire-watch", scope: { years: [1650, 1960], bounds: JAPAN }, dress: "night-watchman", label: "Fire watch", kit: "clappers",
    hours: [20, 26], round: "corners", stops: 10, minutes: 2, doing: "Walking the fire watch", stopping: "Striking the clappers",
    cry: "Beware of fire!", heard: "\"Hi no yōjin\", struck between with hyōshigi, wooden clappers", sound: "clappers", civic: true, weight: 1,
    note: "Documented: Edo's neighbourhood fire watches walked winter nights striking clappers; the custom survives in some towns.",
  },
  {
    id: "watch-china", scope: { years: [600, 1930], cultures: ["east-asian"], except: [JAPAN!] }, dress: "night-watchman", label: "Watchman", kit: "clappers",
    hours: [19, 29], round: "corners", stops: 8, minutes: 3, doing: "Walking the watch", stopping: "Beating the watch",
    cry: "Dry weather: mind your fires and candles!", heard: "\"Tiān gān wù zào, xiǎoxīn huǒzhú\"", sound: "night-clappers", civic: true, weight: 1,
    note: "Documented: the gengfu beat a wooden clapper and gong the number of the watch, one knock for the first watch to five for the fifth.",
  },
  {
    id: "grinder", scope: { years: [1500, 1990], ...EUROPE, except: [IBERIA!] }, dress: "knife-grinder", label: "Knife grinder", kit: "grinder-wheel",
    hours: [9, 16], round: "doors", stops: 6, minutes: 20, doing: "Wheeling the grindstone round", stopping: "Grinding knives",
    cry: "Knives to grind! Scissors to grind!", sound: "hand-bell", weight: 3,
    note: "Documented: itinerant grinders with a wheel on a barrow or a frame carried on the back, from the sixteenth-century cries of Paris and London on.",
  },
  {
    id: "afilador", scope: { years: [1700, 1990], bounds: IBERIA }, dress: "knife-grinder", label: "Knife grinder", kit: "grinder-wheel",
    hours: [9, 16], round: "doors", stops: 6, minutes: 20, doing: "Wheeling the grindstone round", stopping: "Grinding knives",
    cry: "Knives and scissors! Umbrellas mended!", heard: "Called by a rising run on the chiflo, the afilador's panpipe", sound: "pan-flute", weight: 3,
    note: "Documented: the Galician afiladores of Ourense travelled all Spain; their panpipe tune was the sign everyone knew.",
  },
  {
    id: "grinder-china", scope: { years: [1600, 1990], cultures: ["east-asian"] }, dress: "knife-grinder", label: "Knife grinder", kit: "grinder-bench",
    hours: [9, 16], round: "doors", stops: 6, minutes: 20, doing: "Carrying the bench round", stopping: "Sharpening cleavers",
    cry: "Scissors to grind, cleavers to sharpen!", heard: "\"Mó jiǎnzi lei, qiàng càidāo\", after a shake of the huàntou, five iron leaves on a string", sound: "iron-clappers", weight: 3,
    note: "Documented: Beijing's grinders carried a bench with the whetstone fixed at one end; each street trade had its own sound-maker.",
  },
  {
    id: "saqqa", scope: { years: [1500, 1930], cultures: ["north-african-west-asian"] }, dress: "water-carrier", label: "Water seller", kit: "water-skin",
    hours: [8, 18], round: "corners", stops: 8, minutes: 10, doing: "Selling water in the street", stopping: "Pouring water",
    cry: "Water! God's water, cool and clean!", heard: "The saqqa's call, over the clink of his brass cups", sound: "brass-cups", weight: 3,
    note: "Documented: Cairo's water sellers had a guild; Lane counted them as one of the commonest sights of the streets in the 1830s.",
  },
  {
    id: "licorice", scope: { years: [1700, 10001], cultures: ["north-african-west-asian"] }, dress: "juice-seller", label: "Licorice-juice seller", kit: "juice-urn",
    hours: [10, 19], round: "corners", stops: 6, minutes: 15, doing: "Selling licorice juice", stopping: "Pouring juice",
    cry: "Licorice! Cool and sweet!", heard: "\"'Erk sous!\", with a clash of the brass cups like cymbals", sound: "cymbals", weight: 2,
    note: "Documented: the 'erk sous seller with his urn, spout over the shoulder, is still seen in Cairo and Damascus, above all in Ramadan.",
  },
  {
    id: "goldfish", scope: { years: [1750, 1960], bounds: JAPAN }, dress: "goldfish-seller", label: "Goldfish seller", kit: "fish-tubs",
    hours: [9, 17], seasons: ["summer"], round: "corners", stops: 6, minutes: 15, doing: "Carrying goldfish round", stopping: "Selling goldfish",
    cry: "Goldfish! Goldfish!", heard: "\"Kingyo-e, kingyo\"", sound: "cry", weight: 3,
    note: "Documented: the kingyo-uri with tubs on a pole was a summer sound of Edo and Tokyo into the twentieth century.",
  },
  {
    id: "tofu", scope: { years: [1870, 1975], bounds: JAPAN }, dress: "street-vendor", label: "Tofu seller", kit: "carrying-pole",
    hours: [6, 9], round: "doors", stops: 8, minutes: 4, doing: "Carrying tofu round", stopping: "Selling tofu",
    cry: "Tofu!", heard: "Called on a brass horn, the rappa, whose two notes sound like \"tō-fu\"", sound: "tofu-horn", women: 0.1, weight: 3,
    note: "Documented: tofu sellers took up the horn from the street-car conductors' bugles of the Meiji years.",
  },
  {
    id: "muffin", scope: { years: [1800, 1930], bounds: BRITAIN }, dress: "street-vendor", label: "Muffin man", kit: "hand-bell",
    hours: [15, 18], seasons: ["autumn", "winter"], round: "doors", stops: 8, minutes: 4, doing: "Bringing muffins round for tea", stopping: "Selling muffins",
    cry: "Muffins! Hot muffins!", sound: "hand-bell", weight: 2,
    note: "Documented: the muffin man rang a bell on winter afternoons with a tray on his head; a bill of 1839 tried to ban the bell.",
  },
  {
    id: "crier", scope: { years: [1300, 1900], ...EUROPE }, dress: "town-crier", label: "Town crier", kit: "hand-bell",
    hours: [10, 13], round: "corners", stops: 5, minutes: 6, doing: "Crying the news", stopping: "Crying the news",
    cry: "Oyez! Oyez! Oyez!", heard: "\"Oyez\": \"hear ye\", in the law French of the courts", sound: "hand-bell", civic: true, weight: 1,
    note: "Documented: criers read proclamations, sales, lost goods and the dates of fairs at fixed points, ending \"God save the King\".",
  },
  {
    id: "balloons", scope: { years: [1890, 10001] }, dress: "balloon-seller", label: "Balloon seller", kit: "balloons",
    hours: [11, 18], round: "corners", stops: 4, minutes: 30, doing: "Walking with the balloons", stopping: "Selling balloons",
    cry: "Balloons! Who wants a balloon?", sound: "cry", women: 0.3, weight: 1,
    note: "Documented: rubber balloons sold in parks and on boulevards from the 1890s; gas-filled ones from about 1900.",
  },
  {
    id: "organ", scope: { years: [1800, 1940], ...EUROPE }, dress: "organ-grinder", label: "Organ grinder", kit: "barrel-organ",
    hours: [11, 18], round: "corners", stops: 4, minutes: 30, doing: "Carrying the organ round", stopping: "Playing the organ",
    cry: "A penny for the monkey!", sound: "barrel-organ", weight: 1,
    note: "Documented: Italian organ grinders, often from Parma and the Ligurian hills, worked London, Paris and New York, many with a capuchin monkey.",
  },
  {
    id: "sweep", scope: { years: [1700, 1900], ...EUROPE }, dress: "chimney-sweep", label: "Chimney sweep", kit: "sweep-brush",
    hours: [6, 10], seasons: ["autumn", "winter", "spring"], round: "doors", stops: 4, minutes: 25, doing: "Going round for chimneys", stopping: "Sweeping a chimney",
    cry: "Sweep! Sweep-o!", sound: "cry", weight: 2,
    note: "Documented: master sweeps and their climbing boys walked the streets crying for work until the 1875 act ended climbing.",
  },
  {
    id: "rag-and-bone", scope: { years: [1800, 1975], bounds: BRITAIN }, dress: "rag-and-bone", label: "Rag-and-bone man",
    hours: [9, 15], round: "doors", stops: 8, minutes: 5, doing: "Collecting rags and bones", stopping: "Buying old things",
    cry: "Any old iron! Rag and bone!", sound: "cry", weight: 2,
    note: "Documented: totters bought rags, bones, bottles and scrap at the door, from a sack and later a pony cart.",
  },
  {
    id: "haws", scope: { years: [1700, 10001], bounds: NORTH_CHINA }, dress: "hawker", label: "Candied-haw seller", kit: "haw-pole",
    hours: [10, 18], seasons: ["winter"], round: "corners", stops: 6, minutes: 15, doing: "Carrying the candied haws", stopping: "Selling candied haws",
    cry: "Candied haws! Sweet candied haws!", heard: "\"Bīngtáng húlu!\"", sound: "cry", weight: 3,
    note: "Documented: hawthorn berries dipped in hard sugar, sold from a straw-topped pole, a Beijing winter sight since the Qing.",
  },
  {
    id: "simit", scope: { years: [1600, 10001], bounds: ISTANBUL }, dress: "street-vendor", label: "Simit seller",
    hours: [7, 13], round: "corners", stops: 6, minutes: 12, doing: "Carrying simit round", stopping: "Selling simit",
    cry: "Simit! Fresh simit!", heard: "Simit: sesame bread rings", sound: "cry", weight: 3,
    note: "Documented: simit sellers with a tray of rings on the head appear in Istanbul court records of the 1590s.",
  },
];

export const streetTradesAt = (setting: WorldSetting) =>
  streetTrades.filter((t) => matchesCharacterScope(t.scope, setting, "*"));

export const streetTrade = (id: string) => streetTrades.find((t) => t.id === id);
