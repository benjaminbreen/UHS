import type { CharacterScope } from "../characters/context-types";
import type { HealthPerson } from "./conditions";

export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * An illness or hurt that runs its course in days. `rate` is the share of
 * people like this one down with it on a given day, here and now; `deadly`
 * the share of cases that end in death without help.
 */
export type AilmentDef = {
  id: string;
  names: readonly { scope?: CharacterScope; name: string }[];
  gloss: string;
  rate: (p: HealthPerson & { season: Season }) => number;
  /** Shortest and longest course, in days. */
  days: readonly [number, number];
  deadly: (p: HealthPerson) => number;
  /** Of someone: `{who}` is "your sister Tama", `{for}` "for three days". */
  of: string;
  /** Of the player, the same. */
  you: string;
  /** After "died ": "of the fever". */
  died: string;
  /** What a resident is doing while it keeps them in. */
  laid: string;
};

const young = (p: HealthPerson, n: number) => (p.age < 5 ? n * 2 : p.age < 15 ? n * 1.4 : p.age >= 60 ? n * 1.5 : n);
const before = (p: HealthPerson, y: number) => (p.setting?.year ?? 1500) < y;
const box = (p: HealthPerson, b: readonly [number, number, number, number]) =>
  !!p.setting && p.setting.lon >= b[0] && p.setting.lat >= b[1] && p.setting.lon <= b[2] && p.setting.lat <= b[3];
const WEST_EURASIA = [-12, 25, 50, 62] as const;
const MEDITERRANEAN = [-10, 28, 40, 46] as const;
const AMERICAS = [-170, -56, -34, 72] as const;

/** Plague years, from the pandemics that reached each place. */
function plagueYear(p: HealthPerson) {
  const y = p.setting?.year ?? 0;
  return (box(p, MEDITERRANEAN) && y >= 541 && y <= 544) ||
    (box(p, WEST_EURASIA) && y >= 1347 && y <= 1352) ||
    (box(p, [-8, 49.5, 2, 59]) && y >= 1665 && y <= 1666) ||
    (box(p, [2, 42, 8, 46]) && y >= 1720 && y <= 1722) ||
    (box(p, [68, 8, 120, 35]) && y >= 1894 && y <= 1910);
}

export const AILMENTS: readonly AilmentDef[] = [
  {
    id: "fever",
    names: [{ name: "fever" }],
    gloss: "A fever without a name: typhus, typhoid, malaria, influenza and a dozen others were told apart only in the nineteenth century.",
    rate: (p) => young(p, 0.012) * (p.season === "summer" || p.season === "autumn" ? 1.4 : 1),
    days: [3, 10],
    deadly: (p) => (p.age < 5 ? 0.08 : p.age >= 60 ? 0.06 : 0.015),
    of: "{who} has had a fever {for}",
    you: "you have had a fever {for}",
    died: "of the fever",
    laid: "Laid up with a fever",
  },
  {
    id: "flux",
    names: [{ scope: { years: [1000, 1900], bounds: [-11, 49.5, 2, 61] }, name: "the bloody flux" }, { name: "the flux" }],
    gloss: "Dysentery, from bad water and food, worst in late summer and for small children.",
    rate: (p) => young(p, 0.005) * (p.season === "summer" ? 3 : p.season === "autumn" ? 2 : 0.5) * (p.setting?.settlement === "city" ? 1.5 : 1) * (before(p, 1920) ? 1 : 0.2),
    days: [4, 12],
    deadly: (p) => (p.age < 5 ? 0.12 : p.age >= 60 ? 0.08 : 0.02),
    of: "{who} has had {name} {for}",
    you: "you have had {name} {for}",
    died: "of {name}",
    laid: "Laid up with the flux",
  },
  {
    id: "cough",
    names: [{ name: "cough" }],
    gloss: "A cough on the chest. In the old and the very young it often turned to pneumonia, 'the old man's friend'.",
    rate: (p) => young(p, 0.01) * (p.season === "winter" ? 3 : p.season === "spring" || p.season === "autumn" ? 1.5 : 0.5),
    days: [4, 14],
    deadly: (p) => (p.age < 5 ? 0.03 : p.age >= 60 ? 0.08 : 0.005),
    of: "{who} has had a cough on the chest {for}",
    you: "you have had a cough on the chest {for}",
    died: "of a cough that went to the chest",
    laid: "In bed with a cough",
  },
  {
    id: "childbed",
    names: [{ name: "childbed" }],
    gloss: "The weeks after a birth. Perhaps one birth in a hundred killed the mother, most often by fever.",
    // Seeded only for a mother whose household has a baby this year.
    rate: () => 0,
    days: [5, 20],
    deadly: () => 0.03,
    of: "{who} is still lying in after the birth",
    you: "you are still lying in after the birth",
    died: "of a fever after the birth",
    laid: "Lying in after the birth",
  },
  {
    id: "smallpox",
    names: [{ name: "smallpox" }],
    gloss: "Smallpox killed perhaps a third of those who caught it. Survivors were immune for life, and most were scarred.",
    rate: (p) => (p.age >= 15 || !before(p, 1800) || (box(p, AMERICAS) && !(p.setting!.year >= 1518)) ? 0 : 0.003),
    days: [12, 24],
    deadly: (p) => (p.age < 5 ? 0.35 : 0.25),
    of: "{who} has had the smallpox {for}",
    you: "you have had the smallpox {for}",
    died: "of the smallpox",
    laid: "Laid up with the smallpox",
  },
  {
    id: "measles",
    names: [{ name: "measles" }],
    gloss: "Measles, a childhood illness wherever towns were big enough to keep it going; deadly where it was new.",
    rate: (p) => (p.age >= 12 || !before(p, 1965) ? 0 : 0.003),
    days: [7, 14],
    deadly: () => 0.05,
    of: "{who} has had the measles {for}",
    you: "you have had the measles {for}",
    died: "of the measles",
    laid: "Laid up with the measles",
  },
  {
    id: "plague",
    names: [{ name: "the pestilence" }],
    gloss: "Plague, Yersinia pestis, carried by fleas: the Black Death of 1347 to 1352 killed between a third and a half of Europe.",
    rate: (p) => (plagueYear(p) ? 0.02 : 0),
    days: [3, 8],
    deadly: () => 0.6,
    of: "{who} has been sick with {name} {for}",
    you: "you have been sick with {name} {for}",
    died: "of {name}",
    laid: "Sick with the pestilence",
  },
  {
    id: "break",
    names: [{ name: "a broken arm" }],
    gloss: "A broken limb, splinted and left to knit. Most healed, some crooked.",
    rate: (p) => (p.age >= 8 ? 0.002 : 0),
    days: [20, 40],
    deadly: () => 0.005,
    of: "{who} is nursing a broken arm",
    you: "you are nursing a broken arm",
    died: "of a broken arm that festered",
    laid: "Resting a broken arm",
  },
];
