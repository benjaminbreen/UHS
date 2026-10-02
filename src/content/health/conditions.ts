import type { CharacterScope } from "../characters/context-types";
import type { WorldSetting } from "../geography/types";

/** Who might have a condition: enough to set a rate. */
export type HealthPerson = {
  age: number;
  sex?: "male" | "female";
  setting?: WorldSetting;
  /** The work they do, lowercased: "smith", "rice farmer". */
  role: string;
};

/**
 * Something a person lives with for years. Rates are shares of people like
 * this one, here and now; they are educated guesses from what is known (see
 * `note`), not measurements. Lines are said to the player after "and "; `of`
 * lines say it of someone else after "your sister Tama ".
 */
export type ConditionDef = {
  id: string;
  /** What it was called here and now; the last entry has no scope. */
  names: readonly { scope?: CharacterScope; name: string }[];
  /** The modern name and one fact, for the card under the word. */
  gloss: string;
  rate: (p: HealthPerson) => number;
  /** How much it marks a life, 0 to 1: blindness near 1, smallpox scars low. */
  salience: number;
  /** `{name}` is the period name. */
  you: (p: HealthPerson) => readonly string[];
  of: (p: HealthPerson) => readonly string[];
  note: string;
};

type Box = readonly [number, number, number, number];
const inBox = (s: WorldSetting | undefined, ...boxes: Box[]) =>
  !!s && boxes.some((b) => s.lon >= b[0] && s.lat >= b[1] && s.lon <= b[2] && s.lat <= b[3]);
const year = (p: HealthPerson) => p.setting?.year ?? 1500;
const urban = (p: HealthPerson) => p.setting?.settlement === "city" || p.setting?.settlement === "port";
const lowland = (p: HealthPerson) => (p.setting?.relief ?? 0.3) < 0.5;

const ALPS: Box = [5, 43.5, 16.5, 48.5];
const PYRENEES: Box = [-2, 42, 3, 43.3];
const CARPATHIANS: Box = [17, 44.5, 27, 50];
const HIMALAYA: Box = [72, 26, 98, 36];
const ANDES: Box = [-80, -35, -63, 10];
const ETHIOPIA: Box = [35, 6, 43, 15];
const SW_CHINA: Box = [97, 22, 110, 34];
const GREAT_LAKES: Box = [-93, 41, -75, 49];
const NILE: Box = [29, 22, 34, 31.6];
const AFRICA_TROPICS: Box = [-18, -25, 52, 17];
const SOUTH_ASIA: Box = [66, 5, 97, 31];
const SE_ASIA: Box = [92, -11, 141, 25];
const MED_LOWLANDS: Box = [-10, 30, 37, 44];
const FENS: Box = [-1, 51.3, 1.8, 53.2];
const NORTH_EUROPE: Box = [-11, 49, 32, 62];
const AMERICAS: Box = [-170, -56, -34, 72];
const AUSTRALIA: Box = [110, -45, 155, -10];
const AEGEAN_ROME: Box = [6.5, 34.8, 30, 47];
const ENGLISH: CharacterScope["bounds"] = [-11, 49.5, 2, 61];

/** Smallpox reached the Americas in 1518 and Australia in 1789; it was old
 * across Eurasia and Africa, and vaccination ended it in Europe after 1800. */
function smallpoxScarred(p: HealthPerson) {
  const y = year(p);
  if (inBox(p.setting, AMERICAS) && y < 1520) return 0;
  if (inBox(p.setting, AUSTRALIA) && y < 1790) return 0;
  const base = y < 500 ? 0.03 : urban(p) ? 0.22 : 0.12;
  const vaccinated = inBox(p.setting, NORTH_EUROPE) && y >= 1820 ? Math.max(0, 1 - (y - 1820) / 80) : y >= 1950 ? 0 : 1;
  return p.age < 3 ? 0 : base * vaccinated;
}

/** Malaria where it was endemic: the African and Asian tropics, the
 * Mediterranean marsh lowlands until drainage, the English fens. */
