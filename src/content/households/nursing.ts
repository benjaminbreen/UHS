import type { WorldSetting } from "../geography/types";
import { customFor, type HouseholdCustom } from "./scoped";

/**
 * Who fed a baby whose mother could afford not to: a nurse brought into the
 * house, or the baby sent out to a nurse's. `in` lines fill {name} (the nurse);
 * `out` lines have nothing to fill.
 */
export type NursingCustom = HouseholdCustom & {
  mode: "in" | "out";
  minMeans: number;
  /** Share of households above `minMeans` with a baby that use a nurse. */
  odds: number;
  lines: readonly string[];
};

export const nursingCustoms: NursingCustom[] = [
  {
    id: "roman-nutrix",
    label: "The live-in nurse of Roman households",
    priority: 2,
    scope: { years: [-300, 500], cultures: ["european", "north-african-west-asian"], bounds: [-10, 30, 37, 46] },
    evidence: "documented",
    mode: "in",
    minMeans: 0.55,
    odds: 0.6,
    lines: [
      "{name} is the wet nurse who feeds your baby. Nurses are often remembered with affection for life, and some are named on their nurslings' tombstones.",
    ],
    note: "Well-off Roman families used wet nurses (nutrices), often enslaved; inscriptions show nurses honoured by the grown children they had fed.",
    sources: ["https://en.wikipedia.org/wiki/Wet_nurse"],
  },
  {
    id: "egyptian-nursing-contracts",
    label: "Nursing contracts in Greek and Roman Egypt",
    priority: 3,
    scope: { years: [-300, 650], cultures: ["north-african-west-asian"], bounds: [24, 22, 36, 32] },
    evidence: "documented",
    mode: "in",
    minMeans: 0.4,
    odds: 0.45,
    lines: [
      "{name} nurses your baby under a written contract for two years, paid in money, oil and clothing. She has promised not to nurse any other child meanwhile.",
    ],
    note: "Nursing contracts on papyrus typically ran two or three years, paid the nurse in money, oil and clothing, and forbade her to take another nursling or become pregnant.",
    sources: ["https://en.wikipedia.org/wiki/Wet_nurse"],
  },
  {
    id: "milk-kinship",
    label: "Wet nursing and milk kinship under Islamic law",
    priority: 2,
    scope: { years: [630, 1950], cultures: ["north-african-west-asian", "inner-eurasian"] },
    evidence: "documented",
    mode: "in",
    minMeans: 0.55,
    odds: 0.4,
    lines: [
      "{name} nurses your baby. By law that makes them milk kin: none of {name}'s own children may ever marry your child.",
    ],
    note: "Islamic law treats nursing as creating kinship (rada'a): a child nursed by a woman counts as a sibling of her children, and they may not marry.",
    sources: ["https://en.wikipedia.org/wiki/Milk_kinship"],
  },
  {
    id: "balia",
    label: "Sending babies out to nurse in Italy and France",
    priority: 2,
    scope: { years: [1300, 1800], cultures: ["european"], bounds: [-5, 36, 19, 51] },
    evidence: "documented",
    mode: "out",
    minMeans: 0.5,
    odds: 0.6,
    lines: [
      "Your baby is out at nurse with a peasant woman in the country, as families of your standing do. You pay her by the month and visit when you can.",
    ],
    note: "Florentine families sent most babies to a balia in the countryside for up to two years; by the 18th century even many Paris artisans sent their babies out through the city's nurse bureau.",
    sources: ["https://en.wikipedia.org/wiki/Wet_nurse"],
  },
  {
    id: "paris-nurse-bureau",
    label: "The nurse bureau of 18th-century Paris and Lyon",
    priority: 3,
    scope: { years: [1700, 1800], cultures: ["european"], bounds: [-5, 42, 8, 51] },
    evidence: "documented",
    mode: "out",
    minMeans: 0.2,
    odds: 0.7,
    lines: [
      "Like most families in town, you have sent your baby to a wet nurse in the country, arranged through the city's nurse bureau. Many babies sent out never come back.",
    ],
    note: "In 18th-century Paris and Lyon most babies, including those of artisans, were sent to rural nurses through registered bureaux; infant deaths among them were very high.",
    sources: ["https://en.wikipedia.org/wiki/Wet_nurse"],
  },
  {
    id: "european-noble-nurse",
    label: "Live-in nurses in medieval and northern European households",
    priority: 1,
    scope: { years: [500, 1900], cultures: ["european"] },
    evidence: "documented",
    mode: "in",
    minMeans: 0.75,
    odds: 0.45,
    lines: [
      "{name} lives in to nurse your baby, as wealthy families do. She left her own child with relatives to take the work.",
    ],
    note: "Noble and wealthy families across medieval and early modern Europe hired live-in wet nurses, often women who had left their own infants in someone else's care.",
    sources: ["https://en.wikipedia.org/wiki/Wet_nurse"],
  },
  {
    id: "chinese-rumu",
    label: "Wet nurses in wealthy Chinese households",
    priority: 2,
    scope: { years: [-200, 1950], cultures: ["east-asian"], bounds: [97, 18, 123, 45] },
    evidence: "documented",
    mode: "in",
    minMeans: 0.75,
    odds: 0.5,
    lines: [
      "{name} has come from the countryside to nurse your baby, leaving her own child with relatives. The household eats well so that her milk is good.",
    ],
    note: "Elite households hired wet nurses (rumu) from poorer families; household manuals advised on choosing them and on their diet.",
    sources: ["https://en.wikipedia.org/wiki/Wet_nurse"],
  },
  {
    id: "menoto",
    label: "The menoto of Japanese elite households",
    priority: 3,
    scope: { years: [800, 1868], cultures: ["east-asian"], bounds: [128, 30, 146, 46] },
    evidence: "documented",
    mode: "in",
    minMeans: 0.8,
    odds: 0.6,
    lines: [
      "{name} nurses your baby. As its menoto, its nurse and first guardian, she will stay close to the child for life, and her own family will rise with it.",
    ],
    note: "Aristocratic and warrior households gave children a menoto who nursed and raised them; her family often became the child's lifelong retainers.",
    sources: ["https://en.wikipedia.org/wiki/Wet_nurse"],
  },
];

export const nursingFor = (setting?: WorldSetting) => customFor(nursingCustoms, setting);
