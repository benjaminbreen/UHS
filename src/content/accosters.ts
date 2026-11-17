import type { CharacterScope } from "./characters/context-types";
import type { WorldSetting } from "./geography/types";
import { matchesCharacterScope } from "./characters/resolve";
import { random } from "../core/random";

// Robbery on the road and in the street was an ordinary hazard of travel for
// most of history: Roman jurists treated being killed by latrones as a normal
// way to go missing, and English assize records and Old Bailey trials are
// thick with highway and street robbery until policing took hold in the 1830s.
// Where order broke down, in war, famine and on frontiers, it was far worse.

const ROMAN: CharacterScope["bounds"] = [-10, 24, 45, 56];
const BRITAIN: CharacterScope["bounds"] = [-11, 49, 2, 61];
const IRELAND: CharacterScope["bounds"] = [-11, 51, -5, 56];
const ITALY: CharacterScope["bounds"] = [6, 36, 19, 47.2];
const IBERIA: CharacterScope["bounds"] = [-10, 36, 4, 44];
const BALKANS: CharacterScope["bounds"] = [13, 34, 30, 48];
const GERMANY: CharacterScope["bounds"] = [5, 45, 20, 55];
const FRANCE: CharacterScope["bounds"] = [-5, 42, 8, 51];
const JAPAN: CharacterScope["bounds"] = [129, 30, 146, 46];
const CHINA: CharacterScope["bounds"] = [97, 18, 125, 45];
const INDIA: CharacterScope["bounds"] = [66, 6, 92, 36];
const ARABIA: CharacterScope["bounds"] = [-17, 12, 60, 35];
const MEXICO: CharacterScope["bounds"] = [-118, 14, -86, 33];
const SERTAO: CharacterScope["bounds"] = [-48, -17, -34, -2];
const AUSTRALIA: CharacterScope["bounds"] = [112, -44, 154, -10];
const US_WEST: CharacterScope["bounds"] = [-125, 28, -95, 49];
const US: CharacterScope["bounds"] = [-125, 24, -66, 50];
const PARIS: CharacterScope["bounds"] = [1.9, 48.6, 2.8, 49.1];

export type AccostAim = "rob" | "press" | "forage" | "pick";

/** A kind of person who stops travellers, here and then, and how often. */
export type Accoster = {
  id: string;
  /** The livelihood they are dressed and armed as. */
  livelihood: string;
  /** What the player sees them called, plural. */
  label: string;
  scope: CharacterScope;
  /** On a lonely road or track, or in a town's streets after dark. */
  where: "road" | "street";
  aim: AccostAim;
  party: readonly [number, number];
  /** Times the base hourly risk of the place; war and lawless frontiers run high. */
  rate: number;
  /** The card, said plainly. */
  demand: string;
  evidence: "documented" | "inferred";
  note: string;
};

