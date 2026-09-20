import type { CharacterScope } from "../characters/context-types";
import { matchesCharacterScope } from "../characters/resolve";
import type { WorldSetting } from "../geography/types";

/** Who is out with the animals. Shares are of the people sent, not of the
 * population: a herd boy is common almost everywhere, because minding stock
 * is work a child can do and an adult is wanted for elsewhere. */
export type HerdingCustom = {
  /** Share who are young: about nine to sixteen. */
  youth: number;
  /** Share who are women or girls. The livelihood tables still have the last
   * word: work they mark as one sex's stays that sex's. */
  women: number;
  /** Chance of one, two or three people with a herd. */
  party: readonly [number, number, number];
  /** Chance a dog is with them, where there are dogs at all. */
  dog: number;
};

const customs: readonly { scope: CharacterScope; custom: HerdingCustom }[] = [
  // Machines, fences and school: one adult, if anyone.
  {
    scope: { years: [1950, 10001] },
    custom: { youth: 0.08, women: 0.2, party: [0.85, 0.15, 0], dog: 0.5 },
  },
  // Stockmen and their working dogs.
  {
    scope: { years: [1788, 1950], cultures: ["australian-pacific"] },
    custom: { youth: 0.1, women: 0.05, party: [0.6, 0.35, 0.05], dog: 0.85 },
  },
  // Vaqueros, gauchos, cowboys: mounted men, after the Spanish brought stock.
  {
    scope: {
      years: [1500, 1950],
      cultures: ["mesoamerican", "other-indigenous-american"],
    },
    custom: { youth: 0.15, women: 0.08, party: [0.5, 0.35, 0.15], dog: 0.45 },
  },
  // Llamas and alpacas are women's and children's work in the Andes.
  {
    scope: { years: [-5000, 1950], cultures: ["andean"] },
    custom: { youth: 0.5, women: 0.6, party: [0.5, 0.35, 0.15], dog: 0.4 },
  },
  // Summer farms in the north and the Alps: the dairy herd goes up the hill
  // with the women.
  {
    scope: {
      years: [-2000, 1950],
      cultures: ["european"],
      bounds: [4, 58, 32, 71],
    },
    custom: { youth: 0.35, women: 0.65, party: [0.55, 0.35, 0.1], dog: 0.6 },
  },
  // The shepherd and his dog, from Hesiod on.
  {
    scope: { years: [-8000, 1950], cultures: ["european"] },
    custom: { youth: 0.4, women: 0.2, party: [0.65, 0.28, 0.07], dog: 0.7 },
  },
  // Sheep and goats go out with boys and unmarried girls; guard dogs with the
  // flock from the Bronze Age.
  {
    scope: { years: [-9000, 1950], cultures: ["north-african-west-asian"] },
    custom: { youth: 0.5, women: 0.35, party: [0.55, 0.35, 0.1], dog: 0.5 },
  },
  // The steppe: everyone rides, and women herd as a matter of course.
  {
    scope: { years: [-4000, 1950], cultures: ["inner-eurasian"] },
    custom: { youth: 0.35, women: 0.35, party: [0.45, 0.4, 0.15], dog: 0.6 },
  },
  // The cowherd is a boy.
  {
    scope: { years: [-7000, 1950], cultures: ["south-asian"] },
    custom: { youth: 0.6, women: 0.2, party: [0.6, 0.3, 0.1], dog: 0.2 },
  },
  // The buffalo boy.
  {
    scope: {
      years: [-5000, 1950],
      cultures: ["east-asian", "southeast-asian"],
    },
    custom: { youth: 0.6, women: 0.12, party: [0.7, 0.25, 0.05], dog: 0.2 },
  },
  // Cattle are men's wealth: boys and young men go out with them in a band.
  {
    scope: {
      years: [-5000, 1950],
      cultures: ["east-southern-african", "west-central-african"],
    },
    custom: { youth: 0.6, women: 0.06, party: [0.35, 0.45, 0.2], dog: 0.3 },
  },
];

const fallback: HerdingCustom = {
  youth: 0.45,
  women: 0.15,
  party: [0.6, 0.3, 0.1],
  dog: 0.4,
};

/** Large stock is less often left to a child or sent out with a girl. */
const LARGE = new Set(["cattle", "camel", "horse"]);

export function herdingCustom(
  setting: WorldSetting,
  species: string,
): HerdingCustom {
  const found =
    customs.find((c) => matchesCharacterScope(c.scope, setting, "*"))?.custom ??
    fallback;
  if (!LARGE.has(species) || setting.culture === "andean") return found;
  return { ...found, youth: found.youth * 0.6, women: found.women * 0.5 };
}

/** "the sheep", "the cattle", "the camels". */
export const herdNoun = (species: string) =>
  /sheep|cattle/.test(species) ? species : `${species.replace(/-/g, " ")}s`;
