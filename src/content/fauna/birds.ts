import type { FaunaProfile } from "./types";
import { study } from "./types";

const always = [-1000000, 10000] as const;

export const birds: readonly FaunaProfile[] = [
  {
    id: "house-sparrow",
    label: "House sparrow study",
    category: "commensal",
    locomotion: "ground-and-flight",
    gait: "hop",
    social: "flock",
    activity: "diurnal",
    groupSize: [3, 9],
    habitats: [
      { tag: "settlement", weight: 1 },
      { tag: "field", weight: 0.8 },
      { tag: "scrub", weight: 0.35 },
    ],
    // Native from Iberia to the Pacific coast; carried to the Americas from
    // 1852, Australia 1863, southern Africa 1890.
    presence: [
      { years: always, bounds: [-20, 5, 140, 70] },
      { years: [1852, 10000], bounds: [-170, -56, -30, 70] },
      { years: [1863, 10000], bounds: [110, -50, 180, -10] },
      { years: [1890, 10000], bounds: [10, -35, 55, 5] },
    ],
    needs: "settled",
    density: 3.2,
    pace: 0.5,
    settlementTolerance: 0.95,
    minimumSettlementDistance: 0,
    alertRadius: 2,
    cohesionRadius: 4,
    separationRadius: 1,
    calmDecisionSeconds: 45,
    urgentDecisionSeconds: 6,
    prey: "small-animal",
    diet: ["seed", "invertebrate"],
    ...study("house-sparrow"),
  },
  {
    id: "rock-dove",
    label: "Rock dove study",
    category: "commensal",
    locomotion: "ground-and-flight",
    gait: "hop",
    social: "flock",
    activity: "diurnal",
    groupSize: [2, 8],
    habitats: [
      { tag: "settlement", weight: 1 },
      { tag: "rock", weight: 0.7 },
      { tag: "field", weight: 0.4 },
    ],
    // Wild on the cliffs of Europe, North Africa and southern Asia; feral
    // town flocks follow dovecotes and colonists elsewhere.
    presence: [
      { years: always, bounds: [-20, 5, 100, 62] },
      { years: [1606, 10000], bounds: [-170, -56, -30, 70] },
      { years: [1788, 10000], bounds: [110, -50, 180, -10] },
    ],
    needs: "settled",
    density: 2,
    pace: 0.5,
    settlementTolerance: 1,
    minimumSettlementDistance: 0,
    alertRadius: 2,
    cohesionRadius: 4,
    separationRadius: 1,
    calmDecisionSeconds: 60,
    urgentDecisionSeconds: 6,
    prey: "small-animal",
    diet: ["seed", "plant"],
    ...study("rock-dove"),
  },
];