export const accosters: readonly Accoster[] = [
  {
    id: "latrones", livelihood: "bandit", label: "Latrones", where: "road", aim: "rob", party: [2, 4], rate: 1.5,
    scope: { years: [-200, 480], bounds: ROMAN },
    demand: "Men step out from behind the roadside tombs with clubs and knives. One holds out his hand for your purse. Nobody else is on the road.",
    evidence: "documented",
    note: "Roman law treated death at the hands of latrones as an ordinary risk of travel, and tombstones record victims 'interfectus a latronibus'; Shaw, 'Bandits in the Roman Empire', Past & Present 105 (1984).",
  },
  {
    id: "bagaudae", livelihood: "bandit", label: "Bagaudae", where: "road", aim: "rob", party: [3, 5], rate: 2.5,
    scope: { years: [280, 480], bounds: FRANCE },
    demand: "A band of ragged country people blocks the road, armed with farm tools. They want whatever you carry, and they do not look as if they will take no for an answer.",
    evidence: "documented",
    note: "Peasant risings and bands in late Roman Gaul and Spain, named in the Chronica Gallica and by Salvian; how organised they were is debated.",
  },
  {
    id: "outlaws-england", livelihood: "bandit", label: "Outlaws", where: "road", aim: "rob", party: [2, 4], rate: 1.5,
    scope: { years: [1100, 1500], bounds: BRITAIN },
    demand: "Men come out of the trees on either side of the track. One carries a bow. They want your money and your cloak.",
    evidence: "documented",
    note: "Medieval statutes (Winchester 1285) cleared roadside brush for a bowshot to deny robbers cover; gaol delivery rolls are full of highway robbery.",
  },
  {
    id: "routiers", livelihood: "marauder", label: "Routiers", where: "road", aim: "forage", party: [3, 6], rate: 3,
    scope: { years: [1356, 1445], bounds: FRANCE },
    demand: "Soldiers from one of the free companies ride up and surround you. They want food, money and anything else worth taking.",
    evidence: "documented",
    note: "Unpaid companies of the Hundred Years' War lived off the country between campaigns, ransoming travellers and villages; Froissart.",
  },
  {
    id: "marauders", livelihood: "marauder", label: "Marauders", where: "road", aim: "forage", party: [3, 6], rate: 4,
    scope: { years: [1618, 1649], bounds: GERMANY },
    demand: "Soldiers who have left their regiment come across the field toward you, muskets slung. They want food and money, and they have done worse than ask.",
    evidence: "documented",
    note: "'Marodeur' entered German in the Thirty Years' War for stragglers who plundered the countryside; Grimmelshausen's Simplicissimus describes them.",
  },
  {
    id: "highwaymen", livelihood: "highwayman", label: "Highwaymen", where: "road", aim: "rob", party: [1, 2], rate: 1.3,
    scope: { years: [1600, 1840], bounds: BRITAIN },
    demand: "A rider with a scarf over his face blocks the road and points a pistol at you. \"Stand and deliver! Your money, and be quick.\"",
    evidence: "documented",
    note: "Mounted robbers on the roads out of London were common until turnpikes, banking and mounted patrols ended them by the 1830s; Old Bailey Proceedings.",
  },
  {
    id: "rapparees", livelihood: "bandit", label: "Rapparees", where: "road", aim: "rob", party: [2, 4], rate: 1.5,
    scope: { years: [1650, 1800], bounds: IRELAND },
    demand: "Men with half-pikes step out of the bog road's ditch. They want what you carry.",
    evidence: "documented",
    note: "Irish 'tories' and rapparees, many dispossessed after the Cromwellian and Williamite wars, robbed on the roads into the eighteenth century.",
  },
  {
    id: "briganti", livelihood: "bandit", label: "Brigands", where: "road", aim: "rob", party: [2, 5], rate: 2,
    scope: { years: [1500, 1880], bounds: ITALY },
    demand: "Armed men come down off the hillside and stop you. They want your money, and they talk about holding you for ransom.",
    evidence: "documented",
    note: "Brigandage in the Papal States and the south was endemic, peaking after Italian unification (1861 to 1865); kidnapping for ransom was common.",
  },
  {
    id: "bandoleros", livelihood: "bandit", label: "Bandoleros", where: "road", aim: "rob", party: [2, 4], rate: 1.5,
    scope: { years: [1700, 1890], bounds: IBERIA },
    demand: "Men with blunderbusses step into the road. \"Face to the ground!\" They want your money.",
    evidence: "documented",
    note: "Andalusian bandoleros of the Sierra Morena robbed coaches and travellers until the Guardia Civil (1844) wore them down.",
  },
  {
    id: "klephts", livelihood: "bandit", label: "Klephts", where: "road", aim: "rob", party: [3, 5], rate: 2,
    scope: { years: [1450, 1830], bounds: BALKANS },
    demand: "Armed mountain men block the pass. They want a share of what you carry before you go on.",
    evidence: "documented",
    note: "Klephts and haiduks in the Ottoman Balkans lived by robbery in the mountains; later celebrated as rebels in song.",
  },
  {
    id: "sanzoku-war", livelihood: "bandit", label: "Mountain bandits", where: "road", aim: "rob", party: [2, 5], rate: 2.5,
    scope: { years: [1180, 1600], bounds: JAPAN },
    demand: "Men in rough clothes with swords and spears block the mountain road. They want your money and your clothes.",
    evidence: "inferred",
    note: "Mountain bandits (sanzoku) and armed bands flourished in the civil wars until Hideyoshi's sword hunt (1588) disarmed the countryside.",
  },
  {
    id: "sanzoku-edo", livelihood: "marauder", label: "Masterless samurai", where: "road", aim: "rob", party: [1, 3], rate: 0.5,
    scope: { years: [1600, 1868], bounds: JAPAN },
    demand: "A masterless samurai steps out on the road, hand on his sword, and asks for money \"to help a man in need\". It is not a request.",
    evidence: "inferred",
    note: "Edo roads were well policed by checkpoints, but rōnin extortion and robbery are recorded throughout the period.",
  },
  {
    id: "china-bandits", livelihood: "bandit", label: "Bandits", where: "road", aim: "rob", party: [3, 6], rate: 1.5,
    scope: { years: [-200, 1912], bounds: CHINA },
    demand: "Men come out of the reeds by the road with spears and knives. They want your money and goods.",
    evidence: "inferred",
    note: "Banditry was a constant of the Chinese countryside, worst in dynastic decline; Water Margin (Shuihu zhuan) is its classic fiction.",
  },
  {
    id: "tufei", livelihood: "bandit", label: "Tufei", where: "road", aim: "rob", party: [3, 8], rate: 3,
    scope: { years: [1912, 1950], bounds: CHINA },
    demand: "Armed men with rifles stop you on the road. They take what they like and talk about holding you for ransom.",
    evidence: "documented",
    note: "Republican China had perhaps over a million bandits at its height in the 1920s; kidnapping for ransom was routine. Billingsley, 'Bandits in Republican China' (1988).",
  },
  {
    id: "dacoits", livelihood: "bandit", label: "Dacoits", where: "road", aim: "rob", party: [3, 6], rate: 1.8,
    scope: { years: [1500, 1950], bounds: INDIA },
    demand: "A gang with lathis and spears closes round you on the road. They want everything of value.",
    evidence: "documented",
    note: "Gang robbery (dacoity) is a separate offence in the Indian Penal Code (1860) because it was so common; colonial police reports count thousands a year.",
  },
  {
    id: "thugs", livelihood: "bandit", label: "Fellow travellers", where: "road", aim: "rob", party: [3, 5], rate: 0.4,
    scope: { years: [1700, 1840], bounds: INDIA },
    demand: "The friendly travellers who have walked with you since morning have stopped talking. One has moved behind you with a cloth in his hands.",
    evidence: "inferred",
    note: "Gangs posing as travellers who strangled and robbed are described in Sleeman's 1830s campaign against 'thuggee'; historians dispute how much of that account the colonial state made up.",
  },
  {
    id: "ghazw", livelihood: "bandit", label: "Raiders", where: "road", aim: "rob", party: [3, 6], rate: 1.5,
    scope: { years: [-1000, 1930], bounds: ARABIA, cultures: ["north-african-west-asian"] },
    demand: "Riders come over the dune and circle you. A traveller without protection pays, in goods or in blood.",
    evidence: "documented",
    note: "The ghazw, the raid, was a regular part of desert life; caravans paid tribes for safe passage (khuwwa) or were taken.",
  },
  {
    id: "bandidos", livelihood: "bandit", label: "Bandidos", where: "road", aim: "rob", party: [2, 5], rate: 2,
    scope: { years: [1810, 1920], bounds: MEXICO },
    demand: "Riders with rifles block the road. They want your money, and anything they can sell.",
    evidence: "documented",
    note: "Highway robbery was so common in nineteenth-century Mexico that the Rurales were formed (1861) to fight it.",
  },
  {
    id: "cangaceiros", livelihood: "bandit", label: "Cangaceiros", where: "road", aim: "rob", party: [3, 6], rate: 1.8,
    scope: { years: [1870, 1941], bounds: SERTAO },
    demand: "Men in leather hats with rifles and cartridge belts come out of the scrub. They want money, food and news.",
    evidence: "documented",
    note: "Armed bands of the Brazilian backlands, the most famous led by Lampião until 1938.",
  },
  {
    id: "bushrangers", livelihood: "bandit", label: "Bushrangers", where: "road", aim: "rob", party: [1, 4], rate: 1,
    scope: { years: [1790, 1880], bounds: AUSTRALIA },
    demand: "A man on horseback with a revolver bails you up. \"Hand it over and nobody gets hurt.\"",
    evidence: "documented",
    note: "Escaped convicts and later locally born bushrangers robbed travellers and gold escorts; the Kelly gang ended in 1880.",
  },
  {
    id: "road-agents", livelihood: "bandit", label: "Road agents", where: "road", aim: "rob", party: [1, 4], rate: 0.8,
    scope: { years: [1860, 1910], bounds: US_WEST },
    demand: "Men with bandanas over their faces and guns drawn step into the road. \"Hands up. Empty your pockets.\"",
    evidence: "documented",
    note: "Stagecoach and traveller robbery on western routes; Wells Fargo kept records of hundreds of holdups.",
  },
  {
    id: "robbers", livelihood: "bandit", label: "Robbers", where: "road", aim: "rob", party: [2, 3], rate: 1,
    scope: { years: [-3500, 1900] },
    demand: "Two people step into your path and demand your valuables. One keeps a hand on a weapon. They are watching to see what you do.",
    evidence: "inferred",
    note: "Where no specific record is on file: robbery on lonely routes was a general hazard of pre-modern travel.",
  },
  {
    id: "robbers-modern", livelihood: "bandit", label: "Robbers", where: "road", aim: "rob", party: [2, 3], rate: 0.5,
    scope: { years: [1900, 10001] },
    demand: "Two people step into your path and demand your money and phone. One shows a knife.",
    evidence: "inferred",
    note: "Rural robbery fell with policing and motor transport but never vanished.",
  },
  {
    id: "footpads", livelihood: "footpad", label: "Footpads", where: "street", aim: "rob", party: [1, 3], rate: 1.5,
    scope: { years: [1600, 1850], bounds: BRITAIN },
    demand: "Two men step out of an alley. One has a cudgel. \"Your purse. Now.\"",
    evidence: "documented",
    note: "Robbery on foot in unlit London streets fills the Old Bailey Proceedings; street lighting and the Metropolitan Police (1829) cut it.",
  },
  {
    id: "garrotters", livelihood: "footpad", label: "Garrotters", where: "street", aim: "rob", party: [2, 3], rate: 1,
    scope: { years: [1850, 1880], bounds: BRITAIN },
    demand: "An arm comes round your throat from behind while another man goes through your pockets.",
    evidence: "documented",
    note: "The London garrotting panics of 1856 and 1862 led to the Garrotters Act (1863) and its flogging penalty.",
  },
  {
    id: "press-gang", livelihood: "press-gang", label: "A press gang", where: "street", aim: "press", party: [3, 6], rate: 1.2,
    scope: { years: [1664, 1815], bounds: BRITAIN },
    demand: "A gang of sailors with cudgels, led by an officer, blocks the street. \"You look like a seafaring man. The King needs you.\"",
    evidence: "documented",
    note: "The Impress Service took tens of thousands of men for the Royal Navy in wartime; seafarers were the target, but landsmen were taken too.",
  },
  {
    id: "grassatores", livelihood: "footpad", label: "Street robbers", where: "street", aim: "rob", party: [1, 3], rate: 1.5,
    scope: { years: [-200, 480], bounds: ROMAN },
    demand: "Men come out of a doorway in the dark street, knives showing. They want your purse.",
    evidence: "documented",
    note: "Juvenal (Satire 3) describes the danger of Rome's unlit streets at night; the vigiles could not police them all.",
  },
  {
    id: "apaches", livelihood: "footpad", label: "Apaches", where: "street", aim: "rob", party: [2, 4], rate: 1.2,
    scope: { years: [1890, 1920], bounds: PARIS },
    demand: "Young men in caps and red neckerchiefs fall into step around you. One opens a knife.",
    evidence: "documented",
    note: "The Paris press called its street gangs 'Apaches' from about 1902.",
  },
  {
    id: "toughs", livelihood: "footpad", label: "Toughs", where: "street", aim: "rob", party: [2, 4], rate: 1.2,
    scope: { years: [1840, 1930], bounds: US },
    demand: "A gang of toughs blocks the sidewalk. \"Nice coat. Let's have it, and the money.\"",
    evidence: "documented",
    note: "Street gangs of New York's Five Points and Bowery, and their counterparts in other cities.",
  },
  {
    id: "muggers", livelihood: "footpad", label: "Muggers", where: "street", aim: "rob", party: [1, 3], rate: 1,
    scope: { years: [1960, 10001] },
    demand: "Someone steps out of a doorway with a knife. \"Wallet and phone. Don't make it difficult.\"",
    evidence: "inferred",
    note: "Street robbery in modern cities, which varies hugely by place and decade.",
  },
  {
    id: "street-robbers", livelihood: "footpad", label: "Street robbers", where: "street", aim: "rob", party: [1, 3], rate: 1,
    scope: { years: [-3000, 1960] },
    demand: "Someone steps out of the dark between houses and blocks your way. Another is behind you. They want your purse.",
    evidence: "inferred",
    note: "Towns without street lighting or police were dangerous after dark nearly everywhere.",
  },
  {
    id: "cutpurses", livelihood: "cutpurse", label: "A pickpocket", where: "street", aim: "pick", party: [1, 1], rate: 0.8,
    scope: { years: [-500, 10001] },
    demand: "Someone bumps into you in the street and is gone.",
    evidence: "inferred",
    note: "Purse-cutting and pickpocketing were the commonest town thefts; Robert Greene's 1590s cony-catching pamphlets describe the trade.",
  },
];

/** Who might stop the player here, now, on a road or a street. The most specific
 * matching group wins over the general fallbacks; among equals, chance picks. */
export function accosterAt(setting: WorldSetting, where: Accoster["where"], seed: string, key: string) {
  const here = accosters.filter((a) => a.where === where && a.aim !== "pick" && matchesCharacterScope(a.scope, setting, "*"));
  const specific = here.filter((a) => a.scope.bounds || a.scope.cultures);
  const pool = specific.length ? specific : here;
  const total = pool.reduce((n, a) => n + a.rate, 0);
  let pick = random(seed, "accoster", key) * total;
  return pool.find((a) => (pick -= a.rate) < 0) ?? pool[0];
}
/** A town's daytime crowd: no confrontation, just a lighter purse. */
export function cutpurseAt(setting: WorldSetting) {
  return accosters.find((a) => a.aim === "pick" && matchesCharacterScope(a.scope, setting, "*"));
}