function ague(p: HealthPerson) {
  const y = year(p), s = p.setting;
  if (!s || y >= 1950 || !lowland(p)) return 0;
  if (inBox(s, AFRICA_TROPICS, SOUTH_ASIA, SE_ASIA) && (s.climate === "tropical" || s.climate === "monsoon")) return 0.25;
  if (inBox(s, AMERICAS) && y >= 1550 && (s.climate === "tropical" || s.climate === "monsoon")) return 0.2;
  if (inBox(s, MED_LOWLANDS) && (s.water !== "none")) return 0.1;
  if (inBox(s, FENS) && y >= 1550 && y < 1880) return 0.06;
  return 0;
}

export const CONDITIONS: readonly ConditionDef[] = [
  {
    id: "deaf",
    names: [{ name: "deafness" }],
    gloss: "Profound deafness from birth or an infant fever. Where there were several deaf people, as on Martha's Vineyard, whole villages signed.",
    rate: () => 0.002,
    salience: 0.95,
    you: () => ["you have been deaf since you were small, and those close to you talk with their hands"],
    of: () => ["has been deaf since a fever as a baby, and talks with {her} hands"],
    note: "About one or two births in a thousand.",
  },
  {
    id: "hearing",
    names: [{ name: "hearing loss" }],
    gloss: "Hearing loss, most often left by childhood fevers such as measles and scarlet fever, or by age.",
    rate: (p) => (p.age >= 60 ? 0.25 : p.age >= 40 ? 0.06 : year(p) >= 1950 ? 0.01 : 0.025),
    salience: 0.55,
    you: (p) => (p.age >= 55
      ? ["your hearing is going, and people have started to shout"]
      : ["a fever when you were small left you hard of hearing", "you have been hard of hearing since a fever in childhood"]),
    of: (p) => (p.age >= 55 ? ["is going deaf"] : ["has been hard of hearing since a fever"]),
    note: "Post-infectious hearing loss was common before vaccination and antibiotics.",
  },
  {
    id: "blind",
    names: [{ name: "blindness" }],
    gloss: "Blindness, in hot dry country often from trachoma, the 'Egyptian ophthalmia' that Napoleon's soldiers carried home in 1801.",
    rate: (p) => (inBox(p.setting, NILE, [33.5, 29, 50, 38]) && year(p) < 1950 ? 0.02 : 0.006) * (p.age >= 60 ? 2 : p.age < 15 ? 0.3 : 1),
    salience: 0.95,
    you: () => ["you have been blind since a sickness of the eyes in your youth"],
    of: () => ["has been blind for years"],
    note: "Trachoma was endemic around the eastern Mediterranean and Nile.",
  },
  {
    id: "cataract",
    names: [{ name: "cataract" }],
    gloss: "Cataract: the lens clouding with age, worst where the sun is strong. Couching, pushing the lens aside with a needle, is described by Sushruta.",
    rate: (p) => (p.age >= 65 ? 0.3 : p.age >= 55 ? 0.1 : 0) * (p.setting?.climate === "arid" || p.setting?.climate === "tropical" ? 1.4 : 1),
    salience: 0.5,
    you: () => ["your eyes are clouding, and you work more by feel than you did"],
    of: () => ["is losing {her} sight"],
    note: "Age-related; more common with strong sunlight.",
  },
  {
    id: "short-sight",
    names: [{ name: "short sight" }],
    gloss: "Myopia. Spectacles for it came later than reading glasses, in the 1450s; before that there was no remedy.",
    rate: (p) => (p.age >= 10 && p.age < 60 ? (urban(p) ? 0.06 : 0.03) : 0),
    salience: 0.35,
    you: () => ["you cannot make out a face across the street, and know people by their walk"],
    of: () => ["cannot see far"],
    note: "Lower in the past than now; more common with close work.",
  },
  {
    id: "colour",
    names: [{ name: "colour blindness" }],
    gloss: "Red-green colour blindness, inherited and far commoner in men. John Dalton described his own in 1794.",
    rate: (p) =>
      p.sex === "female" ? 0.005
        : p.setting?.culture === "european" ? 0.08
        : p.setting?.culture === "east-asian" || p.setting?.culture === "south-asian" ? 0.05
        : 0.03,
    salience: 0.25,
    you: () => ["you have never been able to tell red from green"],
    of: () => ["cannot tell red from green"],
    note: "About 8% of men of European descent, fewer elsewhere; about 0.5% of women.",
  },
  {
    id: "limp",
    names: [{ name: "a limp" }],
    gloss: "A lame leg: a badly set break, or the paralysis polio left in children, which Egyptian art shows as early as about 1400 BCE.",
    rate: (p) => (p.age < 8 ? 0.005 : p.age >= 50 ? 0.05 : 0.03),
    salience: 0.45,
    you: () => ["you have walked with a limp since a leg broke and set badly", "you have limped since a fall when you were young"],
    of: () => ["walks with a limp"],
    note: "Healed fractures are common in skeletons from every period.",
  },
  {
    id: "clubfoot",
    names: [{ name: "a twisted foot" }],
    gloss: "Clubfoot, about one birth in a thousand. Untreated, people walked on the side of the foot.",
    rate: () => 0.001,
    salience: 0.85,
    you: () => ["you were born with a twisted foot, and walk on the side of it"],
    of: () => ["was born with a twisted foot"],
    note: "Congenital talipes, about 1 in 1,000 births.",
  },
  {
    id: "fingers",
    names: [{ name: "lost fingers" }],
    gloss: "Fingers lost to the work: hammers, blades, saws, millstones and, later, machines.",
    rate: (p) => (p.age < 16 ? 0 : /smith|carpent|cooper|sawyer|butcher|miller|mason|joiner|wright|forge|mill hand|factory|machin/.test(p.role) ? 0.06 : 0.008),
    salience: 0.4,
    you: () => ["you are missing two fingers on your left hand, taken by the work years ago"],
    of: () => ["lost two fingers to the work"],
    note: "Hand injuries are typical of trades with edges and weights.",
  },
  {
    id: "pocks",
    names: [{ name: "smallpox" }],
    gloss: "Smallpox killed perhaps a third of those who caught it. Survivors were immune for life, and most were scarred.",
    rate: smallpoxScarred,
    salience: 0.3,
    you: () => ["your face is marked by the smallpox you lived through as a child"],
    of: () => ["is marked by the smallpox"],
    note: "Scarring was common among adults in endemic Eurasia and Africa before vaccination.",
  },
  {
    id: "goitre",
    names: [{ name: "goitre" }],
    gloss: "Goitre: a swollen thyroid from too little iodine in the soil and water, common in mountain valleys until iodised salt in the 1920s.",
    rate: (p) => {
      if (year(p) >= 1925 || p.age < 12) return 0;
      const upland = (p.setting?.relief ?? 0) > 0.5;
      const belt = inBox(p.setting, ALPS, PYRENEES, CARPATHIANS, HIMALAYA, ANDES, ETHIOPIA, SW_CHINA, GREAT_LAKES);
      return (belt && upland ? 0.25 : upland ? 0.04 : 0) * (p.sex === "female" ? 1.4 : 0.7);
    },
    salience: 0.35,
    you: () => ["you have a swelling at the throat, as many people in these hills do"],
    of: () => ["has the swelling at the throat that comes in these hills"],
    note: "Endemic in iodine-poor uplands; women more often affected.",
  },
  {
    id: "ague",
    names: [{ scope: { years: [1000, 1950], bounds: ENGLISH }, name: "the ague" }, { name: "the fever" }],
    gloss: "Malaria, which comes back for years in those who survive it. Quinine bark reached Europe from Peru in the 1630s.",
    rate: (p) => (p.age < 5 ? 0 : ague(p)),
    salience: 0.4,
    you: () => ["{name} comes back on you every few weeks, as it has since you were a child"],
    of: () => ["has {name} back on {her} again"],
    note: "Endemic in tropical lowlands and Mediterranean marshes until twentieth-century control.",
  },
  {
    id: "consumption",
    names: [
      { scope: { years: [-800, 600], bounds: AEGEAN_ROME }, name: "phthisis" },
      { name: "consumption" },
    ],
    gloss: "Tuberculosis, the commonest killer of adults in early modern cities.",
    rate: (p) => (p.age < 15 || p.age > 65 ? 0 : year(p) >= 1950 ? 0.002 : urban(p) && year(p) >= 1600 ? 0.04 : 0.015),
    salience: 0.8,
    you: () => ["you have had a cough since the winter that will not go away", "you have been coughing blood since the spring, and have told nobody"],
    of: () => ["has had a cough since the winter that will not go"],
    note: "Perhaps a fifth of deaths in eighteenth- and nineteenth-century European cities.",
  },
  {
    id: "falling",
    names: [
      { scope: { years: [-800, 600], bounds: AEGEAN_ROME }, name: "the sacred disease" },
      { name: "the falling sickness" },
    ],
    gloss: "Epilepsy. The Hippocratic treatise On the Sacred Disease, about 400 BCE, argued it was no more sacred than any other illness.",
    rate: () => 0.006,
    salience: 0.8,
    you: () => ["you have had {name} since you were a child, and people watch you for it"],
    of: () => ["has had {name} since childhood"],
    note: "About 0.5 to 1% of people.",
  },
  {
    id: "melancholy",
    names: [{ name: "melancholy" }],
    gloss: "Depression. Humoral medicine from Hippocrates to the eighteenth century blamed an excess of black bile.",
    rate: (p) => (p.age >= 16 ? 0.04 : 0),
    salience: 0.55,
    you: () => ["since the spring a heaviness has settled on you that will not lift", "there are weeks when the weight on you keeps you in your bed"],
    of: () => ["has had a heaviness on {her} since the spring"],
    note: "Major depression affects a few percent of adults at any time.",
  },
  {
    id: "stammer",
    names: [{ name: "a stammer" }],
    gloss: "Stammering: about one person in a hundred, three times as many men as women.",
    rate: (p) => (p.sex === "male" ? 0.015 : 0.005),
    salience: 0.4,
    you: () => ["you stammer, and it is worst when it matters most"],
    of: () => ["stammers"],
    note: "Persistent stammering, roughly 1% of adults.",
  },
  {
    id: "rickets",
    names: [{ name: "the rickets" }],
    gloss: "Rickets: soft, bent bones from too little sunlight and food, the 'English disease' of smoky northern cities.",
    rate: (p) => {
      const y = year(p);
      if (!inBox(p.setting, NORTH_EUROPE, GREAT_LAKES) || !urban(p)) return 0;
      return y >= 1750 && y < 1930 ? 0.15 : y >= 1600 && y < 1750 ? 0.05 : 0;
    },
    salience: 0.3,
    you: () => ["your legs bowed when you were small, the way children's legs do in the city"],
    of: () => ["has the bowed legs of {name}"],
    note: "Described by Glisson in 1650; common in industrial cities until vitamin D.",
  },
  {
    id: "bilharzia",
    names: [{ name: "bloody water" }],
    gloss: "Schistosomiasis, a fluke caught wading in irrigation channels. Marc Ruffer found its eggs in mummies in 1910.",
    rate: (p) => (inBox(p.setting, NILE) && year(p) < 1970 && p.age >= 10 ? (/farm|fish|boat|ferry|reed|water/.test(p.role) ? 0.4 : 0.15) * (p.sex === "female" ? 0.6 : 1) : 0),
    salience: 0.35,
    you: () => ["you pass blood in your water, as most who work the fields here do"],
    of: () => ["passes blood in {her} water, as most who work the fields do"],
    note: "Endemic along the Nile since at least the second millennium BCE.",
  },
  {
    id: "leprosy",
    names: [{ name: "leprosy" }],
    gloss: "Hansen's disease. In 1250 Matthew Paris put the leper houses of Christendom at nineteen thousand, surely too many, but there were thousands.",
    rate: (p) => {
      const y = year(p);
      if (p.age < 15) return 0;
      if (inBox(p.setting, NORTH_EUROPE, MED_LOWLANDS) && y >= 1000 && y < 1400) return 0.003;
      if (inBox(p.setting, SOUTH_ASIA, SE_ASIA, [100, 20, 125, 42]) && y < 1950) return 0.004;
      return 0;
    },
    salience: 0.95,
    you: () => ["the numb patches on your skin have started to spread, and you keep them covered"],
    of: () => ["has numb patches on {her} skin that {she} keeps covered"],
    note: "Endemic in medieval Europe until the fourteenth century, and in South and East Asia.",
  },
  {
    id: "back",
    names: [{ name: "a bad back" }],
    gloss: "A back worn by carrying and stooping: the commonest complaint in the skeletons of working people.",
    rate: (p) => (p.age >= 45 ? 0.25 : p.age >= 30 ? 0.08 : 0),
    salience: 0.2,
    you: () => ["your back has never been right since you were young"],
    of: () => ["has a bad back"],
    note: "Degenerative joint disease is near universal in older skeletons from working populations.",
  },
];
